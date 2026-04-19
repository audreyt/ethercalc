/**
 * Worker-scoped fixture that boots a Vite dev server for
 * `packages/client-multi/` on a random port.
 *
 * We use `vite` (dev mode, not `preview`) because it serves SPA index
 * fallback out-of-the-box for `/=<room>` paths. Phase 11 will land the
 * Workers Assets pipeline that lets the Worker itself serve the SPA;
 * at that point these fixtures become redundant and the client-multi
 * smoke tests can point at `workerBase` directly.
 */
import { test as base, mergeTests } from '@playwright/test';
import {
  ChildProcess,
  spawn,
  type SpawnOptions,
} from 'node:child_process';
import { once } from 'node:events';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import waitPort from 'wait-port';

import { test as workerTest } from './fixtures.ts';
import { pickFreePort } from './port.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
// `packages/e2e/src/` → `packages/client-multi/`
const CLIENT_MULTI_PKG = resolve(HERE, '..', '..', 'client-multi');

export interface ClientFixtures {
  /** Base URL of the Vite dev server serving client-multi. No trailing slash. */
  clientBase: string;
}

const clientTest = base.extend<NonNullable<unknown>, ClientFixtures>({
  clientBase: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const port = await pickFreePort();
      const { process: proc, baseUrl } = await startVite({ port });
      try {
        await use(baseUrl);
      } finally {
        await killTree(proc);
      }
    },
    { scope: 'worker' },
  ],
});

/**
 * Combined fixture that exposes both the Worker (`workerBase`) and the
 * client Vite server (`clientBase`) — use this in tests that need both.
 */
export const test = mergeTests(workerTest, clientTest);
export { expect } from '@playwright/test';

async function startVite(args: {
  port: number;
}): Promise<{ process: ChildProcess; baseUrl: string }> {
  const { port } = args;
  const cmd = 'bun';
  // `x vite dev` keeps us consistent with wrangler's invocation style; the
  // `--port` flag pins Vite to the random port we chose and `--host 127.0.0.1`
  // avoids IPv4/IPv6 dual-stack surprises on CI.
  const argv = [
    'x',
    'vite',
    'dev',
    '--port',
    String(port),
    '--host',
    '127.0.0.1',
    '--strictPort',
  ];
  const opts: SpawnOptions = {
    cwd: CLIENT_MULTI_PKG,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  };
  const proc = spawn(cmd, argv, opts);

  proc.stdout?.on('data', () => {});
  proc.stderr?.on('data', () => {});

  let earlyExit: Error | null = null;
  proc.once('exit', (code, signal) => {
    if (earlyExit === null) {
      earlyExit = new Error(`vite exited early: code=${code} signal=${signal}`);
    }
  });

  const timeoutSec = process.env['CI'] ? 30 : 20;
  const opened = await waitPort({
    host: '127.0.0.1',
    port,
    timeout: timeoutSec * 1000,
    output: 'silent',
  });
  if (!opened.open) {
    await killTree(proc);
    if (earlyExit) throw earlyExit;
    throw new Error(`vite did not open port ${port} within ${timeoutSec}s`);
  }

  return { process: proc, baseUrl: `http://127.0.0.1:${port}` };
}

async function killTree(proc: ChildProcess): Promise<void> {
  if (proc.pid === undefined || proc.exitCode !== null) return;
  try {
    process.kill(-proc.pid, 'SIGTERM');
  } catch {
    try {
      proc.kill('SIGTERM');
    } catch {
      // already gone
    }
  }
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
