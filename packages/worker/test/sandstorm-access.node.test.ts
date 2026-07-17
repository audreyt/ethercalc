import { describe, expect, it } from 'vite-plus/test';

import {
  isSandstormEnforced,
  isSandstormMutationRoute,
  sandstormAllowsWsWrite,
  sandstormBlocksMutation,
  sandstormCanModify,
} from '../src/lib/sandstorm-access.ts';

describe('isSandstormEnforced', () => {
  it('is off unless ETHERCALC_SANDSTORM is truthy', () => {
    expect(isSandstormEnforced({})).toBe(false);
    expect(isSandstormEnforced({ ETHERCALC_SANDSTORM: '1' })).toBe(true);
    expect(isSandstormEnforced({ ETHERCALC_SANDSTORM: '0' })).toBe(false);
  });
});

describe('sandstormCanModify', () => {
  it('requires the modify permission token', () => {
    expect(
      sandstormCanModify(
        new Headers({ 'X-Sandstorm-Permissions': 'modify' }),
      ),
    ).toBe(true);
    expect(
      sandstormCanModify(
        new Headers({ 'X-Sandstorm-Permissions': 'edit,modify' }),
      ),
    ).toBe(true);
    expect(sandstormCanModify(new Headers())).toBe(false);
    expect(
      sandstormCanModify(new Headers({ 'X-Sandstorm-Permissions': '' })),
    ).toBe(false);
  });
});

describe('isSandstormMutationRoute', () => {
  it('covers HTTP and room-minting GET paths', () => {
    expect(isSandstormMutationRoute('DELETE', '/anything')).toBe(true);
    expect(isSandstormMutationRoute('POST', '/_')).toBe(true);
    expect(isSandstormMutationRoute('POST', '/_/room')).toBe(true);
    expect(isSandstormMutationRoute('PUT', '/_/room')).toBe(true);
    expect(isSandstormMutationRoute('GET', '/_new')).toBe(true);
    expect(isSandstormMutationRoute('GET', '/_from/t')).toBe(true);
    expect(isSandstormMutationRoute('GET', '/_/room')).toBe(false);
    expect(isSandstormMutationRoute('PATCH', '/_/room')).toBe(false);
  });
});

describe('sandstormBlocksMutation', () => {
  it('blocks viewers on write routes only', () => {
    const env = { ETHERCALC_SANDSTORM: '1' };
    const viewer = new Headers();
    const editor = new Headers({ 'X-Sandstorm-Permissions': 'modify' });
    expect(sandstormBlocksMutation(env, 'POST', '/_/x', viewer)).toBe(true);
    expect(sandstormBlocksMutation(env, 'POST', '/_/x', editor)).toBe(false);
    expect(sandstormBlocksMutation({}, 'POST', '/_/x', viewer)).toBe(false);
    expect(sandstormBlocksMutation(env, 'GET', '/_/x', viewer)).toBe(false);
  });
});

describe('sandstormAllowsWsWrite', () => {
  it('requires handshake modify when sandstorm is enforced', () => {
    const env = { ETHERCALC_SANDSTORM: '1' };
    expect(sandstormAllowsWsWrite(env, true)).toBe(true);
    expect(sandstormAllowsWsWrite(env, false)).toBe(false);
    expect(sandstormAllowsWsWrite({}, false)).toBe(true);
  });
});