/**
 * Landing-page import smoke tests.
 *
 * These exercise the production `start.html` upload script through the
 * Worker's static asset route, then assert the imported room through the HTTP
 * export API. The fallback cases remove `readAsBinaryString` so the ArrayBuffer
 * payload reaches `xlsxworker`/`fixdata` unchanged.
 *
 * Named import (checkbox ticked + non-empty name) fires two sequential
 * dialogs: a `prompt` for the room id, then a `confirm` overwrite guard.
 * Cancel on confirm aborts that file only (no silent random id, no PUT).
 */
import { fileURLToPath } from 'node:url';

import type { APIRequestContext, Dialog, Page } from '@playwright/test';
import { test, expect } from '../src/fixtures.ts';

const XLSX_BASIC = fileURLToPath(
  new URL('../../oracle-harness/test/fixtures/xlsx/basic.xlsx', import.meta.url),
);
const ODS_BASIC = fileURLToPath(
  new URL('../../oracle-harness/test/fixtures/ods/basic.ods', import.meta.url),
);

type UploadFile = string | { name: string; mimeType: string; buffer: Buffer };

async function openLanding(workerBase: string, page: Page) {
  await page.goto(`${workerBase}/_start`);
  await expect(
    page.getByRole('heading', { name: 'Share the URL. Edit together.' }),
  ).toBeVisible();
}

/**
 * Handle the named-import dialog pair: accept the room-name prompt, then
 * accept or dismiss the overwrite confirm. Mirrors multi-toc-csv's
 * type-branching `page.on('dialog')` pattern rather than a one-shot
 * `page.once` (which only consumes the prompt and leaves confirm hanging).
 */
function installNamedImportDialogHandler(
  page: Page,
  room: string,
  confirmAction: 'accept' | 'dismiss',
): {
  dialogs: Dialog[];
  /** Resolves only after the confirm dialog.accept/dismiss promise settles. */
  confirmHandled: Promise<void>;
  dispose: () => void;
} {
  const dialogs: Dialog[] = [];
  let resolveConfirmHandled!: () => void;
  let rejectConfirmHandled!: (err: unknown) => void;
  const confirmHandled = new Promise<void>((resolve, reject) => {
    resolveConfirmHandled = resolve;
    rejectConfirmHandled = reject;
  });
  // Avoid unhandled rejection if the accept path never hits confirm.
  confirmHandled.catch(() => {});

  const onDialog = async (dialog: Dialog) => {
    dialogs.push(dialog);
    if (dialog.type() === 'prompt') {
      expect(dialogs.filter((d) => d.type() === 'prompt')).toHaveLength(1);
      await dialog.accept(room);
      return;
    }
    if (dialog.type() === 'confirm') {
      expect(dialogs.filter((d) => d.type() === 'confirm')).toHaveLength(1);
      expect(dialog.message()).toContain(`"${room}"`);
      expect(dialog.message()).toMatch(/completely replaced/i);
      try {
        if (confirmAction === 'accept') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
        resolveConfirmHandled();
      } catch (err) {
        rejectConfirmHandled(err);
        throw err;
      }
      return;
    }
    // Unexpected alert/beforeunload — fail closed rather than auto-accept.
    await dialog.dismiss();
    const err = new Error(
      `unexpected dialog type during named import: ${dialog.type()}`,
    );
    rejectConfirmHandled(err);
    throw err;
  };
  page.on('dialog', onDialog);
  return {
    dialogs,
    confirmHandled,
    dispose: () => {
      page.off('dialog', onDialog);
    },
  };
}

async function importNamedFile(args: {
  page: Page;
  room: string;
  file: UploadFile;
  /** Default accept — existing happy-path cases land in the named room. */
  confirmAction?: 'accept' | 'dismiss';
}) {
  const { page, room, file, confirmAction = 'accept' } = args;
  await page.locator('#rename_sheet').check();
  const handler = installNamedImportDialogHandler(page, room, confirmAction);
  try {
    await page.locator('#ec-file-input').setInputFiles(file);
    if (confirmAction === 'accept') {
      await page.waitForURL(new RegExp(`/${room}(?:[?#].*)?$`));
    } else {
      // Cancel aborts before any PUT/navigation. Wait until dismiss has
      // fully settled (not merely been queued) and importFiles has run
      // its synchronous `if (!started) setBusy(false)` completion path
      // — aria-busy clearing is that signal. Only then is it safe to
      // assert the seeded room was not overwritten.
      await handler.confirmHandled;
      await expect(page.locator('#drop')).not.toHaveAttribute('aria-busy', 'true');
      await expect(page).not.toHaveURL(new RegExp(`/${room}(?:[?#].*)?$`));
      const path = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
      expect(
        path === '/' || path === '/_start',
        `expected to remain on landing after dismiss, got ${path}`,
      ).toBe(true);
    }
  } finally {
    handler.dispose();
  }
  return handler.dialogs;
}


async function expectGrid(args: {
  workerBase: string;
  request: APIRequestContext;
  room: string;
  expected: string[][];
}) {
  const res = await args.request.get(
    `${args.workerBase}/_/${args.room}/csv.json`,
  );
  expect(res.status()).toBe(200);
  await expect(res).toBeOK();
  expect(await res.json()).toEqual(args.expected);
}

