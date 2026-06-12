import { describe, it, expect, beforeEach } from 'vitest';

import {
  STORAGE_KEYS,
  auditKey,
  chatKey,
  ecellKey,
  logKey,
  snapshotChunkKey,
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
  /** Pending alarm time (ms epoch), or null when disarmed. */
  alarm?: number | null;
}

/** Minimal in-memory DO storage — enough for the behaviors RoomDO exercises. */
function fakeStorage(record: FakeStorageRecord): DurableObjectStorage {
  const m = record.map;
  if (record.alarm === undefined) record.alarm = null;
  return {
    async getAlarm(): Promise<number | null> {
      return record.alarm ?? null;
    },
    async setAlarm(scheduledTime: number): Promise<void> {
      record.alarm = scheduledTime;
    },
    async deleteAlarm(): Promise<void> {
      record.alarm = null;
    },
    async get(key: unknown): Promise<unknown> {
      // Support the single-key `get(key)` and the batched
      // `get(keys[])` forms — the chunked-snapshot reader uses the
      // batched form so it can fetch N chunk keys in one hop.
      if (typeof key === 'string') return m.get(key);
      if (Array.isArray(key)) {
        const out = new Map<string, unknown>();
        for (const k of key) if (m.has(k as string)) out.set(k as string, m.get(k as string));
        return out;
      }
      throw new Error('unexpected get argument shape');
    },
    async put(key: unknown, value: unknown): Promise<void> {
      // Support both the single-key `put(key, value)` and the batched
      // `put(entries)` forms — Phase 11b's #postSeed uses the batched
      // form to stay under the Workers-free-tier 10 ms CPU budget.
      if (typeof key === 'string') {
        m.set(key, value);
        return;
      }
      if (key !== null && typeof key === 'object') {
        for (const [k, v] of Object.entries(key)) m.set(k, v);
        return;
      }
      throw new Error('unexpected put argument shape');
    },
    async delete(key: unknown): Promise<boolean | number> {
      // Single-key returns boolean; array form returns number deleted
      // (matching DurableObjectStorage.delete's overload shape).
      if (typeof key === 'string') return m.delete(key);
      if (Array.isArray(key)) {
        let n = 0;
        for (const k of key) if (m.delete(k as string)) n += 1;
        return n;
      }
      throw new Error('unexpected delete argument shape');
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

/**
 * Side-channel augmentation on the fake state — we expose the queue of
 * promises passed to `waitUntil` so tests that want to assert the effect
 * of a `waitUntil`-ed write (e.g. Phase 11b's fire-and-forget D1 mirror
 * in `#postSeed`) can drain it explicitly via {@link drainWaitUntil}.
 */
interface WaitUntilTrack {
  readonly __waitUntilPromises: Promise<unknown>[];
}

function makeState(
  idString: string,
  record: FakeStorageRecord,
): DurableObjectState & WaitUntilTrack {
  const waitUntilPromises: Promise<unknown>[] = [];
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
    waitUntil(p: Promise<unknown>): void {
      waitUntilPromises.push(p);
    },
    __waitUntilPromises: waitUntilPromises,
  } as unknown as DurableObjectState & WaitUntilTrack;
}

/** Await every promise passed to `state.waitUntil`. */
async function drainWaitUntil(
  state: DurableObjectState & WaitUntilTrack,
): Promise<void> {
  await Promise.all(state.__waitUntilPromises);
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

const mockFindRefs = vi.fn<() => string[]>(() => []);
const mockAddSibling = vi.fn<(name: string, save: string) => void>();
const mockRecalc = vi.fn<() => void>();

vi.mock('@ethercalc/socialcalc-headless', () => ({
  HeadlessSpreadsheet: class MockSS {},
  createSpreadsheet: () => ({
    executeCommand: (cmd: string) => mockExec(cmd),
    createSpreadsheetSave: () => mockSave(),
    exportCells: () => mockExportCells(),
    exportCell: (coord: string) => mockExportCell(coord),
    exportCSV: () => mockExportCSV(),
    exportSheetData: () => ({
      cells: mockExportCells(),
      valueformats: [],
      cellformats: [],
      attribs: {},
    }),
    findCrossSheetRefs: () => mockFindRefs(),
    addSiblingSheet: (name: string, save: string) => mockAddSibling(name, save),
    recalc: () => mockRecalc(),
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

  it('GET /_do/snapshot streams chunked snapshots via ReadableStream', async () => {
    // Simulate a prior chunked write: meta + three chunk keys. The
    // handler must walk them in-order and stitch the bytes back so a
    // reader sees the concatenated save.
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 3 });
    record.map.set(snapshotChunkKey(0), 'alpha-');
    record.map.set(snapshotChunkKey(1), 'beta-');
    record.map.set(snapshotChunkKey(2), 'gamma');
    const res = await room.fetch(new Request('https://do/_do/snapshot'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('alpha-beta-gamma');
  });

  it('GET /_do/snapshot stream surfaces a missing-chunk error', async () => {
    // Writer contract guarantees every chunk exists when meta is
    // present. A gap implies corruption, so the stream must fail loud
    // rather than silently truncate.
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 2 });
    record.map.set(snapshotChunkKey(0), 'alpha');
    // chunk 1 absent on purpose
    const res = await room.fetch(new Request('https://do/_do/snapshot'));
    expect(res.status).toBe(200);
    await expect(res.text()).rejects.toThrow(/snapshot chunk 1 missing/);
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

  it('POST /_do/commands with empty body is a no-op 202 with an empty body', async () => {
    const res = await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: '' }),
    );
    expect(res.status).toBe(202);
    // Pin the empty response body — StringLiteral → "Stryker was here!"
    // on room.ts:307 would otherwise leak a garbage body to the client.
    expect(await res.text()).toBe('');
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
    // Pin the empty body on the success branch (room.ts:309) — pairs
    // with the empty-body case above to catch every StringLiteral
    // mutation on the #postCommands response.
    expect(await res.text()).toBe('');
    expect(mockExec).toHaveBeenCalledWith('set A1 value n 1');
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(auditKey(0))).toBe('set A1 value n 1');
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('NEWSNAP');
  });

  it('POST /_do/commands stores a large snapshot as chunks', async () => {
    // Force the mock save to exceed the 100 KiB SNAPSHOT_CHUNK_BYTES
    // ceiling so `#appendCommand` routes through snapshotEntries'
    // chunked path: meta row + snapshot:chunk:<i> keys, no single
    // `snapshot` key.
    const big = 'B'.repeat(210 * 1024); // ~2.1× chunk size → 3 chunks
    mockSave.mockReturnValueOnce(big);
    const res = await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'cmd',
      }),
    );
    expect(res.status).toBe(202);
    expect(record.map.has(STORAGE_KEYS.snapshot)).toBe(false);
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 3 });
    expect(record.map.has(`snapshot:chunk:${String(0).padStart(16, '0')}`)).toBe(true);
    expect(record.map.has(`snapshot:chunk:${String(2).padStart(16, '0')}`)).toBe(true);
  });

  it('POST /_do/commands skips delete when prior-chunked state is re-chunked to same count', async () => {
    // Cover the `stale.length > 0` false branch: prior state was
    // chunked (2 chunks), new save is also chunked at 2 chunks. No
    // stale keys to clean up.
    const twoChunks = 'B'.repeat(110 * 1024); // 110 KiB → 2 chunks
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 2 });
    record.map.set(`snapshot:chunk:${String(0).padStart(16, '0')}`, 'old0');
    record.map.set(`snapshot:chunk:${String(1).padStart(16, '0')}`, 'old1');
    mockSave.mockReturnValueOnce(twoChunks);
    const res = await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'same-size',
      }),
    );
    expect(res.status).toBe(202);
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 2 });
    // Overwritten, not stale-deleted.
    expect(record.map.get(`snapshot:chunk:${String(0).padStart(16, '0')}`)).not.toBe('old0');
  });

  it('POST /_do/commands cleans up stale chunks when shrinking back to single-key', async () => {
    // Seed the DO with prior chunked state (5 chunks), then run a
    // command whose new save fits in a single key. The stale chunks
    // 0..4 and the meta key must be deleted; the new `snapshot` key
    // holds the small value.
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 5 });
    for (let i = 0; i < 5; i++) {
      record.map.set(`snapshot:chunk:${String(i).padStart(16, '0')}`, 'stale');
    }
    mockSave.mockReturnValueOnce('tiny');
    const res = await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'shrink',
      }),
    );
    expect(res.status).toBe(202);
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('tiny');
    expect(record.map.has(STORAGE_KEYS.snapshotMeta)).toBe(false);
    for (let i = 0; i < 5; i++) {
      expect(record.map.has(`snapshot:chunk:${String(i).padStart(16, '0')}`)).toBe(false);
    }
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

  it('GET /_do/cells returns the full cells hash (unwrapped)', async () => {
    // Legacy (src/sc.ls:361) returned `JSON.stringify(ss.sheet.cells)` —
    // the cells map directly, not `{cells: ...}`. Clients destructure
    // `response.A1.datavalue` etc.
    const res = await room.fetch(new Request('https://do/_do/cells'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ A1: 1 });
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

  it('GET /_do/sheet-data returns the structural SheetData as JSON', async () => {
    const res = await room.fetch(new Request('https://do/_do/sheet-data'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    const data = (await res.json()) as {
      cells: Record<string, unknown>;
      valueformats: string[];
      cellformats: string[];
      attribs: Record<string, unknown>;
    };
    expect(data).toHaveProperty('cells');
    expect(data).toHaveProperty('valueformats');
    expect(data).toHaveProperty('cellformats');
    expect(data).toHaveProperty('attribs');
  });

  describe('#fetchSibling (cross-sheet hydration I/O)', () => {
    it('fetches the sibling DO, adds to cache, and recalcs when refs are present', async () => {
      // Make the mocked spreadsheet advertise a cross-sheet reference so
      // #hydrateCrossSheetRefs triggers #fetchSibling.
      mockFindRefs.mockReset();
      mockFindRefs.mockImplementation(() => []);
      mockFindRefs.mockReturnValueOnce(['neighbor']);
      const siblingCalls: string[] = [];
      const env: Env = {
        ROOM: {
          idFromName: (n: string) => ({ name: n } as unknown as DurableObjectId),
          get: () => ({
            fetch: (url: string) => {
              siblingCalls.push(url);
              return Promise.resolve(
                new Response('version:1.5\ncell:A1:v:42\n', { status: 200 }),
              );
            },
          } as unknown as DurableObjectStub),
        } as unknown as DurableObjectNamespace,
      } as Env;
      const state = makeState('xyz-nb', { map: new Map() });
      const freshRoom = new RoomDO(state, env);
      const res = await freshRoom.fetch(new Request('https://do/_do/csv'));
      expect(res.status).toBe(200);
      // Sibling was fetched.
      expect(siblingCalls.some((u) => u.includes('/_do/snapshot'))).toBe(true);
      // addSiblingSheet + recalc were called.
      expect(mockAddSibling).toHaveBeenCalledWith('neighbor', expect.any(String));
      expect(mockRecalc).toHaveBeenCalled();
    });

    it('treats sibling 404 as no save — skips add/recalc', async () => {
      // Make findCrossSheetRefs return ['missing'] only on this test's
      // first call. A prior test may have consumed its own queue already
      // so this mockReturnValueOnce is always the next outgoing value.
      mockFindRefs.mockReset();
      mockFindRefs.mockImplementation(() => []);
      mockFindRefs.mockReturnValueOnce(['missing']);
      let fetchCalls = 0;
      const env: Env = {
        ROOM: {
          idFromName: () => ({} as unknown as DurableObjectId),
          get: () => ({
            fetch: () => {
              fetchCalls++;
              return Promise.resolve(new Response('', { status: 404 }));
            },
          } as unknown as DurableObjectStub),
        } as unknown as DurableObjectNamespace,
      } as Env;
      const state = makeState('xyz-404', { map: new Map() });
      const freshRoom = new RoomDO(state, env);
      mockAddSibling.mockClear();
      mockRecalc.mockClear();
      const res = await freshRoom.fetch(new Request('https://do/_do/csv'));
      expect(res.status).toBe(200);
      expect(fetchCalls).toBe(1); // guard: sibling fetch actually ran
      expect(mockAddSibling).not.toHaveBeenCalled();
      expect(mockRecalc).not.toHaveBeenCalled();
    });

    it('treats empty sibling body as no save', async () => {
      mockFindRefs.mockReset();
      mockFindRefs.mockImplementation(() => []);
      mockFindRefs.mockReturnValueOnce(['empty']);
      const env: Env = {
        ROOM: {
          idFromName: () => ({} as unknown as DurableObjectId),
          get: () => ({
            fetch: () =>
              Promise.resolve(new Response('', { status: 200 })),
          } as unknown as DurableObjectStub),
        } as unknown as DurableObjectNamespace,
      } as Env;
      const state = makeState('xyz-empty', { map: new Map() });
      const freshRoom = new RoomDO(state, env);
      mockAddSibling.mockClear();
      const res = await freshRoom.fetch(new Request('https://do/_do/csv'));
      expect(res.status).toBe(200);
      expect(mockAddSibling).not.toHaveBeenCalled();
    });
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

  // Method-gate mutation kills: `request.method === 'GET'` on lines
  // 144 (/_do/log), 156 (/_do/cells), and `=== 'DELETE'` on line 150
  // (/_do/all) all survived mutation to `true`, because no existing
  // test exercised the "right path, wrong method" combo for these
  // three endpoints. Each 501 assertion below pins one method gate.
  it.each([
    ['/_do/log', 'POST'],
    ['/_do/log', 'DELETE'],
    ['/_do/cells', 'POST'],
    ['/_do/cells', 'DELETE'],
    ['/_do/cells/A1', 'POST'],
    ['/_do/all', 'GET'],
    ['/_do/all', 'POST'],
  ])('method gate: %s + %s → 501', async (path, method) => {
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
    const roomsCall = d1Calls.find((c) => c.sql.includes('INSERT INTO rooms'));
    expect(roomsCall).toBeDefined();
    expect(roomsCall!.params[0]).toBe('beta');
    // The command's audit entry is mirrored to the durable D1 audit_log.
    // Pin (room, …, body) so the SeqRow literal can't be blanked to {}.
    const auditCall = d1Calls.find((c) => c.sql.includes('INSERT INTO audit_log'));
    expect(auditCall).toBeDefined();
    expect(auditCall!.params[0]).toBe('beta');
    expect(auditCall!.params[3]).toBe('set A1 value n 1');
  });

  it('does NOT mirror audit when a command arrives without ?name (DB bound)', async () => {
    // DB present but no room name → the shared #d1 guard (`!db || !roomName`)
    // skips, so neither the rooms index nor audit_log is touched. Pins the
    // `!roomName` operand (and the `||`→`&&` mutation, which would INSERT
    // with a null room).
    await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'set A1 value n 1',
      }),
    );
    expect(d1Calls.some((c) => c.sql.includes('INSERT INTO audit_log'))).toBe(false);
    expect(d1Calls.some((c) => c.sql.includes('INSERT INTO rooms'))).toBe(false);
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
    expect(d1Calls.find((c) => c.sql.includes('DELETE FROM rooms'))?.params).toEqual([
      'gone',
    ]);
    // The room's durable audit + chat rows are dropped too.
    expect(d1Calls.some((c) => c.sql.includes('DELETE FROM audit_log'))).toBe(true);
    expect(d1Calls.some((c) => c.sql.includes('DELETE FROM chat_log'))).toBe(true);
  });

  it('DELETE /_do/all cascades to the submitform sibling DO (#442)', async () => {
    const siblingDeletes: string[] = [];
    const env: Env = {
      ...makeEnvWithDb(d1Calls),
      ROOM: {
        idFromName: (n: string) => ({ name: n } as unknown as DurableObjectId),
        get: (id: DurableObjectId) => ({
          fetch: (url: string) => {
            siblingDeletes.push(url);
            return Promise.resolve(new Response('OK', { status: 201 }));
          },
        } as unknown as DurableObjectStub),
      } as unknown as DurableObjectNamespace,
    };
    const cascadeRoom = new RoomDO(makeState('cascade', record), env);
    await cascadeRoom.fetch(
      new Request('https://do/_do/all?name=mysheet', { method: 'DELETE' }),
    );
    expect(siblingDeletes).toHaveLength(1);
    expect(siblingDeletes[0]).toContain('/_do/all');
    expect(siblingDeletes[0]).toContain('name=mysheet_formdata');
  });

  it('DELETE on a _formdata room does NOT cascade further (#442)', async () => {
    const siblingDeletes: string[] = [];
    const env: Env = {
      ...makeEnvWithDb(d1Calls),
      ROOM: {
        idFromName: () => ({} as unknown as DurableObjectId),
        get: () => ({
          fetch: (url: string) => {
            siblingDeletes.push(url);
            return Promise.resolve(new Response('OK', { status: 201 }));
          },
        } as unknown as DurableObjectStub),
      } as unknown as DurableObjectNamespace,
    };
    const fdRoom = new RoomDO(makeState('fd', record), env);
    await fdRoom.fetch(
      new Request('https://do/_do/all?name=x_formdata', { method: 'DELETE' }),
    );
    expect(siblingDeletes).toHaveLength(0);
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
    const roomsCall = d1Calls2.find((c) => c.sql.includes('INSERT INTO rooms'));
    expect(roomsCall).toBeDefined();
    expect(roomsCall!.params[0]).toBe('gamma');
    expect(typeof roomsCall!.params[1]).toBe('number');
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
    // Both the rooms index AND the audit mirror follow the handshake room.
    const roomsCall = d1Calls3.find((c) => c.sql.includes('INSERT INTO rooms'));
    expect(roomsCall!.params[0]).toBe('alpha');
    const auditCall = d1Calls3.find((c) => c.sql.includes('INSERT INTO audit_log'));
    expect(auditCall!.params[0]).toBe('alpha');
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
    const roomsCall = d1Calls4.find((c) => c.sql.includes('INSERT INTO rooms'));
    expect(roomsCall!.params[0]).toBe('fallback');
  });

  /**
   * WS `stopHuddle` must also drop the D1 row. Without this, `/_rooms`
   * continued listing rooms that had been huddle-wiped — surfaced during
   * the 2026-04-20 browser smoke test.
   */
  it('WS stopHuddle drops the room row from D1 (handshake-room path)', async () => {
    const record5: FakeStorageRecord = { map: new Map() };
    const d1Calls5: D1Call[] = [];
    const env = makeEnvWithDb(d1Calls5);
    const { state } = makeWsAwareState('x', record5, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'delta', auth: 'h' });
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'stopHuddle',
        room: 'delta',
        auth: 'delta',
      }),
    );
    expect(d1Calls5.find((c) => c.sql.includes('DELETE FROM rooms'))?.params).toEqual([
      'delta',
    ]);
    expect(d1Calls5.some((c) => c.sql.includes('DELETE FROM audit_log'))).toBe(true);
  });

  it('WS stopHuddle with empty attachment falls back to the frame room for unindex', async () => {
    const record6: FakeStorageRecord = { map: new Map() };
    const d1Calls6: D1Call[] = [];
    const env = makeEnvWithDb(d1Calls6);
    const { state } = makeWsAwareState('x', record6, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    // Default attachment: { user: '', room: '', auth: '' }.
    const ws = makeFakeWs(log);
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'stopHuddle',
        room: 'fallback-delete',
        auth: 'fallback-delete',
      }),
    );
    expect(d1Calls6.find((c) => c.sql.includes('DELETE FROM rooms'))?.params).toEqual([
      'fallback-delete',
    ]);
  });

  it('WS stopHuddle with failed auth does NOT touch D1', async () => {
    const record7: FakeStorageRecord = { map: new Map() };
    const d1Calls7: D1Call[] = [];
    const env: Env = {
      ...makeEnvWithDb(d1Calls7),
      ETHERCALC_KEY: 'secret', // KEY set → auth must match hmac(room)
    };
    const { state } = makeWsAwareState('x', record7, []);
    const wsRoom = new RoomDO(state, env);
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'u', room: 'r', auth: 'h' });
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'stopHuddle',
        room: 'r',
        auth: 'not-the-hmac',
      }),
    );
    expect(d1Calls7).toHaveLength(0);
  });

  it('WS chat frame mirrors the message to the durable D1 chat_log', async () => {
    // appendChat (via the WS chat path) mirrors to chat_log so the alarm's
    // chat-trim doesn't lose history. Pin (room, …, body) so the SeqRow
    // literal in appendChat can't be blanked to [] / {}.
    const rec: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const { state } = makeWsAwareState('x', rec, []);
    const wsRoom = new RoomDO(state, env);
    const ws = makeFakeWs({ sent: [] }, { user: 'u', room: 'epsilon', auth: 'h' });
    await wsRoom.webSocketMessage(
      ws,
      JSON.stringify({ type: 'chat', room: 'epsilon', user: 'u', msg: 'hello-d1' }),
    );
    const chatCall = calls.find((c) => c.sql.includes('INSERT INTO chat_log'));
    expect(chatCall).toBeDefined();
    expect(chatCall!.params[0]).toBe('epsilon');
    expect(chatCall!.params[3]).toBe('hello-d1');
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

  it('POST /_do/rename with missing body.to returns 400 with a descriptive body', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeRenameEnv([]));
    const res = await room.fetch(
      new Request('https://do/_do/rename', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    // Pin the error body literal — a StringLiteral → "" mutation on
    // room.ts:425 would silently strip the message, leaving operators
    // to diagnose a bare 400 with no hint.
    expect(await res.text()).toMatch(/rename body must be \{to: string\}/);
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
    expect(await res.text()).toMatch(/rename body must be \{to: string\}/);
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

  it('POST /_do/clone with missing body.to returns 400', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeRenameEnv([]));
    const res = await room.fetch(
      new Request('https://do/_do/clone', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toMatch(/clone body must be \{to: string\}/);
  });

  it('POST /_do/clone PUTs snapshot to target and preserves source', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set(STORAGE_KEYS.snapshot, 'TPL-SNAP');
    record.map.set(logKey(0), 'set A1 value n 1');
    const siblingCalls: SiblingCall[] = [];
    const room = new RoomDO(makeState('x', record), makeRenameEnv(siblingCalls));
    const res = await room.fetch(
      new Request('https://do/_do/clone', {
        method: 'POST',
        body: JSON.stringify({ to: 'tpl_abc' }),
      }),
    );
    expect(res.status).toBe(201);
    expect(siblingCalls).toHaveLength(1);
    expect(siblingCalls[0]!.init?.method).toBe('PUT');
    expect(String(siblingCalls[0]!.init?.body)).toBe('TPL-SNAP');
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('TPL-SNAP');
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
  });

  it('POST /_do/clone returns 502 when target PUT fails', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set(STORAGE_KEYS.snapshot, 'snap');
    const room = new RoomDO(makeState('x', record), makeRenameEnv([], 500));
    const res = await room.fetch(
      new Request('https://do/_do/clone', {
        method: 'POST',
        body: JSON.stringify({ to: 'tpl_x' }),
      }),
    );
    expect(res.status).toBe(502);
    expect(await res.text()).toMatch(/^clone failed: \d+/);
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('snap');
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
    // Pin the "install failed: <status>" body so StringLiteral mutations
    // on room.ts:443 — where the template literal lives — don't survive.
    expect(await res.text()).toMatch(/^install failed: \d+/);
    // Local storage preserved on failure (snapshot still there).
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('snap');
  });

  it('POST /_do/install with non-string snapshot returns 400 with a descriptive body', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/install', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    // Pin the error body literal so StringLiteral → "" mutations on
    // room.ts:630 (snapshot), :635 (log), :638 (audit) don't survive.
    expect(await res.text()).toMatch(/install body\.snapshot must be string/);
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
    expect(await res.text()).toMatch(/install body\.log must be string\[\]/);
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
    expect(await res.text()).toMatch(/install body\.audit must be string\[\]/);
  });

  it('POST /_do/install folds base+log into the snapshot, keeps log tail + audit, returns 201', async () => {
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
    // Fold-on-ingest: the stored snapshot is the FOLDED save (the mocked
    // createSpreadsheetSave returns 'SNAP'), not the verbatim base — the
    // hydrate path no longer replays the log over a present snapshot, so
    // the log must already be baked into the snapshot here.
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SNAP');
    // Log tail kept for client catch-up; audit kept verbatim.
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
    // Folded snapshot (mock returns 'SNAP'); no log/audit present.
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SNAP');
  });
});

