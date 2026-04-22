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
 * Convert a binary workbook (xlsx / ods / fods bytes) into a full
 * SocialCalc spreadsheet save. Only the first sheet is imported — the
 * multi-sheet import path (`PUT /=:room.xlsx`) handles fan-out to
 * per-sub-sheet DOs separately.
 */
export function xlsxToSave(bytes: Uint8Array): string {
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  const firstName = (wb.SheetNames as string[])[0];
  /* istanbul ignore next -- SheetJS always populates SheetNames[0]
     (defaulting to "Sheet1") even for empty input. Defensive guard. */
  if (!firstName) return ss.CreateSpreadsheetSave();
  const ws = wb.Sheets[firstName];
  /* istanbul ignore next -- SheetJS guarantees Sheets[SheetNames[0]]
     exists. Defensive guard against malformed workbook shapes. */
  if (!ws) return ss.CreateSpreadsheetSave();

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
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
      /* istanbul ignore next -- defensive fallback; SocialCalc's Parse
         is permissive and doesn't throw on any formulas encountered in
         practice, but when it does we drop the formula and seed the
         cached value so the cell isn't empty. */
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

  return ss.CreateSpreadsheetSave();
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
