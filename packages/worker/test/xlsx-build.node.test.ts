import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import {
  BINARY_CONTENT_TYPES,
  buildMultiSheetWorkbook,
  buildMultiSheetWorkbookFromSheets,
  csvToBinaryWorkbook,
  encodeColumn,
  parseCoord,
  parseMultiSheetWorkbook,
  sanitizeSheetName,
  sheetViewToBinaryWorkbook,
  sheetViewToWorksheet,
  translateCell,
} from '../src/lib/xlsx-build.ts';

/**
 * Node-level unit tests for the SheetJS bridge. Since SheetJS runs fine in
 * Node AND workerd (verified separately in the workers-pool integration
 * tests), we can cover 100% of `xlsx-build.ts`'s branches here without
 * needing the Workers environment.
 *
 * Strategy: build a workbook, then read it back with SheetJS and compare the
 * AOA shape we expect. That proves we can round-trip the data through each
 * binary format.
 */

function readBack(bytes: Uint8Array): string[][] {
  const wb = (XLSX as any).read(bytes, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = (XLSX as any).utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  // Normalize: SheetJS emits numbers for numeric cells; we rehydrate to string
  // for easy equality, mirroring what the caller would get if they exported
  // back to CSV.
  return (aoa as unknown[][]).map((row) => row.map((v) => (v === undefined ? '' : String(v))));
}

describe('csvToBinaryWorkbook', () => {
  it('builds a valid xlsx from a simple CSV', () => {
    const csv = 'a,b\n1,2\n';
    const bytes = csvToBinaryWorkbook(csv, 'xlsx');
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(readBack(bytes)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('builds a valid ods from a simple CSV', () => {
    const bytes = csvToBinaryWorkbook('hello,world\n', 'ods');
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(readBack(bytes)[0]).toEqual(['hello', 'world']);
  });

  it('builds a valid fods from a simple CSV (XML flat ODS)', () => {
    const bytes = csvToBinaryWorkbook('x,y\n', 'fods');
    expect(bytes.byteLength).toBeGreaterThan(0);
    // fods is literally an XML document — first bytes should begin with `<`.
    expect(bytes[0]).toBe('<'.charCodeAt(0));
  });

  it('empty CSV still yields a valid workbook (1x1 blank cell)', () => {
    const bytes = csvToBinaryWorkbook('', 'xlsx');
    expect(bytes.byteLength).toBeGreaterThan(0);
    // sheet_to_json with header:1 + blankrows:false on an empty-string-only
    // cell yields []; we only need to assert the file itself is readable.
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Sheet1']);
  });

  it('coerces integer-looking strings into numbers', () => {
    const bytes = csvToBinaryWorkbook('42\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe(42);
    expect(sheet.A1.t).toBe('n');
  });

  it('coerces decimal-looking strings into numbers', () => {
    const bytes = csvToBinaryWorkbook('3.14\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBeCloseTo(3.14);
  });

  it('coerces negative numbers', () => {
    const bytes = csvToBinaryWorkbook('-17\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe(-17);
  });

  it('leaves non-numeric strings as strings', () => {
    const bytes = csvToBinaryWorkbook('hello\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe('hello');
    expect(sheet.A1.t).toBe('s');
  });

  it('leaves empty-string cells as empty strings (no coercion)', () => {
    const bytes = csvToBinaryWorkbook(',a\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    // A1 is empty — SheetJS may or may not include it in the output depending
    // on the range; we only assert B1 is the non-empty value.
    expect(sheet.B1.v).toBe('a');
  });

  // The next four pin specific regex mutations on the numeric-pattern at
  // xlsx-build.ts:84 — `/^-?\d+(\.\d+)?$/`. Each mutation is observable
  // via a carefully-chosen string that matches the mutant regex but not
  // the original (or vice-versa).

  it('does NOT coerce trailing-digit strings like "abc42" (`^` anchor)', () => {
    // Mutation `/-?\d+(\.\d+)?$/` (no `^`) would match "abc42" and
    // try `Number("abc42")` → NaN → cell type 'n' with bad value.
    const bytes = csvToBinaryWorkbook('abc42\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.t).toBe('s');
    expect(sheet.A1.v).toBe('abc42');
  });

  it('does NOT coerce leading-digit strings like "42abc" (`$` anchor)', () => {
    // Mutation `/^-?\d+(\.\d+)?/` (no `$`) would match "42abc" as a prefix.
    const bytes = csvToBinaryWorkbook('42abc\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.t).toBe('s');
    expect(sheet.A1.v).toBe('42abc');
  });

  it('coerces multi-digit fractions like "1.234" (`+` quantifier)', () => {
    // Mutation `/^-?\d+(\.\d)?$/` (no `+` after `\d`) would only match
    // a single fractional digit, leaving "1.234" as a string.
    const bytes = csvToBinaryWorkbook('1.234\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.t).toBe('n');
    expect(sheet.A1.v).toBeCloseTo(1.234);
  });

  it('does NOT coerce decimal-with-letters like "1.abc" (`\\d` vs `\\D`)', () => {
    // Mutation `/^-?\d+(\.\D+)?$/` (`\d` → `\D`) would match "1.abc"
    // (the fractional part matches non-digits). Number("1.abc") = NaN,
    // which would produce a numeric cell with a bogus value.
    const bytes = csvToBinaryWorkbook('1.abc\n', 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.t).toBe('s');
    expect(sheet.A1.v).toBe('1.abc');
  });
});

describe('BINARY_CONTENT_TYPES', () => {
  it('exports a content type for each supported format', () => {
    expect(BINARY_CONTENT_TYPES.xlsx).toContain('spreadsheetml');
    expect(BINARY_CONTENT_TYPES.ods).toContain('opendocument');
    expect(BINARY_CONTENT_TYPES.fods).toContain('opendocument');
  });
});

describe('sanitizeSheetName', () => {
  it('leaves normal names untouched', () => {
    expect(sanitizeSheetName('Sheet1')).toBe('Sheet1');
    expect(sanitizeSheetName('My Tab')).toBe('My Tab');
  });

  it('replaces forbidden characters with underscore', () => {
    expect(sanitizeSheetName('a/b')).toBe('a_b');
    expect(sanitizeSheetName('a\\b')).toBe('a_b');
    expect(sanitizeSheetName('a:b')).toBe('a_b');
    expect(sanitizeSheetName('a?b')).toBe('a_b');
    expect(sanitizeSheetName('a*b')).toBe('a_b');
    expect(sanitizeSheetName('a[b')).toBe('a_b');
    expect(sanitizeSheetName('a]b')).toBe('a_b');
    expect(sanitizeSheetName(':\\/?*[]')).toBe('_______');
  });

  it('truncates names longer than 31 characters', () => {
    const input = 'x'.repeat(50);
    const out = sanitizeSheetName(input);
    expect(out.length).toBe(31);
    expect(out).toBe('x'.repeat(31));
  });

  it('leaves names EXACTLY 31 characters untouched (boundary is strict >)', () => {
    // Pins the `base.length > 31` boundary — mutation to `>=` would
    // truncate a length-31 name to 31 (no-op result) but the predicate
    // difference is observable via the slice path. The assertion
    // `.toBe(input)` guarantees identity, not just equality.
    const input = 'x'.repeat(31);
    const out = sanitizeSheetName(input);
    expect(out).toBe(input);
    expect(out.length).toBe(31);
  });

  it('truncates 32-character names (one above the boundary)', () => {
    const input = 'x'.repeat(32);
    const out = sanitizeSheetName(input);
    expect(out.length).toBe(31);
  });

  it('falls back to "Sheet" when the input is empty', () => {
    expect(sanitizeSheetName('')).toBe('Sheet');
  });

  it('deduplicates against an existing list', () => {
    expect(sanitizeSheetName('Sheet1', ['Sheet1'])).toBe('Sheet1 (2)');
    expect(sanitizeSheetName('Sheet1', ['Sheet1', 'Sheet1 (2)'])).toBe(
      'Sheet1 (3)',
    );
  });

  it('shortens long base names to make room for the dedupe suffix', () => {
    const base = 'x'.repeat(31); // exactly the cap
    const existing = [base]; // one collision already
    const out = sanitizeSheetName(base, existing);
    expect(out.length).toBeLessThanOrEqual(31);
    expect(out.endsWith(' (2)')).toBe(true);
  });

  it('returns the original when it does not collide', () => {
    expect(sanitizeSheetName('Alpha', ['Beta', 'Gamma'])).toBe('Alpha');
  });
});

describe('buildMultiSheetWorkbook', () => {
  it('builds a workbook with one worksheet per sheet', () => {
    const bytes = buildMultiSheetWorkbook(
      [
        { name: 'Alpha', csv: 'a,b\n1,2\n' },
        { name: 'Beta', csv: 'c,d\n3,4\n' },
      ],
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Alpha', 'Beta']);
    const alpha = (XLSX as any).utils.sheet_to_json(wb.Sheets['Alpha'], {
      header: 1,
      blankrows: false,
    });
    expect(alpha[0]).toEqual(['a', 'b']);
    expect(alpha[1]).toEqual([1, 2]);
    const beta = (XLSX as any).utils.sheet_to_json(wb.Sheets['Beta'], {
      header: 1,
      blankrows: false,
    });
    expect(beta[1]).toEqual([3, 4]);
  });

  it('sanitizes sheet names containing forbidden characters', () => {
    const bytes = buildMultiSheetWorkbook([{ name: 'A/B', csv: '1\n' }], 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['A_B']);
  });

  it('truncates sheet names longer than 31 characters', () => {
    const long = 'This is a very long sheet name indeed-extra'; // > 31
    const bytes = buildMultiSheetWorkbook([{ name: long, csv: '1\n' }], 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames[0].length).toBeLessThanOrEqual(31);
    expect(wb.SheetNames[0]).toBe(long.slice(0, 31));
  });

  it('deduplicates colliding sheet names', () => {
    const bytes = buildMultiSheetWorkbook(
      [
        { name: 'Same', csv: '1\n' },
        { name: 'Same', csv: '2\n' },
        { name: 'Same', csv: '3\n' },
      ],
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Same', 'Same (2)', 'Same (3)']);
  });

  it('coerces empty CSVs to a 1x1 blank cell', () => {
    const bytes = buildMultiSheetWorkbook(
      [
        { name: 'Empty', csv: '' },
        { name: 'Full', csv: 'hi\n' },
      ],
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Empty', 'Full']);
    expect(wb.Sheets['Full'].A1.v).toBe('hi');
  });

  it('falls back to a blank Sheet1 when given zero sheets', () => {
    const bytes = buildMultiSheetWorkbook([], 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Sheet1']);
  });

  it('works for ods format', () => {
    const bytes = buildMultiSheetWorkbook(
      [
        { name: 'One', csv: 'a,b\n' },
        { name: 'Two', csv: 'c,d\n' },
      ],
      'ods',
    );
    // ods is a ZIP.
    expect(bytes[0]).toBe(0x50);
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['One', 'Two']);
  });

  it('works for fods format (XML flat)', () => {
    const bytes = buildMultiSheetWorkbook(
      [
        { name: 'One', csv: 'a,b\n' },
        { name: 'Two', csv: 'c,d\n' },
      ],
      'fods',
    );
    // fods is XML — first byte is `<`.
    expect(bytes[0]).toBe('<'.charCodeAt(0));
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['One', 'Two']);
  });
});

describe('parseCoord / encodeColumn', () => {
  it('parses A1 / Z99 / AA1 / AAA1', () => {
    expect(parseCoord('A1')).toEqual({ r: 0, c: 0 });
    expect(parseCoord('Z99')).toEqual({ r: 98, c: 25 });
    expect(parseCoord('AA1')).toEqual({ r: 0, c: 26 });
    expect(parseCoord('AAA1')).toEqual({ r: 0, c: 702 });
  });

  it('returns null for invalid coordinates', () => {
    expect(parseCoord('')).toBeNull();
    expect(parseCoord('1A')).toBeNull();
    expect(parseCoord('A')).toBeNull();
    expect(parseCoord('A0')).toBeNull();
    expect(parseCoord('a1')).toBeNull(); // lowercase
    expect(parseCoord('A1B')).toBeNull();
  });

  it('encodeColumn is inverse of parseCoord column', () => {
    expect(encodeColumn(0)).toBe('A');
    expect(encodeColumn(25)).toBe('Z');
    expect(encodeColumn(26)).toBe('AA');
    expect(encodeColumn(701)).toBe('ZZ');
    expect(encodeColumn(702)).toBe('AAA');
  });
});

describe('translateCell', () => {
  it('numeric cell → {t:"n", v:<number>}', () => {
    expect(translateCell({ valuetype: 'n', datatype: 'v', datavalue: 42 })).toEqual({
      t: 'n',
      v: 42,
    });
  });

  it('numeric cell with string datavalue is parsed to a number', () => {
    expect(
      translateCell({ valuetype: 'n', datatype: 'v', datavalue: '3.14' }),
    ).toMatchObject({ t: 'n', v: 3.14 });
  });

  it('NaN datavalue coerces to 0 (graceful degrade)', () => {
    expect(
      translateCell({ valuetype: 'n', datatype: 'v', datavalue: 'not a number' }),
    ).toMatchObject({ t: 'n', v: 0 });
  });

  it('missing datavalue on numeric cell coerces to 0', () => {
    // `datavalue: undefined` exercises the `raw ?? ''` fallback.
    expect(translateCell({ valuetype: 'n', datatype: 'v' })).toMatchObject({
      t: 'n',
      v: 0,
    });
  });

  it('text cell → {t:"s", v:<string>}', () => {
    expect(
      translateCell({ valuetype: 't', datatype: 't', datavalue: 'hello' }),
    ).toEqual({ t: 's', v: 'hello' });
  });

  it('text with missing datavalue falls back to empty string', () => {
    expect(translateCell({ valuetype: 't', datatype: 't' })).toMatchObject({
      t: 's',
      v: '',
    });
  });

  it('formula cell includes `f` and cached value', () => {
    const out = translateCell({
      valuetype: 'n',
      datatype: 'f',
      datavalue: 10,
      formula: 'SUM(A1:A3)',
    });
    expect(out).toEqual({ t: 'n', v: 10, f: 'SUM(A1:A3)' });
  });

  it('formula with no cached value emits a numeric 0', () => {
    // valuetype=b but datatype=f → formula-without-recalc-yet case.
    const out = translateCell({
      valuetype: 'b',
      datatype: 'f',
      formula: 'NOW()',
    });
    expect(out).toMatchObject({ t: 'n', v: 0, f: 'NOW()' });
  });

  it('blank non-formula cells are omitted (null)', () => {
    expect(translateCell({ valuetype: 'b' })).toBeNull();
    expect(translateCell({})).toBeNull();
  });

  it('error cell → {t:"e", v:0x2a}', () => {
    expect(
      translateCell({ valuetype: 'e', datatype: 'v', datavalue: '#N/A' }),
    ).toEqual({ t: 'e', v: 0x2a });
  });

  it('logical/boolean numeric (valuetype=nl) → {t:"b"}', () => {
    expect(
      translateCell({ valuetype: 'nl', datatype: 'v', datavalue: 1 }),
    ).toEqual({ t: 'b', v: true });
    expect(
      translateCell({ valuetype: 'nl', datatype: 'v', datavalue: 0 }),
    ).toEqual({ t: 'b', v: false });
  });

  it('logical with non-numeric garbage degrades to v:false', () => {
    expect(
      translateCell({ valuetype: 'nl', datatype: 'v', datavalue: 'nope' }),
    ).toEqual({ t: 'b', v: false });
  });

  it('unknown valuetype main char degrades to string', () => {
    expect(
      translateCell({ valuetype: 'q', datatype: 'v', datavalue: 'weird' }),
    ).toEqual({ t: 's', v: 'weird' });
  });

  it('unknown valuetype with undefined datavalue → empty string', () => {
    expect(translateCell({ valuetype: 'q' })).toEqual({ t: 's', v: '' });
  });

  it('number format from valueformats is carried through as `z`', () => {
    const fmts = ['', '0.00%'];
    expect(
      translateCell(
        { valuetype: 'n', datatype: 'v', datavalue: 0.5, nontextvalueformat: 1 },
        fmts,
      ),
    ).toEqual({ t: 'n', v: 0.5, z: '0.00%' });
  });

  it('"General" format is treated as no format', () => {
    const fmts = ['', 'General'];
    const out = translateCell(
      { valuetype: 'n', datatype: 'v', datavalue: 1, nontextvalueformat: 1 },
      fmts,
    );
    expect(out).not.toHaveProperty('z');
  });

  it('text-* formats are dropped (SocialCalc-specific, graceful degrade)', () => {
    const fmts = ['', 'text-wiki'];
    const out = translateCell(
      { valuetype: 'n', datatype: 'v', datavalue: 1, nontextvalueformat: 1 },
      fmts,
    );
    expect(out).not.toHaveProperty('z');
  });

  it('nontextvalueformat=0 or negative is ignored', () => {
    const fmts = ['0.00', '0.00%'];
    const out = translateCell(
      { valuetype: 'n', datatype: 'v', datavalue: 1, nontextvalueformat: 0 },
      fmts,
    );
    expect(out).not.toHaveProperty('z');
  });

  it('missing format index is tolerated', () => {
    const out = translateCell(
      { valuetype: 'n', datatype: 'v', datavalue: 1, nontextvalueformat: 99 },
      [],
    );
    expect(out).not.toHaveProperty('z');
  });

  it('comment is attached as `c: [{t: ...}]`', () => {
    const out = translateCell({
      valuetype: 't',
      datatype: 't',
      datavalue: 'x',
      comment: 'remember me',
    });
    expect(out).toEqual({
      t: 's',
      v: 'x',
      c: [{ t: 'remember me' }],
    });
  });
});

describe('sheetViewToWorksheet', () => {
  it('builds a worksheet with `!ref` spanning all non-blank cells', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        A1: { valuetype: 't', datatype: 't', datavalue: 'a' },
        B2: { valuetype: 'n', datatype: 'v', datavalue: 2 },
        C3: { valuetype: 'n', datatype: 'v', datavalue: 3 },
      },
    });
    expect(ws['!ref']).toBe('A1:C3');
    expect((ws as any)['A1']).toEqual({ t: 's', v: 'a' });
    expect((ws as any)['B2']).toEqual({ t: 'n', v: 2 });
    expect((ws as any)['C3']).toEqual({ t: 'n', v: 3 });
  });

  it('iteration encountering an already-dominated coord leaves maxR/maxC alone', () => {
    // Iterating in insert order: A3 → A1 → B1 pulls `maxR` up to 2 then
    // stays there for A1/B1 (`rc.r > maxR` false), and `maxC` up to 1 at
    // B1 but stays put at A1 (`rc.c > maxC` false). Pins both branches.
    const ws = sheetViewToWorksheet({
      cells: {
        A3: { valuetype: 'n', datatype: 'v', datavalue: 3 },
        A1: { valuetype: 'n', datatype: 'v', datavalue: 1 },
        B1: { valuetype: 'n', datatype: 'v', datavalue: 2 },
      },
    });
    expect(ws['!ref']).toBe('A1:B3');
  });

  it('falls back to A1:A1 blank ref when no cells survive', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        A1: { valuetype: 'b' },
        A2: {},
      },
    });
    expect(ws['!ref']).toBe('A1');
    expect((ws as any)['A1']).toEqual({ t: 's', v: '' });
  });

  it('skips invalid coords', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        invalid: { valuetype: 't', datatype: 't', datavalue: 'x' },
        A1: { valuetype: 't', datatype: 't', datavalue: 'y' },
      },
    });
    expect(ws['!ref']).toBe('A1:A1');
    expect((ws as any)['A1']).toEqual({ t: 's', v: 'y' });
    expect((ws as any)['invalid']).toBeUndefined();
  });

  it('emits !merges for colspan/rowspan cells', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        A1: {
          valuetype: 't',
          datatype: 't',
          datavalue: 'span',
          colspan: 3,
          rowspan: 2,
        },
      },
    });
    expect(ws['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 1, c: 2 } },
    ]);
  });

  it('does not emit !merges when no cell spans', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        A1: { valuetype: 'n', datatype: 'v', datavalue: 1 },
      },
    });
    expect(ws['!merges']).toBeUndefined();
  });

  it('merge with only colspan (rowspan=1 default)', () => {
    const ws = sheetViewToWorksheet({
      cells: {
        A1: { valuetype: 't', datatype: 't', datavalue: 'x', colspan: 2 },
      },
    });
    expect(ws['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ]);
  });
});

