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
 * Single-sheet pipeline:
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
 * Multi-sheet pipeline (Phase 8.1):
 *   - `buildMultiSheetWorkbook`: an array of `{name, csv}` → one sheet per
 *     entry, names passed through `sanitizeSheetName` so SheetJS accepts
 *     them (31-char cap + `:\/?*[]` forbidden + unique).
 *   - `parseMultiSheetWorkbook`: inverse; bytes → array of `{name, csv}`
 *     keyed by the original SheetNames order. Used by `PUT /=:room.xlsx`.
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

// ─── Multi-sheet helpers (Phase 8.1) ──────────────────────────────────────
//
// Multi-sheet rooms (prefix `=`) in legacy EtherCalc are a TOC sheet whose
// rows are `<url>,<title>` pairs pointing at sub-sheet rooms. The TOC is
// itself a SocialCalc save. For export we:
//   1. fetch the TOC's CSV + each sub-room's CSV save;
//   2. feed them into SheetJS as a multi-sheet workbook with one worksheet
//      per sub-sheet (the TOC itself is NOT exported — it's an internal
//      routing artifact);
//   3. serialize to xlsx/ods/fods bytes.
//
// For import we run the pipeline in reverse — split the workbook into one
// CSV per sheet, give each one to `csvToSave` in the caller (that lives in
// `@ethercalc/socialcalc-headless` and isn't a dependency of this pure
// lib), and PUT the saves into individual sub-room DOs.

/**
 * Sanitize a sheet name so SheetJS `book_append_sheet` accepts it.
 *
 * Rules (from SheetJS's `check_ws_name`):
 *   - must not exceed 31 characters;
 *   - must not contain any of `:`, `\`, `/`, `?`, `*`, `[`, `]`;
 *   - must be unique within the workbook.
 *
 * Strategy:
 *   - replace every forbidden character with `_`;
 *   - if the result is empty, fall back to `Sheet`;
 *   - truncate to 31 characters;
 *   - deduplicate by appending ` (n)` (legacy spreadsheet convention,
 *     same as Excel's own save-as dedupe) — truncating again if that
 *     suffix pushes the length past 31.
 *
 * The dedupe logic reserves room for the ` (n)` suffix by shortening the
 * base before appending. We only bump `n` up to the number of existing
 * sheets — guaranteed to terminate because each new candidate gets a
 * different suffix.
 */
export function sanitizeSheetName(
  raw: string,
  existing: readonly string[] = [],
): string {
  // SheetJS forbids: : \ / ? * [ ]
  const replaced = raw.replace(/[:\\/?*[\]]/g, '_');
  const base = replaced.length === 0 ? 'Sheet' : replaced;
  const truncated = base.length > 31 ? base.slice(0, 31) : base;
  if (!existing.includes(truncated)) return truncated;

  // Dedupe: append " (n)". The suffix width (including the space + parens)
  // is 3 + log10(n); we conservatively keep the first 27 chars of the base
  // so we can fit " (n)" up through n=999 under the 31-char cap. The loop
  // must find a free candidate within `existing.length + 1` iterations
  // (pigeonhole); the while(true) avoids an unreachable loop-exit branch.
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const suffix = ` (${n})`;
    const budget = 31 - suffix.length;
    const candidate = truncated.slice(0, budget) + suffix;
    if (!existing.includes(candidate)) return candidate;
    n++;
  }
}

/**
 * Build a multi-sheet workbook from an array of `{name, csv}` entries.
 *
 * Sheet names are sanitized via `sanitizeSheetName` so SheetJS accepts them
 * without throwing (see FINDINGS for the drop list). Empty CSVs are coerced
 * to a `1x1` blank cell so every worksheet has at least one cell — this is
 * a legacy convention (an empty sheet in xlsx is technically valid but some
 * readers, notably older LibreOffice, reject it).
 */
export function buildMultiSheetWorkbook(
  sheets: ReadonlyArray<{ readonly name: string; readonly csv: string }>,
  format: BinaryFormat,
): Uint8Array {
  const book = (XLSX as any).utils.book_new();
  const used: string[] = [];
  // If the caller handed us zero sheets, produce a single blank Sheet1 so
  // the output is still a valid workbook (matches legacy `j` behavior for
  // empty TOC sheets — the route layer is expected to 404 on an empty
  // TOC; this is a defensive fallback).
  if (sheets.length === 0) {
    const blank = (XLSX as any).utils.aoa_to_sheet([['']]);
    (XLSX as any).utils.book_append_sheet(book, blank, 'Sheet1');
  }
  for (const sheet of sheets) {
    const grid = parseCSV(sheet.csv);
    const aoa: unknown[][] = grid.length === 0 ? [['']] : coerceNumericCells(grid);
    const ws = (XLSX as any).utils.aoa_to_sheet(aoa);
    const name = sanitizeSheetName(sheet.name, used);
    used.push(name);
    (XLSX as any).utils.book_append_sheet(book, ws, name);
  }
  const out = (XLSX as any).write(book, {
    bookType: format,
    type: 'array',
    compression: true,
  });
  return new Uint8Array(out as ArrayBufferLike);
}

/**
 * Parse a workbook (any format SheetJS can read — xlsx/ods/fods) and return
 * one `{name, csv}` entry per sheet, in workbook order.
 *
 * CSV values are produced via `XLSX.utils.sheet_to_csv` with default FS/RS
 * (`,` and `\n`) so the result round-trips through `parseCSV`.
 */
export function parseMultiSheetWorkbook(
  bytes: Uint8Array,
  readFn: (data: any, opts: any) => any = (XLSX as any).read,
): Array<{ name: string; csv: string }> {
  const wb = readFn(bytes, { type: 'array' });
  // Defensive fallback: SheetJS always produces an Array for SheetNames,
  // but a hand-forged workbook might not. The `: []` branch is covered
  // by the tests.
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];
  const out: Array<{ name: string; csv: string }> = [];
  for (const name of names) {
    const sheet = wb.Sheets[name];
    // Same defensive guard: a SheetName without a matching Sheets entry
    // would throw on `sheet_to_csv`.
    if (!sheet) continue;
    const csv: string = (XLSX as any).utils.sheet_to_csv(sheet, {
      FS: ',',
      RS: '\n',
    });
    out.push({ name, csv });
  }
  return out;
}
