import { describe, expect, it, vi } from 'vite-plus/test';

import {
  createSessionCookie,
  parseSessionCookie,
  verifySessionCookie,
} from '../src/lib/session.ts';

describe('session cookies', () => {
  it('extracts __Host-ec_sess without matching similarly named cookies', () => {
    expect(
      parseSessionCookie(
        'flag; other=1; ec_session=wrong; __Host-ec_sess=token.payload.signature; theme=dark',
      ),
    ).toBe('token.payload.signature');
    expect(parseSessionCookie('ec_session=wrong')).toBeNull();
  });

  it('rejects missing, empty, duplicate, and malformed session cookies', () => {
    for (const header of [
      null,
      '',
      'other=1',
      '__Host-ec_sess=',
      '__Host-ec_sess=valid; __Host-ec_sess=shadow',
      '__Host-ec_sess=contains%20space',
      '__Host-ec_sess=line\r\nbreak',
    ]) {
      expect(parseSessionCookie(header)).toBeNull();
    }
  });

  it('builds a host-only secure HttpOnly session cookie', () => {
    expect(createSessionCookie('token.payload.signature')).toBe(
      '__Host-ec_sess=token.payload.signature; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax',
    );
  });

  it('rejects unsafe cookie values before constructing a header', () => {
    for (const session of ['', 'white space', 'line\r\nbreak', 'semi;colon']) {
      expect(() => createSessionCookie(session)).toThrow(RangeError);
    }
  });

  it('verifies the extracted token and returns the authenticated principal', async () => {
    const verifier = vi.fn().mockResolvedValue({ uid: 'uid-owner' });

    await expect(
      verifySessionCookie('other=1; __Host-ec_sess=signed.token', verifier),
    ).resolves.toEqual({ uid: 'uid-owner' });
    expect(verifier).toHaveBeenCalledExactlyOnceWith('signed.token');
  });

  it('does not call the verifier without a valid session cookie', async () => {
    const verifier = vi.fn();

    await expect(verifySessionCookie(null, verifier)).resolves.toBeNull();
    await expect(
      verifySessionCookie('__Host-ec_sess=bad value', verifier),
    ).resolves.toBeNull();
    expect(verifier).not.toHaveBeenCalled();
  });

  it('fails closed when verification rejects or returns no principal', async () => {
    await expect(
      verifySessionCookie(
        '__Host-ec_sess=signed.token',
        vi.fn().mockResolvedValue(null),
      ),
    ).resolves.toBeNull();
    await expect(
      verifySessionCookie(
        '__Host-ec_sess=signed.token',
        vi.fn().mockRejectedValue(new Error('AuthDO unavailable')),
      ),
    ).resolves.toBeNull();
  });
});

describe('cookie parsing boundaries', () => {
  const token = 'a'.repeat(32);

  it('skips valueless segments instead of treating them as the session', () => {
    expect(parseSessionCookie('flag; __Host-ec_sess=' + token)).toBe(token);
    // A bare `=` at position 0 is not a name/value pair.
    expect(parseSessionCookie('=' + token)).toBeNull();
  });

  it('trims surrounding whitespace from the cookie value', () => {
    expect(parseSessionCookie(`__Host-ec_sess=  ${token}  `)).toBe(token);
  });

  it('names the failure when asked to mint an invalid cookie', () => {
    expect(() => createSessionCookie('not a session')).toThrow(
      'invalid session cookie value',
    );
  });
});
