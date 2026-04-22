/**
 * `bun run src/cli.ts --source redis://… --target http://… --token …`
 *
 * Reads rooms out of a live RESP-speaking server (real `redis-server`
 * or Zedis that has loaded the legacy `dump.rdb`) and writes them into
 * the new worker via `PUT /_migrate/seed/:room`. Memory stays O(1)-per-
 * room regardless of dump size — the Redis server owns the decoding;
 * the migrator just shape-shifts into Worker PUTs.
 *
 * Logic is split for testability:
 *   - `parseArgs`  — pure argv → config transform (lives in cli-args.ts).
 *   - `runMigrate` — pure (modulo injected deps).
 *   - `main`       — thin real-process wrapper.
 *
 * `parseArgs` is imported via the module namespace (not a named import)
 * so tests can `vi.spyOn` it to cover the non-CliArgError branch in
 * {@link main}. Direct-named imports are baked in at bundle time and
 * wouldn't be rebindable.
 */
import { applyRoomStream, type MigrationTarget, type ApplyStats, type Room } from './apply.ts';
import {
  roomsFromRedis,
  type RespLike,
  type RoomsFromRedisOptions,
} from './sources/redis-source.ts';
import {
  roomsFromFilesystem,
  type FsLike,
  type RoomsFromFilesystemOptions,
} from './sources/filesystem-source.ts';
import type { ParsedSource } from './cli-args.ts';
import {
  HttpTarget,
  waitForHealth,
  type FetchLike,
  type WaitForHealthDeps,
} from './targets/http.ts';
import * as args from './cli-args.ts';

export { CliArgError, parseArgs, parseSource } from './cli-args.ts';
export type { CliArgs, ParsedSource } from './cli-args.ts';
import { CliArgError, parseSource, type CliArgs } from './cli-args.ts';

export const USAGE: string = [
  'ethercalc-migrate — import a legacy EtherCalc dump into Cloudflare',
  '',
  'USAGE',
  '  # Point at a real redis-server / Zedis that has already loaded dump.rdb,',
  '  # and at a running worker (start `./bin/ethercalc` in another terminal).',
  '  bun run src/cli.ts --source redis://127.0.0.1:6379 \\',
  '                    --target http://127.0.0.1:8000 --token <bearer>',
  '',
  '  # Migrate a legacy filesystem dump (no Redis). This is the path',
  '  # used by Sandstorm grains, where EtherCalc\'s Redis-unavailable',
  '  # fallback wrote snapshots + audit logs to /var/dump or dump.json.',
  '  bun run src/cli.ts --source file:///var \\',
  '                    --target http://127.0.0.1:8000 --token <bearer>',
  '',
  '  # Dry-run — enumerate rooms and print intended writes, no worker needed.',
  '  bun run src/cli.ts --source redis://127.0.0.1:6379 --dry-run',
  '',
  'OPTIONS',
  '  --source <url>             Legacy data source. One of:',
  '                               redis://host:port   RESP server w/ dump.rdb loaded.',
  '                               file:///path        On-disk dump/ dir or dump.json',
  '                                                   (auto-detected).',
  '  --target <url>             Base URL of a running worker (Miniflare or CF).',
  '  --token <bearer>           Matches env.ETHERCALC_MIGRATE_TOKEN on the worker.',
  '  --health-timeout-ms <n>    Max wait for /_health before seeding (default 30000).',
  '  --concurrency <n>          Parallel in-flight seed PUTs (default 8).',
  '  --skip-bulk-index          Skip PUT /_migrate/bulk-index; only write DO',
  '                             storage. Use when D1 was populated out-of-band',
  '                             via `wrangler d1 execute --remote --file=…`.',
  '  --dry-run                  Print intended writes instead of executing.',
  '  -h, --help                 Show this help and exit.',
].join('\n');

/**
 * DryRun target prints each intended write and counts them. Matches the
 * real HTTP target's public interface.
 */
export class DryRunTarget implements MigrationTarget {
  public readonly log: string[] = [];
  private readonly write: (s: string) => void;
  constructor(write: (s: string) => void) {
    this.write = write;
  }
  private emit(action: string): void {
    this.log.push(action);
    this.write(`${action}\n`);
  }
  putSnapshot(room: string, snapshot: string): Promise<void> {
    this.emit(`DO[${room}] put snapshot (${snapshot.length} bytes)`);
    return Promise.resolve();
  }
  putLog(room: string, seq: number, cmd: string): Promise<void> {
    this.emit(`DO[${room}] put log#${seq} = ${abbrev(cmd)}`);
    return Promise.resolve();
  }
  putAudit(room: string, seq: number, cmd: string): Promise<void> {
    this.emit(`DO[${room}] put audit#${seq} = ${abbrev(cmd)}`);
    return Promise.resolve();
  }
  putChat(room: string, seq: number, msg: string): Promise<void> {
    this.emit(`DO[${room}] put chat#${seq} = ${abbrev(msg)}`);
    return Promise.resolve();
  }
  putEcell(room: string, user: string, cell: string): Promise<void> {
    this.emit(`DO[${room}] put ecell:${user} = ${cell}`);
    return Promise.resolve();
  }
  setRoomIndex(room: string, updatedAt: number): Promise<void> {
    this.emit(`D1 rooms INSERT ${room} updated_at=${updatedAt}`);
    this.emit(`KV rooms:exists:${room} = 1`);
    return Promise.resolve();
  }
}

