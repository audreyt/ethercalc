/**
 * Inverse of `xlsx-build.ts` — convert an xlsx/ods/fods workbook into a
 * SocialCalc spreadsheet save. Formula-preserving: Excel's `SUM(A1:A2)`
 * lands as a live SocialCalc formula rather than the cached value, so
 * editing the result in EtherCalc still recalculates.
 *
 * Pipeline:
 *   bytes → XLSX.read → for each cell emit a SocialCalc command
 *        → dispatch into a fresh SpreadsheetControl → CreateSpreadsheetSave
 *
 * We go through SocialCalc commands rather than hand-building the save
 * string so the resulting save includes every invariant (audit trail,
 * attribs, default cell/value formats) that `CreateSpreadsheetSave`
 * maintains — identical in shape to a save produced by `csvToSave` or
 * browser-driven edits.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';
import { loadSocialCalc } from '@ethercalc/socialcalc-headless';

/**
 * Upper bound on the number of populated cells we will replay from an
 * imported workbook. Each cell drives a synchronous SocialCalc
 * `Parse` + `ExecuteSheetCommand` (plus a final full-sheet recalc), so an
 * unbounded count is a CPU/memory DoS primitive: a small, highly-compressed
 * xlsx/ods can declare millions of cells. 200k comfortably covers any real
 * spreadsheet while capping the replay work. Exported so callers/tests can
 * reference the limit.
 */
export const MAX_IMPORT_CELLS = 200_000;

/** Thrown by `xlsxToSave` when an import exceeds {@link MAX_IMPORT_CELLS}. */
export class ImportTooLargeError extends Error {
  readonly cellCount: number;
  constructor(cellCount: number) {
    super(`xlsx/ods import exceeds ${MAX_IMPORT_CELLS} cells (${cellCount})`);
    this.name = 'ImportTooLargeError';
    this.cellCount = cellCount;
  }
}

/**
 * Count the populated cells on a SheetJS worksheet (keys that aren't
 * `!`-prefixed metadata like `!ref` / `!merges`). This is the number of
 * synchronous SocialCalc commands the import replay will dispatch.
 */
export function countWorksheetCells(ws: Record<string, unknown>): number {
  return Object.keys(ws).filter((a) => !a.startsWith('!')).length;
}

/**
 * Throw {@link ImportTooLargeError} when an import would replay more than
 * {@link MAX_IMPORT_CELLS} cells. Called before the per-cell replay loop so
 * an oversized/zip-bombed workbook can't pin the worker isolate.
 */
export function enforceImportLimit(cellCount: number): void {
  if (cellCount > MAX_IMPORT_CELLS) {
    throw new ImportTooLargeError(cellCount);
  }
}

interface SheetJSCell {
  readonly v?: unknown;
  readonly t?: string;
  readonly f?: string;
  readonly w?: string;
}

/**
 * Emit the SocialCalc command string to populate `coord` from a SheetJS cell.
 * Returns `null` when the cell shape has nothing to set (e.g. pure error cells
 * — Excel stores `#N/A` with no usable value to transplant).
 *
 * Rules:
 *   - formula cells (`f` present) → `set <coord> formula <f>` (SocialCalc
 *     stores formulas `=`-less, matching SheetJS's shape).
 *   - numeric (`t:'n'`) → `set <coord> value n <v>`.
 *   - string (`t:'s'`) → `set <coord> text t <v>`.
 *   - boolean (`t:'b'`) → `set <coord> value n <0|1>`.
 *   - date (`t:'d'`) → serialized Date → Excel serial number → value n.
 *   - anything else graceful-degrades to the formatted text (`w`) or the
 *     stringified `v`.
 */
