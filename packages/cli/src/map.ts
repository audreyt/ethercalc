/**
 * Maps parsed legacy flags to `wrangler dev` arguments + environment
 * variables. Separated from `parse.ts` so each mapping can be unit-tested
 * in isolation and documented next to its rationale.
 *
 * The Worker reads all `ETHERCALC_*` env vars at boot time (see
 * CLAUDE.md §3.1 row "Secrets"). The wrangler CLI itself reads `--port`
 * and `--ip` for the local Miniflare listening socket.
 */
import type { ParsedFlags } from './parse.ts';

/**
 * Result of mapping a `ParsedFlags` to a launch plan. The orchestrator
 * spawns `wrangler dev <wranglerArgs>` with `env` merged onto the parent
 * process environment, and prints each `warnings` entry to stderr before
 * spawning.
 */
export interface LaunchPlan {
  /**
   * Arguments passed to `wrangler dev`, in order. Always starts with
   * `dev` followed by the --port/--ip pair when those flags are set.
   * We never pass positional args.
   */
  wranglerArgs: string[];
  /** Additional environment variables to set for the Worker. */
  env: Record<string, string>;
  /**
   * Non-fatal notices — e.g. "--keyfile ignored, TLS deferred". Printed
   * to stderr before launch but do not prevent startup.
   */
  warnings: string[];
}

/**
 * Build a launch plan from the parsed flags. Pure — no IO.
 *
 * Mapping rules (§13 Q6):
 *   --key        → env ETHERCALC_KEY
 *   --cors       → env ETHERCALC_CORS=1
 *   --port       → wrangler `--port <n>`  and env ETHERCALC_PORT (worker-side mirror)
 *   --host       → wrangler `--ip <addr>` and env ETHERCALC_HOST
 *   --basepath   → env ETHERCALC_BASEPATH
 *   --expire     → env ETHERCALC_EXPIRE
 *   --persist-to → wrangler `--persist-to <dir>`
 *   --keyfile, --certfile → WARNING: deferred, no wrangler TLS option yet.
 */
export function buildLaunchPlan(flags: ParsedFlags): LaunchPlan {
  const wranglerArgs: string[] = ['dev'];
  const env: Record<string, string> = {};
  const warnings: string[] = [];

  if (flags.port !== undefined) {
    wranglerArgs.push('--port', String(flags.port));
    // Mirror to env as well so downstream code (e.g. a reverse-proxy
    // sub-process or custom worker logic) can read the same value.
    env['ETHERCALC_PORT'] = String(flags.port);
  }
  if (flags.host !== undefined) {
    wranglerArgs.push('--ip', flags.host);
    env['ETHERCALC_HOST'] = flags.host;
  }
  if (flags.persistTo !== undefined) {
    wranglerArgs.push('--persist-to', flags.persistTo);
  }

  if (flags.key !== undefined) {
    env['ETHERCALC_KEY'] = flags.key;
  }
  if (flags.cors === true) {
    env['ETHERCALC_CORS'] = '1';
  }
  if (flags.basepath !== undefined) {
    env['ETHERCALC_BASEPATH'] = flags.basepath;
  }
  if (flags.expire !== undefined) {
    env['ETHERCALC_EXPIRE'] = String(flags.expire);
  }

  // TLS: wrangler dev does not expose `--keyfile`/`--certfile` flags.
  // Users who need local HTTPS should terminate TLS at a reverse proxy
  // (nginx/caddy/traefik) in front of the container. Surface the warning
  // loud and clear so `bin/ethercalc --keyfile foo --certfile bar` users
  // notice before they open a GitHub issue.
  if (flags.keyfile !== undefined || flags.certfile !== undefined) {
    warnings.push(
      'warning: --keyfile/--certfile are not supported by wrangler dev; ' +
        'terminate TLS at a reverse proxy. See CLAUDE.md §8 Phase 11 FINDINGS.',
    );
  }

  return { wranglerArgs, env, warnings };
}
