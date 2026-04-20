import { describe, expect, it, vi } from 'vitest';

import {
  buildLegacyExportUrl,
  initializeSpreadsheet,
  installLegacyExportBindings,
  type BootHost,
} from '../src/boot.ts';
import { makeSocialCalc, makeSpreadsheet } from './mock-socialcalc.ts';

function makeHost(overrides: Partial<BootHost> = {}): BootHost {
  const SocialCalc = overrides.SocialCalc ?? makeSocialCalc();
  const host: BootHost = {
    SocialCalc,
    location: overrides.location ?? { search: '', hash: '', pathname: '/room1' },
    history: overrides.history ?? { pushState: () => {} },
    setTimeout: overrides.setTimeout ?? ((fn: () => void) => {
      fn();
      return 1;
    }),
  };
  if (overrides.spreadsheet) host.spreadsheet = overrides.spreadsheet;
  if (overrides.DoGraph) host.DoGraph = overrides.DoGraph;
  if (overrides.addmsg) host.addmsg = overrides.addmsg;
  if (overrides.EtherCalc) host.EtherCalc = overrides.EtherCalc;
  if (overrides.Drupal) host.Drupal = overrides.Drupal;
  if (overrides.document) host.document = overrides.document;
  if (overrides.open) host.open = overrides.open;
  if (overrides.parent) host.parent = overrides.parent;
  if (overrides.vex) host.vex = overrides.vex;
  return host;
}

describe('initializeSpreadsheet', () => {
  it('constructs a control, initializes tableeditor, and requests the room log', () => {
    const host = makeHost();
    const ss = makeSpreadsheet();
    const broadcast = vi.fn();
    const initControl = vi.fn();
    const initViewer = vi.fn();
    const exec = vi.fn();
    ss.InitializeSpreadsheetControl = initControl;
    ss.InitializeSpreadsheetViewer = initViewer;
    ss.ExecuteCommand = exec;
    host.SocialCalc._room = 'room1';
    host.SocialCalc.Callbacks.broadcast = broadcast;
    host.SocialCalc.Cell = function Cell(this: { coord?: string; displaystring?: string }, coord: string) {
      this.coord = coord;
    } as unknown as NonNullable<typeof host.SocialCalc.Cell>;
    host.SocialCalc.SpreadsheetControl = function SpreadsheetControl() {
      return ss;
    } as unknown as NonNullable<typeof host.SocialCalc.SpreadsheetControl>;

    initializeSpreadsheet(host);

    expect(host.spreadsheet).toBe(ss);
    expect(initViewer).toHaveBeenCalledWith('tableeditor', 0, 0, 0);
    expect(initControl).toHaveBeenCalledWith('tableeditor', 0, 0, 0);
    expect(broadcast).toHaveBeenCalledWith('ask.log');
    expect(exec).toHaveBeenCalledWith('redisplay', '');
    expect(exec).toHaveBeenCalledWith('set sheet defaulttextvalueformat text-wiki');
    expect((ss.sheet.cells['A1'] as { displaystring?: string } | undefined)?.displaystring).toBe(
      '<div class="loader"></div>',
    );
  });

  it('uses SpreadsheetViewer in app/view mode', () => {
    const host = makeHost();
    const viewer = makeSpreadsheet();
    host.SocialCalc._room = 'room1';
    host.SocialCalc._app = true;
    host.SocialCalc.Callbacks.broadcast = vi.fn();
    host.SocialCalc.SpreadsheetViewer = function SpreadsheetViewer() {
      return viewer;
    } as unknown as NonNullable<typeof host.SocialCalc.SpreadsheetViewer>;

    initializeSpreadsheet(host);

    expect(host.spreadsheet).toBe(viewer);
  });

  it('reuses CurrentSpreadsheetControlObject when one already exists', () => {
    const host = makeHost();
    const existing = makeSpreadsheet();
    host.SocialCalc.Callbacks.broadcast = vi.fn();
    host.SocialCalc.CurrentSpreadsheetControlObject = existing;
    host.SocialCalc.SpreadsheetControl = vi.fn(() => {
      throw new Error('should not construct');
    }) as unknown as NonNullable<typeof host.SocialCalc.SpreadsheetControl>;

    initializeSpreadsheet(host);

    expect(host.spreadsheet).toBe(existing);
  });

  it('wires doresize to the active spreadsheet', () => {
    const host = makeHost();
    const ss = makeSpreadsheet();
    const resize = vi.fn();
    ss.DoOnResize = resize;
    host.SocialCalc.Callbacks.broadcast = vi.fn();
    host.SocialCalc.CurrentSpreadsheetControlObject = ss;

    initializeSpreadsheet(host);
    host.doresize?.();

    expect(resize).toHaveBeenCalled();
  });

  it('requests formdata first when a formDataViewer is present', () => {
    const host = makeHost();
    const ss = makeSpreadsheet();
    const formDataViewer = makeSpreadsheet() as NonNullable<typeof ss.formDataViewer>;
    const broadcast = vi.fn();
    ss.formDataViewer = formDataViewer;
    host.SocialCalc._room = 'room1';
    host.SocialCalc.Callbacks.broadcast = broadcast;
    host.SocialCalc.CurrentSpreadsheetControlObject = ss;

    initializeSpreadsheet(host);

    expect(formDataViewer._room).toBe('room1_formdata');
    expect(formDataViewer.sheet._room).toBe('room1_formdata');
    expect(broadcast).toHaveBeenCalledWith('ask.log', { room: 'room1_formdata' });
  });

  it('returns quietly when no spreadsheet constructor is available', () => {
    const host = makeHost();
    host.SocialCalc.Callbacks.broadcast = vi.fn();

    expect(() => initializeSpreadsheet(host)).not.toThrow();
    expect(host.spreadsheet).toBeUndefined();
  });
});

