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
