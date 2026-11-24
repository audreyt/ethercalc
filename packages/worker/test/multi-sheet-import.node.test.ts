import * as XLSX from '@e965/xlsx';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
  buildMultiSheetImport,
  buildMultiSheetAppendImport,
  parseAddSheetRequest,
  prepareAppendImportPlan,
  enforceTextImportLimits,
  getMaxSubsheetIndex,
  MAX_WORKBOOK_GRID_POSITIONS,
  rewriteSheetReferences,
  ImportTooManySheetsError,
  ImportUnsupportedFormatError,
} from '../src/lib/multi-sheet-import.ts';
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportDimensionsTooLargeError,
  ImportTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  MAX_IMPORT_CELLS,
  worksheetToSave,
} from '../src/lib/xlsx-import.ts';
import { MAX_MULTI_SHEETS, MAX_MULTI_SHEET_TITLE_LENGTH } from '@ethercalc/shared';
import { createSpreadsheet } from '@ethercalc/socialcalc-headless';
import { MAX_SOCIALCALC_COL } from '../src/lib/command-limits.ts';

function workbookBytes(sheets: Array<{ name: string; aoa: (string | number | boolean)[][] }>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa), s.name);
  }
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}
/** A reader that returns these worksheets, named `Sheet1`, `Sheet2`, and so on. */
function readSheets(worksheets: Array<Record<string, unknown>>): typeof XLSX.read {
  const names = worksheets.map((_, index) => `Sheet${index + 1}`);
  return (() => ({
    SheetNames: names,
    Sheets: Object.fromEntries(names.map((name, index) => [name, worksheets[index]])),
  })) as unknown as typeof XLSX.read;
}
/** Two cells `rows` apart: a save visits every position between them. */
function sparseSheet(rows: number): Record<string, unknown> {
  return { '!ref': `A1:A${rows}`, A1: { t: 'n', v: 1 }, [`A${rows}`]: { t: 'n', v: 2 } };
}
/** One formula that spends 6,000 of the 10,000 loop steps of a recalculation. */
function loopSheet(): Record<string, unknown> {
  return { '!ref': 'A1', A1: { t: 'n', v: 1, f: 'DDB(1000,0,6000,6000)' } };
}
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
  eocd[8] = cdHeaders.length & 0xff;
  eocd[9] = (cdHeaders.length >> 8) & 0xff;
  eocd[10] = cdHeaders.length & 0xff;
  eocd[11] = (cdHeaders.length >> 8) & 0xff;
  eocd[12] = cdOffset & 0xff;
  eocd[13] = (cdOffset >> 8) & 0xff;
  eocd[14] = (cdOffset >> 16) & 0xff;
  eocd[15] = (cdOffset >> 24) & 0xff;
  eocd[16] = 0;
  eocd[17] = 0;
  eocd[18] = 0;
  eocd[19] = 0;
  const total = cdOffset + 22;
  const zip = new Uint8Array(total);
  let pos = 0;
  for (const h of cdHeaders) {
    zip.set(h, pos);
    pos += h.length;
  }
  zip.set(eocd, pos);
  return zip;
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
  it('rejects invalid child numbering before materializing saves', () => {
    const readFn = (() => ({
      SheetNames: ['A', 'B'],
      Sheets: {},
    })) as unknown as typeof XLSX.read;
    expect(() => buildMultiSheetImport(new Uint8Array(), 'room', readFn, 0))
      .toThrow('firstIndex must be a positive safe integer');
    expect(() => buildMultiSheetImport(new Uint8Array(), 'room', readFn, Number.MAX_SAFE_INTEGER))
      .toThrow('child room namespace exhausted');
  });

  it('accepts the last safe child index for a single worksheet', () => {
    const readFn = (() => ({
      SheetNames: ['Last'],
      Sheets: { Last: XLSX.utils.aoa_to_sheet([['x']]) },
    })) as unknown as typeof XLSX.read;
    const out = buildMultiSheetImport(
      new Uint8Array(),
      'room',
      readFn,
      Number.MAX_SAFE_INTEGER,
    );
    expect(out.subSheets.map((sheet) => sheet.subroom)).toEqual([
      `room.${Number.MAX_SAFE_INTEGER}`,
    ]);
  });

  it('rejects a compact repeated-row workbook before parsing either import path', () => {
    const bytes = new TextEncoder().encode(
      '<office:document><table:table><table:table-row table:number-rows-repeated="200001">' +
      '<table:table-cell office:value-type="string"><text:p>x</text:p></table:table-cell>' +
      '</table:table-row></table:table></office:document>',
    );
    const readFn = vi.fn(() => { throw new Error('parser should not run'); }) as unknown as typeof XLSX.read;
    expect(() => buildMultiSheetImport(bytes, 'room', readFn)).toThrow(/exceeds/);
    expect(() => prepareAppendImportPlan(bytes, 'fods', undefined, readFn)).toThrow(/exceeds/);
    expect(readFn).not.toHaveBeenCalled();
  });

  it('hands the workbook parser flat ODF from its root tag on both import paths', () => {
    const bytes = new TextEncoder().encode(
      '<?xml version="1.0"?><?x <Workbook><Worksheet><Table><Column ss:Span="900000000"/>' +
      '</Table></Worksheet></Workbook>?><office:document></office:document>',
    );
    const read = vi.fn((_data: Uint8Array) => ({ SheetNames: [], Sheets: {} }));
    const readFn = read as unknown as typeof XLSX.read;
    buildMultiSheetImport(bytes, 'room', readFn);
    prepareAppendImportPlan(bytes, 'fods', undefined, readFn);
    expect(read.mock.calls.map(([data]) => new TextDecoder().decode(data))).toEqual([
      '<?xml version="1.0"?><office:document></office:document>',
      '<?xml version="1.0"?><office:document></office:document>',
    ]);
    expect(buildMultiSheetImport(bytes, 'room').subSheets).toEqual([]);
  });

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

  it('stores each sheet name in the TOC as text, whatever it looks like', () => {
    // SheetJS does not validate sheet names when reading. A CSV importer
    // types its fields: the first name would become a formula that RoomDO
    // resolves against the room `other-room`, the next two numbers.
    const names = ["='other-room'!A1", '=1+1', '007', '2024-01-02', 'a:b\\c "q", x'];
    const readFn = (() => ({
      SheetNames: names,
      Sheets: Object.fromEntries(names.map((name) => [name, XLSX.utils.aoa_to_sheet([[1]])])),
    })) as unknown as typeof XLSX.read;
    const out = buildMultiSheetImport(new Uint8Array([1]), 'demo', readFn);
    const toc = createSpreadsheet({ snapshot: out.tocSave });
    const cells = toc.exportCells() as Record<string, { datatype?: string; datavalue?: unknown }>;
    names.forEach((name, i) => {
      expect(cells[`A${i + 2}`]).toMatchObject({ datatype: 't', datavalue: `/demo.${i + 1}` });
      expect(cells[`B${i + 2}`]).toMatchObject({ datatype: 't', datavalue: name });
    });
    expect(cells.A1).toMatchObject({ datatype: 't', datavalue: '#url' });
    expect(cells.B1).toMatchObject({ datatype: 't', datavalue: '#title' });
    expect(toc.findCrossSheetRefs()).toEqual([]);
  });

  it('clamps a TOC title to the length every other title door allows', () => {
    const name = 'n'.repeat(MAX_MULTI_SHEET_TITLE_LENGTH + 1);
    const readFn = (() => ({
      SheetNames: [name],
      Sheets: { [name]: XLSX.utils.aoa_to_sheet([[1]]) },
    })) as unknown as typeof XLSX.read;
    const out = buildMultiSheetImport(new Uint8Array([1]), 'demo', readFn);
    const cells = createSpreadsheet({ snapshot: out.tocSave }).exportCells() as Record<
      string,
      { datavalue?: unknown }
    >;
    expect(cells.B2?.datavalue).toBe('n'.repeat(MAX_MULTI_SHEET_TITLE_LENGTH));
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
    // Keep this test about the aggregate guard; real parser and conversion
    // paths are exercised above. Serializing a 200K-cell ZIP here makes the
    // mutation dry run depend on the CI runner's CPU speed.
    const cells = Object.fromEntries(
      Array.from({ length: half }, (_, index) => [`A${index + 1}`, { t: 'n', v: index }]),
    );
    const readFn = vi.fn(() => ({
      SheetNames: ['A', 'B'],
      Sheets: { A: cells, B: cells },
    })) as unknown as typeof XLSX.read;
    expect(() => buildMultiSheetImport(new Uint8Array(), 'big', readFn)).toThrow(/exceeds/);
    expect(readFn).toHaveBeenCalledOnce();
  }, 15_000);

  it('enforces the text limit across the whole workbook', () => {
    // One string shared by every cell, as SheetJS hands out xlsx shared
    // strings. Either sheet alone fits; the workbook does not.
    const text = 'x'.repeat(1024 * 1024);
    const cells = Object.fromEntries(
      Array.from({ length: 13 }, (_, index) => [`A${index + 1}`, { t: 's', v: text }]),
    );
    const readFn = vi.fn(() => ({
      SheetNames: ['A', 'B'],
      Sheets: { A: cells, B: cells },
    })) as unknown as typeof XLSX.read;
    expect(() => buildMultiSheetImport(new Uint8Array(), 'big', readFn))
      .toThrow(ImportArchiveTooLargeError);
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readFn))
      .toThrow(ImportArchiveTooLargeError);
    const readOne = vi.fn(() => ({
      SheetNames: ['A'],
      Sheets: { A: cells },
    })) as unknown as typeof XLSX.read;
    expect(prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readOne).count).toBe(1);
  });

  it('enforces the merged-cell limit across the whole workbook', () => {
    // One populated cell per sheet and an in-bounds extent, so only the
    // summed merge area can refuse the workbook before the merges replay.
    const mergedSheet = (rows: number) => ({
      '!ref': `A1:A${rows}`,
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: rows - 1, c: 0 } }],
      A1: { t: 'n', v: 1 },
    });
    const readWith = (rows: number) =>
      (() => ({
        SheetNames: ['A', 'B'],
        Sheets: { A: mergedSheet(rows), B: mergedSheet(rows) },
      })) as unknown as typeof XLSX.read;

    const half = MAX_IMPORT_CELLS / 2;
    const atLimit = buildMultiSheetImport(new Uint8Array(), 'room', readWith(half));
    expect(atLimit.subSheets).toHaveLength(2);
    expect(atLimit.subSheets[1]?.save).toContain(`:rowspan:${half}`);
    const plan = prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readWith(half));
    expect(plan.materializeSaves('room', 1)[1]).toContain(`:rowspan:${half}`);

    expect(() => buildMultiSheetImport(new Uint8Array(), 'room', readWith(half + 1)))
      .toThrow(ImportTooLargeError);
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readWith(half + 1)))
      .toThrow(ImportTooLargeError);
  });

  it('validates merge endpoints on every sheet before counting or replaying them', () => {
    const readFn = (() => ({
      SheetNames: ['A', 'B'],
      Sheets: {
        A: { '!ref': 'A1', A1: { t: 'n', v: 1 } },
        B: { '!ref': 'A1', '!merges': [{ s: { r: 0, c: 0 } }], A1: { t: 'n', v: 1 } },
      },
    })) as unknown as typeof XLSX.read;
    expect(() => buildMultiSheetImport(new Uint8Array(), 'room', readFn)).toThrow(
      ImportColumnOutOfRangeError,
    );
  });

  it('enforces the combined grid position limit across the whole workbook', () => {
    // 10 x 200,000 = MAX_WORKBOOK_GRID_POSITIONS (2,000,000) fits; 11th overflows.
    const ok = Array.from({ length: 10 }, () => sparseSheet(MAX_IMPORT_CELLS));
    const over = Array.from({ length: 11 }, () => sparseSheet(MAX_IMPORT_CELLS));
    expect(buildMultiSheetImport(new Uint8Array(), 'grid', readSheets(ok)).subSheets).toHaveLength(10);
    expect(prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readSheets(ok)).count).toBe(10);
    expect(() => buildMultiSheetImport(new Uint8Array(), 'grid', readSheets(over)))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readSheets(over)))
      .toThrow(ImportDimensionsTooLargeError);
    expect(MAX_WORKBOOK_GRID_POSITIONS).toBe(2_000_000);
  });

  it('recalculates the sheets of one workbook on one formula budget', () => {
    // WORKBOOK_RECALC_MULTIPLIER = 4 => 40,000 DDB steps shared across all sheets.
    const seven = Array.from({ length: 7 }, loopSheet);
    const out = buildMultiSheetImport(new Uint8Array(), 'loops', readSheets(seven)).subSheets;
    for (let i = 0; i < 6; i++) {
      expect(out[i]?.save).toContain('cell:A1:vtf:n$:');
    }
    expect(out[6]?.save).toContain('cell:A1:vtf:e#NUM!:');
    // A sheet the workbook lists but does not contain costs nothing.
    const gap = { SheetNames: ['a', 'gone', 'b'], Sheets: { a: seven[0], b: seven[1] } };
    expect(
      buildMultiSheetImport(new Uint8Array(), 'loops', (() => gap) as unknown as typeof XLSX.read).subSheets,
    ).toHaveLength(2);
    // The budget belongs to one import.
    const [again] = buildMultiSheetImport(new Uint8Array(), 'loops', readSheets([loopSheet()])).subSheets;
    expect(again?.save).toContain('cell:A1:vtf:n$:');
  });

  it('rejects workbook fan-out beyond the shared sheet limit', () => {
    const names = Array.from(
      { length: MAX_MULTI_SHEETS + 1 },
      (_, index) => `Sheet${index + 1}`,
    );
    const mockRead = () =>
      ({
        SheetNames: names,
        Sheets: {},
      }) as XLSX.WorkBook;
    expect(() =>
      buildMultiSheetImport(new Uint8Array(), 'too-many', mockRead),
    ).toThrow(ImportTooManySheetsError);
  });

  it('rejects a worksheet with AAA column (beyond SocialCalc ZZ)', () => {
    const ws = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      AAA1: { t: 'n', v: 703 },
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wide');
    const bytes = new Uint8Array(
      XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer,
    );
    expect(() => buildMultiSheetImport(bytes, 'wide')).toThrow(
      ImportColumnOutOfRangeError,
    );
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

  it('imports the value of a formula that refers to a sheet the file does not bring along', () => {
    const outside = [
      // Excel's spelling of a cell in another workbook.
      "'[1]Price List'!B2*100",
      "SUM('Q1:Q4'!B2)",
      // Excel matches titles without regard to case; a room name does not.
      'rates!B2*100',
      '"Rates"!B2*100',
      'Rates !B2*100',
      "Rates!B2+'Deleted'!B2",
      'Gone!B2',
      'A2!B2',
      '!B2',
    ];
    const summary: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([[0]]);
    outside.forEach((f, row) => {
      summary[`A${row + 1}`] = { t: 'n', v: 700 + row, f };
    });
    summary.B1 = { t: 'n', v: 7, f: "Rates!B2+'Other Data'!A1" };
    summary.B2 = { t: 's', v: 'x', f: '"Rates up!"&A1' };
    summary.B3 = { t: 's', v: 'see Rates!B2' };
    summary.B4 = { t: 's', v: 'Widget', f: "'[1]Price List'!A2" };
    summary.B5 = { t: 'e', v: 0x17, f: "'[1]Price List'!A3" };
    summary['!ref'] = 'A1:B9';
    const mockRead = (() => ({
      SheetNames: ['Summary', 'Rates', 'Other Data'],
      Sheets: {
        Summary: summary,
        Rates: XLSX.utils.aoa_to_sheet([['rate', 7]]),
        'Other Data': XLSX.utils.aoa_to_sheet([[7]]),
      },
    })) as unknown as typeof XLSX.read;
    const saves = [
      buildMultiSheetImport(new Uint8Array(), 'demo', mockRead, 5).subSheets[0]!.save,
      prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, mockRead).materializeSaves('demo', 5)[0]!,
    ];
    for (const save of saves) {
      outside.forEach((_, row) => {
        expect(save).toContain(`\ncell:A${row + 1}:v:${700 + row}\n`);
      });
      expect(save).not.toMatch(/^cell:A\d+:vtf:/m);
      // The value is whatever the file carries: text stays text, and a cell
      // whose cached value is an error is left empty.
      expect(save).toContain('\ncell:B4:t:Widget\n');
      expect(save).not.toMatch(/^cell:B5:/m);
      // References inside the file still follow the sheets to their rooms …
      expect(save).toMatch(/^cell:B1:vtf:[^\n]*:'demo\.6'!B2\+'demo\.7'!A1/m);
      // … and a `!` that is not a reference is left as the file has it.
      expect(save).toMatch(/^cell:B2:vtf:[^\n]*:"Rates up!"&A1/m);
      expect(save).toContain('\ncell:B3:t:see Rates!B2\n');
      expect(save).not.toContain('Price List');
    }
  });

});

