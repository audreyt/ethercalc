/* istanbul ignore file — boot code requires a real browser (window.history,
 * iframe content). Covered by Playwright smoke tests in Phase 11.
 */

import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { HackFoldr } from './Foldr.ts';
import { parseMultiEnv } from './url.ts';

async function boot(): Promise<void> {
  const env = parseMultiEnv(window.location);
  if (env.pushStatePath !== null) {
    window.history.pushState({}, '', env.pushStatePath);
  }
  const foldr = new HackFoldr(env.basePath);
  await foldr.fetch(env.index);
  const root = document.getElementById('root');
  if (!root) throw new Error('missing #root element');
  createRoot(root).render(
    <App
      foldr={foldr}
      basePath={env.basePath}
      suffix={env.suffix}
      index={env.index}
      isReadOnly={env.isReadOnly}
    />,
  );
}

void boot();
