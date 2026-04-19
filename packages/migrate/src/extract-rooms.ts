/**
 * Shape the raw {@link RedisDump} into per-room records.
 *
 * Input Redis keys (per CLAUDE.md §6.3):
 *   snapshot-<room>   string  → Room.snapshot
 *   log-<room>        list    → Room.log
 *   audit-<room>      list    → Room.audit
 *   chat-<room>       list    → Room.chat
 *   ecell-<room>      hash    → Room.ecell
 *   timestamps        hash    → Room.updatedAt  (from field `timestamp-<room>`
 *                                                or bare `<room>` — legacy
 *                                                wrote both forms; §6.3)
 *
 * Rooms are identified by the *snapshot* key only. A room with only logs
 * but no snapshot is still emitted (snapshot === '') — the legacy server
 * did the same when a room was created via POST `/_/…` but not yet saved.
 * This is how freshly-created, never-edited rooms show up in dumps.
 */

import type { RedisDump } from './parse-rdb.ts';

export interface Room {
  name: string;
  snapshot: string;
  log: string[];
  audit: string[];
  chat: string[];
  ecell: Record<string, string>;
  updatedAt?: number;
}

/**
 * Partition the dump into per-room `Room[]`. Pure — deterministic output
 * order (rooms sorted alphabetically) so snapshots diff cleanly in tests.
 */
export function extractRooms(dump: RedisDump): Room[] {
  const names = new Set<string>();
  collectNames(dump.strings.keys(), 'snapshot-', names);
  collectNames(dump.lists.keys(), 'log-', names);
  collectNames(dump.lists.keys(), 'audit-', names);
  collectNames(dump.lists.keys(), 'chat-', names);
  collectNames(dump.hashes.keys(), 'ecell-', names);

  const timestamps = dump.hashes.get('timestamps') ?? new Map<string, string>();

  const rooms: Room[] = [];
  for (const name of [...names].sort()) {
    rooms.push({
      name,
      snapshot: dump.strings.get(`snapshot-${name}`) ?? '',
      log: dump.lists.get(`log-${name}`) ?? [],
      audit: dump.lists.get(`audit-${name}`) ?? [],
      chat: dump.lists.get(`chat-${name}`) ?? [],
      ecell: Object.fromEntries(dump.hashes.get(`ecell-${name}`) ?? new Map()),
      ...readTimestamp(timestamps, name),
    });
  }
  return rooms;
}

function collectNames(keys: IterableIterator<string>, prefix: string, out: Set<string>): void {
  for (const k of keys) {
    if (k.startsWith(prefix)) out.add(k.slice(prefix.length));
  }
}

/**
 * The legacy `timestamps` hash stores per-room `updated_at` values, but
 * with two inconsistent field shapes across historical server versions:
 *   - `timestamp-<room>`  — current format
 *   - `<room>`            — pre-2015 format
 * We accept either. If a value isn't a finite integer, we drop it (the
 * oracle did the same — `Number('')` → NaN, which broke the /_roomtimes
 * sort; we preserve the skip rather than propagate bad data).
 */
function readTimestamp(
  timestamps: Map<string, string>,
  room: string,
): { updatedAt?: number } {
  const raw = timestamps.get(`timestamp-${room}`) ?? timestamps.get(room);
  if (raw === undefined) return {};
  const n = Number(raw);
  if (!Number.isFinite(n)) return {};
  return { updatedAt: n };
}
