import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        singleWorker: true,
        miniflare: {
          compatibilityDate: '2024-11-12',
          compatibilityFlags: ['nodejs_compat'],
        },
      },
    },
  },
});
