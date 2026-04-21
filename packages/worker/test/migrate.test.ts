/**
 * Phase 11b — `PUT /_migrate/seed/:room` end-to-end. Drives the route
 * through Hono → DO → storage → D1 using the real workers pool (no
 * mocks). Complements the Node-gated unit tests for `parseSeedPayload`
 * and `verifyMigrateToken`.
 */
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeAll, describe, it, expect } from 'vitest';

import worker from '../src/index.ts';

const TOKEN = 'local-only-test-token';

async function request(
  method: string,
  path: string,
  opts: RequestInit = {},
  extraEnv: Record<string, unknown> = {},
): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { method, ...opts });
  const ctx = createExecutionContext();
  const mergedEnv = {
    ...(env as unknown as Record<string, unknown>),
    ...extraEnv,
  };
  const res = await worker.fetch(req, mergedEnv as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

beforeAll(async () => {
  const db = (env as unknown as { DB: D1Database }).DB;
  await db.exec(
    'CREATE TABLE IF NOT EXISTS rooms (room TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, cors_public INTEGER NOT NULL DEFAULT 0)',
  );
  await db.exec(
    'CREATE INDEX IF NOT EXISTS rooms_updated_at ON rooms(updated_at DESC)',
  );
  await db.exec('DELETE FROM rooms');
});

describe('PUT /_migrate/seed/:room', () => {
  it('returns 404 when ETHERCALC_MIGRATE_TOKEN is unset (route hidden)', async () => {
    const res = await request('PUT', '/_migrate/seed/mig-a', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshot: 'x' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 401 when token configured but Authorization absent', async () => {
    const res = await request(
      'PUT',
      '/_migrate/seed/mig-b',
      {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot: 'x' }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization bearer is wrong', async () => {
    const res = await request(
      'PUT',
      '/_migrate/seed/mig-c',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong',
        },
        body: JSON.stringify({ snapshot: 'x' }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on malformed payload', async () => {
    const res = await request(
      'PUT',
      '/_migrate/seed/mig-d',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ log: 123 }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('log must be a string[]');
  });

  it('seeds snapshot + log + audit + chat + ecell and mirrors D1', async () => {
    const payload = {
      snapshot:
        'socialcalc:version:1.5\n' +
        '--SocialCalcSpreadsheetControlSave--\n' +
        'version:1.5\n' +
        'part:sheet\n' +
        'cell:A1:t:migrated\n',
      log: ['set A1 text migrated'],
      audit: ['set A1 text migrated'],
      chat: ['hello from 2020'],
      ecell: { alice: 'A1', bob: 'B2' },
      updatedAt: 1_700_000_000_000,
    };
    const res = await request(
      'PUT',
      '/_migrate/seed/mig-e',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(payload),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');

    // The room is now readable via every public surface.
    const snap = await request('GET', '/_/mig-e');
    expect(snap.status).toBe(200);
    expect(await snap.text()).toBe(payload.snapshot);

    const rooms = await request('GET', '/_rooms');
    expect(rooms.status).toBe(200);
    expect((await rooms.json()) as string[]).toContain('mig-e');

    const times = (await (await request('GET', '/_roomtimes')).json()) as Record<
      string,
      number
    >;
    expect(times['mig-e']).toBe(1_700_000_000_000);
  });

  it('is idempotent — re-seeding replaces prior state', async () => {
    const common = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    };
    const first = await request(
      'PUT',
      '/_migrate/seed/mig-f',
      {
        ...common,
        body: JSON.stringify({
          snapshot: 'A',
          log: ['first'],
          updatedAt: 100,
        }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(first.status).toBe(201);
    const second = await request(
      'PUT',
      '/_migrate/seed/mig-f',
      {
        ...common,
        body: JSON.stringify({
          snapshot: 'B',
          log: ['second'],
          updatedAt: 200,
        }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(second.status).toBe(201);

    const snap = await request('GET', '/_/mig-f');
    expect(await snap.text()).toBe('B');
    const times = (await (await request('GET', '/_roomtimes')).json()) as Record<
      string,
      number
    >;
    expect(times['mig-f']).toBe(200);
  });
});
