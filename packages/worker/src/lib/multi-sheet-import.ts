/**
 * Multi-sheet workbook import (inverse of the multi-sheet export in
 * `routes/exports.ts`). Splits an uploaded xlsx/ods/fods workbook into a
 * TOC sheet (one row per worksheet) plus one SocialCalc save per worksheet,
 * destined for sub-rooms `<room>.<N>`. Pure / node-testable; the DO fan-out
 * lives in `routes/multi-import.ts`.
 *
 * TOC shape matches `packages/client-multi/src/Foldr.ts` and the export
 * reader `fetchMultiSheetBundle`: header row `['#url', '#title']`, then one
 * `['/<room>.<N>', sheetName]` row per worksheet (sub-rooms are 1-based, in
 * workbook order). Titles are the workbook sheet names so cross-sheet
 * formulas (`'SheetName'!A1`) resolve by title through the existing recalc
 * hydration.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { csvToSocialCalc } from './csv.ts';
import { encodeCSV } from './csv-encode.ts';
import {
  countWorksheetCells,
  enforceImportLimit,
  worksheetToSave,
} from './xlsx-import.ts';

/** TOC header row — matches `Foldr.ts` (`#url`/`#title`), dropped on read. */
const TOC_HEADER: readonly string[] = ['#url', '#title'];

export interface MultiSheetImport {
  /** SocialCalc save for the TOC sheet, written to the base room. */
  readonly tocSave: string;
  /** One save per worksheet, written to sub-room `<room>.<N>`. */
  readonly subSheets: ReadonlyArray<{
    readonly subroom: string;
    readonly save: string;
  }>;
}

/**
 * Parse a workbook and produce the TOC + per-sub-sheet saves for `room`.
 * Throws `ImportTooLargeError` when the whole workbook exceeds the cell cap.
 */
export function buildMultiSheetImport(
  bytes: Uint8Array,
  room: string,
): MultiSheetImport {
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  /* istanbul ignore next -- SheetJS always populates SheetNames as an array
     (defaulting to ["Sheet1"]) even for empty input; the `: []` fallback is a
     defensive guard against a malformed workbook shape that XLSX.read never
     actually produces. Mirrors the same guard in `xlsxToSave`. */
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];

  // Bound the WHOLE workbook before any per-sheet SocialCalc replay.
  let totalCells = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    /* istanbul ignore next -- SheetJS guarantees a Sheets entry for every
       SheetNames entry; the `if (ws)` false arm is a defensive guard against
       a malformed workbook shape XLSX.read never produces. */
    if (ws) totalCells += countWorksheetCells(ws);
  }
  enforceImportLimit(totalCells);

  const subSheets: Array<{ subroom: string; save: string }> = [];
  const tocRows: string[][] = [[...TOC_HEADER]];
  let idx = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    /* istanbul ignore next -- defensive: a SheetName without a matching Sheets
       entry is skipped. SheetJS never emits such a workbook (every name in
       SheetNames has a Sheets entry), so this `continue` is unreachable via
       any real xlsx/ods/fods bytes; same posture as `xlsxToSave`'s guards. */
    if (!ws) continue;
    idx++;
    const subroom = `${room}.${idx}`;
    subSheets.push({
      subroom,
      save: worksheetToSave(ws as Record<string, unknown>),
    });
    tocRows.push([`/${subroom}`, name]);
  }

  return { tocSave: csvToSocialCalc(encodeCSV(tocRows)), subSheets };
}
