import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

/**
 * Room-index scenarios — `/_rooms`, `/_roomlinks`, `/_roomtimes`.
 *
 * On a fresh oracle (no rooms created) `_rooms` and `_roomtimes`
 * return empty JSON containers (array / object) and `_roomlinks`
 * returns an empty array serialized as HTML (preserving the legacy
 * bug where the handler sets `Content-Type: text/html` but writes
 * JSON — see CLAUDE.md §6.1 "Behaviors requiring bug-for-bug
 * preservation"). These only hold while Redis is empty; record.ts's
 * orchestrator is responsible for not creating rooms before hitting
 * these paths.
 */

export const GET_ROOMS_EMPTY: HttpScenario = {
  name: 'rooms-index/get-rooms-empty',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_rooms',
  },
};

export const GET_ROOMLINKS_EMPTY: HttpScenario = {
  name: 'rooms-index/get-roomlinks-empty',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_roomlinks',
  },
};

export const GET_ROOMTIMES_EMPTY: HttpScenario = {
  name: 'rooms-index/get-roomtimes-empty',
  kind: 'http',
  request: {
    method: 'GET',
    path: '/_roomtimes',
  },
};

export const ROOMS_INDEX_SCENARIOS: readonly HttpScenario[] = [
  GET_ROOMS_EMPTY,
  GET_ROOMLINKS_EMPTY,
  GET_ROOMTIMES_EMPTY,
];
