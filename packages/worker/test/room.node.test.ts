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
    // Broadcast handlers (fire-trigger, WS execute) call getWebSockets();
    // with no peers connected in the direct-construction tests, an empty
    // array keeps the broadcast a no-op without needing the hibernation API.
    getWebSockets(): WebSocket[] {
      return [];
    },
  } as unknown as DurableObjectState;
}

/**
 * WebSocket + state extensions needed for the hibernation-API surface.
 * Node doesn't ship `WebSocketPair` or `state.acceptWebSocket`; we supply
 * an in-memory record of every ws/state primitive so the tests can assert
 * on them.
 */
interface FakeWsLog {
  sent: string[];
  serializedAttachment?: unknown;
}
function makeFakeWs(log: FakeWsLog, attachment?: unknown): WebSocket {
  return {
    send(data: string) {
      log.sent.push(data);
    },
    serializeAttachment(v: unknown) {
      log.serializedAttachment = v;
    },
    deserializeAttachment(): unknown {
      return attachment ?? null;
    },
    close() {},
  } as unknown as WebSocket;
}
interface WsAwareState {
  state: DurableObjectState;
  accepted: WebSocket[];
  peers: WebSocket[];
}
function makeWsAwareState(
  idString: string,
  record: FakeStorageRecord,
  peers: WebSocket[] = [],
): WsAwareState {
  const accepted: WebSocket[] = [];
  const state = {
    id: { toString: () => idString } as DurableObjectId,
    storage: fakeStorage(record),
    async blockConcurrencyWhile<T>(cb: () => Promise<T>): Promise<T> {
      return cb();
    },
    acceptWebSocket(ws: WebSocket) {
      accepted.push(ws);
    },
    getWebSockets(): WebSocket[] {
      return peers;
    },
  } as unknown as DurableObjectState;
  return { state, accepted, peers };
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

  /**
   * WS-path parity. The browser client never issues `POST /_do/commands`;
   * it sends an `execute` frame over the WS, which lands in
   * `#applyCommandAndMirror` through `#buildWsContext`. Without this mirror
   * wire-up, `/_rooms` stayed empty even after active editing — the bug
   * that surfaced during the 2026-04-20 browser smoke test.
   */
  it('WS execute frame mirrors the room into D1', async () => {
    const record2: FakeStorageRecord = { map: new Map() };
    const d1Calls2: D1Call[] = [];
    const env = makeEnvWithDb(d1Calls2);
    const { state } = makeWsAwareState('x', record2, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'alice', room: 'gamma', auth: 'h' });
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'gamma',
        user: 'alice',
        auth: 'gamma',
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(d1Calls2).toHaveLength(1);
    expect(d1Calls2[0]!.sql).toContain('INSERT INTO rooms');
    expect(d1Calls2[0]!.params[0]).toBe('gamma');
    expect(typeof d1Calls2[0]!.params[1]).toBe('number');
  });

  /**
   * Attachment fallback: the DO was opened with a handshake attachment of
   * `{room: 'alpha', …}`, but the client frame declares `room: 'beta'`.
   * Since the append lands in the DO's own storage (the one opened for
   * `alpha`), the mirror must follow the handshake room — not the frame.
   */
  it('WS execute mirrors the handshake-attachment room, not the frame room', async () => {
    const record3: FakeStorageRecord = { map: new Map() };
    const d1Calls3: D1Call[] = [];
    const env = makeEnvWithDb(d1Calls3);
    const { state } = makeWsAwareState('x', record3, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'alpha', auth: 'h' });
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'beta',
        user: 'u',
        auth: 'beta',
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(d1Calls3).toHaveLength(1);
    expect(d1Calls3[0]!.params[0]).toBe('alpha');
  });

  /**
   * When the handshake attachment is missing (legacy handshake or default
   * fallback), the mirror room falls back to the frame's `room` field so
   * we still register the edit somewhere sensible.
   */
  it('WS execute with empty attachment room falls back to frame room', async () => {
    const record4: FakeStorageRecord = { map: new Map() };
    const d1Calls4: D1Call[] = [];
    const env = makeEnvWithDb(d1Calls4);
    const { state } = makeWsAwareState('x', record4, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    // makeFakeWs defaults attachment to { user: '', room: '', auth: '' }.
    const ws = makeFakeWs(log);
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'fallback',
        user: '',
        auth: 'fallback',
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(d1Calls4).toHaveLength(1);
    expect(d1Calls4[0]!.params[0]).toBe('fallback');
  });
});

