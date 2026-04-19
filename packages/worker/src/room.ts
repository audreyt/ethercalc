/**
 * RoomDO — one Durable Object per spreadsheet room.
 *
 * Phase 5 deliverable: snapshot + log + audit + chat + ecell storage, backed
 * by SocialCalc via `@ethercalc/socialcalc-headless`. Exposes an internal
 * HTTP API on `/_do/*` that the Worker's room-level routes dispatch to.
 *
 * Key patterns come from `@ethercalc/shared/storage-keys`:
 *   - `snapshot`               → string (SocialCalc save)
 *   - `meta:updated_at`        → number (Date.now())
 *   - `log:<seq>`              → string (one command batch per entry)
 *   - `audit:<seq>`            → string (never truncated)
 *   - `chat:<seq>`             → string (room chat message)
 *   - `ecell:<user>`           → string (cell coordinate)
 *
 * Sequence counters (`nextLogSeq`, `nextAuditSeq`, `nextChatSeq`) are lazily
 * initialized from `storage.list({prefix})` on first write — cheap because
 * DO storage keeps the SQLite index in memory for warm instances.
 *
 * The in-memory SocialCalc `HeadlessSpreadsheet` is hydrated lazily from the
 * stored snapshot (if any) on first use and cached for the lifetime of the
 * isolate. Mutations that would drift cache vs storage are wrapped in
 * `state.blockConcurrencyWhile` to keep the DO serialized.
 */
import type {
  ClientMessage,
  ExecuteClientMessage,
  ServerMessage,
} from '@ethercalc/shared/messages';
import { encodeMessage, parseClientMessage } from '@ethercalc/shared/messages';
import {
  STORAGE_KEYS,
  auditKey,
  chatKey,
  ecellKey,
  logKey,
} from '@ethercalc/shared/storage-keys';
import {
  HeadlessSpreadsheet,
  createSpreadsheet,
} from '@ethercalc/socialcalc-headless';

import { verifyAuth } from './lib/auth.ts';
import { parseCSV } from './lib/csv-parse.ts';
import { csvToMarkdown } from './lib/md.ts';
import {
  deleteRoomFromD1,
  mirrorRoomToD1,
} from './lib/rooms-index.ts';
import {
  buildChatBroadcast,
  buildEcellBroadcast,
  buildEcellsReply,
  buildExecuteBroadcast,
  buildLogReply,
  buildMyEcellBroadcast,
  buildStopHuddleBroadcast,
  computeSubmitFormTarget,
  isFilteredExecuteCommand,
  isSubmitForm,
} from './lib/ws-dispatch.ts';
import {
  BINARY_CONTENT_TYPES,
  type BinaryFormat,
  csvToBinaryWorkbook,
} from './lib/xlsx-build.ts';
import type { Env } from './env.ts';

/** Shape returned from `GET /_do/log`. */
export interface RoomLogSnapshot {
  readonly log: readonly string[];
  readonly chat: readonly string[];
}

/**
 * Attachment payload stored on each accepted WebSocket. Kept small so the
 * serialize cost across hibernation is negligible.
 */
interface WsAttachment {
  readonly user: string;
  readonly room: string;
  /** Pre-supplied hmac (or '0' for view-only) as provided at handshake. */
  readonly auth: string;
}

/** Content type used for plain-text bodies returned from the DO. */
const PLAIN_TEXT = 'text/plain; charset=utf-8';
const APP_JSON = 'application/json';
const TEXT_CSV = 'text/csv; charset=utf-8';
const TEXT_HTML = 'text/html; charset=utf-8';
const TEXT_MARKDOWN = 'text/x-markdown; charset=utf-8';

function plainResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': PLAIN_TEXT },
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': APP_JSON },
  });
}

function notFound(): Response {
  return plainResponse('', 404);
}

function textResponse(body: string, contentType: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': contentType } });
}

function binaryResponse(bytes: Uint8Array, contentType: string, status = 200): Response {
  // Convert to an ArrayBuffer slice — the DO → worker hop stringifies Response
  // bodies via streaming, and workerd treats Uint8Array as a valid BodyInit.
  return new Response(bytes, { status, headers: { 'Content-Type': contentType } });
}

export class RoomDO implements DurableObject {
  readonly #state: DurableObjectState;
  readonly #env: Env;

