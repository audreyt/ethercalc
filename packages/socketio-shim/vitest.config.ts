import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // index.ts is a barrel re-export; client/legacy-io.ts exports only a
      // string constant whose runtime behavior is evaluated inside test/
      // legacy-io.test.ts. Both are excluded from the gate for the same
      // reason shared/index.ts is: no conditional branches.
      exclude: ['src/index.ts'],
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
