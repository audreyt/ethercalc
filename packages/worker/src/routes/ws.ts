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
 * Reference: AGENTS.md sec 10.1 (native WS transport) and sec 7 item 11
 * (hibernation invariants).
 */
/* istanbul ignore file */
import type { Hono } from 'hono';
import {
  MAX_WS_AUTH_CHARS,
  MAX_WS_USER_CHARS,
} from '@ethercalc/shared/messages';

import { roomStub } from '../lib/do-dispatch.ts';
import { getSessionPrincipal } from '../lib/session-middleware.ts';
import { parseSessionCookie } from '../lib/session.ts';
import { encodeRoom, isValidRoomName } from '../lib/room-name.ts';
import type { EtherCalcHonoEnv } from '../env.ts';

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

export function registerWs(app: Hono<EtherCalcHonoEnv>): void {
  app.get('/_ws/:room', async (c) => {
    const upgrade = c.req.header('upgrade') ?? c.req.header('Upgrade') ?? '';
    if (upgrade.toLowerCase() !== 'websocket') {
      return c.text('Expected Upgrade: websocket', 426);
    }
    const room = c.req.param('room') ?? '';
    const url = new URL(c.req.url);
    const users = url.searchParams.getAll('user');
    const authValues = url.searchParams.getAll('auth');
    const user = users[0] ?? '';
    const auth = authValues[0] ?? '';
    if (
      !isValidRoomName(room) ||
      users.length > 1 ||
      authValues.length > 1 ||
      user.length > MAX_WS_USER_CHARS ||
      auth.length > MAX_WS_AUTH_CHARS
    ) {
      return c.text('Invalid WebSocket parameters', 400);
    }
    const session = parseSessionCookie(c.req.header('Cookie') ?? null);
    if (session !== null) {
      const expectedOrigin = c.env.ETHERCALC_ORIGIN;
      if (!expectedOrigin || c.req.header('Origin') !== expectedOrigin) {
        return c.text('Forbidden', 403);
      }
    }
    const stub = roomStub(c.env, room);
    const doUrl = buildDoUrl(room, url);
    // The forwarded header set is built from scratch — inbound
    // `X-EC-*` headers are NEVER copied. The DO trusts `X-EC-Uid`
    // (P9 WS identity), so it is stamped exclusively from the verified
    // session principal.
    const fwd = new Headers({ Upgrade: 'websocket' });
    const sandstormPerms = c.req.header('X-Sandstorm-Permissions');
    if (sandstormPerms) {
      fwd.set('X-Sandstorm-Permissions', sandstormPerms);
    }
    const principal = await getSessionPrincipal(c);
    if (principal) {
      fwd.set('X-EC-Uid', principal.uid);
      fwd.set('X-EC-Session-Exp', String(principal.exp));
      if (session !== null) fwd.set('X-EC-Session', session);
    }
    const req = new Request(doUrl, {
      method: 'GET',
      headers: fwd,
    });
    return stub.fetch(req);
  });
}
