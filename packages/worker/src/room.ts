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
import type { ServerMessage } from '@ethercalc/shared/messages';
import { encodeMessage, parseClientMessage } from '@ethercalc/shared/messages';
import {
  decodeFrame,
  nativeToSocketIoEvent,
  PacketType,
  socketIoEventToNative,
} from '@ethercalc/socketio-shim';
import {
  auditKey,
  chatKey,
  ecellKey,
  logKey,
  STORAGE_KEYS,
  snapshotChunkKey,
} from '@ethercalc/shared/storage-keys';
import {
  createSpreadsheet,
  HeadlessSpreadsheet,
} from '@ethercalc/socialcalc-headless';
import type { Env } from './env.ts';
import { buildEmailSender } from './handlers/cron.ts';
import { parseSeedPayload } from './handlers/migrate.ts';
import { verifyAuth } from './lib/auth.ts';
import { authorize as authorizeRoom } from './lib/authorize.ts';
import { hydrateCrossSheetRefs } from './lib/cross-sheet.ts';
import { neutralizeCSVDocument } from './lib/csv-encode.ts';
import { parseCSV } from './lib/csv-parse.ts';
import { parseSendemail } from './lib/email.ts';
import { formdataSiblingRoom } from './lib/formdata-sibling.ts';
import { csvToMarkdown } from './lib/md.ts';
import {
  bookmarkStorage,
  isPitrUnavailableError,
  parsePitrRequest,
} from './lib/pitr.ts';
import { encodeRoom } from './lib/room-name.ts';
import {
  deleteRoomFromD1,
  mirrorRoomToD1,
} from './lib/rooms-index.ts';
import {
  isSandstormEnforced,
  sandstormAllowsWsWrite,
  sandstormCanModify,
} from './lib/sandstorm-access.ts';
import {
  appendAuditRows,
  appendChatRows,
  deleteAuditRows,
  deleteChatRows,
  type SeqRow,
} from './lib/seq-store.ts';
import {
  hasSnapshot,
  readSnapshot,
  readSnapshotMeta,
  type SnapshotMeta,
  snapshotEntries,
} from './lib/snapshot-storage.ts';
import { isFilteredExecuteCommand } from './lib/ws-dispatch.ts';
import {
  dispatchWsMessage,
  type WsContext,
  type WsSiblingDO,
  type WsStorage,
} from './lib/ws-handlers.ts';
import {
  upgradeLegacySocketIo,
  upgradeWebSocket,
  type WsAttachment,
} from './lib/ws-upgrade.ts';
import {
  BINARY_CONTENT_TYPES,
  type BinaryFormat,
  sheetViewToBinaryWorkbook,
} from './lib/xlsx-build.ts';

/** Shape returned from `GET /_do/log`. */
export interface RoomLogSnapshot {
  readonly log: readonly string[];
  readonly chat: readonly string[];
}

/** Content type used for plain-text bodies returned from the DO. */
const PLAIN_TEXT = 'text/plain; charset=utf-8';
const APP_JSON = 'application/json';
const TEXT_CSV = 'text/csv; charset=utf-8';
const TEXT_HTML = 'text/html; charset=utf-8';
const TEXT_MARKDOWN = 'text/x-markdown; charset=utf-8';

/**
 * Ring-buffer length for the command log. The stored snapshot is
 * authoritative on hydrate (see `#getSpreadsheet`), so `log:` is now a
 * pure client-catch-up buffer: `ask.log` returns the recent tail alongside
 * the snapshot, and any client that has fallen further behind than this
 * window resets to the snapshot instead of replaying. `#appendCommand`
 * deletes `log:<seq - LOG_RING>` as it writes `log:<seq>`, so the live
 * log never holds more than `LOG_RING` entries. `audit:` is NEVER trimmed
 * here (it is the append-only record).
 */
const LOG_RING = 1024;

/**
 * Cap on distinct `ecell:<user>` keys retained per room. ecells are keyed
 * by an arbitrary client-supplied username, so without a bound an attacker
 * could blow per-room storage by cycling usernames. We evict the
 * least-recently-written entry once the cap is exceeded (`#trackEcell`).
 */
const ECELL_CAP = 256;

/**
 * Maximum concurrent WebSocket connections accepted per room. Past this we
 * reject the upgrade — a coarse DoS backstop complementing the CF platform
 * layer (AGENTS.md §13 Q7 keeps real rate limiting at the edge).
 */
const MAX_CONN = 128;

/**
 * Maximum accepted size (in UTF-16 code units) of a single WS frame.
 * Generous enough for a large collaborative paste (a `loadclipboard` /
 * `execute` frame carries the whole clipboard save) while still capping a
 * single client from forcing a multi-MB `JSON.parse` + storage write.
 * Pastes larger than this go through the HTTP write path, which has its own
 * 25 MiB cap (`MAX_WRITE_BYTES` in `src/index.ts`).
 */
const MAX_FRAME = 1024 * 1024;

/**
 * Number of `chat:` entries the alarm handler keeps in DO storage when it
 * trims. Chat is mirrored to D1 (`chat_log`) at append time (§13 Q9), so the
 * dropped oldest entries stay durable there — the DO copy only needs to
 * cover live catch-up (`ask.log` returns this recent tail).
 */
const CHAT_KEEP = 500;

/**
 * Number of `audit:` entries the alarm keeps in DO storage when it trims.
 * The full audit record is mirrored to D1 (`audit_log`) at command time, so
 * the DO copy is only a recent tail. `audit:` is no longer "never truncated"
 * in the DO — the durable, queryable record lives in D1.
 */
const AUDIT_KEEP = 1024;

/**
 * Cadence (ms) at which the housekeeping alarm re-fires while a room stays
 * active. One hour keeps chat-trim/TTL checks cheap without a tight loop.
 */
const ALARM_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Give the accepted restore response time to cross the DO boundary before
 * aborting the instance that produced it. The exact delay is not semantic.
 */
