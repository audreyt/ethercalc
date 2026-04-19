/**
 * Types for the bits of `window.SocialCalc` we touch from the new client.
 *
 * Scope is intentionally loose — internals of the sheet model stay `unknown`
 * because the full SocialCalc typedefs are a multi-phase project on their
 * own. We only describe what the ported `player-*.ls` files actually read
 * from or write to. When a field is only used as an opaque handle (event
 * target / dictionary key) we keep it `unknown` or `Record<string, unknown>`.
 *
 * NOTE: the legacy `<script src="/static/socialcalc.js">` tag loads SocialCalc
 * onto `window` before our bundle runs. External integrations (Drupal
 * sheetnode, etc., see CLAUDE.md §7 item 10) reach into the same globals,
 * so widening a field here can be a breaking change.
 */

// ─── Callback / event shapes ─────────────────────────────────────────────

/**
 * Broadcast callback signature — the single public surface we preserve.
 *
 * `type` is one of the client→server message discriminators in
 * `packages/shared/src/messages.ts`, plus the internal `ask.ecell` channel
 * used by presence. `data` is merged into the payload; the adapter fills in
 * `room`, `user`, `auth` automatically.
 */
export type BroadcastFn = (type: string, data?: Record<string, unknown>) => void;

/** Cursor coordinates as SocialCalc gives them to us. */
export interface ECellInfo {
  coord: string;
  row: number;
  col: number;
}

export interface CellElement {
  element: {
    className: string;
  };
}

export interface EditorRange {
  hasrange: boolean;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface EditorContext {
  highlights: Record<string, string>;
  sheetobj: {
    CreateSheetSave: () => string;
    ScheduleSheetCommands: (
      cmd: string,
      saveundo: boolean,
      isRemote: boolean,
    ) => void;
  };
  cellskip: Record<string, string | undefined>;
}

export interface EditorObject {
  ecell: ECellInfo;
  context: EditorContext;
  range2: EditorRange;
  cellhandles: { ShowCellHandles: (show: boolean) => void };
  MoveECellCallback: Record<string, (editor: EditorObject) => void>;
  StatusCallback: Record<
    string,
    { func: (editor: EditorObject, kind: string, arg: unknown, params: unknown) => void; params: unknown }
  >;
  SettingsCallbacks: Record<string, SettingsCallback>;
  SetECellHeaders: (kind: string) => void;
  UpdateCellCSS: (cell: CellElement | undefined, row: number, col: number) => void;
  EnsureECellVisible: () => void;
  busy: boolean;
  ensureecell: boolean;
}

export interface SettingsCallback {
  save: (editor: EditorObject, setting: string) => string;
  load: (editor: EditorObject, setting: string, line: string, flags: unknown) => void | boolean;
}

/** `SocialCalc.Sheet` prototype methods we override. */
export interface SheetProto {
  ScheduleSheetCommands?: (
    this: SheetObject,
    cmdstr: string,
    saveundo: boolean,
    isRemote: boolean,
  ) => void;
}

export interface SheetObject {
  _room?: string;
  ScheduleSheetCommands: (cmdstr: string, saveundo: boolean, isRemote: boolean) => void;
  ResetSheet: () => void;
  cells: Record<string, unknown>;
  recalconce?: boolean;
}

export interface SpreadsheetLike {
  editor: EditorObject;
  sheet: SheetObject;
  context: { sheetobj: SheetObject };
  ExecuteCommand?: (cmd: string, args?: string) => void;
  formDataViewer?: SpreadsheetLike & { _room: string; loaded: boolean };
  currentTab?: string;
  tabnums?: Record<string, number | undefined>;
  tabs?: unknown[];
  views?: Record<string, unknown>;
  ExportCallback?: (s: unknown) => void;
  InitializeSpreadsheetViewer?: (id: string, a: number, b: number, c: number) => void;
  InitializeSpreadsheetControl?: (id: string, a: number, b: number, c: number) => void;
  DoOnResize?: () => void;
  ParseSheetSave: (save: string) => void;
  DecodeSpreadsheetSave: (save: string) => DecodedSpreadsheet | undefined;
}

export interface DecodedSpreadsheet {
  sheet?: { start: number; end: number };
  edit?: { start: number; end: number };
}

export interface SocialCalcGlobal {
  // Core state fields owned by the player layer.
  _username?: string;
  _room?: string;
  _auth?: string | undefined;
  _app?: boolean | undefined;
  _view?: boolean | undefined;
  hadSnapshot?: boolean;
  isConnected?: boolean;
  requestParams?: Record<string, string>;

  // Constants + generic API.
  Constants: Record<string, string>;
  Callbacks: {
    broadcast?: BroadcastFn;
    [k: string]: unknown;
  };
  RecalcInfo: {
    LoadSheet?: (ref: string) => void;
    LoadSheetCache?: Record<string, string>;
  };
  Formula?: { SheetCache?: { sheets?: Record<string, unknown> } };
  CurrentSpreadsheetControlObject?: SpreadsheetLike;

  // Ctors referenced by main.ts.
  SpreadsheetControl?: new () => SpreadsheetLike;
  SpreadsheetViewer?: new () => SpreadsheetLike;
  Cell?: new (coord: string) => { displaystring?: string };

  // Hook targets + their originals.
  DoPositionCalculations?: (...args: unknown[]) => unknown;
  OrigDoPositionCalculations?: (...args: unknown[]) => unknown;
  LoadEditorSettings?: (editor: EditorObject, str: string, flags: unknown) => void;
  OrigLoadEditorSettings?: (editor: EditorObject, str: string, flags: unknown) => void;
  SizeSSDiv?: (spreadsheet: { parentNode?: unknown } | undefined) => void;
  OrigSizeSSDiv?: (spreadsheet: { parentNode?: unknown } | undefined) => void;
  ScheduleSheetCommands?: (
    sheet: SheetObject,
    cmdstr: string,
    saveundo: boolean,
    isRemote: boolean,
  ) => void;
  OrigScheduleSheetCommands?: (
    sheet: SheetObject,
    cmdstr: string,
    saveundo: boolean,
    isRemote: boolean,
  ) => void;
  MoveECell?: (editor: EditorObject, newcell: string) => string;
  GetEditorCellElement?: (
    editor: EditorObject,
    row: number,
    col: number,
  ) => CellElement | undefined;
  coordToCr?: (coord: string) => ECellInfo;
  EditorSheetStatusCallback?: (a: unknown, kind: string, arg: unknown, editor: EditorObject) => void;
  RecalcLoadedSheet?: (room: string, sheetdata: string, recalc: boolean) => void;

  // `SocialCalc.Sheet` is used as a class — we only need to access `.prototype`.
  Sheet?: { prototype: SheetProto };
}

export interface EtherCalcGlobal {
  _room?: string;
  [k: string]: unknown;
}

declare global {
  interface Window {
    SocialCalc?: SocialCalcGlobal;
    EtherCalc?: EtherCalcGlobal;
    CryptoJS?: { MD5: (s: string) => { toString: () => string } };
    __MULTI__?: { rows?: Array<{ link: string; title: string }> };
    spreadsheet?: SpreadsheetLike;
    addmsg?: (msg: string, joined?: boolean) => void;
    doresize?: () => void;
    GraphOnClick?: (s: SpreadsheetLike, t?: unknown) => void;
    DoGraph?: (help: boolean, resize: boolean) => void;
  }
}

export {};