test.describe('landing page import', () => {
  test('imports one-column UTF-8 CSV without a final newline', async ({
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
        buffer: Buffer.from('café\n東京', 'utf8'),
      },
    });
    await expectGrid({
      workerBase,
      request,
      room,
      expected: [['café'], ['東京']],
    });
  });

  test('does not UTF-8 decode a zipped workbook on the main thread', async ({
    workerBase,
    page,
    request,
  }) => {
    await openLanding(workerBase, page);
    await page.evaluate(() => {
      Object.defineProperty(window, 'TextDecoder', {
        configurable: true,
        value: class {
          decode(): never {
            throw new Error('workbook payload reached TextDecoder');
          }
        },
      });
    });
    await importNamedFile({
      page,
      room: 'e2e-import-xlsx-no-main-thread-decode',
      file: XLSX_BASIC,
    });
    await expectGrid({
      workerBase,
      request,
      room: 'e2e-import-xlsx-no-main-thread-decode',
      expected: [['hello'], ['42']],
    });
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
    await expectGrid({
      workerBase,
      request,
      room: 'e2e-import-xlsx-arraybuffer',
      expected: [['hello'], ['42']],
    });
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
    await expectGrid({
      workerBase,
      request,
      room: 'e2e-import-ods-arraybuffer',
      expected: [['hello'], ['42']],
    });
  });

  test('named import accepts overwrite confirm and lands in the named room', async ({
    workerBase,
    page,
    request,
  }) => {
    await openLanding(workerBase, page);
    const room = 'e2e-import-confirm-accept';
    const dialogs = await importNamedFile({
      page,
      room,
      file: {
        name: 'guard-accept.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('accepted-guard\n', 'utf8'),
      },
      confirmAction: 'accept',
    });
    expect(dialogs.map((d) => d.type())).toEqual(['prompt', 'confirm']);
    await expectGrid({
      workerBase,
      request,
      room,
      expected: [['accepted-guard']],
    });
  });

  test('named import dismisses overwrite confirm and leaves the seeded room untouched', async ({
    workerBase,
    page,
    request,
  }) => {
    const room = 'e2e-import-confirm-dismiss';
    const seedCsv = 'seed-marker,keep-me\npre-existing,content';
    const seedRes = await request.put(`${workerBase}/_/${room}`, {
      headers: { 'Content-Type': 'text/csv' },
      data: seedCsv,
    });
    expect(seedRes.status()).toBe(201);

    const seeded = await request.get(`${workerBase}/_/${room}/csv.json`);
    expect(seeded.status()).toBe(200);
    const seededGrid = await seeded.json();
    expect(seededGrid).toEqual([
      ['seed-marker', 'keep-me'],
      ['pre-existing', 'content'],
    ]);

    await openLanding(workerBase, page);
    const dialogs = await importNamedFile({
      page,
      room,
      file: {
        name: 'would-overwrite.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('OVERWRITE-SHOULD-NOT-LAND\n', 'utf8'),
      },
      confirmAction: 'dismiss',
    });
    expect(dialogs.map((d) => d.type())).toEqual(['prompt', 'confirm']);
    // Still on landing; the destructive PUT never ran.
    await expect(page).not.toHaveURL(new RegExp(`/${room}(?:[?#].*)?$`));
    const stayPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
    expect(stayPath === '/' || stayPath === '/_start').toBe(true);
    await expectGrid({
      workerBase,
      request,
      room,
      expected: [
        ['seed-marker', 'keep-me'],
        ['pre-existing', 'content'],
      ],
    });
  });

  test('default import path fires zero dialogs and navigates to a random id', async ({
    workerBase,
    page,
    request,
  }) => {
    await openLanding(workerBase, page);

    // Checkbox defaults unchecked on start.html — pin that, and refuse any
    // dialog so a future over-eager guard fails this test instead of hanging.
    await expect(page.locator('#rename_sheet')).not.toBeChecked();
    const dialogs: Dialog[] = [];
    const onDialog = async (dialog: Dialog) => {
      dialogs.push(dialog);
      await dialog.dismiss();
      throw new Error(
        `default import must not open dialogs; got ${dialog.type()}: ${dialog.message()}`,
      );
    };
    page.on('dialog', onDialog);

    try {
      await page.locator('#ec-file-input').setInputFiles({
        name: 'random-default.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from('random-path\n', 'utf8'),
      });
      // newId(10, 36).toLowerCase() — ten base-36 chars under `/<id>`.
      await page.waitForURL(/\/[0-9a-z]{10}(?:[?#].*)?$/, { timeout: 15_000 });
    } finally {
      page.off('dialog', onDialog);
    }

    expect(dialogs, 'default path must fire zero dialogs').toHaveLength(0);

    const path = new URL(page.url()).pathname.replace(/\/$/, '');
    const roomMatch = path.match(/\/([0-9a-z]{10})$/);
    expect(roomMatch, `expected /<10-char-id> navigation, got ${path}`).not.toBeNull();
    const room = roomMatch![1]!;
    expect(room).not.toBe('random-default');
    expect(room).not.toBe('random_default');
    await expectGrid({
      workerBase,
      request,
      room,
      expected: [['random-path']],
    });
  });
});
