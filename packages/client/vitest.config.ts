import { defineConfig } from 'vite-plus';

/**
 * Client package tests. Run under the Node environment using mock WebSocket
 * and mock SocialCalc so we don't need jsdom. See AGENTS.md §8 Phase 10.
 *
 * Coverage gate (100%) applies to ws-adapter, socialcalc-callbacks, main,
 * graph, sanitize-html, and passkey/logic (the M3E passkey UI's DOM-free
 * module — `passkey/ui.ts` itself is browser-only, verified by Playwright,
 * and deliberately excluded here: importing `@m3e/web/*` under Node would
 * exercise its browser-only side effects incorrectly, see the design doc).
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
        'src/graph.ts',
        'src/sanitize-html.ts',
        'src/passkey/logic.ts',
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
