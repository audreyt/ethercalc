import { describe, expect, it, vi } from 'vite-plus/test';

import {
  copyToPrivate,
  currentRoom,
  decideMount,
  logout,
  login,
  newPrivateSheet,
  register,
  roomAccess,
  roomEditLocation,
  signIn,
  whoami,
  type PasskeyLogicHost,
} from '../src/passkey/logic.ts';

function makeCredential(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cred-id',
    rawId: new Uint8Array([1, 2, 3]).buffer,
    type: 'public-key',
    getClientExtensionResults: () => ({}),
    response: {
      clientDataJSON: new Uint8Array([4, 5]).buffer,
      authenticatorData: new Uint8Array([6, 7]).buffer,
      signature: new Uint8Array([8, 9]).buffer,
      attestationObject: new Uint8Array([10, 11]).buffer,
      userHandle: null,
      getTransports: () => ['internal'],
    },
    ...overrides,
  };
}

function makeHost(overrides: Partial<PasskeyLogicHost> = {}): PasskeyLogicHost {
  return {
    fetch: overrides.fetch ?? (vi.fn(async () => new Response('{}')) as unknown as typeof fetch),
    navigator: overrides.navigator ?? {
      credentials: {
        get: vi.fn(),
        create: vi.fn(),
      } as unknown as CredentialsContainer,
    },
    location: overrides.location ?? { pathname: '/room1', assign: vi.fn() },
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('whoami', () => {
  it('returns enabled+uid when the endpoint responds with a signed-in account', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ enabled: true, uid: 'abc123' }));
    const host = makeHost({ fetch: fetchMock as unknown as typeof fetch });
    await expect(whoami(host)).resolves.toEqual({ enabled: true, uid: 'abc123' });
    expect(fetchMock).toHaveBeenCalledWith('/_auth/whoami');
  });

  it('normalizes a non-string uid to null', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => jsonResponse({ enabled: true, uid: 42 })) as unknown as typeof fetch,
    });
    await expect(whoami(host)).resolves.toEqual({ enabled: true, uid: null });
  });

  it('returns disabled+null on a non-ok response', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch,
    });
    await expect(whoami(host)).resolves.toEqual({ enabled: false, uid: null });
  });

  it('returns disabled+null when fetch throws', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => {
        throw new Error('network down');
      }) as unknown as typeof fetch,
    });
    await expect(whoami(host)).resolves.toEqual({ enabled: false, uid: null });
  });
});

describe('roomAccess', () => {
  const validVerdict = { isPrivate: false, canRead: true, canWrite: true };

  it('returns the verdict on a well-shaped 200', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(validVerdict));
    const host = makeHost({ fetch: fetchMock as unknown as typeof fetch });
    await expect(roomAccess(host, 'my room')).resolves.toEqual(validVerdict);
    expect(fetchMock).toHaveBeenCalledWith('/_/my%20room/access');
  });

  it('returns null on a non-ok response', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 403 })) as unknown as typeof fetch,
    });
    await expect(roomAccess(host, 'r')).resolves.toBeNull();
  });

  it('returns null when a required field is missing', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => jsonResponse({ isPrivate: false, canRead: true })) as unknown as typeof fetch,
    });
    await expect(roomAccess(host, 'r')).resolves.toBeNull();
  });

  it('returns null when a field has the wrong type', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => jsonResponse({ isPrivate: 'no', canRead: true, canWrite: true })) as unknown as typeof fetch,
    });
    await expect(roomAccess(host, 'r')).resolves.toBeNull();
  });

  it('returns null when the body is not an object', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => jsonResponse(null)) as unknown as typeof fetch,
    });
    await expect(roomAccess(host, 'r')).resolves.toBeNull();
  });

  it('returns null when fetch throws', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => {
        throw new Error('offline');
      }) as unknown as typeof fetch,
    });
    await expect(roomAccess(host, 'r')).resolves.toBeNull();
  });
});

