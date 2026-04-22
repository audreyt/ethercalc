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
  /**
   * Test-only override for the URL-opener. In production `host` IS
   * `window`, and `host.open === window.open` (the browser builtin),
   * so the default production path — a synthetic `<a>` click —
   * must NOT delegate to `host.open` (doing so triggers the popup
   * blocker). Instead we expose a dedicated override field that tests
   * set explicitly; production code ignores it.
   */
  __exportOpen?: (url: string) => unknown;
  /** @deprecated legacy alias — keep `window.open` addressable for type. */
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
  /**
   * Test-only override for the logo-click opener. Production uses a
   * plain anchor click (see `installSocialCalcLogoLink`).
   */
  __logoOpen?: (url: string) => unknown;
  __ETHERCALC_LOGO_BOUND__?: boolean;
}

const EXPORT_SELECTOR = '.te_download tr:nth-child(2) td:first-child';
const LOGO_SELECTOR = 'td[id$="_logo"]';
const SOCIALCALC_REPO_URL = 'https://github.com/audreyt/socialcalc';

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

  // `window.parent.location` throws a SecurityError in cross-origin
  // iframe embeds (Sandstorm, notion integrations, etc.). Fall back to
  // the current document's location when that happens — the export-URL
  // builder handles both shapes.
  const readParentLocation = (): { href?: string; pathname: string } | undefined => {
    if (host.parent?.location) return host.parent.location;
    if (typeof window === 'undefined') return undefined;
    try {
      return window.parent.location;
    } catch {
      return undefined;
    }
  };
  const parentLocation =
    readParentLocation() ?? { pathname: host.location.pathname };
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
  // Production path: synthetic `<a>` click. `window.open()` is
  // popup-blocked in Chrome when called from inside the vex-dialog
  // button handler (it's one async tick removed from the direct user
  // click, so Chrome's user-activation window has lapsed). Anchor
  // clicks don't hit the popup blocker, and they also honor the
  // server's `Content-Disposition` header: CSV/XLSX/ODS download
  // (server sets attachment), HTML opens inline (server doesn't).
  //
  // Tests override via `host.__exportOpen`; we deliberately do NOT
  // fall back to `host.open` because in production `host === window`
  // and `window.open` is the popup-blocked path we're avoiding.
  // Production download path.
  //
  // Why `fetch → blob → object URL → anchor click` instead of a plain
  // anchor pointing at the server URL: Chrome's "automatic downloads"
  // security policy blocks same-origin navigation/download anchors
  // that fire after any async hop (our vex dialog button -> callback
  // -> openFormat is two ticks past the direct user click, so the
  // user-activation gate has already closed). Pulling the bytes via
  // fetch and then clicking an anchor that points at a blob: URL
  // bypasses that gate — the click is treated as a direct save of
  // local data, not a new navigation. This works uniformly for all
  // four formats (xlsx/ods are binary, csv/html are text) and
  // honors the server's Content-Disposition filename.
  const deriveFilename = (url: string, cd: string | null): string => {
    const match = cd && /filename\*?="?([^";]+)"?/i.exec(cd);
    if (match?.[1]) return match[1];
    const tail = url.split('?')[0]?.split('/').pop() ?? 'export';
    return tail;
  };
  const open =
    host.__exportOpen ??
    (typeof document !== 'undefined' && typeof fetch !== 'undefined'
      ? (url: string) => {
          void (async () => {
            const res = await fetch(url);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = deriveFilename(url, res.headers.get('Content-Disposition'));
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            // Revoke on next tick so the click's navigation has
            // already kicked off. Immediate revoke would race.
            setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
          })();
          return undefined;
        }
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

function findLogoCell(target: EventTarget | null | undefined): unknown {
  if (!target || typeof target !== 'object') return null;
  const element = target as { closest?: (selector: string) => unknown };
  if (typeof element.closest !== 'function') return null;
  return element.closest(LOGO_SELECTOR);
}

export function installSocialCalcLogoLink(host: BootHost): void {
  if (host.__ETHERCALC_LOGO_BOUND__) return;
  const doc = host.document ?? (typeof document !== 'undefined' ? document : undefined);
  if (!doc) return;

  host.__ETHERCALC_LOGO_BOUND__ = true;

  doc.addEventListener('click', (event) => {
    if (!findLogoCell(event.target)) return;
    const open =
      host.__logoOpen ??
      (typeof document !== 'undefined'
        ? (url: string) => {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return undefined;
          }
        : undefined);
    open?.(SOCIALCALC_REPO_URL);
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
  installSocialCalcLogoLink(host);
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
