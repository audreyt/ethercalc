/**
 * Pure WebSocket message handlers.
 *
 * The `RoomDO.webSocketMessage` hook receives a `ClientMessage` and must
 * decide which storage operations to run, which peers to broadcast to, and
 * which reply frames to emit. That logic was originally inlined in
 * `src/room.ts` as a per-type switch with direct `this.#state.storage` and
 * `this.#getSpreadsheet()` access, which meant every WS-dispatch branch
 * was only reachable through the workers-pool integration tests and so
 * `src/room.ts` had to be excluded from the Node coverage gate (see
 * `vitest.node.config.ts` comment).
 *
 * Phase 7.1 extract: every handler is now a pure async function that takes
 * a `WsContext` — an interface covering exactly the I/O and callback
 * surface each handler needs — plus the already-parsed `ClientMessage`.
 * `RoomDO.#handleWsMessage` becomes a thin adapter that builds the
 * context per frame and delegates. Tests can mock the entire surface
 * trivially, which unlocks 100% branch coverage in the Node suite.
 *
 * Cross-references:
 *   - CLAUDE.md §5.2 — coverage gate layout
 *   - CLAUDE.md §6.2 — WS wire protocol
 *   - CLAUDE.md §6.4 — auth gate (rejected writes silently drop)
 *   - `src/lib/ws-dispatch.ts` — the pure builder helpers reused here
 */
import type {
  ClientMessage,
  ExecuteClientMessage,
  ServerMessage,
} from '@ethercalc/shared/messages';

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
} from './ws-dispatch.ts';

/**
 * Storage surface for the handlers. Only the primitives the WS layer
 * actually uses — snapshot reads/writes, log/chat/audit/ecell list+put,
 * and the big "wipe everything" hammer that `stopHuddle` triggers.
 */
export interface WsStorage {
  /** List all values under `prefix`, in lexicographic key order. */
  listPrefix(prefix: string): Promise<string[]>;
  /** List all entries under `prefix` as a map (prefix stripped). */
  listHash(prefix: string): Promise<Record<string, string>>;
  /** Upsert a single key under `prefix` (prefix NOT stripped). */
  putHash(prefix: string, key: string, value: string): Promise<void>;
  /** Append a value under `prefix` with an auto-incrementing seq. */
  appendLog(prefix: string, value: string): Promise<void>;
  /** Snapshot body, or undefined if no snapshot exists yet. */
  getSnapshot(): Promise<string | undefined>;
  /** Wipe the entire room (snapshot + log + audit + chat + ecell). */
  deleteAll(): Promise<void>;
}

/**
 * Sibling-DO entry point. `submitform` forwards a mutation to the
 * `<room>_formdata` peer; tests inject a fake fetcher.
 */
export interface WsSiblingDO {
  fetch(path: string, init?: RequestInit): Promise<Response>;
}

/**
 * Everything the handlers need. Room.ts assembles this once per frame
 * (cheap — just function references bound to the accepted WebSocket). An
 * explicit surface keeps the handler layer pure: no DO primitives leak in.
 */
export interface WsContext {
  readonly room: string;
  readonly user: string;
  readonly auth: string;
  readonly storage: WsStorage;
  /**
   * Append a command batch to the storage log + audit, run it through
   * SocialCalc, and rewrite the snapshot. The caller serializes this
   * behind `state.blockConcurrencyWhile`; the handler layer stays
   * transport-agnostic.
   */
  readonly applyCommand: (cmdstr: string) => Promise<void>;
  /**
   * Broadcast a message to every other peer in the room. If
   * `includeSelf` is true, the sender also receives the frame — this is
   * the `submitform` invariant (CLAUDE.md §7 item 22).
   */
  readonly broadcast: (msg: ServerMessage, includeSelf: boolean) => Promise<void>;
  /** Send a message only to the originating socket. */
  readonly reply: (msg: ServerMessage) => Promise<void>;
  /**
   * True iff the supplied auth matches the configured HMAC. When no
   * `ETHERCALC_KEY` is set, falls back to identity compare. Callers pass
   * `ctx.auth` (cached at handshake) to avoid a per-frame hash.
   */
  readonly verifyAuth: () => Promise<boolean>;
  /** Resolve a sibling DO stub by room name (submitform forwarding). */
  readonly siblingDo: (room: string) => WsSiblingDO;
}

// ─── Handlers ───────────────────────────────────────────────────────────────
//
// Every handler is a pure function of `(ctx, msg)` → `Promise<void>`. The
// helpers here do NOT throw: storage errors and socket-send errors are
// swallowed by the context implementations (matching legacy best-effort
// semantics — a dead peer never fails the whole fan-out).

/**
 * `chat` — append the message to storage and fan out to peers. Legacy
 * (`src/main.ls:505-509`) broadcast to everyone *except* the sender,
 * relying on the client to echo its own message locally.
 */
export async function handleChat(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'chat' }>,
): Promise<void> {
  await ctx.storage.appendLog('chat:', msg.msg);
  await ctx.broadcast(buildChatBroadcast(msg), false);
}

/**
 * `ask.ecells` — reply only to the requester with the full ecell map.
 * Other peers do not observe this query (CLAUDE.md §6.2).
 */
