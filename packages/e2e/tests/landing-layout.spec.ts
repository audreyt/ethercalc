import { test, expect } from '../src/fixtures.ts';

test('landing nav floats top-right without colliding or overflowing at 320px', async ({
  workerBase,
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto(`${workerBase}/_start`);

  const layout = await page.evaluate(() => {
    const brand = document.querySelector<HTMLElement>('.ec-brand')?.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>('.ec-floatnav')?.getBoundingClientRect();
    if (!brand || !nav) throw new Error('landing header is missing');
    // Two axis-aligned rects intersect only if they overlap on BOTH axes.
    const overlapsX = nav.left < brand.right && brand.left < nav.right;
    const overlapsY = nav.top < brand.bottom && brand.top < nav.bottom;
    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      navLeft: nav.left,
      navRight: nav.right,
      collides: overlapsX && overlapsY,
    };
  });

  expect(layout.scrollWidth).toBe(layout.clientWidth);
  expect(layout.navLeft).toBeGreaterThanOrEqual(0);
  expect(layout.navRight).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.collides).toBe(false);
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
  await expect(credit).toHaveText(
    'Maintained by Audrey Tang · Open source, built for everyone.',
  );
  await expect(credit.getByRole('link', { name: 'Audrey Tang' })).toHaveAttribute(
    'href',
    'https://audreyt.org/',
  );
});
