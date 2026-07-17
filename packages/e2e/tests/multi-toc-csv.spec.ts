import { expect, test } from '../src/fixtures.ts';

test.describe('client-multi TOC CSV lifecycle', () => {
  test('cold seed, add, rename, delete, and reload persist the visible tabs', async ({
    workerBase,
    page,
    request,
  }) => {
    const room = 'e2e-multi-toc-csv';
    const roomUrl = `${workerBase}/_/${room}`;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'prompt') {
        await dialog.accept('Renamed');
        return;
      }
      await dialog.accept();
    });

    try {
      await page.goto(`${workerBase}/=${room}`);
      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(1, { timeout: 15_000 });
      await expect(tabs.filter({ hasText: 'Sheet1' })).toBeVisible();

      const addResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === roomUrl &&
          response.request().method() === 'POST' &&
          response.request().headers()['content-type'] === 'text/csv',
      );
      await page.getByRole('button', { name: 'Add' }).click();
      const addResponse = await addResponsePromise;
      expect(addResponse.status()).toBe(202);
      await expect(tabs).toHaveCount(2, { timeout: 10_000 });
      await expect(tabs.filter({ hasText: 'Sheet2' })).toBeVisible();

      const addBody: unknown = await addResponse.json();
      if (
        !addBody ||
        typeof addBody !== 'object' ||
        !('command' in addBody) ||
        !Array.isArray(addBody.command)
      ) {
        throw new Error('CSV POST response did not contain a command array');
      }
      const pasteCommand = addBody.command[1];
      expect(typeof pasteCommand).toBe('string');
      const rowMatch = typeof pasteCommand === 'string' ? /^paste A(\d+) all$/.exec(pasteCommand) : null;
      expect(rowMatch).not.toBeNull();
      const addedRow = Number(rowMatch?.[1]);

      const addGrid: unknown = await (await request.get(`${roomUrl}/csv.json`)).json();
      expect(Array.isArray(addGrid)).toBe(true);
      expect(Array.isArray(addGrid) ? addGrid[addedRow - 1] : undefined).toEqual([
        `/${room}.2`,
        'Sheet2',
      ]);

      const renameResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === roomUrl &&
          response.request().method() === 'POST' &&
          response.request().headers()['content-type'] === 'text/plain',
      );
      await page.getByRole('button', { name: 'Rename...' }).click();
      expect((await renameResponsePromise).status()).toBe(202);
      await expect(tabs.filter({ hasText: 'Renamed' })).toBeVisible({ timeout: 10_000 });

      const renamedGrid: unknown = await (await request.get(`${roomUrl}/csv.json`)).json();
      expect(Array.isArray(renamedGrid) ? renamedGrid[addedRow - 1] : undefined).toEqual([
        `/${room}.2`,
        'Renamed',
      ]);

      const deleteResponsePromise = page.waitForResponse(
        (response) =>
          response.url() === roomUrl &&
          response.request().method() === 'POST' &&
          response.request().headers()['content-type'] === 'text/plain',
      );
      await page.getByRole('button', { name: 'Delete' }).click();
      expect((await deleteResponsePromise).status()).toBe(202);
      await expect(tabs).toHaveCount(1, { timeout: 10_000 });
      await expect(tabs.filter({ hasText: 'Sheet1' })).toBeVisible();

      await page.reload();
      await expect(page.getByRole('tab')).toHaveCount(1, { timeout: 15_000 });
      await expect(page.getByRole('tab').filter({ hasText: 'Sheet1' })).toBeVisible();
      expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
    } finally {
      for (const suffix of ['', '.1', '.2', '.2.bak']) {
        await request.delete(`${workerBase}/_/${room}${suffix}`);
      }
    }
  });
});
