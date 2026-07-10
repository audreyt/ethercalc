import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/index.ts';
import { computeAuth } from '../src/lib/auth.ts';
import type { Env } from '../src/env.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly bodyText?: string;
}

interface FakeStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

type Responder = (call: Call) => Response | Promise<Response>;

function makeFakeRoomNamespace(
  responder: Responder,
  key?: string,
): { env: Env; calls: Call[] } {
  const calls: Call[] = [];
  const stub: FakeStub = {
    async fetch(input, init) {
      const url = typeof input === 'string' ? input : input.url;
      const method = init?.method ?? (typeof input === 'string' ? 'GET' : input.method);
      let bodyText: string | undefined;
      if (init?.body !== undefined) {
        bodyText =
          typeof init.body === 'string'
            ? init.body
            : await new Response(init.body as BodyInit).text();
      } else if (typeof input !== 'string' && input.method !== 'GET') {
        bodyText = await input.text();
      }
      const call: Call = {
        url,
        method,
        ...(bodyText === undefined ? {} : { bodyText }),
      };
      calls.push(call);
      return responder(call);
    },
  };
  const env: Env = {
    ROOM: {
      idFromName: (name: string) => ({ name }) as unknown as DurableObjectId,
      get: () => stub as unknown as DurableObjectStub,
    } as unknown as DurableObjectNamespace,
    ...(key === undefined ? {} : { ETHERCALC_KEY: key }),
  };
  return { env, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /_/:room/pitr-restore', () => {
  it('authenticates before parsing or dispatching', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => {
        throw new Error('must not dispatch');
      },
      'server-key',
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore?auth=wrong', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(await res.text()).toBe('Forbidden');
    expect(calls).toHaveLength(0);
  });

  it('rejects the view-only auth=0 sentinel even without a configured key', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore?auth=0', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      env as never,
    );
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it('returns 400 for malformed JSON without touching the DO', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: '{',
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('body must be valid JSON');
    expect(calls).toHaveLength(0);
  });

  it('returns 400 for an invalid request shape without touching the DO', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target', at: 1 }),
      }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('send exactly one of {bookmark} or {at}');
    expect(calls).toHaveLength(0);
  });

  it('normalizes and dispatches a timestamp dry run under valid HMAC auth', async () => {
    const { env, calls } = makeFakeRoomNamespace(
      () => jsonResponse({ dryRun: true, bookmark: 'resolved' }),
      'server-key',
    );
    const auth = await computeAuth('server-key', 'room');
    const app = buildApp();
    const res = await app.fetch(
      new Request(`https://t.test/_/room/pitr-restore?auth=${auth}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ at: '2026-07-10T00:00:00.000Z', dryRun: true }),
      }),
      env as never,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ dryRun: true, bookmark: 'resolved' });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain('/_do/pitr-restore?name=room');
    expect(calls[0]?.method).toBe('POST');
    expect(JSON.parse(calls[0]?.bodyText ?? '')).toEqual({
      at: Date.parse('2026-07-10T00:00:00.000Z'),
      dryRun: true,
    });
  });

  it.each([
    [501, 'PITR is unavailable on this deployment'],
    [400, 'PITR target is unavailable'],
  ] as const)('preserves a DO %i error response', async (status, message) => {
    const { env } = makeFakeRoomNamespace(
      () =>
        new Response(message, {
          status,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }),
    );
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target', dryRun: true }),
      }),
      env as never,
    );
    expect(res.status).toBe(status);
    expect(res.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await res.text()).toBe(message);
  });

  it('returns 502 when the initial DO dispatch throws', async () => {
    const { env } = makeFakeRoomNamespace(() => {
      throw new Error('connection dropped');
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      env as never,
    );
    expect(res.status).toBe(502);
    expect(await res.text()).toBe('PITR restore dispatch failed');
  });

  it('waits through old/transient ping results then finalizes an existing room', async () => {
    let pingCalls = 0;
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/pitr-restore')) {
        return jsonResponse({
          bookmark: 'target',
          undoBookmark: 'undo',
          nonce: 'old-instance',
        });
      }
      if (call.url.includes('/_do/ping')) {
        pingCalls += 1;
        if (pingCalls === 1) return jsonResponse({ nonce: 'old-instance' });
        if (pingCalls === 2) throw new Error('instance restarting');
        return jsonResponse({ nonce: 'new-instance' });
      }
      if (call.url.includes('/_do/pitr-touch')) {
        return jsonResponse({ exists: true, updatedAt: 1783641660000 });
      }
      throw new Error(`unexpected DO call: ${call.url}`);
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      env as never,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      restored: true,
      bookmark: 'target',
      undoBookmark: 'undo',
      exists: true,
      updatedAt: 1783641660000,
    });
    expect(pingCalls).toBe(3);
    const touches = calls.filter((call) => call.url.includes('/_do/pitr-touch'));
    expect(touches).toHaveLength(1);
    expect(touches[0]?.method).toBe('POST');
  });

  it('omits updatedAt when the restored bookmark predates room creation', async () => {
    const { env } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/pitr-restore')) {
        return jsonResponse({
          bookmark: 'before-creation',
          undoBookmark: 'undo',
          nonce: 'old-instance',
        });
      }
      if (call.url.includes('/_do/ping')) {
        return jsonResponse({ nonce: 'new-instance' });
      }
      if (call.url.includes('/_do/pitr-touch')) {
        return jsonResponse({ exists: false });
      }
      throw new Error(`unexpected DO call: ${call.url}`);
    });
    const app = buildApp();
    const res = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'before-creation' }),
      }),
      env as never,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      restored: true,
      bookmark: 'before-creation',
      undoBookmark: 'undo',
      exists: false,
    });
  });

  it('returns 502 for malformed acceptance or failed finalization responses', async () => {
    const malformed = makeFakeRoomNamespace(() => jsonResponse({ bookmark: 'target' }));
    const app = buildApp();
    const malformedRes = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      malformed.env as never,
    );
    expect(malformedRes.status).toBe(502);
    expect(await malformedRes.text()).toBe('Invalid PITR response');

    const failedTouch = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/pitr-restore')) {
        return jsonResponse({ bookmark: 'target', undoBookmark: 'undo', nonce: 'old' });
      }
      if (call.url.includes('/_do/ping')) return jsonResponse({ nonce: 'new' });
      return new Response('touch failed', { status: 500 });
    });
    const failedTouchRes = await app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      failedTouch.env as never,
    );
    expect(failedTouchRes.status).toBe(502);
    expect(await failedTouchRes.text()).toBe('PITR restore finalization failed');
  });

  it('returns 500 without finalizing when the instance nonce never changes', async () => {
    vi.useFakeTimers();
    const { env, calls } = makeFakeRoomNamespace((call) => {
      if (call.url.includes('/_do/pitr-restore')) {
        return jsonResponse({
          bookmark: 'target',
          undoBookmark: 'undo',
          nonce: 'same-instance',
        });
      }
      if (call.url.includes('/_do/ping')) {
        return jsonResponse({ nonce: 'same-instance' });
      }
      throw new Error('touch must not run');
    });
    const app = buildApp();
    const responsePromise = app.fetch(
      new Request('https://t.test/_/room/pitr-restore', {
        method: 'POST',
        body: JSON.stringify({ bookmark: 'target' }),
      }),
      env as never,
    );
    await vi.runAllTimersAsync();
    const res = await responsePromise;
    expect(res.status).toBe(500);
    expect(await res.text()).toBe('PITR restore did not restart the room');
    expect(calls.some((call) => call.url.includes('/_do/pitr-touch'))).toBe(false);
  });
});