describe('currentRoom', () => {
  it('extracts a plain room name', () => {
    expect(currentRoom('/abc123')).toBe('abc123');
  });

  it('extracts a room name with an /edit suffix', () => {
    expect(currentRoom('/abc123/edit')).toBe('abc123');
  });

  it('extracts a room name with a /view suffix', () => {
    expect(currentRoom('/abc123/view')).toBe('abc123');
  });

  it('extracts a room name under the /_/ prefix', () => {
    expect(currentRoom('/_/abc123')).toBe('abc123');
  });

  it('decodes a percent-encoded room name', () => {
    expect(currentRoom('/a%20b')).toBe('a b');
  });

  it('returns null for /_start', () => {
    expect(currentRoom('/_start')).toBeNull();
  });

  it('returns null for /_new', () => {
    expect(currentRoom('/_new')).toBeNull();
  });

  it('returns null for a percent-encoded room name that decodes to _start', () => {
    // The regex's `[^_/]` guard only rejects a LITERAL leading `_` in the
    // raw (still-encoded) path — `/_start` and `/_new` fail to match the
    // regex at all and short-circuit earlier. This exercises the explicit
    // post-decode `_start`/`_new` check on a path the regex DOES match.
    expect(currentRoom('/%5Fstart')).toBeNull();
  });

  it('returns null for a bare root path', () => {
    expect(currentRoom('/')).toBeNull();
  });
});

describe('roomEditLocation', () => {
  it('builds an encoded /:room/edit path', () => {
    expect(roomEditLocation('a room')).toBe('/a%20room/edit');
  });
});

describe('login', () => {
  it('completes a discoverable assertion round-trip and returns the uid', async () => {
    const credential = makeCredential();
    const getMock = vi.fn(async () => credential);
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/login-init') {
        return jsonResponse({
          options: { challenge: 'AA', rpId: 'test.invalid', timeout: 60_000, userVerification: 'preferred' },
        });
      }
      if (path === '/_auth/login-complete') {
        return jsonResponse({ uid: 'signed-in-uid' });
      }
      throw new Error(`unexpected fetch: ${path}`);
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: { credentials: { get: getMock, create: vi.fn() } as unknown as CredentialsContainer },
    });

    await expect(login(host)).resolves.toBe('signed-in-uid');
    expect(getMock).toHaveBeenCalledTimes(1);
    const completeCall = fetchMock.mock.calls.find(([path]) => path === '/_auth/login-complete');
    expect(completeCall).toBeDefined();
  });

  it('base64url-encodes a present userHandle (resident-key discoverable credential)', async () => {
    const credential = makeCredential({
      response: {
        clientDataJSON: new Uint8Array([4, 5]).buffer,
        authenticatorData: new Uint8Array([6, 7]).buffer,
        signature: new Uint8Array([8, 9]).buffer,
        userHandle: new Uint8Array([1, 2, 3]).buffer,
      },
    });
    let completeBody: { response?: { response?: { userHandle?: unknown } } } | undefined;
    const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/_auth/login-init') {
        return jsonResponse({ options: { challenge: 'AA', rpId: 'x', timeout: 1, userVerification: 'preferred' } });
      }
      completeBody = JSON.parse(init?.body as string);
      return jsonResponse({ uid: 'u' });
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: {
        credentials: { get: vi.fn(async () => credential), create: vi.fn() } as unknown as CredentialsContainer,
      },
    });
    await login(host);
    expect(typeof completeBody?.response?.response?.userHandle).toBe('string');
  });

  it('throws when login-init is not ok', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch,
    });
    await expect(login(host)).rejects.toThrow('login unavailable');
  });

  it('propagates a credentials.get rejection (e.g. NotAllowedError)', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ options: { challenge: 'AA', rpId: 'x', timeout: 1, userVerification: 'preferred' } }),
    );
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: {
        credentials: {
          get: vi.fn(async () => {
            throw new DOMException('cancelled', 'NotAllowedError');
          }),
          create: vi.fn(),
        } as unknown as CredentialsContainer,
      },
    });
    await expect(login(host)).rejects.toThrow();
  });

  it('throws when login-complete is not ok', async () => {
    const credential = makeCredential();
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/login-init') {
        return jsonResponse({ options: { challenge: 'AA', rpId: 'x', timeout: 1, userVerification: 'preferred' } });
      }
      return new Response('', { status: 400 });
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: {
        credentials: { get: vi.fn(async () => credential), create: vi.fn() } as unknown as CredentialsContainer,
      },
    });
    await expect(login(host)).rejects.toThrow('login failed');
  });
});

