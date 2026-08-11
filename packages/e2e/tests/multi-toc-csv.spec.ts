/**
 * Multi-sheet TOC lifecycle under the guarded Add Sheet contract.
 *
 * History: this spec previously waited for `POST /_/{room}` with
 * `Content-Type: text/csv` — the direct parent-TOC write that minted
 * unmarked public children under private parents. Commit `170eaa4`
 * deleted that path for Add Sheet / cold seed; the client now calls
 * `POST /_/={room}/sheet`, which reserves a child id, stamps immutable
 * `meta:parent`, and only then commits the TOC row.
 *
 * The assertions below are a **replacement**, not a relaxation: the
 * user-visible cold-seed / add / rename / delete / reload outcomes are
 * unchanged, and the transport wait pins the guarded request. A second
 * case proves the child came out correctly parented by creating a private
 * parent and asserting that anonymous callers are denied on the child
 * the same way they are on the parent (only true when `meta:parent` is
 * present — an unmarked child would stay public under authorize()).
 */
import type { Page, Response } from '@playwright/test';

import { authTest, expect, test } from '../src/fixtures.ts';

const SHEET_CONTENT_TYPE = 'application/json';

function sheetCreateUrl(base: string, room: string): string {
  return `${base}/_/=${room}/sheet`;
}

function isGuardedSheetCreate(response: Response, sheetUrl: string): boolean {
  if (response.url() !== sheetUrl) return false;
  if (response.request().method() !== 'POST') return false;
  return response.request().headers()['content-type'] === SHEET_CONTENT_TYPE;
}

function isLegacyParentCsvPost(response: Response, roomUrl: string): boolean {
  if (response.url() !== roomUrl) return false;
  if (response.request().method() !== 'POST') return false;
  return response.request().headers()['content-type'] === 'text/csv';
}

interface CreatedSheetBody {
  readonly sheet: {
    readonly subroom: string;
    readonly link: string;
    readonly title: string;
    readonly row: number;
  };
}

function parseCreatedSheetBody(value: unknown): CreatedSheetBody | null {
  if (value === null || typeof value !== 'object' || !('sheet' in value)) return null;
  const sheet = value.sheet;
  if (sheet === null || typeof sheet !== 'object') return null;
  if (!('subroom' in sheet) || typeof sheet.subroom !== 'string' || sheet.subroom.length === 0) {
    return null;
  }
  if (!('link' in sheet) || typeof sheet.link !== 'string' || sheet.link.length === 0) {
    return null;
  }
  if (!('title' in sheet) || typeof sheet.title !== 'string') return null;
  if (
    !('row' in sheet) ||
    typeof sheet.row !== 'number' ||
    !Number.isInteger(sheet.row) ||
    sheet.row < 2
  ) {
    return null;
  }
  return {
    sheet: {
      subroom: sheet.subroom,
      link: sheet.link,
      title: sheet.title,
      row: sheet.row,
    },
  };
}

