/**
 * WebSocket protocol between the EtherCalc client and server.
 *
 * Transport: one WS per user per room at `wss://<host>/_ws/:room?user=<user>&auth=<hmac>`.
 * Wire format: JSON, one message per frame, shape `{ type: <discriminator>, ...payload }`.
 *
 * Parity reference: legacy `src/main.ls:484` `@on data:` switch statement.
 * The legacy socket.io 0.9 protocol is NOT represented here — it's translated
 * at the edge by the `/socket.io/*` compatibility shim.
 */

// ─── Client → Server ───────────────────────────────────────────────────────

export interface ChatClientMessage {
  type: 'chat';
  room: string;
  user: string;
  msg: string;
}

export interface AskEcellsMessage {
  type: 'ask.ecells';
  room: string;
}

export interface MyEcellMessage {
  type: 'my.ecell';
  room: string;
  user: string;
  ecell: string;
}

export interface ExecuteClientMessage {
  type: 'execute';
  room: string;
  user: string;
  auth?: string;
  cmdstr: string;
}

export interface AskLogMessage {
  type: 'ask.log';
  room: string;
  user: string;
}

export interface AskRecalcMessage {
  type: 'ask.recalc';
  room: string;
}

export interface StopHuddleMessage {
  type: 'stopHuddle';
  room: string;
  auth?: string;
}

export interface EcellClientMessage {
  type: 'ecell';
  room: string;
  user: string;
  ecell: string;
  original?: string;
  auth?: string;
  /**
   * Private-channel targeting. When set, the server rebroadcasts to all
   * peers but only the peer whose username matches `to` acts on it —
   * everyone else drops it in the client dispatcher. Used by the
   * ask.ecell → ecell reply flow (legacy `player.ls:122`).
   */
  to?: string;
}

/**
 * `ask.ecell` (singular) — "tell me where you are" cursor-poll broadcast.
 *
 * Legacy (`src/player-broadcast.ls:21`): every time the local client's
 * `DoPositionCalculations` runs (scroll, resize, refocus), it sends
 * `ask.ecell`. The legacy server's catch-all `@on data` broadcasts it to
 * every peer in the room. Peers receive it and reply with their own
 * `ecell` coordinate targeted at the asker via `to: <user>`.
 *
 * Our server had no catch-all and no explicit `ask.ecell` handler, so the
 * frame was silently dropped and remote cursors went stale whenever a
 * peer scrolled. Found during the 2026-04-20 browser smoke sweep.
 */
export interface AskEcellClientMessage {
  type: 'ask.ecell';
  room: string;
  user: string;
}

export type ClientMessage =
  | ChatClientMessage
  | AskEcellsMessage
  | MyEcellMessage
  | ExecuteClientMessage
  | AskLogMessage
  | AskRecalcMessage
  | StopHuddleMessage
  | EcellClientMessage
  | AskEcellClientMessage;

export const CLIENT_MESSAGE_TYPES = [
  'chat',
  'ask.ecells',
  'my.ecell',
  'execute',
  'ask.log',
  'ask.recalc',
  'stopHuddle',
  'ecell',
  'ask.ecell',
] as const satisfies readonly ClientMessage['type'][];

/** Per-frame and per-field bounds enforced before messages reach a room DO. */
export const MAX_WS_FRAME_CHARS = 1024 * 1024;
export const MAX_WS_ROOM_CHARS = 2_048;
export const MAX_WS_USER_CHARS = 256;
export const MAX_WS_AUTH_CHARS = 512;
export const MAX_WS_CHAT_CHARS = 16 * 1024;
export const MAX_WS_CELL_CHARS = 64;
/** Durable Object values must stay below 128 KiB including key overhead. */
export const MAX_COMMAND_UTF8_BYTES = 120 * 1024;

// ─── Server → Client ───────────────────────────────────────────────────────

export interface LogServerMessage {
  type: 'log';
  room: string;
  log: readonly string[];
  chat: readonly string[];
  snapshot: string;
}

export interface RecalcServerMessage {
  type: 'recalc';
  room: string;
  log: readonly string[];
  snapshot: string;
  force?: boolean;
}

export interface SnapshotServerMessage {
  type: 'snapshot';
  snapshot: string;
}

export interface EcellsServerMessage {
  type: 'ecells';
  room: string;
  ecells: Record<string, string>;
}

export interface ExecuteServerMessage {
  type: 'execute';
  room: string;
  user: string;
  auth?: string;
  cmdstr: string;
  include_self?: boolean;
}

