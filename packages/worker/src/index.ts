/**
 * EtherCalc Worker entry point. HTTP routing lives in Hono; pure request-
 * handling logic lives in `./handlers/`. This file is intentionally tiny
 * glue — it's excluded from the 100% coverage gate (see `vitest.config.ts`)
 * because istanbul inside `@cloudflare/vitest-pool-workers` doesn't track
 * hits through Hono's bundled invocation path (see CLAUDE.md §5.2).
 */
/* istanbul ignore file */
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { buildHealthBody } from './handlers/health.ts';
import { registerAssets, registerRoomCatchAll } from './routes/assets.ts';
import { registerExports } from './routes/exports.ts';
import { registerLegacySocketIo } from './routes/legacy-socketio.ts';
import { registerMigrate } from './routes/migrate.ts';
import { registerRoomRoutes } from './routes/rooms.ts';
import { registerStateless } from './routes/stateless.ts';
import { registerTimetrigger } from './routes/timetrigger.ts';
import { registerWs } from './routes/ws.ts';
import { scheduled } from './scheduled.ts';
import type { Env } from './env.ts';

export { RoomDO } from './room.ts';
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
export function buildApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  // All API endpoints are CORS-friendly — external embeds (hackfoldr,
  // third-party dashboards) fetch /_/:room/csv etc cross-origin.
  app.use('*', cors());
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
  // Room index + CRUD — register BEFORE stateless so `/_rooms`, `/_exists/:room`,
  // `/_from/:template` etc take precedence over any `/:room`-style catch-all.
  registerRoomRoutes(app);
  // Exports — `/_/:room/<format>` and `/:room.<format>`. Registered after
  // CRUD (so `/_/:room` itself still wins for raw-save) but before the
  // `/:room` catch-all (so `/foo.csv` routes to the csv exporter rather
  // than being treated as a room-entry request).
  registerExports(app);
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
