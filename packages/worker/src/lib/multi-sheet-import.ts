import { MAX_MULTI_SHEETS, MAX_MULTI_SHEET_TITLE_LENGTH } from '@ethercalc/shared';
import { newSocialCalcNamespace, withSharedRecalcBudget } from '@ethercalc/socialcalc-headless';
import * as XLSX from '@e965/xlsx';
import { csvToSocialCalc } from './csv.ts';
import { MAX_SHEET_CELLS, MAX_SOCIALCALC_COL, MAX_SOCIALCALC_ROW } from './command-limits.ts';
import {
  countWorksheetCells,
  countWorksheetMergedCells,
  countWorksheetText,
  enforceImportLimit,
  enforceImportTextLimit,
  enforceImportArchiveLimit,
  enforceActualImportArchiveLimit,
  enforceSocialCalcColumnLimit,
  ImportArchiveTooLargeError,
  ImportDimensionsTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  readBoundedWorkbook,
  sheetReferences,
  textRowsToSave,
  worksheetToSave,
} from './xlsx-import.ts';
const TOC_HEADER: readonly string[] = ['#url', '#title'];
export const MAX_WORKBOOK_GRID_POSITIONS = 2_000_000;
const WORKBOOK_RECALC_MULTIPLIER = 4;

/** Binary multi-sheet workbook formats (PUT replace + POST append). */
export const WORKBOOK_IMPORT_FORMATS = ['xlsx', 'ods', 'fods'] as const;
/** Single-sheet text formats accepted only on the guarded POST append door. */
export const TEXT_IMPORT_FORMATS = ['csv', 'tsv', 'txt', 'socialcalc'] as const;
/** Every format the multi-sheet append route accepts. */
export const APPEND_IMPORT_FORMATS = [
  ...WORKBOOK_IMPORT_FORMATS,
  ...TEXT_IMPORT_FORMATS,
] as const;

export type WorkbookImportFormat = (typeof WORKBOOK_IMPORT_FORMATS)[number];
export type TextImportFormat = (typeof TEXT_IMPORT_FORMATS)[number];
export type AppendImportFormat = (typeof APPEND_IMPORT_FORMATS)[number];

export class ImportTooManySheetsError extends Error {
  readonly sheetCount: number;

  constructor(sheetCount: number) {
    super(`workbook exceeds ${MAX_MULTI_SHEETS} sheets (${sheetCount})`);
    this.name = 'ImportTooManySheetsError';
    this.sheetCount = sheetCount;
  }
}

export class ImportUnsupportedFormatError extends Error {
  constructor(format: string) {
    super(`unsupported multi-sheet import format: ${format}`);
    this.name = 'ImportUnsupportedFormatError';
  }
}

export interface MultiSheetImport {
  readonly tocSave: string;
  readonly subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
}

export interface MultiSheetAppendSheet {
  readonly subroom: string;
  readonly save: string;
  readonly link: string;
  readonly title: string;
}

export interface MultiSheetAppendImport {
  readonly subSheets: readonly MultiSheetAppendSheet[];
}

export interface BuildMultiSheetAppendImportOptions {
  readonly format?: string | undefined;
  /** Preferred sheet title for single-sheet text imports (usually the filename stem). */
  readonly titleHint?: string | undefined;
  readonly readFn?: typeof XLSX.read | undefined;
}

export function getMaxSubsheetIndex(links: readonly string[], room: string): number {
  const prefix = `/${room}.`;
  let max = 0;
  for (const link of links) {
    if (!link.startsWith(prefix)) continue;
    const suffix = link.slice(prefix.length);
    if (!/^\d+$/.test(suffix)) continue;
    const value = Number(suffix);
    // Stryker disable next-line EqualityOperator : `value >= max` only reassigns
    // the same number when equal, so the stored max is observationally identical.
    if (value > max) max = value;
  }
  return max;
}

/** Whether a UTF-16 code unit can be part of an unquoted sheet name. */
function isBareSheetNameCode(code: number): boolean {
  return (
    code > 0x7f || // any non-ASCII character
    (code >= 0x61 && code <= 0x7a) || // a-z
    (code >= 0x41 && code <= 0x5a) || // A-Z
    (code >= 0x30 && code <= 0x39) || // 0-9
    code === 0x5f || // _
    code === 0x2e // .
  );
}

