/**
 * Chunked snapshot storage for RoomDO.
 *
 * Cloudflare Durable Object storage rejects any single `put()` value
 * over 128 KiB. Most EtherCalc rooms have snapshots well under that
 * ceiling, but the legacy dump contains ~17 k rooms whose SocialCalc
 * save is 150 KiB–2 MB — large enough that the naive
 * `storage.put("snapshot", <str>)` path would fail with the opaque
 * `500 Internal Server Error` we hit during the 2026-04-21 production
 * migration (see CLAUDE.md §14).
 *
 * Two layouts on disk:
 *
 *   - Legacy / small: one key `snapshot` → save string.
 *   - Chunked / large: one key `snapshot:meta` → `{chunks: N}` plus
 *     N keys `snapshot:chunk:<padSeq(i)>` → split UTF-8 pieces.
 *
 * Readers call {@link readSnapshot}, which tries the fast single-key
 * path first and falls back to reassembly. Writers call
 * {@link snapshotEntries} to get a plain-object shard of keys to merge
 * into whatever batched `storage.put(entries)` they're building.
 *
 * Chunk size is 100 KiB — leaves 28 KiB of headroom under 128 KiB for
 * JSON framing / encoding overhead when the same batch also carries
 * other large values (the margin is conservative; D1's limit-walking
 * behavior is documented sparsely).
 */

import {
  STORAGE_KEYS,
  snapshotChunkKey,
} from '@ethercalc/shared/storage-keys';

/** Max bytes per chunk — well under the 128 KiB DO-storage ceiling. */
export const SNAPSHOT_CHUNK_BYTES = 100 * 1024;

/** Shape of the `snapshot:meta` value when chunking is in use. */
export interface SnapshotMeta {
  /** Number of `snapshot:chunk:<i>` entries, 1-based count. */
  readonly chunks: number;
}

/**
 * Check whether the room has any snapshot at all, under either
 * layout, without paying to reassemble the chunked form. Used by
 * `/_exists/:room` where the answer is just a boolean.
 */
export async function hasSnapshot(
  storage: DurableObjectStorage,
): Promise<boolean> {
  const keys = [STORAGE_KEYS.snapshot, STORAGE_KEYS.snapshotMeta];
  const got = await storage.get<unknown>(keys);
  return (
    typeof got.get(STORAGE_KEYS.snapshot) === 'string' ||
    got.get(STORAGE_KEYS.snapshotMeta) !== undefined
  );
}

/**
 * Read the room's snapshot, reassembling from chunks when present.
 * Returns `null` when no snapshot exists under either layout — the
 * caller distinguishes "empty room" from "never seeded".
 */
export async function readSnapshot(
  storage: DurableObjectStorage,
): Promise<string | null> {
  // Fast path: single-key snapshot (small room or legacy DO).
  const single = await storage.get<string>(STORAGE_KEYS.snapshot);
  if (typeof single === 'string') return single;
  // Chunked path: meta tells us how many pieces to fetch.
  const meta = await storage.get<SnapshotMeta>(STORAGE_KEYS.snapshotMeta);
  if (meta === undefined || meta === null) return null;
  const keys: string[] = [];
  for (let i = 0; i < meta.chunks; i++) keys.push(snapshotChunkKey(i));
  const got = await storage.get<string>(keys);
  const parts: string[] = [];
  for (let i = 0; i < meta.chunks; i++) {
    const k = snapshotChunkKey(i);
    const part = got.get(k);
    // A missing chunk would silently corrupt the save — fail loud.
    if (typeof part !== 'string') {
      throw new Error(`snapshot chunk ${i} missing under key ${k}`);
    }
    parts.push(part);
  }
  return parts.join('');
}

/**
 * Produce the snapshot-related entries for a batched `storage.put()`.
 * Does NOT write anything — the caller merges the returned keys into
 * its own entries object so the whole seed lands atomically in one
 * `put(entries)` call.
 *
 * For snapshots ≤ {@link SNAPSHOT_CHUNK_BYTES}, returns `{snapshot: …}`.
 * For larger, returns `{snapshot:meta: {chunks}, snapshot:chunk:<i>: …}`.
 *
 * Empty-snapshot contract: the caller decides whether to call this at
 * all. Passing `""` produces an entries map with the single-key form
 * (storing an empty string), which mirrors the behavior of the
 * pre-chunking code path.
 */
export function snapshotEntries(snapshot: string): Record<string, unknown> {
  const bytes = utf8Bytes(snapshot);
  if (bytes <= SNAPSHOT_CHUNK_BYTES) {
    return { [STORAGE_KEYS.snapshot]: snapshot };
  }
  const chunks = chunkString(snapshot, SNAPSHOT_CHUNK_BYTES);
  const out: Record<string, unknown> = {
    [STORAGE_KEYS.snapshotMeta]: { chunks: chunks.length } satisfies SnapshotMeta,
  };
  for (let i = 0; i < chunks.length; i++) {
    out[snapshotChunkKey(i)] = chunks[i];
  }
  return out;
}

/**
 * Return the full list of storage keys that belong to a snapshot
 * under EITHER layout, so callers that don't do a full `deleteAll()`
 * can selectively remove the old shape before writing a new one.
 * Accepts the prior meta object (from `readMeta`) so the chunk count
 * is known without another round-trip.
 */
export async function readSnapshotMeta(
  storage: DurableObjectStorage,
): Promise<SnapshotMeta | null> {
  const meta = await storage.get<SnapshotMeta>(STORAGE_KEYS.snapshotMeta);
  return meta ?? null;
}

/**
 * Split a string into UTF-8 byte-bounded chunks without splitting
 * multi-byte code points. `String.prototype.slice` can leave a high
 * surrogate at the end of one chunk and its pair at the start of the
 * next — that's the behavior we want for JS strings (which are UTF-16)
 * because concat reassembles byte-for-byte. But to bound each chunk
 * by UTF-8 byte length we have to walk character-by-character and
 * accumulate until we'd cross the limit, then cut before the
 * would-overflow character.
 */
function chunkString(s: string, maxBytes: number): string[] {
  const out: string[] = [];
  // Iterate code-points (not code-units) so surrogate pairs stay
  // together. `for (const ch of s)` does the right thing.
  let current = '';
  let currentBytes = 0;
  for (const ch of s) {
    const chBytes = utf8Bytes(ch);
    if (currentBytes + chBytes > maxBytes && current.length > 0) {
      out.push(current);
      current = '';
      currentBytes = 0;
    }
    current += ch;
    currentBytes += chBytes;
  }
  // The loop always has at least one character in `current` when it
  // exits (the last iteration appends before checking the next
  // threshold), so the tail push is unconditional in practice. The
  // guard is kept as a sanity check; istanbul treats the false branch
  // as dead code.
  /* istanbul ignore else */
  if (current.length > 0) out.push(current);
  // Degenerate case: empty input should still produce one empty chunk
  // so `{chunks: 1}` + `snapshot:chunk:0 = ""` reads back correctly.
  // In practice callers skip chunking for empty snapshots via the
  // fast path above, so this only fires if someone passes `""` with
  // a maxBytes of 0.
  /* istanbul ignore next */
  if (out.length === 0) out.push('');
  return out;
}

/**
 * UTF-8 byte length of a string. Uses `TextEncoder` (available in
 * workerd, Bun, and Node ≥ 16) rather than `Buffer.byteLength` so the
 * same code path runs inside the DO, where `Buffer` is only available
 * via the `nodejs_compat` flag.
 */
function utf8Bytes(s: string): number {
  return new TextEncoder().encode(s).byteLength;
}
