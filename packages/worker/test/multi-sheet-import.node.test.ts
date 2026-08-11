import * as XLSX from '@e965/xlsx';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
  buildMultiSheetImport,
  buildMultiSheetAppendImport,
  prepareAppendImportPlan,
  getMaxSubsheetIndex,
  rewriteSheetReferences,
  ImportTooManySheetsError,
  ImportUnsupportedFormatError,
} from '../src/lib/multi-sheet-import.ts';
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportDimensionsTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  MAX_IMPORT_CELLS,
  worksheetToSave,
} from '../src/lib/xlsx-import.ts';
import { MAX_MULTI_SHEETS } from '@ethercalc/shared';

function workbookBytes(sheets: Array<{ name: string; aoa: (string | number | boolean)[][] }>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa), s.name);
  }
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
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
});

describe('prepareAppendImportPlan', () => {
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

  it('mutation pins for rewriteSheetReferences quoting and empty names', () => {
    const body = "cell:A1:vtf:n:1:Second!A1+'O''Brien'!B2";
    expect(rewriteSheetReferences(body, [], 'room', 6)).toBe(body);
    expect(rewriteSheetReferences(body, ['First', 'Second', "O'Brien"], 'room', 6)).toBe(
      "cell:A1:vtf:n:1:'room.7'!A1+'room.8'!B2",
    );
    // Special-char sheet name must be escaped in the regex (kills empty replace mutants).
    const weird = rewriteSheetReferences('cell:A1:vtf:n:1:A+B!A1', ['A+B'], 'r', 1);
    expect(weird).toBe("cell:A1:vtf:n:1:'r.1'!A1");
  });

  it('mutation pins for upload size boundary and format gates', () => {
    // Equal to limit is allowed; one over throws (kills >= mutant).
    expect(() =>
      prepareAppendImportPlan(
        new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES),
        'csv',
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
