/**
 * Replay extracted rooms into a pluggable {@link MigrationTarget}.
 *
 * The real production target writes to Cloudflare (D1 + KV + DO storage
 * via the DO's internal HTTP API or direct wrangler shell-outs); unit
 * tests use the in-memory target. The interface is deliberately narrow
 * — only the operations a migration needs, each mapped 1:1 to a legacy
 * Redis key pattern.
 */

import type { Room } from './extract-rooms.ts';

/**
 * Sink for migrated room data.
 *
 * Mapping (per CLAUDE.md §10.2):
 *   putSnapshot   → DO storage `snapshot` (via PUT /_do/snapshot or direct)
 *   putLog        → DO storage `log:<padSeq(seq)>`
 *   putAudit      → DO storage `audit:<padSeq(seq)>`
 *   putChat       → DO storage `chat:<padSeq(seq)>`
 *   putEcell      → DO storage `ecell:<user>`
 *   setRoomIndex  → D1 `rooms(room, updated_at)` + KV `rooms:exists:<room>`
 *
 * All methods return a Promise so real implementations can batch/network.
 * Synchronous in-memory tests can still return a resolved Promise.
 */
export interface MigrationTarget {
  putSnapshot(room: string, snapshot: string): Promise<void>;
  putLog(room: string, seq: number, cmd: string): Promise<void>;
  putAudit(room: string, seq: number, cmd: string): Promise<void>;
  putChat(room: string, seq: number, msg: string): Promise<void>;
  putEcell(room: string, user: string, cell: string): Promise<void>;
  setRoomIndex(room: string, updatedAt: number): Promise<void>;
}

/**
 * Summary returned from {@link applyRooms}. Callers log it or check
 * counts in tests.
 */
export interface ApplyStats {
  rooms: number;
  snapshots: number;
  logEntries: number;
  auditEntries: number;
  chatEntries: number;
  ecellEntries: number;
  indexed: number;
}

/**
 * Write every room into the target. Iteration order is stable (rooms as
 * given; per-room writes go snapshot → log → audit → chat → ecell →
 * index). Errors propagate — the caller decides whether to roll back.
 */
export async function applyRooms(
  rooms: readonly Room[],
  target: MigrationTarget,
): Promise<ApplyStats> {
  const stats: ApplyStats = {
    rooms: 0,
    snapshots: 0,
    logEntries: 0,
    auditEntries: 0,
    chatEntries: 0,
    ecellEntries: 0,
    indexed: 0,
  };
  for (const room of rooms) {
    stats.rooms += 1;
    if (room.snapshot !== '') {
      await target.putSnapshot(room.name, room.snapshot);
      stats.snapshots += 1;
    }
    for (let i = 0; i < room.log.length; i++) {
      await target.putLog(room.name, i + 1, room.log[i] as string);
      stats.logEntries += 1;
    }
    for (let i = 0; i < room.audit.length; i++) {
      await target.putAudit(room.name, i + 1, room.audit[i] as string);
      stats.auditEntries += 1;
    }
    for (let i = 0; i < room.chat.length; i++) {
      await target.putChat(room.name, i + 1, room.chat[i] as string);
      stats.chatEntries += 1;
    }
    for (const [user, cell] of Object.entries(room.ecell)) {
      await target.putEcell(room.name, user, cell);
      stats.ecellEntries += 1;
    }
    // Index every room, even ones without snapshots — the new stack
    // treats "room known to KV/D1" as a distinct signal from "has data".
    const ts = room.updatedAt ?? 0;
    await target.setRoomIndex(room.name, ts);
    stats.indexed += 1;
  }
  return stats;
}