function abbrev(s: string): string {
  if (s.length <= 40) return JSON.stringify(s);
  return `${JSON.stringify(s.slice(0, 37))}... (${s.length})`;
}

export interface RunDeps {
  /**
   * Factory for a RESP client. `bin/ethercalc migrate` opens a real
   * TCP connection; tests pass a fake that drives the parser
   * deterministically. The returned client's lifecycle is owned by
   * `runMigrate` — we always call `close()` in a `finally`. Optional
   * because filesystem sources don't need it; raised as an error at
   * runtime if `--source redis://…` is used without it wired up.
   */
  connectRedis?: (url: string) => Promise<RespLike & { close(): Promise<void> }>;
  /**
   * Filesystem capability — `node:fs/promises` satisfies the narrow
   * {@link FsLike} shape. Optional for the same reason as
   * `connectRedis`: only needed when `--source file://…` is used.
   */
  fs?: FsLike;
  /**
   * Injected `fetch` + clock for the HTTP target. When unset, production
   * callers get the real `fetch` / `Date.now` / `setTimeout`. Tests pass
   * stubs to avoid hitting a real socket and to drive the health-poll
   * loop deterministically.
   */
  fetch?: FetchLike;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

const DEFAULT_HEALTH_TIMEOUT_MS = 30_000;

/**
 * Resolve the set of capabilities `waitForHealth` needs, falling back to
 * the real platform primitives (`fetch`, `Date.now`, `setTimeout`) when
 * the caller didn't inject a stub. Exported so tests can verify the
 * fallback bindings without spinning up a real server.
 */
export function resolveHealthDeps(deps: RunDeps): WaitForHealthDeps {
  return {
    fetch: deps.fetch ?? ((input, init) => fetch(input, init)),
    now: deps.now ?? Date.now,
    sleep: deps.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms))),
  };
}

/**
 * Produce a target for the given args + deps. Exported so tests can
 * verify the dry-run/non-dry-run branches individually.
 */
export function buildTarget(args: CliArgs, deps: RunDeps): MigrationTarget {
  if (args.dryRun) return new DryRunTarget(deps.stdout);
  return new HttpTarget({
    baseUrl: args.target,
    token: args.token,
    skipBulkIndex: args.skipBulkIndex,
    ...(deps.fetch !== undefined ? { fetch: deps.fetch } : {}),
  });
}

