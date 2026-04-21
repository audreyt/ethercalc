import { cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

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
 *
 * Pool-workers 0.14.x replaced `defineWorkersConfig({ poolOptions.workers })`
 * with the `cloudflareTest()` plugin pattern. Same options moved up under
 * the plugin call. See `dist/codemods/vitest-v3-to-v4.mjs` shipped with the
 * package.
 */
export default defineConfig({
  plugins: [
    cloudflareTest({
      singleWorker: true,
      // Disable per-test isolated storage — we hit a Miniflare SQLite
      // shm file tracking bug (AssertionError: Expected .sqlite, got
      // …sqlite-shm) whenever a route test goes worker.fetch → DO →
      // storage. Tests below use unique room names + deleteAll guards
      // where shared state would cause false positives.
      isolatedStorage: false,
      // Don't point at wrangler.toml — its `[[rules]]` for `SocialCalc.js`
      // (needed by `wrangler deploy --dry-run`) ends up merged into
      // miniflare's modulesRules, which then mangles `?raw` imports via
      // `?mf_vitest_force=Text`. Supply the DO binding + entry script
      // directly instead.
      main: './src/index.ts',
      miniflare: {
        compatibilityDate: '2024-11-12',
        compatibilityFlags: ['nodejs_compat'],
        durableObjects: {
          ROOM: { className: 'RoomDO', unsafeUniqueKey: 'RoomDO' },
        },
        // D1 binding (Phase 5.1).
        d1Databases: { DB: 'ethercalc_rooms' },
        // Assets binding (Phase 5.2).
        assets: {
          directory: '../../assets',
          binding: 'ASSETS',
        },
      },
    }),
  ],
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/**/*.node.test.ts'],
  },
});
