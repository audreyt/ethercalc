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
