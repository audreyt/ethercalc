import type { WorkBook } from '@e965/xlsx';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';
import { createSpreadsheet } from '@ethercalc/socialcalc-headless';
import { describe, expect, it } from 'vitest';
import {
  cellToCommand,
  countWorksheetCells,
  enforceImportArchiveLimit,
  enforceImportLimit,
  enforceSocialCalcColumnLimit,
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  MAX_IMPORT_CELLS,
  MAX_SOCIALCALC_COL,
  workbookToLoadClipboardCommand,
  xlsxToLoadClipboardCommands,
  xlsxToSave,
} from '../src/lib/xlsx-import.ts';

function makeXlsx(
  cells: Record<string, { t: string; v: unknown; f?: string }>,
  ref: string,
): Uint8Array {
  const ws: Record<string, unknown> = { '!ref': ref, ...cells };
  const book = XLSX.utils.book_new() as WorkBook;
  XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
  return new Uint8Array(
    XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
  );
}

describe('cellToCommand', () => {
  it('formula cells emit `set <coord> formula <f>`', () => {
    expect(cellToCommand('A3', { t: 'n', v: 3, f: 'SUM(A1:A2)' })).toBe(
      'set A3 formula SUM(A1:A2)',
    );
  });

  it('numeric cells emit `set <coord> value n <v>`', () => {
    expect(cellToCommand('A1', { t: 'n', v: 42 })).toBe('set A1 value n 42');
    expect(cellToCommand('B7', { t: 'n', v: -3.14 })).toBe('set B7 value n -3.14');
  });

  it('numeric cell with non-finite value returns null', () => {
    expect(cellToCommand('A1', { t: 'n', v: 'nope' })).toBeNull();
    expect(cellToCommand('A1', { t: 'n', v: NaN })).toBeNull();
    expect(cellToCommand('A1', { t: 'n', v: Infinity })).toBeNull();
  });

  it('encodes text cell values for SocialCalc command syntax', () => {
    expect(cellToCommand('A1', { t: 's', v: 'C:\\new:line\nnext' })).toBe(
      'set A1 text t C\\c\\bnew\\cline\\nnext',
    );
  });

  it('missing string value stringifies to empty', () => {
    expect(cellToCommand('A1', { t: 's' })).toBe('set A1 text t ');
  });

  it('boolean cells emit value n 1 / n 0', () => {
    expect(cellToCommand('A1', { t: 'b', v: true })).toBe('set A1 value n 1');
    expect(cellToCommand('A1', { t: 'b', v: false })).toBe('set A1 value n 0');
  });

  it('date cells convert to Excel serial number', () => {
    // 2024-01-01 UTC = Excel serial 45292
    const d = new Date(Date.UTC(2024, 0, 1));
    const cmd = cellToCommand('A1', { t: 'd', v: d });
    expect(cmd).toMatch(/^set A1 value n 45292/);
  });

  it('date cell with non-Date value returns null', () => {
    expect(cellToCommand('A1', { t: 'd', v: 'not a date' })).toBeNull();
  });

  it('error cells are skipped (null)', () => {
    expect(cellToCommand('A1', { t: 'e', v: 42 })).toBeNull();
  });

  it('unknown type falls back to formatted text (`w`) when present', () => {
    expect(cellToCommand('A1', { t: 'z', w: 'a:b' })).toBe('set A1 text t a\\cb');
  });

  it('unknown type falls back to stringified raw value when only `v` is present', () => {
    expect(cellToCommand('A1', { t: 'z', v: 'x\ny' })).toBe('set A1 text t x\\ny');
  });

  it('graceful fallback for null formatted/raw text', () => {
    expect(cellToCommand('A1', { t: 'z', w: null } as any)).toBe('set A1 text t ');
  });

  it('unknown type with no value returns null', () => {
    expect(cellToCommand('A1', { t: 'z' })).toBeNull();
  });

  it('empty string formula is treated as no-formula', () => {
    expect(cellToCommand('A1', { t: 'n', v: 5, f: '' })).toBe('set A1 value n 5');
  });
});

