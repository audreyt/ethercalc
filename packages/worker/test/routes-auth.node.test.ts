import { describe, expect, it } from 'vitest';

import { buildApp } from '../src/index.ts';
import type { Env } from '../src/env.ts';

/**
 * Node-env tests for the `/_auth/*` route glue at src/routes/auth.ts.
 * The AuthDO is stubbed with a recording namespace, mirroring the
 * routes-rooms pattern: assert the dispatch shapes and the cookie
 * post-processing, not WebAuthn internals (those live in
 * auth-do.node.test.ts).
 */

interface AuthCall {
  url: string;
  method: string;
  body: string;
}

function makeAuthEnv(
  responder: (call: AuthCall) => Response,
): { env: Env; calls: AuthCall[] } {
  const calls: AuthCall[] = [];
  const stub = {
    async fetch(input: Request | string, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input.url;
      const body =
        typeof init?.body === 'string'
          ? init.body
          : await new Response(init?.body as BodyInit).text();
      const call: AuthCall = {
        url,
        method: init?.method ?? 'GET',
        body,
      };
      calls.push(call);
      return responder(call);
    },
  };
  const env = {
    ROOM: {} as DurableObjectNamespace,
    AUTH: {
      idFromName: (name: string) =>
        ({ toString: () => name }) as DurableObjectId,
      get: () => stub as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
    ETHERCALC_AUTH: '1',
    ETHERCALC_RP_ID: 'ethercalc.net',
    ETHERCALC_RP_NAME: 'EtherCalc',
    ETHERCALC_ORIGIN: 'https://ethercalc.net',
  };
  return { env: env as Env, calls };
}

describe('auth routes', () => {
  it('forwards register-init/login-init bodies verbatim and returns DO JSON', async () => {
    const { env, calls } = makeAuthEnv(() =>
      Response.json({ options: { challenge: 'c' }, uid: 'uid-new' }),
    );
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/register-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }),
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      options: { challenge: 'c' },
      uid: 'uid-new',
    });
    expect(calls).toEqual([
      {
        url: 'https://auth.local/_auth/register-init',
        method: 'POST',
        body: '{}',
      },
    ]);
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('turns a completed ceremony into an HttpOnly cookie without echoing the token', async () => {
    const { env, calls } = makeAuthEnv(() =>
      Response.json({ uid: 'uid-owner', session: 'signed.token' }),
    );
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/login-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: { id: 'cred' }, challenge: 'c' }),
      }),
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ uid: 'uid-owner' });
    expect(res.headers.get('Set-Cookie')).toBe(
      'ec_sess=signed.token; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax',
    );
    expect(calls[0]?.url).toBe('https://auth.local/_auth/login-complete');
  });

  it('propagates ceremony failures without a cookie', async () => {
    const { env } = makeAuthEnv(
      () => new Response('Authentication verification failed', { status: 401 }),
    );
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/login-complete', {
        method: 'POST',
        body: '{}',
      }),
      env,
    );

    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Authentication verification failed');
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('rejects malformed completion payloads from the DO', async () => {
    const { env } = makeAuthEnv(() => Response.json({ uid: 'u' }));
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/register-complete', {
        method: 'POST',
        body: '{}',
      }),
      env,
    );

    expect(res.status).toBe(502);
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('404s every ceremony route when auth is disabled or unconfigured', async () => {
    const app = buildApp();
    const disabledEnvs: Env[] = [
      { ROOM: {} as DurableObjectNamespace } as Env,
      {
        ...makeAuthEnv(() => new Response('x')).env,
        ETHERCALC_AUTH: '0',
      } as Env,
      {
        ...makeAuthEnv(() => new Response('x')).env,
        ETHERCALC_RP_ID: null,
      } as Env,
      {
        ...makeAuthEnv(() => new Response('x')).env,
        ETHERCALC_ORIGIN: null,
      } as Env,
    ];
    for (const env of disabledEnvs) {
      for (const step of [
        'register-init',
        'register-complete',
        'login-init',
        'login-complete',
      ]) {
        const res = await app.fetch(
          new Request(`https://t.test/_auth/${step}`, {
            method: 'POST',
            body: '{}',
          }),
          env,
        );
        expect(res.status, step).toBe(404);
      }
    }
  });

  it('whoami reports the verified principal, anonymity, and availability', async () => {
    const { env } = makeAuthEnv(() =>
      Response.json({ uid: 'uid-owner', exp: Number.MAX_SAFE_INTEGER }),
    );
    const app = buildApp();

    const authed = await app.fetch(
      new Request('https://t.test/_auth/whoami', {
        headers: { Cookie: 'ec_sess=signed.token' },
      }),
      env,
    );
    const anon = await app.fetch(
      new Request('https://t.test/_auth/whoami'),
      env,
    );
    const disabled = await app.fetch(
      new Request('https://t.test/_auth/whoami', {
        headers: { Cookie: 'ec_sess=signed.token' },
      }),
      { ROOM: {} as DurableObjectNamespace } as Env,
    );

    expect(await authed.json()).toEqual({ uid: 'uid-owner', enabled: true });
    expect(await anon.json()).toEqual({ uid: null, enabled: true });
    expect(await disabled.json()).toEqual({ uid: null, enabled: false });
  });

  it('logout clears the session cookie', async () => {
    const { env } = makeAuthEnv(() => new Response('x'));
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/logout', { method: 'POST' }),
      env,
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Set-Cookie')).toBe(
      'ec_sess=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
    );
  });
});