describe('multi-sheet import contract', () => {
  it('names and describes the too-many-sheets error', () => {
    const error = new ImportTooManySheetsError(999);
    expect(error.name).toBe('ImportTooManySheetsError');
    expect(error.message).toBe(
      `workbook exceeds ${MAX_MULTI_SHEETS} sheets (999)`,
    );
    expect(error.sheetCount).toBe(999);
  });

  it('accepts exactly MAX_MULTI_SHEETS and rejects one more', () => {
    const names = Array.from({ length: MAX_MULTI_SHEETS }, (_unused, index) => ({
      SheetNames: `s${index}`,
    }));
    const readFn = ((): unknown => ({
      SheetNames: names.map((entry) => entry.SheetNames),
      Sheets: Object.fromEntries(
        names.map((entry) => [entry.SheetNames, { '!ref': 'A1:A1', A1: { t: 'n', v: 1 } }]),
      ),
    })) as unknown as typeof XLSX.read;
    expect(() =>
      buildMultiSheetImport(new Uint8Array(), 'room', readFn),
    ).not.toThrow();

    const oneMore = ((): unknown => {
      const sheetNames = [
        ...names.map((entry) => entry.SheetNames),
        'overflow',
      ];
      return {
        SheetNames: sheetNames,
        Sheets: Object.fromEntries(
          sheetNames.map((name) => [name, { '!ref': 'A1:A1', A1: { t: 'n', v: 1 } }]),
        ),
      };
    }) as unknown as typeof XLSX.read;
    expect(() =>
      buildMultiSheetImport(new Uint8Array(), 'room', oneMore),
    ).toThrow(ImportTooManySheetsError);
  });

  it('asks the reader for an array workbook with formulas preserved', () => {
    const seen: Array<Record<string, unknown>> = [];
    const readFn = ((_bytes: unknown, opts: Record<string, unknown>): unknown => {
      seen.push(opts);
      return { SheetNames: [], Sheets: {} };
    }) as unknown as typeof XLSX.read;
    buildMultiSheetImport(new Uint8Array(), 'room', readFn);
    expect(seen[0]).toEqual({ type: 'array', cellFormula: true });
  });

  it('emits the TOC header row verbatim', () => {
    const bytes = workbookBytes([{ name: 'Alpha', aoa: [['a']] }]);
    const out = buildMultiSheetImport(bytes, 'demo');
    expect(out.tocSave).toContain('#url');
    expect(out.tocSave).toContain('#title');
  });
});
describe('buildMultiSheetAppendImport', () => {
  it('allocates new subrooms strictly after current max index and rewrites formulas', () => {
    const bytes = workbookBytes([
      { name: 'First', aoa: [[1]] },
      { name: 'Second', aoa: [[2]] },
    ]);
    const existingLinks = ['/room.1', '/room.5'];
    const existingTitles = ['Sheet1', 'Data'];

    const result = buildMultiSheetAppendImport(bytes, 'room', existingLinks, existingTitles);
    expect(result.subSheets).toHaveLength(2);
    expect(result.subSheets[0]).toMatchObject({
      subroom: 'room.6',
      link: '/room.6',
      title: 'First',
    });
    expect(result.subSheets[1]).toMatchObject({
      subroom: 'room.7',
      link: '/room.7',
      title: 'Second',
    });
  });
  it('rejects unsupported import formats', () => {
    const err = new ImportUnsupportedFormatError('pdf');
    expect(err.message).toBe('unsupported multi-sheet import format: pdf');
    expect(() =>
      buildMultiSheetAppendImport(new Uint8Array(), 'room', [], [], { format: 'pdf' }),
    ).toThrow(ImportUnsupportedFormatError);
  });

  it('uses default upper-case and SocialCalc title fallbacks when titleHint is omitted', () => {
    const txtRes = buildMultiSheetAppendImport(
      new TextEncoder().encode('hello'),
      'room',
      [],
      [],
      { format: 'txt' },
    );
    expect(txtRes.subSheets[0]?.title).toBe('TXT');

    const scRes = buildMultiSheetAppendImport(
      new TextEncoder().encode('version:1.5'),
      'room',
      [],
      [],
      { format: 'socialcalc' },
    );
    expect(scRes.subSheets[0]?.title).toBe('SocialCalc');
  });

  it('rejects single-sheet text append when MAX_MULTI_SHEETS is reached', () => {
    const existingLinks = Array.from({ length: MAX_MULTI_SHEETS }, (_, i) => `/room.${i + 1}`);
    expect(() =>
      buildMultiSheetAppendImport(new Uint8Array(), 'room', existingLinks, [], { format: 'csv' }),
    ).toThrow(ImportTooManySheetsError);
  });

  it('deduplicates sheet titles against existing titles and skips missing sheets', () => {
    const readFn = ((): unknown => ({
      SheetNames: ['Sheet1', 'Missing', 'Data'],
      Sheets: {
        Sheet1: { '!ref': 'A1', A1: { t: 'n', v: 1 } },
        Data: { '!ref': 'A1', A1: { t: 'n', v: 2 } },
      },
    })) as unknown as typeof XLSX.read;

    const result = buildMultiSheetAppendImport(
      new Uint8Array(),
      'room',
      ['/room.1'],
      ['Sheet1'],
      readFn,
    );

    expect(result.subSheets).toHaveLength(2);
    expect(result.subSheets[0]?.title).toBe('Sheet1_2');
    expect(result.subSheets[1]?.title).toBe('Data');
  });

  it('handles missing SheetNames or blank sheet titles defensively', () => {
    const readFnNoNames = ((): unknown => ({})) as unknown as typeof XLSX.read;
    const resEmpty = buildMultiSheetAppendImport(
      new Uint8Array(),
      'room',
      [],
      [],
      readFnNoNames,
    );
    expect(resEmpty.subSheets).toHaveLength(0);

    const readFnBlankTitle = ((): unknown => ({
      SheetNames: ['   '],
      Sheets: {
        '   ': { '!ref': 'A1', A1: { t: 'n', v: 1 } },
      },
    })) as unknown as typeof XLSX.read;
    const resBlank = buildMultiSheetAppendImport(
      new Uint8Array(),
      'room',
      ['/room.1'],
      [],
      readFnBlankTitle,
    );
    expect(resBlank.subSheets[0]?.title).toBe('Sheet2');
  });

  it('rejects an over-25-MiB uncompressed ZIP before calling XLSX.read', () => {
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/worksheets/sheet1.xml', compressedSize: 100, uncompressedSize: 30 * 1024 * 1024 },
    ]);
    const readFn = vi.fn();

    expect(() =>
      buildMultiSheetAppendImport(bytes, 'room', [], [], readFn as any),
    ).toThrow(ImportArchiveTooLargeError);

    expect(readFn).not.toHaveBeenCalled();
  });

  it('rejects an absurd !ref range (A1:ZZ1000000) before worksheetToSave or cell replay', () => {
    const readFn = vi.fn().mockReturnValue({
      SheetNames: ['Absurd'],
      Sheets: {
        Absurd: { '!ref': 'A1:ZZ1000000', A1: { t: 'n', v: 1 } },
      },
    });

    expect(() =>
      buildMultiSheetAppendImport(new Uint8Array(), 'room', [], [], readFn as any),
    ).toThrow(ImportDimensionsTooLargeError);
  });

  it('enforces total sheet limit when appending', () => {
    const existingLinks = Array.from({ length: MAX_MULTI_SHEETS }, (_, i) => `/room.${i + 1}`);
    const bytes = workbookBytes([{ name: 'Extra', aoa: [[1]] }]);

    expect(() =>
      buildMultiSheetAppendImport(bytes, 'room', existingLinks, []),
    ).toThrow(ImportTooManySheetsError);
  });

  it('appends csv/tsv/txt/socialcalc as a single text sheet with size bounds', () => {
    const csv = buildMultiSheetAppendImport(
      new TextEncoder().encode('a,b\n1,2'),
      'room',
      ['/room.1', '/room.5'],
      ['Sheet1', 'Data'],
      { format: 'csv', titleHint: 'CSVData' },
    );
    expect(csv.subSheets).toHaveLength(1);
    expect(csv.subSheets[0]).toMatchObject({
      subroom: 'room.6',
      link: '/room.6',
      title: 'CSVData',
    });
    expect(csv.subSheets[0]!.save.length).toBeGreaterThan(0);

    const tsv = buildMultiSheetAppendImport(
      new TextEncoder().encode('a\tb\n1\t2'),
      'room',
      ['/room.1'],
      ['Sheet1'],
      { format: 'tsv', titleHint: 'TSV' },
    );
    expect(tsv.subSheets[0]?.title).toBe('TSV');

    const sc = buildMultiSheetAppendImport(
      new TextEncoder().encode('cell:A1:vtf:n:1:SheetX!A1\n'),
      'room',
      [],
      [],
      { format: 'socialcalc', titleHint: 'SheetX' },
    );
    expect(sc.subSheets[0]?.save).toContain("'room.1'!A1");

    const tooBig = new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1);
    expect(() =>
      buildMultiSheetAppendImport(tooBig, 'room', [], [], { format: 'csv' }),
    ).toThrow(ImportArchiveTooLargeError);
  });
});

