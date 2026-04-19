import { describe, expect, it } from 'vitest';
import { generateSid, validateSid } from '../src/sid.ts';

describe('generateSid', () => {
  it('produces a 32-char lowercase-hex string', () => {
    const sid = generateSid();
    expect(sid).toHaveLength(32);
    expect(sid).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces distinct values on repeated calls', () => {
    const a = generateSid();
    const b = generateSid();
    expect(a).not.toBe(b);
  });

  it('always validates its own output', () => {
    for (let i = 0; i < 20; i++) {
      expect(validateSid(generateSid())).toBe(true);
    }
  });
});

describe('validateSid', () => {
  it('accepts a 32-char lowercase-hex string', () => {
    expect(validateSid('0123456789abcdef0123456789abcdef')).toBe(true);
  });

  it('rejects a too-short string', () => {
    expect(validateSid('abc')).toBe(false);
  });

  it('rejects a too-long string', () => {
    expect(validateSid('0123456789abcdef0123456789abcdef0')).toBe(false);
  });

  it('rejects uppercase hex', () => {
    expect(validateSid('0123456789ABCDEF0123456789abcdef')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(validateSid('0123456789abcdef0123456789abcdeg')).toBe(false);
  });

  it('rejects a string with a path separator', () => {
    expect(validateSid('0123456789abcdef0123456789abcd/f')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(validateSid(undefined)).toBe(false);
    expect(validateSid(null)).toBe(false);
    expect(validateSid(42)).toBe(false);
    expect(validateSid({})).toBe(false);
  });

  it('rejects the empty string', () => {
    expect(validateSid('')).toBe(false);
  });
});