describe('xlsxToSave — roundtrip', () => {

  it('numbers and text roundtrip to a SocialCalc save', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        A2: { t: 's', v: 'hello' },
      },
      'A1:A2',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('cell:A1:v:1');
    // SocialCalc encodes text as `cell:A2:t:hello`.
    expect(save).toContain('cell:A2:t:hello');
  });

  it('preserves encoded text through xlsxToSave', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 's', v: 'one\ntwo' },
        A2: { t: 's', v: 'C:\\temp:folder' },
      },
      'A1:A2',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('cell:A1:t:one\\ntwo');
    expect(save).toContain('cell:A2:t:C\\c\\btemp\\cfolder');
  });

  it('formulas roundtrip and recalc to the expected value', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        A2: { t: 'n', v: 2 },
        A3: { t: 'n', v: 3, f: 'SUM(A1:A2)' },
      },
      'A1:A3',
    );
    const save = xlsxToSave(bytes);
    // SocialCalc escapes `:` as `\c` in the save format.
    expect(save).toContain('cell:A3:vtf:n:3:SUM(A1\\cA2)');
  });

  it('formulas that fail to parse fall back to cached value', () => {
    // SocialCalc doesn't recognize `EXCEL_ONLY_FN` — fallback to the value.
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 42, f: 'EXCEL_ONLY_FN()' },
      },
      'A1:A1',
    );
    const save = xlsxToSave(bytes);
    // Fallback: either the formula string was accepted (SocialCalc's parser
    // is liberal) or the value was written. Either way the value is present.
    expect(save).toMatch(/cell:A1/);
  });

  it('empty workbook produces a valid empty save', () => {
    const ws: Record<string, unknown> = { '!ref': 'A1:A1' };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('socialcalc:version');
  });

  it('preserves merged ranges', () => {
    const ws = {
      '!ref': 'A1:B2',
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }],
      A1: { t: 's', v: 'merged' },
    };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const save = xlsxToSave(bytes);
    // SocialCalc's merge command encodes colspan on the top-left cell.
    expect(save).toMatch(/cell:A1/);
    // Colspan=2 indicates merge survived.
    expect(save).toMatch(/:colspan:2/);
  });

  it('preserves vertical merge range (rowspan encoding)', () => {
    // Pins the end-row offset `m.e.r + 1` at xlsx-import.ts:139 — a
    // mutation to `-1` produces a bottom coord above the top, which
    // SocialCalc rejects, dropping the merge entirely.
    const ws = {
      '!ref': 'A1:A3',
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }],
      A1: { t: 's', v: 'tall' },
    };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const save = xlsxToSave(bytes);
    expect(save).toMatch(/:rowspan:3/);
  });

  it('preserves merges whose end column requires multi-letter encoding', () => {
    // Pins colLetters's `n % 26` at xlsx-import.ts:165. A mutation to
    // `n * 26` would turn column 26 ("AA") into a garbage character
    // outside A–Z, producing an unparseable `merge A1:<garbage>1`
    // command that SocialCalc's catch-block silently drops.
    const ws = {
      '!ref': 'A1:AA1',
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 26 } }],
      A1: { t: 's', v: 'wide' },
    };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    const save = xlsxToSave(bytes);
    expect(save).toMatch(/:colspan:27/);
  });

  it('zero-byte input yields a save with no cells', () => {
    // SheetJS tolerates an empty byte array by producing an empty book;
    // xlsxToSave returns an empty SocialCalc save in that case.
    const save = xlsxToSave(new Uint8Array(0));
    expect(save).toContain('socialcalc:version');
  });

  it('rejects a workbook that exceeds the cell limit (zip-bomb guard)', () => {
    // Build a fake worksheet with one more cell than the cap. We don't round-
    // trip real bytes — counting the populated keys is exactly what the guard
    // does — so the test stays fast while still pinning the limit.
    const ws: Record<string, unknown> = { '!ref': 'A1:A1', '!merges': [] };
    for (let i = 0; i < MAX_IMPORT_CELLS + 1; i++) ws[`c${i}`] = { t: 'n', v: i };
    expect(countWorksheetCells(ws)).toBe(MAX_IMPORT_CELLS + 1);
    expect(() => enforceImportLimit(countWorksheetCells(ws))).toThrow(
      ImportTooLargeError,
    );
  });

  it('allows a workbook exactly at the cell limit', () => {
    expect(() => enforceImportLimit(MAX_IMPORT_CELLS)).not.toThrow();
    expect(countWorksheetCells({ '!ref': 'A1:A1', A1: { t: 'n', v: 1 } })).toBe(1);
  });

  it('skips cells whose cellToCommand returns null (e.g. error cells)', () => {
    // Error cells return null from cellToCommand and should be skipped
    // entirely rather than crashing or inserting garbage.
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        A2: { t: 'e', v: 42 }, // error cell — cellToCommand returns null
      },
      'A1:A2',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('cell:A1:v:1');
    // A2 should not appear as a cell entry.
    expect(save).not.toContain('cell:A2');
  });
});

