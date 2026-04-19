import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

/**
 * Integration tests (in workerd). Covers Hono routing + DO wiring end-to-end.
 *
 * Coverage is intentionally NOT enforced here because neither `istanbul` nor
 * `v8` providers reliably track hits through the workerd bundle —
 * vitest-pool-workers runs tests in a separate runtime that neither
 * provider can instrument end-to-end. See CLAUDE.md §5.2 for the split
 * strategy: pure logic lives in `src/handlers/**` and `src/lib/**` and is
 * covered by `vitest.node.config.ts` (vanilla Node environment, full
 * instanbul coverage). The 100% CI gate applies to that config.
 */
export default defineWorkersConfig({
  test: {
    // Only `.test.ts` (not `.node.test.ts`) — those go through vitest.node.config.ts.
    include: ['test/**/*.test.ts'],
    exclude: ['test/**/*.node.test.ts'],
    poolOptions: {
      workers: {
        singleWorker: true,
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          compatibilityDate: '2024-11-12',
          compatibilityFlags: ['nodejs_compat'],
        },
      },
    },
  },
});