/**
 * Where the sheet name written before the `!` at `bang` starts, or -1 when
 * there is none. `'…'!` holds a quoted name, in which `''` is one apostrophe;
 * otherwise the name is the run of name characters that ends at the `!`.
 */
function sheetReferenceStart(body: string, bang: number): number {
  let at = bang - 1;
  if (body[at] !== "'") {
    while (isBareSheetNameCode(body.charCodeAt(at))) at--;
    return at + 1 < bang ? at + 1 : -1;
  }
  for (at--; at >= 0; at -= 2) {
    at = body.lastIndexOf("'", at);
    if (at === -1 || body[at - 1] !== "'") return at;
  }
  return -1;
}

function sheetReferenceRewriter(
  sheetNames: readonly string[],
  room: string,
  firstIndex: number,
  priorGrowth = 0,
): (body: string) => string {
  if (sheetNames.length === 0) return (body) => body;
  const targets = new Map(
    sheetNames.map((name, offset) => [name, `'${room}.${firstIndex + offset}'!`]),
  );
  let growth = priorGrowth;
  return (body) => {
    const pieces: string[] = [];
    let copied = body.length;
    let bang = body.lastIndexOf('!');
    while (bang > 0) {
      const start = sheetReferenceStart(body, bang);
      const target =
        start === -1
          ? undefined
          : targets.get(
              body[start] === "'"
                ? body.slice(start + 1, bang - 1).replace(/''/g, "'")
                : body.slice(start, bang),
            );
      if (target === undefined) {
        bang = body.lastIndexOf('!', bang - 1);
        continue;
      }
      growth += target.length - (bang + 1 - start);
      if (growth > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
        throw new ImportArchiveTooLargeError(body.length + growth);
      }
      pieces.push(body.slice(bang + 1, copied), target);
      copied = start;
      bang = body.lastIndexOf('!', start - 1);
    }
    pieces.push(body.slice(0, copied));
    return pieces.reverse().join('');
  };
}

/**
 * Replace `<sheet>!` references with the quoted child room name in linear time.
 */
export function rewriteSheetReferences(
  body: string,
  sheetNames: readonly string[],
  room: string,
  firstIndex: number,
  priorGrowth = 0,
): string {
  return sheetReferenceRewriter(sheetNames, room, firstIndex, priorGrowth)(body);
}

function workbookSheetsToSaves(
  wb: XLSX.WorkBook,
  sheetNames: readonly string[],
  room: string,
  firstIndex: number,
): string[] {
  const childRooms = new Set(sheetNames.map((_, offset) => `${room}.${firstIndex + offset}`));
  const toChildRooms = sheetReferenceRewriter(sheetNames, room, firstIndex);
  const importSheetRef = (formula: string): string | null => {
    const rewritten = toChildRooms(formula);
    const inside = sheetReferences(rewritten).every(
      (name) => name !== null && childRooms.has(name),
    );
    return inside ? rewritten : null;
  };
  const sc = newSocialCalcNamespace();
  let totalSaveBytes = 0;
  return withSharedRecalcBudget(
    sc,
    () =>
      sheetNames.map((name) => {
        const save = worksheetToSave(wb.Sheets[name]!, importSheetRef, sc);
        totalSaveBytes += save.length;
        if (totalSaveBytes > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
          throw new ImportArchiveTooLargeError(totalSaveBytes);
        }
        return save;
      }),
    WORKBOOK_RECALC_MULTIPLIER,
  );
}

function enforceWorkbookSheetBudgets(
  wb: XLSX.WorkBook,
  names: readonly string[],
): void {
  let totalCells = 0;
  let totalMergedCells = 0;
  let totalText = 0;
  let totalArea = 0;
  for (const name of names) {
    const ws = wb.Sheets[name]!;
    totalArea += enforceSocialCalcColumnLimit(ws);
    totalCells += countWorksheetCells(ws);
    totalMergedCells += countWorksheetMergedCells(ws);
    totalText += countWorksheetText(ws);
  }
  enforceImportLimit(totalCells);
  enforceImportLimit(totalMergedCells);
  enforceImportTextLimit(totalText);
  if (totalArea > MAX_WORKBOOK_GRID_POSITIONS) {
    throw new ImportDimensionsTooLargeError(totalArea, 1);
  }
}

function isTextImportFormat(format: string): format is TextImportFormat {
  return (TEXT_IMPORT_FORMATS as readonly string[]).includes(format);
}

function isWorkbookImportFormat(format: string): format is WorkbookImportFormat {
  return (WORKBOOK_IMPORT_FORMATS as readonly string[]).includes(format);
}

