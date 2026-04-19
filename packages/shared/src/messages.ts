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
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const type = (parsed as { type?: unknown }).type;
  if (typeof type !== 'string') return null;
  if (!(CLIENT_MESSAGE_TYPES as readonly string[]).includes(type)) return null;
  return parsed as ClientMessage;
}

export function parseServerMessage(raw: string): ServerMessage | null {
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== 'object') return null;
  const type = (parsed as { type?: unknown }).type;
  if (typeof type !== 'string') return null;
  if (!(SERVER_MESSAGE_TYPES as readonly string[]).includes(type)) return null;
  return parsed as ServerMessage;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
