/**
 * Pure message-dispatch helpers for the native WebSocket layer.
 *
 * The `RoomDO.webSocketMessage` handler needs to make several small, pure
 * decisions on every frame: is this a filterable no-op? Is it the legacy
 * `submitform` special case? What snapshot / auth / chat structure does
 * the reply take? Factoring these into one module keeps `room.ts` focused
 * on storage I/O and lets the Node test runner enforce 100% branch coverage
 * without needing a workerd runtime.
 *
 * References:
 *   - CLAUDE.md sec 6.2 (execute / submitform / ask.log flows)
 *   - CLAUDE.md sec 7 item 12 (text-wiki filter drop)
 *   - CLAUDE.md sec 7 item 22 (submitform include_self=true invariant)
 */
import type {
  AskLogMessage,
  ChatClientMessage,
  ChatServerMessage,
  ClientMessage,
  EcellClientMessage,
  EcellServerMessage,
  EcellsServerMessage,
  ExecuteClientMessage,
  ExecuteServerMessage,
  LogServerMessage,
  MyEcellMessage,
  MyEcellServerMessage,
  StopHuddleMessage,
  StopHuddleServerMessage,
} from '@ethercalc/shared/messages';

/** Legacy filter — server drops this command even when auth checks out. */
const TEXT_WIKI_FILTER = 'set sheet defaulttextvalueformat text-wiki';

/**
 * Returns true when an `execute` command string should be silently dropped
 * without logging or broadcasting. Matches the legacy src/main.ls:502
 * guard: the command is a UI affordance on legacy clients that our
 * SocialCalc port doesn't need — accepting it would dirty the log.
 */
export function isFilteredExecuteCommand(cmdstr: string): boolean {
  return cmdstr === TEXT_WIKI_FILTER;
}

/**
 * Test whether an `execute` payload is the `submitform` special case.
 *
 * Legacy (src/main.ls:518-541): the first line of `cmdstr` — split on a
 * carriage return and trimmed — equals the literal string `submitform`.
 * The remaining lines carry the row data that must be appended to a
 * sibling `<room>_formdata` DO.
 */
export function isSubmitForm(cmdstr: string): boolean {
  if (typeof cmdstr !== 'string' || cmdstr.length === 0) return false;
  // `split('\r')[0]` on a non-empty string always returns a string.
  const firstLine = cmdstr.split('\r')[0] as string;
  return firstLine.trim() === 'submitform';
}

/**
 * Given a `submitform` `execute` command and the room it was sent against,
 * compute the sibling form-data room and return the follow-up commands to
 * append there.
 *
 * Legacy behavior (src/main.ls:522-531):
 *   1. Strip the `submitform` header from the cmd string.
 *   2. If the current room already ends with `_formdata`, use the same
 *      room (idempotent on sub-submits from a form editor that itself
 *      lives in the sibling). Otherwise append `_formdata`.
 *   3. The remaining body lines become the commands to replay on the
 *      sibling — NOT on the source room. The source room sees only the
 *      header execute broadcast back to all peers with `include_self:
 *      true`.
 */
export function computeSubmitFormTarget(
  room: string,
  cmdstr: string,
): { siblingRoom: string; siblingCommands: string } {
  const siblingRoom = room.endsWith('_formdata') ? room : `${room}_formdata`;
  // Drop everything up to and including the first CR. If the command is
  // just the bare word `submitform` with no trailing payload, the sibling
  // commands payload is the empty string.
  const headerEnd = cmdstr.indexOf('\r');
  const siblingCommands = headerEnd === -1 ? '' : cmdstr.slice(headerEnd + 1);
  return { siblingRoom, siblingCommands };
}

/**
 * Shape a `chat` client message into its broadcast server form. The
 * server-emitted `chat` message carries exactly the fields the legacy
 * client consumed on the receiving end (`room`, `user`, `msg`).
 */
export function buildChatBroadcast(msg: ChatClientMessage): ChatServerMessage {
  return { type: 'chat', room: msg.room, user: msg.user, msg: msg.msg };
}

/**
 * Shape an execute-broadcast message. `include_self` is only set when the
 * caller explicitly requests it — legacy treats the missing field and
 * `false` equivalently, but we preserve an explicit `true` because the
 * sec 7 item 22 submitform invariant is tested on presence + truthiness.
 */
export function buildExecuteBroadcast(
  msg: ExecuteClientMessage,
  includeSelf: boolean,
): ExecuteServerMessage {
  const base: ExecuteServerMessage = {
    type: 'execute',
    room: msg.room,
    user: msg.user,
    cmdstr: msg.cmdstr,
  };
  if (msg.auth !== undefined) base.auth = msg.auth;
  if (includeSelf) base.include_self = true;
  return base;
}

/** Shape an ecells-reply broadcast. */
export function buildEcellsReply(
  room: string,
  ecells: Record<string, string>,
): EcellsServerMessage {
  return { type: 'ecells', room, ecells };
}

/** Shape a my.ecell broadcast. */
export function buildMyEcellBroadcast(msg: MyEcellMessage): MyEcellServerMessage {
  return { type: 'my.ecell', room: msg.room, user: msg.user, ecell: msg.ecell };
}

/** Shape an ecell broadcast. */
export function buildEcellBroadcast(msg: EcellClientMessage): EcellServerMessage {
  const out: EcellServerMessage = {
    type: 'ecell',
    room: msg.room,
    user: msg.user,
    ecell: msg.ecell,
  };
  if (msg.original !== undefined) out.original = msg.original;
  if (msg.auth !== undefined) out.auth = msg.auth;
  return out;
}

/** Shape a stopHuddle broadcast. */
export function buildStopHuddleBroadcast(
  msg: StopHuddleMessage,
): StopHuddleServerMessage {
  const out: StopHuddleServerMessage = { type: 'stopHuddle', room: msg.room };
  if (msg.auth !== undefined) out.auth = msg.auth;
  return out;
}

/** Shape the reply to ask.log. */
export function buildLogReply(
  msg: AskLogMessage,
  log: readonly string[],
  chat: readonly string[],
  snapshot: string,
): LogServerMessage {
  return { type: 'log', room: msg.room, log, chat, snapshot };
}

/**
 * Discriminated-union guard over ClientMessage. Keeps the switch
 * exhaustive in room.ts via TS's `never` branch narrowing; this helper
 * exists so the Node test runner can assert we enumerate every legal
 * type.
 */
export function clientMessageType(msg: ClientMessage): ClientMessage['type'] {
  return msg.type;
}
