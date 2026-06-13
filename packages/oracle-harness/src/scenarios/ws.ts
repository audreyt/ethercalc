import type { WsScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  MINIMAL_SCSAVE,
  ORACLE_PHASE3_WS_ROOM,
  requestBodyBase64,
} from './fixtures.ts';

const WS_USER = 'oracle-harness';
const WS_USER_B = 'oracle-harness-peer';
const WS_AUTH = 'harness';
const SCSAVE_HEADERS = {
  'Content-Type': 'text/x-socialcalc; charset=utf-8',
} as const;

function wsConnectUrl(room: string, user: string = WS_USER): string {
  return `/_ws/${room}?user=${user}&auth=${WS_AUTH}`;
}

/**
 * Inline PUT that seeds the WS room snapshot. Shared by the verb
 * scenarios so the room exists (and `ask.log`/`ask.recalc` can return a
 * snapshot) before any client connects.
 */
const SEED_WS_ROOM = {
  type: 'http',
  request: {
    method: 'PUT',
    path: `/_/${ORACLE_PHASE3_WS_ROOM}`,
    headers: SCSAVE_HEADERS,
    bodyBase64: requestBodyBase64(MINIMAL_SCSAVE),
  },
} as const;

/**
 * WS scenarios exercise the native `/_ws/:room` path on the worker and
 * socket.io 1.x (via socket.io-client) on the legacy oracle. The harness
 * picks the wire format from `wsTransport` (socket.io for record, native
 * for replay) while scenario steps stay identical.
 */

export const WS_CONNECT: WsScenario = {
  name: 'ws/connect',
  kind: 'ws',
  steps: [
    { type: 'connect', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'close' },
  ],
};

export const WS_ASK_LOG: WsScenario = {
  name: 'ws/ask-log',
  kind: 'ws',
  steps: [
    {
      type: 'http',
      request: {
        method: 'PUT',
        path: `/_/${ORACLE_PHASE3_WS_ROOM}`,
        headers: SCSAVE_HEADERS,
        bodyBase64: requestBodyBase64(MINIMAL_SCSAVE),
      },
    },
    { type: 'connect', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    {
      type: 'send',
      msg: { type: 'ask.log', room: ORACLE_PHASE3_WS_ROOM, user: WS_USER },
    },
    {
      type: 'expect',
      msg: { type: 'log', room: ORACLE_PHASE3_WS_ROOM },
      match: 'partial',
    },
    { type: 'close' },
  ],
};

export const WS_EXECUTE_COMMAND: WsScenario = {
  name: 'ws/execute-command',
  kind: 'ws',
  steps: [
    {
      type: 'http',
      request: {
        method: 'PUT',
        path: `/_/${ORACLE_PHASE3_WS_ROOM}`,
        headers: SCSAVE_HEADERS,
        bodyBase64: requestBodyBase64(MINIMAL_SCSAVE),
      },
    },
    { type: 'connect', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    {
      type: 'send',
      msg: {
        type: 'execute',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        auth: WS_AUTH,
        cmdstr: 'set A1 text t ws-phase3',
      },
    },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      msg: { type: 'ask.log', room: ORACLE_PHASE3_WS_ROOM, user: WS_USER },
    },
    {
      type: 'expect',
      msg: { type: 'log', room: ORACLE_PHASE3_WS_ROOM },
      match: 'partial',
    },
    { type: 'close' },
  ],
};

/**
 * `chat` — server appends to the chat log and broadcasts to every OTHER
 * peer (never the sender; legacy relies on the sender echoing locally).
 * Two clients: `a` sends, `b` must receive the `{type:'chat', room, user,
 * msg}` frame.
 */
export const WS_CHAT: WsScenario = {
  name: 'ws/chat',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', id: 'a', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'connect', id: 'b', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM, WS_USER_B) },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      id: 'a',
      msg: {
        type: 'chat',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        msg: 'hello-from-oracle',
      },
    },
    {
      type: 'expect',
      id: 'b',
      msg: {
        type: 'chat',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        msg: 'hello-from-oracle',
      },
      match: 'partial',
    },
    { type: 'close', id: 'a' },
    { type: 'close', id: 'b' },
  ],
};

/**
 * `ask.ecells` — reply ONLY to the requester with the full ecell cursor
 * map. No peers observe it. Single client. On a fresh room the map is
 * empty, so we partial-match the envelope (`type` + `room`).
 */
export const WS_ASK_ECELLS: WsScenario = {
  name: 'ws/ask-ecells',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'send', msg: { type: 'ask.ecells', room: ORACLE_PHASE3_WS_ROOM } },
    {
      type: 'expect',
      msg: { type: 'ecells', room: ORACLE_PHASE3_WS_ROOM },
      match: 'partial',
    },
    { type: 'close' },
  ],
};

