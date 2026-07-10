/**
 * Durable Object storage key schema.
 *
 * Each `RoomDO` holds one spreadsheet room plus its append-only logs. All
 * keys live under the DO's own storage — key collisions across rooms are
 * impossible because each DO has its own isolated storage (the legacy
 * `snapshot-<room>` / `log-<room>` Redis namespacing is replaced by the DO
 * namespacing itself, see AGENTS.md §3.3 and §10.2).
 *
 * List-like data (log / audit / chat) is stored as individual keys with a
 * zero-padded sequence number suffix so `storage.list({ prefix })` returns
 * entries in insertion order.
 */

export const STORAGE_KEYS = {
  /**
   * String — SocialCalc save format, for rooms whose snapshot fits
   * under the DO-storage 128 KiB per-value ceiling. Large snapshots
   * use the chunked layout below instead.
   */
  snapshot: 'snapshot',
  /**
   * Object `{ chunks: number }` — present iff the snapshot is split
   * across `snapshot:chunk:<i>` keys. Absent for small snapshots.
   */
  snapshotMeta: 'snapshot:meta',
  /** Prefix for chunked snapshot parts: `snapshot:chunk:<padSeq(i)>`. */
  snapshotChunkPrefix: 'snapshot:chunk:',
  /** Number — ms since epoch. Updated on every snapshot write. */
  metaUpdatedAt: 'meta:updated_at',
  /**
   * String — room access mode. Absent on legacy/public rooms (the
   * default). Set to `'private'` by `POST /_do/init-private`.
   * `'public'` is the implicit default when this key is absent, so
   * existing rooms and oracle replays are unaffected.
   */
  metaAccess: 'meta:access',
  /**
   * Object — room ACL. Present iff `metaAccess` is set. Shape:
   * `{ owner: string, writers: string[], readers: string[] }` where
   * each entry is a uid (from the AuthDO session). The owner is
   * always implicitly a reader and writer; the arrays are explicit
   * for clarity and mutation safety.
   */
  metaAcl: 'meta:acl',
  /**
   * String — optional group identifier for multi-sheet workbook
   * pairing. Present on rooms that belong to a workbook group.
   * Immutable after creation.
   */
  metaGroup: 'meta:group',
  /** Prefix for command log entries (folded into snapshot periodically). */
  logPrefix: 'log:',
  /** Prefix for audit log entries (never truncated). */
  auditPrefix: 'audit:',
  /** Prefix for chat messages. */
  chatPrefix: 'chat:',
  /** Prefix for per-user ecell tracking. Key: `ecell:<user>` → cell coord. */
  ecellPrefix: 'ecell:',
} as const;

/**
 * Room access mode. `'public'` is the default (world-read/write, the
 * legacy behavior). `'private'` gates both read and write on the ACL.
 * The value stored under `STORAGE_KEYS.metaAccess`; absent = public.
 */
export type AccessMode = 'public' | 'private';

/**
 * Room ACL — who can read and write a non-public room. Stored under
 * `STORAGE_KEYS.metaAcl`. The owner is always implicitly a reader and
 * writer; the explicit arrays allow delegated access without
 * special-casing the owner field in every check.
 */
export interface RoomAcl {
  /** The uid that created the room. Has all permissions implicitly. */
  readonly owner: string;
 /** Uids that can write (in addition to the owner). */
  readonly writers: readonly string[];
 /** Uids that can read (in addition to the owner + writers). */
  readonly readers: readonly string[];
}

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

/**
 * Chunked-snapshot chunk key: `snapshot:chunk:<padSeq(i)>`. Zero-padded
 * so `storage.list({prefix: STORAGE_KEYS.snapshotChunkPrefix})` returns
 * chunks in order without a sort step.
 */
export function snapshotChunkKey(i: number): string {
  return STORAGE_KEYS.snapshotChunkPrefix + padSeq(i);
}
