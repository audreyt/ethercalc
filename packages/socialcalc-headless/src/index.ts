/**
 * Headless SocialCalc — runs inside a Cloudflare Worker / Durable Object.
 *
 * Strategy (Plan A from CLAUDE.md §3.4):
 *   1. Import SocialCalc.js source as raw text (Vite `?raw` suffix).
 *   2. Apply the same two transforms the legacy `src/sc.ls` did:
 *        - document.createElement(  →  SocialCalc.document.createElement(
 *        - alert(                    →  (function(){})(
 *   3. Evaluate the transformed source inside a `new Function()` closure whose
 *      `this` is a plain object acting as the SocialCalc "window". The UMD
 *      wrapper in SocialCalc.js falls through to the browser-globals branch
 *      because we shadow `module`/`define` as undefined locals.
 *   4. After eval, install a custom `document.createElement` (ShimNode) and
 *      return the SocialCalc namespace.
 *
 * The factory is memoized module-wide: the 27k-line eval runs once per
 * isolate. Each RoomDO then calls `createSpreadsheet()` to get a fresh
 * `SpreadsheetControl` on top of the shared SocialCalc.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved by Vite's ?raw loader at build time
import rawSource from 'socialcalc/dist/SocialCalc.js?raw';

import { ShimNode } from './dom-shim.js';

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

// No "use strict" anywhere in this eval — SocialCalc.js uses `delete varname;`
// (lines 7173, 25144, 27541 of socialcalc 2.3.0) which is a SyntaxError in
// strict mode.
//
// The loading strategy: eval the full SocialCalc UMD inside an inner IIFE
// called with `.call(host)`. This ensures `this` at the UMD site resolves to
// our host object, which in turn makes `window` === host inside the factory
// body (because the UMD factory is called as `factory.call(root, this)` where
// `root === this === host`). Without this, workerd leaves `this` as undefined
// or the sandbox global and the timer shim below is never seen by
// SocialCalc's recalc scheduler.
const WRAPPED_TEMPLATE = (transformedSource: string): string => `
  var host = this;
  // Synchronous timer shim — the legacy server used process.nextTick via
  // webworker-threads; here we want executeCommand/recalc to run inline so
  // callers get a fully-settled sheet on return. Attached to host so that
  // closures inside SocialCalc that reference \`window.setTimeout\` resolve to
  // the shim (since window === host in this eval context).
  host.setTimeout = function (cb) { cb(); return 0; };
  host.clearTimeout = function () {};

  ;(function () {
    var window = this;
    var navigator = { language: "", userAgent: "" };
    // Force UMD browser-globals branch — SocialCalc.js checks typeof module/define.
    var module, exports, define;
    ${transformedSource}
  }).call(host);

  var __SC = host.SocialCalc;
  __SC.document = __SC.document || {};
  __SC.document.createElement = function (tag) { return new __ShimNode(tag); };
  return __SC;
`;

function transformSource(source: string): string {
  return (
    source
      .replace(/document\.createElement\(/g, 'SocialCalc.document.createElement(')
      .replace(/alert\(/g, '(function(){})(')
      // UMD binds the factory's `window` parameter to `this` at the outer IIFE
      // call site. Because `new Function()` bodies run sloppy by default AND
      // our IIFE is invoked bare `(fn)()`, `this` inside is the real workerd
      // global, not our host shim — so SocialCalc's closures capture the real
      // (async) `setTimeout` and our sync timer shim is never consulted.
      // Rewrite to pass `root` (which IS our host shim via the outer
      // `(this, factory)` argument and our wrapper's `.call(host)`) instead.
      .replace(/factory\.call\(root,\s*this\)/g, 'factory.call(root, root)')
      .replace(/factory\.bind\(root,\s*this\)/g, 'factory.bind(root, root)')
  );
}

let cachedNamespace: SocialCalcNamespace | null = null;

export function loadSocialCalc(): SocialCalcNamespace {
  if (cachedNamespace) return cachedNamespace;
  const transformed = transformSource(rawSource as string);
  // Use indirect eval via Function constructor — workerd permits this in
  // DOs/Workers; the bundled string is a trusted constant from the
  // `socialcalc` npm package.
  const factory = new Function('__ShimNode', WRAPPED_TEMPLATE(transformed));
  const host: Record<string, unknown> = {};
  cachedNamespace = factory.call(host, ShimNode) as SocialCalcNamespace;
  return cachedNamespace;
}

export interface HeadlessSpreadsheetOptions {
  /** Initial snapshot in SocialCalc save format. */
  snapshot?: string;
  /** Initial command log to replay (applied after snapshot, before recalc). */
  log?: readonly string[];
}

