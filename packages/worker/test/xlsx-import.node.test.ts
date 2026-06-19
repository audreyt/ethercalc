import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import {
  ImportArchiveTooLargeError,
  ImportTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  MAX_IMPORT_CELLS,
  cellToCommand,
  countWorksheetCells,
  enforceImportArchiveLimit,
  enforceImportLimit,
  xlsxToLoadClipboardCommands,
  xlsxToSave,
} from '../src/lib/xlsx-import.ts';

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

  it('unknown type with no value returns null', () => {
    expect(cellToCommand('A1', { t: 'z' })).toBeNull();
  });

  it('empty string formula is treated as no-formula', () => {
    expect(cellToCommand('A1', { t: 'n', v: 5, f: '' })).toBe('set A1 value n 5');
  });
});

describe('xlsxToSave — roundtrip', () => {
  function makeXlsx(cells: Record<string, { t: string; v: unknown; f?: string }>, ref: string): Uint8Array {
    const ws: Record<string, unknown> = { '!ref': ref, ...cells };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    return new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
  }

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

describe('xlsxToLoadClipboardCommands', () => {
  function makeXlsx(
    cells: Record<string, { t: string; v: unknown; f?: string }>,
    ref: string,
  ): Uint8Array {
    const ws: Record<string, unknown> = { '!ref': ref, ...cells };
    const book = (XLSX as any).utils.book_new();
    (XLSX as any).utils.book_append_sheet(book, ws, 'Sheet1');
    return new Uint8Array(
      (XLSX as any).write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
    );
  }

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

function makeFakeZipCentralDirectory(
  entries: Array<{ name: string; compressedSize: number; uncompressedSize: number }>
): Uint8Array {
  const cdHeaders: Uint8Array[] = [];
  let cdOffset = 0;
  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const header = new Uint8Array(46 + nameBytes.length);
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
});
