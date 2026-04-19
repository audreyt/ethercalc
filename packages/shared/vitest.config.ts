import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // index.ts is re-exports only, no runtime branches.
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
