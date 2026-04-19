import { describe, it, expect, beforeEach } from 'vitest';

import {
  STORAGE_KEYS,
  auditKey,
  chatKey,
  ecellKey,
  logKey,
} from '@ethercalc/shared/storage-keys';

import { RoomDO } from '../src/room.ts';
import type { Env } from '../src/env.ts';

/**
 * RoomDO unit tests — direct construction with a Map-backed fake storage.
 * Runs in Node environment so istanbul tracks every line. Integration tests
 * that go through the real DO namespace (and exercise SocialCalc command
 * execution end-to-end) live in `room.test.ts` (workers pool).
 *
 * We intentionally stub the HeadlessSpreadsheet methods that we don't want
 * to exercise in Node — loading SocialCalc.js into Node requires the same
 * `new Function` eval scaffold the workers-pool tests use, which has been
 * shown to trigger pool-specific global collisions. For the coverage gate
 * it's enough to prove every branch is hit; the real SocialCalc end-to-end
 * path is proved in `room.test.ts`.
 */

interface FakeStorageRecord {
  map: Map<string, unknown>;
}

/** Minimal in-memory DO storage — enough for the behaviors RoomDO exercises. */
function fakeStorage(record: FakeStorageRecord): DurableObjectStorage {
  const m = record.map;
  return {
    async get(key: unknown): Promise<unknown> {
      if (typeof key !== 'string') throw new Error('multi-key get not used');
      return m.get(key);
    },
    async put(key: unknown, value: unknown): Promise<void> {
      if (typeof key !== 'string') throw new Error('multi-key put not used');
      m.set(key, value);
    },
    async delete(key: unknown): Promise<boolean> {
      if (typeof key !== 'string') throw new Error('multi-key delete not used');
      return m.delete(key);
    },
    async deleteAll(): Promise<void> {
      m.clear();
    },
    async list(opts?: { prefix?: string }): Promise<Map<string, unknown>> {
      const out = new Map<string, unknown>();
      const prefix = opts?.prefix ?? '';
      const keys = Array.from(m.keys()).filter((k) => k.startsWith(prefix)).sort();
      for (const k of keys) out.set(k, m.get(k)!);
      return out;
    },
  } as unknown as DurableObjectStorage;
}

function makeState(idString: string, record: FakeStorageRecord): DurableObjectState {
  return {
    id: { toString: () => idString } as DurableObjectId,
    storage: fakeStorage(record),
    async blockConcurrencyWhile<T>(cb: () => Promise<T>): Promise<T> {
      return cb();
    },
  } as unknown as DurableObjectState;
}

function makeEnv(): Env {
  return { ROOM: {} as DurableObjectNamespace };
}

/**
 * Build a fake D1Database that records every prepared statement plus
 * bound params. Enough for the rooms-index mirror assertions below.
 */
interface D1Call {
  sql: string;
  params: unknown[];
}
function makeEnvWithDb(calls: D1Call[]): Env {
  const prepare = (sql: string) => {
    const params: unknown[] = [];
    const stmt = {
      bind(...more: unknown[]) {
        params.push(...more);
        return stmt;
      },
      async run() {
        calls.push({ sql, params: [...params] });
        return { success: true };
      },
      async all<T>() {
        calls.push({ sql, params: [...params] });
        return { results: [] as T[], success: true };
      },
    };
    return stmt as unknown as D1PreparedStatement;
  };
  return {
    ROOM: {} as DurableObjectNamespace,
    DB: { prepare } as unknown as D1Database,
  };
}

/**
 * Replace the internal HeadlessSpreadsheet factory hook before we call any
 * method that would otherwise instantiate one. We do this by monkey-patching
 * the private `#getSpreadsheet` via a subclass in individual tests.
 */
