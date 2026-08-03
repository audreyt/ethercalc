import { describe, expect, it } from 'vite-plus/test';
import {
  isSafeMultiSheetLink,
  MAX_MULTI_SHEET_LINK_LENGTH,
  MAX_MULTI_SHEET_TITLE_LENGTH,
  MAX_MULTI_SHEETS,
} from '../src/multi.ts';

describe('multi-sheet trust policy', () => {
  it('publishes finite workbook and TOC limits', () => {
    expect(MAX_MULTI_SHEETS).toBe(256);
    expect(MAX_MULTI_SHEET_TITLE_LENGTH).toBe(256);
    expect(MAX_MULTI_SHEET_LINK_LENGTH).toBe(2_048);
  });

  it.each(['/room.1', '/caf%C3%A9', '/$&room', '/raw-unicode-東京'])(
    'accepts a same-origin single room segment: %s',
    (link) => {
      expect(isSafeMultiSheetLink(link)).toBe(true);
    },
  );

  it.each([
    '',
    '/',
    'room',
    '//evil.example',
    '/room/child',
    '/%',
    '/.',
    '/..',
    '/%2e%2e',
    '/room%2fchild',
    '/room%5cchild',
    '/room?x',
    '/room#x',
    '/room%22x',
    '/room!A1',
    '/room%0ax',
    '/room%7fx',
  ])('rejects a cross-boundary or malformed link: %s', (link) => {
    expect(isSafeMultiSheetLink(link)).toBe(false);
  });

  it('rejects a link beyond the bounded TOC cell length', () => {
    expect(isSafeMultiSheetLink('/' + 'a'.repeat(MAX_MULTI_SHEET_LINK_LENGTH))).toBe(false);
  });

  it('accepts the shortest and the exactly-capped link', () => {
    // Two chars is the shortest well-formed `/room` path.
    expect(isSafeMultiSheetLink('/a')).toBe(true);
    expect(
      isSafeMultiSheetLink('/' + 'a'.repeat(MAX_MULTI_SHEET_LINK_LENGTH - 1)),
    ).toBe(true);
  });
});
