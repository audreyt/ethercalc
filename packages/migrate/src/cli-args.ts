/**
 * Pure argv → config parser for `bin/ethercalc-migrate`. Extracted from
 * `cli.ts` so tests can stub it via `vi.spyOn` on the module namespace
 * to exercise the non-CliArgError branch in {@link main}.
 */

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

/** Pure argv parser. Raises {@link CliArgError} on malformed input. */
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
