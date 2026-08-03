import { describe, expect, it } from 'vite-plus/test';

import { websocketAuthority } from '../src/lib/csp.ts';

/**
 * The `connect-src` authority is a trust anchor: it must come from
 * configuration, not from the attacker-controlled `Host` header, whenever
 * configuration exists.
 */
describe('websocketAuthority', () => {
  const spoofed = new URL('https://attacker.test/room');

  it('prefers the configured origin over the request host', () => {
    expect(
      websocketAuthority('https://ethercalc.net', spoofed, true),
    ).toBe('wss://ethercalc.net');
  });

  it('takes the scheme from the configured origin, not the transport', () => {
    // A plaintext deployment stays ws:// even when the edge terminated TLS…
    expect(websocketAuthority('http://localhost:8000', spoofed, true)).toBe(
      'ws://localhost:8000',
    );
    // …and an https origin stays wss:// on a plaintext hop.
    expect(websocketAuthority('https://ethercalc.net', spoofed, false)).toBe(
      'wss://ethercalc.net',
    );
  });

  it('keeps a non-default port from the configured origin', () => {
    expect(websocketAuthority('https://ec.test:8443', spoofed, true)).toBe(
      'wss://ec.test:8443',
    );
  });

  it.each([
    ['unset', undefined],
    ['null (workerd unset binding)', null],
    ['empty', ''],
    ['non-string', 7],
    ['unparseable', 'not a url'],
    ['hostless scheme', 'data:text/plain,x'],
  ])('falls back to the request host when the origin is %s', (_label, value) => {
    expect(websocketAuthority(value, new URL('https://self.host:8787/r'), true)).toBe(
      'wss://self.host:8787',
    );
  });

  it('follows the transport scheme on the fallback path', () => {
    expect(
      websocketAuthority(undefined, new URL('http://127.0.0.1:8787/r'), false),
    ).toBe('ws://127.0.0.1:8787');
    expect(
      websocketAuthority(undefined, new URL('http://127.0.0.1:8787/r'), true),
    ).toBe('wss://127.0.0.1:8787');
  });
});
