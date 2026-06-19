import * as XLSX from '@e965/xlsx';
import { csvToSocialCalc } from './csv.ts';
import { encodeCSV } from './csv-encode.ts';
import {
  countWorksheetCells,
  enforceImportLimit,
  enforceImportArchiveLimit,
  worksheetToSave,
} from './xlsx-import.ts';

const TOC_HEADER: readonly string[] = ['#url', '#title'];

export interface MultiSheetImport {
  readonly tocSave: string;
  readonly subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
}

export function buildMultiSheetImport(
  bytes: Uint8Array,
  room: string,
  readFn: typeof XLSX.read = XLSX.read,
): MultiSheetImport {
  enforceImportArchiveLimit(bytes);
  const wb = readFn(bytes, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];

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
