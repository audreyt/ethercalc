import { defineConfig } from 'vitest/config';

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
    include: ['test/**/*.node.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      include: ['src/handlers/**/*.ts', 'src/lib/**/*.ts', 'src/room.ts'],
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
