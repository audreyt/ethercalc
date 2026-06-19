import { describe, it, expect, } from 'vitest';
import * as XLSX from '@e965/xlsx';
import { buildMultiSheetImport } from '../src/lib/multi-sheet-import.ts';
import { MAX_IMPORT_CELLS, worksheetToSave } from '../src/lib/xlsx-import.ts';

function workbookBytes(sheets: Array<{ name: string; aoa: (string | number | boolean)[][] }>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa), s.name);
  }
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('worksheetToSave', () => {
  it('converts a simple worksheet object to SocialCalc save format', () => {
    const ws = {
      '!ref': 'A1:A2',
      A1: { t: 'n', v: 100 },
      A2: { t: 's', v: 'hello' },
    };
    const save = worksheetToSave(ws);
    expect(save).toContain('socialcalc');
    expect(save).toContain('cell:A1:v:100');
    expect(save).toContain('cell:A2:t:hello');
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
    expect(out.subSheets[0]?.save).toContain('alpha-only');
    expect(out.subSheets[1]?.save).toContain('beta-only');
    expect(out.subSheets[1]?.save).not.toContain('alpha-only');
  });

  it('a single-sheet workbook yields one sub-room + TOC', () => {
    const out = buildMultiSheetImport(workbookBytes([{ name: 'Only', aoa: [['x']] }]), 'solo');
    expect(out.subSheets).toHaveLength(1);
    expect(out.subSheets[0]?.subroom).toBe('solo.1');
  });

  it('enforces the cell-limit across the whole workbook', () => {
    const half = Math.ceil(MAX_IMPORT_CELLS / 2) + 1;
    const aoa = Array.from({ length: half }, (_, i) => [i]);
    const bytes = workbookBytes([
      { name: 'A', aoa },
      { name: 'B', aoa },
    ]);
    expect(() => buildMultiSheetImport(bytes, 'big')).toThrow(/exceeds/);
  });
  it('handles missing SheetNames (defensive)', () => {
    const mockRead = () => ({
      Sheets: {},
    } as unknown as XLSX.WorkBook);
    const out = buildMultiSheetImport(new Uint8Array(), 'demo', mockRead);
    expect(out.subSheets).toEqual([]);
  });

  it('skips sheets declared in SheetNames but missing from Sheets (defensive)', () => {
    const mockRead = () => ({
      SheetNames: ['Real', 'Phantom'],
      Sheets: {
        Real: XLSX.utils.aoa_to_sheet([['x']]),
      },
    } as unknown as XLSX.WorkBook);
    const out = buildMultiSheetImport(new Uint8Array(), 'demo', mockRead);
    expect(out.subSheets).toHaveLength(1);
    expect(out.subSheets[0]?.subroom).toBe('demo.1');
  });

});
