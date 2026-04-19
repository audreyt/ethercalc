/**
 * Thin orchestrator for `bin/ethercalc`. Ties parse → map → spawn together
 * and keeps IO at the edge so the logic modules stay pure.
 *
 * `main()` is the single entry point; it takes its IO sinks as parameters
 * so tests can stub them. `bin/ethercalc` passes real `process.stdout`,
 * `process.stderr`, and a `spawnSync`-based exec.
 */
import { parseFlags, CliError } from './parse.ts';
import { buildLaunchPlan } from './map.ts';
import { HELP_TEXT } from './help.ts';

/**
 * Dependencies injected into `main()`. Explicit so tests can stub stdout/
 * stderr/exec without touching the real process. `exec` returns the exit
 * code the caller should propagate; implementations that `exec`-replace
 * the current process never return, but the return type is kept so the
 * test stub can still report what-would-have-happened.
 */
export interface MainDeps {
  stdout: (s: string) => void;
  stderr: (s: string) => void;
  exec: (cmd: string, args: string[], env: Record<string, string>) => number;
}

/**
 * Entry point. Returns the exit code the caller should exit with.
 *
 * Behavior:
 *   - `--help` / `-h`: print help to stdout, return 0.
 *   - Parse error:     print to stderr, return 2 (conventional EX_USAGE).
 *   - Otherwise:       map to launch plan, forward warnings to stderr,
 *                      exec wrangler, and return its exit code.
 */
export function main(argv: readonly string[], deps: MainDeps): number {
  let flags;
  try {
    flags = parseFlags(argv);
  } catch (err) {
    // parseFlags only ever raises CliError by design — we catch only that
    // subtype and let any other synchronous error propagate (an
    // engineering bug should not be swallowed).
    if (!(err instanceof CliError)) throw err;
    deps.stderr(`${err.message}\n`);
    deps.stderr('Run `ethercalc --help` for usage.\n');
    return 2;
  }
  if (flags.help === true) {
    deps.stdout(`${HELP_TEXT}\n`);
    return 0;
  }
  const plan = buildLaunchPlan(flags);
  for (const w of plan.warnings) {
    deps.stderr(`${w}\n`);
  }
  // `bunx --bun wrangler dev` keeps wrangler inside the bun runtime.
  // Using bunx (not a direct bun run) means the user does not need to
  // be inside `packages/worker`; bun walks up the workspace.
  return deps.exec('bunx', ['--bun', 'wrangler', ...plan.wranglerArgs], plan.env);
}