describe('getMaxSubsheetIndex & rewriteSheetReferences', () => {
  it('getMaxSubsheetIndex finds max index for current room links only', () => {
    expect(getMaxSubsheetIndex(['/room.0', '/room.1', '/room.8', '/other.99', '/room.invalid'], 'room')).toBe(8);
    expect(getMaxSubsheetIndex([], 'room')).toBe(0);
  });

  it('rewriteSheetReferences replaces sheet references with subroom ids', () => {
    expect(rewriteSheetReferences("cell:A1:vtf:n:1:Second!A1", ['First', 'Second'], 'room', 6)).toBe(
      "cell:A1:vtf:n:1:'room.7'!A1",
    );
    expect(rewriteSheetReferences('body', [], 'room', 6)).toBe('body');
  });

  it('rewriteSheetReferences bounds what the room name may add', () => {
    // `a!` (2 chars) becomes `'room.1'!` (9 chars): 7 added per reference.
    const atLimit = MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES - 7;
    expect(rewriteSheetReferences('a!', ['a'], 'room', 1, atLimit)).toBe("'room.1'!");
    expect(() => rewriteSheetReferences('a!', ['a'], 'room', 1, atLimit + 1)).toThrow(
      new ImportArchiveTooLargeError('a!'.length + MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1),
    );
    // A long sheet name shrinks the save and gives that room back.
    expect(rewriteSheetReferences('LongSheetName!a!', ['LongSheetName', 'a'], 'r', 1, atLimit)).toBe(
      "'r.1'!'r.2'!",
    );
  });

  it('rewriteSheetReferences reads the name before each `!` off the text', () => {
    const names = ['Data', "It's", 'My Sheet', 'v1.2', 'Größe_2', '数据', "'", ''];
    const rewrite = (body: string): string => rewriteSheetReferences(body, names, 'r', 1);
    // Unquoted: the whole run of name characters before the `!`, no less.
    expect(rewrite('Data!A1')).toBe("'r.1'!A1");
    expect(rewrite('=v1.2!A1+Größe_2!B2-数据!C3')).toBe("='r.4'!A1+'r.5'!B2-'r.6'!C3");
    expect(rewrite('1+Data!A1*(Data!B2)')).toBe("1+'r.1'!A1*('r.1'!B2)");
    for (const other of ['MyData!A1', 'my.Data!A1', 'x_Data!A1', '9Data!A1', 'éData!A1', 'data!A1']) {
      expect(rewrite(other)).toBe(other);
    }
    for (const before of ['`', '{', '@', '[', '/', ':', '^', ' ', '\x7f']) {
      expect(rewrite(`${before}Data!A1`)).toBe(`${before}'r.1'!A1`);
    }
    expect(rewriteSheetReferences('+azAZ09_.\x80!', ['azAZ09_.\x80'], 'r', 1)).toBe("+'r.1'!");
    // Quoted: everything between the quotes, `''` standing for one apostrophe.
    expect(rewrite("'Data'!A1+'My Sheet'!B2")).toBe("'r.1'!A1+'r.3'!B2");
    expect(rewrite("'It''s'!A1")).toBe("'r.2'!A1");
    expect(rewrite("''''!A1")).toBe("'r.7'!A1");
    expect(rewrite("'Other Data'!A1")).toBe("'Other Data'!A1");
    expect(rewrite("'It''s not'!A1")).toBe("'It''s not'!A1");
    expect(rewrite('My Sheet!A1')).toBe('My Sheet!A1');
    // Apostrophes in text neither hide a later reference nor open a name.
    expect(rewrite(`IF(A1="don't",Data!A1,"isn't")`)).toBe(`IF(A1="don't",'r.1'!A1,"isn't")`);
    expect(rewrite(`"it's"&'Data'!A1&'My Sheet'!B2`)).toBe(`"it's"&'r.1'!A1&'r.3'!B2`);
    expect(rewrite("Data'!A1")).toBe("Data'!A1");
    expect(rewrite("''Data'!A1")).toBe("''Data'!A1");
    expect(rewrite("'!")).toBe("'!");
    expect(rewrite("'''!")).toBe("'''!");
    // An empty name is only ever a quoted one, and nothing precedes a leading `!`.
    expect(rewrite("''!A1+!A1")).toBe("'r.8'!A1+!A1");
    expect(rewrite('!A1')).toBe('!A1');
    expect(rewrite('!Data!!Data!')).toBe("!'r.1'!!'r.1'!");
  });

  it('rewriteSheetReferences keeps a `!` inside a quoted sheet name with that name', () => {
    const names = ['Sales', 'Sales! 2024', '!'];
    const rewrite = (body: string): string => rewriteSheetReferences(body, names, 'r', 1);
    expect(rewrite("Sales!A1+'Sales! 2024'!B2+'Sales'!C3")).toBe("'r.1'!A1+'r.2'!B2+'r.1'!C3");
    expect(rewrite("'!'!A1")).toBe("'r.3'!A1");
    // A sheet that is not part of the upload keeps its name.
    expect(rewrite("'Costs! 2024'!A1+Sales!B2")).toBe("'Costs! 2024'!A1+'r.1'!B2");
  });

  it('rewriteSheetReferences does not search the text for uploaded sheet names', () => {
    // Each sheet name used to be an alternative of one pattern tried at every
    // word, which took seconds for this input; reading it takes milliseconds.
    const longName = `${'a '.repeat(10_000)}c ${'a '.repeat(10_000)}a`;
    const body = 'a '.repeat(1_000_000);
    const started = performance.now();
    expect(rewriteSheetReferences(body, ['Data', longName], 'room', 1)).toBe(body);
    expect(rewriteSheetReferences(`${body}'${longName}'!A1`, ['Data', longName], 'room', 1)).toBe(
      `${body}'room.2'!A1`,
    );
    expect(performance.now() - started).toBeLessThan(1_000);
  });
});

