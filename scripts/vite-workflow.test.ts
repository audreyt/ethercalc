import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, mock, test } from 'bun:test';
import { loadConfigFromFile } from 'vite';
import {
  applyToBuildOrServe,
  assetPrepPlugin,
  createAssetPrepRunner,
  isVitestRun,
  resolveVpBinaryPath,
  runAssetPrepStep,
  type AssetPrepState,
  type SpawnLike,
} from './vite-workflow.ts';

/**
 * Minimal fake `ChildProcess`: a plain `EventEmitter` is enough for the
 * `error`/`exit` listeners `runAssetPrepStep` attaches — no real process is
 * ever spawned by these tests.
 */
class FakeChildProcess extends EventEmitter {}

/** Builds a `spawn` substitute that records calls and resolves/rejects on demand. */
function fakeSpawn(
  behavior: (child: FakeChildProcess, command: string, args: readonly string[]) => void,
): { spawn: SpawnLike; calls: Array<{ command: string; args: readonly string[]; options: Record<string, unknown> }> } {
  const calls: Array<{ command: string; args: readonly string[]; options: Record<string, unknown> }> = [];
  const spawn: SpawnLike = (command, args, options) => {
    calls.push({ command, args, options });
    const child = new FakeChildProcess();
    // Defer so callers can attach `.once('exit', ...)` / `.once('error', ...)`
    // listeners before any event fires, mirroring real async child-process behavior.
    queueMicrotask(() => behavior(child, command, args));
    return child as unknown as ChildProcess;
  };
  return { spawn, calls };
}

describe('resolveVpBinaryPath', () => {
  test('POSIX resolves to node_modules/.bin/vp', () => {
    expect(resolveVpBinaryPath('/repo', false)).toBe('/repo/node_modules/.bin/vp');
  });

  test('Windows resolves to node_modules\\.bin\\vp.cmd', () => {
    expect(resolveVpBinaryPath('C:\\repo', true)).toBe('C:\\repo\\node_modules\\.bin\\vp.cmd');
  });
});

