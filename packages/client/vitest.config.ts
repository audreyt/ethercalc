import { defineConfig } from 'vitest/config';

/**
 * Client package tests. Run under the Node environment using mock WebSocket
 * and mock SocialCalc so we don't need jsdom. See CLAUDE.md §8 Phase 10.
 *
 * Coverage gate (100%) applies to the WS adapter, SocialCalc callbacks and
 * entry point. `src/graph.ts` is excluded — see the TODO there.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      include: [
        'src/ws-adapter.ts',
        'src/socialcalc-callbacks.ts',
        'src/main.ts',
      ],
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
