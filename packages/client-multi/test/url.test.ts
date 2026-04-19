import { describe, it, expect } from 'vitest';
import { DEFAULT_INDEX, parseMultiEnv } from '../src/url.ts';

function loc(href: string, search = ''): { href: string; search: string } {
  return { href, search };
}

describe('parseMultiEnv', () => {
  it('returns the fallback index for an unmatched URL', () => {
    const env = parseMultiEnv(loc('https://example.com/'));
    expect(env.index).toBe(DEFAULT_INDEX);
    expect(env.basePath).toBe('.');
    expect(env.isReadOnly).toBe(false);
    expect(env.suffix).toBe('');
    expect(env.pushStatePath).toBeNull();
  });

  it('extracts the room name from /=<room>', () => {
    const env = parseMultiEnv(loc('https://x.com/=room123'));
    expect(env.index).toBe('room123');
  });

  it('rejects /=_… per the legacy [^_] rule', () => {
    const env = parseMultiEnv(loc('https://x.com/=_new'));
    // Leading _ is excluded; falls back to default.
    expect(env.index).toBe(DEFAULT_INDEX);
  });

  it('strips query from the room name', () => {
    const env = parseMultiEnv(loc('https://x.com/=foo?auth=abc', '?auth=abc'));
    expect(env.index).toBe('foo');
  });

  it('flips basePath to http://127.0.0.1:8000 on localhost:8080', () => {
    const env = parseMultiEnv(loc('http://localhost:8080/=r'));
    expect(env.basePath).toBe('http://127.0.0.1:8000');
  });

  it('flips basePath on 127.0.0.1:8080', () => {
    const env = parseMultiEnv(loc('http://127.0.0.1:8080/=r'));
    expect(env.basePath).toBe('http://127.0.0.1:8000');
  });

  it('flips basePath on *.local:8080', () => {
    const env = parseMultiEnv(loc('http://foo.local:8080/=r'));
    expect(env.basePath).toBe('http://127.0.0.1:8000');
  });

  it('marks read-only when auth=0 appears in the href', () => {
    const env = parseMultiEnv(loc('https://x.com/=foo?auth=0', ''));
    expect(env.isReadOnly).toBe(true);
  });

  it('bumps basePath to .. and sets /view suffix for ?auth=0', () => {
    const env = parseMultiEnv(loc('https://x.com/=foo?auth=0', '?auth=0'));
    expect(env.basePath).toBe('..');
    expect(env.isReadOnly).toBe(true);
    expect(env.suffix).toBe('/view');
    expect(env.pushStatePath).toBe('./=foo/view');
  });

  it('bumps basePath to .. and sets /edit suffix for ?auth=<nonzero>', () => {
    const env = parseMultiEnv(
      loc('https://x.com/=foo?auth=abc123', '?auth=abc123'),
    );
    expect(env.basePath).toBe('..');
    expect(env.isReadOnly).toBe(false);
    expect(env.suffix).toBe('/edit');
    expect(env.pushStatePath).toBe('./=foo/edit');
  });

  it('preserves non-default basePath (dev) when ?auth is present', () => {
    const env = parseMultiEnv(
      loc('http://localhost:8080/=foo?auth=0', '?auth=0'),
    );
    // Already http://127.0.0.1:8000, not `.`, so it stays.
    expect(env.basePath).toBe('http://127.0.0.1:8000');
    expect(env.suffix).toBe('/view');
  });

  it('does not push state when ?auth is absent', () => {
    const env = parseMultiEnv(loc('https://x.com/=foo', ''));
    expect(env.pushStatePath).toBeNull();
  });
});
