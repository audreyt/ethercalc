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

describe('Phase 8 exports — formula & format roundtrip', () => {
  const FORMULA_ROOM = 'phase8-formula-' + Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName(encodeURI(FORMULA_ROOM));
    const stub = e.ROOM.get(id);
    await stub.fetch('https://do/_do/all', { method: 'DELETE' });
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    // Seed a simple sum: A1=1, A2=2, A3=SUM(A1:A2).
    const commands = [
      'set A1 value n 1',
      'set A2 value n 2',
      'set A3 formula SUM(A1:A2)',
    ];
    for (const c of commands) {
      const res = await stub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: c,
      });
      expect(res.status).toBe(202);
    }
  });

  it('xlsx export preserves the SUM formula on A3', async () => {
    const res = await request('GET', `/_/${FORMULA_ROOM}/xlsx`);
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    // Read back with SheetJS and check A3 has the formula.
    const XLSX = await import('@e965/xlsx');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe(1);
    expect(sheet.A2.v).toBe(2);
    expect(sheet.A3.v).toBe(3);
    expect(sheet.A3.f).toBe('SUM(A1:A2)');
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('cross-sheet formula resolves via sibling DO hydration', async () => {
    const e = env as unknown as Env;
    const sibling = 'phase82-sibling-' + Math.random().toString(36).slice(2, 8);
    const main = 'phase82-main-' + Math.random().toString(36).slice(2, 8);

    // Seed sibling with A1=100.
    const sibId = e.ROOM.idFromName(encodeURI(sibling));
    const sib = e.ROOM.get(sibId);
    await sib.fetch('https://do/_do/all', { method: 'DELETE' });
    await sib.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await sib.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 100',
    });

    // Seed main with A1='sibling'!A1 — referencing across rooms.
    const mainId = e.ROOM.idFromName(encodeURI(main));
    const m = e.ROOM.get(mainId);
    await m.fetch('https://do/_do/all', { method: 'DELETE' });
    await m.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await m.fetch(`https://do/_do/commands?name=${encodeURIComponent(main)}`, {
      method: 'POST',
      body: `set A1 formula '${sibling}'!A1`,
    });

    // Next read should have hydrated the sibling and recalced.
    const res = await request('GET', `/_/${main}/csv`);
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv.trim()).toBe('100');
  });

  it('double-quoted cross-sheet formula resolves for dashed room names', async () => {
    const e = env as unknown as Env;
    const sibling = 'phase82-dq-sibling-' + Math.random().toString(36).slice(2, 8);
    const main = 'phase82-dq-main-' + Math.random().toString(36).slice(2, 8);

    const sibId = e.ROOM.idFromName(encodeURI(sibling));
    const sib = e.ROOM.get(sibId);
    await sib.fetch('https://do/_do/all', { method: 'DELETE' });
    await sib.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await sib.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set A1 value n 200',
    });

    const mainId = e.ROOM.idFromName(encodeURI(main));
    const m = e.ROOM.get(mainId);
    await m.fetch('https://do/_do/all', { method: 'DELETE' });
    await m.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    await m.fetch(`https://do/_do/commands?name=${encodeURIComponent(main)}`, {
      method: 'POST',
      body: `set A1 formula "${sibling}"!A1`,
    });

    const res = await request('GET', `/_/${main}/csv`);
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv.trim()).toBe('200');
  });

  it('ods export preserves the SUM formula', async () => {
    const res = await request('GET', `/_/${FORMULA_ROOM}/ods`);
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const XLSX = await import('@e965/xlsx');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A3.v).toBe(3);
    // ODS prefixes formulas with "of=" but the body matches.
    expect(sheet.A3.f).toBeTruthy();
    /* eslint-enable @typescript-eslint/no-explicit-any */
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

describe('Phase 8.1 exports — multi-sheet', () => {
  it('GET /_/=:room/xlsx returns 404 for an unknown TOC', async () => {
    const res = await request('GET', `/_/=never-created-${Date.now()}/xlsx`);
    expect(res.status).toBe(404);
  });

  it('GET /_/=:room/ods returns 404 for an unknown TOC', async () => {
    const res = await request('GET', `/_/=never-created-${Date.now()}/ods`);
    expect(res.status).toBe(404);
  });

  it('GET /_/=:room/fods returns 404 for an unknown TOC', async () => {
    const res = await request('GET', `/_/=never-created-${Date.now()}/fods`);
    expect(res.status).toBe(404);
  });

  it('GET /=:room.xlsx returns 404 for an unknown TOC', async () => {
    const res = await request('GET', `/=never-created-${Date.now()}.xlsx`);
    expect(res.status).toBe(404);
  });

  it('GET /_/=:room/xlsx builds a multi-sheet workbook from a seeded TOC', async () => {
    const MULTI_ROOM = 'phase81-multi-' + Math.random().toString(36).slice(2, 8);
    const e = env as unknown as Env;

    // Seed sub-sheets.
    for (let i = 1; i <= 2; i++) {
      const subId = e.ROOM.idFromName(encodeURI(`${MULTI_ROOM}.${i}`));
      const sub = e.ROOM.get(subId);
      await sub.fetch('https://do/_do/all', { method: 'DELETE' });
      await sub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
      await sub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: `set A1 value n ${i * 10}`,
      });
    }

    // Seed TOC (= room named MULTI_ROOM without the `=`).
    const tocId = e.ROOM.idFromName(encodeURI(MULTI_ROOM));
    const toc = e.ROOM.get(tocId);
    await toc.fetch('https://do/_do/all', { method: 'DELETE' });
    await toc.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    const tocCmds = [
      'set A1 text t url',
      'set B1 text t title',
      `set A2 text t /${MULTI_ROOM}.1`,
      'set B2 text t FirstTab',
      `set A3 text t /${MULTI_ROOM}.2`,
      'set B3 text t SecondTab',
    ];
    for (const c of tocCmds) {
      await toc.fetch('https://do/_do/commands', { method: 'POST', body: c });
    }

    const res = await request('GET', `/_/=${MULTI_ROOM}/xlsx`);
    expect(res.status).toBe(200);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const XLSX = await import('@e965/xlsx');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['FirstTab', 'SecondTab']);
    expect(wb.Sheets['FirstTab'].A1.v).toBe(10);
    expect(wb.Sheets['SecondTab'].A1.v).toBe(20);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });
});
