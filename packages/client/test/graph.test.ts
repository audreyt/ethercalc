/**
 * Tests for `src/graph.ts`. The chart drawing code never runs in a real
 * browser from these tests — instead we wire a fake `doc`/`canvas`/`ctx`
 * (see `test/mock-socialcalc.ts`) that records every draw call so we can
 * assert shape rather than pixels.
 *
 * Coverage target: 100/100/100/100.
 */
import { describe, expect, it } from 'vitest';
import {
  installGraph,
  makePalette,
  type GraphHost,
  type GraphSpreadsheet,
} from '../src/graph.ts';
import {
  makeFakeCtx,
  makeFakeDoc,
  makeFakeElement,
  makeFakeOptionCtor,
  makeGraphEnv,
  makeGraphSpreadsheet,
} from './mock-socialcalc.ts';

// ─── makePalette ─────────────────────────────────────────────────────────

describe('makePalette', () => {
  it('returns BAR_COLORS in order then random fallback', () => {
    const p = makePalette(() => 0); // deterministic
    const preset: string[] = [];
    for (let i = 0; i < 13; i++) preset.push(p.getBarColor());
    expect(preset[0]).toBe('ff0');
    expect(preset[12]).toBe('080');
    // After 13 entries we're past BAR_COLORS → random path.
    const rand = p.getBarColor();
    expect(rand).toHaveLength(6);
  });

  it('getDrawColor prefixes `#`', () => {
    const p = makePalette(() => 0);
    expect(p.getDrawColor()).toBe('#ff0');
  });

  it('reset rewinds the counter', () => {
    const p = makePalette();
    p.getBarColor();
    p.getBarColor();
    p.reset();
    expect(p.getBarColor()).toBe('ff0');
  });

  it('random fallback handles rand values near 1.0 (Math.round*14 out of BAR_COLORS)', () => {
    // Math.round(1 * 14) = 14 which is OUT-OF-RANGE of the 13-element
    // array — the `?? '0'` fallback kicks in.
    const p = makePalette(() => 1);
    // Exhaust the 13 preset entries first.
    for (let i = 0; i < 13; i++) p.getBarColor();
    expect(p.getBarColor()).toBe('000000');
  });

  it('Math.random default path is reachable (no explicit rand)', () => {
    // Just smoke-test the default branch by calling many times past the
    // 13-entry preset without an explicit rand arg.
    const p = makePalette();
    for (let i = 0; i < 13; i++) p.getBarColor();
    const fallback = p.getBarColor();
    expect(fallback).toHaveLength(6);
  });
});

// ─── installGraph — registration & constants ─────────────────────────────

describe('installGraph — registration', () => {
  it('wires handlers onto win and GraphTypesInfo onto SocialCalc', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    expect(typeof env.win.GraphOnClick).toBe('function');
    expect(typeof env.win.GraphSetCells).toBe('function');
    expect(typeof env.win.DoGraph).toBe('function');
    expect(typeof env.win.GraphChanged).toBe('function');
    expect(typeof env.win.MinMaxChanged).toBe('function');
    expect(typeof env.win.GraphSave).toBe('function');
    expect(typeof env.win.GraphLoad).toBe('function');
    const gti = env.host.SocialCalc.GraphTypesInfo!;
    expect(gti.displayorder).toEqual([
      'verticalbar',
      'horizontalbar',
      'piechart',
      'linechart',
      'scatterchart',
    ]);
    for (const k of gti.displayorder) {
      const entry = gti[k] as { display: string; func: unknown };
      expect(typeof entry.func).toBe('function');
      expect(entry.display).toBeTruthy();
    }
  });

  it('applyPaletteConstants populates SCC styling keys (default + app mode)', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    expect(env.host.SocialCalc.Constants['s_loc_vertical_bar']).toBe('Vertical Bar');
    expect(env.host.SocialCalc.Constants['SCToolbarbackground']).toContain('404040');
    // App mode flips the cursor bg/fg.
    const envApp = makeGraphEnv();
    envApp.host.SocialCalc.requestParams = { app: '1' };
    installGraph(envApp.host);
    expect(envApp.host.SocialCalc.Constants['defaultHighlightTypeCursorStyle']).toContain('FFF');
    expect(envApp.host.SocialCalc.Constants['defaultColnameStyle']).toContain('color:#000');
  });

  it('respects preset Constants (falls back to "Vertical Bar" when key absent)', () => {
    const env = makeGraphEnv();
    env.host.SocialCalc.Constants['s_loc_vertical_bar'] = 'VB!';
    installGraph(env.host);
    const gti = env.host.SocialCalc.GraphTypesInfo!;
    const vbar = gti.verticalbar as { display: string };
    expect(vbar.display).toBe('VB!');
  });
});

// ─── GraphOnClick ────────────────────────────────────────────────────────

