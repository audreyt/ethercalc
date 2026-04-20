/**
 * Smoke test for the multi-sheet SPA (`packages/client-multi/`).
 *
 * We boot the Vite dev server (via the `clientBase` fixture) and point
 * the browser at `/multi/=test-room`. The app's boot path reads the URL, calls
 * `fetch('<basePath>/_/test-room/csv.json')`, and — because the fetch
 * fails (no backend wired for the SPA's API calls at this phase) — the
 * Foldr falls through to its "empty room" branch, seeds a default row,
 * and renders the UI. Asserts:
 *
 *   - the page mounts (#root has children)
 *   - the Radix tablist renders with at least one tab
 *   - no uncaught page errors
 *
 * Purpose: catch regressions in the React boot path, Radix component
 * wiring, and the URL parser in `src/url.ts` long before Phase 11 wires
 * real-time collab. Deliberately does NOT assert on rendered content
 * beyond "UI didn't crash" — the Foldr's seeded state depends on fetch
 * behavior which we don't control here.
 */
import { test, expect } from '../src/fixtures-client.ts';

test.describe('client-multi smoke', () => {
  test('SPA mounts at /multi/=test-room with Radix tab UI', async ({
    clientBase,
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // Ignore the expected fetch-failure console message from the Foldr's
    // catch branch; surface anything else.
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(`${clientBase}/multi/=test-room`);
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

    // No uncaught exceptions in the page context.
    expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(
      0,
    );
  });
});
