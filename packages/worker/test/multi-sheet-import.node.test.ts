import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { worksheetToSave } from '../src/lib/xlsx-import.ts';

/** Build a one-sheet workbook and return its single worksheet object. */
function sheetFrom(aoa: unknown[][]): Record<string, unknown> {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa as any);
  XLSX.utils.book_append_sheet(wb, ws, 'S');
  return wb.Sheets['S'] as Record<string, unknown>;
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
