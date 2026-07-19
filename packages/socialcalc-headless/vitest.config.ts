import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vite-plus';

// Pool-workers 0.14.x dropped the `singleWorker` / `isolatedStorage`
// options — the plugin now always runs tests in one isolate per file
// with storage isolation the default. No replacement needed for the
// smoke suite below, which has a single test file.
export default defineConfig({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: '2024-11-12',
        compatibilityFlags: ['nodejs_compat'],
      },
    }),
  ],
  test: {
    // build.js reads real files via node:fs, which workerd/miniflare
    // (this pool) can't do — its focused test runs under
    // vitest.node.config.ts instead. Scope discovery to this package's
    // own test/ dir (mirrors packages/worker's include/exclude split) so
    // overriding `exclude` doesn't also drop Vitest's default
    // node_modules exclude.
    include: ['test/**/*.test.ts'],
    exclude: ['test/**/*.node.test.ts'],
  },
});
