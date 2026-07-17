import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { cloudflare } from '@cloudflare/vite-plugin';

import { applyToBuildOrServe, assetPrepPlugin, isVitestRun } from './scripts/vite-workflow.ts';

import { defineConfig, lazyPlugins } from 'vite-plus';

const repositoryRoot = dirname(fileURLToPath(import.meta.url));
const workerRoot = resolve(repositoryRoot, 'packages/worker');

// Root config for `vp test` (Vitest under the hood). Without it, Vitest's
// default whole-repo discovery pulls in packages/e2e's Playwright specs
// (`test.describe` outside Playwright throws) and the root `bun:test` files
// (`bun-passthrough.test.ts`, `scripts/build-assets.test.ts` — unresolvable
// under Vitest), and runs every package under a bare `node` environment,
// ignoring each package's own `vitest.config.ts` (jsdom, workers-pool, etc).
//
// `test.projects` allowlists each package's existing Vitest config instead,
// preserving its environment/pool/coverage exactly as configured for
// `vp run --filter './packages/*' test`. packages/e2e (Playwright),
// packages/docs (no tests), and the root `bun:test` files are intentionally
// absent — they run under their own runners, not Vitest.
//
// packages/worker ships two configs that both must run: vitest.config.ts
// (workers-pool integration) and vitest.node.config.ts (Node unit tests +
// the 100% coverage gate) — see AGENTS.md "Live risks" #1. Both default to
// the shared `@ethercalc/worker` package.json name, so each sets an
// explicit `test.name` (`worker:pool` / `worker:node`) to avoid Vitest's
// unique-project-name collision.
//
// Vitest's `coverage` block is orchestrator-level only: when tests run as
// aggregated `test.projects`, each project's own `coverage.provider` /
// `include` / `exclude` / `thresholds` are silently ignored, and Vitest
// falls back to its default `v8` provider over every executed file. That
// default `v8` provider crashes inside the workers-pool project (`No such
// module "node:inspector/promises"` — v8 coverage needs the Node inspector
// API, which workerd doesn't implement) and dilutes the report with
// non-gated sources (workers-pool glue, socialcalc-headless smoke-only
// code, test helpers). So this root config restates `provider: 'istanbul'`
// plus the exact union of every package's own CI-gated
// `test:coverage` include/exclude (see each `packages/*/vitest.config.ts` /
// `packages/worker/vitest.node.config.ts`) — same scope, same 100%
// thresholds, just path-prefixed for the root run. Packages without a
// `test:coverage` gate (socialcalc-headless, and the worker:pool project)
// are intentionally absent from `include`, matching the per-package CI
// contract in `.github/workflows/ci.yml`.
// `vp build` / `vp dev` at repo root must be production-faithful: prepare
// the curated static assets (`assetPrepPlugin` — `scripts/vite-workflow.ts`)
// and build/serve the actual Cloudflare Worker (the official
// `@cloudflare/vite-plugin`), not just whatever bare client bundles Vite
// itself would otherwise touch. Both plugins are restricted to `build`/
// `serve` via `applyToBuildOrServe` so `vp test`'s Vitest-driven config
// resolution — which uses `test.projects` below, not this root config's
// build/dev pipeline — never runs `build:assets` or loads the Cloudflare
// plugin's Miniflare/Workers runtime integration.
export default defineConfig({
  root: isVitestRun(process.env) ? repositoryRoot : workerRoot,
  publicDir: resolve(repositoryRoot, 'assets'),
  server: {
    allowedHosts: ['assets.local'],
  },
  plugins: lazyPlugins(() => [
    assetPrepPlugin(),
    // `apply: applyToBuildOrServe` on each Cloudflare sub-plugin keeps the
    // whole integration (Miniflare, the Workers module graph, wrangler
    // config resolution) out of `vp test`'s Vitest config path, matching
    // `assetPrepPlugin` above.
    ...cloudflare({ configPath: 'wrangler.toml' }).map((plugin) => ({
      ...plugin,
      apply: applyToBuildOrServe,
    })),
  ]),
  check: {
    // This repository has never had a formatter gate. Keep that contract while
    // moving its existing lint gate behind `vp check`.
    fmt: false,
  },
  fmt: {
    ignorePatterns: [
      'app-graphics/**',
      'assets/**',
      'class-js/**',
      'docs/historic/**',
      'images/**',
      'l10n/**',
      'multi/**',
      'packages/**/dist/**',
      'packages/socialcalc-headless/**',
      'spikes/**',
      'static/**',
      'tests/**',
      'third-party/**',
      'wikitwig/**',
    ],
  },
  lint: {
    // Match the former Biome `preset: none` contract instead of silently
    // enabling Oxlint's much broader defaults during the toolchain cutover.
    categories: {
      correctness: 'off',
      nursery: 'off',
      pedantic: 'off',
      perf: 'off',
      restriction: 'off',
      style: 'off',
      suspicious: 'off',
    },
    ignorePatterns: [
      'app-graphics/**',
      'assets/**',
      'class-js/**',
      'docs/**',
      'images/**',
      'l10n/**',
      'lemma/**',
      'multi/**',
      'packages/docs/**',
      'packages/**/dist/**',
      'packages/socialcalc-headless/**',
      'spikes/**',
      'static/**',
      'tests/**',
      'third-party/**',
      'wikitwig/**',
    ],
    options: {
      denyWarnings: true,
    },
    rules: {
      'eslint/no-unreachable': 'error',
      'eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          caughtErrors: 'none',
          varsIgnorePattern: '^_',
        },
      ],
      'eslint/prefer-const': 'error',
    },
  },
  test: {
    projects: ['packages/*/vitest.config.ts', 'packages/worker/vitest.node.config.ts'],
    coverage: {
      provider: 'istanbul',
      include: [
        'packages/shared/src/**/*.ts',
        'packages/socketio-shim/src/**/*.ts',
        'packages/migrate/src/**/*.ts',
        'packages/cli/src/**/*.ts',
        'packages/client-multi/src/**/*.{ts,tsx}',
        'packages/client/src/ws-adapter.ts',
        'packages/client/src/socialcalc-callbacks.ts',
        'packages/client/src/main.ts',
        'packages/client/src/graph.ts',
        'packages/client/src/sanitize-html.ts',
        'packages/client/src/passkey/logic.ts',
        'packages/oracle-harness/src/**/*.ts',
        'packages/worker/src/handlers/**/*.ts',
        'packages/worker/src/lib/**/*.ts',
        'packages/worker/src/room.ts',
        'packages/worker/src/auth-do.ts',
      ],
      exclude: [
        'packages/shared/src/index.ts',
        'packages/socketio-shim/src/index.ts',
        'packages/cli/src/index.ts',
        'packages/client-multi/src/App.tsx',
        'packages/client-multi/src/main.tsx',
        'packages/client-multi/src/index.ts',
        'packages/oracle-harness/src/bin.ts',
        'packages/worker/src/lib/ws-upgrade.ts',
      ],
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
