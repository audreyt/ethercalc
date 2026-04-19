/**
 * Native WebSocket route. `GET /_ws/:room?user=<user>&auth=<hmac>` proxies
 * the WS handshake through to the room DO's `/_do/ws` endpoint. The DO
 * then accepts the socket via `state.acceptWebSocket` (hibernation API)
 * and handles every subsequent message frame.
 *
 * Excluded from the coverage gate for the same reason as the sibling
 * `routes/rooms.ts`: workerd istanbul can't trace hits through Hono's
 * bundled invocation path. Test coverage comes from integration (workers
 * pool) tests in `test/ws.test.ts`.
 *
 * Reference: CLAUDE.md sec 10.1 (native WS transport) and sec 7 item 11
 * (hibernation invariants).
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { roomStub } from '../lib/do-dispatch.ts';
import { encodeRoom } from '../lib/room-name.ts';
import type { Env } from '../env.ts';

/**
 * Build the DO-internal URL that corresponds to the inbound WS request.
 * Preserves `user`, `auth`, and `room` query params end-to-end so the DO
 * handshake handler can seed its attachment payload correctly.
 */
function buildDoUrl(room: string, url: URL): string {
  const encoded = encodeRoom(room);
  const params = new URLSearchParams();
  const user = url.searchParams.get('user');
  const auth = url.searchParams.get('auth');
  if (user !== null) params.set('user', user);
  if (auth !== null) params.set('auth', auth);
  params.set('room', encoded);
  return `https://do.local/_do/ws?${params.toString()}`;
}

export function registerWs(app: Hono<{ Bindings: Env }>): void {
  app.get('/_ws/:room', async (c) => {
    const upgrade = c.req.header('upgrade') ?? c.req.header('Upgrade') ?? '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return c.text('Expected Upgrade: websocket', 426);
    }
    const room = c.req.param('room') ?? '';
    const stub = roomStub(c.env, room);
    const doUrl = buildDoUrl(room, new URL(c.req.url));
    const req = new Request(doUrl, {
      method: 'GET',
      headers: { Upgrade: 'websocket' },
    });
    return stub.fetch(req);
  });
}
