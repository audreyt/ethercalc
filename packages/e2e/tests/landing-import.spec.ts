/**
 * Landing-page import smoke tests.
 *
 * These exercise the production `start.html` upload script through the Worker's
 * static asset route and then assert the imported room through the HTTP export
 * API. The workbook cases force the non-`readAsBinaryString` FileReader branch
 * so the ArrayBuffer payload reaches `xlsxworker`/`fixdata` unchanged.
 */
import { fileURLToPath } from 'node:url';

import type { APIRequestContext, Page } from '@playwright/test';
import { test, expect } from '../src/fixtures.ts';

const XLSX_BASIC = fileURLToPath(
  new URL('../../oracle-harness/test/fixtures/xlsx/basic.xlsx', import.meta.url),
);
const ODS_BASIC = fileURLToPath(
  new URL('../../oracle-harness/test/fixtures/ods/basic.ods', import.meta.url),
);

async function openLanding(workerBase: string, page: Page) {
  await page.goto(`${workerBase}/_start`);
  await expect(page.getByRole('heading', { name: 'Share the URL. Edit together.' })).toBeVisible();
}

async function importNamedFile(args: {
  page: Page;
  room: string;
  file: string | { name: string; mimeType: string; buffer: Buffer };
}) {
  const { page, room, file } = args;
  await page.locator('#rename_sheet').check();
  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept(room);
  });
  await page.locator('#ec-file-input').setInputFiles(file);
  await page.waitForURL(new RegExp(`/${room}(?:[?#].*)?$`));
}

async function expectGrid(args: {
  workerBase: string;
  request: APIRequestContext;
  room: string;
  expected: string[][];
}) {
  const res = await args.request.get(`${args.workerBase}/_/${args.room}/csv.json`);
  expect(res.status()).toBe(200);
  await expect(res).toBeOK();
  expect(await res.json()).toEqual(args.expected);
}

test.describe('landing page import', () => {
  test('imports UTF-8 CSV through the default binary-string FileReader path', async ({
    workerBase,
    page,
    request,
  }) => {
    await openLanding(workerBase, page);
    const room = 'e2e-import-csv-utf8';
    await importNamedFile({
      page,
      room,
      file: {
        name: 'utf8.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('café,東京\n', 'utf8'),
      },
    });
    await expectGrid({ workerBase, request, room, expected: [['café', '東京']] });
  });

  test('imports xlsx via the ArrayBuffer FileReader fallback', async ({
    workerBase,
    page,
    request,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(FileReader.prototype, 'readAsBinaryString', {
        configurable: true,
        value: undefined,
      });
    });
    await openLanding(workerBase, page);
    await importNamedFile({
      page,
      room: 'e2e-import-xlsx-arraybuffer',
      file: XLSX_BASIC,
    });
    await expectGrid({ workerBase, request, room: 'e2e-import-xlsx-arraybuffer', expected: [['hello'], ['42']] });
  });

  test('imports ods via the ArrayBuffer FileReader fallback', async ({
    workerBase,
    page,
    request,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(FileReader.prototype, 'readAsBinaryString', {
        configurable: true,
        value: undefined,
      });
    });
    await openLanding(workerBase, page);
    await importNamedFile({
      page,
      room: 'e2e-import-ods-arraybuffer',
      file: ODS_BASIC,
    });
    await expectGrid({ workerBase, request, room: 'e2e-import-ods-arraybuffer', expected: [['hello'], ['42']] });
  });
});
