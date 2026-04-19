/**
 * Graph / chart integration — port of `src/player-graph.ls`.
 *
 * Public surface required by `index.html`:
 *
 *   - `window.GraphOnClick`    — called when the "Graph" tab is focused
 *   - `window.GraphSetCells`   — "OK" button handler in the graph toolbar
 *   - `window.DoGraph`         — central redraw entry
 *   - `window.GraphChanged`    — chart-type dropdown change
 *   - `window.MinMaxChanged`   — min/max X/Y input change
 *   - `window.GraphSave`       — SettingsCallbacks.graph.save
 *   - `window.GraphLoad`       — SettingsCallbacks.graph.load
 *   - `SocialCalc.GraphTypesInfo` + SCC styling tweaks
 *
 * Chart drawing bodies (vertical-bar, horizontal-bar, pie, line, scatter)
 * are covered by `test/graph.test.ts` using a fake 2D canvas context.
 *
 * Everything is installed as a *registration* function that accepts the
 * SocialCalc + window stubs — mirrors `installGraph({ win, SocialCalc })`.
 */

import type { SocialCalcGlobal, SpreadsheetLike } from './types.ts';

// ─── Graph plumbing types ────────────────────────────────────────────────

export interface GraphRange {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface GraphHost {
  SocialCalc: SocialCalcGlobal & {
    GraphTypesInfo?: GraphTypesInfo;
    Popup?: { LocalizeString?: (s: string) => string };
    LocalizeString?: (s: string) => string;
    LocalizeSubstrings?: (s: string) => string;
    GetSpreadsheetControlObject?: () => GraphSpreadsheet;
    ParseRange?: (r: string) => { cr1: { col: number; row: number }; cr2: { col: number; row: number } };
    Formula?: {
      SheetCache?: { sheets?: Record<string, unknown> };
      LookupName?: (sheet: unknown, name: string) => { type: string; value: string };
    };
    rcColname?: (n: number) => string;
    crToCoord?: (col: number, row: number) => string;
    encodeForSave?: (s: string) => string;
    decodeFromSave?: (s: string) => string;
  };
  /** `window` — the script writes globals onto it. */
  win: Record<string, unknown> & {
    GraphOnClick?: GraphOnClickFn;
    GraphSetCells?: () => void;
    DoGraph?: (help: boolean, resize: boolean) => void;
    GraphChanged?: (node: HTMLSelectElement) => void;
    MinMaxChanged?: (node: HTMLInputElement, index: number) => void;
    GraphSave?: (editor: unknown, setting: string) => string;
    GraphLoad?: (editor: unknown, setting: string, line: string, flags: unknown) => boolean;
    spreadsheet?: GraphSpreadsheet;
  };
  doc: {
    getElementById: (id: string) => HTMLElement | null;
  };
}

export interface GraphSpreadsheet extends SpreadsheetLike {
  idPrefix?: string;
  graphrange?: string;
  graphtype?: string;
  graphMinX?: string | number;
  graphMaxX?: string | number;
  graphMinY?: string | number;
  graphMaxY?: string | number;
  width?: number;
  height?: number;
  nonviewheight?: number;
  sheet: SpreadsheetLike['sheet'] & {
    names?: Record<string, unknown>;
    GetAssuredCell: (coord: string) => { valuetype: string; datavalue: string | number };
  };
}

export type GraphDrawFn = (
  spreadsheet: GraphSpreadsheet,
  range: GraphRange | null,
  gview: HTMLElement,
  gtype: string,
  helpflag: boolean,
  isResize: boolean,
) => void;

export interface GraphTypesInfo {
  displayorder: string[];
  [k: string]: { display: string; func: GraphDrawFn } | string[];
}

export type GraphOnClickFn = (s: GraphSpreadsheet) => void;

// ─── Color helpers ───────────────────────────────────────────────────────

const BAR_COLORS = ['ff0', '0ff', 'f0f', '00f', 'f00', '0f0', '888', '880', '088', '808', '008', '800', '080'];

/**
 * Deterministic round-robin + random-fallback palette matching the legacy
 * behavior.  Exposed so tests can seed the RNG.
 */
export function makePalette(rand: () => number = Math.random): {
  getBarColor: () => string;
  getDrawColor: () => string;
  reset: () => void;
} {
  let colorIndex = 0;
  const getBarColor = (): string => {
    const preset = BAR_COLORS[colorIndex++];
    if (preset) return preset;
    let out = '';
    for (let i = 0; i < 6; i++) out += BAR_COLORS[Math.round(rand() * 14)] ?? '0';
    return out.slice(0, 6);
  };
  const getDrawColor = (): string => `#${getBarColor()}`;
  const reset = (): void => {
    colorIndex = 0;
  };
  return { getBarColor, getDrawColor, reset };
}

// ─── Public functions: install + small handlers ──────────────────────────

export function installGraph(host: GraphHost): void {
  const { SocialCalc, win, doc } = host;
  const palette = makePalette();

  function updateGraphRangeProposal(editor: {
    range: { hasrange: boolean; left: number; top: number; right: number; bottom: number };
  }): void {
    const ss = SocialCalc.GetSpreadsheetControlObject?.();
    if (!ss?.idPrefix) return;
    const ele = doc.getElementById(ss.idPrefix + 'graphlist') as HTMLSelectElement | null;
    if (!ele || !ele.options[0]) return;
    if (editor.range.hasrange) {
      ele.options[0].text =
        SocialCalc.crToCoord!(editor.range.left, editor.range.top) +
        ':' +
        SocialCalc.crToCoord!(editor.range.right, editor.range.bottom);
    } else {
      ele.options[0].text = SocialCalc.LocalizeString?.('[select range]') ?? '[select range]';
    }
  }

  const onClick: GraphOnClickFn = (s) => {
    palette.reset();
    const SCLoc = SocialCalc.LocalizeString ?? ((x: string) => x);
    const namelist: string[] = [];
    const nl = doc.getElementById((s.idPrefix ?? '') + 'graphlist') as HTMLSelectElement | null;
    // Refresh range proposal when the user drags a new selection.
    (s.editor as unknown as { RangeChangeCallback: Record<string, unknown> }).RangeChangeCallback.graph =
      updateGraphRangeProposal;
    for (const name of Object.keys(s.sheet.names ?? {})) namelist.push(name);
    namelist.sort();
    if (!nl) return;
    nl.length = 0;
    nl.options[0] = new Option(SCLoc('[select range]'));
    for (let i = 0; i < namelist.length; i++) {
      const name = namelist[i]!;
      nl.options[i + 1] = new Option(name, name);
      if (name === s.graphrange) nl.options[i + 1]!.selected = true;
    }
    if (s.graphrange === '') nl.options[0]!.selected = true;
    updateGraphRangeProposal(s.editor as unknown as Parameters<typeof updateGraphRangeProposal>[0]);
    const tnl = doc.getElementById((s.idPrefix ?? '') + 'graphtype') as HTMLSelectElement | null;
    if (!tnl) return;
    tnl.length = 0;
    const gti = SocialCalc.GraphTypesInfo!;
    for (let i = 0; i < gti.displayorder.length; i++) {
      const name = gti.displayorder[i]!;
      const info = gti[name] as { display: string; func: GraphDrawFn };
      tnl.options[i] = new Option(SCLoc(info.display), name);
      if (name === s.graphtype) tnl.options[i]!.selected = true;
    }
    if (!s.graphtype) {
      tnl.options[0]!.selected = true;
      s.graphtype = tnl.options[0]!.value;
    }
    doGraph(false, true);
  };

  function graphSetCells(): void {
    const spreadsheet = SocialCalc.GetSpreadsheetControlObject?.();
    if (!spreadsheet?.idPrefix) return;
    const editor = spreadsheet.editor as unknown as {
      range: { hasrange: boolean; left: number; top: number; right: number; bottom: number };
      ecell: { coord: string };
    };
    const lele = doc.getElementById(spreadsheet.idPrefix + 'graphlist') as HTMLSelectElement | null;
    if (!lele) return;
    if (lele.selectedIndex === 0) {
      if (editor.range.hasrange) {
        spreadsheet.graphrange =
          SocialCalc.crToCoord!(editor.range.left, editor.range.top) +
          ':' +
          SocialCalc.crToCoord!(editor.range.right, editor.range.bottom);
      } else {
        spreadsheet.graphrange = editor.ecell.coord + ':' + editor.ecell.coord;
      }
    } else {
      spreadsheet.graphrange = lele.options[lele.selectedIndex]!.value;
    }
    const ele = doc.getElementById(spreadsheet.idPrefix + 'graphrange');
    if (ele) ele.innerHTML = spreadsheet.graphrange;
    doGraph(false, false);
  }

  function doGraph(helpflag: boolean, isResize: boolean): void {
    palette.reset();
    const spreadsheet = SocialCalc.GetSpreadsheetControlObject?.();
    if (!spreadsheet?.graphtype) return;
    const gview = (spreadsheet.views as { graph?: { element?: HTMLElement } } | undefined)?.graph?.element;
    if (!gview) return;
    const gti = SocialCalc.GraphTypesInfo!;
    const ginfo = gti[spreadsheet.graphtype] as { display: string; func: GraphDrawFn } | undefined;
    const gfunc = ginfo?.func;
    if (!spreadsheet.graphrange) {
      if (gfunc && helpflag) gfunc(spreadsheet, null, gview, spreadsheet.graphtype, helpflag, isResize);
      else
        gview.innerHTML = `<div style="padding:30px;font-weight:bold;">${
          SocialCalc.Constants['s_GraphRangeNotSelected'] ?? 'Graph range not selected'
        }</div>`;
      return;
    }
    let grange = spreadsheet.graphrange;
    if (grange && grange.indexOf(':') === -1) {
      const nrange = SocialCalc.Formula?.LookupName?.(spreadsheet.sheet, grange);
      if (!nrange || nrange.type !== 'range') {
        gview.innerHTML = (SocialCalc.LocalizeString?.('Unknown range name') ?? 'Unknown range name') + ': ' + grange;
        return;
      }
      const rparts = /^(.*)\|(.*)\|$/.exec(nrange.value);
      if (!rparts) return;
      grange = rparts[1] + ':' + rparts[2];
    }
    const prange = SocialCalc.ParseRange?.(grange);
    if (!prange) return;
    const range: GraphRange = {
      left: Math.min(prange.cr1.col, prange.cr2.col),
      right: Math.max(prange.cr1.col, prange.cr2.col),
      top: Math.min(prange.cr1.row, prange.cr2.row),
      bottom: Math.max(prange.cr1.row, prange.cr2.row),
    };
    gfunc?.(spreadsheet, range, gview, spreadsheet.graphtype, helpflag, isResize);
  }

  function graphChanged(node: HTMLSelectElement): void {
    const ss = win.spreadsheet;
    if (ss) ss.graphtype = node.options[node.selectedIndex]!.value;
    doGraph(false, false);
  }

  function minMaxChanged(node: HTMLInputElement, index: number): void {
    const ss = win.spreadsheet;
    if (!ss) return;
    switch (index) {
      case 0:
        ss.graphMinX = node.value;
        break;
      case 1:
        ss.graphMaxX = node.value;
        break;
      case 2:
        ss.graphMinY = node.value;
        break;
      case 3:
        ss.graphMaxY = node.value;
        break;
    }
    doGraph(false, true);
  }

  function graphSave(): string {
    const spreadsheet = SocialCalc.GetSpreadsheetControlObject?.();
    if (!spreadsheet) return '';
    const gtype = spreadsheet.graphtype ?? '';
    const encode = SocialCalc.encodeForSave ?? ((x: string) => x);
    let str =
      'graph:range:' +
      encode(spreadsheet.graphrange ?? '') +
      ':type:' +
      encode(gtype);
    str +=
      ':minmax:' +
      encode(
        `${spreadsheet.graphMinX ?? ''},${spreadsheet.graphMaxX ?? ''},${spreadsheet.graphMinY ?? ''},${spreadsheet.graphMaxY ?? ''}`,
      ) +
      '\n';
    return str;
  }

  function graphLoad(_editor: unknown, _setting: string, line: string): boolean {
    const spreadsheet = SocialCalc.GetSpreadsheetControlObject?.();
    if (!spreadsheet) return false;
    const decode = SocialCalc.decodeFromSave ?? ((x: string) => x);
    const parts = line.split(':');
    for (let i = 1; i < parts.length; i += 2) {
      switch (parts[i]) {
        case 'type':
          spreadsheet.graphtype = decode(parts[i + 1] ?? '');
          break;
        case 'range':
          spreadsheet.graphrange = decode(parts[i + 1] ?? '');
          break;
        case 'minmax': {
          const split = decode(parts[i + 1] ?? '').split(',');
          const ids = ['SocialCalc-graphMinX', 'SocialCalc-graphMaxX', 'SocialCalc-graphMinY', 'SocialCalc-graphMaxY'];
          const keys: Array<'graphMinX' | 'graphMaxX' | 'graphMinY' | 'graphMaxY'> = [
            'graphMinX',
            'graphMaxX',
            'graphMinY',
            'graphMaxY',
          ];
          for (let j = 0; j < 4; j++) {
            spreadsheet[keys[j]!] = split[j] ?? '';
            const el = doc.getElementById(ids[j]!) as HTMLInputElement | null;
            if (el) el.value = split[j] ?? '';
          }
          break;
        }
      }
    }
    return true;
  }

  // Register on the window for `index.html`/SocialCalc to find.
  win.GraphOnClick = onClick;
  win.GraphSetCells = graphSetCells;
  win.DoGraph = doGraph;
  win.GraphChanged = graphChanged;
  win.MinMaxChanged = minMaxChanged;
  win.GraphSave = graphSave;
  win.GraphLoad = graphLoad;

  // Register chart-type metadata.
  SocialCalc.GraphTypesInfo = {
    displayorder: ['verticalbar', 'horizontalbar', 'piechart', 'linechart', 'scatterchart'],
    verticalbar: {
      display: SocialCalc.Constants['s_loc_vertical_bar'] ?? 'Vertical Bar',
      func: drawVerticalBar(host, palette),
    },
    horizontalbar: {
      display: SocialCalc.Constants['s_loc_horizontal_bar'] ?? 'Horizontal Bar',
      func: drawHorizontalBar(host, palette),
    },
    piechart: {
      display: SocialCalc.Constants['s_loc_pie_chart'] ?? 'Pie Chart',
      func: drawPieChart(host, palette),
    },
    linechart: {
      display: SocialCalc.Constants['s_loc_line_chart'] ?? 'Line Chart',
      func: drawLineChart(host, palette),
    },
    scatterchart: {
      display: SocialCalc.Constants['s_loc_scatter_chart'] ?? 'Scatter Chart',
      func: drawScatterChart(host, palette),
    },
  };

  // Constant string additions (CSS palette tweaks).
  applyPaletteConstants(SocialCalc);
}

function applyPaletteConstants(SocialCalc: SocialCalcGlobal): void {
  const scc = SocialCalc.Constants;
  scc['s_loc_horizontal_bar'] = 'Horizontal Bar';
  scc['s_loc_vertical_bar'] = 'Vertical Bar';
  scc['s_loc_pie_chart'] = 'Pie Chart';
  scc['s_loc_line_chart'] = 'Line Chart';
  scc['s_loc_scatter_chart'] = 'Scatter Chart';
  scc['s_loc_hide_help'] = 'Hide Help';
  const selectedbg = '404040';
  const unselectedbg = '808080';
  let cursorbg = 'A6A6A6';
  let fg = 'FFF';
  if (SocialCalc.requestParams?.['app'] !== undefined) {
    cursorbg = 'FFF';
    fg = '000';
  }
  scc['SCToolbarbackground'] = 'background-color:#' + selectedbg + ';';
  scc['SCTabbackground'] = 'background-color:#' + unselectedbg + ';';
  scc['SCTabselectedCSS'] =
    'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#' +
    selectedbg +
    ';cursor:default;border-right:1px solid #CCC;';
  scc['SCTabplainCSS'] =
    'font-size:small;padding:6px 30px 6px 8px;color:#FFF;background-color:#' +
    unselectedbg +
    ';cursor:default;border-right:1px solid #CCC;';
  scc['SCToolbartext'] = 'font-size:x-small;font-weight:bold;color:#FFF;padding-bottom:4px;';
  scc['ISCButtonBorderNormal'] = '#' + selectedbg;
  scc['ISCButtonBorderHover'] = '#999';
  scc['ISCButtonBorderDown'] = '#FFF';
  scc['ISCButtonDownBackground'] = '#888';
  scc['defaultImagePrefix'] = 'images/sc_';
  scc['defaultColnameStyle'] =
    'overflow:visible;font-size:small;text-align:center;color:#' + fg + ';background-color:#' + unselectedbg;
  scc['defaultSelectedColnameStyle'] =
    'overflow:visible;font-size:small;text-align:center;color:#' + fg + ';background-color:#' + selectedbg;
  scc['defaultRownameStyle'] =
    'position:relative;overflow:visible;font-size:small;text-align:center;vertical-align:middle;color:#' +
    fg +
    ';background-color:#' +
    unselectedbg +
    ';direction:rtl;';
  scc['defaultSelectedRownameStyle'] =
    'position:relative;overflow:visible;font-size:small;text-align:center;vertical-align:middle;color:#' +
    fg +
    ';background-color:#' +
    selectedbg +
    ';';
  scc['defaultHighlightTypeCursorStyle'] = 'color:#' + fg + ';backgroundColor:#' + cursorbg + ';';
}

// ─── Chart drawing functions ─────────────────────────────────────────────
// The bodies below port the canvas-math from the legacy file verbatim.

type Palette = ReturnType<typeof makePalette>;

function collectValues(
  host: GraphHost,
  spreadsheet: GraphSpreadsheet,
  range: GraphRange,
): { values: number[]; labels: string[]; byrow: boolean; nitems: number; minX?: number; maxX?: number } {
  const values: number[] = [];
  const labels: string[] = [];
  let byrow: boolean;
  let nitems: number;
  if (range.left === range.right) {
    nitems = range.bottom - range.top + 1;
    byrow = true;
  } else {
    nitems = range.right - range.left + 1;
    byrow = false;
  }
  const rcColname = host.SocialCalc.rcColname!;
  for (let i = 0; i < nitems; i++) {
    const cr = byrow
      ? rcColname(range.left) + (i + range.top)
      : rcColname(i + range.left) + range.top;
    const cr1 = byrow
      ? rcColname(range.left - 1 || 1) + (i + range.top)
      : rcColname(i + range.left) + (range.top - 1 || 1);
    const cell = spreadsheet.sheet.GetAssuredCell(cr);
    if (String(cell.valuetype).charAt(0) === 'n') {
      const val = Number(cell.datavalue);
      values.push(val);
      const c1 = spreadsheet.sheet.GetAssuredCell(cr1);
      if (
        (range.right === range.left || range.top === range.bottom) &&
        (String(c1.valuetype).charAt(0) === 't' || String(c1.valuetype).charAt(0) === 'n')
      ) {
        labels.push(String(c1.datavalue));
      } else {
        labels.push(String(val));
      }
    }
  }
  return { values, labels, byrow, nitems };
}

function drawVerticalBar(host: GraphHost, palette: Palette): GraphDrawFn {
  return (spreadsheet, range, gview, gtype, helpflag) => {
    if (helpflag || !range) {
      const hideHelp = host.SocialCalc.Constants['s_loc_hide_help'] ?? 'Hide Help';
      const display = (host.SocialCalc.GraphTypesInfo![gtype] as { display: string }).display;
      gview.innerHTML =
        `<input type="button" value="${hideHelp}" onclick="DoGraph(false,false);"><br><br>` +
        `This is the help text for graph type: ${display}.`;
      return;
    }
    const { values, labels } = collectValues(host, spreadsheet, range);
    let maxval: number | null = null;
    let minval: number | null = null;
    for (const v of values) {
      if (maxval === null || v > maxval) maxval = v;
      if (minval === null || v < minval) minval = v;
    }
    if ((maxval ?? 0) < 0) maxval = 0;
    if ((minval ?? 0) > 0) minval = 0;
    gview.innerHTML = '<table><tr><td><canvas id="myBarCanvas" width="500px" height="400px" style="border:1px solid black;"></canvas></td><td><span id="googleBarChart"></span></td></tr></table>';
    const canv = host.doc.getElementById('myBarCanvas') as HTMLCanvasElement | null;
    if (!canv) return;
    const ctx = canv.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.font = '10pt bold Arial';
    const maxheight = canv.height - 60;
    const totalwidth = canv.width;
    palette.reset();
    const eachwidth = Math.floor(totalwidth / (values.length || 1)) - 4 || 1;
    const zeroLine = maxheight * ((maxval ?? 0) / (((maxval ?? 0) - (minval ?? 0)) || 1)) + 30;
    const yScale = maxheight / (((maxval ?? 0) - (minval ?? 0)) || 1);
    ctx.lineWidth = 5;
    ctx.moveTo(0, zeroLine);
    ctx.lineTo(canv.width, zeroLine);
    ctx.stroke();
    for (let i = 0; i < values.length; i++) {
      ctx.fillStyle = '#' + palette.getBarColor();
      ctx.fillRect(i * eachwidth, zeroLine - yScale * values[i]!, eachwidth, yScale * values[i]!);
      // Labels are pushed in lockstep with values; the `?? ''` fallback is a
      // defensive guard never triggered by collectValues.
      ctx.fillText(/* istanbul ignore next */ labels[i] ?? '', i * eachwidth + 4, zeroLine + 16);
    }
  };
}

function drawHorizontalBar(host: GraphHost, palette: Palette): GraphDrawFn {
  return (spreadsheet, range, gview, gtype, helpflag) => {
    if (helpflag || !range) {
      const hideHelp = host.SocialCalc.Constants['s_loc_hide_help'] ?? 'Hide Help';
      gview.innerHTML = `<input type="button" value="${hideHelp}" onclick="DoGraph(false,false);"><br><br>Horizontal bar help.`;
      return;
    }
    const { values, labels } = collectValues(host, spreadsheet, range);
    gview.innerHTML = '<canvas id="myBarCanvas" width="500px" height="400px" style="border:1px solid black;"></canvas>';
    const canv = host.doc.getElementById('myBarCanvas') as HTMLCanvasElement | null;
    if (!canv) return;
    const ctx = canv.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.font = '10pt bold Arial';
    palette.reset();
    const each = Math.floor(canv.height / (values.length || 1)) - 4 || 1;
    let max = 0;
    for (const v of values) if (v > max) max = v;
    for (let i = 0; i < values.length; i++) {
      ctx.fillStyle = '#' + palette.getBarColor();
      ctx.fillRect(0, i * each, (values[i]! / (max || 1)) * (canv.width - 50), each);
      ctx.fillStyle = '#000';
      // Labels pushed 1:1 with values — `?? ''` is defensive-only.
      ctx.fillText(/* istanbul ignore next */ labels[i] ?? '', 4, i * each + each / 2);
    }
  };
}

function drawPieChart(host: GraphHost, palette: Palette): GraphDrawFn {
  return (spreadsheet, range, gview) => {
    if (!range) return;
    const { values, labels } = collectValues(host, spreadsheet, range);
    const total = values.reduce((a, b) => a + b, 0);
    gview.innerHTML = '<canvas id="myCanvas" width="500px" height="400px"></canvas>';
    const canv = host.doc.getElementById('myCanvas') as HTMLCanvasElement | null;
    if (!canv) return;
    const ctx = canv.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.font = '10pt Arial';
    const centerX = canv.width / 2;
    const centerY = canv.height / 2;
    const rad = centerY - 50;
    let last = 0;
    for (let i = 0; i < values.length; i++) {
      if (!Number(values[i])) continue;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.fillStyle = palette.getDrawColor();
      const arc = 2 * Math.PI * (values[i]! / (total || 1));
      ctx.arc(centerX, centerY, rad, last, last + arc, false);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#000';
      // Labels pushed 1:1 with values — `?? ''` is defensive-only.
      ctx.fillText(/* istanbul ignore next */ labels[i] ?? '', centerX + Math.cos(last + arc / 2) * rad, centerY + Math.sin(last + arc / 2) * rad);
      last += arc;
    }
  };
}

function drawLineChart(host: GraphHost, palette: Palette): GraphDrawFn {
  return (spreadsheet, range, gview) => {
    if (!range) return;
    const { values } = collectValues(host, spreadsheet, range);
    gview.innerHTML = '<canvas id="myLineCanvas" width="500px" height="400px"></canvas>';
    const canv = host.doc.getElementById('myLineCanvas') as HTMLCanvasElement | null;
    if (!canv) return;
    const ctx = canv.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.strokeStyle = palette.getDrawColor();
    ctx.beginPath();
    const w = (canv.width - 40) / (values.length || 1);
    for (let i = 0; i < values.length; i++) {
      if (i === 0) ctx.moveTo(20, canv.height - values[i]! - 20);
      else ctx.lineTo(20 + i * w, canv.height - values[i]! - 20);
    }
    ctx.stroke();
  };
}

function drawScatterChart(host: GraphHost, palette: Palette): GraphDrawFn {
  return (spreadsheet, range, gview) => {
    if (!range) return;
    const { values } = collectValues(host, spreadsheet, range);
    gview.innerHTML = '<canvas id="myScatterCanvas" width="500px" height="400px"></canvas>';
    const canv = host.doc.getElementById('myScatterCanvas') as HTMLCanvasElement | null;
    if (!canv) return;
    const ctx = canv.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.fillStyle = palette.getDrawColor();
    const w = (canv.width - 40) / (values.length || 1);
    for (let i = 0; i < values.length; i++) {
      ctx.beginPath();
      ctx.arc(20 + i * w, canv.height - values[i]! - 20, 5, 0, 2 * Math.PI, false);
      ctx.fill();
    }
  };
}