describe('prepareAppendImportPlan', () => {
  it('bounds text imports before save materialization', () => {
    const bytes = new TextEncoder().encode('x,'.repeat(MAX_SOCIALCALC_COL) + 'x');
    expect(() => prepareAppendImportPlan(bytes, 'csv')).toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(new TextEncoder().encode('"a,b",c\r\nd,e\n'), 'csv')).not.toThrow();
    expect(() => enforceTextImportLimits(new TextEncoder().encode('"a""b",c\n'), 'csv')).not.toThrow();
    expect(() => enforceTextImportLimits(new TextEncoder().encode('a\tb\n'), 'tsv')).not.toThrow();
    expect(() => enforceTextImportLimits(new TextEncoder().encode('a\r'), 'csv')).not.toThrow();
    expect(() => enforceTextImportLimits(new Uint8Array(1024 * 1024 + 1).fill(0x78), 'txt')).toThrow(ImportArchiveTooLargeError);
  });
  it('defers concrete subroom ids until materializeSaves is given firstIndex', () => {
    const plan = prepareAppendImportPlan(
      new TextEncoder().encode('a,b\n1,2'),
      'csv',
      'CSVData',
    );
    expect(plan.count).toBe(1);
    expect(plan.preferredTitles).toEqual(['CSVData']);
    const saves = plan.materializeSaves('room', 9);
    expect(saves).toHaveLength(1);
    expect(saves[0]!.length).toBeGreaterThan(0);
  });

  it('rejects workbook plans with too many present sheets', () => {
    const names = Array.from({ length: MAX_MULTI_SHEETS + 1 }, (_, i) => `S${i}`);
    const sheets: Record<string, unknown> = {};
    for (const name of names) sheets[name] = { '!ref': 'A1', A1: { t: 'n', v: 1 } };
    const readFn = (() => ({ SheetNames: names, Sheets: sheets })) as unknown as typeof XLSX.read;
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readFn)).toThrow(
      ImportTooManySheetsError,
    );
  });

  it('covers tsv/socialcalc materializers and rejects oversized text uploads', () => {
    const tsv = prepareAppendImportPlan(
      new TextEncoder().encode('a\tb\n1\t2'),
      'tsv',
      'TSV',
    );
    expect(tsv.count).toBe(1);
    expect(tsv.materializeSaves('room', 1)[0]!.length).toBeGreaterThan(0);

    const sc = prepareAppendImportPlan(
      new TextEncoder().encode('cell:A1:vtf:n:1:SheetX!A1\n'),
      'socialcalc',
      'SheetX',
    );
    expect(sc.materializeSaves('room', 3)[0]).toContain("'room.3'!A1");

    const tooBig = new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1);
    expect(() => prepareAppendImportPlan(tooBig, 'csv')).toThrow(ImportArchiveTooLargeError);
    expect(() => prepareAppendImportPlan(new Uint8Array([1]), 'nope')).toThrow(
      ImportUnsupportedFormatError,
    );
  });

  it('refuses a socialcalc append whose rewritten references outgrow the import limit', () => {
    const room = 'r'.repeat(2000);
    const body = new TextEncoder().encode(
      `version:1.5\ncell:A1:t:${'a!'.repeat(20_000)}\nsheet:c:1:r:1\n`,
    );
    expect(() =>
      prepareAppendImportPlan(body, 'socialcalc', 'a').materializeSaves(room, 1),
    ).toThrow(ImportArchiveTooLargeError);
    // The same bytes under a title they do not mention are stored as uploaded.
    expect(prepareAppendImportPlan(body, 'socialcalc', 'b').materializeSaves(room, 1)[0]).toHaveLength(
      body.length,
    );
  });

  it('shares the rewrite allowance and total save budget between the sheets of one workbook', () => {
    const room = 'r'.repeat(2000);
    // Each sheet adds about 16 MiB on its own; only both together pass 25 MiB.
    const formula = Array.from({ length: 8_000 }, () => 'a!A1').join('+');
    const sheet = (): Record<string, unknown> => ({ '!ref': 'A1', A1: { t: 'n', v: 1, f: formula } });
    const plan = (names: string[]) =>
      prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, (() => ({
        SheetNames: names,
        Sheets: Object.fromEntries(names.map((name) => [name, sheet()])),
      })) as unknown as typeof XLSX.read);
    const single = plan(['a']).materializeSaves(room, 1);
    expect(single[0]!.length).toBeGreaterThan(8_000 * 2000);
    expect(() => plan(['a', 'b']).materializeSaves(room, 1)).toThrow(ImportArchiveTooLargeError);

    // Total materialized save bytes across sheets also obeys MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES
    // even when reference growth alone stayed under 25 MiB.
    const literalSheet: Record<string, unknown> = { '!ref': 'A1:A14' };
    for (let i = 1; i <= 14; i++) literalSheet[`A${i}`] = { t: 's', v: 'x'.repeat(1_000_000) };
    const mediumFormula = Array.from({ length: 7_000 }, () => 'a!A1').join('+');
    const readCombined = (() => ({
      SheetNames: ['a', 'b'],
      Sheets: { a: literalSheet, b: { '!ref': 'A1', A1: { t: 'n', v: 1, f: mediumFormula } } },
    })) as unknown as typeof XLSX.read;
    expect(() =>
      prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readCombined).materializeSaves(room, 1),
    ).toThrow(ImportArchiveTooLargeError);
  });

  it('recalculates the sheets of one plan on one formula budget', () => {
    const plan = (count: number) =>
      prepareAppendImportPlan(
        new Uint8Array(),
        'xlsx',
        undefined,
        readSheets(Array.from({ length: count }, loopSheet)),
      );
    const seven = plan(7).materializeSaves('loops', 1);
    for (let i = 0; i < 6; i++) {
      expect(seven[i]).toContain('cell:A1:vtf:n$:');
    }
    expect(seven[6]).toContain('cell:A1:vtf:e#NUM!:');
    // The budget belongs to one import.
    expect(plan(1).materializeSaves('loops', 1)[0]).toContain('cell:A1:vtf:n$:');
  });
});

