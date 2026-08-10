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
  /** Opaque verified session token attached only by the WS proxy. */
  session: string | null;
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
        session: headers.get('X-EC-Session'),
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
const AUTH_COOKIE = '__Host-ec_sess=tok-valid';

/**
 * Layer a fake AUTH namespace over `env` so `getSessionPrincipal` resolves
 * `AUTH_UID` plus its future expiration for any `__Host-ec_sess` cookie.
 */
function withAuth(env: Env, uid: string = AUTH_UID): Env {
  return {
    ...env,
    ETHERCALC_AUTH: '1',
    ETHERCALC_ORIGIN: 'https://t.test',
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

  it('discards forged identities for HTML, CSV, XLSX, and TOC sheet-data reads', async () => {
    const simplePaths = [
      'https://t.test/locked.html',
      'https://t.test/_/locked/csv',
      'https://t.test/_/locked/xlsx',
    ];
    for (const url of simplePaths) {
      const { env, calls } = makeFakeRoomNamespace(
        () => new Response('Forbidden', { status: 403 }),
      );
      const res = await buildApp().fetch(
        new Request(url, {
          headers: { Cookie: AUTH_COOKIE, 'X-EC-Uid': 'uid-forged' },
        }),
        withAuth(env) as never,
      );
      expect(res.status, url).toBe(403);
      expect(calls).toHaveLength(1);
      expect(calls[0]!.uid, url).toBe(AUTH_UID);
    }

    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/csv.json')) {
        return Response.json([
          ['#url', '#title'],
          ['/book.1', 'Sheet'],
        ]);
      }
      return Response.json({ cells: {}, valueformats: {} });
    });
    const res = await buildApp().fetch(
      new Request('https://t.test/_/=book/xlsx', {
        headers: { Cookie: AUTH_COOKIE, 'X-EC-Uid': 'uid-forged' },
      }),
      withAuth(env) as never,
    );
    expect(res.status).toBe(200);
    expect(calls.map((call) => call.uid)).toEqual([AUTH_UID, AUTH_UID]);
    expect(calls[1]!.url).toContain('/_do/sheet-data');
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

  it('rejects a TOC above the shared 256-sheet fan-out limit', async () => {
    const rows = [
      ['#url', '#title'],
      ...Array.from({ length: 257 }, (_, i) => [`/book.${i + 1}`, `Sheet ${i + 1}`]),
    ];
    const { env, calls } = makeFakeRoomNamespace(() => Response.json(rows));
    const res = await buildApp().fetch(
      new Request('https://t.test/_/=book/xlsx'),
      env as never,
    );

    expect(res.status).toBe(413);
    expect(calls).toHaveLength(1);
    expect(await res.text()).toBe('multi-sheet export exceeds resource limits');
  });

  it('does not dispatch unsafe persisted TOC links', async () => {
    const { env, calls } = makeFakeRoomNamespace(() =>
      Response.json([
        ['#url', '#title'],
        ['//attacker.test/sheet', 'Unsafe'],
      ]),
    );
    const res = await buildApp().fetch(
      new Request('https://t.test/_/=book/xlsx'),
      env as never,
    );

    expect(res.status).toBe(404);
    expect(calls).toHaveLength(1);
  });

  it('rejects an oversized sub-sheet response before buffering it', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/csv.json')) {
        return Response.json([
          ['#url', '#title'],
          ['/book.1', 'Alpha'],
        ]);
      }
      return new Response('', {
        headers: { 'Content-Length': String(8 * 1024 * 1024 + 1) },
      });
    });
    const res = await buildApp().fetch(
      new Request('https://t.test/_/=book/xlsx'),
      env as never,
    );

    expect(res.status).toBe(413);
    expect(calls).toHaveLength(2);
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
  it('never copies inbound X-EC identity headers onto the DO upgrade', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('ws-ok'));
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_ws/r?user=u1&auth=0', {
        headers: {
          Upgrade: 'websocket',
          'X-EC-Uid': 'uid-forged',
          'X-EC-Session': 'session-forged',
        },
      }),
      env as never,
    );
    expect(await res.text()).toBe('ws-ok');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.upgrade).toBe('websocket');
    expect(calls[0]!.uid).toBeNull();
    expect(calls[0]!.session).toBeNull();
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
          Origin: 'https://t.test',
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
    expect(calls[0]!.session).toBe('tok-valid');
  });

  it.each([undefined, 'https://evil.test'])(
    'rejects a session-bearing upgrade from an untrusted Origin: %s',
    async (origin) => {
      const { env, calls } = makeFakeRoomNamespace(() => new Response('ws-ok'));
      const headers: Record<string, string> = {
        Upgrade: 'websocket',
        Cookie: AUTH_COOKIE,
      };
      if (origin !== undefined) headers['Origin'] = origin;
      const res = await buildApp().fetch(
        new Request('https://t.test/_ws/r?user=u1', { headers }),
        withAuth(env) as never,
      );
      expect(res.status).toBe(403);
      expect(calls).toHaveLength(0);
    },
  );

  it.each([
    'user=a&user=b',
    `user=${'u'.repeat(257)}`,
    `auth=${'a'.repeat(513)}`,
  ])('rejects ambiguous or oversized upgrade parameters: %s', async (query) => {
    const { env, calls } = makeFakeRoomNamespace(() => new Response('ws-ok'));
    const res = await buildApp().fetch(
      new Request(`https://t.test/_ws/r?${query}`, {
        headers: { Upgrade: 'websocket' },
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });
});


describe('session mutation CSRF boundary', () => {
  it.each([
    ['https://evil.test', undefined],
    [undefined, 'cross-site'],
  ])(
    'rejects a session mutation with Origin=%s Sec-Fetch-Site=%s',
    async (origin, fetchSite) => {
      const { env, calls } = makeFakeRoomNamespace(
        () => new Response(null, { status: 201 }),
      );
      const headers = new Headers({
        Cookie: AUTH_COOKIE,
        'Content-Type': 'text/x-socialcalc',
      });
      if (origin !== undefined) headers.set('Origin', origin);
      if (fetchSite !== undefined) headers.set('Sec-Fetch-Site', fetchSite);
      const response = await buildApp().fetch(
        new Request('https://t.test/_/csrf-room', {
          method: 'PUT',
          headers,
          body: 'version:1.5',
        }),
        withAuth(env) as never,
      );
      expect(response.status).toBe(403);
      expect(calls).toHaveLength(0);
    },
  );

  it('allows the configured origin to mutate with a session', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response(null, { status: 201 }),
    );
    const response = await buildApp().fetch(
      new Request('https://t.test/_/csrf-room', {
        method: 'PUT',
        headers: {
          Cookie: AUTH_COOKIE,
          Origin: 'https://t.test',
          'Content-Type': 'text/x-socialcalc',
        },
        body: 'version:1.5',
      }),
      withAuth(env) as never,
    );
    expect(response.status).toBe(201);
    expect(calls.length).toBeGreaterThan(0);
  });
});

