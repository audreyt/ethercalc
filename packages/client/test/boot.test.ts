import { describe, expect, it, vi } from 'vite-plus/test';

import {
  buildLegacyExportUrl,
  initializeSpreadsheet,
  installLegacyExportBindings,
  installSocialCalcLogoLink,
  type BootHost,
  type DialogHostElement,
} from '../src/boot.ts';
import { makeSocialCalc, makeSpreadsheet } from './mock-socialcalc.ts';

interface FakeDialogElement extends DialogHostElement {
  readonly tag: string;
  readonly children: DialogHostElement[];
  readonly listeners: Record<string, Array<() => void>>;
  parent: FakeDialogElement | undefined;
}

function makeFakeDialogElement(tag: string): FakeDialogElement {
  const children: DialogHostElement[] = [];
  const listeners: Record<string, Array<() => void>> = {};
  const element: FakeDialogElement = {
    tag,
    children,
    listeners,
    parent: undefined,
    id: '',
    slot: '',
    textContent: '',
    dismissible: false,
    setAttribute: vi.fn(),
    appendChild: vi.fn((child: DialogHostElement) => {
      children.push(child);
      const fakeChild = child as FakeDialogElement;
      fakeChild.parent = element;
      // Mirrors `ActionElementBase.connectedCallback()` (real
      // `m3e-dialog-action`'s base class): a nested action element
      // registers ITS OWN click listener on its *parent* element, not
      // itself, and closes the nearest `m3e-dialog` ancestor. No
      // `stopPropagation()` in the real implementation either, so a
      // sibling listener boot.ts attaches directly to that same parent
      // (e.g. the export side effect) also fires.
      if (fakeChild.tag === 'm3e-dialog-action') {
        element.addEventListener('click', () => {
          let ancestor: FakeDialogElement | undefined = element;
          while (ancestor && ancestor.tag !== 'm3e-dialog') ancestor = ancestor.parent;
          ancestor?.hide();
        });
      }
    }),
    addEventListener: vi.fn((type: string, listener: () => void) => {
      (listeners[type] ??= []).push(listener);
    }),
    show: vi.fn(),
    // Faithful to the real `m3e-dialog`: `hide()` dispatches `closed`
    // synchronously (verified against `M3eDialogElement`'s source
    // during the passkey UI rewrite).
    hide: vi.fn(() => {
      for (const listener of listeners.closed ?? []) listener();
    }),
    remove: vi.fn(),
  };
  return element;
}