/** End-to-end: enumerate rooms via the chosen source, seed into target, return stats. */
export async function runMigrate(
  args: CliArgs,
  deps: RunDeps,
): Promise<ApplyStats> {
  // Live-target mode: block until /_health answers before seeding. The
  // dry-run path has nothing to wait on.
  if (!args.dryRun) {
    const timeout = args.healthTimeoutMs ?? DEFAULT_HEALTH_TIMEOUT_MS;
    const ok = await waitForHealth(args.target, timeout, resolveHealthDeps(deps));
    if (!ok) {
      throw new Error(
        `worker at ${args.target} did not respond to /_health within ${timeout}ms`,
      );
    }
  }
  const target = buildTarget(args, deps);
  // Default to 8-way fan-out for HTTP mode; stay sequential in dry-run
  // so output order is deterministic.
  const concurrency = args.concurrency ?? (args.dryRun ? 1 : 8);

  // Progress/oversized hooks shared by both source kinds.
  const sourceHooks = {
    onProgress: ({ done, total }: { readonly done: number; readonly total: number }) => {
      if (done === 1 || done % 100 === 0 || done === total) {
        deps.stderr(
          `  source: room ${done.toLocaleString()}/${total.toLocaleString()}\n`,
        );
      }
    },
    onOversizedEntry: ({
      room,
      kind,
      index,
      bytes,
    }: {
      readonly room: string;
      readonly kind: 'log' | 'audit' | 'chat';
      readonly index: number;
      readonly bytes: number;
    }) => {
      deps.stderr(
        `  skip oversized: ${room} ${kind}[${index}] = ` +
          `${(bytes / 1024).toFixed(1)} KiB (> 120 KiB DO limit)\n`,
      );
    },
  };

  let failedRoomCount = 0;
  const streamOpts = {
    concurrency,
    onProgress: ({ seeded, inFlight }: { readonly seeded: number; readonly inFlight: number }) => {
      if (seeded % 100 === 0) {
        deps.stderr(
          `  seed: ${seeded.toLocaleString()} rooms sent (${inFlight} in flight)\n`,
        );
      }
      // Bun's JSC heap doesn't feel enough pressure during a long
      // steady-state HTTP fan-out: RSS climbs ~50 KB/room and hits
      // OOM at scale (empirically proven on the 2026-04-21 1.8M-
      // room run — segfaulted at 62 GB). `Bun.gc(true)` every 100
      // rooms bounds the peak-between-GCs, which is what malloc
      // leaks to the OS — ~2 GB steady-state, <1 % throughput hit.
      // Opportunistic: only fires under Bun; Node-compat callers
      // (none today) skip the hint cleanly.
      if (
        seeded > 0 &&
        seeded % 100 === 0 &&
        typeof (globalThis as { Bun?: { gc?: (force: boolean) => void } }).Bun?.gc === 'function'
      ) {
        (globalThis as unknown as { Bun: { gc: (force: boolean) => void } }).Bun.gc(true);
      }
    },
    onRoomError: ({ room, error }: { readonly room: string; readonly error: unknown }) => {
      failedRoomCount += 1;
      // Non-Error rejection is defensive — HttpTarget always
      // throws `new Error(...)` — but caller-injected fakes in
      // downstream consumers could reject with a string; surface
      // it as-is rather than printing `[object Object]`.
      /* istanbul ignore next */
      const msg = error instanceof Error ? error.message : String(error);
      deps.stderr(`  ROOM ERROR: ${room} — ${msg}\n`);
    },
  };

  const parsedSource = parseSource(args.source);
  const rooms = await openSource(parsedSource, deps, sourceHooks);
  let stats: ApplyStats;
  try {
    stats = await applyRoomStream(rooms.iterable, target, streamOpts);
  } finally {
    await rooms.close();
  }
  if (failedRoomCount > 0) {
    deps.stderr(
      `  NOTE: ${failedRoomCount.toLocaleString()} room(s) failed all retries ` +
        `and were skipped; see the ROOM ERROR lines above.\n`,
    );
  }
  deps.stdout(
    `migrated ${stats.rooms} rooms ` +
      `(${stats.snapshots} snapshots, ${stats.logEntries} log, ` +
      `${stats.auditEntries} audit, ${stats.chatEntries} chat, ` +
      `${stats.ecellEntries} ecell)\n`,
  );
  return stats;
}

/**
 * Shared hook surface accepted by every source's options type — both
 * {@link RoomsFromRedisOptions} and {@link RoomsFromFilesystemOptions}
 * structurally contain these three hooks.
 */
interface SharedSourceHooks {
  onProgress: NonNullable<RoomsFromRedisOptions['onProgress']>;
  onOversizedEntry: NonNullable<RoomsFromRedisOptions['onOversizedEntry']>;
}

interface OpenedSource {
  readonly iterable: AsyncIterable<Room>;
  close(): Promise<void>;
}

/**
 * Open the right source iterator for the parsed `--source`. The redis
 * path owns a live TCP connection and must be `close()`'d; the
 * filesystem path is stateless and returns a no-op closer. The lifetime
 * is joined back together in `runMigrate` via `try/finally`.
 */
async function openSource(
  parsed: ParsedSource,
  deps: RunDeps,
  hooks: SharedSourceHooks,
): Promise<OpenedSource> {
  if (parsed.kind === 'redis') {
    const connect = deps.connectRedis;
    if (connect === undefined) {
      throw new Error(
        `--source ${parsed.url} requires RunDeps.connectRedis to be wired`,
      );
    }
    const client = await connect(parsed.url);
    return {
      iterable: roomsFromRedis(client, hooks),
      close: () => client.close(),
    };
  }
  const fs = deps.fs;
  if (fs === undefined) {
    throw new Error(
      `--source ${parsed.path} requires RunDeps.fs to be wired`,
    );
  }
  return {
    iterable: roomsFromFilesystem(fs, parsed.path, hooks),
    close: () => Promise.resolve(),
  };
}

/**
 * CLI entry. Returns the exit code the caller should propagate.
 *
 * Behavior:
 *   - `--help`:    write USAGE to stdout, return 0.
 *   - parse error: write to stderr, return 2.
 *   - success:     return 0 (and stats printed to stdout).
 *   - runtime err: write message to stderr, return 1.
 */
export async function main(
  argv: readonly string[],
  deps: RunDeps,
): Promise<number> {
  let parsed: CliArgs;
  try {
    parsed = args.parseArgs(argv);
  } catch (err) {
    if (!(err instanceof CliArgError)) throw err;
    deps.stderr(`${err.message}\n`);
    deps.stderr('Run with --help for usage.\n');
    return 2;
  }
  if (parsed.help) {
    deps.stdout(`${USAGE}\n`);
    return 0;
  }
  try {
    await runMigrate(parsed, deps);
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    deps.stderr(`migrate failed: ${msg}\n`);
    return 1;
  }
}
