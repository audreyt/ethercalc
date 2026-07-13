import { describe, expect, it } from 'vitest';
import type { Env } from '../src/env.ts';
import { buildApp } from '../src/index.ts';

/**
 * Node-env tests for POST /_/:room (command execution). The Hono
 * route glue itself is ignored-file'd out of coverage (see sec 5.2),
 * but we assert the route's dispatch shape against a spy DO namespace.
 *
 * Pure-logic helpers (isLoadClipboard, isMultiCascade, ...) are
 * covered independently in lib-loadclipboard.node.test.ts and
 * post-command.node.test.ts.
 *
 * Note: Phase 5.1 landed a `?name=<room>` query param on every DO
 * fetch via do-dispatch.ts. Tests use `.includes(path)` instead of
 * `.endsWith(path)` to stay robust to that.
 */

interface Call {
  url: string;
  method: string;
  bodyText?: string;
}

interface FakeStub {
  fetch(
    input: Request | string,
    init?: RequestInit,
  ): Promise<Response>;
}

function makeFakeRoomNamespace(responder: (call: Call) => Response): {
  env: Env;
  calls: Call[];
} {
  const calls: Call[] = [];
  const stub: FakeStub = {
    async fetch(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      let bodyText: string | undefined;
      if (init?.body !== undefined) {
        bodyText =
          typeof init.body === 'string'
            ? init.body
            : await new Response(init.body as BodyInit).text();
      } else if (typeof input !== 'string' && input.method !== 'GET') {
        bodyText = await input.text();
      }
      const method =
        init?.method ?? (typeof input === 'string' ? 'GET' : input.method);
      const call: Call = {
        url,
        method,
        ...(bodyText !== undefined ? { bodyText } : {}),
      };
      calls.push(call);
      return responder(call);
    },
  };
  const env: Env = {
    ROOM: {
      idFromName: (n: string) => ({ n }) as unknown as DurableObjectId,
      get: () => stub as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
  return { env, calls };
}

describe('POST /_/:room — command execution', () => {
  it('returns 400 for an empty body', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('OK'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', { method: 'POST' }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Please send command');
    expect(calls).toHaveLength(0);
  });

  it('decodes an xlsx body into a loadclipboard+paste dispatch (202)', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response(null, { status: 202 }),
    );
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const XLSX = await import('@e965/xlsx');
    const ws = { '!ref': 'A1:A1', A1: { t: 's', v: 'hi' } };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: {
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: bytes as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const body = (await res.json()) as { command: string[] };
    expect(body.command[0]).toMatch(/^loadclipboard /);
    expect(body.command[body.command.length - 1]).toBe('paste A1 all');
    // The decoded command pair is dispatched to the DO as a newline batch.
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch).toBeDefined();
    expect(dispatch!.method).toBe('POST');
    expect(dispatch!.bodyText).toBe(body.command.join('\n'));
  });

  it('an empty/cell-less xlsx body is a no-op 202 that skips the DO', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('should not reach DO');
    });
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const XLSX = await import('@e965/xlsx');
    const ws = { '!ref': 'A1:A1' };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    /* eslint-enable @typescript-eslint/no-explicit-any */
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: {
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: bytes as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual([]);
    // No commands → no DO dispatch.
    expect(calls.find((c) => c.url.includes('/_do/commands'))).toBeUndefined();
  });

  it('filters the banned text-wiki format command (echoed but not executed)', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response(null, { status: 202 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          command: 'set sheet defaulttextvalueformat text-wiki',
        }),
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const body = (await res.json()) as { command: string };
    expect(body.command).toBe('set sheet defaulttextvalueformat text-wiki');
    expect(calls).toHaveLength(0);
  });

  it('forwards a JSON string command to /_do/commands as-is', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response(null, { status: 202 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: 'set A1 value n 1' }),
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string };
    expect(body.command).toBe('set A1 value n 1');
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch).toBeDefined();
    expect(dispatch!.method).toBe('POST');
    expect(dispatch!.bodyText).toBe('set A1 value n 1');
  });

  it('forwards a JSON array command as a newline-joined batch', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response(null, { status: 202 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          command: ['set A1 value n 1', 'set A2 value n 2'],
        }),
      }),
      env as never,
    );
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual(['set A1 value n 1', 'set A2 value n 2']);
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe('set A1 value n 1\nset A2 value n 2');
  });

  it('forwards a text/x-socialcalc command body to /_do/commands', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) {
        return new Response('', { status: 404 });
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A1 value n 42',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe('set A1 value n 42');
    // No loadclipboard snapshot read -- non-LC bodies skip the branch.
    const snapshotCalls = calls.filter((c) => c.url.includes('/_do/snapshot'));
    expect(snapshotCalls).toHaveLength(0);
  });

  it('auto-enriches loadclipboard with paste A2 all when snapshot is empty', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) return new Response('', { status: 404 });
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'loadclipboard cell:A1:t:hi\\ncopiedfrom:A1:A1\\n',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual([
      'loadclipboard cell:A1:t:hi\\ncopiedfrom:A1:A1\\n',
      'paste A2 all',
    ]);
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe(
      'loadclipboard cell:A1:t:hi\\ncopiedfrom:A1:A1\\n\npaste A2 all',
    );
  });

  it('auto-enriches loadclipboard with paste A(lastrow+1) when snapshot has sheet dim', async () => {
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) {
        return new Response('version:1.5\nsheet:c:3:r:5:tvf:g\n');
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'loadclipboard foo',
      }),
      env as never,
    );
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual(['loadclipboard foo', 'paste A6 all']);
  });

  it('loadclipboard with ?row=N prepends insertrow + paste at that row', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) {
        return new Response('version:1.5\nsheet:c:3:r:5:tvf:g\n');
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r?row=7', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'loadclipboard foo',
      }),
      env as never,
    );
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual([
      'loadclipboard foo',
      'insertrow A7',
      'paste A7 all',
    ]);
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe(
      'loadclipboard foo\ninsertrow A7\npaste A7 all',
    );
  });

  it('multi-cascade: renames an OWN sub-sheet (<room>.<n>) to <room>.<n>.bak', async () => {
    // Legitimate path: the multi-sheet editor cascade-deletes one of its
    // own sub-sheets, which are always named `<room>.<n>`.
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot') && call.method === 'GET') {
        return new Response(
          'version:1.5\n' +
            'sheet:c:2:r:5:tvf:g\n' +
            'cell:A5:t:/r.1\n',
          { status: 200 },
        );
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A5:B3 empty multi-cascade',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    const renameCall = calls.find((c) => c.url.includes('/_do/rename'));
    expect(renameCall).toBeDefined();
    expect(renameCall!.method).toBe('POST');
    expect(JSON.parse(renameCall!.bodyText!)).toEqual({ to: 'r.1.bak' });
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe('set A5:B3 empty multi-cascade');
  });

  it('multi-cascade: does NOT rename a foreign room (H-4 cross-tenant guard)', async () => {
    // SECURITY: the target room name is read from attacker-controllable
    // cell text. A name outside this room's `<room>.` namespace must be
    // ignored so a POST can't move/destroy an unrelated tenant's room.
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot') && call.method === 'GET') {
        return new Response(
          'version:1.5\n' +
            'sheet:c:2:r:5:tvf:g\n' +
            'cell:A5:t:/victim-room\n',
          { status: 200 },
        );
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A5:B3 empty multi-cascade',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    // No rename fired — the foreign room is untouched.
    expect(calls.find((c) => c.url.includes('/_do/rename'))).toBeUndefined();
    // The command itself still executes (legacy "proceed regardless").
    const dispatch = calls.find((c) => c.url.includes('/_do/commands'));
    expect(dispatch!.bodyText).toBe('set A5:B3 empty multi-cascade');
  });

  it('multi-cascade: does NOT rename a prefix-sibling that is not a sub-room', async () => {
    // `r-evil` shares the literal prefix `r` but is NOT `r.<...>`; the
    // dot-boundary check must reject it.
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot') && call.method === 'GET') {
        return new Response(
          'version:1.5\nsheet:c:2:r:5:tvf:g\ncell:A5:t:/r-evil\n',
          { status: 200 },
        );
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A5:B3 empty multi-cascade',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(calls.find((c) => c.url.includes('/_do/rename'))).toBeUndefined();
  });

  it('multi-cascade: proceeds without rename when snapshot has no matching cell', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot') && call.method === 'GET') {
        return new Response('version:1.5\n');
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A1:B2 empty multi-cascade',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(calls.find((c) => c.url.includes('/_do/rename'))).toBeUndefined();
  });

  it('multi-cascade: proceeds without rename when snapshot is absent', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot') && call.method === 'GET') {
        return new Response('', { status: 404 });
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'set A1:B2 empty multi-cascade',
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(calls.find((c) => c.url.includes('/_do/rename'))).toBeUndefined();
  });

  it('empty JSON command body returns 400', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('OK'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ command: '' }),
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('?row=abc (non-numeric) falls back to snapshot-derived row', async () => {
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) {
        return new Response('', { status: 404 });
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r?row=notanumber', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'loadclipboard foo',
      }),
      env as never,
    );
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toEqual(['loadclipboard foo', 'paste A2 all']);
  });

  it('returns 413 when the xlsx zip contains oversized XML files', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('should not reach DO');
    });
    // Construct a fake zip that will trigger ImportArchiveTooLargeError
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/worksheets/sheet2.xml', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 },
    ]);
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: {
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: bytes as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(413);
    const body = await res.text();
    expect(body).toContain('xlsx/ods import expands to');
    expect(calls.find((c) => c.url.includes('/_do/commands'))).toBeUndefined();
  });

  it('returns 400 when xlsx cells exceed SocialCalc ZZ column', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('should not reach DO');
    });
    const XLSX = await import('@e965/xlsx');
    const ws = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      AAA1: { t: 'n', v: 703 },
    };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: {
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: bytes as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/ZZ/);
    expect(body).toContain('AAA1');
    expect(calls.find((c) => c.url.includes('/_do/commands'))).toBeUndefined();
  });

  it('returns 400 when text/csv cells exceed SocialCalc ZZ column', async () => {
    // Pins rooms.ts csv-deferred ImportColumnOutOfRangeError → 400 mapping.
    // SheetJS reads a 703-column CSV as A1:AAA1; enforceSocialCalcColumnLimit
    // rejects before loadclipboard dispatch.
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('should not reach DO');
    });
    const cells = Array(703).fill('');
    cells[0] = '1';
    cells[702] = '703';
    const csv = `${cells.join(',')}\n`;
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: csv,
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toMatch(/ZZ/);
    expect(body).toMatch(/column/i);
    expect(body).toContain('AAA1');
    expect(calls.find((c) => c.url.includes('/_do/commands'))).toBeUndefined();
    expect(calls.find((c) => c.url.includes('/_do/snapshot'))).toBeUndefined();
  });

  it('POST text/csv converts to loadclipboard+paste and dispatches enriched array (202)', async () => {
    // Snapshot ends at row 5 → paste at A6.
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/snapshot')) {
        return new Response('version:1.5\nsheet:c:3:r:5:tvf:g\n');
      }
      return new Response(null, { status: 202 });
    });
    const app = buildApp();
    const csv = '"#url","#title"\n"/r.1","Sheet1"\n';
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'POST',
        headers: { 'content-type': 'text/csv' },
        body: csv,
      }),
      env as never,
    );
    expect(res.status).toBe(202);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    const body = (await res.json()) as { command: string[] };
    expect(body.command).toHaveLength(2);
    expect(body.command[0]).toMatch(/^loadclipboard /);
    expect(body.command[1]).toBe('paste A6 all');
    // Exactly one DO commands dispatch, body is the array joined by \n.
    const dispatches = calls.filter((c) => c.url.includes('/_do/commands'));
    expect(dispatches).toHaveLength(1);
    expect(dispatches[0]!.bodyText).toBe(body.command.join('\n'));
    // Raw CSV must NOT be sent to the DO.
    expect(dispatches[0]!.bodyText).not.toContain('"#url"');
  });
});

