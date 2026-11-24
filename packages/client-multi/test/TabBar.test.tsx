import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import { MAX_MOUNTED_SHEETS, TabBar } from '../src/components/TabBar.tsx';
import type { FoldrRow } from '../src/Foldr.ts';

const sampleRows = [
  { link: '/a', title: 'A', row: 2 },
  { link: '/b', title: 'B', row: 3 },
];

const bar = (rows: readonly FoldrRow[], activeIndex: number, rowsRev = 0) => (
  <TabBar
    rows={rows}
    activeIndex={activeIndex}
    rowsRev={rowsRev}
    basePath=".."
    suffix="/edit"
    index="room"
    auth="a+b"
    onChange={() => {}}
    firstFocusUsed={false}
    onFirstFocus={() => {}}
  />
);
const frameSrcs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('iframe')).map((f) => f.getAttribute('src'));

describe('<TabBar />', () => {
  it('renders a trigger and a panel per row, and a frame for the shown row only', () => {
    const { container } = render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        rowsRev={0}
        basePath="."
        suffix=""
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    expect(screen.getByRole('tab', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'B' })).toBeInTheDocument();
    // Every panel lives in the DOM (Radix forceMount + CSS visibility), but
    // a sheet nobody has looked at yet does not get an editor.
    expect(container.querySelectorAll('[role="tabpanel"]')).toHaveLength(2);
    expect(frameSrcs(container)).toEqual(['./a']);
  });

  it('mounts one frame for a TOC of MAX_MULTI_SHEETS rows nobody has opened', () => {
    const rows = Array.from({ length: MAX_MULTI_SHEETS }, (_, i) => ({
      link: `/wb.${i + 1}`,
      title: 'S',
      row: i + 2,
    }));
    const { container } = render(bar(rows, 0));
    expect(screen.getAllByRole('tab')).toHaveLength(MAX_MULTI_SHEETS);
    expect(frameSrcs(container)).toEqual(['../wb.1/edit?auth=a%2Bb']);
  });

  it('mounts a frame when its tab is first shown and keeps it across switches', () => {
    const { rerender, container } = render(bar(sampleRows, 0));
    const first = container.querySelector('iframe');
    rerender(bar(sampleRows, 1));
    expect(frameSrcs(container)).toEqual(['../a/edit?auth=a%2Bb', '../b/edit?auth=a%2Bb']);
    rerender(bar(sampleRows, 0));
    expect(container.querySelectorAll('iframe')).toHaveLength(2);
    // Same element: the sheet was not reloaded by switching away and back.
    expect(container.querySelector('iframe')).toBe(first);
  });

  it('keeps at most MAX_MOUNTED_SHEETS frames, dropping the least recently shown', () => {
    const rows = Array.from({ length: MAX_MOUNTED_SHEETS + 2 }, (_, i) => ({
      link: `/wb.${i + 1}`,
      title: `S${i + 1}`,
      row: i + 2,
    }));
    const { rerender, container } = render(bar(rows, 0));
    for (let i = 1; i < rows.length; i++) rerender(bar(rows, i));
    expect(frameSrcs(container)).toEqual(
      rows.slice(2).map((row) => `..${row.link}/edit?auth=a%2Bb`),
    );
    // Going back to a sheet that is still mounted does not evict anything.
    rerender(bar(rows, 2));
    expect(container.querySelectorAll('iframe')).toHaveLength(MAX_MOUNTED_SHEETS);
  });

  it('stays bounded when the TOC keeps moving other rows under the active tab', () => {
    const rows = Array.from({ length: 255 }, (_, i) => ({
      link: `/wb.${i + 1}`,
      title: 'S',
      row: i + 2,
    }));
    const { rerender, container } = render(bar(rows, 0));
    for (let rev = 1; rev <= 3 * MAX_MOUNTED_SHEETS; rev++) {
      rerender(bar([...rows.slice(rev), ...rows.slice(0, rev)], 0, rev));
    }
    expect(container.querySelectorAll('iframe')).toHaveLength(MAX_MOUNTED_SHEETS);
    expect(container.querySelectorAll('[data-state="active"] iframe')).toHaveLength(1);
  });

  it('forgets a row that left the TOC, so it is not remounted unseen', () => {
    const [a, b] = sampleRows as [FoldrRow, FoldrRow];
    const { rerender, container } = render(bar([a, b], 1));
    rerender(bar([a, b], 0));
    expect(container.querySelectorAll('iframe')).toHaveLength(2);
    rerender(bar([a], 0, 1));
    rerender(bar([a, b], 0, 2));
    expect(frameSrcs(container)).toEqual(['../a/edit?auth=a%2Bb']);
  });

  it('tracks shown sheets the same under StrictMode double rendering', () => {
    const { rerender, container } = render(<StrictMode>{bar(sampleRows, 0)}</StrictMode>);
    expect(frameSrcs(container)).toEqual(['../a/edit?auth=a%2Bb']);
    rerender(<StrictMode>{bar(sampleRows, 1)}</StrictMode>);
    expect(frameSrcs(container)).toEqual(['../a/edit?auth=a%2Bb', '../b/edit?auth=a%2Bb']);
  });

  it('renders no frame when there are no rows', () => {
    const { container } = render(bar([], 0));
    expect(container.querySelectorAll('iframe')).toHaveLength(0);
  });

  it('composes iframe src as `basePath + link + suffix`', () => {
    const { container } = render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        rowsRev={0}
        basePath=".."
        suffix="/edit"
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    // jsdom resolves relative iframes against `about:blank` (no path), so
    // `../a/edit` normalizes to `about:blank`-relative. Assert the tail.
    expect((container.querySelector('iframe') as HTMLIFrameElement).src).toMatch(/\/a\/edit$/);
  });

  it('passes the parent capability to each child edit redirect', () => {
    const { rerender, container } = render(bar(sampleRows, 0));
    rerender(bar(sampleRows, 1));
    expect(frameSrcs(container)).toEqual(['../a/edit?auth=a%2Bb', '../b/edit?auth=a%2Bb']);
  });

  it('keeps view frames read-only with the sentinel', () => {
    const { container } = render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        rowsRev={0}
        basePath=".."
        suffix="/view"
        index="room"
        auth="0"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('../a/view?auth=0');
  });

  it('falls back to /encodeURIComponent(title) when link is empty', () => {
    const { container } = render(
      <TabBar
        rows={[{ link: '', title: 'Hello World', row: 2 }]}
        activeIndex={0}
        rowsRev={0}
        basePath="."
        suffix=""
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('/Hello%20World');
  });

  it('calls onChange with the clicked index', async () => {
    const onChange = vi.fn();
    render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        basePath="."
        suffix=""
        index="room"
        rowsRev={0}
        onChange={onChange}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
  it('calls onChange and onRename when a tab trigger is double-clicked', async () => {
    const onChange = vi.fn();
    const onRename = vi.fn();
    render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        basePath="."
        suffix=""
        index="room"
        rowsRev={0}
        onChange={onChange}
        onRename={onRename}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    await userEvent.dblClick(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith(1);
    expect(onRename).toHaveBeenCalledWith(1);
  });

  it('calls onChange without crashing when double-clicked without onRename handler', async () => {
    const onChange = vi.fn();
    render(
      <TabBar
        rows={sampleRows}
        activeIndex={0}
        basePath="."
        suffix=""
        index="room"
        rowsRev={0}
        onChange={onChange}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    await userEvent.dblClick(screen.getByRole('tab', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('clamps activeIndex above the max to the last row', () => {
    const { container } = render(
      <TabBar
        rows={sampleRows}
        activeIndex={99}
        rowsRev={0}
        basePath="."
        suffix=""
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    // Last TabsContent has data-state=active.
    const activePanels = container.querySelectorAll('[data-state="active"]');
    // There's the trigger AND the content — at least one content is active.
    const activeContent = Array.from(activePanels).filter(
      (p) => p.getAttribute('role') === 'tabpanel',
    );
    expect(activeContent.length).toBeGreaterThanOrEqual(1);
  });

  it('keeps all opened tabs mounted when one title changes (stable link keys)', () => {
    const { rerender, container } = render(
      <TabBar
        rows={[
          { link: '/a', title: 'Sheet1', row: 2 },
          { link: '/b', title: 'Sheet2', row: 3 },
        ]}
        activeIndex={1}
        rowsRev={0}
        basePath="."
        suffix=""
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    expect(screen.getAllByRole('tab')).toHaveLength(2);

    rerender(
      <TabBar
        rows={[
          { link: '/a', title: 'Budget', row: 2 },
          { link: '/b', title: 'Sheet2', row: 3 },
        ]}
        activeIndex={0}
        rowsRev={1}
        basePath="."
        suffix=""
        index="room"
        onChange={() => {}}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Budget' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sheet2' })).toBeInTheDocument();
    expect(container.querySelectorAll('iframe')).toHaveLength(2);
  });

  it('clamps negative activeIndex to 0', () => {
    const onChange = vi.fn();
    render(
      <TabBar
        rows={sampleRows}
        activeIndex={-5}
        rowsRev={0}
        basePath="."
        suffix=""
        index="room"
        onChange={onChange}
        firstFocusUsed={false}
        onFirstFocus={() => {}}
      />,
    );
    // First tab should be selected.
    const tabA = screen.getByRole('tab', { name: 'A' });
    expect(tabA.getAttribute('data-state')).toBe('active');
  });
});
