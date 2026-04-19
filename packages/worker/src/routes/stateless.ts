/**
 * Stateless Hono route registration — pure logic lives in
 * `../handlers/**` and `../lib/**`, this module is the glue that
 * adapts those pure builders to Hono's Context API.
 *
 * Excluded from the coverage gate per CLAUDE.md §5.2: workerd's bundler
 * doesn't trace Hono-invoked paths through istanbul. Every branch here
 * is exercised via integration tests in `test/stateless.test.ts` + the
 * oracle replay.
 */
/* istanbul ignore file */
import type { Context, Hono } from 'hono';

import { buildBlockedPathResponse } from '../handlers/blocked-paths.ts';
import { buildNewRoomRedirect } from '../handlers/new-room.ts';
import { buildRoomRedirect, type RoomMode } from '../handlers/room-redirects.ts';
import type { Env } from '../env.ts';

type AppContext = Context<{ Bindings: Env }>;

/**
 * Express's `res.redirect()` emits a plaintext body of the form
 * `Found. Redirecting to <url>` plus `Content-Type: text/plain; charset=UTF-8`
 * (uppercase UTF-8 is Express convention). Hono's `c.redirect` omits
 * both the body and the content-type. To stay oracle-byte-compatible
 * we reproduce Express's shape here; the body is informational (user
 * agents follow the Location header regardless), but having it match
 * lets `bodyMatcher: "ignore"` scenarios keep their pass-through and
 * any future `bodyMatcher: "exact"` scenarios still line up.
 */
function expressRedirect(location: string): Response {
  const body = `Found. Redirecting to ${location}`;
  return new Response(body, {
    status: 302,
    headers: {
      Location: location,
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Length': String(body.length),
      Vary: 'Accept',
    },
  });
}

/**
 * Register every stateless route (non-room-backed, non-WS). Ordering
 * matters: the specific `/:room/edit` etc come before any catch-all
 * registration in the caller, so Hono's trie routes them correctly.
 */
export function registerStateless(app: Hono<{ Bindings: Env }>): void {
  // Blocked paths — legacy reserves `/etc/*` and `/var/*` explicitly so
  // a stray probe from `/etc/passwd` doesn't fall through to `/:room`.
  app.get('/etc/*', (c: AppContext) => sendBlocked(c));
  app.get('/var/*', (c: AppContext) => sendBlocked(c));

  // `/_new` and `/=_new` — auto-generate a room id and 302 there.
  app.get('/_new', (c) => {
    const info = buildNewRoomRedirect({
      basepath: c.env.BASEPATH ?? '',
      hasKey: Boolean(c.env.ETHERCALC_KEY),
      multi: false,
    });
    return expressRedirect(info.headers.Location);
  });
  app.get('/=_new', (c) => {
    const info = buildNewRoomRedirect({
      basepath: c.env.BASEPATH ?? '',
      hasKey: Boolean(c.env.ETHERCALC_KEY),
      multi: true,
    });
    return expressRedirect(info.headers.Location);
  });

  // Room redirects — /:room/edit|view|app. The `:room` path param is
  // URL-decoded by Hono; our `buildRoomRedirect` re-encodes via encodeURI.
  const handleRoomRedirect = (mode: RoomMode) => async (c: AppContext): Promise<Response> => {
    const room = c.req.param('room') ?? '';
    // `exactOptionalPropertyTypes` forces us to omit `key` when it's
    // undefined (empty string is fine — computeAuth treats it as unset).
    const key = c.env.ETHERCALC_KEY;
    const redirect = await buildRoomRedirect(
      key === undefined
        ? { basepath: c.env.BASEPATH ?? '', room, mode }
        : { basepath: c.env.BASEPATH ?? '', room, mode, key },
    );
    // `edit`/`view`/`app` always produce a redirect (never null).
    return expressRedirect(redirect!.headers.Location);
  };
  app.get('/:room/edit', handleRoomRedirect('edit'));
  app.get('/:room/view', handleRoomRedirect('view'));
  app.get('/:room/app', handleRoomRedirect('app'));
}

function sendBlocked(_c: AppContext): Response {
  const r = buildBlockedPathResponse();
  // Content-Length: 0 — matches oracle recording. Hono's Response
  // constructor doesn't auto-set this for an empty body, so we set it.
  return new Response(r.body, {
    status: r.status,
    headers: { ...r.headers, 'Content-Length': '0' },
  });
}
