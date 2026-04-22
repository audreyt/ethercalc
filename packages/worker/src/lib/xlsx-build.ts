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
import * as XLSX from '@e965/xlsx';

import { parseCSV } from './csv-parse.ts';

/** Binary workbook formats we support (single-sheet for Phase 8). */
export type BinaryFormat = 'xlsx' | 'ods' | 'fods';

// ─── Cells-based high-fidelity exporter ───────────────────────────────────
//
// The CSV intermediate at `csvToBinaryWorkbook` flattens everything to
// strings, so formulas, number formats, and merged ranges are lost. For
// rooms where the user cares about roundtrip ("open in Excel, edit,
// re-import") we walk `sheet.cells` directly and emit SheetJS
// `{v, t, f, z, c}` cells. Graceful-degrade: unknown valuetype → string
// with stringified datavalue; unrecognized format → omitted. Excel still
// shows the cached computed value alongside a preserved formula, so even
// if a SocialCalc-specific function doesn't exist in Excel's formula
// dialect the user sees the right value on open.

/** Single cell view from a SocialCalc sheet. */
export interface SocialCalcCell {
  readonly coord?: string;
  readonly datavalue?: string | number;
  readonly datatype?: 'v' | 't' | 'f' | 'c' | null;
  readonly formula?: string;
  readonly valuetype?: string;
  readonly nontextvalueformat?: number;
  readonly textvalueformat?: number;
  readonly colspan?: number;
  readonly rowspan?: number;
  readonly comment?: string;
}

/**
 * Structural sheet view — matches `@ethercalc/socialcalc-headless`'s
 * `SheetData`. Redeclared here so this lib stays dependency-free of
 * the headless package (pure Node unit-testable).
 */
export interface SocialCalcSheetView {
  // Typed as `unknown` to accept the structurally-compatible `SheetData`
  // from `@ethercalc/socialcalc-headless` without needing a shared type
  // import. Each entry is cast to `SocialCalcCell` inside the walker.
  readonly cells: Readonly<Record<string, unknown>>;
  readonly valueformats?: readonly string[];
  readonly cellformats?: readonly string[];
  readonly attribs?: Readonly<Record<string, unknown>>;
}

/** Parse "A1" / "AA12" into zero-based `{r, c}`. Returns null on invalid input. */
export function parseCoord(coord: string): { r: number; c: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(coord);
  if (!m) return null;
  const letters = m[1] as string;
  const rowStr = m[2] as string;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  const row = parseInt(rowStr, 10) - 1;
  if (row < 0) return null;
  return { r: row, c: col - 1 };
}

/** Inverse of `parseCoord` for the column part. */
export function encodeColumn(c: number): string {
  let out = '';
  let n = c;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}

/**
 * Translate one SocialCalc cell into a SheetJS cell object. Returns `null`
 * when the cell should be omitted (truly blank — `valuetype` starts with
 * 'b' AND no formula). Rules:
 *
 * - Numeric (`valuetype[0] === 'n'`):
 *     - `nl` → `t: 'b'` (logical / boolean)
 *     - anything else → `t: 'n'` with `cell.datavalue` as the value
 *     - `nontextvalueformat` pointing at a non-'General' / non-`text-*`
 *       entry → `z: <format string>` (SocialCalc's format dialect already
 *       matches Excel's for the common subset: decimals, percents,
 *       currency, dates)
 * - Text (`valuetype[0] === 't'`): `t: 's'`, `v: datavalue`. Subtypes
 *   (`th`/`tl`/`tw`) degrade to plain text — the raw markup survives.
 * - Error (`valuetype[0] === 'e'`): `t: 'e'`, `v: 0x2A` (#N/A).
 * - Formula (`datatype === 'f'`): adds `f: <formula>` alongside the cached
 *   value. SocialCalc stores formulas without a leading `=`, matching
 *   SheetJS's expected shape.
 * - Merge (`colspan > 1 || rowspan > 1`): caller collects into `!merges`.
 * - Comment: `c: [{t: <comment>}]`.
 *
 * Unknown valuetypes degrade to string via `String(datavalue)`.
 */
