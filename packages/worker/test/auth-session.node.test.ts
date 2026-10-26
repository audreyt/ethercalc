import { describe, expect, it, vi } from 'vite-plus/test';

import { refreshAuthSession, verifyAuthSession } from '../src/lib/auth-session.ts';
import type { Env } from '../src/env.ts';

interface AuthCall {
  readonly name: string;
  readonly url: string;
  readonly method: string;
  readonly contentType: string | null;
  readonly body: unknown;
}

function makeEnv(
  responder: (request: Request) => Response | Promise<Response>,
  enabled: string | null | undefined = '1',
): { env: Env; calls: AuthCall[] } {
  const calls: AuthCall[] = [];
  let name = '';
  const stub = {
    async fetch(input: Request | string, init?: RequestInit): Promise<Response> {
      const request =
        typeof input === 'string' ? new Request(input, init) : input;
      const body: unknown = await request.clone().json();
      calls.push({
        name,
        url: request.url,
        method: request.method,
        contentType: request.headers.get('Content-Type'),
        body,
      });
      return responder(request);
    },
  };
  const auth = {
    idFromName(value: string): DurableObjectId {
      name = value;
      return { toString: () => value } as DurableObjectId;
    },
    get(): DurableObjectStub {
      return stub as unknown as DurableObjectStub;
    },
  };
  const env = {
    ROOM: {} as DurableObjectNamespace,
    AUTH: auth as unknown as DurableObjectNamespace,
    ETHERCALC_AUTH: enabled,
  };
  return { env: env as Env, calls };
}

describe('verifyAuthSession', () => {
  it('verifies against the singleton AuthDO and returns uid plus expiry', async () => {
    const exp = Date.now() + 60_000;
    const { env, calls } = makeEnv(
      () => Response.json({ uid: 'uid-owner', exp }),
    );

    await expect(verifyAuthSession(env, 'signed.token')).resolves.toEqual({
      uid: 'uid-owner',
      exp,
    });
    expect(calls).toEqual([
      {
        name: 'auth',
        url: 'https://auth.local/_auth/verify-session',
        method: 'POST',
        contentType: 'application/json',
        body: { session: 'signed.token' },
      },
    ]);
  });

  it.each(['', '0', 'false', 'no', 'off', null] as const)(
    'does not contact AuthDO when auth flag is %j',
    async (flag) => {
      // `null` is the workerd-unset binding shape (see room-index-access.ts).
      // `undefined` is covered by flagEnabled unit tests; makeEnv's default
      // param would collapse an omitted/undefined arg back to '1'.
      const { env, calls } = makeEnv(
        () => Response.json({ uid: 'unexpected' }),
        flag,
      );
      await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
      expect(calls).toHaveLength(0);
    },
  );

  it('fails closed when the AuthDO binding is absent', async () => {
    const env = {
      ROOM: {} as DurableObjectNamespace,
      ETHERCALC_AUTH: '1',
    } as Env;
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
  });

  it('fails closed for non-success and malformed AuthDO responses', async () => {
    const unauthorized = makeEnv(
      () => new Response('Invalid session', { status: 401 }),
    ).env;
    const missingUid = makeEnv(() => Response.json({})).env;
    const wrongUid = makeEnv(() => Response.json({ uid: 7 })).env;
    const badJson = makeEnv(() => new Response('{')).env;

    await expect(
      verifyAuthSession(unauthorized, 'signed.token'),
    ).resolves.toBeNull();
    await expect(
      verifyAuthSession(missingUid, 'signed.token'),
    ).resolves.toBeNull();
    await expect(
      verifyAuthSession(wrongUid, 'signed.token'),
    ).resolves.toBeNull();
    await expect(verifyAuthSession(badJson, 'signed.token')).resolves.toBeNull();
  });

  it('honours the AuthDO status, not just the payload shape', async () => {
    // A refusal that still carries a well-formed body must not authenticate.
    const { env } = makeEnv(
      () =>
        Response.json(
          { uid: 'uid-owner', exp: Date.now() + 60_000 },
          { status: 401 },
        ),
    );
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
  });
  it.each([
    ['null', null],
    ['array', []],
    ['missing exp', { uid: 'u' }],
    ['missing exp', { uid: 'u' }],
    ['non-finite exp', { uid: 'u', exp: Number.NaN }],
    ['string exp', { uid: 'u', exp: String(Date.now() + 60_000) }],
    ['null exp', { uid: 'u', exp: null }],
    ['infinite exp', { uid: 'u', exp: Number.POSITIVE_INFINITY }],
    ['boolean exp', { uid: 'u', exp: true }],
    ['numeric uid', { uid: 7, exp: Date.now() + 60_000 }],
    ['expired exp', { uid: 'u', exp: Date.now() - 1 }],
    ['boolean payload', false],
    ['number payload', 7],
    ['string payload', 'ok'],
  ])('rejects %s verification payloads', async (_label, body) => {
    const { env } = makeEnv(() => Response.json(body));
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
  });

  it('rejects sessions at the exact expiry boundary', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const { env } = makeEnv(() => Response.json({ uid: 'u', exp: now }));
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
    vi.restoreAllMocks();
  });

  it('fails closed when AuthDO dispatch throws', async () => {
    const responder = vi.fn().mockRejectedValue(new Error('binding failed'));
    const { env } = makeEnv(responder);
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
  });
});