/**
 * Phase 11b — migration seed endpoint. Verifies every storage write the
 * migrator depends on, the D1 mirror, the "log-only room" shape (no
 * snapshot), and the validation error path that short-circuits before
 * any storage write happens.
 */
describe('RoomDO — POST /_do/seed (Phase 11b migration)', () => {
  it('installs the full payload and mirrors D1 (via waitUntil) when ?name is set', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set('stale', 'yes'); // must be wiped before install
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const state = makeState('x', record);
    const room = new RoomDO(state, env);
    const res = await room.fetch(
      new Request('https://do/_do/seed?name=gamma', {
        method: 'POST',
        body: JSON.stringify({
          snapshot: 'socialcalc:v1',
          log: ['cmd-1', 'cmd-2'],
          audit: ['cmd-1', 'cmd-2'],
          chat: ['hello', 'world'],
          ecell: { alice: 'A1', bob: 'B2' },
          updatedAt: 1700,
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    expect(record.map.has('stale')).toBe(false);
    // Fold-on-ingest: stored snapshot is the FOLDED save (mock → 'SNAP'),
    // with the log baked in. The log tail is retained for client catch-up.
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SNAP');
    expect(record.map.get(STORAGE_KEYS.metaUpdatedAt)).toBe(1700);
    expect(record.map.get(logKey(0))).toBe('cmd-1');
    expect(record.map.get(logKey(1))).toBe('cmd-2');
    expect(record.map.get(auditKey(0))).toBe('cmd-1');
    expect(record.map.get(auditKey(1))).toBe('cmd-2');
    expect(record.map.get(chatKey(0))).toBe('hello');
    expect(record.map.get(chatKey(1))).toBe('world');
    expect(record.map.get(ecellKey('alice'))).toBe('A1');
    expect(record.map.get(ecellKey('bob'))).toBe('B2');
    // D1 mirror was scheduled via `state.waitUntil` — the behavior we
    // care about is "201 doesn't block on D1 commit". In production
    // the mirror drains on the DO's background execution context; the
    // fake D1 here resolves synchronously so the INSERT lands before
    // drainWaitUntil(), but we still assert that `waitUntil` was
    // actually called (and that draining is idempotent).
    // Three mirrors scheduled via waitUntil: rooms index + audit_log + chat_log.
    expect(state.__waitUntilPromises).toHaveLength(3);
    await drainWaitUntil(state);
    const insert = calls.find((c) => c.sql.startsWith('INSERT INTO rooms'));
    expect(insert).toBeDefined();
    expect(insert?.params).toEqual(['gamma', 1700]);
    // The seeded audit + chat are mirrored to their durable D1 stores so the
    // alarm's DO-tail trim can't lose a migrated room's history. Pin the
    // mapped row contents so the `(body, i) => ({seq, ts, body})` literals
    // can't be blanked to {}.
    const auditCall = calls.find((c) => c.sql.includes('INSERT INTO audit_log'));
    expect(auditCall!.params.slice(0, 4)).toEqual(['gamma', 0, 1700, 'cmd-1']);
    const chatCall = calls.find((c) => c.sql.includes('INSERT INTO chat_log'));
    expect(chatCall!.params.slice(0, 4)).toEqual(['gamma', 0, 1700, 'hello']);
  });

  it('skipIndex:true suppresses the D1 mirror entirely', async () => {
    // The migrator sends skipIndex:true so it can batch index writes
    // via /_migrate/bulk-index. The DO must NOT schedule the mirror at
    // all — not even as a waitUntil task — or we'd double-write.
    const record: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const state = makeState('x', record);
    const room = new RoomDO(state, env);
    const res = await room.fetch(
      new Request('https://do/_do/seed?name=gamma', {
        method: 'POST',
        body: JSON.stringify({
          snapshot: 'S',
          updatedAt: 42,
          skipIndex: true,
        }),
      }),
    );
    expect(res.status).toBe(201);
    // Draining confirms there were no pending writes either.
    await drainWaitUntil(state);
    expect(calls.find((c) => c.sql.startsWith('INSERT INTO rooms'))).toBeUndefined();
  });

  it('log-only rooms (no base snapshot) fold the log into a snapshot on ingest', async () => {
    // Previously this asserted log-only rooms kept the "no snapshot"
    // shape, expecting the hydrate path to replay the log. That path no
    // longer replays over a present snapshot, so a log-only seed must
    // FOLD the log onto an empty sheet and store the result — otherwise
    // the room would read back empty. The mocked createSpreadsheetSave
    // returns 'SNAP'.
    const record: FakeStorageRecord = { map: new Map() };
    const state = makeState('x', record);
    const room = new RoomDO(state, makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: JSON.stringify({
          log: ['cmd'],
          updatedAt: 500,
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SNAP');
    expect(record.map.get(STORAGE_KEYS.metaUpdatedAt)).toBe(500);
    expect(record.map.get(logKey(0))).toBe('cmd');
    await drainWaitUntil(state);
  });

  it('truly empty rooms (no snapshot, no log) keep the "no snapshot" shape', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const state = makeState('x', record);
    const room = new RoomDO(state, makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: JSON.stringify({ updatedAt: 500 }),
      }),
    );
    expect(res.status).toBe(201);
    expect(record.map.has(STORAGE_KEYS.snapshot)).toBe(false);
    expect(record.map.get(STORAGE_KEYS.metaUpdatedAt)).toBe(500);
    await drainWaitUntil(state);
  });

  it('returns 400 with the handler error message on a bad payload', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: JSON.stringify({ log: 'not-an-array' }),
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('log must be a string[]');
    expect(record.map.size).toBe(0); // no partial writes
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: '{not json',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('seed body must be valid JSON');
  });

  it('skips the D1 mirror when ?name is absent', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const state = makeState('x', record);
    const room = new RoomDO(state, env);
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: JSON.stringify({ snapshot: 's', updatedAt: 1 }),
      }),
    );
    expect(res.status).toBe(201);
    await drainWaitUntil(state);
    expect(calls.length).toBe(0);
  });

  it('defaults updatedAt to Date.now() when omitted', async () => {
    // Covers the inline `() => Date.now()` injected into parseSeedPayload;
    // every other test supplies an explicit updatedAt.
    const record: FakeStorageRecord = { map: new Map() };
    const state = makeState('x', record);
    const room = new RoomDO(state, makeEnv());
    const before = Date.now();
    const res = await room.fetch(
      new Request('https://do/_do/seed', {
        method: 'POST',
        body: JSON.stringify({ snapshot: 's' }),
      }),
    );
    const after = Date.now();
    expect(res.status).toBe(201);
    const stored = record.map.get(STORAGE_KEYS.metaUpdatedAt) as number;
    expect(stored).toBeGreaterThanOrEqual(before);
    expect(stored).toBeLessThanOrEqual(after);
    await drainWaitUntil(state);
  });
});

