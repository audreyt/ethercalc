/**
 * Maps parsed legacy flags to `wrangler dev` arguments + environment
 * variables. Separated from `parse.ts` so each mapping can be unit-tested
 * in isolation and documented next to its rationale.
 *
 * The Worker reads all `ETHERCALC_*` env vars at boot time (see
 * AGENTS.md §3.1 row "Secrets"). The wrangler CLI itself reads `--port`
 * and `--ip` for the local Miniflare listening socket.
 */
import type { ParsedFlags } from './parse.ts';

const DEFAULT_PORT = 8000;
const DEFAULT_HOST = '0.0.0.0';

export interface InheritedEnv {
  readonly ETHERCALC_KEY?: string;
  readonly ETHERCALC_BASEPATH?: string;
}

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
 *   --basepath   → env BASEPATH (+ legacy mirror ETHERCALC_BASEPATH);
 *                  inherited ETHERCALC_BASEPATH honoured when flag absent
 *   --expire     → env ETHERCALC_EXPIRE
 *   --persist-to → wrangler `--persist-to <dir>`
 *   --keyfile, --certfile → WARNING: deferred, no wrangler TLS option yet.
 */
export function buildLaunchPlan(
  flags: ParsedFlags,
  inheritedEnv: InheritedEnv = {},
): LaunchPlan {
  const wranglerArgs: string[] = ['dev'];
  const env: Record<string, string> = {};
  const warnings: string[] = [];
  const port = flags.port ?? DEFAULT_PORT;
  const host = flags.host ?? DEFAULT_HOST;

  wranglerArgs.push('--port', String(port));
  // Mirror to env as well so downstream code (e.g. a reverse-proxy
  // sub-process or custom worker logic) can read the same value.
  env['ETHERCALC_PORT'] = String(port);

  wranglerArgs.push('--ip', host);
  env['ETHERCALC_HOST'] = host;

  if (flags.persistTo !== undefined) {
    wranglerArgs.push('--persist-to', flags.persistTo);
  }

  const key = flags.key ?? inheritedEnv.ETHERCALC_KEY;
  if (key !== undefined && key !== '') {
    env['ETHERCALC_KEY'] = key;
  }
  if (flags.cors === true) {
    env['ETHERCALC_CORS'] = '1';
  }
  // `--basepath` wins; an exported ETHERCALC_BASEPATH works too so the
  // README env table holds on the CLI path, not just Docker/workerd.
  const basepath = flags.basepath ?? inheritedEnv.ETHERCALC_BASEPATH;
  if (basepath !== undefined && basepath !== '') {
    env['BASEPATH'] = basepath;
    env['ETHERCALC_BASEPATH'] = basepath;
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
        'terminate TLS at a reverse proxy. See AGENTS.md §8 Phase 11 FINDINGS.',
    );
  }

  if ((key === undefined || key === '') && !isLoopbackHost(host)) {
    warnings.push(
      'warning: no ETHERCALC_KEY set; anonymous read/write/delete is open. ' +
        'Restrict ingress or set --key/ETHERCALC_KEY.',
    );
  }

  return { wranglerArgs, env, warnings };
}

function isLoopbackHost(host: string): boolean {
  return host === 'localhost' || host === '::1' || host.startsWith('127.');
}
