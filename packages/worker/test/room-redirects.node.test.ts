import { describe, it, expect } from 'vite-plus/test';

import { buildRoomRedirect } from '../src/handlers/room-redirects.ts';

describe('buildRoomRedirect — edit/view/app', () => {
  it('edit under no-KEY uses identity hmac (room passthrough)', async () => {
    const r = await buildRoomRedirect({ room: 'some-room', mode: 'edit' });
    // Matches oracle recording misc/get-edit-no-key-redirect.
    expect(r).toEqual({
      status: 302,
      headers: { Location: '/some-room?auth=some-room' },
    });
  });

  it('view under no-KEY appends &view=1 with identity auth', async () => {
    const r = await buildRoomRedirect({ room: 'some-room', mode: 'view' });
    expect(r?.headers.Location).toBe('/some-room?auth=some-room&view=1');
  });

  it('app under no-KEY appends &app=1 with identity auth', async () => {
    const r = await buildRoomRedirect({ room: 'some-room', mode: 'app' });
    expect(r?.headers.Location).toBe('/some-room?auth=some-room&app=1');
  });

  it('edit under KEY requires an authorized capability', async () => {
    const r = await buildRoomRedirect({ room: 'room', mode: 'edit', key: 'secret' });
    expect(r?.headers.Location).toBe('/room?auth=0&view=1');
    const authorized = await buildRoomRedirect({
      room: 'room', mode: 'edit', key: 'secret', authorizedAuth: 'valid-token',
    });
    expect(authorized?.headers.Location).toBe('/room?auth=valid-token');
  });

  it('view under KEY uses a read-only token', async () => {
    const r = await buildRoomRedirect({ room: 'room', mode: 'view', key: 'secret' });
    expect(r?.headers.Location).toBe('/room?auth=0&view=1');
  });

  it('app under KEY uses a read-only token unless authorized', async () => {
    const r = await buildRoomRedirect({ room: 'room', mode: 'app', key: 'secret' });
    expect(r?.headers.Location).toBe('/room?auth=0&app=1');
    const authorized = await buildRoomRedirect({
      room: 'room', mode: 'app', key: 'secret', authorizedAuth: 'valid-token',
    });
    expect(authorized?.headers.Location).toBe('/room?auth=valid-token&app=1');
  });

  it('honors basepath', async () => {
    const r = await buildRoomRedirect({
      basepath: '/ec',
      room: 'some-room',
      mode: 'edit',
    });
    expect(r?.headers.Location).toBe('/ec/some-room?auth=some-room');
  });

  it('encodes non-ASCII room names before hmacing', async () => {
    // encodeURI turns 試 into %E8%A9%A6. Both the URL and the hmac input
    // use the encoded form so storage keys stay byte-identical.
    const r = await buildRoomRedirect({ room: '試', mode: 'edit' });
    expect(r?.headers.Location).toBe('/%E8%A9%A6?auth=%25E8%25A9%25A6');
  });

  it('keeps reserved path characters inside the room segment', async () => {
    const r = await buildRoomRedirect({ room: '/other.test#', mode: 'view' });
    expect(r?.headers.Location).toBe('/%2Fother.test%23?auth=%2Fother.test%23&view=1');
  });
});

describe('buildRoomRedirect — entry page (/:room)', () => {
  it('returns null (serve index) when no key', async () => {
    expect(await buildRoomRedirect({ room: 'r', mode: 'entry' })).toBeNull();
  });

  it('returns null (serve index) when key set and auth query present', async () => {
    const r = await buildRoomRedirect({
      room: 'r',
      mode: 'entry',
      key: 'k',
      authQuery: 'abc',
    });
    expect(r).toBeNull();
  });

  it('redirects to ?auth=0 when key set and auth query missing', async () => {
    const r = await buildRoomRedirect({ room: 'r', mode: 'entry', key: 'k' });
    expect(r).toEqual({ status: 302, headers: { Location: '/r?auth=0' } });
  });

  it('redirects to ?auth=0 when key set and auth query is empty string', async () => {
    const r = await buildRoomRedirect({
      room: 'r',
      mode: 'entry',
      key: 'k',
      authQuery: '',
    });
    expect(r?.headers.Location).toBe('/r?auth=0');
  });

  it('returns null (serve index) when key is empty string', async () => {
    // computeAuth treats empty string as no-key; entry mode mirrors that.
    const r = await buildRoomRedirect({ room: 'r', mode: 'entry', key: '' });
    expect(r).toBeNull();
  });
});
