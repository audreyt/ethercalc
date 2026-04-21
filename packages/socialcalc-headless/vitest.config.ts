import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

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
});