describe('GraphOnClick', () => {
  it('populates the select elements and marks current graphrange', () => {
    const env = makeGraphEnv();
    env.ss.sheet.names = { alpha: {}, beta: {} };
    env.ss.graphrange = 'alpha';
    env.ss.graphtype = 'linechart';
    installGraph(env.host);
    // Attach a RangeChangeCallback container so the setter doesn't blow up.
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    expect(graphlist.options[0]!.text).toBe('[select range]');
    // range.hasrange=false → default "select range" in slot 0.
    expect(graphlist.options.some((o) => o.text === 'alpha' && o.selected)).toBe(true);
    const typenode = env.doc.getElementById(env.ss.idPrefix! + 'graphtype')!;
    const linechartOpt = typenode.options.find((o) => o.value === 'linechart');
    expect(linechartOpt?.selected).toBe(true);
  });

  it('sets graphrange="" case: first option selected, graphtype defaults to first type', () => {
    const env = makeGraphEnv();
    env.ss.sheet.names = {};
    env.ss.graphrange = '';
    delete env.ss.graphtype;
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    expect(graphlist.options[0]!.selected).toBe(true);
    expect(env.ss.graphtype).toBe('verticalbar');
  });

  it('no-ops when graphlist element is absent', () => {
    const env = makeGraphEnv();
    env.doc.elements.delete(env.ss.idPrefix! + 'graphlist');
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    expect(() => env.win.GraphOnClick!(env.ss)).not.toThrow();
  });

  it('no-ops when graphtype select is absent', () => {
    const env = makeGraphEnv();
    env.doc.elements.delete(env.ss.idPrefix! + 'graphtype');
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    expect(() => env.win.GraphOnClick!(env.ss)).not.toThrow();
  });

  it('uses identity localizer when SocialCalc.LocalizeString is absent', () => {
    const env = makeGraphEnv();
    delete env.host.SocialCalc.LocalizeString;
    env.ss.sheet.names = {};
    env.ss.graphrange = '';
    env.ss.graphtype = 'verticalbar';
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    // Identity localizer preserves the ordering; no crash.
    const typenode = env.doc.getElementById(env.ss.idPrefix! + 'graphtype')!;
    expect(typenode.options.map((o) => o.value)).toEqual([
      'verticalbar',
      'horizontalbar',
      'piechart',
      'linechart',
      'scatterchart',
    ]);
  });

  it('onClick handles missing s.idPrefix (uses "" prefix)', () => {
    // Covers the `s.idPrefix ?? ''` nullish branch at line 154/170.
    const env = makeGraphEnv();
    installGraph(env.host);
    // Install helpers that match the bare id (no prefix) so onClick finds
    // elements even with s.idPrefix=undefined.
    env.doc.set('graphlist', 'select');
    env.doc.set('graphtype', 'select');
    delete env.ss.idPrefix;
    env.ss.sheet.names = {};
    env.ss.graphrange = '';
    env.ss.graphtype = 'verticalbar';
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    expect(() => env.win.GraphOnClick!(env.ss)).not.toThrow();
  });

  it('empty sheet.names (undefined) is tolerated', () => {
    const env = makeGraphEnv();
    delete (env.ss.sheet as { names?: unknown }).names;
    env.ss.graphrange = '';
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: true,
      left: 1,
      top: 1,
      right: 2,
      bottom: 3,
    };
    env.win.GraphOnClick!(env.ss);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    // hasrange=true → first option uses crToCoord-derived range label.
    expect(graphlist.options[0]!.text).toMatch(/^C\d+R\d+:C\d+R\d+$/);
  });
});

// ─── updateGraphRangeProposal ────────────────────────────────────────────

describe('updateGraphRangeProposal (invoked via editor RangeChangeCallback)', () => {
  it('hasrange=true rewrites option[0].text via crToCoord', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    // Trigger the callback with a real range.
    const cb = (env.ss.editor as unknown as {
      RangeChangeCallback: { graph: (ed: { range: Record<string, unknown> }) => void };
    }).RangeChangeCallback.graph;
    cb({
      range: { hasrange: true, left: 2, top: 3, right: 4, bottom: 5 },
    });
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    expect(graphlist.options[0]!.text).toBe('C2R3:C4R5');
  });

  it('bails when spreadsheet control is missing an idPrefix', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    // First install the RangeChangeCallback via a healthy onClick...
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    const cb = (env.ss.editor as unknown as {
      RangeChangeCallback: { graph: (ed: { range: Record<string, unknown> }) => void };
    }).RangeChangeCallback.graph;
    // ...now swap the control to one without idPrefix, fire the callback.
    const wrongSs = makeGraphSpreadsheet();
    delete wrongSs.idPrefix;
    env.host.SocialCalc.GetSpreadsheetControlObject = () => wrongSs;
    expect(() =>
      cb({ range: { hasrange: true, left: 1, top: 1, right: 1, bottom: 1 } }),
    ).not.toThrow();
  });

  it('bails when the list element is absent', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    // Wipe the list after install.
    env.doc.elements.delete(env.ss.idPrefix! + 'graphlist');
    const cb = (env.ss.editor as unknown as {
      RangeChangeCallback: { graph: (ed: { range: Record<string, unknown> }) => void };
    }).RangeChangeCallback.graph;
    expect(() =>
      cb({ range: { hasrange: false, left: 0, top: 0, right: 0, bottom: 0 } }),
    ).not.toThrow();
  });

  it('falls back to literal "[select range]" when LocalizeString is absent', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    delete env.host.SocialCalc.LocalizeString;
    const cb = (env.ss.editor as unknown as {
      RangeChangeCallback: { graph: (ed: { range: Record<string, unknown> }) => void };
    }).RangeChangeCallback.graph;
    cb({ range: { hasrange: false, left: 0, top: 0, right: 0, bottom: 0 } });
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    expect(graphlist.options[0]!.text).toBe('[select range]');
  });

  it('bails when options[0] is absent', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    (env.ss.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback = {};
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    env.win.GraphOnClick!(env.ss);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    graphlist.options.length = 0;
    const cb = (env.ss.editor as unknown as {
      RangeChangeCallback: { graph: (ed: { range: Record<string, unknown> }) => void };
    }).RangeChangeCallback.graph;
    expect(() =>
      cb({ range: { hasrange: true, left: 1, top: 1, right: 1, bottom: 1 } }),
    ).not.toThrow();
  });
});

