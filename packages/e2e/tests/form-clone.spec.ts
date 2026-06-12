/**
 * `GET /:template/form` clones the template snapshot into a new room and
 * 302-redirects to `/<template>_<id>/app` (legacy main.ls:287-293).
 */
import { test, expect } from '../src/fixtures.ts';

const ROOM_SUFFIX = /[0-9a-z]{12}/;

test.describe('/:template/form clone redirect', () => {
  test('GET /:template/form → 302 /<template>_<id>/app after seeding template', async ({
    workerBase,
    request,
  }) => {
    const template = 'e2e-form-template';
    const seed = [
      'SocialCalcSpreadsheetControlSave',
      'version:1.5',
      'part:sheet',
      'sheet:',
      'cell:A1:t:tpl-seed:1',
      'end',
    ].join('\n');

    const put = await request.put(`${workerBase}/_/${template}`, {
      headers: { 'Content-Type': 'text/plain' },
      data: seed,
    });
    expect(put.status()).toBe(201);

    const res = await request.get(`${workerBase}/${template}/form`, {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(302);
    const loc = res.headers()['location'] ?? '';
    expect(loc).toMatch(
      new RegExp(`^/${template}_${ROOM_SUFFIX.source}/app$`),
    );

    const newRoom = loc.match(/^\/([^/]+)\/app$/)?.[1] ?? '';
    expect(newRoom.length).toBeGreaterThan(0);
    const snap = await request.get(`${workerBase}/_/${newRoom}`);
    expect(snap.status()).toBe(200);
    const body = await snap.text();
    expect(body).toContain('tpl-seed');
  });
});