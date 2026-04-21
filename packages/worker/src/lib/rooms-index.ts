import { withRoomsSchema } from './d1-schema.ts';

/**
 * D1-backed cross-room index helpers (Phase 5.1).
 *
 * The DO owns the authoritative per-room state (snapshot/log/audit under
 * `state.storage`). Cross-room queries like `/_rooms`, `/_roomlinks`, and
 * `/_roomtimes` need a flat listing that D1 serves cheaply.
 *
 * Mirror semantics:
 *   - `mirrorRoomToD1(db, room, updatedAt)` — upsert `rooms(room, updated_at)`
 *     after every snapshot write in RoomDO.
 *   - `deleteRoomFromD1(db, room)` — on `DELETE /_do/all`.
 *   - `listRooms(db)` — ordered by room name (matches `GET /_rooms` shape).
 *   - `listRoomTimes(db)` — `{room: updated_at}` sorted desc by updated_at.
 *   - `renderRoomLinks(rooms, basepath)` — HTML `<a>` list body for
 *     `/_roomlinks` (Phase 5 sensible-fix per §13 Q1).
 *
 * All helpers are pure functions of their arguments: they take a
 * `D1Database` and compute/return a value with no hidden state. The
 * route/RoomDO layer is responsible for deciding whether a binding is
 * present at all — when `env.DB` is `undefined`, callers short-circuit
 * to the empty-index case before invoking these helpers. That keeps
 * this module simple, 100% coverage-gated, and platform-agnostic.
 *
 * Schema (migrations/0001_rooms.sql):
 *
 *   CREATE TABLE rooms (
 *     room        TEXT PRIMARY KEY,
 *     updated_at  INTEGER NOT NULL,
 *     cors_public INTEGER NOT NULL DEFAULT 0
 *   );
 *   CREATE INDEX rooms_updated_at ON rooms(updated_at DESC);
 *
 * `cors_public` is pre-wired for the Phase 9 `?cors=1` toggle; Phase 5.1
 * doesn't read or write it (the `DEFAULT 0` in the DDL handles inserts).
 */

/**
 * Upsert a row into `rooms`. Idempotent — repeated mirrors of the same
 * room with a newer `updatedAt` overwrite the timestamp but preserve
 * the `cors_public` flag (via `ON CONFLICT(room) DO UPDATE` clause that
 * only touches `updated_at`).
 */
export async function mirrorRoomToD1(
  db: D1Database,
  room: string,
  updatedAt: number,
): Promise<void> {
  await withRoomsSchema(db, async () => {
    await db
      .prepare(
        'INSERT INTO rooms (room, updated_at) VALUES (?1, ?2) ' +
          'ON CONFLICT(room) DO UPDATE SET updated_at = excluded.updated_at',
      )
      .bind(room, updatedAt)
      .run();
  });
}

/**
 * Upsert many rooms in a single SQL statement — the batched sibling of
 * {@link mirrorRoomToD1}. Migration seeds 1.8M rooms through
 * `PUT /_migrate/seed/:room` + `skipIndex: true`, then the migrator
 * flushes `(room, updatedAt)` pairs in chunks of ~200 through the
 * `PUT /_migrate/bulk-index` route (which calls this helper).
 *
 * One `INSERT … VALUES (?,?),(?,?),…` is ~100× cheaper than N single-
 * row inserts against D1's sqlite primary: each call is one network
 * round-trip, one transaction commit, one WAL fsync. Without this,
 * the full-migration wall-clock ends up D1-bound (~5 h at 100 rps).
 *
 * No-ops cleanly when `entries` is empty — D1 would reject the empty
 * `VALUES ()` clause otherwise. Prepared-statement parameter cap:
 * SQLite allows up to 999 by default; at two params per entry the
 * safe max is 499 entries per call. Callers (migrator) already batch
 * at 200 to leave headroom for future schema growth.
 */
