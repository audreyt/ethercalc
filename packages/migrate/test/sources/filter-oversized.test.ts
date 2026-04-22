/**
 * Direct unit tests for the shared oversized-entry filter. Exercises
 * boundary behaviour (inclusive vs exclusive limit) + callback payload
 * shape so Stryker boundary mutants (`>` → `>=`, `>=` → `>`) can't
 * survive, and the error-message literal survives StringLiteral flips.
 */
import { describe, it, expect, vi } from 'vitest';

import {
  filterOversized,
  type OversizedCallback,
} from '../../src/sources/filter-oversized.ts';

describe('filterOversized — boundary behaviour', () => {
  it('keeps entries exactly equal to the limit (boundary is exclusive on the upper side)', () => {
    // A 10-byte entry at max=10 MUST survive; a 11-byte one must drop.
    const out = filterOversized(['a'.repeat(10)], 'log', 'room', 10);
    expect(out).toEqual(['a'.repeat(10)]);
  });

  it('drops entries strictly larger than the limit', () => {
    const out = filterOversized(['a'.repeat(11)], 'log', 'room', 10);
    expect(out).toEqual([]);
  });

  it('keeps zero-length entries (byte count 0 < any positive max)', () => {
    const out = filterOversized(['', 'keep'], 'audit', 'room', 4);
    expect(out).toEqual(['', 'keep']);
  });
});

describe('filterOversized — callback payload', () => {
  it('fires the callback once per dropped entry with (room, kind, index, bytes)', () => {
    const cb = vi.fn<OversizedCallback>();
    filterOversized(
      ['ok', 'x'.repeat(20), 'y'.repeat(15), 'also-ok'],
      'audit',
      'room-42',
      10,
      cb,
    );
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenNthCalledWith(1, {
      room: 'room-42',
      kind: 'audit',
      index: 1,
      bytes: 20,
    });
    expect(cb).toHaveBeenNthCalledWith(2, {
      room: 'room-42',
      kind: 'audit',
      index: 2,
      bytes: 15,
    });
  });

  it('omits the callback cleanly when not supplied', () => {
    expect(() => filterOversized(['x'.repeat(20)], 'log', 'r', 10)).not.toThrow();
    // Result is the filtered array (no survivors here).
    expect(filterOversized(['x'.repeat(20)], 'log', 'r', 10)).toEqual([]);
  });
});

describe('filterOversized — UTF-8 byte counting', () => {
  it('counts multi-byte characters correctly (not string length)', () => {
    // `é` is 2 UTF-8 bytes; 6 chars = 12 bytes.
    const multibyte = 'éééééé';
    expect(Buffer.byteLength(multibyte, 'utf8')).toBe(12);
    // At max=11 it should drop; at max=12 it should keep.
    expect(filterOversized([multibyte], 'chat', 'r', 11)).toEqual([]);
    expect(filterOversized([multibyte], 'chat', 'r', 12)).toEqual([multibyte]);
  });
});
