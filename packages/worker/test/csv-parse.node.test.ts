import { describe, it, expect } from 'vitest';

import { parseCSV } from '../src/lib/csv-parse.ts';

/**
 * Pure unit tests for the minimal CSV parser. Exercises every branch of the
 * state machine (quoted, unquoted, escape, CR/LF/CRLF, trailing row).
 */
describe('parseCSV', () => {
  it('returns empty grid for empty input', () => {
    expect(parseCSV('')).toEqual([]);
  });

  it('parses a single unterminated row', () => {
    expect(parseCSV('a,b,c')).toEqual([['a', 'b', 'c']]);
  });

  it('parses LF-terminated rows', () => {
    expect(parseCSV('a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('parses CRLF-terminated rows', () => {
    expect(parseCSV('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('parses lone CR line terminators', () => {
    expect(parseCSV('a,b\r1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles quoted fields with commas', () => {
    expect(parseCSV('"a,1","b,2"\n')).toEqual([['a,1', 'b,2']]);
  });

  it('handles quoted fields with embedded newlines', () => {
    expect(parseCSV('"a\nb",c')).toEqual([['a\nb', 'c']]);
  });

  it('handles quoted fields with CRLF inside', () => {
    expect(parseCSV('"a\r\nb",c')).toEqual([['a\r\nb', 'c']]);
  });

  it('doubles a quote inside a quoted field ("" → ")', () => {
    expect(parseCSV('"he said ""hi""",2\n')).toEqual([['he said "hi"', '2']]);
  });

  it('trailing unterminated row is emitted', () => {
    expect(parseCSV('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('does not emit a trailing empty row for LF-terminated last row', () => {
    expect(parseCSV('a\n')).toEqual([['a']]);
  });

  it('does not emit a trailing empty row for CRLF-terminated last row', () => {
    expect(parseCSV('a\r\n')).toEqual([['a']]);
  });

  it('keeps empty cells', () => {
    expect(parseCSV(',a,,b,\n')).toEqual([['', 'a', '', 'b', '']]);
  });

  it('does NOT treat a mid-field quote as opening a quoted field', () => {
    // A `"` only opens quoting when it is the first character in a field.
    expect(parseCSV('a"b,c\n')).toEqual([['a"b', 'c']]);
  });

  it('preserves a literal " that follows a closing quote (non-doubled)', () => {
    // "foo""bar" — inside the quoted field, "" doubles to " — we get foo"bar.
    expect(parseCSV('"foo""bar"\n')).toEqual([['foo"bar']]);
  });

  it('multi-row with mixed quoting and empties', () => {
    expect(parseCSV('hello,10\n,20\n,30\n')).toEqual([
      ['hello', '10'],
      ['', '20'],
      ['', '30'],
    ]);
  });

  it('trailing CRLF-unterminated content still emits row', () => {
    expect(parseCSV('a,b\r\n1,2\r\n3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});