function makeFakeZipCentralDirectory(
  entries: Array<{ name: string; compressedSize: number; uncompressedSize: number }>
): Uint8Array {
  const cdHeaders: Uint8Array[] = [];
  let cdOffset = 0;
  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const header = new Uint8Array(46 + nameBytes.length);
    header[0] = 0x50;
    header[1] = 0x4b;
    header[2] = 0x01;
    header[3] = 0x02;
    header[20] = entry.compressedSize & 0xff;
    header[21] = (entry.compressedSize >> 8) & 0xff;
    header[22] = (entry.compressedSize >> 16) & 0xff;
    header[23] = (entry.compressedSize >> 24) & 0xff;
    header[24] = entry.uncompressedSize & 0xff;
    header[25] = (entry.uncompressedSize >> 8) & 0xff;
    header[26] = (entry.uncompressedSize >> 16) & 0xff;
    header[27] = (entry.uncompressedSize >> 24) & 0xff;
    header[28] = nameBytes.length & 0xff;
    header[29] = (nameBytes.length >> 8) & 0xff;
    header.set(nameBytes, 46);
    cdHeaders.push(header);
    cdOffset += header.length;
  }
  const eocd = new Uint8Array(22);
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06;
  eocd[8] = entries.length & 0xff;
  eocd[9] = (entries.length >> 8) & 0xff;
  eocd[10] = entries.length & 0xff;
  eocd[11] = (entries.length >> 8) & 0xff;
  eocd[12] = cdOffset & 0xff;
  eocd[13] = (cdOffset >> 8) & 0xff;
  eocd[14] = (cdOffset >> 16) & 0xff;
  eocd[15] = (cdOffset >> 24) & 0xff;
  eocd[16] = 0;
  eocd[17] = 0;
  eocd[18] = 0;
  eocd[19] = 0;
  const result = new Uint8Array(cdOffset + eocd.length);
  let pos = 0;
  for (const header of cdHeaders) {
    result.set(header, pos);
    pos += header.length;
  }
  result.set(eocd, pos);
  return result;
}