describe('parseAddSheetRequest', () => {
  it('returns only the title and request id', () => {
    expect(
      parseAddSheetRequest('{"title":"Sheet","requestId":"a-B_1","extra":{"34":{"34":0}}}'),
    ).toEqual({ title: 'Sheet', requestId: 'a-B_1' });
  });

  it.each([
    'null',
    '"text"',
    '{"requestId":"r"}',
    '{"title":1,"requestId":"r"}',
    '{"title":"t"}',
    '{"title":"t","requestId":1}',
    '{"title":"t","requestId":""}',
    `{"title":"t","requestId":"${'r'.repeat(129)}"}`,
    '{"title":"t","requestId":"a b"}',
  ])('returns null for %s', (text) => {
    expect(parseAddSheetRequest(text)).toBeNull();
  });

  it('accepts a request id of exactly 128 characters', () => {
    const requestId = 'r'.repeat(128);
    expect(parseAddSheetRequest(JSON.stringify({ title: '', requestId }))).toEqual({
      title: '',
      requestId,
    });
  });

  it('throws on invalid JSON', () => {
    expect(() => parseAddSheetRequest('{')).toThrow(SyntaxError);
  });
});

describe('multi-sheet-import mutation pins', () => {
  it('mutation pins for getMaxSubsheetIndex multi-digit and non-numeric suffixes', () => {
    // Multi-digit suffix must beat single-digit (kills /^\d$/ and /^\d+/ without $ mutants).
    expect(
      getMaxSubsheetIndex(['/room.9', '/room.10', '/room.2', '/room.10a', '/room.not', '/other.99'], 'room'),
    ).toBe(10);
    // Prefix gate: foreign rooms never contribute even with large numeric suffixes.
    // Critical: `/b.100` with room `a` must stay 0 — if startsWith is removed,
    // slice(prefix.length) yields `100` and max becomes 100.
    expect(getMaxSubsheetIndex(['/other.999', '/roomX.8', 'room.7', '/b.100'], 'a')).toBe(0);
    expect(getMaxSubsheetIndex(['/a.3', '/b.100'], 'a')).toBe(3);
    // Non-numeric / empty suffix ignored.
    expect(getMaxSubsheetIndex(['/room.', '/room.abc', '/room.1b2'], 'room')).toBe(0);
    // Equality: equal max is not increased (kills >= mutant).
    expect(getMaxSubsheetIndex(['/room.5', '/room.5', '/room.4'], 'room')).toBe(5);
    // Leading-zero multi-digit still numeric.
    expect(getMaxSubsheetIndex(['/room.09', '/room.9'], 'room')).toBe(9);
    // Scientific-looking suffix must NOT parse as a number (kills loose regex /
    // skipped-regex mutants: Number('5e2') === 500).
    expect(getMaxSubsheetIndex(['/room.5e2', '/room.3'], 'room')).toBe(3);
    expect(getMaxSubsheetIndex(['/room.5e2'], 'room')).toBe(0);
  });

  it('buildMultiSheetImport treats non-array SheetNames as empty', () => {
    // Defensive fallback: SheetJS always yields an array, but a broken/mocked
    // reader must not invent sheet names from the empty-array literal. If the
    // `[]` fallback is replaced with a non-empty default, a coincidental
    // Sheets key would be imported.
    const phantom = 'Stryker was here';
    const ws = {
      A1: { t: 's', v: 'leaked' },
      '!ref': 'A1',
    };
    const out = buildMultiSheetImport(
      new Uint8Array([1]),
      'room',
      () =>
        ({
          SheetNames: null,
          Sheets: { [phantom]: ws },
        }) as never,
    );
    expect(out.subSheets).toEqual([]);
    expect(out.tocSave).not.toContain('leaked');
    expect(out.tocSave).not.toContain(phantom);
  });

  it('mutation pins for rewriteSheetReferences quoting and empty names', () => {
    const body = "cell:A1:vtf:n:1:Second!A1+'O''Brien'!B2";
    expect(rewriteSheetReferences(body, [], 'room', 6)).toBe(body);
    expect(rewriteSheetReferences(body, ['First', 'Second', "O'Brien"], 'room', 6)).toBe(
      "cell:A1:vtf:n:1:'room.7'!A1+'room.8'!B2",
    );
    // Special-char sheet names are referenced quoted and matched literally.
    const weird = rewriteSheetReferences("cell:A1:vtf:n:1:'A+B'!A1+'AAB'!A1", ['A+B'], 'r', 1);
    expect(weird).toBe("cell:A1:vtf:n:1:'r.1'!A1+'AAB'!A1");
  });

  it('mutation pins for upload size boundary and format gates', () => {
    // Equal to limit is allowed; one over throws (kills >= mutant).
    const atLimit = new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES);
    expect(() =>
      prepareAppendImportPlan(
        atLimit,
        'socialcalc',
        'Edge',
      ),
    ).not.toThrow();
    expect(() =>
      prepareAppendImportPlan(
        new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1),
        'csv',
      ),
    ).toThrow(ImportArchiveTooLargeError);

    // Exact MAX sheets is allowed; MAX+1 throws (kills >= mutant).
    const namesOk = Array.from({ length: MAX_MULTI_SHEETS }, (_, i) => `S${i}`);
    const sheetsOk: Record<string, unknown> = {};
    for (const name of namesOk) sheetsOk[name] = { '!ref': 'A1', A1: { t: 'n', v: 1 } };
    const readOk = (() => ({ SheetNames: namesOk, Sheets: sheetsOk })) as unknown as typeof XLSX.read;
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readOk)).not.toThrow();

    const namesBad = Array.from({ length: MAX_MULTI_SHEETS + 1 }, (_, i) => `S${i}`);
    const sheetsBad: Record<string, unknown> = {};
    for (const name of namesBad) sheetsBad[name] = { '!ref': 'A1', A1: { t: 'n', v: 1 } };
    const readBad = (() => ({
      SheetNames: namesBad,
      Sheets: sheetsBad,
    })) as unknown as typeof XLSX.read;
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readBad)).toThrow(
      ImportTooManySheetsError,
    );

    // Format is lower-cased (kills toUpperCase mutant).
    const upper = prepareAppendImportPlan(new TextEncoder().encode('a'), 'CSV', 'T');
    expect(upper.count).toBe(1);

    // TSV must convert tabs to commas (kills identity/empty-replace mutants).
    const tsvSave = prepareAppendImportPlan(
      new TextEncoder().encode('a\tb'),
      'tsv',
      'T',
    ).materializeSaves('room', 1)[0]!;
    const csvSave = prepareAppendImportPlan(
      new TextEncoder().encode('a,b'),
      'csv',
      'T',
    ).materializeSaves('room', 1)[0]!;
    expect(tsvSave).toBe(csvSave);

    // socialcalc path rewrites; csv path does not look like socialcalc formulas.
    const sc = prepareAppendImportPlan(
      new TextEncoder().encode('cell:A1:vtf:n:1:SheetX!A1'),
      'socialcalc',
      'SheetX',
    ).materializeSaves('r', 2)[0]!;
    expect(sc).toContain("'r.2'!A1");
    expect(sc).not.toContain('SheetX!');
  });

  it("mutation pins format 'XLSX' lowercasing on append import", () => {
    const bytes = workbookBytes([{ name: 'S', aoa: [[1]] }]);
    const res = buildMultiSheetAppendImport(bytes, 'room', [], [], { format: 'XLSX' });
    expect(res.subSheets).toHaveLength(1);
    expect(res.subSheets[0]?.subroom).toBe('room.1');
  });

  it('mutation pins for buildMultiSheetAppendImport sheet-cap arithmetic', () => {
    const existing = Array.from({ length: MAX_MULTI_SHEETS - 1 }, (_, i) => `/room.${i + 1}`);
    const titles = existing.map((_, i) => `T${i}`);
    // One more sheet fits exactly at the boundary.
    const one = workbookBytes([{ name: 'Last', aoa: [[1]] }]);
    expect(() => buildMultiSheetAppendImport(one, 'room', existing, titles)).not.toThrow();
    // Two more exceeds (kills >= and - arithmetic mutants).
    const two = workbookBytes([
      { name: 'A', aoa: [[1]] },
      { name: 'B', aoa: [[2]] },
    ]);
    expect(() => buildMultiSheetAppendImport(two, 'room', existing, titles)).toThrow(
      ImportTooManySheetsError,
    );
    try {
      buildMultiSheetAppendImport(two, 'room', existing, titles);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportTooManySheetsError);
      expect((err as ImportTooManySheetsError).sheetCount).toBe(MAX_MULTI_SHEETS + 1);
      expect((err as Error).message).toContain(String(MAX_MULTI_SHEETS + 1));
    }
  });

  it('mutation pins unsupported format error name/message', () => {
    try {
      prepareAppendImportPlan(new Uint8Array([1]), 'nope');
      throw new Error("expected throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ImportUnsupportedFormatError);
      expect((err as Error).name).toBe('ImportUnsupportedFormatError');
      expect((err as Error).message).toContain('nope');
      expect((err as Error).message.length).toBeGreaterThan(0);
    }
  });
});