// ─── GraphSetCells ───────────────────────────────────────────────────────

describe('GraphSetCells', () => {
  it('selectedIndex=0 with hasrange=true derives graphrange via crToCoord', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    graphlist.selectedIndex = 0;
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: true,
      left: 1,
      top: 1,
      right: 2,
      bottom: 3,
    };
    (env.ss.editor as unknown as { ecell: { coord: string } }).ecell = { coord: 'A1' };
    env.win.GraphSetCells!();
    expect(env.ss.graphrange).toBe('C1R1:C2R3');
    const rangeDiv = env.doc.getElementById(env.ss.idPrefix! + 'graphrange')!;
    expect(rangeDiv.innerHTML).toBe('C1R1:C2R3');
  });

  it('selectedIndex=0 with hasrange=false uses ecell coord twice', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    graphlist.selectedIndex = 0;
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    (env.ss.editor as unknown as { ecell: { coord: string } }).ecell = { coord: 'B2' };
    env.win.GraphSetCells!();
    expect(env.ss.graphrange).toBe('B2:B2');
  });

  it('non-zero selectedIndex picks the named range', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    graphlist.options = [
      { text: '[select range]', value: '', selected: false },
      { text: 'named', value: 'NAMED', selected: true },
    ];
    graphlist.selectedIndex = 1;
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    (env.ss.editor as unknown as { ecell: { coord: string } }).ecell = { coord: 'A1' };
    env.win.GraphSetCells!();
    expect(env.ss.graphrange).toBe('NAMED');
  });

  it('bails when idPrefix missing', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    delete env.ss.idPrefix;
    expect(() => env.win.GraphSetCells!()).not.toThrow();
  });

  it('bails when list element missing', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    env.doc.elements.delete(env.ss.idPrefix! + 'graphlist');
    expect(() => env.win.GraphSetCells!()).not.toThrow();
  });

  it('tolerates missing graphrange display element', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    const graphlist = env.doc.getElementById(env.ss.idPrefix! + 'graphlist')!;
    graphlist.selectedIndex = 0;
    (env.ss.editor as unknown as { range: Record<string, unknown> }).range = {
      hasrange: false,
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    };
    (env.ss.editor as unknown as { ecell: { coord: string } }).ecell = { coord: 'A1' };
    env.doc.elements.delete(env.ss.idPrefix! + 'graphrange');
    expect(() => env.win.GraphSetCells!()).not.toThrow();
  });
});

// ─── doGraph ─────────────────────────────────────────────────────────────

describe('doGraph', () => {
  it('early returns when spreadsheet has no graphtype', () => {
    const env = makeGraphEnv();
    delete env.ss.graphtype;
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('early returns when graphview element missing', () => {
    const env = makeGraphEnv();
    env.ss.views = {};
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('no graphrange + no helpflag → writes "Graph range not selected" HTML', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = '';
    installGraph(env.host);
    env.host.SocialCalc.Constants['s_GraphRangeNotSelected'] = 'nope!';
    env.win.DoGraph!(false, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('nope!');
  });

  it('no graphrange + no helpflag with no Constants key → default text', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = '';
    installGraph(env.host);
    delete env.host.SocialCalc.Constants['s_GraphRangeNotSelected'];
    env.win.DoGraph!(false, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Graph range not selected');
  });

  it('no graphrange + helpflag=true → calls draw func with null range', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = '';
    env.ss.graphtype = 'verticalbar';
    installGraph(env.host);
    env.win.DoGraph!(true, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    // vertical bar's help path writes help HTML.
    expect(gview.innerHTML).toContain('help');
  });

  it('resolves a name range via Formula.LookupName', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'myrange';
    env.ss.graphtype = 'verticalbar';
    env.host.SocialCalc.Formula = {
      LookupName: () => ({ type: 'range', value: 'A1|B3|' }),
    };
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 1 });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    // Draw path hits the vertical-bar renderer, which writes canvas HTML.
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('canvas');
  });

  it('named range lookup returning non-range type prints "Unknown range name"', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'myrange';
    env.host.SocialCalc.Formula = {
      LookupName: () => ({ type: 'cell', value: 'A1' }),
    };
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Unknown range name');
  });

  it('named range lookup with no result prints fallback "Unknown range name"', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'myrange';
    env.host.SocialCalc.Formula = { LookupName: () => undefined as unknown as never };
    delete env.host.SocialCalc.LocalizeString;
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Unknown range name');
  });

  it('named range value missing `|X|Y|` format → early return', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'myrange';
    env.host.SocialCalc.Formula = {
      LookupName: () => ({ type: 'range', value: 'garbage' }),
    };
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('ParseRange returning undefined → early return', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'A1:A3';
    env.host.SocialCalc.ParseRange = () => undefined as unknown as ReturnType<
      NonNullable<GraphHost['SocialCalc']['ParseRange']>
    >;
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('unknown graphtype still decodes without a draw function', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'does-not-exist';
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });
});