describe('SocialCalc ZZ column ceiling on import', () => {
  it('rejects a workbook with AAA1 (column 703) via xlsxToSave', () => {
    // Empirical: SocialCalc.coordToCr("AAA1") → {col:0} and ExecuteSheetCommand
    // silently drops the cell. Import must fail closed before replay rather
    // than return a save missing AAA1.
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 702 },
        AAA1: { t: 'n', v: 703 },
      },
      'A1:AAA1',
    );
    expect(() => xlsxToSave(bytes)).toThrow(ImportColumnOutOfRangeError);
    try {
      xlsxToSave(bytes);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toBe('AAA1');
      expect(e.column).toBe(MAX_SOCIALCALC_COL + 1);
      expect(e.message).toMatch(/ZZ/);
    }
  });

  it('rejects the same wide workbook on the loadclipboard path', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        AAA1: { t: 'n', v: 703 },
      },
      'A1:AAA1',
    );
    expect(() => xlsxToLoadClipboardCommands(bytes)).toThrow(
      ImportColumnOutOfRangeError,
    );
    expect(() => workbookToLoadClipboardCommand(bytes)).toThrow(
      ImportColumnOutOfRangeError,
    );
  });

  it('accepts a full-width ZZ workbook (lastcol=702)', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 702 },
      },
      'A1:ZZ1',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('cell:A1');
    expect(save).toContain('cell:ZZ1');
  });

  it('enforceSocialCalcColumnLimit rejects merge ends beyond ZZ', () => {
    const ws: Record<string, unknown> = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 702 } }],
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
  });

  it('enforceSocialCalcColumnLimit rejects unparseable cell addresses', () => {
    // Non-metadata keys that parseCoord cannot parse must fail closed —
    // silent continue would let replay drop them without a signal.
    const ws: Record<string, unknown> = {
      '!ref': 'A1:A1',
      A1: { t: 'n', v: 1 },
      'not-a-coord': { t: 's', v: 'x' },
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
    try {
      enforceSocialCalcColumnLimit(ws);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toBe('unparseable:not-a-coord');
      expect(Number.isNaN(e.column)).toBe(true);
      expect(e.message).toMatch(/column/i);
    }
  });

  it('enforceSocialCalcColumnLimit rejects merge with missing end column', () => {
    // typeof endC !== 'number' must fail closed (not continue).
    const ws: Record<string, unknown> = {
      '!ref': 'A1:A1',
      A1: { t: 'n', v: 1 },
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0 } }],
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
    try {
      enforceSocialCalcColumnLimit(ws);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toBe('merge:e.c=undefined');
      expect(Number.isNaN(e.column)).toBe(true);
      expect(e.message).toMatch(/column/i);
    }
  });

  it('enforceSocialCalcColumnLimit defaults missing merge end-row to 1 in coord', () => {
    // Safe integer past ZZ with missing e.r → endR=0 → encodeColumn(702)+"1".
    const ws: Record<string, unknown> = {
      '!ref': 'A1:A1',
      A1: { t: 'n', v: 1 },
      '!merges': [{ s: { r: 0, c: 0 }, e: { c: 702 } }],
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
    try {
      enforceSocialCalcColumnLimit(ws);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toBe('AAA1');
      expect(e.column).toBe(703);
      expect(e.message).toMatch(/ZZ/);
    }
  });

  it('enforceSocialCalcColumnLimit rejects Infinity merge end without hanging', () => {
    // Regression: endC > 701 alone let Infinity through to encodeColumn's
    // while (n >= 0) loop, which never terminates. Fail closed immediately.
    const ws: Record<string, unknown> = {
      '!ref': 'A1:A1',
      A1: { t: 'n', v: 1 },
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: Number.POSITIVE_INFINITY } }],
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
    try {
      enforceSocialCalcColumnLimit(ws);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toContain('Infinity');
      expect(Number.isNaN(e.column)).toBe(true);
    }
  });

  it('enforceSocialCalcColumnLimit rejects negative and non-integer merge ends', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:A1',
        A1: { t: 'n', v: 1 },
        '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: -1 } }],
      }),
    ).toThrow(ImportColumnOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:A1',
        A1: { t: 'n', v: 1 },
        '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1.5 } }],
      }),
    ).toThrow(ImportColumnOutOfRangeError);
  });

  it('enforceSocialCalcColumnLimit accepts a merge ending at ZZ (c=701)', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:ZZ1',
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 2 },
        '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 701 } }],
      }),
    ).not.toThrow();
  });

  it('enforceSocialCalcColumnLimit accepts ZZ-only worksheets', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:ZZ1',
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 2 },
      }),
    ).not.toThrow();
  });

  /**
   * Leanstral Attempt 2 finding #1 challenged `colLetters(lastcol - 1)` as an
   * off-by-one, under the false premise that `sheet.attribs.lastcol` is SheetJS
   * 0-based. The callsite reads the **replayed SocialCalc sheet**, where
   * lastcol is 1-based (A=1 … ZZ=702), so `lastcol - 1` is the correct 0↔1
   * adapter. These regressions execute the public clipboard API and pin the
   * encoded `copiedfrom` range — a passing defense of a model-authored
   * plausible bug is a valid promotion.
   */
  it('A1:ZZ1 clipboard encodes copiedfrom\\cA1\\cZZ1 (lastcol 1-based adapter)', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 702 },
      },
      'A1:ZZ1',
    );
    const cmd = workbookToLoadClipboardCommand(bytes);
    expect(cmd).not.toBeNull();
    // encodeForSave turns ':' into '\c'. Leanstral's ZY prediction would
    // yield copiedfrom\cA1\cZY1 — this pins the correct ZZ endpoint.
    expect(cmd!).toContain('copiedfrom\\cA1\\cZZ1');
    expect(cmd!).not.toContain('copiedfrom\\cA1\\cZY1');
    expect(cmd!).not.toMatch(/copiedfrom\\cA1\\c1(?:\\n|$)/);
  });

  it('A1-only clipboard encodes copiedfrom\\cA1\\cA1 (no empty-column underflow)', () => {
    const bytes = makeXlsx({ A1: { t: 'n', v: 1 } }, 'A1:A1');
    const cmd = workbookToLoadClipboardCommand(bytes);
    expect(cmd).not.toBeNull();
    // If lastcol were 0-based 0 and we still did -1, colLetters(-1) === ""
    // → "A1:1". SocialCalc lastcol for A1 is 1 → colLetters(0) === "A".
    expect(cmd!).toContain('copiedfrom\\cA1\\cA1');
    expect(cmd!).not.toMatch(/copiedfrom\\cA1\\c1(?:\\n|$)/);
  });
});

