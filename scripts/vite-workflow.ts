// Shared plugin helper wired into the root `vite.config.mts` so that direct
// root `vp build` / `vp dev` are production-faithful: both must prepare the
// curated static assets before Vite build/serve runs, exactly like the
// previous `pretest` / `prepack` npm-script hooks did for `vp test` / `npm
// pack`. Without this, `vp build` would build only the client bundles Vite
// itself touches and `vp dev` would serve a bare static Vite shell with no
// curated `assets/` tree for the Cloudflare Worker's `[assets]` binding to
// read. The prep step spawns `vp run build:clients` and then
// `scripts/build-assets.ts` directly (see `runAssetPrepStep` below) instead
// of delegating to the `build:assets` Vite+ task itself — Vite+'s own task
// runner resolves the `bun` executable it shells out to relative to the
// task's cwd rather than `PATH`, which fails in sandboxed environments even
// though `bun` is directly spawnable via `PATH`.
import { spawn as nodeSpawn } from 'node:child_process';
import { posix, win32 } from 'node:path';
import type { ChildProcess } from 'node:child_process';
import type { ConfigEnv } from 'vite-plus';

export interface SpawnLike {
  (
    command: string,
    args: readonly string[],
    options: Record<string, unknown> & { windowsVerbatimArguments?: boolean },
  ): ChildProcess;
}

export interface RunAssetPrepStepDeps {
  /** Injection seam for tests — defaults to `node:child_process`'s `spawn`. */
  spawn: SpawnLike;
  /** Repository root the `.bin/vp` (or `vp.cmd` on Windows) lives under. */
  root: string;
  /** Defaults to `process.platform === 'win32'`. */
  isWindows?: boolean;
  /** Stream child stdio to the parent process. Defaults to `true`. */
  streamOutput?: boolean;
}

/**
 * Resolves the repository-local `vp` binary, portable across POSIX/Windows.
 * Uses the explicit `path.win32`/`path.posix` joiners (not the ambient
 * `node:path`) so the produced separators match `isWindows` regardless of
 * the host platform actually running this code — required for the Windows
 * branch to be deterministically testable from a POSIX CI/dev machine.
 */
export function resolveVpBinaryPath(root: string, isWindows = process.platform === 'win32'): string {
  const join = isWindows ? win32.join : posix.join;
  return join(root, 'node_modules', '.bin', isWindows ? 'vp.cmd' : 'vp');
}

/**
 * Runs a single labeled child-process command to completion. Rejects with a
 * command-specific message on spawn failure, nonzero exit code, or
 * terminating signal, so a failure always names the command that actually
 * failed — shared by both commands `runAssetPrepStep` runs below.
 */
function runCommand(
  spawn: SpawnLike,
  label: string,
  command: string,
  args: readonly string[],
  options: { cwd: string; stdio: 'inherit' | 'ignore'; windowsVerbatimArguments?: boolean },
): Promise<void> {
  return new Promise<void>((resolvePromise, reject) => {
    const spawnOptions: Record<string, unknown> & { windowsVerbatimArguments?: boolean } = {
      cwd: options.cwd,
      stdio: options.stdio,
      windowsHide: true,
    };
    if (options.windowsVerbatimArguments) {
      spawnOptions.windowsVerbatimArguments = true;
    }
    const child = spawn(command, args, spawnOptions);

    child.once('error', (error: Error) => {
      reject(new Error(`Failed to start "${label}": ${error.message}`, { cause: error }));
    });

    child.once('exit', (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal) {
        reject(new Error(`"${label}" terminated by signal ${signal}`));
      } else if (code !== 0) {
        reject(new Error(`"${label}" exited with code ${code}`));
      } else {
        resolvePromise();
      }
    });
  });
}

/**
 * Prepares the curated static assets in two sequential steps, mirroring the
 * root `build:assets` npm script exactly (`vp run build:clients && bun
 * scripts/build-assets.ts`) but spawning each command directly instead of
 * delegating to the `build:assets` Vite+ task itself. Running `vp run
 * build:clients` first keeps client bundling a real, cacheable Vite+ task;
 * then spawning `bun scripts/build-assets.ts` ourselves — resolved via
 * `PATH`, exactly like the npm script does — sidesteps Vite+'s own (buggy,
 * sandbox-only) `bun` executable resolution entirely while producing the
 * exact same effective command sequence and output. The second command
 * never starts if the first fails. Streams stdio through in production so
 * `vp build`/`vp dev` output stays visible. Windows needs the `.cmd` shim
 * for `vp` launched through `cmd.exe /c` — spawning it directly fails with
 * EINVAL; `bun` ships as a real executable, so it's spawned directly via
 * `PATH` on every platform.
 */
export async function runAssetPrepStep(deps: RunAssetPrepStepDeps): Promise<void> {
  const { spawn, root, streamOutput = true } = deps;
  const isWindows = deps.isWindows ?? process.platform === 'win32';
  const vpBinary = resolveVpBinaryPath(root, isWindows);
  const vpCommand = isWindows ? 'cmd.exe' : vpBinary;
  // Windows: `vp.cmd` is launched through `cmd.exe /d /s /c` with a single
  // command-string argument (rather than separate argv entries) so a root
  // path containing spaces (e.g. `C:\Users\My Repo\...`) isn't split by
  // `cmd.exe`'s own command-line parsing. The `.cmd` path is double-quoted
  // — the standard safe `cmd /s /c` quoting form — and `windowsVerbatimArguments`
  // is set on this spawn only so Node passes the argv through to `cmd.exe`
  // verbatim instead of re-quoting/escaping it itself.
  const vpArgs = isWindows ? ['/d', '/s', '/c', `"${vpBinary}" run build:clients`] : ['run', 'build:clients'];
  const options = { cwd: root, stdio: streamOutput ? ('inherit' as const) : ('ignore' as const) };
  const vpOptions = isWindows ? { ...options, windowsVerbatimArguments: true } : options;

  await runCommand(spawn, 'vp run build:clients', vpCommand, vpArgs, vpOptions);
  await runCommand(spawn, 'bun scripts/build-assets.ts', 'bun', ['scripts/build-assets.ts'], options);
}