// ─── GraphChanged / MinMaxChanged ────────────────────────────────────────

describe('GraphChanged', () => {
  it('writes node.value into spreadsheet.graphtype', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    const tnl = env.doc.getElementById(env.ss.idPrefix! + 'graphtype')!;
    tnl.options = [
      { text: 'X', value: 'linechart', selected: true },
      { text: 'Y', value: 'verticalbar', selected: false },
    ];
    tnl.selectedIndex = 0;
    env.win.GraphChanged!(tnl as unknown as HTMLSelectElement);
    expect(env.ss.graphtype).toBe('linechart');
  });

  it('tolerates missing win.spreadsheet', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    delete env.win.spreadsheet;
    const tnl = env.doc.getElementById(env.ss.idPrefix! + 'graphtype')!;
    tnl.options = [{ text: 'X', value: 'piechart', selected: true }];
    tnl.selectedIndex = 0;
    expect(() => env.win.GraphChanged!(tnl as unknown as HTMLSelectElement)).not.toThrow();
  });
});

describe('MinMaxChanged', () => {
  it('writes node.value into the right spreadsheet field for each index', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    for (const [idx, key] of [
      [0, 'graphMinX'],
      [1, 'graphMaxX'],
      [2, 'graphMinY'],
      [3, 'graphMaxY'],
    ] as const) {
      const node = { value: `v${idx}` } as unknown as HTMLInputElement;
      env.win.MinMaxChanged!(node, idx);
      expect((env.ss as unknown as Record<string, unknown>)[key]).toBe(`v${idx}`);
    }
  });

  it('tolerates missing win.spreadsheet', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    delete env.win.spreadsheet;
    expect(() => env.win.MinMaxChanged!({ value: '0' } as unknown as HTMLInputElement, 0)).not.toThrow();
  });

  it('unknown index falls through switch without writing', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    // 42 matches no case — fn still calls doGraph (which is a no-op given
    // the default env), no throw.
    expect(() =>
      env.win.MinMaxChanged!({ value: 'v' } as unknown as HTMLInputElement, 42),
    ).not.toThrow();
  });
});

// ─── GraphSave / GraphLoad ──────────────────────────────────────────────

describe('GraphSave', () => {
  it('produces the `graph:range:…:type:…:minmax:…` line', () => {
    const env = makeGraphEnv();
    env.ss.graphrange = 'A1:A3';
    env.ss.graphtype = 'piechart';
    env.ss.graphMinX = 0;
    env.ss.graphMaxX = 10;
    env.ss.graphMinY = -1;
    env.ss.graphMaxY = 1;
    installGraph(env.host);
    const out = env.win.GraphSave!({}, 'graph');
    expect(out).toBe('graph:range:A1:A3:type:piechart:minmax:0,10,-1,1\n');
  });

  it('returns "" when spreadsheet is missing', () => {
    const env = makeGraphEnv();
    env.host.SocialCalc.GetSpreadsheetControlObject = () => undefined as unknown as GraphSpreadsheet;
    installGraph(env.host);
    expect(env.win.GraphSave!({}, 'graph')).toBe('');
  });

  it('defaults to "" when no graphtype/graphrange/min-max fields', () => {
    const env = makeGraphEnv();
    delete env.ss.graphtype;
    delete env.ss.graphrange;
    delete env.ss.graphMinX;
    delete env.ss.graphMaxX;
    delete env.ss.graphMinY;
    delete env.ss.graphMaxY;
    installGraph(env.host);
    const out = env.win.GraphSave!({}, 'graph');
    expect(out).toBe('graph:range::type::minmax:,,,\n');
  });

  it('uses identity encoder when encodeForSave is absent', () => {
    const env = makeGraphEnv();
    delete env.host.SocialCalc.encodeForSave;
    installGraph(env.host);
    expect(env.win.GraphSave!({}, 'graph')).toContain('verticalbar');
  });
});