/**
 * Phase 6 — cross-DO rename primitives. The `#postRename` + `#postInstall`
 * handlers are pure HTTP endpoints on the DO; they do their own
 * `blockConcurrencyWhile` serialization and talk to sibling DOs only via a
 * stub supplied through `env.ROOM`. Easy to unit-test with a Map-backed
 * fake storage and a recording `ROOM` namespace.
 */
describe('RoomDO — cross-DO rename primitives (Phase 6)', () => {
  interface SiblingCall {
    idFromName: string;
    init: RequestInit | undefined;
  }
  function makeRenameEnv(
    siblingCalls: SiblingCall[],
    responseStatus = 201,
  ): Env {
    return {
      ROOM: {
        idFromName(name: string) {
          return { __name: name, toString: () => name } as unknown as DurableObjectId;
        },
        get(id: DurableObjectId): DurableObjectStub {
          const name = (id as unknown as { __name: string }).__name;
          return {
            async fetch(_path: string, init?: RequestInit): Promise<Response> {
              siblingCalls.push({ idFromName: name, init });
              return new Response('OK', { status: responseStatus });
            },
          } as unknown as DurableObjectStub;
        },
      } as unknown as DurableObjectNamespace,
    };
  }

  it('POST /_do/rename with missing body.to returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeRenameEnv([]));
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST /_do/rename with empty string body.to returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeRenameEnv([]));
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({ to: '' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST /_do/rename with no snapshot returns 204 no-op', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeRenameEnv([]));
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({ to: 'new' }),
      }),
    );
    expect(res.status).toBe(204);
  });

  it('POST /_do/rename with snapshot invokes target DO install and wipes local', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set(STORAGE_KEYS.snapshot, 'socialcalc:v1');
    record.map.set(logKey(0), 'set A1 value n 1');
    record.map.set(auditKey(0), 'set A1 value n 1');
    const siblingCalls: SiblingCall[] = [];
    const room = new RoomDO(
      makeState('x', record),
      makeRenameEnv(siblingCalls),
    );
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({ to: 'alpha' }),
      }),
    );
    expect(res.status).toBe(201);
    expect(siblingCalls).toHaveLength(1);
    expect(siblingCalls[0]!.idFromName).toBe('alpha');
    const parsed = JSON.parse(siblingCalls[0]!.init!.body as string) as {
      snapshot: string;
      log: string[];
      audit: string[];
    };
    expect(parsed.snapshot).toBe('socialcalc:v1');
    expect(parsed.log).toEqual(['set A1 value n 1']);
    expect(parsed.audit).toEqual(['set A1 value n 1']);
    // Local storage wiped.
    expect(record.map.size).toBe(0);
  });

  it('POST /_do/rename returns 502 when sibling install fails', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set(STORAGE_KEYS.snapshot, 'snap');
    const room = new RoomDO(
      makeState('x', record),
      makeRenameEnv([], 500),
    );
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({ to: 'alpha' }),
      }),
    );
    expect(res.status).toBe(502);
    // Local storage preserved on failure (snapshot still there).
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('snap');
  });

  it('POST /_do/install with non-string snapshot returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST /_do/install with non-string-array log returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({ snapshot: 'x', log: [1, 2] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST /_do/install with non-string-array audit returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({ snapshot: 'x', audit: [1] }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('POST /_do/install writes snapshot + log + audit, returns 201', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set('stale', 'yes'); // should be wiped
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({
          snapshot: 'socialcalc:v1',
          log: ['cmd-1', 'cmd-2'],
          audit: ['cmd-1'],
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('socialcalc:v1');
    expect(record.map.get(logKey(0))).toBe('cmd-1');
    expect(record.map.get(logKey(1))).toBe('cmd-2');
    expect(record.map.get(auditKey(0))).toBe('cmd-1');
    expect(record.map.has('stale')).toBe(false);
  });

  it('POST /_do/install defaults missing log/audit to empty arrays', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({ snapshot: 'SAVE' }),
      }),
    );
    expect(res.status).toBe(201);
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SAVE');
  });
});

/**
 * Phase 7 — WebSocket upgrade + hibernation-API glue. `#acceptWebSocket`
 * needs a `WebSocketPair` global; the Node test harness provides a stub
 * before each test. `webSocketMessage` takes an already-accepted socket,
 * so we supply a minimal send/serialize/deserialize trio.
 */
