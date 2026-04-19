/**
 * `bun run src/cli.ts --input dump.rdb --d1-name … --kv-name … [--dry-run]`
 *
 * Glue layer: reads an RDB file from disk, parses it, extracts rooms,
 * and applies them to either a real {@link WranglerTarget} or a
 * dry-run sink that prints every intended write without calling out.
 *
 * Logic is split for testability:
 *   - `parseArgs`  — pure argv → config transform.
 *   - `runMigrate` — pure (modulo injected deps).
 *   - `main`       — thin real-process wrapper at the bottom.
 */
import type { Exec } from './targets/wrangler.ts';
import { parseRdb } from './parse-rdb.ts';
import { extractRooms } from './extract-rooms.ts';
import { applyRooms, type MigrationTarget, type ApplyStats } from './apply.ts';
import { WranglerTarget } from './targets/wrangler.ts';

export interface CliArgs {
  input: string;
  d1Name: string;
  kvName: string;
  dryRun: boolean;
  help: boolean;
}

export class CliArgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliArgError';
  }
}

export const USAGE: string = [
  'ethercalc-migrate — import a legacy Redis dump into Cloudflare',
  '',
  'USAGE',
  '  bun run src/cli.ts --input <dump.rdb> --d1-name <NAME> --kv-name <NAME> [--dry-run]',
  '',
  'OPTIONS',
  '  --input <path>    Path to an RDB file (produced by `redis-cli --rdb`).',
  '  --d1-name <name>  D1 database binding name (e.g. ethercalc-rooms).',
  '  --kv-name <name>  KV namespace binding name (e.g. ROOMS_INDEX).',
  '  --dry-run         Print what would be written without calling wrangler.',
  '  -h, --help        Show this help and exit.',
].join('\n');

/** Pure argv parser. */
export function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = {
    input: '',
    d1Name: '',
    kvName: '',
    dryRun: false,
    help: false,
  };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i] as string;
    if (a === '--help' || a === '-h') {
      out.help = true;
      i += 1;
      continue;
    }
    if (a === '--dry-run') {
      out.dryRun = true;
      i += 1;
      continue;
    }
    if (a === '--input' || a === '--d1-name' || a === '--kv-name') {
      const v = argv[i + 1];
      if (v === undefined) {
        throw new CliArgError(`${a} requires a value`);
      }
      if (a === '--input') out.input = v;
      else if (a === '--d1-name') out.d1Name = v;
      else out.kvName = v;
      i += 2;
      continue;
    }
    throw new CliArgError(`Unknown flag: ${a}`);
  }
  if (!out.help) {
    if (out.input === '') throw new CliArgError('--input is required');
    if (out.d1Name === '') throw new CliArgError('--d1-name is required');
    if (out.kvName === '') throw new CliArgError('--kv-name is required');
  }
  return out;
}

/**
 * DryRun target prints each intended write and counts them. Matches the
 * real wrangler target's public interface.
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
  readFile: (path: string) => Buffer;
  exec: Exec;
  stdout: (s: string) => void;
  stderr: (s: string) => void;
}

/**
 * Produce a target for the given args + deps. Exported so tests can
 * verify the dry-run/non-dry-run branches individually.
 */
export function buildTarget(args: CliArgs, deps: RunDeps): MigrationTarget {
  if (args.dryRun) return new DryRunTarget(deps.stdout);
  return new WranglerTarget({
    d1Name: args.d1Name,
    kvName: args.kvName,
    exec: deps.exec,
  });
}

/** End-to-end: read dump, apply to target, return stats. */
export async function runMigrate(
  args: CliArgs,
  deps: RunDeps,
): Promise<ApplyStats> {
  const buf = deps.readFile(args.input);
  const dump = parseRdb(buf);
  const rooms = extractRooms(dump);
  const target = buildTarget(args, deps);
  const stats = await applyRooms(rooms, target);
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
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (!(err instanceof CliArgError)) throw err;
    deps.stderr(`${err.message}\n`);
    deps.stderr('Run with --help for usage.\n');
    return 2;
  }
  if (args.help) {
    deps.stdout(`${USAGE}\n`);
    return 0;
  }
  try {
    await runMigrate(args, deps);
    return 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    deps.stderr(`migrate failed: ${msg}\n`);
    return 1;
  }
}