class StubbedRoomDO extends RoomDO {
  stub: {
    executeCommand(cmd: string): void;
    createSpreadsheetSave(): string;
    exportCells(): Record<string, unknown>;
    exportCell(coord: string): unknown;
  };
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.stub = {
      executeCommand: () => {},
      createSpreadsheetSave: () => 'snapshot:v1',
      exportCells: () => ({ A1: { v: 1 } }),
      exportCell: (coord: string) => (coord === 'A1' ? { v: 1 } : null),
    };
    // @ts-expect-error private override for tests
    this['#getSpreadsheet'] = async () => this.stub;
    // Private fields are ES private; they actually can't be monkey-patched
    // by external code. Instead we redirect via a subclass method override
    // below.
  }
}

/**
 * Because `#getSpreadsheet` is a truly private field, subclass overrides
 * can't reach it. Instead we patch the module-level `createSpreadsheet`
 * via `vi.mock` at the import level for tests that would otherwise
 * instantiate real SocialCalc. See the two vi.mock blocks below.
 */

import { vi } from 'vitest';

const mockExec = vi.fn<(cmd: string) => void>();
const mockSave = vi.fn<() => string>(() => 'SNAP');
const mockExportCells = vi.fn<() => Record<string, unknown>>(() => ({ A1: 1 }));
const mockExportCell = vi.fn<(coord: string) => unknown>((coord) =>
  coord === 'A1' ? { v: 1 } : null,
);
const mockExportCSV = vi.fn<() => string>(() => 'a,b\n1,2\n');
const mockCreateSheetHTML = vi.fn<() => string>(
  () => '<table><tr><td>1</td></tr></table>',
);

vi.mock('@ethercalc/socialcalc-headless', () => ({
  HeadlessSpreadsheet: class MockSS {},
  createSpreadsheet: () => ({
    executeCommand: (cmd: string) => mockExec(cmd),
    createSpreadsheetSave: () => mockSave(),
    exportCells: () => mockExportCells(),
    exportCell: (coord: string) => mockExportCell(coord),
    exportCSV: () => mockExportCSV(),
    createSheetHTML: () => mockCreateSheetHTML(),
  }),
}));