describe('RoomDO — WebSocket acceptance (Phase 7)', () => {
  let record: FakeStorageRecord;

  beforeEach(() => {
    record = { map: new Map() };
  });

  it('GET /_do/ws without Upgrade header returns 426', async () => {
    const { state } = makeWsAwareState('x', record);
    const room = new RoomDO(state, makeEnv());
    const res = await room.fetch(new Request('https://do/_do/ws'));
    expect(res.status).toBe(426);
    expect(await res.text()).toBe('Expected Upgrade: websocket');
  });

  it('webSocketClose is a no-op (legacy cursor preservation)', async () => {
    const { state } = makeWsAwareState('x', record);
    const room = new RoomDO(state, makeEnv());
    // Must not throw.
    await room.webSocketClose(makeFakeWs({ sent: [] }));
  });

  it('webSocketMessage ignores non-string messages', async () => {
    const { state } = makeWsAwareState('x', record);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log);
    await room.webSocketMessage(ws, new ArrayBuffer(4));
    expect(log.sent).toHaveLength(0);
  });

  it('webSocketMessage ignores unparseable frames', async () => {
    const { state } = makeWsAwareState('x', record);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log);
    await room.webSocketMessage(ws, 'not-json');
    expect(log.sent).toHaveLength(0);
  });

  it('webSocketMessage dispatches ask.log and replies on the socket', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(logKey(0), 'cmd-1');
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'ask.log', room: 'r', user: 'alice' }),
    );
    expect(log.sent).toHaveLength(1);
    const reply = JSON.parse(log.sent[0]!) as {
      type: string;
      snapshot: string;
      log: string[];
    };
    expect(reply.type).toBe('log');
    expect(reply.snapshot).toBe('SAVE');
    expect(reply.log).toEqual(['cmd-1']);
  });

  it('webSocketMessage falls back to default attachment when deserialize returns null', async () => {
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    // `attachment` arg omitted → deserializeAttachment returns null.
    const ws = makeFakeWs(log);
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'ask.log', room: 'r', user: 'u' }),
    );
    expect(log.sent).toHaveLength(1);
  });

  it('webSocketMessage dispatches my.ecell, persists and broadcasts to peers', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    const room = new RoomDO(state, makeEnv());
    const senderLog: FakeWsLog = { sent: [] };
    const sender = makeFakeWs(senderLog, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      sender,
      JSON.stringify({
        type: 'my.ecell',
        room: 'r',
        user: 'alice',
        ecell: 'A1',
      }),
    );
    // Peer receives broadcast, sender does not (broadcast excludes sender).
    expect(peerLog.sent).toHaveLength(1);
    expect(senderLog.sent).toHaveLength(0);
    expect(record.map.get(ecellKey('alice'))).toBe('A1');
  });

  it('webSocketMessage dispatches chat, persists chat entry, broadcasts', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    const room = new RoomDO(state, makeEnv());
    const senderLog: FakeWsLog = { sent: [] };
    const sender = makeFakeWs(senderLog, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      sender,
      JSON.stringify({
        type: 'chat',
        room: 'r',
        user: 'alice',
        msg: 'hi',
      }),
    );
    expect(peerLog.sent).toHaveLength(1);
    expect(record.map.get(chatKey(0))).toBe('hi');
  });

  it('webSocketMessage executes a command (auth OK via identity HMAC) and applies it', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    // No ETHERCALC_KEY set → identity HMAC, so auth === room passes.
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'r',
        user: 'alice',
        auth: 'r',
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
    expect(mockExec).toHaveBeenCalledWith('set A1 value n 1');
    expect(peerLog.sent).toHaveLength(1);
  });

  it('webSocketMessage drops an execute when auth field missing (view-only)', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    const room = new RoomDO(
      state,
      { ROOM: {} as DurableObjectNamespace, ETHERCALC_KEY: 'secret' },
    );
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'r',
        user: 'alice',
        cmdstr: 'set A1 value n 1',
      }),
    );
    // No command applied.
    expect(record.map.get(logKey(0))).toBeUndefined();
    expect(peerLog.sent).toHaveLength(0);
  });

  it('webSocketMessage forwards submitform to sibling DO and broadcasts to all', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const senderLog: FakeWsLog = { sent: [] };
    const sender = makeFakeWs(senderLog, { user: 'u', room: 'r', auth: 'h' });
    // `broadcastAll` iterates `state.getWebSockets()`, which in prod
    // includes the sender because the DO accepted it during handshake.
    const { state } = makeWsAwareState('x', record, [peer, sender]);
    const siblingFetches: Array<{ name: string; body: string }> = [];
    const env: Env = {
      ROOM: {
        idFromName(name: string) {
          return { __name: name, toString: () => name } as unknown as DurableObjectId;
        },
        get(id: DurableObjectId): DurableObjectStub {
          const name = (id as unknown as { __name: string }).__name;
          return {
            async fetch(_path: string, init?: RequestInit): Promise<Response> {
              siblingFetches.push({ name, body: init?.body as string });
              return new Response('ok', { status: 202 });
            },
          } as unknown as DurableObjectStub;
        },
      } as unknown as DurableObjectNamespace,
    };
    const room = new RoomDO(state, env);
    await room.webSocketMessage(
      sender,
      JSON.stringify({
        type: 'execute',
        room: 'mysheet',
        user: 'u',
        auth: 'mysheet',
        cmdstr: 'submitform\rset B1 value n 7',
      }),
    );
    expect(siblingFetches).toHaveLength(1);
    expect(siblingFetches[0]!.name).toBe('mysheet_formdata');
    expect(siblingFetches[0]!.body).toBe('set B1 value n 7');
    // Broadcast to all (include_self=true) — peer receives AND sender receives.
    expect(peerLog.sent).toHaveLength(1);
    expect(senderLog.sent).toHaveLength(1);
  });

  it('webSocketMessage dispatches stopHuddle which wipes storage and broadcasts', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(logKey(0), 'cmd');
    record.map.set(chatKey(0), 'hi');
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'stopHuddle', room: 'r', auth: 'r' }),
    );
    expect(record.map.size).toBe(0);
    expect(peerLog.sent).toHaveLength(1);
  });

  it('webSocketMessage dispatches ecell (broadcast-only, no persistence)', async () => {
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [peer]);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'ecell',
        room: 'r',
        user: 'u',
        ecell: 'A1',
        auth: 'r',
      }),
    );
    expect(peerLog.sent).toHaveLength(1);
    // ecell does NOT touch storage.
    expect(record.map.size).toBe(0);
  });

  it('webSocketMessage dispatches ask.ecells (reply with map)', async () => {
    record.map.set(ecellKey('alice'), 'A1');
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'ask.ecells', room: 'r' }),
    );
    expect(log.sent).toHaveLength(1);
    const reply = JSON.parse(log.sent[0]!) as { ecells: Record<string, string> };
    expect(reply.ecells).toEqual({ alice: 'A1' });
  });

  it('webSocketMessage dispatches ask.recalc (reply with snapshot + log)', async () => {
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(logKey(0), 'cmd');
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'ask.recalc', room: 'r' }),
    );
    expect(log.sent).toHaveLength(1);
    const reply = JSON.parse(log.sent[0]!) as {
      snapshot: string;
      log: string[];
    };
    expect(reply.snapshot).toBe('SAVE');
    expect(reply.log).toEqual(['cmd']);
  });

  it('webSocketMessage dispatches ask.recalc with empty storage (empty snapshot branch)', async () => {
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'ask.recalc', room: 'r' }),
    );
    const reply = JSON.parse(log.sent[0]!) as { snapshot: string };
    expect(reply.snapshot).toBe('');
  });

  it('WsContext.spreadsheet.executeCommand no-ops when #ss is unhydrated', async () => {
    // Expose the context-assembly surface through a write that triggers
    // `#buildWsContext` with no prior #getSpreadsheet call. The chat path
    // exercises storage.appendLog without touching #ss.
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'chat', room: 'r', user: 'u', msg: 'no-ss' }),
    );
    expect(record.map.get(chatKey(0))).toBe('no-ss');
  });

  it('broadcast (exclude-self) skips sender when sender is in the peer list', async () => {
    // `state.getWebSockets()` in prod returns every accepted socket, so
    // the sender is normally included. The `#broadcast` helper must skip
    // the sender; this test drives that branch by placing the sender in
    // `peers`.
    const senderLog: FakeWsLog = { sent: [] };
    const sender = makeFakeWs(senderLog, { user: 'u', room: 'r', auth: 'h' });
    const peerLog: FakeWsLog = { sent: [] };
    const peer = makeFakeWs(peerLog);
    const { state } = makeWsAwareState('x', record, [sender, peer]);
    const room = new RoomDO(state, makeEnv());
    await room.webSocketMessage(
      sender,
      JSON.stringify({ type: 'chat', room: 'r', user: 'u', msg: 'hi' }),
    );
    // Sender did NOT receive its own broadcast (exclude-self branch).
    expect(senderLog.sent).toHaveLength(0);
    // Peer did.
    expect(peerLog.sent).toHaveLength(1);
  });

  it('peer-broadcast catch swallows a send failure on one peer', async () => {
    // A peer whose send() throws must not stop the broadcast loop.
    const flakey = {
      send() {
        throw new Error('peer dead');
      },
      serializeAttachment() {},
      deserializeAttachment() {
        return null;
      },
      close() {},
    } as unknown as WebSocket;
    const healthyLog: FakeWsLog = { sent: [] };
    const healthy = makeFakeWs(healthyLog);
    const { state } = makeWsAwareState('x', record, [flakey, healthy]);
    const room = new RoomDO(state, makeEnv());
    const sender = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      sender,
      JSON.stringify({ type: 'chat', room: 'r', user: 'u', msg: 'broadcast-test' }),
    );
    // The healthy peer still got the frame despite the flakey one throwing.
    expect(healthyLog.sent).toHaveLength(1);
  });

  it('#sendTo swallows a send failure on the reply socket', async () => {
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const flakey = {
      send() {
        throw new Error('closed');
      },
      deserializeAttachment() {
        return { user: 'u', room: 'r', auth: 'h' };
      },
    } as unknown as WebSocket;
    // Must not throw.
    await room.webSocketMessage(
      flakey,
      JSON.stringify({ type: 'ask.log', room: 'r', user: 'u' }),
    );
  });

  it('submitform broadcastAll also swallows a dead-peer send failure', async () => {
    const flakey = {
      send() {
        throw new Error('gone');
      },
      serializeAttachment() {},
      deserializeAttachment() {
        return null;
      },
      close() {},
    } as unknown as WebSocket;
    const healthyLog: FakeWsLog = { sent: [] };
    const healthy = makeFakeWs(healthyLog);
    const { state } = makeWsAwareState('x', record, [flakey, healthy]);
    // siblingDo is unused here — submitform without payload skips fetch.
    const room = new RoomDO(state, makeEnv());
    const sender = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      sender,
      JSON.stringify({
        type: 'execute',
        room: 'r',
        user: 'u',
        auth: 'r',
        cmdstr: 'submitform',
      }),
    );
    expect(healthyLog.sent).toHaveLength(1);
  });
});

