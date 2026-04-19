/**
 * Minimum SocialCalc stub for callbacks/main tests.  Just enough surface
 * to exercise the monkey-patch and dispatch layer.
 */
import type {
  SocialCalcGlobal,
  SpreadsheetLike,
  EditorObject,
  SheetObject,
  CellElement,
  ECellInfo,
} from '../src/types.ts';
import type { GraphHost, GraphSpreadsheet } from '../src/graph.ts';

export function makeSocialCalc(): SocialCalcGlobal {
  const sc: SocialCalcGlobal = {
    Constants: {},
    Callbacks: {},
    RecalcInfo: {},
    DoPositionCalculations: (() => 'pos') as (...args: unknown[]) => unknown,
    LoadEditorSettings: () => {},
    SizeSSDiv: (sp) => {
      if (!sp || !sp.parentNode) return;
    },
    ScheduleSheetCommands: () => {},
    Sheet: { prototype: {} },
    coordToCr: (coord: string): ECellInfo => ({
      coord,
      row: parseInt(coord.replace(/\D/g, ''), 10) || 1,
      col: 1,
    }),
    GetEditorCellElement: (_e, _r, _c): CellElement | undefined => ({
      element: { className: '' },
    }),
    RecalcLoadedSheet: () => {},
    EditorSheetStatusCallback: () => {},
  };
  return sc;
}

export function makeEditor(): EditorObject {
  return {
    ecell: { coord: 'A1', row: 1, col: 1 },
    context: {
      highlights: {},
      sheetobj: {
        CreateSheetSave: () => 'SAVE',
        ScheduleSheetCommands: () => {},
      },
      cellskip: {},
    },
    range2: { hasrange: false, top: 0, bottom: 0, left: 0, right: 0 },
    cellhandles: { ShowCellHandles: () => {} },
    MoveECellCallback: {},
    StatusCallback: {},
    SettingsCallbacks: {},
    SetECellHeaders: () => {},
    UpdateCellCSS: () => {},
    EnsureECellVisible: () => {},
    busy: false,
    ensureecell: false,
  };
}

export function makeSheet(): SheetObject {
  return {
    ScheduleSheetCommands: () => {},
    ResetSheet: () => {},
    cells: {},
  };
}

export function makeSpreadsheet(): SpreadsheetLike {
  const sheet = makeSheet();
  return {
    editor: makeEditor(),
    sheet,
    context: { sheetobj: sheet },
    ParseSheetSave: () => {},
    DecodeSpreadsheetSave: () => ({ sheet: { start: 0, end: 5 }, edit: { start: 5, end: 8 } }),
  };
}

// ─── Graph test plumbing ─────────────────────────────────────────────────

export interface FakeElement {
  tagName: string;
  id: string;
  innerHTML: string;
  value: string;
  length: number;
  selectedIndex: number;
  options: FakeOption[];
  width: number;
  height: number;
  /** Returned by HTMLCanvasElement.getContext('2d'). May be null. */
  _ctx: FakeCtx | null;
  getContext(kind: string): FakeCtx | null;
}

export interface FakeOption {
  text: string;
  value: string;
  selected: boolean;
}

export interface FakeCtx {
  calls: Array<[string, unknown[]]>;
  font: string;
  lineWidth: number;
  fillStyle: string;
  strokeStyle: string;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  fill(): void;
  beginPath(): void;
  closePath(): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number): void;
  arc(cx: number, cy: number, r: number, a: number, b: number, anti: boolean): void;
}

export function makeFakeCtx(): FakeCtx {
  const calls: FakeCtx['calls'] = [];
  return {
    calls,
    font: '',
    lineWidth: 0,
    fillStyle: '',
    strokeStyle: '',
    moveTo: (x, y) => void calls.push(['moveTo', [x, y]]),
    lineTo: (x, y) => void calls.push(['lineTo', [x, y]]),
    stroke: () => void calls.push(['stroke', []]),
    fill: () => void calls.push(['fill', []]),
    beginPath: () => void calls.push(['beginPath', []]),
    closePath: () => void calls.push(['closePath', []]),
    fillRect: (x, y, w, h) => void calls.push(['fillRect', [x, y, w, h]]),
    fillText: (text, x, y) => void calls.push(['fillText', [text, x, y]]),
    arc: (cx, cy, r, a, b, anti) => void calls.push(['arc', [cx, cy, r, a, b, anti]]),
  };
}

export function makeFakeElement(tagName: string, id: string): FakeElement {
  const el: FakeElement = {
    tagName,
    id,
    innerHTML: '',
    value: '',
    length: 0,
    selectedIndex: 0,
    options: [],
    width: 500,
    height: 400,
    _ctx: makeFakeCtx(),
    getContext(kind: string): FakeCtx | null {
      return kind === '2d' ? el._ctx : null;
    },
  };
  return el;
}

