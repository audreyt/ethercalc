import { describe, it, expect, vi } from 'vitest';

import { buildEmailSender, upsertCronTriggers } from '../src/handlers/cron.ts';
import {
  BindingEmailSender,
  StubEmailSender,
} from '../src/lib/email.ts';
import type { Env } from '../src/env.ts';

/**
 * Coverage for `src/handlers/cron.ts` (Phase 9).
 *
 *   - upsertCronTriggers delegates to a D1 DELETE+INSERT batch. We
 *     stub `db.prepare/bind/run/batch` and assert the SQL shapes.
 *   - buildEmailSender branches on env.EMAIL.
 */

interface Recorded {
  sql: string;
  params: unknown[];
}

function makeFakeDb(): { db: D1Database; calls: Recorded[]; batchCalls: Recorded[][] } {
  const calls: Recorded[] = [];
  const batchCalls: Recorded[][] = [];
  const makeStatement = (sql: string, params: unknown[] = []): D1PreparedStatement => ({
    bind(...more: unknown[]) {
      return makeStatement(sql, [...params, ...more]);
    },
    async run() {
      calls.push({ sql, params });
      return { success: true, meta: {} } as unknown as D1Response;
    },
    async all<T>() {
      return { results: [] as T[], success: true, meta: {} } as unknown as D1Result<T>;
    },
  } as unknown as D1PreparedStatement);
  const db: D1Database = {
    prepare: vi.fn((sql: string) => makeStatement(sql)),
    batch: vi.fn(async (statements: D1PreparedStatement[]) => {
      // Each statement stores its (sql, params) — use a symbol hack.
      const entry = statements.map((s) => {
        // Force the bound statement to report itself via `.run()`.
        // We've already recorded the shape inside `.bind()`, but here
        // we want the batch's exact list. Grab from the per-stmt
        // internal params we kept in closure instead.
        // We achieve that by running each statement and pulling from
        // `calls`; but we don't want to double-count. Safer to
        // introspect via a private stashed property.
        return (s as unknown as { __rec?: Recorded }).__rec ?? {
          sql: 'unknown',
          params: [],
        };
      });
      batchCalls.push(entry);
      return [];
    }),
  } as unknown as D1Database;

  // Patch makeStatement so the per-call (sql, params) lands on the
  // statement instance itself — lets the batch recorder above see it.
  const realMake = makeStatement;
  const wrappedMake = (sql: string, params: unknown[] = []): D1PreparedStatement => {
    const stmt = realMake(sql, params) as unknown as {
      bind: (...args: unknown[]) => unknown;
      __rec: Recorded;
    };
    stmt.__rec = { sql, params };
    const origBind = stmt.bind;
    stmt.bind = function (...more: unknown[]) {
      return wrappedMake(sql, [...params, ...more]);
    };
    return stmt as unknown as D1PreparedStatement;
  };
  (db as unknown as { prepare: unknown }).prepare = vi.fn((sql: string) =>
    wrappedMake(sql),
  );

  return { db, calls, batchCalls };
}

describe('upsertCronTriggers', () => {
  it('issues DELETE + batch INSERTs for a non-empty times list', async () => {
    const { db, batchCalls } = makeFakeDb();
    await upsertCronTriggers(db, 'room1', 'A1', [100, 200, 300]);
    expect(batchCalls).toHaveLength(1);
    const [firstBatch] = batchCalls;
    expect(firstBatch).toBeDefined();
    const batch = firstBatch!;
    expect(batch).toHaveLength(4);
    expect(batch[0]!.sql).toMatch(/DELETE FROM cron_triggers/);
    expect(batch[0]!.params).toEqual(['room1', 'A1']);
    expect(batch[1]!.sql).toMatch(/INSERT OR IGNORE INTO cron_triggers/);
    expect(batch[1]!.params).toEqual(['room1', 'A1', 100]);
    expect(batch[2]!.params).toEqual(['room1', 'A1', 200]);
    expect(batch[3]!.params).toEqual(['room1', 'A1', 300]);
  });

  it('deduplicates repeated times before insert', async () => {
    const { db, batchCalls } = makeFakeDb();
    await upsertCronTriggers(db, 'r', 'B2', [50, 50, 60]);
    const batch = batchCalls[0]!;
    // delete + two inserts (deduped: 50, 60)
    expect(batch).toHaveLength(3);
    expect(batch[1]!.params).toEqual(['r', 'B2', 50]);
    expect(batch[2]!.params).toEqual(['r', 'B2', 60]);
  });

  it('delete-only path when times is empty', async () => {
    const { db, calls, batchCalls } = makeFakeDb();
    await upsertCronTriggers(db, 'r', 'C3', []);
    // No batch; single DELETE via .run()
    expect(batchCalls).toHaveLength(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toMatch(/DELETE FROM cron_triggers/);
    expect(calls[0]!.params).toEqual(['r', 'C3']);
  });
});

describe('buildEmailSender', () => {
  it('returns StubEmailSender when env.EMAIL is undefined', () => {
    const env = {} as unknown as Env;
    const sender = buildEmailSender(env);
    expect(sender).toBeInstanceOf(StubEmailSender);
  });

  it('returns BindingEmailSender when env.EMAIL is bound', () => {
    const env = {
      EMAIL: { send: vi.fn(async () => undefined) },
    } as unknown as Env;
    const sender = buildEmailSender(env);
    expect(sender).toBeInstanceOf(BindingEmailSender);
  });

  it('uses env.EMAIL_FROM when provided, default otherwise', async () => {
    const send1 = vi.fn(async (_m: unknown) => undefined);
    const env1 = {
      EMAIL: { send: send1 },
      EMAIL_FROM: 'a@ex.com',
    } as unknown as Env;
    const sender1 = buildEmailSender(env1);
    await sender1.send('u@ex.com', 's', 'b');
    const msg1 = send1.mock.calls[0]![0] as { from: string };
    expect(msg1.from).toBe('a@ex.com');

    const send2 = vi.fn(async (_m: unknown) => undefined);
    const env2 = {
      EMAIL: { send: send2 },
    } as unknown as Env;
    const sender2 = buildEmailSender(env2);
    await sender2.send('u@ex.com', 's', 'b');
    const msg2 = send2.mock.calls[0]![0] as { from: string };
    expect(msg2.from).toBe('noreply@ethercalc.invalid');
  });
});
