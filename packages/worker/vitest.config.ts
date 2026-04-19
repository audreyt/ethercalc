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
          // D1 binding (Phase 5.1). Miniflare provisions a fresh SQLite
          // database under `env.DB`; tests run the `0001_rooms.sql` DDL
          // explicitly from a `beforeAll` helper in
          // `test/routes-rooms.test.ts` since miniflare does NOT auto-
          // apply `migrations_dir` contents.
          d1Databases: { DB: 'ethercalc_rooms' },
          // Assets binding (Phase 5.2). The P5 config dropped
          // `wrangler.configPath` to dodge the `?raw` + `[[rules]]`
          // collision (§7 item 33), which also dropped the `[assets]`
          // binding and regressed 3 static/* oracle scenarios. Re-bind
          // inline here via the miniflare plugin option — `directory`
          // is resolved relative to this config file. Keeps the oracle
          // scenarios green without re-enabling the `?raw` mangling.
          //
          // `../../assets` points at the repo-root curated dir
          // produced by `scripts/build-assets.sh`. That script MUST
          // run before `test:workers` — CI wires it before the
          // integration step; locally run
          //   bun run --cwd packages/client build &&
          //   bun run --cwd packages/client-multi build &&
          //   ./scripts/build-assets.sh
          assets: {
            directory: '../../assets',
            binding: 'ASSETS',
          },
        },
      },
    },
  },
});