describe('runAssetPrepStep', () => {
  test('runs vp run build:clients then bun scripts/build-assets.ts in order', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));

    await runAssetPrepStep({ spawn, root: '/repo', isWindows: false, streamOutput: false });

    expect(calls).toHaveLength(2);
    expect(calls[0]?.command).toBe('/repo/node_modules/.bin/vp');
    expect(calls[0]?.args).toEqual(['run', 'build:clients']);
    expect(calls[0]?.options.cwd).toBe('/repo');
    expect(calls[0]?.options.stdio).toBe('ignore');
    expect(calls[1]?.command).toBe('bun');
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
    expect(calls[1]?.options.cwd).toBe('/repo');
    expect(calls[1]?.options.stdio).toBe('ignore');
  });

  test('streams stdio by default for both commands (streamOutput not passed)', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));

    await runAssetPrepStep({ spawn, root: '/repo', isWindows: false });

    expect(calls[0]?.options.stdio).toBe('inherit');
    expect(calls[1]?.options.stdio).toBe('inherit');
  });

  test('launches vp through cmd.exe with a quoted command string on Windows (root path with spaces), bun spawned directly', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));

    await runAssetPrepStep({ spawn, root: 'C:\\Users\\My Repo', isWindows: true, streamOutput: false });

    expect(calls[0]?.command).toBe('cmd.exe');
    expect(calls[0]?.args).toEqual([
      '/d',
      '/s',
      '/c',
      '"C:\\Users\\My Repo\\node_modules\\.bin\\vp.cmd" run build:clients',
    ]);
    expect(calls[0]?.options.windowsVerbatimArguments).toBe(true);
    expect(calls[0]?.options.cwd).toBe('C:\\Users\\My Repo');
    expect(calls[0]?.options.stdio).toBe('ignore');
    expect(calls[0]?.options.windowsHide).toBe(true);

    expect(calls[1]?.command).toBe('bun');
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
    expect(calls[1]?.options.windowsVerbatimArguments).toBeUndefined();
    expect(calls[1]?.options.cwd).toBe('C:\\Users\\My Repo');
    expect(calls[1]?.options.stdio).toBe('ignore');
  });

  test('does not spawn bun when vp run build:clients exits nonzero', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 1, null));

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      '"vp run build:clients" exited with code 1',
    );
    expect(calls).toHaveLength(1);
  });

  test('rejects with the signal when vp run build:clients is terminated', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', null, 'SIGTERM'));

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      '"vp run build:clients" terminated by signal SIGTERM',
    );
    expect(calls).toHaveLength(1);
  });

  test('rejects when vp run build:clients fails to start', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('error', new Error('ENOENT')));

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      'Failed to start "vp run build:clients": ENOENT',
    );
    expect(calls).toHaveLength(1);
  });

  test('rejects with the exit code when bun scripts/build-assets.ts exits nonzero', async () => {
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => child.emit('exit', call === 1 ? 0 : 1, null));
      return child as unknown as ChildProcess;
    };

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      '"bun scripts/build-assets.ts" exited with code 1',
    );
    expect(call).toBe(2);
  });

  test('rejects with the signal when bun scripts/build-assets.ts is terminated', async () => {
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => {
        if (call === 1) child.emit('exit', 0, null);
        else child.emit('exit', null, 'SIGTERM');
      });
      return child as unknown as ChildProcess;
    };

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      '"bun scripts/build-assets.ts" terminated by signal SIGTERM',
    );
  });

  test('rejects when bun scripts/build-assets.ts fails to start', async () => {
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => {
        if (call === 1) child.emit('exit', 0, null);
        else child.emit('error', new Error('ENOENT'));
      });
      return child as unknown as ChildProcess;
    };

    await expect(runAssetPrepStep({ spawn, root: '/repo', streamOutput: false })).rejects.toThrow(
      'Failed to start "bun scripts/build-assets.ts": ENOENT',
    );
  });
});

describe('createAssetPrepRunner', () => {
  test('performs exactly one two-command sequence across concurrent callers (deduplication)', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));
    const run = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state: {} });

    await Promise.all([run(), run(), run()]);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.args).toEqual(['run', 'build:clients']);
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
  });

  test('performs exactly one two-command sequence across sequential callers sharing the same resolved promise', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));
    const run = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state: {} });

    await run();
    await run();

    expect(calls).toHaveLength(2);
  });

  test('a failed run does not poison later calls — retries the full sequence on next invocation', async () => {
    // Call 1 (first run(), "vp run build:clients") fails outright, so
    // "bun scripts/build-assets.ts" never spawns. Call 2 (second run(),
    // "vp run build:clients" again) and call 3 ("bun scripts/build-assets.ts")
    // both succeed, proving the retry re-runs the whole two-command sequence
    // rather than resuming from wherever the first attempt stopped.
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => child.emit('exit', call === 1 ? 1 : 0, null));
      return child as unknown as ChildProcess;
    };
    const run = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state: {} });

    await expect(run()).rejects.toThrow('"vp run build:clients" exited with code 1');
    await expect(run()).resolves.toBeUndefined();
    expect(call).toBe(3);
  });

  test('two independent runners sharing an injected state dedupe to a single two-command sequence', async () => {
    // Simulates Vite re-resolving `vite.config.mts` more than once per CLI
    // process (three separate config resolutions, in practice) — each
    // resolution builds its own `assetPrepPlugin`/`createAssetPrepRunner`
    // instance, but they must all share the same dedupe state so only one
    // asset build actually runs. The state object is injected fresh here
    // (never the real process-global singleton) so this test can't leak
    // into or be polluted by any other test.
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));
    const state: AssetPrepState = {};

    const runA = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state });
    const runB = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state });
    const runC = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state });

    await Promise.all([runA(), runB(), runC()]);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.args).toEqual(['run', 'build:clients']);
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
  });

  test('a failure on one runner clears the shared state so a sibling runner retries the full sequence', async () => {
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => child.emit('exit', call === 1 ? 1 : 0, null));
      return child as unknown as ChildProcess;
    };
    const state: AssetPrepState = {};

    const runA = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state });
    const runB = createAssetPrepRunner({ spawn, root: '/repo', streamOutput: false, state });

    await expect(runA()).rejects.toThrow('"vp run build:clients" exited with code 1');
    await expect(runB()).resolves.toBeUndefined();
    expect(call).toBe(3);
  });
});

