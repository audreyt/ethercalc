/**
 * Multi-sheet tab rename must keep sibling tabs mounted (#635).
 */
import { test, expect } from '../src/fixtures.ts';

test.describe('client-multi rename keeps tabs', () => {
  test('renaming one tab leaves the other visible', async ({
    workerBase,
    page,
    request,
  }) => {
    const room = 'e2e-multi-rename';
    const tocCsv = [
      'url,title',
      '/e2e-multi-rename.1,Alpha',
      '/e2e-multi-rename.2,Beta',
    ].join('\n');
    expect(
      (await request.put(`${workerBase}/_/${room}`, {
        headers: { 'Content-Type': 'text/csv' },
        data: tocCsv,
      })).status(),
    ).toBe(201);
    for (const suffix of ['.1', '.2']) {
      expect(
        (await request.put(`${workerBase}/_/${room}${suffix}`, {
          headers: { 'Content-Type': 'text/plain' },
          data: 'cell:A1:t:ok:1',
        })).status(),
      ).toBe(201);
    }

    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Gamma');
      }
    });

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${workerBase}/=${room}`);
    await expect(page.getByRole('tablist')).toBeVisible({ timeout: 15_000 });
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(2, { timeout: 10_000 });

    await page.getByRole('button', { name: 'Rename...' }).click();

    await expect(tabs.filter({ hasText: 'Gamma' })).toBeVisible({ timeout: 10_000 });
    await expect(tabs.filter({ hasText: 'Beta' })).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});