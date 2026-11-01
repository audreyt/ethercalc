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

  test('tab and button text stays readable under dark system colors', async ({
    workerBase,
    page,
  }) => {
    // The strip paints light backgrounds (#ccc/#eee/#fff). Text that falls
    // back to the system ButtonText colour turns white when the browser
    // resolves system colours from a dark theme, so force that palette.
    await page.goto(`${workerBase}/=test-room-contrast`);
    await expect(page.getByRole('tab').first()).toBeVisible({ timeout: 10_000 });
    await page.addStyleTag({ content: ':root { color-scheme: dark; }' });

    const ratios = await page.evaluate(() => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (c: string) => {
        const [r = 0, g = 0, b = 0] = rgb(c).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return [...document.querySelectorAll<HTMLElement>('button:not(:disabled)')].map((el) => {
        const style = getComputedStyle(el);
        const [hi, lo] = [lum(style.color), lum(style.backgroundColor)].sort((a, b) => b - a);
        return { text: el.textContent, ratio: (hi! + 0.05) / (lo! + 0.05) };
      });
    });
    expect(ratios.length).toBeGreaterThanOrEqual(2);
    for (const { text, ratio } of ratios) {
      expect(ratio, `contrast of "${text}"`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