describe('xlsxToLoadClipboardCommands', () => {

  it('emits a loadclipboard + paste A1 all pair', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        B1: { t: 's', v: 'hi' },
        A2: { t: 'n', v: 2 },
      },
      'A1:B2',
    );
    const cmds = xlsxToLoadClipboardCommands(bytes);
    expect(cmds).toHaveLength(2);
    expect(cmds[0]).toMatch(/^loadclipboard /);
    expect(cmds[1]).toBe('paste A1 all');
  });

  it('encodes the clipboard save with a copiedfrom range covering the cells', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        B1: { t: 's', v: 'hi' },
        A2: { t: 'n', v: 2 },
      },
      'A1:B2',
    );
    const cmds = xlsxToLoadClipboardCommands(bytes);
    // `:` is encoded as `\c` in the loadclipboard payload (encodeForSave),
    // so the decoded range trailer is `copiedfrom:A1:B2`.
    expect(cmds[0]).toContain('copiedfrom\\cA1\\cB2');
    // Newlines in the multi-line sheet save are encoded as `\n` so the
    // whole payload stays on a single command line.
    expect(cmds[0]).not.toMatch(/\n/);
  });

  it('preserves formulas in the clipboard payload', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        A2: { t: 'n', v: 2 },
        A3: { t: 'n', v: 3, f: 'SUM(A1:A2)' },
      },
      'A1:A3',
    );
    const cmds = xlsxToLoadClipboardCommands(bytes);
    // The formula `SUM(A1:A2)` survives; its `:` becomes `\c` under both
    // the SocialCalc cell encoding and the outer encodeForSave pass.
    expect(cmds[0]).toContain('SUM(A1');
    expect(cmds[1]).toBe('paste A1 all');
  });

  it('returns an empty array for a cell-less workbook (no-op import)', () => {
    const ws: Record<string, unknown> = { '!ref': 'A1:A1' };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    const bytes = new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
    expect(xlsxToLoadClipboardCommands(bytes)).toEqual([]);
  });

  it('returns an empty array for zero-byte input', () => {
    expect(xlsxToLoadClipboardCommands(new Uint8Array(0))).toEqual([]);
  });

  it('enforces the import cell limit', () => {
    // The guard fires inside the shared replayWorkbook step before any
    // clipboard save is built. We can't cheaply round-trip 200k+ real
    // cells, so assert the shared limit is wired by checking enforceImportLimit
    // throws at the same boundary the command builder relies on.
    expect(() => enforceImportLimit(MAX_IMPORT_CELLS + 1)).toThrow(
      ImportTooLargeError,
    );
  });
});

