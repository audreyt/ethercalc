import { describe, expect, it, vi } from 'vitest';
import { runMain, deriveBaseUrl, createDispatcher, type MainHost } from '../src/main.ts';
import { makeSocialCalc, makeSpreadsheet } from './mock-socialcalc.ts';
import { createMockFactory, createFakeTimers } from './mock-ws.ts';
import type { SocialCalcGlobal, SpreadsheetLike } from '../src/types.ts';

function makeHost(overrides: Partial<MainHost> = {}): MainHost {
  const SocialCalc = overrides.SocialCalc ?? makeSocialCalc();
  const host: MainHost = {
    SocialCalc,
    location: overrides.location ?? { search: '?auth=hmac', hash: '#room1', pathname: '/room1/edit' },
    history: overrides.history ?? { pushState: () => {} },
    spreadsheet: overrides.spreadsheet ?? makeSpreadsheet(),
    setTimeout: overrides.setTimeout ?? ((fn: () => void) => {
      fn();
      return 1;
    }),
  };
  if (overrides.EtherCalc) host.EtherCalc = overrides.EtherCalc;
  if (overrides.addmsg) host.addmsg = overrides.addmsg;
  if (overrides.DoGraph) host.DoGraph = overrides.DoGraph;
  if (overrides.Drupal) host.Drupal = overrides.Drupal;
  return host;
}

describe('deriveBaseUrl', () => {
  it('strips /edit and room suffixes', () => {
    expect(deriveBaseUrl('/room1/edit', 'room1')).toBe('/');
    expect(deriveBaseUrl('/room1/view', 'room1')).toBe('/');
    expect(deriveBaseUrl('/room1/app', 'room1')).toBe('/');
    expect(deriveBaseUrl('/prefix/room1', 'room1')).toBe('/prefix');
    expect(deriveBaseUrl('/other', 'room1')).toBe('/other');
  });
});

describe('runMain', () => {
  it('parses query + sets session flags + connects', () => {
    const host = makeHost({
      location: { search: '?auth=abc&app=1', hash: '', pathname: '/my-room/app' },
    });
    (host.SocialCalc as SocialCalcGlobal)._room = 'my-room';
    const { factory, sockets } = createMockFactory();
    const handle = runMain({ host, randomUsername: () => 'user-x', wsFactory: factory });
    expect(handle).not.toBeNull();
    expect(host.SocialCalc._username).toBe('user-x');
    expect(host.SocialCalc._auth).toBe('abc');
    expect(host.SocialCalc._app).toBe(true);
    expect(host.SocialCalc._view).toBeUndefined();
    expect(sockets).toHaveLength(1);
    expect(sockets[0]!.url).toContain('/_ws/my-room');
    expect(sockets[0]!.url).toContain('auth=abc');
    handle!.stop();
  });

  it('falls back through EtherCalc._room and location.hash', () => {
    const hostA = makeHost({
      EtherCalc: { _room: 'from-ec' },
      location: { search: '', hash: '', pathname: '/' },
    });
    delete hostA.SocialCalc._room;
    const { factory: factoryA, sockets: socketsA } = createMockFactory();
    runMain({ host: hostA, wsFactory: factoryA })!.stop();
    expect(socketsA[0]!.url).toContain('from-ec');

    const hostB = makeHost({ location: { search: '', hash: '#_viahash', pathname: '/' } });
    delete hostB.SocialCalc._room;
    const { factory: factoryB, sockets: socketsB } = createMockFactory();
    runMain({ host: hostB, wsFactory: factoryB })!.stop();
    expect(socketsB[0]!.url).toContain('viahash'); // leading underscore is stripped
  });

  it('returns null when no room is resolvable', () => {
    const host = makeHost({ location: { search: '', hash: '', pathname: '/' } });
    delete host.SocialCalc._room;
    const { factory } = createMockFactory();
    const handle = runMain({ host, wsFactory: factory });
    expect(handle).toBeNull();
  });

  it('view flag and no auth yield "/view"', () => {
    const host = makeHost({
      location: { search: '?view=1', hash: '', pathname: '/room/view' },
    });
    host.SocialCalc._room = 'room';
    const pushes: string[] = [];
    host.history.pushState = (_s, _t, url) => pushes.push(url);
    const { factory } = createMockFactory();
    const handle = runMain({ host, wsFactory: factory });
    expect(pushes).toEqual(['./room/view']);
    handle!.stop();
  });

  it('no flags yields empty suffix', () => {
    const host = makeHost({
      location: { search: '', hash: '', pathname: '/room' },
    });
    host.SocialCalc._room = 'room';
    const pushes: string[] = [];
    host.history.pushState = (_s, _t, url) => pushes.push(url);
    const { factory } = createMockFactory();
    const handle = runMain({ host, wsFactory: factory });
    expect(pushes).toEqual(['./room']);
    handle!.stop();
  });

  it('uses custom baseUrl when provided', () => {
    const host = makeHost();
    host.SocialCalc._room = 'r';
    const { factory, sockets } = createMockFactory();
    const handle = runMain({
      host,
      baseUrl: 'wss://explicit.example',
      wsFactory: factory,
    });
    expect(sockets[0]!.url.startsWith('wss://explicit.example')).toBe(true);
    handle!.stop();
  });

  it('forwards all adapter option overrides', () => {
    const host = makeHost();
    host.SocialCalc._room = 'r';
    const timers = createFakeTimers();
    const statuses: Array<{ type: string }> = [];
    const { factory } = createMockFactory();
    const handle = runMain({
      host,
      wsFactory: factory,
      reconnectDelayMs: 999,
      maxReconnectAttempts: 1,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
      onStatus: (s) => statuses.push(s),
    });
    handle!.stop();
  });

  it('default randomUsername yields a Math.random toString', () => {
    const host = makeHost();
    host.SocialCalc._room = 'r';
    const { factory } = createMockFactory();
    const handle = runMain({ host, wsFactory: factory });
    expect(host.SocialCalc._username).toMatch(/^[0-9.]+(?:e.*)?$/);
    handle!.stop();
  });

  it('installs a broadcast that forwards to the adapter', () => {
    const host = makeHost();
    host.SocialCalc._room = 'r';
    const { factory, sockets } = createMockFactory();
    const handle = runMain({ host, wsFactory: factory });
    sockets[0]!.acceptOpen();
    host.SocialCalc.Callbacks.broadcast!('chat', { msg: 'hi' });
    expect(sockets[0]!.sent[0]).toContain('"msg":"hi"');
    handle!.stop();
  });
});

