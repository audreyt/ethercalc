import { describe, expect, it } from 'vitest';
import {
  parseQuery,
  installCallbacks,
  installBroadcast,
  installRecalcLoader,
  uninstallCallbacks,
} from '../src/socialcalc-callbacks.ts';
import { makeSocialCalc, makeEditor, makeSheet } from './mock-socialcalc.ts';

describe('parseQuery', () => {
  it('parses empty / leading ?', () => {
    expect(parseQuery('')).toEqual({});
    expect(parseQuery('?')).toEqual({});
    expect(parseQuery('?a=1')).toEqual({ a: '1' });
  });
  it('decodes URI components', () => {
    expect(parseQuery('?q=hello%20world&x=%26')).toEqual({ q: 'hello world', x: '&' });
  });
  it('handles missing = and dupes', () => {
    expect(parseQuery('?flag&a=1')).toEqual({ flag: '', a: '1' });
  });
  it('ignores empty key entries', () => {
    expect(parseQuery('&a=1&')).toEqual({ a: '1' });
  });
});

describe('installCallbacks', () => {
  it('is idempotent (Orig* sentinel guards it)', () => {
    const sc = makeSocialCalc();
    const calls: Array<[string, unknown]> = [];
    const b = (t: string, d?: unknown): void => void calls.push([t, d]);
    expect(installCallbacks(sc, { broadcast: b })).toBe(true);
    expect(installCallbacks(sc, { broadcast: b })).toBe(false);
  });

  it('DoPositionCalculations broadcasts ask.ecell and preserves return', () => {
    const sc = makeSocialCalc();
    let broadcasts: string[] = [];
    installBroadcast(sc, (t) => broadcasts.push(t));
    installCallbacks(sc, { broadcast: () => {} });
    const ret = sc.DoPositionCalculations!.call(sc, 'arg');
    expect(ret).toBe('pos');
    expect(broadcasts).toContain('ask.ecell');
  });

  it('DoPositionCalculations wrapper still fires ask.ecell when no original existed', () => {
    // Covers `if (origPos) SocialCalc.OrigDoPositionCalculations = origPos;`
    // false branch in installCallbacks.
    const sc = makeSocialCalc();
    delete sc.DoPositionCalculations;
    let broadcasts: string[] = [];
    installBroadcast(sc, (t) => broadcasts.push(t));
    installCallbacks(sc, { broadcast: () => {} });
    expect(sc.OrigDoPositionCalculations).toBeUndefined();
    sc.DoPositionCalculations!.call(sc, 'arg');
    expect(broadcasts).toContain('ask.ecell');
  });

  it('ScheduleSheetCommands wrapper installs even when no original existed', () => {
    // Covers `if (origSched) SocialCalc.OrigScheduleSheetCommands = origSched;`
    // false branch — optional chaining on the original must handle undefined.
    const sc = makeSocialCalc();
    delete sc.ScheduleSheetCommands;
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    expect(sc.OrigScheduleSheetCommands).toBeUndefined();
    const sheet = makeSheet();
    sheet._room = 'r';
    // Valid broadcast does not throw even without an original.
    expect(() => sc.ScheduleSheetCommands!(sheet, 'recalc', false, true)).not.toThrow();
  });

  it('LoadEditorSettings wires ethercalc save/load when CryptoJS is present', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    const CryptoJS = {
      MD5: (s: string) => ({ toString: () => `md5(${s})` }),
    };
    installCallbacks(sc, { broadcast: () => {}, win: { CryptoJS } });
    expect(sc.hadSnapshot).toBe(true);
    const editor = makeEditor();
    sc.LoadEditorSettings!(editor, 'str', null);
    const cb = editor.SettingsCallbacks['ethercalc']!;
    expect(cb.save(editor, '')).toMatch(/^ethercalc:md5\(SAVE\)/);
    cb.load(editor, 'ethercalc', 'ethercalc:md5(SAVE)', null);
    expect(sc.hadSnapshot).toBe(false);
    cb.load(editor, 'ethercalc', 'ethercalc:different-hash', null);
    expect(sc.hadSnapshot).toBe(true);
  });

  it('LoadEditorSettings: hadSnapshot false when CryptoJS missing', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    expect(sc.hadSnapshot).toBe(false);
  });

  it('LoadEditorSettings: when CryptoJS present but original is missing, invocation deletes the property', () => {
    // Covers both the `if (origLoad)` false branch at install time AND the
    // `else delete SocialCalc.LoadEditorSettings` branch inside the wrapper.
    const sc = makeSocialCalc();
    delete sc.LoadEditorSettings;
    installBroadcast(sc, () => {});
    const CryptoJS = { MD5: (s: string) => ({ toString: () => `md5(${s})` }) };
    installCallbacks(sc, { broadcast: () => {}, win: { CryptoJS } });
    // Sentinel wasn't captured (there was nothing to capture).
    expect(sc.OrigLoadEditorSettings).toBeUndefined();
    const editor = makeEditor();
    sc.LoadEditorSettings!(editor, 'str', null);
    // After invocation the wrapper deleted itself (no original to restore).
    expect(sc.LoadEditorSettings).toBeUndefined();
    // The callbacks it installed on the editor remain usable.
    expect(editor.SettingsCallbacks['ethercalc']).toBeDefined();
  });

  it('SizeSSDiv guards null / missing parentNode', () => {
    const sc = makeSocialCalc();
    let inner = 0;
    sc.SizeSSDiv = () => {
      inner++;
    };
    installCallbacks(sc, { broadcast: () => {} });
    sc.SizeSSDiv!(undefined);
    sc.SizeSSDiv!({});
    sc.SizeSSDiv!({ parentNode: {} });
    expect(inner).toBe(1);
  });

  it('SizeSSDiv works when original is absent', () => {
    const sc = makeSocialCalc();
    delete sc.SizeSSDiv;
    installCallbacks(sc, { broadcast: () => {} });
    expect(() => sc.SizeSSDiv!({ parentNode: {} })).not.toThrow();
  });

  it('ScheduleSheetCommands collapses blank lines, skips whitespace commands, broadcasts non-remote', () => {
    const sc = makeSocialCalc();
    const calls: Array<[string, unknown]> = [];
    installBroadcast(sc, (t, d) => calls.push([t, d]));
    let origCalled = 0;
    sc.ScheduleSheetCommands = () => {
      origCalled++;
    };
    installCallbacks(sc, { broadcast: () => {} });
    const sheet = makeSheet();
    sheet._room = 'r1';
    sc.ScheduleSheetCommands!(sheet, '   \n  ', false, false);
    expect(origCalled).toBe(0);
    sc.ScheduleSheetCommands!(sheet, 'set A1 value n 1', false, false);
    expect(origCalled).toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe('execute');
    // redisplay/recalc shouldn't broadcast but should still call origCalled
    sc.ScheduleSheetCommands!(sheet, 'redisplay', false, false);
    expect(origCalled).toBe(2);
    expect(calls).toHaveLength(1);
    // isRemote=true: no broadcast.
    sc.ScheduleSheetCommands!(sheet, 'set A1 value n 2', false, true);
    expect(origCalled).toBe(3);
    expect(calls).toHaveLength(1);
  });

  it('ScheduleSheetCommands rewrites multi-sheet $Title refs', () => {
    const sc = makeSocialCalc();
    const calls: Array<[string, Record<string, unknown>]> = [];
    installBroadcast(sc, (t, d) => calls.push([t, d as Record<string, unknown>]));
    sc.ScheduleSheetCommands = () => {};
    installCallbacks(sc, {
      broadcast: () => {},
      win: { __MULTI__: { rows: [{ link: '/foo', title: 'Sales' }] } },
    });
    const sheet = makeSheet();
    sheet._room = 'r1';
    sc.ScheduleSheetCommands!(sheet, 'set A1 formula $Sales.B2', false, false);
    expect(calls).toHaveLength(1);
    expect(calls[0]![1]['cmdstr']).toBe('set A1 formula "foo"!B2');
  });

  it('Sheet.prototype.ScheduleSheetCommands delegates to SocialCalc.ScheduleSheetCommands', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    const capture: unknown[][] = [];
    sc.ScheduleSheetCommands = (...args) => {
      capture.push(args);
    };
    const sheet = makeSheet();
    sc.Sheet!.prototype.ScheduleSheetCommands!.call(sheet, 'redisplay', false, true);
    expect(capture).toHaveLength(1);
    expect(capture[0]![0]).toBe(sheet);
  });

  it('MoveECell: same-coord is a no-op', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    const editor = makeEditor();
    editor.ecell = { coord: 'A1', row: 1, col: 1 };
    expect(sc.MoveECell!(editor, 'A1')).toBe('A1');
  });

  it('MoveECell: moves, broadcasts, updates highlights, fires callbacks', () => {
    const sc = makeSocialCalc();
    const calls: Array<[string, Record<string, unknown>]> = [];
    installBroadcast(sc, (t, d) => calls.push([t, d as Record<string, unknown>]));
    installCallbacks(sc, { broadcast: () => {} });
    const editor = makeEditor();
    editor.ecell = { coord: 'A1', row: 1, col: 1 };
    editor.range2 = { hasrange: true, top: 1, bottom: 2, left: 1, right: 1 };
    let movecbCalls = 0;
    editor.MoveECellCallback = { k: () => movecbCalls++ };
    let statusCalls = 0;
    editor.StatusCallback = { k: { func: () => statusCalls++, params: 'p' } };
    editor.context.cellskip = { B2: 'B3' };
    editor.busy = false;
    const result = sc.MoveECell!(editor, 'B2');
    expect(result).toBe('B3');
    expect(calls).toEqual(
      expect.arrayContaining([
        ['ecell', expect.objectContaining({ original: 'A1', ecell: 'B2' })],
      ]),
    );
    expect(movecbCalls).toBe(1);
    expect(statusCalls).toBe(1);
    expect(editor.context.highlights['A1']).toBe('range2');
    expect(editor.context.highlights['B3']).toBe('cursor');
  });

  it('MoveECell: busy editor flips ensureecell but skips EnsureECellVisible', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    const editor = makeEditor();
    editor.busy = true;
    let ensured = 0;
    editor.EnsureECellVisible = () => {
      ensured++;
    };
    sc.MoveECell!(editor, 'B2');
    expect(editor.ensureecell).toBe(true);
    expect(ensured).toBe(0);
  });

  it('MoveECell: no editor.ecell yet', () => {
    const sc = makeSocialCalc();
    const calls: string[] = [];
    installBroadcast(sc, (t) => calls.push(t));
    installCallbacks(sc, { broadcast: () => {} });
    const editor = makeEditor();
    // Simulate first focus where ecell is missing.
    (editor as unknown as { ecell: null }).ecell = null as unknown as never;
    sc.MoveECell!(editor, 'A2');
    expect(calls.includes('ecell')).toBe(true);
  });

  it('MoveECell: newcell not in cellskip, no range2', () => {
    const sc = makeSocialCalc();
    installBroadcast(sc, () => {});
    installCallbacks(sc, { broadcast: () => {} });
    const editor = makeEditor();
    editor.ecell = { coord: 'A1', row: 1, col: 1 };
    editor.range2 = { hasrange: false, top: 0, bottom: 0, left: 0, right: 0 };
    expect(sc.MoveECell!(editor, 'B2')).toBe('B2');
    expect(editor.context.highlights['A1']).toBeUndefined();
  });

  // The 5-way conjunction at socialcalc-callbacks.ts:180 decides whether
  // the old ecell should get the 'range2' highlight on move. Mutation
  // targets include each `&&` → `||` swap (7 distinct) plus the whole
  // expression → true. Kill them by exercising each corner + just-outside
  // case so the boundary AND conjunction shape is pinned behaviorally.
  describe('MoveECell range2 boundary', () => {
    const setup = (
      row: number,
      col: number,
      range2: { hasrange: boolean; top: number; bottom: number; left: number; right: number },
    ): { sc: ReturnType<typeof makeSocialCalc>; editor: ReturnType<typeof makeEditor> } => {
      const sc = makeSocialCalc();
      installBroadcast(sc, () => {});
      installCallbacks(sc, { broadcast: () => {} });
      const editor = makeEditor();
      editor.ecell = { coord: 'A1', row, col };
      editor.range2 = range2;
      return { sc, editor };
    };

    it('sets range2 highlight when ecell is at the top-left corner', () => {
      const { sc, editor } = setup(5, 3, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBe('range2');
    });

    it('sets range2 highlight when ecell is at the bottom-right corner', () => {
      const { sc, editor } = setup(10, 7, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBe('range2');
    });

    it('sets range2 highlight when ecell is strictly inside', () => {
      const { sc, editor } = setup(7, 5, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBe('range2');
    });

    it('does NOT set range2 highlight when ecell row is just above top', () => {
      const { sc, editor } = setup(4, 5, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBeUndefined();
    });

    it('does NOT set range2 highlight when ecell row is just below bottom', () => {
      const { sc, editor } = setup(11, 5, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBeUndefined();
    });

    it('does NOT set range2 highlight when ecell col is just left of left', () => {
      const { sc, editor } = setup(7, 2, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBeUndefined();
    });

    it('does NOT set range2 highlight when ecell col is just right of right', () => {
      const { sc, editor } = setup(7, 8, { hasrange: true, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBeUndefined();
    });

    it('does NOT set range2 highlight when hasrange is false even with inside coords', () => {
      // Pins the `hasrange` conjunct — mutation to `||` would make the
      // rest of the condition matter on its own.
      const { sc, editor } = setup(7, 5, { hasrange: false, top: 5, bottom: 10, left: 3, right: 7 });
      sc.MoveECell!(editor, 'B2');
      expect(editor.context.highlights['A1']).toBeUndefined();
    });
  });
});

describe('installRecalcLoader', () => {
  it('fires ask.recalc with a lower-cased room', () => {
    const sc = makeSocialCalc();
    const calls: Array<[string, Record<string, unknown> | undefined]> = [];
    const b = (t: string, d?: Record<string, unknown>): void => void calls.push([t, d]);
    installRecalcLoader(sc, b);
    sc.RecalcInfo.LoadSheet!('MYROOM');
    expect(calls).toEqual([['ask.recalc', { room: 'myroom' }]]);
  });
});

describe('installBroadcast', () => {
  it('replaces SocialCalc.Callbacks.broadcast', () => {
    const sc = makeSocialCalc();
    let seen = false;
    installBroadcast(sc, () => {
      seen = true;
    });
    sc.Callbacks.broadcast!('x');
    expect(seen).toBe(true);
  });
  it('creates SocialCalc.Callbacks if missing', () => {
    const sc = makeSocialCalc();
    delete (sc as { Callbacks?: unknown }).Callbacks;
    installBroadcast(sc as unknown as ReturnType<typeof makeSocialCalc>, () => {});
    expect(sc.Callbacks?.broadcast).toBeDefined();
  });
});

describe('uninstallCallbacks', () => {
  it('restores the Orig* functions and deletes sentinel state', () => {
    const sc = makeSocialCalc();
    const origPos = sc.DoPositionCalculations;
    installCallbacks(sc, { broadcast: () => {} });
    expect(sc.DoPositionCalculations).not.toBe(origPos);
    uninstallCallbacks(sc);
    expect(sc.DoPositionCalculations).toBe(origPos);
    expect(sc.OrigDoPositionCalculations).toBeUndefined();
    // Now a re-install should succeed again.
    expect(installCallbacks(sc, { broadcast: () => {} })).toBe(true);
  });
  it('tolerates Sheet.prototype being missing', () => {
    const sc = makeSocialCalc();
    delete sc.Sheet;
    installCallbacks(sc, { broadcast: () => {} });
    expect(() => uninstallCallbacks(sc)).not.toThrow();
  });

  it('restores LoadEditorSettings when CryptoJS was present', () => {
    const sc = makeSocialCalc();
    const origLoad = sc.LoadEditorSettings;
    installCallbacks(sc, {
      broadcast: () => {},
      win: { CryptoJS: { MD5: () => ({ toString: () => 'x' }) } },
    });
    uninstallCallbacks(sc);
    expect(sc.LoadEditorSettings).toBe(origLoad);
  });

  it('skips Orig* restoration when sentinels were never populated', () => {
    // Covers the "false" arms of the `if (SocialCalc.Orig*)` guards in
    // uninstallCallbacks — running it on a fresh SocialCalc exercises the
    // empty-install branches without touching the happy path.
    const sc = makeSocialCalc();
    // Skip installCallbacks; all Orig* remain undefined.
    expect(() => uninstallCallbacks(sc)).not.toThrow();
    expect(sc.OrigDoPositionCalculations).toBeUndefined();
    expect(sc.OrigLoadEditorSettings).toBeUndefined();
    expect(sc.OrigSizeSSDiv).toBeUndefined();
    expect(sc.OrigScheduleSheetCommands).toBeUndefined();
  });
});
