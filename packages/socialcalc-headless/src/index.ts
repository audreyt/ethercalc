import { ShimNode, withHtmlLimit } from './dom-shim';
import { createSocialCalcFactory } from './socialcalc.bundled';
import { installFormulaLimits } from './formula-limits';

export { HtmlSizeError } from './dom-shim';
export { withSharedRecalcBudget } from './formula-limits';

/** Rebuilds one formula with its cell references offset, adjusted or replaced. */
type FormulaRewriter = (formula: string, ...args: unknown[]) => string;

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
  OffsetFormulaCoords: FormulaRewriter;
  AdjustFormulaCoords: FormulaRewriter;
  ReplaceFormulaCoords: FormulaRewriter;
  DetermineValueType: (rawvalue: string) => { type: string };
  Clipboard: { clipboard: string; parsedText?: string | null; parsedSheet?: unknown };
  CellToString: (sheet: Sheet, cell: unknown) => string;
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
  xlt?: { maxrow: number; maxcol: number };
  sci: { sheetobj: Sheet };
  statuscallback?: StatusCallback;
  statuscallbackparams?: unknown;
  ResetSheet(): void;
  CanonicalizeSheet(full?: boolean): void;
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

/**
 * Formula text one sheet may hold: a 20-character formula in every cell of
 * the worker's largest new sheet (`MAX_SHEET_CELLS`).
 *
 * `paste`, the fills, the moves and `sort` rebuild a formula for every cell
 * they write, row and column edits rebuild every formula of the sheet, a
 * ranged `set` stores one in every cell of its range, and the recalc that
 * follows parses each copy and keeps its tokens on the cell.
 */
export const MAX_SHEET_FORMULA_CHARS = 4 * 1024 * 1024;

const FORMULA_REWRITERS = [
  'OffsetFormulaCoords',
  'AdjustFormulaCoords',
  'ReplaceFormulaCoords',
] as const;

/**
 * Cell text one command batch may serialize. `fillright`/`filldown`/`paste`
 * hand every target cell a reference to one value string, and the recalculation
 * budget that trims computed text only runs after the last command. Until then
 * a `sort`, `copy` or `cut` turns each reference into its own string.
 */
const MAX_BATCH_SERIALIZED_CHARS = 64 * 1024 * 1024;
/** Largest clipboard kept once its batch is over. */
const MAX_RETAINED_CLIPBOARD_CHARS = 1024 * 1024;
const BATCH_LIMIT_ERROR = 'Command batch exceeds text limits';

/** What a caught SocialCalc error contributes to the log. */
const MAX_LOGGED_ERROR_LENGTH = 500;

class FormulaTextLimitError extends Error {}
class BatchTextLimitError extends Error {}

function errorExcerpt(error: unknown): string {
  if (error instanceof BatchTextLimitError) return String(error);
  const text = error instanceof Error && error.stack ? error.stack : String(error);
  return text.length > MAX_LOGGED_ERROR_LENGTH
    ? `${text.slice(0, MAX_LOGGED_ERROR_LENGTH)}...`
    : text;
}

let cachedNamespace: SocialCalcNamespace | null = null;

/**
 * Build a SocialCalc namespace of its own. Everything a replay touches besides
 * the sheet lives on the namespace — `Formula.SheetCache` keeps an entry for
 * every sheet name a formula asks for, `Clipboard` the last copy — so each
 * unit of work that executes commands or recalculates (a room, an import)
 * takes a fresh one and lets it go with its result.
 */
export function newSocialCalcNamespace(): SocialCalcNamespace {
  // Double-cast through `unknown`: the bundled factory is `@ts-nocheck`
  // so tsgo infers its return type as void/undefined, but at runtime it
  // always yields the SocialCalc namespace (see `socialcalc.bundled.ts`
  // bottom — `return SocialCalc`).
  const namespace = createSocialCalcFactory() as unknown as SocialCalcNamespace;
  installFormulaLimits(namespace);
  // Sibling sheets are injected with `addSiblingSheet` before a recalc;
  // nothing can deliver one during it. Answering "no such sheet" on the
  // spot prevents nested re-entry across every missing sheet reference.
  const formula = namespace.Formula as unknown as {
    SheetCache: { loadsheet: ((name: string) => string) | null };
  };
  formula.SheetCache.loadsheet = () => '';
  return namespace;
}