export function cellToCommand(coord: string, cell: SheetJSCell): string | null {
  // Formulas take priority — the cached value is kept by recalc.
  if (typeof cell.f === 'string' && cell.f.length > 0) {
    // SocialCalc's `set A1 formula FOO(…)` stores without leading `=`,
    // which is already the shape SheetJS uses.
    return `set ${coord} formula ${cell.f}`;
  }
  switch (cell.t) {
    case 'n': {
      const v = Number(cell.v);
      if (!Number.isFinite(v)) return null;
      return `set ${coord} value n ${v}`;
    }
    case 's':
      // Allow empty string — preserves explicitly-blanked cells.
      return `set ${coord} text t ${String(cell.v ?? '')}`;
    case 'b':
      return `set ${coord} value n ${cell.v ? 1 : 0}`;
    case 'd': {
      // SheetJS v0.x and later returns Date objects for `t:'d'`. Convert
      // to an Excel serial (days since 1900-01-00 with the leap-year bug).
      if (!(cell.v instanceof Date)) return null;
      const ms = cell.v.getTime();
      const serial = ms / 86_400_000 + 25569; // Unix epoch day = 25569
      return `set ${coord} value n ${serial}`;
    }
    case 'e':
      // Error cell — skip; leaving the cell blank on import is safer than
      // hard-coding an error into a fresh sheet.
      return null;
    default:
      // Unknown type — try the formatted text, then raw value.
      if (cell.w !== undefined) return `set ${coord} text t ${cell.w}`;
      if (cell.v !== undefined) return `set ${coord} text t ${String(cell.v)}`;
      return null;
  }
}

/**
 * Replay an xlsx/ods/fods workbook's first sheet into a fresh
 * `SpreadsheetControl` and return both the control and its sheet object.
 *
 * Shared by `xlsxToSave` (full-snapshot import on PUT) and
 * `xlsxToLoadClipboardCommands` (paste-into-room import on POST). When the
 * workbook is empty the returned sheet simply has no cells, which both
 * callers handle gracefully (empty save / empty clipboard).
 *
 * Throws {@link ImportTooLargeError} when the workbook declares more than
 * {@link MAX_IMPORT_CELLS} populated cells.
 */
function replayWorkbook(bytes: Uint8Array): { ss: any; sheet: any } {
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  // Stryker disable next-line ObjectLiteral,StringLiteral : @e965/xlsx
  // auto-infers `type` from a Uint8Array and defaults `cellFormula:true`
  // for xlsx/ods reads, so mutations to this options object produce
  // byte-identical workbooks. Equivalent mutants at 92:40 / 92:48.
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  const firstName = (wb.SheetNames as string[])[0];
  /* istanbul ignore next -- SheetJS always populates SheetNames[0]
     (defaulting to "Sheet1") even for empty input. Defensive guard. */
  if (!firstName) return { ss, sheet };
  const ws = wb.Sheets[firstName];
  /* istanbul ignore next -- SheetJS guarantees Sheets[SheetNames[0]]
     exists. Defensive guard against malformed workbook shapes. */
  if (!ws) return { ss, sheet };

  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];

  // Bail before the expensive per-cell SocialCalc replay if the workbook
  // declares an unreasonable number of cells (zip-bomb / oversized used
  // range). Counting keys is O(cells) but cheap relative to the replay.
  enforceImportLimit(countWorksheetCells(ws));

  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const cell = ws[addr] as SheetJSCell;
    const cmd = cellToCommand(addr, cell);
    if (!cmd) continue;
    try {
      const parse = new SC.Parse(cmd);
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
      /* istanbul ignore next -- defensive fallback; SocialCalc's Parse
         is permissive and doesn't throw on any formulas encountered in
         practice, but when it does we drop the formula and seed the
         cached value so the cell isn't empty. */
      // Stryker disable all : istanbul-ignored fallback that only runs when
      // SC.Parse throws, which doesn't happen under any fixture we've seen.
      // Mutating this code can't change observable behavior without a mock
      // that forces the throw — not worth the test-doubles maintenance.
      if (typeof cell.f === 'string' && cell.v !== undefined) {
        const fallback =
          typeof cell.v === 'number'
            ? `set ${addr} value n ${cell.v}`
            : `set ${addr} text t ${String(cell.v)}`;
        try {
          const parse = new SC.Parse(fallback);
          SC.ExecuteSheetCommand(sheet, parse, false);
        } catch {
          // Give up on this cell.
        }
      }
      // Stryker restore all
    }
  }

  // Merges: `set A1:B2 colspan …` isn't exactly how SocialCalc spells it;
  // the built-in command is `merge A1:B2`. Dispatch one per merged range.
  for (const m of merges) {
    const top = `${colLetters(m.s.c)}${m.s.r + 1}`;
    const bot = `${colLetters(m.e.c)}${m.e.r + 1}`;
    try {
      const parse = new SC.Parse(`merge ${top}:${bot}`);
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
      // Merges are cosmetic — skip on parse failure.
    }
  }

  if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
    try {
      SC.RecalcSheet(sheet);
    } catch {
      // RecalcSheet failures leave computed values unset but don't
      // corrupt the save — user sees the imported formulas anyway.
    }
    sheet.attribs.needsrecalc = 'no';
  }

  return { ss, sheet };
}

