import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import * as XLSX from '@e965/xlsx';
import { csvToSocialCalc } from './csv.ts';
import { encodeCSV } from './csv-encode.ts';
import {
  countWorksheetCells,
  enforceImportLimit,
  enforceImportArchiveLimit,
  enforceSocialCalcColumnLimit,
  worksheetToSave,
} from './xlsx-import.ts';
const TOC_HEADER: readonly string[] = ['#url', '#title'];

export class ImportTooManySheetsError extends Error {
  readonly sheetCount: number;

  constructor(sheetCount: number) {
    super(`workbook exceeds ${MAX_MULTI_SHEETS} sheets (${sheetCount})`);
    this.name = 'ImportTooManySheetsError';
    this.sheetCount = sheetCount;
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
  readFn: typeof XLSX.read = XLSX.read,
): MultiSheetAppendImport {
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

    let title = name.trim() || `Sheet${nextIdx}`;
    if (currentTitles.map((t) => t.toLowerCase()).includes(title.toLowerCase())) {
      title = `${title}_${nextIdx}`;
    }
    currentTitles.push(title);

    subSheets.push({ subroom, save, link, title });
  }

  return { subSheets };
}