/**
 * The namespace shared by the whole isolate, for its stateless helpers only
 * (`encodeForSave` and the like). It is never released, so whatever a
 * recalculation stores on it stays for good: replay sheets in a
 * {@link newSocialCalcNamespace} instead.
 */
export function loadSocialCalc(): SocialCalcNamespace {
  return cachedNamespace ??= newSocialCalcNamespace();
}

export interface HeadlessSpreadsheetOptions {
  snapshot?: string;
  log?: readonly string[];
}

export class HeadlessSpreadsheet {
  readonly #SC: SocialCalcNamespace;
  readonly #ss: SpreadsheetControl;
  /** Formula text the current command batch may still rewrite. */
  #formulaRewriteBudget = MAX_SHEET_FORMULA_CHARS;

  constructor(SC: SocialCalcNamespace, ss: SpreadsheetControl) {
    this.#SC = SC;
    this.#ss = ss;
  }

  #formulaChars(): number {
    const cells = this.#ss.sheet.cells as Record<string, { datatype?: string; formula?: string }>;
    let chars = 0;
    for (const coord in cells) {
      const cell = cells[coord]!;
      if (cell.datatype === 'f') chars += cell.formula?.length ?? 0;
    }
    return chars;
  }

  #limitFormulaRewrites(): () => void {
    const SC = this.#SC;
    const originals = new Map<(typeof FORMULA_REWRITERS)[number], FormulaRewriter>();
    for (const name of FORMULA_REWRITERS) {
      const rewrite = SC[name];
      originals.set(name, rewrite);
      SC[name] = (formula, ...args) => {
        this.#formulaRewriteBudget -= formula.length;
        if (this.#formulaRewriteBudget < 0) throw new FormulaTextLimitError();
        return rewrite.call(SC, formula, ...args);
      };
    }
    return () => {
      for (const [name, original] of originals) {
        SC[name] = original;
      }
    };
  }

  /**
   * Charge every cell the coming commands serialize against
   * `MAX_BATCH_SERIALIZED_CHARS`. Call the returned cleanup once the batch is
   * over; it restores `CellToString` and reports whether the budget held.
   */
  #limitBatchText(): () => boolean {
    const SC = this.#SC;
    const cellToString = SC.CellToString;
    let budget = MAX_BATCH_SERIALIZED_CHARS;
    let exceeded = false;
    SC.CellToString = (sheet, cell) => {
      const text = cellToString.call(SC, sheet, cell);
      if (text.length > budget) {
        exceeded = true;
        delete sheet.xlt;
        throw new BatchTextLimitError(BATCH_LIMIT_ERROR);
      }
      budget -= text.length;
      return text;
    };
    return () => {
      SC.CellToString = cellToString;
      if (SC.Clipboard.clipboard.length > MAX_RETAINED_CLIPBOARD_CHARS) {
        SC.Clipboard.clipboard = '';
      }
      SC.Clipboard.parsedText = null;
      SC.Clipboard.parsedSheet = null;
      return !exceeded;
    };
  }

  /**
   * Run a command batch and recalculate. Returns false when refused because of
   * the formula text it rewrites/leaves (`MAX_SHEET_FORMULA_CHARS`) or the cell
   * text it serializes (`MAX_BATCH_SERIALIZED_CHARS`); callers that persist the
   * sheet must discard it rather than saving partial changes.
   */
  executeCommand(cmdstr: string, saveundo = false): boolean {
    const trimmed = cmdstr.replace(/\n\n+/g, '\n');
    if (!/\S/.test(trimmed)) return true;
    const sheet = this.#ss.context.sheetobj;
    const formulaChars = this.#formulaChars();
    const formulaLimit = Math.max(MAX_SHEET_FORMULA_CHARS, formulaChars);
    this.#formulaRewriteBudget = formulaChars + MAX_SHEET_FORMULA_CHARS;
    const parse = new this.#SC.Parse(trimmed);
    const restoreRewriters = this.#limitFormulaRewrites();
    const endBatch = this.#limitBatchText();
    let withinLimits: boolean;
    let aborted = false;
    let failures = 0;
    let firstError = '';
    try {
      while (!parse.EOF()) {
        try {
          this.#SC.ExecuteSheetCommand(sheet, parse, saveundo);
        } catch (e) {
          if (e instanceof FormulaTextLimitError) {
            aborted = true;
            break;
          }
          if (failures === 0) firstError = errorExcerpt(e);
          failures += 1;
        }
        parse.NextLine();
      }
    } finally {
      restoreRewriters();
      withinLimits = endBatch();
    }
    if (aborted) return false;
    if (failures > 1) firstError += ` (first of ${failures} failed lines)`;
    if (failures > 0) console.error('Error in ExecuteSheetCommand:', firstError);
    if (this.#formulaChars() > formulaLimit) return false;
    if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
      try {
        this.#SC.RecalcSheet(sheet);
      } catch (e) { console.error('Error in RecalcSheet:', errorExcerpt(e)); }
      sheet.attribs.needsrecalc = 'no';
    }
    return withinLimits;
  }

  createSheetSave(): string { return this.#ss.CreateSheetSave(); }
  createSpreadsheetSave(): string { return this.#ss.CreateSpreadsheetSave(); }
  /**
   * Rows and columns the next `createSheetSave()`/`createSpreadsheetSave()`
   * will serialize. SocialCalc sizes a save by canonicalizing the sheet to
   * its farthest populated cell and row/column setting — not by
   * `attribs.lastrow`/`lastcol` — and then visits every coordinate of that
   * rectangle. This runs the same canonicalization without the scan, so a
   * caller can bound the area before paying for the save.
   */
  saveDimensions(): { rows: number; columns: number } {
    const sheet = this.#ss.sheet;
    sheet.CanonicalizeSheet(true);
    const { maxrow, maxcol } = sheet.xlt!;
    // `CreateSheetSave` drops its translation tables the same way; a stale
    // `xlt` would change how `CellToString` encodes cell styles.
    delete sheet.xlt;
    return { rows: maxrow, columns: maxcol };
  }
  /**
   * Render the sheet as an HTML table. With `limit`, the render is stopped
   * with `HtmlSizeError` once the markup passes that many characters.
   */
  createSheetHTML(limit = Number.POSITIVE_INFINITY): string {
    return withHtmlLimit(limit, () => this.#ss.CreateSheetHTML());
  }
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
  findCrossSheetRefs(limit = Number.POSITIVE_INFINITY): string[] {
    const seen = new Set<string>();
    const cells = this.#ss.sheet.cells as Record<string, { formula?: string }>;
    for (const cell of Object.values(cells)) {
      const formula = cell?.formula;
      if (typeof formula !== 'string' || formula.length === 0) continue;
      // Consume a bare name whether or not `!` follows so long runs scan linearly.
      const re = /"([^"]+)"!|'([^']+)'!|([A-Za-z_][A-Za-z0-9_.-]*)(!?)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(formula)) !== null) {
        const name = m[1] ?? m[2] ?? (m[4] ? m[3] : undefined);
        if (name) seen.add(name);
        if (seen.size >= limit) return [...seen];
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

  resetSiblingSheets(): void {
    const Formula = this.#SC.Formula as unknown as {
      SheetCache: { sheets: Record<string, unknown>; waitingForLoading: string | null };
      FreshnessInfo: { sheets: Record<string, unknown> };
    };
    Formula.SheetCache.sheets = Object.create(null) as Record<string, unknown>;
    Formula.SheetCache.waitingForLoading = null;
    Formula.FreshnessInfo.sheets = Object.create(null) as Record<string, unknown>;
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
      console.error('Error in RecalcSheet:', errorExcerpt(e));
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
  const SC = newSocialCalcNamespace();
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
    } catch (e) { console.error('Error in RecalcSheet:', errorExcerpt(e)); }
    sheet.attribs.needsrecalc = 'no';
  }
  return ss.CreateSpreadsheetSave();
}

export function createSpreadsheet(opts: HeadlessSpreadsheetOptions = {}): HeadlessSpreadsheet {
  const SC = newSocialCalcNamespace();
  const ss = new SC.SpreadsheetControl();
  if (opts.snapshot) {
    try {
      const parts = ss.DecodeSpreadsheetSave(opts.snapshot);
      if (parts?.sheet) {
        ss.sheet.ResetSheet();
        ss.ParseSheetSave(opts.snapshot.substring(parts.sheet.start, parts.sheet.end));
      }
    } catch (e) { console.error('Error in DecodeSpreadsheetSave:', errorExcerpt(e)); }
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