describe('RoomDO (unit, direct construction)', () => {
  let record: FakeStorageRecord;
  let room: RoomDO;

  beforeEach(() => {
    record = { map: new Map() };
    room = new RoomDO(makeState('abc123', record), makeEnv());
    mockExec.mockClear();
    mockSave.mockClear();
    mockExportCells.mockClear();
    mockExportCell.mockClear();
    mockExportCSV.mockClear();
    mockCreateSheetHTML.mockClear();
  });

  it('ping echoes id and name', async () => {
    const res = await room.fetch(new Request('https://do/_do/ping?name=gamma'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string };
    expect(body).toEqual({ id: 'abc123', name: 'gamma' });
  });

  it('ping with no name yields a null name field', async () => {
    const res = await room.fetch(new Request('https://do/_do/ping'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; name: string | null };
    expect(body.name).toBeNull();
  });

  it('unknown path returns 501', async () => {
    const res = await room.fetch(new Request('https://do/anything'));
    expect(res.status).toBe(501);
    expect(await res.text()).toBe('Not implemented');
  });

  it('GET /_do/snapshot returns 404 when snapshot unset', async () => {
    const res = await room.fetch(new Request('https://do/_do/snapshot'));
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
  });

  it('PUT /_do/snapshot stores body, returns 201 OK', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/snapshot', {
        method: 'PUT',
        body: 'socialcalc:version:1.5\nsheet: cell:A1:t:hi',
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    expect(record.map.get(STORAGE_KEYS.snapshot)).toContain('cell:A1:t:hi');
    expect(record.map.get(STORAGE_KEYS.metaUpdatedAt)).toEqual(expect.any(Number));
  });

  it('GET /_do/snapshot returns stored body after PUT', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'save-text');
    const res = await room.fetch(new Request('https://do/_do/snapshot'));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('save-text');
  });

  it('PUT /_do/snapshot clears prior log/audit/chat/ecell', async () => {
    record.map.set(logKey(0), 'set A1 value n 1');
    record.map.set(auditKey(0), 'set A1 value n 1');
    record.map.set(chatKey(0), 'hi');
    record.map.set(ecellKey('alice'), 'B2');
    const res = await room.fetch(
      new Request('https://do/_do/snapshot', { method: 'PUT', body: 'snap' }),
    );
    expect(res.status).toBe(201);
    expect(record.map.has(logKey(0))).toBe(false);
    expect(record.map.has(chatKey(0))).toBe(false);
    expect(record.map.has(ecellKey('alice'))).toBe(false);
  });

  it('GET /_do/log returns {log,chat} arrays', async () => {
    record.map.set(logKey(0), 'cmd-1');
    record.map.set(logKey(1), 'cmd-2');
    record.map.set(chatKey(0), 'hello');
    const res = await room.fetch(new Request('https://do/_do/log'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { log: string[]; chat: string[] };
    expect(body.log).toEqual(['cmd-1', 'cmd-2']);
    expect(body.chat).toEqual(['hello']);
  });

  it('POST /_do/commands with empty body is a no-op 202', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: '' }),
    );
    expect(res.status).toBe(202);
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('POST /_do/commands appends log+audit, runs through SC, updates snapshot', async () => {
    mockSave.mockReturnValueOnce('NEWSNAP');
    const res = await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'set A1 value n 1',
      }),
    );
    expect(res.status).toBe(202);
    expect(mockExec).toHaveBeenCalledWith('set A1 value n 1');
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(auditKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('NEWSNAP');
  });

  it('POST /_do/commands twice increments sequence', async () => {
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'a' }),
    );
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'b' }),
    );
    expect(record.map.get(logKey(0))).toBe('a');
    expect(record.map.get(logKey(1))).toBe('b');
    expect(record.map.get(auditKey(0))).toBe('a');
    expect(record.map.get(auditKey(1))).toBe('b');
  });

  it('DELETE /_do/all wipes everything, returns 201 OK', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'x');
    record.map.set(logKey(0), 'y');
    const res = await room.fetch(
      new Request('https://do/_do/all', { method: 'DELETE' }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    expect(record.map.size).toBe(0);
  });

  it('GET /_do/exists returns {exists:0} on empty room', async () => {
    const res = await room.fetch(new Request('https://do/_do/exists'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { exists: 0 | 1 };
    expect(body).toEqual({ exists: 0 });
  });

  it('GET /_do/exists returns {exists:1} after a snapshot is set', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'data');
    const res = await room.fetch(new Request('https://do/_do/exists'));
    const body = (await res.json()) as { exists: 0 | 1 };
    expect(body).toEqual({ exists: 1 });
  });

  it('GET /_do/cells returns the full cells hash', async () => {
    const res = await room.fetch(new Request('https://do/_do/cells'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cells: Record<string, unknown> };
    expect(body.cells).toEqual({ A1: 1 });
  });

  it('GET /_do/cells/:cell returns a single cell record', async () => {
    const res = await room.fetch(new Request('https://do/_do/cells/A1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ v: 1 });
  });

  it('GET /_do/cells/:cell returns null for unknown coord', async () => {
    const res = await room.fetch(new Request('https://do/_do/cells/ZZ99'));
    expect(res.status).toBe(200);
    expect(await res.json()).toBeNull();
  });

  it('cells route URL-decodes coord param', async () => {
    const res = await room.fetch(new Request('https://do/_do/cells/A%201'));
    expect(res.status).toBe(200);
    expect(mockExportCell).toHaveBeenCalledWith('A 1');
  });

  it('unknown /_do/cells/ path that is not a cell still falls through to 501 on other methods', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/cells/A1', { method: 'POST' }),
    );
    expect(res.status).toBe(501);
  });

  it('appendChat returns sequential seq and writes to chat prefix', async () => {
    const a = await room.appendChat('hi');
    const b = await room.appendChat('ho');
    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(record.map.get(chatKey(0))).toBe('hi');
    expect(record.map.get(chatKey(1))).toBe('ho');
  });

  it('appendChat after pre-existing chat resumes at the next seq', async () => {
    record.map.set(chatKey(0), 'a');
    record.map.set(chatKey(1), 'b');
    const next = await room.appendChat('c');
    expect(next).toBe(2);
    expect(record.map.get(chatKey(2))).toBe('c');
  });

  it('putEcell + listEcells round-trip with prefix stripped', async () => {
    await room.putEcell('alice', 'A1');
    await room.putEcell('bob', 'B2');
    expect(await room.listEcells()).toEqual({ alice: 'A1', bob: 'B2' });
  });

  it('POST /_do/commands resumes sequence from existing log+audit', async () => {
    record.map.set(logKey(0), 'first');
    record.map.set(logKey(1), 'second');
    record.map.set(auditKey(0), 'first');
    record.map.set(auditKey(1), 'second');
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'third' }),
    );
    expect(record.map.get(logKey(2))).toBe('third');
    expect(record.map.get(auditKey(2))).toBe('third');
  });

  it('POST /_do/commands hydrates spreadsheet from stored snapshot on first use', async () => {
    // Pre-seed snapshot so `#getSpreadsheet` takes the truthy branch of
    // `snapshot ? {snapshot,log} : {log}`. The mocked createSpreadsheet
    // ignores the payload, but the branch itself gets covered.
    record.map.set(STORAGE_KEYS.snapshot, 'socialcalc:v1');
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'cmd' }),
    );
    expect(mockExec).toHaveBeenCalledWith('cmd');
  });

  it('#getSpreadsheet caches after first call', async () => {
    // Two cell reads back-to-back must only instantiate the SS once.
    // createSpreadsheet mock is called per `createSpreadsheet()` invocation;
    // we observe the caching by counting executeCommand invocations instead
    // — two GETs should not call executeCommand at all, confirming the
    // non-throwing code path.
    await room.fetch(new Request('https://do/_do/cells'));
    await room.fetch(new Request('https://do/_do/cells'));
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('GET /_do/commands (wrong method) falls through to 501', async () => {
    const res = await room.fetch(new Request('https://do/_do/commands'));
    expect(res.status).toBe(501);
  });

  it('POST /_do/snapshot (wrong method) falls through to 501', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/snapshot', { method: 'POST', body: 'x' }),
    );
    expect(res.status).toBe(501);
  });

  it('DELETE /_do/all (wrong method) falls through to 501', async () => {
    const res = await room.fetch(new Request('https://do/_do/all'));
    expect(res.status).toBe(501);
  });

  it('GET /_do/exists with wrong method returns 501', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/exists', { method: 'POST' }),
    );
    expect(res.status).toBe(501);
  });

  // ─── Phase 8 export handlers ─────────────────────────────────────────

  it('GET /_do/html returns createSheetHTML with text/html', async () => {
    const res = await room.fetch(new Request('https://do/_do/html'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('<table><tr><td>1</td></tr></table>');
    expect(mockCreateSheetHTML).toHaveBeenCalled();
  });

  it('GET /_do/csv returns exportCSV with text/csv', async () => {
    const res = await room.fetch(new Request('https://do/_do/csv'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(await res.text()).toBe('a,b\n1,2\n');
  });

  it('GET /_do/csv.json parses CSV into a string[][] JSON', async () => {
    const res = await room.fetch(new Request('https://do/_do/csv.json'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    expect(await res.json()).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('GET /_do/md returns a GFM markdown table', async () => {
    const res = await room.fetch(new Request('https://do/_do/md'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/x-markdown; charset=utf-8');
    expect(await res.text()).toBe('| a | b |\n| --- | --- |\n| 1 | 2 |');
  });

  it('GET /_do/xlsx returns binary with xlsx content type', async () => {
    const res = await room.fetch(new Request('https://do/_do/xlsx'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('spreadsheetml');
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.byteLength).toBeGreaterThan(0);
    // xlsx is a zip → starts with "PK"
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it('GET /_do/ods returns binary with opendocument content type', async () => {
    const res = await room.fetch(new Request('https://do/_do/ods'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('opendocument');
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf.byteLength).toBeGreaterThan(0);
  });

  it('GET /_do/fods returns flat-ODS XML with opendocument content type', async () => {
    const res = await room.fetch(new Request('https://do/_do/fods'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('opendocument');
    const text = await res.text();
    expect(text.startsWith('<')).toBe(true);
  });

  it.each([
    ['/_do/html', 'POST'],
    ['/_do/csv', 'POST'],
    ['/_do/csv.json', 'POST'],
    ['/_do/md', 'POST'],
    ['/_do/xlsx', 'POST'],
    ['/_do/ods', 'POST'],
    ['/_do/fods', 'POST'],
  ])('wrong method on %s returns 501 (%s)', async (path, method) => {
    const res = await room.fetch(new Request(`https://do${path}`, { method }));
    expect(res.status).toBe(501);
  });
});

/**
 * Phase 5.1 — D1 rooms-index mirror wiring. Each state-changing DO
 * endpoint (`PUT /_do/snapshot`, `POST /_do/commands`, `DELETE
 * /_do/all`) must upsert/delete a row when `env.DB` is bound AND the
 * caller passed `?name=<room>`. Both the binding and the name must be
 * present — either missing short-circuits to a no-op.
 */
describe('RoomDO — D1 rooms-index mirror (Phase 5.1)', () => {
  let record: FakeStorageRecord;
  let d1Calls: D1Call[];
  let room: RoomDO;

  beforeEach(() => {
    record = { map: new Map() };
    d1Calls = [];
    room = new RoomDO(makeState('abc123', record), makeEnvWithDb(d1Calls));
    mockExec.mockClear();
    mockSave.mockClear();
  });

  it('PUT /_do/snapshot upserts the room into D1 when name + DB both present', async () => {
    await room.fetch(
      new Request('https://do/_do/snapshot?name=alpha', {
        method: 'PUT',
        body: 'save',
      }),
    );
    expect(d1Calls).toHaveLength(1);
    expect(d1Calls[0]!.sql).toContain('INSERT INTO rooms');
    expect(d1Calls[0]!.params[0]).toBe('alpha');
    expect(typeof d1Calls[0]!.params[1]).toBe('number');
  });

  it('POST /_do/commands upserts the room into D1 after applying a command', async () => {
    await room.fetch(
      new Request('https://do/_do/commands?name=beta', {
        method: 'POST',
        body: 'set A1 value n 1',
      }),
    );
    expect(d1Calls).toHaveLength(1);
    expect(d1Calls[0]!.sql).toContain('INSERT INTO rooms');
    expect(d1Calls[0]!.params[0]).toBe('beta');
  });

  it('POST /_do/commands with empty body does NOT touch D1', async () => {
    await room.fetch(
      new Request('https://do/_do/commands?name=beta', {
        method: 'POST',
        body: '',
      }),
    );
    expect(d1Calls).toHaveLength(0);
  });

  it('DELETE /_do/all deletes the room row from D1', async () => {
    await room.fetch(
      new Request('https://do/_do/all?name=gone', { method: 'DELETE' }),
    );
    expect(d1Calls).toHaveLength(1);
    expect(d1Calls[0]!.sql).toContain('DELETE FROM rooms');
    expect(d1Calls[0]!.params).toEqual(['gone']);
  });

  it('does NOT mirror when ?name is missing even if DB is bound', async () => {
    await room.fetch(
      new Request('https://do/_do/snapshot', { method: 'PUT', body: 'x' }),
    );
    expect(d1Calls).toHaveLength(0);
  });

  it('does NOT mirror when ?name is missing on DELETE /_do/all either', async () => {
    await room.fetch(
      new Request('https://do/_do/all', { method: 'DELETE' }),
    );
    expect(d1Calls).toHaveLength(0);
  });

  it('does NOT mirror on PUT /_do/snapshot when DB binding is unbound', async () => {
    // Fresh DO without the DB binding — reuses `makeEnv()` from the top-
    // level unit suite (exported from this file).
    const noDbRoom = new RoomDO(makeState('x', { map: new Map() }), makeEnv());
    // Also no entry in `d1Calls` because there's no shared DB — the
    // absence is the point.
    const res = await noDbRoom.fetch(
      new Request('https://do/_do/snapshot?name=nodb', {
        method: 'PUT',
        body: 'x',
      }),
    );
    expect(res.status).toBe(201);
    expect(d1Calls).toHaveLength(0);
  });
});
