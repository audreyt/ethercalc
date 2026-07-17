/**
 * Real two-browser realtime collaboration over native WebSockets.
 *
 * Two independent Playwright browser CONTEXTS (not just two tabs sharing
 * one context/cookie-jar) open the SAME public room against the live
 * Worker + RoomDO, each getting its own `/_ws/:room` connection and its
 * own randomized SocialCalc username (`main.ts`'s `defaultRandomUsername`)
 * — so neither page's edits are filtered out as "my own echo" by
 * `createDispatcher()`'s same-user/-room guard in `main.ts`.
 *
 * A real keyboard edit on one page must appear on the other page's live
 * `SocialCalc` sheet object WITHOUT a reload (proves the WS broadcast +
 * `applyExecute()`'s `ScheduleSheetCommands(..., isRemote: true)` replay
 * actually mutates the peer's in-memory sheet, not just a persisted
 * snapshot). A final reload on one side proves reconnect/reload
 * convergence: a fresh WS connection + snapshot fetch reproduces both
 * sides' edits identically.
 */
import type { Page } from '@playwright/test';

import { expect, test } from '../src/fixtures.ts';

interface CellBody {
  readonly datavalue?: unknown;
}

function isCellBody(value: unknown): value is CellBody {
  return !!value && typeof value === 'object';
}

async function typeIntoCell(page: Page, coord: string, value: string): Promise<void> {
  const editorTable = page.locator('#tableeditor table').first();
  await expect(editorTable).toBeVisible({ timeout: 15_000 });
  await editorTable.click();
  await page.evaluate((cellCoord) => {
    // Well-known DOM global augmented at runtime by socialcalc.js/player.js
    // — cast bound to a named const, never read inline off the cast.
    const host = window as unknown as {
      SocialCalc?: {
        CurrentSpreadsheetControlObject?: {
          editor?: { MoveECell: (coord: string) => string };
        };
        KeyboardFocus?: () => void;
      };
    };
    const sc = host.SocialCalc;
    const editor = sc?.CurrentSpreadsheetControlObject?.editor;
    if (!editor || !sc?.KeyboardFocus) throw new Error('SocialCalc editor not ready');
    editor.MoveECell(cellCoord);
    sc.KeyboardFocus();
  }, coord);
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

/** Reads a cell's live in-memory `datavalue` straight off the peer's
 * `SocialCalc` sheet object — never the server snapshot — so a caller
 * polling this can only observe success once the WS broadcast has
 * actually been applied locally (real-time propagation), not once the
 * value happens to be persisted server-side. */
async function liveCellValue(page: Page, coord: string): Promise<unknown> {
  return page.evaluate((cellCoord) => {
    const host = window as unknown as {
      SocialCalc?: {
        CurrentSpreadsheetControlObject?: {
          context?: { sheetobj?: { cells?: Record<string, { datavalue?: unknown }> } };
        };
      };
    };
    return host.SocialCalc?.CurrentSpreadsheetControlObject?.context?.sheetobj?.cells?.[cellCoord]
      ?.datavalue ?? null;
  }, coord);
}

test.describe('realtime collaboration over native WebSockets', () => {
  test('two browser contexts on the same public room see each other’s edits live, then converge on reload', async ({
    workerBase,
    browser,
  }) => {
    test.setTimeout(60_000);

    const room = `collab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    try {
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      await Promise.all([
        pageA.goto(`${workerBase}/${room}/edit`),
        pageB.goto(`${workerBase}/${room}/edit`),
      ]);

      await expect(pageA.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });
      await expect(pageB.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });

      // A edits A1; B must observe it live, no reload.
      await typeIntoCell(pageA, 'A1', 'from-a');
      await expect
        .poll(async () => liveCellValue(pageB, 'A1'), { timeout: 10_000 })
        .toBe('from-a');

      // B edits A2; A must observe it live, no reload.
      await typeIntoCell(pageB, 'A2', 'from-b');
      await expect
        .poll(async () => liveCellValue(pageA, 'A2'), { timeout: 10_000 })
        .toBe('from-b');

      // Both sides should also see BOTH cells at this point (no one
      // clobbered the other's write).
      await expect.poll(async () => liveCellValue(pageA, 'A1'), { timeout: 10_000 }).toBe('from-a');
      await expect.poll(async () => liveCellValue(pageB, 'A2'), { timeout: 10_000 }).toBe('from-b');

      // Server-side persistence, independent of either page's live WS state.
      await expect
        .poll(async () => {
          const res = await pageA.request.get(`${workerBase}/_/${room}/cells/A1`);
          if (res.status() !== 200) return null;
          const raw: unknown = await res.json();
          return isCellBody(raw) ? (raw.datavalue ?? null) : null;
        }, { timeout: 10_000 })
        .toBe('from-a');
      await expect
        .poll(async () => {
          const res = await pageA.request.get(`${workerBase}/_/${room}/cells/A2`);
          if (res.status() !== 200) return null;
          const raw: unknown = await res.json();
          return isCellBody(raw) ? (raw.datavalue ?? null) : null;
        }, { timeout: 10_000 })
        .toBe('from-b');

      // Reconnect/reload convergence: a fresh WS connection + snapshot
      // fetch on A reproduces both sides' edits identically, including B's
      // write that A only ever received live (never re-fetched until now).
      await pageA.reload();
      await expect(pageA.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });
      await expect.poll(async () => liveCellValue(pageA, 'A1'), { timeout: 10_000 }).toBe('from-a');
      await expect.poll(async () => liveCellValue(pageA, 'A2'), { timeout: 10_000 }).toBe('from-b');

      // A post-reload edit must still propagate live to B (proves the
      // reconnected socket is a real, working connection, not a stale
      // one-shot snapshot fetch).
      await typeIntoCell(pageA, 'A3', 'after-reload');
      await expect
        .poll(async () => liveCellValue(pageB, 'A3'), { timeout: 10_000 })
        .toBe('after-reload');
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});