export class HeadlessSpreadsheet {
  readonly #SC: SocialCalcNamespace;
  readonly #ss: SpreadsheetControl;

  constructor(SC: SocialCalcNamespace, ss: SpreadsheetControl) {
    this.#SC = SC;
    this.#ss = ss;
  }

  /**
   * Execute one or more newline-separated commands synchronously, bypassing
   * the SocialCalc setTimeout-based scheduler. Recalc is performed inline.
   */
  executeCommand(cmdstr: string, saveundo = false): void {
    const trimmed = cmdstr.replace(/\n\n+/g, '\n');
    if (!/\S/.test(trimmed)) return;
    const sheet = this.#ss.context.sheetobj;
    const parse = new this.#SC.Parse(trimmed);
    while (!parse.EOF()) {
      this.#SC.ExecuteSheetCommand(sheet, parse, saveundo);
      parse.NextLine();
    }
    // The `recalc` command only sets `attribs.needsrecalc = "yes"`; in the
    // browser an editor triggers RecalcSheet via EditorSheetStatusCallback.
    // Headless, we drive it ourselves. With our synchronous setTimeout shim,
    // RecalcSheet's entire state-machine runs inline before returning.
    if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
      this.#SC.RecalcSheet(sheet);
      sheet.attribs.needsrecalc = 'no';
    }
  }

  createSheetSave(): string {
    return this.#ss.CreateSheetSave();
  }

  createSpreadsheetSave(): string {
    return this.#ss.CreateSpreadsheetSave();
  }

  createSheetHTML(): string {
    return this.#ss.CreateSheetHTML();
  }

  exportCSV(): string {
    return this.#SC.ConvertSaveToOtherFormat(this.#ss.CreateSheetSave(), 'csv');
  }

  /**
   * JSON-string equivalent of the legacy `w.exportCells` (src/sc.ls:361).
   * Returns a plain object mapping cell coordinate → cell record. Callers
   * that want the legacy `JSON.stringify` shape can stringify the result.
   */
  exportCells(): Record<string, unknown> {
    return this.#ss.sheet.cells;
  }

  /**
   * Single-cell lookup. Legacy (`w.exportCell`, src/sc.ls:356) returned the
   * literal string `"null"` when the cell was missing — we match that by
   * returning `null` (the caller JSON-encodes the response).
   */
  exportCell(coord: string): unknown {
    const cell = this.#ss.sheet.cells[coord];
    return cell === undefined ? null : cell;
  }
}

/**
 * Convert a CSV string to a SocialCalc save string. Mirrors legacy
 * `SocialCalc.ConvertOtherFormatToSave(csv, 'csv')` (see src/main.ls:332).
 * Phase 5 uses this for `PUT /_/:room` with `text/csv` bodies.
 */
export function csvToSave(csv: string): string {
  const SC = loadSocialCalc();
  return SC.ConvertOtherFormatToSave(csv, 'csv');
}

export function createSpreadsheet(opts: HeadlessSpreadsheetOptions = {}): HeadlessSpreadsheet {
  const SC = loadSocialCalc();
  const ss = new SC.SpreadsheetControl();
  if (opts.snapshot) {
    const parts = ss.DecodeSpreadsheetSave(opts.snapshot);
    if (parts?.sheet) {
      ss.sheet.ResetSheet();
      ss.ParseSheetSave(opts.snapshot.substring(parts.sheet.start, parts.sheet.end));
    }
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
