/**
 * Pure argv → config parser for `bin/ethercalc migrate`. Extracted from
 * `cli.ts` so tests can stub it via `vi.spyOn` on the module namespace
 * to exercise the non-CliArgError branch in {@link main}.
 *
 * Two source shapes are supported:
 *
 *   - `redis://host:port` — a live Redis (real `redis-server` or Zedis)
 *     that has already loaded `dump.rdb`. The server owns RDB decoding
 *     and the migrator stays memory-flat regardless of dump size.
 *
 *   - `file:///path` or `/absolute/path` — a legacy on-disk dump, either
 *     a `dump/` directory of per-key files or a `dump.json` blob, as
 *     written by the LiveScript EtherCalc's filesystem fallback when no
 *     Redis server was reachable. This is the path Sandstorm grains use.
 */

export type ParsedSource =
  | { readonly kind: 'redis'; readonly url: string }
  | { readonly kind: 'file'; readonly path: string };

export interface CliArgs {
  /**
   * `redis://host:port` URL of a RESP-speaking server, `file:///path` of
   * a legacy on-disk dump, or a bare absolute path (treated as filesystem).
   */
  source: string;
  /** Base URL of the worker; when unset, only `--dry-run` is valid. */
  target: string;
  /** Bearer token matching the worker's `env.ETHERCALC_MIGRATE_TOKEN`. */
  token: string;
  /** Print intended writes instead of seeding; `--target` becomes optional. */
  dryRun: boolean;
  help: boolean;
  /** Max wait for `/_health` before seeding. Defaults to 30 000 ms. */
  healthTimeoutMs?: number;
  /**
   * Max concurrent seed PUTs against the target. Default 8 — one JS
   * thread dispatches N concurrent `fetch`es via libuv so Miniflare (or
   * CF) handles rooms in parallel across DOs.
   */
  concurrency?: number;
  /**
   * Skip every `PUT /_migrate/bulk-index` call — seed PUTs still fire
   * with `skipIndex: true` so the DO owns its storage but the D1
   * `rooms` table is left untouched. Use when you populated D1 out of
   * band (e.g. `wrangler d1 execute --remote --file=rooms.sql`) and
   * just want to run the DO pass.
   */
  skipBulkIndex: boolean;
}

export class CliArgError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliArgError';
  }
}

/** Pure argv parser. Raises {@link CliArgError} on malformed input. */
export function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = {
    source: '',
    target: '',
    token: '',
    dryRun: false,
    help: false,
    skipBulkIndex: false,
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
    if (a === '--skip-bulk-index') {
      out.skipBulkIndex = true;
      i += 1;
      continue;
    }
    if (
      a === '--source' ||
      a === '--target' ||
      a === '--token' ||
      a === '--health-timeout-ms' ||
      a === '--concurrency'
    ) {
      const v = argv[i + 1];
      if (v === undefined) {
        throw new CliArgError(`${a} requires a value`);
      }
      if (a === '--source') out.source = v;
      else if (a === '--target') out.target = v;
      else if (a === '--token') out.token = v;
      else if (a === '--health-timeout-ms') {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0) {
          throw new CliArgError('--health-timeout-ms requires a non-negative number');
        }
        out.healthTimeoutMs = n;
      } else {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
          throw new CliArgError('--concurrency requires a positive integer');
        }
        out.concurrency = n;
      }
      i += 2;
      continue;
    }
    throw new CliArgError(`Unknown flag: ${a}`);
  }
  if (!out.help) {
    if (out.source === '') throw new CliArgError('--source is required');
    // Validate scheme up-front so typos (`redis:/host`, `fil://path`)
    // fail at parse time with a clear pointer instead of later with
    // a confusing connect error.
    parseSource(out.source);
    if (!out.dryRun) {
      if (out.target === '') throw new CliArgError('--target is required');
      if (out.token === '') throw new CliArgError('--token is required');
    }
  }
  return out;
}

/**
 * Classify a `--source` string as redis-RESP or on-disk filesystem.
 * Raises {@link CliArgError} on anything else.
 *
 *   - `redis://…`         → `{ kind: 'redis', url }`
 *   - `file:///abs/path`  → `{ kind: 'file', path: '/abs/path' }`
 *   - `/abs/path`         → `{ kind: 'file', path: '/abs/path' }` (friendly shorthand)
 *   - anything else       → error
 */
export function parseSource(source: string): ParsedSource {
  if (source.startsWith('redis://')) return { kind: 'redis', url: source };
  if (source.startsWith('file://')) {
    // `new URL('file:///var').pathname` is '/var' — standard WHATWG
    // file-URL parsing. Decoding %xx escapes too is cheap and matches
    // what users expect from file:// URLs.
    const u = new URL(source);
    return { kind: 'file', path: decodeURIComponent(u.pathname) };
  }
  if (source.startsWith('/')) return { kind: 'file', path: source };
  throw new CliArgError(
    `--source must be redis://…, file://…, or an absolute /path (got ${source})`,
  );
}
