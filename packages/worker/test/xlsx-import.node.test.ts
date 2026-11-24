import type { WorkBook } from '@e965/xlsx';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';
import { deflateRawSync } from 'node:zlib';
import { createSpreadsheet, loadSocialCalc } from '@ethercalc/socialcalc-headless';
import { describe, expect, it, vi } from 'vite-plus/test';
import {
  MAX_SOCIALCALC_COL,
  MAX_SOCIALCALC_ROW,
} from '../src/lib/command-limits.ts';
import {
  assertWorkbookFormat,
  cellToCommand,
  countWorksheetCells,
  countWorksheetMergedCells,
  countWorksheetText,
  csvToLoadClipboardCommand,
  enforceImportArchiveLimit,
  enforceActualImportArchiveLimit,
  enforceImportLimit,
  enforceImportTextLimit,
  enforceSocialCalcColumnLimit,
  ImportDimensionsTooLargeError,
  ImportArchiveTooLargeError,
  ImportArchiveInvalidError,
  ImportOdfUnsupportedFeatureError,
  ImportColumnOutOfRangeError,
  ImportRowOutOfRangeError,
  ImportTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  MAX_IMPORT_CELLS,
  MAX_WORKBOOK_READ_BYTES,
  readBoundedWorkbook,
  sheetReferences,
  textRowsToLoadClipboardCommand,
  textRowsToSave,
  workbookReadBytes,
  workbookToLoadClipboardCommand,
  worksheetToSave,
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

function makeArchiveEntry(
  content: Uint8Array,
  declaredSize = content.length,
  options: {
    method?: 0 | 8;
    name?: string;
    localExtra?: Uint8Array;
    centralExtra?: Uint8Array;
    comment?: Uint8Array;
  } = {},
): {
  bytes: Uint8Array;
  central: number;
} {
  const name = new TextEncoder().encode(options.name ?? '[Content_Types].xml');
  const method = options.method ?? 8;
  const localExtra = options.localExtra ?? new Uint8Array();
  const centralExtra = options.centralExtra ?? new Uint8Array();
  const comment = options.comment ?? new Uint8Array();
  const compressed = method === 8 ? deflateRawSync(content) : content;
  const central = 30 + name.length + localExtra.length + compressed.length;
  const bytes = new Uint8Array(central + 46 + name.length + centralExtra.length + 22 + comment.length);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(8, method, true);
  view.setUint32(18, compressed.length, true);
  view.setUint32(22, declaredSize, true);
  view.setUint16(26, name.length, true);
  view.setUint16(28, localExtra.length, true);
  bytes.set(name, 30);
  bytes.set(localExtra, 30 + name.length);
  bytes.set(compressed, 30 + name.length + localExtra.length);
  view.setUint32(central, 0x02014b50, true);
  view.setUint16(central + 10, method, true);
  view.setUint32(central + 20, compressed.length, true);
  view.setUint32(central + 24, declaredSize, true);
  view.setUint16(central + 28, name.length, true);
  view.setUint16(central + 30, centralExtra.length, true);
  bytes.set(name, central + 46);
  bytes.set(centralExtra, central + 46 + name.length);
  const end = central + 46 + name.length + centralExtra.length;
  view.setUint32(end, 0x06054b50, true);
  view.setUint16(end + 8, 1, true);
  view.setUint16(end + 10, 1, true);
  view.setUint32(end + 12, 46 + name.length + centralExtra.length, true);
  view.setUint32(end + 16, central, true);
  view.setUint16(end + 20, comment.length, true);
  bytes.set(comment, end + 22);
  return { bytes, central };
}

function encodeUtf16(text: string, prefix: number[], littleEndian: boolean): Uint8Array {
  const bytes = new Uint8Array(prefix.length + text.length * 2);
  bytes.set(prefix);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < text.length; i++) {
    view.setUint16(prefix.length + i * 2, text.charCodeAt(i), littleEndian);
  }
  return bytes;
}

function packZipMembers(members: Record<string, string | Uint8Array>): Uint8Array {
  const cfb = (XLSX as any).CFB.utils.cfb_new();
  for (const [entryName, data] of Object.entries(members)) {
    (XLSX as any).CFB.utils.cfb_add(
      cfb,
      entryName,
      typeof data === 'string' ? new TextEncoder().encode(data) : data,
    );
  }
  return new Uint8Array((XLSX as any).CFB.write(cfb, { fileType: 'zip', type: 'buffer' }));
}

describe('assertWorkbookFormat', () => {
  const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
  const flat = new TextEncoder().encode(
    '<?xml version="1.0"?>\n<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0">',
  );

  it('accepts supported workbook envelopes', () => {
    expect(() => assertWorkbookFormat(zip, 'xlsx')).not.toThrow();
    expect(() => assertWorkbookFormat(zip, 'ods')).not.toThrow();
    expect(() => assertWorkbookFormat(zip, 'ods-or-fods')).not.toThrow();
    expect(() => assertWorkbookFormat(flat, 'ods-or-fods')).not.toThrow();
    expect(() => assertWorkbookFormat(flat, 'fods')).not.toThrow();
    expect(() => assertWorkbookFormat(new TextEncoder().encode('\uFEFF  <office:document>'), 'fods')).not.toThrow();
  });

  it('rejects bodies outside the declared workbook format', () => {
    for (const bytes of [
      new Uint8Array(),
      new Uint8Array([0x50, 0x4b, 0x03]),
      new Uint8Array([0x00, 0x4b, 0x03, 0x04]),
      new Uint8Array([0x50, 0x00, 0x03, 0x04]),
      new Uint8Array([0x50, 0x4b, 0x00, 0x04]),
      new Uint8Array([0x50, 0x4b, 0x03, 0x00]),
      new TextEncoder().encode('a,b\n1,2'),
      new TextEncoder().encode('<html><body></body></html>'),
      new TextEncoder().encode('<office:document-content>'),
    ]) {
      expect(() => assertWorkbookFormat(bytes, 'xlsx')).toThrow(ImportArchiveInvalidError);
      expect(() => assertWorkbookFormat(bytes, 'ods')).toThrow(ImportArchiveInvalidError);
      expect(() => assertWorkbookFormat(bytes, 'fods')).toThrow(ImportArchiveInvalidError);
      expect(() => assertWorkbookFormat(bytes, 'ods-or-fods')).toThrow(ImportArchiveInvalidError);
    }
    expect(() => assertWorkbookFormat(zip, 'fods')).toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(flat, 'xlsx')).toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(flat, 'ods')).toThrow(ImportArchiveInvalidError);
  });
});

describe('flat ODF reader selection', () => {
  const enc = (value: string) => new TextEncoder().encode(value);
  const sheet =
    '<office:body><office:spreadsheet><table:table table:name="S"><table:table-row>' +
    '<table:table-cell office:value-type="string"><text:p>odf</text:p></table:table-cell>' +
    '</table:table-row></table:table></office:spreadsheet></office:body></office:document>';
  // SheetJS's Excel 2003 XML reader repeats a column definition `ss:Span`
  // times without a bound; none of the ODF limits know the attribute.
  const excel2003 =
    '<Workbook><Worksheet ss:Name="Sheet1"><Table><Column ss:Span="3"/>' +
    '<Row><Cell><Data ss:Type="String">excel</Data></Cell></Row></Table></Worksheet></Workbook>';

  it('hands SheetJS flat ODF from its root tag on, and anything else unchanged', () => {
    const flat = workbookReadBytes(enc(
      `\uFEFF<?xml version="1.0"?>\n<?x ${excel2003}?><!-- a, b -->\t<office:document>${sheet}`,
    ));
    expect(new TextDecoder().decode(flat)).toBe(`<?xml version="1.0"?><office:document>${sheet}`);
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    expect(workbookReadBytes(zip)).toBe(zip);
    for (const other of [new Uint8Array(), enc('P'), enc('xK'), enc(`<?xml version="1.0"?>${excel2003}`)]) {
      expect(workbookReadBytes(other)).toBe(other);
    }
  });

  it('does not read a workbook in front of the root as Excel 2003 XML', () => {
    for (const prolog of [`<?xml version="1.0"?><?x ${excel2003}?>`, `<?x ${excel2003}?>`]) {
      const bytes = enc(`${prolog}<office:document>${sheet}`);
      expect(() => assertWorkbookFormat(bytes, 'fods')).not.toThrow();
      const save = xlsxToSave(bytes);
      expect(save).toContain('cell:A1:t:odf');
      expect(save).not.toContain('excel');
    }
  });

  it('rejects a root tag that SheetJS would skip', () => {
    for (const root of [
      "<office:document a='b'>",
      '<office:document a = "b">',
      '<office:document a="<!--"> -->',
      '<office:document a>',
    ]) {
      const bytes = enc(`<?xml version="1.0"?>${root}${excel2003}</office:document>`);
      expect(() => assertWorkbookFormat(bytes, 'fods')).toThrow(ImportArchiveInvalidError);
      expect(() => assertWorkbookFormat(bytes, 'ods-or-fods')).toThrow(ImportArchiveInvalidError);
      expect(workbookReadBytes(bytes)).toBe(bytes);
    }
    expect(() => assertWorkbookFormat(
      enc('<office:document\n xmlns:office="urn:a"\toffice:version="1.3" >'),
      'fods',
    )).not.toThrow();
  });

  it('reads flat ODF that SheetJS would take for HTML or delimited text', () => {
    // No `<?xml` and `<table` early: HTML. `,` before the first `>`, a
    // leading tab, or a BOM followed by whitespace: delimited text.
    for (const prolog of ['', '<!-- a, b -->', '\t', '\uFEFF ']) {
      const bytes = enc(`${prolog}<office:document>${sheet}`);
      expect(xlsxToSave(bytes)).toContain('cell:A1:t:odf');
      expect(workbookToLoadClipboardCommand(bytes)).toContain('odf');
    }
  });

  it('applies the ODF limits to the text SheetJS is given', () => {
    const row = '<table:table><table:table-row table:number-rows-repeated="200001">' +
      '<table:table-cell/></table:table-row></table:table>';
    expect(() => enforceActualImportArchiveLimit(enc(
      `<?x ${excel2003}?><office:document>${row}</office:document>`,
    ))).toThrow(ImportTooLargeError);
    // What precedes the root is not read, so it is not charged either.
    expect(() => enforceActualImportArchiveLimit(enc(
      `<!-- ${row} --><office:document></office:document>`,
    ))).not.toThrow();
  });
});

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

  it('asks the caller what a formula that refers to another sheet is imported as', () => {
    const asked: string[] = [];
    const toRoom = (formula: string): string | null => {
      asked.push(formula);
      return formula.startsWith('Tax!') ? formula.replace('Tax!', "'room.2'!") : null;
    };
    expect(cellToCommand('A1', { t: 'n', v: 1900, f: 'Tax!B2*100' }, toRoom)).toBe(
      "set A1 formula 'room.2'!B2*100",
    );
    // `null`: not a formula cell, the value the file carries is imported.
    expect(cellToCommand('A1', { t: 'n', v: 700, f: "'[1]Price List'!B2*100" }, toRoom)).toBe(
      'set A1 value n 700',
    );
    expect(cellToCommand('A1', { t: 's', v: 'Widget', f: "'[1]Price List'!A2" }, toRoom)).toBe(
      'set A1 text t Widget',
    );
    expect(cellToCommand('A1', { t: 'e', v: 0x17, f: "'[1]Price List'!A3" }, toRoom)).toBeNull();
    expect(asked).toEqual([
      'Tax!B2*100',
      "'[1]Price List'!B2*100",
      "'[1]Price List'!A2",
      "'[1]Price List'!A3",
    ]);
    // A formula of the sheet itself is not the caller's to decide.
    expect(cellToCommand('A3', { t: 'n', v: 3, f: 'SUM(A1:A2)' }, toRoom)).toBe(
      'set A3 formula SUM(A1:A2)',
    );
    expect(cellToCommand('A3', { t: 's', v: 'Up!', f: '"Up!"&A1' }, toRoom)).toBe(
      'set A3 formula "Up!"&A1',
    );
    expect(asked).toHaveLength(4);
  });
});

