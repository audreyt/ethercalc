import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { worksheetToSave } from '../src/lib/xlsx-import.ts';
import { buildMultiSheetImport } from '../src/lib/multi-sheet-import.ts';
import { MAX_IMPORT_CELLS } from '../src/lib/xlsx-import.ts';

/** Build a one-sheet workbook and return its single worksheet object. */
function sheetFrom(aoa: unknown[][]): Record<string, unknown> {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa as any);
  XLSX.utils.book_append_sheet(wb, ws, 'S');
  return wb.Sheets['S'] as Record<string, unknown>;
}

/** Build a multi-sheet workbook as xlsx bytes. */
function workbookBytes(
  sheets: Array<{ name: string; aoa: unknown[][] }>,
): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(s.aoa as any),
      s.name,
    );
  }
  return new Uint8Array(
    XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer,
  );
}

describe('worksheetToSave', () => {
  it('converts a worksheet (not just the first in a workbook) to a SocialCalc save', () => {
    const ws = sheetFrom([
      ['name', 'qty'],
      ['apples', 3],
    ]);
    const save = worksheetToSave(ws);
    expect(save).toContain('version:1.5'); // a real sheet section was emitted
    expect(save).toContain('name'); // the A1 text value survived
  });

  it('preserves a formula cell', () => {
    const ws: any = sheetFrom([[1], [2]]);
    ws['A3'] = { t: 'n', f: 'SUM(A1:A2)' };
    ws['!ref'] = 'A1:A3';
    const save = worksheetToSave(ws);
    // SocialCalc stores formulas in the cell's `vtf` field and escapes the
    // range colon as `\c` (its save-format colon escape), so `SUM(A1:A2)`
    // lands as `cell:A3:vtf:n:…:SUM(A1\cA2)`. Assert on the encoded formula
    // text (not a presumed `formula:` prefix) — this proves the formula
    // survived as a live formula rather than just its cached value.
    expect(save).toContain('vtf:n:');
    expect(save).toContain('SUM(A1\\cA2)');
  });

  it('an empty worksheet yields a valid (empty) save', () => {
    expect(worksheetToSave({})).toContain('version:1.5');
  });
});

describe('buildMultiSheetImport', () => {
  it('produces one sub-room per worksheet, named <room>.<N>', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['a']] },
      { name: 'Beta', aoa: [['b']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    expect(out.subSheets.map((s) => s.subroom)).toEqual(['demo.1', 'demo.2']);
  });

  it('builds a TOC whose rows are [/<subroom>, sheetName] under a #url/#title header', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['a']] },
      { name: 'Beta', aoa: [['b']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    // TOC is a SocialCalc save; the link + title land in column A/B cells.
    expect(out.tocSave).toContain('#url');
    expect(out.tocSave).toContain('/demo.1');
    expect(out.tocSave).toContain('Alpha');
    expect(out.tocSave).toContain('/demo.2');
    expect(out.tocSave).toContain('Beta');
  });

  it('each worksheet becomes its own sub-sheet save (second sheet is real, not the first)', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['alpha-only']] },
      { name: 'Beta', aoa: [['beta-only']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    expect(out.subSheets[0]!.save).toContain('alpha-only');
    expect(out.subSheets[1]!.save).toContain('beta-only');
    expect(out.subSheets[1]!.save).not.toContain('alpha-only');
  });

  it('a single-sheet workbook yields one sub-room + TOC', () => {
    const out = buildMultiSheetImport(
      workbookBytes([{ name: 'Only', aoa: [['x']] }]),
      'solo',
    );
    expect(out.subSheets).toHaveLength(1);
    expect(out.subSheets[0]!.subroom).toBe('solo.1');
  });

  it('enforces the cell-limit across the whole workbook', () => {
    // Two sheets that each individually fit but together exceed the cap.
    const half = Math.ceil(MAX_IMPORT_CELLS / 2) + 1;
    const aoa = Array.from({ length: half }, (_, i) => [i]);
    const bytes = workbookBytes([
      { name: 'A', aoa },
      { name: 'B', aoa },
    ]);
    expect(() => buildMultiSheetImport(bytes, 'big')).toThrow(/exceeds/);
  });
});
