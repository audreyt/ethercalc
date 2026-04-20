/**
 * Browser-only side-effect entry.  This is the actual input to Vite's bundle;
 * it imports + boots everything and leaves no exports.
 *
 * Kept in its own file so Istanbul can exclude it via `vitest.config.ts`
 * without dragging down the 100% coverage gate on `main.ts`/`ws-adapter.ts`
 * /`socialcalc-callbacks.ts`.
 */

import { runMain, type MainHost } from './main.ts';
import { installGraph } from './graph.ts';

export interface BootHost extends MainHost {
  SocialCalc: MainHost['SocialCalc'];
  doresize?: () => void;
  document?: {
    addEventListener: (
      type: string,
      listener: (event: { target?: EventTarget | null }) => void,
    ) => void;
  };
  open?: (url: string) => unknown;
  parent?: {
    location: {
      href?: string;
      pathname: string;
    };
  };
  vex?: {
    defaultOptions?: { className?: string };
    dialog?: {
      open: (opts: {
        message: string;
        callback?: () => void;
        buttons: Array<Record<string, unknown>>;
      }) => unknown;
      buttons?: {
        YES?: Record<string, unknown>;
        NO?: Record<string, unknown>;
      };
    };
  };
  __ETHERCALC_EXPORT_BOUND__?: boolean;
}

const EXPORT_SELECTOR = '.te_download tr:nth-child(2) td:first-child';

type ExportFormat = 'xlsx' | 'csv' | 'html' | 'ods';

interface ExportCellLike {
  closest?: (selector: string) => unknown;
  setAttribute?: (name: string, value: string) => void;
}

function findExportCell(target: EventTarget | null | undefined): ExportCellLike | null {
  if (!target || typeof target !== 'object') return null;
  const element = target as ExportCellLike;
  if (typeof element.closest !== 'function') return null;
  const cell = element.closest(EXPORT_SELECTOR);
  return cell && typeof cell === 'object' ? (cell as ExportCellLike) : null;
}

export function buildLegacyExportUrl(
  format: ExportFormat,
  room: string,
  opts: {
    isMultiple: boolean;
    parentHref?: string | undefined;
    parentPathname: string;
  },
): string {
  const relBase = /\/.*\/(?:view|edit)$/.test(opts.parentPathname) ? '..' : '.';

  if ((format === 'xlsx' || format === 'ods') && opts.isMultiple) {
    const hrefMatch = opts.parentHref ? /(^.*\/=[^?/]+)/.exec(opts.parentHref) : null;
    if (hrefMatch) return `${hrefMatch[1]}.${format}`;
    const baseRoom = room.replace(/\.[1-9]\d*$/, '');
    return `${relBase}/=${baseRoom}.${format}`;
  }

  return `${relBase}/${room}.${format}`;
}

export function openLegacyExportDialog(host: BootHost): void {
  const room = host.SocialCalc._room ?? '';
  if (!room) return;

  const vex =
    host.vex ??
    (
      typeof window !== 'undefined'
        ? (window as Window & { vex?: BootHost['vex'] }).vex
        : undefined
    );
  if (!vex?.dialog?.open) return;

  const parentLocation =
    host.parent?.location ??
    (typeof window !== 'undefined' ? window.parent.location : undefined) ??
    { pathname: host.location.pathname };
  const isMultiple =
    Boolean(
      (host as BootHost & { __MULTI__?: { rows?: unknown[] } }).__MULTI__?.rows ??
        (
          typeof window !== 'undefined'
            ? (window as Window & { __MULTI__?: { rows?: unknown[] } }).__MULTI__?.rows
            : undefined
        ),
    ) ||
    /\.[1-9]\d*$/.test(room);
  const open =
    host.open ??
    (typeof window !== 'undefined'
      ? (url: string) => window.open(url)
      : undefined);
  if (!open) return;

  host.SocialCalc.Keyboard ??= {};
  host.SocialCalc.Keyboard.passThru = true;
  if (vex.defaultOptions) vex.defaultOptions.className = 'vex-theme-flat-attack';

  const openFormat = (format: ExportFormat): void => {
    open(
      buildLegacyExportUrl(format, room, {
        isMultiple,
        parentHref: parentLocation.href,
        parentPathname: parentLocation.pathname,
      }),
    );
  };

  const yes = vex.dialog.buttons?.YES ?? {};
  const no = vex.dialog.buttons?.NO ?? {};

  vex.dialog.open({
    message:
      (host.SocialCalc.Constants.s_loc_export_format ?? 'Please choose an export format.') +
      (isMultiple ? '<br><small>(ODS and EXCEL support multiple sheets.)</small>' : ''),
    callback: () => {
      if (host.SocialCalc.Keyboard) host.SocialCalc.Keyboard.passThru = false;
    },
    buttons: [
      { ...yes, text: 'Excel', click: () => openFormat('xlsx') },
      { ...yes, text: 'CSV', click: () => openFormat('csv') },
      { ...yes, text: 'HTML', click: () => openFormat('html') },
      { ...yes, text: 'ODS', click: () => openFormat('ods') },
      { ...no, text: host.SocialCalc.Constants.s_loc_cancel ?? 'Cancel' },
    ],
  });
}

