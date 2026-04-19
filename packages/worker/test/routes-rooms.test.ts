import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

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

  it('GET /_rooms returns []', async () => {
    const res = await request('GET', '/_rooms');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await res.text()).toBe('[]');
  });

  it('GET /_roomlinks returns HTML content-type', async () => {
    const res = await request('GET', '/_roomlinks');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('GET /_roomtimes returns {}', async () => {
    const res = await request('GET', '/_roomtimes');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await res.text()).toBe('{}');
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
});
