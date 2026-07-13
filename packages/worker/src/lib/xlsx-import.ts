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
import { encodeColumn, parseCoord } from './xlsx-build.ts';

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

/** SocialCalc max column (1-based ZZ). SheetJS 0-based max is 701. */
export const MAX_SOCIALCALC_COL = 702;

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
 * Thrown when a workbook cell or merge ends beyond SocialCalc's ZZ column.
 * SocialCalc's `coordToCr("AAA1")` returns `{col:0}` and silently drops the
 * cell during `ExecuteSheetCommand` — that is unintentional data loss, so
 * imports reject the whole workbook before replay rather than clipping.
 */
export class ImportColumnOutOfRangeError extends Error {
  readonly coord: string;
  /** 1-based column index that exceeded {@link MAX_SOCIALCALC_COL}. */
  readonly column: number;
  constructor(coord: string, column: number) {
    super(
      `xlsx/ods import column ${coord} exceeds SocialCalc max ZZ (${MAX_SOCIALCALC_COL}); column index ${column}`,
    );
    this.name = 'ImportColumnOutOfRangeError';
    this.coord = coord;
    this.column = column;
  }
}

export const MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES = 25 * 1024 * 1024;

export class ImportArchiveTooLargeError extends Error {
  readonly byteCount: number;
  readonly limit: number;
  constructor(byteCount: number, limit = MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    super(`xlsx/ods import expands to ${byteCount} bytes (limit ${limit})`);
    this.name = 'ImportArchiveTooLargeError';
    this.byteCount = byteCount;
    this.limit = limit;
  }
}

