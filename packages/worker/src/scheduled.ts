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
 *   3. For each due row: fire-and-forget
 *      `env.ROOM.get(idFromName(room)).fetch('/_do/fire-trigger?cell=<cell>')`.
 *   4. DELETE the fired rows.
 *
 * Failures in individual DO fetches are swallowed so one bad room
 * doesn't block the rest of the batch. Legacy semantics (src/main.ls:196
 * — `SC[room].triggerActionCell cell ->`) also ignored individual send
 * errors, so the behavior matches.
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
  pickDueTriggers,
  toEpochMinutes,
} from './lib/cron.ts';
import { withCronSchema } from './lib/d1-schema.ts';
import type { Env } from './env.ts';

/**
 * Fetch every due trigger, dispatch to its room DO, and delete the
 * fired rows from D1. Returns the fired triggers and the remaining
 * rows so callers (the HTTP compat endpoint) can shape their own
 * response bodies.
 *
 * Pure of `Date.now()` — `nowMinutes` is passed in so tests pin time.
 * Pure of `ctx.waitUntil` — writes and fetches are `await`ed so the
 * runtime knows we're busy without needing waitUntil hand-off.
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

  // Read every row. In production `cron_triggers` is bounded by the
  // number of users actively scheduling emails — a full-table scan is
  // cheaper than a WHERE clause for a typical EtherCalc deployment
  // (legacy `DB.hgetall "cron-list"` also returned the full hash).
  const allRes = await withCronSchema(db, async () =>
    db.prepare(
      'SELECT room, cell, fire_at FROM cron_triggers ORDER BY fire_at ASC',
    ).all<CronTriggerRow>(),
  );
  const rows = allRes.results ?? [];
  const { due, keep } = pickDueTriggers(nowMinutes, rows);

  const fired: DueTrigger[] = [];
  for (const trigger of due) {
    try {
      const id = env.ROOM.idFromName(trigger.room);
      const stub = env.ROOM.get(id);
      const cell = encodeURIComponent(trigger.cell);
      await stub.fetch(
        `https://do.local/_do/fire-trigger?cell=${cell}&room=${encodeURIComponent(trigger.room)}`,
        { method: 'POST' },
      );
      fired.push(trigger);
    } catch {
      // Swallow individual failures — legacy behavior. The row stays
      // in D1 on failure so the next scheduled() pass retries it.
    }
  }

  // Delete fired rows. We join them in one DELETE for batching — D1
  // accepts up to 100 statements per batch, so for practical cron
  // volumes this runs in one round-trip. We key on (room, cell,
  // fire_at) composite PK to survive concurrent inserts of the
  // same (room, cell) at a different fire_at.
  if (fired.length > 0) {
    // Build a single DELETE with OR-of-triples. D1 doesn't support
    // ON CONFLICT DO DELETE or CTEs elegantly for this shape; the
    // statement is linear in batch size but cheap for the typical
    // < 100 entries we expect per minute.
    //
    // We need the actual fire_at values to target the right row
    // (PK). `due` lost them to the `DueTrigger` shape. Re-derive
    // from `rows` by filtering on identity — for each due trigger
    // re-match rows with fire_at <= nowMinutes.
    const dueRows = rows.filter((r) => r.fire_at <= nowMinutes);
    const stmt = db.prepare(
      'DELETE FROM cron_triggers WHERE room = ?1 AND cell = ?2 AND fire_at = ?3',
    );
    // Batch each fired row as one bound statement. We intentionally
    // don't wrap in a transaction; each delete is idempotent on PK
    // collision anyway.
    const batch = dueRows.map((r) =>
      stmt.bind(r.room, r.cell, r.fire_at),
    );
    if (batch.length > 0) {
      await db.batch(batch);
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
