import { describe, it, expect } from 'vite-plus/test';

import {
  isIndexablePath,
  ROBOTS_NOINDEX,
  ROBOTS_TXT,
} from '../src/lib/robots.ts';

/**
 * Pure-logic tests for `src/lib/robots.ts`. 100% istanbul gate.
 *
 * Contract: only `/` may appear in a search
 * index. Everything else — rooms, exports, APIs — answers with
 * `X-Robots-Tag: noindex`. `robots.txt` must stay free of `Disallow`
 * so crawlers can keep observing that header (see the module comment).
 */
describe('isIndexablePath', () => {
  it('allows only the public landing page', () => {
    expect(isIndexablePath('/')).toBe(true);
  });

  it('denies rooms, exports, APIs, and operator paths', () => {
    for (const path of [
      '/_start',
      '/abcdef012345',
      '/=abcdef012345',
      '/abcdef012345.html',
      '/abcdef012345.csv',
      '/abcdef012345.xlsx',
      '/_/abcdef012345/html',
      '/_health',
      '/_rooms',
      '/_exists/abcdef012345',
      '/_auth/login-init',
      '/_migrate/seed/x',
      '/robots.txt',
      '/static/socialcalc.js',
      '/favicon.ico',
      // Prefix lookalikes of the allowlist must not slip through.
      '/_start/extra',
      '//',
      '',
    ]) {
      expect(isIndexablePath(path), path).toBe(false);
    }
  });
});

describe('ROBOTS_NOINDEX', () => {
  it('blocks indexing, following, and archiving', () => {
    expect(ROBOTS_NOINDEX).toBe('noindex, nofollow, noarchive');
  });
});

describe('ROBOTS_TXT', () => {
  it('allows crawling and never Disallows anything', () => {
    expect(ROBOTS_TXT).toMatch(/^User-agent: \*\nAllow: \//);
    // Match a directive line, not the word in the explanatory comment.
    expect(ROBOTS_TXT).not.toMatch(/^\s*Disallow\s*:/im);
    expect(ROBOTS_TXT).not.toMatch(/^\s*Sitemap\s*:/im);
  });
});
