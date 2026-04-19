import { describe, it, expect } from 'vitest';

import {
  decodeBase64,
  dispatchMatcher,
  encodeBase64,
  matchExact,
  matchIgnore,
  matchJson,
  matchHtml,
  matchOds,
  matchScsave,
  matchXlsx,
} from '../src/matchers.ts';

function b64(text: string): string {
  return encodeBase64(new TextEncoder().encode(text));
}

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('base64 helpers', () => {
  it('round-trip', () => {
    const arr = new Uint8Array([1, 2, 3, 254, 255, 0]);
    expect(decodeBase64(encodeBase64(arr))).toEqual(arr);
  });
});

describe('matchExact', () => {
  it('accepts identical byte arrays', () => {
    expect(matchExact({ expectedBase64: b64('hi'), actualBytes: bytes('hi') })).toBeNull();
  });

  it('reports a length mismatch', () => {
    const r = matchExact({ expectedBase64: b64('hi'), actualBytes: bytes('hiya') });
    expect(r).toMatch(/length differs/);
  });

  it('reports the first differing byte offset', () => {
    const r = matchExact({ expectedBase64: b64('abc'), actualBytes: bytes('abd') });
    expect(r).toMatch(/byte 2/);
  });

  it('fails if expected is null', () => {
    const r = matchExact({ expectedBase64: null, actualBytes: bytes('') });
    expect(r).toMatch(/null/);
  });
});

describe('matchJson', () => {
  it('accepts deeply-equal JSON', () => {
    expect(
      matchJson({
        expectedBase64: b64('{"a":1,"b":[2,3]}'),
        actualBytes: bytes('{"b":[2,3],"a":1}'),
      }),
    ).toBeNull();
  });

  it('rejects diverging structure', () => {
    const r = matchJson({ expectedBase64: b64('{"a":1}'), actualBytes: bytes('{"a":2}') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects arrays of differing length', () => {
    const r = matchJson({ expectedBase64: b64('[1,2]'), actualBytes: bytes('[1,2,3]') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects arrays of same length with diverging elements', () => {
    const r = matchJson({ expectedBase64: b64('[1,2,3]'), actualBytes: bytes('[1,4,3]') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects array vs non-array', () => {
    const r = matchJson({ expectedBase64: b64('[1]'), actualBytes: bytes('{"0":1}') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects object vs array', () => {
    const r = matchJson({ expectedBase64: b64('{"a":1}'), actualBytes: bytes('[1]') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects objects with missing keys', () => {
    const r = matchJson({ expectedBase64: b64('{"a":1,"b":2}'), actualBytes: bytes('{"a":1}') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects objects with swapped key presence', () => {
    const r = matchJson({ expectedBase64: b64('{"a":1}'), actualBytes: bytes('{"b":1}') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects null vs object', () => {
    const r = matchJson({ expectedBase64: b64('null'), actualBytes: bytes('{}') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects mismatched primitive types', () => {
    const r = matchJson({ expectedBase64: b64('1'), actualBytes: bytes('"1"') });
    expect(r).toMatch(/json mismatch/);
  });

  it('rejects invalid expected JSON', () => {
    const r = matchJson({ expectedBase64: b64('not json'), actualBytes: bytes('{}') });
    expect(r).toMatch(/expected body is not valid JSON/);
  });

  it('rejects invalid actual JSON', () => {
    const r = matchJson({ expectedBase64: b64('{}'), actualBytes: bytes('not json') });
    expect(r).toMatch(/actual body is not valid JSON/);
  });

  it('fails if expected is null', () => {
    const r = matchJson({ expectedBase64: null, actualBytes: bytes('{}') });
    expect(r).toMatch(/null/);
  });
});

describe('matchScsave', () => {
  it('ignores version lines and accepts equal saves after sorting', () => {
    const expected = 'version:1.5.0\nsheet:c:2\ncell:A1:v:1:f:\n';
    const actual = 'version:1.6.0\ncell:A1:v:1:f:\nsheet:c:2\n';
    expect(
      matchScsave({
        expectedBase64: b64(expected),
        actualBytes: bytes(actual),
      }),
    ).toBeNull();
  });

  it('detects a real divergence', () => {
    const expected = 'version:1.5.0\ncell:A1:v:1:f:\n';
    const actual = 'version:1.5.0\ncell:A1:v:2:f:\n';
    const r = matchScsave({
      expectedBase64: b64(expected),
      actualBytes: bytes(actual),
    });
    expect(r).toMatch(/scsave mismatch/);
  });

  it('fails if expected is null', () => {
    const r = matchScsave({ expectedBase64: null, actualBytes: bytes('') });
    expect(r).toMatch(/null/);
  });
});

describe('matchIgnore', () => {
  it('always passes', () => {
    expect(
      matchIgnore({ expectedBase64: b64('anything'), actualBytes: bytes('different') }),
    ).toBeNull();
    expect(matchIgnore({ expectedBase64: null, actualBytes: bytes('') })).toBeNull();
  });
});

describe('deferred matchers', () => {
  it('matchHtml throws (Phase 8)', () => {
    expect(() => matchHtml({ expectedBase64: b64(''), actualBytes: bytes('') })).toThrow(/Phase 8/);
  });

  it('matchXlsx throws (Phase 8)', () => {
    expect(() => matchXlsx({ expectedBase64: b64(''), actualBytes: bytes('') })).toThrow(/Phase 8/);
  });

  it('matchOds throws (Phase 8)', () => {
    expect(() => matchOds({ expectedBase64: b64(''), actualBytes: bytes('') })).toThrow(/Phase 8/);
  });
});

describe('dispatchMatcher', () => {
  it('routes by name', () => {
    expect(
      dispatchMatcher('exact', {
        expectedBase64: b64('x'),
        actualBytes: bytes('x'),
      }),
    ).toBeNull();
    expect(
      dispatchMatcher('json', {
        expectedBase64: b64('{"a":1}'),
        actualBytes: bytes('{"a":1}'),
      }),
    ).toBeNull();
    expect(dispatchMatcher('ignore', { expectedBase64: null, actualBytes: bytes('') })).toBeNull();
    expect(() =>
      dispatchMatcher('html', { expectedBase64: b64(''), actualBytes: bytes('') }),
    ).toThrow(/Phase 8/);
  });
});
