import { env } from 'cloudflare:test';
import * as XLSX from '@e965/xlsx';
import { describe, expect, it } from 'vite-plus/test';
import type { Env } from '../src/env.ts';
import { doFetch } from '../src/lib/do-dispatch.ts';
import worker from '../src/index.ts';
const AUTH_UID = 'uid-passkey-1';
const AUTH_EXP = Number.MAX_SAFE_INTEGER;
const AUTH_COOKIE = '__Host-ec_sess=tok-valid';

function withAuth(e: Env, uid: string = AUTH_UID): Env {
  return {
    ...e,
    ETHERCALC_AUTH: '1',
    ETHERCALC_ORIGIN: 'https://example.test',
    AUTH: {
      idFromName: () => ({}) as DurableObjectId,
      get: () =>
        ({
          fetch: async () => Response.json({ uid, exp: AUTH_EXP }),
        }) as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
}

async function request(method: string, path: string, body?: BodyInit | Uint8Array | null): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { method, body: body as unknown as BodyInit | null });
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  } satisfies Partial<ExecutionContext> as unknown as ExecutionContext;
  return worker.fetch(req, env as unknown as Env, ctx);
}

async function requestWithAuth(method: string, path: string, body?: BodyInit | Uint8Array | null): Promise<Response> {
  const req = new Request(`https://example.test${path}`, {
    method,
    headers: { Cookie: AUTH_COOKIE },
    body: body as unknown as BodyInit | null,
  });
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  } satisfies Partial<ExecutionContext> as unknown as ExecutionContext;
  return worker.fetch(req, withAuth(env as unknown as Env) as never, ctx);
}
/** POST a JSON `{command}` body to the real command route (`POST /_/:room`). */
async function postCommand(room: string, command: string): Promise<Response> {
  const req = new Request(`https://example.test/_/${room}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  } satisfies Partial<ExecutionContext> as unknown as ExecutionContext;
  return worker.fetch(req, env as unknown as Env, ctx);
}

function twoSheetXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['hello', 1]]), 'First');
  // Second sheet carries a formula so we can prove formula fidelity on a
  // NON-first sheet (acceptance criterion 2).
  const second = XLSX.utils.aoa_to_sheet([[10], [20]]);
  second.A3 = { t: 'n', f: 'SUM(A1:A2)' };
  second['!ref'] = 'A1:A3';
  XLSX.utils.book_append_sheet(wb, second, 'Second');
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('PUT multi-sheet import', () => {
  it('PUT /=:room.xlsx imports a workbook into TOC + sub-rooms and round-trips through export', async () => {
    const room = `mimport-${Math.random().toString(36).slice(2, 8)}`;
    const put = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(put.status).toBe(201);
    expect(await put.text()).toBe('OK');

    // Sub-rooms exist.
    const sub1 = await request('GET', `/_/${room}.1`);
    expect(sub1.status).toBe(200);
    expect(await sub1.text()).toContain('hello');

    // Formula fidelity on the NON-first sheet (acceptance criterion 2):
    // the second sub-room's raw save keeps the formula text.
    const sub2 = await request('GET', `/_/${room}.2`);
    expect(await sub2.text()).toContain('SUM(A1\\cA2)');

    // Round-trip: re-export the multi-sheet workbook and confirm both sheets survive.
    const exp = await request('GET', `/_/=${room}/xlsx`);
    expect(exp.status).toBe(200);
    const wb = XLSX.read(new Uint8Array(await exp.arrayBuffer()), { type: 'array' });
    expect(wb.SheetNames).toEqual(['First', 'Second']);
  });

  it('PUT /_/=:room/ods is accepted too', async () => {
    const room = `mimport-ods-${Math.random().toString(36).slice(2, 8)}`;
    const res = await request('PUT', `/_/=${room}/ods`, twoSheetXlsx());
    expect(res.status).toBe(201);
  });

  it('rejects an oversized suffix-import body before workbook parsing', async () => {
    const req = new Request('https://example.test/=oversized.xlsx', {
      method: 'PUT',
      headers: { 'Content-Length': String(25 * 1024 * 1024 + 1) },
      body: 'not-a-workbook',
    });
    const ctx = {
      waitUntil() {},
      passThroughOnException() {},
    } satisfies Partial<ExecutionContext> as unknown as ExecutionContext;
    const response = await worker.fetch(req, env as unknown as Env, ctx);
    expect(response.status).toBe(413);
  });

  it('PUT /=:room.xlsx returns 400 when a sheet exceeds SocialCalc ZZ column', async () => {
    // Pins routes/multi-import.ts ImportColumnOutOfRangeError → 400 mapping.
    // Removing that catch (or mapping to 413/500) fails this test.
    const room = `mimport-aaa-${Math.random().toString(36).slice(2, 8)}`;
    const ws = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      AAA1: { t: 'n', v: 703 },
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wide');
    const bytes = new Uint8Array(
      XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer,
    );

    const put = await request('PUT', `/=${room}.xlsx`, bytes);
    expect(put.status).toBe(400);
    expect(put.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    const body = await put.text();
    expect(body).toMatch(/ZZ/);
    expect(body).toContain('AAA1');
    expect(body).toMatch(/column/i);

    // Fail closed: no TOC or sub-room snapshot was written.
    const toc = await request('GET', `/_/${room}`);
    expect(toc.status).toBe(404);
    const sub1 = await request('GET', `/_/${room}.1`);
    expect(sub1.status).toBe(404);
  });
});
describe('POST multi-sheet append import', () => {
  it('POST /=:room.xlsx appends worksheets strictly after the current max index and updates TOC', async () => {
    const room = `mappend-${Math.random().toString(36).slice(2, 8)}`;

    // Initial 2-sheet PUT
    const putRes = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(putRes.status).toBe(201);

    // Append 2 sheets via POST
    const postRes = await request('POST', `/=${room}.xlsx`, twoSheetXlsx());
    expect(postRes.status).toBe(201);

    // Assert TOC has 4 sheets (.1, .2, .3, .4)
    const tocJson = await request('GET', `/_/${room}/csv.json`);
    expect(tocJson.status).toBe(200);
    const tocGrid = (await tocJson.json()) as string[][];
    expect(tocGrid).toEqual([
      ['#url', '#title'],
      [`/${room}.1`, 'First'],
      [`/${room}.2`, 'Second'],
      [`/${room}.3`, 'First_3'],
      [`/${room}.4`, 'Second_4'],
    ]);

    // Assert original subrooms .1 and .2 were not overwritten
    const cells1 = (await (await request('GET', `/_/${room}.1/cells`)).json()) as Record<
      string,
      { datavalue?: unknown }
    >;
    expect(cells1.A1?.datavalue).toBe('hello');

    // Assert appended subroom .3 exists and has value
    const cells3 = (await (await request('GET', `/_/${room}.3/cells`)).json()) as Record<
      string,
      { datavalue?: unknown }
    >;
    expect(cells3.A1?.datavalue).toBe('hello');
  });

  it('POST /_/:room/ods is accepted too for append', async () => {
    const room = `mappend-ods-${Math.random().toString(36).slice(2, 8)}`;
    const postRes = await request('POST', `/_/=${room}/ods`, twoSheetXlsx());
    expect(postRes.status).toBe(201);
  });

  it('POST /=:room.xlsx returns 400 when a sheet exceeds SocialCalc ZZ column', async () => {
    const room = `mappend-overflow-${Math.random().toString(36).slice(2, 8)}`;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['ok']]);
    ws.AAA1 = { t: 's', v: 'too wide' };
    ws['!ref'] = 'A1:AAA1';
    XLSX.utils.book_append_sheet(wb, ws, 'TooWide');
    const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);

    const res = await request('POST', `/=${room}.xlsx`, bytes);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain('exceeds SocialCalc max ZZ');
  });
  it('rejects append and replace on private multi-sheet rooms for every format', async () => {
    const base = `mpriv-${Math.random().toString(36).slice(2, 8)}`;
    const initRes = await doFetch(
      env as unknown as Env,
      base,
      '/_do/init-private',
      {
        method: 'POST',
        body: JSON.stringify({
          snapshot: '# SocialCalc\n',
          acl: { owner: 'uid-passkey-1', readers: [], writers: [] },
        }),
      },
      { uid: 'uid-passkey-1', exp: Number.MAX_SAFE_INTEGER },
    );
    expect(initRes.status).toBe(201);

    const privateMsg =
      'Multi-sheet import is unavailable for private rooms because new sub-sheets would be public.';

    // Unauthenticated workbook POST is denied before the private-room message.
    const unauthedPost = await request('POST', `/=${base}.xlsx`, twoSheetXlsx());
    expect(unauthedPost.status).toBe(403);
    expect(await unauthedPost.text()).toBe('Forbidden');

    // Authenticated owner: every append/replace format refuses with 409 and creates no child.
    // (Fresh sub-rooms have no ACL and would otherwise publish as public — the bypass class.)
    const cases: Array<{ method: 'POST' | 'PUT'; path: string; body: BodyInit | Uint8Array }> = [
      { method: 'POST', path: `/=${base}.xlsx`, body: twoSheetXlsx() },
      { method: 'PUT', path: `/=${base}.xlsx`, body: twoSheetXlsx() },
      { method: 'POST', path: `/=${base}.csv`, body: 'secret,value\n1,2' },
      { method: 'POST', path: `/=${base}.tsv`, body: 'secret\tvalue\n1\t2' },
      { method: 'POST', path: `/=${base}.txt`, body: 'secret,value\n1,2' },
      {
        method: 'POST',
        path: `/=${base}.socialcalc`,
        body: 'cell:A1:t:leaked\n',
      },
      { method: 'POST', path: `/_/=${base}/csv?title=Leak`, body: 'a,b\n1,2' },
    ];

    for (const c of cases) {
      const res = await requestWithAuth(c.method, c.path, c.body);
      expect(res.status).toBe(409);
      expect(await res.text()).toBe(privateMsg);
    }

    // No imported subroom exists after refusal. Policy forbids private multi-sheet import
    // rather than minting ACL-inheriting children, so there is no child that could answer
    // 401/403 — a regression that published a public child would yield 200 here instead.
    const subRes = await request('GET', `/_/${base}.1`);
    expect(subRes.status).toBe(404);
    expect(subRes.status).not.toBe(200);
  });

  it('POST text formats append one sheet on a public parent and keep it world-readable', async () => {
    const room = `mtext-${Math.random().toString(36).slice(2, 8)}`;
    const seed = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(seed.status).toBe(201);

    const csvPost = await request(
      'POST',
      `/_/=${room}/csv?title=CSVData`,
      'name,value\ncafe,42',
    );
    expect(csvPost.status).toBe(201);

    const tsvPost = await request('POST', `/=${room}.tsv?title=TSVData`, 'a\tb\n1\t2');
    expect(tsvPost.status).toBe(201);

    const txtPost = await request('POST', `/=${room}.txt?title=TXTData`, 'x,y\n3,4');
    expect(txtPost.status).toBe(201);

    const scPost = await request(
      'POST',
      `/=${room}.socialcalc?title=SCData`,
      'cell:A1:t:hello-sc\n',
    );
    expect(scPost.status).toBe(201);

    const tocJson = await request('GET', `/_/${room}/csv.json`);
    expect(tocJson.status).toBe(200);
    const tocGrid = (await tocJson.json()) as string[][];
    expect(tocGrid).toEqual([
      ['#url', '#title'],
      [`/${room}.1`, 'First'],
      [`/${room}.2`, 'Second'],
      [`/${room}.3`, 'CSVData'],
      [`/${room}.4`, 'TSVData'],
      [`/${room}.5`, 'TXTData'],
      [`/${room}.6`, 'SCData'],
    ]);

    // Unauthenticated direct GET of imported subrooms succeeds on a public parent
    // (proves the fix is not a blanket deny). Owner path is the same public GET here.
    const csvGet = await request('GET', `/_/${room}.3`);
    expect(csvGet.status).toBe(200);
    expect(await csvGet.text()).toMatch(/cafe|42/);

    const scGet = await request('GET', `/_/${room}.6`);
    expect(scGet.status).toBe(200);
    expect(await scGet.text()).toContain('hello-sc');

    const cells = (await (
      await request('GET', `/_/${room}.3/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    // SheetJS/csv path stores values; accept either string cells from SocialCalc save.
    expect(cells.A1?.datavalue === 'name' || cells.A1?.datavalue === 'cafe' || cells.A2?.datavalue === 'cafe').toBe(
      true,
    );
  });

  it('rejects an oversized text append body before parsing', async () => {
    const req = new Request('https://example.test/=oversized.csv', {
      method: 'POST',
      headers: { 'Content-Length': String(25 * 1024 * 1024 + 1) },
      body: 'x',
    });
    const ctx = {
      waitUntil() {},
      passThroughOnException() {},
    } satisfies Partial<ExecutionContext> as unknown as ExecutionContext;
    const response = await worker.fetch(req, env as unknown as Env, ctx);
    expect(response.status).toBe(413);
  });
});

