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
 * The shim itself (@ethercalc/socketio-shim) owns all the translation +
 * framing; this module is a thin adapter to Hono + the DO dispatch layer.
 *
 * Excluded from coverage for the same reason as sibling Hono route files.
 */
/* istanbul ignore file */
import { createSocketIoShim, type WebSocketLike } from '@ethercalc/socketio-shim/adapter';
import { LEGACY_IO_JS } from '@ethercalc/socketio-shim/client/legacy-io';
import type { Hono } from 'hono';

import { roomStub } from '../lib/do-dispatch.ts';
import { encodeRoom } from '../lib/room-name.ts';
import type { Env } from '../env.ts';

const JS_CT = 'application/javascript; charset=utf-8';

let shimInstance: ReturnType<typeof createSocketIoShim> | null = null;

function ensureShim(env: Env): ReturnType<typeof createSocketIoShim> {
  if (shimInstance) return shimInstance;
  shimInstance = createSocketIoShim({
    onClientMessage: (msg) => {
      // Baseline shim: forward execute messages via /_do/commands. Full
      // two-way parity with all WS types requires per-sid WS retention
      // which lands in Phase 7.1 if needed. Embeds only ever send
      // executes in practice.
      if (msg.type !== 'execute') return;
      const stub = roomStub(env, encodeRoom(msg.room));
      void stub.fetch('https://do.local/_do/commands', {
        method: 'POST',
        body: msg.cmdstr,
      });
    },
    getNativeWebSocket: () => null,
  });
  return shimInstance;
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
    const shim = ensureShim(c.env);
    return shim.handleHandshake(new Request(c.req.url));
  });
  app.get('/socket.io/1', (c) => {
    const shim = ensureShim(c.env);
    return shim.handleHandshake(new Request(c.req.url));
  });

  app.get('/socket.io/1/websocket/:sid', (c) => {
    const shim = ensureShim(c.env);
    const upgrade = c.req.header('upgrade') ?? c.req.header('Upgrade') ?? '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return c.text('Expected Upgrade: websocket', 426);
    }
    const sid = c.req.param('sid') ?? '';
    const ctrl = shim.handleWebSocketUpgrade(new Request(c.req.url), sid);
    if (!ctrl) return c.text('Invalid sid', 400);
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    (server as unknown as { accept(): void }).accept();
    const wsLike: WebSocketLike = {
      send: (data: string) => server.send(data),
      close: (code?: number, reason?: string) => server.close(code, reason),
      addEventListener: (type, listener) =>
        server.addEventListener(type, listener as EventListener),
    };
    ctrl.accept(wsLike);
    return new Response(null, { status: 101, webSocket: client });
  });

  app.on(['GET', 'POST'], '/socket.io/1/xhr-polling/:sid', async (c) => {
    const shim = ensureShim(c.env);
    const sid = c.req.param('sid') ?? '';
    return shim.handleXhrPoll(c.req.raw, sid);
  });

  app.all('/socket.io/*', (c) => c.text('Not Found', 404));
}
