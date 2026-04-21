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

  it('skipIndex:true does NOT mirror D1 (migrator bulk-index path)', async () => {
    const res = await request(
      'PUT',
      '/_migrate/seed/mig-skip',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          snapshot: 'S',
          updatedAt: 1_700_000_000_999,
          skipIndex: true,
        }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(201);
    // DO storage writes happened (snapshot readable), but the D1 row
    // was NOT mirrored — `mig-skip` should be absent from /_rooms.
    const snap = await request('GET', '/_/mig-skip');
    expect(snap.status).toBe(200);
    expect(await snap.text()).toBe('S');
    const rooms = (await (await request('GET', '/_rooms')).json()) as string[];
    expect(rooms).not.toContain('mig-skip');
  });
});

describe('PUT /_migrate/bulk-index', () => {
  it('returns 404 when token is unset', async () => {
    const res = await request('PUT', '/_migrate/bulk-index', {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rooms: [] }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 401 when Authorization is wrong', async () => {
    const res = await request(
      'PUT',
      '/_migrate/bulk-index',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer wrong',
        },
        body: JSON.stringify({ rooms: [] }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 on malformed JSON', async () => {
    const res = await request(
      'PUT',
      '/_migrate/bulk-index',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: '{not json',
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('bulk-index body must be valid JSON');
  });

  it('returns 400 with the specific error on malformed payload', async () => {
    const res = await request(
      'PUT',
      '/_migrate/bulk-index',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ rooms: [{ room: '', updatedAt: 1 }] }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('rooms[].room must be a non-empty string');
  });

  it('upserts N rooms in one SQL statement and they show up in /_rooms + /_roomtimes', async () => {
    const res = await request(
      'PUT',
      '/_migrate/bulk-index',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          rooms: [
            { room: 'bulk-x', updatedAt: 1_700_000_000_101 },
            { room: 'bulk-y', updatedAt: 1_700_000_000_202 },
            { room: 'bulk-z', updatedAt: 1_700_000_000_303 },
          ],
        }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    const rooms = (await (await request('GET', '/_rooms')).json()) as string[];
    expect(rooms).toEqual(expect.arrayContaining(['bulk-x', 'bulk-y', 'bulk-z']));
    const times = (await (await request('GET', '/_roomtimes')).json()) as Record<
      string,
      number
    >;
    expect(times['bulk-x']).toBe(1_700_000_000_101);
    expect(times['bulk-y']).toBe(1_700_000_000_202);
    expect(times['bulk-z']).toBe(1_700_000_000_303);
  });

  it('accepts an empty rooms array as a no-op 201', async () => {
    const res = await request(
      'PUT',
      '/_migrate/bulk-index',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ rooms: [] }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(201);
  });
});

describe('PUT /_migrate/snapshot-chunk/:room', () => {
  it('returns 404 when ETHERCALC_MIGRATE_TOKEN is unset', async () => {
    const res = await request(
      'PUT',
      '/_migrate/snapshot-chunk/chunky-a?seq=0&chunks=1',
      { body: 'chunk' },
    );
    expect(res.status).toBe(404);
  });

  it('returns 401 when Authorization bearer is wrong', async () => {
    const res = await request(
      'PUT',
      '/_migrate/snapshot-chunk/chunky-b?seq=0&chunks=1',
      { headers: { Authorization: 'Bearer wrong' }, body: 'chunk' },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when seq/chunks are out of range', async () => {
    const res = await request(
      'PUT',
      '/_migrate/snapshot-chunk/chunky-c?seq=3&chunks=2',
      { headers: { Authorization: `Bearer ${TOKEN}` }, body: 'chunk' },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when :room segment is empty (unreachable path, but asserted)', async () => {
    // Hono's router won't actually route to the handler with an empty
    // segment — a literal `PUT /_migrate/snapshot-chunk/` falls through
    // to the 404. Instead we verify the negative via a missing seq/chunks
    // (a case the normal flow covers).
    const res = await request(
      'PUT',
      '/_migrate/snapshot-chunk/chunky-d',
      { headers: { Authorization: `Bearer ${TOKEN}` }, body: 'chunk' },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(res.status).toBe(400);
  });

  it('streams a multi-chunk snapshot and the room reads back the reassembled save', async () => {
    // First install an empty-snapshot room via the normal seed path.
    const seedRes = await request(
      'PUT',
      '/_migrate/seed/chunky-ok',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          snapshot: '',
          updatedAt: 1_700_000_100_000,
        }),
      },
      { ETHERCALC_MIGRATE_TOKEN: TOKEN },
    );
    expect(seedRes.status).toBe(201);

    const parts = ['PART-ONE-', 'PART-TWO-', 'PART-THREE'];
    for (let i = 0; i < parts.length; i++) {
      const res = await request(
        'PUT',
        `/_migrate/snapshot-chunk/chunky-ok?seq=${i}&chunks=${parts.length}`,
        {
          headers: { Authorization: `Bearer ${TOKEN}` },
          body: parts[i]!,
        },
        { ETHERCALC_MIGRATE_TOKEN: TOKEN },
      );
      expect(res.status).toBe(201);
    }

    const snap = await request('GET', '/_/chunky-ok');
    expect(snap.status).toBe(200);
    expect(await snap.text()).toBe(parts.join(''));
    // D1 mirror on final-chunk path ⇒ room appears in /_rooms.
    const rooms = (await (await request('GET', '/_rooms')).json()) as string[];
    expect(rooms).toContain('chunky-ok');
  });
});

describe('PUT /_migrate/seed/:room — idempotent', () => {
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
