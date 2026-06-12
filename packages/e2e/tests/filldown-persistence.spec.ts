/**
 * Fill-down commands replayed server-side must increment values, not
 * flatten to the first cell (#314, #564, #769).
 */
import { test, expect } from '../src/fixtures.ts';

test.describe('filldown persistence via HTTP', () => {
  test('POST filldown commands export incremented series', async ({
    workerBase,
    request,
  }) => {
    const room = 'e2e-filldown';
    for (const cmd of [
      'set A1 value n 1',
      'set A2 value n 2',
      'filldown A1:A5 all',
      'recalc',
    ]) {
      const r = await request.post(`${workerBase}/_/${room}`, {
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ command: cmd }),
      });
      expect(r.status()).toBe(202);
    }

    const csv = await request.get(`${workerBase}/_/${room}/csv`);
    expect(csv.status()).toBe(200);
    const lines = (await csv.text()).trim().split('\n');
    expect(lines).toEqual(['1', '2', '3', '4', '5']);
  });
});