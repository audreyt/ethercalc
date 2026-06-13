/**
 * Smoke test for the single-sheet client (`packages/client/`).
 *
 * The single-sheet client's built bundle (`packages/client/dist/player.js`,
 * copied to `assets/static/player.js` by `scripts/build-assets.sh`) is
 * loaded by the legacy `assets/index.html` page. The Worker now has the
 * Workers Assets binding wired (`[assets] directory = "../../assets"` in
 * `packages/worker/wrangler.toml`), so `wrangler dev` serves the full
 * production-like stack: `GET /:room` returns `index.html`, which pulls in
 * `static/socialcalc.js` (the SocialCalc runtime) and `static/player.js`
 * (our client), and the client mounts the editor into `#tableeditor`.
 *
 * This drives a real Chromium page against the Worker (no Vite needed —
 * the single-sheet client is served by the Worker itself, unlike the
 * multi-sheet SPA) and asserts the SocialCalc single-sheet UI actually
 * boots:
 *
 *   - `window.SocialCalc` is the real runtime (exposes the
 *     `SpreadsheetControl` constructor), not the inline `{ _room }` stub
 *     that `index.html` seeds before `socialcalc.js` loads — proves the
 *     vendored runtime script loaded and ran.
 *   - `player.js` booted: `window.spreadsheet` is a constructed control
 *     object and `SocialCalc.CurrentSpreadsheetControlObject` is set.
 *   - the `#tableeditor` mount point actually rendered the editor grid
 *     (a `<table>` lands inside it once `InitializeSpreadsheetControl`
 *     runs) — catches regressions where the bundle loads but never
 *     mounts.
 *   - no uncaught page errors.
 *
 * Like the multi-sheet smoke, this deliberately does NOT assert on live
 * collaboration / cell content — the WS round-trip and seeded snapshot
 * depend on backend state we don't drive here. The intent is "the
 * single-sheet UI boots and renders," mirroring `client-multi-smoke`.
 */
import { test, expect } from '../src/fixtures.ts';

test.describe('client-single smoke', () => {
  test('SocialCalc single-sheet UI boots at /:room', async ({
    workerBase,
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${workerBase}/smoke-single-room`);

    // The runtime + client load and mount asynchronously: index.html pulls
    // in jquery → socialcalc.js → player.js (a module), then player.js's
    // DOMContentLoaded boot constructs the SpreadsheetControl and renders
    // the grid into #tableeditor. Wait for the rendered editor table.
    const editorTable = page.locator('#tableeditor table').first();
    await expect(editorTable).toBeVisible({ timeout: 15_000 });

    // The real SocialCalc runtime must have replaced the inline
    // `{ _room: ... }` stub from index.html's head script. The stub has no
    // `SpreadsheetControl`; the loaded runtime does.
    const runtime = await page.evaluate(() => {
      const sc = (window as unknown as { SocialCalc?: Record<string, unknown> })
        .SocialCalc;
      return {
        present: !!sc,
        hasControlCtor: typeof sc?.['SpreadsheetControl'] === 'function',
        room: sc?.['_room'] ?? null,
        // `player.js`'s initializeSpreadsheet() constructs the control and
        // parks it on both `window.spreadsheet` and SocialCalc's singleton.
        booted:
          !!(window as unknown as { spreadsheet?: unknown }).spreadsheet &&
          !!sc?.['CurrentSpreadsheetControlObject'],
      };
    });

    expect(runtime.present, 'window.SocialCalc should be defined').toBe(true);
    expect(
      runtime.hasControlCtor,
      'window.SocialCalc should expose the SpreadsheetControl constructor (real runtime, not the index.html stub)',
    ).toBe(true);
    // index.html derives `_room` from the URL path segment before the
    // runtime loads; the client preserves it through boot.
    expect(runtime.room).toBe('smoke-single-room');
    expect(
      runtime.booted,
      'player.js should have constructed the SpreadsheetControl singleton',
    ).toBe(true);

    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(
      0,
    );
  });
});
