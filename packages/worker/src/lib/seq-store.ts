import { withAuditSchema, withChatSchema } from './d1-schema.ts';

/**
 * D1-backed durable stores for the per-room `audit_log` and `chat_log`
 * tables (the storage-growth fold, follow-up to Phase 5.1).
 *
 * The DO's `state.storage` keeps a bounded recent tail of `audit:`/`chat:`
 * (ring/alarm-trimmed), but the COMPLETE record lives here in D1 so the
 * trims don't lose data: every command mirrors its audit entry and every
 * chat message mirrors here at append time, and the alarm only drops DO
 * entries that have already been mirrored. Both tables share the shape
 * `(room TEXT, seq INTEGER, ts INTEGER, body TEXT, PRIMARY KEY(room, seq))`.
 *
 * Mirror semantics:
 *   - `appendAuditRows` / `appendChatRows` — idempotent batch insert
 *     (`ON CONFLICT(room, seq) DO NOTHING`), so re-mirroring an entry that
 *     is already durable is a no-op and a seed can safely re-run.
 *   - `deleteAuditRows` / `deleteChatRows` — drop a room's rows on
 *     `DELETE /_do/all` so a deleted room leaves nothing orphaned.
 *
 * Like `rooms-index.ts`, every helper is a pure function of `(db, …)`. The
 * RoomDO layer decides whether a `D1Database` binding exists at all and
 * swallows transient errors (best-effort durability, matching the
 * rooms-index mirror's reliability model). The table name passed to the
 * private core is an internal constant — never user input — so the
 * interpolation into the SQL string is safe.
 */

/** One row to mirror: an append sequence, a timestamp, and the payload. */
export interface SeqRow {
  readonly seq: number;
  readonly ts: number;
  readonly body: string;
}

/** D1's prepared-statement parameter cap is 100; at 4 params per row the
 * safe batch size is 25 (see rooms-index.ts `bulkMirrorRoomsToD1`). */
const ROWS_PER_INSERT = 25;

async function appendRows(
  db: D1Database,
  withSchema: <T>(db: D1Database, op: () => Promise<T>) => Promise<T>,
  table: string,
  room: string,
  rows: readonly SeqRow[],
): Promise<void> {
  await withSchema(db, async () => {
    for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
      const batch = rows.slice(i, i + ROWS_PER_INSERT);
      const placeholders = batch.map(() => '(?, ?, ?, ?)').join(', ');
      const params: (string | number)[] = [];
      for (const r of batch) params.push(room, r.seq, r.ts, r.body);
      await db
        .prepare(
          `INSERT INTO ${table} (room, seq, ts, body) VALUES ${placeholders} ` +
            'ON CONFLICT(room, seq) DO NOTHING',
        )
        .bind(...params)
        .run();
    }
  });
}

async function deleteRows(
  db: D1Database,
  withSchema: <T>(db: D1Database, op: () => Promise<T>) => Promise<T>,
  table: string,
  room: string,
): Promise<void> {
  await withSchema(db, async () => {
    await db.prepare(`DELETE FROM ${table} WHERE room = ?1`).bind(room).run();
  });
}

/** Mirror audit rows into D1 `audit_log` (idempotent). */
export async function appendAuditRows(
  db: D1Database,
  room: string,
  rows: readonly SeqRow[],
): Promise<void> {
  await appendRows(db, withAuditSchema, 'audit_log', room, rows);
}

/** Mirror chat rows into D1 `chat_log` (idempotent). */
export async function appendChatRows(
  db: D1Database,
  room: string,
  rows: readonly SeqRow[],
): Promise<void> {
  await appendRows(db, withChatSchema, 'chat_log', room, rows);
}

/** Drop a room's `audit_log` rows (on room deletion). */
export async function deleteAuditRows(db: D1Database, room: string): Promise<void> {
  await deleteRows(db, withAuditSchema, 'audit_log', room);
}

/** Drop a room's `chat_log` rows (on room deletion). */
export async function deleteChatRows(db: D1Database, room: string): Promise<void> {
  await deleteRows(db, withChatSchema, 'chat_log', room);
}
