import { describe, it, expect } from 'vitest';

import {
  STORAGE_KEYS,
  SEQ_PAD_WIDTH,
  padSeq,
  logKey,
  auditKey,
  chatKey,
  ecellKey,
} from '../src/storage-keys.ts';

describe('STORAGE_KEYS', () => {
  it('exposes every key pattern from CLAUDE.md §3.3', () => {
    expect(STORAGE_KEYS).toEqual({
      snapshot: 'snapshot',
      metaUpdatedAt: 'meta:updated_at',
      logPrefix: 'log:',
      auditPrefix: 'audit:',
      chatPrefix: 'chat:',
      ecellPrefix: 'ecell:',
    });
  });
});

describe('padSeq', () => {
  it('pads to 16 digits', () => {
    expect(padSeq(0)).toBe('0000000000000000');
    expect(padSeq(1)).toBe('0000000000000001');
    expect(padSeq(12345)).toBe('0000000000012345');
    expect(padSeq(0)).toHaveLength(SEQ_PAD_WIDTH);
  });

  it('preserves lexicographic ordering for small numbers', () => {
    const ordered = [3, 1, 20, 2, 10].map(padSeq);
    expect([...ordered].sort()).toEqual([1, 2, 3, 10, 20].map(padSeq));
  });

  it('rejects negative integers', () => {
    expect(() => padSeq(-1)).toThrow(RangeError);
  });

  it('rejects non-integers', () => {
    expect(() => padSeq(1.5)).toThrow(RangeError);
    expect(() => padSeq(Number.NaN)).toThrow(RangeError);
  });
});

describe('logKey / auditKey / chatKey', () => {
  it('prefix the padded sequence', () => {
    expect(logKey(5)).toBe('log:0000000000000005');
    expect(auditKey(0)).toBe('audit:0000000000000000');
    expect(chatKey(999)).toBe('chat:0000000000000999');
  });
});

describe('ecellKey', () => {
  it('prefixes the user id', () => {
    expect(ecellKey('alice')).toBe('ecell:alice');
  });

  it('rejects empty user', () => {
    expect(() => ecellKey('')).toThrow(RangeError);
  });
});