  #ss: HeadlessSpreadsheet | null = null;
  #nextLogSeq: number | null = null;
  #nextAuditSeq: number | null = null;
  #nextChatSeq: number | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.#state = state;
    this.#env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    // Every `doFetch` caller now threads the room name through as
    // `?name=…` so the DO can mirror to D1 without re-deriving it from
    // its opaque id. `/_do/ping` already used the same param.
    const roomName = url.searchParams.get('name');

    if (path === '/_do/ping') {
      return jsonResponse({
        id: this.#state.id.toString(),
        name: roomName,
      });
    }
    if (path === '/_do/snapshot') {
      if (request.method === 'GET') return this.#getSnapshot();
      if (request.method === 'PUT') return this.#putSnapshot(request, roomName);
    }
    if (path === '/_do/log' && request.method === 'GET') {
      return this.#getLog();
    }
    if (path === '/_do/commands' && request.method === 'POST') {
      return this.#postCommands(request, roomName);
    }
    if (path === '/_do/all' && request.method === 'DELETE') {
      return this.#deleteAll(roomName);
    }
    if (path === '/_do/exists' && request.method === 'GET') {
      return this.#getExists();
    }
    if (path === '/_do/cells' && request.method === 'GET') {
      return this.#getCells();
    }
    const cellMatch = path.match(/^\/_do\/cells\/(.+)$/);
    if (cellMatch && request.method === 'GET') {
      return this.#getCell(decodeURIComponent(cellMatch[1]!));
    }
    // ─── Phase 8: export routes ────────────────────────────────────────
    if (path === '/_do/html' && request.method === 'GET') {
      return this.#getHtml();
    }
    if (path === '/_do/csv' && request.method === 'GET') {
      return this.#getCsv();
    }
    if (path === '/_do/csv.json' && request.method === 'GET') {
      return this.#getCsvJson();
    }
    if (path === '/_do/md' && request.method === 'GET') {
      return this.#getMd();
    }
    if (path === '/_do/xlsx' && request.method === 'GET') {
      return this.#getBinary('xlsx');
    }
    if (path === '/_do/ods' && request.method === 'GET') {
      return this.#getBinary('ods');
    }
    if (path === '/_do/fods' && request.method === 'GET') {
      return this.#getBinary('fods');
    }
    // ─── Phase 6: cross-DO rename primitives ─────────────────────────
    // `set A\d+:B\d+ empty multi-cascade` in the HTTP command layer
    // moves snapshot/log/audit from <from> into <to> and wipes <from>.
    // `rename` runs on the source DO; `install` is the target-side
    // receiver. Both additive; no existing path shape changes.
    if (path === '/_do/rename' && request.method === 'POST') {
      return this.#postRename(request);
    }
    if (path === '/_do/install' && request.method === 'POST') {
      return this.#postInstall(request);
    }
    // ─── Phase 7: native WebSocket upgrade ───────────────────────────
    if (path === '/_do/ws' && request.method === 'GET') {
      return this.#acceptWebSocket(request);
    }
    return new Response('Not implemented', { status: 501 });
  }

  // ─── Handlers ──────────────────────────────────────────────────────────

  async #getSnapshot(): Promise<Response> {
    const snapshot = await this.#state.storage.get<string>(STORAGE_KEYS.snapshot);
    if (snapshot === undefined || snapshot === null) return notFound();
    return plainResponse(snapshot);
  }

  async #putSnapshot(request: Request, roomName: string | null): Promise<Response> {
    const body = await request.text();
    let updatedAt = 0;
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#state.storage.deleteAll();
      await this.#state.storage.put(STORAGE_KEYS.snapshot, body);
      updatedAt = Date.now();
      await this.#state.storage.put(STORAGE_KEYS.metaUpdatedAt, updatedAt);
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
    });
    await this.#mirrorIndex(roomName, updatedAt);
    return plainResponse('OK', 201);
  }

  async #getLog(): Promise<Response> {
    const [log, chat] = await Promise.all([
      this.#listPrefix(STORAGE_KEYS.logPrefix),
      this.#listPrefix(STORAGE_KEYS.chatPrefix),
    ]);
    return jsonResponse({ log, chat });
  }

  async #postCommands(request: Request, roomName: string | null): Promise<Response> {
    const body = await request.text();
    if (!body) return plainResponse('', 202);
    let updatedAt = 0;
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#appendCommand(body);
      updatedAt = Date.now();
    });
    await this.#mirrorIndex(roomName, updatedAt);
    return plainResponse('', 202);
  }

  async #deleteAll(roomName: string | null): Promise<Response> {
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#state.storage.deleteAll();
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
    });
    await this.#deleteIndex(roomName);
    return plainResponse('OK', 201);
  }

  async #getExists(): Promise<Response> {
    const snapshot = await this.#state.storage.get<string>(STORAGE_KEYS.snapshot);
    return jsonResponse({ exists: snapshot ? 1 : 0 });
  }

  async #getCells(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return jsonResponse({ cells: ss.exportCells() });
  }

  async #getCell(coord: string): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return jsonResponse(ss.exportCell(coord));
  }

  // ─── Export handlers (Phase 8) ────────────────────────────────────────
  //
  // Every export derives from the in-memory `HeadlessSpreadsheet` — no
  // caching beyond what the SocialCalc instance itself does. That keeps
  // each GET deterministic after any mutation (POST /_do/commands).

  async #getHtml(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return textResponse(ss.createSheetHTML(), TEXT_HTML);
  }

  async #getCsv(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return textResponse(ss.exportCSV(), TEXT_CSV);
  }

  async #getCsvJson(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return jsonResponse(parseCSV(ss.exportCSV()));
  }

  async #getMd(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return textResponse(csvToMarkdown(ss.exportCSV()), TEXT_MARKDOWN);
  }

  async #getBinary(format: BinaryFormat): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    const bytes = csvToBinaryWorkbook(ss.exportCSV(), format);
    return binaryResponse(bytes, BINARY_CONTENT_TYPES[format]);
  }

  // ─── Rename primitives (Phase 6) ─────────────────────────────────────
  //
  // Legacy `set A\d+:B\d+ empty multi-cascade` (src/main.ls:425-436)
  // renamed the Redis keys `snapshot-<from>` -> `snapshot-<from>.bak`
  // plus the `log-*` and `audit-*` siblings, then re-ran the command.
  // In the DO world each "room" IS its own DO, so the equivalent is a
  // cross-DO state transfer orchestrated by the source DO.
  //
  // Design:
  //   POST /_do/rename body {to}  -- runs on source, dumps own
  //     snapshot/log/audit, fetches target's POST /_do/install with
  //     those as JSON, then deleteAll's own storage.
  //   POST /_do/install body {snapshot, log, audit}  -- wipes own
  //     storage and installs the payload verbatim.
  //
  // Chat and ecell are NOT carried over (legacy kept those under
  // different Redis prefixes so they stayed with the original room's
  // logical identity).

  async #postRename(request: Request): Promise<Response> {
    const parsed = (await request.json()) as { to?: unknown };
    const to = parsed.to;
    if (typeof to !== 'string' || to.length === 0) {
      return new Response('rename body must be {to: string}', { status: 400 });
    }
    const [snapshot, log, audit] = await Promise.all([
      this.#state.storage.get<string>(STORAGE_KEYS.snapshot),
      this.#listPrefix(STORAGE_KEYS.logPrefix),
      this.#listPrefix(STORAGE_KEYS.auditPrefix),
    ]);
    if (snapshot === undefined || snapshot === null) {
      // No-op: legacy `if snapshot` guard at main.ls:427 -- nothing to rename.
      return new Response(null, { status: 204 });
    }
    const targetStub = this.#env.ROOM.get(this.#env.ROOM.idFromName(to));
    const installRes = await targetStub.fetch('https://do.local/_do/install', {
      method: 'POST',
      body: JSON.stringify({ snapshot, log, audit }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (!installRes.ok) {
      return new Response(`install failed: ${installRes.status}`, { status: 502 });
    }
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#state.storage.deleteAll();
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
    });
    return plainResponse('OK', 201);
  }

  async #postInstall(request: Request): Promise<Response> {
    const parsed = (await request.json()) as {
      snapshot?: unknown;
      log?: unknown;
      audit?: unknown;
    };
    if (typeof parsed.snapshot !== 'string') {
      return new Response('install body.snapshot must be string', { status: 400 });
    }
    const log = Array.isArray(parsed.log) ? (parsed.log as unknown[]) : [];
    const audit = Array.isArray(parsed.audit) ? (parsed.audit as unknown[]) : [];
    if (!log.every((e) => typeof e === 'string')) {
      return new Response('install body.log must be string[]', { status: 400 });
    }
    if (!audit.every((e) => typeof e === 'string')) {
      return new Response('install body.audit must be string[]', { status: 400 });
    }
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#state.storage.deleteAll();
      await this.#state.storage.put(STORAGE_KEYS.snapshot, parsed.snapshot as string);
      await this.#state.storage.put(STORAGE_KEYS.metaUpdatedAt, Date.now());
      for (let i = 0; i < log.length; i++) {
        await this.#state.storage.put(logKey(i), log[i] as string);
      }
      for (let i = 0; i < audit.length; i++) {
        await this.#state.storage.put(auditKey(i), audit[i] as string);
      }
      this.#ss = null;
      this.#nextLogSeq = log.length;
      this.#nextAuditSeq = audit.length;
      this.#nextChatSeq = 0;
    });
    return plainResponse('OK', 201);
  }

  // ─── WebSocket acceptance ──────────────────────────────────────────────

  /**
   * `GET /_do/ws?user=<user>&auth=<hmac>` — upgrade to WebSocket using the
   * hibernation API. We attach `{user, room, auth}` so downstream handlers
   * can gate writes without re-verifying on every frame.
   */
  #acceptWebSocket(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return plainResponse('Expected Upgrade: websocket', 426);
    }
    const url = new URL(request.url);
    const user = url.searchParams.get('user') ?? '';
    const auth = url.searchParams.get('auth') ?? '';
    const room = url.searchParams.get('room') ?? '';
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.#state.acceptWebSocket(server);
    const attachment: WsAttachment = { user, room, auth };
    server.serializeAttachment(attachment);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** Hibernation-api entrypoint — dispatches ClientMessages to handlers. */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    const parsed = parseClientMessage(message);
    if (!parsed) return;
    const attachment =
      (ws.deserializeAttachment() as WsAttachment | null) ??
      { user: '', room: '', auth: '' };
    await this.#dispatch(ws, attachment, parsed);
  }

  /**
   * Hibernation-api close hook. We intentionally do NOT remove the user's
   * `ecell:<user>` entry here — legacy left the last-known cursor in place
   * so a reconnecting client could resume where they left off.
   */
  async webSocketClose(ws: WebSocket): Promise<void> {
    void ws;
  }

  // ─── Per-message handlers ──────────────────────────────────────────────

  async #dispatch(
    ws: WebSocket,
    attachment: WsAttachment,
    msg: ClientMessage,
  ): Promise<void> {
    switch (msg.type) {
      case 'chat':
        await this.#handleChat(ws, msg);
        return;
      case 'ask.ecells':
        await this.#handleAskEcells(ws, msg);
        return;
      case 'my.ecell':
        await this.#handleMyEcell(ws, msg);
        return;
      case 'execute':
        await this.#handleExecute(ws, attachment, msg);
        return;
      case 'ask.log':
        await this.#handleAskLog(ws, msg);
        return;
      case 'ask.recalc':
        await this.#handleAskRecalc(ws, msg);
        return;
      case 'stopHuddle':
        await this.#handleStopHuddle(ws, msg);
        return;
      case 'ecell':
        await this.#handleEcell(ws, msg);
        return;
      default: {
        const _exhaustive: never = msg;
        void _exhaustive;
      }
    }
  }

  async #handleChat(
    ws: WebSocket,
    msg: ClientMessage & { type: 'chat' },
  ): Promise<void> {
    await this.appendChat(msg.msg);
    this.#broadcast(ws, buildChatBroadcast(msg));
  }

  async #handleAskEcells(
    ws: WebSocket,
    msg: ClientMessage & { type: 'ask.ecells' },
  ): Promise<void> {
    const ecells = await this.listEcells();
    this.#sendTo(ws, buildEcellsReply(msg.room, ecells));
  }

  async #handleMyEcell(
    ws: WebSocket,
    msg: ClientMessage & { type: 'my.ecell' },
  ): Promise<void> {
    if (msg.user.length > 0) await this.putEcell(msg.user, msg.ecell);
    this.#broadcast(ws, buildMyEcellBroadcast(msg));
  }

  async #handleExecute(
    ws: WebSocket,
    _attachment: WsAttachment,
    msg: ExecuteClientMessage,
  ): Promise<void> {
    const ok = await verifyAuth(this.#env.ETHERCALC_KEY, msg.room, msg.auth ?? '');
    if (!ok) return;
    if (isFilteredExecuteCommand(msg.cmdstr)) return;

    if (isSubmitForm(msg.cmdstr)) {
      const { siblingRoom, siblingCommands } = computeSubmitFormTarget(
        msg.room,
        msg.cmdstr,
      );
      if (siblingCommands.length > 0) {
        await this.#forwardToSibling(siblingRoom, siblingCommands);
      }
      this.#broadcastAll(buildExecuteBroadcast(msg, true));
      return;
    }

    await this.#state.blockConcurrencyWhile(async () => {
      await this.#appendCommand(msg.cmdstr);
    });
    this.#broadcast(ws, buildExecuteBroadcast(msg, false));
  }

  async #handleAskLog(
    ws: WebSocket,
    msg: ClientMessage & { type: 'ask.log' },
  ): Promise<void> {
    const [log, chat, snapshot] = await Promise.all([
      this.#listPrefix(STORAGE_KEYS.logPrefix),
      this.#listPrefix(STORAGE_KEYS.chatPrefix),
      this.#state.storage.get<string>(STORAGE_KEYS.snapshot),
    ]);
    this.#sendTo(ws, buildLogReply(msg, log, chat, snapshot ?? ''));
  }

  async #handleAskRecalc(
    ws: WebSocket,
    msg: ClientMessage & { type: 'ask.recalc' },
  ): Promise<void> {
    const [log, snapshot] = await Promise.all([
      this.#listPrefix(STORAGE_KEYS.logPrefix),
      this.#state.storage.get<string>(STORAGE_KEYS.snapshot),
    ]);
    this.#sendTo(ws, {
      type: 'recalc',
      room: msg.room,
      log,
      snapshot: snapshot ?? '',
    });
  }

  async #handleStopHuddle(
    ws: WebSocket,
    msg: ClientMessage & { type: 'stopHuddle' },
  ): Promise<void> {
    const ok = await verifyAuth(this.#env.ETHERCALC_KEY, msg.room, msg.auth ?? '');
    if (!ok) return;
    await this.#state.blockConcurrencyWhile(async () => {
      await this.#state.storage.deleteAll();
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
    });
    this.#broadcast(ws, buildStopHuddleBroadcast(msg));
  }

  async #handleEcell(
    ws: WebSocket,
    msg: ClientMessage & { type: 'ecell' },
  ): Promise<void> {
    const ok = await verifyAuth(this.#env.ETHERCALC_KEY, msg.room, msg.auth ?? '');
    if (!ok) return;
    this.#broadcast(ws, buildEcellBroadcast(msg));
  }

  // ─── WS broadcast primitives ───────────────────────────────────────────

  #sendTo(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(encodeMessage(msg));
    } catch {
      // Socket closed underfoot; hibernation will fire webSocketClose.
    }
  }

  /** Send to every peer except `skip`. */
  #broadcast(skip: WebSocket, msg: ServerMessage): void {
    const frame = encodeMessage(msg);
    for (const peer of this.#state.getWebSockets()) {
      if (peer === skip) continue;
      try {
        peer.send(frame);
      } catch {
        // Skip dead peer; the rest still receive.
      }
    }
  }

  /** Send to every peer (including the sender). Used by submitform. */
  #broadcastAll(msg: ServerMessage): void {
    const frame = encodeMessage(msg);
    for (const peer of this.#state.getWebSockets()) {
      try {
        peer.send(frame);
      } catch {
        // Best-effort; individual peer errors are expected.
      }
    }
  }

  /**
   * Dispatch commands to the `<room>_formdata` sibling DO via its own
   * `/_do/commands` endpoint. We can't touch storage directly because the
   * sibling is a different DO. Colocation keeps the hop cheap.
   */
  async #forwardToSibling(siblingRoom: string, commands: string): Promise<void> {
    const id = this.#env.ROOM.idFromName(siblingRoom);
    const stub = this.#env.ROOM.get(id);
    try {
      await stub.fetch('https://do.local/_do/commands', {
        method: 'POST',
        body: commands,
      });
    } catch {
      // Sibling unavailable — legacy also dropped on send failure
      // (src/main.ls:538). No visible error to the user.
    }
  }

  /**
   * Append a batch of commands to log+audit, run through SocialCalc, and
   * write the resulting snapshot + meta timestamp. Caller is responsible
   * for wrapping this in `blockConcurrencyWhile` when called from a
   * handler that needs serialization.
   */
  async #appendCommand(body: string): Promise<void> {
    const ss = await this.#getSpreadsheet();
    await this.#ensureSeqs();
    const logSeq = this.#nextLogSeq!;
    const auditSeq = this.#nextAuditSeq!;
    await this.#state.storage.put(logKey(logSeq), body);
    await this.#state.storage.put(auditKey(auditSeq), body);
    this.#nextLogSeq = logSeq + 1;
    this.#nextAuditSeq = auditSeq + 1;
    ss.executeCommand(body);
    const newSnapshot = ss.createSpreadsheetSave();
    await this.#state.storage.put(STORAGE_KEYS.snapshot, newSnapshot);
    await this.#state.storage.put(STORAGE_KEYS.metaUpdatedAt, Date.now());
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  /**
   * Return the cached HeadlessSpreadsheet, hydrating from the stored
   * snapshot if necessary. Idempotent + safe under concurrent calls because
   * the DO only services one request at a time.
   */
  async #getSpreadsheet(): Promise<HeadlessSpreadsheet> {
    if (this.#ss) return this.#ss;
    const snapshot = await this.#state.storage.get<string>(STORAGE_KEYS.snapshot);
    const log = await this.#listPrefix(STORAGE_KEYS.logPrefix);
    this.#ss = createSpreadsheet(snapshot ? { snapshot, log } : { log });
    return this.#ss;
  }

  /** Ordered list of values stored under `prefix`, sorted by key. */
  async #listPrefix(prefix: string): Promise<string[]> {
    const map = await this.#state.storage.list<string>({ prefix });
    // DO storage guarantees lexicographic key order from list().
    return Array.from(map.values());
  }

  /**
   * Lazily populate the in-memory sequence counters by scanning storage on
   * first write. Stored keys are zero-padded (see `@ethercalc/shared`), so
   * the "next" index is simply the count of existing keys — no parse needed.
   */
  async #ensureSeqs(): Promise<void> {
    if (this.#nextLogSeq === null) {
      const map = await this.#state.storage.list({ prefix: STORAGE_KEYS.logPrefix });
      this.#nextLogSeq = map.size;
    }
    if (this.#nextAuditSeq === null) {
      const map = await this.#state.storage.list({ prefix: STORAGE_KEYS.auditPrefix });
      this.#nextAuditSeq = map.size;
    }
    if (this.#nextChatSeq === null) {
      const map = await this.#state.storage.list({ prefix: STORAGE_KEYS.chatPrefix });
      this.#nextChatSeq = map.size;
    }
  }

  /**
   * Mirror this room's latest `updatedAt` to the D1 `rooms` table
   * (Phase 5.1). No-ops when `env.DB` is unbound (Node unit tests
   * construct the DO without Miniflare) or when the DO wasn't told
   * its own room name (legacy `/_do/*` callers that pre-date the
   * `?name=` convention — new code always threads it).
   */
  async #mirrorIndex(roomName: string | null, updatedAt: number): Promise<void> {
    if (!this.#env.DB || !roomName) return;
    await mirrorRoomToD1(this.#env.DB, roomName, updatedAt);
  }

  /** Symmetric delete for `#mirrorIndex`, used on `DELETE /_do/all`. */
  async #deleteIndex(roomName: string | null): Promise<void> {
    if (!this.#env.DB || !roomName) return;
    await deleteRoomFromD1(this.#env.DB, roomName);
  }

  // ─── Hooks used by future phases (chat/ecell) ──────────────────────────
  // Kept here because WS handlers (Phase 7) will poke these directly; the
  // method shapes are stable now and test coverage locks them in.

  /** Append a chat message. Returns the stored sequence number. */
  async appendChat(message: string): Promise<number> {
    return this.#state.blockConcurrencyWhile(async () => {
      await this.#ensureSeqs();
      const seq = this.#nextChatSeq!;
      await this.#state.storage.put(chatKey(seq), message);
      this.#nextChatSeq = seq + 1;
      return seq;
    });
  }

  /** Upsert an ecell value for a user. */
  async putEcell(user: string, cell: string): Promise<void> {
    await this.#state.storage.put(ecellKey(user), cell);
  }

  /** Snapshot of all ecells as `{user → cell}`. */
  async listEcells(): Promise<Record<string, string>> {
    const map = await this.#state.storage.list<string>({
      prefix: STORAGE_KEYS.ecellPrefix,
    });
    const out: Record<string, string> = {};
    for (const [k, v] of map) {
      out[k.slice(STORAGE_KEYS.ecellPrefix.length)] = v;
    }
    return out;
  }
}
