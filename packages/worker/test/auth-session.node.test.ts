import { describe, expect, it, vi } from 'vitest';

import { verifyAuthSession } from '../src/lib/auth-session.ts';
import type { Env } from '../src/env.ts';

interface AuthCall {
  readonly name: string;
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

function makeEnv(
  responder: (request: Request) => Response | Promise<Response>,
  enabled = '1',
): { env: Env; calls: AuthCall[] } {
  const calls: AuthCall[] = [];
  let name = '';
  const stub = {
    async fetch(input: Request | string, init?: RequestInit): Promise<Response> {
      const request =
        typeof input === 'string' ? new Request(input, init) : input;
      const body: unknown = await request.clone().json();
      calls.push({ name, url: request.url, method: request.method, body });
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
  it('verifies against the singleton AuthDO and returns its uid', async () => {
    const { env, calls } = makeEnv(
      () => Response.json({ uid: 'uid-owner' }),
    );

    await expect(verifyAuthSession(env, 'signed.token')).resolves.toEqual({
      uid: 'uid-owner',
    });
    expect(calls).toEqual([
      {
        name: 'auth',
        url: 'https://auth.local/_auth/verify-session',
        method: 'POST',
        body: { session: 'signed.token' },
      },
    ]);
  });

  it.each(['', '0', 'false', 'no', 'off'])(
    'does not contact AuthDO when auth flag is %j',
    async (flag) => {
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

  it('fails closed when AuthDO dispatch throws', async () => {
    const responder = vi.fn().mockRejectedValue(new Error('binding failed'));
    const { env } = makeEnv(responder);
    await expect(verifyAuthSession(env, 'signed.token')).resolves.toBeNull();
  });
});
