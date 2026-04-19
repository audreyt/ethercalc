import { describe, expect, it } from 'vitest';

import {
  ALL_HTTP_SCENARIOS,
  MISC_SCENARIOS,
  ROOMS_INDEX_SCENARIOS,
  STATIC_SCENARIOS,
} from '../src/scenarios/index.ts';

describe('scenario catalog', () => {
  it('exposes four static scenarios', () => {
    expect(STATIC_SCENARIOS.map((s) => s.name)).toEqual([
      'static/get-root-index',
      'static/get-start',
      'static/get-favicon',
      'static/get-socialcalc-js',
    ]);
  });

  it('exposes six misc scenarios', () => {
    expect(MISC_SCENARIOS.map((s) => s.name)).toEqual([
      'misc/get-etc-foo-404',
      'misc/get-var-foo-404',
      'misc/get-exists-unknown-room',
      'misc/get-new-redirect',
      'misc/get-edit-no-key-redirect',
      'misc/get-view-no-key-redirect',
    ]);
  });

  it('exposes three rooms-index scenarios', () => {
    expect(ROOMS_INDEX_SCENARIOS.map((s) => s.name)).toEqual([
      'rooms-index/get-rooms-empty',
      'rooms-index/get-roomlinks-empty',
      'rooms-index/get-roomtimes-empty',
    ]);
  });

  it('ALL_HTTP_SCENARIOS concatenates every group with unique names', () => {
    const names = ALL_HTTP_SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThanOrEqual(10);
  });

  it('every scenario is http and has a deterministic path', () => {
    for (const s of ALL_HTTP_SCENARIOS) {
      expect(s.kind).toBe('http');
      expect(s.request.path.startsWith('/')).toBe(true);
    }
  });
});
