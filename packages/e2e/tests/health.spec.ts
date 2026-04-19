/**
 * `GET /_health` — the smallest possible sign-of-life for the Worker.
 * Proves wrangler dev is up, Hono is routing, and the Env binding shape
 * is intact (Phase 2 scaffold). Kept deliberately trivial so a future
 * wrangler/Miniflare upgrade regression lights it up first.
 */
import { test, expect } from '../src/fixtures.ts';

test.describe('/_health', () => {
  test('returns JSON with status=ok, version, and ISO now', async ({
    workerBase,
    request,
  }) => {
    const res = await request.get(`${workerBase}/_health`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type'] ?? '').toContain('application/json');
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.version).toBe('string');
    expect(typeof body.now).toBe('string');
    // ISO-8601 with millisecond precision and a Z suffix
    expect(body.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
