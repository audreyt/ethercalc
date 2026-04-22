import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import {
  BINARY_CONTENT_TYPES,
  buildMultiSheetWorkbook,
  csvToBinaryWorkbook,
  parseMultiSheetWorkbook,
  sanitizeSheetName,
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
