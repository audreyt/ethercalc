import { describe, it, expect } from 'vitest';

import {
  VOLATILE_HEADERS,
  diffHeaders,
  headersToRecord,
  matchHeaderValue,
  normalizeHeaders,
} from '../src/headers.ts';

describe('normalizeHeaders', () => {
  it('drops volatile headers case-insensitively', () => {
    const out = normalizeHeaders({
      Date: 'Mon, 01 Jan 2026 00:00:00 GMT',
      Server: 'test',
      'Content-Type': 'text/plain',
      ETag: '"abc"',
      'X-Powered-By': 'Express',
      Connection: 'keep-alive',
    });
    expect(out).toEqual({ 'content-type': 'text/plain' });
  });

  it('is idempotent', () => {
    const once = normalizeHeaders({ 'Content-Type': 'application/json' });
    const twice = normalizeHeaders(once);
    expect(twice).toEqual(once);
  });

  it('exposes the full volatile list for inspection', () => {
    for (const h of ['date', 'server', 'etag', 'x-powered-by', 'connection']) {
      expect(VOLATILE_HEADERS.has(h)).toBe(true);
    }
  });
});

describe('headersToRecord', () => {
  it('flattens a Headers instance into a lowercased record', () => {
    const h = new Headers({ 'Content-Type': 'text/plain', Location: '/x' });
    expect(headersToRecord(h)).toEqual({ 'content-type': 'text/plain', location: '/x' });
  });
});

describe('matchHeaderValue', () => {
  it('exact-matches strings by default', () => {
    expect(matchHeaderValue('text/plain', 'text/plain')).toBe(true);
    expect(matchHeaderValue('text/plain', 'text/html')).toBe(false);
  });

  it('treats re:-prefixed expectations as regex', () => {
    expect(matchHeaderValue('re:^/[a-z0-9]{12}$', '/abcdef012345')).toBe(true);
    expect(matchHeaderValue('re:^/[a-z0-9]{12}$', '/abcdef01234')).toBe(false);
  });

  it('fails when the actual header is missing', () => {
    expect(matchHeaderValue('text/plain', undefined)).toBe(false);
  });
});

describe('diffHeaders', () => {
  it('returns null on full match', () => {
    expect(diffHeaders({ 'content-type': 'text/plain' }, { 'content-type': 'text/plain' })).toBeNull();
  });

  it('case-insensitive on expected key', () => {
    expect(diffHeaders({ 'Content-Type': 'text/plain' }, { 'content-type': 'text/plain' })).toBeNull();
  });

  it('reports the first mismatched header with a readable message', () => {
    const err = diffHeaders(
      { 'content-type': 'text/plain' },
      { 'content-type': 'text/html' },
    );
    expect(err).toMatch(/content-type/);
    expect(err).toMatch(/text\/plain/);
    expect(err).toMatch(/text\/html/);
  });

  it('reports when an expected header is missing', () => {
    const err = diffHeaders({ location: '/x' }, {});
    expect(err).toMatch(/location/);
    expect(err).toMatch(/undefined/);
  });
});
