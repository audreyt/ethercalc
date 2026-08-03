/**
 * Phase 9 — `scheduled()` handler for Cloudflare Cron Triggers.
 *
 * The legacy stack relied on an EXTERNAL cron job pinging
 * `GET /_timetrigger` once a minute. Cloudflare fully obviates the
 * external pinger: `wrangler.toml` registers a 1-minute cron
 * expression and the Worker's `scheduled()` export runs on that
 * cadence.
 *
 * Flow (every invocation):
 *   1. Derive `nowMinutes = toEpochMinutes(Date.now())`.
 *   2. SELECT due rows (`fire_at <= nowMinutes`).
 *   3. For each due row, invoke the room DO's fire-trigger endpoint.
 *   4. Delete only rows whose DO returned a successful response.
 *
 * Transport failures and non-2xx responses leave their individual rows in D1
 * for retry. One bad room never blocks unrelated triggers.
 *
 * Exports:
 *   - `scheduled(event, env, ctx)` — the Cloudflare ScheduledHandler
 *     entrypoint. Registered in `src/index.ts` via
 *     `export default { fetch, scheduled }`.
 *   - `runScheduled({env, nowMinutes})` — pure-ish helper extracted so
 *     tests can drive it with stubbed `env.DB` + `env.ROOM` + a
 *     deterministic `nowMinutes`. Returns the list of fired triggers
 *     for assertions + downstream reuse by the backwards-compat
 *     `/_timetrigger` HTTP endpoint.
 *
 * The HTTP `/_timetrigger` route (Deliverable G) delegates here too,
 * so self-host users whose external cron still pings the legacy URL
 * get the same semantics.
 *
 * Excluded from the Node coverage gate because it imports
 * `@ethercalc/shared` at runtime (Workers-bundled path); the
 * `runScheduled` helper is fully covered via a Node unit test with
 * stubbed bindings — see `test/scheduled.node.test.ts`.
 */
import {
  type CronTriggerRow,
  type DueTrigger,
  isValidCronCell,
  pickDueTriggers,
  toEpochMinutes,
} from './lib/cron.ts';
import { withCronSchema } from './lib/d1-schema.ts';
import type { Env } from './env.ts';
import { encodeRoom, isValidRoomName } from './lib/room-name.ts';

/** Bound D1 reads, DO subrequests, and delete statements per invocation. */
export const MAX_CRON_ROWS_PER_RUN = 64;

/**
 * Atomically claim every due trigger, then dispatch each claimed row once.
 * Deleting before delivery makes concurrent cron invocations and ambiguous
 * network failures at-most-once: an email may be missed on a transport
 * failure, but it cannot be duplicated or poison the bounded queue forever.
 */
export async function runScheduled(params: {
  readonly env: Env;
  readonly nowMinutes: number;
}): Promise<{
  readonly due: readonly DueTrigger[];
  readonly keep: readonly CronTriggerRow[];
  readonly fired: readonly DueTrigger[];
}> {
  const { env, nowMinutes } = params;
  // Without a D1 binding there's nothing to scan. The scheduled()
  // handler still succeeds so Cloudflare doesn't retry.
  const db = env.DB;
  if (!db) return { due: [], keep: [], fired: [] };

  // Bound both the D1 result and the in-memory fallback (test doubles and
  // older bindings may ignore LIMIT binds).
  const allRes = await withCronSchema(db, async () =>
    db
      .prepare(
        'SELECT room, cell, fire_at FROM cron_triggers ' +
          'ORDER BY fire_at ASC LIMIT ?1',
      )
      .bind(MAX_CRON_ROWS_PER_RUN)
      .all<CronTriggerRow>(),
  );
  const rows = (allRes.results ?? []).slice(0, MAX_CRON_ROWS_PER_RUN);
  const { due, keep } = pickDueTriggers(nowMinutes, rows);

  const fired: DueTrigger[] = [];
  const dueRows = rows.filter(
    (row: CronTriggerRow) => row.fire_at <= nowMinutes,
  );
  if (dueRows.length === 0) return { due, keep, fired };

  const claim = db.prepare(
    'DELETE FROM cron_triggers WHERE room = ?1 AND cell = ?2 AND fire_at = ?3',
  );
  const claimResults = await db.batch(
    dueRows.map((row: CronTriggerRow) =>
      claim.bind(row.room, row.cell, row.fire_at),
    ),
  );
  const claimedRows = dueRows.filter(
    (_row, index) => claimResults[index]?.meta.changes === 1,
  );

  for (const row of claimedRows) {
    if (!isValidRoomName(row.room) || !isValidCronCell(row.cell)) continue;
    try {
      const id = env.ROOM.idFromName(encodeRoom(row.room));
      const stub = env.ROOM.get(id);
      const cell = encodeURIComponent(row.cell);
      const response = await stub.fetch(
        `https://do.local/_do/fire-trigger?cell=${cell}&room=${encodeURIComponent(row.room)}`,
        { method: 'POST' },
      );
      if (!response.ok) continue;
      fired.push({ room: row.room, cell: row.cell });
    } catch {
      // The row was already claimed. At-most-once delivery avoids duplicate
      // email when a remote send succeeds but its response is lost.
    }
  }

  return { due, keep, fired };
}

/**
 * `scheduled()` handler registered at `export default { scheduled, fetch }`.
 * `event` currently carries no fields we need (cron expression matching
 * is done by Cloudflare); we rely on `Date.now()` for the time pin.
 */
export async function scheduled(
  _event: ScheduledEvent,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  const nowMinutes = toEpochMinutes(Date.now());
  await runScheduled({ env, nowMinutes });
}