// Stryker disable next-line all : any short positive delay has the same contract
const PITR_ABORT_DELAY_MS = 100;

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
  // workerd accepts a `Uint8Array` as a `BodyInit` at runtime; the cast
  // satisfies the stricter `Uint8Array<ArrayBufferLike>` lib typing that
  // doesn't structurally match `BodyInit` (the DO → worker hop streams it).
  return new Response(bytes as unknown as BodyInit, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

/**
 * Fold a base snapshot + since-base command log into a single
 * authoritative SocialCalc save. Used on ingest by `#postSeed` and
 * `#postInstall` so the stored snapshot already incorporates every log
 * command (the hydrate path no longer replays the log over a present
 * snapshot — see `#getSpreadsheet`). `createSpreadsheet({snapshot, log})`
 * applies each log line exactly once on top of the base, then we
 * serialise the result.
 */
function foldSnapshot(snapshot: string, log: readonly string[]): string {
  const ss = createSpreadsheet(
    snapshot ? { snapshot, log } : { log },
  );
  return ss.createSpreadsheetSave();
}

/**
 * Parse the legacy `--expire` / `ETHERCALC_EXPIRE` value (a TTL in
 * SECONDS, matching the old Redis `EXPIRE` semantics) into milliseconds.
 * Returns `null` when unset, non-numeric, or non-positive — in those
 * cases the alarm handler skips TTL expiry entirely (rooms live forever,
 * the production default).
 */
function parseExpireMs(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds * 1000;
}

export class RoomDO implements DurableObject {
  readonly #state: DurableObjectState;
  readonly #env: Env;
  readonly #instanceNonce = crypto.randomUUID();

  #ss: HeadlessSpreadsheet | null = null;
  #nextLogSeq: number | null = null;
  #nextAuditSeq: number | null = null;
  #nextChatSeq: number | null = null;
  /**
   * In-memory LRU order of `ecell:<user>` keys (least-recently-written
   * first). Lazily seeded from storage on first ecell write so the cap is
   * enforced even after an isolate restart. Bounds distinct ecell keys to
   * `ECELL_CAP` so a client cycling arbitrary usernames can't grow storage
   * without limit.
   */
  #ecellOrder: string[] | null = null;
  /** Whether the housekeeping alarm is known to be armed (cheap dedupe). */
  #alarmArmed = false;
  /**
   * Cached room name — set from `?name=…` on each request and retained
   * for cross-sheet formula resolution (so sibling DO lookups can skip
   * self-references without forcing every caller to thread the name
   * through `#getSpreadsheet`).
   */
  #ownName: string | undefined;
  /**
   * Memoized `{meta:access, meta:acl}` pair backing the request gate.
   * Invalidated by `#resetVolatile` (every wipe/replace site) so a
   * warm room costs one batched storage read per isolate, not one per
   * request.
   */
  #accessMeta: { access: unknown; acl: unknown } | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.#state = state;
    this.#env = env;
    // socket.io v0.9 heartbeat is a pure echo of `2::`. Auto-response lets
    // hibernated legacy sockets answer pings without waking the isolate
    // (and without a JS timer that would pin the DO awake).
    /* istanbul ignore next -- @preserve: WebSocketRequestResponsePair is a workerd global */
    if (typeof WebSocketRequestResponsePair === 'function') {
      this.#state.setWebSocketAutoResponse(
        new WebSocketRequestResponsePair('2::', '2::'),
      );
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    // Every `doFetch` caller now threads the room name through as
    // `?name=…` so the DO can mirror to D1 without re-deriving it from
    // its opaque id. `/_do/ping` already used the same param.
    const roomName = url.searchParams.get('name');
    if (roomName) this.#ownName = roomName;
    // Worker-internal capability and operator paths bypass the generic ACL
    // gate. None serve sheet content: `/_do/access` returns only a
    // DO-owned read/write verdict so the Worker can select the safe viewer
    // surface; the PITR paths remain deployment-operator controlled.
    const isGateExemptPath =
      path === '/_do/access' ||
      path === '/_do/ping' ||
      path === '/_do/pitr-restore' ||
      path === '/_do/pitr-touch';
    if (!isGateExemptPath) {
      const purpose = request.method === 'GET' ? 'read' : 'write';
      if (!(await this.#isAuthorized(request, purpose))) {
        return plainResponse('Forbidden', 403);
      }
    }

    if (path === '/_do/access' && request.method === 'GET') {
      return this.#getAccessVerdict(request);
    }
    if (path === '/_do/ping') {
      return jsonResponse({
        id: this.#state.id.toString(),
        name: roomName,
        nonce: this.#instanceNonce,
      });
    }
    if (path === '/_do/pitr-restore' && request.method === 'POST') {
      return this.#postPitrRestore(request);
    }
    if (path === '/_do/pitr-touch' && request.method === 'POST') {
      return this.#postPitrTouch(roomName);
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
      return this.#deleteAll(roomName, request.headers.get('X-EC-Uid'));
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
    // ─── Phase 8.1: sheet-data for multi-sheet export ────────────────
    // Returns the structural SheetData (cells + valueformats + cellformats
    // + attribs) as JSON, for the top-level `/_/=:room/*` route to walk
    // cross-DO and build a multi-sheet workbook with formula fidelity.
    if (path === '/_do/sheet-data' && request.method === 'GET') {
      return this.#getSheetData();
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
    if (path === '/_do/clone' && request.method === 'POST') {
      return this.#postClone(request);
    }
    // ─── Phase 11b: full-fidelity migration seed ─────────────────────
    // `POST /_do/seed` is the migration entry point — it replaces the
    // entire room (snapshot + log + audit + chat + ecell + meta
    // timestamp) in one shot, then mirrors the D1 `rooms` row. The
    // worker-level `PUT /_migrate/seed/:room` route authenticates the
    // caller before dispatching here; direct DO access from inside the
    // namespace (tests, future tooling) can bypass that.
    if (path === '/_do/seed' && request.method === 'POST') {
      return this.#postSeed(request, roomName);
    }
    // ─── Phase 11b: client-side chunked snapshot upload ──────────────
    // Companion to `/_do/seed` for rooms whose raw SocialCalc save
    // exceeds CF's ~25 MB per-request body limit. The migrator first
    // POSTs `/_do/seed` with an empty `snapshot` (which deleteAll's
    // the DO and installs log/audit/chat/ecell), then streams N chunk
    // bodies here with `seq=<i>&chunks=<N>`. The final chunk flips
    // `snapshot:meta` over to the new layout; readers see either the
    // pre-migration state or the freshly-assembled save, never a
    // mix. See the `#postSnapshotChunk` doc for the full contract.
    if (path === '/_do/snapshot-chunk' && request.method === 'POST') {
      return this.#postSnapshotChunk(request, roomName, url.searchParams);
    }
    // ─── Phase A: atomic private-room initialization ─────────────────
    if (path === '/_do/init-private' && request.method === 'POST') {
      return this.#postInitPrivate(request);
    }
    // ─── Phase 7: native WebSocket upgrade ───────────────────────────
    if (path === '/_do/ws' && request.method === 'GET') {
      return this.#acceptWebSocket(request);
    }
    // Legacy socket.io v0.9 WS — hibernation API with `legacy: true`
    // attachment so webSocketMessage/send use socket.io framing. Worker
    // routes `/socket.io/1/websocket/:sid` here on a sid-keyed RoomDO.
    if (path === '/_do/legacy-ws' && request.method === 'GET') {
      return this.#acceptLegacyWebSocket(request);
    }
    // ─── Phase 9: cron fire-trigger hook ───────────────────────────────
    // `POST /_do/fire-trigger?cell=<coord>` — called from the
    // `scheduled()` handler (and from the backwards-compat
    // /_timetrigger HTTP endpoint) for each due row. Reads the
    // referenced cell's text, parses it as `sendemail <to> <subject>
    // <body>`, dispatches through the injected EmailSender, and
    // broadcasts the legacy `confirmemailsent` WS event to this
    // room's peers.
    if (path === '/_do/fire-trigger' && request.method === 'POST') {
      return this.#fireTrigger(url.searchParams.get('cell') ?? '');
    }
    return new Response('Not implemented', { status: 501 });
  }

  // ─── Handlers ──────────────────────────────────────────────────────────

  async #isAuthorized(
    request: Request,
    purpose: 'read' | 'write',
  ): Promise<boolean> {
    const { access, acl } = await this.#getAccessMeta();
    const uid = request.headers.get('X-EC-Uid');
    return authorizeRoom(purpose, uid === null ? null : { uid }, access, acl);
  }

  async #getAccessVerdict(request: Request): Promise<Response> {
    const { access, acl } = await this.#getAccessMeta();
    const uid = request.headers.get('X-EC-Uid');
    const principal = uid === null ? null : { uid };
    return jsonResponse({
      isPrivate: access === 'private',
      canRead: authorizeRoom('read', principal, access, acl),
      canWrite: authorizeRoom('write', principal, access, acl),
    });
  }

  /**
   * Memoized access-plane read. Both keys land in one batched get; the
   * memo lives until `#resetVolatile` (wipes, seeds, init-private).
   */
  async #getAccessMeta(): Promise<{ access: unknown; acl: unknown }> {
    if (this.#accessMeta) return this.#accessMeta;
    const stored = await this.#state.storage.get<unknown>([
      STORAGE_KEYS.metaAccess,
      STORAGE_KEYS.metaAcl,
    ]);
    const meta = {
      access: stored.get(STORAGE_KEYS.metaAccess),
      acl: stored.get(STORAGE_KEYS.metaAcl),
    };
    this.#accessMeta = meta;
    return meta;
  }

  async #readAccessEntries(): Promise<Record<string, unknown>> {
    const keys = [
      STORAGE_KEYS.metaAccess,
      STORAGE_KEYS.metaAcl,
      STORAGE_KEYS.metaGroup,
    ];
    const stored = await this.#state.storage.get<unknown>(keys);
    const entries: Record<string, unknown> = {};
    for (const key of keys) {
      if (stored.has(key)) entries[key] = stored.get(key);
    }
    return entries;
  }
  /**
   * Resolve or schedule a SQLite DO PITR bookmark. A successful restore is
   * applied only after this instance restarts, so return the target + undo
   * bookmark first and abort on a short timer.
   */
  async #postPitrRestore(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return plainResponse('body must be valid JSON', 400);
    }
    const parsed = parsePitrRequest(body);
    if (!parsed.ok) return plainResponse(parsed.error, 400);

    const storage = bookmarkStorage(this.#state.storage);
    if (!storage) {
      return plainResponse('PITR is unavailable on this deployment', 501);
    }

    let bookmark: string;
    try {
      if ('at' in parsed.value) {
        bookmark = await storage.getBookmarkForTime(parsed.value.at);
      } else {
        bookmark = parsed.value.bookmark;
        if (parsed.value.dryRun) await storage.getBookmarkForTime(Date.now());
      }
    } catch (error) {
      if (isPitrUnavailableError(error)) {
        return plainResponse('PITR is unavailable on this deployment', 501);
      }
      return plainResponse('PITR target is unavailable', 400);
    }

    if (parsed.value.dryRun) {
      return jsonResponse({ dryRun: true, bookmark });
    }

    let undoBookmark: string;
    try {
      undoBookmark = await storage.onNextSessionRestoreBookmark(bookmark);
    } catch (error) {
      if (isPitrUnavailableError(error)) {
        return plainResponse('PITR is unavailable on this deployment', 501);
      }
      return plainResponse('PITR target is unavailable', 400);
    }

    const { promise, resolve } = Promise.withResolvers<void>();
    this.#state.waitUntil(promise);
    setTimeout(() => {
      resolve();
      this.#state.abort('PITR restore scheduled');
    }, PITR_ABORT_DELAY_MS);
    return jsonResponse({
      bookmark,
      undoBookmark,
      nonce: this.#instanceNonce,
    });
  }

  /**
   * Rebuild metadata that lives outside the restored timeline. This endpoint
   * is called only after the public route observes a replacement instance.
   */
  async #postPitrTouch(roomName: string | null): Promise<Response> {
    if (!(await hasSnapshot(this.#state.storage))) {
      await this.#state.storage.deleteAlarm();
      this.#alarmArmed = false;
      await this.#deleteIndex(roomName);
      return jsonResponse({ exists: false });
    }
    const updatedAt = Date.now();
    await this.#state.storage.put(STORAGE_KEYS.metaUpdatedAt, updatedAt);
    await this.#mirrorIndex(roomName, updatedAt);
    await this.#armAlarm();
    return jsonResponse({ exists: true, updatedAt });
  }

  async #getSnapshot(): Promise<Response> {
    // Fast path: single-key. Small snapshots stay materialized (they
    // fit under CF's 96 MB DO-response body ceiling with plenty of
    // headroom).
    const single = await this.#state.storage.get<string>(STORAGE_KEYS.snapshot);
    if (typeof single === 'string') return plainResponse(single);
    const meta = await this.#state.storage.get<SnapshotMeta>(
      STORAGE_KEYS.snapshotMeta,
    );
    if (meta === undefined || meta === null) return notFound();
    // Chunked path: stream the reassembled save. Materializing a 148 MB
    // string into a Response body hits workerd's DO-response-size limit
    // (empirically ~96 MB on the paid plan); a streamed body bypasses
    // that because the response is transferred frame-by-frame.
    const storage = this.#state.storage;
    const encoder = new TextEncoder();
    const total = meta.chunks;
    let i = 0;
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (i >= total) {
          controller.close();
          return;
        }
        const part = await storage.get<string>(snapshotChunkKey(i));
        if (typeof part !== 'string') {
          controller.error(new Error(`snapshot chunk ${i} missing`));
          return;
        }
        controller.enqueue(encoder.encode(part));
        i += 1;
      },
    });
    return new Response(stream, {
      status: 200,
      headers: { 'Content-Type': PLAIN_TEXT },
    });
  }

  async #putSnapshot(request: Request, roomName: string | null): Promise<Response> {
    const body = await request.text();
    let updatedAt = 0;
    await this.#state.blockConcurrencyWhile(async () => {
      const accessEntries = await this.#readAccessEntries();
      await this.#state.storage.deleteAll();
      updatedAt = Date.now();
      // One batched put — chunked or single, always lands atomically.
      await this.#state.storage.put({
        ...accessEntries,
        ...snapshotEntries(body),
        [STORAGE_KEYS.metaUpdatedAt]: updatedAt,
      });
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
      this.#resetVolatile();
    });
    await this.#mirrorIndex(roomName, updatedAt);
    // Arm the housekeeping alarm so a room created/replaced via PUT and
    // never subsequently edited still gets TTL expiry. `#putSnapshot`
    // deleteAll's (which clears any pending alarm) and `#resetVolatile`s,
    // so we must re-arm here — the command/chat/ecell write paths arm too.
    await this.#armAlarm();
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
    await this.#applyCommandAndMirror(roomName, body);
    return plainResponse('', 202);
  }

  /**
   * Apply a command batch + mirror to D1. Shared between the HTTP path
   * (`POST /_do/commands`) and the WS path (`execute` frame). Centralizing
   * this ensures both paths update the `rooms` index; without mirroring on
   * the WS path, `/_rooms` and `/_roomtimes` go stale whenever a browser
   * client edits a fresh room (found during 2026-04-20 browser smoke).
   */
  async #applyCommandAndMirror(roomName: string | null, cmdstr: string): Promise<void> {
    let auditSeq = 0;
    let updatedAt = 0;
    await this.#state.blockConcurrencyWhile(async () => {
      const applied = await this.#appendCommand(cmdstr);
      auditSeq = applied.auditSeq;
      updatedAt = applied.ts;
    });
    await this.#mirrorIndex(roomName, updatedAt);
    // Offload the audit entry to D1 (the durable record) so the alarm's DO
    // audit-trim doesn't lose it. Best-effort, outside the lock.
    await this.#mirrorAudit(roomName, [{ seq: auditSeq, ts: updatedAt, body: cmdstr }]);
  }

  async #deleteAll(
    roomName: string | null,
    uid: string | null,
  ): Promise<Response> {
    await this.#deleteAllAndUnindex(roomName, true, uid);
    return plainResponse('OK', 201);
  }

  /**
   * Wipe the entire room + delete its D1 index row. Shared between the
   * HTTP path (`DELETE /_do/all`) and the WS path (`stopHuddle` frame).
   * Centralizing this ensures both paths drop the D1 row; without it,
   * `/_rooms` kept listing rooms that had been stopHuddle'd through the
   * WS (discovered during 2026-04-20 browser smoke).
   *
   * `preserveAccess` keeps the private access trio as a tombstone so a
   * deleted private room's name cannot be squatted; the TTL alarm
   * passes false to reclaim the name entirely. `uid` is forwarded to
   * the formdata sibling so a private sibling accepts the cascade.
   */
  async #deleteAllAndUnindex(
    roomName: string | null,
    preserveAccess: boolean,
    uid: string | null,
  ): Promise<void> {
    await this.#state.blockConcurrencyWhile(async () => {
      const accessEntries = preserveAccess
        ? await this.#readAccessEntries()
        : {};
      await this.#state.storage.deleteAll();
      if (Object.keys(accessEntries).length > 0) {
        await this.#state.storage.put(accessEntries);
      }
      this.#ss = null;
      this.#nextLogSeq = 0;
      this.#nextAuditSeq = 0;
      this.#nextChatSeq = 0;
      this.#resetVolatile();
    });
    await this.#deleteIndex(roomName);
    await this.#deleteAuditChatFromD1(roomName);
    await this.#deleteFormdataSibling(roomName, uid);
  }

  /**
   * Best-effort wipe of the submitform sibling `<room>_formdata` DO when
   * the main room is deleted. Skips when `roomName` is already a form-data
   * sibling or missing (issue #442).
   */
  async #deleteFormdataSibling(
    roomName: string | null,
    uid: string | null,
  ): Promise<void> {
    if (!roomName) return;
    const sibling = formdataSiblingRoom(roomName);
    if (!sibling) return;
    try {
      const id = this.#env.ROOM.idFromName(encodeRoom(sibling));
      const stub = this.#env.ROOM.get(id);
      await stub.fetch(
        `https://do.local/_do/all?name=${encodeURIComponent(sibling)}`,
        {
          method: 'DELETE',
          ...(uid === null ? {} : { headers: { 'X-EC-Uid': uid } }),
        },
      );
    } catch {
      // Sibling may not exist; legacy delete was silent on orphans too.
    }
  }

  async #getExists(): Promise<Response> {
    return jsonResponse({
      exists: (await hasSnapshot(this.#state.storage)) ? 1 : 0,
    });
  }

  async #getCells(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    // Legacy (src/sc.ls:361): `JSON.stringify(window.ss.sheet.cells)`.
    // Unwrapped — not `{cells: ...}`. External clients parse the map
    // directly as `response.A1.datavalue`, etc.
    return jsonResponse(ss.exportCells());
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
    // The `.csv` download is opened in desktop spreadsheet apps, so defang
    // formula/DDE injection (`=`, `+`, `-`, `@`) before emitting. csv.json
    // stays faithful — it's consumed as JSON, not evaluated as a formula.
    return textResponse(neutralizeCSVDocument(ss.exportCSV()), TEXT_CSV);
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
    // Walk the raw SocialCalc sheet rather than going through CSV — that
    // preserves formulas, number formats, merges, and comments. See
    // `sheetViewToWorksheet` for the graceful-degrade-to-value rules.
    const bytes = sheetViewToBinaryWorkbook(ss.exportSheetData(), format);
    return binaryResponse(bytes, BINARY_CONTENT_TYPES[format]);
  }

  async #getSheetData(): Promise<Response> {
    const ss = await this.#getSpreadsheet();
    return jsonResponse(ss.exportSheetData());
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
    if (
      (await this.#state.storage.get<unknown>(STORAGE_KEYS.metaAccess)) ===
      'private'
    ) {
      return new Response('Private room rename is not supported', {
        status: 409,
      });
    }
    const [snapshot, log, audit] = await Promise.all([
      readSnapshot(this.#state.storage),
      this.#listPrefix(STORAGE_KEYS.logPrefix),
      this.#listPrefix(STORAGE_KEYS.auditPrefix),
    ]);
    if (snapshot === null) {
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
      this.#resetVolatile();
    });
    return plainResponse('OK', 201);
  }

  /**
   * Snapshot-only DO-to-DO copy for `GET /:template/form` (legacy
   * main.ls:287-293). Leaves the source room intact.
   */
  async #postClone(request: Request): Promise<Response> {
    const parsed = (await request.json()) as { to?: unknown };
    const to = parsed.to;
    if (typeof to !== 'string' || to.length === 0) {
      return new Response('clone body must be {to: string}', { status: 400 });
    }
    // A clone copies this room's snapshot into a PUBLIC target — on a
    // private source that would declassify content (a writer-only
    // member could exfiltrate a sheet they cannot read). Same Phase A
    // stopgap as rename: refuse outright.
    if (
      (await this.#state.storage.get<unknown>(STORAGE_KEYS.metaAccess)) ===
      'private'
    ) {
      return new Response('Private room clone is not supported', {
        status: 409,
      });
    }
    const snapshot = await readSnapshot(this.#state.storage);
    const targetId = this.#env.ROOM.idFromName(encodeRoom(to));
    const targetStub = this.#env.ROOM.get(targetId);
    const putRes = await targetStub.fetch(
      `https://do.local/_do/snapshot?name=${encodeURIComponent(to)}`,
      { method: 'PUT', body: snapshot ?? '' },
    );
    if (!putRes.ok) {
      return new Response(`clone failed: ${putRes.status}`, { status: 502 });
    }
    return plainResponse('OK', 201);
  }

  /**
   * Phase 11b — full-fidelity room seed. Accepts the complete payload
   * derived from a legacy Redis dump (see `@ethercalc/migrate`) and
   * installs it verbatim, replacing any existing state in this DO.
   *
   * Differences from `#postInstall` (rename path):
   *   - carries chat + ecell + explicit updatedAt
   *   - mirrors the D1 `rooms` row via `?name=<room>`
   *   - snapshot field is optional; a log-only room (legacy rooms with
   *     commands recorded but no snapshot yet folded) seeds with an
   *     empty snapshot and no `snapshot` storage key.
   *
   * Idempotent — re-running against the same room overwrites. The
   * migrator calls this exactly once per room per run.
   */
  async #postSeed(request: Request, roomName: string | null): Promise<Response> {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return new Response('seed body must be valid JSON', { status: 400 });
    }
    const parsed = parseSeedPayload(raw, () => Date.now());
    if (!parsed.ok) {
      return new Response(parsed.error, { status: 400 });
    }
    const payload = parsed.value;
    // Fold base+log into one authoritative snapshot on ingest. Since
    // `#getSpreadsheet` no longer replays the log over a present
    // snapshot, a seeded room that carried a base snapshot + since-base
    // log would otherwise read back as just the base (log silently
    // dropped) — or, under the old double-apply hydrate, with every log
    // command applied twice. Folding here makes the stored snapshot the
    // single source of truth.
    //
    // Two shapes survive folding:
    //   - base snapshot present (with or without log) → fold to a save.
    //   - log-only room (no base snapshot) → fold the log onto an empty
    //     sheet, producing a real snapshot. This collapses the legacy
    //     "commands but never folded" rooms into a normal snapshot room.
    //   - neither → empty room; keep the "no snapshot" shape.
    const hasState = payload.snapshot.length > 0 || payload.log.length > 0;
    const foldedSnapshot = hasState
      ? foldSnapshot(payload.snapshot, payload.log as string[])
      : '';
    const logTail = (payload.log as string[]).slice(-LOG_RING);
    await this.#state.blockConcurrencyWhile(async () => {
      const accessEntries = await this.#readAccessEntries();
      await this.#state.storage.deleteAll();
      // One batched `storage.put(entries)` call instead of N
      // sequential awaits. Each individual `put` is a subrequest
      // against the DO's SQLite, billed against the request's
      // 10-ms-CPU budget on the Workers free tier (and a seed for a
      // room with a 26 KB snapshot + a handful of log entries can hit
      // that limit). A single entries-object put batches the whole
      // seed into one transactional write, dropping CPU below the
      // ceiling. DO storage supports up to 128 keys per call — well
      // above what a real dump row ever carries.
      const entries: Record<string, unknown> = {
        ...accessEntries,
        [STORAGE_KEYS.metaUpdatedAt]: payload.updatedAt,
      };
      // Chunk the snapshot when it exceeds the DO-storage 128 KiB
      // per-value ceiling. `snapshotEntries` returns either `{snapshot:
      // …}` (fast path) or `{snapshot:meta:{chunks}, snapshot:chunk:<i>:
      // …}` (>100 KiB, split). Skipped entirely for empty snapshots so
      // truly empty rooms keep the "no snapshot" shape.
      if (foldedSnapshot.length > 0) {
        Object.assign(entries, snapshotEntries(foldedSnapshot));
      }
      // Keep only the bounded recent log tail for client catch-up — the
      // folded snapshot already incorporates the full log.
      for (let i = 0; i < logTail.length; i++) {
        entries[logKey(i)] = logTail[i] as string;
      }
      for (let i = 0; i < payload.audit.length; i++) {
        entries[auditKey(i)] = payload.audit[i] as string;
      }
      for (let i = 0; i < payload.chat.length; i++) {
        entries[chatKey(i)] = payload.chat[i] as string;
      }
      for (const [user, cell] of Object.entries(payload.ecell)) {
        entries[ecellKey(user)] = cell;
      }
      await this.#state.storage.put(entries);
      this.#ss = null;
      this.#nextLogSeq = logTail.length;
      this.#nextAuditSeq = payload.audit.length;
      this.#nextChatSeq = payload.chat.length;
      this.#resetVolatile();
    });
    await this.#armAlarm();
    // The D1 mirror is a cross-DO write that happens on every seed. Two
    // opt-outs, from the caller's perspective:
    //   - `payload.skipIndex=true` — the caller plans to batch index
    //     writes via `PUT /_migrate/bulk-index`. Don't touch D1 at all.
    //   - default (skipIndex=false) — fire-and-forget via `waitUntil`
    //     so this 201 returns as soon as DO storage is durable; the D1
    //     write drains on the DO's background execution context.
    // At 1.8M rooms the second option alone cuts ~50 ms off the critical
    // path of each PUT, and the batched path cuts the D1 chokepoint by
    // 100× (see AGENTS.md §14 2026-04-21).
    if (!payload.skipIndex) {
      this.#state.waitUntil(this.#mirrorIndex(roomName, payload.updatedAt));
    }
    // Mirror the seeded audit + chat into the durable D1 stores so a migrated
    // room's history survives the DO-tail trims. Done regardless of skipIndex
    // (which only governs the rooms index) — fire-and-forget. Skipped when
    // empty (the common dir-migration case keeps log/chat in-memory only).
    if (payload.audit.length > 0) {
      this.#state.waitUntil(
        this.#mirrorAudit(
          roomName,
          payload.audit.map((body, i) => ({
            seq: i,
            ts: payload.updatedAt,
            body: body as string,
          })),
        ),
      );
    }
    if (payload.chat.length > 0) {
      this.#state.waitUntil(
        this.#mirrorChat(
          roomName,
          payload.chat.map((body, i) => ({
            seq: i,
            ts: payload.updatedAt,
            body: body as string,
          })),
        ),
      );
    }
    return plainResponse('OK', 201);
  }

  /**
   * Phase 11b — client-side chunked snapshot upload.
   *
   * Contract (enforced by `routes/migrate.ts` before we ever see the
   * request, re-checked here for defense-in-depth and because unit
   * tests construct the DO directly):
   *   - `seq` and `chunks` are integers, `0 ≤ seq < chunks`, `chunks ≥ 1`.
   *   - Body is the verbatim chunk payload (plain UTF-8 text).
   *
   * Flow when called N times in order:
   *   1. seq=0..N-2 → land `snapshot:chunk:<padSeq(seq)>`. Meta is NOT
   *      written yet; readers still see whatever snapshot (if any) was
   *      there before the upload started.
   *   2. seq=N-1 → batched put of the final chunk + `snapshot:meta =
   *      {chunks: N}` + `meta:updated_at`. Atomically flips the DO's
   *      "current snapshot" over to the new chunked layout. Then
   *      cleans up any legacy single-key `snapshot` from a prior seed
   *      and any higher-seq chunks from a prior larger chunked save.
   *      Finally mirrors the D1 `rooms` row so cross-room indexes pick
   *      up the new `updated_at`.
   *
   * Re-migrating the same room: safe. The stale-cleanup step drops
   * both layouts of any leftover snapshot state. We don't reset
   * `#nextLogSeq` / `#nextAuditSeq` / `#nextChatSeq` — those counters
   * track DO-local append sequence and are unrelated to the snapshot
   * body itself.
   */
  async #postSnapshotChunk(
    request: Request,
    roomName: string | null,
    searchParams: URLSearchParams,
  ): Promise<Response> {
    const seqRaw = searchParams.get('seq');
    const chunksRaw = searchParams.get('chunks');
    // `URLSearchParams.get` returns `null` for missing params;
    // `Number(null) === 0` would otherwise slip through the range check.
    const seq = seqRaw === null ? NaN : Number(seqRaw);
    const chunks = chunksRaw === null ? NaN : Number(chunksRaw);
    if (
      !Number.isInteger(seq) ||
      seq < 0 ||
      !Number.isInteger(chunks) ||
      chunks < 1 ||
      seq >= chunks
    ) {
      return new Response('seq/chunks must be integers with 0 ≤ seq < chunks', {
        status: 400,
      });
    }
    const body = await request.text();
    const isFinal = seq === chunks - 1;
    let updatedAt = 0;
    await this.#state.blockConcurrencyWhile(async () => {
      if (!isFinal) {
        await this.#state.storage.put(snapshotChunkKey(seq), body);
        return;
      }
      // Read the prior meta BEFORE we overwrite it, so we know which
      // higher-seq chunks (if any) are stale from a larger previous
      // chunked save. A prior single-key `snapshot` is always cleaned
      // up regardless — either it's leftover from a pre-chunked seed
      // or it's absent, both fine.
      const priorMeta = await readSnapshotMeta(this.#state.storage);
      updatedAt = Date.now();
      await this.#state.storage.put({
        [snapshotChunkKey(seq)]: body,
        [STORAGE_KEYS.snapshotMeta]: { chunks } satisfies SnapshotMeta,
        [STORAGE_KEYS.metaUpdatedAt]: updatedAt,
      });
      const stale: string[] = [STORAGE_KEYS.snapshot];
      if (priorMeta !== null) {
        for (let i = chunks; i < priorMeta.chunks; i++) {
          stale.push(snapshotChunkKey(i));
        }
      }
      await this.#state.storage.delete(stale);
      // Next `#getSpreadsheet` will rehydrate from the reassembled save.
      this.#ss = null;
    });
    if (isFinal) {
      await this.#mirrorIndex(roomName, updatedAt);
    }
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
    // Fold base+log into a single authoritative snapshot on ingest.
    // `#getSpreadsheet` no longer replays the log when a snapshot is
    // present, so the snapshot we store here must already incorporate the
    // incoming `log` commands — otherwise a renamed room would silently
    // lose every since-base command. The bounded recent tail (≤ LOG_RING)
    // is kept only for client catch-up; audit carries the full record.
    const foldedSnapshot = foldSnapshot(parsed.snapshot as string, log as string[]);
    const logTail = (log as string[]).slice(-LOG_RING);
    await this.#state.blockConcurrencyWhile(async () => {
      const accessEntries = await this.#readAccessEntries();
      await this.#state.storage.deleteAll();
      const entries: Record<string, unknown> = {
        ...accessEntries,
        ...snapshotEntries(foldedSnapshot),
        [STORAGE_KEYS.metaUpdatedAt]: Date.now(),
      };
      for (let i = 0; i < logTail.length; i++) {
        entries[logKey(i)] = logTail[i] as string;
      }
      for (let i = 0; i < audit.length; i++) {
        entries[auditKey(i)] = audit[i] as string;
      }
      await this.#state.storage.put(entries);
      this.#ss = null;
      this.#nextLogSeq = logTail.length;
      this.#nextAuditSeq = audit.length;
      this.#nextChatSeq = 0;
      this.#resetVolatile();
    });
    await this.#armAlarm();
    return plainResponse('OK', 201);
  }

  /**
   * Phase A — atomic private-room initialization. The one route that
   * creates `meta:access`/`meta:acl`/`meta:group`, and only on a DO
   * with ZERO storage keys — a tombstoned or occupied room 409s, so
   * emptiness (not authorization) is the claim guard. The caller's
   * trusted uid (`X-EC-Uid`, minted by the Worker from a verified
   * session) must own the supplied ACL so nobody can mint rooms owned
   * by someone else.
   */
  async #postInitPrivate(request: Request): Promise<Response> {
    const uid = request.headers.get('X-EC-Uid');
    if (uid === null || uid.length === 0) {
      return plainResponse('Forbidden', 403);
    }
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return plainResponse('init-private body must be valid JSON', 400);
    }
    if (raw === null || typeof raw !== 'object') {
      return plainResponse('init-private body must be an object', 400);
    }
    const snapshot =
      'snapshot' in raw && typeof raw.snapshot === 'string'
        ? raw.snapshot
        : null;
    if (snapshot === null) {
      return plainResponse('init-private body.snapshot must be string', 400);
    }
    const acl = 'acl' in raw ? raw.acl : null;
    if (
      acl === null ||
      typeof acl !== 'object' ||
      !('owner' in acl) ||
      typeof acl.owner !== 'string' ||
      acl.owner.length === 0 ||
      !('readers' in acl) ||
      !Array.isArray(acl.readers) ||
      !acl.readers.every((r) => typeof r === 'string' && r.length > 0) ||
      !('writers' in acl) ||
      !Array.isArray(acl.writers) ||
      !acl.writers.every((w) => typeof w === 'string' && w.length > 0)
    ) {
      return plainResponse('init-private body.acl is malformed', 400);
    }
    const group = 'group' in raw ? raw.group : undefined;
    if (group !== undefined && typeof group !== 'string') {
      return plainResponse('init-private body.group must be string', 400);
    }
    if (acl.owner !== uid) {
      return plainResponse('Forbidden', 403);
    }
    const created = await this.#state.blockConcurrencyWhile(() =>
      this.#state.storage.transaction(async (txn) => {
        const existing = await txn.list({ limit: 1 });
        if (existing.size > 0) return false;
        await txn.put({
          ...snapshotEntries(snapshot),
          [STORAGE_KEYS.metaAccess]: 'private',
          [STORAGE_KEYS.metaAcl]: {
            owner: acl.owner,
            readers: acl.readers,
            writers: acl.writers,
          },
          ...(group === undefined
            ? {}
            : { [STORAGE_KEYS.metaGroup]: group }),
          [STORAGE_KEYS.metaUpdatedAt]: Date.now(),
        });
        return true;
      }),
    );
    if (!created) {
      return plainResponse('Room already exists', 409);
    }
    this.#ss = null;
    this.#nextLogSeq = 0;
    this.#nextAuditSeq = 0;
    this.#nextChatSeq = 0;
    this.#resetVolatile();
    await this.#armAlarm();
    return plainResponse('OK', 201);
  }

  // ─── Cron fire-trigger (Phase 9) ───────────────────────────────────────

  /**
   * `POST /_do/fire-trigger?cell=<coord>` — fire one due cron trigger.
   *
   * Legacy flow (src/sc.ls:360-370 + src/main.ls:196 + src/sc.ls:247-253):
   *   - `SC[room].triggerActionCell(cell, cb)` ran
   *     `SocialCalc.TriggerIoAction.Email('<coord>')` against the
   *     cell, which produced a URL-encoded `sendemail <to> <subject>
   *     <body>` string and passed it back via `cb`.
   *   - The server parsed that string, dispatched to `emailer.sendemail`,
   *     and broadcast `{type: confirmemailsent, message}` on
   *     `log-<room>`.
   *
   * We collapse all of that here:
   *   1. Look up the cell's datavalue/formula/comment and derive a
   *      `sendemail` command. SocialCalc's TriggerIoAction logic
   *      stores the email payload directly in the cell's `datavalue`
   *      (as a space-delimited, %20-encoded string starting with
   *      `sendemail `). If the cell doesn't hold one, the trigger is
   *      a no-op.
   *   2. Parse via `parseSendemail`, dispatch through `buildEmailSender(env)`.
   *   3. Broadcast `{type: 'confirmemailsent', message}` to every WS peer.
   *
   * Every failure path is swallowed into a `200 OK` so the cron
   * runner never retries on a malformed cell — the legacy handler
   * also moved on.
   */
  async #fireTrigger(cell: string): Promise<Response> {
    if (cell.length === 0) return plainResponse('', 200);
    const ss = await this.#getSpreadsheet();
    const cellRecord = ss.exportCell(cell) as
      | { datavalue?: unknown; formula?: unknown }
      | null;
    if (!cellRecord) return plainResponse('', 200);
    // Legacy's TriggerIoAction.Email reconstructs the command from
    // formula-like payload stored in the cell. In practice clients put
    // the full `sendemail <to> <subject> <body>` URL-encoded string
    // into `formula` (for triggered cells) or `datavalue` (for plain
    // text). Try both.
    const candidate =
      (typeof cellRecord.formula === 'string' && cellRecord.formula.length > 0
        ? cellRecord.formula
        : '') ||
      (typeof cellRecord.datavalue === 'string' ? cellRecord.datavalue : '');
    const parsed = parseSendemail(candidate);
    if (!parsed) return plainResponse('', 200);
    const sender = buildEmailSender(this.#env);
    const { message } = await sender.send(parsed.to, parsed.subject, parsed.body);
    this.#broadcastAll({ type: 'confirmemailsent', message });
    return plainResponse('', 200);
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
    // Per-room connection cap — a coarse DoS backstop. The hibernation API
    // keeps every accepted socket retrievable via `getWebSockets()`, so a
    // simple count is the live connection total for this room.
    if (this.#state.getWebSockets().length >= MAX_CONN) {
      return plainResponse('Too many connections', 503);
    }
    /* istanbul ignore next -- @preserve
     *   `upgradeWebSocket` needs `WebSocketPair`, `state.acceptWebSocket`,
     *   and a Workers `Response` accepting `status: 101` + `webSocket`.
     *   None of these exist in Node; end-to-end coverage lives in the
     *   workers-pool integration tests (`test/ws.test.ts`,
     *   `test/legacy-socketio.test.ts`, `test/room.test.ts`).
     */
    const uid = request.headers.get('X-EC-Uid');
    const wsOpts = {
      ...(isSandstormEnforced(this.#env)
        ? { sandstormModify: sandstormCanModify(request.headers) }
        : {}),
      ...(uid === null ? {} : { uid }),
    };
    return upgradeWebSocket(this.#state, request, wsOpts);
  }

  /**
   * `GET /_do/legacy-ws` — hibernatable socket.io v0.9 upgrade. Same
   * connection cap as the native path; framing differs (see attachment
   * `legacy: true` + `#sendTo` / `webSocketMessage`).
   */
  #acceptLegacyWebSocket(request: Request): Response {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return plainResponse('Expected Upgrade: websocket', 426);
    }
    if (this.#state.getWebSockets().length >= MAX_CONN) {
      return plainResponse('Too many connections', 503);
    }
    /* istanbul ignore next -- @preserve
     *   Same workerd-only surface as `#acceptWebSocket` (WebSocketPair +
     *   acceptWebSocket + 101 Response). Covered by workers-pool tests.
     */
    return upgradeLegacySocketIo(this.#state);
  }

  /**
   * Hibernation-api entrypoint. Parses the incoming frame, assembles a
   * `WsContext` bound to this socket, and delegates to the pure dispatch
   * layer in `src/lib/ws-handlers.ts` (Phase 7.1 extract).
   *
   * Legacy (`attachment.legacy`) sockets speak socket.io v0.9 framing:
   * heartbeats are auto-answered by `setWebSocketAutoResponse`; event
   * packets are unwrapped to native ClientMessage before dispatch.
   * Session-host DOs (sid-keyed, empty attachment.room) only forward
   * `execute` to the room named in the frame — matching the pre-hibernate
   * Worker-shim baseline — so spreadsheet state stays on the real room DO.
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== 'string') return;
    // Per-frame byte cap — drop oversized frames before parsing so a
    // single client can't force a multi-MB JSON.parse + storage write.
    if (message.length > MAX_FRAME) return;
    const attachment =
      (ws.deserializeAttachment() as WsAttachment | null) ??
      { user: '', room: '', auth: '' };

    if (attachment.legacy) {
      await this.#handleLegacyFrame(ws, attachment, message);
      return;
    }

    const parsed = parseClientMessage(message);
    if (!parsed) return;
    // Auth-bearing message variants (`execute`, `ecell`, `stopHuddle`)
    // carry their own `auth` string; others never do. Default to empty so
    // the downstream `verifyAuth` treats it as view-only.
    const perMessageAuth =
      'auth' in parsed && typeof parsed.auth === 'string' ? parsed.auth : '';
    const ctx = this.#buildWsContext(ws, attachment, parsed.room, perMessageAuth);
    await dispatchWsMessage(ctx, parsed);
  }

  /**
   * Decode one socket.io v0.9 frame and either dispatch it locally (when
   * this DO is the room the frame names) or forward `execute` to the
   * named room DO (session-host / sid-keyed case).
   */
  async #handleLegacyFrame(
    ws: WebSocket,
    attachment: WsAttachment,
    raw: string,
  ): Promise<void> {
    const packet = decodeFrame(raw);
    if (!packet) return;
    if (packet.type === PacketType.Disconnect) {
      try {
        ws.close(1000, 'client disconnected');
      } catch {
        /* already closed */
      }
      return;
    }
    // Heartbeats are answered by setWebSocketAutoResponse without waking
    // us; if one does arrive (auto-response unset in tests), ignore it.
    if (packet.type === PacketType.Heartbeat) return;
    if (packet.type !== PacketType.Event) return;
    const parsed = socketIoEventToNative(packet);
    if (!parsed) return;

    // Session host: attachment.room is empty because the upgrade was
    // sid-keyed, not room-keyed. Forward executes to the real room DO
    // (preserves spreadsheet locality); other types need two-way state
    // and are dropped here just as the pre-hibernate baseline did.
    if (!attachment.room) {
      if (parsed.type !== 'execute') return;
      if (isFilteredExecuteCommand(parsed.cmdstr)) return;
      const room = parsed.room;
      if (!room) return;
      try {
        const stub = this.#env.ROOM.get(
          this.#env.ROOM.idFromName(encodeRoom(room)),
        );
        await stub.fetch(
          `https://do.local/_do/commands?name=${encodeURIComponent(room)}`,
          { method: 'POST', body: parsed.cmdstr },
        );
      } catch {
        // Best-effort; a missing ROOM binding in unit tests no-ops.
      }
      return;
    }

    // Room-scoped legacy socket: full native dispatch with framing on send.
    const perMessageAuth =
      'auth' in parsed && typeof parsed.auth === 'string' ? parsed.auth : '';
    const ctx = this.#buildWsContext(ws, attachment, parsed.room, perMessageAuth);
    await dispatchWsMessage(ctx, parsed);
  }

  /**
   * Hibernation-api close hook. We intentionally do NOT remove the user's
   * `ecell:<user>` entry here — legacy left the last-known cursor in place
   * so a reconnecting client could resume where they left off.
   */
  async webSocketClose(ws: WebSocket): Promise<void> {
    void ws;
  }

  // ─── WsContext assembly ────────────────────────────────────────────────

  /**
   * Build the `WsContext` surface for one WS frame. Everything here is
   * deliberately small: captured closures over `this` that translate
   * handler calls into storage I/O, socket sends, and sibling-DO fetches.
   *
   * The `room` arg is taken from the incoming message (not the handshake
   * attachment) because legacy clients sometimes multiplex a single WS
   * across multiple rooms — the per-frame `room` is the authority.
   */
  #buildWsContext(
    ws: WebSocket,
    attachment: WsAttachment,
    messageRoom: string,
    messageAuth: string,
  ): WsContext {
    const storage: WsStorage = {
      listPrefix: (prefix) => this.#listPrefix(prefix),
      listHash: (prefix) => this.#listHash(prefix),
      putHash: async (prefix, key, value) => {
        // ecell writes carry an attacker-controllable username key, so
        // they go through the LRU-capped path. Any other prefix (none
        // today) writes straight through.
        /* istanbul ignore else -- @preserve: only ecell: reaches putHash today */
        if (prefix === STORAGE_KEYS.ecellPrefix) {
          await this.#putEcellCapped(key, value);
        } else {
          await this.#state.storage.put(`${prefix}${key}`, value);
        }
      },
      appendLog: (prefix, value) =>
        this.#appendLogEntry(prefix, value, attachment.room || messageRoom),
      getSnapshot: async () => (await readSnapshot(this.#state.storage)) ?? undefined,
      deleteAll: async () => {
        // WS `stopHuddle` is the hot path. Mirror the HTTP DELETE flow:
        // wipe storage AND drop the D1 index row so `/_rooms`,
        // `/_roomlinks`, and `/_roomtimes` stop listing the dead room.
        // Uses the handshake attachment room (falls back to the frame's
        // `room` when the attachment is empty — see #applyCommandAndMirror
        // for the rationale). The handler enforces auth before calling
        // this, so we don't need to re-verify here.
        const nameToUnindex = attachment.room || messageRoom;
        await this.#deleteAllAndUnindex(
          nameToUnindex,
          true,
          attachment.uid ?? null,
        );
      },
    };
    const env = this.#env;
    return {
      room: messageRoom,
      user: attachment.user,
      auth: messageAuth,
      storage,
      applyCommand: async (cmdstr: string) => {
        // Mirror the DO's own room (from the WS handshake attachment),
        // not the per-frame `room` field, because the append lands in
        // *this* DO's storage regardless of what room the frame names.
        // For normal (non-multiplexed) clients the two are equal.
        const nameToMirror = attachment.room || messageRoom;
        await this.#applyCommandAndMirror(nameToMirror, cmdstr);
      },
      broadcast: async (msg, includeSelf) => {
        if (includeSelf) this.#broadcastAll(msg);
        else this.#broadcast(ws, msg);
      },
      reply: async (msg) => {
        this.#sendTo(ws, msg);
      },
      verifyAuth: async () => {
        // Sandstorm viewers lack `modify` — block WS writes (SH-6).
        if (
          !sandstormAllowsWsWrite(env, attachment.sandstormModify)
        ) {
          return false;
        }
        // Legacy explicit view-only sentinel (`auth === '0'`) stays an
        // absolute veto on both public and private paths.
        if (messageAuth === '0') return false;
        const { access, acl } = await this.#getAccessMeta();
        if (access === 'private') {
          // Deny-overrides on private rooms: ACL membership REPLACES
          // the legacy HMAC — an old ?auth= token must not bypass the
          // ACL, and members must not need one. The uid comes from the
          // handshake attachment, minted from the verified session.
          const uid = attachment.uid;
          return authorizeRoom(
            'write',
            uid === undefined ? null : { uid },
            access,
            acl,
          );
        }
        // Execute/ecell/stopHuddle carry their own per-message `auth`
        // string; legacy verified against that field (src/main.ls:516).
        // Messages without an auth field pass empty string → rejected by
        // `verifyAuth` as view-only unless KEY is unset (identity path).
        return await verifyAuth(env.ETHERCALC_KEY, messageRoom, messageAuth);
      },
      allowSubmitForm: async () => {
        const { access } = await this.#getAccessMeta();
        return access == null || access === 'public';
      },
      siblingDo: (room: string): WsSiblingDO => {
        const id = env.ROOM.idFromName(room);
        const stub = env.ROOM.get(id);
        const uid = attachment.uid;
        return {
          async fetch(path, init) {
            // Thread the sender's verified identity so a private
            // formdata sibling accepts the write.
            const headers = new Headers(init?.headers);
            headers.delete('X-EC-Uid');
            if (uid !== undefined) headers.set('X-EC-Uid', uid);
            return await stub.fetch(path, { ...init, headers });
          },
        };
      },
    };
  }

  // ─── WS broadcast primitives ───────────────────────────────────────────

  #sendTo(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(this.#frameFor(ws, msg));
    } catch {
      // Socket closed underfoot; hibernation will fire webSocketClose.
    }
  }

  /** Encode a ServerMessage for `ws` — socket.io event frame when legacy. */
  #frameFor(ws: WebSocket, msg: ServerMessage): string {
    const att = ws.deserializeAttachment() as WsAttachment | null;
    return att?.legacy ? nativeToSocketIoEvent(msg) : encodeMessage(msg);
  }

  /** Send to every peer except `skip`. */
  #broadcast(skip: WebSocket, msg: ServerMessage): void {
    for (const peer of this.#state.getWebSockets()) {
      if (peer === skip) continue;
      try {
        peer.send(this.#frameFor(peer, msg));
      } catch {
        // Skip dead peer; the rest still receive.
      }
    }
  }

  /** Send to every peer (including the sender). Used by submitform. */
  #broadcastAll(msg: ServerMessage): void {
    for (const peer of this.#state.getWebSockets()) {
      try {
        peer.send(this.#frameFor(peer, msg));
      } catch {
        // Best-effort; individual peer errors are expected.
      }
    }
  }

  /**
   * Append one entry under `prefix`, the transport-agnostic fan-out for
   * `ctx.storage.appendLog`. Today only `chat:` is reachable from the
   * handler layer — `log:`/`audit:` writes go through `applyCommand` →
   * `#appendCommand` so they stay serialized alongside the SocialCalc
   * state-save. Any future handler that needs a non-chat prefix should
   * route through this method so the concurrency guard stays in one
   * place.
   */
  async #appendLogEntry(
    prefix: string,
    value: string,
    roomName: string | null,
  ): Promise<void> {
    // Today only `chat:` is reachable from the handler layer —
    // `log:`/`audit:` writes go through `applyCommand` → `#appendCommand`.
    // The non-chat fallthrough is a silent no-op rather than a throw to
    // keep `WsStorage.appendLog` honest about its prefix arg.
    /* istanbul ignore else -- @preserve */
    if (prefix === STORAGE_KEYS.chatPrefix) {
      await this.appendChat(value, roomName);
    }
  }

  /** List entries under `prefix` as a `{key-without-prefix: value}` map. */
  async #listHash(prefix: string): Promise<Record<string, string>> {
    const map = await this.#state.storage.list<string>({ prefix });
    const out: Record<string, string> = {};
    for (const [k, v] of map) out[k.slice(prefix.length)] = v;
    return out;
  }

  /**
   * Append a batch of commands to log+audit, run through SocialCalc, and
   * write the resulting snapshot + meta timestamp. Caller is responsible
   * for wrapping this in `blockConcurrencyWhile` when called from a
   * handler that needs serialization.
   */
  async #appendCommand(body: string): Promise<{ auditSeq: number; ts: number }> {
    const ss = await this.#getSpreadsheet();
    await this.#ensureSeqs();
    const logSeq = this.#nextLogSeq!;
    const auditSeq = this.#nextAuditSeq!;
    const ts = Date.now();
    ss.executeCommand(body);
    // Cross-sheet formulas added in this command may have resolved to
    // `#NAME?` because the referenced siblings weren't in the formula
    // cache during the initial recalc. Fetch them now and recalc so the
    // stored snapshot carries the live value.
    await this.#hydrateCrossSheetRefs(ss, this.#ownName);
    const newSnapshot = ss.createSpreadsheetSave();

    // Figure out the PRIOR snapshot layout so we can clean up stale
    // chunk keys when the new save either (a) fits in the single-key
    // fast path while the old one was chunked, or (b) uses fewer
    // chunks than before. Without this cleanup, orphan chunks would
    // silently extend the save on next read.
    const priorMeta = await readSnapshotMeta(this.#state.storage);
    const newEntries = snapshotEntries(newSnapshot);
    const newMeta = newEntries[STORAGE_KEYS.snapshotMeta] as
      | { chunks: number }
      | undefined;
    const newChunkCount = newMeta?.chunks ?? 0;

    await this.#state.storage.put({
      ...newEntries,
      [STORAGE_KEYS.metaUpdatedAt]: ts,
      [logKey(logSeq)]: body,
      [auditKey(auditSeq)]: body,
    });

    // Stale-chunk cleanup only runs when the prior layout had chunks
    // we didn't overwrite: shrinking chunk count, or switching back to
    // single-key. When prior was also single-key (no meta) the new
    // single-key write already overwrote it and there's nothing to do.
    if (priorMeta !== null) {
      const stale: string[] = [];
      if (!(STORAGE_KEYS.snapshotMeta in newEntries)) {
        stale.push(STORAGE_KEYS.snapshotMeta);
      }
      for (let i = newChunkCount; i < priorMeta.chunks; i++) {
        stale.push(snapshotChunkKey(i));
      }
      if (stale.length > 0) await this.#state.storage.delete(stale);
    }

    // Ring-buffer the log: now that the snapshot is authoritative on
    // hydrate, `log:` only needs to retain the most recent `LOG_RING`
    // entries for client catch-up. Drop the entry that just fell off the
    // tail. `audit:` is intentionally NOT trimmed.
    if (logSeq >= LOG_RING) {
      await this.#state.storage.delete(logKey(logSeq - LOG_RING));
    }

    this.#nextLogSeq = logSeq + 1;
    this.#nextAuditSeq = auditSeq + 1;
    await this.#armAlarm();
    return { auditSeq, ts };
  }

  // ─── Internals ─────────────────────────────────────────────────────────

  /**
   * Return the cached HeadlessSpreadsheet, hydrating from the stored
   * snapshot if necessary. Idempotent + safe under concurrent calls because
   * the DO only services one request at a time.
   *
   * Phase 8.2 — hydrates sibling sheets referenced by any cross-sheet
   * formula (`'other'!A1`) into SocialCalc's formula-evaluator cache
   * BEFORE the final recalc, so cross-sheet refs compute to real values
   * instead of `#NAME?`. Fetches each sibling's save via the standard
   * `/_do/snapshot` DO-to-DO route; unresolved siblings just stay absent
   * and the formulas return `#NAME?` as graceful degrade.
   */
  async #getSpreadsheet(): Promise<HeadlessSpreadsheet> {
    if (this.#ss) return this.#ss;
    const snapshot = await readSnapshot(this.#state.storage);
    // The stored snapshot is AUTHORITATIVE on hydrate. `#appendCommand`
    // writes a freshly-serialized POST-command snapshot every time it
    // also appends to `log:`, so the snapshot already includes every
    // command the log holds. Replaying the log on top of it (the old
    // behaviour) double-applied every command — idempotent for plain
    // `set A1 …` but corrupting for `insertrow`/`paste`/`sort`/`move` on
    // a cold rehydrate (new isolate, or a seeded room). Build from the
    // snapshot ALONE; only replay the log in the no-snapshot (log-only)
    // case, where there is no folded state to replay onto.
    const ss = snapshot
      ? createSpreadsheet({ snapshot })
      : createSpreadsheet({ log: await this.#listPrefix(STORAGE_KEYS.logPrefix) });
    // #ownName is set by the fetch handler on every request; when it's
    // unset (e.g. direct construction in unit tests) we skip cross-sheet
    // resolution so tests don't require a full env.ROOM stub.
    await this.#hydrateCrossSheetRefs(ss, this.#ownName);
    this.#ss = ss;
    return this.#ss;
  }

  /**
   * Enumerate cross-sheet refs and pre-populate SocialCalc's sheet cache
   * with the referenced siblings, then re-run recalc. No-op when there
   * are no cross-sheet references.
   */
  /**
   * Fetch a sibling room's snapshot via the standard DO-to-DO path.
   * Returns `null` when the sibling has no snapshot (404) or the fetch
   * throws (e.g. workers recursion limit).
   */
  async #fetchSibling(name: string): Promise<string | null> {
    const stub = this.#env.ROOM.get(this.#env.ROOM.idFromName(encodeRoom(name)));
    const res = await stub.fetch('https://do.local/_do/snapshot', {
      method: 'GET',
    });
    if (res.status !== 200) return null;
    const text = await res.text();
    return text || null;
  }

  async #hydrateCrossSheetRefs(
    ss: HeadlessSpreadsheet,
    ownName?: string,
  ): Promise<void> {
    await hydrateCrossSheetRefs(ss, (name) => this.#fetchSibling(name), ownName);
  }

  /** Ordered list of values stored under `prefix`, sorted by key. */
  async #listPrefix(prefix: string): Promise<string[]> {
    const map = await this.#state.storage.list<string>({ prefix });
    // DO storage guarantees lexicographic key order from list().
    return Array.from(map.values());
  }

  /**
   * Lazily populate the in-memory sequence counters by scanning storage on
   * first write. Each counter is derived from the HIGHEST existing key
   * index plus one — NOT the key count. The log ring-trim (`#appendCommand`)
   * and the chat trim (`#trimChat`) delete entries from the FRONT, so after
   * a trim the keys are non-contiguous (e.g. `log:0…0976 … log:0…1999`); a
   * count-based next-seq would then collide with a live key on the first
   * write after an isolate restart — silently overwriting recent data and
   * defeating the ring bound. Keys are fixed-width 16-digit zero-padded
   * (`@ethercalc/shared` padSeq), so the numeric suffix recovers the index
   * exactly. `audit:` is never trimmed (stays contiguous) but uses the same
   * derivation for uniformity.
   */
  async #ensureSeqs(): Promise<void> {
    if (this.#nextLogSeq === null) {
      this.#nextLogSeq = await this.#nextSeq(STORAGE_KEYS.logPrefix);
    }
    if (this.#nextAuditSeq === null) {
      this.#nextAuditSeq = await this.#nextSeq(STORAGE_KEYS.auditPrefix);
    }
    if (this.#nextChatSeq === null) {
      this.#nextChatSeq = await this.#nextSeq(STORAGE_KEYS.chatPrefix);
    }
  }

  /**
   * The next append sequence for `prefix`: one past the highest existing
   * key index, or 0 when the prefix is empty. Robust to the non-contiguous
   * key windows the ring/chat trims leave behind (see `#ensureSeqs`). Keys
   * are fixed-width 16-digit zero-padded, so `list()`'s lexicographic order
   * IS numeric order — the LAST key carries the highest index (the same
   * ordering guarantee `#listPrefix` relies on).
   */
  async #nextSeq(prefix: string): Promise<number> {
    const keys = Array.from(
      (await this.#state.storage.list<string>({ prefix })).keys(),
    );
    const last = keys[keys.length - 1];
    return last === undefined ? 0 : Number(last.slice(prefix.length)) + 1;
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
    // Private rooms never enter the cross-room index (Phase A / P8) —
    // the D1 `rooms` table backs the public `/_rooms*` listings.
    const { access } = await this.#getAccessMeta();
    if (access === 'private') return;
    await mirrorRoomToD1(this.#env.DB, roomName, updatedAt);
  }

  /** Symmetric delete for `#mirrorIndex`, used on `DELETE /_do/all`. */
  async #deleteIndex(roomName: string | null): Promise<void> {
    if (!this.#env.DB || !roomName) return;
    await deleteRoomFromD1(this.#env.DB, roomName);
  }

  /**
   * Single choke-point for best-effort D1 work scoped to this room. No-ops
   * without a DB binding or a room name; swallows transient errors. The DO
   * copy is authoritative for live state and the alarm only trims entries
   * already mirrored, so a dropped D1 write is non-fatal (matches the
   * rooms-index mirror's reliability model). Centralizing the guard + catch
   * keeps the audit/chat mirror + delete helpers one line each.
   */
  async #d1(
    roomName: string | null,
    op: (db: D1Database, room: string) => Promise<unknown>,
  ): Promise<void> {
    const db = this.#env.DB;
    if (!db || !roomName) return;
    try {
      await op(db, roomName);
    } catch {
      /* best-effort; DO copy persists and the alarm reconciles */
    }
  }

  /** Best-effort mirror of audit rows to the durable D1 `audit_log`. */
  #mirrorAudit(roomName: string | null, rows: readonly SeqRow[]): Promise<void> {
    return this.#d1(roomName, (db, room) => appendAuditRows(db, room, rows));
  }

  /** Best-effort mirror of chat rows to the durable D1 `chat_log`. */
  #mirrorChat(roomName: string | null, rows: readonly SeqRow[]): Promise<void> {
    return this.#d1(roomName, (db, room) => appendChatRows(db, room, rows));
  }

  /** Drop a room's durable `audit_log` + `chat_log` rows on deletion. */
  #deleteAuditChatFromD1(roomName: string | null): Promise<void> {
    return this.#d1(roomName, async (db, room) => {
      await deleteAuditRows(db, room);
      await deleteChatRows(db, room);
    });
  }

  // ─── Hooks used by future phases (chat/ecell) ──────────────────────────
  // Kept here because WS handlers (Phase 7) will poke these directly; the
  // method shapes are stable now and test coverage locks them in.

  /**
   * Append a chat message. Returns the stored sequence number. `roomName`
   * (the DO's own room) is threaded through so the message can be mirrored
   * to the durable D1 `chat_log`; when omitted (direct unit-test calls) the
   * D1 mirror is skipped.
   */
  async appendChat(message: string, roomName: string | null = null): Promise<number> {
    const seq = await this.#state.blockConcurrencyWhile(async () => {
      await this.#ensureSeqs();
      const s = this.#nextChatSeq!;
      await this.#state.storage.put(chatKey(s), message);
      this.#nextChatSeq = s + 1;
      // Arm the alarm so a chat-only room (no edits) still gets housekeeping
      // (chat trim / TTL); otherwise `chat:` would never be bounded.
      await this.#armAlarm();
      return s;
    });
    // Mirror to the durable D1 `chat_log` so the alarm's chat-trim drops only
    // entries that are already durable there. Best-effort, outside the lock.
    await this.#mirrorChat(roomName, [{ seq, ts: Date.now(), body: message }]);
    return seq;
  }

  /** Upsert an ecell value for a user (LRU-capped). */
  async putEcell(user: string, cell: string): Promise<void> {
    await this.#putEcellCapped(user, cell);
  }

  /**
   * Upsert one `ecell:<user>` entry with least-recently-written eviction
   * once the room exceeds `ECELL_CAP` distinct users. The LRU order is
   * lazily seeded from storage so the cap survives an isolate restart.
   *
   * Re-writing an existing user moves it to the most-recent slot without
   * growing the set. A brand-new user that overflows the cap evicts the
   * oldest entry from both the in-memory order and storage. This stops an
   * attacker cycling arbitrary usernames from blowing per-room storage.
   */
  async #putEcellCapped(user: string, cell: string): Promise<void> {
    if (this.#ecellOrder === null) {
      const map = await this.#state.storage.list<string>({
        prefix: STORAGE_KEYS.ecellPrefix,
      });
      // list() returns lexicographic key order — not write order — but
      // that's a stable, deterministic seed; subsequent writes refine it
      // toward true recency.
      this.#ecellOrder = Array.from(map.keys()).map((k) =>
        k.slice(STORAGE_KEYS.ecellPrefix.length),
      );
    }
    const order = this.#ecellOrder;
    const existing = order.indexOf(user);
    if (existing !== -1) order.splice(existing, 1);
    order.push(user);
    const evicted: string[] = [];
    while (order.length > ECELL_CAP) {
      // shift() over a non-empty array (length > cap ≥ 1) never returns
      // undefined; the `?? ''`-free assertion keeps the type honest.
      const victim = order.shift() as string;
      evicted.push(ecellKey(victim));
    }
    await this.#state.storage.put(ecellKey(user), cell);
    if (evicted.length > 0) await this.#state.storage.delete(evicted);
    await this.#armAlarm();
  }

  /**
   * Reset in-memory state that a full storage wipe (`deleteAll`) or
   * re-seed invalidates: the LRU ecell order (now empty / re-seeded) and
   * the cached alarm-armed flag (the writer re-arms afterwards). Kept
   * separate from the seq-counter resets above so each wipe site reads
   * clearly.
   */
  #resetVolatile(): void {
    this.#ecellOrder = null;
    this.#alarmArmed = false;
    this.#accessMeta = null;
  }

  /**
   * Arm the housekeeping alarm if it isn't already pending. Called from
   * every write path. We avoid a `getAlarm()` round-trip on the hot path
   * by caching the armed state in `#alarmArmed`; the alarm handler clears
   * it before re-arming, and the very first arm reads `getAlarm()` once to
   * recover state across isolate restarts.
   */
  async #armAlarm(): Promise<void> {
    if (this.#alarmArmed) return;
    const current = await this.#state.storage.getAlarm();
    if (current !== null) {
      this.#alarmArmed = true;
      return;
    }
    await this.#state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);
    this.#alarmArmed = true;
  }

  /**
   * Housekeeping alarm (AGENTS.md §13 Q10). Fires roughly hourly while a
   * room stays active. Two jobs:
   *   (a) Trim `chat:*` / `audit:*` down to recent tails — both are
   *       mirrored to D1 beyond the DO lifetime, so the DO copy only
   *       needs to cover live catch-up.
   *   (b) TTL / `--expire`: when `ETHERCALC_EXPIRE` is set and the room
   *       hasn't been touched within the TTL, wipe it (same hammer as
   *       `DELETE /_do/all`).
   *
   * Re-arm gate (idle rooms must go fully dormant — no hourly wake):
   *   re-arm ONLY when at least one of:
   *     (1) any live WebSocket (`getWebSockets().length > 0`);
   *     (2) a TTL is configured (`parseExpireMs` non-null) so expiry can
   *         still fire;
   *     (3) this run actually trimmed rows (tails may still exceed caps
   *         next hour).
   *   Otherwise do NOT re-arm. Write paths re-arm via `#armAlarm()` so the
   *   next mutation resumes the cadence (invariant: every storage write
   *   that should keep the room "active" calls `#armAlarm` — see
   *   `#appendCommand`, `appendChat`, `#putEcellCapped`, `#putSnapshot`,
   *   `#postSeed`, `#postInstall`, `#postPitrTouch`).
   */
  async alarm(): Promise<void> {
    this.#alarmArmed = false;
    // (b) TTL expiry — if configured and the room is stale, drop it and
    // do NOT re-arm (the room is gone).
    const ttlMs = parseExpireMs(this.#env.ETHERCALC_EXPIRE);
    if (ttlMs !== null) {
      const updatedAt = await this.#state.storage.get<number>(
        STORAGE_KEYS.metaUpdatedAt,
      );
      if (typeof updatedAt === 'number' && Date.now() - updatedAt >= ttlMs) {
        await this.#deleteAllAndUnindex(this.#ownName ?? null, false, null);
        return;
      }
    }
    // (a) Trim the DO copies of chat + audit to a recent tail. The full
    // record is mirrored to D1 (chat_log / audit_log) at append time, so the
    // dropped oldest entries stay durable there.
    const chatTrimmed = await this.#trimTail(STORAGE_KEYS.chatPrefix, CHAT_KEEP);
    const auditTrimmed = await this.#trimTail(
      STORAGE_KEYS.auditPrefix,
      AUDIT_KEEP,
    );
    // Invariant: write paths call `#armAlarm()`; this gate only decides
    // whether the idle cadence continues. See method doc above for the
    // three re-arm conditions.
    const hasSockets = this.#state.getWebSockets().length > 0;
    const ttlConfigured = ttlMs !== null;
    const trimmed = chatTrimmed || auditTrimmed;
    if (hasSockets || ttlConfigured || trimmed) {
      await this.#armAlarm();
    }
  }

  /**
   * Delete all but the most recent `keep` entries under `prefix`. Returns
   * true when at least one key was removed (so the alarm re-arm gate can
   * keep the cadence while a tail still needs draining). The full record
   * is mirrored to D1 at append time, so the dropped (oldest) entries
   * remain durable there — the DO copy is only a live-catch-up tail.
   */
  async #trimTail(prefix: string, keep: number): Promise<boolean> {
    const map = await this.#state.storage.list<string>({ prefix });
    const keys = Array.from(map.keys());
    if (keys.length <= keep) return false;
    // list() returns ascending key order; the oldest are at the front.
    await this.#state.storage.delete(keys.slice(0, keys.length - keep));
    return true;
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
