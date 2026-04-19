/**
 * Spreadsheet binary exporters — xlsx / ods / fods.
 *
 * We use SheetJS (`xlsx` npm package) rather than the legacy `j` lib:
 *   - `xlsx` publishes a pure-JS ESM entry (`xlsx.mjs`) that works under
 *     workerd with `nodejs_compat` (verified via the workers-pool
 *     integration tests in `test/exports.test.ts`).
 *   - `j` depends on Node `Buffer` and has stale transitive deps that break
 *     in modern environments (§7 item 3).
 *
 * Pipeline:
 *   csvText  →  parseCSV  →  string[][]  →  XLSX.utils.aoa_to_sheet
 *   →  XLSX.utils.book_new + book_append_sheet (name: "Sheet1")
 *   →  XLSX.write({ bookType, type: 'array' }) → Uint8Array.
 *
 * The CSV intermediate is the same one SocialCalc emits for `exportCSV`, so
 * every value that survived SocialCalc survives here. Purely numeric cells
 * become JS numbers (SheetJS infers type from the AOA); everything else is
 * left as a string, which is how the legacy `j` pipeline also treated
 * non-numeric cells (it re-parsed the text-based intermediate anyway).
 *
 * Multi-sheet export (`GET /_/=:room/xlsx` from §6.1) is scoped out for
 * Phase 8 — the TOC-driven multi-sheet dispatcher lands in Phase 8.1. For
 * now, callers that hit the multi-sheet path get a 501 from the HTTP route
 * layer; this module only needs to support the single-sheet case.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// xlsx ships its own d.ts. We reach through `any` rather than importing
// the individual typed symbols because the public ESM surface we use
// (aoa_to_sheet + book_new + book_append_sheet + write) is typed more
// liberally in the library than what we actually hit.
import * as XLSX from 'xlsx';

import { parseCSV } from './csv-parse.ts';

/** Binary workbook formats we support (single-sheet for Phase 8). */
export type BinaryFormat = 'xlsx' | 'ods' | 'fods';

/**
 * Convert a CSV string (typically from `socialcalc.exportCSV()`) to a binary
 * workbook in the requested format. Returns a freshly-allocated Uint8Array.
 */
export function csvToBinaryWorkbook(csv: string, format: BinaryFormat): Uint8Array {
  const grid = parseCSV(csv);
  // SheetJS requires at least one row/cell to infer dimensions; an empty
  // export produces a minimal 1x1 blank sheet so the output is a valid file
  // readers won't reject. Matches the legacy behavior of `j` which emitted
  // an empty-but-valid Sheet1 for an empty room.
  const aoa: unknown[][] = grid.length === 0 ? [['']] : coerceNumericCells(grid);
  const sheet = (XLSX as any).utils.aoa_to_sheet(aoa);
  const book = (XLSX as any).utils.book_new();
  (XLSX as any).utils.book_append_sheet(book, sheet, 'Sheet1');
  const out = (XLSX as any).write(book, {
    bookType: format,
    type: 'array',
    compression: true,
  });
  return new Uint8Array(out as ArrayBufferLike);
}

/**
 * SheetJS infers cell types from JS values — strings stay strings, numbers
 * stay numbers. SocialCalc's CSV output is all strings; to get "real" numeric
 * cells in the output .xlsx (so SUM etc still work in Excel) we coerce values
 * that parse cleanly as numbers.
 *
 * Coercion rules:
 *   - A value matching `/^-?\d+(\.\d+)?$/` becomes a JS number.
 *   - Everything else (including `""`) stays as a string.
 *
 * This matches the legacy `j` lib's behavior: it also looked at the text
 * intermediate and promoted decimal strings to numbers.
 */
function coerceNumericCells(grid: readonly (readonly string[])[]): unknown[][] {
  const out: unknown[][] = [];
  for (const row of grid) {
    const cells: unknown[] = [];
    for (const value of row) {
      if (value === '') {
        cells.push('');
      } else if (/^-?\d+(\.\d+)?$/.test(value)) {
        cells.push(Number(value));
      } else {
        cells.push(value);
      }
    }
    out.push(cells);
  }
  return out;
}

/** MIME type table for the binary formats. Re-exported for the route layer. */
export const BINARY_CONTENT_TYPES: Readonly<Record<BinaryFormat, string>> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  // fods is the flat (single-XML) ODS variant; same MIME type legally.
  fods: 'application/vnd.oasis.opendocument.spreadsheet',
};
