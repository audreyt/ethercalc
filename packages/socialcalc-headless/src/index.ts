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
  recalconce?: boolean;
  sci: { sheetobj: Sheet };
  statuscallback?: StatusCallback;
  statuscallbackparams?: unknown;
  ResetSheet(): void;
  ScheduleSheetCommands(cmdstr: string, saveundo: boolean, isRemote?: boolean): void;
}

type StatusCallback = (data: unknown, status: string, arg: unknown, params: unknown) => void;

let cachedNamespace: SocialCalcNamespace | null = null;

export function loadSocialCalc(): SocialCalcNamespace {
  if (cachedNamespace) return cachedNamespace;
  cachedNamespace = createSocialCalcFactory() as SocialCalcNamespace;
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
