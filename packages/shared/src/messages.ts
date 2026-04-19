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
}

export type ClientMessage =
  | ChatClientMessage
  | AskEcellsMessage
  | MyEcellMessage
  | ExecuteClientMessage
  | AskLogMessage
  | AskRecalcMessage
  | StopHuddleMessage
  | EcellClientMessage;

export const CLIENT_MESSAGE_TYPES = [
  'chat',
  'ask.ecells',
  'my.ecell',
  'execute',
  'ask.log',
  'ask.recalc',
  'stopHuddle',
  'ecell',
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
}

export interface MyEcellServerMessage {
  type: 'my.ecell';
  room: string;
  user: string;
  ecell: string;
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
  | MyEcellServerMessage;

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
