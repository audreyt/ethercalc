import { defineConfig } from 'vite-plus';

/**
 * Pure-logic tests. Runs in the Node environment (no workerd) so istanbul
 * coverage works. This is where the 100% CI gate is enforced.
 *
 * Sources: `src/handlers/**` and `src/lib/**`. Anything in `src/index.ts`,
 * `src/env.ts`, or `src/room.ts` is excluded — those are Workers-only glue
 * tested via `vitest.config.ts` (without a coverage gate).
 */
export default defineConfig({
  test: {
    // Explicit name: aggregated as a Vitest project by the root
    // vite.config.ts alongside vitest.config.ts, which shares this
    // package's package.json name and would otherwise collide.
    name: 'worker:node',
    include: ['test/**/*.node.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      // Phase 7.1 restored `src/room.ts` to the Node coverage gate. The
      // WS dispatch logic now lives in `src/lib/ws-handlers.ts` (pure,
      // Node-testable); `src/room.ts` retains only the DO storage I/O,
      // hibernation-API entrypoints, and the `#buildWsContext` adapter.
      // Every branch is reachable from direct-construction unit tests
      // (`test/room.node.test.ts`). Hibernation-API glue that can only
      // execute inside workerd (`state.acceptWebSocket`, the upgrade
      // Response w/ status 101, etc.) is quarantined in
      // `src/lib/ws-upgrade.ts` which is excluded below; that module
      // carries its own `istanbul ignore file` banner and an end-to-end
      // pointer to the workers-pool tests that cover it.
      include: [
        'src/handlers/**/*.ts',
        'src/lib/**/*.ts',
        'src/room.ts',
        'src/auth-do.ts',
      ],
      exclude: ['src/lib/ws-upgrade.ts'],
      reporter: ['text', 'json-summary', 'lcov'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
