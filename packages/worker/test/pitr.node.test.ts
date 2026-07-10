import { describe, expect, it } from 'vitest';

import {
  bookmarkStorage,
  isPitrUnavailableError,
  parsePitrRequest,
} from '../src/lib/pitr.ts';

/**
 * Pure-logic tests for the point-in-time-recovery (PITR) request parser
 * and the bookmark-capability feature detection. The DO handler branches
 * are covered in room.node.test.ts; the route glue in
 * routes-rooms-pitr.node.test.ts.
 */

describe('parsePitrRequest', () => {
  it.each([null, 'x', 42, true, [1]])('rejects non-object body %j', (body) => {
    const out = parsePitrRequest(body);
    expect(out).toEqual({ ok: false, error: 'body must be a JSON object' });
  });

  it('rejects an empty object (neither bookmark nor at)', () => {
    const out = parsePitrRequest({});
    expect(out).toEqual({
      ok: false,
      error: 'send exactly one of {bookmark} or {at}',
    });
  });

  it('rejects bookmark and at together', () => {
    const out = parsePitrRequest({ bookmark: 'b', at: 5 });
    expect(out).toEqual({
      ok: false,
      error: 'send exactly one of {bookmark} or {at}',
    });
  });

  it('accepts a bookmark string; dryRun defaults to false', () => {
    const out = parsePitrRequest({ bookmark: 'bm-1' });
    expect(out).toEqual({ ok: true, value: { bookmark: 'bm-1', dryRun: false } });
  });

  it('rejects an empty bookmark', () => {
    const out = parsePitrRequest({ bookmark: '' });
    expect(out).toEqual({
      ok: false,
      error: 'bookmark must be a non-empty string',
    });
  });

  it('rejects a non-string bookmark', () => {
    const out = parsePitrRequest({ bookmark: 42 });
    expect(out).toEqual({
      ok: false,
      error: 'bookmark must be a non-empty string',
    });
  });

  it('accepts a ms-epoch number for at', () => {
    const out = parsePitrRequest({ at: 1720576800000 });
    expect(out).toEqual({ ok: true, value: { at: 1720576800000, dryRun: false } });
  });

  it('accepts an ISO-8601 string for at and normalizes to ms', () => {
    const out = parsePitrRequest({ at: '2026-07-10T00:00:00.000Z' });
    expect(out).toEqual({
      ok: true,
      value: { at: Date.parse('2026-07-10T00:00:00.000Z'), dryRun: false },
    });
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects non-positive / non-finite at %j',
    (at) => {
      const out = parsePitrRequest({ at });
      expect(out).toEqual({
        ok: false,
        error: 'at must be a ms-epoch number or ISO-8601 string',
      });
    },
  );

  it('rejects an unparseable at string', () => {
    const out = parsePitrRequest({ at: 'not-a-date' });
    expect(out).toEqual({
      ok: false,
      error: 'at must be a ms-epoch number or ISO-8601 string',
    });
  });

  it('rejects a boolean at (unsupported type)', () => {
    const out = parsePitrRequest({ at: true });
    expect(out).toEqual({
      ok: false,
      error: 'at must be a ms-epoch number or ISO-8601 string',
    });
  });

  it('accepts dryRun true', () => {
    const out = parsePitrRequest({ at: 5, dryRun: true });
    expect(out).toEqual({ ok: true, value: { at: 5, dryRun: true } });
  });

  it('accepts explicit dryRun false', () => {
    const out = parsePitrRequest({ bookmark: 'b', dryRun: false });
    expect(out).toEqual({ ok: true, value: { bookmark: 'b', dryRun: false } });
  });

  it('rejects a non-boolean dryRun', () => {
    const out = parsePitrRequest({ bookmark: 'b', dryRun: 'yes' });
    expect(out).toEqual({ ok: false, error: 'dryRun must be a boolean' });
  });
});

describe('bookmarkStorage', () => {
  const getBookmarkForTime = async (): Promise<string> => 'b';
  const onNextSessionRestoreBookmark = async (): Promise<string> => 'u';

  it('returns the storage when both bookmark methods exist', () => {
    const storage = { getBookmarkForTime, onNextSessionRestoreBookmark };
    expect(bookmarkStorage(storage)).toBe(storage);
  });

  it('returns null when getBookmarkForTime is missing', () => {
    expect(bookmarkStorage({ onNextSessionRestoreBookmark })).toBeNull();
  });

  it('returns null when onNextSessionRestoreBookmark is missing', () => {
    expect(bookmarkStorage({ getBookmarkForTime })).toBeNull();
  });

  it('returns null for empty objects, null, and primitives', () => {
    expect(bookmarkStorage({})).toBeNull();
    expect(bookmarkStorage(null)).toBeNull();
    expect(bookmarkStorage('storage')).toBeNull();
  });
});

describe('isPitrUnavailableError', () => {
  it('recognizes the exact local-workerd unsupported error', () => {
    expect(
      isPitrUnavailableError(
        new Error(
          "This Durable Object's storage back-end does not implement point-in-time recovery.",
        ),
      ),
    ).toBe(true);
  });

  it('does not misclassify bookmark errors or non-errors as unavailable', () => {
    expect(isPitrUnavailableError(new Error('expired bookmark'))).toBe(false);
    expect(
      isPitrUnavailableError(
        new Error(
          "This Durable Object's storage back-end does not implement point-in-time recovery. extra",
        ),
      ),
    ).toBe(false);
    expect(isPitrUnavailableError('unsupported')).toBe(false);
    expect(isPitrUnavailableError(null)).toBe(false);
  });
});