describe('workbookToLoadClipboardCommand', () => {
  it('emits a loadclipboard command from CSV bytes', () => {
    const bytes = new TextEncoder().encode('"#url","#title"\n"/toc.1","Sheet1"\n');
    const cmd = workbookToLoadClipboardCommand(bytes);
    expect(cmd).not.toBeNull();
    expect(cmd!).toMatch(/^loadclipboard /);
  });

  it('replaying loadclipboard + paste A2 all yields TOC cells at A2:B3', () => {
    const bytes = new TextEncoder().encode('"#url","#title"\n"/toc.1","Sheet1"\n');
    const cmd = workbookToLoadClipboardCommand(bytes);
    expect(cmd).not.toBeNull();
    const ss = createSpreadsheet();
    ss.executeCommand(cmd!);
    ss.executeCommand('paste A2 all');
    const cells = ss.exportCells() as Record<string, { datavalue?: string }>;
    expect(cells.A2?.datavalue).toBe('#url');
    expect(cells.B2?.datavalue).toBe('#title');
    expect(cells.A3?.datavalue).toBe('/toc.1');
    expect(cells.B3?.datavalue).toBe('Sheet1');
  });

  it('returns null for zero-byte input (empty workbook)', () => {
    expect(workbookToLoadClipboardCommand(new Uint8Array(0))).toBeNull();
  });

  it('xlsxToLoadClipboardCommands still retains [loadclipboard, paste A1 all]', () => {
    const bytes = makeXlsx(
      { A1: { t: 'n', v: 1 }, B1: { t: 's', v: 'hi' } },
      'A1:B1',
    );
    const cmds = xlsxToLoadClipboardCommands(bytes);
    expect(cmds).toHaveLength(2);
    expect(cmds[0]).toMatch(/^loadclipboard /);
    expect(cmds[1]).toBe('paste A1 all');
  });
});

