import { defineConfig } from 'vite-plus';

/**
 * Build-script tests only. `scripts/build.js` reads real files via
 * `node:fs` — miniflare/workerd (the default `vitest.config.ts` pool) has
 * no real filesystem, so these must run under plain Node. Mirrors
 * `packages/worker/vitest.node.config.ts` (explicit `name` avoids the
 * shared-package-name project collision when aggregated at the repo root).
 */
export default defineConfig({
  test: {
    name: 'socialcalc-headless:node',
    include: ['test/**/*.node.test.ts'],
    environment: 'node',
  },
});
