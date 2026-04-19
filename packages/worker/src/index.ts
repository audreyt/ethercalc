/**
 * EtherCalc Worker entry point. HTTP routing lives in Hono; pure request-
 * handling logic lives in `./handlers/`. This file is intentionally tiny
 * glue — it's excluded from the 100% coverage gate (see `vitest.config.ts`)
 * because istanbul inside `@cloudflare/vitest-pool-workers` doesn't track
 * hits through Hono's bundled invocation path (see CLAUDE.md §5.2).
 */
/* istanbul ignore file */
import { Hono } from 'hono';

import { buildHealthBody } from './handlers/health.ts';
import { registerAssets, registerRoomCatchAll } from './routes/assets.ts';
import { registerExports } from './routes/exports.ts';
import { registerRoomRoutes } from './routes/rooms.ts';
import { registerStateless } from './routes/stateless.ts';
import type { Env } from './env.ts';

export { RoomDO } from './room.ts';

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
  app.get('/_health', (c) => c.json(buildHealthBody()));
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

export default buildApp();