describe('register', () => {
  it('completes a creation round-trip and returns the uid', async () => {
    const credential = makeCredential();
    const createMock = vi.fn(async () => credential);
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/register-init') {
        return jsonResponse({
          options: {
            challenge: 'AA',
            rp: { id: 'test.invalid', name: 'EtherCalc' },
            user: { id: 'AAA', name: 'user', displayName: '' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            timeout: 60_000,
            attestation: 'none',
            authenticatorSelection: {},
            excludeCredentials: [{ id: 'AAA', transports: ['internal'] }],
          },
          uid: 'new-uid',
        });
      }
      if (path === '/_auth/register-complete') {
        return jsonResponse({ uid: 'new-uid' });
      }
      throw new Error(`unexpected fetch: ${path}`);
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: { credentials: { get: vi.fn(), create: createMock } as unknown as CredentialsContainer },
    });

    await expect(register(host)).resolves.toBe('new-uid');
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('defaults excludeCredentials to an empty list and omits transports when unavailable', async () => {
    // `getTransports` absent (some authenticators/browsers don't implement it)
    // and `excludeCredentials` entirely omitted from the server's options
    // (not merely an empty array) — exercises the `?? []` fallback and the
    // `getTransports ? … : undefined` branch together.
    const credential = makeCredential({
      response: {
        clientDataJSON: new Uint8Array([4, 5]).buffer,
        attestationObject: new Uint8Array([10, 11]).buffer,
        getTransports: undefined,
      },
    });
    const createMock = vi.fn(async (opts: { publicKey: { excludeCredentials: unknown[] } }) => {
      expect(opts.publicKey.excludeCredentials).toEqual([]);
      return credential;
    });
    let completeBody: { response?: { response?: { transports?: unknown } } } | undefined;
    const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
      if (path === '/_auth/register-init') {
        return jsonResponse({
          options: {
            challenge: 'AA',
            rp: { id: 'test.invalid', name: 'EtherCalc' },
            user: { id: 'AAA', name: 'user', displayName: '' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            timeout: 60_000,
            attestation: 'none',
            authenticatorSelection: {},
          },
          uid: 'new-uid',
        });
      }
      completeBody = JSON.parse(init?.body as string);
      return jsonResponse({ uid: 'new-uid' });
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: { credentials: { get: vi.fn(), create: createMock } as unknown as CredentialsContainer },
    });

    await expect(register(host)).resolves.toBe('new-uid');
    expect(completeBody?.response?.response?.transports).toBeUndefined();
  });

  it('omits transports on an individual excludeCredentials entry that has none', async () => {
    const credential = makeCredential();
    const createMock = vi.fn(async (opts: { publicKey: { excludeCredentials: Array<Record<string, unknown>> } }) => {
      expect(opts.publicKey.excludeCredentials[0]).not.toHaveProperty('transports');
      return credential;
    });
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/register-init') {
        return jsonResponse({
          options: {
            challenge: 'AA',
            rp: { id: 'test.invalid', name: 'EtherCalc' },
            user: { id: 'AAA', name: 'user', displayName: '' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            timeout: 60_000,
            attestation: 'none',
            authenticatorSelection: {},
            excludeCredentials: [{ id: 'AAA' }],
          },
          uid: 'new-uid',
        });
      }
      return jsonResponse({ uid: 'new-uid' });
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: { credentials: { get: vi.fn(), create: createMock } as unknown as CredentialsContainer },
    });
    await expect(register(host)).resolves.toBe('new-uid');
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it('throws when register-init is not ok', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch,
    });
    await expect(register(host)).rejects.toThrow('registration unavailable');
  });

  it('throws when register-complete is not ok', async () => {
    const credential = makeCredential();
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/register-init') {
        return jsonResponse({
          options: {
            challenge: 'AA',
            rp: { id: 'test.invalid', name: 'EtherCalc' },
            user: { id: 'AAA', name: 'user', displayName: '' },
            pubKeyCredParams: [],
            timeout: 1,
            attestation: 'none',
            authenticatorSelection: {},
            excludeCredentials: [],
          },
          uid: 'x',
        });
      }
      return new Response('', { status: 409 });
    });
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: {
        credentials: { get: vi.fn(), create: vi.fn(async () => credential) } as unknown as CredentialsContainer,
      },
    });
    await expect(register(host)).rejects.toThrow('registration failed');
  });
});

