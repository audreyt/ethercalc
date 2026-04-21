/**
 * Replay extracted rooms into a pluggable {@link MigrationTarget}.
 *
 * The real production target writes through the live worker's
 * `PUT /_migrate/seed/:room` (see `./targets/http.ts`); unit tests use
 * the in-memory target. The interface is deliberately narrow — only the
 * operations a migration needs, each mapped 1:1 to a legacy Redis key
 * pattern.
 */

/** One legacy EtherCalc room, assembled from RESP replies. */
export interface Room {
  readonly name: string;
  /** SocialCalc save string. `''` means no snapshot recorded. */
  readonly snapshot: string;
  readonly log: readonly string[];
  readonly audit: readonly string[];
  readonly chat: readonly string[];
  readonly ecell: Readonly<Record<string, string>>;
  /** Epoch ms from the shared `timestamps` hash. Optional. */
  readonly updatedAt?: number;
}

/**
 * Sink for migrated room data.
 *
 * Mapping (per CLAUDE.md §10.2):
 *   putSnapshot   → DO storage `snapshot`
 *   putLog        → DO storage `log:<padSeq(seq)>`
 *   putAudit      → DO storage `audit:<padSeq(seq)>`
 *   putChat       → DO storage `chat:<padSeq(seq)>`
 *   putEcell      → DO storage `ecell:<user>`
 *   setRoomIndex  → D1 `rooms(room, updated_at)` + KV `rooms:exists:<room>`
 *
 * Optional `flush` drains any batched state the target has accumulated
 * but not yet sent. Implementations that write inline (dry-run,
 * in-memory) leave it unset; the HTTP target uses it to push remaining
 * `(room, updatedAt)` pairs into `PUT /_migrate/bulk-index` at
 * end-of-run, so the batch-size quantization doesn't leave the tail
 * untrimmed.
 */
export interface MigrationTarget {
  putSnapshot(room: string, snapshot: string): Promise<void>;
  putLog(room: string, seq: number, cmd: string): Promise<void>;
  putAudit(room: string, seq: number, cmd: string): Promise<void>;
  putChat(room: string, seq: number, msg: string): Promise<void>;
  putEcell(room: string, user: string, cell: string): Promise<void>;
  setRoomIndex(room: string, updatedAt: number): Promise<void>;
  flush?(): Promise<void>;
}

/** Summary returned from {@link applyRoomStream}. */
export interface ApplyStats {
  rooms: number;
  snapshots: number;
  logEntries: number;
  auditEntries: number;
  chatEntries: number;
  ecellEntries: number;
  indexed: number;
}

/** Hook called as rooms finish seeding — useful for CLI progress output. */
export type SendProgressHook = (info: {
  readonly seeded: number;
  readonly inFlight: number;
}) => void;

export interface ApplyRoomStreamOptions {
  /**
   * Max concurrent per-room seed operations. A value of 1 preserves
   * sequential semantics; higher values overlap sends with the RESP
   * source and fan out across the host's cores via libuv. Defaults to
   * 1 — callers whose target is safe to parallelize (like `HttpTarget`,
   * whose buffers are per-room and mutually independent) should pass
   * 8-16.
   */
  readonly concurrency?: number;
  readonly onProgress?: SendProgressHook;
}

/**
 * Consume an async iterable of rooms and feed them into the target,
 * one at a time (or up to `concurrency` at a time). Returns stats once
 * the source is exhausted and every in-flight write has resolved.
 */
export async function applyRoomStream(
  rooms: AsyncIterable<Room>,
  target: MigrationTarget,
  options: ApplyRoomStreamOptions = {},
): Promise<ApplyStats> {
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 1));
  const stats: ApplyStats = {
    rooms: 0,
    snapshots: 0,
    logEntries: 0,
    auditEntries: 0,
    chatEntries: 0,
    ecellEntries: 0,
    indexed: 0,
  };
  const inFlight = new Set<Promise<void>>();
  let firstError: unknown = null;
  const onProgress = options.onProgress;
  for await (const room of rooms) {
    const work = seedOneRoom(target, room, stats)
      .catch((err) => {
        if (firstError === null) firstError = err;
      })
      .then(() => {
        if (onProgress !== undefined) {
          onProgress({ seeded: stats.rooms, inFlight: inFlight.size });
        }
      });
    inFlight.add(work);
    void work.finally(() => {
      inFlight.delete(work);
    });
    if (inFlight.size >= concurrency) {
      await Promise.race(inFlight);
    }
  }
  await Promise.all(inFlight);
  if (firstError !== null) throw firstError;
  // Give targets a chance to drain batched state (HTTP target flushes
  // its pending bulk-index queue here). Inline targets leave `flush`
  // unset; the optional call keeps the interface ergonomic.
  if (target.flush !== undefined) await target.flush();
  return stats;
}

async function seedOneRoom(
  target: MigrationTarget,
  room: Room,
  stats: ApplyStats,
): Promise<void> {
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
  await target.setRoomIndex(room.name, room.updatedAt ?? 0);
  stats.rooms += 1;
  stats.indexed += 1;
}
