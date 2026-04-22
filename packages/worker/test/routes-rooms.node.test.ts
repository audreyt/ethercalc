import { describe, it, expect } from 'vitest';

/**
 * Node-env tests for the route glue at src/routes/rooms.ts.
 *
 * The glue layer itself is excluded from the coverage gate (it lives in
 * /* istanbul ignore file *\/), but we still want route-shape regression
 * coverage — what `env.ROOM.fetch` call patterns does the Hono app emit?
 *
 * These tests stub the ROOM namespace with a spy that records every fetch
 * invocation, plumb that through a freshly-constructed Hono app, and
 * assert the shape of the forwarded request.
 */

import { buildApp } from '../src/index.ts';
import type { Env } from '../src/env.ts';

interface Call {
  url: string;
  method: string;
  bodyText?: string;
}

interface FakeStub {
  fetch(
    input: Request | string,
    init?: RequestInit,
  ): Promise<Response>;
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
      const method = init?.method ?? (typeof input === 'string' ? 'GET' : input.method);
      const call: Call = { url, method, ...(bodyText !== undefined ? { bodyText } : {}) };
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

describe('route glue — env.ROOM dispatch shapes', () => {
  it('GET /_exists/:room calls /_do/exists and returns bare boolean', async () => {
    const { env, calls } = makeFakeRoomNamespace(() =>
      new Response(JSON.stringify({ exists: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_exists/foo'),
      env as never,
    );
    expect(calls).toHaveLength(1);
    // `doFetch` threads `?name=<room>` so the DO can self-identify for
    // the Phase 5.1 D1 rooms-index mirror.
    expect(calls[0]!.url).toBe('https://do.local/_do/exists?name=foo');
    expect(calls[0]!.method).toBe('GET');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('false');
  });

  it('GET /_exists/:room returns "true" when DO says exists:1', async () => {
    const { env } = makeFakeRoomNamespace(() =>
      new Response(JSON.stringify({ exists: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_exists/foo'),
      env as never,
    );
    expect(await res.text()).toBe('true');
  });

  it('GET /_/:room reads /_do/snapshot via DO', async () => {
    const { env, calls } = makeFakeRoomNamespace(() =>
      new Response('SC-SAVE', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room42'),
      env as never,
    );
    expect(calls[0]!.url).toBe('https://do.local/_do/snapshot?name=room42');
    expect(calls[0]!.method).toBe('GET');
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('SC-SAVE');
  });

  it('GET /_/:room forwards 404 from DO', async () => {
    const { env } = makeFakeRoomNamespace(
      () => new Response('', { status: 404 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/missing'),
      env as never,
    );
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
  });

  it('PUT /_/:room with text/x-socialcalc PUTs /_do/snapshot', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 201 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', {
        method: 'PUT',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'my-snapshot',
      }),
      env as never,
    );
    expect(calls[0]!.method).toBe('PUT');
    expect(calls[0]!.url).toBe('https://do.local/_do/snapshot?name=r');
    expect(calls[0]!.bodyText).toBe('my-snapshot');
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('OK');
  });

  it('DELETE /_/:room calls DELETE /_do/all', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 201 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/r', { method: 'DELETE' }),
      env as never,
    );
    expect(calls[0]!.method).toBe('DELETE');
    expect(calls[0]!.url).toBe('https://do.local/_do/all?name=r');
    expect(res.status).toBe(201);
  });

  it('POST /_ with text/x-socialcalc generates a room and returns Location', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 201 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_', {
        method: 'POST',
        headers: { 'content-type': 'text/x-socialcalc' },
        body: 'save',
      }),
      env as never,
    );
    expect(res.status).toBe(201);
    expect(calls[0]!.method).toBe('PUT');
    // Generated 12-char id, followed by ?name=<same-id>.
    expect(calls[0]!.url).toMatch(/^https:\/\/do\.local\/_do\/snapshot\?name=[a-z0-9]{12}$/);
    const body = await res.text();
    expect(body).toMatch(/^\/[a-z0-9]{12}$/);
    expect(res.headers.get('location')).toBe(`/_${body}`);
  });

  it('POST /_ with JSON + explicit room uses the supplied id', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('OK', { status: 201 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ room: 'chosen', snapshot: 'x' }),
      }),
      env as never,
    );
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('/chosen');
    expect(calls[0]!.bodyText).toBe('x');
  });

  it('POST /_ with garbage XLSX body still creates a blank room (empty fallback)', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      // Body-preserving PUT — accept and echo.
      if (call.url.includes('/_do/snapshot')) {
        return new Response('', { status: 201 });
      }
      return new Response('', { status: 200 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_', {
        method: 'POST',
        headers: {
          'content-type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: 'PKZIP', // garbage — classifier catches parse error, treats as empty.
      }),
      env as never,
    );
    // Garbage body → empty save → 201 at a new room.
    expect(res.status).toBe(201);
    // One DO write to snapshot.
    expect(calls.some((c) => c.url.includes('/_do/snapshot'))).toBe(true);
  });

  it('GET /_from/:template copies template snapshot into a new room', async () => {
    const { env, calls } = makeFakeRoomNamespace((call) => {
      // Path is `/_do/snapshot?name=<room>` — match the path prefix.
      if (call.url.startsWith('https://do.local/_do/snapshot') && call.method === 'GET') {
        return new Response('TPL-SNAP');
      }
      return new Response('OK', { status: 201 });
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_from/some-template', { redirect: 'manual' }),
      env as never,
    );
    expect(res.status).toBe(302);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toMatch(/^\/[a-z0-9]{12}$/);
    // First call GET (template), second PUT (new room) with copied snapshot.
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.url).toBe('https://do.local/_do/snapshot?name=some-template');
    expect(calls[1]!.method).toBe('PUT');
    expect(calls[1]!.url).toMatch(/^https:\/\/do\.local\/_do\/snapshot\?name=[a-z0-9]{12}$/);
    expect(calls[1]!.bodyText).toBe('TPL-SNAP');
  });

  it('GET /_from/:template when template does not exist redirects to a blank room', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => new Response('', { status: 404 }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_from/nonexistent', { redirect: 'manual' }),
      env as never,
    );
    expect(res.status).toBe(302);
    // Only the template snapshot GET is attempted; no PUT when 404.
    expect(calls.filter((c) => c.method === 'PUT')).toHaveLength(0);
  });

  it('GET /_rooms returns [] with JSON content-type', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_rooms'),
      env as never,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await res.text()).toBe('[]');
  });

  it('GET /_roomlinks returns [] with HTML content-type', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_roomlinks'),
      env as never,
    );
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('[]');
  });

  it('GET /_roomtimes returns {} with JSON content-type', async () => {
    const { env } = makeFakeRoomNamespace(() => new Response());
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_roomtimes'),
      env as never,
    );
    expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await res.text()).toBe('{}');
  });
});
