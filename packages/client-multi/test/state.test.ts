import { describe, it, expect } from 'vitest';
import { HackFoldr } from '../src/Foldr.ts';
import {
  computeNextRow,
  createInitialState,
  reducer,
  titleTaken,
} from '../src/state.ts';

function makeFoldr(rows: Array<{ link: string; title: string; row: number }>): HackFoldr {
  const f = new HackFoldr('http://x', {
    fetchImpl: async () => ({ ok: true, json: async () => [] }) as Response,
  });
  f.rows = rows.slice();
  return f;
}

describe('reducer', () => {
  it('initial state has rev=0, activeIndex=0', () => {
    const f = makeFoldr([]);
    const s = createInitialState(f);
    expect(s.activeIndex).toBe(0);
    expect(s.rev).toBe(0);
    expect(s.foldr).toBe(f);
  });

  it('setActive updates activeIndex only', () => {
    const f = makeFoldr([]);
    const s = reducer(createInitialState(f), { type: 'setActive', index: 3 });
    expect(s.activeIndex).toBe(3);
    expect(s.rev).toBe(0);
  });

  it('bumpRev increments rev only', () => {
    const f = makeFoldr([]);
    const s = reducer(createInitialState(f), { type: 'bumpRev' });
    expect(s.rev).toBe(1);
    expect(s.activeIndex).toBe(0);
  });

  it('bumpRev+setActive updates both', () => {
    const f = makeFoldr([]);
    const s = reducer(createInitialState(f), {
      type: 'bumpRev+setActive',
      index: 5,
    });
    expect(s.rev).toBe(1);
    expect(s.activeIndex).toBe(5);
  });
});

describe('titleTaken', () => {
  it('matches case-insensitively', () => {
    expect(titleTaken(['Sheet1', 'Sheet2'], 'sheet1')).toBe(true);
  });
  it('returns false for unique titles', () => {
    expect(titleTaken(['Sheet1'], 'Sheet2')).toBe(false);
  });
});

describe('computeNextRow', () => {
  it('defaults to Sheet<n+1> / /<index>.<n+1> when there are no rows', () => {
    const f = makeFoldr([]);
    const r = computeNextRow(f, 'room');
    // size=0, so nextSheet starts at 1.
    expect(r).toEqual({ link: '/room.1', title: 'Sheet1', row: 0 });
  });

  it('extracts prefix from the last title when it matches', () => {
    const f = makeFoldr([{ link: '/room.1', title: 'Sheet1', row: 2 }]);
    const r = computeNextRow(f, 'room');
    expect(r.title).toBe('Sheet2');
    expect(r.link).toBe('/room.2');
  });

  it('honors an alphabetic-only prefix (Report, Tab…)', () => {
    const f = makeFoldr([
      { link: '/room.1', title: 'Report1', row: 2 },
      { link: '/room.2', title: 'Report2', row: 3 },
    ]);
    const r = computeNextRow(f, 'room');
    expect(r.title).toBe('Report3');
  });

  it('uses the default linkPrefix when the last link does not match', () => {
    const f = makeFoldr([
      { link: '/weird-no-dot', title: 'Sheet1', row: 2 },
    ]);
    const r = computeNextRow(f, 'room');
    expect(r.link).toBe('/room.2');
  });

  it('uses the /sheetN style when the last link matches `/sheet\\d+`', () => {
    const f = makeFoldr([{ link: '/sheet5', title: 'Sheet5', row: 2 }]);
    const r = computeNextRow(f, 'room');
    expect(r.link).toBe('/sheet6');
    expect(r.title).toBe('Sheet6');
  });

  it('skips numbers already taken by title', () => {
    const f = makeFoldr([
      { link: '/a', title: 'Sheet1', row: 2 },
      { link: '/b', title: 'Sheet2', row: 3 },
      { link: '/c', title: 'Sheet4', row: 4 },
    ]);
    const r = computeNextRow(f, 'room');
    // Last title regex won't match 'Sheet4'? Yes it does — prefix=Sheet, nextSheet=4.
    // Then 4 is in titles? yes. So bumps to 5.
    expect(r.title).toBe('Sheet5');
  });

  it('skips numbers already taken by link', () => {
    const f = makeFoldr([
      { link: '/room.5', title: 'Alpha', row: 2 },
    ]);
    const r = computeNextRow(f, 'room');
    // Title 'Alpha' doesn't match `<alpha><digits>`, so prefix=Sheet, next = size+1 = 2.
    // Link 'Alpha' doesn't match `[^=]+\.` or `sheet\d` — linkPrefix stays default `/room.`.
    // /room.2 not in links, Sheet2 not in titles → Sheet2.
    expect(r.title).toBe('Sheet2');
    expect(r.link).toBe('/room.2');
  });

  it('bumps when both title and link conflict', () => {
    const f = makeFoldr([
      { link: '/x.', title: 'Sheet1', row: 2 },
      // fake conflict: next default would be /room.2 + Sheet2
      { link: '/room.2', title: 'Sheet2', row: 3 },
    ]);
    const r = computeNextRow(f, 'room');
    expect(r.title).toBe('Sheet3');
  });
});
