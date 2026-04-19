import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * Static-asset scenarios — CLAUDE.md §6.1 rows for `/`, `/_start`,
 * `/static/socialcalc.js`, and the icon family. These don't touch
 * Redis, never mutate state, and don't embed timestamps, so they're
 * safe candidates for the first recording batch.
 */

export const GET_ROOT: HttpScenario = {
  name: 'static/get-root-index',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/',
  },
};

export const GET_START: HttpScenario = {
  name: 'static/get-start',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_start',
  },
};

export const GET_FAVICON: HttpScenario = {
  name: 'static/get-favicon',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/favicon.ico',
  },
};

export const GET_SOCIALCALC_JS: HttpScenario = {
  name: 'static/get-socialcalc-js',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/static/socialcalc.js',
  },
};

export const STATIC_SCENARIOS: readonly HttpScenario[] = [
  GET_ROOT,
  GET_START,
  GET_FAVICON,
  GET_SOCIALCALC_JS,
];