/** Minimal `document` substitute with `getElementById` backed by a Map. */
export function makeFakeDoc(): {
  elements: Map<string, FakeElement>;
  getElementById: (id: string) => FakeElement | null;
  set: (id: string, tagName?: string) => FakeElement;
} {
  const elements = new Map<string, FakeElement>();
  const doc = {
    elements,
    getElementById: (id: string): FakeElement | null => elements.get(id) ?? null,
    set: (id: string, tagName: string = 'div'): FakeElement => {
      const el = makeFakeElement(tagName, id);
      elements.set(id, el);
      return el;
    },
  };
  return doc;
}

/**
 * `new Option(text, value?)` needs to exist as a constructor so that
 * `new Option(...)` in graph.ts works. We install it on the win stub.
 */
export function makeFakeOptionCtor(): new (text: string, value?: string) => FakeOption {
  return class OptionImpl {
    text: string;
    value: string;
    selected = false;
    constructor(text: string, value: string = '') {
      this.text = text;
      this.value = value;
    }
  } as unknown as new (text: string, value?: string) => FakeOption;
}

/**
 * Minimal spreadsheet shape used by the graph code. Provides the cells a
 * chart will read via `sheet.GetAssuredCell(coord)` plus the tab/view that
 * tells `doGraph` where to paint. Tests override per-scenario.
 */
export function makeGraphSpreadsheet(): GraphSpreadsheet {
  const sheet = makeSheet() as GraphSpreadsheet['sheet'];
  sheet.names = {};
  sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 0 });
  const ss = {
    editor: makeEditor(),
    sheet,
    context: { sheetobj: sheet },
    ParseSheetSave: () => {},
    DecodeSpreadsheetSave: () => undefined,
    idPrefix: 'SocialCalc-',
    graphrange: 'A1:A3',
    graphtype: 'verticalbar',
    views: {
      graph: { element: makeFakeElement('div', 'graphview') },
    },
  } as unknown as GraphSpreadsheet;
  return ss;
}

export interface GraphTestEnv {
  host: GraphHost;
  doc: ReturnType<typeof makeFakeDoc>;
  win: GraphHost['win'];
  ss: GraphSpreadsheet;
}

/**
 * Build the full environment for graph tests. Pre-installs list/type/range
 * select + graphview elements and a spreadsheet control. Callers override
 * specific bits to exercise edge cases.
 */
export function makeGraphEnv(opts: Partial<GraphTestEnv> = {}): GraphTestEnv {
  const sc = makeSocialCalc() as GraphHost['SocialCalc'];
  sc.Constants = {};
  // Default crToCoord / rcColname / ParseRange helpers so real math runs.
  sc.crToCoord = (col, row) => `C${col}R${row}`;
  sc.rcColname = (n) => `c${n}`;
  sc.ParseRange = (r) => {
    // Accepts "A1:B3" — we don't parse it, just provide crude defaults for
    // `left/right/top/bottom` derivation. Tests that care override this.
    const m = /^(\w+?)(\d+):(\w+?)(\d+)$/.exec(r);
    if (!m) return { cr1: { col: 1, row: 1 }, cr2: { col: 1, row: 3 } };
    // Map column letters A..Z → 1..26.
    const toCol = (c: string): number =>
      c.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0) + 1;
    return {
      cr1: { col: toCol(m[1]!), row: Number(m[2]) },
      cr2: { col: toCol(m[3]!), row: Number(m[4]) },
    };
  };
  sc.GetSpreadsheetControlObject = () => env.ss;
  sc.LocalizeString = (s: string) => s;
  sc.encodeForSave = (s: string) => s;
  sc.decodeFromSave = (s: string) => s;
  sc.Formula = {};
  const doc = opts.doc ?? makeFakeDoc();
  const ss = opts.ss ?? makeGraphSpreadsheet();
  doc.set(ss.idPrefix! + 'graphlist', 'select');
  doc.set(ss.idPrefix! + 'graphtype', 'select');
  doc.set(ss.idPrefix! + 'graphrange', 'div');
  // Canvas ids used by drawers.
  doc.set('myBarCanvas', 'canvas');
  doc.set('myCanvas', 'canvas');
  doc.set('myLineCanvas', 'canvas');
  doc.set('myScatterCanvas', 'canvas');
  // Min/max input ids used by graphLoad.
  doc.set('SocialCalc-graphMinX', 'input');
  doc.set('SocialCalc-graphMaxX', 'input');
  doc.set('SocialCalc-graphMinY', 'input');
  doc.set('SocialCalc-graphMaxY', 'input');
  const win: GraphTestEnv['win'] = Object.assign(
    Object.create(null) as Record<string, unknown>,
    { spreadsheet: ss, Option: makeFakeOptionCtor() },
  );
  // graph.ts uses `new Option(…)` which resolves via the global; expose it.
  (globalThis as unknown as { Option: unknown }).Option = makeFakeOptionCtor();
  const host: GraphHost = {
    SocialCalc: sc,
    win,
    doc: {
      getElementById: (id: string) => doc.getElementById(id) as unknown as HTMLElement | null,
    },
  };
  const env: GraphTestEnv = { host, doc, win, ss };
  return env;
}
