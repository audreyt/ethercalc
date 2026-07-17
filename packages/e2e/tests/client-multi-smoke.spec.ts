/**
 * Smoke test for the multi-sheet SPA (`packages/client-multi/`).
 *
 * The multi-sheet React SPA is built to `packages/client-multi/dist/` and curated into
 * the Worker's production-like asset bundle (copied to `assets/multi/` by `scripts/build-assets.ts`).
 *
 * The Worker mounts this bundle under the Workers Assets pipeline (`[assets] directory = "../../assets"`).
 * Requests to `GET /=:room` are routed by `buildRoomEntry()` to serve `/multi/index.html`. The browser
 * loads the production asset bundle from `/multi/assets/...` and the app mounts.
 *
 * Asserts:
 *   - the page mounts (#root has children)
 *   - the Radix tablist renders with at least one tab
 *   - no uncaught page errors
 *   - no console errors (the backend is fully wired, so the Foldr fetch succeeds and has no errors)
 *
 * Purpose: catch regressions in the React boot path, Radix component wiring,
 * and the URL parser in `src/url.ts`.
 */
import { expect, test } from '../src/fixtures.ts';

test.describe('client-multi smoke', () => {
  test('SPA mounts at /=test-room with Radix tab UI', async ({
    workerBase,
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // Assert no console errors.
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${workerBase}/=test-room`);
    // Boot is async — Foldr.fetch awaits a network round-trip and the
    // empty-state seeding adds another POST. React renders after both.
    const tablist = page.getByRole('tablist');
    await expect(tablist).toBeVisible({ timeout: 10_000 });

    // At least one Radix tab should render; after the seeded "Sheet1"
    // row lands there is exactly one. We assert >=1 to be tolerant of
    // future changes to the empty-state seed.
    const tabCount = await page.getByRole('tab').count();
    expect(tabCount).toBeGreaterThanOrEqual(1);

    // The active sheet frame should occupy most of the viewport. This catches
    // layout regressions where the tab strip becomes the containing block and
    // the iframe collapses to 0px height.
    const iframe = page.locator('iframe').first();
    await expect(iframe).toBeVisible();
    const box = await iframe.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(400);

    // No console errors.
    expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    // No uncaught exceptions in the page context.
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(
      0,
    );
  });
});
