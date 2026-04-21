/**
 * In-process `MigrationTarget`. Recorded writes are available on the
 * public readonly maps so tests can assert the exact migration product
 * without any wrangler or network plumbing.
 *
 * Key layout mirrors CLAUDE.md §10.2 + `@ethercalc/shared/storage-keys`:
 *   doStorage[<room>][<STORAGE_KEYS.snapshot | logKey | auditKey | chatKey | ecellKey>]
 *   d1Rooms[<room>]                               → { updated_at }
 *   kvRoomsExists[<room>]                         → "1"
 * so an assertion can just compare the populated maps against a fixture.
 */

import {
  STORAGE_KEYS,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
} from '@ethercalc/shared/storage-keys';

import type { MigrationTarget } from '../apply.ts';

export interface InMemoryRoomIndexRow {
  updatedAt: number;
}

export interface InMemoryTargetOptions {
  /** Clock for `meta:updated_at` writes. Defaults to `Date.now`. */
  now?: () => number;
}

/**
 * Implementation of {@link MigrationTarget} that stashes everything in
 * regular JS maps. All methods return resolved Promises so they compose
 * with the async applyRoomStream() pipeline.
 */
export class InMemoryTarget implements MigrationTarget {
  /** `doStorage.get(room)` → (storageKey → value). */
  public readonly doStorage: Map<string, Map<string, string>> = new Map();
  /** D1 `rooms` mirror. */
  public readonly d1Rooms: Map<string, InMemoryRoomIndexRow> = new Map();
  /** KV `rooms:exists:<room>` → "1". */
  public readonly kvRoomsExists: Map<string, string> = new Map();

  private readonly now: () => number;

  constructor(opts: InMemoryTargetOptions = {}) {
    this.now = opts.now ?? Date.now;
  }

  putSnapshot(room: string, snapshot: string): Promise<void> {
    this.bucket(room).set(STORAGE_KEYS.snapshot, snapshot);
    this.bucket(room).set(STORAGE_KEYS.metaUpdatedAt, String(this.now()));
    return Promise.resolve();
  }

  putLog(room: string, seq: number, cmd: string): Promise<void> {
    this.bucket(room).set(logKey(seq), cmd);
    return Promise.resolve();
  }

  putAudit(room: string, seq: number, cmd: string): Promise<void> {
    this.bucket(room).set(auditKey(seq), cmd);
    return Promise.resolve();
  }

  putChat(room: string, seq: number, msg: string): Promise<void> {
    this.bucket(room).set(chatKey(seq), msg);
    return Promise.resolve();
  }

  putEcell(room: string, user: string, cell: string): Promise<void> {
    this.bucket(room).set(ecellKey(user), cell);
    return Promise.resolve();
  }

  setRoomIndex(room: string, updatedAt: number): Promise<void> {
    this.d1Rooms.set(room, { updatedAt });
    this.kvRoomsExists.set(room, '1');
    return Promise.resolve();
  }

  private bucket(room: string): Map<string, string> {
    let b = this.doStorage.get(room);
    if (b === undefined) {
      b = new Map();
      this.doStorage.set(room, b);
    }
    return b;
  }
}