describe('text import limits', () => {
  const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);
  const maxFieldBytes = 1024 * 1024;

  it('keeps quoted separators in one field and counts escaped quotes once', () => {
    expect(() => enforceTextImportLimits(
      bytes(`"x",${'y,'.repeat(MAX_SOCIALCALC_COL)}`),
      'csv',
    )).toThrow(ImportDimensionsTooLargeError);

    const quotedAtLimit = `"${'x'.repeat(maxFieldBytes - 3)}"""`;
    expect(() => enforceTextImportLimits(bytes(quotedAtLimit), 'csv')).not.toThrow();
  });

  it('treats only tabs as TSV separators', () => {
    expect(() => enforceTextImportLimits(bytes('x'.repeat(MAX_SOCIALCALC_COL + 1)), 'tsv'))
      .not.toThrow();
  });

  it('counts CR-only and LF-only rows', () => {
    expect(() => enforceTextImportLimits(bytes('x\r'.repeat(MAX_IMPORT_CELLS + 1)), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes('\n'.repeat(MAX_IMPORT_CELLS + 1)), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
  });

  it('bounds each field independently, including quoted content', () => {
    expect(() => enforceTextImportLimits(new Uint8Array(maxFieldBytes).fill(0x78), 'txt'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes(`"${'x'.repeat(maxFieldBytes)}"`), 'csv'))
      .toThrow(ImportArchiveTooLargeError);
    expect(() => enforceTextImportLimits(bytes(`${'x'.repeat(1000)}\n`.repeat(1100)), 'txt'))
      .not.toThrow();
  }, 30_000);

  it('counts unquoted columns and resets the count for each row', () => {
    const maxColumns = Array(MAX_SOCIALCALC_COL).fill('x').join(',');
    expect(() => enforceTextImportLimits(bytes(`${maxColumns}\n`), 'csv')).not.toThrow();
    expect(() => enforceTextImportLimits(bytes(`${maxColumns},x\n`), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes('x,y\n'.repeat(MAX_SOCIALCALC_COL)), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes('x\t'.repeat(MAX_SOCIALCALC_COL)), 'tsv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes('x\t'.repeat(MAX_SOCIALCALC_COL)), 'csv'))
      .not.toThrow();
  });

  it('treats quoted separators and escaped quotes as field content', () => {
    const remaining = Array(MAX_SOCIALCALC_COL - 1).fill('x').join(',');
    expect(() => enforceTextImportLimits(bytes(`"a""b,c",${remaining}\n`), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes(`"a\tb"\t${remaining}\n`), 'tsv'))
      .not.toThrow();
  });

  it('counts logical rows across LF, CRLF, quoted newlines and final rows', () => {
    expect(() => enforceTextImportLimits(bytes('x\n'.repeat(MAX_IMPORT_CELLS)), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes('x\n'.repeat(MAX_IMPORT_CELLS + 1)), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes('x\r\n'.repeat(Math.floor(MAX_IMPORT_CELLS / 2) + 1)), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes(`"x\ny"\n${'x\n'.repeat(MAX_IMPORT_CELLS - 1)}`), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes(`${'x\n'.repeat(MAX_IMPORT_CELLS)}x`), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
  }, 30_000);

  it('counts a final record left open by an unterminated quote', () => {
    const open = `${','.repeat(MAX_SOCIALCALC_COL)}"`;
    expect(() => enforceTextImportLimits(bytes(`${open}\n`), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes(`${open}\r`), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes(`${'\n'.repeat(MAX_IMPORT_CELLS)}"\n`), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceTextImportLimits(bytes(`${'\n'.repeat(MAX_IMPORT_CELLS - 1)}"x"\n`), 'csv'))
      .not.toThrow();
  });

  it('materializes lone-CR records as the rows the preflight counted', () => {
    const [save] = prepareAppendImportPlan(bytes('a,b\r1,2\r'), 'csv').materializeSaves('room', 1);
    expect(save).toContain('cell:B2:v:2');
    expect(save).toContain('sheet:c:2:r:2');
  });

  it('caps the populated rectangle even when rows and columns each fit', () => {
    const row = `${Array(500).fill('x').join(',')}\n`;
    expect(() => enforceTextImportLimits(bytes(row.repeat(MAX_IMPORT_CELLS / 500)), 'csv'))
      .not.toThrow();
    expect(() => enforceTextImportLimits(bytes(row.repeat(MAX_IMPORT_CELLS / 500 + 1)), 'csv'))
      .toThrow(ImportDimensionsTooLargeError);
  }, 30_000);
});

describe('multi-sheet-import mutation pins (workbook read + cells)', () => {
  it('mutation pins for worksheet cell counting and read options', () => {
    const readFn = vi.fn().mockReturnValue({
      SheetNames: ['A', 'B'],
      Sheets: {
        A: { '!ref': 'A1', A1: { t: 'n', v: 1 }, B1: { t: 'n', v: 2 } },
        B: { '!ref': 'A1', A1: { t: 'n', v: 3 } },
      },
    });
    const plan = prepareAppendImportPlan(new Uint8Array([1, 2, 3]), 'xlsx', undefined, readFn as any);
    expect(readFn).toHaveBeenCalledWith(expect.any(Uint8Array), {
      type: 'array',
      cellFormula: true,
    });
    // materialize walks every present sheet (kills empty for-loop / map body mutants)
    const saves = plan.materializeSaves('room', 1);
    expect(saves).toHaveLength(2);
    expect(saves[0]!.length).toBeGreaterThan(0);
    expect(saves[1]!.length).toBeGreaterThan(0);
    // total cell counting uses += not -= (would undercount and fail limit with many cells)
    const bigNames = ['S0'];
    const bigSheet: Record<string, unknown> = { '!ref': 'A1:Z100' };
    for (let r = 1; r <= 100; r++) {
      for (let c = 0; c < 26; c++) {
        const col = String.fromCharCode(65 + c);
        bigSheet[`${col}${r}`] = { t: 'n', v: 1 };
      }
    }
    // 2600 cells — still under MAX_IMPORT_CELLS; if counting subtracted, enforceImportLimit might not see growth consistently
    const readBig = vi.fn().mockReturnValue({
      SheetNames: bigNames,
      Sheets: { S0: bigSheet },
    });
    const planBig = prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readBig as any);
    expect(planBig.count).toBe(1);
    expect(planBig.materializeSaves('r', 1)[0]!.length).toBeGreaterThan(100);
  });

  it('mutation pins titleHint trim gate vs raw titleHint', () => {
    // Whitespace-only hint must fall back (kills `titleHint && titleHint.trim()` → titleHint).
    const plan = prepareAppendImportPlan(new TextEncoder().encode('a'), 'csv', '   ');
    expect(plan.preferredTitles[0]).toBe('CSV');
    const named = prepareAppendImportPlan(new TextEncoder().encode('a'), 'csv', ' Named ');
    expect(named.preferredTitles[0]).toBe('Named');
  });

  it('mutation pins CSV vs TSV delimiter handling exactly', () => {
    const tabOnly = prepareAppendImportPlan(
      new TextEncoder().encode('x\ty'),
      'tsv',
    ).materializeSaves('r', 1)[0]!;
    const commaOnly = prepareAppendImportPlan(
      new TextEncoder().encode('x,y'),
      'csv',
    ).materializeSaves('r', 1)[0]!;
    expect(tabOnly).toBe(commaOnly);
    // If TSV path skipped tab→comma, saves differ from comma CSV.
    const literalTabAsCsv = prepareAppendImportPlan(
      new TextEncoder().encode('x\ty'),
      'csv',
    ).materializeSaves('r', 1)[0]!;
    expect(literalTabAsCsv).not.toBe(tabOnly);
  });
});


describe('multi-sheet-import final mutation kills', () => {
  it('kills SheetNames non-array fallback and cell-count accumulation', () => {
    const noNames = (() => ({ SheetNames: null, Sheets: {} })) as unknown as typeof XLSX.read;
    const empty = buildMultiSheetImport(new Uint8Array(), 'room', noNames);
    expect(empty.subSheets).toHaveLength(0);
    // toc still has header only
    expect(empty.tocSave.length).toBeGreaterThan(0);

    // Two sheets × (MAX_IMPORT_CELLS/2 + 1) cells => sum exceeds limit only if += works.
    const half = Math.floor(MAX_IMPORT_CELLS / 2) + 1;
    const mkSheet = () => {
      const ws: Record<string, unknown> = { '!ref': 'A1' };
      for (let i = 0; i < half; i++) ws[`A${i + 1}`] = { t: 'n', v: i };
      return ws;
    };
    const readOver = (() => ({
      SheetNames: ['A', 'B'],
      Sheets: { A: mkSheet(), B: mkSheet() },
    })) as unknown as typeof XLSX.read;
    expect(() => prepareAppendImportPlan(new Uint8Array(), 'xlsx', undefined, readOver)).toThrow(
      /cells|import/i,
    );
  });

  it('kills foreign-prefix max-index when suffix is purely numeric after wrong room', () => {
    // room "ab": link "/abc.5" starts with "/ab." ? "/abc.5".startsWith("/ab.") is true!
    // Use room "room" and "/roomy.12" which starts with "/room" but not "/room."
    expect(getMaxSubsheetIndex(['/roomy.12', '/room.4'], 'room')).toBe(4);
    // If startsWith(prefix) is forced true for all, "/zz.7" would yield max 7 for room "room".
    expect(getMaxSubsheetIndex(['/zz.7'], 'room')).toBe(0);
  });
});

describe('workbook sheets that may share one archive member', () => {
  const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const OFFICE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const SHEET_ML = 'application/vnd.openxmlformats-officedocument.spreadsheetml';

  function zip(members: Record<string, string | Uint8Array>, from?: Uint8Array): Uint8Array {
    const cfb = from ? XLSX.CFB.read(from, { type: 'buffer' }) : XLSX.CFB.utils.cfb_new();
    for (const [name, content] of Object.entries(members)) {
      XLSX.CFB.utils.cfb_add(
        cfb,
        name,
        typeof content === 'string' ? new TextEncoder().encode(content) : content,
      );
    }
    return new Uint8Array(XLSX.CFB.write(cfb, { fileType: 'zip', type: 'buffer' }));
  }

  /** An xlsx in which every `<sheet>` entry resolves to the same worksheet part. */
  function sharedPartWorkbook(
    entries: number,
    sheetXml = `<worksheet xmlns="${MAIN}"><sheetData><row><c><v>7</v></c><c><v>8</v></c></row></sheetData></worksheet>`,
    extra: Record<string, Uint8Array> = {},
  ): Uint8Array {
    const ids = Array.from({ length: entries }, (_unused, index) => index + 1);
    return zip({
      '[Content_Types].xml':
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        `<Override PartName="/xl/workbook.xml" ContentType="${SHEET_ML}.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET_ML}.worksheet+xml"/></Types>`,
      'xl/workbook.xml':
        `<workbook xmlns="${MAIN}" xmlns:r="${OFFICE}"><sheets>` +
        ids.map((id) => `<sheet name="s${id}" sheetId="${id}" r:id="rId${id}"/>`).join('') +
        '</sheets></workbook>',
      'xl/_rels/workbook.xml.rels':
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        ids.map((id) =>
          `<Relationship Id="rId${id}" Type="${OFFICE}/worksheet" Target="worksheets/sheet1.xml"/>`,
        ).join('') +
        '</Relationships>',
      'xl/worksheets/sheet1.xml': sheetXml,
      ...extra,
    });
  }

  it('accepts an ordinary shared-part workbook and rejects > MAX_MULTI_SHEETS entries', () => {
    const small = sharedPartWorkbook(3);
    const out = buildMultiSheetImport(small, 'room');
    expect(out.subSheets.map((sheet) => sheet.subroom)).toEqual(['room.1', 'room.2', 'room.3']);
    expect(out.subSheets[2]!.save).toContain('cell:B1:v:8');

    const tooMany = sharedPartWorkbook(MAX_MULTI_SHEETS + 44);
    expect(() => buildMultiSheetImport(tooMany, 'room')).toThrow(
      new ImportTooManySheetsError(MAX_MULTI_SHEETS + 44),
    );
    expect(() => prepareAppendImportPlan(tooMany, 'xlsx')).toThrow(
      ImportTooManySheetsError,
    );
  });

  it('bounds repeated reads across aliased worksheet parts while allowing large unreferenced media', () => {
    // 9.5 MiB single worksheet part: 1 sheet (~9.5 MiB read) succeeds, while
    // 12 aliased <sheet> entries (~114 MiB total read > MAX_WORKBOOK_READ_BYTES) throw quickly.
    const heavySheetXml =
      `<worksheet xmlns="${MAIN}"><sheetData><row><c><v>7</v></c></row></sheetData></worksheet>` +
      `<!--${'a'.repeat(9_500_000)}-->`;
    const singleOk = sharedPartWorkbook(1, heavySheetXml);
    expect(buildMultiSheetImport(singleOk, 'room').subSheets[0]?.save).toContain('cell:A1:v:7');

    const aliasedBomb = sharedPartWorkbook(12, heavySheetXml);
    const started = performance.now();
    expect(() => buildMultiSheetImport(aliasedBomb, 'room')).toThrow(ImportArchiveTooLargeError);
    expect(() => prepareAppendImportPlan(aliasedBomb, 'xlsx')).toThrow(ImportArchiveTooLargeError);
    expect(performance.now() - started).toBeLessThan(2_000);

    // An unreferenced media part > 12 MiB does not count against member reads.
    const withMedia = sharedPartWorkbook(
      6,
      undefined,
      { 'xl/media/padding.bin': new Uint8Array(Math.floor(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES / 2)) },
    );
    expect(buildMultiSheetImport(withMedia, 'room').subSheets).toHaveLength(6);
  });
});