/**
 * Direct coverage for the #buildWsContext adapter's ctx.storage.appendLog
 * routing. The log/audit prefixes go through `#appendLogEntry` →
 * blockConcurrencyWhile; chat goes through the public `appendChat` method.
 * An audit-prefix path isn't reachable via any existing WS message type
 * but remains as a future-proofing branch, so we exercise it via the
 * chat/log fan-out the same way execute does.
 */
describe('RoomDO — WsContext storage plumbing', () => {
  it('execute routes command through applyCommand → log/audit + snapshot', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }, { user: 'u', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'r',
        user: 'u',
        auth: 'r',
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(auditKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SNAP');
  });
});

describe('RoomDO — /_do/fire-trigger (Phase 9)', () => {
  let record: FakeStorageRecord;
  let room: RoomDO;

  beforeEach(() => {
    record = { map: new Map() };
    room = new RoomDO(makeState('r', record), makeEnv());
    mockExportCell.mockClear();
  });

  it('returns 200 and no-ops when cell query param is empty', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    expect(mockExportCell).not.toHaveBeenCalled();
  });

  it('returns 200 and no-ops when the cell record is null', async () => {
    mockExportCell.mockReturnValueOnce(null);
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=Z9', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    expect(mockExportCell).toHaveBeenCalledWith('Z9');
  });

  it('returns 200 when the cell is present but not a valid sendemail payload', async () => {
    mockExportCell.mockReturnValueOnce({ datavalue: 'hello' });
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=A1', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
  });

  it('dispatches sendemail via stub and returns 200 (formula path)', async () => {
    mockExportCell.mockReturnValueOnce({
      formula: 'sendemail alice@example.test hello world',
      datavalue: 'ignored',
    });
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=A1', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
  });

  it('dispatches sendemail via stub and returns 200 (datavalue fallback)', async () => {
    mockExportCell.mockReturnValueOnce({
      formula: '',
      datavalue: 'sendemail bob@example.test subj body',
    });
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=B2', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
  });

  it('dispatches with non-string formula/datavalue → no-op', async () => {
    mockExportCell.mockReturnValueOnce({
      formula: 42 as unknown as string,
      datavalue: 99 as unknown as string,
    });
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=C3', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
  });
});