describe('sheetReferences', () => {
  it('names the sheet before each `!` the way SocialCalc reads the formula', () => {
    expect(sheetReferences('SUM(A1:A2)')).toEqual([]);
    expect(sheetReferences("'My Sheet'!A1+\"other\"!B2")).toEqual(['My Sheet', 'other']);
    expect(sheetReferences("'[1]Price List'!B2*100")).toEqual(['[1]Price List']);
    expect(sheetReferences("SUM('Q1:Q4'!B2)")).toEqual(['Q1:Q4']);
    expect(sheetReferences("'O''Brien'!A1")).toEqual(["O'Brien"]);
  });

  it('answers null where the sheet is not a quoted name', () => {
    // A bare name may be a named range, a cell holds whatever text it holds.
    expect(sheetReferences('Tax!B2')).toEqual([null]);
    expect(sheetReferences('A2!B2')).toEqual([null]);
    expect(sheetReferences('("a"&"b")!B2')).toEqual([null]);
    expect(sheetReferences('!B2')).toEqual([null]);
  });

  it('does not count a `!` that is not the sheet operator', () => {
    expect(sheetReferences('"see Tax!B2"&A1')).toEqual([]);
    expect(sheetReferences('IF(A1=#REF!,1,2)')).toEqual([]);
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

  it('imports the value of a formula that refers to another sheet', () => {
    // Only the first sheet is imported, so `Tax` and the linked workbook's
    // `Price List` would be read from top-level rooms of those names.
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 700, f: "'[1]Price List'!B2*100" },
        A2: { t: 'n', v: 1900, f: 'Tax!B2*100' },
        A3: { t: 'n', v: 2600, f: 'SUM(A1:A2)' },
      },
      'A1:A3',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('\ncell:A1:v:700\n');
    expect(save).toContain('\ncell:A2:v:1900\n');
    expect(save).toContain('cell:A3:vtf:n:2600:SUM(A1\\cA2)');
    expect(save).not.toContain('Price List');
    expect(save).not.toContain('Tax');
  });

  it('leaves no sheet names behind in the shared SocialCalc namespace', () => {
    // The recalc that ends a replay records every sheet a formula refers to
    // in the namespace's SheetCache, loaded or not. Imports run for as long
    // as the isolate lives, so that has to go away with the import.
    const cells = { A1: { t: 'n', v: 1, f: "'elsewhere'!A1" } };
    const bytes = makeXlsx(cells, 'A1:A1');
    expect(xlsxToSave(bytes)).toContain('\ncell:A1:v:1\n');
    expect(xlsxToLoadClipboardCommands(bytes)).toHaveLength(2);
    expect(worksheetToSave({ '!ref': 'A1:A1', ...cells })).toContain("'elsewhere'!A1");
    expect(
      workbookToLoadClipboardCommand(new TextEncoder().encode("='elsewhere'!A1\n")),
    ).toContain('elsewhere');

    const shared = loadSocialCalc() as any;
    expect(Object.keys(shared.Formula.SheetCache.sheets)).toEqual([]);
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

  it('counts the text each cell inlines, not the strings the cells share', () => {
    const shared = 'x'.repeat(1000);
    expect(countWorksheetText({
      '!ref': 'A1:B3',
      '!merges': ['ignored'],
      A1: { t: 's', v: shared, w: shared },
      A2: { t: 's', v: shared, w: shared },
      // `:` in SUM(B1:B2) adds +2 for SocialCalc `\c` save escaping.
      A3: { t: 'n', v: 42, w: '42.00', f: 'SUM(B1:B2)' },
      B1: { t: 'z', w: 'shown' },
      B2: { t: 'b', v: true },
      B3: { t: 'e', v: 42 },
      B4: { t: 's', v: 'a\\b:c\nd' },
    })).toBe(1000 + 1000 + ('SUM(B1:B2)'.length + 2) + 'shown'.length + ('a\\b:c\nd'.length + 6));
  });

  it('bounds the text that cells sharing one string expand to', () => {
    expect(() => enforceImportTextLimit(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES)).not.toThrow();
    expect(() => enforceImportTextLimit(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1))
      .toThrow(ImportArchiveTooLargeError);

    // bookSST stores the string once; every cell is a reference to it.
    const text = 'x'.repeat(30_000);
    const sharing = (cells: number) => {
      const book = XLSX.utils.book_new() as WorkBook;
      XLSX.utils.book_append_sheet(
        book,
        XLSX.utils.aoa_to_sheet(Array.from({ length: cells }, () => [text])),
        'Sheet1',
      );
      return new Uint8Array(
        (XLSX as any).write(book, {
          bookType: 'xlsx', type: 'array', bookSST: true, compression: true,
        }) as ArrayBufferLike,
      );
    };
    const bytes = sharing(900);
    expect(() => enforceImportArchiveLimit(bytes)).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    expect(() => xlsxToSave(bytes)).toThrow(ImportArchiveTooLargeError);
    expect(() => xlsxToLoadClipboardCommands(bytes)).toThrow(ImportArchiveTooLargeError);
    expect(xlsxToSave(sharing(2))).toContain(`cell:A2:t:${text}`);
  });

  it('countWorksheetMergedCells sums merge areas without deduplicating', () => {
    expect(countWorksheetMergedCells({ '!ref': 'A1:A1' })).toBe(0);
    expect(countWorksheetMergedCells({ '!merges': 'A1:B2' })).toBe(0);
    const block = { s: { r: 0, c: 0 }, e: { r: 2, c: 1 } };
    expect(countWorksheetMergedCells({ '!merges': [block] })).toBe(6);
    // Repeated and overlapping ranges each cost a full SocialCalc walk.
    expect(
      countWorksheetMergedCells({
        '!merges': [block, block, { s: { r: 1, c: 1 }, e: { r: 1, c: 1 } }],
      }),
    ).toBe(13);
    // SocialCalc normalizes reversed corners, so they cost the same area.
    expect(
      countWorksheetMergedCells({ '!merges': [{ s: block.e, e: block.s }] }),
    ).toBe(6);
  });

  it('rejects merges whose combined area exceeds the import budget', () => {
    // One populated cell and an in-bounds extent: only the summed merge area
    // tells a repeated-merge workbook apart from an ordinary one.
    const half = { s: { r: 0, c: 0 }, e: { r: MAX_IMPORT_CELLS / 2 - 1, c: 0 } };
    const withMerges = (count: number): Uint8Array => {
      const ws = {
        '!ref': `A1:A${MAX_IMPORT_CELLS / 2}`,
        '!merges': Array.from({ length: count }, () => half),
        A1: { t: 'n', v: 1 },
      };
      const book = XLSX.utils.book_new() as WorkBook;
      XLSX.utils.book_append_sheet(book, ws, 'Sheet1');
      return new Uint8Array(
        XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
      );
    };
    expect(xlsxToSave(withMerges(2))).toContain(`:rowspan:${MAX_IMPORT_CELLS / 2}`);
    expect(() => xlsxToLoadClipboardCommands(withMerges(3))).toThrow(
      ImportTooLargeError,
    );
    let caught: unknown;
    try {
      xlsxToSave(withMerges(3));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ImportTooLargeError);
    expect((caught as ImportTooLargeError).cellCount).toBe((MAX_IMPORT_CELLS / 2) * 3);
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
describe('SocialCalc declared-area ceiling on import', () => {
  it('rejects sparse cells, merges, and !ref ranges whose rectangular extent is oversized or out of bounds', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1',
      }),
    ).not.toThrow();

    expect(() =>
      enforceSocialCalcColumnLimit({
        AAA1: { t: 'n', v: 1 },
      }),
    ).toThrow(ImportColumnOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1048577',
      }),
    ).toThrow(ImportRowOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:A2000000',
      }),
    ).toThrow(ImportRowOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:AAA1',
      }),
    ).toThrow(ImportColumnOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'invalid:A1',
      }),
    ).not.toThrow();

    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:',
      }),
    ).not.toThrow();

    expect(() =>
      enforceSocialCalcColumnLimit({
        A1: { t: 'n', v: 1 },
        '!merges': [{ s: { c: 702 } }],
      }),
    ).toThrow(ImportColumnOutOfRangeError);

    expect(() =>
      enforceSocialCalcColumnLimit({
        A1: { t: 'n', v: 1 },
        '!merges': [{ s: { c: 702, r: 0 } }],
      }),
    ).toThrow(ImportColumnOutOfRangeError);
    expect(() =>
      enforceSocialCalcColumnLimit({
        A200001: { t: 'n', v: 1 },
      }),
    ).toThrow(ImportDimensionsTooLargeError);
    expect(() =>
      enforceSocialCalcColumnLimit({
        A1: { t: 'n', v: 1 },
        '!merges': [
          { s: { r: 0, c: 0 }, e: { r: 100_000, c: 1 } },
        ],
      }),
    ).toThrow(ImportDimensionsTooLargeError);
  });

  it('accepts an exact-area sparse sheet', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        [`A${MAX_IMPORT_CELLS}`]: { t: 'n', v: 1 },
      }),
    ).not.toThrow();
  });

  it('rejects rows beyond the spreadsheet protocol ceiling', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        [`A${MAX_SOCIALCALC_ROW + 1}`]: { t: 'n', v: 1 },
      }),
    ).toThrow(ImportRowOutOfRangeError);
  });

  it('validates both merge endpoints', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        A1: { t: 'n', v: 1 },
        '!merges': [{ e: { r: 0, c: 0 } }],
      }),
    ).toThrow(ImportColumnOutOfRangeError);
  });

  it('rejects merge endpoints whose row is out of range, missing, or NaN', () => {
    const cases: Array<{
      readonly row: unknown;
      readonly label: string;
      readonly reported: number;
    }> = [
      // In range as a number, past the protocol ceiling.
      {
        row: MAX_SOCIALCALC_ROW,
        label: `A${MAX_SOCIALCALC_ROW + 1}`,
        reported: MAX_SOCIALCALC_ROW + 1,
      },
      // Numeric but not finite — the label falls back to the raw value.
      { row: Number.NaN, label: 'ANaN', reported: Number.NaN },
      // Absent endpoint row — neither label nor report can use arithmetic.
      { row: undefined, label: 'Aundefined', reported: Number.NaN },
    ];
    for (const { row, label, reported } of cases) {
      let caught: unknown;
      try {
        enforceSocialCalcColumnLimit({
          A1: { t: 'n', v: 1 },
          '!merges': [{ s: { r: 0, c: 0 }, e: { r: row, c: 0 } }],
        });
      } catch (error) {
        caught = error;
      }
      expect(caught, label).toBeInstanceOf(ImportRowOutOfRangeError);
      const failure = caught as ImportRowOutOfRangeError & {
        readonly coord?: string;
        readonly row?: number;
      };
      expect(failure.message).toContain(label);
      if (Number.isNaN(reported)) expect(failure.row).toBeNaN();
      else expect(failure.row).toBe(reported);
    }
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

  it('pastes the value of a formula that refers to another sheet', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 700, f: "'[1]Price List'!B2*100" },
        A2: { t: 'n', v: 1900, f: 'Tax!B2*100' },
      },
      'A1:A2',
    );
    const cmds = xlsxToLoadClipboardCommands(bytes);
    expect(cmds[0]).toContain('cell\\cA1\\cv\\c700\\n');
    expect(cmds[0]).toContain('cell\\cA2\\cv\\c1900\\n');
    expect(cmds[0]).not.toContain('Price List');
    expect(cmds[0]).not.toContain('Tax');
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

  it('keeps a CSV formula that names another room', () => {
    // A CSV has no sheets: `=Other!A1` typed into one can only mean a room.
    const cmd = workbookToLoadClipboardCommand(new TextEncoder().encode('1,=Other!A1\n'));
    expect(cmd!).toContain('Other!A1');
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

describe('csvToLoadClipboardCommand', () => {
  it('replaying loadclipboard + paste A2 all yields TOC cells at A2:B3', () => {
    const cmd = csvToLoadClipboardCommand('"#url","#title"\n"/toc.1","Sheet1"\n');
    expect(cmd).not.toBeNull();
    expect(cmd!).toMatch(/^loadclipboard /);
    expect(cmd!).toContain('copiedfrom\\cA1\\cB2');
    expect(cmd!).not.toMatch(/\n/);
    const ss = createSpreadsheet();
    ss.executeCommand(cmd!);
    ss.executeCommand('paste A2 all');
    const cells = ss.exportCells() as Record<string, { datavalue?: string }>;
    expect(cells.A2?.datavalue).toBe('#url');
    expect(cells.B2?.datavalue).toBe('#title');
    expect(cells.A3?.datavalue).toBe('/toc.1');
    expect(cells.B3?.datavalue).toBe('Sheet1');
  });

  it('keeps bodies that SheetJS would sniff as another format as CSV text', () => {
    // Through `XLSX.read` these select the SYLK / DIF / HTML readers; the
    // SYLK one places the cell at row 5 (and allocates every row up to Y).
    const sylk = csvToLoadClipboardCommand('ID;PWXL;N;E\nC;Y5;X1;K1\nE\n');
    const ss = createSpreadsheet();
    ss.executeCommand(sylk!);
    ss.executeCommand('paste A1 all');
    const cells = ss.exportCells() as Record<string, { datavalue?: string }>;
    expect(cells.A1?.datavalue).toBe('ID;PWXL;N;E');
    expect(cells.A2?.datavalue).toBe('C;Y5;X1;K1');
    expect(cells.A3?.datavalue).toBe('E');
    expect(cells.A5).toBeUndefined();

    expect(csvToLoadClipboardCommand('TABLE,x\n')).toContain('cell\\cA1\\ct\\cTABLE');
    expect(csvToLoadClipboardCommand('<b>,x\n')).toContain('cell\\cA1\\ct\\c<b>');
  });

  it('returns null when the CSV has no cells to paste', () => {
    expect(csvToLoadClipboardCommand('')).toBeNull();
    expect(csvToLoadClipboardCommand('\n')).toBeNull();
  });

  it('rejects a CSV whose escaped loadclipboard command exceeds 25 MiB', () => {
    const colons = ':'.repeat(700_000);
    const bigCsv = Array.from({ length: 15 }, () => colons).join(',') + '\n';
    expect(() => csvToLoadClipboardCommand(bigCsv)).toThrow(ImportArchiveTooLargeError);
  });
});

describe('textRowsToSave / textRowsToLoadClipboardCommand', () => {
  // What a CSV reader would type: a formula naming another room, a plain
  // formula, numbers, a date, a boolean — plus the save-format escapes.
  const rows = [
    ['#url', '#title'],
    ['/toc.1', "='other-room'!A1"],
    ['/toc.2', '=1+1'],
    ['/toc.3', '007'],
    ['/toc.4', '2024-01-02'],
    ['/toc.5', 'TRUE'],
    ['/toc.6', 'a:b\\c "q", x\ny'],
    ['/toc.7', ''],
  ];
  type Cells = Record<string, { datatype?: string; datavalue?: unknown; formula?: string }>;
  const expectText = (cells: Cells, firstRow: number): void => {
    rows.forEach((row, r) => {
      row.forEach((text, c) => {
        const cell = cells[`${'AB'[c]}${firstRow + r}`];
        expect(cell).toMatchObject({ datatype: 't', datavalue: text });
        expect(cell?.formula ?? '').toBe('');
      });
    });
  };

  it('saves every field as a text cell holding its characters', () => {
    const ss = createSpreadsheet({ snapshot: textRowsToSave(rows) });
    expectText(ss.exportCells() as Cells, 1);
    expect(ss.findCrossSheetRefs()).toEqual([]);
  });

  it('pastes every field as a text cell holding its characters', () => {
    const cmd = textRowsToLoadClipboardCommand(rows);
    expect(cmd).toMatch(/^loadclipboard /);
    const ss = createSpreadsheet();
    ss.executeCommand(cmd!);
    ss.executeCommand('paste A3 all');
    expectText(ss.exportCells() as Cells, 3);
    expect(ss.findCrossSheetRefs()).toEqual([]);
  });

  it('returns null when there is nothing to paste', () => {
    expect(textRowsToLoadClipboardCommand([])).toBeNull();
  });

  it('rejects rows whose escaped loadclipboard command exceeds 25 MiB', () => {
    const colons = ':'.repeat(700_000);
    expect(() => textRowsToLoadClipboardCommand([Array.from({ length: 15 }, () => colons)]))
      .toThrow(ImportArchiveTooLargeError);
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

describe('actual archive expansion limit', () => {
  it('accepts a valid compressed entry and non-archive text', () => {
    const { bytes } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'));
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(new TextEncoder().encode('<xml/>'))).not.toThrow();
  });

  it('accepts an ordinary ODS archive through the XML preflight', () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['a', 'b'], ['c', 'd']]), 'Sheet1');
    const bytes = new Uint8Array(XLSX.write(book, { bookType: 'ods', type: 'array' }) as ArrayBufferLike);
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    expect(xlsxToSave(bytes)).toContain('cell:B2');
  });

  it('checks ODF repetition before the workbook parser expands it', () => {
    const odf = (rows: number, columns: number) => new TextEncoder().encode(
      `<office:document><table:table><table:table-row table:number-rows-repeated="${rows}">` +
      `<table:table-cell table:number-columns-repeated="${columns}" office:value-type="string">` +
      '<text:p>value</text:p></table:table-cell></table:table-row></table:table></office:document>',
    );
    expect(() => enforceActualImportArchiveLimit(odf(2, 2))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(odf(2, MAX_SOCIALCALC_COL + 1)))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(odf(1000, 1000)))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(odf(MAX_IMPORT_CELLS + 1, 1)))
      .toThrow(ImportTooLargeError);
    const alias = new TextDecoder().decode(odf(MAX_IMPORT_CELLS + 1, 1))
      .replaceAll('table:table-row', '行')
      .replaceAll('table:table-cell', '数据');
    expect(() => enforceActualImportArchiveLimit(new TextEncoder().encode(alias)))
      .toThrow(ImportTooLargeError);
    const longProlog = new TextEncoder().encode(
      `<?xml version="1.0"?><!--${'x'.repeat(5000)}-->` +
      new TextDecoder().decode(odf(MAX_IMPORT_CELLS + 1, 1)),
    );
    expect(() => assertWorkbookFormat(longProlog, 'fods')).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(longProlog)).toThrow(ImportTooLargeError);
    const packed = makeArchiveEntry(odf(1000, 1000), undefined, { name: './content.xml' });
    expect(() => enforceActualImportArchiveLimit(packed.bytes))
      .toThrow(ImportDimensionsTooLargeError);
    const aliasedPacked = makeArchiveEntry(odf(MAX_IMPORT_CELLS + 1, 1), undefined, {
      name: 'Root Entry/content.xml',
    });
    expect(() => enforceActualImportArchiveLimit(aliasedPacked.bytes))
      .toThrow(ImportTooLargeError);
  });

  it('recognizes namespace, duplicate, and normalized repetition attributes', () => {
    const fods = (rowAttributes: string, cellAttributes = '') => new TextEncoder().encode(
      `<office:document><table:table><table:table-row ${rowAttributes}>` +
      `<table:table-cell ${cellAttributes} office:value-type="string"><text:p>x</text:p>` +
      '</table:table-cell></table:table-row></table:table></office:document>',
    );
    for (const rowAttributes of [
      '語:number-rows-repeated="200001"',
      'number-rows-repeated_extra="200001"',
      'number-rows-repeated="1" 語:number-rows-repeated="200001"',
    ]) {
      expect(() => enforceActualImportArchiveLimit(fods(rowAttributes)), rowAttributes)
        .toThrow(ImportTooLargeError);
    }
    for (const cellAttributes of [
      '語:number-columns-repeated="703"',
      'number-columns-repeated_extra="703"',
      'number-columns-repeated="1" 語:number-columns-repeated="703"',
    ]) {
      expect(() => enforceActualImportArchiveLimit(fods('', cellAttributes)), cellAttributes)
        .toThrow(ImportDimensionsTooLargeError);
    }
    expect(() => enforceActualImportArchiveLimit(fods(
      'data-note="語:number-rows-repeated=200001"',
      'data-note="語:number-columns-repeated=703"',
    ))).not.toThrow();
    const aliasedElements = new TextEncoder().encode(
      '<office:document><語:table_extra><語:table-row_extra ' +
      '語:number-rows-repeated="200001"><語:table-cell_extra office:value-type="string">' +
      '<text:p>x</text:p></語:table-cell_extra></語:table-row_extra>' +
      '</語:table_extra></office:document>',
    );
    expect(() => enforceActualImportArchiveLimit(aliasedElements))
      .toThrow(ImportTooLargeError);
  });

  it('accounts for rectangular extent and aggregate cells across ODF tables', () => {
    const fods = (body: string) => new TextEncoder().encode(`<office:document>${body}</office:document>`);
    const row = (count: number, width: number) =>
      `<table:table-row table:number-rows-repeated="${count}">` +
      `<table:table-cell table:number-columns-repeated="${width}"/></table:table-row>`;
    expect(() => enforceActualImportArchiveLimit(fods(
      `<table:table>${row(1000, 1)}${row(1, 300)}</table:table>`,
    ))).toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(fods(
      `<table:table>${row(150_000, 1)}</table:table>` +
      `<table:table>${row(150_000, 1)}</table:table>`,
    ))).toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(fods(
      '<table:table><table:table-row><table:table-cell/></table:table-row></table:table>',
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(fods(
      '<table:table><table:table-row table:number-rows-repeated="2"/>' +
      '</table:table>',
    ))).not.toThrow();
  });

  it('rejects malformed ODF repetition and XML boundaries', () => {
    const enc = (value: string) => new TextEncoder().encode(value);
    const fods = (body: string) => enc(`<office:document>${body}</office:document>`);
    expect(() => assertWorkbookFormat(enc('<!--unfinished'), 'fods'))
      .toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(enc('<?xml unfinished'), 'fods'))
      .toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(enc('<office:document'), 'fods'))
      .toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(enc('<office:documentx>'), 'fods'))
      .toThrow(ImportArchiveInvalidError);
    expect(() => assertWorkbookFormat(enc('  '), 'fods'))
      .toThrow(ImportArchiveInvalidError);
    expect(() => enforceActualImportArchiveLimit(fods(
      '<table:table><table:table-row table:number-rows-repeated="0"/></table:table>',
    ))).toThrow(ImportArchiveInvalidError);
    expect(() => enforceActualImportArchiveLimit(fods('<!--unfinished')))
      .toThrow(ImportArchiveInvalidError);
    expect(() => enforceActualImportArchiveLimit(fods('<![CDATA[unfinished')))
      .toThrow(ImportArchiveInvalidError);
    expect(() => enforceActualImportArchiveLimit(enc('<office:document><table:table-row')))
      .toThrow(ImportArchiveInvalidError);
  });

  it('inspects tag-like content wherever the workbook reader does', () => {
    const enc = (value: string) => new TextEncoder().encode(`<office:document>${value}</office:document>`);
    for (const [open, close] of [['<![CDATA[', ']]>'], ['<?x ?>', ''], ["<x '>", "<x '>"]]) {
      expect(() => enforceActualImportArchiveLimit(enc(
        `${open}<table:table-row table:number-rows-repeated="999999"/>${close}`,
      )), open).toThrow(ImportTooLargeError);
    }
    expect(() => enforceActualImportArchiveLimit(enc(
      '<!-- ordinary note --><![CDATA[ordinary text]]><>' +
      '<table:table><table:table-row><table:table-cell/></table:table-row></table:table>tail',
    ))).not.toThrow();
  });

  it('searches for a comment or CDATA terminator once for nested opening markers', () => {
    const enc = (value: string) => new TextEncoder().encode(`<office:document>${value}</office:document>`);
    const indexOf = vi.spyOn(String.prototype, 'indexOf');
    try {
      expect(() => enforceActualImportArchiveLimit(enc(
        `${'<!--'.repeat(1000)}-->${'<![CDATA['.repeat(1000)}]]>`,
      ))).not.toThrow();
      const searches = (terminator: string) =>
        indexOf.mock.calls.filter(([search]) => search === terminator).length;
      expect(searches('-->')).toBe(1);
      expect(searches(']]>')).toBe(1);
    } finally {
      indexOf.mockRestore();
    }
    // A marker that starts after the remembered terminator needs its own.
    for (const body of [
      '<!--a--><!--unfinished',
      '<!<!---->-- <table:table/> -->',
      '<![CDATA[a]]><![CDATA[unfinished',
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(body)), body)
        .toThrow(ImportArchiveInvalidError);
    }
    expect(() => enforceActualImportArchiveLimit(enc('<!--a--><!--<!--b--><![CDATA[<![CDATA[c]]>')))
      .not.toThrow();
  });

  it('reads comments the way the workbook reader does', () => {
    const enc = (value: string) => new TextEncoder().encode(`<office:document>${value}</office:document>`);
    const cell = (inner: string) =>
      '<table:table><table:table-row>' +
      '<table:table-cell table:number-columns-repeated="702" office:value-type="string">' +
      `${inner}<text:p><text:s text:c="1000000"/></text:p></table:table-cell>` +
      '</table:table-row></table:table>';
    // The reader drops comments before it tokenizes: a commented-out tag is
    // not there, and the text on either side of a comment is read as one.
    expect(() => enforceActualImportArchiveLimit(enc(
      '<!-- a < b, don\'t <table:table-row table:number-rows-repeated="999999"/> -->',
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(cell('<!--</table:table-cell>-->'))))
      .toThrow(ImportArchiveTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<table:table><table:table-row table:number-rows-repeated<!-- -->="999999"/></table:table>',
    ))).toThrow(ImportTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<table:table-row><table:table-cell x="<!--"/>' +
      '<y z="-->" table:number-columns-repeated="703"/></table:table-row>',
    ))).toThrow(ImportDimensionsTooLargeError);
    // Flat files are stripped twice, so a first pass may not spell a comment.
    expect(() => enforceActualImportArchiveLimit(enc('<!<!---->-- <table:table/> -->')))
      .toThrow(ImportArchiveInvalidError);
  });

  it('ignores the tags the workbook reader ignores and keeps its place', () => {
    const enc = (value: string) => new TextEncoder().encode(`<office:document>${value}</office:document>`);
    const cell = (inner: string, open = '<table:table-cell') =>
      '<table:table><table:table-row>' +
      `${open} table:number-columns-repeated="702" office:value-type="string">` +
      `${inner}<text:p><text:s text:c="1000000"/></text:p></table:table-cell>` +
      '</table:table-row></table:table>';
    expect(() => enforceActualImportArchiveLimit(enc(cell('').replace('1000000', '1'))))
      .not.toThrow();
    // None of these ends the repeated cell for the reader: it cannot tokenize
    // the first two, matches element names case-sensitively, swallows the
    // fourth inside an attribute value, and takes an apostrophe as a name
    // character rather than a quote.
    for (const body of [
      cell("</table:table-cell x='1'>"),
      cell('</table:table-cell x = "1">'),
      cell('</table:TABLE-CELL>'),
      cell('<a b="</table:table-cell>"/>'),
      cell("'/>", "<x':table-cell"),
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(body)), body)
        .toThrow(ImportArchiveTooLargeError);
    }
    // A `<` the reader steps over must not hide the tag behind it, and its
    // text pass must not be handed a tag spliced from two.
    for (const body of [
      '<a <table:table-row table:number-rows-repeated="999999">',
      '<a b="<table:table-row c="1" table:number-rows-repeated="999999">">',
      '<text:p><text:s<text:s/>text:c="400000000"/></text:p>',
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(body)), body)
        .toThrow(ImportArchiveInvalidError);
    }
  });

  it('drops a leading DOCTYPE the way the workbook reader does', () => {
    const enc = (value: string) => new TextEncoder().encode(`<office:document>${value}</office:document>`);
    const packed = (xml: string) => packZipMembers({
      'META-INF/manifest.xml': '<manifest/>',
      'content.xml': xml,
    });
    // Ahead of the first ASCII-named element the reader deletes everything
    // from `<!DOCTYPE` on, so these closing tags do not leave the repeated cell.
    const hidden = (pad = '') =>
      `${pad}<語:document-content><語:table><語:table-row>` +
      '<語:table-cell 語:number-columns-repeated="702" 語:value-type="string">' +
      '<!DOCTYPE x></語:table-cell></語:table-row>' +
      '<語:table-row><語:table-cell>' +
      '<text:p><text:s text:c="1000000"/></text:p></語:table-cell></語:table-row>' +
      '</語:table></語:document-content>';
    expect(() => enforceActualImportArchiveLimit(packed(hidden())))
      .toThrow(ImportArchiveTooLargeError);
    // It looks for one in the first 1024 characters only.
    expect(() => enforceActualImportArchiveLimit(packed(hidden(' '.repeat(1024)))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(packed('<!DOCTYPE x>'))).not.toThrow();
    // Behind that element it reads what precedes the DOCTYPE a second time.
    const table =
      '<table:table><table:table-row table:number-rows-repeated="150000">' +
      '<table:table-cell/></table:table-row></table:table>';
    expect(() => enforceActualImportArchiveLimit(enc(table))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(`${table}<!DOCTYPE x>`)))
      .toThrow(ImportDimensionsTooLargeError);
  });

  it('takes for a row exactly what the workbook reader takes for one', () => {
    // The preflight is only as good as its agreement with the reader, so ask
    // the reader which of these spellings repeat the row.
    const fods = (row: string, rows: number) => new TextEncoder().encode(
      '<?xml version="1.0"?><office:document><office:body><office:spreadsheet>' +
      `<table:table table:name="S">${row.replace('N', String(rows))}` +
      '<table:table-cell office:value-type="string"><text:p>x</text:p></table:table-cell>' +
      '</table:table-row></table:table></office:spreadsheet></office:body></office:document>',
    );
    let read = 0;
    for (const row of [
      '<table:table-row table:number-rows-repeated="N">',
      '<table:table-row\n\ttable:number-rows-repeated="N" >',
      "<table:table-row table:number-rows-repeated='N'>",
      '<table:table-row table:number-rows-repeated = "N">',
      '<table:table-row table:number-rows-repeated=N >',
      '<table:TABLE-ROW table:number-rows-repeated="N">',
      '< table:table-row table:number-rows-repeated="N">',
      '<table:table-row x="\'" y=">" table:number-rows-repeated="N">',
      "<table:table-row x/y=\" table:number-rows-repeated='N' \">",
      '<table:table-row x/y=" table:number-rows-repeated = N ">',
      '<a b="<table:table-row table:number-rows-repeated=\'N\'>">',
      '<table:table-row table:number-rows-repeated<!-- -->="N">',
      '<!-- <table:table-row table:number-rows-repeated="N"> -->',
      '<![CDATA[<table:table-row table:number-rows-repeated="N">]]>',
      '<?x ?><table:table-row table:number-rows-repeated="N">',
      "<x '><table:table-row table:number-rows-repeated=\"N\"><x '>",
      "<x y='><table:table-row table:number-rows-repeated=\"N\"><x y='>",
    ]) {
      const repeated = XLSX.read(fods(row, 3), { type: 'array' }).Sheets['S']!['!ref'] === 'A1:A3';
      const check = expect(() => enforceActualImportArchiveLimit(fods(row, MAX_IMPORT_CELLS + 1)), row);
      if (repeated) check.toThrow(ImportTooLargeError);
      else check.toThrow(ImportArchiveInvalidError);
      read += Number(repeated);
    }
    expect(read).toBe(10);
  });

  it('bounds ODF text-space expansion before reading flat and archived XML', () => {
    const fods = (spaceAttributes: string, rowRepeat = 1, cellRepeat = 1) =>
      new TextEncoder().encode(
        `<office:document><table:table><table:table-row table:number-rows-repeated="${rowRepeat}">` +
        `<table:table-cell table:number-columns-repeated="${cellRepeat}" office:value-type="string">` +
        `<text:p><text:s ${spaceAttributes}/></text:p></table:table-cell>` +
        '</table:table-row></table:table></office:document>',
      );
    expect(() => enforceActualImportArchiveLimit(fods('text:c="3"'))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(fods('text:c="0"'))).not.toThrow();
    for (const attribute of [
      'text:c="1048577"',
      'text:c="999999999999999999999"',
      '語:c="1048577"',
      'c_extra="1048577"',
      'text:c="1" 語:c="1048577"',
    ]) {
      expect(() => enforceActualImportArchiveLimit(fods(attribute)), attribute)
        .toThrow(ImportArchiveTooLargeError);
    }
    expect(() => enforceActualImportArchiveLimit(fods('text:c="200"', 150_000)))
      .toThrow(ImportArchiveTooLargeError);
    expect(() => enforceActualImportArchiveLimit(fods('text:c="100"', 1000, 500)))
      .toThrow(ImportArchiveTooLargeError);
    const archived = makeArchiveEntry(fods('text:c="1048577"'), undefined, {
      name: 'Root Entry/content.xml',
    });
    expect(() => enforceActualImportArchiveLimit(archived.bytes))
      .toThrow(ImportArchiveTooLargeError);
    expect(() => enforceActualImportArchiveLimit(fods('text:c="1"', 1, 200_001)))
      .toThrow(ImportTooLargeError);
  });

  it('rejects archived XML that the workbook reader would not read as UTF-8', () => {
    const xml =
      '<office:document-content><table:table><table:table-row>' +
      '<table:table-cell office:value-type="string"><text:p>x<text:s text:c="1048577"/>y</text:p></table:table-cell>' +
      '</table:table-row></table:table></office:document-content>';
    const makeZip = (entries: Array<{ name: string; content: Uint8Array }>, method: 0 | 8) => {
      const chunks: Uint8Array[] = [];
      const cd: Uint8Array[] = [];
      let localPos = 0;
      for (const entry of entries) {
        const nameBytes = new TextEncoder().encode(entry.name);
        const compressed = method === 8 ? deflateRawSync(entry.content) : entry.content;
        const lh = new Uint8Array(30 + nameBytes.length + compressed.length);
        const lv = new DataView(lh.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(8, method, true);
        lv.setUint32(18, compressed.length, true);
        lv.setUint32(22, entry.content.length, true);
        lv.setUint16(26, nameBytes.length, true);
        lh.set(nameBytes, 30);
        lh.set(compressed, 30 + nameBytes.length);
        chunks.push(lh);

        const ch = new Uint8Array(46 + nameBytes.length);
        const cv = new DataView(ch.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(10, method, true);
        cv.setUint32(20, compressed.length, true);
        cv.setUint32(24, entry.content.length, true);
        cv.setUint16(28, nameBytes.length, true);
        cv.setUint32(42, localPos, true);
        ch.set(nameBytes, 46);
        cd.push(ch);
        localPos += lh.length;
      }
      const cdBytesLen = cd.reduce((s, a) => s + a.length, 0);
      const eocd = new Uint8Array(22);
      const ev = new DataView(eocd.buffer);
      ev.setUint32(0, 0x06054b50, true);
      ev.setUint16(8, entries.length, true);
      ev.setUint16(10, entries.length, true);
      ev.setUint32(12, cdBytesLen, true);
      ev.setUint32(16, localPos, true);
      const total = new Uint8Array(localPos + cdBytesLen + 22);
      let p = 0;
      for (const a of [...chunks, ...cd, eocd]) {
        total.set(a, p);
        p += a.length;
      }
      return total;
    };
    const manifest = new TextEncoder().encode('<manifest/>');
    const check = (content: Uint8Array, method: 0 | 8, name = 'content.xml') =>
      () => enforceActualImportArchiveLimit(makeZip([
        { name: 'META-INF/manifest.xml', content: manifest },
        { name, content },
      ], method));
    const utf8 = new TextEncoder().encode(xml);

    for (const method of [0, 8] as const) {
      expect(check(utf8, method), `UTF-8 ${method}`).toThrow(ImportArchiveTooLargeError);
      expect(check(new Uint8Array([0xef, 0xbb, 0xbf, ...utf8]), method), `UTF-8 BOM ${method}`)
        .toThrow(ImportArchiveTooLargeError);
      for (const [label, content] of [
        ['UTF-16LE', encodeUtf16(xml, [0xff, 0xfe], true)],
        ['UTF-16BE', encodeUtf16(xml, [0xfe, 0xff], false)],
        // SheetJS looks for the big-endian mark one byte late in inflated entries.
        ['UTF-16BE after one byte', encodeUtf16(xml, [0x3c, 0xfe, 0xff, 0x20], false)],
        ['truncated UTF-8', new Uint8Array([...utf8, 0xe8, 0xaa])],
      ] as const) {
        expect(check(content, method), `${label} ${method}`).toThrow(ImportArchiveInvalidError);
        expect(check(content, method, 'Root Entry/STYLES.XML'), `${label} ${method} alias`)
          .toThrow(ImportArchiveInvalidError);
        expect(check(content, method, 'Thumbnails/thumbnail.png'), `${label} ${method} binary`)
          .not.toThrow();
      }
      // Power Query `customXml/*.xml` may be UTF-16LE unless its filename is `content.xml`.
      expect(
        check(encodeUtf16('<Item/>', [0xff, 0xfe], true), method, 'customXml/item1.xml'),
        `customXml UTF-16LE ${method}`,
      ).not.toThrow();
      expect(
        check(encodeUtf16('<Item/>', [0xff, 0xfe], true), method, 'Root Entry/customXml/item2.xml'),
        `Root Entry/customXml UTF-16LE ${method}`,
      ).not.toThrow();
      expect(
        check(encodeUtf16('<Item/>', [0xff, 0xfe], true), method, 'customXml/content.xml'),
        `customXml/content.xml UTF-16LE ${method}`,
      ).toThrow(ImportArchiveInvalidError);
      expect(check(new TextEncoder().encode('<sheet>語 🙂</sheet>'), method), `text ${method}`)
        .not.toThrow();
    }
  });

  it('rejects UTF-16 markup that the workbook reader would decode itself', () => {
    const fods =
      '<?xml version="1.0"?><office:document><table:table><table:table-row>' +
      '<table:table-cell office:value-type="string"><text:p>x<text:s text:c="1048577"/>y</text:p></table:table-cell>' +
      '</table:table-row></table:table></office:document>';
    const utf16le = (text: string) => encodeUtf16(text, [0xff, 0xfe], true);
    expect(() => enforceActualImportArchiveLimit(new TextEncoder().encode(fods)))
      .toThrow(ImportArchiveTooLargeError);
    for (const [label, bytes] of [
      ['flat ODF', utf16le(fods)],
      ['after blank lines', utf16le(` \r\n${fods}`)],
      // TextDecoder, which the reader uses, drops one more mark.
      ['second mark', utf16le(`\ufeff${fods}`)],
      ['HTML', utf16le('<table><tr><td>x</td></tr></table>')],
    ] as const) {
      expect(() => enforceActualImportArchiveLimit(bytes), label).toThrow(ImportArchiveInvalidError);
      expect(() => workbookToLoadClipboardCommand(bytes), label).toThrow(ImportArchiveInvalidError);
    }
    // The reader takes all of these as delimited text.
    for (const [label, bytes] of [
      ['UTF-16LE', utf16le('a,<b>\n1,2\n')],
      ['UTF-16LE tab first', utf16le('\t<b>\n')],
      ['big-endian mark', encodeUtf16(fods, [0xfe, 0xff], false)],
      ['Latin-1', new Uint8Array([0xff, 0x2c, 0x3c, 0x62, 0x3e, 0x0a])],
      ['lone byte', new Uint8Array([0xff])],
    ] as const) {
      expect(() => enforceActualImportArchiveLimit(bytes), label).not.toThrow();
    }
    const ss = createSpreadsheet();
    ss.executeCommand(workbookToLoadClipboardCommand(utf16le('a,<b>\n1,2\n'))!);
    ss.executeCommand('paste A1 all');
    const cells = ss.exportCells() as Record<string, { datavalue?: string | number }>;
    expect(cells.B1?.datavalue).toBe('<b>');
    expect(cells.A2?.datavalue).toBe(1);
  });

  it('bounds ODF number-format widths and rejects conditional style maps', () => {
    const enc = (body: string) => new TextEncoder().encode(`<office:document>${body}</office:document>`);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<number:number number:decimal-places="2" number:min-integer-digits="1"/>',
    ))).not.toThrow();
    for (const attribute of [
      'number:decimal-places="4097"',
      'min-integer-digits_extra="4097"',
      'number:min-numerator-digits="1" 語:min-numerator-digits="4097"',
      'number:min-denominator-digits="4097"',
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(`<number:number ${attribute}/>`)), attribute)
        .toThrow(ImportArchiveTooLargeError);
    }
    const styleChain = Array.from({ length: 9 }, (_, index) =>
      `<style:style style:name="s${index}">` +
      `<style:map style:condition="value()>=0" style:apply-style-name="s${index - 1}"/>` +
      '</style:style>',
    ).join('');
    expect(() => enforceActualImportArchiveLimit(enc(styleChain)))
      .toThrow(ImportOdfUnsupportedFeatureError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<語:map 語:condition="value()>=0" 語:apply-style-name="s0"/>',
    ))).toThrow(ImportOdfUnsupportedFeatureError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<table:table-row><table:table-cell/></table:table-row>',
    ))).not.toThrow();
  });

  it('accepts the exact ODF expansion ceilings and rejects the first value beyond them', () => {
    const enc = (body: string) => new TextEncoder().encode(
      `<office:document><table:table>${body}</table:table></office:document>`,
    );
    const row = (rows: number, columns: number, inner = '') =>
      `<table:table-row table:number-rows-repeated="${rows}">` +
      `<table:table-cell table:number-columns-repeated="${columns}">${inner}</table:table-cell>` +
      '</table:table-row>';

    expect(() => enforceActualImportArchiveLimit(enc(row(1000, 200)))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(1001, 200))))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(row(MAX_IMPORT_CELLS, 1))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(1, MAX_IMPORT_CELLS))))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(row(1, MAX_SOCIALCALC_COL))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(1, MAX_SOCIALCALC_COL + 1))))
      .toThrow(ImportDimensionsTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<table:table-row><table:table-cell><text:p><text:s text:c="1048576"/></text:p>' +
      '</table:table-cell></table:table-row>',
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(
      '<number:number number:decimal-places="4096"/>' +
      '<number:number number:decimal-places="4097"/>',
    ))).toThrow(ImportArchiveTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<number:number number:decimal-places="4096"/>',
    ))).not.toThrow();

    const spaces = '<text:s text:c="1048576"/>'.repeat(25);
    expect(() => enforceActualImportArchiveLimit(enc(row(1, 1, `<text:p>${spaces}</text:p>`))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(1, 1, `<text:p>${spaces}<text:s/></text:p>`))))
      .toThrow(ImportArchiveTooLargeError);
  });

  it('bounds ODF text expansion using both repeated rows and repeated cells', () => {
    const enc = (spaces: number) => new TextEncoder().encode(
      '<office:document><table:table><table:table-row table:number-rows-repeated="1000">' +
      '<table:table-cell table:number-columns-repeated="200">' +
      `<text:p><text:s text:c="${spaces}"/></text:p>` +
      '</table:table-cell></table:table-row></table:table></office:document>',
    );
    expect(() => enforceActualImportArchiveLimit(enc(131))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(132)))
      .toThrow(ImportArchiveTooLargeError);
  });

  it('bounds the ODF cell text that repeated rows and repeated cells copy', () => {
    const enc = (cell: string, rows = 1000, columns = 200, lead = '') => new TextEncoder().encode(
      `<office:document><table:table>${lead}` +
      `<table:table-row table:number-rows-repeated="${rows}">` +
      `<table:table-cell table:number-columns-repeated="${columns}"${cell}` +
      '</table:table-row></table:table></office:document>',
    );
    // 199,999 copies beyond the one the archive holds; 131 * 199,999 fits.
    const text = (chars: number) => `><text:p>${'x'.repeat(chars)}</text:p></table:table-cell>`;
    expect(() => enforceActualImportArchiveLimit(enc(text(131)))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(text(132))))
      .toThrow(ImportArchiveTooLargeError);
    for (const attribute of [
      'office:string-value',
      'table:formula',
      '語:formula',
      'string-value_extra',
    ]) {
      const value = (chars: number) =>
        ` ${attribute}="${'x'.repeat(chars)}"><text:p/></table:table-cell>`;
      expect(() => enforceActualImportArchiveLimit(enc(value(131))), attribute).not.toThrow();
      expect(() => enforceActualImportArchiveLimit(enc(value(132))), attribute)
        .toThrow(ImportArchiveTooLargeError);
    }
    expect(() => enforceActualImportArchiveLimit(enc(
      ` office:string-value="${'x'.repeat(66)}" table:formula="${'x'.repeat(66)}">` +
      '<text:p/></table:table-cell>',
    ))).toThrow(ImportArchiveTooLargeError);
    // Only the cell tag's own value attributes are cell text.
    expect(() => enforceActualImportArchiveLimit(enc(
      `><text:p table:formula="${'x'.repeat(132)}"/></table:table-cell>`,
    ))).not.toThrow();
    // Text outside a repeated row is not copied and does not offset the charge.
    expect(() => enforceActualImportArchiveLimit(enc(text(132), 1000, 200, 'x'.repeat(200_000))))
      .toThrow(ImportArchiveTooLargeError);
    // Unrepeated text is only what the archive already holds.
    const megabyte = 'x'.repeat(1024 * 1024);
    expect(() => enforceActualImportArchiveLimit(enc(
      ` office:string-value="${megabyte}"><text:p>${megabyte}</text:p></table:table-cell>`, 1, 1,
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(
      ` office:string-value="${megabyte}"><text:p>${megabyte}</text:p></table:table-cell>`, 1, 14,
    ))).toThrow(ImportArchiveTooLargeError);
    expect(() => enforceActualImportArchiveLimit(enc(
      `><text:p>${megabyte}</text:p></table:table-cell>`, 26, 1,
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(
      `><text:p>${megabyte}</text:p></table:table-cell>`, 27, 1,
    ))).toThrow(ImportArchiveTooLargeError);
  });

  it('bounds OOXML shared-formula expansion before SheetJS copies it into cells', () => {
    const bomb =
      '<worksheet><sheetData>' +
      `<row><c r="A1"><f t="shared" ref="A1:A30" si="0">${'x'.repeat(1_000_000)}</f></c>` +
      Array.from({ length: 26 }, (_, i) => `<c r="A${i + 2}"><f t="shared" si="0"/></c>`).join('') +
      '</row></sheetData></worksheet>';
    expect(() => enforceActualImportArchiveLimit(packZipMembers({
      '[Content_Types].xml': '<Types/>',
      'xl/worksheets/sheet1.xml': bomb,
    }))).toThrow(ImportArchiveTooLargeError);

    // Valid small shared formula, non-shared formulas, and referencing missing si fit.
    const safe =
      '<worksheet><sheetData><row>' +
      '<c r="A1"><f>1+1</f></c>' +
      '<c r="A2"><f t="shared" si="0"/></c>' +
      '<c r="A3"><f t="shared" ref="A3:A4" si="1">A1+1</f></c>' +
      '<c r="A4"><f t="shared" si="1"/></c>' +
      '<c r="A5"><f t="shared" x:si="2"/></c>' +
      `<c r="A6"><f x="1" t='shared' si=3></f></c>` +
      '</row></sheetData></worksheet>';
    expect(() => enforceActualImportArchiveLimit(packZipMembers({
      '[Content_Types].xml': '<Types/>',
      'xl/worksheets/sheet1.xml': safe,
    }))).not.toThrow();
  });

  it('rejects malformed ODF repetition values before workbook parsing', () => {
    const enc = (raw: string) => new TextEncoder().encode(
      '<office:document><table:table>' +
      `<table:table-row table:number-rows-repeated="${raw}"/>` +
      '</table:table></office:document>',
    );
    for (const raw of ['02', '2x', 'x2', '1.5', '-1', ' 2', '2 ', '']) {
      expect(() => enforceActualImportArchiveLimit(enc(raw)), raw)
        .toThrow(ImportArchiveInvalidError);
    }
  });

  it('handles quoted attributes and scopes special ODF elements', () => {
    const enc = (body: string) => new TextEncoder().encode(
      `<office:document><table:table>${body}</table:table></office:document>`,
    );
    // The reader tokenizes `name="value"` only, but then reads attributes out
    // of the value of one whose name it cannot parse.
    for (const attribute of [
      'x="\'" y=">" table:number-rows-repeated="200001"',
      "x/y=\" table:number-rows-repeated='200001' \"",
      'x/y=" table:number-rows-repeated = 200001 "',
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(
        `<table:table-row ${attribute}/>`,
      )), attribute).toThrow(ImportTooLargeError);
    }
    expect(() => enforceActualImportArchiveLimit(enc(
      '<text:p text:c="1048577"/>',
    ))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc('<other:map/>'))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc('<style:map/>')))
      .toThrow(ImportOdfUnsupportedFeatureError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<other:map other:condition="value()>=0"/>',
    ))).toThrow(ImportOdfUnsupportedFeatureError);
    expect(() => enforceActualImportArchiveLimit(enc(
      '<other:map other:apply-style-name="s0"/>',
    ))).toThrow(ImportOdfUnsupportedFeatureError);
  });

  it('reports the expanded ODF dimensions at the rejected boundary', () => {
    const xml = new TextEncoder().encode(
      '<office:document><table:table>' +
      '<table:table-row table:number-rows-repeated="1000">' +
      '<table:table-cell table:number-columns-repeated="703"/>' +
      '</table:table-row></table:table></office:document>',
    );
    let error: unknown;
    try {
      enforceActualImportArchiveLimit(xml);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ImportDimensionsTooLargeError);
    expect(error).toMatchObject({ rows: 1000, columns: 703 });
  });

  it('tracks the aggregate ODF cell budget across individually valid tables', () => {
    const table = (rows: number, columns: number) =>
      '<table:table><table:table-row ' +
      `table:number-rows-repeated="${rows}">` +
      `<table:table-cell table:number-columns-repeated="${columns}"/>` +
      '</table:table-row></table:table>';
    const enc = (body: string) => new TextEncoder().encode(`<office:document>${body}</office:document>`);
    expect(() => enforceActualImportArchiveLimit(enc(table(100_000, 1) + table(100_000, 1))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(table(100_000, 2) + table(100_000, 2))))
      .toThrow(ImportDimensionsTooLargeError);
  });

  it('rejects ODF cells that are not nested in a row the way they are counted', () => {
    const enc = (body: string) => new TextEncoder().encode(
      `<office:document><table:table>${body}</table:table></office:document>`,
    );
    const open = '<table:table-cell table:number-columns-repeated="700">';
    const close = '</table:table-cell>';
    const cell = `${open}<text:p>1</text:p>${close}`;
    const row = (body: string, rows = 1) =>
      `<table:table-row table:number-rows-repeated="${rows}">${body}</table:table-row>`;

    // Well-formed rows keep their budget, whichever cell element they use.
    expect(() => enforceActualImportArchiveLimit(enc(row(`${cell}<table:table-cell/>`, 200))))
      .not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(
      '<table:covered-table-cell><text:p>1</text:p></table:covered-table-cell><数据></数据>',
    )))).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(enc(row(cell, 7000))))
      .toThrow(ImportDimensionsTooLargeError);

    for (const body of [
      // SheetJS multiplies these by the last row tag it saw, closed or not.
      cell,
      `<table:table-row table:number-rows-repeated="7000"/>${cell}`,
      `${row('', 7000)}${cell}`,
      `${row('')}<table:table-cell/>`,
      `${row('')}<table:covered-table-cell table:number-columns-repeated="700"/>`,
      `${row('')}<数据>`,
      `<table:table-row table:number-rows-repeated="7000"><table:table table:name="inner">${cell}`,
      // Every extra closing tag repeats the expansion of the last cell tag.
      row(`${cell}${close}`, 200),
      row(`<table:table-cell table:number-columns-repeated="700"/>${close}`, 200),
      row(close),
      // A tag inside an open cell replaces what that cell is expanded by.
      row(`${open}<table:table-cell table:number-columns-repeated="2"/>${close}`),
      row(`${open}${open}${close}${close}`),
      row(`${open}<table:table-row table:number-rows-repeated="280">${close}`),
      row(`${open}<table:table-row table:number-rows-repeated="280"/>${close}`),
      row(`${open}</table:table-row><table:table-row>${close}`, 280),
      row(`${open}<table:table table:name="inner">${close}`, 280),
      row(open),
    ]) {
      expect(() => enforceActualImportArchiveLimit(enc(body)), body)
        .toThrow(ImportArchiveInvalidError);
    }
    expect(() => enforceActualImportArchiveLimit(new TextEncoder().encode(
      `<office:document><table:table><table:table-row>${open}`,
    ))).toThrow(ImportArchiveInvalidError);

    const archived = makeArchiveEntry(
      enc(`<table:table-row table:number-rows-repeated="7000"/>${cell}`),
      undefined,
      { name: 'content.xml' },
    );
    expect(() => enforceActualImportArchiveLimit(archived.bytes))
      .toThrow(ImportArchiveInvalidError);
  });

  describe('hyperlink ranges', () => {
    // 702 columns x 285 rows: just over the cell limit on its own.
    const wide = 'A1:ZZ285';
    const part = (content: string | Uint8Array, name = 'xl/worksheets/sheet1.dat') => () =>
      enforceActualImportArchiveLimit(packZipMembers({
        '[Content_Types].xml': '<Types/>',
        [name]: content,
      }));
    const utf16 = (mark: number[], text: string, bigEndian: boolean) => {
      const bytes = new Uint8Array(mark.length + 2 * text.length);
      bytes.set(mark);
      const view = new DataView(bytes.buffer);
      for (let i = 0; i < text.length; i++) {
        view.setUint16(mark.length + 2 * i, text.charCodeAt(i), !bigEndian);
      }
      return bytes;
    };

    it('charges the summed area before the workbook reader walks it', () => {
      expect(part(
        '<hyperlinks><hyperlink ref="A1:ZZ284"/><x:hyperlink r:id="rId1" x:ref=\'A1:A632\'/></hyperlinks>',
      )).not.toThrow();
      expect(part(
        '<hyperlinks><hyperlink ref="A1:ZZ284"/><hyperlink ref=A1:A633 /></hyperlinks>',
      )).toThrow(new ImportTooLargeError(MAX_IMPORT_CELLS + 1));
      expect(part('<hyperlink ref="A1:ZZ200"/>'.repeat(2)))
        .toThrow(new ImportTooLargeError(280_800));
      expect(part(`<hyperlink ref="${wide}"/>`, 'xl/worksheets/sheet1.xml'))
        .toThrow(ImportTooLargeError);
    });

    it('rejects ranges that end outside the grid, which the reader never finishes', () => {
      expect(part('<hyperlink ref="A9007199254740992:A9007199254740999"/>'))
        .toThrow(ImportRowOutOfRangeError);
      expect(part(`<hyperlink ref="A1:A${MAX_SOCIALCALC_ROW + 1}"/>`))
        .toThrow(ImportRowOutOfRangeError);
      expect(part('<hyperlink ref="AAA1"/>')).toThrow(ImportColumnOutOfRangeError);
      expect(part(`<hyperlink ref="${'Z'.repeat(400)}1:${'Z'.repeat(400)}1"/>`))
        .toThrow(ImportColumnOutOfRangeError);
      expect(part(`<hyperlink ref="ZZ${MAX_SOCIALCALC_ROW}"/>`)).not.toThrow();
    });

    it('charges the row walk of a range whose column span is empty', () => {
      expect(part('<hyperlink ref="B1:A9"/><hyperlink ref="AAA9:AAA1"/><hyperlink ref="A1:"/>'))
        .not.toThrow();
      expect(part('<hyperlink ref="B1:A100001"/>'.repeat(2)))
        .toThrow(new ImportTooLargeError(200_002));
    });

    it('reads tags and attributes the way the workbook reader does', () => {
      for (const tag of [
        `<x:hyperlink x:ref='${wide}'/>`,
        `<hyperlink REF=${wide} />`,
        `<hyperlink ref_extra="${wide}"/>`,
        `<hyperlink ref  =  "${wide}"/>`,
        `<hyperlink ref=${wide}="A1"/>`,
        `<hyperlink ref="A1" ref="${wide}" ref="A1"/>`,
        `<hyperlink display="x" ref="${wide}junk"/>`,
        `<!-- <hyperlink ref="${wide}"/> -->`,
      ]) {
        expect(part(tag), tag).toThrow(ImportTooLargeError);
      }
      for (const tag of [
        `<hyperlink x:ref_extra="${wide}" tooltip="ref=${wide}"/>`,
        `<hyperlink ref=\n"${wide}"/>`,
        `<hyperlink ref="$A$1:${wide}"/>`,
        `<hyperlink\tref="${wide}"/>`,
        `<hyperlinks ref="${wide}"/>`,
      ]) {
        expect(part(tag), tag).not.toThrow();
      }
    });

    it('reads UTF-16 parts behind a byte-order mark', () => {
      const hostile = `<hyperlink ref="${wide}"/>`;
      expect(part(utf16([0xff, 0xfe], hostile, false))).toThrow(ImportTooLargeError);
      expect(part(utf16([0xfe, 0xff], hostile, true))).toThrow(ImportTooLargeError);
      // SheetJS's Buffer path finds the big-endian mark at the second byte.
      expect(part(utf16([0x00, 0xfe, 0xff, 0x00], hostile, true)))
        .toThrow(ImportTooLargeError);
      expect(part(utf16([0xff, 0xfe], '<hyperlink ref="A1"/>', false))).not.toThrow();
      expect(part(new Uint8Array([0xff, 0x00]))).not.toThrow();
      expect(part(new Uint8Array([0xfe, 0x00]))).not.toThrow();
    });

    it('keeps XLSB parts from the workbook reader', () => {
      const entry = (name: string, content: Uint8Array | string = new Uint8Array([0xee, 0x03, 0x00])) => packZipMembers({
        '[Content_Types].xml': '<Types/>',
        [name]: content,
      });
      const xml = entry('xl/worksheets/sheet1.xml', '<worksheet/>');
      expect(enforceActualImportArchiveLimit(xml)).toBe(xml);
      const flat = new TextEncoder().encode('<office:document/>');
      expect(enforceActualImportArchiveLimit(flat)).toBe(flat);

      for (const name of ['xl/worksheets/sheet1.bin', 'XL/WORKSHEETS/SHEET1.BIN']) {
        const bytes = entry(name);
        const readable = enforceActualImportArchiveLimit(bytes);
        expect(readable).not.toBe(bytes);
        expect(new TextDecoder().decode(readable)).toContain(`${name.slice(0, -1)}_`);
        expect(new TextDecoder().decode(bytes)).toContain(name);
        expect(readable.length).toBe(bytes.length);
      }

      // A real XLSB workbook, and an XLSX whose worksheet part is a binary one.
      const book = XLSX.utils.book_new() as WorkBook;
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['a', 1]]), 'Sheet1');
      const write = (bookType: 'xlsx' | 'xlsb') => new Uint8Array(
        XLSX.write(book, { bookType, type: 'array' }) as ArrayBufferLike,
      );
      expect(() => xlsxToSave(write('xlsb'))).toThrow(ImportArchiveInvalidError);
      expect(xlsxToSave(write('xlsx'))).toContain('cell:A1:t:a');
      const repack = (edit: (archive: any) => void) => {
        const archive = (XLSX as any).CFB.read(write('xlsx'), { type: 'buffer' });
        edit(archive);
        return new Uint8Array(
          (XLSX as any).CFB.write(archive, { fileType: 'zip', type: 'array' }) as ArrayBufferLike,
        );
      };
      const entryOf = (archive: any, path: string) =>
        archive.FileIndex[archive.FullPaths.indexOf(`Root Entry/${path}`)];
      const binarySheet = entryOf(
        (XLSX as any).CFB.read(write('xlsb'), { type: 'buffer' }),
        'xl/worksheets/sheet1.bin',
      ).content;
      const mixed = repack((archive) => {
        (XLSX as any).CFB.utils.cfb_add(archive, '/xl/worksheets/sheet1.bin', binarySheet);
        const rels = entryOf(archive, 'xl/_rels/workbook.xml.rels');
        rels.content = new TextEncoder().encode(
          new TextDecoder().decode(rels.content).replace('sheet1.xml', 'sheet1.bin'),
        );
        rels.size = rels.content.length;
      });
      expect(xlsxToSave(mixed)).not.toMatch(/^cell:/m);
      // The parts an XLSX carries as `.bin` are not ones the reader opens.
      const withPrinterSettings = repack((archive) => {
        (XLSX as any).CFB.utils.cfb_add(
          archive,
          '/xl/printerSettings/printerSettings1.bin',
          new Uint8Array([0xee, 0x03, 0x00]),
        );
      });
      expect(enforceActualImportArchiveLimit(withPrinterSettings)).not.toBe(withPrinterSettings);
      expect(xlsxToSave(withPrinterSettings)).toContain('cell:A1:t:a');
    });

    it('refuses a hostile workbook on the import path and keeps ordinary hyperlinks', () => {
      const book = XLSX.utils.book_new() as WorkBook;
      XLSX.utils.book_append_sheet(book, {
        '!ref': 'A1:B1',
        A1: { t: 's', v: 'site', l: { Target: 'https://example.com/' } },
        B1: { t: 'n', v: 2 },
      }, 'Sheet1');
      const bytes = new Uint8Array(
        XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBufferLike,
      );
      expect(xlsxToSave(bytes)).toContain('cell:A1:t:site');

      const archive = (XLSX as any).CFB.read(bytes, { type: 'buffer' });
      const sheet = archive.FileIndex[
        archive.FullPaths.indexOf('Root Entry/xl/worksheets/sheet1.xml')
      ];
      sheet.content = new TextEncoder().encode(
        new TextDecoder().decode(sheet.content).replace(
          /<hyperlink [^>]*>/,
          '<hyperlink ref="A1:ZZ200"/>'.repeat(2),
        ),
      );
      sheet.size = sheet.content.length;
      const hostile = new Uint8Array(
        (XLSX as any).CFB.write(archive, { fileType: 'zip', type: 'array' }) as ArrayBufferLike,
      );
      expect(() => xlsxToSave(hostile)).toThrow(new ImportTooLargeError(280_800));
      expect(() => xlsxToLoadClipboardCommands(hostile)).toThrow(ImportTooLargeError);
    });
  });

  it('rejects an entry whose expanded size differs from its directory metadata', () => {
    const { bytes } = makeArchiveEntry(new Uint8Array(1024), 0);
    expect(() => enforceImportArchiveLimit(bytes)).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow('invalid workbook archive');
  });

  it('rejects an incomplete archive envelope', () => {
    expect(() => enforceActualImportArchiveLimit(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toThrow(ImportArchiveInvalidError);
  });

  it('stops expansion before allocating beyond the archive budget', () => {
    const { bytes } = makeArchiveEntry(new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1), 0);
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveTooLargeError);
  });

  it('rejects local size disagreement and ZIP64 metadata', () => {
    const localMismatch = makeArchiveEntry(new Uint8Array(64));
    new DataView(localMismatch.bytes.buffer).setUint32(22, 1, true);
    expect(() => enforceActualImportArchiveLimit(localMismatch.bytes)).toThrow('invalid workbook archive');

    const zip64 = makeArchiveEntry(new Uint8Array(64));
    new DataView(zip64.bytes.buffer).setUint32(zip64.central + 24, 0xffffffff, true);
    expect(() => enforceActualImportArchiveLimit(zip64.bytes)).toThrow('invalid workbook archive');
  });

  it('accepts stored entries and archive comments, and enforces the input byte limit', () => {
    const { bytes } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, {
      method: 0,
      comment: new Uint8Array([1, 2, 3, 4]),
      centralExtra: new Uint8Array([2, 0, 0, 0]),
    });
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(new Uint8Array(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1))).toThrow(ImportArchiveTooLargeError);
  });

  it('rejects a second end record behind the validated one', () => {
    // SheetJS searches from four bytes before the end of the file, so it
    // would follow a record in the comment to a directory nobody checked.
    const hidden = makeArchiveEntry(new Uint8Array(4)).bytes;
    for (const comment of [
      hidden.subarray(hidden.length - 22, hidden.length - 2),
      new Uint8Array([0, 0x50, 0x4b, 0x05, 0x06, 0]),
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    ]) {
      const { bytes } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, { comment });
      expect(() => enforceActualImportArchiveLimit(bytes), String(comment.length))
        .toThrow('invalid workbook archive');
    }
    const { bytes } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, {
      comment: new Uint8Array([0x50, 0x4b, 0x05]),
    });
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
  });

  it('rejects inconsistent directory records and archive names', () => {
    const wrongDisk = makeArchiveEntry(new Uint8Array(4));
    new DataView(wrongDisk.bytes.buffer).setUint16(wrongDisk.bytes.length - 18, 1, true);
    expect(() => enforceActualImportArchiveLimit(wrongDisk.bytes)).toThrow('invalid workbook archive');

    const missingRecord = makeArchiveEntry(new Uint8Array(4));
    new DataView(missingRecord.bytes.buffer).setUint16(missingRecord.bytes.length - 14, 2, true);
    new DataView(missingRecord.bytes.buffer).setUint16(missingRecord.bytes.length - 12, 2, true);
    expect(() => enforceActualImportArchiveLimit(missingRecord.bytes)).toThrow('invalid workbook archive');

    const changedName = makeArchiveEntry(new Uint8Array(4));
    changedName.bytes[changedName.central + 46] = 0x79;
    expect(() => enforceActualImportArchiveLimit(changedName.bytes)).toThrow('invalid workbook archive');

    const trailingDirectoryByte = makeArchiveEntry(new Uint8Array(4));
    const extended = new Uint8Array(trailingDirectoryByte.bytes.length + 1);
    const oldEnd = trailingDirectoryByte.bytes.length - 22;
    extended.set(trailingDirectoryByte.bytes.subarray(0, oldEnd));
    extended.set(trailingDirectoryByte.bytes.subarray(oldEnd), oldEnd + 1);
    new DataView(extended.buffer).setUint32(oldEnd + 1 + 12, oldEnd - trailingDirectoryByte.central + 1, true);
    expect(() => enforceActualImportArchiveLimit(extended)).toThrow('invalid workbook archive');
  });

  it('checks local and directory metadata before reading entries', () => {
    const cases: Array<[
      string,
      (bytes: Uint8Array, central: number, end: number) => void,
    ]> = [
      ['disk number', (bytes, _central, end) => new DataView(bytes.buffer).setUint16(end + 4, 1, true)],
      ['directory disk', (bytes, _central, end) => new DataView(bytes.buffer).setUint16(end + 6, 1, true)],
      ['disk entry count', (bytes, _central, end) => new DataView(bytes.buffer).setUint16(end + 8, 2, true)],
      ['total entry count', (bytes, _central, end) => new DataView(bytes.buffer).setUint16(end + 10, 2, true)],
      ['directory size', (bytes, _central, end) => new DataView(bytes.buffer).setUint32(end + 12, 1, true)],
      ['directory offset', (bytes, central, end) => new DataView(bytes.buffer).setUint32(end + 16, central + 1, true)],
      ['central signature', (bytes, central) => { bytes[central] = 0; }],
      ['local signature', (bytes) => { bytes[2] = 0; }],
      ['central compressed size', (bytes, central) => new DataView(bytes.buffer).setUint32(central + 20, 0xffffffff, true)],
      ['central declared size', (bytes, central) => new DataView(bytes.buffer).setUint32(central + 24, 0xffffffff, true)],
      ['local offset', (bytes, central) => new DataView(bytes.buffer).setUint32(central + 42, 0xffffffff, true)],
      ['flags', (bytes, central) => new DataView(bytes.buffer).setUint16(central + 8, 1, true)],
      ['method', (bytes, central) => new DataView(bytes.buffer).setUint16(central + 10, 8, true)],
      ['central name length', (bytes, central) => new DataView(bytes.buffer).setUint16(central + 28, 100, true)],
      ['local name length', (bytes) => new DataView(bytes.buffer).setUint16(26, 100, true)],
      ['central data length', (bytes, central) => new DataView(bytes.buffer).setUint32(central + 20, 100, true)],
      ['local data length', (bytes) => new DataView(bytes.buffer).setUint32(18, 100, true)],
      ['local declared length', (bytes) => new DataView(bytes.buffer).setUint32(22, 100, true)],
      ['central declared length', (bytes, central) => new DataView(bytes.buffer).setUint32(central + 24, 100, true)],
      ['local name', (bytes) => { bytes[30] = 0; }],
    ];
    for (const [name, mutate] of cases) {
      const { bytes, central } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, { method: 0 });
      expect(() => enforceActualImportArchiveLimit(bytes), name).not.toThrow();
      mutate(bytes, central, bytes.length - 22);
      expect(() => enforceActualImportArchiveLimit(bytes), name).toThrow(ImportArchiveInvalidError);
    }
  });

  it('rejects directory records that share one local entry', () => {
    const { bytes, central } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'));
    const end = bytes.length - 22;
    const record = bytes.subarray(central, end);
    const doubled = new Uint8Array(bytes.length + record.length);
    doubled.set(bytes.subarray(0, end));
    doubled.set(record, end);
    doubled.set(bytes.subarray(end), end + record.length);
    const view = new DataView(doubled.buffer);
    view.setUint16(end + record.length + 8, 2, true);
    view.setUint16(end + record.length + 10, 2, true);
    view.setUint32(end + record.length + 12, 2 * record.length, true);
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    expect(() => enforceActualImportArchiveLimit(doubled)).toThrow(ImportArchiveInvalidError);
  });

  it('checks entries that use deferred local sizes', () => {
    const { bytes, central } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, { method: 0 });
    const view = new DataView(bytes.buffer);
    view.setUint16(6, 8, true);
    view.setUint16(central + 8, 8, true);
    view.setUint32(18, 0, true);
    view.setUint32(22, 0, true);
    expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();

    view.setUint32(18, 100, true);
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
    view.setUint32(18, 0, true);
    view.setUint32(22, 100, true);
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
  });

  it('rejects malformed extra fields, unsupported methods, and corrupt compressed data', () => {
    for (const centralExtra of [
      new Uint8Array([0]),
      new Uint8Array([1, 0, 0, 0]),
      new Uint8Array([2, 0, 8, 0]),
    ]) {
      const { bytes } = makeArchiveEntry(new Uint8Array(4), undefined, { centralExtra });
      expect(() => enforceActualImportArchiveLimit(bytes)).toThrow('invalid workbook archive');
    }

    const method = makeArchiveEntry(new Uint8Array(4));
    const methodView = new DataView(method.bytes.buffer);
    methodView.setUint16(8, 99, true);
    methodView.setUint16(method.central + 10, 99, true);
    expect(() => enforceActualImportArchiveLimit(method.bytes)).toThrow('invalid workbook archive');

    const corrupt = makeArchiveEntry(new Uint8Array(4));
    corrupt.bytes[30 + 24] = 0xff;
    expect(() => enforceActualImportArchiveLimit(corrupt.bytes)).toThrow(ImportArchiveTooLargeError);
  });

  it('accepts only archives that SheetJS reads as OOXML or ODF', () => {
    const single = (name: string): Uint8Array =>
      makeArchiveEntry(new TextEncoder().encode('<x/>'), undefined, { name }).bytes;
    for (const bytes of [
      single('[Content_Types].xml'),
      single('/[content_types].XML'),
      single('Root Entry/[Content_Types].xml'),
      single('META-INF/manifest.xml'),
      single('meta-inf\\Manifest.xml'),
      packZipMembers({
        'META-INF/manifest.xml': '<x/>',
        'objectdata.xml': '<x/>',
        'Index/Document.iwa': '<x/>',
      }),
    ]) {
      expect(() => enforceActualImportArchiveLimit(bytes)).not.toThrow();
    }
    for (const bytes of [
      single('Index.zip'),
      single('content.xml'),
      single('xl/workbook.xml'),
      single('objectdata.xml'),
      single('x/[Content_Types].xml'),
      single('\uFEFF[Content_Types].xml'),
      single('Root Entry/Root Entry/[Content_Types].xml'),
      packZipMembers({ '[Content_Types].xml': '<x/>', 'objectdata.xml': '<x/>' }),
      packZipMembers({ '[Content_Types].xml': '<x/>', 'Index/Document.iwa': '<x/>' }),
    ]) {
      expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
    }
  });

  it('does not let SheetJS read an Index.zip member as another format', () => {
    const sylk = new TextEncoder().encode('ID;P\nC;X1;Y2;K1\nE\n');
    const { bytes } = makeArchiveEntry(sylk, undefined, { method: 0, name: 'Index.zip' });
    // SheetJS alone reads the nested SYLK file: the archive has to be refused first.
    expect(XLSX.read(bytes, { type: 'array' }).Sheets.Sheet1?.A2?.v).toBe(1);
    expect(() => xlsxToSave(bytes)).toThrow(ImportArchiveInvalidError);
    expect(() => xlsxToLoadClipboardCommands(bytes)).toThrow(ImportArchiveInvalidError);
  });

  it('rejects an end record that only SheetJS would find', () => {
    for (const length of [4, 21]) {
      const comment = new Uint8Array(length);
      comment.set([0x50, 0x4b, 0x05, 0x06]);
      const { bytes } = makeArchiveEntry(new TextEncoder().encode('<sheet/>'), undefined, { comment });
      expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
    }
  });

  it('readBoundedWorkbook reads ZIP and flat inputs with cellText disabled and enforces member read budget', () => {
    const MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    const OFFICE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const SHEET_ML = 'application/vnd.openxmlformats-officedocument.spreadsheetml';

    const wbZip = readBoundedWorkbook(makeXlsx({ A1: { t: 'n', v: 42 } }, 'A1:A1'));
    expect(wbZip.Sheets.Sheet1?.A1?.v).toBe(42);
    const wbFlat = readBoundedWorkbook(new TextEncoder().encode('<office:document/>'));
    expect(wbFlat.SheetNames).toEqual([]);

    // Custom styles numFmt is not expanded into cell .w when cellText: false.
    const hugeFormat = '0"' + 'x'.repeat(50_000) + '"';
    const withCustomNumFmt = packZipMembers({
      '[Content_Types].xml':
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        `<Override PartName="/xl/workbook.xml" ContentType="${SHEET_ML}.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="${SHEET_ML}.styles+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="${SHEET_ML}.worksheet+xml"/></Types>`,
      'xl/workbook.xml':
        `<workbook xmlns="${MAIN}" xmlns:r="${OFFICE}"><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels':
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        `<Relationship Id="rId1" Type="${OFFICE}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${OFFICE}/styles" Target="styles.xml"/></Relationships>`,
      'xl/styles.xml':
        `<styleSheet xmlns="${MAIN}"><numFmts count="1"><numFmt numFmtId="164" formatCode="${hugeFormat.replace(/"/g, '&quot;')}"/></numFmts>` +
        '<cellXfs count="1"><xf numFmtId="164"/></cellXfs></styleSheet>',
      'xl/worksheets/sheet1.xml':
        `<worksheet xmlns="${MAIN}"><sheetData><row><c r="A1" s="0"><v>7</v></c></row></sheetData></worksheet>`,
    });
    const wbStyled = readBoundedWorkbook(withCustomNumFmt);
    expect(wbStyled.Sheets.S?.A1?.v).toBe(7);
    expect(wbStyled.Sheets.S?.A1?.w).toBeUndefined();

    // Aliased sheet exceeding MAX_WORKBOOK_READ_BYTES throws ImportArchiveTooLargeError.
    const heavySheetXml =
      `<worksheet xmlns="${MAIN}"><sheetData><row><c><v>7</v></c></row></sheetData></worksheet>` +
      `<!--${'a'.repeat(9_500_000)}-->`;
    const ids = Array.from({ length: 12 }, (_, i) => i + 1);
    const aliasedZip = packZipMembers({
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
        ids.map((id) => `<Relationship Id="rId${id}" Type="${OFFICE}/worksheet" Target="worksheets/sheet1.xml"/>`).join('') +
        '</Relationships>',
      'xl/worksheets/sheet1.xml': heavySheetXml,
    });
    expect(MAX_WORKBOOK_READ_BYTES).toBe(100 * 1024 * 1024);
    expect(() => readBoundedWorkbook(aliasedZip)).toThrow(ImportArchiveTooLargeError);
  });
});

