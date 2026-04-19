/**
 * `GET /etc/*` and `GET /var/*` — blocked paths preserved from legacy
 * Express. Both 404 with empty body and `text/html; charset=utf-8`
 * (Express's default). Catches the case where an accidental catch-all
 * route would have fallen through to `/:room` or Workers Assets.
 */
import { test, expect } from '../src/fixtures.ts';

test.describe('blocked paths', () => {
  for (const path of ['/etc/foo', '/var/foo', '/etc/passwd', '/var/log/secret']) {
    test(`GET ${path} → 404 empty`, async ({ workerBase, request }) => {
      const res = await request.get(`${workerBase}${path}`);
      expect(res.status()).toBe(404);
      expect(res.headers()['content-type'] ?? '').toBe(
        'text/html; charset=utf-8',
      );
      expect(await res.text()).toBe('');
    });
  }
});
