import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vite-plus/test';

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';

/**
 * Integration tests for Phase 4 stateless routes. Runs inside workerd
 * via `@cloudflare/vitest-pool-workers`; no coverage gate (AGENTS.md §5.2).
 * Every branch asserted here is independently covered by the sibling
 * `*.node.test.ts` files against the pure-logic builders.
 */

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { redirect: 'manual', ...init });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

async function initializePrivateRoom(name: string): Promise<void> {
  const workerEnv = env as unknown as Env;
  const stub = workerEnv.ROOM.get(workerEnv.ROOM.idFromName(name));
  await stub.fetch(`https://do.local/_do/all?name=${name}`, {
    method: 'DELETE',
    headers: { 'X-EC-Uid': 'uid-owner' },
  });
  const res = await stub.fetch(`https://do.local/_do/init-private?name=${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-EC-Uid': 'uid-owner',
    },
    body: JSON.stringify({
      snapshot: '',
      acl: { owner: 'uid-owner', readers: [], writers: [] },
    }),
  });
  expect(res.status).toBe(201);
}

describe('GET /_new', () => {
  it('302s to a 12-char room id (no KEY)', async () => {
    const res = await call('/_new');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/^\/[0-9a-z]{12}$/);
  });
});

describe('GET /=_new', () => {
  it('302s to /=<room> prefix (no KEY)', async () => {
    const res = await call('/=_new');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toMatch(/^\/=[0-9a-z]{12}$/);
  });
});

describe('GET /:room/edit', () => {
  it('302s to /:room?auth=<room> under identity HMAC (no KEY)', async () => {
    const res = await call('/some-room/edit');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/some-room?auth=some-room');
  });
});

describe('private-room entry admission', () => {
  it('routes an anonymous edit entry to the viewer without a redirect loop', async () => {
    const room = 'private-entry-admission';
    await initializePrivateRoom(room);

    const edit = await call(`/${room}/edit`);
    expect(edit.status).toBe(302);
    expect(edit.headers.get('Location')).toBe(`/${room}/view`);

    const view = await call(edit.headers.get('Location')!);
    expect(view.status).toBe(302);
    expect(view.headers.get('Location')).toBe(`/${room}?auth=${room}&view=1`);

    const terminal = await call(view.headers.get('Location')!);
    expect(terminal.status).toBe(200);

    const direct = await call(`/${room}?auth=${room}`);
    expect(direct.status).toBe(302);
    expect(direct.headers.get('Location')).toBe(`/${room}/view`);

    const app = await call(`/${room}?auth=${room}&app=1`);
    expect(app.status).toBe(302);
    expect(app.headers.get('Location')).toBe(`/${room}/view`);
  });
});

describe('GET /:room/view', () => {
  it('302s with &view=1', async () => {
    const res = await call('/some-room/view');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/some-room?auth=some-room&view=1');
  });
});

describe('GET /:room/app', () => {
  it('302s with &app=1', async () => {
    const res = await call('/some-room/app');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/some-room?auth=some-room&app=1');
  });
});

describe('GET /etc/*, /var/*', () => {
  it('/etc/foo returns 404 with empty body and text/html', async () => {
    const res = await call('/etc/foo');
    expect(res.status).toBe(404);
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(await res.text()).toBe('');
  });

  it('/var/foo returns 404 with empty body', async () => {
    const res = await call('/var/foo');
    expect(res.status).toBe(404);
    expect(await res.text()).toBe('');
  });

  it('/etc/deeply/nested still 404s (glob match)', async () => {
    const res = await call('/etc/path/to/secret');
    expect(res.status).toBe(404);
  });
});

describe('GET /_health (regression)', () => {
  it('continues to work', async () => {
    const res = await call('/_health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});
