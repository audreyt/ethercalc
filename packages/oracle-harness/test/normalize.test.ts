import { describe, expect, it } from 'vitest';

import { encodeBase64 } from '../src/matchers.ts';
import {
  NORMALIZERS,
  applyNormalizer,
  getNormalizer,
  overrideHeader,
  relaxContentLength,
} from '../src/normalize.ts';
import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

function mkScenario(overrides: Partial<HttpScenario> = {}): HttpScenario {
  return {
    name: 'misc/get-new-redirect',
    kind: 'http',
    request: { method: 'GET', path: '/_new' },
    expect: {
      status: 302,
      headers: { location: '/abcdef012345', 'content-length': '35' },
      bodyBase64: encodeBase64(new Uint8Array()),
      bodyMatcher: 'ignore',
    },
    ...overrides,
  };
}

describe('overrideHeader', () => {
  it('replaces an existing header', () => {
    const updated = overrideHeader(mkScenario(), 'location', 're:^/[a-z0-9]{12}$');
    expect(updated.expect?.headers.location).toBe('re:^/[a-z0-9]{12}$');
  });

  it('lowercases the header name', () => {
    const updated = overrideHeader(mkScenario(), 'Location', '/x');
    expect(updated.expect?.headers.location).toBe('/x');
  });

  it('returns scenario unchanged when expect is missing', () => {
    const bare: HttpScenario = {
      name: 'misc/get-new-redirect',
      kind: 'http',
      request: { method: 'GET', path: '/_new' },
    };
    expect(overrideHeader(bare, 'x', 'y')).toBe(bare);
  });
});

describe('relaxContentLength', () => {
  it('rewrites content-length to a digit regex when present', () => {
    const updated = relaxContentLength(mkScenario());
    expect(updated.expect?.headers['content-length']).toBe('re:^\\d+$');
  });

  it('does not add content-length when absent', () => {
    const s = mkScenario({
      expect: {
        status: 200,
        headers: {},
        bodyBase64: encodeBase64(new Uint8Array()),
        bodyMatcher: 'ignore',
      },
    });
    const updated = relaxContentLength(s);
    expect('content-length' in (updated.expect?.headers ?? {})).toBe(false);
  });

  it('returns scenario unchanged when expect is missing', () => {
    const bare: HttpScenario = {
      name: 'misc/get-new-redirect',
      kind: 'http',
      request: { method: 'GET', path: '/_new' },
    };
    expect(relaxContentLength(bare)).toBe(bare);
  });
});

describe('NORMALIZERS registry', () => {
  it('has a hook for misc/get-new-redirect', () => {
    const hook = getNormalizer('misc/get-new-redirect');
    expect(hook).not.toBeNull();
    const out = hook!(mkScenario());
    expect(out.expect?.headers.location).toBe('re:^/[a-z0-9]{12}$');
    expect(out.expect?.headers['content-length']).toBe('re:^\\d+$');
  });

  it('returns null for scenarios without a hook', () => {
    expect(getNormalizer('static/get-root-index')).toBeNull();
  });

  it('exposes the registry object', () => {
    expect(Object.keys(NORMALIZERS)).toContain('misc/get-new-redirect');
  });
});

describe('applyNormalizer', () => {
  it('invokes the registered hook', () => {
    const out = applyNormalizer(mkScenario());
    expect(out.expect?.headers.location).toBe('re:^/[a-z0-9]{12}$');
  });

  it('is a no-op when no hook registered', () => {
    const s = mkScenario({ name: 'static/get-root-index' });
    expect(applyNormalizer(s)).toBe(s);
  });
});
