import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the EtherCalc e2e suite.
 *
 * Boot strategy (see also `packages/e2e/README.md`):
 *
 *   Each spec file declares which backend it needs via fixtures imported
 *   from `src/fixtures.ts`. The standard fixture boots the Worker and its
 *   production Workers Assets bundle; the additive `authTest` fixture boots
 *   a second Worker with localhost WebAuthn trust anchors. Fixtures use
 *   `scope: 'worker'`, so each Playwright worker owns its process lifetime
 *   and random port without a shared `webServer`.
 *
 *   We intentionally do NOT declare a top-level `webServer` block — letting
 *   fixtures own process lifetime keeps tear-down deterministic and avoids
 *   double-booting wrangler on CI. The suite runs one Playwright worker to
 *   keep Miniflare startup contention down.
 *
 * Browsers:
 *   Chromium only. Firefox/WebKit coverage is not configured yet (P2).
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