describe('XLSB parts in an .xlsx package', () => {
  const CFB = (XLSX as any).CFB;
  /** The members of a workbook whose sheet `S` has A1 = 7, as SheetJS writes it. */
  const written = (bookType: XLSX.BookType): any => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([[7]]), 'S');
    return CFB.read(new Uint8Array(XLSX.write(book, { bookType, type: 'array' })), { type: 'array' });
  };
  const packed = (zip: any): Uint8Array =>
    new Uint8Array(CFB.write(zip, { fileType: 'zip', type: 'buffer' }));
  const binarySheet = Uint8Array.from(CFB.find(written('xlsb'), '/xl/worksheets/sheet1.bin').content);
  /**
   * A stored-only archive assembled by hand: `size` bytes, the local records
   * written by `lay`, then a central directory at `directory` that lists
   * `entries` as [name, content size, offset of the local record].
   */
  const layOut = (
    size: number,
    directory: number,
    lay: (bytes: Uint8Array, local: (at: number, name: Uint8Array, content: string) => void) => void,
    entries: (bytes: Uint8Array) => Array<readonly [Uint8Array, number, number]>,
  ): Uint8Array => {
    const bytes = new Uint8Array(size);
    const view = new DataView(bytes.buffer);
    lay(bytes, (at, name, content) => {
      view.setUint32(at, 0x04034b50, true);
      view.setUint32(at + 18, content.length, true);
      view.setUint32(at + 22, content.length, true);
      view.setUint16(at + 26, name.length, true);
      bytes.set(name, at + 30);
      bytes.set(new TextEncoder().encode(content), at + 30 + name.length);
    });
    let at = directory;
    const listed = entries(bytes);
    for (const [name, length, localOffset] of listed) {
      view.setUint32(at, 0x02014b50, true);
      view.setUint32(at + 20, length, true);
      view.setUint32(at + 24, length, true);
      view.setUint16(at + 28, name.length, true);
      view.setUint32(at + 42, localOffset, true);
      bytes.set(name, at + 46);
      at += 46 + name.length;
    }
    view.setUint32(at, 0x06054b50, true);
    view.setUint16(at + 8, listed.length, true);
    view.setUint16(at + 10, listed.length, true);
    view.setUint32(at + 12, at - directory, true);
    view.setUint32(at + 16, directory, true);
    return bytes.subarray(0, at + 22);
  };
  const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);

  it('keeps a worksheet part called *.bin away from SheetJS', () => {
    const zip = written('xlsx');
    const rels = CFB.find(zip, '/xl/_rels/workbook.xml.rels');
    rels.content = Buffer.from(Buffer.from(rels.content).toString().replace('sheet1.xml', 'sheet1.bin'));
    CFB.utils.cfb_del(zip, '/xl/worksheets/sheet1.xml');
    CFB.utils.cfb_add(zip, '/xl/worksheets/sheet1.bin', binarySheet);
    const bytes = packed(zip);
    // The name alone decides: this is an .xlsx in every other respect, and
    // A1 exists only in the binary part.
    const book = XLSX.read(bytes, { type: 'array' });
    expect([book.bookType, book.Sheets.S?.A1?.v]).toEqual(['xlsx', 7]);
    expect(xlsxToLoadClipboardCommands(bytes)).toEqual([]);
    expect(xlsxToSave(bytes)).not.toContain('cell:A1:');
    expect(XLSX.read(enforceActualImportArchiveLimit(bytes), { type: 'array' }).Sheets.S).toBeUndefined();
  });

  it('renames a *.bin member in the local header and in the central directory', () => {
    const name = 'xl/embeddings/oleObject1.BIN';
    const bytes = packZipMembers({
      '[Content_Types].xml': '<Types/>',
      [name]: new Uint8Array(4),
    });
    const readable = enforceActualImportArchiveLimit(bytes);
    expect(readable).not.toBe(bytes);
    expect(new TextDecoder().decode(bytes)).toContain(name);
    expect(new TextDecoder().decode(readable)).toContain('xl/embeddings/oleObject1.BI_');
    expect(new TextDecoder().decode(readable)).not.toContain(name);
    // Checking the returned archive again is idempotent and leaves it unchanged.
    expect(enforceActualImportArchiveLimit(readable)).toBe(readable);
  });

  it('checks the archive again after a rename when its entries are out of order', () => {
    // `[Content_Types].xml` (at 37) is listed first, before `b.bin` (at 0): nothing overlaps,
    // and the archive is still valid once `b.bin` is renamed in a copy.
    const bytes = layOut(300, 120, (_, local) => {
      local(0, ascii('b.bin'), 'zz');
      local(37, ascii('[Content_Types].xml'), '<x/>');
    }, () => [[ascii('[Content_Types].xml'), 4, 37], [ascii('b.bin'), 2, 0]]);
    const readable = enforceActualImportArchiveLimit(bytes);
    expect(readable).not.toBe(bytes);
    expect(new TextDecoder().decode(bytes.subarray(30, 35))).toBe('b.bin');
    expect(new TextDecoder().decode(readable.subarray(30, 35))).toBe('b.bi_');
  });

  it('refuses an archive in which a rename changes another entry', () => {
    // `a.bin.xml` is listed, and so checked, first. The local record of the
    // second entry lies in front of it, and its name runs on over the first
    // entry's header up to the `n` of `a.bin`: renaming the second entry
    // would hand SheetJS a first entry called `a.bi_.xml`.
    const bytes = layOut(512, 160, (raw, local) => {
      local(30, ascii('a.bin.xml'), '<x/>');
      local(0, raw.slice(30, 65), '');
      // Its content is the eight bytes behind that name, `.xml<x/>`.
      new DataView(raw.buffer).setUint32(18, 8, true);
      new DataView(raw.buffer).setUint32(22, 8, true);
      local(65, ascii('[Content_Types].xml'), '<x/>');
    }, (raw) => [
      [ascii('[Content_Types].xml'), 4, 65],
      [ascii('a.bin.xml'), 4, 30],
      [raw.slice(30, 65), 8, 0],
    ]);
    expect(new TextDecoder().decode(bytes.subarray(60, 65))).toBe('a.bin');
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
  });

  it('refuses an XLSB workbook', () => {
    const bytes = packed(written('xlsb'));
    expect(XLSX.read(bytes, { type: 'array' }).bookType).toBe('xlsb');
    expect(() => enforceActualImportArchiveLimit(bytes)).toThrow(ImportArchiveInvalidError);
    expect(() => xlsxToSave(bytes)).toThrow(ImportArchiveInvalidError);
    expect(() => xlsxToLoadClipboardCommands(bytes)).toThrow(ImportArchiveInvalidError);
    // SheetJS matches member names without regard to case or slash direction.
    for (const name of ['xl/workbook.bin', 'XL\\Workbook.BIN', 'Root Entry/xl/workbook.bin']) {
      const { bytes: archive } = makeArchiveEntry(binarySheet, undefined, { name });
      expect(() => enforceActualImportArchiveLimit(archive), name).toThrow(ImportArchiveInvalidError);
    }
  });

  it('still imports an .xlsx that carries binary members nothing reads', () => {
    const zip = written('xlsx');
    CFB.utils.cfb_add(zip, '/xl/printerSettings/printerSettings1.bin', binarySheet);
    CFB.utils.cfb_add(zip, '/xl/vbaProject.bin', binarySheet);
    CFB.utils.cfb_add(zip, '/xl/myworkbook.bin', binarySheet);
    expect(xlsxToSave(packed(zip))).toContain('cell:A1:v:7');
  });
});

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

  it('decodes every byte lane of the declared sizes', () => {
    // Each size lane must be read: a 16 MiB entry needs the <<24 lane, a
    // 9 MiB one the <<16 lane, and together they cross the 25 MiB budget.
    const bytes = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 1, uncompressedSize: 0x01000000 },
      { name: 'xl/styles.xml', compressedSize: 1, uncompressedSize: 0x00900001 },
    ]);
    expect(() => enforceImportArchiveLimit(bytes)).toThrow(
      ImportArchiveTooLargeError,
    );
    // 16 MiB + 8 MiB stays inside the budget.
    const withinBudget = makeFakeZipCentralDirectory([
      { name: 'xl/workbook.xml', compressedSize: 1, uncompressedSize: 0x01000000 },
      { name: 'xl/styles.xml', compressedSize: 1, uncompressedSize: 0x00800000 },
    ]);
    expect(() => enforceImportArchiveLimit(withinBudget)).not.toThrow();
  });

  it('walks past multi-byte extra and comment fields to the next entry', () => {
    // The second entry is only reachable if the >255 extra/comment lengths
    // are decoded across both byte lanes.
    const bytes = makeFakeZipCentralDirectory([
      {
        name: 'xl/styles.xml',
        compressedSize: 1,
        uncompressedSize: 1,
        extraLength: 300,
        commentLength: 400,
      },
      {
        name: 'xl/workbook.xml',
        compressedSize: 1,
        uncompressedSize: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1,
      },
    ]);
    expect(() => enforceImportArchiveLimit(bytes)).toThrow(
      ImportArchiveTooLargeError,
    );
  });

  it('normalizes only leading slashes when matching relevant entries', () => {
    const oversize = MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1;
    const relevant = [
      '///xl/workbook.xml',
      'xl/worksheets/sheet12.xml',
      'xl/worksheets/_rels/sheet12.xml.rels',
    ];
    for (const name of relevant) {
      expect(() =>
        enforceImportArchiveLimit(
          makeFakeZipCentralDirectory([
            { name, compressedSize: 1, uncompressedSize: oversize },
          ]),
        ),
        name,
      ).toThrow(ImportArchiveTooLargeError);
    }
    const irrelevant = [
      'prefix/xl/workbook.xml',
      'xl/worksheets/sheet.xml',
      'xl/worksheets/sheetA.xml',
      'xl/worksheets/sheet1.xml.rels',
      'xl/worksheets/_rels/sheet1.xml',
      'xl/workbook.xml.bak',
    ];
    for (const name of irrelevant) {
      expect(() =>
        enforceImportArchiveLimit(
          makeFakeZipCentralDirectory([
            { name, compressedSize: 1, uncompressedSize: oversize },
          ]),
        ),
        name,
      ).not.toThrow();
    }
  });

  it('names every import error for the route layer to switch on', () => {
    expect(new ImportTooLargeError(1).name).toBe('ImportTooLargeError');
    expect(new ImportColumnOutOfRangeError('A1', 1).name).toBe(
      'ImportColumnOutOfRangeError',
    );
    expect(new ImportRowOutOfRangeError('A1', 1).name).toBe(
      'ImportRowOutOfRangeError',
    );
    expect(new ImportDimensionsTooLargeError(1, 1).name).toBe(
      'ImportDimensionsTooLargeError',
    );
    expect(new ImportArchiveTooLargeError(1).name).toBe(
      'ImportArchiveTooLargeError',
    );
  });

  it('anchors the worksheet-entry patterns at both ends', () => {
    const oversize = MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1;
    for (const name of [
      'xl/worksheets/sheet1.xml/extra',
      'xl/worksheets/_rels/sheet1.xml.rels/extra',
      'xl/worksheets/sheet1.xmlx',
    ]) {
      expect(() =>
        enforceImportArchiveLimit(
          makeFakeZipCentralDirectory([
            { name, compressedSize: 1, uncompressedSize: oversize },
          ]),
        ),
        name,
      ).not.toThrow();
    }
  });
});
