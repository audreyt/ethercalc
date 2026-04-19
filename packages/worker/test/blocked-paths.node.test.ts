import { describe, it, expect } from 'vitest';

import { buildBlockedPathResponse } from '../src/handlers/blocked-paths.ts';

describe('buildBlockedPathResponse', () => {
  it('returns 404 with empty body and html content-type (matches oracle recording)', () => {
    const r = buildBlockedPathResponse();
    expect(r).toEqual({
      status: 404,
      body: '',
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  });
});
