import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  ORACLE_MULTI_IMPORT_ROOM,
  ORACLE_MULTI_IMPORT_XLSX_BASE64,
} from './fixtures.ts';

/**
 * Multi-sheet workbook import parity. PUT a fixed workbook (201 OK on both
 * sides), then re-export it and assert structural xlsx equivalence via the
 * zip-canonical matcher. Recorded against the legacy oracle in CI.
 */
export const PUT_MULTI_IMPORT: HttpScenario = {
  name: 'multi-import/put-xlsx',
  kind: 'http',
  request: {
    method: 'PUT',
    path: `/=${ORACLE_MULTI_IMPORT_ROOM}.xlsx`,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    bodyBase64: ORACLE_MULTI_IMPORT_XLSX_BASE64,
  },
};

export const GET_MULTI_IMPORT_EXPORT: HttpScenario = {
  name: 'multi-import/get-xlsx',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/=${ORACLE_MULTI_IMPORT_ROOM}/xlsx`,
  },
};

/** Ordered: PUT (import) must run before GET (re-export). */
export const MULTI_IMPORT_SCENARIOS: readonly HttpScenario[] = [
  PUT_MULTI_IMPORT,
  GET_MULTI_IMPORT_EXPORT,
];
