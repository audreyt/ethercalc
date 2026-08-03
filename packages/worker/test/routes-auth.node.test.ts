import { describe, expect, it } from 'vite-plus/test';

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
  clientIp: string | null;
}

const AUTH_ORIGIN = 'https://ethercalc.net';
const AUTH_JSON_HEADERS = {
  'Content-Type': 'application/json',
  Origin: AUTH_ORIGIN,
} as const;

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
      const headers = new Headers(init?.headers);
      const call: AuthCall = {
        url,
        method: init?.method ?? 'GET',
        body,
        clientIp: headers.get('X-EC-Client-IP'),
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
    ETHERCALC_ORIGIN: AUTH_ORIGIN,
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
        headers: {
          ...AUTH_JSON_HEADERS,
          'CF-Connecting-IP': '198.51.100.2',
          'X-EC-Client-IP': 'attacker-controlled',
        },
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
        clientIp: '198.51.100.2',
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
        headers: AUTH_JSON_HEADERS,
        body: JSON.stringify({ response: { id: 'cred' }, challenge: 'c' }),
      }),
      env,
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ uid: 'uid-owner' });
    expect(res.headers.get('Set-Cookie')).toBe(
      '__Host-ec_sess=signed.token; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax',
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
        headers: AUTH_JSON_HEADERS,
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
        headers: AUTH_JSON_HEADERS,
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
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      env,
    );
    const anon = await app.fetch(
      new Request('https://t.test/_auth/whoami'),
      env,
    );
    const disabled = await app.fetch(
      new Request('https://t.test/_auth/whoami', {
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      { ROOM: {} as DurableObjectNamespace } as Env,
    );

    expect(await authed.json()).toEqual({ uid: 'uid-owner', enabled: true });
    expect(await anon.json()).toEqual({ uid: null, enabled: true });
    expect(await disabled.json()).toEqual({ uid: null, enabled: false });
    expect(authed.headers.get('Cache-Control')).toBe('private, no-store');
    expect(anon.headers.get('Cache-Control')).toBe('private, no-store');
    expect(disabled.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('revokes the current session before clearing its cookie', async () => {
    const { env, calls } = makeAuthEnv(() => new Response(null, { status: 204 }));
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/_auth/logout', {
        method: 'POST',
        headers: {
          Origin: AUTH_ORIGIN,
          Cookie: '__Host-ec_sess=signed.token',
        },
      }),
      env,
    );

    expect(res.status).toBe(204);
    expect(calls).toEqual([
      {
        url: 'https://auth.local/_auth/revoke-session',
        method: 'POST',
        body: JSON.stringify({ session: 'signed.token' }),
        clientIp: 'unknown',
      },
    ]);
    expect(res.headers.get('Set-Cookie')).toBe(
      '__Host-ec_sess=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
    );
  });

  it('does not claim logout succeeded when server-side revocation fails', async () => {
    const { env } = makeAuthEnv(
      () => new Response('unavailable', { status: 503 }),
    );
    const response = await buildApp().fetch(
      new Request('https://t.test/_auth/logout', {
        method: 'POST',
        headers: {
          Origin: AUTH_ORIGIN,
          Cookie: '__Host-ec_sess=signed.token',
        },
      }),
      env,
    );
    expect(response.status).toBe(503);
    expect(response.headers.get('Set-Cookie')).toBeNull();
  });

  it.each([undefined, 'https://evil.test'])(
    'rejects ceremony POSTs from an untrusted Origin (%s)',
    async (origin) => {
      const { env, calls } = makeAuthEnv(() => Response.json({}));
      const headers = new Headers({ 'Content-Type': 'application/json' });
      if (origin !== undefined) headers.set('Origin', origin);
      const res = await buildApp().fetch(
        new Request('https://t.test/_auth/login-init', {
          method: 'POST',
          headers,
          body: '{}',
        }),
        env,
      );
      expect(res.status).toBe(403);
      expect(calls).toEqual([]);
    },
  );

  it('rejects non-JSON and oversized ceremony bodies before AuthDO dispatch', async () => {
    const { env, calls } = makeAuthEnv(() => Response.json({}));
    const app = buildApp();
    const wrongType = await app.fetch(
      new Request('https://t.test/_auth/login-init', {
        method: 'POST',
        headers: { Origin: AUTH_ORIGIN, 'Content-Type': 'text/plain' },
        body: '{}',
      }),
      env,
    );
    const tooLarge = await app.fetch(
      new Request('https://t.test/_auth/login-init', {
        method: 'POST',
        headers: AUTH_JSON_HEADERS,
        body: 'x'.repeat(64 * 1024 + 1),
      }),
      env,
    );
    expect(wrongType.status).toBe(415);
    expect(tooLarge.status).toBe(413);
    expect(calls).toEqual([]);
  });
});
