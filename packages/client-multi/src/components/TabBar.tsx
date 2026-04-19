import { type FC } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import type { FoldrRow } from '../Foldr.ts';
import { SheetFrame } from './SheetFrame.tsx';
import styles from '../styles.module.css';

export interface TabBarProps {
  readonly rows: readonly FoldrRow[];
  readonly activeIndex: number;
  readonly basePath: string;
  readonly suffix: string;
  readonly index: string;
  readonly onChange: (idx: number) => void;
  readonly firstFocusUsed: boolean;
  readonly onFirstFocus: () => void;
}

/**
 * Renders a Radix Tabs.Root with one tab per TOC row, plus one TabsContent
 * (iframe) per row. `activeIndex` drives `value`; clicking a trigger bubbles
 * back through `onChange(nextIndex)`.
 *
 * The iframe-per-tab rendering mirrors the legacy `Nav`/`Frame` component
 * split: every tab's frame is kept mounted (Radix TabsContent has
 * `forceMount` for this so the iframe state survives tab switches), and
 * `visibility: hidden` in CSS hides non-active ones.
 */
export const TabBar: FC<TabBarProps> = ({
  rows,
  activeIndex,
  basePath,
  suffix,
  index,
  onChange,
  firstFocusUsed,
  onFirstFocus,
}) => {
  const clampedIndex = Math.max(0, Math.min(activeIndex, rows.length - 1));
  const activeValue = `tab-${clampedIndex}`;

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
              key={title}
              value={value}
              className={styles['tabTitle']}
              aria-label={title}
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
        const src = `${basePath}${link}${suffix}`;
        return (
          <Tabs.Content
            key={title}
            value={value}
            forceMount
            className={`${styles['tabItem']} ${styles['wrapper']}`}
            data-state={i === clampedIndex ? 'active' : 'inactive'}
          >
            <SheetFrame
              src={src}
              rows={rows}
              index={index}
              isFirst={i === 0}
              firstFocusUsed={firstFocusUsed}
              onFirstFocus={onFirstFocus}
            />
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
};
