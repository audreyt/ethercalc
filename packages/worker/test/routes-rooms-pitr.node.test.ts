import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import type { Env } from '../src/env.ts';
import { buildApp } from '../src/index.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly bodyText?: string;
}

interface FakeStub {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}

type Responder = (call: Call) => Response | Promise<Response>;

const OPERATOR_TOKEN = 'operator-token';

function makeFakeRoomNamespace(
  responder: Responder,
  operatorToken: string | null = OPERATOR_TOKEN,
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
    ...(operatorToken === null
      ? {}
      : { ETHERCALC_MIGRATE_TOKEN: operatorToken }),
  };
  return { env, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function pitrRequest(
  body: unknown,
  authorization: string | null = `Bearer ${OPERATOR_TOKEN}`,
): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authorization !== null) headers.set('Authorization', authorization);
  return new Request('https://t.test/_/room/pitr-restore', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /_/:room/pitr-restore', () => {
  it('hides the endpoint before parsing when the operator token is unset', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    }, null);
    const app = buildApp();
    const res = await app.fetch(pitrRequest('{'), env as never);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('Not Found');
    expect(calls).toHaveLength(0);
  });

  it('rejects missing and incorrect operator bearer tokens before parsing', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    });
    const app = buildApp();
    for (const authorization of [null, 'Bearer wrong']) {
      const res = await app.fetch(
        pitrRequest({ bookmark: 'target' }, authorization),
        env as never,
      );
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Unauthorized');
    }
    expect(calls).toHaveLength(0);
  });

  it('returns 400 for malformed JSON without touching the DO', async () => {
    const { env, calls } = makeFakeRoomNamespace(() => {
      throw new Error('must not dispatch');
    });
    const app = buildApp();
    const res = await app.fetch(
      pitrRequest('{'),
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
      pitrRequest({ bookmark: 'target', at: 1 }),
      env as never,
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toBe('send exactly one of {bookmark} or {at}');
    expect(calls).toHaveLength(0);
  });

  it('normalizes and dispatches a timestamp dry run under operator auth', async () => {
    const { env, calls } = makeFakeRoomNamespace(() =>
      jsonResponse({ dryRun: true, bookmark: 'resolved' }),
    );
    const app = buildApp();
    const res = await app.fetch(
      pitrRequest({ at: '2026-07-10T00:00:00.000Z', dryRun: true }),
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
      pitrRequest({ bookmark: 'target', dryRun: true }),
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
      pitrRequest({ bookmark: 'target' }),
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
      pitrRequest({ bookmark: 'target' }),
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
      pitrRequest({ bookmark: 'before-creation' }),
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

  it('keeps the undo bookmark on failed finalization after acceptance', async () => {
    const malformed = makeFakeRoomNamespace(() => jsonResponse({ bookmark: 'target' }));
    const app = buildApp();
    const malformedRes = await app.fetch(
      pitrRequest({ bookmark: 'target' }),
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
      pitrRequest({ bookmark: 'target' }),
      failedTouch.env as never,
    );
    expect(failedTouchRes.status).toBe(502);
    expect(failedTouchRes.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    expect(await failedTouchRes.json()).toEqual({
      accepted: true,
      bookmark: 'target',
      undoBookmark: 'undo',
      error: 'PITR restore finalization failed',
    });
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
      pitrRequest({ bookmark: 'target' }),
      env as never,
    );
    await vi.runAllTimersAsync();
    const res = await responsePromise;
    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    expect(await res.json()).toEqual({
      accepted: true,
      bookmark: 'target',
      undoBookmark: 'undo',
      error: 'PITR restore did not restart the room',
    });
    expect(calls.some((call) => call.url.includes('/_do/pitr-touch'))).toBe(false);
  });
});