describe('refreshAuthSession', () => {
  it('posts to refresh-session and returns the principal when AuthDO keeps the token', async () => {
    const exp = Date.now() + 60_000;
    const { env, calls } = makeEnv(() => Response.json({ uid: 'uid-owner', exp }));
    await expect(refreshAuthSession(env, 'signed.token')).resolves.toEqual({ uid: 'uid-owner', exp });
    expect(calls).toEqual([
      {
        name: 'auth',
        url: 'https://auth.local/_auth/refresh-session',
        method: 'POST',
        contentType: 'application/json',
        body: { session: 'signed.token' },
      },
    ]);
  });

  it('returns the replacement token when AuthDO renews the session', async () => {
    const exp = Date.now() + 60_000;
    const { env } = makeEnv(() => Response.json({ uid: 'uid-owner', exp, session: 'renewed.token' }));
    await expect(refreshAuthSession(env, 'signed.token')).resolves.toEqual({
      uid: 'uid-owner',
      exp,
      session: 'renewed.token',
    });
  });

  it.each([
    ['empty replacement', { session: '' }],
    ['numeric replacement', { session: 7 }],
    ['null replacement', { session: null }],
  ])('fails closed on a %s', async (_label, extra) => {
    const { env } = makeEnv(() => Response.json({ uid: 'uid-owner', exp: Date.now() + 60_000, ...extra }));
    await expect(refreshAuthSession(env, 'signed.token')).resolves.toBeNull();
  });

  it('fails closed like verification: disabled, unbound, refused, malformed, or throwing', async () => {
    const disabled = makeEnv(() => Response.json({ uid: 'u', exp: Date.now() + 60_000 }), '0');
    await expect(refreshAuthSession(disabled.env, 'signed.token')).resolves.toBeNull();
    expect(disabled.calls).toHaveLength(0);
    const unbound = { ROOM: {} as DurableObjectNamespace, ETHERCALC_AUTH: '1' } as Env;
    await expect(refreshAuthSession(unbound, 'signed.token')).resolves.toBeNull();
    const refused = makeEnv(() => new Response('Not Found', { status: 404 })).env;
    await expect(refreshAuthSession(refused, 'signed.token')).resolves.toBeNull();
    const malformed = makeEnv(() => Response.json({ uid: 7, exp: Date.now() + 60_000 })).env;
    await expect(refreshAuthSession(malformed, 'signed.token')).resolves.toBeNull();
    const throwing = makeEnv(vi.fn().mockRejectedValue(new Error('binding failed'))).env;
    await expect(refreshAuthSession(throwing, 'signed.token')).resolves.toBeNull();
  });
});