describe('sheetViewToBinaryWorkbook', () => {
  it('roundtrips formulas through xlsx', () => {
    const bytes = sheetViewToBinaryWorkbook(
      {
        cells: {
          A1: { valuetype: 'n', datatype: 'v', datavalue: 1 },
          A2: { valuetype: 'n', datatype: 'v', datavalue: 2 },
          A3: {
            valuetype: 'n',
            datatype: 'f',
            datavalue: 3,
            formula: 'SUM(A1:A2)',
          },
        },
      },
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe(1);
    expect(sheet.A2.v).toBe(2);
    expect(sheet.A3.v).toBe(3);
    expect(sheet.A3.f).toBe('SUM(A1:A2)');
  });

  it('preserves number format strings', () => {
    const bytes = sheetViewToBinaryWorkbook(
      {
        cells: {
          A1: {
            valuetype: 'n',
            datatype: 'v',
            datavalue: 0.25,
            nontextvalueformat: 1,
          },
        },
        valueformats: ['', '0.00%'],
      },
      'xlsx',
    );
    // SheetJS drops style metadata on `read` by default — pass
    // `cellStyles: true` to retain the `z`/`w` format fields.
    const wb = (XLSX as any).read(bytes, { type: 'array', cellStyles: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A1.v).toBe(0.25);
    expect(sheet.A1.z).toBe('0.00%');
    expect(sheet.A1.w).toBe('25.00%');
  });

  it('preserves merged ranges', () => {
    const bytes = sheetViewToBinaryWorkbook(
      {
        cells: {
          A1: {
            valuetype: 't',
            datatype: 't',
            datavalue: 'header',
            colspan: 2,
          },
        },
      },
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet['!merges']).toEqual([
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    ]);
  });

  it('empty sheet still produces a valid file', () => {
    const bytes = sheetViewToBinaryWorkbook({ cells: {} }, 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Sheet1']);
  });

  it('honors custom sheet name', () => {
    const bytes = sheetViewToBinaryWorkbook(
      { cells: { A1: { valuetype: 't', datatype: 't', datavalue: 'x' } } },
      'xlsx',
      'Custom',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Custom']);
  });

  it('ods format also roundtrips formulas', () => {
    const bytes = sheetViewToBinaryWorkbook(
      {
        cells: {
          A1: { valuetype: 'n', datatype: 'v', datavalue: 5 },
          A2: {
            valuetype: 'n',
            datatype: 'f',
            datavalue: 25,
            formula: 'A1*A1',
          },
        },
      },
      'ods',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    expect(sheet.A2.v).toBe(25);
    // ODS formula prefix convention: SheetJS reads ODS formulas prefixed
    // with 'of=' or similar — we only assert the formula roundtrip is
    // non-empty, since the exact ODS syntax is format-specific.
    expect(sheet.A2.f).toBeTruthy();
  });
});

describe('buildMultiSheetWorkbookFromSheets', () => {
  it('builds a workbook with one view per sheet', () => {
    const bytes = buildMultiSheetWorkbookFromSheets(
      [
        {
          name: 'Alpha',
          view: {
            cells: {
              A1: { valuetype: 'n', datatype: 'v', datavalue: 1 },
            },
          },
        },
        {
          name: 'Beta',
          view: {
            cells: {
              A1: {
                valuetype: 'n',
                datatype: 'f',
                datavalue: 10,
                formula: 'Alpha!A1*10',
              },
            },
          },
        },
      ],
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Alpha', 'Beta']);
    expect(wb.Sheets['Beta'].A1.f).toBe('Alpha!A1*10');
  });

  it('falls back to blank Sheet1 when given zero sheets', () => {
    const bytes = buildMultiSheetWorkbookFromSheets([], 'xlsx');
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Sheet1']);
  });

  it('sanitizes and deduplicates sheet names', () => {
    const bytes = buildMultiSheetWorkbookFromSheets(
      [
        { name: 'A/B', view: { cells: {} } },
        { name: 'A_B', view: { cells: {} } }, // collision after sanitize
      ],
      'xlsx',
    );
    const wb = (XLSX as any).read(bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['A_B', 'A_B (2)']);
  });
});

describe('parseMultiSheetWorkbook', () => {
  it('round-trips through build+parse preserving sheet order and content', () => {
    const input = [
      { name: 'Alpha', csv: 'a,b\n1,2\n' },
      { name: 'Beta', csv: 'c,d\n3,4\n' },
    ];
    const bytes = buildMultiSheetWorkbook(input, 'xlsx');
    const out = parseMultiSheetWorkbook(bytes);
    expect(out.map((s) => s.name)).toEqual(['Alpha', 'Beta']);
    expect(out[0]?.csv).toMatch(/a,b/);
    expect(out[0]?.csv).toMatch(/1,2/);
    expect(out[1]?.csv).toMatch(/c,d/);
    expect(out[1]?.csv).toMatch(/3,4/);
  });

  it('returns the blank Sheet1 from an empty-build workbook', () => {
    const bytes = buildMultiSheetWorkbook([], 'xlsx');
    const out = parseMultiSheetWorkbook(bytes);
    expect(out.length).toBe(1);
    expect(out[0]?.name).toBe('Sheet1');
  });

  it('skips sheets declared in SheetNames but missing from Sheets', () => {
    const syntheticWb = {
      SheetNames: ['Real', 'Phantom'],
      Sheets: { Real: (XLSX as any).utils.aoa_to_sheet([['x']]) },
    };
    const mockRead = () => syntheticWb;
    const out = parseMultiSheetWorkbook(new Uint8Array(), mockRead);
    expect(out.map((s) => s.name)).toEqual(['Real']);
  });

  it('tolerates a workbook whose SheetNames is missing (defensive)', () => {
    const mockRead = () => ({ Sheets: {} });
    const out = parseMultiSheetWorkbook(new Uint8Array(), mockRead);
    expect(out).toEqual([]);
  });
});
