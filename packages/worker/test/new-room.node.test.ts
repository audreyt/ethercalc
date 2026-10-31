import { describe, it, expect } from 'vite-plus/test';

import { buildNewRoomRedirect } from '../src/handlers/new-room.ts';
import { computeAuth } from '../src/lib/auth.ts';

describe('buildNewRoomRedirect', () => {
  const fixedId = () => 'b2wgtc1rmuqu';

  it('redirects to a fresh single-sheet room without a key', async () => {
    const r = await buildNewRoomRedirect({ multi: false, idGen: fixedId });
    expect(r).toEqual({ status: 302, headers: { Location: '/b2wgtc1rmuqu' } });
  });

  it('delivers the edit capability for a newly generated room', async () => {
    const key = 'secret';
    const r = await buildNewRoomRedirect({ key, multi: false, idGen: fixedId });
    expect(r.headers.Location).toBe(`/b2wgtc1rmuqu?auth=${await computeAuth(key, 'b2wgtc1rmuqu')}`);
  });

  it('handles the multi-sheet prefix in both modes', async () => {
    const plain = await buildNewRoomRedirect({ multi: true, idGen: fixedId });
    expect(plain.headers.Location).toBe('/=b2wgtc1rmuqu');
    const keyed = await buildNewRoomRedirect({ key: 'secret', multi: true, idGen: fixedId });
    expect(keyed.headers.Location).toBe(`/=b2wgtc1rmuqu?auth=${await computeAuth('secret', '=b2wgtc1rmuqu')}`);
  });

  it('honors the basepath prefix', async () => {
    const r = await buildNewRoomRedirect({
      basepath: '/ec', multi: false, idGen: fixedId,
    });
    expect(r.headers.Location).toBe('/ec/b2wgtc1rmuqu');
  });

  it('uses a generated id when none is supplied', async () => {
    const r = await buildNewRoomRedirect({ multi: false });
    expect(r.headers.Location).toMatch(/^\/[0-9a-z]{12}$/);
  });
});
