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
import { parseBulkIndexPayload } from '../handlers/migrate.ts';
import { verifyMigrateToken } from '../lib/migrate-auth.ts';
import { bulkMirrorRoomsToD1 } from '../lib/rooms-index.ts';
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

  // Batched sibling of the seed endpoint. Callers (the migrator, today)
  // send `PUT /_migrate/bulk-index` with `{rooms: [{room, updatedAt}, …]}`
  // after the seed pass; we fold all rows into ONE D1 INSERT to dodge
  // D1's per-statement primary-region latency. See CLAUDE.md §14
  // 2026-04-21 for the why. Same auth gate as /_migrate/seed.
  app.put('/_migrate/bulk-index', async (c) => {
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

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.text('bulk-index body must be valid JSON', 400, {
        'Content-Type': TEXT_CT,
      });
    }
    const parsed = parseBulkIndexPayload(raw);
    if (!parsed.ok) {
      return c.text(parsed.error, 400, { 'Content-Type': TEXT_CT });
    }
    if (c.env.DB === undefined) {
      // No D1 bound — silently succeed so Node-only tests (and
      // hypothetical self-host configs that skip the cross-room
      // index) don't 500.
      return c.text('OK', 201, { 'Content-Type': TEXT_CT });
    }
    await bulkMirrorRoomsToD1(c.env.DB, parsed.value);
    return c.text('OK', 201, { 'Content-Type': TEXT_CT });
  });

  // Client-side chunked snapshot upload. Used for rooms whose
  // snapshot exceeds CF's ~25 MB request-body limit (the regular
  // /_migrate/seed path can't fit the whole body in one PUT). Flow:
  //   1. Migrator PUTs /_migrate/seed/:room with snapshot = "" and
  //      all other fields as usual. DO lands the room with no
  //      snapshot keys.
  //   2. Migrator PUTs N × /_migrate/snapshot-chunk/:room with query
  //      params `seq=<i>` and `chunks=<N>`. Body is one chunk
  //      (≤100 KiB). DO stores `snapshot:chunk:<padSeq(seq)>` and,
  //      on the final call (seq === chunks-1), writes `snapshot:meta`.
  // Query-param based so individual chunks don't carry JSON framing
  // overhead.
  app.put('/_migrate/snapshot-chunk/:room', async (c) => {
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
    const seq = Number(c.req.query('seq'));
    const chunks = Number(c.req.query('chunks'));
    if (!Number.isInteger(seq) || seq < 0 || !Number.isInteger(chunks) || chunks < 1 || seq >= chunks) {
      return c.text('seq/chunks must be integers with 0 ≤ seq < chunks', 400, {
        'Content-Type': TEXT_CT,
      });
    }
    const body = await c.req.raw.arrayBuffer();
    const res = await doFetch(
      c.env,
      room,
      `/_do/snapshot-chunk?seq=${seq}&chunks=${chunks}`,
      { method: 'POST', body },
    );
    const text = await res.text();
    return c.text(text, res.status as 201 | 400, { 'Content-Type': TEXT_CT });
  });
}
