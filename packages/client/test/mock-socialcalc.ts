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
