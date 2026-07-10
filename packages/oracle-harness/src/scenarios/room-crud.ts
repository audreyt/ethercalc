import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  MINIMAL_SCSAVE,
  ORACLE_PHASE3_CSV_COLD_ROOM,
  ORACLE_PHASE3_EXPORT_ROOM,
  ORACLE_PHASE3_TEMPLATE_ROOM,
  requestBodyBase64,
} from './fixtures.ts';

const SCSAVE_HEADERS = {
  'Content-Type': 'text/x-socialcalc; charset=utf-8',
} as const;

/**
 * Room mutation scenarios — PUT/POST/DELETE on `/_/:room`.
 *
 * These run after the empty room-index batch and before exports so the
 * oracle's Redis holds the seeded rooms. Deletes at the end keep later
 * recording sessions from accumulating stale keys.
 */

export const PUT_TEMPLATE_ROOM: HttpScenario = {
  name: 'room-crud/put-template-room',
  kind: 'http',
  request: {
    method: 'PUT',
    path: `/_/${ORACLE_PHASE3_TEMPLATE_ROOM}`,
    headers: SCSAVE_HEADERS,
    bodyBase64: requestBodyBase64(MINIMAL_SCSAVE),
  },
};

export const PUT_EXPORT_ROOM: HttpScenario = {
  name: 'room-crud/put-export-room',
  kind: 'http',
  request: {
    method: 'PUT',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}`,
    headers: SCSAVE_HEADERS,
    bodyBase64: requestBodyBase64(MINIMAL_SCSAVE),
  },
};

export const POST_COMMAND: HttpScenario = {
  name: 'room-crud/post-command',
  kind: 'http',
  request: {
    method: 'POST',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}`,
    headers: { 'Content-Type': 'application/json' },
    bodyBase64: requestBodyBase64(
      JSON.stringify({ command: 'set B1 text t phase3' }),
    ),
  },
};

export const POST_CSV_TOC_COLD: HttpScenario = {
  name: 'room-crud/post-csv-toc-cold',
  kind: 'http',
  request: {
    method: 'POST',
    path: `/_/${ORACLE_PHASE3_CSV_COLD_ROOM}`,
    headers: { 'Content-Type': 'text/csv' },
    bodyBase64: requestBodyBase64(
      '"#url","#title"\n"/oracle-phase3-csv-cold.1","Sheet1"\n',
    ),
  },
};


export const POST_CSV_TOC: HttpScenario = {
  name: 'room-crud/post-csv-toc',
  kind: 'http',
  request: {
    method: 'POST',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}`,
    headers: { 'Content-Type': 'text/csv' },
    bodyBase64: requestBodyBase64(
      '"#url","#title"\n"/oracle-phase3-export.1","Sheet1"\n',
    ),
  },
};

export const GET_CSV_JSON_AFTER_POST: HttpScenario = {
  name: 'room-crud/get-csv-json-after-post',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/csv.json`,
  },
};

export const DELETE_CSV_TOC_COLD: HttpScenario = {
  name: 'room-crud/delete-csv-toc-cold',
  kind: 'http',
  request: {
    method: 'DELETE',
    path: `/_/${ORACLE_PHASE3_CSV_COLD_ROOM}`,
  },
};

export const DELETE_EXPORT_ROOM: HttpScenario = {
  name: 'room-crud/delete-export-room',
  kind: 'http',
  request: {
    method: 'DELETE',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}`,
  },
};

export const DELETE_TEMPLATE_ROOM: HttpScenario = {
  name: 'room-crud/delete-template-room',
  kind: 'http',
  request: {
    method: 'DELETE',
    path: `/_/${ORACLE_PHASE3_TEMPLATE_ROOM}`,
  },
};

/** PUT pair — run after empty room-index scenarios. */
export const ROOM_CRUD_SETUP_SCENARIOS: readonly HttpScenario[] = [
  PUT_TEMPLATE_ROOM,
  PUT_EXPORT_ROOM,
];

/** POST CSV + GET + DELETE — run after exports and form redirect. */
export const ROOM_CRUD_TEARDOWN_SCENARIOS: readonly HttpScenario[] = [
  POST_COMMAND,
  POST_CSV_TOC_COLD,
  POST_CSV_TOC,
  GET_CSV_JSON_AFTER_POST,
  DELETE_CSV_TOC_COLD,
  DELETE_EXPORT_ROOM,
  DELETE_TEMPLATE_ROOM,
];

export const ROOM_CRUD_SCENARIOS: readonly HttpScenario[] = [
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];