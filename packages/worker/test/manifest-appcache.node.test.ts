import { describe, it, expect } from 'vitest';

import {
  APPCACHE_CONTENT_TYPE,
  buildDynamicAppcache,
} from '../src/handlers/manifest-appcache.ts';

describe('buildDynamicAppcache', () => {
  it('emits the legacy CACHE MANIFEST shape with the injected timestamp', () => {
    const body = buildDynamicAppcache({ now: 1700000000000 });
    expect(body).toBe('CACHE MANIFEST\n\n#1700000000000\n\nNETWORK:\n*\n');
  });

  it('emits a different body when the timestamp changes', () => {
    const a = buildDynamicAppcache({ now: 1 });
    const b = buildDynamicAppcache({ now: 2 });
    expect(a).not.toBe(b);
  });

  it('exports the expected content-type constant', () => {
    expect(APPCACHE_CONTENT_TYPE).toBe('text/cache-manifest');
  });

  it('honors now=0 without collapsing to empty', () => {
    const body = buildDynamicAppcache({ now: 0 });
    expect(body).toContain('#0\n');
    expect(body.startsWith('CACHE MANIFEST\n\n#0\n')).toBe(true);
  });
});
