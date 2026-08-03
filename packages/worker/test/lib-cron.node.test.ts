import { describe, it, expect } from 'vite-plus/test';

import {
  buildTimetriggerBody,
  parseSettimetrigger,
  MAX_CRON_TIMES_PER_CELL,
  isValidCronCell,
  pickDueTriggers,
  toEpochMinutes,
} from '../src/lib/cron.ts';

/**
 * Pure-logic tests for `src/lib/cron.ts`. 100% istanbul gate (via
 * `vitest.node.config.ts`). All helpers are time-free: callers pass
 * `nowMinutes` explicitly.
 */

describe('parseSettimetrigger', () => {
  it('parses the canonical three-token form', () => {
    expect(parseSettimetrigger('settimetrigger A1 1000,2000,3000')).toEqual({
      cell: 'A1',
      times: [1000, 2000, 3000],
    });
  });

  it('parses a single time', () => {
    expect(parseSettimetrigger('settimetrigger B2 42')).toEqual({
      cell: 'B2',
      times: [42],
    });
  });

  it('trims whitespace inside the time list', () => {
    expect(parseSettimetrigger('settimetrigger A1 1, 2 ,3')).toEqual({
      cell: 'A1',
      times: [1, 2, 3],
    });
  });

  it('floors fractional minutes to the stable PK value', () => {
    expect(parseSettimetrigger('settimetrigger A1 1.9,2.4')).toEqual({
      cell: 'A1',
      times: [1, 2],
    });
  });

  it('drops non-numeric entries but keeps the remaining list', () => {
    expect(parseSettimetrigger('settimetrigger A1 1,foo,3')).toEqual({
      cell: 'A1',
      times: [1, 3],
    });
  });

  it('returns an empty list when every time is non-numeric', () => {
    expect(parseSettimetrigger('settimetrigger A1 foo,bar')).toEqual({
      cell: 'A1',
      times: [],
    });
  });

  it('drops empty entries from the comma list', () => {
    expect(parseSettimetrigger('settimetrigger A1 1,,3,')).toEqual({
      cell: 'A1',
      times: [1, 3],
    });
  });

  it('returns null on non-string input', () => {
    expect(parseSettimetrigger(null as unknown as string)).toBeNull();
    expect(parseSettimetrigger(undefined as unknown as string)).toBeNull();
    expect(parseSettimetrigger(42 as unknown as string)).toBeNull();
  });

  it('returns null on empty / whitespace-only input', () => {
    expect(parseSettimetrigger('')).toBeNull();
    expect(parseSettimetrigger('   ')).toBeNull();
  });

  it('returns null when there are fewer than 3 tokens', () => {
    expect(parseSettimetrigger('settimetrigger')).toBeNull();
    expect(parseSettimetrigger('settimetrigger A1')).toBeNull();
  });

  it('returns null on a different verb', () => {
    expect(parseSettimetrigger('sendemail A1 1,2')).toBeNull();
  });

  it('rejects cells outside the bounded SocialCalc coordinate space', () => {
    expect(isValidCronCell('A1')).toBe(true);
    expect(isValidCronCell('ZZ1048576')).toBe(true);
    for (const cell of ['A0', 'A1048577', 'AAA1', 'a1', 'A1;DROP']) {
      expect(isValidCronCell(cell)).toBe(false);
      expect(parseSettimetrigger(`settimetrigger ${cell} 1`)).toBeNull();
    }
  });

  it('rejects non-string cells', () => {
    expect(isValidCronCell(null)).toBe(false);
  });

  it('bounds one cell schedule below the D1 batch ceiling', () => {
    const values = Array.from(
      { length: MAX_CRON_TIMES_PER_CELL + 10 },
      (_, index) => index,
    );
    const parsed = parseSettimetrigger(
      `settimetrigger A1 ${values.join(',')}`,
    );
    expect(parsed?.times).toHaveLength(MAX_CRON_TIMES_PER_CELL);
    expect(parsed?.times.at(-1)).toBe(MAX_CRON_TIMES_PER_CELL - 1);
  });
});

describe('pickDueTriggers', () => {
  it('partitions by fire_at <= now', () => {
    const rows = [
      { room: 'r1', cell: 'A1', fire_at: 100 },
      { room: 'r1', cell: 'A1', fire_at: 200 },
      { room: 'r2', cell: 'B2', fire_at: 300 },
    ];
    expect(pickDueTriggers(150, rows)).toEqual({
      due: [{ room: 'r1', cell: 'A1' }],
      keep: [
        { room: 'r1', cell: 'A1', fire_at: 200 },
        { room: 'r2', cell: 'B2', fire_at: 300 },
      ],
    });
  });

  it('treats fire_at === now as due', () => {
    const rows = [{ room: 'r', cell: 'A1', fire_at: 100 }];
    expect(pickDueTriggers(100, rows)).toEqual({
      due: [{ room: 'r', cell: 'A1' }],
      keep: [],
    });
  });

  it('handles an empty input', () => {
    expect(pickDueTriggers(100, [])).toEqual({ due: [], keep: [] });
  });

  it('returns all keep when nothing is due', () => {
    const rows = [{ room: 'r', cell: 'A1', fire_at: 200 }];
    expect(pickDueTriggers(100, rows)).toEqual({ due: [], keep: rows });
  });
});

describe('buildTimetriggerBody', () => {
  it('groups by <room>!<cell> and joins fire_at with commas', () => {
    expect(
      buildTimetriggerBody([
        { room: 'r1', cell: 'A1', fire_at: 200 },
        { room: 'r1', cell: 'A1', fire_at: 300 },
        { room: 'r2', cell: 'B2', fire_at: 100 },
      ]),
    ).toEqual({ 'r1!A1': '200,300', 'r2!B2': '100' });
  });

  it('sorts fire_at ascending within each group', () => {
    expect(
      buildTimetriggerBody([
        { room: 'r', cell: 'A1', fire_at: 300 },
        { room: 'r', cell: 'A1', fire_at: 100 },
        { room: 'r', cell: 'A1', fire_at: 200 },
      ]),
    ).toEqual({ 'r!A1': '100,200,300' });
  });

  it('returns an empty object when no rows', () => {
    expect(buildTimetriggerBody([])).toEqual({});
  });
});

describe('toEpochMinutes', () => {
  it('floors ms to minutes', () => {
    expect(toEpochMinutes(0)).toBe(0);
    expect(toEpochMinutes(59999)).toBe(0);
    expect(toEpochMinutes(60000)).toBe(1);
    expect(toEpochMinutes(60001)).toBe(1);
    expect(toEpochMinutes(123456789)).toBe(Math.floor(123456789 / 60000));
  });
});
