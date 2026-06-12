import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { HackFoldr } from '../src/Foldr.ts';
import { DEFAULT_TOC_POLL_MS, useTocPoll } from '../src/useTocPoll.ts';

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
});