describe('legacy export bindings', () => {
  it('builds the legacy relative export URLs', () => {
    expect(
      buildLegacyExportUrl('xlsx', 'room1', {
        isMultiple: false,
        parentPathname: '/room1/edit',
      }),
    ).toBe('../room1.xlsx');

    expect(
      buildLegacyExportUrl('ods', 'room1.2', {
        isMultiple: true,
        parentHref: 'http://127.0.0.1:3210/=room1',
        parentPathname: '/room1.2',
      }),
    ).toBe('http://127.0.0.1:3210/=room1.ods');
  });

  it('binds the top-left export cell and opens the legacy dialog', () => {
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const cell = { setAttribute: vi.fn() };
    const target = {
      closest: vi.fn(() => cell),
    } as unknown as EventTarget;
    const open = vi.fn();
    const dialogOpen = vi.fn();
    const host = makeHost({
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
      },
      open,
      parent: {
        location: {
          href: 'http://127.0.0.1:3210/room1',
          pathname: '/room1',
        },
      },
      vex: {
        defaultOptions: {},
        dialog: {
          open: dialogOpen,
          buttons: {
            YES: { type: 'submit' },
            NO: { type: 'button' },
          },
        },
      },
    });
    host.SocialCalc._room = 'room1';
    host.SocialCalc.Constants.s_loc_export = 'Export';
    host.SocialCalc.Constants.s_loc_export_format = 'Please choose an export format.';
    host.SocialCalc.Constants.s_loc_cancel = 'Cancel';

    installLegacyExportBindings(host);
    installLegacyExportBindings(host);

    listeners.mouseover?.[0]?.({ target });
    expect(cell.setAttribute).toHaveBeenCalledWith('title', 'Export');

    listeners.click?.[0]?.({ target });

    expect(dialogOpen).toHaveBeenCalledTimes(1);
    expect(host.SocialCalc.Keyboard?.passThru).toBe(true);
    const opts = dialogOpen.mock.calls[0]?.[0] as {
      buttons: Array<{ text: string; click?: () => void }>;
      callback?: () => void;
    };
    expect(opts.buttons.map((button) => button.text)).toEqual([
      'Excel',
      'CSV',
      'HTML',
      'ODS',
      'Cancel',
    ]);

    opts.buttons[1]?.click?.();
    expect(open).toHaveBeenCalledWith('./room1.csv');

    opts.callback?.();
    expect(host.SocialCalc.Keyboard?.passThru).toBe(false);
  });
});
