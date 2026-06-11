import { describe, it, expect } from 'vitest';

import {
  encodeCSV,
  encodeCSVField,
  neutralizeCSVDocument,
  neutralizeCSVFormula,
} from '../src/lib/csv-encode.ts';
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

describe('neutralizeCSVFormula', () => {
  it('prefixes formula-trigger leading characters with a quote', () => {
    expect(neutralizeCSVFormula('=1+1')).toBe("'=1+1");
    expect(neutralizeCSVFormula('+cmd')).toBe("'+cmd");
    expect(neutralizeCSVFormula('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(neutralizeCSVFormula('=HYPERLINK("http://x","go")')).toBe(
      '\'=HYPERLINK("http://x","go")',
    );
    expect(neutralizeCSVFormula('\t=evil')).toBe("'\t=evil");
    expect(neutralizeCSVFormula('\r=evil')).toBe("'\r=evil");
  });

  it('leaves plain numbers (including signed/scientific) untouched', () => {
    expect(neutralizeCSVFormula('-5')).toBe('-5');
    expect(neutralizeCSVFormula('+3.14')).toBe('+3.14');
    expect(neutralizeCSVFormula('-1e9')).toBe('-1e9');
    expect(neutralizeCSVFormula('.5')).toBe('.5');
    expect(neutralizeCSVFormula('42')).toBe('42');
  });

  it('leaves ordinary text untouched', () => {
    expect(neutralizeCSVFormula('hello')).toBe('hello');
    expect(neutralizeCSVFormula('')).toBe('');
    expect(neutralizeCSVFormula('a=b')).toBe('a=b');
  });
});

describe('neutralizeCSVDocument', () => {
  it('round-trips benign documents byte-for-byte', () => {
    expect(neutralizeCSVDocument('a,b\n1,2\n')).toBe('a,b\n1,2\n');
    expect(neutralizeCSVDocument('')).toBe('');
  });

  it('defangs formula cells while preserving structure + numbers', () => {
    expect(neutralizeCSVDocument('=1+1,-5\n@foo,bar\n')).toBe(
      "'=1+1,-5\n'@foo,bar\n",
    );
  });

  it('quotes a defanged field that also needs CSV quoting', () => {
    // A single quoted field whose content is `=A,B`: leading `=` triggers
    // neutralization, and the embedded comma then forces RFC-4180 quoting of
    // the now-`'=`-prefixed value.
    expect(neutralizeCSVDocument('"=A,B"\n')).toBe("\"'=A,B\"\n");
  });
});
