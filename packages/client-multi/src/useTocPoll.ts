/**
 * Poll `GET /_/:room/csv.json` while a multi-sheet room is open so peer tab
 * add/rename/delete updates appear without a full reload.
 *
 * Chose polling over native WS: the multi-sheet shell does not own a socket
 * (each iframe runs its own single-sheet client). Polling the existing export
 * endpoint is minimal, stateless, and matches the legacy multi behavior.
 */

import { useEffect } from 'react';
import type { HackFoldr } from './Foldr.ts';

/** Default interval between TOC polls (ms). */
export const DEFAULT_TOC_POLL_MS = 3000;

/**
 * After a poll settles, wait at least this multiple of its elapsed duration
 * before starting the next poll, capped at `MAX_TOC_POLL_REST_MS`, so one
 * tab cannot saturate the server even when `csv.json` exports are expensive.
 */
export const TOC_POLL_REST_FACTOR = 20;
export const MAX_TOC_POLL_REST_MS = 60_000;

export type IntervalHandle = ReturnType<typeof setInterval> | number;

export interface TocPollOptions {
  readonly intervalMs?: number;
  /** Test seam — defaults to global `setInterval`. */
  readonly setIntervalFn?: (handler: () => void, timeout?: number) => IntervalHandle;
  readonly clearIntervalFn?: (id: IntervalHandle) => void;
  /** Monotonic clock in ms — defaults to `performance.now()`. */
  readonly nowFn?: () => number;
}

/**
 * Periodically calls `foldr.refreshToc()` and invokes `onChange` when the
 * server TOC differs from the in-memory copy. At most one poll is open at a
 * time, and slow polls are spaced out by `TOC_POLL_REST_FACTOR` up to
 * `MAX_TOC_POLL_REST_MS` using a monotonic clock.
 */
export function useTocPoll(
  foldr: HackFoldr,
  onChange: () => void,
  options: TocPollOptions = {},
): void {
  const intervalMs = options.intervalMs ?? DEFAULT_TOC_POLL_MS;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;
  const nowFn = options.nowFn;

  useEffect(() => {
    let cancelled = false;
    let polling = false;
    let nextAllowedAt = Number.NEGATIVE_INFINITY;
    const now = nowFn ?? (() => performance.now());

    // `setInterval` does not wait for the poll it starts: skip ticks while one
    // is unanswered, and while resting after a slow one.
    const tick = async (): Promise<void> => {
      const startedAt = now();
      if (cancelled || polling || startedAt < nextAllowedAt) return;
      polling = true;
      let changed = false;
      try {
        changed = await foldr.refreshToc();
      } finally {
        polling = false;
        const elapsed = Math.max(0, now() - startedAt);
        const rest = Math.min(elapsed * TOC_POLL_REST_FACTOR, MAX_TOC_POLL_REST_MS);
        nextAllowedAt = Math.max(nextAllowedAt, startedAt + rest);
      }
      if (changed && !cancelled) onChange();
    };

    const handle = setIntervalFn(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      clearIntervalFn(handle);
    };
  }, [foldr, onChange, intervalMs, setIntervalFn, clearIntervalFn, nowFn]);
}