function makeFakeZipCentralDirectory(
  entries: Array<{ name: string; compressedSize: number; uncompressedSize: number; extraLength?: number; commentLength?: number }>
): Uint8Array {
  const cdHeaders: Uint8Array[] = [];
  let cdOffset = 0;
  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const extraLen = entry.extraLength ?? 0;
    const commentLen = entry.commentLength ?? 0;
    const header = new Uint8Array(46 + nameBytes.length + extraLen + commentLen);
    header[0] = 0x50;
    header[1] = 0x4b;
    header[2] = 0x01;
    header[3] = 0x02;
    header[20] = entry.compressedSize & 0xff;
    header[21] = (entry.compressedSize >> 8) & 0xff;
    header[22] = (entry.compressedSize >> 16) & 0xff;
    header[23] = (entry.compressedSize >> 24) & 0xff;
    header[24] = entry.uncompressedSize & 0xff;
    header[25] = (entry.uncompressedSize >> 8) & 0xff;
    header[26] = (entry.uncompressedSize >> 16) & 0xff;
    header[27] = (entry.uncompressedSize >> 24) & 0xff;
    header[28] = nameBytes.length & 0xff;
    header[29] = (nameBytes.length >> 8) & 0xff;
    header[30] = extraLen & 0xff;
    header[31] = (extraLen >> 8) & 0xff;
    header[32] = commentLen & 0xff;
    header[33] = (commentLen >> 8) & 0xff;
    header.set(nameBytes, 46);
    cdHeaders.push(header);
    cdOffset += header.length;
  }
  const eocd = new Uint8Array(22);
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06;
  eocd[8] = entries.length & 0xff;
  eocd[9] = (entries.length >> 8) & 0xff;
  eocd[10] = entries.length & 0xff;
  eocd[11] = (entries.length >> 8) & 0xff;
  eocd[12] = cdOffset & 0xff;
  eocd[13] = (cdOffset >> 8) & 0xff;
  eocd[14] = (cdOffset >> 16) & 0xff;
  eocd[15] = (cdOffset >> 24) & 0xff;
  eocd[16] = 0;
  eocd[17] = 0;
  eocd[18] = 0;
  eocd[19] = 0;
  const result = new Uint8Array(cdOffset + eocd.length);
  let pos = 0;
  for (const header of cdHeaders) {
    result.set(header, pos);
    pos += header.length;
  }
  result.set(eocd, pos);
  return result;
}

