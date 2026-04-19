import { describe, it, expect, vi } from 'vitest';

vi.mock('@ethercalc/socialcalc-headless', () => ({
  csvToSave: (csv: string) => `WRAPPED:${csv}`,
}));

import { csvToSocialCalc, decodeDoubleEncoded } from '../src/lib/csv.ts';

describe('csvToSocialCalc', () => {
  it('delegates to csvToSave', () => {
    expect(csvToSocialCalc('a,b\n1,2')).toBe('WRAPPED:a,b\n1,2');
  });
});

describe('decodeDoubleEncoded', () => {
  it('is idempotent for ASCII input', () => {
    const bytes = new TextEncoder().encode('Hello, World');
    expect(decodeDoubleEncoded(bytes)).toBe('Hello, World');
  });

  it('unwraps UTF-8 masquerading as Latin-1 (e.g. "\u00c3\u00a9" → "é")', () => {
    // "é" encoded as UTF-8 is 0xC3 0xA9. If a client mis-interpreted those
    // bytes as Latin-1 and then re-encoded them as UTF-8, we'd see the two
    // Unicode chars U+00C3 and U+00A9 in the result. The Phase 5 decoder
    // reverses that: the Latin-1 byte view restores the original two-byte
    // sequence, which a final UTF-8 decode resolves to "é".
    const doubleEncoded = new TextEncoder().encode('\u00c3\u00a9');
    expect(decodeDoubleEncoded(doubleEncoded)).toBe('é');
  });

  it('handles an empty payload', () => {
    expect(decodeDoubleEncoded(new Uint8Array())).toBe('');
  });
});