async function addVirtualAuthenticator(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable', { enableUI: false });
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

function roomFromUrl(url: string): string {
  const segment = new URL(url).pathname.split('/').filter(Boolean)[0];
  if (!segment) throw new Error(`no room segment in URL: ${url}`);
  return segment;
}

test.describe('client-multi TOC lifecycle (guarded sheet create)', () => {
  test('cold seed, add, rename, delete, and reload persist the visible tabs', async ({
    workerBase,
    page,
    request,
  }) => {
    const room = 'e2e-multi-toc-csv';
    const roomUrl = `${workerBase}/_/${room}`;
    const sheetUrl = sheetCreateUrl(workerBase, room);
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
      // Cold seed itself uses the guarded sheet endpoint (not parent CSV).
      const seedResponsePromise = page.waitForResponse((response) =>
        isGuardedSheetCreate(response, sheetUrl),
      );
      await page.goto(`${workerBase}/=${room}`);
      const seedResponse = await seedResponsePromise;
      expect(seedResponse.status()).toBe(201);
      const seedBody = parseCreatedSheetBody(await seedResponse.json());
      if (!seedBody) throw new Error('seed response missing authoritative sheet');
      expect(seedBody.sheet).toMatchObject({
        subroom: `${room}.1`,
        link: `/${room}.1`,
        title: 'Sheet1',
        row: 2,
      });

      const tabs = page.getByRole('tab');
      await expect(tabs).toHaveCount(1, { timeout: 15_000 });
      await expect(tabs.filter({ hasText: 'Sheet1' })).toBeVisible();

      const legacyCsvDuringAdd: string[] = [];
      const onLegacyCsv = (response: Response): void => {
        if (isLegacyParentCsvPost(response, roomUrl)) {
          legacyCsvDuringAdd.push(response.url());
        }
      };
      page.on('response', onLegacyCsv);

      const addResponsePromise = page.waitForResponse((response) =>
        isGuardedSheetCreate(response, sheetUrl),
      );
      await page.getByRole('button', { name: 'Add' }).click();
      const addResponse = await addResponsePromise;
      page.off('response', onLegacyCsv);

      expect(addResponse.status()).toBe(201);
      expect(
        legacyCsvDuringAdd,
        'Add Sheet must not POST text/csv to the parent room (vulnerable legacy contract)',
      ).toHaveLength(0);

      const addBody = parseCreatedSheetBody(await addResponse.json());
      if (!addBody) throw new Error('add response missing authoritative sheet');
      expect(addBody.sheet).toMatchObject({
        subroom: `${room}.2`,
        link: `/${room}.2`,
        title: 'Sheet2',
        row: 3,
      });
      const addedRow = addBody.sheet.row;

      await expect(tabs).toHaveCount(2, { timeout: 10_000 });
      await expect(tabs.filter({ hasText: 'Sheet2' })).toBeVisible();

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

authTest.describe('private multi-sheet child inherits parent ACL via meta:parent', () => {
  authTest(
    'guarded Add Sheet under a private parent denies anonymous child access',
    async ({ authWorkerBase, page, browser }) => {
      authTest.setTimeout(90_000);

      await page.goto(`${authWorkerBase}/_start`);
      await addVirtualAuthenticator(page);

      await page.getByRole('button', { name: 'Create private sheet' }).click();
      const dialog = page.locator('#ec-passkey-dialog');
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Create a new passkey' }).click();

      await page.waitForURL(/\/[^/]+\/edit$/, { timeout: 15_000 });
      const room = roomFromUrl(page.url());
      expect(room.length).toBeGreaterThan(0);

      const roomUrl = `${authWorkerBase}/_/${room}`;
      const sheetUrl = sheetCreateUrl(authWorkerBase, room);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      try {
        const seedResponsePromise = page.waitForResponse((response) =>
          isGuardedSheetCreate(response, sheetUrl),
        );
        await page.goto(`${authWorkerBase}/=${room}`);
        const seedResponse = await seedResponsePromise;
        expect(seedResponse.status()).toBe(201);
        const seedBody = parseCreatedSheetBody(await seedResponse.json());
        if (!seedBody) throw new Error('private seed response missing authoritative sheet');
        expect(seedBody.sheet.subroom).toBe(`${room}.1`);

        const tabs = page.getByRole('tab');
        await expect(tabs).toHaveCount(1, { timeout: 15_000 });
        await expect(tabs.filter({ hasText: 'Sheet1' })).toBeVisible();

        const legacyCsvDuringAdd: string[] = [];
        const onLegacyCsv = (response: Response): void => {
          if (isLegacyParentCsvPost(response, roomUrl)) {
            legacyCsvDuringAdd.push(response.url());
          }
        };
        page.on('response', onLegacyCsv);

        const addResponsePromise = page.waitForResponse((response) =>
          isGuardedSheetCreate(response, sheetUrl),
        );
        await page.getByRole('button', { name: 'Add' }).click();
        const addResponse = await addResponsePromise;
        page.off('response', onLegacyCsv);

        expect(addResponse.status()).toBe(201);
        expect(
          legacyCsvDuringAdd,
          'Add Sheet must not POST text/csv to the private parent (vulnerable legacy contract)',
        ).toHaveLength(0);

        const addBody = parseCreatedSheetBody(await addResponse.json());
        if (!addBody) throw new Error('private add response missing authoritative sheet');
        const childRoom = addBody.sheet.subroom;
        expect(childRoom).toBe(`${room}.2`);
        expect(addBody.sheet.link).toBe(`/${room}.2`);
        expect(addBody.sheet.title).toBe('Sheet2');

        await expect(tabs).toHaveCount(2, { timeout: 10_000 });
        await expect(tabs.filter({ hasText: 'Sheet2' })).toBeVisible();

        // Owner can read the child (session cookie on page.request).
        const ownerChild = await page.request.get(`${authWorkerBase}/_/${childRoom}`);
        expect(ownerChild.status()).toBe(200);

        const ownerChildAccessRaw: unknown = await (
          await page.request.get(`${authWorkerBase}/_/${childRoom}/access`)
        ).json();
        expect(ownerChildAccessRaw).toEqual({
          isPrivate: true,
          canRead: true,
          canWrite: true,
        });

        // Anonymous callers must be denied on the child. Without meta:parent,
        // authorize() would treat the unmarked child as public and return 200.
        const anonContext = await browser.newContext();
        try {
          const anonPage = await anonContext.newPage();
          const anonParent = await anonPage.request.get(`${authWorkerBase}/_/${room}`);
          expect(anonParent.status()).toBe(403);
          const anonChild = await anonPage.request.get(`${authWorkerBase}/_/${childRoom}`);
          expect(
            anonChild.status(),
            'anonymous child read must be 403 when meta:parent is stamped; 200 means the child is public',
          ).toBe(403);

          const anonChildAccess = await anonPage.request.get(
            `${authWorkerBase}/_/${childRoom}/access`,
          );
          expect(anonChildAccess.status()).toBe(200);
          expect(await anonChildAccess.json()).toEqual({
            isPrivate: true,
            canRead: false,
            canWrite: false,
          });
        } finally {
          await anonContext.close();
        }

        expect(errors, `uncaught page errors: ${errors.join(' | ')}`).toHaveLength(0);
      } finally {
        // Owner-authenticated cleanup (page.request carries the session).
        for (const suffix of ['', '.1', '.2', '.2.bak']) {
          await page.request.delete(`${authWorkerBase}/_/${room}${suffix}`);
        }
      }
    },
  );
});
