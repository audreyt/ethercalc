import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeAll, describe, it, expect } from 'vitest';

import worker from '../src/index.ts';

/**
 * Integration: drive the Phase 5 routes through the real Hono app + DO
 * namespace. Covers the create → read → update → delete cycle end-to-end.
 */

async function request(method: string, path: string, opts: RequestInit = {}) {
  const req = new Request(`https://example.test${path}`, { method, ...opts });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

/**
 * Apply the `migrations/0001_rooms.sql` schema to the miniflare-bound
 * D1 database. Miniflare doesn't auto-apply `migrations_dir` contents
 * when invoked via vitest-pool-workers — we do it once before the
 * suite so `/_rooms` etc. can read from the `rooms` table. Also clears
 * any leftover rows between runs (singleWorker + isolatedStorage: false
 * means all tests share the same DB).
 */
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

describe('Phase 5 routes — full round-trip', () => {
  it('POST /_ then GET /_/:room round-trips a save', async () => {
    const body =
      'socialcalc:version:1.5\n--SocialCalcSpreadsheetControlSave--\n';
    const postRes = await request('POST', '/_', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body,
    });
    expect(postRes.status).toBe(201);
    const location = postRes.headers.get('location') ?? '';
    const txtBody = await postRes.text();
    expect(location).toMatch(/^\/_\/[a-z0-9]{12}$/);
    expect(txtBody).toMatch(/^\/[a-z0-9]{12}$/);
    const room = txtBody.slice(1);

    const getRes = await request('GET', `/_/${room}`);
    expect(getRes.status).toBe(200);
    expect(getRes.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await getRes.text()).toBe(body);
  });

  it('POST /_ with explicit room overrides generated id', async () => {
    const res = await request('POST', '/_', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room: 'my-custom-room', snapshot: 'data' }),
    });
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('/my-custom-room');
  });

  it('PUT /_/:room returns 201 OK', async () => {
    const res = await request('PUT', '/_/put-test', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body: 'snapshot-data',
    });
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
  });

  it('GET /_/:room 404s on unknown room', async () => {
    const res = await request('GET', '/_/never-created-room-xyzzy');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('');
  });

  it('DELETE /_/:room returns 201 OK and subsequent GET 404s', async () => {
    await request('PUT', '/_/to-delete', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body: 'data',
    });
    const del = await request('DELETE', '/_/to-delete');
    expect(del.status).toBe(201);
    expect(await del.text()).toBe('OK');

    const get = await request('GET', '/_/to-delete');
    expect(get.status).toBe(404);
  });

  it('GET /_exists/:room returns bare JSON boolean', async () => {
    const a = await request('GET', '/_exists/never-existed');
    expect(a.status).toBe(200);
    expect(a.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await a.text()).toBe('false');

    await request('PUT', '/_/exists-yes', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body: 'x',
    });
    const b = await request('GET', '/_exists/exists-yes');
    expect(await b.text()).toBe('true');
  });

  it('GET /_rooms returns a JSON array containing every room created via the write path', async () => {
    // Create a unique room via POST /_ and assert it appears in /_rooms.
    // Other tests in this file share the D1 table (singleWorker +
    // isolatedStorage: false), so we assert containment rather than
    // equality to stay order-independent.
    const postRes = await request('POST', '/_', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room: 'rooms-index-alpha', snapshot: 'x' }),
    });
    expect(postRes.status).toBe(201);

    const res = await request('GET', '/_rooms');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const rooms = JSON.parse(await res.text()) as string[];
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms).toContain('rooms-index-alpha');
  });

  it('GET /_roomlinks renders an <a>-list HTML body containing every room', async () => {
    await request('POST', '/_', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room: 'roomlinks-alpha', snapshot: 'x' }),
    });
    const res = await request('GET', '/_roomlinks');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('<a href="/roomlinks-alpha">roomlinks-alpha</a>');
  });

  it('GET /_roomtimes returns a JSON hash keyed by room with numeric updated_at', async () => {
    await request('POST', '/_', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room: 'roomtimes-alpha', snapshot: 'x' }),
    });
    const res = await request('GET', '/_roomtimes');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const times = JSON.parse(await res.text()) as Record<string, number>;
    expect(typeof times['roomtimes-alpha']).toBe('number');
    expect(times['roomtimes-alpha']).toBeGreaterThan(0);
  });

  it('DELETE /_/:room removes the room from the D1 mirror index', async () => {
    await request('POST', '/_', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ room: 'delete-me-from-index', snapshot: 'x' }),
    });
    const before = JSON.parse(
      await (await request('GET', '/_rooms')).text(),
    ) as string[];
    expect(before).toContain('delete-me-from-index');

    const del = await request('DELETE', '/_/delete-me-from-index');
    expect(del.status).toBe(201);

    const after = JSON.parse(
      await (await request('GET', '/_rooms')).text(),
    ) as string[];
    expect(after).not.toContain('delete-me-from-index');
  });

  it('GET /_from/:template redirects to a new room with copied snapshot', async () => {
    // Set up a template.
    await request('PUT', '/_/tpl', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body: 'original-data',
    });
    const res = await request('GET', '/_from/tpl');
    expect(res.status).toBe(302);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toMatch(/^\/[a-z0-9]{12}$/);
    const newRoom = loc.slice(1);
    const copyRes = await request('GET', `/_/${newRoom}`);
    expect(await copyRes.text()).toBe('original-data');
  });

  it('GET /_from/:template on non-existent template still 302s to a blank room', async () => {
    const res = await request('GET', '/_from/never-a-template');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/^\/[a-z0-9]{12}$/);
  });

  it('xlsx content-type on PUT returns 501 deferred', async () => {
    const res = await request('PUT', '/_/xlsx-room', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: 'PK\x03\x04',
    });
    expect(res.status).toBe(501);
    expect(await res.text()).toContain('Phase 8');
  });

  it('PUT with text/csv converts and stores', async () => {
    const res = await request('PUT', '/_/csv-room', {
      headers: { 'content-type': 'text/csv' },
      body: 'a,b\n1,2\n',
    });
    expect(res.status).toBe(201);
    const get = await request('GET', '/_/csv-room');
    expect(get.status).toBe(200);
    const saved = await get.text();
    // ConvertOtherFormatToSave emits a SocialCalc save string containing
    // `cell:A1:t:a` etc — we don't pin the exact bytes here (format may
    // contain version lines and metadata) but the sheet sections are
    // expected.
    expect(saved).toContain('cell:');
  });

  // ─── Phase 6: POST /_/:room (commands) ───────────────────────────────

  it('POST /_/:room JSON {command} executes and returns 202', async () => {
    const res = await request('POST', '/_/post-json', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 value n 7' }),
    });
    expect(res.status).toBe(202);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const body = (await res.json()) as { command: string };
    expect(body.command).toBe('set A1 value n 7');

    // Snapshot now has the cell.
    const snap = await request('GET', '/_/post-json');
    expect(snap.status).toBe(200);
    const snapText = await snap.text();
    expect(snapText).toContain('cell:A1');
  });

  it('POST /_/:room with empty body returns 400 Please send command', async () => {
    const res = await request('POST', '/_/post-empty', { method: 'POST' });
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Please send command');
  });

  it('POST /_/:room filters set sheet defaulttextvalueformat text-wiki', async () => {
    const res = await request('POST', '/_/post-wiki', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        command: 'set sheet defaulttextvalueformat text-wiki',
      }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string };
    expect(body.command).toBe('set sheet defaulttextvalueformat text-wiki');
    // No snapshot was created -- filter short-circuits before DO dispatch.
    const get = await request('GET', '/_/post-wiki');
    expect(get.status).toBe(404);
  });

  it('POST /_/:room with text-command loadclipboard auto-enriches with paste', async () => {
    // Seed an initial snapshot so computeLastRow returns a meaningful row.
    await request('POST', '/_/post-lc', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 value n 1' }),
    });

    const res = await request('POST', '/_/post-lc', {
      headers: { 'content-type': 'text/x-socialcalc' },
      body: 'loadclipboard cell:B1:t:x\\ncopiedfrom:B1:B1\\n',
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string[] };
    expect(body.command[0]).toBe('loadclipboard cell:B1:t:x\\ncopiedfrom:B1:B1\\n');
    expect(body.command[body.command.length - 1]).toMatch(/^paste A\d+ all$/);
  });

  it('POST /_/:room with xlsx content-type returns 501', async () => {
    const res = await request('POST', '/_/post-xlsx', {
      headers: {
        'content-type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: 'PK\x03\x04',
    });
    expect(res.status).toBe(501);
  });

  it('POST /_/:room with array command joins them for the DO batch', async () => {
    const res = await request('POST', '/_/post-arr', {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        command: ['set A1 value n 10', 'set B1 value n 20'],
      }),
    });
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual(['set A1 value n 10', 'set B1 value n 20']);
    const snap = await request('GET', '/_/post-arr');
    const text = await snap.text();
    expect(text).toContain('cell:A1');
    expect(text).toContain('cell:B1');
  });
});
