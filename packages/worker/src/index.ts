/**
 * EtherCalc Worker entry point. HTTP routing lives in Hono; pure request-
 * handling logic lives in `./handlers/`. This file is intentionally tiny
 * glue — it's excluded from the 100% coverage gate (see `vitest.config.ts`)
 * because istanbul inside `@cloudflare/vitest-pool-workers` doesn't track
 * hits through Hono's bundled invocation path (see AGENTS.md §5.2).
 */
/* istanbul ignore file */
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';

import { buildHealthBody } from './handlers/health.ts';
import {
  clientIpFromHeaders,
  createRateLimitStore,
  isRateLimitExemptPath,
  rateLimitConfigFromEnv,
} from './lib/rate-limit.ts';
import {
  createRateLimitStore as createRoomCreateStore,
  isRoomCreationRoute,
  roomCreateLimitFromEnv,
} from './lib/room-create-limit.ts';
import { sandstormBlocksMutation } from './lib/sandstorm-access.ts';
import { registerAuth } from './routes/auth.ts';
import { registerAssets, registerRoomCatchAll } from './routes/assets.ts';
import { registerExports } from './routes/exports.ts';
import { registerMultiSheetImport } from './routes/multi-import.ts';
import { registerLegacySocketIo } from './routes/legacy-socketio.ts';
import { registerMigrate } from './routes/migrate.ts';
import { registerRoomRoutes } from './routes/rooms.ts';
import { registerStateless } from './routes/stateless.ts';
import { registerTimetrigger } from './routes/timetrigger.ts';
import { registerWs } from './routes/ws.ts';
import { scheduled } from './scheduled.ts';
import type { EtherCalcHonoEnv } from './env.ts';

export { RoomDO } from './room.ts';
export { AuthDO } from './auth-do.ts';
export { scheduled } from './scheduled.ts';

/**
 * Build the root Hono app. Exported for tests so they can construct it
 * with whatever `Env` they need. The default export at the bottom wires
 * the production app.
 *
 * Route ordering rationale: Hono's radix/trie router matches static
 * prefixes before params, so the specific `/:room/edit` etc register
 * cleanly alongside static `/_new`, `/_start`, `/etc/*`, `/var/*`. The
 * generic `/:room` entry-page route registers LAST (via
 * `registerRoomCatchAll`) so future `_rooms`, `_from/:template`, etc
 * additions sit in front of it in the trie. Phase 5 work that lands
 * new `/_*` routes should plug into `registerStateless` or a new
 * `registerRoomCrud` between the two calls — never after
 * `registerRoomCatchAll`.
 */
const rateLimitStore = createRateLimitStore();
const roomCreateStore = createRoomCreateStore();

export function buildApp(): Hono<EtherCalcHonoEnv> {
  const app = new Hono<EtherCalcHonoEnv>();
  // All API endpoints are CORS-friendly — external embeds (hackfoldr,
  // third-party dashboards) fetch /_/:room/csv etc cross-origin.
  app.use('*', cors());
  // Optional self-host abuse belt-and-suspenders (§13 Q7). Default off;
  // when `ETHERCALC_RATELIMIT` is set, apply a per-IP token bucket before
  // routing. Health probes stay exempt.
  app.use('*', async (c, next) => {
    const config = rateLimitConfigFromEnv(c.env);
    if (!config || isRateLimitExemptPath(c.req.path)) {
      await next();
      return;
    }
    const result = rateLimitStore.consume(
      clientIpFromHeaders(c.req.raw.headers),
      config,
    );
    if (!result.allowed) {
      if (result.retryAfterSec != null) {
        c.header('Retry-After', String(result.retryAfterSec));
      }
      return c.text('Too Many Requests', 429);
    }
    await next();
  });
  // SH-3: optional per-IP cap on room-creation endpoints (default off).
  app.use('*', async (c, next) => {
    const config = roomCreateLimitFromEnv(c.env);
    if (
      !config ||
      isRateLimitExemptPath(c.req.path) ||
      !isRoomCreationRoute(c.req.method, c.req.path)
    ) {
      await next();
      return;
    }
    const result = roomCreateStore.consume(
      clientIpFromHeaders(c.req.raw.headers),
      config,
    );
    if (!result.allowed) {
      if (result.retryAfterSec != null) {
        c.header('Retry-After', String(result.retryAfterSec));
      }
      return c.text('Too Many Requests', 429);
    }
    await next();
  });
  // SH-6: Sandstorm viewer role — block mutations without `modify`.
  app.use('*', async (c, next) => {
    if (
      sandstormBlocksMutation(
        c.env,
        c.req.method,
        c.req.path,
        c.req.raw.headers,
      )
    ) {
      return c.text('Forbidden', 403);
    }
    await next();
  });
  // Cap the body of the anonymous write routes (POST `/_`, PUT/POST
  // `/_/:room`) so an unauthenticated client can't force the worker to
  // buffer + persist an unbounded payload (§5). 25 MiB comfortably covers
  // any real interactive snapshot/command batch; genuinely huge rooms are
  // seeded through the token-gated, chunked `/_migrate/*` path which is
  // intentionally not capped here. GET exports under `/_/:room/*` carry no
  // request body, so the limit is a no-op for them.
  const MAX_WRITE_BYTES = 25 * 1024 * 1024;
  app.use('/_', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  app.use('/_/*', bodyLimit({ maxSize: MAX_WRITE_BYTES }));
  app.get('/_health', (c) => c.json(buildHealthBody()));
  // Phase 7: native WS + legacy socket.io shim. Register early so their
  // literal prefixes win against the `/:room` catch-all. `/_ws/:room` is
  // the native transport; `/socket.io/*` covers the old embeds.
  registerWs(app);
  registerLegacySocketIo(app);
  // Phase 9 — backwards-compat `/_timetrigger` endpoint. Registered before
  // the room routes so the `_timetrigger` literal wins against any
  // `/_exists/:room` pattern (same leading underscore). Reads the D1
  // `cron_triggers` table and fires due rows just like `scheduled()`.
  registerTimetrigger(app);
  // Phase 11b — migration seed endpoint (`PUT /_migrate/seed/:room`).
  // Registered before the room routes so the `_migrate` literal prefix
  // wins against `/_/:room` patterns. Gated by `ETHERCALC_MIGRATE_TOKEN`
  // inside the handler; no risk of exposing it accidentally.
  registerMigrate(app);
  // Phase A — passkey ceremonies (`POST /_auth/*`). Registered before the
  // room routes so the `_auth` literal wins against `/:room` patterns.
  // Every route self-gates on `ETHERCALC_AUTH` + the AUTH binding.
  registerAuth(app);
  // Room index + CRUD — register BEFORE stateless so `/_rooms`, `/_exists/:room`,
  // `/_from/:template` etc take precedence over any `/:room`-style catch-all.
  registerRoomRoutes(app);
  // Exports — `/_/:room/<format>` and `/:room.<format>`. Registered after
  // CRUD (so `/_/:room` itself still wins for raw-save) but before the
  // `/:room` catch-all (so `/foo.csv` routes to the csv exporter rather
  // than being treated as a room-entry request).
  registerExports(app);
  registerMultiSheetImport(app);
  registerStateless(app);
  registerAssets(app);
  registerRoomCatchAll(app);
  return app;
}

// Module-worker default export: Cloudflare calls `fetch` for HTTP + WS
// upgrades and `scheduled` for cron triggers (Phase 9). Using the Hono
// app's `.fetch` directly keeps the existing HTTP routing intact.
const _app = buildApp();
export default {
  fetch: _app.fetch.bind(_app),
  scheduled,
};
