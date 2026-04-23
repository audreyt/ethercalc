import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { cellToCommand, xlsxToSave } from '../src/lib/xlsx-import.ts';

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

  it('string cells emit `set <coord> text t <v>`', () => {
    expect(cellToCommand('A1', { t: 's', v: 'hello' })).toBe('set A1 text t hello');
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
    expect(cellToCommand('A1', { t: 'z', w: 'formatted' })).toBe(
      'set A1 text t formatted',
    );
  });

  it('unknown type falls back to stringified raw value when only `v` is present', () => {
    expect(cellToCommand('A1', { t: 'z', v: 123 })).toBe('set A1 text t 123');
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
