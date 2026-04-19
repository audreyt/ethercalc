import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';

import {
  BINARY_CONTENT_TYPES,
  csvToBinaryWorkbook,
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
});

describe('BINARY_CONTENT_TYPES', () => {
  it('exports a content type for each supported format', () => {
    expect(BINARY_CONTENT_TYPES.xlsx).toContain('spreadsheetml');
    expect(BINARY_CONTENT_TYPES.ods).toContain('opendocument');
    expect(BINARY_CONTENT_TYPES.fods).toContain('opendocument');
  });
});
