import { describe, expect, it } from 'vite-plus/test';
import { allowsCloneNavigation } from '../src/lib/clone-navigation.ts';

describe('template-copy navigation admission', () => {
  it.each(['same-origin', 'none', undefined, null])('allows %s', (site) => {
    expect(allowsCloneNavigation(site, undefined)).toBe(true);
    expect(allowsCloneNavigation(site, null)).toBe(true);
    expect(allowsCloneNavigation(site, 'navigate')).toBe(true);
  });

  it.each(['cross-site', 'same-site', 'unexpected', ''])('rejects %s', (site) => {
    expect(allowsCloneNavigation(site, undefined)).toBe(false);
    expect(allowsCloneNavigation(site, 'navigate')).toBe(false);
  });

  // A cell image or a script fetch on one of our own pages is same-origin
  // without the user having opened the copy URL.
  it.each(['same-origin', 'none'])('rejects a %s subresource load', (site) => {
    expect(allowsCloneNavigation(site, 'no-cors')).toBe(false);
    expect(allowsCloneNavigation(site, 'cors')).toBe(false);
    expect(allowsCloneNavigation(site, 'same-origin')).toBe(false);
    expect(allowsCloneNavigation(site, '')).toBe(false);
  });
});
