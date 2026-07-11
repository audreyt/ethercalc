import { describe, it, expect } from 'vite-plus/test';
import * as XLSX from '@e965/xlsx';

import { buildApp } from '../src/index.ts';
import type { Env } from '../src/env.ts';

/**
 * Phase A route-security tests for the DO dispatch surfaces outside
 * `routes/rooms.ts`: exports, multi-sheet import, the `/:template/form`
 * clone, and the `/_ws/:room` upgrade proxy.
 *
 * Contract under test (same as routes-rooms.node.test.ts):
 *   1. identity threading — the `X-EC-Uid` the DO sees comes ONLY from
 *      the verified session principal, never from inbound headers;
 *   2. verdict propagation — DO 401/403 pass through verbatim
 *      (status + text/plain body) instead of being swallowed;
 *   3. effect ordering — no side-effecting dispatch after a denial.
 */

interface Call {
  url: string;
  method: string;
  bodyText?: string;
  /** `X-EC-Uid` header the route layer attached to the DO fetch (null = none). */
  uid: string | null;
  /** Upgrade header on the forwarded request (WS proxy assertions). */
  upgrade: string | null;
  /** Verified session expiry attached only by the WS proxy (null = absent). */
  sessionExp: string | null;
}

interface FakeStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

function makeFakeRoomNamespace(responder: (call: Call) => Response): {
  env: Env;
  calls: Call[];
} {
  const calls: Call[] = [];
  const stub: FakeStub = {
    async fetch(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      let bodyText: string | undefined;
      if (init?.body !== undefined) {
        bodyText =
          typeof init.body === 'string'
            ? init.body
            : await new Response(init.body as BodyInit).text();
      } else if (typeof input !== 'string' && input.method !== 'GET') {
        bodyText = await input.text();
      }
      const method =
        init?.method ?? (typeof input === 'string' ? 'GET' : input.method);
      const headers = new Headers(
        init?.headers ?? (typeof input === 'string' ? undefined : input.headers),
      );
      const call: Call = {
        url,
        method,
        uid: headers.get('X-EC-Uid'),
        upgrade: headers.get('Upgrade'),
        sessionExp: headers.get('X-EC-Session-Exp'),
        ...(bodyText !== undefined ? { bodyText } : {}),
      };
      calls.push(call);
      return responder(call);
    },
  };
  const env: Env = {
    ROOM: {
      idFromName: (n: string) => ({ n }) as unknown as DurableObjectId,
      get: () => stub as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
  return { env, calls };
}

const AUTH_UID = 'uid-passkey-1';
const AUTH_EXP = Number.MAX_SAFE_INTEGER;
const AUTH_COOKIE = 'ec_sess=tok-valid';

/**
 * Layer a fake AUTH namespace over `env` so `getSessionPrincipal` resolves
 * `AUTH_UID` plus its future expiration for any `ec_sess` cookie.
 */
function withAuth(env: Env, uid: string = AUTH_UID): Env {
  return {
    ...env,
    ETHERCALC_AUTH: '1',
    AUTH: {
      idFromName: () => ({}) as DurableObjectId,
      get: () =>
        ({
          fetch: async () => Response.json({ uid, exp: AUTH_EXP }),
        }) as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
  };
}

function makeOneSheetXlsx(): Uint8Array {
  const ws: XLSX.WorkSheet = { '!ref': 'A1:A1', A1: { t: 's', v: 'hi' } };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, ws, 'Alpha');
  return new Uint8Array(
    XLSX.write(book, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer,
  );
}

describe('exports — verdict propagation + identity threading', () => {
  it('GET /_/:room/csv propagates a DO 403 as text/plain', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('Forbidden', { status: 403 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/locked/csv'),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('content-disposition')).toBeNull();
    expect(await res.text()).toBe('Forbidden');
  });

  it('GET /:room.html propagates a DO 403', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('Forbidden', { status: 403 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/locked.html'),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Forbidden');
  });

  it('GET /_/:room/xlsx propagates a DO 401', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('Unauthorized', { status: 401 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/locked/xlsx'),
      env as never,
    );
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Unauthorized');
  });

  it('threads the verified principal to the export dispatch', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('a,b'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r/csv', {
        headers: { Cookie: AUTH_COOKIE, 'X-EC-Uid': 'uid-forged' },
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(200);
    expect(calls[0]!.uid).toBe(AUTH_UID);
  });

  it('GET /_/=:room/xlsx propagates a 403 TOC read instead of hiding it as 404', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('Forbidden', { status: 403 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/=locked/xlsx'),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden');
  });

  it('GET /_/=:room/xlsx propagates a 403 sub-sheet read', async () => {
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/csv.json')) {
        return Response.json([
          ['#url', '#title'],
          ['/r.1', 'Alpha'],
        ]);
      }
      return new Response('Forbidden', { status: 403 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/=r/xlsx'),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden');
  });
});

describe('multi-sheet import — write verdict gating', () => {
  it('PUT /=:room.xlsx propagates the first sub-sheet 403 and dispatches nothing further', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('Forbidden', { status: 403 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/=book.xlsx', {
        method: 'PUT',
        body: makeOneSheetXlsx() as unknown as BodyInit,
      }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Forbidden');
    // Fail on FIRST denial: the sub-sheet write was attempted, the TOC
    // write (and any later sibling) must not be.
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://do.local/_do/snapshot?name=book.1');
  });

  it('threads the verified principal to every import write', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 201 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/=book.xlsx', {
        method: 'PUT',
        headers: { Cookie: AUTH_COOKIE },
        body: makeOneSheetXlsx() as unknown as BodyInit,
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
    // One sub-sheet write + the TOC write, both stamped.
    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.uid).toBe(AUTH_UID);
    }
  });
});

describe('/:template/form clone — verdict propagation', () => {
  it('propagates a DO 403 clone verdict instead of redirecting', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('Forbidden', { status: 403 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/tpl/form', { redirect: 'manual' }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe('Forbidden');
    expect(res.headers.get('location')).toBeNull();
  });

  it('still redirects (302) when the clone succeeds, threading the principal', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 200 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/tpl/form', {
        headers: { Cookie: AUTH_COOKIE },
        redirect: 'manual',
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toMatch(/^\/tpl_[a-z0-9]{12}\/app$/);
    const clone = calls.find((c) => c.url.includes('/_do/clone'));
    expect(clone).toBeDefined();
    expect(clone!.uid).toBe(AUTH_UID);
  });
});

describe('private owner entry with ETHERCALC_KEY', () => {
  it('routes a verified owner without a usable legacy auth token through /edit', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/access')) {
        return Response.json({ isPrivate: true, canRead: true, canWrite: true });
      }
      return new Response('unexpected', { status: 500 });
    });
    const app = buildApp();

    const res = await app.fetch(
      new Request('https://t.test/private-owner', {
        headers: { Cookie: AUTH_COOKIE },
        redirect: 'manual',
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: 'test-key',
      } as never,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/private-owner/edit');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://do.local/_do/access?name=private-owner');
    expect(calls[0]!.uid).toBe(AUTH_UID);

    const edit = await app.fetch(
      new Request('https://t.test/private-owner/edit', {
        headers: { Cookie: AUTH_COOKIE },
        redirect: 'manual',
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: 'test-key',
      } as never,
    );
    expect(edit.status).toBe(302);
    expect(edit.headers.get('location')).toMatch(
      /^\/private-owner\?auth=(?!0$).+/,
    );
    expect(calls).toHaveLength(2);
    expect(calls[1]!.url).toBe('https://do.local/_do/access?name=private-owner');
    expect(calls[1]!.uid).toBe(AUTH_UID);

    const appMode = await app.fetch(
      new Request('https://t.test/private-owner?auth=nonzero&app=1', {
        headers: { Cookie: AUTH_COOKIE },
        redirect: 'manual',
      }),
      {
        ...withAuth(env),
        ETHERCALC_KEY: 'test-key',
      } as never,
    );
    expect(appMode.status).toBe(302);
    expect(appMode.headers.get('location')).toBe('/private-owner/view');
  });
});

