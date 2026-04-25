import { ShimNode } from './dom-shim';
import { createSocialCalcFactory } from './socialcalc.bundled';

type SocialCalcNamespace = Record<string, unknown> & {
  SpreadsheetControl: new (idPrefix?: string) => SpreadsheetControl;
  ConvertSaveToOtherFormat: (savestr: string, format: string, dorecalc?: boolean) => string;
  ConvertOtherFormatToSave: (inputstr: string, inputformat: string) => string;
  Parse: new (cmdstr: string) => {
    EOF: () => boolean;
    NextLine: () => void;
  };
  ExecuteSheetCommand: (sheet: unknown, cmd: unknown, saveundo: boolean) => string | undefined;
  ScheduleSheetCommands: (sheet: unknown, cmdstr: string, saveundo: boolean) => void;
  RecalcSheet: (sheet: unknown) => void;
  Clipboard: { clipboard: string };
  Formula?: {
    AddSheetToCache: (name: string, str: string, live?: boolean) => unknown;
  };
  document: { createElement: (tag: string) => ShimNode };
};

interface SpreadsheetControl {
  sheet: Sheet;
  context: { sheetobj: Sheet };
  CreateSheetSave(): string;
  CreateSpreadsheetSave(): string;
  CreateSheetHTML(): string;
  DecodeSpreadsheetSave(snapshot: string): { sheet?: { start: number; end: number } } | null;
  ParseSheetSave(str: string): void;
  ExecuteCommand(cmdstr: string, saveundo?: boolean): void;
}

interface Sheet {
  cells: Record<string, unknown>;
  attribs: { needsrecalc?: string } & Record<string, unknown>;
  valueformats?: readonly string[];
  cellformats?: readonly string[];
  recalconce?: boolean;
  sci: { sheetobj: Sheet };
  statuscallback?: StatusCallback;
  statuscallbackparams?: unknown;
  ResetSheet(): void;
  ScheduleSheetCommands(cmdstr: string, saveundo: boolean, isRemote?: boolean): void;
}

/**
 * Structural view of a SocialCalc sheet sufficient to build a high-fidelity
 * xlsx/ods export (formulas, number formats, merges, comments). Keep this
 * shape stable — `packages/worker/src/lib/xlsx-build.ts` depends on it.
 */
export interface SheetData {
  cells: Record<string, unknown>;
  valueformats: readonly string[];
  cellformats: readonly string[];
  attribs: Record<string, unknown>;
}

type StatusCallback = (data: unknown, status: string, arg: unknown, params: unknown) => void;

let cachedNamespace: SocialCalcNamespace | null = null;

export function loadSocialCalc(): SocialCalcNamespace {
  if (cachedNamespace) return cachedNamespace;
  // Double-cast through `unknown`: the bundled factory is `@ts-nocheck`
  // so tsgo infers its return type as void/undefined, but at runtime it
  // always yields the SocialCalc namespace (see `socialcalc.bundled.ts`
  // bottom — `return SocialCalc`).
  cachedNamespace = createSocialCalcFactory() as unknown as SocialCalcNamespace;
  return cachedNamespace;
}

export interface HeadlessSpreadsheetOptions {
  snapshot?: string;
  log?: readonly string[];
}

export class HeadlessSpreadsheet {
  readonly #SC: SocialCalcNamespace;
  readonly #ss: SpreadsheetControl;

  constructor(SC: SocialCalcNamespace, ss: SpreadsheetControl) {
    this.#SC = SC;
    this.#ss = ss;
  }

