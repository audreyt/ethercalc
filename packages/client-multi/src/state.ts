/**
 * App-state reducer for the multi-sheet client.
 *
 * Chose plain `useReducer` over Zustand: our state is a single small record
 * (one active index + the Foldr's row list), and the reducer is trivial.
 * Adding Zustand would impose a runtime dependency + provider wiring for no
 * test-ergonomics win. See `FINDINGS.md` for the full rationale.
 */

import type { HackFoldr, FoldrRow } from './Foldr.ts';

export interface AppState {
  readonly foldr: HackFoldr;
  /** Index of the active tab; clamped at render time to foldr.lastIndex. */
  readonly activeIndex: number;
  /**
   * Monotonically incremented whenever `foldr` mutates in-place. React can't
   * see mutation, so components subscribe to this to force re-render.
   */
  readonly rev: number;
}

export type AppAction =
  | { type: 'setActive'; index: number }
  | { type: 'bumpRev' }
  | { type: 'bumpRev+setActive'; index: number };

export function createInitialState(foldr: HackFoldr): AppState {
  return { foldr, activeIndex: 0, rev: 0 };
}

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'setActive':
      return { ...state, activeIndex: action.index };
    case 'bumpRev':
      return { ...state, rev: state.rev + 1 };
    case 'bumpRev+setActive':
      return { ...state, rev: state.rev + 1, activeIndex: action.index };
  }
}

/**
 * Compute the next sheet's `{prefix, n, linkPrefix}` given the foldr's
 * current rows. Mirrors the legacy `on-add` logic.
 *
 *   prefix     — default "Sheet"; if the last row's title is `([_a-zA-Z]+)(\d+)`,
 *                the captured word becomes the prefix and the digit the
 *                starting number.
 *   linkPrefix — default `/{Index}.`; if the last row's link matches
 *                `^(\/[^=]+\.|\/sheet(?=\d))`, that match becomes the link
 *                prefix.
 *   n          — the first integer starting at `(next or 1)` that produces a
 *                `prefix+n` title and a `linkPrefix+n` link not already in
 *                the row list.
 */
export function computeNextRow(foldr: HackFoldr, index: string): FoldrRow {
  let prefix = 'Sheet';
  let nextSheet = foldr.size() + 1;
  let linkPrefix = `/${index}.`;

  const last = foldr.lastRow();
  const lastTitle = last.title ?? '';
  const lastLink = last.link ?? '';
  const titleMatch = /^([_a-zA-Z]+)(\d+)$/.exec(lastTitle);
  if (titleMatch && titleMatch[1] !== undefined && titleMatch[2] !== undefined) {
    prefix = titleMatch[1];
    nextSheet = parseInt(titleMatch[2], 10);
  }
  const linkMatch = /^(\/[^=]+\.|\/sheet(?=\d))/.exec(lastLink);
  if (linkMatch && linkMatch[1] !== undefined) {
    linkPrefix = linkMatch[1];
  }

  const titles = foldr.titles();
  const links = foldr.links();
  while (
    titles.includes(`${prefix}${nextSheet}`) ||
    links.includes(`${linkPrefix}${nextSheet}`)
  ) {
    nextSheet += 1;
  }
  return {
    link: `${linkPrefix}${nextSheet}`,
    title: `${prefix}${nextSheet}`,
    row: 0, // filled in by Foldr.push from the server response.
  };
}

/**
 * True when `candidate` (case-insensitive) is already among `titles`.
 * Mirrors the legacy duplicate-check in `on-rename`.
 */
export function titleTaken(titles: readonly string[], candidate: string): boolean {
  const lc = candidate.toLowerCase();
  return titles.some((t) => t.toLowerCase() === lc);
}
