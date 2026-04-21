import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      singleWorker: true,
      miniflare: {
        compatibilityDate: '2024-11-12',
        compatibilityFlags: ['nodejs_compat'],
      },
    }),
  ],
});
