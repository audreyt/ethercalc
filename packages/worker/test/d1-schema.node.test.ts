import { describe, expect, it, vi } from 'vite-plus/test';

import {
  withAuditSchema,
  withChatSchema,
  withCronSchema,
  withRoomsSchema,
} from '../src/lib/d1-schema.ts';

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
    // Pin the column definitions too — a StringLiteral mutation that
    // zeros-out the column list would leave only the CREATE TABLE header
    // and still satisfy the prefix check above.
    expect(execCalls[0]).toContain('room TEXT PRIMARY KEY');
    expect(execCalls[0]).toContain('updated_at INTEGER NOT NULL');
    expect(execCalls[0]).toContain('cors_public INTEGER NOT NULL DEFAULT 0');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS rooms_updated_at');
    expect(execCalls[1]).toContain('ON rooms(updated_at DESC)');
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
    expect(execCalls[0]).toContain('room TEXT NOT NULL');
    expect(execCalls[0]).toContain('cell TEXT NOT NULL');
    expect(execCalls[0]).toContain('fire_at INTEGER NOT NULL');
    expect(execCalls[0]).toContain('PRIMARY KEY (room, cell, fire_at)');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS cron_triggers_fire_at');
    expect(execCalls[1]).toContain('ON cron_triggers(fire_at)');
  });

  it('does not retry when the error is about a different table', async () => {
    // Pin the `'cron_triggers'` table-name literal on line 55 — a
    // mutation replacing it with `""` would make isMissingTableError
    // match against the empty-string suffix, and effectively flip
    // match-on-anything behavior.
    const { db, execCalls } = makeFakeDb();
    await expect(
      withCronSchema(db, async () => {
        throw new Error('D1_ERROR: no such table: rooms: SQLITE_ERROR');
      }),
    ).rejects.toThrow(/no such table: rooms/);
    expect(execCalls).toEqual([]);
  });
});

describe('withAuditSchema', () => {
  it('retries after creating the audit_log schema on a missing-table error', async () => {
    const { db, execCalls } = makeFakeDb();
    let attempts = 0;
    const result = await withAuditSchema(db, async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('D1_ERROR: no such table: audit_log: SQLITE_ERROR');
      }
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(attempts).toBe(2);
    expect(execCalls).toHaveLength(2);
    expect(execCalls[0]).toContain('CREATE TABLE IF NOT EXISTS audit_log');
    expect(execCalls[0]).toContain('room TEXT NOT NULL');
    expect(execCalls[0]).toContain('seq INTEGER NOT NULL');
    expect(execCalls[0]).toContain('body TEXT NOT NULL');
    expect(execCalls[0]).toContain('PRIMARY KEY (room, seq)');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS audit_log_room');
    expect(execCalls[1]).toContain('ON audit_log(room)');
  });

  it('does not retry when the error is about a different table', async () => {
    const { db, execCalls } = makeFakeDb();
    await expect(
      withAuditSchema(db, async () => {
        throw new Error('D1_ERROR: no such table: chat_log: SQLITE_ERROR');
      }),
    ).rejects.toThrow(/no such table: chat_log/);
    expect(execCalls).toEqual([]);
  });
});

describe('withChatSchema', () => {
  it('retries after creating the chat_log schema on a missing-table error', async () => {
    const { db, execCalls } = makeFakeDb();
    let attempts = 0;
    const result = await withChatSchema(db, async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error('D1_ERROR: no such table: chat_log: SQLITE_ERROR');
      }
      return 7;
    });
    expect(result).toBe(7);
    expect(attempts).toBe(2);
    expect(execCalls[0]).toContain('CREATE TABLE IF NOT EXISTS chat_log');
    // Pin the column-def literal (a blank-out mutation drops these).
    expect(execCalls[0]).toContain('room TEXT NOT NULL');
    expect(execCalls[0]).toContain('seq INTEGER NOT NULL');
    expect(execCalls[0]).toContain('body TEXT NOT NULL');
    expect(execCalls[0]).toContain('PRIMARY KEY (room, seq)');
    expect(execCalls[1]).toContain('CREATE INDEX IF NOT EXISTS chat_log_room');
    expect(execCalls[1]).toContain('ON chat_log(room)');
  });

  it('does not retry when the error is about a different table', async () => {
    // Pins the `'chat_log'` table-name literal — a blank-out would make
    // isMissingTableError match any "no such table" error.
    const { db, execCalls } = makeFakeDb();
    await expect(
      withChatSchema(db, async () => {
        throw new Error('D1_ERROR: no such table: audit_log: SQLITE_ERROR');
      }),
    ).rejects.toThrow(/no such table: audit_log/);
    expect(execCalls).toEqual([]);
  });
});

describe('withRoomsSchema — cross-table distinction', () => {
  it('does not retry when the error is about a different table', async () => {
    // Pin the `'rooms'` table-name literal on line 46.
    const { db, execCalls } = Object.assign(
      { db: { exec: vi.fn() }, execCalls: [] as string[] },
      makeFakeDb(),
    );
    await expect(
      withRoomsSchema(db, async () => {
        throw new Error('D1_ERROR: no such table: cron_triggers: SQLITE_ERROR');
      }),
    ).rejects.toThrow(/no such table: cron_triggers/);
    expect(execCalls).toEqual([]);
  });
});
