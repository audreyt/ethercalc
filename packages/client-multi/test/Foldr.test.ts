import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import {
  encodeSocialCalcText,
  HackFoldr,
  parseTocBody,
  tocRowsEqual,
  type FetchImpl,
} from '../src/Foldr.ts';
import {
  MAX_MULTI_SHEETS,
  MAX_MULTI_SHEET_TITLE_LENGTH,
} from '@ethercalc/shared';

interface FakeRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

function makeFetch(
  responses: Array<
    { ok?: boolean; status?: number; json?: unknown; throwError?: boolean } | undefined
  >,
): { fetchImpl: FetchImpl; calls: FakeRequest[] } {
  const calls: FakeRequest[] = [];
  let i = 0;
  const fetchImpl: FetchImpl = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    const method = init?.method ?? 'GET';
    const bodyIn = init?.body;
    calls.push({
      url,
      method,
      headers: (init?.headers as Record<string, string>) ?? {},
      body: typeof bodyIn === 'string' ? bodyIn : undefined,
    });
    const r = responses[i++];
    if (!r || r.throwError) throw new Error('fake network failure');
    const ok = r.ok ?? true;
    const jsonPayload = r.json;
    return {
      ok,
      status: r.status ?? (ok ? 200 : 500),
      async json() {
        if (jsonPayload === '__THROW__') throw new Error('bad json');
        return jsonPayload;
      },
    } as unknown as Response;
  };
  return { fetchImpl, calls };
}