/**
 * `ask.ecell` (singular) — cursor-poll rebroadcast to peers (not the
 * sender). Two clients: `a` asks, `b` receives the `{type:'ask.ecell',
 * room, user}` frame and (in a real client) would reply with its own
 * `ecell`.
 */
export const WS_ASK_ECELL: WsScenario = {
  name: 'ws/ask-ecell',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', id: 'a', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'connect', id: 'b', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM, WS_USER_B) },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      id: 'a',
      msg: { type: 'ask.ecell', room: ORACLE_PHASE3_WS_ROOM, user: WS_USER },
    },
    {
      type: 'expect',
      id: 'b',
      msg: { type: 'ask.ecell', room: ORACLE_PHASE3_WS_ROOM, user: WS_USER },
      match: 'partial',
    },
    { type: 'close', id: 'a' },
    { type: 'close', id: 'b' },
  ],
};

/**
 * `my.ecell` — persist the sender's cursor and broadcast it to peers
 * (not the sender). Two clients: `a` moves, `b` receives the
 * `{type:'my.ecell', room, user, ecell}` frame.
 */
export const WS_MY_ECELL: WsScenario = {
  name: 'ws/my-ecell',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', id: 'a', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'connect', id: 'b', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM, WS_USER_B) },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      id: 'a',
      msg: {
        type: 'my.ecell',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        ecell: 'B2',
      },
    },
    {
      type: 'expect',
      id: 'b',
      msg: {
        type: 'my.ecell',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        ecell: 'B2',
      },
      match: 'partial',
    },
    { type: 'close', id: 'a' },
    { type: 'close', id: 'b' },
  ],
};

/**
 * `ask.recalc` — reply ONLY to the requester with `{type:'recalc', room,
 * log, snapshot}` (like `ask.log` but without the chat log). Single
 * client; the seeded room has a snapshot so `log` is empty. We
 * partial-match the envelope (`type` + `room`).
 */
export const WS_ASK_RECALC: WsScenario = {
  name: 'ws/ask-recalc',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'send', msg: { type: 'ask.recalc', room: ORACLE_PHASE3_WS_ROOM } },
    {
      type: 'expect',
      msg: { type: 'recalc', room: ORACLE_PHASE3_WS_ROOM },
      match: 'partial',
    },
    { type: 'close' },
  ],
};

/**
 * `stopHuddle` — auth-gated room reset. The server wipes storage and
 * broadcasts `{type:'stopHuddle', room}` to peers (not the sender). With
 * no server KEY the `auth=harness` handshake passes the identity check.
 * Two clients: `a` triggers, `b` receives the broadcast.
 */
export const WS_STOP_HUDDLE: WsScenario = {
  name: 'ws/stop-huddle',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', id: 'a', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'connect', id: 'b', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM, WS_USER_B) },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      id: 'a',
      msg: { type: 'stopHuddle', room: ORACLE_PHASE3_WS_ROOM, auth: WS_AUTH },
    },
    {
      type: 'expect',
      id: 'b',
      msg: { type: 'stopHuddle', room: ORACLE_PHASE3_WS_ROOM },
      match: 'partial',
    },
    { type: 'close', id: 'a' },
    { type: 'close', id: 'b' },
  ],
};

/**
 * `ecell` — auth-gated follow-mode cursor broadcast to peers (not the
 * sender); no persistence. Two clients: `a` broadcasts its cursor, `b`
 * receives the `{type:'ecell', room, user, ecell}` frame.
 */
export const WS_ECELL: WsScenario = {
  name: 'ws/ecell',
  kind: 'ws',
  steps: [
    SEED_WS_ROOM,
    { type: 'connect', id: 'a', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM) },
    { type: 'connect', id: 'b', url: wsConnectUrl(ORACLE_PHASE3_WS_ROOM, WS_USER_B) },
    { type: 'sleep', ms: 50 },
    {
      type: 'send',
      id: 'a',
      msg: {
        type: 'ecell',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        ecell: 'C3',
        auth: WS_AUTH,
      },
    },
    {
      type: 'expect',
      id: 'b',
      msg: {
        type: 'ecell',
        room: ORACLE_PHASE3_WS_ROOM,
        user: WS_USER,
        ecell: 'C3',
      },
      match: 'partial',
    },
    { type: 'close', id: 'a' },
    { type: 'close', id: 'b' },
  ],
};

export const WS_SCENARIOS: readonly WsScenario[] = [
  WS_CONNECT,
  WS_ASK_LOG,
  WS_EXECUTE_COMMAND,
  WS_CHAT,
  WS_ASK_ECELLS,
  WS_ASK_ECELL,
  WS_MY_ECELL,
  WS_ASK_RECALC,
  WS_STOP_HUDDLE,
  WS_ECELL,
];