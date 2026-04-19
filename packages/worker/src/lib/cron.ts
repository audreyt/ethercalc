/**
 * Pure helpers for the Phase 9 cron layer.
 *
 * Two jobs:
 *   1. Parse the SocialCalc `settimetrigger <cell> <t1>,<t2>,...` command
 *      that arrives via the `execute` WS path. Legacy src/sc.ls:136-138
 *      split the payload into `{cell, times: string}` and routed it to a
 *      `setcrontrigger` postMessage. We parse it here so the storage
 *      layer can insert one row per time into D1 `cron_triggers`.
 *
 *   2. Partition a batch of stored triggers into "due" (fire now +
 *      delete) and "keep" (future). Callers feed the result into
 *      `scheduled()` which dispatches each due trigger to the target
 *      DO's `/_do/fire-trigger` endpoint.
 *
 * Both helpers are pure — no I/O, no environment access, no Date.
 * Callers supply `nowMinutes` explicitly so tests pin time. 100% Node
 * coverage (istanbul).
 *
 * Legacy comparison: the original `cron-list` hash stored ONE entry per
 * `<room>!<cell>` key whose value was a comma-separated list of
 * minute-timestamps. The D1 shape here stores ONE ROW per (room, cell,
 * fire_at), which makes the scheduled scan a plain `WHERE fire_at <=
 * now` with an index — no per-row parsing needed.
 */

/**
 * Parsed `settimetrigger` payload. `times` is an array of epoch-minute
 * integers. Non-numeric entries are dropped silently (legacy did a
 * JavaScript string comparison `triggerTimeMins <= timeNowMins` which
 * coerced junk leniently — we normalize to integers for D1).
 */
export interface SettimetriggerParsed {
  readonly cell: string;
  readonly times: readonly number[];
}

/**
 * Parse a raw SocialCalc command of the form
 *   settimetrigger <cell> <t1>,<t2>,…
 *
 * Returns `null` when the command doesn't match (wrong verb, missing
 * cell, missing times, all-non-numeric time list). A zero-length
 * `times[]` is treated as a "clear" request and returned as an empty
 * array so the caller can wipe existing rows for (room, cell).
 *
 * Legacy accepts any whitespace-separated token as the cell and any
 * comma-joined string as the times; we mirror that loosely. Leading
 * and trailing whitespace around time entries is trimmed.
 */
export function parseSettimetrigger(
  cmdstr: string,
): SettimetriggerParsed | null {
  if (typeof cmdstr !== 'string') return null;
  const trimmed = cmdstr.trim();
  if (trimmed.length === 0) return null;
  // Split on runs of whitespace; the first three tokens are
  // <verb> <cell> <times>. Everything after is ignored (legacy's
  // `command.split(' ')` took indexes 0/1/2 directly).
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3) return null;
  if (parts[0] !== 'settimetrigger') return null;
  // `parts[1]` is guaranteed non-empty because we `trim()`d before
  // splitting on `\s+` — no empty tokens are produced in any position.
  const cell = parts[1]!;
  const rawTimes = parts.slice(2).join(' ');
  const times: number[] = [];
  for (const raw of rawTimes.split(',')) {
    const trimmedRaw = raw.trim();
    if (trimmedRaw.length === 0) continue;
    const n = Number(trimmedRaw);
    if (!Number.isFinite(n)) continue;
    // Always integer minutes — the legacy value is epoch minutes
    // (Math.floor(ms/60000)). We normalize fractional input down so
    // the D1 PRIMARY KEY stays stable.
    times.push(Math.floor(n));
  }
  return { cell, times };
}

/** One row of the D1 `cron_triggers` table. */
export interface CronTriggerRow {
  readonly room: string;
  readonly cell: string;
  readonly fire_at: number;
}

/** A trigger that's ready to fire now. */
export interface DueTrigger {
  readonly room: string;
  readonly cell: string;
}

/**
 * Partition the rows into:
 *   - `due`  — fire_at <= nowMinutes. Returned as `{room, cell}` (the
 *              fire_at is discarded; deletion is by (room, cell,
 *              fire_at) composite key so the caller re-passes the
 *              original row separately when deleting).
 *   - `keep` — fire_at > nowMinutes, returned unchanged for the
 *              `nextTriggerTime` recomputation and for JSON emission
 *              from the backwards-compat `/_timetrigger` endpoint.
 *
 * Matches the legacy `triggerTimeMins <= timeNowMins` branch in
 * src/main.ls:191 — due entries fire and get removed; the rest stay.
 */
export function pickDueTriggers(
  nowMinutes: number,
  rows: readonly CronTriggerRow[],
): { readonly due: readonly DueTrigger[]; readonly keep: readonly CronTriggerRow[] } {
  const due: DueTrigger[] = [];
  const keep: CronTriggerRow[] = [];
  for (const row of rows) {
    if (row.fire_at <= nowMinutes) {
      due.push({ room: row.room, cell: row.cell });
    } else {
      keep.push(row);
    }
  }
  return { due, keep };
}

/**
 * Shape the `/_timetrigger` legacy response body. Rebuilds the
 * `<room>!<cell>` → comma-separated fire_at hash that the original
 * Redis-backed endpoint emitted. Only "keep" entries go into the
 * response — matches the legacy behavior which persisted the
 * pruned state and returned that hash (src/main.ls:185+216).
 */
export function buildTimetriggerBody(
  keep: readonly CronTriggerRow[],
): Record<string, string> {
  const grouped = new Map<string, number[]>();
  for (const row of keep) {
    const key = `${row.room}!${row.cell}`;
    const list = grouped.get(key);
    if (list) {
      list.push(row.fire_at);
    } else {
      grouped.set(key, [row.fire_at]);
    }
  }
  const out: Record<string, string> = {};
  for (const [key, list] of grouped) {
    // Stable ordering inside each comma list so the response is
    // deterministic across test runs.
    list.sort((a, b) => a - b);
    out[key] = list.join(',');
  }
  return out;
}

/**
 * Convert `Date.now()` (or any ms-epoch value) to epoch minutes.
 * Hoisted into a helper so every caller agrees on the rounding (floor,
 * not round) — the legacy code did `Math.floor(time/60000)`.
 */
export function toEpochMinutes(ms: number): number {
  return Math.floor(ms / (1000 * 60));
}