export interface ChatServerMessage {
  type: 'chat';
  room: string;
  user: string;
  msg: string;
}

export interface ConfirmEmailSentMessage {
  type: 'confirmemailsent';
  message: string;
}

export interface IgnoreMessage {
  type: 'ignore';
}

export interface StopHuddleServerMessage {
  type: 'stopHuddle';
  room: string;
  auth?: string;
}

export interface EcellServerMessage {
  type: 'ecell';
  room: string;
  user: string;
  ecell: string;
  original?: string;
  auth?: string;
  /** See `EcellClientMessage.to` — preserved end-to-end. */
  to?: string;
}

export interface MyEcellServerMessage {
  type: 'my.ecell';
  room: string;
  user: string;
  ecell: string;
}

/**
 * `ask.ecell` (singular) rebroadcast to peers. Shape identical to the
 * client-sent frame — same `user` field that peers use to target their
 * reply via `ecell` with `to: user`. See `AskEcellClientMessage`.
 */
export interface AskEcellServerMessage {
  type: 'ask.ecell';
  room: string;
  user: string;
}

export type ServerMessage =
  | LogServerMessage
  | RecalcServerMessage
  | SnapshotServerMessage
  | EcellsServerMessage
  | ExecuteServerMessage
  | ChatServerMessage
  | ConfirmEmailSentMessage
  | IgnoreMessage
  | StopHuddleServerMessage
  | EcellServerMessage
  | MyEcellServerMessage
  | AskEcellServerMessage;

export const SERVER_MESSAGE_TYPES = [
  'log',
  'recalc',
  'snapshot',
  'ecells',
  'execute',
  'chat',
  'confirmemailsent',
  'ignore',
  'stopHuddle',
  'ecell',
  'my.ecell',
  'ask.ecell',
] as const satisfies readonly ServerMessage['type'][];

// ─── Codec ────────────────────────────────────────────────────────────────

export function encodeMessage(msg: ClientMessage | ServerMessage): string {
  return JSON.stringify(msg);
}

export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MAX_WS_FRAME_CHARS) return null;
  return parseClientMessageValue(safeJsonParse(raw));
}

/** Validate and canonicalize an already-decoded client message value. */
export function parseClientMessageValue(value: unknown): ClientMessage | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const parsed = value as Record<string, unknown>;
  const type = parsed['type'];
  const room = parsed['room'];
  if (
    // `switch` compares strictly, so a non-string `type` can never match a
    // case — dropping this guard changes nothing observable.
    // Stryker disable next-line ConditionalExpression
    typeof type !== 'string' ||
    !isBoundedString(room, MAX_WS_ROOM_CHARS, false)
  ) {
    return null;
  }

  switch (type) {
    case 'chat': {
      const user = parsed['user'];
      const msg = parsed['msg'];
      if (
        !isBoundedString(user, MAX_WS_USER_CHARS) ||
        !isBoundedString(msg, MAX_WS_CHAT_CHARS)
      ) {
        return null;
      }
      return { type, room, user, msg };
    }
    case 'ask.ecells':
    case 'ask.recalc':
      return { type, room };
    case 'my.ecell': {
      const user = parsed['user'];
      const ecell = parsed['ecell'];
      if (
        !isBoundedString(user, MAX_WS_USER_CHARS) ||
        !isBoundedString(ecell, MAX_WS_CELL_CHARS)
      ) {
        return null;
      }
      return { type, room, user, ecell };
    }
    case 'execute': {
      const user = parsed['user'];
      const auth = parsed['auth'];
      const cmdstr = parsed['cmdstr'];
      if (
        !isBoundedString(user, MAX_WS_USER_CHARS) ||
        !isBoundedString(cmdstr, MAX_WS_FRAME_CHARS) ||
        (auth !== undefined && !isBoundedString(auth, MAX_WS_AUTH_CHARS))
      ) {
        return null;
      }
      return {
        type,
        room,
        user,
        cmdstr,
        ...(typeof auth === 'string' ? { auth } : {}),
      };
    }
    case 'ask.log':
    case 'ask.ecell': {
      const user = parsed['user'];
      if (!isBoundedString(user, MAX_WS_USER_CHARS)) return null;
      return { type, room, user };
    }
    case 'stopHuddle': {
      const auth = parsed['auth'];
      if (auth !== undefined && !isBoundedString(auth, MAX_WS_AUTH_CHARS)) {
        return null;
      }
      return {
        type,
        room,
        ...(typeof auth === 'string' ? { auth } : {}),
      };
    }
    case 'ecell': {
      const user = parsed['user'];
      const ecell = parsed['ecell'];
      const original = parsed['original'];
      const auth = parsed['auth'];
      const to = parsed['to'];
      if (
        !isBoundedString(user, MAX_WS_USER_CHARS) ||
        !isBoundedString(ecell, MAX_WS_CELL_CHARS) ||
        (original !== undefined &&
          !isBoundedString(original, MAX_WS_CELL_CHARS)) ||
        (auth !== undefined && !isBoundedString(auth, MAX_WS_AUTH_CHARS)) ||
        (to !== undefined && !isBoundedString(to, MAX_WS_USER_CHARS))
      ) {
        return null;
      }
      return {
        type,
        room,
        user,
        ecell,
        ...(typeof original === 'string' ? { original } : {}),
        ...(typeof auth === 'string' ? { auth } : {}),
        ...(typeof to === 'string' ? { to } : {}),
      };
    }
    default:
      return null;
  }
}

