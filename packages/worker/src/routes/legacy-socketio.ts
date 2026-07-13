/**
 * Legacy socket.io v0.9 compatibility shim.
 *
 * Implements the four URL families old embeds (Drupal sheetnode, stale
 * CDNs, etc.) speak:
 *   GET  /socket.io/1/                       handshake
 *   GET  /socket.io/1/websocket/<sid>        WS upgrade
 *   GET  /socket.io/1/xhr-polling/<sid>      long-poll GET
 *   POST /socket.io/1/xhr-polling/<sid>      long-poll POST
 *   GET  /socket.io/socket.io.js             pretend-io() shim script
 *
 * The WS upgrade is forwarded to a sid-keyed RoomDO which accepts the
 * socket via the hibernation API (`state.acceptWebSocket` with a
 * `legacy: true` attachment). That lets the isolate sleep between frames
 * instead of pinning the DO awake with classic `server.accept()` + a JS
 * heartbeat timer. XHR-polling still uses the in-Worker adapter (short-
 * lived HTTP, no pin).
 *
 * Excluded from coverage for the same reason as sibling Hono route files.
 */
/* istanbul ignore file */
import {
  createSocketIoShim,
  type SocketIoShim,
} from '@ethercalc/socketio-shim/adapter';
import { LEGACY_IO_JS } from '@ethercalc/socketio-shim/client/legacy-io';
import { validateSid } from '@ethercalc/socketio-shim/sid';
import type { Hono } from 'hono';

import type { Env } from '../env.ts';

const JS_CT = 'application/javascript; charset=utf-8';

/** Prefix that keeps legacy-sid DOs out of the real room namespace. */
const LEGACY_SID_PREFIX = 'sio:';

let shimInstance: SocketIoShim | null = null;

function ensureShim(): SocketIoShim {
  if (shimInstance) return shimInstance;
  // XHR-polling only. WS upgrades never call into this adapter; they go
  // straight to a hibernatable RoomDO. onClientMessage is unused for the
  // WS path and left as a no-op so polling POSTs of execute frames still
  // parse without throwing (polling embeds that need execute can re-open
  // over websocket — the only transport that reaches the room DO).
  shimInstance = createSocketIoShim({
    onClientMessage: () => {
      /* xhr-poll executes are not room-routed; see file header */
    },
    getNativeWebSocket: () => null,
  });
  return shimInstance;
}

/** Sid-keyed RoomDO that hosts one hibernatable legacy socket.io session. */
function legacySidStub(env: Env, sid: string): DurableObjectStub {
  const id = env.ROOM.idFromName(`${LEGACY_SID_PREFIX}${sid}`);
  return env.ROOM.get(id);
}

export function registerLegacySocketIo(app: Hono<{ Bindings: Env }>): void {
  app.get('/socket.io/socket.io.js', () => {
    return new Response(LEGACY_IO_JS, {
      status: 200,
      headers: {
        'Content-Type': JS_CT,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  });

  app.get('/socket.io/1/', (c) => {
    const shim = ensureShim();
    return shim.handleHandshake(new Request(c.req.url));
  });
  app.get('/socket.io/1', (c) => {
    const shim = ensureShim();
    return shim.handleHandshake(new Request(c.req.url));
  });

  app.get('/socket.io/1/websocket/:sid', async (c) => {
    const upgrade = c.req.header('upgrade') ?? c.req.header('Upgrade') ?? '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return c.text('Expected Upgrade: websocket', 426);
    }
    const sid = c.req.param('sid') ?? '';
    if (!validateSid(sid)) return c.text('Invalid sid', 400);
    // Forward the upgrade to a sid-keyed RoomDO. The DO accepts via the
    // hibernation API (`upgradeLegacySocketIo`) so the socket does not pin
    // any room DO — or this Worker isolate — awake between frames.
    const stub = legacySidStub(c.env, sid);
    const req = new Request('https://do.local/_do/legacy-ws', {
      method: 'GET',
      headers: { Upgrade: 'websocket' },
    });
    return stub.fetch(req);
  });

  app.on(['GET', 'POST'], '/socket.io/1/xhr-polling/:sid', async (c) => {
    const shim = ensureShim();
    const sid = c.req.param('sid') ?? '';
    return shim.handleXhrPoll(c.req.raw, sid);
  });

  app.all('/socket.io/*', (c) => c.text('Not Found', 404));
}
