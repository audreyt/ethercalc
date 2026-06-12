import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  MINIMAL_SCSAVE,
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

/** POST + DELETE — run after exports and form redirect. */
export const ROOM_CRUD_TEARDOWN_SCENARIOS: readonly HttpScenario[] = [
  POST_COMMAND,
  DELETE_EXPORT_ROOM,
  DELETE_TEMPLATE_ROOM,
];

export const ROOM_CRUD_SCENARIOS: readonly HttpScenario[] = [
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];