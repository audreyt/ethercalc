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
import { registerAssets } from './routes/assets.ts';
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
 * generic `/:room` entry-page route is deliberately NOT registered here
 * — it requires Workers Assets integration to serve `index.html` and
 * would shadow future `/_rooms`, `/_from/:template`, etc. See the Phase
 * 4.1 note in FINDINGS for follow-up.
 */
export function buildApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.get('/_health', (c) => c.json(buildHealthBody()));
  registerStateless(app);
  registerAssets(app);
  return app;
}

export default buildApp();
