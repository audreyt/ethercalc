import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * Miscellaneous stateless scenarios — explicit 404 blocks (`/etc/*`,
 * `/var/*`), the unknown-room probes (`/_exists/<random>`), and
 * redirect paths (`/_new`, `/<room>/edit` without KEY, `/<room>/view`).
 *
 * These all either (a) take no state, or (b) probe for missing state
 * and get a fast "no" — both safe to record multiple times without
 * contaminating the oracle's Redis.
 */

export const GET_ETC_BLOCK: HttpScenario = {
  name: 'misc/get-etc-foo-404',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/etc/foo',
  },
};

export const GET_VAR_BLOCK: HttpScenario = {
  name: 'misc/get-var-foo-404',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/var/foo',
  },
};

export const GET_EXISTS_UNKNOWN: HttpScenario = {
  name: 'misc/get-exists-unknown-room',
  kind: 'http',
  request: {
    // A random-enough path that the oracle's Redis never has an entry.
    method: 'GET',
    path: '/_exists/oracle-probe-never-created-room-xyzzy',
  },
};

/**
 * `/_new` allocates a UUID and redirects. The path portion of the
 * Location header is non-deterministic (UUID-derived) so we match it
 * with a regex on the header and ignore the redirect body.
 */
export const GET_NEW_REDIRECT: HttpScenario = {
  name: 'misc/get-new-redirect',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_new',
  },
};

/**
 * `/<room>/edit` without a server KEY set redirects straight to
 * `/<room>?auth=<room>` (hmac is identity when KEY is unset — see
 * `main.ls:23`). Room name is stable across runs here because we
 * supply it.
 */
export const GET_EDIT_NO_KEY: HttpScenario = {
  name: 'misc/get-edit-no-key-redirect',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/some-room/edit',
  },
};

export const GET_VIEW_NO_KEY: HttpScenario = {
  name: 'misc/get-view-no-key-redirect',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/some-room/view',
  },
};

export const MISC_SCENARIOS: readonly HttpScenario[] = [
  GET_ETC_BLOCK,
  GET_VAR_BLOCK,
  GET_EXISTS_UNKNOWN,
  GET_NEW_REDIRECT,
  GET_EDIT_NO_KEY,
  GET_VIEW_NO_KEY,
];