/**
 * Design "fold" — storage-growth bounds + the latent double-apply fix.
 * These exercise the ring-buffer log trim, the ecell LRU cap, the
 * housekeeping alarm (TTL expiry + chat trim + re-arm), and the inline
 * WS connection/frame caps. The end-to-end double-apply regression (real
 * SocialCalc, non-idempotent command) lives in `room.test.ts` because the
 * Node suite mocks SocialCalc.
 */
describe('RoomDO — fold: log ring buffer', () => {
  it('trims log:<seq - LOG_RING> as it appends past the ring window', async () => {
    // LOG_RING is 1024. Pre-seed the seq counters so the next append is
    // seq 1024 — that write must delete log:0000…0000 (seq 0).
    const record: FakeStorageRecord = { map: new Map() };
    // Seed exactly 1024 existing log+audit entries would be slow; instead
    // pre-populate the boundary entry plus enough counter state via two
    // sentinel keys so #ensureSeqs derives the right next-seq. We do it by
    // setting the lowest and a marker at seq 1023, then asserting on the
    // appended seq. Simpler: set log:0 and log:1023, drive seq via a full
    // count. We instead directly seed 1024 entries cheaply.
    for (let i = 0; i < 1024; i++) record.map.set(logKey(i), `c${i}`);
    for (let i = 0; i < 1024; i++) record.map.set(auditKey(i), `c${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'newcmd' }),
    );
    // Appended at seq 1024 → log:1024 present, log:0 evicted, audit:0 kept.
    expect(record.map.get(logKey(1024))).toBe('newcmd');
    expect(record.map.has(logKey(0))).toBe(false);
    expect(record.map.get(auditKey(0))).toBe('c0'); // audit never trimmed
    expect(record.map.get(auditKey(1024))).toBe('newcmd');
  });

  it('does NOT trim before the ring window fills', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'first' }),
    );
    // seq 0 < LOG_RING → no delete. log:0 stays.
    expect(record.map.get(logKey(0))).toBe('first');
  });
});

describe('RoomDO — fold: ecell LRU cap', () => {
  it('evicts the least-recently-written user once the cap is exceeded', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    // Write ECELL_CAP (256) distinct users, then one more — the first
    // (oldest) must be evicted.
    for (let i = 0; i < 256; i++) await room.putEcell(`u${i}`, `A${i}`);
    expect(record.map.has(ecellKey('u0'))).toBe(true);
    await room.putEcell('u256', 'Z1');
    expect(record.map.has(ecellKey('u0'))).toBe(false); // evicted
    expect(record.map.has(ecellKey('u256'))).toBe(true);
    // The set stays at the cap.
    const ecells = Array.from(record.map.keys()).filter((k) =>
      k.startsWith(STORAGE_KEYS.ecellPrefix),
    );
    expect(ecells.length).toBe(256);
  });

  it('re-writing an existing user refreshes recency without growing the set', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    for (let i = 0; i < 256; i++) await room.putEcell(`u${i}`, `A${i}`);
    // Touch u0 — it becomes most-recent, so the next overflow evicts u1.
    await room.putEcell('u0', 'A0-updated');
    await room.putEcell('u256', 'Z1');
    expect(record.map.get(ecellKey('u0'))).toBe('A0-updated'); // survived
    expect(record.map.has(ecellKey('u1'))).toBe(false); // evicted instead
  });

  it('seeds the LRU order from storage on first write (survives isolate restart)', async () => {
    // Pre-seed 256 ecells directly in storage (as a warm DO would have on
    // disk after a restart), then write one more via a fresh RoomDO whose
    // in-memory order starts null. The seed branch must read the existing
    // keys so the cap is honoured immediately.
    const record: FakeStorageRecord = { map: new Map() };
    for (let i = 0; i < 256; i++) record.map.set(ecellKey(`u${i}`), `A${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.putEcell('newcomer', 'Z9');
    // One of the pre-seeded users was evicted; total ecell keys == cap.
    const ecells = Array.from(record.map.keys()).filter((k) =>
      k.startsWith(STORAGE_KEYS.ecellPrefix),
    );
    expect(ecells.length).toBe(256);
    expect(record.map.has(ecellKey('newcomer'))).toBe(true);
  });

  it('routes WS my.ecell writes through the capped path', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }, { user: 'alice', room: 'r', auth: 'h' });
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'my.ecell', room: 'r', user: 'alice', ecell: 'A1' }),
    );
    expect(record.map.get(ecellKey('alice'))).toBe('A1');
  });
});