// ─── Dispatcher scenarios ────────────────────────────────────────────────

function setup(): {
  host: MainHost;
  dispatch: ReturnType<typeof createDispatcher>;
  sc: SocialCalcGlobal;
  ss: SpreadsheetLike;
} {
  const sc = makeSocialCalc();
  sc._username = 'me';
  sc._room = 'room1';
  sc.isConnected = true;
  const ss = makeSpreadsheet();
  ss.tabnums = { graph: 3 };
  const host = makeHost({ SocialCalc: sc, spreadsheet: ss });
  const dispatch = createDispatcher(host);
  (globalThis as unknown as { SocialCalc: SocialCalcGlobal }).SocialCalc = sc;
  return { host, dispatch, sc, ss };
}

describe('createDispatcher', () => {
  it('no-ops when SocialCalc disconnected', () => {
    const { dispatch, sc } = setup();
    sc.isConnected = false;
    expect(() => dispatch({ type: 'snapshot', snapshot: 'SAVE-hello' })).not.toThrow();
  });

  it('no-ops without a spreadsheet', () => {
    const { host, dispatch } = setup();
    delete (host as { spreadsheet?: unknown }).spreadsheet;
    expect(() => dispatch({ type: 'snapshot', snapshot: 'X' })).not.toThrow();
  });

  it('drops self-echo', () => {
    const { dispatch, sc, ss } = setup();
    let scheduled = 0;
    ss.context.sheetobj.ScheduleSheetCommands = () => {
      scheduled++;
    };
    dispatch({
      type: 'execute',
      room: sc._room!,
      user: sc._username!,
      cmdstr: 'set A1',
    });
    expect(scheduled).toBe(0);
  });

  it('drops data.to for someone else', () => {
    const { dispatch, ss } = setup();
    let scheduled = 0;
    ss.context.sheetobj.ScheduleSheetCommands = () => {
      scheduled++;
    };
    dispatch({
      type: 'execute',
      room: 'room1',
      user: 'other',
      cmdstr: 'x',
      // @ts-expect-error — `to` is a legacy internal field.
      to: 'not-me',
    });
    expect(scheduled).toBe(0);
  });

  it('cross-room log gets dropped (no form viewer)', () => {
    const { dispatch, ss } = setup();
    let reset = 0;
    ss.sheet.ResetSheet = () => {
      reset++;
    };
    dispatch({
      type: 'log',
      room: 'otherRoom',
      log: [],
      chat: [],
      snapshot: 'SAVE',
    });
    expect(reset).toBe(0);
  });

  it('cross-room execute for formDataViewer is routed', () => {
    const { dispatch, ss } = setup();
    const viewerSheet = { ...ss.sheet, _room: 'room1_formdata' };
    ss.formDataViewer = {
      ...ss,
      sheet: viewerSheet,
      context: { sheetobj: ss.context.sheetobj },
      _room: 'room1_formdata',
      loaded: false,
    } as unknown as NonNullable<SpreadsheetLike['formDataViewer']>;
    let targetSS: unknown = null;
    ss.formDataViewer.context.sheetobj.ScheduleSheetCommands = (cmd) => {
      targetSS = cmd;
    };
    dispatch({
      type: 'execute',
      room: 'room1_formdata',
      user: 'them',
      cmdstr: 'set A1 value n 1',
    });
    expect(targetSS).toBe('set A1 value n 1');
  });

  it('cross-room execute without matching formData is dropped', () => {
    const { dispatch, ss } = setup();
    let scheduled = 0;
    ss.context.sheetobj.ScheduleSheetCommands = () => {
      scheduled++;
    };
    dispatch({
      type: 'execute',
      room: 'yet-another',
      user: 'u',
      cmdstr: 'set A1',
    });
    expect(scheduled).toBe(0);
  });

  it('confirmemailsent routes through EditorSheetStatusCallback', () => {
    const { dispatch, sc } = setup();
    const calls: unknown[] = [];
    sc.EditorSheetStatusCallback = (a, b, c) => calls.push([a, b, c]);
    dispatch({ type: 'confirmemailsent', message: 'ok' });
    expect(calls).toEqual([[null, 'confirmemailsent', 'ok']]);
  });

  it('chat → addmsg', () => {
    const { host, dispatch } = setup();
    const seen: string[] = [];
    host.addmsg = (m) => seen.push(m);
    dispatch({ type: 'chat', room: 'room1', user: 'u', msg: 'hi' });
    expect(seen).toEqual(['hi']);
  });

  it('ecells: adds peerClass for non-self users, no-op in app mode', () => {
    const { dispatch, sc, ss } = setup();
    const fakeCell = { element: { className: '' } };
    sc.GetEditorCellElement = () => fakeCell;
    dispatch({
      type: 'ecells',
      room: 'room1',
      ecells: { me: 'A1', her: 'B2' },
    });
    expect(fakeCell.element.className).toContain('her defaultPeer');
    // In _app mode, no-op.
    fakeCell.element.className = '';
    sc._app = true;
    dispatch({
      type: 'ecells',
      room: 'room1',
      ecells: { other: 'B2' },
    });
    expect(fakeCell.element.className).toBe('');
    sc._app = false;
    // No cell for the user → no change.
    sc.GetEditorCellElement = () => undefined;
    fakeCell.element.className = '';
    dispatch({
      type: 'ecells',
      room: 'room1',
      ecells: { absent: 'Z9' },
    });
    expect(fakeCell.element.className).toBe('');
    // No coord (coordToCr returns undefined).
    sc.coordToCr = () => undefined as unknown as ReturnType<NonNullable<SocialCalcGlobal['coordToCr']>>;
    expect(() => dispatch({ type: 'ecells', room: 'room1', ecells: { z: 'x' } })).not.toThrow();
  });

  it('ecell: clears original peer class and echoes when landing on self', () => {
    const { dispatch, sc, ss } = setup();
    const bcastCalls: string[] = [];
    sc.Callbacks.broadcast = (t) => bcastCalls.push(t);
    const cellA = { element: { className: ' u defaultPeer foo' } };
    const cellB = { element: { className: '' } };
    const map: Record<string, { element: { className: string } }> = { '1,1': cellA, '2,1': cellB };
    sc.GetEditorCellElement = (_e, r, c) => map[`${r},${c}`];
    sc.coordToCr = (coord) => ({ coord, row: coord === 'A1' ? 1 : 2, col: 1 });
    ss.editor.ecell = { coord: 'A1', row: 1, col: 1 };
    dispatch({
      type: 'ecell',
      room: 'room1',
      user: 'u',
      ecell: 'B1',
      original: 'A1',
    });
    expect(cellA.element.className).toBe(' foo');
    expect(bcastCalls).toContain('ecell');

    // No original → just highlight, no echo.
    cellB.element.className = '';
    dispatch({
      type: 'ecell',
      room: 'room1',
      user: 'u',
      ecell: 'B1',
    });
    expect(cellB.element.className).toContain('u defaultPeer');
  });

  it('ecell: no-op in app mode after original cleanup', () => {
    const { dispatch, sc, ss } = setup();
    const cellA = { element: { className: ' u defaultPeer' } };
    sc.GetEditorCellElement = () => cellA;
    sc.coordToCr = (c) => ({ coord: c, row: 1, col: 1 });
    sc._app = true;
    ss.editor.ecell = { coord: 'A1', row: 1, col: 1 };
    dispatch({
      type: 'ecell',
      room: 'room1',
      user: 'u',
      ecell: 'C3',
      original: 'A1',
    });
    expect(cellA.element.className).toBe('');
  });

  it('ecell: original with no cr found', () => {
    const { dispatch, sc, ss } = setup();
    sc.coordToCr = () => undefined as unknown as ReturnType<NonNullable<SocialCalcGlobal['coordToCr']>>;
    sc.GetEditorCellElement = () => undefined;
    ss.editor.ecell = { coord: 'A1', row: 1, col: 1 };
    expect(() =>
      dispatch({ type: 'ecell', room: 'room1', user: 'u', ecell: 'X', original: 'Y' }),
    ).not.toThrow();
  });

  it('ecell: original cr resolves but GetEditorCellElement returns undefined', () => {
    // Covers the `if (origCell)` false branch in applyEcell — original
    // coordinate parses fine but the cell element lookup misses.
    const { dispatch, sc, ss } = setup();
    sc.coordToCr = (coord) => ({ coord, row: 1, col: 1 });
    sc.GetEditorCellElement = () => undefined;
    ss.editor.ecell = { coord: 'A1', row: 1, col: 1 };
    expect(() =>
      dispatch({ type: 'ecell', room: 'room1', user: 'u', ecell: 'B1', original: 'A1' }),
    ).not.toThrow();
  });

  it('ecell: cell already has peer class (no double-add)', () => {
    // Covers the `cell && className.search(find) === -1` false branch in
    // applyEcell — the regex already matches the existing className.
    const { dispatch, sc, ss } = setup();
    const existing = { element: { className: ' u defaultPeer' } };
    sc.GetEditorCellElement = () => existing;
    sc.coordToCr = (coord) => ({ coord, row: 2, col: 2 });
    ss.editor.ecell = { coord: 'A1', row: 1, col: 1 };
    dispatch({ type: 'ecell', room: 'room1', user: 'u', ecell: 'B2' });
    // unchanged
    expect(existing.element.className).toBe(' u defaultPeer');
  });

  it('log: applies snapshot, schedules commands, calls addmsg', () => {
    const { host, dispatch, sc, ss } = setup();
    sc.hadSnapshot = false;
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    const msgs: string[] = [];
    host.addmsg = (m) => msgs.push(m);
    dispatch({
      type: 'log',
      room: 'room1',
      log: ['set A1 value n 1', 'recalc'],
      chat: ['hi'],
      snapshot: 'xxxxxxxxabc',
    });
    expect(sc.hadSnapshot).toBe(true);
    expect(cmds[0]).toContain('set A1 value n 1');
    expect(cmds[0]!.trim().endsWith('recalc')).toBe(true);
    expect(msgs).toEqual(['hi']);
  });

  it('log: hadSnapshot=true short-circuits', () => {
    const { dispatch, sc, ss } = setup();
    sc.hadSnapshot = true;
    let scheduled = 0;
    ss.context.sheetobj.ScheduleSheetCommands = () => {
      scheduled++;
    };
    dispatch({
      type: 'log',
      room: 'room1',
      log: ['x'],
      chat: [],
      snapshot: 'y',
    });
    expect(scheduled).toBe(0);
  });

  it('log: empty log still schedules recalc', () => {
    const { dispatch, sc, ss } = setup();
    sc.hadSnapshot = false;
    ss.DecodeSpreadsheetSave = () => ({ sheet: { start: 0, end: 1 } });
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    dispatch({
      type: 'log',
      room: 'room1',
      log: [],
      chat: [],
      snapshot: 'SAVE',
    });
    expect(cmds).toContain('recalc\n');
  });

  it('log with no snapshot skips parse but still schedules', () => {
    const { dispatch, sc, ss } = setup();
    sc.hadSnapshot = false;
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    dispatch({
      type: 'log',
      room: 'room1',
      log: [],
      chat: [],
      snapshot: '',
    });
    expect(cmds).toContain('recalc\n');
  });

  it('log: formDataViewer route', () => {
    const { host, dispatch, ss } = setup();
    const viewer = {
      ...ss,
      _room: 'room1_formdata',
      loaded: false,
      sheet: { ...ss.sheet, ResetSheet: () => {} },
      context: { sheetobj: { ...ss.context.sheetobj } },
    } as unknown as NonNullable<SpreadsheetLike['formDataViewer']>;
    ss.formDataViewer = viewer;
    const cmds: string[] = [];
    viewer.context.sheetobj.ScheduleSheetCommands = (c: string) => {
      cmds.push(c);
    };
    host.SocialCalc.Callbacks.broadcast = () => {};
    dispatch({
      type: 'log',
      room: 'room1_formdata',
      log: [],
      chat: [],
      snapshot: 'xSAVExx',
    });
    expect(cmds[0]).toBe('recalc\n');
    expect(viewer.loaded).toBe(true);
  });

  it('log: formDataViewer with empty snapshot skips decoding', () => {
    // Covers applyFormDataLog `msg.snapshot` falsy branch — no DecodeSpreadsheetSave call.
    const { host, dispatch, ss } = setup();
    let decoded = 0;
    const viewer = {
      ...ss,
      _room: 'room1_formdata',
      loaded: false,
      sheet: { ...ss.sheet, ResetSheet: () => {} },
      context: { sheetobj: { ...ss.context.sheetobj } },
    } as unknown as NonNullable<SpreadsheetLike['formDataViewer']>;
    ss.formDataViewer = viewer;
    ss.DecodeSpreadsheetSave = () => {
      decoded++;
      return undefined;
    };
    host.SocialCalc.Callbacks.broadcast = () => {};
    dispatch({
      type: 'log',
      room: 'room1_formdata',
      log: [],
      chat: [],
      snapshot: '',
    });
    expect(decoded).toBe(0);
    expect(viewer.loaded).toBe(true);
  });

  it('log: formDataViewer with parts but no .sheet key skips ParseSheetSave', () => {
    // Covers applyFormDataLog `parts.sheet`-false branch — the
    // spreadsheet decoder returns an object without a .sheet key (rare but
    // observed when snapshot has only an edit section).
    const { host, dispatch, ss } = setup();
    const viewer = {
      ...ss,
      _room: 'room1_formdata',
      loaded: false,
      sheet: { ...ss.sheet, ResetSheet: () => {} },
      context: { sheetobj: { ...ss.context.sheetobj } },
      ParseSheetSave: () => {
        parsed++;
      },
      DecodeSpreadsheetSave: () => ({ edit: { start: 0, end: 3 } }),
    } as unknown as NonNullable<SpreadsheetLike['formDataViewer']>;
    ss.formDataViewer = viewer;
    // IMPORTANT: the `ss` host also needs the same override so applyFormDataLog
    // sees `parts` without a sheet key.
    ss.DecodeSpreadsheetSave = () => ({ edit: { start: 0, end: 3 } });
    let parsed = 0;
    const cmds: string[] = [];
    viewer.context.sheetobj.ScheduleSheetCommands = (c: string) => {
      cmds.push(c);
    };
    host.SocialCalc.Callbacks.broadcast = () => {};
    dispatch({
      type: 'log',
      room: 'room1_formdata',
      log: [],
      chat: [],
      snapshot: 'EDITonly',
    });
    // No ParseSheetSave and no recalc schedule because parts.sheet is absent.
    expect(parsed).toBe(0);
    expect(cmds).toHaveLength(0);
    // But the viewer still flips loaded + ResetSheet runs.
    expect(viewer.loaded).toBe(true);
  });

  it('log: applies edit section even when sheet section is absent', () => {
    // Covers applyLog `parts.sheet`-false + `parts.edit`-true branch. Also
    // asserts that the default LoadEditorSettings is used when present.
    const { host, dispatch, sc, ss } = setup();
    sc.hadSnapshot = false;
    let loaderCalls = 0;
    sc.LoadEditorSettings = () => {
      loaderCalls++;
    };
    ss.DecodeSpreadsheetSave = () => ({ edit: { start: 2, end: 6 } });
    let resetCount = 0;
    ss.sheet.ResetSheet = () => {
      resetCount++;
    };
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    host.addmsg = () => {};
    dispatch({
      type: 'log',
      room: 'room1',
      log: [],
      chat: [],
      snapshot: 'EDITsection',
    });
    expect(loaderCalls).toBe(1);
    expect(resetCount).toBe(0);
    expect(cmds).toContain('recalc\n');
  });

  it('log: parts.edit with no SocialCalc.LoadEditorSettings falls back to noop arrow', () => {
    // Covers the fallback `(() => {})` arrow on the `??` operator in
    // `applyLog` when `SocialCalc.LoadEditorSettings` is undefined.
    const { host, dispatch, sc, ss } = setup();
    sc.hadSnapshot = false;
    delete sc.LoadEditorSettings;
    ss.DecodeSpreadsheetSave = () => ({ edit: { start: 0, end: 3 } });
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    host.addmsg = () => {};
    dispatch({
      type: 'log',
      room: 'room1',
      log: [],
      chat: [],
      snapshot: 'EDITonly',
    });
    // Fallback arrow is a no-op; schedule still fires.
    expect(cmds).toContain('recalc\n');
  });

  it('snapshot: applies when a sheet section is decoded', () => {
    const { dispatch, sc, ss } = setup();
    let resetCount = 0;
    ss.sheet.ResetSheet = () => {
      resetCount++;
    };
    dispatch({ type: 'snapshot', snapshot: 'abc12345678' });
    expect(resetCount).toBe(1);
    expect(sc.hadSnapshot).toBe(true);
  });

  it('snapshot: no decode parts → no reset', () => {
    const { dispatch, ss } = setup();
    ss.DecodeSpreadsheetSave = () => undefined;
    let reset = 0;
    ss.sheet.ResetSheet = () => {
      reset++;
    };
    dispatch({ type: 'snapshot', snapshot: '' });
    expect(reset).toBe(0);
  });

  it('recalc: loads a sheet, updates cache, schedules', () => {
    const { dispatch, sc, ss } = setup();
    sc.RecalcInfo.LoadSheetCache = {};
    const loaded: unknown[] = [];
    sc.RecalcLoadedSheet = (room, data, flag) => loaded.push([room, data, flag]);
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    dispatch({ type: 'recalc', room: 'other', log: [], snapshot: '12345678abc' });
    expect(loaded).toHaveLength(1);
    expect(sc.RecalcInfo.LoadSheetCache!['other']).toBeDefined();
    expect(cmds).toContain('recalc\n');
    // Force path: clears sheet cache.
    sc.Formula = { SheetCache: { sheets: { other: {} } } };
    dispatch({ type: 'recalc', room: 'other', log: [], snapshot: '12345678abc', force: true });
    expect(sc.Formula.SheetCache!.sheets!['other']).toBeUndefined();
  });

  it('recalc: force without Formula.SheetCache', () => {
    const { dispatch, sc } = setup();
    delete sc.Formula;
    expect(() =>
      dispatch({ type: 'recalc', room: 'x', log: [], snapshot: '12345678abc', force: true }),
    ).not.toThrow();
  });

  it('recalc: no snapshot sheet section → load empty', () => {
    const { dispatch, sc, ss } = setup();
    ss.DecodeSpreadsheetSave = () => undefined;
    const loaded: unknown[] = [];
    sc.RecalcLoadedSheet = (room, data, flag) => loaded.push([room, data, flag]);
    dispatch({ type: 'recalc', room: 'r', log: [], snapshot: '' });
    expect(loaded).toEqual([['r', '', true]]);
  });

  it('recalc: cached sheetdata → no schedule', () => {
    const { dispatch, sc, ss } = setup();
    const cache: Record<string, string> = { r: 'SAVE_' };
    sc.RecalcInfo.LoadSheetCache = cache;
    ss.DecodeSpreadsheetSave = () => ({ sheet: { start: 0, end: 5 } });
    const cmds: string[] = [];
    ss.context.sheetobj.ScheduleSheetCommands = (c) => cmds.push(c);
    dispatch({ type: 'recalc', room: 'r', log: [], snapshot: 'SAVE_' });
    expect(cmds).toHaveLength(0);
  });

  it('execute: schedules + triggers graph tab redraw', () => {
    const { host, dispatch, ss } = setup();
    host.DoGraph = vi.fn();
    host.setTimeout = (fn) => {
      fn();
      return 1;
    };
    ss.currentTab = 3 as unknown as string;
    ss.tabnums = { graph: 3 };
    let scheduled = 0;
    ss.context.sheetobj.ScheduleSheetCommands = () => {
      scheduled++;
    };
    dispatch({
      type: 'execute',
      room: 'room1',
      user: 'u2',
      cmdstr: 'set B2 value n 2',
    });
    expect(scheduled).toBe(1);
    expect(host.DoGraph).toHaveBeenCalled();
  });

  it('execute: no DoGraph when not on graph tab', () => {
    const { host, dispatch, ss } = setup();
    host.DoGraph = vi.fn();
    ss.currentTab = 'sheet';
    dispatch({
      type: 'execute',
      room: 'room1',
      user: 'u2',
      cmdstr: 'set A1',
    });
    expect(host.DoGraph).not.toHaveBeenCalled();
  });

  it('stopHuddle is handled without throw', () => {
    const { dispatch } = setup();
    expect(() => dispatch({ type: 'stopHuddle', room: 'room1' })).not.toThrow();
  });

  it('ignore and my.ecell messages are silent no-ops', () => {
    const { dispatch, sc, ss } = setup();
    let resetCount = 0;
    ss.sheet.ResetSheet = () => {
      resetCount++;
    };
    dispatch({ type: 'ignore' });
    // my.ecell needs a distinct room so the self-echo filter doesn't kick in.
    dispatch({ type: 'my.ecell', room: 'room1', user: 'someone-else', ecell: 'A1' });
    expect(resetCount).toBe(0);
    void sc;
  });

  /**
   * `ask.ecell` — peer asks "where are you?". Legacy `player.ls:128-132`:
   * reply with `ecell` broadcast targeted at the asker, carrying our
   * current cursor. App mode opts out. Missing cursor → don't reply.
   */
  describe('ask.ecell reply', () => {
    it('replies with ecell broadcast when cursor is set', () => {
      const { dispatch, sc, ss } = setup();
      ss.editor.ecell.coord = 'B3';
      const broadcasts: Array<{ type: string; payload?: unknown }> = [];
      sc.Callbacks.broadcast = (type, payload) => broadcasts.push({ type, ...(payload !== undefined ? { payload } : {}) });
      dispatch({ type: 'ask.ecell', room: 'room1', user: 'peer' });
      expect(broadcasts).toEqual([
        {
          type: 'ecell',
          payload: { ecell: 'B3', to: 'peer' },
        },
      ]);
    });

    it('opts out when in app mode', () => {
      const { dispatch, sc, ss } = setup();
      sc._app = true;
      ss.editor.ecell.coord = 'B3';
      let called = 0;
      sc.Callbacks.broadcast = () => {
        called++;
      };
      dispatch({ type: 'ask.ecell', room: 'room1', user: 'peer' });
      expect(called).toBe(0);
    });

    it('does not reply when cursor coord is empty', () => {
      const { dispatch, sc, ss } = setup();
      ss.editor.ecell.coord = '';
      let called = 0;
      sc.Callbacks.broadcast = () => {
        called++;
      };
      dispatch({ type: 'ask.ecell', room: 'room1', user: 'peer' });
      expect(called).toBe(0);
    });

    it('omits `to` when the asker user is undefined', () => {
      const { dispatch, sc, ss } = setup();
      ss.editor.ecell.coord = 'C4';
      const broadcasts: Array<{ type: string; payload?: unknown }> = [];
      sc.Callbacks.broadcast = (type, payload) => broadcasts.push({ type, ...(payload !== undefined ? { payload } : {}) });
      // Legacy server's catch-all preserves `user` from the frame; still,
      // defensively don't stamp `to: undefined`.
      dispatch({ type: 'ask.ecell', room: 'room1' } as unknown as Parameters<typeof dispatch>[0]);
      expect(broadcasts[0]!.payload).toEqual({ ecell: 'C4' });
    });
  });
});