describe('HackFoldr', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('strips trailing slashes from the base URL', () => {
    const f = new HackFoldr('http://x///');
    expect(f.base).toBe('http://x');
  });

  it('defaults fetchImpl to global fetch when none given', () => {
    const originalFetch = globalThis.fetch;
    const spy = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    globalThis.fetch = spy as unknown as typeof fetch;
    try {
      const f = new HackFoldr('http://x');
      void f.fetch('r');
      expect(spy).toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  describe('fetch()', () => {
    it('dedupes duplicate links, keeping the last server row (#727)', async () => {
      const { fetchImpl } = makeFetch([
        {
          json: [
            ['#url', '#title'],
            ['/r.1', 'Sheet1'],
            ['/r.1', 'Sheet1'],
            ['/r.2', 'Sheet2'],
          ],
        },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([
        { link: '/r.1', title: 'Sheet1', row: 3 },
        { link: '/r.2', title: 'Sheet2', row: 4 },
      ]);
    });

    it('parses a TOC response, dropping the header row', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#url', '#title'], ['/r.1', 'Sheet1'], ['/r.2', 'Sheet2']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(calls[0]?.url).toBe('http://x/_/r/csv.json');
      expect(f.rows).toEqual([
        { link: '/r.1', title: 'Sheet1', row: 2 },
        { link: '/r.2', title: 'Sheet2', row: 3 },
      ]);
    });

    it('skips rows without a link and rows starting with #', async () => {
      const { fetchImpl } = makeFetch([
        {
          json: [
            ['#url', '#title'],
            ['', 'blank-link'],
            ['#note', 'note row'],
            ['/r.a', 'Real'],
          ],
        },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.a', title: 'Real', row: 4 }]);
    });

    it('defaults missing titles to SheetN (1-based counter)', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#u', '#t'], ['/r.1', ''], ['/r.2', '']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows.map((r) => r.title)).toEqual(['Sheet1', 'Sheet2']);
    });

    it('ignores non-array entries in the body', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#u', '#t'], 'not-a-row', ['/r.1', 'ok']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'ok', row: 3 }]);
    });

    it('coerces non-string link/title to empty string (skips empties)', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#u', '#t'], [1, 2], [null, null], ['/r.ok', undefined]] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.ok', title: 'Sheet3', row: 4 }]);
    });

    it('auto-seeds a non-existent workbook through the guarded sheet route', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [] },
        {
          status: 201,
          json: {
            sheet: { subroom: 'r.4', link: '/r.4', title: 'Server Seed', row: 5 },
          },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'seed_nonexistent',
      });
      await f.fetch('r');

      expect(f.rows).toEqual([{ link: '/r.4', title: 'Server Seed', row: 5 }]);
      expect(f.wasNonExistent).toBe(false);
      expect(f.wasEmpty).toBe(false);
      expect(calls).toHaveLength(2);
      expect(calls[1]).toMatchObject({
        url: 'http://x/_/=r/sheet',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
      });
      expect(JSON.parse(calls[1]?.body ?? '')).toEqual({
        title: 'Sheet1',
        requestId: 'seed_nonexistent',
      });
    });

    it('auto-seeds a header-only workbook through the guarded sheet route', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#url', '#title']] },
        {
          status: 201,
          json: {
            sheet: { subroom: 'r.2', link: '/r.2', title: 'Sheet1', row: 2 },
          },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'seed_empty',
      });
      await f.fetch('r');

      expect(f.rows).toEqual([{ link: '/r.2', title: 'Sheet1', row: 2 }]);
      expect(f.wasEmpty).toBe(false);
      expect(calls).toHaveLength(2);
      expect(calls[1]?.url).toBe('http://x/_/=r/sheet');
      expect(JSON.parse(calls[1]?.body ?? '')).toEqual({
        title: 'Sheet1',
        requestId: 'seed_empty',
      });
    });

    it('survives a thrown TOC fetch and seeds through the guarded route', async () => {
      const { fetchImpl } = makeFetch([
        { throwError: true },
        {
          status: 201,
          json: { sheet: { subroom: 'r.1', link: '/r.1', title: 'Sheet1', row: 2 } },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'seed_after_throw',
      });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
    });

    it('survives a rejected TOC fetch and seeds through the guarded route', async () => {
      const { fetchImpl } = makeFetch([
        { ok: false },
        {
          status: 201,
          json: { sheet: { subroom: 'r.1', link: '/r.1', title: 'Sheet1', row: 2 } },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'seed_after_reject',
      });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
    });

    it('keeps empty rows and init flags when automatic seeding fails', async () => {
      const rejected = makeFetch([{ json: [] }, { ok: false, status: 409 }]);
      const rejectedFoldr = new HackFoldr('http://x', {
        fetchImpl: rejected.fetchImpl,
        requestIdFactory: () => 'seed_rejected',
      });
      await rejectedFoldr.fetch('r');
      expect(rejectedFoldr.rows).toEqual([]);
      expect(rejectedFoldr.wasNonExistent).toBe(true);
      expect(rejectedFoldr.wasEmpty).toBe(true);

      const malformed = makeFetch([
        { json: [['#url', '#title']] },
        {
          status: 201,
          json: {
            sheet: {
              subroom: 'r.1',
              link: '//evil.example',
              title: 'Sheet1',
              row: 2,
            },
          },
        },
      ]);
      const malformedFoldr = new HackFoldr('http://x', {
        fetchImpl: malformed.fetchImpl,
        requestIdFactory: () => 'seed_malformed',
      });
      await malformedFoldr.fetch('r');
      expect(malformedFoldr.rows).toEqual([]);
      expect(malformedFoldr.wasEmpty).toBe(true);

      const throwing = makeFetch([
        { json: [['#url', '#title']] },
        { throwError: true },
      ]);
      const throwingFoldr = new HackFoldr('http://x', {
        fetchImpl: throwing.fetchImpl,
        requestIdFactory: () => 'seed_throwing',
      });
      await throwingFoldr.fetch('r');
      expect(throwingFoldr.rows).toEqual([]);
      expect(throwingFoldr.wasEmpty).toBe(true);
    });
  });

  describe('size/lastIndex/lastRow/links/titles/at', () => {
    it('returns {} from lastRow/at when empty', async () => {
      const f = new HackFoldr('http://x', {
        fetchImpl: makeFetch([]).fetchImpl,
      });
      expect(f.size()).toBe(0);
      expect(f.lastIndex()).toBe(-1);
      expect(f.lastRow()).toEqual({});
      expect(f.at(0)).toEqual({});
      expect(f.links()).toEqual([]);
      expect(f.titles()).toEqual([]);
    });

    it('reports the correct counts after populate', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A'], ['/b', 'B']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.size()).toBe(2);
      expect(f.lastIndex()).toBe(1);
      expect(f.lastRow()).toMatchObject({ title: 'B' });
      expect(f.links()).toEqual(['/a', '/b']);
      expect(f.titles()).toEqual(['A', 'B']);
      expect(f.at(0)).toMatchObject({ title: 'A' });
      expect(f.at(99)).toEqual({});
    });
  });

  describe('push()', () => {
    it('uses the guarded route and mounts authoritative server metadata', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        {
          status: 201,
          json: {
            sheet: {
              subroom: 'r.11',
              link: '/r.11',
              title: 'Server Assigned',
              row: 12,
            },
          },
        },
      ]);
      const f = new HackFoldr('http://x/', {
        fetchImpl,
        requestIdFactory: () => 'push_req_1',
      });
      await f.fetch('r');
      const proposed = {
        link: '/client-proposal',
        title: 'New',
        row: 99,
      };

      await expect(f.push(proposed)).resolves.toBe(f);
      expect(calls[1]).toMatchObject({
        url: 'http://x/_/=r/sheet',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
      });
      expect(JSON.parse(calls[1]?.body ?? '')).toEqual({
        title: 'New',
        requestId: 'push_req_1',
      });
      expect(f.rows[1]).toEqual({
        link: '/r.11',
        title: 'Server Assigned',
        row: 12,
      });
      expect(proposed).toEqual(f.rows[1]);
    });

    it('caps the requested title before sending it to the guarded route', async () => {
      const cappedTitle = 't'.repeat(MAX_MULTI_SHEET_TITLE_LENGTH);
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        {
          status: 201,
          json: {
            sheet: { subroom: 'r.2', link: '/r.2', title: cappedTitle, row: 3 },
          },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'title_cap',
      });
      await f.fetch('r');
      await f.push({
        link: '/proposal',
        title: `${cappedTitle}overflow`,
        row: 0,
      });

      expect(JSON.parse(calls[1]?.body ?? '')).toEqual({
        title: cappedTitle,
        requestId: 'title_cap',
      });
    });

    it('leaves rows unchanged when the guarded request is rejected', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: false, status: 409 },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'rejected_push',
      });
      await f.fetch('r');

      await expect(f.push({ link: '/proposal', title: 'New', row: 0 })).resolves.toBe(f);
      expect(f.rows).toEqual([{ link: '/a', title: 'A', row: 2 }]);
    });

    it('rejects malformed 201 sheet responses without mounting a row', async () => {
      const malformed = [
        {},
        { sheet: null },
        { sheet: { subroom: 'r.2', link: '//evil.example', title: 'New', row: 3 } },
        { sheet: { subroom: '', link: '/r.2', title: 'New', row: 3 } },
        {
          sheet: {
            subroom: 'r.2',
            link: '/r.2',
            title: 't'.repeat(MAX_MULTI_SHEET_TITLE_LENGTH + 1),
            row: 3,
          },
        },
        { sheet: { subroom: 'r.2', link: '/r.2', title: 'New', row: 3.5 } },
      ];
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        ...malformed.map((json) => ({ status: 201, json })),
      ]);
      let request = 0;
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => `malformed_${request++}`,
      });
      await f.fetch('r');

      for (const _ of malformed) {
        await f.push({ link: '/proposal', title: 'New', row: 0 });
      }
      expect(f.rows).toEqual([{ link: '/a', title: 'A', row: 2 }]);
    });

    it('leaves rows unchanged when the guarded request or JSON body throws', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { throwError: true },
        { status: 201, json: '__THROW__' },
      ]);
      let request = 0;
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => `throwing_${request++}`,
      });
      await f.fetch('r');

      await f.push({ link: '/proposal', title: 'Network throw', row: 0 });
      await f.push({ link: '/proposal', title: 'JSON throw', row: 0 });
      expect(f.rows).toEqual([{ link: '/a', title: 'A', row: 2 }]);
    });

    it('rejects unsafe links and invalid request IDs without making a request', async () => {
      const { fetchImpl, calls } = makeFetch([]);
      const unsafeLink = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'valid_request',
      });
      await unsafeLink.push({
        link: 'https://evil.example',
        title: 'Evil',
        row: 0,
      });
      const invalidRequestId = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'not valid!',
      });
      await invalidRequestId.push({ link: '/safe', title: 'Safe', row: 0 });
      const throwingRequestId = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => {
          throw new Error('request id unavailable');
        },
      });
      await throwingRequestId.push({ link: '/safe', title: 'Safe', row: 0 });

      expect(calls).toHaveLength(0);
      expect(unsafeLink.rows).toEqual([]);
      expect(invalidRequestId.rows).toEqual([]);
      expect(throwingRequestId.rows).toEqual([]);
    });
  });

  describe('setAt()', () => {
    it('sends a title command when patch.title is defined', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.setAt(0, { title: 'Renamed' });
      expect(calls[1]?.body).toBe('set B2 text t Renamed');
      expect(f.at(0)).toMatchObject({ title: 'Renamed' });
    });

    it('encodes title metacharacters without creating a second command', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.setAt(0, { title: 'Quarter:1\\draft\r\nset A9 text t owned' });
      expect(calls[1]?.body).toBe(
        'set B2 text t Quarter\\c1\\bdraft\\nset A9 text t owned',
      );
      expect(calls[1]?.body).not.toContain('\n');
    });

    it('rejects an unsafe link mutation', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.setAt(0, { link: '//evil.example' });
      expect(calls).toHaveLength(1);
      expect(f.at(0).link).toBe('/a');
    });

    it('skips the command when no title patch is given', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.setAt(0, { link: '/a2' });
      expect(calls).toHaveLength(1); // only the initial fetch
      expect(f.at(0)).toMatchObject({ link: '/a2', title: 'A' });
    });

    it('no-ops when index is out of range', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.setAt(99, { title: 'x' });
      expect(calls).toHaveLength(1);
    });
  });

  describe('pushChecked()', () => {
    it('returns true and mounts the authoritative guarded response', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        {
          status: 201,
          json: {
            sheet: {
              subroom: 'r.8',
              link: '/r.8',
              title: 'Server Import',
              row: 9,
            },
          },
        },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'checked_success',
      });
      await f.fetch('r');

      await expect(
        f.pushChecked({ link: '/proposal', title: 'Imported', row: 0 }),
      ).resolves.toBe(true);
      expect(f.rows[1]).toEqual({
        link: '/r.8',
        title: 'Server Import',
        row: 9,
      });
    });

    it('returns false and leaves rows unchanged when the guarded request fails', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, status: 200, json: {} },
      ]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'checked_failure',
      });
      await f.fetch('r');

      await expect(
        f.pushChecked({ link: '/proposal', title: 'Imported', row: 0 }),
      ).resolves.toBe(false);
      expect(f.rows).toEqual([{ link: '/a', title: 'A', row: 2 }]);
    });

    it('returns false for unsafe input without sending a request', async () => {
      const { fetchImpl, calls } = makeFetch([]);
      const f = new HackFoldr('http://x', {
        fetchImpl,
        requestIdFactory: () => 'checked_unsafe',
      });

      await expect(
        f.pushChecked({ link: 'https://evil.example', title: 'Imported', row: 0 }),
      ).resolves.toBe(false);
      expect(calls).toHaveLength(0);
    });
  });

  describe('deleteAt()', () => {
    it('sends a multi-cascade empty command and removes the row', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A'], ['/b', 'B']] },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.deleteAt(1);
      expect(calls[1]?.body).toBe('set A3:B3 empty multi-cascade');
      expect(f.rows).toHaveLength(1);
      expect(f.at(0)).toMatchObject({ title: 'A' });
    });

    it('no-ops when index is out of range', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.deleteAt(99);
      expect(calls).toHaveLength(1);
      expect(f.rows).toHaveLength(1);
    });
  });

  describe('sendCmd()', () => {
    it('survives a POST throw without rejecting', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { throwError: true },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await expect(f.sendCmd('set A1 text t foo')).resolves.toBeUndefined();
    });
  });

  describe('raw-command lazy init flow', () => {

    it('sendCmd triggers lazy init when sheet was non-existent (no row)', async () => {
      // We set the flags by hand to exercise lazy TOC initialization before a
      // non-Add-sheet raw command.
      const { fetchImpl, calls } = makeFetch([
        { ok: true, json: null }, // init post-raw-csv
        { ok: true, json: null }, // sendCmd post
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.wasNonExistent = true;
      await f.sendCmd('noop');
      expect(calls[0]?.body).toBe('"#url","#title"\n"/r.1","Sheet1"');
      expect(calls[1]?.body).toBe('noop');
    });

    it('sendCmd triggers lazy init when sheet was empty (no row)', async () => {
      const { fetchImpl, calls } = makeFetch([
        { ok: true, json: null }, // init post-csv (single row)
        { ok: true, json: null }, // sendCmd post
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.wasEmpty = true;
      await f.sendCmd('noop');
      expect(calls[0]?.body).toBe('"/r.1","Sheet1"');
      expect(calls[1]?.body).toBe('noop');
    });
  });

  describe('postCsv failure branches', () => {
    it('returns null when the POST throws', async () => {
      const { fetchImpl } = makeFetch([{ throwError: true }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      const out = await f.postCsv('a', 'b');
      expect(out).toBeNull();
    });

    it('returns null when response is !ok', async () => {
      const { fetchImpl } = makeFetch([{ ok: false }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      const out = await f.postCsv('a', 'b');
      expect(out).toBeNull();
    });

    it('returns parsed body when !json still resolves', async () => {
      const { fetchImpl } = makeFetch([{ ok: true, json: { command: 'x' } }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      const out = await f.postCsv('a', 'b');
      expect(out).toEqual({ command: 'x' });
    });

    it('returns null when the response body is not JSON', async () => {
      const { fetchImpl } = makeFetch([{ ok: true, json: '__THROW__' }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      await expect(f.postCsv('a', 'b')).resolves.toBeNull();
    });

    it('escapes double-quotes in the low-level CSV encoder', async () => {
      const { fetchImpl, calls } = makeFetch([{ ok: true, json: null }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.postCsv('/a"b', 'T"t');
      expect(calls[0]?.body).toBe('"/a""b","T""t"');
    });

    it('postCsv uses default empty strings when no args are passed', async () => {
      const { fetchImpl, calls } = makeFetch([{ ok: true, json: null }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      await f.postCsv();
      expect(calls[0]?.body).toBe('"",""');
    });

    it('postRawCsv uses default empty strings when no args are passed', async () => {
      const { fetchImpl, calls } = makeFetch([{ ok: true, json: null }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      await f.postRawCsv();
      expect(calls[0]?.body).toBe('"",""\n"",""');
    });

    it('postInitCsv uses default empty strings when no args are passed', async () => {
      const { fetchImpl, calls } = makeFetch([{ ok: true, json: null }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      await f.postInitCsv();
      expect(calls[0]?.body).toBe('"",""\n"",""\n"",""');
    });
  });

  describe('parseTocBody()', () => {
    it('returns [] for non-array or empty input', () => {
      expect(parseTocBody(null)).toEqual([]);
      expect(parseTocBody([])).toEqual([]);
    });

    it('drops cross-origin and traversal links from persisted TOC data', () => {
      expect(
        parseTocBody([
          ['#url', '#title'],
          ['https://evil.example', 'external'],
          ['//evil.example', 'protocol-relative'],
          ['/%2e%2e', 'traversal'],
          ['/safe.1', 'Safe'],
        ]),
      ).toEqual([{ link: '/safe.1', title: 'Safe', row: 5 }]);
    });

    it('bounds TOC fan-out and sheet-title length', () => {
      const rows = Array.from({ length: MAX_MULTI_SHEETS + 5 }, (_, index) => [
        `/room.${index + 1}`,
        't'.repeat(MAX_MULTI_SHEET_TITLE_LENGTH + 1),
      ]);
      const parsed = parseTocBody([['#url', '#title'], ...rows]);
      expect(parsed).toHaveLength(MAX_MULTI_SHEETS);
      expect(parsed[0]?.title).toHaveLength(MAX_MULTI_SHEET_TITLE_LENGTH);
    });

    it('encodes the complete SocialCalc text-command metacharacter set', () => {
      expect(encodeSocialCalcText('a:b\\c\rd\ne\r\nf')).toBe(
        'a\\cb\\bc\\nd\\ne\\nf',
      );
    });
  });

  describe('tocRowsEqual()', () => {
    it('compares link, title, and row index', () => {
      const a = [{ link: '/a', title: 'A', row: 2 }];
      const b = [{ link: '/a', title: 'A', row: 2 }];
      const c = [{ link: '/a', title: 'B', row: 2 }];
      expect(tocRowsEqual(a, b)).toBe(true);
      expect(tocRowsEqual(a, c)).toBe(false);
      expect(tocRowsEqual(a, [])).toBe(false);
    });
  });

  describe('refreshToc()', () => {
    it('returns false when id is unset', async () => {
      const f = new HackFoldr('http://x', { fetchImpl: makeFetch([]).fetchImpl });
      await expect(f.refreshToc()).resolves.toBe(false);
    });

    it('returns false and keeps rows on fetch failure', async () => {
      const { fetchImpl } = makeFetch([{ throwError: true }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];
      await expect(f.refreshToc()).resolves.toBe(false);
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
    });

    it('returns false when the server TOC is unchanged', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#url', '#title'], ['/r.1', 'Sheet1'], ['/r.2', 'Sheet2']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [
        { link: '/r.1', title: 'Sheet1', row: 2 },
        { link: '/r.2', title: 'Sheet2', row: 3 },
      ];
      await expect(f.refreshToc()).resolves.toBe(false);
    });

    it('updates rows and returns true when a peer adds a tab', async () => {
      const { fetchImpl } = makeFetch([
        {
          json: [
            ['#url', '#title'],
            ['/r.1', 'Sheet1'],
            ['/r.2', 'Sheet2'],
            ['/r.3', 'PeerTab'],
          ],
        },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [
        { link: '/r.1', title: 'Sheet1', row: 2 },
        { link: '/r.2', title: 'Sheet2', row: 3 },
      ];
      await expect(f.refreshToc()).resolves.toBe(true);
      expect(f.rows).toEqual([
        { link: '/r.1', title: 'Sheet1', row: 2 },
        { link: '/r.2', title: 'Sheet2', row: 3 },
        { link: '/r.3', title: 'PeerTab', row: 4 },
      ]);
    });

    it('updates rows and returns true when a peer renames a tab', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#url', '#title'], ['/r.1', 'RenamedByPeer']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];
      await expect(f.refreshToc()).resolves.toBe(true);
      expect(f.at(0)).toMatchObject({ title: 'RenamedByPeer' });
    });

    it('updates rows and returns true when a peer deletes a tab', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#url', '#title'], ['/r.1', 'Sheet1']] },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [
        { link: '/r.1', title: 'Sheet1', row: 2 },
        { link: '/r.2', title: 'Gone', row: 3 },
      ];
      await expect(f.refreshToc()).resolves.toBe(true);
      expect(f.rows).toHaveLength(1);
    });

    it('does not seed Sheet1 or flip init flags on refresh', async () => {
      const { fetchImpl } = makeFetch([{ json: [] }]);
      const f = new HackFoldr('http://x', { fetchImpl });
      f.id = 'r';
      f.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];
      f.wasNonExistent = false;
      f.wasEmpty = false;
      await expect(f.refreshToc()).resolves.toBe(false);
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
      expect(f.wasNonExistent).toBe(false);
      expect(f.wasEmpty).toBe(false);
    });
  });

});
