import { describe, it, expect, vi, beforeEach, afterEach } from 'vite-plus/test';
import { renderHook, act } from '@testing-library/react';
import { HackFoldr } from '../src/Foldr.ts';
import {
  DEFAULT_TOC_POLL_MS,
  MAX_TOC_POLL_REST_MS,
  TOC_POLL_REST_FACTOR,
  useTocPoll,
} from '../src/useTocPoll.ts';

describe('useTocPoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exports a 3s default poll interval', () => {
    expect(DEFAULT_TOC_POLL_MS).toBe(3000);
  });

  it('calls onChange when refreshToc reports a change', async () => {
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [
            ['#url', '#title'],
            ['/r.1', 'Sheet1'],
            ['/r.2', 'PeerAdded'],
          ],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    const setIntervalFn = vi.fn((cb: () => void, _ms?: number) => {
      cb();
      return 1 as unknown as ReturnType<typeof setInterval>;
    });

    renderHook(() =>
      useTocPoll(foldr, onChange, {
        intervalMs: 1000,
        setIntervalFn,
        clearIntervalFn: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(foldr.rows).toEqual([
      { link: '/r.1', title: 'Sheet1', row: 2 },
      { link: '/r.2', title: 'PeerAdded', row: 3 },
    ]);
  });

  it('does not call onChange when refreshToc is unchanged', async () => {
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [['#url', '#title'], ['/r.1', 'Sheet1']],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    const setIntervalFn = vi.fn((cb: () => void) => {
      cb();
      return 1 as unknown as ReturnType<typeof setInterval>;
    });

    renderHook(() =>
      useTocPoll(foldr, onChange, {
        setIntervalFn,
        clearIntervalFn: vi.fn(),
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the interval on unmount', async () => {
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [['#url', '#title'], ['/r.1', 'Sheet1']],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const clearIntervalFn = vi.fn();
    const setIntervalFn = vi.fn(() => 42 as unknown as ReturnType<typeof setInterval>);

    const { unmount } = renderHook(() =>
      useTocPoll(foldr, vi.fn(), { setIntervalFn, clearIntervalFn }),
    );

    unmount();
    expect(clearIntervalFn).toHaveBeenCalledWith(42);
  });

  it('does not call onChange on the default timer when TOC is unchanged', async () => {
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [['#url', '#title'], ['/r.1', 'Sheet1']],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    renderHook(() => useTocPoll(foldr, onChange));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('clears the default interval on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [['#url', '#title'], ['/r.1', 'Sheet1']],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const { unmount } = renderHook(() => useTocPoll(foldr, vi.fn()));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('returns early from tick when already cancelled before refresh', async () => {
    let storedCb: (() => void) | undefined;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [
            ['#url', '#title'],
            ['/r.1', 'Sheet1'],
            ['/r.2', 'Late'],
          ],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    const { unmount } = renderHook(() =>
      useTocPoll(foldr, onChange, {
        setIntervalFn: (cb) => {
          storedCb = cb;
          return 1 as unknown as ReturnType<typeof setInterval>;
        },
        clearIntervalFn: vi.fn(),
      }),
    );

    unmount();
    await act(async () => {
      storedCb?.();
      await Promise.resolve();
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('uses default interval and global timer fns when options are omitted', async () => {
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () =>
        ({
          ok: true,
          json: async () => [
            ['#url', '#title'],
            ['/r.1', 'Sheet1'],
            ['/r.2', 'Remote'],
          ],
        }) as Response,
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    renderHook(() => useTocPoll(foldr, onChange));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('skips onChange after unmount even if refreshToc resolves late', async () => {
    let resolveFetch: (() => void) | undefined;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: () =>
        new Promise<Response>((resolve) => {
          resolveFetch = () =>
            resolve({
              ok: true,
              json: async () => [
                ['#url', '#title'],
                ['/r.1', 'Sheet1'],
                ['/r.2', 'Late'],
              ],
            } as Response);
        }),
    });
    foldr.id = 'r';
    foldr.rows = [{ link: '/r.1', title: 'Sheet1', row: 2 }];

    const onChange = vi.fn();
    const setIntervalFn = vi.fn((cb: () => void) => {
      void cb();
      return 7 as unknown as ReturnType<typeof setInterval>;
    });
    const clearIntervalFn = vi.fn();

    const { unmount } = renderHook(() =>
      useTocPoll(foldr, onChange, { setIntervalFn, clearIntervalFn }),
    );

    unmount();
    await act(async () => {
      resolveFetch?.();
      await Promise.resolve();
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not start a poll while the previous one is unanswered', async () => {
    let answer: () => void = () => {};
    let polls = 0;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: () => {
        polls += 1;
        return new Promise<Response>((resolve) => {
          answer = () => resolve({ ok: true, json: async () => [] as unknown } as Response);
        });
      },
    });
    foldr.id = 'r';
    renderHook(() => useTocPoll(foldr, vi.fn()));

    await vi.advanceTimersByTimeAsync(5 * DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(1);

    answer();
    await vi.advanceTimersByTimeAsync(0);
    expect(polls).toBe(1);
  });

  it('rests in proportion to how long the last poll took, capped at MAX_TOC_POLL_REST_MS', async () => {
    let answer: () => void = () => {};
    let polls = 0;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: () => {
        polls += 1;
        return new Promise<Response>((resolve) => {
          answer = () => resolve({ ok: true, json: async () => [] as unknown } as Response);
        });
      },
    });
    foldr.id = 'r';
    renderHook(() => useTocPoll(foldr, vi.fn()));

    // First poll runs for 1_500ms (< 3_000ms), so 20x = 30_000ms rest from start.
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(1);
    await vi.advanceTimersByTimeAsync(1500);
    answer();
    await vi.advanceTimersByTimeAsync(0);

    // 1_500ms elapsed since poll started -> must rest until 30_000ms total.
    await vi.advanceTimersByTimeAsync(9 * DEFAULT_TOC_POLL_MS - 1500);
    expect(polls).toBe(1);
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(2);

    // Second poll hangs for 5 minutes (300_000ms): rest is capped at MAX_TOC_POLL_REST_MS (60s),
    // which has already elapsed when the poll settles, so the very next tick polls promptly.
    await vi.advanceTimersByTimeAsync(300_000);
    expect(polls).toBe(2);
    answer();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(3);
  });

  it('caps a hung poll rest at MAX_TOC_POLL_REST_MS and ignores wall-clock jumps', async () => {
    let answer: () => void = () => {};
    let polls = 0;
    let mono = 10_000;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: () => {
        polls += 1;
        return new Promise<Response>((resolve) => {
          answer = () => resolve({ ok: true, json: async () => [] as unknown } as Response);
        });
      },
    });
    foldr.id = 'r';
    renderHook(() => useTocPoll(foldr, vi.fn(), { nowFn: () => mono }));

    // Tick 1 starts at mono=10_000; finishes 5_000ms later -> raw rest 100_000ms capped to 60_000ms.
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(1);
    mono += 5_000;
    // Simulate wall clock jumping backwards by 1 hour — monotonic clock stays unaffected.
    vi.setSystemTime(Date.now() - 3_600_000);
    answer();
    await vi.advanceTimersByTimeAsync(0);

    // At startedAt + 59_999 (mono = 69_999), still resting; at 70_000 (startedAt + 60_000), polls again!
    mono = 10_000 + MAX_TOC_POLL_REST_MS - 1;
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(1);

    mono = 10_000 + MAX_TOC_POLL_REST_MS;
    await vi.advanceTimersByTimeAsync(DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(2);
    answer();
  });

  it('keeps the poll interval when polls are answered promptly', async () => {
    let polls = 0;
    const foldr = new HackFoldr('http://x', {
      fetchImpl: async () => {
        polls += 1;
        await new Promise((resolve) => setTimeout(resolve, DEFAULT_TOC_POLL_MS / TOC_POLL_REST_FACTOR));
        return { ok: true, json: async () => [] as unknown } as Response;
      },
    });
    foldr.id = 'r';
    renderHook(() => useTocPoll(foldr, vi.fn()));

    await vi.advanceTimersByTimeAsync(4 * DEFAULT_TOC_POLL_MS);
    expect(polls).toBe(4);
  });
});