describe('GraphLoad', () => {
  it('parses range/type/minmax tokens and applies to spreadsheet + inputs', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    // Note: legacy format `split(':')` can't handle a `:` in the range
    // value — that's a bug-for-bug preserved behavior. We use a named
    // range here and cover the minmax path with 4 full values.
    const line = 'graph:range:myrange:type:scatterchart:minmax:1,2,3,4';
    env.win.GraphLoad!({}, 'graph', line, null);
    expect(env.ss.graphrange).toBe('myrange');
    expect(env.ss.graphtype).toBe('scatterchart');
    expect(env.ss.graphMinX).toBe('1');
    expect(env.ss.graphMaxX).toBe('2');
    expect(env.ss.graphMinY).toBe('3');
    expect(env.ss.graphMaxY).toBe('4');
    expect(env.doc.getElementById('SocialCalc-graphMaxY')!.value).toBe('4');
  });

  it('returns false when spreadsheet is missing', () => {
    const env = makeGraphEnv();
    env.host.SocialCalc.GetSpreadsheetControlObject = () => undefined as unknown as GraphSpreadsheet;
    installGraph(env.host);
    expect(env.win.GraphLoad!({}, 'graph', 'graph:range::type:verticalbar', null)).toBe(false);
  });

  it('tolerates missing min/max input elements', () => {
    const env = makeGraphEnv();
    env.doc.elements.delete('SocialCalc-graphMinX');
    env.doc.elements.delete('SocialCalc-graphMaxX');
    env.doc.elements.delete('SocialCalc-graphMinY');
    env.doc.elements.delete('SocialCalc-graphMaxY');
    installGraph(env.host);
    expect(() =>
      env.win.GraphLoad!({}, 'graph', 'graph:minmax:9,8,7,6', null),
    ).not.toThrow();
    expect(env.ss.graphMinX).toBe('9');
  });

  it('uses identity decoder when decodeFromSave is absent', () => {
    const env = makeGraphEnv();
    delete env.host.SocialCalc.decodeFromSave;
    installGraph(env.host);
    env.win.GraphLoad!({}, 'graph', 'graph:type:linechart', null);
    expect(env.ss.graphtype).toBe('linechart');
  });

  it('handles minmax with fewer than 4 values — gaps become ""', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    env.win.GraphLoad!({}, 'graph', 'graph:minmax:1,2', null);
    expect(env.ss.graphMinX).toBe('1');
    expect(env.ss.graphMaxX).toBe('2');
    expect(env.ss.graphMinY).toBe('');
    expect(env.ss.graphMaxY).toBe('');
  });

  it('unknown tokens are ignored', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    expect(() =>
      env.win.GraphLoad!({}, 'graph', 'graph:foo:bar:baz:qux', null),
    ).not.toThrow();
  });

  it('trailing "type" without a value defaults to empty string (?? fallback)', () => {
    // Covers `parts[i+1] ?? ''` for the final `type` slot (line 305).
    const env = makeGraphEnv();
    installGraph(env.host);
    env.win.GraphLoad!({}, 'graph', 'graph:type', null);
    expect(env.ss.graphtype).toBe('');
  });

  it('trailing "range" without a value defaults to empty string (?? fallback)', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    env.win.GraphLoad!({}, 'graph', 'graph:range', null);
    expect(env.ss.graphrange).toBe('');
  });

  it('trailing "minmax" without a value splits an empty string', () => {
    const env = makeGraphEnv();
    installGraph(env.host);
    env.win.GraphLoad!({}, 'graph', 'graph:minmax', null);
    expect(env.ss.graphMinX).toBe('');
  });
});

// ─── Chart draw functions ────────────────────────────────────────────────

function setupChartEnv(gtype: string): ReturnType<typeof makeGraphEnv> {
  const env = makeGraphEnv();
  env.ss.graphtype = gtype;
  env.ss.graphrange = 'A1:A3';
  env.ss.sheet.names = {};
  env.ss.sheet.GetAssuredCell = (coord: string) => {
    // For row-major ranges `A1`, `A2`, `A3` return numeric cells; the
    // "column-before" reads at `_0` are empty.
    if (/^c0\d+$/.test(coord) || /^c\d+0$/.test(coord))
      return { valuetype: 't', datavalue: `lab-${coord}` };
    return { valuetype: 'n', datavalue: Number(coord.replace(/\D/g, '')) };
  };
  // ParseRange reports column=1 for both cr1/cr2 so the "byrow" path runs.
  env.host.SocialCalc.ParseRange = () => ({
    cr1: { col: 1, row: 1 },
    cr2: { col: 1, row: 3 },
  });
  env.host.SocialCalc.rcColname = (n) => `c${n}`;
  return env;
}

