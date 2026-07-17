/**
 * Browser-only side-effect entry.  This is the actual input to Vite's bundle;
 * it imports + boots everything and leaves no exports.
 *
 * Kept in its own file so Istanbul can exclude it via `vitest.config.ts`
 * without dragging down the 100% coverage gate on `main.ts`/`ws-adapter.ts`
 * /`socialcalc-callbacks.ts`.
 */

import DOMPurify from 'dompurify';

import { runMain, type MainHost } from './main.ts';
import { installGraph } from './graph.ts';
import { installSecurityPolicy } from './sanitize-html.ts';

/**
 * Minimal DOM surface `openLegacyExportDialog` needs to construct an
 * `m3e-dialog`. See `BootHost.document`'s doc comment for why this is
 * hand-typed rather than `@m3e/web`'s real element types.
 */
export interface DialogHostElement {
  id: string;
  slot: string;
  textContent: string;
  dismissible: boolean;
  setAttribute: (name: string, value: string) => void;
  appendChild: (child: DialogHostElement) => void;
  addEventListener: (type: string, listener: () => void) => void;
  show: () => unknown;
  hide: () => unknown;
  remove: () => void;
}

export interface BootHost extends MainHost {
  SocialCalc: MainHost['SocialCalc'];
  doresize?: () => void;
  document?: {
    addEventListener: (
      type: string,
      listener: (event: { target?: EventTarget | null }) => void,
    ) => void;
    /**
     * Narrow, hand-typed DOM-construction seam for the M3E export
     * dialog — NOT `@m3e/web`'s real element types (this file never
     * imports `@m3e/web/*`; it constructs `<m3e-dialog>`/`<m3e-button>`
     * by tag name, relying on the custom elements the passkey entry's
     * separately-loaded script registers). Narrow enough to fake in
     * Node-environment tests without jsdom; `window.document` satisfies
     * it structurally in production via a cast, matching how `host.vex`
     * used to work before the M3E rewrite.
     */
    createElement?: (tag: string) => DialogHostElement;
    body?: { appendChild: (el: DialogHostElement) => void };
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
// CPAL Exhibit B requires the logo to link to the Attribution URL. The
// license hard-codes http://www.socialcalc.org, but that domain has
// lapsed into scam territory. LEGAL.txt in the actively maintained fork
// carries the verbatim Attribution Copyright Notice + Attribution
// Phrase, so pointing there presents the mandated notice to the user in
// a comparable manner.
const SOCIALCALC_ATTRIBUTION_URL =
  'https://github.com/audreyt/socialcalc/blob/main/LEGAL.txt';

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

  const dialogDocument =
    (host.document?.createElement && host.document.body
      ? (host.document as { createElement: (tag: string) => DialogHostElement; body: { appendChild: (el: DialogHostElement) => void } })
      : undefined) ??
    (typeof document !== 'undefined'
      ? (document as unknown as { createElement: (tag: string) => DialogHostElement; body: { appendChild: (el: DialogHostElement) => void } })
      : undefined);
  if (!dialogDocument) return;

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
  const multiRows =
    (host as BootHost & { __MULTI__?: { rows?: unknown[] } }).__MULTI__?.rows ??
    (typeof window !== 'undefined'
      ? (window as Window & { __MULTI__?: { rows?: unknown[] } }).__MULTI__?.rows
      : undefined);
  // Empty `rows: []` is truthy — must check length (#232 viewer export).
  const isMultiple = (multiRows?.length ?? 0) > 0 || /\.[1-9]\d*$/.test(room);
  // Production path: synthetic `<a>` click. `window.open()` is
  // popup-blocked in Chrome when called from inside the dialog's
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
  // that fire after any async hop (our dialog button -> callback ->
  // openFormat is two ticks past the direct user click, so the
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

  const openFormat = (format: ExportFormat): void => {
    open(
      buildLegacyExportUrl(format, room, {
        isMultiple,
        parentHref: parentLocation.href,
        parentPathname: parentLocation.pathname,
      }),
    );
  };

  const dialog = dialogDocument.createElement('m3e-dialog');
  dialog.dismissible = true;

  const header = dialogDocument.createElement('span');
  header.slot = 'header';
  header.textContent = host.SocialCalc.Constants.s_loc_export ?? 'Export';
  dialog.appendChild(header);

  const message = dialogDocument.createElement('p');
  message.textContent =
    (host.SocialCalc.Constants.s_loc_export_format ?? 'Please choose an export format.') +
    (isMultiple ? ' (ODS and EXCEL support multiple sheets.)' : '');
  dialog.appendChild(message);

  const actions = dialogDocument.createElement('div');
  actions.slot = 'actions';

  // Per `m3e-dialog`'s documented usage (`<m3e-button><m3e-dialog-action
  // return-value="…">Label</m3e-dialog-action></m3e-button>`):
  // `m3e-dialog-action` finds its closest `m3e-dialog` ancestor and calls
  // `.hide()` itself once clicked — no manual `dialog.hide()` call
  // needed here. (Unlike the passkey dialogs, which deliberately use
  // plain `m3e-button`s and call `hide()` manually only after success —
  // see the passkey UI design doc — every choice in *this* dialog
  // should unconditionally close it, which is exactly what
  // `m3e-dialog-action` gives for free.)
  const addFormatButton = (label: string, format: ExportFormat): void => {
    const button = dialogDocument.createElement('m3e-button');
    button.setAttribute('variant', 'filled');
    const action = dialogDocument.createElement('m3e-dialog-action');
    action.setAttribute('return-value', format);
    action.textContent = label;
    button.appendChild(action);
    button.addEventListener('click', () => openFormat(format));
    actions.appendChild(button);
  };
  addFormatButton('Excel', 'xlsx');
  addFormatButton('CSV', 'csv');
  addFormatButton('HTML', 'html');
  addFormatButton('ODS', 'ods');

  const cancelButton = dialogDocument.createElement('m3e-button');
  cancelButton.setAttribute('variant', 'text');
  const cancelAction = dialogDocument.createElement('m3e-dialog-action');
  cancelAction.setAttribute('return-value', 'cancel');
  cancelAction.textContent = host.SocialCalc.Constants.s_loc_cancel ?? 'Cancel';
  cancelButton.appendChild(cancelAction);
  actions.appendChild(cancelButton);
  dialog.appendChild(actions);

  // `closed` fires on every dismissal path (action click via `.hide()`,
  // Escape, or backdrop click via `cancel` → `.hide()` — verified
  // against `M3eDialogElement`'s source during the passkey UI rewrite),
  // matching what vex's `callback` option used to cover.
  dialog.addEventListener('closed', () => {
    if (host.SocialCalc.Keyboard) host.SocialCalc.Keyboard.passThru = false;
    dialog.remove();
  });
  dialogDocument.body.appendChild(dialog);
  dialog.show();
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
    open?.(SOCIALCALC_ATTRIBUTION_URL);
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
  // Close the stored-XSS hole in the live editor: the served SocialCalc
  // runtime renders `text-html` cell values straight into the cell div's
  // innerHTML. Enable SocialCalc 3.1.0's built-in untrustedContent security
  // model and wire DOMPurify as the sanitiser callback before any sheet data
  // is parsed (see packages/client/src/sanitize-html.ts).
  installSecurityPolicy(w.SocialCalc, DOMPurify);
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
