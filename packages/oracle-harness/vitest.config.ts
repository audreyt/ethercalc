import { defineConfig } from 'vitest/config';

/**
 * Oracle-harness unit tests run in Node (no workerd needed — we only send
 * HTTP/WS traffic to a target URL). Istanbul coverage is gated at 100% on
 * `src/**` so new helpers can't ship without tests.
 *
 * `src/cli.ts` is the thin bin entry; its core `main()` is exported and
 * tested, but the top-level `import.meta.main` guard is excluded — bun
 * runs that, not vitest.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      include: ['src/**/*.ts'],
      // bin.ts is a 5-line shim that calls main() and exits — exercised by
      // `bun run record`/`bun run replay`, not by vitest. Everything else
      // (cli logic, matchers, recorder, replayer) is 100% gated.
      exclude: ['src/bin.ts'],
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
