import { useRef, type FC } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import type { FoldrRow } from '../Foldr.ts';
import { withAuthQuery } from '../url.ts';
import { SheetFrame } from './SheetFrame.tsx';
import styles from '../styles.module.css';

export interface TabBarProps {
  readonly rows: readonly FoldrRow[];
  readonly activeIndex: number;
  /** Bumped whenever `rows` mutates in-place — keeps iframe postMessage in sync. */
  readonly rowsRev: number;
  readonly basePath: string;
  readonly suffix: string;
  readonly index: string;
  readonly auth?: string | null;
  readonly onChange: (idx: number) => void;
  readonly onRename?: ((idx: number) => void) | undefined;
  readonly firstFocusUsed: boolean;
  readonly onFirstFocus: () => void;
}

/**
 * How many sheets keep a running editor at once: the visible one and the
 * most recently shown before it. Each frame is a complete single-sheet
 * client (its own document, grid and WebSocket), while the rows are text
 * that every writer of the workbook controls, so the number of frames must
 * not follow the number of rows.
 */
export const MAX_MOUNTED_SHEETS = 8;

/**
 * Renders a Radix Tabs.Root with one tab per TOC row, plus one TabsContent
 * per row. `activeIndex` drives `value`; clicking a trigger bubbles back
 * through `onChange(nextIndex)`.
 *
 * The iframe-per-tab rendering mirrors the legacy `Nav`/`Frame` component
 * split, except that a row gets its frame only once its tab is shown. From
 * then on the frame is kept mounted (Radix TabsContent has `forceMount` for
 * this so the iframe state survives tab switches) while it is among the
 * `MAX_MOUNTED_SHEETS` most recently shown, and `visibility: hidden` in CSS
 * hides non-active ones.
 */
export const TabBar: FC<TabBarProps> = ({
  rows,
  activeIndex,
  rowsRev,
  basePath,
  suffix,
  index,
  auth,
  onChange,
  onRename,
  firstFocusUsed,
  onFirstFocus,
}) => {
  const clampedIndex = Math.max(0, Math.min(activeIndex, rows.length - 1));
  const activeValue = `tab-${clampedIndex}`;

  // Links of the rows that have a frame, most recently shown first. Rows that
  // left the TOC drop out; `shown` is empty only when there are no rows.
  // Updating it here is idempotent, so a repeated render (StrictMode) is safe.
  const mounted = useRef<readonly string[]>([]);
  const links = rows.map((row) => row.link);
  const shown = links.slice(clampedIndex, clampedIndex + 1);
  mounted.current = [
    ...shown,
    ...mounted.current.filter((link) => links.includes(link) && !shown.includes(link)),
  ].slice(0, MAX_MOUNTED_SHEETS);

  return (
    <Tabs.Root
      value={activeValue}
      onValueChange={(v) => onChange(parseInt(v.replace(/^tab-/, ''), 10))}
      orientation="horizontal"
      activationMode="manual"
    >
      <Tabs.List className={styles['tabList']}>
        {rows.map((row, i) => {
          const title = row.title;
          const value = `tab-${i}`;
          return (
            <Tabs.Trigger
              key={row.link}
              value={value}
              className={styles['tabTitle']}
              aria-label={title}
              onDoubleClick={() => {
                onChange(i);
                onRename?.(i);
              }}
            >
              <span className={styles['tabTitleButton']}>{title}</span>
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
        {rows.map((row, i) => {
        const title = row.title;
        const value = `tab-${i}`;
        const link = row.link || `/${encodeURIComponent(title)}`;
        const src = withAuthQuery(`${basePath}${link}${suffix}`, auth);
        return (
          <Tabs.Content
            key={row.link}
            value={value}
            forceMount
            className={`${styles['tabItem']} ${styles['wrapper']}`}
            data-state={i === clampedIndex ? 'active' : 'inactive'}
          >
            {mounted.current.includes(row.link) ? (
              <SheetFrame
                src={src}
                rows={rows}
                rowsRev={rowsRev}
                index={index}
                isFirst={i === 0}
                firstFocusUsed={firstFocusUsed}
                onFirstFocus={onFirstFocus}
              />
            ) : null}
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
};
