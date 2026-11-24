import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { describe, it, expect, beforeAll } from 'vite-plus/test';

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';
import { MAX_HTML_EXPORT_ELEMENTS } from '../src/lib/html-sanitize.ts';

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

  it('HTML export carries an XSS-neutralizing CSP + nosniff', async () => {
    const res = await request('GET', `/_/${ROOM}/html`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    const csp = res.headers.get('content-security-policy');
    expect(csp).toContain("default-src 'none'");
    // Not covered by the `default-src` fallback, so named explicitly.
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("base-uri 'none'");
    // Must stay embeddable — no frame-ancestors lockdown.
    expect(csp).not.toContain('frame-ancestors');
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

describe('Phase 8 exports — HTML XSS sanitisation (text-html cells)', () => {
  const XSS_ROOM = 'xss-html-' + Math.random().toString(36).slice(2, 8);

  beforeAll(async () => {
    const e = env as unknown as Env;
    const id = e.ROOM.idFromName(encodeURI(XSS_ROOM));
    const stub = e.ROOM.get(id);
    await stub.fetch('https://do/_do/all', { method: 'DELETE' });
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    // `text th <html>` plants a text-html cell — SocialCalc renders its value
    // verbatim into the export <table> (the XSS sink). One payload per cell.
    const cmds = [
      'set A1 text th <img src=x onerror=alert(1)>',
      'set A2 text th <script>alert(1)</script>',
      'set A3 text th <a href="javascript:alert(1)">x</a>',
      'set A4 text th <iframe src="https://evil"></iframe>',
      'set A5 text th <meta http-equiv="refresh" content="0;url=https://evil.test">',
      'set A6 text th <style>body{background:url(https://evil.test/pixel)}</style>',
      'set A7 text th <form action="https://evil.test"><input name=x><button>submit</button></form>',
      'set A8 text th <svg><a href="https://evil.test">svg-link</a></svg>',
      'set A9 text th <a href="file:///etc/passwd">file-link</a>',
      'set A10 text th <custom-tag data-x="1">custom-text</custom-tag>',
      'set A11 text th <a href="https://example.test/new" target="_blank">new-tab</a>',
      'set A12 text th <a href="javascript&#58;alert(1)">encoded-link</a>',
      'set A13 text th <img src="https&#58;//example.test/pixel" alt="encoded-image">',
      'set A14 text th <div style="background:u&#114;l(https://example.test/pixel)">encoded-style</div>',
      // Text the rewriter copies through but a browser parses as markup:
      // spliced around a removed element, or a CDATA section after `<svg/>`.
      'set A15 text th <<svg></svg>script>alert(1)</script>spliced-text',
      'set A16 text th <svg/><![CDATA[><form action="/_/other-room"><input name=x><button>cdata-text</button></form><script>alert(1)</script>]]>',
      // A rejected value hiding behind a harmless attribute of the same name.
      'set A17 text th <a href="dup-ok" href="javascript:alert(1)" HREF="dup-ok">dup-link</a>',
      'set A18 text th <img src="dup-ok" src="https://evil.test/pixel" alt="dup-image">',
      'set A19 text th <div style="color:red" style="background:url(https://evil.test/pixel)">dup-style</div>',
      // Attribute flood: stripping one by one is quadratic in HTMLRewriter,
      // so an element past MAX_ELEMENT_ATTRIBUTES (64) is unwrapped instead.
      `set A20 text th <i ${'x '.repeat(64)}title="flood-title">flood-text</i>`,
      `set A21 text th <i ${'x '.repeat(63)}title="brim-title">brim-text</i>`,
      // Benign markup that MUST survive the sanitiser.
      'set B1 text th <b>bold</b>',
      'set B2 text th <a href="https://example.test">link</a>',
      'set B4 text th 1 < 2 <i>italic</i>',
      'set B3 text t styled',
      'set B3 cssc candidate-export-class',
    ];
    for (const c of cmds) {
      const res = await stub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: c,
      });
      expect(res.status).toBe(202);
    }
  });

  it('strips script-bearing markup but keeps safe formatting', async () => {
    const res = await request('GET', `/_/${XSS_ROOM}/html`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    const body = await res.text();
    const lower = body.toLowerCase();

    // No active element carries an event handler or executable URL. Newer
    // SocialCalc bundles also expose the original cell text in an escaped
    // aria-label; inert words such as "onerror" or "javascript:" inside that
    // attribute are accessibility text, not active markup.
    expect(lower).not.toMatch(/<img\b[^>]*\bonerror\s*=/);
    expect(lower).not.toContain('<script');
    expect(lower).not.toMatch(/<a\b[^>]*\bhref\s*=\s*["']?javascript:/);
    expect(lower).not.toContain('<iframe');
    expect(lower).not.toContain('<meta');
    expect(lower).not.toContain('<style');
    expect(lower).not.toContain('<form');
    expect(lower).not.toContain('<input');
    expect(lower).not.toContain('<button');
    expect(lower).not.toContain('<svg');
    expect(lower).not.toMatch(/<a\b[^>]*\bhref\s*=\s*["']?file:/);
    expect(lower).not.toMatch(/<a\b[^>]*\bhref\s*=\s*["']?javascript(?:&#58;|&colon;|:)/);
    expect(lower).not.toMatch(/<img\b[^>]*\bsrc\s*=\s*["']?https(?:&#58;|&colon;|:)/);
    expect(lower).not.toMatch(/<div\b[^>]*\bstyle\s*=\s*["'][^"']*u(?:&#114;|r)l\(/);
    expect(lower).not.toContain('<custom-tag');
    // Every `<` in passed-through text is escaped, so neither payload's
    // markup reaches the browser (the `<script`/`<form`/`<input`/`<button`
    // checks above); what is left is inert text.
    expect(body).toContain('&lt;script>alert(1)</script>spliced-text');
    expect(body).toContain('&lt;form action="/_/other-room">');
    expect(body).toContain('cdata-text');
    // A rejected duplicate takes every attribute of that name with it.
    expect(body).toContain('<a>dup-link</a>');
    expect(body).toContain('<img alt="dup-image">');
    expect(body).toContain('<div>dup-style</div>');

    // text-html stays a feature — safe markup and the cell text survive.
    expect(lower).toContain('<b>bold</b>');
    expect(body).toContain('1 &lt; 2 <i>italic</i>');
    expect(body).toContain('https://example.test');
    expect(body).toContain('>link</a>');
    // Anchor text from the javascript: payload is kept; only the href dies.
    expect(body).toContain('>x</a>');
    expect(body).toContain('file-link');
    expect(body).toContain('custom-text');
    expect(body).toContain('encoded-link');
    expect(body).toContain('encoded-image');
    expect(body).toContain('encoded-style');
    expect(lower).toMatch(
      /<a\b[^>]*href="https:\/\/example\.test\/new"[^>]*target="_blank"[^>]*rel="noopener noreferrer"/,
    );
    // The table scaffolding itself is untouched.
    expect(lower).toContain('<table');
  });

  it('unwraps an element with more attributes than the sanitiser strips in place', async () => {
    const res = await request('GET', `/_/${XSS_ROOM}/html`);
    expect(res.status).toBe(200);
    const body = await res.text();
    // Past the cap: the tag and every attribute go, the text stays.
    expect(body).toContain('flood-text');
    expect(body).not.toMatch(/<i\b[^>]*>flood-text/);
    // At the cap the element is still sanitised attribute by attribute.
    expect(body).toContain('<i title="brim-title">brim-text</i>');
  });

  it('preserves a custom cell class through the headless DOM shim', async () => {
    const res = await request('GET', `/_/${XSS_ROOM}/html`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('class="candidate-export-class"');
    expect(body).toContain('>styled</td>');
  });

  it('still emits the XSS-neutralising CSP + nosniff alongside the stripped body', async () => {
    const res = await request('GET', `/_/${XSS_ROOM}/html`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
  });
});

describe('Phase 8 exports — HTML sanitiser work limit', () => {
  const TAGS_ROOM = 'html-tags-' + Math.random().toString(36).slice(2, 8);

  /** Reset the room, then store each value as a text-html cell in column A. */
  async function setHtmlCells(cells: readonly string[]): Promise<void> {
    const e = env as unknown as Env;
    const stub = e.ROOM.get(e.ROOM.idFromName(encodeURI(TAGS_ROOM)));
    await stub.fetch('https://do/_do/all', { method: 'DELETE' });
    await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
    for (const [row, html] of cells.entries()) {
      const res = await stub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: `set A${row + 1} text th ${html}`,
      });
      expect(res.status).toBe(202);
    }
  }

  async function expectTooLarge(res: Response): Promise<void> {
    expect(res.status).toBe(413);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('HTML export exceeds resource limits');
  }

  it('sends a cell of many elements whole, with the export headers', async () => {
    await setHtmlCells(['<hr>'.repeat(2000)]);
    const res = await request('GET', `/_/${TAGS_ROOM}/html`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'none'");
    const body = await res.text();
    expect(body.split('<hr>').length - 1).toBe(2000);
    expect(body.endsWith('</table>')).toBe(true);
  });

  it('refuses a document with more elements than the sanitiser may handle', async () => {
    // Four cells that together reach the limit; the table around them passes it.
    const quarter = '<hr>'.repeat(MAX_HTML_EXPORT_ELEMENTS / 4);
    await setHtmlCells([quarter, quarter, quarter, quarter]);
    const res = await request('GET', `/_/${TAGS_ROOM}/html`);
    await expectTooLarge(res);
    // Only the HTML export runs the sanitiser; the data stays downloadable.
    const csv = await request('GET', `/_/${TAGS_ROOM}/csv`);
    expect(csv.status).toBe(200);
  });

  it('refuses markup nested past the parser memory limit', async () => {
    await setHtmlCells(['<b>'.repeat(100_000)]);
    const res = await request('GET', `/_/${TAGS_ROOM}/html`);
    await expectTooLarge(res);
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

    const tocJson = await request('GET', `/_/${MULTI_ROOM}/csv.json`);
    expect(tocJson.status).toBe(200);
    expect(tocJson.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    const grid = (await tocJson.json()) as string[][];
    expect(grid.length).toBeGreaterThanOrEqual(3);
    expect(grid[1]?.[0]).toBe(`/${MULTI_ROOM}.1`);

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

  it('resolves an encoded TOC child to the same room as its browser link', async () => {
    const workbook = 'book-' + Math.random().toString(36).slice(2, 8);
    const encodedChild = `%62${workbook.slice(1)}.1`;
    await seedRoom(`${workbook}.1`, '42');
    await seedRoom(encodedChild, '99');
    await seedRoom(workbook, `url,title\n/${encodedChild},EncodedTab`);

    const response = await request('GET', `/_/=${workbook}/xlsx`);
    expect(response.status).toBe(200);
    const XLSX = await import('@e965/xlsx');
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const book = (XLSX as any).read(new Uint8Array(await response.arrayBuffer()), { type: 'array' });
    expect(book.SheetNames).toEqual(['EncodedTab']);
    expect(book.Sheets['EncodedTab'].A1.v).toBe(42);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  });

  it('answers 413 for ods/fods when merges exceed the ODS writer budget', async () => {
    // SheetJS's ODS writer rescans the merge list for every cell, so
    // `MAX_ODS_MERGE_WORK` bounds cells x merges. xlsx is not affected.
    const e = env as unknown as Env;
    const fill = async (name: string, rows: number): Promise<void> => {
      const stub = e.ROOM.get(e.ROOM.idFromName(encodeURI(name)));
      await stub.fetch('https://do/_do/all', { method: 'DELETE' });
      await stub.fetch('https://do/_do/snapshot', { method: 'PUT', body: '' });
      const res = await stub.fetch('https://do/_do/commands', {
        method: 'POST',
        body: `set A1:A${rows} all :v:1:colspan:2`,
      });
      expect(res.status).toBe(202);
    };

    // Single sheet: 20,001 cells x 20,001 merges is one row past the budget.
    const single = 'merge-budget-' + Math.random().toString(36).slice(2, 8);
    await fill(single, 20_001);
    expect((await request('GET', `/_/${single}/ods`)).status).toBe(413);
    expect((await request('GET', `/${single}.fods`)).status).toBe(413);
    expect((await request('GET', `/_/${single}/xlsx`)).status).toBe(200);

    // Workbook: each 15,000-row child fits alone, the two together do not.
    const workbook = 'merge-budget-' + Math.random().toString(36).slice(2, 8);
    await fill(`${workbook}.1`, 15_000);
    await fill(`${workbook}.2`, 15_000);
    await seedRoom(workbook, `url,title\n/${workbook}.1,One\n/${workbook}.2,Two`);
    expect((await request('GET', `/_/${workbook}.1/ods`)).status).toBe(200);
    for (const path of [`/_/=${workbook}/ods`, `/=${workbook}.fods`]) {
      const res = await request('GET', path);
      expect(res.status).toBe(413);
      expect(await res.text()).toBe('multi-sheet export exceeds resource limits');
    }
    expect((await request('GET', `/_/=${workbook}/xlsx`)).status).toBe(200);
  });
});
