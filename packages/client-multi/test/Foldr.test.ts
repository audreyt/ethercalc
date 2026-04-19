import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HackFoldr, type FetchImpl } from '../src/Foldr.ts';

interface FakeRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

function makeFetch(
  responses: Array<{ ok?: boolean; json?: unknown; throwError?: boolean } | undefined>,
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

    it('marks was-non-existent when the response is empty, and seeds Sheet1', async () => {
      // Three calls total: GET → POST init-csv (3 rows) → POST csv (single row).
      // The legacy code deliberately re-posts the seed row via the outer push.
      const { fetchImpl, calls } = makeFetch([
        { json: [] }, // empty body → non-existent
        { ok: true, json: null }, // init-csv (3 rows)
        { ok: true, json: null }, // post-csv follow-up
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
      expect(f.wasNonExistent).toBe(false);
      expect(f.wasEmpty).toBe(false);
      expect(calls).toHaveLength(3);
      expect(calls[1]?.method).toBe('POST');
      expect(calls[1]?.body).toContain('"#url","#title"');
      expect(calls[1]?.body).toContain('"/r.1","Sheet1"');
      expect(calls[2]?.body).toBe('"/r.1","Sheet1"');
    });

    it('marks was-empty when the TOC response has only a header', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#url', '#title']] },
        { ok: true, json: null }, // post-raw-csv (2 rows)
        { ok: true, json: null }, // post-csv follow-up
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
      expect(f.wasEmpty).toBe(false);
      // The init POST writes the seed row twice (header-free since wasEmpty
      // is the "have-TOC-but-empty" case → post-raw-csv without the #header).
      expect(calls[1]?.body).toBe('"/r.1","Sheet1"\n"/r.1","Sheet1"');
      expect(calls[2]?.body).toBe('"/r.1","Sheet1"');
    });

    it('survives a thrown fetch (treats as non-existent)', async () => {
      const { fetchImpl } = makeFetch([
        { throwError: true },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
    });

    it('survives a !ok response (treats body as null → non-existent)', async () => {
      const { fetchImpl } = makeFetch([
        { ok: false },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      expect(f.rows).toEqual([{ link: '/r.1', title: 'Sheet1', row: 2 }]);
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
    it('posts a single-row CSV and picks up row from the server paste command', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] }, // fetch
        { ok: true, json: { command: [0, 'paste A7 all'] } }, // post-csv
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/new', title: 'New', row: 0 });
      expect(calls[1]?.headers).toMatchObject({ 'content-type': 'text/csv' });
      expect(calls[1]?.body).toBe('"/new","New"');
      expect(f.rows[1]).toMatchObject({ link: '/new', title: 'New', row: 7 });
    });

    it('falls back to existing row.row when server returns no paste command', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: {} }, // no command
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/new', title: 'New', row: 42 });
      expect(f.rows[1]).toMatchObject({ row: 42 });
    });

    it('honors a string command (not an array)', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: { command: 'paste A9 all' } },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 0 });
      // Non-[status, cmd] arrays don't match; only string passes through.
      expect(f.rows[1]?.row).toBe(9);
    });

    it('ignores array commands where [1] is not a string', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: { command: [0, 123] } },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 55 });
      expect(f.rows[1]?.row).toBe(55);
    });

    it('ignores command strings that do not match the paste regex', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: { command: [0, 'set A1 value 1'] } }, // not `paste A<n>`
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 77 });
      expect(f.rows[1]?.row).toBe(77);
    });

    it('survives a POST !ok (no paste update, row still appended)', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: false },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 3 });
      expect(f.rows[1]).toMatchObject({ row: 3 });
    });

    it('survives a POST throw (no paste update, row still appended)', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { throwError: true },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 3 });
      expect(f.rows[1]).toMatchObject({ row: 3 });
    });

    it('survives a POST whose body fails to json-parse', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: '__THROW__' },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 3 });
      expect(f.rows[1]).toMatchObject({ row: 3 });
    });

    it('double-row POST when pushing the first row of an empty room', async () => {
      // A fetch-from-empty room calls init → push internally, so by the time
      // the user invokes push({X}), was-empty is already cleared.
      const { fetchImpl, calls } = makeFetch([
        { json: [['#url', '#title']] }, // empty
        { ok: true, json: null }, // init post-raw-csv (2 rows)
        { ok: true, json: null }, // init follow-up post-csv
        { ok: true, json: { command: [0, 'paste A4 all'] } }, // push
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/x', title: 'X', row: 0 });
      expect(calls[1]?.body).toBe('"/r.1","Sheet1"\n"/r.1","Sheet1"');
      expect(calls[2]?.body).toBe('"/r.1","Sheet1"');
      expect(calls[3]?.body).toBe('"/x","X"');
      expect(f.rows[1]).toMatchObject({ row: 4 });
    });

    it('escapes double-quotes in CSV payloads', async () => {
      const { fetchImpl, calls } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: null },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/a"b', title: 'T"t', row: 0 });
      expect(calls[1]?.body).toBe('"/a""b","T""t"');
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

  describe('was-non-existent init flow', () => {
    it('on first push after non-existent state, writes a 3-row init + 1-row follow-up', async () => {
      // The fetch() on a never-seen room runs the full seed flow:
      //   GET → POST init-csv (3 rows: #url/#title, /r.1/Sheet1, /r.1/Sheet1)
      //       → POST csv (1 row: /r.1, Sheet1)
      // After that, was-non-existent and was-empty are cleared; the user's
      // subsequent push(/fresh) is a plain single-row POST.
      const { fetchImpl, calls } = makeFetch([
        { json: [] },
        { ok: true, json: null },
        { ok: true, json: null },
        { ok: true, json: { command: [0, 'paste A5 all'] } },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/fresh', title: 'Fresh', row: 0 });
      expect(calls[1]?.body).toBe(
        '"#url","#title"\n"/r.1","Sheet1"\n"/r.1","Sheet1"',
      );
      expect(calls[2]?.body).toBe('"/r.1","Sheet1"');
      expect(calls[3]?.body).toBe('"/fresh","Fresh"');
      expect(f.rows[1]?.row).toBe(5);
    });

    it('sendCmd triggers lazy init when sheet was non-existent (no row)', async () => {
      // This tests the `initIfNeeded(null)` branch when wasNonExistent is still
      // true — which can only happen if a caller invokes `sendCmd` or `push`
      // before `fetch` settled. We set the flags by hand to exercise it.
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

  describe('extractCommand', () => {
    it('ignores empty command field', async () => {
      const { fetchImpl } = makeFetch([
        { json: [['#', '#'], ['/a', 'A']] },
        { ok: true, json: { command: undefined } },
      ]);
      const f = new HackFoldr('http://x', { fetchImpl });
      await f.fetch('r');
      await f.push({ link: '/n', title: 'N', row: 77 });
      expect(f.rows[1]?.row).toBe(77);
    });
  });
});
