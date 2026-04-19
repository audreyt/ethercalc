/**
 * Worker-scoped Playwright fixture that boots `wrangler dev` on a random
 * port and returns its base URL. Teardown kills the wrangler process tree.
 *
 * Scope choice: `{ scope: 'worker' }` (Playwright worker, not Cloudflare
 * Worker) — each Playwright worker pays one wrangler cold start. With the
 * project default of `workers: 1`, that's a single boot for the whole
 * suite. Per-test isolation is achievable by declaring the fixture with
 * `scope: 'test'`; not done here because Miniflare warmup is the slow
 * part and tests are independent.
 */
import { test as base } from '@playwright/test';
import {
  ChildProcess,
  spawn,
  type SpawnOptions,
} from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import waitPort from 'wait-port';

import { pickFreePort } from './port.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// `packages/e2e/src/` → `packages/worker/`
const WORKER_PKG = resolve(HERE, '..', '..', 'worker');

export interface WorkerFixtures {
  /** Base URL of the Worker, e.g. `http://127.0.0.1:8901`. No trailing slash. */
  workerBase: string;
}

export const test = base.extend<NonNullable<unknown>, WorkerFixtures>({
  workerBase: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const port = await pickFreePort();
      const { process: proc, baseUrl } = await startWrangler({ port });
      try {
        await use(baseUrl);
      } finally {
        await killTree(proc);
      }
    },
    { scope: 'worker' },
  ],
});

export { expect } from '@playwright/test';

async function startWrangler(args: {
  port: number;
}): Promise<{ process: ChildProcess; baseUrl: string }> {
  const { port } = args;
  const cmd = 'bun';
  const argv = [
    'x',
    'wrangler',
    'dev',
    '--port',
    String(port),
    '--ip',
    '127.0.0.1',
  ];
  const opts: SpawnOptions = {
    cwd: WORKER_PKG,
    env: {
      ...process.env,
      // Silence wrangler update prompts/telemetry in CI output.
      WRANGLER_SEND_METRICS: 'false',
      NO_UPDATE_NOTIFIER: '1',
      FORCE_COLOR: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    // `detached: true` + `process.kill(-pid, 'SIGTERM')` lets us reap the
    // workerd child wrangler spawns. Without it, killing the wrangler PID
    // orphans the workerd process and ports leak.
    detached: true,
  };
  const proc = spawn(cmd, argv, opts);

  // Drain streams so wrangler doesn't block on full stdout buffer.
  proc.stdout?.on('data', () => {});
  proc.stderr?.on('data', () => {});

  // If wrangler exits before readiness, surface the exit code.
  let earlyExit: Error | null = null;
  proc.once('exit', (code, signal) => {
    if (earlyExit === null) {
      earlyExit = new Error(`wrangler exited early: code=${code} signal=${signal}`);
    }
  });

  const timeoutSec = process.env['CI'] ? 45 : 30;
  const opened = await waitPort({
    host: '127.0.0.1',
    port,
    timeout: timeoutSec * 1000,
    output: 'silent',
  });
  if (!opened.open) {
    await killTree(proc);
    if (earlyExit) throw earlyExit;
    throw new Error(`wrangler did not open port ${port} within ${timeoutSec}s`);
  }

  // Confirm the health endpoint actually answers before we hand the URL
  // off — wait-port only knows the socket accepts connections.
  const baseUrl = `http://127.0.0.1:${port}`;
  const healthOk = await pingHealth(`${baseUrl}/_health`, timeoutSec * 1000);
  if (!healthOk) {
    await killTree(proc);
    throw new Error(`wrangler opened ${port} but /_health never returned 200`);
  }

  return { process: proc, baseUrl };
}

async function pingHealth(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        await res.arrayBuffer();
        return true;
      }
    } catch {
      // Socket may still be warming up — retry.
    }
    await sleep(200);
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Kill a detached process and its descendants. Windows uses a different
 * mechanism (`taskkill /T`) but we only support POSIX here because
 * wrangler dev + Miniflare's network quirks on macOS/ARM already narrow
 * the target platforms to Linux CI + macOS dev.
 */
async function killTree(proc: ChildProcess): Promise<void> {
  if (proc.pid === undefined || proc.exitCode !== null) return;
  try {
    // Negative PID = signal the entire process group.
    process.kill(-proc.pid, 'SIGTERM');
  } catch {
    try {
      proc.kill('SIGTERM');
    } catch {
      // Already gone.
    }
  }
  // Give wrangler up to 3s to shut down cleanly, then SIGKILL.
  await Promise.race([
    once(proc, 'exit'),
    sleep(3000).then(() => {
      if (proc.exitCode === null && proc.pid !== undefined) {
        try {
          process.kill(-proc.pid, 'SIGKILL');
        } catch {
          try {
            proc.kill('SIGKILL');
          } catch {
            // gone
          }
        }
      }
    }),
  ]);
}