export interface AssetPrepState {
  /** Shared in-flight/resolved promise. `undefined` means no attempt is running. */
  inFlight?: Promise<void>;
}

/**
 * Process-global key for the shared asset-prep dedupe state, looked up via
 * `Symbol.for` so every module instance/config load in the same Node
 * process — however many times Vite re-resolves the config, and however
 * many separate `assetPrepPlugin`/`createAssetPrepRunner` instances that
 * produces — reads and writes the exact same slot on `globalThis`. A
 * plain module-level `let` would only dedupe within a single loaded
 * instance of this module; Vite's repeated config resolution can otherwise
 * end up with more than one live instance (e.g. across ESM cache
 * boundaries), which is what let three separate asset-prep sequences slip
 * through in a single `vp build`.
 */
const ASSET_PREP_STATE_KEY = Symbol.for('ethercalc:vite-workflow:asset-prep-state');

/** Returns the shared process-global {@link AssetPrepState} singleton. */
function getGlobalAssetPrepState(): AssetPrepState {
  const globalRecord = globalThis as unknown as Record<symbol, AssetPrepState | undefined>;
  return (globalRecord[ASSET_PREP_STATE_KEY] ??= {});
}

export interface CreateAssetPrepRunnerOptions {
  spawn: SpawnLike;
  root: string;
  isWindows?: boolean;
  streamOutput?: boolean;
  /**
   * Dedupe state to share the in-flight/resolved promise through. Defaults
   * to a process-global singleton (see {@link getGlobalAssetPrepState}) so
   * every plugin instance/config load in the same Node process dedupes
   * against each other. Tests should inject a fresh object instead of
   * relying on the shared global.
   */
  state?: AssetPrepState;
}

/**
 * Returns a `run()` function that executes the asset-prep step at most once
 * per Node process: the first caller starts the two-command sequence, every
 * concurrent/subsequent caller — including ones from an entirely separate
 * `createAssetPrepRunner`/`assetPrepPlugin` instance sharing the same
 * {@link AssetPrepState} — shares that same in-flight promise instead of
 * spawning it again. Both the `config` and `configureServer` plugin hooks
 * below call `run()`, and Vite may invoke `config` more than once (and, in
 * practice, may resolve the whole config more than once per CLI process)
 * while resolving a merged config, so without this dedup a single `vp
 * build`/`vp dev` invocation could shell out to the asset-prep commands
 * redundantly. A failed attempt clears the shared state so the next call
 * (e.g. an interactive `vp dev` restart after fixing the underlying error)
 * gets a fresh attempt instead of a permanently rejected one.
 */
export function createAssetPrepRunner(options: CreateAssetPrepRunnerOptions): () => Promise<void> {
  const state = options.state ?? getGlobalAssetPrepState();
  return function run(): Promise<void> {
    state.inFlight ??= runAssetPrepStep(options).catch((error: unknown) => {
      state.inFlight = undefined;
      throw error;
    });
    return state.inFlight;
  };
}

/**
 * True while resolving under Vitest (`vp test`) — Vitest sets this before
 * any Vite config resolution happens, including when it boots its own Vite
 * dev server (whose `command` is otherwise indistinguishable from a real
 * `vp dev`). Used to keep the asset-prep step and the Cloudflare plugin out
 * of the `vp test` config path entirely.
 */
export function isVitestRun(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VITEST === 'true';
}

/** Vite `apply` predicate: only the real `vp build` / `vp dev` commands, never `vp test`. */
export function applyToBuildOrServe(_config: unknown, env: ConfigEnv): boolean {
  return !isVitestRun() && (env.command === 'build' || env.command === 'serve');
}

export interface AssetPrepPluginOptions {
  spawn?: SpawnLike;
  root?: string;
  isWindows?: boolean;
  streamOutput?: boolean;
  /** Dedupe state; defaults to the process-global singleton. Tests should inject a fresh object. */
  state?: AssetPrepState;
}

/**
 * Vite plugin that prepares the curated static assets once before
 * build/dev, ahead of the Cloudflare plugin so the Worker's `[assets]`
 * binding (see `packages/worker/wrangler.toml`) always sees a freshly
 * curated `assets/` tree. Gated to `build`/`serve` via
 * `applyToBuildOrServe` — never fires for `vp test`'s Vitest-driven config
 * resolution.
 */
export function assetPrepPlugin(options: AssetPrepPluginOptions = {}) {
  const root = options.root ?? process.cwd();
  const run = createAssetPrepRunner({
    spawn: options.spawn ?? nodeSpawn,
    root,
    isWindows: options.isWindows,
    streamOutput: options.streamOutput,
    state: options.state,
  });

  return {
    name: 'ethercalc:asset-prep',
    apply: applyToBuildOrServe,
    async config(): Promise<void> {
      await run();
    },
  };
}
