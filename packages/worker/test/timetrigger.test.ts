import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeAll, beforeEach, describe, it, expect } from 'vite-plus/test';

import worker from '../src/index.ts';
import { runScheduled } from '../src/scheduled.ts';

/**
 * Phase 9 integration: the backwards-compat `GET /_timetrigger` HTTP
 * endpoint. Round-trip shape:
 *   1. Seed `cron_triggers` with a mix of due / future rows.
 *   2. Hit `/_timetrigger`.
 *   3. Assert the response JSON shape matches the remaining (pruned)
 *      rows as a `<room>!<cell>: "t1,t2,..."` hash.
 *
 * We seed via direct D1 writes against the test binding; the endpoint
 * itself handles the delete side-effect for due rows. We do NOT assert
 * the DO-side `fire-trigger` call here because a stubbed DO namespace
 * isn't reachable through `worker.fetch` — that's covered in
 * `test/scheduled.node.test.ts`.
 */
const OPERATOR_TOKEN = 'timetrigger-test-token';

beforeAll(async () => {
  const db = (env as unknown as { DB: D1Database }).DB;
  // Apply both migrations (rooms + cron_triggers).
  await db.exec(
    'CREATE TABLE IF NOT EXISTS rooms (room TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, cors_public INTEGER NOT NULL DEFAULT 0)',
  );
  await db.exec(
    'CREATE TABLE IF NOT EXISTS cron_triggers (room TEXT NOT NULL, cell TEXT NOT NULL, fire_at INTEGER NOT NULL, PRIMARY KEY (room, cell, fire_at))',
  );
  await db.exec(
    'CREATE INDEX IF NOT EXISTS cron_triggers_fire_at ON cron_triggers(fire_at)',
  );
});

beforeEach(async () => {
  const db = (env as unknown as { DB: D1Database }).DB;
  await db.exec('DELETE FROM cron_triggers');
});

async function request(
  method: string,
  path: string,
  authorization: string | null = `Bearer ${OPERATOR_TOKEN}`,
) {
  const headers = new Headers();
  if (authorization !== null) headers.set('Authorization', authorization);
  const req = new Request(`https://example.test${path}`, { method, headers });
  const ctx = createExecutionContext();
  const runtimeEnv = {
    ...env,
    ETHERCALC_MIGRATE_TOKEN: OPERATOR_TOKEN,
  };
  const res = await worker.fetch(req, runtimeEnv as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

describe('GET /_timetrigger', () => {
  it('is hidden when disabled and rejects missing or bad bearer tokens', async () => {
    const ctx = createExecutionContext();
    const disabled = await worker.fetch(
      new Request('https://example.test/_timetrigger'),
      env as never,
      ctx,
    );
    const missing = await request('GET', '/_timetrigger', null);
    const bad = await request('GET', '/_timetrigger', 'Bearer wrong');
    expect(disabled.status).toBe(404);
    expect(missing.status).toBe(401);
    expect(bad.status).toBe(401);
  });

  it('returns {} when cron_triggers is empty', async () => {
    const res = await request('GET', '/_timetrigger');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/application\/json/);
    expect(await res.json()).toEqual({});
  });

  it('returns only the remaining rows (future fire_at)', async () => {
    const db = (env as unknown as { DB: D1Database }).DB;
    // Seed both far-future and far-past triggers; only the future ones
    // survive after the endpoint runs.
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('r1', 'A1', 99999999)
      .run();
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('r1', 'A1', 1)
      .run();
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('r2', 'B2', 99999998)
      .run();

    const res = await request('GET', '/_timetrigger');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, string>;
    // r1's past fire_at=1 is pruned; future 99999999 remains.
    expect(body['r1!A1']).toBe('99999999');
    expect(body['r2!B2']).toBe('99999998');
    // Sanity: the past row was deleted from D1.
    const remaining = await db
      .prepare('SELECT fire_at FROM cron_triggers WHERE room = ?1 AND cell = ?2')
      .bind('r1', 'A1')
      .all<{ fire_at: number }>();
    expect(remaining.results.map((r) => r.fire_at)).toEqual([99999999]);
  });

  it('atomically claims a due row across concurrent scheduler invocations', async () => {
    const db = (env as unknown as { DB: D1Database }).DB;
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('concurrent room', 'A1', 1)
      .run();

    const runtimeEnv = env as unknown as Parameters<typeof runScheduled>[0]['env'];
    const [first, second] = await Promise.all([
      runScheduled({ env: runtimeEnv, nowMinutes: 2 }),
      runScheduled({ env: runtimeEnv, nowMinutes: 2 }),
    ]);
    expect(first.fired.length + second.fired.length).toBe(1);
    const remaining = await db
      .prepare('SELECT COUNT(*) AS count FROM cron_triggers')
      .first<{ count: number }>();
    expect(remaining?.count).toBe(0);
  });

  it('groups multiple future fire_at into a comma list', async () => {
    const db = (env as unknown as { DB: D1Database }).DB;
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('r', 'A1', 99999998)
      .run();
    await db
      .prepare(
        'INSERT INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
      )
      .bind('r', 'A1', 99999999)
      .run();

    const res = await request('GET', '/_timetrigger');
    const body = (await res.json()) as Record<string, string>;
    expect(body['r!A1']).toBe('99999998,99999999');
  });
});
