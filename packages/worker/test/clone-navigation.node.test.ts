import { describe, expect, it } from 'vite-plus/test';
import { allowsCloneNavigation } from '../src/lib/clone-navigation.ts';

describe('template-copy navigation admission', () => {
  it.each(['same-origin', 'none', undefined, null])('allows %s', (site) => {
    expect(allowsCloneNavigation(site)).toBe(true);
  });

  it.each(['cross-site', 'same-site', 'unexpected', ''])('rejects %s', (site) => {
    expect(allowsCloneNavigation(site)).toBe(false);
  });
});