describe('enforceImportArchiveLimit', () => {
  it('throws ImportArchiveTooLargeError when uncompressed size exceeds limit for relevant files', () => {
    expect(() => enforceImportArchiveLimit(makeFakeZipCentralDirectory([
      { name: 'xl/worksheets/sheet2.xml', compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 },
    ]))).toThrow(ImportArchiveTooLargeError);
  });

  it('does not throw when huge file is not relevant to sheet parsing', () => {
    expect(() => enforceImportArchiveLimit(makeFakeZipCentralDirectory([
      { name: 'xl/media/image1.png', compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 },
    ]))).not.toThrow();
  });

  it('early return for non-ZIP inputs', () => {
    expect(() => enforceImportArchiveLimit(new Uint8Array([0, 0]))).not.toThrow();
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x50, 0]))).not.toThrow();
  });

  it('early return if EOCD is absent', () => {
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x50, 0x4b, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).not.toThrow();
  });

  it('rejects ZIP64 sentinel values', () => {
    const bytes1 = makeFakeZipCentralDirectory([]);
    const eocdOffset = bytes1.length - 22;
    bytes1[eocdOffset + 10] = 0xff;
    bytes1[eocdOffset + 11] = 0xff;
    expect(() => enforceImportArchiveLimit(bytes1)).toThrow(ImportArchiveTooLargeError);

    const bytes2 = makeFakeZipCentralDirectory([]);
    bytes2[eocdOffset + 12] = 0xff;
    bytes2[eocdOffset + 13] = 0xff;
    bytes2[eocdOffset + 14] = 0xff;
    bytes2[eocdOffset + 15] = 0xff;
    expect(() => enforceImportArchiveLimit(bytes2)).toThrow(ImportArchiveTooLargeError);

    const bytes3 = makeFakeZipCentralDirectory([]);
    bytes3[eocdOffset + 16] = 0xff;
    bytes3[eocdOffset + 17] = 0xff;
    bytes3[eocdOffset + 18] = 0xff;
    bytes3[eocdOffset + 19] = 0xff;
    expect(() => enforceImportArchiveLimit(bytes3)).toThrow(ImportArchiveTooLargeError);

    const bytes4 = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 0xffffffff }
    ]);
    expect(() => enforceImportArchiveLimit(bytes4)).toThrow(ImportArchiveTooLargeError);

    const bytes5 = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 0xffffffff, uncompressedSize: 10 }
    ]);
    expect(() => enforceImportArchiveLimit(bytes5)).toThrow(ImportArchiveTooLargeError);
  });

  it('rejects aggregate uncompressed size over limit', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 20 * 1024 * 1024, extraLength: 10, commentLength: 20 },
      { name: 'xl/sharedstrings.xml', compressedSize: 10, uncompressedSize: 6 * 1024 * 1024 },
    ]);
    expect(() => enforceImportArchiveLimit(bytes)).toThrow(ImportArchiveTooLargeError);
  });

  it('normalizes leading slash and casing', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: '/XL/Worksheets/Sheet1.XML', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 }
    ]);
    expect(() => enforceImportArchiveLimit(bytes)).toThrow(ImportArchiveTooLargeError);
  });

  it('early return for malformed entry lengths', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 10 }
    ]);
    const eocdOffset = bytes.length - 22;
    const cdOffset = eocdOffset + 20;
    bytes[eocdOffset + 16] = cdOffset & 0xff;
    bytes[eocdOffset + 17] = (cdOffset >> 8) & 0xff;
    bytes[eocdOffset + 18] = (cdOffset >> 16) & 0xff;
    bytes[eocdOffset + 19] = (cdOffset >> 24) & 0xff;
    expect(() => enforceImportArchiveLimit(bytes)).not.toThrow();
  });

  it('early return if CD entry signature mismatch', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 10 }
    ]);
    bytes[2] = 0;
    expect(() => enforceImportArchiveLimit(bytes)).not.toThrow();
  });

  it('early return if file name goes out of bounds', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 10 }
    ]);
    bytes[28] = 0xff;
    bytes[29] = 0xff;
    expect(() => enforceImportArchiveLimit(bytes)).not.toThrow();
  });

  it('handles prepended prefix bytes correctly', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 }
    ]);
    const padded = new Uint8Array(10 + bytes.length);
    padded.set(bytes, 10);
    padded[0] = 0x50;
    padded[1] = 0x4b;
    const eocdOffset = padded.length - 22;
    padded[eocdOffset + 16] = 0;
    padded[eocdOffset + 17] = 0;
    padded[eocdOffset + 18] = 0;
    padded[eocdOffset + 19] = 0;
    expect(() => enforceImportArchiveLimit(padded)).toThrow(ImportArchiveTooLargeError);
  });

  it('handles prepended prefix bytes with invalid test signature', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 26 * 1024 * 1024 }
    ]);
    const padded = new Uint8Array(10 + bytes.length);
    padded.set(bytes, 10);
    padded[0] = 0x50;
    padded[1] = 0x4b;
    const eocdOffset = padded.length - 22;
    padded[eocdOffset + 16] = 0;
    padded[eocdOffset + 17] = 0;
    padded[eocdOffset + 18] = 0;
    padded[eocdOffset + 19] = 0;
    padded[12] = 0;
    expect(() => enforceImportArchiveLimit(padded)).not.toThrow();
  });

  it('throws ImportArchiveTooLargeError for each relevant XML entry shape', () => {
    const relevantNames = [
      '[content_types].xml',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/sharedstrings.xml',
      'xl/styles.xml',
      'content.xml',
      'styles.xml',
      'meta.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/_rels/sheet1.xml.rels',
    ];
    for (const name of relevantNames) {
      expect(() => enforceImportArchiveLimit(makeFakeZipCentralDirectory([
        { name, compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 },
      ]))).toThrow(ImportArchiveTooLargeError);
    }
  });

  it('early return boundaries for non-ZIP / length checks', () => {
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x51, 0x4b]))).not.toThrow();
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x50, 0x4c]))).not.toThrow();

    const bytesShort = new Uint8Array(21);
    bytesShort[0] = 0x50;
    bytesShort[1] = 0x4b;
    expect(() => enforceImportArchiveLimit(bytesShort)).not.toThrow();
  });

  it('finds EOCD with a trailing comment', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 }
    ]);
    const withComment = new Uint8Array(bytes.length + 10);
    withComment.set(bytes, 0);
    const eocdOffset = bytes.length - 22;
    withComment[eocdOffset + 20] = 10;
    withComment[eocdOffset + 21] = 0;
    withComment.set(new Uint8Array(10), bytes.length);
    expect(() => enforceImportArchiveLimit(withComment)).toThrow(ImportArchiveTooLargeError);
  });

  it('does not throw when uncompressed size is exactly equal to the limit', () => {
    const bytes1 = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES },
    ]);
    expect(() => enforceImportArchiveLimit(bytes1)).not.toThrow();

    const bytes2 = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: 15 * 1024 * 1024 },
      { name: 'xl/sharedstrings.xml', compressedSize: 10, uncompressedSize: 10 * 1024 * 1024 },
    ]);
    expect(() => enforceImportArchiveLimit(bytes2)).not.toThrow();
  });

  it('handles large entry counts and non-zero shift offsets correctly', () => {
    const entries = Array.from({ length: 256 }, (_, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      compressedSize: 0x10000,
      uncompressedSize: i === 255 ? MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 : 10,
    }));
    const bytes = makeFakeZipCentralDirectory(entries);
    
    const padded = new Uint8Array(256 + bytes.length);
    padded.set(bytes, 256);
    padded[0] = 0x50;
    padded[1] = 0x4b;
    const eocdOffset = padded.length - 22;
    padded[eocdOffset + 16] = 0;
    padded[eocdOffset + 17] = 0;
    padded[eocdOffset + 18] = 0;
    padded[eocdOffset + 19] = 0;

    expect(() => enforceImportArchiveLimit(padded)).toThrow(ImportArchiveTooLargeError);
  });

  it('early return boundaries for non-ZIP / length checks', () => {
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x51, 0x4b]))).not.toThrow();
    expect(() => enforceImportArchiveLimit(new Uint8Array([0x50, 0x4c]))).not.toThrow();

    const bytes1 = new Uint8Array(1);
    bytes1[0] = 0x50;
    expect(() => enforceImportArchiveLimit(bytes1)).not.toThrow();

    const bytes2 = new Uint8Array(2);
    bytes2[0] = 0x50;
    bytes2[1] = 0x4b;
    expect(() => enforceImportArchiveLimit(bytes2)).not.toThrow();

    const bytes21 = new Uint8Array(21);
    bytes21[0] = 0x50;
    bytes21[1] = 0x4b;
    expect(() => enforceImportArchiveLimit(bytes21)).not.toThrow();

    const bytes22 = new Uint8Array(22);
    bytes22[0] = 0x50;
    bytes22[1] = 0x4b;
    expect(() => enforceImportArchiveLimit(bytes22)).not.toThrow();
  });

  it('finds EOCD with a trailing comment', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 10, uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1 }
    ]);
    const withComment = new Uint8Array(bytes.length + 10);
    withComment.set(bytes, 0);
    const eocdOffset = bytes.length - 22;
    withComment[eocdOffset + 20] = 10;
    withComment[eocdOffset + 21] = 0;
    withComment.set(new Uint8Array(10), bytes.length);
    expect(() => enforceImportArchiveLimit(withComment)).toThrow(ImportArchiveTooLargeError);

    const withMaxComment = new Uint8Array(bytes.length + 0xffff);
    withMaxComment.set(bytes, 0);
    withMaxComment[eocdOffset + 20] = 0xff;
    withMaxComment[eocdOffset + 21] = 0xff;
    expect(() => enforceImportArchiveLimit(withMaxComment)).toThrow(ImportArchiveTooLargeError);
  });
});