describe('isVitestRun', () => {
  test('true when VITEST=true', () => {
    expect(isVitestRun({ VITEST: 'true' })).toBe(true);
  });

  test('false when VITEST is unset', () => {
    expect(isVitestRun({})).toBe(false);
  });
});

describe('applyToBuildOrServe', () => {
  test('applies to build outside Vitest', () => {
    expect(applyToBuildOrServe({}, { command: 'build', mode: 'production' })).toBe(true);
  });

  test('applies to serve outside Vitest', () => {
    expect(applyToBuildOrServe({}, { command: 'serve', mode: 'development' })).toBe(true);
  });
});

describe('assetPrepPlugin', () => {
  test('config hook runs exactly one two-command asset-prep sequence', async () => {
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));
    const plugin = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state: {} });

    expect(plugin.name).toBe('ethercalc:asset-prep');
    await plugin.config();
    await plugin.config();

    expect(calls).toHaveLength(2);
    expect(calls[0]?.args).toEqual(['run', 'build:clients']);
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
  });

  test('config hook propagates a nonzero-exit failure', async () => {
    const { spawn } = fakeSpawn((child) => child.emit('exit', 1, null));
    const plugin = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state: {} });

    await expect(plugin.config()).rejects.toThrow('exited with code 1');
  });

  test('defaults spawn/root without starting a real process when overridden in tests', () => {
    // Constructing with an explicit `spawn` override proves the seam is
    // actually used for injection rather than falling back to the real
    // `node:child_process` spawn — no process is started by this assertion.
    const spy = mock(() => new FakeChildProcess() as unknown as ChildProcess);
    const plugin = assetPrepPlugin({ spawn: spy, root: '/repo', state: {} });
    expect(typeof plugin.config).toBe('function');
    expect(spy).not.toHaveBeenCalled();
  });

  test('three separate plugin instances sharing an injected state produce one asset build (simulated repeated config resolution)', async () => {
    // Mirrors what a real `vp build` does when Vite resolves
    // `vite.config.mts` more than once in the same CLI process: each
    // resolution constructs a brand-new `assetPrepPlugin` instance. As long
    // as every instance is threaded the same `AssetPrepState`, only one
    // two-command asset-prep sequence must actually run.
    const { spawn, calls } = fakeSpawn((child) => child.emit('exit', 0, null));
    const state: AssetPrepState = {};

    const pluginA = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state });
    const pluginB = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state });
    const pluginC = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state });

    await Promise.all([pluginA.config(), pluginB.config(), pluginC.config()]);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.args).toEqual(['run', 'build:clients']);
    expect(calls[1]?.args).toEqual(['scripts/build-assets.ts']);
  });

  test('a rejected build from one plugin instance is never cached — a sibling instance retries the full sequence', async () => {
    let call = 0;
    const spawn: SpawnLike = (command, args, options) => {
      call += 1;
      const child = new FakeChildProcess();
      queueMicrotask(() => child.emit('exit', call === 1 ? 1 : 0, null));
      return child as unknown as ChildProcess;
    };
    const state: AssetPrepState = {};

    const pluginA = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state });
    const pluginB = assetPrepPlugin({ spawn, root: '/repo', streamOutput: false, state });

    await expect(pluginA.config()).rejects.toThrow('exited with code 1');
    await expect(pluginB.config()).resolves.toBeUndefined();
    expect(call).toBe(3);
  });
});