/**
 * Convert a binary workbook (xlsx / ods / fods bytes) into a full
 * SocialCalc spreadsheet save. Only the first sheet is imported — the
 * multi-sheet import path (`PUT /=:room.xlsx`) handles fan-out to
 * per-sub-sheet DOs separately.
 */
export function xlsxToSave(bytes: Uint8Array): string {
  const { ss } = replayWorkbook(bytes);
  return ss.CreateSpreadsheetSave();
}

/**
 * Convert a binary workbook into the pair of SocialCalc commands a
 * `POST /_/:room` runs to *paste* the imported cells into an existing
 * room without clobbering its other content:
 *
 *   ['loadclipboard <encoded-clipboard-save>', 'paste A1 all']
 *
 * The first command loads a range save (a `CreateSheetSave(range)` with a
 * `copiedfrom:` trailer) into the shared SocialCalc clipboard — encoded
 * with `encodeForSave` so the `:`/`\n`/`\\` separators survive the
 * single-line command shape `decodeFromSave` reverses on the DO. The
 * second pastes that clipboard at A1.
 *
 * This mirrors the legacy server's xlsx-POST path, which decoded the body
 * through the `J` library into exactly this loadclipboard+paste pair and
 * replied `202 {command}`. Going through commands (rather than replacing
 * the whole snapshot, like PUT does) preserves the room's pre-existing
 * cells and emits a WS-broadcastable edit.
 *
 * Returns an empty array when the workbook has no cells to paste — the
 * caller treats that as a no-op import rather than dispatching a `paste`
 * of an empty clipboard. Throws {@link ImportTooLargeError} for oversized
 * workbooks via {@link replayWorkbook}.
 */
export function xlsxToLoadClipboardCommands(bytes: Uint8Array): string[] {
  const SC = loadSocialCalc() as any;
  const { sheet } = replayWorkbook(bytes);

  // Nothing populated → no-op import. `attribs.lastrow`/`lastcol` default
  // to 1 even for an empty sheet, so they can't distinguish "one cell" from
  // "zero cells"; the populated `cells` map can. Skipping the paste here
  // avoids emitting a `loadclipboard` of an empty range (which `paste`
  // would treat as a clipboard-clear no-op anyway).
  if (Object.keys(sheet.cells as Record<string, unknown>).length === 0) {
    return [];
  }

  // A range argument makes CreateSheetSave emit a `copiedfrom:` trailer,
  // which the `paste` executor reads to size the destination range. Use
  // the populated extent (A1 → last col/row) so the clipboard covers
  // exactly the imported cells.
  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  const lastRow = sheet.attribs.lastrow as number;
  const range = `A1:${lastCol}${lastRow}`;
  const clipboardSave: string = sheet.CreateSheetSave(range);
  const encoded: string = SC.encodeForSave(clipboardSave);
  return [`loadclipboard ${encoded}`, 'paste A1 all'];
}

function colLetters(c: number): string {
  let out = '';
  let n = c;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}
