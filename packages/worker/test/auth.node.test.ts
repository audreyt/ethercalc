import { describe, it, expect } from 'vitest';

import { computeAuth, verifyAuth } from '../src/lib/auth.ts';

/**
 * Reference vector: the docker oracle pinned at `042b731` with no `KEY`
 * passes `room` straight through. See `tests/oracle/FINDINGS.md` F-03.
 *
 * For keyed mode the expected hex is the Node HMAC-SHA256 of the room
 * under the secret. We embed one pre-computed value below so the test
 * doesn't need Node's `crypto.createHmac` to agree with our Web Crypto
 * impl — that's precisely what the test is asserting.
 */
describe('computeAuth', () => {
  it('returns room unchanged when key is undefined', async () => {
    expect(await computeAuth(undefined, 'some-room')).toBe('some-room');
  });

  it('returns room unchanged when key is empty string', async () => {
    expect(await computeAuth('', 'another')).toBe('another');
  });

  it('returns hex HMAC-SHA256 when key is set', async () => {
    // Verified against legacy Node: createHmac('sha256', Buffer.from('secret'))
    //   .update('room').digest('hex'). The legacy server uses the same
    //   Buffer + update + hex pipeline (src/main.ls:24-26), so this vector
    //   is bug-for-bug compatible with the oracle.
    const expected = '1f472eb4d4563f45a9c5f97b225ebbb38f39a760ebd63b32db803cc2f3eab116';
    expect(await computeAuth('secret', 'room')).toBe(expected);
  });

  it('is stable across calls (pure function)', async () => {
    const a = await computeAuth('k', 'r');
    const b = await computeAuth('k', 'r');
    expect(a).toBe(b);
  });

  it('produces a 64-char lowercase hex string when keyed', async () => {
    const h = await computeAuth('any-key', 'any-room');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('verifyAuth', () => {
  it('true when supplied matches identity (no key)', async () => {
    expect(await verifyAuth(undefined, 'some-room', 'some-room')).toBe(true);
  });

  it('true for any non-0 supplied value when no key is configured', async () => {
    // Legacy `src/main.ls:506` gate is `auth is \0 or KEY and auth isnt hmac room`
    // — when KEY is unset, only the `'0'` sentinel is rejected. Clients in
    // anonymous mode don't carry an auth URL param at all, so the server
    // sees `supplied === ''`; it must accept. This is the bug that silently
    // swallowed `execute` frames in the browser multiplayer smoke test.
    expect(await verifyAuth(undefined, 'some-room', 'other')).toBe(true);
    expect(await verifyAuth(undefined, 'some-room', '')).toBe(true);
  });

  it('true when supplied matches computed HMAC under key', async () => {
    const h = await computeAuth('secret', 'room');
    expect(await verifyAuth('secret', 'room', h)).toBe(true);
  });

  it('false when HMAC is off by one byte', async () => {
    const h = await computeAuth('secret', 'room');
    const mutated = `${h.slice(0, -1)}${h.slice(-1) === 'a' ? 'b' : 'a'}`;
    expect(await verifyAuth('secret', 'room', mutated)).toBe(false);
  });

  it('false when supplied is shorter than expected', async () => {
    expect(await verifyAuth('secret', 'room', 'short')).toBe(false);
  });

  it('rejects the view-only sentinel 0 even under identity mode', async () => {
    // Legacy: when KEY unset, identity HMAC means hmac('0') === '0', so a
    // naive equality check would *accept* `?auth=0` as a valid edit token.
    // verifyAuth MUST reject `0` unconditionally.
    expect(await verifyAuth(undefined, '0', '0')).toBe(false);
  });

  it('rejects the view-only sentinel 0 under keyed mode', async () => {
    expect(await verifyAuth('secret', 'room', '0')).toBe(false);
  });
});
