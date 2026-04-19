import { describe, expect, it, vi } from 'vitest';

import { withCronSchema, withRoomsSchema } from '../src/lib/d1-schema.ts';

function makeFakeDb(): {
  db: D1Database;
  execCalls: string[];
} {
  const execCalls: string[] = [];
  const db = {
    exec: vi.fn(async (sql: string) => {
      execCalls.push(sql);
      return { count: 0, duration: 0 } as unknown as D1ExecResult;
    }),
  } as unknown as D1Database;
  return { db, execCalls };
}

describe('withRoomsSchema', () => {
  it('retries after creating the rooms schema on a missing-table error', async () => {
    const { db, execCalls } = makeFakeDb();
    let attempts = 0;
    const result = await withRoomsSchema(db, async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('D1_ERROR: no such table: rooms: SQLITE_ERROR');
      }
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(attempts).toBe(2);
    expect(execCalls).toHaveLength(2);
    expect(execCalls[0]).toContain('CREATE TABLE IF NOT EXISTS rooms');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS rooms_updated_at');
  });

  it('rethrows unrelated errors without touching the schema', async () => {
    const { db, execCalls } = makeFakeDb();
    await expect(withRoomsSchema(db, async () => {
      throw new Error('boom');
    })).rejects.toThrow('boom');
    expect(execCalls).toEqual([]);
  });

  it('treats non-Error throws as non-schema failures', async () => {
    const { db, execCalls } = makeFakeDb();
    await expect(withRoomsSchema(db, async () => {
      throw 'boom';
    })).rejects.toBe('boom');
    expect(execCalls).toEqual([]);
  });
});

describe('withCronSchema', () => {
  it('retries after creating the cron schema on a missing-table error', async () => {
    const { db, execCalls } = makeFakeDb();
    let attempts = 0;
    const result = await withCronSchema(db, async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('D1_ERROR: no such table: cron_triggers: SQLITE_ERROR');
      }
      return 42;
    });
    expect(result).toBe(42);
    expect(attempts).toBe(2);
    expect(execCalls).toHaveLength(2);
    expect(execCalls[0]).toContain('CREATE TABLE IF NOT EXISTS cron_triggers');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS cron_triggers_fire_at');
  });
});
