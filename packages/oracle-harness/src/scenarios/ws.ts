import type { WsScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  MINIMAL_SCSAVE,
  ORACLE_PHASE3_WS_ROOM,
  requestBodyBase64,
} from './fixtures.ts';

const WS_USER = 'oracle-harness';
const WS_AUTH = 'harness';
const SCSAVE_HEADERS = {
  'Content-Type': 'text/x-socialcalc; charset=utf-8',
} as const;

function wsConnectUrl(room: string): string {
  return `/_ws/${room}?user=${WS_USER}&auth=${WS_AUTH}`;
}

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

export const WS_SCENARIOS: readonly WsScenario[] = [
  WS_CONNECT,
  WS_ASK_LOG,
  WS_EXECUTE_COMMAND,
];