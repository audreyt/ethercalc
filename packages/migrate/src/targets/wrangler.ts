/**
 * Real migration target. Writes to a Cloudflare account (or local
 * Miniflare persistence) via the `wrangler` CLI.
 *
 * Phase 5 will land the DO HTTP API (`PUT /_do/snapshot` etc). Until
 * that ships, this target shells out to `wrangler d1 execute` and
 * `wrangler kv key put` — both commands are stable and documented. DO
 * storage is reachable from Miniflare but not from remote CF via any
 * wrangler verb, so rooms that need DO storage today get their per-key
 * writes parked in a local SQLite side-table (passed to the worker at
 * first boot via a separately-invoked seeding job). The `--dry-run`
 * flag in the CLI surfaces every command that would run.
 *
 * ALL shell-outs go through the injected `exec` dep so tests can stub
 * them. No `child_process` import in test builds.
 */

import type { MigrationTarget } from '../apply.ts';
import {
  STORAGE_KEYS,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
} from '@ethercalc/shared/storage-keys';

/**
 * Shell-out contract. Mirrors `child_process.spawnSync` semantics but
 * keeps the surface small so tests can substitute easily.
 */
export type Exec = (
  cmd: string,
  args: readonly string[],
  opts?: { input?: string },
) => { status: number; stdout: string; stderr: string };

export interface WranglerTargetConfig {
  /** D1 database binding name, e.g. `ethercalc-rooms`. */
  d1Name: string;
  /** KV namespace binding name, e.g. `ROOMS_INDEX`. */
  kvName: string;
  /** Binary used for shell-outs. Default: `bunx wrangler`. */
  bunPath?: string;
  /**
   * Extra args applied to every wrangler invocation (e.g. `--env staging`
   * or `--local`). Default: `['--local']` so tests do not hit the network.
   */
  wranglerArgs?: readonly string[];
  /** Shell-out backend. Required in tests; defaults in production. */
  exec: Exec;
  /**
   * Optional clock. Used for `meta:updated_at` companion to snapshot
   * writes. Defaults to `Date.now`.
   */
  now?: () => number;
}

/**
 * `MigrationTarget` that shells out to `wrangler`. Construct via
 * {@link WranglerTargetConfig}; inject `exec` in tests.
 */
export class WranglerTarget implements MigrationTarget {
  public readonly d1Name: string;
  public readonly kvName: string;
  public readonly bunPath: string;
  public readonly wranglerArgs: readonly string[];
  private readonly exec: Exec;
  private readonly now: () => number;

  constructor(config: WranglerTargetConfig) {
    this.d1Name = config.d1Name;
    this.kvName = config.kvName;
    this.bunPath = config.bunPath ?? 'bunx';
    this.wranglerArgs = config.wranglerArgs ?? ['--local'];
    this.exec = config.exec;
    this.now = config.now ?? Date.now;
  }

  putSnapshot(room: string, snapshot: string): Promise<void> {
    this.putDo(room, STORAGE_KEYS.snapshot, snapshot);
    this.putDo(room, STORAGE_KEYS.metaUpdatedAt, String(this.now()));
    return Promise.resolve();
  }

  putLog(room: string, seq: number, cmd: string): Promise<void> {
    this.putDo(room, logKey(seq), cmd);
    return Promise.resolve();
  }

  putAudit(room: string, seq: number, cmd: string): Promise<void> {
    this.putDo(room, auditKey(seq), cmd);
    return Promise.resolve();
  }

  putChat(room: string, seq: number, msg: string): Promise<void> {
    this.putDo(room, chatKey(seq), msg);
    return Promise.resolve();
  }

  putEcell(room: string, user: string, cell: string): Promise<void> {
    this.putDo(room, ecellKey(user), cell);
    return Promise.resolve();
  }

  setRoomIndex(room: string, updatedAt: number): Promise<void> {
    // D1: INSERT OR REPLACE so re-running the migration is idempotent.
    // Parameter binding via --command's escaped quotes — wrangler d1
    // execute accepts single-quoted SQL literals exactly like sqlite3.
    const sql =
      `INSERT OR REPLACE INTO rooms(room, updated_at, cors_public) ` +
      `VALUES(${sqlString(room)}, ${Math.trunc(updatedAt)}, 0);`;
    this.run([
      'wrangler',
      'd1',
      'execute',
      this.d1Name,
      ...this.wranglerArgs,
      '--command',
      sql,
    ]);
    // KV: rooms:exists:<room> → "1"
    this.run([
      'wrangler',
      'kv',
      'key',
      'put',
      `rooms:exists:${room}`,
      '1',
      '--binding',
      this.kvName,
      ...this.wranglerArgs,
    ]);
    return Promise.resolve();
  }

  private putDo(room: string, key: string, value: string): void {
    // Until the DO /_do/snapshot endpoint lands (Phase 5), we parallel-
    // write DO keys into a D1 staging table that the worker hydrates on
    // first access. That keeps this migration usable today and a simple
    // rename of the SQL once Phase 5 is done.
    const sql =
      `INSERT OR REPLACE INTO do_storage_seed(room, key, value) ` +
      `VALUES(${sqlString(room)}, ${sqlString(key)}, ${sqlString(value)});`;
    this.run([
      'wrangler',
      'd1',
      'execute',
      this.d1Name,
      ...this.wranglerArgs,
      '--command',
      sql,
    ]);
  }

  private run(cmdline: readonly string[]): void {
    const [first, ...rest] = cmdline;
    // `first` is always a non-empty string by construction of the call sites.
    const result = this.exec(this.bunPath, [first as string, ...rest]);
    if (result.status !== 0) {
      throw new Error(
        `wrangler invocation failed (exit ${result.status}): ` +
          `${this.bunPath} ${cmdline.join(' ')}\n${result.stderr}`,
      );
    }
  }
}

/** SQL-escape a string literal by doubling embedded single quotes. */
function sqlString(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}
