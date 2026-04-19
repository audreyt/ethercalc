import { describe, it, expect } from 'vitest';

import { buildNewRoomRedirect } from '../src/handlers/new-room.ts';

describe('buildNewRoomRedirect', () => {
  const fixedId = () => 'b2wgtc1rmuqu';

  it('redirects to /<room> when no key, single-sheet', () => {
    const r = buildNewRoomRedirect({ hasKey: false, multi: false, idGen: fixedId });
    expect(r).toEqual({ status: 302, headers: { Location: '/b2wgtc1rmuqu' } });
  });

  it('redirects to /<room>/edit when key is set', () => {
    const r = buildNewRoomRedirect({ hasKey: true, multi: false, idGen: fixedId });
    expect(r.headers.Location).toBe('/b2wgtc1rmuqu/edit');
  });

  it('redirects to /=<room> for multi-sheet, no key', () => {
    const r = buildNewRoomRedirect({ hasKey: false, multi: true, idGen: fixedId });
    expect(r.headers.Location).toBe('/=b2wgtc1rmuqu');
  });

  it('redirects to /=<room>/edit for multi-sheet with key', () => {
    const r = buildNewRoomRedirect({ hasKey: true, multi: true, idGen: fixedId });
    expect(r.headers.Location).toBe('/=b2wgtc1rmuqu/edit');
  });

  it('honors basepath prefix', () => {
    const r = buildNewRoomRedirect({
      basepath: '/ec',
      hasKey: false,
      multi: false,
      idGen: fixedId,
    });
    expect(r.headers.Location).toBe('/ec/b2wgtc1rmuqu');
  });

  it('defaults idGen to generateRoomId when not injected', () => {
    const r = buildNewRoomRedirect({ hasKey: false, multi: false });
    expect(r.headers.Location).toMatch(/^\/[0-9a-z]{12}$/);
  });

  it('defaults basepath to empty string', () => {
    const r = buildNewRoomRedirect({ hasKey: true, multi: true, idGen: fixedId });
    expect(r.headers.Location).toBe('/=b2wgtc1rmuqu/edit');
  });
});
