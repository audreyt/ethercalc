/**
 * Smoke test for the single-sheet client (`packages/client/`).
 *
 * The single-sheet client's `dist/player.js` is designed to be loaded by
 * the legacy `index.html` page that Workers Assets will serve in Phase
 * 11. Today the Worker does NOT yet have an `[assets]` binding wired
 * (see `packages/worker/wrangler.toml`), so there is no production-like
 * way to serve `index.html` + `player.js` + `SocialCalc.js` together
 * through the worker.
 *
 * Building a bespoke static server here just for this smoke test would
 * be duplicative (Phase 11 will deliver the real thing). We skip until
 * Phase 11 lands the curated `assets/` directory.
 */
import { test } from '@playwright/test';

test.skip(
  'single-sheet SocialCalc boots (deferred: Phase 11 asset pipeline)',
  () => {
    // Placeholder — when Phase 11 wires Workers Assets, swap the `test.skip`
    // for a normal `test(...)` that navigates to `${workerBase}/<room>` and
    // asserts `window.SocialCalc` is defined. See
    // `packages/worker/src/routes/assets.ts` for the fallback the test
    // currently hits (404 until ASSETS is bound).
  },
);
