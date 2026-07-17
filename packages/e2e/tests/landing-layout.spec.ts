import { test, expect } from '../src/fixtures.ts';

test('landing nav floats top-right without colliding or overflowing across widths', async ({
  workerBase,
  page,
}) => {
  // 320-400: nav drops below the title (see the ≤400px CSS breakpoint).
  // 401-880: nav floats beside the title in the same visual row.
  // 880+: page content is capped at max-width, nav still viewport-anchored.
  const widths = [320, 360, 400, 401, 500, 680, 768, 900, 1280];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(`${workerBase}/_start`);

    const layout = await page.evaluate(() => {
      const brand = document.querySelector<HTMLElement>('.ec-brand')?.getBoundingClientRect();
      const nav = document.querySelector<HTMLElement>('.ec-floatnav')?.getBoundingClientRect();
      const sheet = document.querySelector<HTMLElement>('.ec-sheet')?.getBoundingClientRect();
      if (!brand || !nav || !sheet) throw new Error('landing header is missing');
      // Two axis-aligned rects intersect only if they overlap on BOTH axes.
      const intersects = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        navLeft: nav.left,
        navRight: nav.right,
        collidesBrand: intersects(nav, brand),
        collidesSheet: intersects(nav, sheet),
      };
    });

    expect.soft(layout.scrollWidth, `overflow at ${width}px`).toBe(layout.clientWidth);
    expect.soft(layout.navLeft, `nav off-screen left at ${width}px`).toBeGreaterThanOrEqual(0);
    expect
      .soft(layout.navRight, `nav overflows right at ${width}px`)
      .toBeLessThanOrEqual(layout.clientWidth);
    expect.soft(layout.collidesBrand, `nav collides with brand at ${width}px`).toBe(false);
    expect.soft(layout.collidesSheet, `nav collides with sheet at ${width}px`).toBe(false);
  }
});

test('landing nav stays fixed in the viewport corner while the page scrolls', async ({
  workerBase,
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${workerBase}/_start`);

  const before = await page.locator('.ec-floatnav').boundingBox();
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForFunction(() => window.scrollY > 0);
  const after = await page.locator('.ec-floatnav').boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(after?.y).toBe(before?.y);
  expect(after?.x).toBe(before?.x);
});

test('credits maintainer Audrey Tang on the landing page', async ({
  workerBase,
  page,
}) => {
  await page.goto(`${workerBase}/_start`);

  const credit = page.locator('.ec-facts');
  await expect(credit).toHaveText('By Audrey Tang since 2011');
  await expect(credit.getByRole('link', { name: 'Audrey Tang' })).toHaveAttribute(
    'href',
    'https://audreyt.org/',
  );
});
