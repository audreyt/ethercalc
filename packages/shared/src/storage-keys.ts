/**
 * Durable Object storage key schema.
 *
 * Each `RoomDO` holds one spreadsheet room plus its append-only logs. All
 * keys live under the DO's own storage — key collisions across rooms are
 * impossible because each DO has its own isolated storage (the legacy
 * `snapshot-<room>` / `log-<room>` Redis namespacing is replaced by the DO
 * namespacing itself, see CLAUDE.md §3.3 and §10.2).
 *
 * List-like data (log / audit / chat) is stored as individual keys with a
 * zero-padded sequence number suffix so `storage.list({ prefix })` returns
 * entries in insertion order.
 */

export const STORAGE_KEYS = {
  /** String — SocialCalc save format. */
  snapshot: 'snapshot',
  /** Number — ms since epoch. Updated on every snapshot write. */
  metaUpdatedAt: 'meta:updated_at',
  /** Prefix for command log entries (folded into snapshot periodically). */
  logPrefix: 'log:',
  /** Prefix for audit log entries (never truncated). */
  auditPrefix: 'audit:',
  /** Prefix for chat messages. */
  chatPrefix: 'chat:',
  /** Prefix for per-user ecell tracking. Key: `ecell:<user>` → cell coord. */
  ecellPrefix: 'ecell:',
} as const;

/** Width chosen so every reasonable sequence sorts lexicographically. */
export const SEQ_PAD_WIDTH = 16;

export function padSeq(n: number): string {
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError(`padSeq requires a non-negative integer, got ${n}`);
  }
  return n.toString().padStart(SEQ_PAD_WIDTH, '0');
}

export function logKey(n: number): string {
  return STORAGE_KEYS.logPrefix + padSeq(n);
}

export function auditKey(n: number): string {
  return STORAGE_KEYS.auditPrefix + padSeq(n);
}

export function chatKey(n: number): string {
  return STORAGE_KEYS.chatPrefix + padSeq(n);
}

export function ecellKey(user: string): string {
  if (!user) throw new RangeError('ecellKey requires a non-empty user');
  return STORAGE_KEYS.ecellPrefix + user;
}