describe('drawVerticalBar', () => {
  it('help path writes help HTML', () => {
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    env.win.DoGraph!(true, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Hide Help');
    expect(gview.innerHTML).toContain('This is the help text');
  });

  it('happy path draws bars + zero line', () => {
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('myBarCanvas');
    const canvas = env.doc.getElementById('myBarCanvas')!;
    const ctx = canvas._ctx!;
    // Should have drawn bars (fillRect) + the zero line (moveTo/lineTo/stroke).
    expect(ctx.calls.find((c) => c[0] === 'fillRect')).toBeTruthy();
    expect(ctx.calls.find((c) => c[0] === 'moveTo')).toBeTruthy();
  });

  it('no canvas element → early return without ctx calls', () => {
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    env.doc.elements.delete('myBarCanvas');
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('canvas present but getContext returns null → early return', () => {
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    const canvas = env.doc.getElementById('myBarCanvas')!;
    canvas._ctx = null;
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('all-negative values clamp max to 0', () => {
    const env = setupChartEnv('verticalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: -5 });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // At least one fillRect was recorded.
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('uses fallback label when value-column is empty and range is not single', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'A1:B3';
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 5 });
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 1, row: 1 },
      cr2: { col: 2, row: 3 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // Non-row/non-column range → label falls back to stringified value.
    const texts = ctx.calls.filter((c) => c[0] === 'fillText').map((c) => (c[1] as unknown[])[0]);
    expect(texts.every((t) => typeof t === 'string')).toBe(true);
  });

  it('uses the label path when the adjacent cell is text (row-based range)', () => {
    // Use left=2 so the "column-before" is col 1 (distinct cell).
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'B1:B3';
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      // Column-1 neighbour carries the label.
      if (coord.startsWith('c1') && !coord.startsWith('c11') && !coord.startsWith('c12'))
        return { valuetype: 't', datavalue: `L-${coord}` };
      if (coord.startsWith('c1')) return { valuetype: 't', datavalue: `L-${coord}` };
      return { valuetype: 'n', datavalue: 42 };
    };
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 2, row: 1 },
      cr2: { col: 2, row: 3 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    const texts = ctx.calls
      .filter((c) => c[0] === 'fillText')
      .map((c) => String((c[1] as unknown[])[0]));
    expect(texts.some((t) => t.startsWith('L-'))).toBe(true);
  });
});

describe('drawHorizontalBar', () => {
  it('happy path draws horizontal bars', () => {
    const env = setupChartEnv('horizontalbar');
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('help path', () => {
    const env = setupChartEnv('horizontalbar');
    installGraph(env.host);
    env.win.DoGraph!(true, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Horizontal bar help');
  });

  it('no canvas → early return', () => {
    const env = setupChartEnv('horizontalbar');
    installGraph(env.host);
    env.doc.elements.delete('myBarCanvas');
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('canvas without 2d context → early return', () => {
    const env = setupChartEnv('horizontalbar');
    installGraph(env.host);
    env.doc.getElementById('myBarCanvas')!._ctx = null;
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('empty values → falls back to "/ 1" scale without crashing', () => {
    const env = setupChartEnv('horizontalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'x' });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // No fillRects because values[] is empty.
    expect(ctx.calls.filter((c) => c[0] === 'fillRect')).toHaveLength(0);
  });
});

describe('drawPieChart', () => {
  it('happy path with non-zero slices', () => {
    const env = setupChartEnv('piechart');
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myCanvas')!._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'arc')).toBe(true);
  });

  it('zero-value entries are skipped (pie arc count < values count)', () => {
    const env = setupChartEnv('piechart');
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      if (/^c0/.test(coord)) return { valuetype: 't', datavalue: 'L' };
      return { valuetype: 'n', datavalue: 0 };
    };
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'arc')).toHaveLength(0);
  });

  it('no canvas element → early return', () => {
    const env = setupChartEnv('piechart');
    installGraph(env.host);
    env.doc.elements.delete('myCanvas');
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('canvas without 2d context → early return', () => {
    const env = setupChartEnv('piechart');
    installGraph(env.host);
    env.doc.getElementById('myCanvas')!._ctx = null;
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('drawPieChart bails when range is null (GraphTypesInfo direct call with null range)', () => {
    // Reach the `if (!range) return` guard in drawPieChart by calling the
    // draw fn directly with null.
    const env = setupChartEnv('piechart');
    installGraph(env.host);
    const gti = env.host.SocialCalc.GraphTypesInfo!;
    const pie = gti.piechart as { func: (...args: unknown[]) => void };
    const gview = makeFakeElement('div', 'gv');
    expect(() =>
      pie.func(env.ss, null, gview, 'piechart', false, false),
    ).not.toThrow();
  });
});

describe('drawLineChart', () => {
  it('happy path lineTo for each subsequent value', () => {
    const env = setupChartEnv('linechart');
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myLineCanvas')!._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'moveTo')).toBe(true);
    expect(ctx.calls.some((c) => c[0] === 'lineTo')).toBe(true);
  });

  it('no canvas → early return', () => {
    const env = setupChartEnv('linechart');
    installGraph(env.host);
    env.doc.elements.delete('myLineCanvas');
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('canvas without 2d context → early return', () => {
    const env = setupChartEnv('linechart');
    installGraph(env.host);
    env.doc.getElementById('myLineCanvas')!._ctx = null;
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('bails when range is null (direct call)', () => {
    const env = setupChartEnv('linechart');
    installGraph(env.host);
    const line = (env.host.SocialCalc.GraphTypesInfo!.linechart as {
      func: (...args: unknown[]) => void;
    }).func;
    const gview = makeFakeElement('div', 'gv');
    expect(() => line(env.ss, null, gview, 'linechart', false, false)).not.toThrow();
  });
});

describe('drawScatterChart', () => {
  it('happy path arc per point', () => {
    const env = setupChartEnv('scatterchart');
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myScatterCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'arc').length).toBeGreaterThan(0);
  });

  it('no canvas → early return', () => {
    const env = setupChartEnv('scatterchart');
    installGraph(env.host);
    env.doc.elements.delete('myScatterCanvas');
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('canvas without 2d context → early return', () => {
    const env = setupChartEnv('scatterchart');
    installGraph(env.host);
    env.doc.getElementById('myScatterCanvas')!._ctx = null;
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('bails when range is null (direct call)', () => {
    const env = setupChartEnv('scatterchart');
    installGraph(env.host);
    const scatter = (env.host.SocialCalc.GraphTypesInfo!.scatterchart as {
      func: (...args: unknown[]) => void;
    }).func;
    const gview = makeFakeElement('div', 'gv');
    expect(() => scatter(env.ss, null, gview, 'scatterchart', false, false)).not.toThrow();
  });
});

// ─── Chart draw fallbacks (?? / || null/0 paths) ────────────────────────

describe('chart draw fallbacks', () => {
  it('vertical/horizontal bars fall back to "Hide Help" when Constants key is absent', () => {
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    // Remove the constant to trigger the `?? 'Hide Help'` branch.
    delete env.host.SocialCalc.Constants['s_loc_hide_help'];
    env.win.DoGraph!(true, false);
    const gview = (env.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gview.innerHTML).toContain('Hide Help');
    // And the horizontal-bar chart.
    const envH = setupChartEnv('horizontalbar');
    installGraph(envH.host);
    delete envH.host.SocialCalc.Constants['s_loc_hide_help'];
    envH.win.DoGraph!(true, false);
    const gviewH = (envH.ss.views as { graph: { element: { innerHTML: string } } }).graph.element;
    expect(gviewH.innerHTML).toContain('Hide Help');
  });

  it('vertical bar: zero values → |1 fallback paths for eachwidth + maxval-minval', () => {
    // Values all zero → max-min==0 so `|| 1` fallbacks run.
    const env = setupChartEnv('verticalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 0 });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // Still drew bars.
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('vertical bar: empty numeric values → (values.length || 1) triggers', () => {
    // All cells text → values[] is empty → `values.length || 1`.
    const env = setupChartEnv('verticalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'x' });
    installGraph(env.host);
    expect(() => env.win.DoGraph!(false, false)).not.toThrow();
  });

  it('vertical bar: labels[] shorter than values → fallback "" for trailing labels', () => {
    // Force labels[i] to be undefined by making collectValues push fewer
    // labels than values. Since the implementation always pushes a label
    // alongside each value, we side-step by stubbing a drawer with a
    // direct call and an ad-hoc range that reaches the label fallback.
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    const fn = (env.host.SocialCalc.GraphTypesInfo!.verticalbar as {
      func: (ss: unknown, r: unknown, gv: unknown, gtype: string, help: boolean, rs: boolean) => void;
    }).func;
    const gview = makeFakeElement('div', 'gv');
    // Override host.doc.getElementById to return a canvas we control.
    const canvasEl = makeFakeElement('canvas', 'myBarCanvas');
    const ogid = env.host.doc.getElementById;
    env.host.doc.getElementById = (id: string) => (id === 'myBarCanvas' ? (canvasEl as unknown as HTMLElement) : ogid(id));
    // Put some numeric values into the sheet so collectValues returns non-empty.
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 1 });
    fn(env.ss, { left: 1, right: 1, top: 1, bottom: 1 }, gview, 'verticalbar', false, false);
    // No assertion beyond "didn't throw" — this test's goal is branch exec.
    expect(canvasEl._ctx!.calls.length).toBeGreaterThan(0);
  });

  it('horizontal bar: empty values (all text) → /1 fallback + no bars', () => {
    const env = setupChartEnv('horizontalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'x' });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'fillRect')).toHaveLength(0);
  });

  it('horizontal bar: all-zero values → max===0 → `max || 1` fallback', () => {
    const env = setupChartEnv('horizontalbar');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 0 });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // Bars drawn at width 0 but the call still fires.
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('pie chart: all-zero values → every slice is skipped via `!Number(values[i])`', () => {
    const env = setupChartEnv('piechart');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 0 });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'arc')).toHaveLength(0);
  });

  it('pie chart: mixed-sign values summing to 0 exercise `total || 1` fallback', () => {
    // Use left=2 so cr1 reads column 1 (distinct from main cell at col 2).
    const env = setupChartEnv('piechart');
    const values = [5, -5, 10, -10];
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      // Column-1 neighbour is the label column: text values.
      if (coord.startsWith('c1')) return { valuetype: 't', datavalue: 'lbl' };
      // Column-2 data rows: extract the row N from 'c2N', values[N-1].
      const m = /^c2(\d+)$/.exec(coord);
      if (m) return { valuetype: 'n', datavalue: values[Number(m[1]) - 1] ?? 0 };
      return { valuetype: 'n', datavalue: 0 };
    };
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 2, row: 1 },
      cr2: { col: 2, row: 4 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myCanvas')!._ctx!;
    // Non-zero slices were drawn.
    expect(ctx.calls.filter((c) => c[0] === 'arc').length).toBeGreaterThan(0);
  });

  it('line chart: empty values (all text) exercises `values.length || 1`', () => {
    const env = setupChartEnv('linechart');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'x' });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myLineCanvas')!._ctx!;
    // No line points to connect.
    expect(ctx.calls.filter((c) => c[0] === 'moveTo')).toHaveLength(0);
  });

  it('scatter chart: empty values exercises `values.length || 1`', () => {
    const env = setupChartEnv('scatterchart');
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'x' });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myScatterCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'arc')).toHaveLength(0);
  });

  it('vertical bar: eachwidth falls back to 1 when floor div is exactly 4 (eachwidth=0)', () => {
    // `Math.floor(totalwidth / (values.length || 1)) - 4 || 1`: with
    // canvas.width=12 and values.length=3, floor(12/3)=4, minus 4 = 0 → || 1.
    const env = setupChartEnv('verticalbar');
    installGraph(env.host);
    const canv = env.doc.getElementById('myBarCanvas')!;
    canv.width = 12;
    env.win.DoGraph!(false, false);
    const ctx = canv._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('horizontal bar: `each` falls back to 1 when floor div equals 4', () => {
    // Same trick: canvas.height=12 with values.length=3 → floor(12/3)-4=0 → || 1.
    const env = setupChartEnv('horizontalbar');
    installGraph(env.host);
    const canv = env.doc.getElementById('myBarCanvas')!;
    canv.height = 12;
    env.win.DoGraph!(false, false);
    expect(canv._ctx!.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('vertical bar: decreasing values exercise the `v > max` false branch', () => {
    // If later values are less than the running max, the `if (v > maxval)`
    // inside the max/min scan misses its true branch for those iterations.
    const env = setupChartEnv('verticalbar');
    const vals = [5, 4, 3];
    let i = 0;
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      if (coord.startsWith('c0')) return { valuetype: 't', datavalue: 'x' };
      return { valuetype: 'n', datavalue: vals[i++ % vals.length]! };
    };
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });
});

// ─── collectValues edge cases (exercised through the drawers) ────────────

describe('collectValues (via drawers)', () => {
  it('column-based range (range.top === range.bottom) uses byrow=false path', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'A1:C1';
    env.ss.sheet.names = {};
    // Non-numeric column for label lookup path.
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      if (coord.endsWith('0')) return { valuetype: 't', datavalue: `lbl-${coord}` };
      return { valuetype: 'n', datavalue: 7 };
    };
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 1, row: 1 },
      cr2: { col: 3, row: 1 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    expect(ctx.calls.some((c) => c[0] === 'fillRect')).toBe(true);
  });

  it('non-numeric cell values are skipped entirely', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'A1:A3';
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 't', datavalue: 'text' });
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 1, row: 1 },
      cr2: { col: 1, row: 3 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // Still emits a zero-line stroke but no fillRect per bar.
    expect(ctx.calls.filter((c) => c[0] === 'fillRect')).toHaveLength(0);
  });

  it('range.top-1 becomes 1 when top is 1 (the `|| 1` guard)', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'A1:C1'; // single-row
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = (coord: string) => ({ valuetype: 'n', datavalue: coord.length });
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 1, row: 1 },
      cr2: { col: 3, row: 1 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    expect(ctx.calls.filter((c) => c[0] === 'fillRect').length).toBeGreaterThan(0);
  });

  it('range.left-1 becomes 1 when left is 1 (row-based)', () => {
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'A1:A3';
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = () => ({ valuetype: 'n', datavalue: 3 });
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 1, row: 1 },
      cr2: { col: 1, row: 3 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    // Bars drawn.
    expect(ctx.calls.filter((c) => c[0] === 'fillRect').length).toBeGreaterThan(0);
  });

  it('label cell with numeric valuetype is accepted as a label', () => {
    // left=2 so the neighbour is distinct from the main cell. Neighbour is
    // numeric → valuetype[0]==='n' path exercises labels.push(String(c1.datavalue)).
    const env = makeGraphEnv();
    env.ss.graphtype = 'verticalbar';
    env.ss.graphrange = 'B1:B3';
    env.ss.sheet.names = {};
    env.ss.sheet.GetAssuredCell = (coord: string) => {
      // Column-1 label cells have numeric type + distinct values.
      if (coord.startsWith('c1')) return { valuetype: 'n', datavalue: 99 };
      return { valuetype: 'n', datavalue: 1 };
    };
    env.host.SocialCalc.ParseRange = () => ({
      cr1: { col: 2, row: 1 },
      cr2: { col: 2, row: 3 },
    });
    installGraph(env.host);
    env.win.DoGraph!(false, false);
    const ctx = env.doc.getElementById('myBarCanvas')!._ctx!;
    const texts = ctx.calls
      .filter((c) => c[0] === 'fillText')
      .map((c) => String((c[1] as unknown[])[0]));
    expect(texts.some((t) => t === '99')).toBe(true);
  });
});

// ─── Low-level helpers ───────────────────────────────────────────────────

describe('test helpers', () => {
  it('makeFakeCtx records draw calls', () => {
    const ctx = makeFakeCtx();
    ctx.moveTo(1, 2);
    ctx.lineTo(3, 4);
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.closePath();
    ctx.arc(0, 0, 10, 0, Math.PI, false);
    expect(ctx.calls.map((c) => c[0])).toEqual([
      'moveTo',
      'lineTo',
      'stroke',
      'fill',
      'beginPath',
      'closePath',
      'arc',
    ]);
  });

  it('makeFakeDoc stores and retrieves by id', () => {
    const doc = makeFakeDoc();
    const el = doc.set('x');
    expect(doc.getElementById('x')).toBe(el);
    expect(doc.getElementById('missing')).toBeNull();
  });

  it('makeFakeElement.getContext non-2d kind returns null', () => {
    const el = makeFakeElement('canvas', 'c');
    expect(el.getContext('webgl')).toBeNull();
  });

  it('makeFakeOptionCtor constructs with default value', () => {
    const Ctor = makeFakeOptionCtor();
    const op = new Ctor('text');
    expect(op.text).toBe('text');
    expect(op.value).toBe('');
    expect(op.selected).toBe(false);
  });
});
