/**
 * Legacy flag parser for `bin/ethercalc` (§13 Q6).
 *
 * The old CLI used `optimist` to accept `--key`, `--cors`, `--port`, etc.
 * We preserve the flag surface verbatim so existing self-host users can
 * swap binaries without changing their systemd/init scripts. This module
 * is pure — it consumes an argv array and produces a `ParsedFlags` result
 * or throws `CliError` with a message suitable for stderr. No process
 * interaction; the orchestrator in `index.ts` owns I/O and exit codes.
 */

/**
 * Shape of the parsed command line after legacy flag normalization.
 *
 * Every field is optional. When a flag is absent, the downstream mapper
 * (`map.ts`) either supplies a wrangler default or leaves the env var
 * unset so the Worker can fall back to its own default. Boolean flags
 * (`--cors`, `--help`) are present-or-absent; string flags carry their
 * value directly.
 */
export interface ParsedFlags {
  key?: string;
  cors?: boolean;
  port?: number;
  host?: string;
  expire?: number;
  basepath?: string;
  keyfile?: string;
  certfile?: string;
  persistTo?: string;
  help?: boolean;
}

/**
 * Raised when the argv contains a syntactic error (unknown flag, missing
 * value, non-numeric value where numeric required). Callers should print
 * `err.message` to stderr and exit non-zero.
 */
export class CliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliError';
  }
}

/** Flags that take a value. Map entry → the ParsedFlags key it sets. */
const STRING_FLAGS: Record<string, keyof ParsedFlags> = {
  '--key': 'key',
  '--host': 'host',
  '--basepath': 'basepath',
  '--keyfile': 'keyfile',
  '--certfile': 'certfile',
  '--persist-to': 'persistTo',
};

/** Flags that take a numeric value. */
const NUMBER_FLAGS: Record<string, keyof ParsedFlags> = {
  '--port': 'port',
  '--expire': 'expire',
};

/** Boolean/presence flags. */
const BOOL_FLAGS: Record<string, keyof ParsedFlags> = {
  '--cors': 'cors',
  '--help': 'help',
  '-h': 'help',
};

/**
 * Parse argv (minus `node` + script name) into a `ParsedFlags`.
 *
 * Accepted forms, matching legacy optimist behavior:
 *   `--port 8080`
 *   `--port=8080`
 *   `--cors`          (boolean flags stand alone)
 *   `-h`              (only supported short flag — matches old --help shim)
 *
 * Raises `CliError` on:
 *   - unknown flag (`--foo`)
 *   - string flag with no following value (`--port` at end of argv)
 *   - numeric flag with non-numeric value (`--port abc`)
 *   - positional arguments (we don't accept any)
 */
export function parseFlags(argv: readonly string[]): ParsedFlags {
  const out: ParsedFlags = {};
  let i = 0;
  while (i < argv.length) {
    // Loop condition keeps `raw` defined; the `as string` assertion is safe
    // and preferable to a dead defensive branch that would never be covered.
    const raw = argv[i] as string;
    // `--foo=bar` splits into two halves; `--foo bar` uses the next token.
    const eqIdx = raw.indexOf('=');
    const flag = eqIdx >= 0 ? raw.slice(0, eqIdx) : raw;
    const inlineValue = eqIdx >= 0 ? raw.slice(eqIdx + 1) : undefined;

    if (Object.prototype.hasOwnProperty.call(BOOL_FLAGS, flag)) {
      if (inlineValue !== undefined) {
        throw new CliError(`${flag} does not take a value`);
      }
      const key = BOOL_FLAGS[flag] as keyof ParsedFlags;
      (out as Record<string, unknown>)[key] = true;
      i += 1;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(STRING_FLAGS, flag)) {
      const value = inlineValue !== undefined ? inlineValue : argv[i + 1];
      if (value === undefined) {
        throw new CliError(`${flag} requires a value`);
      }
      const key = STRING_FLAGS[flag] as keyof ParsedFlags;
      (out as Record<string, unknown>)[key] = value;
      i += inlineValue !== undefined ? 1 : 2;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(NUMBER_FLAGS, flag)) {
      const value = inlineValue !== undefined ? inlineValue : argv[i + 1];
      if (value === undefined) {
        throw new CliError(`${flag} requires a value`);
      }
      const n = Number(value);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        throw new CliError(`${flag} expects a non-negative integer, got "${value}"`);
      }
      const key = NUMBER_FLAGS[flag] as keyof ParsedFlags;
      (out as Record<string, unknown>)[key] = n;
      i += inlineValue !== undefined ? 1 : 2;
      continue;
    }
    // Unknown flag OR positional argument. We don't accept either.
    throw new CliError(`Unknown flag: ${flag}`);
  }
  return out;
}
