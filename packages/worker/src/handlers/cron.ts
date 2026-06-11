/**
 * Phase 9 — cron trigger + email handlers.
 *
 * Two wire-level concerns:
 *
 * 1. `upsertCronTriggers(db, row)` — called from the `post-command`
 *    glue when `parseSettimetrigger(cmdstr)` returns non-null. The
 *    legacy flow (src/sc.ls:220-244) replaced the entire comma-list
 *    for a (room, cell) pair each time. We mirror that: delete
 *    existing rows for (room, cell), then insert one row per time.
 *    When `times` is empty the net effect is a delete (clear).
 *
 * 2. `buildEmailSender(env)` — factory that returns a
 *    `BindingEmailSender` when `env.EMAIL` is bound, otherwise a
 *    `DisabledEmailSender` (no binding configured → report the honest
 *    "not configured" state instead of a false "E-mail Sent"). Callers
 *    never branch on the binding directly; the factory keeps the
 *    business logic environment-agnostic.
 *
 * Pure of `Date.now()` — every helper takes values as arguments.
 * Pure of network — only the D1 binding and the injected sender are
 * touched.
 */
import {
  BindingEmailSender,
  DisabledEmailSender,
  type EmailSender,
} from '../lib/email.ts';
import { withCronSchema } from '../lib/d1-schema.ts';
import type { Env } from '../env.ts';

/**
 * Replace the stored trigger set for (room, cell) with `times`. The
 * legacy behavior treats a `settimetrigger` command as "set" semantics
 * — previously stored times for that cell are dropped and the new
 * list takes their place. Empty `times` clears the cell entirely.
 *
 * Implementation: two statements, batched so a partial failure doesn't
 * leave the table half-updated. The DELETE + INSERT ordering matches
 * what the legacy HSET → HDEL flow produced at steady state.
 */
export async function upsertCronTriggers(
  db: D1Database,
  room: string,
  cell: string,
  times: readonly number[],
): Promise<void> {
  await withCronSchema(db, async () => {
    const del = db
      .prepare('DELETE FROM cron_triggers WHERE room = ?1 AND cell = ?2')
      .bind(room, cell);
    // Deduplicate times to keep the PK stable under repeat values from
    // the client. `Set` preserves insertion order; we only care about
    // uniqueness here because the index ordering is applied at scan
    // time by `scheduled()`.
    const uniqueTimes = Array.from(new Set(times));
    if (uniqueTimes.length === 0) {
      await del.run();
      return;
    }
    const insertStmt = db.prepare(
      'INSERT OR IGNORE INTO cron_triggers (room, cell, fire_at) VALUES (?1, ?2, ?3)',
    );
    const batch: D1PreparedStatement[] = [del];
    for (const t of uniqueTimes) {
      batch.push(insertStmt.bind(room, cell, t));
    }
    await db.batch(batch);
  });
}

/**
 * Factory: return a live sender when `env.EMAIL` is bound, else a
 * `DisabledEmailSender` that reports email is not configured (rather
 * than the legacy false "E-mail Sent"). The caller's async contract is
 * identical regardless — both impls return `{ message: string }` and
 * neither rejects.
 */
export function buildEmailSender(env: Env): EmailSender {
  if (!env.EMAIL) return new DisabledEmailSender();
  const from = env.EMAIL_FROM ?? 'noreply@ethercalc.invalid';
  return new BindingEmailSender(env.EMAIL, from);
}