describe('global response hardening', () => {
  it('adds browser baseline headers without blocking documented framing', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('https://t.test/_health'),
      env as never,
    );
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self' wss://t.test");
    const connectSources = csp
      ?.split(';')
      .find((directive) => directive.trimStart().startsWith('connect-src'))
      ?.trim()
      .split(/\s+/);
    expect(connectSources).not.toContain('ws:');
    expect(connectSources).not.toContain('wss:');
    expect(csp).toContain("img-src 'self' data:");
    expect(csp).not.toContain('img-src https:');
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain('frame-ancestors');
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), geolocation=(), microphone=()',
    );
    expect(response.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
    expect(response.headers.get('X-Frame-Options')).toBeNull();
  });

  it('marks non-landing responses noindex and leaves the homepage indexable', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response('ok'));
    const app = buildApp();
    const room = await app.fetch(
      new Request('https://t.test/abcdef012345'),
      env as never,
    );
    const exportCsv = await app.fetch(
      new Request('https://t.test/abcdef012345.csv'),
      env as never,
    );
    const health = await app.fetch(
      new Request('https://t.test/_health'),
      env as never,
    );
    const robots = await app.fetch(
      new Request('https://t.test/robots.txt'),
      env as never,
    );
    // Landing pages are served from ASSETS; when the binding is absent
    // the route still runs through the same header middleware, so we
    // assert the *absence* of the noindex tag on `/` via a path that
    // is on the allowlist even without ASSETS (`isIndexablePath`).
    // `/_health` is deliberately NOT allowlisted — operators probe it,
    // crawlers must not index it.
    expect(room.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
    expect(exportCsv.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive',
    );
    expect(health.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive',
    );
    expect(robots.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive',
    );
    const robotsBody = await robots.text();
    expect(robotsBody).toMatch(/^User-agent: \*/);
    expect(robotsBody).not.toMatch(/^\s*Disallow\s*:/im);
  });

  it('does not noindex the public landing path', async () => {
    // `/` goes through ASSETS; without the binding it 500s/404s, but the
    // global middleware still stamps headers on whatever status comes
    // back. We only care that the allowlist skipped X-Robots-Tag.
    const { env } = makeFakeRoomNamespace(() => new Response());
    // Provide a minimal ASSETS fetcher so `/` returns 200 rather than
    // falling through a missing-binding path.
    const envWithAssets = {
      ...env,
      ASSETS: {
        fetch: async () =>
          new Response('<html></html>', {
            headers: { 'Content-Type': 'text/html' },
          }),
      },
    };
    const app = buildApp();
    const root = await app.fetch(
      new Request('https://t.test/'),
      envWithAssets as never,
    );
    const start = await app.fetch(
      new Request('https://t.test/_start'),
      envWithAssets as never,
    );
    expect(root.headers.get('X-Robots-Tag')).toBeNull();
    // Secondary start page is user navigation chrome, not marketing.
    expect(start.headers.get('X-Robots-Tag')).toBe(
      'noindex, nofollow, noarchive',
    );
  });

  it('allows only the request host for local plaintext WebSockets', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('http://127.0.0.1:8787/_health'),
      env as never,
    );
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "connect-src 'self' ws://127.0.0.1:8787",
    );
  });

  it('makes every session-bearing response private and non-cacheable', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('https://t.test/_health', {
        headers: { Cookie: AUTH_COOKIE },
      }),
      env as never,
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toContain('Cookie');
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      "frame-ancestors 'self'",
    );
  });

  it('makes bearer and operator-route responses non-cacheable', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('https://t.test/_health', {
        headers: { Authorization: 'Bearer test' },
      }),
      env as never,
    );
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Vary')).toContain('Authorization');
  });

  it('does not upgrade resources on a direct HTTP self-host response', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('http://t.test/_health'),
      env as never,
    );
    expect(response.headers.get('Strict-Transport-Security')).toBeNull();
    expect(response.headers.get('Content-Security-Policy')).not.toContain(
      'upgrade-insecure-requests',
    );
  });

  it('honors the official proxy HTTPS scheme header', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const response = await buildApp().fetch(
      new Request('http://t.test/_health', {
        headers: { 'X-Forwarded-Proto': 'https' },
      }),
      env as never,
    );
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
    expect(response.headers.get('Content-Security-Policy')).toContain(
      'upgrade-insecure-requests',
    );
  });
});