function isBoundedString(
  value: unknown,
  maxChars: number,
  allowEmpty = true,
): value is string {
  return (
    typeof value === 'string' &&
    (allowEmpty || value.length > 0) &&
    value.length <= maxChars
  );
}

/** Validate a command against the DO storage value's UTF-8 byte ceiling. */
export function isStorageSafeCommand(value: unknown): boolean {
  // The length fast-path is an optimisation: any string long enough to trip
  // it also exceeds the byte budget inside the loop below.
  // Stryker disable next-line ConditionalExpression
  if (typeof value !== 'string' || value.length > MAX_COMMAND_UTF8_BYTES) {
    return false;
  }
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (
      code >= 0xd800 &&
      code <= 0xdbff &&
      // A high surrogate at the very end makes `charCodeAt(index + 1)` NaN,
      // and every comparison against NaN is false — so this bounds check only
      // saves the two reads below; removing or widening it cannot change the
      // byte count.
      // Stryker disable next-line all
      index + 1 < value.length &&
      value.charCodeAt(index + 1) >= 0xdc00 &&
      value.charCodeAt(index + 1) <= 0xdfff
    ) {
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
    if (bytes > MAX_COMMAND_UTF8_BYTES) return false;
  }
  return true;
}

export function parseServerMessage(raw: string): ServerMessage | null {
  return parseTypedMessage<ServerMessage>(raw, SERVER_MESSAGE_TYPES);
}

/**
 * Shared parser for discriminated-union JSON messages. The two exported
 * wrappers above just pin the generic + the set of valid type literals.
 *
 * The null/typeof guards intentionally over-check: `safeJsonParse` can
 * return any JSON-representable value (string/number/boolean/null/array/
 * object), and accessing `.type` on a primitive `null` throws. The
 * `typeof parsed !== 'object'` fork ALSO catches arrays (typeof [] ===
 * 'object', but `(Array as { type?: unknown }).type` is undefined — fine
 * for parsing, but a well-formed array input would spuriously reach the
 * `includes` check otherwise). We keep both guards to make the
 * property-access on line `parsed.type` provably safe.
 */
function parseTypedMessage<T extends { readonly type: string }>(
  raw: string,
  allowedTypes: readonly string[],
): T | null {
  const parsed = safeJsonParse(raw);
  // Stryker disable next-line ConditionalExpression: `typeof parsed !== 'object'`
  // is a type-safety guard — primitives (number/string/boolean) don't have a
  // `.type` property, so `includes(undefined)` returns false anyway, producing
  // a null return either way. The guard exists so the subsequent property
  // access is provably safe (and the TS narrowing survives a rename).
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const type = (parsed as { type?: unknown }).type;
  // `includes` handles the non-string case by returning false (SameValueZero
  // comparison), so an explicit `typeof type !== 'string'` guard would be
  // semantically redundant — omitted to shrink the mutation surface.
  if (!allowedTypes.includes(type as string)) return null;
  return parsed as T;
}

/**
 * JSON.parse wrapped so malformed input folds into `null` rather than
 * throwing. The return shape is deliberately `null` (not `undefined`)
 * so callers can pattern-match against the discriminated union of
 * parsed JSON values without ever seeing `undefined`.
 */
function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
    // Returning `null` vs `undefined` in the catch block is observationally
    // equivalent — every call site is `parseTypedMessage`, which guards
    // both values with `=== null` and `typeof !== 'object'` so both fold
    // to the same `null` result. The surviving Stryker mutant (catch →
    // empty block) is a genuine equivalent mutant, not a test gap.
    // Stryker disable next-line BlockStatement
  } catch {
    return null;
  }
}
