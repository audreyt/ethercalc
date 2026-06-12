import { describe, expect, it } from 'vitest';

import { encodeBase64 } from '../src/matchers.ts';
import {
  NORMALIZERS,
  applyNormalizer,
  getNormalizer,
  overrideHeader,
  relaxContentLength,
  setBodyMatcher,
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

describe('setBodyMatcher', () => {
  it('overrides the recorded matcher', () => {
    const out = setBodyMatcher(mkScenario(), 'scsave');
    expect(out.expect?.bodyMatcher).toBe('scsave');
  });

  it('returns scenario unchanged when expect is missing', () => {
    const bare: HttpScenario = {
      name: 'exports/get-snapshot',
      kind: 'http',
      request: { method: 'GET', path: '/_/x' },
    };
    expect(setBodyMatcher(bare, 'scsave')).toBe(bare);
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

  it('has a hook for exports/get-snapshot', () => {
    const hook = getNormalizer('exports/get-snapshot');
    expect(hook).not.toBeNull();
    const out = hook!(
      mkScenario({
        name: 'exports/get-snapshot',
        expect: {
          status: 200,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
          bodyBase64: encodeBase64(new Uint8Array()),
          bodyMatcher: 'exact',
        },
      }),
    );
    expect(out.expect?.bodyMatcher).toBe('scsave');
  });

  it('has a hook for form/get-template-form-redirect', () => {
    const hook = getNormalizer('form/get-template-form-redirect');
    expect(hook).not.toBeNull();
    const out = hook!(
      mkScenario({
        name: 'form/get-template-form-redirect',
        expect: {
          status: 302,
          headers: {
            location: '/oracle-phase3-template_abc123def456/app',
            'content-length': '42',
          },
          bodyBase64: encodeBase64(new Uint8Array()),
          bodyMatcher: 'ignore',
        },
      }),
    );
    expect(out.expect?.headers.location).toBe(
      're:^/oracle-phase3-template_[a-z0-9]{12}/app$',
    );
    expect(out.expect?.headers['content-length']).toBe('re:^\\d+$');
  });

  it('returns null for scenarios without a hook', () => {
    expect(getNormalizer('misc/get-etc-foo-404')).toBeNull();
  });

  it('has a hook for exports/get-html', () => {
    const hook = getNormalizer('exports/get-html');
    expect(hook).not.toBeNull();
    const out = hook!(
      mkScenario({
        name: 'exports/get-html',
        expect: {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
          bodyBase64: encodeBase64(new Uint8Array()),
          bodyMatcher: 'exact',
        },
      }),
    );
    expect(out.expect?.bodyMatcher).toBe('html');
  });

  it('has hooks for xlsx/ods exports and F-13 room-index matchers', () => {
    expect(getNormalizer('exports/get-xlsx')!(mkScenario({ name: 'exports/get-xlsx' })).expect
      ?.bodyMatcher).toBe('xlsx');
    expect(getNormalizer('exports/get-ods')!(mkScenario({ name: 'exports/get-ods' })).expect
      ?.bodyMatcher).toBe('ods');
    expect(
      getNormalizer('rooms-index/get-rooms-empty')!(
        mkScenario({ name: 'rooms-index/get-rooms-empty' }),
      ).expect?.bodyMatcher,
    ).toBe('rooms-empty');
    expect(
      getNormalizer('rooms-index/get-roomtimes-empty')!(
        mkScenario({ name: 'rooms-index/get-roomtimes-empty' }),
      ).expect?.bodyMatcher,
    ).toBe('roomtimes-empty');
    expect(
      getNormalizer('rooms-index/get-roomlinks-empty')!(
        mkScenario({ name: 'rooms-index/get-roomlinks-empty' }),
      ).expect?.bodyMatcher,
    ).toBe('roomlinks-empty');
  });

  it('exposes the registry object', () => {
    expect(Object.keys(NORMALIZERS)).toEqual([
      'static/get-root-index',
      'static/get-start',
      'static/get-favicon',
      'static/get-socialcalc-js',
      'misc/get-new-redirect',
      'exports/get-snapshot',
      'exports/get-html',
      'form/get-template-form-redirect',
      'exports/get-xlsx',
      'exports/get-ods',
      'rooms-index/get-rooms-empty',
      'rooms-index/get-roomtimes-empty',
      'rooms-index/get-roomlinks-empty',
      'room-crud/post-command',
    ]);
  });
});

describe('applyNormalizer', () => {
  it('invokes the registered hook', () => {
    const out = applyNormalizer(mkScenario());
    expect(out.expect?.headers.location).toBe('re:^/[a-z0-9]{12}$');
  });

  it('is a no-op when no hook registered', () => {
    const s = mkScenario({ name: 'misc/get-etc-foo-404' });
    expect(applyNormalizer(s)).toBe(s);
  });
});
