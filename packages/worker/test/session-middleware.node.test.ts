import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vite-plus/test';

import {
  SESSION_REVERIFY_TTL_MS,
  getFreshSessionPrincipal,
  getSessionPrincipal,
  type EtherCalcHonoEnv,
} from '../src/lib/session-middleware.ts';
import { buildApp } from '../src/index.ts';
import type { Env } from '../src/env.ts';

function makeApp(
  verifier: (
    env: Env,
    session: string,
  ) => Promise<{ uid: string; exp: number } | null>,
): Hono<EtherCalcHonoEnv> {
  const app = new Hono<EtherCalcHonoEnv>();
  app.get('/who', async (context) => {
    const principal = await getSessionPrincipal(context, verifier);
    return context.json({ uid: principal?.uid ?? null });
  });
  return app;
}

const env = { ROOM: {} as DurableObjectNamespace } as Env;

describe('session middleware', () => {
  it('derives principal only from a verified cookie and ignores forged headers', async () => {
    const verifier = vi.fn().mockResolvedValue({
      uid: 'uid-verified',
      exp: Number.MAX_SAFE_INTEGER,
    });
    const app = makeApp(verifier);

    const response = await app.fetch(
      new Request('https://test.local/who', {
        headers: {
          Cookie: '__Host-ec_sess=signed.token',
          'X-EC-Uid': 'uid-forged',
        },
      }),
      env,
    );

    expect(await response.json()).toEqual({ uid: 'uid-verified' });
    expect(verifier).toHaveBeenCalledExactlyOnceWith(env, 'signed.token');
  });

  it('sets an anonymous principal when no valid cookie is present', async () => {
    const verifier = vi.fn();
    const app = makeApp(verifier);

    const response = await app.fetch(
      new Request('https://test.local/who', {
        headers: { 'X-EC-Uid': 'uid-forged' },
      }),
      env,
    );

    expect(await response.json()).toEqual({ uid: null });
    expect(verifier).not.toHaveBeenCalled();
  });

  it('fails closed when verification fails', async () => {
    const app = makeApp(
      vi.fn().mockRejectedValue(new Error('AuthDO unavailable')),
    );

    const response = await app.fetch(
      new Request('https://test.local/who', {
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      env,
    );

    expect(await response.json()).toEqual({ uid: null });
  });

  it('uses AuthDO verification by default', async () => {
    const app = new Hono<EtherCalcHonoEnv>();
    app.get('/who', async (context) => {
      const principal = await getSessionPrincipal(context);
      return context.json({ uid: principal?.uid ?? null });
    });

    const response = await app.fetch(
      new Request('https://test.local/who'),
      env,
    );

    expect(await response.json()).toEqual({ uid: null });
  });
 
  it('memoizes principal resolution within one request', async () => {
    const verifier = vi.fn().mockResolvedValue({
      uid: 'uid-cached',
      exp: Number.MAX_SAFE_INTEGER,
    });
    const app = new Hono<EtherCalcHonoEnv>();
    app.get('/who', async (context) => {
      const first = await getSessionPrincipal(context, verifier);
      const second = await getSessionPrincipal(context, verifier);
      return context.json({ first: first?.uid, second: second?.uid });
    });

    const response = await app.fetch(
      new Request('https://test.local/who', {
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      env,
    );

    expect(await response.json()).toEqual({
      first: 'uid-cached',
      second: 'uid-cached',
    });
    expect(verifier).toHaveBeenCalledOnce();
  });

  it('asks AuthDO again once the memo is stale and remembers a session that has ended', async () => {
    const t0 = 1_700_000_000_000;
    vi.useFakeTimers({ now: t0 });
    try {
      const verifier = vi
        .fn()
        .mockResolvedValueOnce({ uid: 'uid-owner', exp: Number.MAX_SAFE_INTEGER })
        .mockResolvedValueOnce({ uid: 'uid-owner', exp: Number.MAX_SAFE_INTEGER })
        .mockResolvedValue(null);
      const app = new Hono<EtherCalcHonoEnv>();
      app.get('/who', async (context) => {
        const first = await getSessionPrincipal(context, verifier);
        vi.setSystemTime(t0 + SESSION_REVERIFY_TTL_MS - 1);
        const fresh = await getFreshSessionPrincipal(context, verifier);
        const asked = verifier.mock.calls.length;
        vi.setSystemTime(t0 + SESSION_REVERIFY_TTL_MS);
        const live = await getFreshSessionPrincipal(context, verifier);
        // Signed out while the route waited: it must stop using the uid.
        vi.setSystemTime(t0 + 2 * SESSION_REVERIFY_TTL_MS);
        const ended = await getFreshSessionPrincipal(context, verifier);
        const memo = await getSessionPrincipal(context, verifier);
        // Anonymous now, so there is nothing left to ask AuthDO about.
        vi.setSystemTime(t0 + 3 * SESSION_REVERIFY_TTL_MS);
        const after = await getFreshSessionPrincipal(context, verifier);
        return context.json({
          first: first?.uid ?? null,
          fresh: fresh?.uid ?? null,
          asked,
          live: live?.uid ?? null,
          ended,
          memo,
          after,
        });
      });

      const response = await app.fetch(
        new Request('https://test.local/who', {
          headers: { Cookie: '__Host-ec_sess=signed.token' },
        }),
        env,
      );

      expect(await response.json()).toEqual({
        first: 'uid-owner',
        fresh: 'uid-owner',
        asked: 1,
        live: 'uid-owner',
        ended: null,
        memo: null,
        after: null,
      });
      expect(verifier).toHaveBeenCalledTimes(3);
      expect(verifier).toHaveBeenLastCalledWith(env, 'signed.token');
    } finally {
      vi.useRealTimers();
    }
  });

  it('asks AuthDO again as soon as the memoized session has expired', async () => {
    const t0 = 1_700_000_000_000;
    vi.useFakeTimers({ now: t0 });
    try {
      const verifier = vi
        .fn()
        .mockResolvedValueOnce({ uid: 'uid-owner', exp: t0 + 1_000 })
        .mockResolvedValue(null);
      const app = new Hono<EtherCalcHonoEnv>();
      app.get('/who', async (context) => {
        const first = await getSessionPrincipal(context, verifier);
        vi.setSystemTime(t0 + 999);
        const live = await getFreshSessionPrincipal(context, verifier);
        vi.setSystemTime(t0 + 1_000);
        const expired = await getFreshSessionPrincipal(context, verifier);
        return context.json({
          first: first?.uid ?? null,
          live: live?.uid ?? null,
          expired,
        });
      });

      const response = await app.fetch(
        new Request('https://test.local/who', {
          headers: { Cookie: '__Host-ec_sess=signed.token' },
        }),
        env,
      );

      expect(await response.json()).toEqual({
        first: 'uid-owner',
        live: 'uid-owner',
        expired: null,
      });
      expect(verifier).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a fresh principal resolves an unresolved one and fails closed', async () => {
    const app = new Hono<EtherCalcHonoEnv>();
    app.get('/default', async (context) =>
      context.json({ principal: await getFreshSessionPrincipal(context) }),
    );
    const failing = vi.fn().mockRejectedValue(new Error('AuthDO unavailable'));
    app.get('/failing', async (context) =>
      context.json({
        principal: await getFreshSessionPrincipal(context, failing),
        memo: await getSessionPrincipal(context, failing),
      }),
    );
    const headers = { Cookie: '__Host-ec_sess=signed.token' };

    // No AUTH binding: the default AuthDO verifier refuses the cookie.
    const byDefault = await app.fetch(
      new Request('https://test.local/default', { headers }),
      env,
    );
    const whenFailing = await app.fetch(
      new Request('https://test.local/failing', { headers }),
      env,
    );
    const withoutCookie = await app.fetch(
      new Request('https://test.local/failing'),
      env,
    );

    expect(await byDefault.json()).toEqual({ principal: null });
    expect(await withoutCookie.json()).toEqual({ principal: null, memo: null });
    expect(await whenFailing.json()).toEqual({ principal: null, memo: null });
    expect(failing).toHaveBeenCalledOnce();
  });

  it('does not contact AuthDO for health or static asset requests', async () => {
    const authFetch = vi.fn().mockResolvedValue(
      Response.json({
        uid: 'uid-asset-browser',
        exp: Number.MAX_SAFE_INTEGER,
      }),
    );
    const app = buildApp();
    const requestEnv = {
      ROOM: {} as DurableObjectNamespace,
      AUTH: {
        idFromName: () => ({}) as DurableObjectId,
        get: () => ({ fetch: authFetch }) as unknown as DurableObjectStub,
      } as unknown as DurableObjectNamespace,
      ASSETS: {
        fetch: vi.fn().mockResolvedValue(new Response('asset')),
      } as unknown as Fetcher,
      ETHERCALC_AUTH: '1',
    } as Env;

    const health = await app.fetch(
      new Request('https://test.local/_health', {
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      requestEnv,
    );
    const asset = await app.fetch(
      new Request('https://test.local/static/test.js', {
        headers: { Cookie: '__Host-ec_sess=signed.token' },
      }),
      requestEnv,
    );

    expect(health.status).toBe(200);
    expect(asset.status).toBe(200);
    expect(authFetch).not.toHaveBeenCalled();
  });
});
