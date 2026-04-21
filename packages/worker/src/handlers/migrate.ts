/**
 * Phase 11b — migration seed payload validation.
 *
 * Pure (`Node`-gated) helpers used by both the DO's `POST /_do/seed`
 * handler and the worker-level `PUT /_migrate/seed/:room` route. Keeping
 * validation here means the 100% coverage gate covers every rejection
 * branch without requiring workerd.
 *
 * The seed payload shape mirrors one legacy Redis room's worth of data
 * (per CLAUDE.md §6.3):
 *   - `snapshot`       string       — SocialCalc save. `''` means "don't
 *                                     store a snapshot" (log-only rooms).
 *   - `log`/`audit`/`chat`  string[]  — ordered entries under their
 *                                       corresponding DO prefix.
 *   - `ecell`          Record       — per-user last cursor.
 *   - `updatedAt`      number       — epoch ms for the D1 `rooms.updated_at`
 *                                     mirror; defaults to injected `now()`.
 *
 * Inputs we don't recognize (unknown top-level keys, nested non-strings)
 * are rejected with a specific error message — migration runs should
 * fail loudly on corrupt dumps rather than silently skip data.
 */

/** Normalized payload. Missing fields are filled with sensible defaults. */
export interface SeedPayload {
  /** `''` means no snapshot recorded; the DO should skip the snapshot write. */
  readonly snapshot: string;
  readonly log: readonly string[];
  readonly audit: readonly string[];
  readonly chat: readonly string[];
  readonly ecell: Readonly<Record<string, string>>;
  /** Epoch ms to record as `meta:updated_at` and the D1 `rooms.updated_at`. */
  readonly updatedAt: number;
}

export type SeedParseResult =
  | { readonly ok: true; readonly value: SeedPayload }
  | { readonly ok: false; readonly error: string };

/**
 * Parse a seed request body (already `JSON.parse`d). `now` is injected so
 * tests can pin the default `updatedAt`.
 */
export function parseSeedPayload(raw: unknown, now: () => number): SeedParseResult {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'body must be a JSON object' };
  }
  const rec = raw as Record<string, unknown>;

  const rawSnap = rec['snapshot'];
  const snapshot = rawSnap === undefined ? '' : rawSnap;
  if (typeof snapshot !== 'string') {
    return { ok: false, error: 'snapshot must be a string' };
  }

  const log = parseStringArray(rec['log'], 'log');
  if (!log.ok) return log;
  const audit = parseStringArray(rec['audit'], 'audit');
  if (!audit.ok) return audit;
  const chat = parseStringArray(rec['chat'], 'chat');
  if (!chat.ok) return chat;

  const ecell = parseStringRecord(rec['ecell']);
  if (!ecell.ok) return ecell;

  const rawTs = rec['updatedAt'];
  let updatedAt: number;
  if (rawTs === undefined) {
    updatedAt = now();
  } else if (typeof rawTs === 'number' && Number.isFinite(rawTs)) {
    updatedAt = rawTs;
  } else {
    return { ok: false, error: 'updatedAt must be a finite number' };
  }

  return {
    ok: true,
    value: {
      snapshot,
      log: log.value,
      audit: audit.value,
      chat: chat.value,
      ecell: ecell.value,
      updatedAt,
    },
  };
}

type ArrayResult =
  | { readonly ok: true; readonly value: readonly string[] }
  | { readonly ok: false; readonly error: string };

function parseStringArray(raw: unknown, field: string): ArrayResult {
  if (raw === undefined) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, error: `${field} must be a string[]` };
  for (const entry of raw) {
    if (typeof entry !== 'string') {
      return { ok: false, error: `${field} must be a string[]` };
    }
  }
  return { ok: true, value: raw as readonly string[] };
}

type RecordResult =
  | { readonly ok: true; readonly value: Readonly<Record<string, string>> }
  | { readonly ok: false; readonly error: string };

function parseStringRecord(raw: unknown): RecordResult {
  if (raw === undefined) return { ok: true, value: {} };
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'ecell must be Record<string, string>' };
  }
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.length === 0) {
      return { ok: false, error: 'ecell keys must be non-empty' };
    }
    if (typeof value !== 'string') {
      return { ok: false, error: 'ecell must be Record<string, string>' };
    }
    out[key] = value;
  }
  return { ok: true, value: out };
}
