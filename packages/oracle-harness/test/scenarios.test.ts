import { describe, expect, it } from 'vitest';

import {
  ALL_HTTP_SCENARIOS,
  EXPORT_SCENARIOS,
  FORM_SCENARIOS,
  MISC_SCENARIOS,
  ROOM_CRUD_SCENARIOS,
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

  it('exposes five room-crud scenarios', () => {
    expect(ROOM_CRUD_SCENARIOS.map((s) => s.name)).toEqual([
      'room-crud/put-template-room',
      'room-crud/put-export-room',
      'room-crud/post-command',
      'room-crud/delete-export-room',
      'room-crud/delete-template-room',
    ]);
  });

  it('exposes three export scenarios', () => {
    expect(EXPORT_SCENARIOS.map((s) => s.name)).toEqual([
      'exports/get-snapshot',
      'exports/get-csv',
      'exports/get-html',
    ]);
  });

  it('exposes the form redirect scenario', () => {
    expect(FORM_SCENARIOS.map((s) => s.name)).toEqual([
      'form/get-template-form-redirect',
    ]);
  });

  it('ALL_HTTP_SCENARIOS concatenates every group with unique names', () => {
    const names = ALL_HTTP_SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(22);
  });

  it('runs room-index before room mutations and exports before teardown', () => {
    const names = ALL_HTTP_SCENARIOS.map((s) => s.name);
    expect(names.indexOf('rooms-index/get-rooms-empty')).toBeLessThan(
      names.indexOf('room-crud/put-export-room'),
    );
    expect(names.indexOf('exports/get-snapshot')).toBeLessThan(
      names.indexOf('room-crud/post-command'),
    );
    expect(names.indexOf('form/get-template-form-redirect')).toBeLessThan(
      names.indexOf('room-crud/delete-export-room'),
    );
  });

  it('every scenario is http and has a deterministic path', () => {
    for (const s of ALL_HTTP_SCENARIOS) {
      expect(s.kind).toBe('http');
      expect(s.request.path.startsWith('/')).toBe(true);
    }
  });
});