test('loads the root Vite config through Vite under VITEST gating', async () => {
  const previousVitest = process.env.VITEST;
  process.env.VITEST = 'true';

  try {
    const result = await loadConfigFromFile(
      { command: 'build', mode: 'test', isSsrBuild: false, isPreview: false },
      resolve(import.meta.dir, '..', 'vite.config.mts'),
    );
    expect(result).not.toBeNull();

    const config = result!.config as typeof result.config & {
      check: { fmt: boolean };
      publicDir: string;
      server: { allowedHosts?: string[] };
      test: { projects: unknown[] };
    };
    const repositoryRoot = resolve(import.meta.dir, '..');
    expect(config.check.fmt).toBe(false);
    expect(config.publicDir).toBe(resolve(repositoryRoot, 'assets'));
    expect(config.server.allowedHosts).toEqual(['assets.local']);
    expect(Array.isArray(config.test.projects)).toBe(true);
    expect(config.test.projects.length).toBeGreaterThan(0);
  } finally {
    if (previousVitest === undefined) delete process.env.VITEST;
    else process.env.VITEST = previousVitest;
  }
});

/**
 * Recursively flattens a `PluginOption`-shaped value (arrays may nest, and
 * entries may be falsy) into a flat list of plugin-like objects, without
 * attempting to resolve any `Promise` entries — under
 * `VP_RESOLVING_CONFIG_METADATA=1`, `lazyPlugins` never invokes its callback,
 * so no promise-producing plugin factory ever runs during this test.
 */
function flattenPlugins(value: unknown): Array<{ name?: unknown }> {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap((entry) => flattenPlugins(entry));
  if (typeof value === 'object') return [value as { name?: unknown }];
  return [];
}

test('metadata-only config resolution (vp check) skips asset prep and Cloudflare plugin factories', async () => {
  const previousVitest = process.env.VITEST;
  const previousMetadata = process.env.VP_RESOLVING_CONFIG_METADATA;
  delete process.env.VITEST;
  process.env.VP_RESOLVING_CONFIG_METADATA = '1';

  try {
    const result = await loadConfigFromFile(
      { command: 'build', mode: 'production', isSsrBuild: false, isPreview: false },
      resolve(import.meta.dir, '..', 'vite.config.mts'),
    );
    expect(result).not.toBeNull();

    const config = result!.config as typeof result.config & {
      check: { fmt: boolean };
      lint: {
        categories: Record<string, string>;
        options: { denyWarnings: boolean };
      };
      plugins?: unknown;
    };

    // The metadata-only load must still resolve the `check`/`lint` blocks
    // `vp check` actually reads, undisturbed by plugin gating.
    expect(config.check.fmt).toBe(false);
    expect(config.lint.categories.correctness).toBe('off');
    expect(config.lint.options.denyWarnings).toBe(true);

    // With `VP_RESOLVING_CONFIG_METADATA=1`, `lazyPlugins(() => [...])`
    // never calls its callback, so neither `assetPrepPlugin()` nor the
    // mapped Cloudflare plugins should appear anywhere in the resolved
    // plugin list — proving `vp check` never prepares assets or resolves
    // the Cloudflare Worker's Wrangler config.
    const pluginNames = flattenPlugins(config.plugins)
      .map((plugin) => plugin.name)
      .filter((name): name is string => typeof name === 'string');
    expect(pluginNames).not.toContain('ethercalc:asset-prep');
    expect(pluginNames.some((name) => name.startsWith('vite-plugin-cloudflare'))).toBe(false);
  } finally {
    if (previousVitest === undefined) delete process.env.VITEST;
    else process.env.VITEST = previousVitest;
    if (previousMetadata === undefined) delete process.env.VP_RESOLVING_CONFIG_METADATA;
    else process.env.VP_RESOLVING_CONFIG_METADATA = previousMetadata;
  }
});
