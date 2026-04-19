/**
 * `GET /_new` (single-sheet) and `GET /=_new` (multi-sheet) both 302 to a
 * freshly-minted room id. Verifies:
 *   - status 302
 *   - Location header shape: `/<12-char-alnum>` or `/=<12-char-alnum>`
 *   - room id differs between invocations (RNG is actually random)
 *
 * Identity-HMAC mode (no ETHERCALC_KEY set in dev) is in effect here, so
 * there is no `/edit` suffix on the Location URL — see CLAUDE.md §6.4.
 */
import { test, expect } from '../src/fixtures.ts';

const ROOM_ID = /[0-9a-z]{12}/;

test.describe('/_new redirects', () => {
  test('GET /_new → 302 /<room>', async ({ workerBase, request }) => {
    const res = await request.get(`${workerBase}/_new`, { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    const loc = res.headers()['location'] ?? '';
    expect(loc).toMatch(new RegExp(`^/${ROOM_ID.source}$`));
  });

  test('GET /=_new → 302 /=<room>', async ({ workerBase, request }) => {
    const res = await request.get(`${workerBase}/=_new`, { maxRedirects: 0 });
    expect(res.status()).toBe(302);
    const loc = res.headers()['location'] ?? '';
    expect(loc).toMatch(new RegExp(`^/=${ROOM_ID.source}$`));
  });

  test('successive /_new calls return different rooms', async ({
    workerBase,
    request,
  }) => {
    const a = await request.get(`${workerBase}/_new`, { maxRedirects: 0 });
    const b = await request.get(`${workerBase}/_new`, { maxRedirects: 0 });
    expect(a.headers()['location']).not.toBe(b.headers()['location']);
  });

  test('GET /:room/edit → 302 with ?auth=<room> (identity HMAC)', async ({
    workerBase,
    request,
  }) => {
    const res = await request.get(`${workerBase}/demo-room/edit`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    // Under identity HMAC the auth value equals the room name.
    expect(res.headers()['location']).toBe('/demo-room?auth=demo-room');
  });
});