describe('canonical two-sheet workbook: TOC + child contract', () => {
  it('exact TOC rows, exact child values/formula, durable single-child mutation via real command route', async () => {
    const room = `mcanon-${Math.random().toString(36).slice(2, 8)}`;
    const put = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(put.status).toBe(201);

    // ── 1. Exact TOC #url/#title rows via the real csv.json route. ──
    const tocJson = await request('GET', `/_/${room}/csv.json`);
    expect(tocJson.status).toBe(200);
    const tocGrid = (await tocJson.json()) as string[][];
    expect(tocGrid).toEqual([
      ['#url', '#title'],
      [`/${room}.1`, 'First'],
      [`/${room}.2`, 'Second'],
    ]);

    // ── 2. Exact child values via the real /cells route (not source text). ──
    const cells1 = (await (
      await request('GET', `/_/${room}.1/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    expect(cells1.A1?.datavalue).toBe('hello');
    expect(cells1.B1?.datavalue).toBe(1);

    // Exact formula RESULT on the non-first sheet, via /cells/:cell (public
    // route), proving recalc landed a real value — not just formula text.
    const a3Before = (await (
      await request('GET', `/_/${room}.2/cells/A3`)
    ).json()) as { datavalue?: unknown; formula?: unknown } | null;
    expect(a3Before?.formula).toBe('SUM(A1:A2)');
    expect(a3Before?.datavalue).toBe(30);

    // ── 3. Mutate ONE child through the real command route. ──
    const patch = await postCommand(`${room}.1`, 'set A1 text t patched');
    expect(patch.status).toBe(202);

    // ── 4. Durable: child.1's mutation persists on a fresh read. ──
    const a1After = (await (
      await request('GET', `/_/${room}.1/cells/A1`)
    ).json()) as { datavalue?: unknown } | null;
    expect(a1After?.datavalue).toBe('patched');

    // ── 5. Isolation: the OTHER child (.2) is byte-for-byte unchanged —
    // fails if commands ever route to the wrong sub-room or one child
    // clobbers another. ──
    const cells2After = (await (
      await request('GET', `/_/${room}.2/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    expect(cells2After.A1?.datavalue).toBe(10);
    expect(cells2After.A2?.datavalue).toBe(20);
    expect(cells2After.A3?.datavalue).toBe(30);

    // ── 6. Isolation: the TOC itself is byte-for-byte unchanged — fails
    // if a child command ever routes to the TOC room instead. ──
    const tocAfter = (await (
      await request('GET', `/_/${room}/csv.json`)
    ).json()) as string[][];
    expect(tocAfter).toEqual(tocGrid);

    // ── 7. B1 on child .1 (untouched cell in the mutated room) also
    // survived the single-cell command — proves the command was a
    // surgical `set`, not an accidental snapshot replace. ──
    const b1After = (await (
      await request('GET', `/_/${room}.1/cells/B1`)
    ).json()) as { datavalue?: unknown } | null;
    expect(b1After?.datavalue).toBe(1);
  });

  it('a command posted to the TOC room does not reach either child (routing isolation)', async () => {
    const room = `mcanon-toc-${Math.random().toString(36).slice(2, 8)}`;
    const put = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(put.status).toBe(201);

    const before1 = (await (
      await request('GET', `/_/${room}.1/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    const before2 = (await (
      await request('GET', `/_/${room}.2/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;

    // Mutate the TOC room directly (not a sub-room) through the real
    // command route.
    const tocPatch = await postCommand(room, 'set C9 text t toc-only-edit');
    expect(tocPatch.status).toBe(202);

    // TOC itself carries the new cell...
    const tocCells = (await (
      await request('GET', `/_/${room}/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    expect(tocCells.C9?.datavalue).toBe('toc-only-edit');

    // ...but NEITHER child sub-room does. If a TOC command were ever
    // mis-routed to a child DO (e.g. a stale room-id bug), one of these
    // would flip to 'toc-only-edit' and the test fails.
    const after1 = (await (
      await request('GET', `/_/${room}.1/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    const after2 = (await (
      await request('GET', `/_/${room}.2/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    expect(after1).toEqual(before1);
    expect(after2).toEqual(before2);
    expect(after1.C9).toBeUndefined();
    expect(after2.C9).toBeUndefined();
  });

  it('cross-sheet formula recalculation through real DO routes: child .1 references child .2 by room id', async () => {
    // Deferred-if-unsupported clause: the harness DOES support real
    // cross-sheet recalculation (proven in exports.test.ts's
    // "cross-sheet formula resolves via sibling DO hydration"), so this
    // is exercised for real rather than deferred. hydrateCrossSheetRefs
    // resolves formula refs by ROOM NAME (e.g. `<room>.2`), which is
    // exactly the sub-room naming the multi-sheet importer assigns —
    // so we set the cross-sheet formula via the real command route
    // rather than embedding it in the imported xlsx (SheetJS would
    // instead emit a SHEET-NAME ref like `Second!A1`, which the room-id
    // based resolver does not recognize).
    const room = `mcanon-xref-${Math.random().toString(36).slice(2, 8)}`;
    const put = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(put.status).toBe(201);

    // child .1 gains a formula referencing child .2's A3 (the SUM result).
    const res = await postCommand(`${room}.1`, `set C1 formula '${room}.2'!A3`);
    expect(res.status).toBe(202);

    // Real DO-to-DO hydration + recalc landed the live cross-sheet value.
    const c1 = (await (
      await request('GET', `/_/${room}.1/cells/C1`)
    ).json()) as { datavalue?: unknown; formula?: unknown } | null;
    expect(c1?.formula).toBe(`'${room}.2'!A3`);
    expect(c1?.datavalue).toBe(30);

    // The referenced child (.2) itself is untouched by being READ as a
    // cross-sheet sibling.
    const cells2 = (await (
      await request('GET', `/_/${room}.2/cells`)
    ).json()) as Record<string, { datavalue?: unknown }>;
    expect(cells2.A1?.datavalue).toBe(10);
    expect(cells2.A2?.datavalue).toBe(20);
    expect(cells2.A3?.datavalue).toBe(30);
  });
});
