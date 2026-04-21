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
import { applyRoomStream, type MigrationTarget, type ApplyStats } from './apply.ts';
import { roomsFromRedis, type RespLike } from './sources/redis-source.ts';
import {
  HttpTarget,
  waitForHealth,
  type FetchLike,
  type WaitForHealthDeps,
} from './targets/http.ts';
import * as args from './cli-args.ts';

export { CliArgError, parseArgs } from './cli-args.ts';
export type { CliArgs } from './cli-args.ts';
import { CliArgError, type CliArgs } from './cli-args.ts';

export const USAGE: string = [
  'ethercalc-migrate — import a legacy Redis dump into Cloudflare',
  '',
  'USAGE',
  '  # Point at a real redis-server / Zedis that has already loaded dump.rdb,',
  '  # and at a running worker (start `./bin/ethercalc` in another terminal).',
  '  bun run src/cli.ts --source redis://127.0.0.1:6379 \\',
  '                    --target http://127.0.0.1:8000 --token <bearer>',
  '',
  '  # Dry-run — enumerate rooms and print intended writes, no worker needed.',
  '  bun run src/cli.ts --source redis://127.0.0.1:6379 --dry-run',
  '',
  'OPTIONS',
  '  --source <redis://url>     RESP server that has loaded dump.rdb. Required.',
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
   * `runMigrate` — we always call `close()` in a `finally`.
   */
  connectRedis: (url: string) => Promise<RespLike & { close(): Promise<void> }>;
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

/** End-to-end: enumerate rooms via RESP, seed into target, return stats. */
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
  const client = await deps.connectRedis(args.source);
  let stats: ApplyStats;
  try {
    stats = await applyRoomStream(
      roomsFromRedis(client, {
        onProgress: ({ done, total }) => {
          if (done === 1 || done % 100 === 0 || done === total) {
            deps.stderr(
              `  source: room ${done.toLocaleString()}/${total.toLocaleString()}\n`,
            );
          }
        },
      }),
      target,
      {
        concurrency,
        onProgress: ({ seeded, inFlight }) => {
          if (seeded % 100 === 0) {
            deps.stderr(
              `  seed: ${seeded.toLocaleString()} rooms sent (${inFlight} in flight)\n`,
            );
          }
        },
      },
    );
  } finally {
    await client.close();
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