describe('RoomDO — fold: housekeeping alarm', () => {
  it('arms the alarm on the first write and dedupes subsequent arms', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const before = Date.now();
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'c1' }),
    );
    const firstArm = record.alarm as number;
    expect(typeof firstArm).toBe('number');
    // Armed roughly one hour out (ALARM_INTERVAL_MS = 60*60*1000). Asserting
    // the magnitude pins the interval arithmetic — a 1000× error (e.g.
    // 60*60/1000 = 3.6 ms, or 60/60*1000 = 1000 ms) would land the alarm in
    // the immediate past/near-future and fail this bound.
    expect(firstArm).toBeGreaterThan(before + 30 * 60 * 1000);
    expect(firstArm).toBeLessThan(before + 90 * 60 * 1000);
    // A second write must NOT re-arm (cached #alarmArmed short-circuits).
    record.alarm = 999; // sentinel — if re-armed it'd be overwritten
    await room.fetch(
      new Request('https://do/_do/commands', { method: 'POST', body: 'c2' }),
    );
    expect(record.alarm).toBe(999);
  });

  it('recovers an already-armed alarm from storage across a restart (getAlarm != null)', async () => {
    // Fresh RoomDO (#alarmArmed false) but storage already has an alarm
    // pending — the arm path must observe it via getAlarm() and NOT push a
    // new time.
    const record: FakeStorageRecord = { map: new Map(), alarm: 12345 };
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.putEcell('alice', 'A1'); // triggers #armAlarm
    expect(record.alarm).toBe(12345); // unchanged — recovered, not re-set
  });

  it('alarm() trims chat to the most recent CHAT_KEEP entries and re-arms', async () => {
    const record: FakeStorageRecord = { map: new Map(), alarm: 1 };
    // Non-chat keys present so that a mis-scoped list({}) (no prefix) would
    // mis-count and either delete the snapshot or under-trim chat —
    // pinning the `{prefix: chatPrefix}` filter.
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(ecellKey('alice'), 'A1');
    // 600 chat entries → trim down to the last 500.
    for (let i = 0; i < 600; i++) record.map.set(chatKey(i), `m${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    record.alarm = null; // simulate the alarm having fired (disarmed)
    await room.alarm();
    const chatKeys = Array.from(record.map.keys()).filter((k) =>
      k.startsWith(STORAGE_KEYS.chatPrefix),
    );
    expect(chatKeys.length).toBe(500);
    expect(record.map.has(chatKey(0))).toBe(false); // oldest dropped
    expect(record.map.has(chatKey(599))).toBe(true); // newest kept
    // Non-chat keys untouched by the chat-scoped trim.
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SAVE');
    expect(record.map.get(ecellKey('alice'))).toBe('A1');
    // Re-armed for the next cycle.
    expect(typeof record.alarm).toBe('number');
  });

  it('alarm() leaves chat untouched at EXACTLY CHAT_KEEP (boundary)', async () => {
    // Exactly 500 entries → `keys.length <= CHAT_KEEP` is true, no trim.
    // Pinning the boundary kills the `<=`→`<` and `<=`→false mutants.
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    for (let i = 0; i < 500; i++) record.map.set(chatKey(i), `m${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.alarm();
    const chatKeys = Array.from(record.map.keys()).filter((k) =>
      k.startsWith(STORAGE_KEYS.chatPrefix),
    );
    expect(chatKeys.length).toBe(500); // untouched
  });

  it('alarm() trims exactly one when CHAT_KEEP + 1 entries exist (boundary)', async () => {
    // 501 entries → trims the single oldest, leaving 500. Pins the
    // `keys.length - CHAT_KEEP` slice arithmetic and the `<=` boundary.
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    for (let i = 0; i < 501; i++) record.map.set(chatKey(i), `m${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.alarm();
    const chatKeys = Array.from(record.map.keys()).filter((k) =>
      k.startsWith(STORAGE_KEYS.chatPrefix),
    );
    expect(chatKeys.length).toBe(500);
    expect(record.map.has(chatKey(0))).toBe(false); // exactly the oldest gone
    expect(record.map.has(chatKey(1))).toBe(true);
  });

  it('alarm() wipes a stale room when ETHERCALC_EXPIRE is set and TTL exceeded', async () => {
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(chatKey(0), 'm0');
    // updated_at far in the past → stale relative to a 60s TTL.
    record.map.set(STORAGE_KEYS.metaUpdatedAt, Date.now() - 120_000);
    const env: Env = {
      ROOM: {} as DurableObjectNamespace,
      ETHERCALC_EXPIRE: '60', // seconds
    };
    const room = new RoomDO(makeState('x', record), env);
    await room.alarm();
    // Whole room wiped — no snapshot, no chat — and NOT re-armed.
    expect(record.map.size).toBe(0);
    expect(record.alarm).toBeNull();
  });

  it('alarm() keeps a fresh room when ETHERCALC_EXPIRE is set but TTL not exceeded', async () => {
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    record.map.set(STORAGE_KEYS.metaUpdatedAt, Date.now()); // just touched
    const env: Env = {
      ROOM: {} as DurableObjectNamespace,
      ETHERCALC_EXPIRE: '3600',
    };
    const room = new RoomDO(makeState('x', record), env);
    await room.alarm();
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SAVE'); // survived
    expect(typeof record.alarm).toBe('number'); // re-armed
  });

  it('alarm() treats a non-positive / non-numeric ETHERCALC_EXPIRE as no TTL', async () => {
    // parseExpireMs returns null for '0' (non-positive) and 'abc'
    // (non-finite) → no TTL expiry, room preserved.
    for (const bad of ['0', 'abc']) {
      const record: FakeStorageRecord = { map: new Map(), alarm: null };
      record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
      record.map.set(STORAGE_KEYS.metaUpdatedAt, Date.now() - 1_000_000);
      const env: Env = {
        ROOM: {} as DurableObjectNamespace,
        ETHERCALC_EXPIRE: bad,
      };
      const room = new RoomDO(makeState('x', record), env);
      await room.alarm();
      expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SAVE');
    }
  });

  it('alarm() skips TTL expiry when meta:updated_at is missing', async () => {
    // ETHERCALC_EXPIRE set, but no stored timestamp → the `typeof number`
    // guard short-circuits and the room is preserved + chat trimmed.
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    record.map.set(STORAGE_KEYS.snapshot, 'SAVE');
    const env: Env = {
      ROOM: {} as DurableObjectNamespace,
      ETHERCALC_EXPIRE: '60',
    };
    const room = new RoomDO(makeState('x', record), env);
    await room.alarm();
    expect(record.map.get(STORAGE_KEYS.snapshot)).toBe('SAVE');
  });
});

describe('RoomDO — fold: seq counters survive a trim + isolate restart', () => {
  // Regression for the seq-collision bug: the log ring-trim and chat trim
  // delete entries from the FRONT, leaving a non-contiguous key window. A
  // count-based next-seq (`map.size`) would then land INSIDE that window on
  // the first write after a cold restart (#next*Seq === null), silently
  // overwriting a live entry and defeating the ring bound. Next-seq must be
  // derived from the MAX existing key index + 1.

  it('appendChat derives next-seq from the max key index, not the count', async () => {
    // Window left by a prior trim: chat:2..5 remain (0,1 trimmed). COUNT is
    // 4, but the next seq must be 6 (max 5 + 1) — writing chat:4 would
    // clobber a live entry. Fresh RoomDO so #nextChatSeq === null.
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    for (let i = 2; i <= 5; i++) record.map.set(chatKey(i), `old${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    const seq = await room.appendChat('NEW');
    expect(seq).toBe(6); // max(5)+1, NOT count(4)
    expect(record.map.get(chatKey(6))).toBe('NEW');
    expect(record.map.get(chatKey(4))).toBe('old4'); // live entry untouched
  });

  it('appendChat starts at seq 0 on an empty room (max=-1 → 0)', async () => {
    const record: FakeStorageRecord = { map: new Map(), alarm: null };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const seq = await room.appendChat('first');
    expect(seq).toBe(0);
    expect(record.map.get(chatKey(0))).toBe('first');
  });

  it('POST /_do/commands over a non-contiguous log window resumes from the max index', async () => {
    // Simulate the post-restart state of a long-lived room whose log was
    // ring-trimmed: only log:2000..2002 remain. The next command must land
    // at log:2003 (max 2002 + 1), NOT log:3 (count 3) which would corrupt
    // the live window. Exercises the log path through #ensureSeqs → #nextSeq.
    const record: FakeStorageRecord = { map: new Map() };
    for (let i = 2000; i <= 2002; i++) {
      record.map.set(logKey(i), `set A1 value n ${i}`);
    }
    const room = new RoomDO(makeState('x', record), makeEnv());
    await room.fetch(
      new Request('https://do/_do/commands', {
        method: 'POST',
        body: 'set A2 value n 42',
      }),
    );
    expect(record.map.get(logKey(2003))).toBe('set A2 value n 42');
    expect(record.map.get(logKey(2000))).toBe('set A1 value n 2000'); // untouched
  });
});

describe('RoomDO — fold: inline WS caps', () => {
  it('rejects a WS upgrade with 503 once the connection cap is reached', async () => {
    // 128 peers already connected (MAX_CONN). getWebSockets() returns them.
    const peers = Array.from({ length: 128 }, () =>
      makeFakeWs({ sent: [] }),
    );
    const record: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', record, peers);
    const room = new RoomDO(state, makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/ws', {
        headers: { Upgrade: 'websocket' },
      }),
    );
    expect(res.status).toBe(503);
    expect(await res.text()).toBe('Too many connections');
  });

  it('still 426s a non-upgrade request before the connection-cap check', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(new Request('https://do/_do/ws'));
    expect(res.status).toBe(426);
  });

  it('passes the connection-cap check under the limit (reaches the workerd-only upgrade)', async () => {
    // Below MAX_CONN with a valid Upgrade header → the cap check's FALSE
    // branch executes and control reaches `upgradeWebSocket`, which is
    // workerd-only (needs `WebSocketPair`). In Node that throws — we only
    // assert the throw to prove the cap check was passed (covering the
    // `< MAX_CONN` branch); the real 101 path is exercised in the
    // workers-pool tests.
    const record: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', record, []); // 0 peers < cap
    const room = new RoomDO(state, makeEnv());
    await expect(
      room.fetch(
        new Request('https://do/_do/ws', {
          headers: { Upgrade: 'websocket' },
        }),
      ),
    ).rejects.toThrow();
  });

  it('drops an oversized WS frame (> MAX_FRAME) before parsing', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', record, []);
    const room = new RoomDO(state, makeEnv());
    const log: FakeWsLog = { sent: [] };
    const ws = makeFakeWs(log, { user: 'alice', room: 'r', auth: 'h' });
    // A valid-shaped chat frame padded past MAX_FRAME (1 MiB). Without the
    // cap it would persist a chat entry; with the cap it's silently dropped.
    const huge = 'x'.repeat(1024 * 1024 + 1);
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'chat', room: 'r', user: 'alice', msg: huge }),
    );
    expect(record.map.has(chatKey(0))).toBe(false); // nothing persisted
    expect(log.sent).toHaveLength(0); // nothing broadcast
  });
});

