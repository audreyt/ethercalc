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

export type IntervalHandle = ReturnType<typeof setInterval>;

export interface TocPollOptions {
  readonly intervalMs?: number;
  /** Test seam — defaults to global `setInterval`. */
  readonly setIntervalFn?: (handler: () => void, timeout?: number) => IntervalHandle;
  readonly clearIntervalFn?: (id: IntervalHandle) => void;
}

/**
 * Periodically calls `foldr.refreshToc()` and invokes `onChange` when the
 * server TOC differs from the in-memory copy.
 */
export function useTocPoll(
  foldr: HackFoldr,
  onChange: () => void,
  options: TocPollOptions = {},
): void {
  const intervalMs = options.intervalMs ?? DEFAULT_TOC_POLL_MS;
  const setIntervalFn = options.setIntervalFn ?? setInterval;
  const clearIntervalFn = options.clearIntervalFn ?? clearInterval;

  useEffect(() => {
    let cancelled = false;

    const tick = async (): Promise<void> => {
      if (cancelled) return;
      const changed = await foldr.refreshToc();
      if (changed && !cancelled) onChange();
    };

    const handle = setIntervalFn(() => void tick(), intervalMs);
    return () => {
      cancelled = true;
      clearIntervalFn(handle);
    };
  }, [foldr, onChange, intervalMs, setIntervalFn, clearIntervalFn]);
}