describe('signIn', () => {
  it('delegates to login (discoverable sign-in only, never auto-registers)', async () => {
    const credential = makeCredential();
    const fetchMock = vi.fn(async (path: string) => {
      if (path === '/_auth/login-init') {
        return jsonResponse({ options: { challenge: 'AA', rpId: 'x', timeout: 1, userVerification: 'preferred' } });
      }
      return jsonResponse({ uid: 'u' });
    });
    const createMock = vi.fn();
    const host = makeHost({
      fetch: fetchMock as unknown as typeof fetch,
      navigator: {
        credentials: { get: vi.fn(async () => credential), create: createMock } as unknown as CredentialsContainer,
      },
    });
    await expect(signIn(host)).resolves.toBe('u');
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe('logout', () => {
  it('posts to /_auth/logout', async () => {
    const fetchMock = vi.fn(async () => new Response('', { status: 200 }));
    const host = makeHost({ fetch: fetchMock as unknown as typeof fetch });
    await logout(host);
    expect(fetchMock).toHaveBeenCalledWith(
      '/_auth/logout',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});

describe('newPrivateSheet', () => {
  it('navigates to the new room on success', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ room: 'freshroom' }));
    const assign = vi.fn();
    const host = makeHost({ fetch: fetchMock as unknown as typeof fetch, location: { pathname: '/', assign } });
    await newPrivateSheet(host);
    expect(assign).toHaveBeenCalledWith('/freshroom/edit');
  });

  it('throws "sign in first" on 401', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 401 })) as unknown as typeof fetch,
    });
    await expect(newPrivateSheet(host)).rejects.toThrow('sign in first');
  });

  it('throws a generic error on other failures', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch,
    });
    await expect(newPrivateSheet(host)).rejects.toThrow('could not create a private sheet');
  });
});

describe('copyToPrivate', () => {
  it('navigates to the redirected URL on success', async () => {
    // `Response`'s `redirected`/`url`/`ok` are prototype accessors backed by
    // private internal state — `Object.create`-based cloning can't see that
    // state, so we shadow them with own properties on a real instance
    // instead (own properties take precedence over prototype accessors).
    const redirected = new Response('', { status: 200 });
    Object.defineProperty(redirected, 'redirected', { value: true });
    Object.defineProperty(redirected, 'url', { value: '/newroom/edit' });
    Object.defineProperty(redirected, 'ok', { value: true });
    const fetchMock = vi.fn(async () => redirected);
    const assign = vi.fn();
    const host = makeHost({ fetch: fetchMock as unknown as typeof fetch, location: { pathname: '/', assign } });
    await copyToPrivate(host, 'pub-room');
    expect(assign).toHaveBeenCalledWith('/newroom/edit');
  });

  it('throws "sign in first" on 401', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 401 })) as unknown as typeof fetch,
    });
    await expect(copyToPrivate(host, 'r')).rejects.toThrow('sign in first');
  });

  it('throws a generic error on other non-ok, non-redirected failures', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch,
    });
    await expect(copyToPrivate(host, 'r')).rejects.toThrow('could not copy to a private sheet');
  });

  it('completes without throwing on a direct (non-redirected) 2xx response', async () => {
    const host = makeHost({
      fetch: vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch,
    });
    await expect(copyToPrivate(host, 'r')).resolves.toBeUndefined();
  });
});

describe('decideMount', () => {
  it('routes to landing when there is no room', () => {
    expect(decideMount(null, null)).toEqual({ kind: 'landing' });
    expect(decideMount(null, { isPrivate: false, canRead: true, canWrite: true })).toEqual({ kind: 'landing' });
  });

  it('returns null (never a guessed mode) when the probe itself failed', () => {
    expect(decideMount('room1', null)).toBeNull();
  });

  it('routes to public for a non-private room', () => {
    expect(decideMount('room1', { isPrivate: false, canRead: true, canWrite: true })).toEqual({ kind: 'public' });
  });

  it('routes to private-denied for an unreadable private room', () => {
    expect(decideMount('room1', { isPrivate: true, canRead: false, canWrite: false })).toEqual({
      kind: 'private-denied',
    });
  });

  it('routes to private-owner-writable for a readable+writable private room', () => {
    expect(decideMount('room1', { isPrivate: true, canRead: true, canWrite: true })).toEqual({
      kind: 'private-owner-writable',
    });
  });

  it('routes to private-readable-viewonly for a readable, non-writable private room', () => {
    expect(decideMount('room1', { isPrivate: true, canRead: true, canWrite: false })).toEqual({
      kind: 'private-readable-viewonly',
    });
  });
});