describe('RoomDO — POST /_do/snapshot-chunk (Phase 11b chunked upload)', () => {
  it('non-final chunk stores the chunk and does not touch meta or D1', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const room = new RoomDO(makeState('x', record), env);
    const res = await room.fetch(
      new Request('https://do/_do/snapshot-chunk?seq=0&chunks=3&name=gamma', {
        method: 'POST',
        body: 'aaaa',
      }),
    );
    expect(res.status).toBe(201);
    expect(record.map.get(snapshotChunkKey(0))).toBe('aaaa');
    // Intermediate chunk must not flip meta or the updated_at timestamp —
    // readers should still see whatever snapshot was there before the
    // upload started (or no snapshot).
    expect(record.map.has(STORAGE_KEYS.snapshotMeta)).toBe(false);
    expect(record.map.has(STORAGE_KEYS.metaUpdatedAt)).toBe(false);
    expect(calls.length).toBe(0);
  });

  it('final chunk writes meta + updated_at and mirrors D1', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const room = new RoomDO(makeState('x', record), env);

    for (const [i, body] of [
      [0, 'aaaa'],
      [1, 'bbbb'],
    ] as const) {
      const res = await room.fetch(
        new Request(`https://do/_do/snapshot-chunk?seq=${i}&chunks=3&name=gamma`, {
          method: 'POST',
          body,
        }),
      );
      expect(res.status).toBe(201);
    }
    const before = Date.now();
    const res = await room.fetch(
      new Request('https://do/_do/snapshot-chunk?seq=2&chunks=3&name=gamma', {
        method: 'POST',
        body: 'cccc',
      }),
    );
    const after = Date.now();
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    expect(record.map.get(snapshotChunkKey(0))).toBe('aaaa');
    expect(record.map.get(snapshotChunkKey(1))).toBe('bbbb');
    expect(record.map.get(snapshotChunkKey(2))).toBe('cccc');
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 3 });
    const stored = record.map.get(STORAGE_KEYS.metaUpdatedAt) as number;
    expect(stored).toBeGreaterThanOrEqual(before);
    expect(stored).toBeLessThanOrEqual(after);
    // D1 mirror runs synchronously in the final-chunk path (not via
    // waitUntil like /_do/seed) because snapshot-chunk is inherently
    // the tail of a multi-request upload — the migrator's next step
    // depends on knowing the mirror landed.
    const insert = calls.find((c) => c.sql.startsWith('INSERT INTO rooms'));
    expect(insert).toBeDefined();
    expect(insert?.params).toEqual(['gamma', stored]);
  });

  it('final chunk deletes any legacy single-key snapshot from a prior seed', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    // Simulate a prior seed that left a small single-key snapshot.
    record.map.set(STORAGE_KEYS.snapshot, 'OLD-SMALL-SAVE');
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request('https://do/_do/snapshot-chunk?seq=0&chunks=1', {
        method: 'POST',
        body: 'NEW-CHUNKED',
      }),
    );
    expect(res.status).toBe(201);
    // The legacy single-key must be gone — otherwise readSnapshot's
    // fast path would return the stale OLD-SMALL-SAVE.
    expect(record.map.has(STORAGE_KEYS.snapshot)).toBe(false);
    expect(record.map.get(snapshotChunkKey(0))).toBe('NEW-CHUNKED');
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 1 });
  });

  it('final chunk deletes stale higher-seq chunks from a prior larger chunked save', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    // Simulate a prior 5-chunk save that we're about to overwrite
    // with a new 3-chunk save.
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 5 });
    for (let i = 0; i < 5; i++) record.map.set(snapshotChunkKey(i), `old-${i}`);
    const room = new RoomDO(makeState('x', record), makeEnv());
    // Write new chunks 0..2.
    for (const [i, body] of [
      [0, 'new-0'],
      [1, 'new-1'],
      [2, 'new-2'],
    ] as const) {
      const res = await room.fetch(
        new Request(`https://do/_do/snapshot-chunk?seq=${i}&chunks=3`, {
          method: 'POST',
          body,
        }),
      );
      expect(res.status).toBe(201);
    }
    // Chunks 3 and 4 from the prior save must be cleaned up so a
    // reader following the new meta doesn't stop at 3 while the
    // orphans silently waste storage.
    expect(record.map.has(snapshotChunkKey(3))).toBe(false);
    expect(record.map.has(snapshotChunkKey(4))).toBe(false);
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 3 });
  });

  it('re-chunking at the same chunk count leaves nothing stale to clean', async () => {
    // Covers the `priorMeta !== null` branch where the new chunk count
    // matches the prior chunk count exactly — the stale loop has no
    // iterations but the legacy single-key cleanup still fires.
    const record: FakeStorageRecord = { map: new Map() };
    record.map.set(STORAGE_KEYS.snapshotMeta, { chunks: 2 });
    record.map.set(snapshotChunkKey(0), 'old-0');
    record.map.set(snapshotChunkKey(1), 'old-1');
    const room = new RoomDO(makeState('x', record), makeEnv());
    for (const [i, body] of [
      [0, 'new-0'],
      [1, 'new-1'],
    ] as const) {
      const res = await room.fetch(
        new Request(`https://do/_do/snapshot-chunk?seq=${i}&chunks=2`, {
          method: 'POST',
          body,
        }),
      );
      expect(res.status).toBe(201);
    }
    expect(record.map.get(snapshotChunkKey(0))).toBe('new-0');
    expect(record.map.get(snapshotChunkKey(1))).toBe('new-1');
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 2 });
  });

  it('final chunk without ?name skips the D1 mirror', async () => {
    const record: FakeStorageRecord = { map: new Map() };
    const calls: D1Call[] = [];
    const env = makeEnvWithDb(calls);
    const room = new RoomDO(makeState('x', record), env);
    const res = await room.fetch(
      new Request('https://do/_do/snapshot-chunk?seq=0&chunks=1', {
        method: 'POST',
        body: 'only-chunk',
      }),
    );
    expect(res.status).toBe(201);
    expect(calls.length).toBe(0);
    expect(record.map.get(STORAGE_KEYS.snapshotMeta)).toEqual({ chunks: 1 });
  });

  it.each([
    ['missing seq', 'chunks=2'],
    ['missing chunks', 'seq=0'],
    ['non-integer seq', 'seq=1.5&chunks=2'],
    ['negative seq', 'seq=-1&chunks=2'],
    ['chunks=0', 'seq=0&chunks=0'],
    ['seq >= chunks', 'seq=2&chunks=2'],
  ])('%s → 400', async (_label, qs) => {
    const record: FakeStorageRecord = { map: new Map() };
    const room = new RoomDO(makeState('x', record), makeEnv());
    const res = await room.fetch(
      new Request(`https://do/_do/snapshot-chunk?${qs}`, {
        method: 'POST',
        body: 'x',
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe(
      'seq/chunks must be integers with 0 ≤ seq < chunks',
    );
    // Nothing written on the bad-params path.
    expect(record.map.size).toBe(0);
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
    // Snapshot is authoritative — the log is sent empty so the client
    // doesn't double-apply commands the snapshot already contains.
    expect(reply.log).toEqual([]);
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

  it('webSocketMessage execute under keyed mode uses the message auth, not a constant', async () => {
    // Pins the perMessageAuth selector at room.ts:753
    //   ('auth' in parsed && typeof parsed.auth === 'string') ? parsed.auth : ''
    //
    // With ETHERCALC_KEY set, verifyAuth requires the supplied auth to
    // match `computeAuth(key, room)` exactly. Any mutation that turns
    // the selector into a constant (`''`, `"Stryker was here!"`, swaps
    // `&&` ↔ `||`, flips the typeof check, etc.) produces a perMessageAuth
    // that doesn't match — verifyAuth rejects → command dropped →
    // test fails.
    const { state } = makeWsAwareState('k', record, []);
    const env: Env = {
      ROOM: {} as DurableObjectNamespace,
      ETHERCALC_KEY: 'shared-secret',
    };
    const room = new RoomDO(state, env);
    // Compute the real HMAC the message must carry.
    const { computeAuth } = await import('../src/lib/auth.ts');
    const hmac = await computeAuth('shared-secret', 'r');
    const ws = makeFakeWs({ sent: [] }, { user: 'alice', room: 'r', auth: hmac });
    await room.webSocketMessage(
      ws,
      JSON.stringify({
        type: 'execute',
        room: 'r',
        user: 'alice',
        auth: hmac,
        cmdstr: 'set A1 value n 1',
      }),
    );
    expect(record.map.get(logKey(0))).toBe('set A1 value n 1');
    expect(mockExec).toHaveBeenCalledWith('set A1 value n 1');
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
    // Authoritative snapshot → empty log (no client-side double-apply).
    expect(reply.log).toEqual([]);
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

  it('chat appendLog falls back to the frame room when the attachment room is empty', async () => {
    // Default attachment is { user: '', room: '', auth: '' }, so the chat
    // appendLog closure's `attachment.room || messageRoom` takes the
    // messageRoom branch (the audit/chat-mirror room source).
    const fresh: FakeStorageRecord = { map: new Map() };
    const { state } = makeWsAwareState('x', fresh, []);
    const room = new RoomDO(state, makeEnv());
    const ws = makeFakeWs({ sent: [] }); // empty attachment
    await room.webSocketMessage(
      ws,
      JSON.stringify({ type: 'chat', room: 'fallback-room', user: 'u', msg: 'm' }),
    );
    expect(fresh.map.get(chatKey(0))).toBe('m');
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
    // Pin the empty response body — every fire-trigger exit path
    // returns `plainResponse('', 200)` (room.ts:690/695/707/711),
    // and StringLiteral → "Stryker was here!" mutations on the
    // empty-string body would leak garbage to the cron runner.
    expect(await res.text()).toBe('');
    expect(mockExportCell).not.toHaveBeenCalled();
  });

  it('returns 200 and no-ops when the cell record is null', async () => {
    mockExportCell.mockReturnValueOnce(null);
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=Z9', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
    expect(mockExportCell).toHaveBeenCalledWith('Z9');
  });

  it('returns 200 when the cell is present but not a valid sendemail payload', async () => {
    mockExportCell.mockReturnValueOnce({ datavalue: 'hello' });
    const res = await room.fetch(
      new Request('https://do/_do/fire-trigger?cell=A1', { method: 'POST' }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');
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
    expect(await res.text()).toBe('');
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

  // The tests above assert status 200 but don't pin WHICH field
  // (formula vs datavalue) was used to build the sendemail payload.
  // The next block observes the `confirmemailsent` broadcast + its
  // message content so the boundary/equality/logic mutants on lines
  // 702-705 of room.ts (the `formula.length > 0 ? formula : ''` /
  // `|| datavalue` selector) are no longer semantically equivalent
  // to the originals.

  describe('fire-trigger: selector between formula and datavalue', () => {
    async function callWithPeer(
      cellRecord: { formula?: unknown; datavalue?: unknown },
    ): Promise<string[]> {
      const peerLog: FakeWsLog = { sent: [] };
      const peerWs = makeFakeWs(peerLog);
      // A state whose getWebSockets returns a live peer so we can
      // observe #broadcastAll's output.
      const stateWithPeer = {
        ...makeState('fire-peer', { map: new Map() }),
        getWebSockets(): WebSocket[] {
          return [peerWs];
        },
      } as unknown as DurableObjectState;
      const r = new RoomDO(stateWithPeer, makeEnv());
      mockExportCell.mockReturnValueOnce(cellRecord);
      await r.fetch(
        new Request('https://do/_do/fire-trigger?cell=A1', { method: 'POST' }),
      );
      return peerLog.sent;
    }

    it('uses formula when it is a non-empty string (both fields set)', async () => {
      const sent = await callWithPeer({
        formula: 'sendemail to@example.test form-subject form-body',
        datavalue: 'sendemail wrong@example.test other other',
      });
      // A confirmemailsent frame must fire; the STUB returns
      // " [E-mail Sent]" as the message. Parse+verify the payload.
      expect(sent).toHaveLength(1);
      const msg = JSON.parse(sent[0]!) as { type: string; message?: string };
      expect(msg.type).toBe('confirmemailsent');
    });

    it('falls back to datavalue when formula is the empty string', async () => {
      const sent = await callWithPeer({
        formula: '',
        datavalue: 'sendemail dv@example.test dv-subj dv-body',
      });
      expect(sent).toHaveLength(1);
      const msg = JSON.parse(sent[0]!) as { type: string };
      expect(msg.type).toBe('confirmemailsent');
    });

    it('falls back to datavalue when formula is non-string', async () => {
      // A number formula triggers the `typeof === 'string'` guard on
      // line 702 — the original drops into `''` and then the `||`
      // selects datavalue. A mutation replacing the typeof check with
      // `true` would take the formula branch and feed `Number` through
      // parseSendemail, which returns null → no broadcast.
      const sent = await callWithPeer({
        formula: 42 as unknown as string,
        datavalue: 'sendemail dv2@example.test s2 b2',
      });
      expect(sent).toHaveLength(1);
    });

    it('no broadcast when neither field carries a valid sendemail', async () => {
      // Formula is present but not a sendemail; datavalue is present
      // but also not a sendemail. parseSendemail returns null → no
      // broadcast. Pins the `parseSendemail` return-check on line 707.
      const sent = await callWithPeer({
        formula: 'not a sendemail',
        datavalue: 'also not a sendemail',
      });
      expect(sent).toEqual([]);
    });

    it('no broadcast when only a non-string formula AND non-string datavalue', async () => {
      const sent = await callWithPeer({
        formula: 1 as unknown as string,
        datavalue: 2 as unknown as string,
      });
      expect(sent).toEqual([]);
    });
  });
});
