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

export const GET_XLSX: HttpScenario = {
  name: 'exports/get-xlsx',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/xlsx`,
  },
};

export const GET_ODS: HttpScenario = {
  name: 'exports/get-ods',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/ods`,
  },
};

/**
 * `GET /_/:room/csv.json` — the cell grid as a JSON `string[][]`
 * (legacy `JSON.parse`-able TOC body, also used by the multi-sheet
 * exporter). Deterministic for the seeded single-cell sheet, so we
 * compare with the structural `json` matcher (see normalize.ts).
 */
export const GET_CSV_JSON: HttpScenario = {
  name: 'exports/get-csv-json',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/csv.json`,
  },
};

/**
 * `GET /_/:room/fods` — flat (single-XML) ODS variant. There is no
 * structural `fods` body matcher (the union in `@ethercalc/shared` is
 * closed and the legacy `j` lib vs SheetJS serializers differ), so we
 * assert the response envelope only: 200 + the ODS MIME type + the
 * `Content-Disposition` attachment header. Body comparison is `ignore`
 * (set in normalize.ts).
 */
export const GET_FODS: HttpScenario = {
  name: 'exports/get-fods',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/fods`,
  },
};

/**
 * `GET /_/:room/md` — Markdown table export. The worker emits a GFM
 * table (documented §13 Q1 "sensible fix"), which diverges from the
 * legacy `j` lib's pipe-grid, so the body is intentionally NOT compared
 * byte-for-byte. We assert status 200 + `text/x-markdown` content-type;
 * body matcher is `ignore` (set in normalize.ts).
 */
export const GET_MD: HttpScenario = {
  name: 'exports/get-md',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/md`,
  },
};

/**
 * `GET /_/:room/cells` — full cell map as JSON (`JSON.stringify(
 * ss.sheet.cells)`). The seeded sheet holds a single `A1` text cell, so
 * the body is deterministic and compared with the `json` matcher.
 */
export const GET_CELLS: HttpScenario = {
  name: 'exports/get-cells',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/cells`,
  },
};

/**
 * `GET /_/:room/cells/:cell` — a single cell's JSON. `A1` is the seeded
 * text cell (`oracle`). Compared with the `json` matcher.
 */
export const GET_CELL_A1: HttpScenario = {
  name: 'exports/get-cell-a1',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/${ORACLE_PHASE3_EXPORT_ROOM}/cells/A1`,
  },
};

export const EXPORT_SCENARIOS: readonly HttpScenario[] = [
  GET_SNAPSHOT,
  GET_CSV,
  GET_HTML,
  GET_XLSX,
  GET_ODS,
  GET_CSV_JSON,
  GET_FODS,
  GET_MD,
  GET_CELLS,
  GET_CELL_A1,
];