export function translateCell(
  cell: SocialCalcCell,
  valueformats: readonly string[] = [],
): Record<string, unknown> | null {
  const valuetype = String(cell.valuetype ?? '');
  const main = valuetype[0] ?? '';
  const isFormula = cell.datatype === 'f' && typeof cell.formula === 'string' && cell.formula.length > 0;

  // Skip truly blank non-formula cells.
  if ((main === 'b' || main === '') && !isFormula) return null;

  const out: Record<string, unknown> = {};

  if (main === 'n') {
    const raw = cell.datavalue;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
    if (valuetype === 'nl') {
      // SocialCalc stores 1/0 as numeric for logical values.
      out.v = Number.isFinite(n) ? n !== 0 : false;
      out.t = 'b';
    } else {
      out.v = Number.isFinite(n) ? n : 0;
      out.t = 'n';
    }
  } else if (main === 't') {
    out.v = cell.datavalue ?? '';
    out.t = 's';
  } else if (main === 'e') {
    out.v = 0x2a; // xlsx code for #N/A
    out.t = 'e';
  } else if (isFormula) {
    // Formula with blank / unknown value — Excel will show #N/A-ish until
    // it recalculates on open. Seed with 0 so the cell is numeric-typed.
    out.v = 0;
    out.t = 'n';
  } else {
    // Graceful degrade: stringify.
    out.v = String(cell.datavalue ?? '');
    out.t = 's';
  }

  if (isFormula) {
    out.f = cell.formula;
  }

  // Number format pass-through.
  const fmtIdx = cell.nontextvalueformat;
  if (typeof fmtIdx === 'number' && fmtIdx > 0) {
    const fmt = valueformats[fmtIdx];
    if (fmt && fmt !== 'General' && !fmt.startsWith('text-')) {
      out.z = fmt;
    }
  }

  if (cell.comment) {
    out.c = [{ t: String(cell.comment) }];
  }

  return out;
}

/**
 * Build a SheetJS worksheet object from a SocialCalc sheet view. The
 * returned object has `!ref`, `!merges` (when any), and one cell entry per
 * non-blank coord. Suitable for `book_append_sheet`.
 */
export function sheetViewToWorksheet(view: SocialCalcSheetView): Record<string, unknown> {
  const ws: Record<string, unknown> = {};
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = [];
  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;

  for (const [coord, cell] of Object.entries(view.cells)) {
    const rc = parseCoord(coord);
    if (!rc) continue;
    const scCell = cell as SocialCalcCell;
    const xcell = translateCell(scCell, view.valueformats);
    if (!xcell) continue;
    ws[coord] = xcell;
    if (rc.r < minR) minR = rc.r;
    if (rc.c < minC) minC = rc.c;
    if (rc.r > maxR) maxR = rc.r;
    if (rc.c > maxC) maxC = rc.c;

    const colspan = Number(scCell.colspan ?? 1);
    const rowspan = Number(scCell.rowspan ?? 1);
    if (colspan > 1 || rowspan > 1) {
      merges.push({
        s: { r: rc.r, c: rc.c },
        e: { r: rc.r + rowspan - 1, c: rc.c + colspan - 1 },
      });
    }
  }

  if (maxR === -Infinity) {
    // No cells — emit a minimal 1x1 blank so readers don't reject the file.
    ws['!ref'] = 'A1';
    ws['A1'] = { t: 's', v: '' };
  } else {
    // parseCoord guarantees r >= 0 and c >= 0 for every cell we kept,
    // so minR/minC are always valid zero-based indices here.
    ws['!ref'] = `${encodeColumn(minC)}${minR + 1}:${encodeColumn(maxC)}${maxR + 1}`;
  }

  if (merges.length > 0) {
    ws['!merges'] = merges;
  }

  return ws;
}

/** Single-sheet high-fidelity exporter. Replaces the CSV-based pipeline. */
export function sheetViewToBinaryWorkbook(
  view: SocialCalcSheetView,
  format: BinaryFormat,
  sheetName: string = 'Sheet1',
): Uint8Array {
  const ws = sheetViewToWorksheet(view);
  const book = (XLSX as any).utils.book_new();
  (XLSX as any).utils.book_append_sheet(book, ws, sheetName);
  const out = (XLSX as any).write(book, {
    bookType: format,
    type: 'array',
    compression: true,
  });
  return new Uint8Array(out as ArrayBufferLike);
}

/** Multi-sheet high-fidelity exporter. Parallels `buildMultiSheetWorkbook`. */
export function buildMultiSheetWorkbookFromSheets(
  sheets: ReadonlyArray<{ readonly name: string; readonly view: SocialCalcSheetView }>,
  format: BinaryFormat,
): Uint8Array {
  const book = (XLSX as any).utils.book_new();
  const used: string[] = [];
  if (sheets.length === 0) {
    const blank = (XLSX as any).utils.aoa_to_sheet([['']]);
    (XLSX as any).utils.book_append_sheet(book, blank, 'Sheet1');
  }
  for (const s of sheets) {
    const ws = sheetViewToWorksheet(s.view);
    const name = sanitizeSheetName(s.name, used);
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
