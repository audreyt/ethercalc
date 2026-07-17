import { defineConfig } from 'vite-plus';

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
export default defineConfig({
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
  },
});