export function enforceImportArchiveLimit(bytes: Uint8Array): void {
  const b = bytes as any;
  // Stryker disable all
  if (b.length < 2 || b[0] !== 0x50 || b[1] !== 0x4b) {
    return;
  }
  if (b.length < 22) {
    return;
  }
  let eocdOffset = -1;
  const startScan = b.length - 22;
  const endScan = Math.max(0, b.length - 22 - 0xffff);
  for (let i = startScan; i >= endScan; i--) {
    if (
      b[i] === 0x50 &&
      b[i + 1] === 0x4b &&
      b[i + 2] === 0x05 &&
      b[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
// Stryker restore all
  if (eocdOffset === -1) {
    return;
  }
  const entryCount = b[eocdOffset + 10] | (b[eocdOffset + 11] << 8);
  const cdSize = ((b[eocdOffset + 12]) | (b[eocdOffset + 13] << 8) | (b[eocdOffset + 14] << 16) | (b[eocdOffset + 15] << 24)) >>> 0;
  const cdOffset = ((b[eocdOffset + 16]) | (b[eocdOffset + 17] << 8) | (b[eocdOffset + 18] << 16) | (b[eocdOffset + 19] << 24)) >>> 0;

  if (entryCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new ImportArchiveTooLargeError(Number.MAX_SAFE_INTEGER);
  }

  let offset = cdOffset;
  if (offset + 4 <= b.length) {
    const sig = ((b[offset] | (b[offset + 1] << 8) | (b[offset + 2] << 16) | (b[offset + 3] << 24)) >>> 0);
    if (sig !== 0x02014b50) {
      const expectedEocdOffset = cdOffset + cdSize;
      if (expectedEocdOffset < eocdOffset) {
        const prefixLength = eocdOffset - expectedEocdOffset;
        const testOffset = cdOffset + prefixLength;
        /* istanbul ignore else -- expectedEocdOffset sits ~22B before buffer end, so testOffset + 4 <= b.length is always true. Defensive guard. */
        if (testOffset + 4 <= b.length) {
          const testSig = ((b[testOffset] | (b[testOffset + 1] << 8) | (b[testOffset + 2] << 16) | (b[testOffset + 3] << 24)) >>> 0);
          if (testSig === 0x02014b50) {
            offset = testOffset;
          }
        }
      }
    }
  }

  let totalUncompressedSize = 0;
  for (let i = 0; i < entryCount; i++) {
    // Stryker disable next-line all : equivalent check on out-of-bounds offset
    if (offset + 46 > b.length) {
      return;
    }
    const signature = ((b[offset] | (b[offset + 1] << 8) | (b[offset + 2] << 16) | (b[offset + 3] << 24)) >>> 0);
    if (signature !== 0x02014b50) {
      return;
    }
    const compressedSize = ((b[offset + 20] | (b[offset + 21] << 8) | (b[offset + 22] << 16) | (b[offset + 23] << 24)) >>> 0);
    const uncompressedSize = ((b[offset + 24] | (b[offset + 25] << 8) | (b[offset + 26] << 16) | (b[offset + 27] << 24)) >>> 0);
    const fileNameLength = b[offset + 28] | (b[offset + 29] << 8);
    const extraLength = b[offset + 30] | (b[offset + 31] << 8);
    const commentLength = b[offset + 32] | (b[offset + 33] << 8);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new ImportArchiveTooLargeError(Number.MAX_SAFE_INTEGER);
    }

    // Stryker disable next-line all : equivalent check on out-of-bounds offset
    if (offset + 46 + fileNameLength > b.length) {
      return;
    }

    const nameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLength);
    const name = new TextDecoder().decode(nameBytes);
    const normName = name.replace(/^\/+/, '').toLowerCase();

    const isRelevant =
      normName === '[content_types].xml' ||
      normName === 'xl/workbook.xml' ||
      normName === 'xl/_rels/workbook.xml.rels' ||
      normName === 'xl/sharedstrings.xml' ||
      normName === 'xl/styles.xml' ||
      normName === 'content.xml' ||
      normName === 'styles.xml' ||
      normName === 'meta.xml' ||
      /^xl\/worksheets\/sheet\d+\.xml$/.test(normName) ||
      /^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/.test(normName);

    if (isRelevant) {
      if (uncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
        throw new ImportArchiveTooLargeError(uncompressedSize);
      }
      totalUncompressedSize += uncompressedSize;
      if (totalUncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
        throw new ImportArchiveTooLargeError(totalUncompressedSize);
      }
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
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

/**
 * Reject worksheets that touch any column beyond SocialCalc's ZZ (702).
 * SheetJS 0-based column indices > 701 map to AAA+ addresses that
 * SocialCalc's `coordToCr` parses as `{col:0}` and silently drops.
 * Called before per-cell replay so the import fails closed.
 *
 * Malformed merge end columns (non-safe-integer, negative, or >701) also
 * fail closed. `encodeColumn` is only invoked for safe non-negative
 * integer indices — never for `Infinity` / NaN / fractions (which would
 * hang or mislabel the error coord).
 */
export function enforceSocialCalcColumnLimit(
  ws: Record<string, unknown>,
): void {
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const rc = parseCoord(addr);
    if (rc === null) continue;
    if (rc.c > MAX_SOCIALCALC_COL - 1) {
      throw new ImportColumnOutOfRangeError(addr, rc.c + 1);
    }
  }
  const merges: Array<{
    s?: { r?: number; c?: number };
    e?: { r?: number; c?: number };
  }> = Array.isArray(ws['!merges'])
    ? (ws['!merges'] as Array<{
        s?: { r?: number; c?: number };
        e?: { r?: number; c?: number };
      }>)
    : [];
  for (const m of merges) {
    const endC = m?.e?.c;
    if (typeof endC !== 'number') continue;
    // Fail closed on anything outside the safe 0..701 band. Safe integer
    // gate excludes Infinity/NaN/fractions before encodeColumn is called.
    if (
      !Number.isSafeInteger(endC) ||
      endC < 0 ||
      endC > MAX_SOCIALCALC_COL - 1
    ) {
      const endR = typeof m?.e?.r === 'number' ? m.e.r : 0;
      if (Number.isSafeInteger(endC) && endC >= 0) {
        // Finite integer past ZZ — label with encodeColumn (e.g. 702 → AAA).
        throw new ImportColumnOutOfRangeError(
          `${encodeColumn(endC)}${endR + 1}`,
          endC + 1,
        );
      }
      throw new ImportColumnOutOfRangeError(
        `merge:e.c=${String(endC)}`,
        Number.isFinite(endC) ? Math.trunc(endC) : Number.NaN,
      );
    }
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
function encodeCellTextForCommand(value: unknown): string {
  const SC = loadSocialCalc() as any;
  return SC.encodeForSave(String(value ?? ''));
}

// Stryker disable all
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
      return `set ${coord} text t ${encodeCellTextForCommand(cell.v ?? '')}`;
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
      if (cell.w !== undefined) return `set ${coord} text t ${encodeCellTextForCommand(cell.w)}`;
      if (cell.v !== undefined) return `set ${coord} text t ${encodeCellTextForCommand(cell.v)}`;
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
 * {@link MAX_IMPORT_CELLS} populated cells, and
 * {@link ImportColumnOutOfRangeError} when any cell/merge is beyond ZZ.
 */
function replayWorksheetCells(SC: any, sheet: any, ws: Record<string, unknown>): void {
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];

  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const cell = ws[addr] as SheetJSCell;
    const cmd = cellToCommand(addr, cell);
    if (!cmd) continue;
    try {
      const parse = new SC.Parse(cmd);
      // Stryker disable next-line BooleanLiteral
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
            : `set ${addr} text t ${encodeCellTextForCommand(cell.v)}`;
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
      // Stryker disable next-line BooleanLiteral
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
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
}

function replayWorkbook(bytes: Uint8Array): { ss: any; sheet: any } {
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  enforceImportArchiveLimit(bytes);

  // Stryker disable next-line ObjectLiteral,StringLiteral : @e965/xlsx
  // auto-infers `type` from a Uint8Array and defaults `cellFormula:true`
  // for xlsx/ods reads, so mutations to this options object produce
  // byte-identical workbooks. Equivalent mutants at 92:40 / 92:48.
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true, sheets: 0 });
  const firstName = (wb.SheetNames as string[])[0];
  /* istanbul ignore next -- SheetJS always populates SheetNames[0]
     (defaulting to "Sheet1") even for empty input. Defensive guard. */
  if (!firstName) return { ss, sheet };
  const ws = wb.Sheets[firstName];
  /* istanbul ignore next -- SheetJS guarantees Sheets[SheetNames[0]]
     exists. Defensive guard against malformed workbook shapes. */
  if (!ws) return { ss, sheet };

  // Bail before the expensive per-cell SocialCalc replay if the workbook
  // declares an unreasonable number of cells (zip-bomb / oversized used
  // range). Counting keys is O(cells) but cheap relative to the replay.
  enforceImportLimit(countWorksheetCells(ws));
  enforceSocialCalcColumnLimit(ws);

  replayWorksheetCells(SC, sheet, ws);

  return { ss, sheet };
}

/**
 * Convert a binary workbook (xlsx / ods / fods bytes) into a full
 * SocialCalc spreadsheet save. Only the first sheet is imported — the
 * multi-sheet import path (`PUT /=:room.xlsx`, see `routes/multi-import.ts`) handles fan-out to
 * per-sub-sheet DOs separately.
 */
export function xlsxToSave(bytes: Uint8Array): string {
  const { ss } = replayWorkbook(bytes);
  return ss.CreateSpreadsheetSave();
}

/**
 * Convert a single SheetJS worksheet object into a SocialCalc spreadsheet save
 * string. Does NOT enforce cell-count limits (callers must check), but does
 * reject columns beyond SocialCalc's ZZ via {@link enforceSocialCalcColumnLimit}.
 */
export function worksheetToSave(ws: Record<string, unknown>): string {
  enforceSocialCalcColumnLimit(ws);
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  replayWorksheetCells(SC, ss.context.sheetobj, ws);
  return ss.CreateSpreadsheetSave();
}

/**
 * Convert a binary workbook (xlsx / ods / fods / csv bytes) into a single
 * `loadclipboard <encoded-clipboard-save>` command. SheetJS auto-detects
 * CSV format via `XLSX.read(bytes, {type:'array'})`, so the same path
 * handles both binary spreadsheets and CSV text.
 *
 * Returns `null` when the workbook has no cells to paste — the caller
 * treats that as a no-op import. Throws {@link ImportTooLargeError} for
 * oversized workbooks and {@link ImportColumnOutOfRangeError} when any
 * cell/merge is beyond SocialCalc ZZ, via {@link replayWorkbook}.
 */
export function workbookToLoadClipboardCommand(bytes: Uint8Array): string | null {
  const SC = loadSocialCalc() as any;
  const { sheet } = replayWorkbook(bytes);

  // Nothing populated → no-op import. `attribs.lastrow`/`lastcol` default
  // to 1 even for an empty sheet, so they can't distinguish "one cell" from
  // "zero cells"; the populated `cells` map can.
  if (Object.keys(sheet.cells as Record<string, unknown>).length === 0) {
    return null;
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
  return `loadclipboard ${encoded}`;
}

/**
 * Convert a binary workbook into the pair of SocialCalc commands a
 * `POST /_/:room` runs to *paste* the imported cells into an existing
 * room without clobbering its other content:
 *
 *   ['loadclipboard <encoded-clipboard-save>', 'paste A1 all']
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
 * workbooks and {@link ImportColumnOutOfRangeError} when any cell/merge is
 * beyond SocialCalc ZZ, via {@link replayWorkbook}.
 */
export function xlsxToLoadClipboardCommands(bytes: Uint8Array): string[] {
  const command = workbookToLoadClipboardCommand(bytes);
  return command === null ? [] : [command, 'paste A1 all'];
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
// Stryker restore all
