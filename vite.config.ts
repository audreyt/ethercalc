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
// `bun run --cwd packages/<pkg> test`. packages/e2e (Playwright),
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
  test: {
    projects: ['packages/*/vitest.config.ts', 'packages/worker/vitest.node.config.ts'],
  },
});
