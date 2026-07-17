import { describe, expect, it } from 'vite-plus/test';

import {
  appendAuditRows,
  appendChatRows,
  deleteAuditRows,
  deleteChatRows,
  type SeqRow,
} from '../src/lib/seq-store.ts';

/**
 * Pure-logic tests for `src/lib/seq-store.ts` (the durable D1 audit_log /
 * chat_log mirror). 100% istanbul gate. The schema-ensure retry path lives
 * in `d1-schema.ts` and is covered by `d1-schema.node.test.ts`; here the
 * fake `run()` always succeeds so the happy path runs once.
 */
interface Run {
  sql: string;
  params: unknown[];
}
function makeFakeDb(): { db: D1Database; runs: Run[] } {
  const runs: Run[] = [];
  const db = {
    prepare(sql: string) {
      const params: unknown[] = [];
      const stmt = {
        bind(...p: unknown[]) {
          params.push(...p);
          return stmt;
        },
        async run() {
          runs.push({ sql, params: [...params] });
          return { success: true };
        },
      };
      return stmt as unknown as D1PreparedStatement;
    },
  } as unknown as D1Database;
  return { db, runs };
}

const row = (seq: number): SeqRow => ({ seq, ts: 1700 + seq, body: `b${seq}` });

describe('appendAuditRows', () => {
  it('inserts into audit_log with ON CONFLICT DO NOTHING and (room, seq, ts, body) params', async () => {
    const { db, runs } = makeFakeDb();
    await appendAuditRows(db, 'r', [row(5)]);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.sql).toContain('INSERT INTO audit_log (room, seq, ts, body)');
    // Pin the per-row placeholder tuple so a mutation that blanks the
    // `() => '(?, ?, ?, ?)'` mapper (→ '' or undefined) is caught.
    expect(runs[0]!.sql).toContain('VALUES (?, ?, ?, ?)');
    expect(runs[0]!.sql).toContain('ON CONFLICT(room, seq) DO NOTHING');
    expect(runs[0]!.params).toEqual(['r', 5, 1705, 'b5']);
  });

  it('emits no INSERT for an empty row list (loop runs zero times)', async () => {
    const { db, runs } = makeFakeDb();
    await appendAuditRows(db, 'r', []);
    expect(runs).toHaveLength(0);
  });

  it('keeps exactly ROWS_PER_INSERT rows in a single statement (boundary)', async () => {
    // Exactly 25 rows must be ONE statement. Pins the loop bound: a `i <=
    // rows.length` mutation would run an extra iteration and emit a second
    // (empty) INSERT.
    const { db, runs } = makeFakeDb();
    await appendAuditRows(db, 'r', Array.from({ length: 25 }, (_, i) => row(i)));
    expect(runs).toHaveLength(1);
    expect(runs[0]!.params).toHaveLength(25 * 4);
    // Per-row tuples joined by ', ' — pins the `.join(', ')` separator.
    expect(runs[0]!.sql).toContain('(?, ?, ?, ?), (?, ?, ?, ?)');
  });

  it('batches more than 25 rows into multiple inserts (D1 100-param cap)', async () => {
    const { db, runs } = makeFakeDb();
    const rows = Array.from({ length: 26 }, (_, i) => row(i));
    await appendAuditRows(db, 'r', rows);
    // 26 rows → 25 + 1 across two prepared statements.
    expect(runs).toHaveLength(2);
    expect(runs[0]!.params).toHaveLength(25 * 4);
    expect(runs[1]!.params).toEqual(['r', 25, 1725, 'b25']);
  });
});

describe('appendChatRows', () => {
  it('inserts into chat_log', async () => {
    const { db, runs } = makeFakeDb();
    await appendChatRows(db, 'r', [row(0)]);
    expect(runs[0]!.sql).toContain('INSERT INTO chat_log (room, seq, ts, body)');
    expect(runs[0]!.params).toEqual(['r', 0, 1700, 'b0']);
  });
});

describe('deleteAuditRows / deleteChatRows', () => {
  it('deletes a room from audit_log', async () => {
    const { db, runs } = makeFakeDb();
    await deleteAuditRows(db, 'gone');
    expect(runs[0]!.sql).toContain('DELETE FROM audit_log WHERE room = ?1');
    expect(runs[0]!.params).toEqual(['gone']);
  });

  it('deletes a room from chat_log', async () => {
    const { db, runs } = makeFakeDb();
    await deleteChatRows(db, 'gone');
    expect(runs[0]!.sql).toContain('DELETE FROM chat_log WHERE room = ?1');
    expect(runs[0]!.params).toEqual(['gone']);
  });
});
