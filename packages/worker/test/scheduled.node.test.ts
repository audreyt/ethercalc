import { describe, it, expect, vi } from 'vite-plus/test';

import { MAX_CRON_ROWS_PER_RUN, runScheduled } from '../src/scheduled.ts';
import type { Env } from '../src/env.ts';

/**
 * Node-level coverage for `runScheduled` (Phase 9). We stub:
 *
 *   - `env.DB`     — enough surface to `prepare().all()` once and
 *                    `prepare().bind().run()` or `batch()` any number
 *                    of deletes.
 *   - `env.ROOM`   — a `DurableObjectNamespace` whose stubs record the
 *                    fetch URLs.
 *
 * The tests drive different time pins and assert the due/keep
 * partition, the DO fetches, and the deleted rows.
 */

interface FakeDBState {
  rows: Array<{ room: string; cell: string; fire_at: number }>;
  batchCalls: unknown[][];
  prepareSqls: string[];
}

function makeFakeDb(
  rows: Array<{ room: string; cell: string; fire_at: number }>,
  claimChanges = 1,
): { db: D1Database; state: FakeDBState } {
  const state: FakeDBState = { rows: rows.slice(), batchCalls: [], prepareSqls: [] };

  const makeStatement = (sql: string, params: unknown[] = []): D1PreparedStatement => {
    const stmt = {
      bind(...more: unknown[]) {
        return makeStatement(sql, [...params, ...more]);
      },
      async run() {
        return { success: true, meta: {} } as unknown as D1Response;
      },
      async all<T>() {
        if (/SELECT .+ FROM cron_triggers/i.test(sql)) {
          return {
            results: state.rows as unknown as T[],
            success: true,
            meta: {},
          } as unknown as D1Result<T>;
        }
        return {
          results: [] as T[],
          success: true,
          meta: {},
        } as unknown as D1Result<T>;
      },
    } as unknown as D1PreparedStatement;
    return stmt;
  };

  const db: D1Database = {
    prepare: vi.fn((sql: string) => {
      state.prepareSqls.push(sql);
      return makeStatement(sql);
    }),
    batch: vi.fn(async (stmts: unknown[]) => {
      state.batchCalls.push(stmts);
      return stmts.map(
        () =>
          ({
            success: true,
            meta: { changes: claimChanges },
            results: [],
          }) as unknown as D1Result,
      );
    }),
  } as unknown as D1Database;
  return { db, state };
}

function makeFakeRoomNamespace(): {
  namespace: DurableObjectNamespace;
  fetches: Array<{ room: string; url: string }>;
} {
  const fetches: Array<{ room: string; url: string }> = [];
  const namespace = {
    idFromName: (name: string) => ({ toString: () => `id-${name}` }),
    get: (id: { toString: () => string }) => ({
      fetch: async (url: string) => {
        fetches.push({ room: id.toString().replace(/^id-/, ''), url });
        return new Response('', { status: 200 });
      },
    }),
  } as unknown as DurableObjectNamespace;
  return { namespace, fetches };
}

