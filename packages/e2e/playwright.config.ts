import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the EtherCalc e2e suite.
 *
 * Boot strategy (see also `packages/e2e/README.md`):
 *
 *   Each spec file declares which backend it needs via fixtures imported
 *   from `src/fixtures.ts` (wrangler Worker) and/or `src/fixtures-client.ts`
 *   (client-multi Vite preview). Fixtures use `scope: 'worker'`, so each
 *   Playwright worker boots at most one wrangler and one Vite preview
 *   instance, allocated on random ports. This keeps tests isolated when
 *   Playwright parallelizes, without the race conditions a shared
 *   `webServer` config would introduce against `wrangler dev`'s slow
 *   Miniflare warmup.
 *
 *   We intentionally do NOT declare a top-level `webServer` block — letting
 *   fixtures own process lifetime keeps tear-down deterministic and avoids
 *   double-booting wrangler on CI. The trade-off is that each worker pays
 *   the ~6-second wrangler cold start once; for a 5-spec suite with
 *   `workers: 1` (the default in CI) that's a single cold start.
 *
 * Browsers:
 *   Chromium only per CLAUDE.md §11.2 — Firefox/WebKit land in nightly.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env['CI'] ? 1 : 0,
  fullyParallel: false,
  // One worker keeps Miniflare startup contention down; local dev can
  // override with `--workers=<n>`.
  workers: 1,
  reporter: process.env['CI']
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    actionTimeout: 10_000,
    // Fixtures return their own base URLs; tests navigate with absolute
    // URLs. Leaving `baseURL` unset so an accidental `page.goto('/foo')`
    // fails loudly instead of hitting the wrong backend.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