function enforceImportUploadBytes(bytes: Uint8Array): void {
  if (bytes.byteLength > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new ImportArchiveTooLargeError(bytes.byteLength);
  }
}

export function enforceTextImportLimits(bytes: Uint8Array, format: 'csv' | 'tsv' | 'txt'): void {
  let rows = 0;
  let columns = 1;
  let widest = 0;
  let fieldBytes = 0;
  let quoted = false;
  const checkField = (): void => {
    if (fieldBytes > 1024 * 1024) {
      throw new ImportArchiveTooLargeError(fieldBytes, 1024 * 1024);
    }
    fieldBytes = 0;
  };
  const checkRow = (): void => {
    checkField();
    rows++;
    widest = Math.max(widest, columns);
    if (
      rows > MAX_SOCIALCALC_ROW || widest > MAX_SOCIALCALC_COL ||
      rows * widest > MAX_SHEET_CELLS
    ) {
      throw new ImportDimensionsTooLargeError(rows, widest);
    }
    columns = 1;
  };
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0x22) {
      if (quoted && bytes[i + 1] === 0x22) i++;
      else quoted = !quoted;
      fieldBytes++;
    } else if (!quoted && (byte === 0x2c || (format === 'tsv' && byte === 0x09))) {
      checkField();
      columns++;
    } else if (!quoted && (byte === 0x0a || byte === 0x0d)) {
      checkRow();
      if (byte === 0x0d && bytes[i + 1] === 0x0a) i++;
    } else {
      fieldBytes++;
      if (fieldBytes > 1024 * 1024) checkField();
    }
  }
  // A line ending inside an unterminated quote is field content, not the end
  // of the final record, so that record still has to be counted.
  if (
    bytes.length > 0 &&
    (quoted || (bytes[bytes.length - 1] !== 0x0a && bytes[bytes.length - 1] !== 0x0d))
  ) {
    checkRow();
  }
}

function uniqueTitle(
  preferred: string,
  nextIdx: number,
  currentTitles: readonly string[],
): string {
  let title = preferred.trim() || `Sheet${nextIdx}`;
  if (currentTitles.map((t) => t.toLowerCase()).includes(title.toLowerCase())) {
    title = `${title}_${nextIdx}`;
  }
  return title;
}


export function buildMultiSheetImport(
  bytes: Uint8Array,
  room: string,
  readFn: typeof XLSX.read = XLSX.read,
  firstIndex = 1,
): MultiSheetImport {
  if (!Number.isSafeInteger(firstIndex) || firstIndex < 1) {
    throw new RangeError('firstIndex must be a positive safe integer');
  }
  enforceImportArchiveLimit(bytes);
  const readable = enforceActualImportArchiveLimit(bytes);
  const wb = readBoundedWorkbook(readable, readFn, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];
  if (names.length > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(names.length);
  }
  if (!Number.isSafeInteger(firstIndex + (names.length - 1))) {
    throw new RangeError('child room namespace exhausted');
  }

  const present = names.filter((name) => Boolean(wb.Sheets[name]));
  enforceWorkbookSheetBudgets(wb, present);

  const saves = workbookSheetsToSaves(wb, present, room, firstIndex);
  const subSheets: Array<{ subroom: string; save: string }> = [];
  const tocRows: string[][] = [[...TOC_HEADER]];
  present.forEach((name, offset) => {
    const subroom = `${room}.${firstIndex + offset}`;
    subSheets.push({ subroom, save: saves[offset]! });
    tocRows.push([`/${subroom}`, name.slice(0, MAX_MULTI_SHEET_TITLE_LENGTH)]);
  });

  return { tocSave: textRowsToSave(tocRows), subSheets };
}

/**
 * The two fields `POST /_/=:room/sheet` reads from its JSON body, or `null`
 * when they are missing or malformed; invalid JSON throws. Synchronous on
 * purpose: the parsed body is attacker-shaped and can take 25 times its size
 * in memory, so only these strings may outlive the call. A caller that parsed
 * inline would keep the whole tree reachable across its `await`s.
 */
export function parseAddSheetRequest(
  text: string,
): { readonly title: string; readonly requestId: string } | null {
  const raw: unknown = JSON.parse(text);
  if (
    raw === null ||
    typeof raw !== 'object' ||
    !('title' in raw) ||
    typeof raw.title !== 'string' ||
    !('requestId' in raw) ||
    typeof raw.requestId !== 'string' ||
    raw.requestId.length === 0 ||
    raw.requestId.length > 128 ||
    !/^[A-Za-z0-9_-]+$/.test(raw.requestId)
  ) {
    return null;
  }
  return { title: raw.title, requestId: raw.requestId };
}

