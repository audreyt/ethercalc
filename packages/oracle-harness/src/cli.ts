import { recordAll } from './record.ts';
import { replayAll } from './replay.ts';
import { ALL_HTTP_SCENARIOS } from './scenarios/index.ts';

/**
 * Parse argv of the shape:
 *   oracle-harness record [--target http://...] [--out path]
 *   oracle-harness replay [--target http://...] [--recorded path]
 *
 * Returns a normalized object; throws on unknown subcommand or flag.
 * Sensible defaults match the repo layout (oracle on :8000, recordings
 * in tests/oracle/recorded).
 */
export type CliCommand = 'record' | 'replay';

export interface CliOptions {
  readonly command: CliCommand;
  readonly targetUrl: string;
  readonly dir: string;
}

export const DEFAULT_TARGET = 'http://127.0.0.1:8000';
export const DEFAULT_RECORDED_DIR = 'tests/oracle/recorded';

export function parseArgs(argv: readonly string[]): CliOptions {
  const [raw, ...rest] = argv;
  if (raw !== 'record' && raw !== 'replay') {
    throw new Error(
      `unknown command: ${JSON.stringify(raw ?? '')} (expected "record" or "replay")`,
    );
  }
  let targetUrl = DEFAULT_TARGET;
  let dir = DEFAULT_RECORDED_DIR;
  for (let i = 0; i < rest.length; i++) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (flag === '--target') {
      if (value === undefined) throw new Error('--target requires a URL');
      targetUrl = value;
      i++;
      continue;
    }
    if (flag === '--out' || flag === '--recorded') {
      if (value === undefined) throw new Error(`${flag} requires a path`);
      dir = value;
      i++;
      continue;
    }
    throw new Error(`unknown flag: ${JSON.stringify(flag)}`);
  }
  return { command: raw as CliCommand, targetUrl, dir };
}

export interface MainDeps {
  readonly log?: (line: string) => void;
  readonly record?: typeof recordAll;
  readonly replay?: typeof replayAll;
  readonly scenarios?: typeof ALL_HTTP_SCENARIOS;
}

/** Async entrypoint; returns an exit code. */
export async function main(
  argv: readonly string[],
  deps: MainDeps = {},
): Promise<number> {
  const log = deps.log ?? ((line: string) => process.stdout.write(`${line}\n`));
  const record = deps.record ?? recordAll;
  const replay = deps.replay ?? replayAll;
  const scenarios = deps.scenarios ?? ALL_HTTP_SCENARIOS;
  const opts = parseArgs(argv);
  if (opts.command === 'record') {
    const results = await record(scenarios, {
      targetUrl: opts.targetUrl,
      outDir: opts.dir,
      log,
    });
    log(`recorded ${results.length} scenarios → ${opts.dir}`);
    return 0;
  }
  const results = await replay({ targetUrl: opts.targetUrl, recordedDir: opts.dir, log });
  const failed = results.filter((r) => !r.ok);
  log(`replay: ${results.length - failed.length}/${results.length} passed`);
  return failed.length === 0 ? 0 : 1;
}
