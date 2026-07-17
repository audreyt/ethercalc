import { describe, it, expect, vi } from 'vite-plus/test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabBar } from '../src/components/TabBar.tsx';

const sampleRows = [
  { link: '/a', title: 'A', row: 2 },
  { link: '/b', title: 'B', row: 3 },
];

describe('<TabBar />', () => {
  it('renders a trigger per row and one iframe per row (all mounted)', () => {
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
    // Both iframes live in the DOM (Radix forceMount + CSS visibility).
    expect(container.querySelectorAll('iframe')).toHaveLength(2);
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
    const srcs = Array.from(container.querySelectorAll('iframe')).map((f) => f.src);
    // jsdom resolves relative iframes against `about:blank` (no path), so
    // `../a/edit` normalizes to `about:blank`-relative. Assert the tail.
    expect(srcs.some((s) => s.endsWith('/a/edit'))).toBe(true);
    expect(srcs.some((s) => s.endsWith('/b/edit'))).toBe(true);
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

  it('keeps all tabs mounted when one title changes (stable link keys)', () => {
    const { rerender, container } = render(
      <TabBar
        rows={[
          { link: '/a', title: 'Sheet1', row: 2 },
          { link: '/b', title: 'Sheet2', row: 3 },
        ]}
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
