import { test, expect } from '../src/fixtures.ts';

test('landing header reflows without horizontal overflow at 320px', async ({
  workerBase,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${workerBase}/_start`);

  const layout = await page.evaluate(() => {
    const brand = document.querySelector<HTMLElement>('.ec-brand')?.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>('.ec-topnav')?.getBoundingClientRect();
    if (!brand || !nav) throw new Error('landing header is missing');
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      brandBottom: brand.bottom,
      navTop: nav.top,
      navRight: nav.right,
    };
  });

  expect(layout.scrollWidth).toBe(layout.clientWidth);
  expect(layout.navRight).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.navTop).toBeGreaterThanOrEqual(layout.brandBottom);
});
