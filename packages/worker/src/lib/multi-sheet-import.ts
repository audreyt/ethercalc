import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import * as XLSX from '@e965/xlsx';
import { csvToSocialCalc } from './csv.ts';
import { encodeCSV } from './csv-encode.ts';
import {
  countWorksheetCells,
  enforceImportLimit,
  enforceImportArchiveLimit,
  enforceSocialCalcColumnLimit,
  ImportArchiveTooLargeError,
  MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES,
  worksheetToSave,
} from './xlsx-import.ts';
const TOC_HEADER: readonly string[] = ['#url', '#title'];

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
    if (value > max) max = value;
  }
  return max;
}

export function rewriteSheetReferences(
  body: string,
  sheetNames: readonly string[],
  room: string,
  firstIndex: number,
): string {
  if (sheetNames.length === 0) return body;
  const escapedNames = sheetNames.map((name) =>
    name.replace(/'/g, "''").replace(/(\W)/g, '\\$1'),
  );
  const targets = new Map(
    sheetNames.map((name, offset) => [name, `${room}.${firstIndex + offset}`]),
  );
  return body.replace(
    new RegExp(`('?)\\b(${escapedNames.join('|')})\\1!`, 'g'),
    (_match, _quote: string, reference: string) =>
      `'${targets.get(reference.replace(/''/g, "'"))}'!`,
  );
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

function buildTextAppendImport(
  bytes: Uint8Array,
  room: string,
  existingLinks: readonly string[],
  existingTitles: readonly string[],
  format: TextImportFormat,
  titleHint: string | undefined,
): MultiSheetAppendImport {
  enforceImportUploadBytes(bytes);
  if (existingLinks.length + 1 > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(existingLinks.length + 1);
  }

  const startMax = getMaxSubsheetIndex(existingLinks, room);
  const nextIdx = startMax + 1;
  const subroom = `${room}.${nextIdx}`;
  const link = `/${subroom}`;
  const preferred =
    (titleHint && titleHint.trim()) ||
    (format === 'socialcalc' ? 'SocialCalc' : format.toUpperCase());
  const title = uniqueTitle(preferred, nextIdx, existingTitles);

  let save: string;
  if (format === 'socialcalc') {
    const body = new TextDecoder('utf-8').decode(bytes);
    save = rewriteSheetReferences(body, [title], room, nextIdx);
  } else {
    // CSV / TSV / TXT → one SocialCalc snapshot via the same ConvertOtherFormat path
    // used by single-sheet room PUT.
    const text = new TextDecoder('utf-8').decode(bytes);
    const csvText = format === 'tsv' ? text.replace(/\t/g, ',') : text;
    save = csvToSocialCalc(csvText);
  }

  return {
    subSheets: [{ subroom, save, link, title }],
  };
}

export function buildMultiSheetImport(
  bytes: Uint8Array,
  room: string,
  readFn: typeof XLSX.read = XLSX.read,
): MultiSheetImport {
  enforceImportArchiveLimit(bytes);
  const wb = readFn(bytes, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];
  if (names.length > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(names.length);
  }

  let totalCells = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (ws) totalCells += countWorksheetCells(ws);
  }
  enforceImportLimit(totalCells);

  const subSheets: Array<{ subroom: string; save: string }> = [];
  const tocRows: string[][] = [[...TOC_HEADER]];
  let idx = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    idx++;
    const subroom = `${room}.${idx}`;
    subSheets.push({ subroom, save: worksheetToSave(ws) });
    tocRows.push([`/${subroom}`, name]);
  }

  return { tocSave: csvToSocialCalc(encodeCSV(tocRows)), subSheets };
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
  const format = (opts.format ?? 'xlsx').toLowerCase();
  const readFn = opts.readFn ?? XLSX.read;

  if (isTextImportFormat(format)) {
    return buildTextAppendImport(
      bytes,
      room,
      existingLinks,
      existingTitles,
      format,
      opts.titleHint,
    );
  }
  if (!isWorkbookImportFormat(format)) {
    throw new ImportUnsupportedFormatError(format);
  }

  enforceImportArchiveLimit(bytes);
  const wb = readFn(bytes, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];

  if (existingLinks.length + names.length > MAX_MULTI_SHEETS) {
    throw new ImportTooManySheetsError(existingLinks.length + names.length);
  }

  let totalCells = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (ws) {
      enforceSocialCalcColumnLimit(ws);
      totalCells += countWorksheetCells(ws);
    }
  }
  enforceImportLimit(totalCells);

  const startMax = getMaxSubsheetIndex(existingLinks, room);
  const firstIndex = startMax + 1;
  const subSheets: MultiSheetAppendSheet[] = [];
  const currentTitles = [...existingTitles];

  let offset = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const nextIdx = firstIndex + offset;
    offset++;

    const subroom = `${room}.${nextIdx}`;
    const link = `/${subroom}`;
    let save = worksheetToSave(ws);
    save = rewriteSheetReferences(save, names, room, firstIndex);

    const title = uniqueTitle(name, nextIdx, currentTitles);
    currentTitles.push(title);

    subSheets.push({ subroom, save, link, title });
  }

  return { subSheets };
}