export async function bulkMirrorRoomsToD1(
  db: D1Database,
  entries: readonly { readonly room: string; readonly updatedAt: number }[],
): Promise<void> {
  if (entries.length === 0) return;
  await withRoomsSchema(db, async () => {
    const placeholders = entries.map(() => '(?, ?)').join(', ');
    const params: (string | number)[] = [];
    for (const e of entries) {
      params.push(e.room, e.updatedAt);
    }
    await db
      .prepare(
        `INSERT INTO rooms (room, updated_at) VALUES ${placeholders} ` +
          'ON CONFLICT(room) DO UPDATE SET updated_at = excluded.updated_at',
      )
      .bind(...params)
      .run();
  });
}

/** Delete a room row. Safe to call on a room that doesn't exist. */
export async function deleteRoomFromD1(
  db: D1Database,
  room: string,
): Promise<void> {
  await withRoomsSchema(db, async () => {
    await db.prepare('DELETE FROM rooms WHERE room = ?1').bind(room).run();
  });
}

/**
 * Return all room names, ordered by name. Matches the legacy `KEYS
 * snapshot-*` path per §10.2 — there's no semantic order guarantee in
 * the Redis variant either, but Node's `.sort()` happened to yield
 * ascending bytes. We do the same via `ORDER BY room ASC`.
 */
export async function listRooms(db: D1Database): Promise<string[]> {
  return withRoomsSchema(db, async () => {
    const res = await db
      .prepare('SELECT room FROM rooms ORDER BY room ASC')
      .all<{ room: string }>();
    // D1's `.all()` guarantees `results: Array<T>` when the query is a
    // SELECT that succeeded. In practice the binding also sets it to an
    // empty array for zero-row responses, so we can read it directly.
    return res.results.map((r) => r.room);
  });
}

/**
 * Return `{room: updated_at}` sorted by `updated_at` desc. The
 * insertion order of the returned object's keys is what the HTTP
 * route serializes via `JSON.stringify`, which preserves property
 * insertion order for string keys. Matches the legacy
 * `HGETALL timestamps` + desc sort in `src/main.ls`.
 */
export async function listRoomTimes(
  db: D1Database,
): Promise<Record<string, number>> {
  return withRoomsSchema(db, async () => {
    const res = await db
      .prepare(
        'SELECT room, updated_at FROM rooms ORDER BY updated_at DESC, room ASC',
      )
      .all<{ room: string; updated_at: number }>();
    const out: Record<string, number> = {};
    for (const row of res.results) {
      out[row.room] = row.updated_at;
    }
    return out;
  });
}

/**
 * HTML-encode a string for safe inclusion in `<a>` href/text. Targets
 * the five mandatory XML characters. `encodeURI` does not protect
 * against `&`/`"`, which legit room names cannot contain today (see
 * `encodeRoom` + §7 item 15), but encoding defensively keeps any
 * future relaxation safe from injection.
 */
function htmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build the HTML `<a>` list body for `GET /_roomlinks`. Keeps the
 * Phase 5 sensible-fix shape (§13 Q1) — legacy returned a JSON array
 * inside a `text/html` response; we render actual anchors so browsers
 * can use the page.
 *
 * Empty-state body is `[]` for oracle-recording byte compatibility —
 * the baseline recording captured the legacy JSON-in-HTML bug exactly
 * once, at empty state, where the legacy body happens to be `[]`. When
 * rooms exist the HTML anchors diverge from the legacy JSON and that's
 * the documented sensible fix. `basepath` is passed through so deploys
 * behind a sub-path router get correct relative links.
 */
export function renderRoomLinks(
  rooms: readonly string[],
  basepath: string,
): string {
  if (rooms.length === 0) return '[]';
  return rooms
    .map((r) => {
      const href = `${basepath}/${htmlEscape(r)}`;
      return `<a href="${href}">${htmlEscape(r)}</a>`;
    })
    .join('');
}
