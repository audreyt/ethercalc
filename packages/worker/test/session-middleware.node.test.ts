import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
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
          Cookie: 'ec_sess=signed.token',
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
        headers: { Cookie: 'ec_sess=signed.token' },
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
        headers: { Cookie: 'ec_sess=signed.token' },
      }),
      env,
    );

    expect(await response.json()).toEqual({
      first: 'uid-cached',
      second: 'uid-cached',
    });
    expect(verifier).toHaveBeenCalledOnce();
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
        headers: { Cookie: 'ec_sess=signed.token' },
      }),
      requestEnv,
    );
    const asset = await app.fetch(
      new Request('https://test.local/static/test.js', {
        headers: { Cookie: 'ec_sess=signed.token' },
      }),
      requestEnv,
    );

    expect(health.status).toBe(200);
    expect(asset.status).toBe(200);
    expect(authFetch).not.toHaveBeenCalled();
  });
});
