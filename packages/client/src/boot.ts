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

async function autoBoot(): Promise<void> {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const w = window as unknown as MainHost;
  if (!w.SocialCalc) return;
  installGraph({
    SocialCalc: w.SocialCalc,
    win: window as unknown as Parameters<typeof installGraph>[0]['win'],
    doc: document,
  });
  runMain({ host: w });
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void autoBoot());
  } else {
    void autoBoot();
  }
}
