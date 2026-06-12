import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import { ORACLE_PHASE3_EXPORT_ROOM } from './fixtures.ts';

/**
 * Export scenarios for a room seeded by `room-crud/put-export-room`.
 * Run after the PUT and before POST/DELETE so the snapshot is stable.
 */

export const GET_SNAPSHOT: HttpScenario = {
  name: 'exports/get-snapshot',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}`,
  },
};

export const GET_CSV: HttpScenario = {
  name: 'exports/get-csv',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/csv`,
  },
};

export const GET_HTML: HttpScenario = {
  name: 'exports/get-html',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/html`,
  },
};

export const EXPORT_SCENARIOS: readonly HttpScenario[] = [
  GET_SNAPSHOT,
  GET_CSV,
  GET_HTML,
];