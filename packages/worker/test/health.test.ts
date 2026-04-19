import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import worker from '../src/index.ts';

describe('GET /_health (integration via Hono on workerd)', () => {
  it('serves the health body as JSON', async () => {
    const req = new Request('https://example.test/_health');
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env as never, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/application\/json/);
    const body = (await res.json()) as { status: string; version: string; now: string };
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.0.0');
    expect(new Date(body.now).toISOString()).toBe(body.now);
  });
});