/**
 * Parse an append upload into title preferences + save materializers without
 * consulting the live TOC. The parent RoomDO allocates concrete subroom indices
 * atomically; callers then materialize saves with the returned firstIndex.
 */
export interface AppendImportPlan {
  readonly count: number;
  /** Names used for cross-sheet formula rewrite (workbook sheet names). */
  readonly referenceNames: readonly string[];
  /** Preferred display titles before live TOC uniqueness is applied. */
  readonly preferredTitles: readonly string[];
  materializeSaves(room: string, firstIndex: number): readonly string[];
}

export function prepareAppendImportPlan(
  bytes: Uint8Array,
  format: string,
  titleHint?: string,
  readFn: typeof XLSX.read = XLSX.read,
): AppendImportPlan {
  const fmt = format.toLowerCase();

  if (isTextImportFormat(fmt)) {
    enforceImportUploadBytes(bytes);
    if (fmt !== 'socialcalc') enforceTextImportLimits(bytes, fmt);
    const preferred =
      (titleHint && titleHint.trim()) ||
      (fmt === 'socialcalc' ? 'SocialCalc' : fmt.toUpperCase());
    const referenceNames = [preferred];
    return {
      count: 1,
      referenceNames,
      preferredTitles: [preferred],
      materializeSaves(room: string, firstIndex: number): readonly string[] {
        if (fmt === 'socialcalc') {
          const body = new TextDecoder('utf-8').decode(bytes);
          return [rewriteSheetReferences(body, referenceNames, room, firstIndex)];
        }
        const text = new TextDecoder('utf-8').decode(bytes);
        const csvText = fmt === 'tsv' ? text.replace(/\t/g, ',') : text;
        return [csvToSocialCalc(csvText)];
      },
    };
  }

  if (!isWorkbookImportFormat(fmt)) {
    throw new ImportUnsupportedFormatError(fmt);
  }

  enforceImportArchiveLimit(bytes);
  const readable = enforceActualImportArchiveLimit(bytes);
  const wb = readBoundedWorkbook(readable, readFn, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];
  const present = names.filter((name) => Boolean(wb.Sheets[name]));
  if (present.length > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(present.length);
  }

  enforceWorkbookSheetBudgets(wb, present);

  return {
    count: present.length,
    referenceNames: present,
    preferredTitles: present.map((name) => name),
    materializeSaves(room: string, firstIndex: number): readonly string[] {
      return workbookSheetsToSaves(wb, present, room, firstIndex);
    },
  };
}

export function buildMultiSheetAppendImport(
  bytes: Uint8Array,
  room: string,
  existingLinks: readonly string[],
  existingTitles: readonly string[],
  options: BuildMultiSheetAppendImportOptions | typeof XLSX.read = {},
): MultiSheetAppendImport {
  // Back-compat: older tests pass `readFn` as the 5th positional argument.
  const opts: BuildMultiSheetAppendImportOptions =
    typeof options === 'function' ? { readFn: options } : options;
  // Stryker disable next-line MethodExpression : prepareAppendImportPlan lowercases
  // `format` again before any includes() check, so toUpperCase() here is a no-op.
  const format = (opts.format ?? 'xlsx').toLowerCase();
  const readFn = opts.readFn ?? XLSX.read;

  const plan = prepareAppendImportPlan(bytes, format, opts.titleHint, readFn);
  if (existingLinks.length + plan.count > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(existingLinks.length + plan.count);
  }

  const startMax = getMaxSubsheetIndex(existingLinks, room);
  const firstIndex = startMax + 1;
  const saves = plan.materializeSaves(room, firstIndex);
  const currentTitles = [...existingTitles];
  const subSheets: MultiSheetAppendSheet[] = [];

  for (let i = 0; i < plan.count; i++) {
    const nextIdx = firstIndex + i;
    const subroom = `${room}.${nextIdx}`;
    const title = uniqueTitle(plan.preferredTitles[i]!, nextIdx, currentTitles);
    currentTitles.push(title);
    subSheets.push({
      subroom,
      save: saves[i]!,
      link: `/${subroom}`,
      title,
    });
  }

  return { subSheets };
}
