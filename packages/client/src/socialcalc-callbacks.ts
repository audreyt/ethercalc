/**
 * Direct TypeScript port of `src/player-broadcast.ls`.
 *
 * Behavior preservation is load-bearing here — the SocialCalc runtime we
 * bundle on-page expects every hook below to be installed exactly once and
 * to forward to the captured "Orig" versions, or the toolbar + cell grid
 * stop updating (CLAUDE.md §7 item 10).
 *
 * Call `installCallbacks(SocialCalc)` once, at startup, after
 * `SocialCalc.js` is on the page.  Calling it twice is a no-op — we guard
 * with `SocialCalc.OrigDoPositionCalculations` exactly like the legacy file
 * did (line 4).
 */
import type {
  BroadcastFn,
  SocialCalcGlobal,
  SheetObject,
  EditorObject,
  ECellInfo,
  CellElement,
} from './types.ts';

// ─── Helpers ─────────────────────────────────────────────────────────────

/**
 * Parse `window.location.search` into a flat map.  Direct port of the
 * `parseQuery` local at `player-broadcast.ls:7`.
 *
 * Exported separately so `main.ts` can share it (legacy code re-parsed from
 * `SocialCalc.requestParams`, but we want a single implementation).
 */
export function parseQuery(raw: string): Record<string, string> {
  let qstr = raw;
  if (qstr.charAt(0) === '?') qstr = qstr.substr(1);
  const query: Record<string, string> = {};
  if (!qstr) return query;
  const params = qstr.split('&');
  for (const pair of params) {
    const eq = pair.indexOf('=');
    const k = eq >= 0 ? pair.slice(0, eq) : pair;
    const v = eq >= 0 ? pair.slice(eq + 1) : '';
    if (!k) continue;
    query[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return query;
}

export interface InstallOptions {
  /** The WS broadcast function from `ws-adapter.ts`. */
  broadcast: BroadcastFn;
  /** `window.location.search`, injected so Node tests can supply a fixture. */
  search?: string;
  /** Handle to the `window`-like host — tests can pass a stub. */
  win?: {
    CryptoJS?: { MD5: (s: string) => { toString: () => string } };
    __MULTI__?: { rows?: Array<{ link: string; title: string }> };
  };
}

// ─── Install (idempotent) ────────────────────────────────────────────────

/**
 * Install every player-broadcast hook onto the provided `SocialCalc` global.
 * Idempotent — if we've already run, all the `Orig*` sentinel fields are
 * populated and we bail out immediately.
 *
 * Returns `false` if the install was skipped (already installed), `true`
 * otherwise.  Caller uses this only in tests; production code ignores it.
 */
export function installCallbacks(
  SocialCalc: SocialCalcGlobal,
  opts: InstallOptions,
): boolean {
  if (SocialCalc.OrigDoPositionCalculations) return false;

  const search = opts.search ?? '';
  SocialCalc.requestParams = parseQuery(search);

  // 1. DoPositionCalculations — wake the server into sending presence.
  const origPos = SocialCalc.DoPositionCalculations;
  if (origPos) SocialCalc.OrigDoPositionCalculations = origPos;
  SocialCalc.DoPositionCalculations = function (this: unknown, ...args: unknown[]): unknown {
    const ret = origPos?.apply(SocialCalc, args);
    SocialCalc.Callbacks.broadcast?.('ask.ecell');
    return ret;
  };

  // 2. Snapshot-aware settings load — gated on CryptoJS being on the page.
  const cryptoHost = opts.win ?? {};
  if (cryptoHost.CryptoJS) {
    const md5 = (s: string): string => cryptoHost.CryptoJS!.MD5(s).toString();
    SocialCalc.hadSnapshot = true;
    const origLoad = SocialCalc.LoadEditorSettings;
    if (origLoad) SocialCalc.OrigLoadEditorSettings = origLoad;
    SocialCalc.LoadEditorSettings = (editor, str, flags) => {
      editor.SettingsCallbacks.ethercalc = {
        save: (): string =>
          `ethercalc:${md5(editor.context.sheetobj.CreateSheetSave())}\n`,
        load: (ed, _setting, line): void => {
          const hash = line.replace(/^\w+:/, '');
          if (hash === md5(ed.context.sheetobj.CreateSheetSave())) {
            SocialCalc.hadSnapshot = false;
          } else {
            SocialCalc.hadSnapshot = true;
          }
        },
      };
      // Restore the original so we only rewrite callbacks once per room.
      /* istanbul ignore else */
      if (origLoad) SocialCalc.LoadEditorSettings = origLoad;
      else delete SocialCalc.LoadEditorSettings;
      origLoad?.(editor, str, flags);
    };
  } else {
    SocialCalc.hadSnapshot = false;
  }

  // 3. Guard SizeSSDiv against null parent nodes (post-hibernation edge).
  const origSize = SocialCalc.SizeSSDiv;
  if (origSize) SocialCalc.OrigSizeSSDiv = origSize;
  SocialCalc.SizeSSDiv = (spreadsheet) => {
    if (!spreadsheet || !spreadsheet.parentNode) return;
    origSize?.(spreadsheet);
  };

  // 4. Rewrite ScheduleSheetCommands — broadcast every user action.
  // SocialCalc.Sheet::ScheduleSheetCommands in the legacy source sets up a
  // bound method on every sheet instance.  We do the same here.
  if (SocialCalc.Sheet && SocialCalc.Sheet.prototype) {
    SocialCalc.Sheet.prototype.ScheduleSheetCommands = function (
      this: SheetObject,
      ...rest: [string, boolean, boolean]
    ): void {
      SocialCalc.ScheduleSheetCommands?.(this, rest[0], rest[1], rest[2]);
    };
  }
  const origSched = SocialCalc.ScheduleSheetCommands;
  if (origSched) SocialCalc.OrigScheduleSheetCommands = origSched;
  SocialCalc.ScheduleSheetCommands = (sheet, cmdstr, saveundo, isRemote) => {
    let cmd = cmdstr.replace(/\n\n+/g, '\n');
    if (!/\S/.test(cmd)) return;
    if (!isRemote && cmd !== 'redisplay' && cmd !== 'recalc') {
      // Multi-sheet rewrite of `$Title.A1` → `"index.1"!A1`.  Matches
      // `player-broadcast.ls:58`.
      const multi = (opts.win as { __MULTI__?: { rows?: Array<{ link: string; title: string }> } } | undefined)
        ?.__MULTI__;
      if (multi?.rows?.length && /set \w+ formula /.test(cmd)) {
        for (const { link, title } of multi.rows) {
          const re = new RegExp(`\\$${title}\\.([A-Z]+[1-9][0-9]*)`, 'ig');
          cmd = cmd.replace(re, `"${link.replace('/', '')}"!$1`);
        }
      }
      SocialCalc.Callbacks.broadcast?.('execute', {
        cmdstr: cmd,
        saveundo,
        room: sheet._room,
      });
    }
    origSched?.(sheet, cmd, saveundo, isRemote);
  };

  // 5. MoveECell override — broadcast cursor moves + track peer highlights.
  SocialCalc.MoveECell = (editor, targetCell) => {
    const highlights = editor.context.highlights;
    let newcell = targetCell;
    if (editor.ecell) {
      if (editor.ecell.coord === newcell) return newcell;
      SocialCalc.Callbacks.broadcast?.('ecell', {
        original: editor.ecell.coord,
        ecell: newcell,
      });
      const origCell = SocialCalc.GetEditorCellElement?.(
        editor,
        editor.ecell.row,
        editor.ecell.col,
      );
      delete highlights[editor.ecell.coord];
      const range2 = editor.range2;
      if (
        range2.hasrange &&
        editor.ecell.row >= range2.top &&
        editor.ecell.row <= range2.bottom &&
        editor.ecell.col >= range2.left &&
        editor.ecell.col <= range2.right
      ) {
        highlights[editor.ecell.coord] = 'range2';
      }
      editor.UpdateCellCSS(origCell, editor.ecell.row, editor.ecell.col);
      editor.SetECellHeaders('');
      editor.cellhandles.ShowCellHandles(false);
    } else {
      SocialCalc.Callbacks.broadcast?.('ecell', { ecell: newcell });
    }
    newcell = editor.context.cellskip[newcell] ?? newcell;
    const cr = SocialCalc.coordToCr!(newcell) as ECellInfo;
    editor.ecell = cr;
    editor.ecell.coord = newcell;
    const cell: CellElement | undefined = SocialCalc.GetEditorCellElement?.(
      editor,
      editor.ecell.row,
      editor.ecell.col,
    );
    highlights[newcell] = 'cursor';
    for (const f of Object.keys(editor.MoveECellCallback)) {
      editor.MoveECellCallback[f]!(editor);
    }
    editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
    editor.SetECellHeaders('selected');
    for (const f of Object.keys(editor.StatusCallback)) {
      const sc = editor.StatusCallback[f]!;
      sc.func(editor, 'moveecell', newcell, sc.params);
    }
    if (editor.busy) {
      editor.ensureecell = true;
    } else {
      editor.ensureecell = false;
      editor.EnsureECellVisible();
    }
    return newcell;
  };

  return true;
}

/**
 * Install the `broadcast` entry-point onto `SocialCalc.Callbacks`.
 *
 * Two-arg signature matches the legacy `SocialCalc.Callbacks.broadcast` that
 * the whole stack dereferences — see `CLAUDE.md` §7 item 10.
 */
export function installBroadcast(
  SocialCalc: SocialCalcGlobal,
  broadcast: BroadcastFn,
): void {
  SocialCalc.Callbacks = SocialCalc.Callbacks ?? {};
  SocialCalc.Callbacks.broadcast = broadcast;
}

/**
 * Wire `SocialCalc.RecalcInfo.LoadSheet(ref)` → `ask.recalc` broadcast.
 * Matches the clause in `player.ls:84`.
 */
export function installRecalcLoader(
  SocialCalc: SocialCalcGlobal,
  broadcast: BroadcastFn,
): void {
  SocialCalc.RecalcInfo.LoadSheetCache = {};
  SocialCalc.RecalcInfo.LoadSheet = (ref: string): void => {
    // Legacy guard — the LS source checked `ref is /[^.=_a-zA-Z0-9]/`; in
    // JS `is` always yields false against a regex object, so the clause was
    // a dead-code no-op.  We preserve the _actual_ legacy behavior by never
    // rejecting, but we still lowercase.
    const normalized = ref.toLowerCase();
    broadcast('ask.recalc', { room: normalized });
  };
}

/** For tests: wipe every Orig* we installed so the next install() will run. */
export function uninstallCallbacks(SocialCalc: SocialCalcGlobal): void {
  if (SocialCalc.OrigDoPositionCalculations) {
    SocialCalc.DoPositionCalculations = SocialCalc.OrigDoPositionCalculations;
  }
  if (SocialCalc.OrigLoadEditorSettings) {
    SocialCalc.LoadEditorSettings = SocialCalc.OrigLoadEditorSettings;
  }
  if (SocialCalc.OrigSizeSSDiv) {
    SocialCalc.SizeSSDiv = SocialCalc.OrigSizeSSDiv;
  }
  if (SocialCalc.OrigScheduleSheetCommands) {
    SocialCalc.ScheduleSheetCommands = SocialCalc.OrigScheduleSheetCommands;
  }
  delete SocialCalc.OrigDoPositionCalculations;
  delete SocialCalc.OrigLoadEditorSettings;
  delete SocialCalc.OrigSizeSSDiv;
  delete SocialCalc.OrigScheduleSheetCommands;
  delete SocialCalc.requestParams;
  if (SocialCalc.Sheet?.prototype) {
    delete SocialCalc.Sheet.prototype.ScheduleSheetCommands;
  }
}