export function installLegacyExportBindings(host: BootHost): void {
  if (host.__ETHERCALC_EXPORT_BOUND__) return;
  const doc = host.document ?? (typeof document !== 'undefined' ? document : undefined);
  if (!doc) return;

  host.__ETHERCALC_EXPORT_BOUND__ = true;

  doc.addEventListener('mouseover', (event) => {
    const cell = findExportCell(event.target);
    if (!cell || typeof cell.setAttribute !== 'function') return;
    cell.setAttribute('title', host.SocialCalc.Constants.s_loc_export ?? 'Export');
  });

  doc.addEventListener('click', (event) => {
    if (!findExportCell(event.target)) return;
    openLegacyExportDialog(host);
  });
}

export function initializeSpreadsheet(host: BootHost): void {
  const w = host as BootHost & Window;
  const { SocialCalc } = host;
  w.doresize = () => {
    w.spreadsheet?.DoOnResize?.();
  };

  const existing = SocialCalc.CurrentSpreadsheetControlObject;
  const ss =
    existing ??
    (
      SocialCalc._view || SocialCalc._app
        ? SocialCalc.SpreadsheetViewer
          ? new SocialCalc.SpreadsheetViewer()
          : undefined
        : SocialCalc.SpreadsheetControl
          ? new SocialCalc.SpreadsheetControl()
          : undefined
    );
  if (!ss) return;

  w.spreadsheet = ss;

  if (SocialCalc.Cell) {
    const loaderCell = new SocialCalc.Cell('A1') as { displaystring?: string };
    loaderCell.displaystring = '<div class="loader"></div>';
    ss.sheet.cells['A1'] = loaderCell;
  }

  ss.InitializeSpreadsheetViewer?.('tableeditor', 0, 0, 0);
  ss.InitializeSpreadsheetControl?.('tableeditor', 0, 0, 0);

  if (!SocialCalc._view && ss.formDataViewer) {
    const room = `${SocialCalc._room ?? ''}_formdata`;
    ss.formDataViewer.sheet._room = room;
    ss.formDataViewer._room = room;
    SocialCalc.Callbacks.broadcast?.('ask.log', { room });
  } else {
    SocialCalc.Callbacks.broadcast?.('ask.log');
  }

  ss.ExecuteCommand?.('redisplay', '');
  ss.ExecuteCommand?.('set sheet defaulttextvalueformat text-wiki');
  installLegacyExportBindings(host);
}

async function autoBoot(): Promise<void> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const w = window as unknown as BootHost;
  if (!w.SocialCalc) return;
  installGraph({
    SocialCalc: w.SocialCalc,
    win: window as unknown as Parameters<typeof installGraph>[0]['win'],
    doc: document,
  });
  const handle = runMain({ host: w });
  if (!handle) return;
  initializeSpreadsheet(w);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void autoBoot());
  } else {
    void autoBoot();
  }
}
