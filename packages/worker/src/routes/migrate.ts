/**
 * Phase 11b — `PUT /_migrate/seed/:room` — the worker-level entry point
 * for `@ethercalc/migrate`. Authenticates the caller via
 * `env.ETHERCALC_MIGRATE_TOKEN`, then forwards the full JSON payload to
 * the room DO's `POST /_do/seed` (see `src/room.ts`).
 *
 * Route logic is intentionally thin:
 *   1. `verifyMigrateToken` decides whether to serve the request at all.
 *      An unset token yields `404` (the route is invisible) so production
 *      deploys don't accidentally expose a write primitive.
 *   2. On success we proxy the verbatim body to the DO. Payload validation
 *      lives in `src/handlers/migrate.ts` and runs inside the DO; keeping
 *      the route dumb avoids a second validation surface that could drift.
 *
 * Excluded from the Node coverage gate for the same reason as the other
 * `routes/*.ts` files — `@cloudflare/vitest-pool-workers` istanbul can't
 * follow dispatch through Hono's bundled router. End-to-end coverage is
 * in `test/migrate.test.ts`.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { doFetch } from '../lib/do-dispatch.ts';
import { verifyMigrateToken } from '../lib/migrate-auth.ts';
import type { Env } from '../env.ts';

const TEXT_CT = 'text/plain; charset=utf-8';

export function registerMigrate(app: Hono<{ Bindings: Env }>): void {
  app.put('/_migrate/seed/:room', async (c) => {
    const verdict = verifyMigrateToken(
      c.env.ETHERCALC_MIGRATE_TOKEN,
      c.req.header('Authorization') ?? null,
    );
    if (verdict.kind === 'disabled') {
      return c.text('Not Found', 404, { 'Content-Type': TEXT_CT });
    }
    if (verdict.kind === 'missing' || verdict.kind === 'bad') {
      return c.text('Unauthorized', 401, { 'Content-Type': TEXT_CT });
    }

    const room = c.req.param('room') ?? '';
    if (room.length === 0) {
      return c.text('room segment required', 400, { 'Content-Type': TEXT_CT });
    }

    const body = await c.req.raw.arrayBuffer();
    const res = await doFetch(c.env, room, '/_do/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const text = await res.text();
    return c.text(text, res.status as 201 | 400, { 'Content-Type': TEXT_CT });
  });
}