  executeCommand(cmdstr: string, saveundo = false): void {
    const trimmed = cmdstr.replace(/\n\n+/g, '\n');
    if (!/\S/.test(trimmed)) return;
    const sheet = this.#ss.context.sheetobj;
    const parse = new this.#SC.Parse(trimmed);
    while (!parse.EOF()) {
      try {
        this.#SC.ExecuteSheetCommand(sheet, parse, saveundo);
      } catch (e) { console.error("Error in ExecuteSheetCommand:", e); }
      parse.NextLine();
    }
    if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
      try {
        this.#SC.RecalcSheet(sheet);
      } catch (e) { console.error("Error in RecalcSheet:", e); }
      sheet.attribs.needsrecalc = 'no';
    }
  }

  createSheetSave(): string { return this.#ss.CreateSheetSave(); }
  createSpreadsheetSave(): string { return this.#ss.CreateSpreadsheetSave(); }
  createSheetHTML(): string { return this.#ss.CreateSheetHTML(); }
  exportCSV(): string { return this.#SC.ConvertSaveToOtherFormat(this.#ss.CreateSheetSave(), 'csv'); }
  exportCells(): Record<string, unknown> { return this.#ss.sheet.cells; }
  exportCell(coord: string): unknown { const cell = this.#ss.sheet.cells[coord]; return cell === undefined ? null : cell; }
  /**
   * Full structural sheet view for high-fidelity export (formulas + number
   * formats + merges). Unlike `exportCSV()`, which flattens to string values,
   * this exposes the raw cell attributes that an xlsx/ods writer can walk.
   */
  exportSheetData(): SheetData {
    const sheet = this.#ss.sheet;
    return {
      cells: sheet.cells,
      valueformats: sheet.valueformats ?? [],
      cellformats: sheet.cellformats ?? [],
      attribs: sheet.attribs,
    };
  }

  /**
   * Enumerate unique sheet names referenced by any formula in this
   * spreadsheet — e.g. `"other"!A1`, `'other'!A1`, or `other!A1`. Used by the DO to
   * pre-fetch sibling sheets into SocialCalc's cache before recalc, so
   * cross-sheet formulas resolve to real values instead of `#NAME?`.
   */
  findCrossSheetRefs(): string[] {
    const seen = new Set<string>();
    const cells = this.#ss.sheet.cells as Record<string, { formula?: string }>;
    for (const cell of Object.values(cells)) {
      const formula = cell?.formula;
      if (typeof formula !== 'string' || formula.length === 0) continue;
      // Match double-quoted "name"!, single-quoted 'name'!, and bare
      // name! references. The capture groups are mutually exclusive;
      // take whichever matched.
      const re = /(?:"([^"]+)"|'([^']+)'|([A-Za-z_][A-Za-z0-9_.-]*))!/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(formula)) !== null) {
        const name = m[1] ?? m[2] ?? m[3];
        if (name) seen.add(name);
      }
    }
    return [...seen];
  }

  /**
   * Inject a sibling sheet's SocialCalc save into the formula-evaluator
   * cache. Must be called *before* `recalc()` for cross-sheet refs to
   * resolve. Idempotent — SocialCalc replaces any existing cache entry
   * under the same (normalized) name.
   */
  addSiblingSheet(name: string, save: string): void {
    const Formula = this.#SC.Formula as unknown as {
      AddSheetToCache: (name: string, str: string, live?: boolean) => unknown;
    };
    if (!Formula?.AddSheetToCache) return;
    Formula.AddSheetToCache(name, save, false);
  }

  /**
   * Re-run recalc. Useful after `addSiblingSheet(...)` populates the
   * formula-evaluator cache so cross-sheet refs that previously returned
   * `#NAME?` compute to real values.
   */
  recalc(): void {
    const sheet = this.#ss.context.sheetobj;
    sheet.attribs.needsrecalc = 'yes';
    try {
      this.#SC.RecalcSheet(sheet);
    } catch (e) {
      console.error('Error in RecalcSheet:', e);
    }
    sheet.attribs.needsrecalc = 'no';
  }
}

/**
 * Convert CSV text into a FULL SocialCalc save (multipart envelope with
 * sheet + edit + audit parts), suitable for storage as a room snapshot.
 *
 * `ConvertOtherFormatToSave(csv, 'csv')` alone only returns a clipboard-
 * style bare-sheet snippet with a `copiedfrom:A1:C2` trailer — fine for
 * paste but NOT a valid room snapshot (DecodeSpreadsheetSave can't parse
 * it; exporters return empty CSV when rehydrating). Legacy used
 * `J.utils.to_socialcalc(J.read(csv))` for this path, which delegated
 * through a different decoder that produced a full save.
 *
 * We reproduce the legacy shape by: (a) parsing the CSV via SocialCalc's
 * clipboard decoder, (b) pasting it into a fresh SpreadsheetControl at
 * A1, (c) emitting `CreateSpreadsheetSave` — the same format a live
 * client's PUT /_/:room would produce.
 *
 * Found while browser-smoke-testing PUT /_/room with CSV bodies on
 * 2026-04-20: GET /_/:room/csv returned empty after a successful PUT
 * because the rehydrated DO couldn't parse its own stored snapshot.
 */
export function csvToSave(csv: string): string {
  const SC = loadSocialCalc();
  const clipboardSave = SC.ConvertOtherFormatToSave(csv, 'csv');
  const ss = new SC.SpreadsheetControl();
  // The legacy `loadclipboard <encoded-save>` command decodes the save
  // through `SocialCalc.decodeFromSave` then assigns Clipboard.clipboard.
  // We skip the round-trip through encode/decode since we already have
  // the decoded form; Clipboard is a plain namespace value (see socialcalc
  // asset `Clipboard = { clipboard: "" }`).
  SC.Clipboard.clipboard = clipboardSave;
  const sheet = ss.context.sheetobj;
  const parse = new SC.Parse('paste A1 all');
  SC.ExecuteSheetCommand(sheet, parse, false);
  if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
    try {
      SC.RecalcSheet(sheet);
    } catch (e) { console.error("Error in RecalcSheet:", e); }
    sheet.attribs.needsrecalc = 'no';
  }
  return ss.CreateSpreadsheetSave();
}

export function createSpreadsheet(opts: HeadlessSpreadsheetOptions = {}): HeadlessSpreadsheet {
  const SC = loadSocialCalc();
  const ss = new SC.SpreadsheetControl();
  if (opts.snapshot) {
    try {
      const parts = ss.DecodeSpreadsheetSave(opts.snapshot);
      if (parts?.sheet) {
        ss.sheet.ResetSheet();
        ss.ParseSheetSave(opts.snapshot.substring(parts.sheet.start, parts.sheet.end));
      }
    } catch (e) { console.error("Error in DecodeSpreadsheetSave:", e); }
  }
  const wrapped = new HeadlessSpreadsheet(SC, ss);
  if (opts.log) {
    for (const line of opts.log) {
      if (!line) continue;
      if (/^re(calc|display)$/.test(line)) continue;
      wrapped.executeCommand(line);
    }
  }
  return wrapped;
}