/** Fake `document` for `openLegacyExportDialog`'s M3E dialog seam. */
function makeFakeDialogDocument(): {
  readonly createElement: (tag: string) => DialogHostElement;
  readonly body: { readonly appendChild: (el: DialogHostElement) => void };
  readonly created: FakeDialogElement[];
} {
  const created: FakeDialogElement[] = [];
  return {
    createElement: (tag: string) => {
      const element = makeFakeDialogElement(tag);
      created.push(element);
      return element;
    },
    body: { appendChild: vi.fn() },
    created,
  };
}

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
  if (overrides.open) host.__exportOpen = overrides.open;
  if (overrides.parent) host.parent = overrides.parent;
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

    // #232 — viewer mode must not build multi-sheet export URLs for single rooms.
    expect(
      buildLegacyExportUrl('xlsx', 'sheet1', {
        isMultiple: false,
        parentPathname: '/sheet1/view',
      }),
    ).toBe('../sheet1.xlsx');
  });

  it('binds the top-left export cell and opens the legacy dialog', () => {
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const cell = { setAttribute: vi.fn() };
    const target = {
      closest: vi.fn(() => cell),
    } as unknown as EventTarget;
    const open = vi.fn();
    const fakeDocument = makeFakeDialogDocument();
    const host = makeHost({
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
        createElement: fakeDocument.createElement,
        body: fakeDocument.body,
      },
      open,
      parent: {
        location: {
          href: 'http://127.0.0.1:3210/room1',
          pathname: '/room1',
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

    const dialog = fakeDocument.created.find((el) => el.tag === 'm3e-dialog');
    expect(dialog?.show).toHaveBeenCalledTimes(1);
    expect(dialog?.dismissible).toBe(true);
    expect(host.SocialCalc.Keyboard?.passThru).toBe(true);

    const buttons = fakeDocument.created.filter((el) => el.tag === 'm3e-button');
    expect(buttons.map((button) => button.children[0]?.textContent)).toEqual([
      'Excel',
      'CSV',
      'HTML',
      'ODS',
      'Cancel',
    ]);

    const csvButton = buttons.find((button) => button.children[0]?.textContent === 'CSV');
    for (const listener of csvButton?.listeners.click ?? []) listener();
    expect(open).toHaveBeenCalledWith('./room1.csv');
    // Clicking a format button's nested `m3e-dialog-action` calls
    // `dialog.hide()` (see the fake element's `appendChild`, mirroring
    // `ActionElementBase`), which — faithful to the real `m3e-dialog` —
    // dispatches `closed` synchronously, which is what resets
    // `Keyboard.passThru` (see the `closed` listener in
    // `openLegacyExportDialog`).
    expect(host.SocialCalc.Keyboard?.passThru).toBe(false);
    expect(dialog?.remove).toHaveBeenCalledTimes(1);
  });

  it('resets Keyboard.passThru on Cancel without downloading anything', () => {
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const cell = { setAttribute: vi.fn() };
    const target = { closest: vi.fn(() => cell) } as unknown as EventTarget;
    const open = vi.fn();
    const fakeDocument = makeFakeDialogDocument();
    const host = makeHost({
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
        createElement: fakeDocument.createElement,
        body: fakeDocument.body,
      },
      open,
    });
    host.SocialCalc._room = 'room1';

    installLegacyExportBindings(host);
    listeners.click?.[0]?.({ target });
    expect(host.SocialCalc.Keyboard?.passThru).toBe(true);

    const cancelButton = fakeDocument.created.find(
      (el) => el.tag === 'm3e-button' && el.children[0]?.textContent === 'Cancel',
    );
    for (const listener of cancelButton?.listeners.click ?? []) listener();
    expect(open).not.toHaveBeenCalled();
    expect(host.SocialCalc.Keyboard?.passThru).toBe(false);
  });

  it('does not treat empty __MULTI__.rows as multi-sheet (#232)', () => {
    const open = vi.fn();
    const fakeDocument = makeFakeDialogDocument();
    const cell = { setAttribute: vi.fn() };
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const target = {
      closest: vi.fn(() => cell),
    } as unknown as EventTarget;
    const host = makeHost({
      open,
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
        createElement: fakeDocument.createElement,
        body: fakeDocument.body,
      },
      parent: { location: { href: 'http://h/sheet1/view', pathname: '/sheet1/view' } },
    });
    (host as BootHost & { __MULTI__?: { rows: unknown[] } }).__MULTI__ = { rows: [] };
    host.SocialCalc._room = 'sheet1';
    host.SocialCalc.Constants.s_loc_export_format = 'fmt';
    host.SocialCalc.Constants.s_loc_cancel = 'Cancel';

    installLegacyExportBindings(host);
    listeners.click?.[0]?.({ target });

    const excelButton = fakeDocument.created.find(
      (el) => el.tag === 'm3e-button' && el.children[0]?.textContent === 'Excel',
    );
    for (const listener of excelButton?.listeners.click ?? []) listener();
    expect(open).toHaveBeenCalledWith('../sheet1.xlsx');
  });
});

describe('installSocialCalcLogoLink', () => {
  it('opens the socialcalc repo when a td[id$="_logo"] cell is clicked', () => {
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const logoCell = { id: 'te_logo' };
    const target = {
      closest: vi.fn((selector: string) =>
        selector === 'td[id$="_logo"]' ? logoCell : null,
      ),
    } as unknown as EventTarget;
    const logoOpen = vi.fn();
    const host = makeHost({
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
      },
    });
    host.__logoOpen = logoOpen;

    installSocialCalcLogoLink(host);
    installSocialCalcLogoLink(host); // idempotent

    listeners.click?.[0]?.({ target });

    expect(logoOpen).toHaveBeenCalledTimes(1);
    expect(logoOpen).toHaveBeenCalledWith(
      'https://github.com/audreyt/socialcalc/blob/main/LEGAL.txt',
    );
  });

  it('ignores clicks that do not hit the logo cell', () => {
    const listeners: Record<string, Array<(event: { target?: EventTarget | null }) => void>> = {};
    const logoOpen = vi.fn();
    const host = makeHost({
      document: {
        addEventListener: (type, listener) => {
          (listeners[type] ??= []).push(listener);
        },
      },
    });
    host.__logoOpen = logoOpen;

    installSocialCalcLogoLink(host);

    // null target
    listeners.click?.[0]?.({ target: null });
    // non-object target
    listeners.click?.[0]?.({ target: 'string' as unknown as EventTarget });
    // object without closest()
    listeners.click?.[0]?.({ target: {} as EventTarget });
    // closest() returns null (no logo ancestor)
    listeners.click?.[0]?.({
      target: {
        closest: () => null,
      } as unknown as EventTarget,
    });

    expect(logoOpen).not.toHaveBeenCalled();
  });

  it('is a no-op when neither host.document nor a global document exists', () => {
    const host = makeHost();
    // Node test env has no `document` global, and we don't pass one here —
    // so the handler never attaches and the flag stays false.
    installSocialCalcLogoLink(host);
    expect(host.__ETHERCALC_LOGO_BOUND__).toBeUndefined();
  });
});
