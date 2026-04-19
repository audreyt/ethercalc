import { describe, it, expect, vi } from 'vitest';

import {
  deleteRoomFromD1,
  listRooms,
  listRoomTimes,
  mirrorRoomToD1,
  renderRoomLinks,
} from '../src/lib/rooms-index.ts';

/**
 * Pure-helper tests for `src/lib/rooms-index.ts` (Phase 5.1). Covers every
 * branch of every export. Istanbul 100% gate applies via
 * `vitest.node.config.ts`.
 *
 * We fake `D1Database` with a tiny in-memory SQLite-like store. The
 * helpers only use `db.prepare(sql).bind(...).run()` / `.all<T>()`, so
 * the stub just needs to reproduce those two shapes. We don't run the
 * SQL — instead we assert the SQL + bound parameters are what we
 * expect, and return synthetic result rows for reads.
 */

interface Call {
  sql: string;
  params: unknown[];
  op: 'run' | 'all';
}

function makeFakeDb(
  readResults: Record<string, Array<Record<string, unknown>>> = {},
): { db: D1Database; calls: Call[] } {
  const calls: Call[] = [];
  const makeStatement = (sql: string, params: unknown[] = []): D1PreparedStatement => {
    return {
      bind(...more: unknown[]) {
        return makeStatement(sql, [...params, ...more]);
      },
      async run() {
        calls.push({ sql, params, op: 'run' });
        return { success: true, meta: {} } as unknown as D1Response;
      },
      async all<T>(): Promise<D1Result<T>> {
        calls.push({ sql, params, op: 'all' });
        const rows = (readResults[sql] ?? []) as T[];
        return { results: rows, success: true, meta: {} } as unknown as D1Result<T>;
      },
    } as unknown as D1PreparedStatement;
  };
  const db = {
    prepare: vi.fn((sql: string) => makeStatement(sql)),
  } as unknown as D1Database;
  return { db, calls };
}

describe('mirrorRoomToD1', () => {
  it('UPSERTs the room + updated_at', async () => {
    const { db, calls } = makeFakeDb();
    await mirrorRoomToD1(db, 'my-room', 12345);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.op).toBe('run');
    expect(calls[0]!.sql).toContain('INSERT INTO rooms');
    expect(calls[0]!.sql).toContain('ON CONFLICT(room) DO UPDATE');
    expect(calls[0]!.params).toEqual(['my-room', 12345]);
  });

  it('passes the updatedAt through unchanged (numeric)', async () => {
    const { db, calls } = makeFakeDb();
    const t = Date.now();
    await mirrorRoomToD1(db, 'r', t);
    expect(calls[0]!.params[1]).toBe(t);
  });
});

describe('deleteRoomFromD1', () => {
  it('runs a DELETE with the room bound', async () => {
    const { db, calls } = makeFakeDb();
    await deleteRoomFromD1(db, 'gone');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.op).toBe('run');
    expect(calls[0]!.sql).toContain('DELETE FROM rooms WHERE room = ?1');
    expect(calls[0]!.params).toEqual(['gone']);
  });
});

describe('listRooms', () => {
  it('returns the room column sorted ascending', async () => {
    const { db, calls } = makeFakeDb({
      'SELECT room FROM rooms ORDER BY room ASC': [
        { room: 'alpha' },
        { room: 'beta' },
        { room: 'gamma' },
      ],
    });
    const out = await listRooms(db);
    expect(out).toEqual(['alpha', 'beta', 'gamma']);
    expect(calls[0]!.op).toBe('all');
    expect(calls[0]!.sql).toContain('ORDER BY room ASC');
  });

  it('returns [] when the table is empty', async () => {
    const { db } = makeFakeDb({});
    const out = await listRooms(db);
    expect(out).toEqual([]);
  });
});

describe('listRoomTimes', () => {
  it('returns a hash with insertion order matching the query order', async () => {
    const { db } = makeFakeDb({
      'SELECT room, updated_at FROM rooms ORDER BY updated_at DESC, room ASC': [
        { room: 'newer', updated_at: 300 },
        { room: 'middle', updated_at: 200 },
        { room: 'oldest', updated_at: 100 },
      ],
    });
    const out = await listRoomTimes(db);
    expect(out).toEqual({ newer: 300, middle: 200, oldest: 100 });
    // Object property insertion order is preserved (§10.2 relies on it for
    // the `/_roomtimes` JSON body).
    expect(Object.keys(out)).toEqual(['newer', 'middle', 'oldest']);
  });

  it('returns {} when the table is empty', async () => {
    const { db } = makeFakeDb({});
    const out = await listRoomTimes(db);
    expect(out).toEqual({});
  });
});

describe('renderRoomLinks', () => {
  it('returns the empty-state "[]" when the list is empty', () => {
    expect(renderRoomLinks([], '')).toBe('[]');
    // basepath has no effect on the empty case.
    expect(renderRoomLinks([], '/base')).toBe('[]');
  });

  it('renders a single room as one <a>', () => {
    expect(renderRoomLinks(['foo'], '')).toBe('<a href="/foo">foo</a>');
  });

  it('renders multiple rooms as concatenated <a> tags', () => {
    expect(renderRoomLinks(['a', 'b'], '')).toBe(
      '<a href="/a">a</a><a href="/b">b</a>',
    );
  });

  it('prepends the basepath into hrefs', () => {
    expect(renderRoomLinks(['foo'], '/app')).toBe(
      '<a href="/app/foo">foo</a>',
    );
  });

  it('HTML-escapes &, <, >, ", \' in both href and text', () => {
    const out = renderRoomLinks(['a&b<c>d"e\'f'], '');
    // `<` / `>` / `&` must be escaped, single + double quotes too.
    expect(out).toBe(
      '<a href="/a&amp;b&lt;c&gt;d&quot;e&#39;f">a&amp;b&lt;c&gt;d&quot;e&#39;f</a>',
    );
  });
});
