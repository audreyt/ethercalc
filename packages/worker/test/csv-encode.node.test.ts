import { describe, it, expect } from 'vitest';

import { encodeCSV, encodeCSVField } from '../src/lib/csv-encode.ts';
import { parseCSV } from '../src/lib/csv-parse.ts';

/**
 * Pure tests for the minimal CSV encoder. Exercises the field-level quoting
 * rules and the document-level encoder, plus a round-trip sanity check
 * against the sibling parser.
 */
describe('encodeCSVField', () => {
  it('emits plain fields verbatim', () => {
    expect(encodeCSVField('hello')).toBe('hello');
    expect(encodeCSVField('/room.1')).toBe('/room.1');
    expect(encodeCSVField('')).toBe('');
  });

  it('quotes fields containing commas', () => {
    expect(encodeCSVField('a,b')).toBe('"a,b"');
  });

  it('quotes fields containing double quotes and doubles them', () => {
    expect(encodeCSVField('he said "hi"')).toBe('"he said ""hi"""');
  });

  it('quotes fields containing LF', () => {
    expect(encodeCSVField('a\nb')).toBe('"a\nb"');
  });

  it('quotes fields containing CR', () => {
    expect(encodeCSVField('a\rb')).toBe('"a\rb"');
  });
});

describe('encodeCSV', () => {
  it('returns empty string for empty input', () => {
    expect(encodeCSV([])).toBe('');
  });

  it('emits LF-terminated rows', () => {
    expect(
      encodeCSV([
        ['a', 'b'],
        ['1', '2'],
      ]),
    ).toBe('a,b\n1,2\n');
  });

  it('quotes only the fields that need it', () => {
    expect(encodeCSV([['/room.1', 'Tab, the first']])).toBe(
      '/room.1,"Tab, the first"\n',
    );
  });

  it('round-trips through parseCSV', () => {
    const rows = [
      ['url', 'title'],
      ['/r.1', 'First'],
      ['/r.2', 'with "quotes"'],
      ['/r.3', 'with,comma'],
      ['/r.4', 'with\nnewline'],
    ];
    expect(parseCSV(encodeCSV(rows))).toEqual(rows);
  });
});