describe('runScheduled', () => {
  it('returns empty on missing env.DB', async () => {
    const env = { ROOM: {} as DurableObjectNamespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 1000 });
    expect(result).toEqual({ due: [], keep: [], fired: [] });
  });

  it('partitions due/keep by fire_at <= nowMinutes', async () => {
    const { db } = makeFakeDb([
      { room: 'r1', cell: 'A1', fire_at: 500 },
      { room: 'r2', cell: 'B2', fire_at: 1500 },
    ]);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 1000 });
    expect(result.due).toEqual([{ room: 'r1', cell: 'A1' }]);
    expect(result.keep).toEqual([
      { room: 'r2', cell: 'B2', fire_at: 1500 },
    ]);
    expect(result.fired).toEqual([{ room: 'r1', cell: 'A1' }]);
    expect(fetches).toHaveLength(1);
    expect(fetches[0]!.room).toBe('r1');
    expect(fetches[0]!.url).toContain('/_do/fire-trigger');
    expect(fetches[0]!.url).toContain('cell=A1');
    expect(fetches[0]!.url).toContain('room=r1');
  });

  it('deletes a malformed stored cell without dispatching it', async () => {
    const { db, state } = makeFakeDb([
      { room: 'r', cell: 'A 1', fire_at: 50 },
    ]);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 100 });
    expect(result.fired).toEqual([]);
    expect(fetches).toHaveLength(0);
    expect(state.batchCalls[0]).toHaveLength(1);
  });

  it('batches a DELETE per due row via db.batch', async () => {
    const rows = [
      { room: 'r1', cell: 'A1', fire_at: 100 },
      { room: 'r1', cell: 'A2', fire_at: 200 },
      { room: 'r2', cell: 'B1', fire_at: 2000 },
    ];
    const { db, state } = makeFakeDb(rows);
    const { namespace } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    await runScheduled({ env, nowMinutes: 300 });
    // Two due triggers -> one batch call with 2 statements.
    expect(state.batchCalls).toHaveLength(1);
    expect(state.batchCalls[0]).toHaveLength(2);
  });

  it('bounds each scheduler scan and dispatch batch', async () => {
    const rows = Array.from(
      { length: MAX_CRON_ROWS_PER_RUN + 5 },
      (_, index) => ({
        room: `r${index}`,
        cell: 'A1',
        fire_at: 100,
      }),
    );
    const { db, state } = makeFakeDb(rows);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 200 });
    expect(result.due).toHaveLength(MAX_CRON_ROWS_PER_RUN);
    expect(result.fired).toHaveLength(MAX_CRON_ROWS_PER_RUN);
    expect(fetches).toHaveLength(MAX_CRON_ROWS_PER_RUN);
    expect(state.batchCalls[0]).toHaveLength(MAX_CRON_ROWS_PER_RUN);
    expect(state.prepareSqls[0]).toContain('LIMIT ?1');
  });

  it('does not retry a claimed row after an ambiguous DO fetch failure', async () => {
    const { db, state } = makeFakeDb([
      { room: 'r', cell: 'A1', fire_at: 100 },
    ]);
    const namespace = {
      idFromName: () => ({ toString: () => 'id-r' }),
      get: () => ({
        fetch: async () => {
          throw new Error('boom');
        },
      }),
    } as unknown as DurableObjectNamespace;
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 200 });
    expect(result.fired).toEqual([]);
    expect(state.batchCalls).toHaveLength(1);
    expect(state.batchCalls[0]).toHaveLength(1);
  });

  it('claims non-2xx and successful rows together before dispatch', async () => {
    const { db, state } = makeFakeDb([
      { room: 'ok', cell: 'A1', fire_at: 100 },
      { room: 'failed', cell: 'B2', fire_at: 100 },
    ]);
    const namespace = {
      idFromName: (name: string) => ({ toString: () => name }),
      get: (id: { toString: () => string }) => ({
        fetch: async () =>
          new Response('', {
            status: id.toString() === 'ok' ? 200 : 503,
          }),
      }),
    } as unknown as DurableObjectNamespace;
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 200 });
    expect(result.fired).toEqual([{ room: 'ok', cell: 'A1' }]);
    expect(state.batchCalls).toHaveLength(1);
    expect(state.batchCalls[0]).toHaveLength(2);
  });

  it('deletes a permanent 4xx trigger failure instead of poisoning retries', async () => {
    const { db, state } = makeFakeDb([
      { room: 'denied', cell: 'A1', fire_at: 100 },
    ]);
    const namespace = {
      idFromName: () => ({ toString: () => 'denied' }),
      get: () => ({
        fetch: async () => new Response('', { status: 403 }),
      }),
    } as unknown as DurableObjectNamespace;
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 200 });
    expect(result.fired).toEqual([]);
    expect(state.batchCalls[0]).toHaveLength(1);
  });

  it('does not dispatch a row claimed by a concurrent invocation', async () => {
    const { db, state } = makeFakeDb(
      [{ room: 'lost-race', cell: 'A1', fire_at: 100 }],
      0,
    );
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 200 });
    expect(result.fired).toEqual([]);
    expect(fetches).toHaveLength(0);
    expect(state.batchCalls).toHaveLength(1);
  });

  it('canonicalizes room names before deriving the DO id', async () => {
    const { db } = makeFakeDb([
      { room: 'space room', cell: 'A1', fire_at: 100 },
    ]);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    await runScheduled({ env, nowMinutes: 200 });
    expect(fetches[0]?.room).toBe('space%20room');
  });

  it('handles empty results array on the initial SELECT', async () => {
    const { db } = makeFakeDb([]);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 100 });
    expect(result).toEqual({ due: [], keep: [], fired: [] });
    expect(fetches).toHaveLength(0);
  });

  it('returns all keep when nothing is due', async () => {
    const { db, state } = makeFakeDb([
      { room: 'r', cell: 'A1', fire_at: 500 },
    ]);
    const { namespace, fetches } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 100 });
    expect(result.keep).toHaveLength(1);
    expect(result.due).toHaveLength(0);
    expect(fetches).toHaveLength(0);
    expect(state.batchCalls).toHaveLength(0);
  });

  it('handles undefined results from the D1 prepare().all()', async () => {
    // Simulate a D1 driver that returns `results: undefined`.
    const db: D1Database = {
      prepare: vi.fn(() => ({
        bind() {
          return this;
        },
        async run() {
          return { success: true, meta: {} } as unknown as D1Response;
        },
        async all<T>() {
          return {
            results: undefined as unknown as T[],
            success: true,
            meta: {},
          } as unknown as D1Result<T>;
        },
      })) as unknown as D1Database['prepare'],
      batch: vi.fn(async () => []),
    } as unknown as D1Database;
    const { namespace } = makeFakeRoomNamespace();
    const env = { DB: db, ROOM: namespace } as unknown as Env;
    const result = await runScheduled({ env, nowMinutes: 100 });
    expect(result).toEqual({ due: [], keep: [], fired: [] });
  });
});