describe('/_ws/:room upgrade — verified identity only', () => {
  it('never copies an inbound X-EC-Uid onto the DO upgrade request', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('ws-ok'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_ws/r?user=u1&auth=0', {
        headers: { Upgrade: 'websocket', 'X-EC-Uid': 'uid-forged' },
      }),
      env as never,
    );
    expect(await res.text()).toBe('ws-ok');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.upgrade).toBe('websocket');
    expect(calls[0]!.uid).toBeNull();
    // Query params still flow through untouched.
    expect(calls[0]!.url).toBe(
      'https://do.local/_do/ws?user=u1&auth=0&room=r',
    );
  });

  it('stamps the verified principal uid on the upgrade headers', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('ws-ok'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_ws/r?user=u1', {
        headers: {
          Upgrade: 'websocket',
          Cookie: AUTH_COOKIE,
          'X-EC-Uid': 'uid-forged',
        },
      }),
      withAuth(env) as never,
    );
    expect(await res.text()).toBe('ws-ok');
    expect(calls[0]!.upgrade).toBe('websocket');
    // Exactly the verified uid — never the forged inbound value.
    expect(calls[0]!.uid).toBe(AUTH_UID);
    expect(calls[0]!.sessionExp).toBe(String(AUTH_EXP));
  });
});
