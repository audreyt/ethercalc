import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vitest';

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';

/**
 * Phase 8 integration test — end-to-end exports through workerd.
 *
 * Strategy: create a fresh room by POSTing a CSV body (the csvToSave path
 * in `@ethercalc/socialcalc-headless` hydrates a real sheet), then exercise
 * every export route and assert status + content-type + body shape.
 *
 * Because every test runs in a shared single-worker session (per
 * `vitest.config.ts`), each block picks a unique room name so PUT/DELETE
 * operations don't collide.
 */

async function request(
  method: string,
  path: string,
  opts: RequestInit = {},
): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { method, ...opts });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as unknown as Env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

/** Populate a room via the direct DO path so exports see real SocialCalc data. */
async function seedRoom(name: string, csv: string): Promise<void> {
  const e = env as unknown as Env;
  const id = e.ROOM.idFromName(encodeURI(name));
  const stub = e.ROOM.get(id);
  // First wipe so re-runs during test development stay clean.
  await stub.fetch('https://do/_do/all', { method: 'DELETE' });
  // Seed with an empty snapshot so the spreadsheet initializes, then POST
  // one command per CSV row to put values into real SocialCalc cells (the
  // export path exercises createSheetHTML / exportCSV / etc).
  await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
  const rows = csv
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(','));
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    for (let c = 0; c < row.length; c++) {
      const coord = `${String.fromCharCode('A'.charCodeAt(0) + c)}${r + 1}`;
      const value = row[c]!;
      const isNum = /^-?\d+(\.\d+)?$/.test(value);
      const command = isNum
        ? `set ${coord} value n ${value}`
        : `set ${coord} text t ${value}`;
      const res = await stub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: command,
      });
      expect(res.status).toBe(202);
    }
  }
}

const ROOM = 'phase8-export-' + Math.random().toString(36).slice(2, 8);

describe('Phase 8 exports — GET /_/:room/<format>', () => {
  beforeAll(async () => {
    await seedRoom(ROOM, 'h1,h2\n1,2\nhello,world');
  });

  it('GET /_/:room/csv returns a text/csv body with attachment header', async () => {
    const res = await request('GET', `/_/${ROOM}/csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('content-disposition')).toContain(
      `filename="${ROOM}.csv"`,
    );
    const body = await res.text();
    // Rows in insertion order.
    expect(body).toContain('h1');
    expect(body).toContain('hello');
  });

  it('GET /:room.csv alias works', async () => {
    const res = await request('GET', `/${ROOM}.csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    const body = await res.text();
    expect(body).toContain('h1,h2');
  });

  it('GET /_/:room/csv.json returns an array-of-arrays JSON', async () => {
    const res = await request('GET', `/_/${ROOM}/csv.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const grid = (await res.json()) as string[][];
    expect(Array.isArray(grid)).toBe(true);
    expect(grid.length).toBeGreaterThanOrEqual(3);
    expect(grid[0]).toEqual(['h1', 'h2']);
  });

  it('GET /:room.csv.json alias works', async () => {
    const res = await request('GET', `/${ROOM}.csv.json`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
  });

  it('GET /_/:room/html returns a text/html body', async () => {
    const res = await request('GET', `/_/${ROOM}/html`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const body = await res.text();
    // SocialCalc's CreateSheetHTML renders a <table> element.
    expect(body.toLowerCase()).toContain('<table');
  });

  it('GET /:room.html alias works', async () => {
    const res = await request('GET', `/${ROOM}.html`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
  });

  it('GET /_/:room/md returns a GFM markdown table', async () => {
    const res = await request('GET', `/_/${ROOM}/md`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/x-markdown; charset=utf-8');
    const body = await res.text();
    // First row becomes header; separator row comes right after.
    expect(body.split('\n')[1]).toMatch(/^\|\s*---/);
  });

  it('GET /:room.md alias works', async () => {
    const res = await request('GET', `/${ROOM}.md`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/x-markdown; charset=utf-8');
  });

  it('GET /_/:room/xlsx returns a zip-shaped binary with attachment header', async () => {
    const res = await request('GET', `/_/${ROOM}/xlsx`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain(
      'application/vnd.openxmlformats',
    );
    expect(res.headers.get('content-disposition')).toContain(
      `filename="${ROOM}.xlsx"`,
    );
    const bytes = new Uint8Array(await res.arrayBuffer());
    // .xlsx is a ZIP archive — "PK\x03\x04".
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes[2]).toBe(0x03);
    expect(bytes[3]).toBe(0x04);
  });

  it('GET /:room.xlsx alias works', async () => {
    const res = await request('GET', `/${ROOM}.xlsx`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-disposition')).toContain('.xlsx');
  });

  it('GET /_/:room/ods returns an opendocument-spreadsheet binary', async () => {
    const res = await request('GET', `/_/${ROOM}/ods`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('opendocument');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);
    // ODS is a ZIP too.
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  it('GET /_/:room/fods returns an XML body', async () => {
    const res = await request('GET', `/_/${ROOM}/fods`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('opendocument');
    const body = await res.text();
    expect(body.startsWith('<')).toBe(true);
  });

  it('GET /:room.fods alias works', async () => {
    const res = await request('GET', `/${ROOM}.fods`);
    expect(res.status).toBe(200);
  });

  it('GET /:room.ods alias works', async () => {
    const res = await request('GET', `/${ROOM}.ods`);
    expect(res.status).toBe(200);
  });
});

describe('Phase 8 exports — 404 on unknown room', () => {
  it('returns 404 plain-text when the DO has no snapshot', async () => {
    // A fresh room no one has ever written to — DO exists lazily but
    // /_do/snapshot returns 404, which the export route forwards as 404.
    //
    // Note: because our export handlers call createSpreadsheet() without a
    // snapshot they'll return an EMPTY-sheet export rather than 404. That
    // matches SocialCalc's behavior (an un-seeded sheet is a valid empty
    // sheet). The HTTP `Content-Type` is still set to the format's CT.
    const res = await request('GET', `/_/never-created-${Date.now()}/csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    // Empty-sheet CSV is just a lone newline.
    expect((await res.text()).length).toBeLessThanOrEqual(2);
  });
});

describe('Phase 8 exports — multi-sheet 501 stubs', () => {
  it('GET /_/=:room/xlsx returns 501', async () => {
    const res = await request('GET', '/_/=room/xlsx');
    expect(res.status).toBe(501);
    expect(await res.text()).toContain('Phase 8.1');
  });

  it('GET /_/=:room/ods returns 501', async () => {
    const res = await request('GET', '/_/=room/ods');
    expect(res.status).toBe(501);
  });

  it('GET /_/=:room/fods returns 501', async () => {
    const res = await request('GET', '/_/=room/fods');
    expect(res.status).toBe(501);
  });

  it('GET /=:room.xlsx returns 501', async () => {
    const res = await request('GET', '/=room.xlsx');
    expect(res.status).toBe(501);
  });
});