export async function handleAskEcells(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'ask.ecells' }>,
): Promise<void> {
  const ecells = await ctx.storage.listHash('ecell:');
  await ctx.reply(buildEcellsReply(msg.room, ecells));
}

/**
 * `my.ecell` — update the sender's cursor position and broadcast to
 * peers. Empty `user` is treated as "presence announcement" without
 * persistence (legacy accepted this shape from early clients). Everyone
 * else receives the broadcast regardless.
 */
export async function handleMyEcell(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'my.ecell' }>,
): Promise<void> {
  if (msg.user.length > 0) {
    await ctx.storage.putHash('ecell:', msg.user, msg.ecell);
  }
  await ctx.broadcast(buildMyEcellBroadcast(msg), false);
}

/**
 * `execute` — the heavy path. Three drop conditions (auth fail,
 * text-wiki filter, submitform without payload) short-circuit silently.
 * submitform forks to the sibling `<room>_formdata` DO with
 * include_self=true per legacy invariant (§7 item 22). Normal commands
 * go through `applyCommand` and broadcast with include_self=false.
 */
export async function handleExecute(
  ctx: WsContext,
  msg: ExecuteClientMessage,
): Promise<void> {
  if (!(await ctx.verifyAuth())) return;
  if (isFilteredExecuteCommand(msg.cmdstr)) return;

  if (isSubmitForm(msg.cmdstr)) {
    const { siblingRoom, siblingCommands } = computeSubmitFormTarget(
      msg.room,
      msg.cmdstr,
    );
    if (siblingCommands.length > 0) {
      const stub = ctx.siblingDo(siblingRoom);
      try {
        await stub.fetch('https://do.local/_do/commands', {
          method: 'POST',
          body: siblingCommands,
        });
      } catch {
        // Legacy src/main.ls:538 dropped sibling-send failures silently.
      }
    }
    await ctx.broadcast(buildExecuteBroadcast(msg, true), true);
    return;
  }

  await ctx.applyCommand(msg.cmdstr);
  await ctx.broadcast(buildExecuteBroadcast(msg, false), false);
}

/**
 * `ask.log` — reply to the sender with the full restoration payload
 * (snapshot + ordered log + chat). The legacy client replays log on
 * top of snapshot to reconstruct the UI state.
 */
export async function handleAskLog(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'ask.log' }>,
): Promise<void> {
  const [log, chat, snapshot] = await Promise.all([
    ctx.storage.listPrefix('log:'),
    ctx.storage.listPrefix('chat:'),
    ctx.storage.getSnapshot(),
  ]);
  await ctx.reply(buildLogReply(msg, log, chat, snapshot ?? ''));
}

/**
 * `ask.recalc` — similar to ask.log but omits the chat log. Used by the
 * client when it needs to resync just the spreadsheet state.
 */
export async function handleAskRecalc(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'ask.recalc' }>,
): Promise<void> {
  const [log, snapshot] = await Promise.all([
    ctx.storage.listPrefix('log:'),
    ctx.storage.getSnapshot(),
  ]);
  await ctx.reply({
    type: 'recalc',
    room: msg.room,
    log,
    snapshot: snapshot ?? '',
  });
}

/**
 * `stopHuddle` — auth-gated room reset. Wipes every storage key and
 * broadcasts a `stopHuddle` back so peers drop their local state.
 */
export async function handleStopHuddle(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'stopHuddle' }>,
): Promise<void> {
  if (!(await ctx.verifyAuth())) return;
  await ctx.storage.deleteAll();
  await ctx.broadcast(buildStopHuddleBroadcast(msg), false);
}

/**
 * `ecell` — auth-gated cursor broadcast used for follow-mode. No
 * persistence; we trust `my.ecell` to own the stored-cursor state.
 */
export async function handleEcell(
  ctx: WsContext,
  msg: Extract<ClientMessage, { type: 'ecell' }>,
): Promise<void> {
  if (!(await ctx.verifyAuth())) return;
  await ctx.broadcast(buildEcellBroadcast(msg), false);
}

// ─── Top-level dispatcher ───────────────────────────────────────────────────

/**
 * Route a parsed `ClientMessage` to the matching handler. Exhaustive over
 * the union; TS's `never` branch narrowing enforces updates when a new
 * type is added.
 */
export async function dispatchWsMessage(
  ctx: WsContext,
  msg: ClientMessage,
): Promise<void> {
  switch (msg.type) {
    case 'chat':
      await handleChat(ctx, msg);
      return;
    case 'ask.ecells':
      await handleAskEcells(ctx, msg);
      return;
    case 'my.ecell':
      await handleMyEcell(ctx, msg);
      return;
    case 'execute':
      await handleExecute(ctx, msg);
      return;
    case 'ask.log':
      await handleAskLog(ctx, msg);
      return;
    case 'ask.recalc':
      await handleAskRecalc(ctx, msg);
      return;
    case 'stopHuddle':
      await handleStopHuddle(ctx, msg);
      return;
    case 'ecell':
      await handleEcell(ctx, msg);
      return;
    default: {
      // Exhaustiveness sentinel. If a new ClientMessage variant is added
      // without a handler, TypeScript fails here at compile time.
      const _exhaustive: never = msg;
      void _exhaustive;
    }
  }
}
