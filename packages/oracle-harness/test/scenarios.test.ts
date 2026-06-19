import { describe, expect, it } from 'vitest';

import {
  ALL_HTTP_SCENARIOS,
  ALL_SCENARIOS,
  CRON_SCENARIOS,
  EXPORT_SCENARIOS,
  FORM_SCENARIOS,
  MISC_SCENARIOS,
  ROOM_CRUD_SCENARIOS,
  ROOMS_INDEX_SCENARIOS,
  STATIC_SCENARIOS,
  TEMPLATING_SCENARIOS,
  WS_SCENARIOS,
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

  it('exposes the cron scenario', () => {
    expect(CRON_SCENARIOS.map((s) => s.name)).toEqual(['cron/get-timetrigger']);
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

  it('exposes ten export scenarios', () => {
    expect(EXPORT_SCENARIOS.map((s) => s.name)).toEqual([
      'exports/get-snapshot',
      'exports/get-csv',
      'exports/get-html',
      'exports/get-xlsx',
      'exports/get-ods',
      'exports/get-csv-json',
      'exports/get-fods',
      'exports/get-md',
      'exports/get-cells',
      'exports/get-cell-a1',
    ]);
  });

  it('exposes eight ws scenarios', () => {
    expect(WS_SCENARIOS.map((s) => s.name)).toEqual([
      'ws/connect',
      'ws/ask-log',
      'ws/execute-command',
      'ws/chat',
      'ws/ask-ecell',
      'ws/ask-recalc',
      'ws/stop-huddle',
      'ws/ecell',
    ]);
  });

  it('exposes the form redirect scenario', () => {
    expect(FORM_SCENARIOS.map((s) => s.name)).toEqual([
      'form/get-template-form-redirect',
    ]);
  });

  it('exposes three templating scenarios', () => {
    expect(TEMPLATING_SCENARIOS.map((s) => s.name)).toEqual([
      'templating/get-from-template',
      'templating/get-multi-new',
      'templating/post-autogen-room',
    ]);
  });

  it('ALL_HTTP_SCENARIOS concatenates every group with unique names', () => {
    const names = ALL_HTTP_SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(35);
  });

  it('ALL_SCENARIOS includes ws scenarios after exports', () => {
    const names = ALL_SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(43);
    expect(names.indexOf('exports/get-ods')).toBeLessThan(names.indexOf('ws/connect'));
    expect(names.indexOf('ws/ecell')).toBeLessThan(
      names.indexOf('form/get-template-form-redirect'),
    );
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

  it('runs cron before room mutations and templating after setup, before teardown', () => {
    const names = ALL_HTTP_SCENARIOS.map((s) => s.name);
    // /_timetrigger creates no rooms, so it stays with the stateless probes
    // ahead of the first PUT that would populate the room index.
    expect(names.indexOf('cron/get-timetrigger')).toBeLessThan(
      names.indexOf('room-crud/put-template-room'),
    );
    // /_from/:template needs the template room PUT first…
    expect(names.indexOf('room-crud/put-template-room')).toBeLessThan(
      names.indexOf('templating/get-from-template'),
    );
    // …and POST /_ creates a room, so it must follow the empty room-index
    // probes and precede the teardown DELETEs.
    expect(names.indexOf('rooms-index/get-rooms-empty')).toBeLessThan(
      names.indexOf('templating/post-autogen-room'),
    );
    expect(names.indexOf('templating/post-autogen-room')).toBeLessThan(
      names.indexOf('room-crud/delete-template-room'),
    );
  });

  it('every http scenario has a deterministic path', () => {
    for (const s of ALL_HTTP_SCENARIOS) {
      expect(s.kind).toBe('http');
      expect(s.request.path.startsWith('/')).toBe(true);
    }
  });

  it('every ws scenario declares connect steps with /_ws paths', () => {
    for (const s of WS_SCENARIOS) {
      expect(s.kind).toBe('ws');
      expect(s.steps.some((step) => step.type === 'connect' && step.url.includes('/_ws/'))).toBe(
        true,
      );
    }
  });
});
