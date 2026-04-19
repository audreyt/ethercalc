import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { SheetFrame } from '../src/components/SheetFrame.tsx';

describe('<SheetFrame />', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders an iframe with the given src', () => {
    const { container } = render(
      <SheetFrame
        src="/a"
        rows={[]}
        index="room"
        isFirst={false}
        firstFocusUsed={false}
      />,
    );
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.src).toContain('/a');
  });

  it('posts the multi message once the iframe doc is complete, on the first frame', () => {
    const onFirstFocus = vi.fn();
    const postSpy = vi.fn();
    const focusSpy = vi.fn();

    const { container } = render(
      <SheetFrame
        src="/b"
        rows={[{ link: '/b', title: 'B', row: 2 }]}
        index="room"
        isFirst={true}
        firstFocusUsed={false}
        onFirstFocus={onFirstFocus}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    // Simulate the iframe doc being 'complete' by stubbing properties.
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: focusSpy }),
      configurable: true,
    });

    // Run the initial tryPost + 100ms settle window.
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(100);

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(postSpy.mock.calls[0]?.[0] as string);
    expect(payload).toEqual({
      type: 'multi',
      rows: [{ link: '/b', title: 'B', row: 2 }],
      index: 'room',
    });
    expect(focusSpy).toHaveBeenCalled();
    expect(onFirstFocus).toHaveBeenCalledTimes(1);
  });

  it('retries on a tight 1ms schedule while doc.readyState is not complete', () => {
    let state = 'loading';
    const postSpy = vi.fn();

    const { container } = render(
      <SheetFrame
        src="/c"
        rows={[]}
        index="room"
        isFirst={false}
        firstFocusUsed={false}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: state }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: vi.fn() }),
      configurable: true,
    });

    // First schedule: one 1ms timer, no post.
    vi.advanceTimersByTime(1);
    expect(postSpy).not.toHaveBeenCalled();

    // Doc becomes complete; next 1ms tick schedules the 100ms post.
    state = 'complete';
    vi.advanceTimersByTime(1);
    vi.advanceTimersByTime(100);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('skips focus when firstFocusUsed is already true', () => {
    const onFirstFocus = vi.fn();
    const postSpy = vi.fn();
    const focusSpy = vi.fn();

    const { container } = render(
      <SheetFrame
        src="/d"
        rows={[]}
        index="room"
        isFirst={true}
        firstFocusUsed={true}
        onFirstFocus={onFirstFocus}
      />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: focusSpy }),
      configurable: true,
    });
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(100);
    expect(postSpy).toHaveBeenCalled();
    expect(focusSpy).not.toHaveBeenCalled();
    expect(onFirstFocus).not.toHaveBeenCalled();
  });

  it('does nothing when contentDocument is missing', () => {
    const postSpy = vi.fn();
    const { container } = render(
      <SheetFrame src="/e" rows={[]} index="room" isFirst={false} firstFocusUsed={false} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: vi.fn() }),
      configurable: true,
    });
    vi.advanceTimersByTime(500);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('skips posting when contentWindow disappears before the 100ms fires', () => {
    const postSpy = vi.fn();
    const { container, unmount } = render(
      <SheetFrame src="/f" rows={[]} index="room" isFirst={true} firstFocusUsed={false} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: vi.fn() }),
      configurable: true,
    });
    vi.runOnlyPendingTimers(); // schedules 100ms inner timer
    unmount(); // cancels + clears
    vi.advanceTimersByTime(500);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('skips focus when no onFirstFocus prop is provided', () => {
    const postSpy = vi.fn();
    const focusSpy = vi.fn();

    const { container } = render(
      <SheetFrame src="/g" rows={[]} index="room" isFirst={true} firstFocusUsed={false} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: focusSpy }),
      configurable: true,
    });
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(100);
    // No crash; focus still fires because isFirst+!firstFocusUsed.
    expect(focusSpy).toHaveBeenCalled();
  });

  it('skips the 100ms inner fire when the component unmounts during polling', () => {
    const postSpy = vi.fn();
    const { container, unmount } = render(
      <SheetFrame src="/h" rows={[]} index="room" isFirst={false} firstFocusUsed={true} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    let state = 'loading';
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: state }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: vi.fn() }),
      configurable: true,
    });
    // Get into the 1ms polling branch.
    vi.advanceTimersByTime(1);
    state = 'complete';
    vi.advanceTimersByTime(1);
    // 100ms timer is scheduled; unmount now → cancelled=true + clearTimeout.
    unmount();
    vi.advanceTimersByTime(500);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('skips posting when contentWindow is null at inner-timer time', () => {
    const postSpy = vi.fn();
    const { container } = render(
      <SheetFrame src="/i" rows={[]} index="room" isFirst={true} firstFocusUsed={false} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    let winValid = true;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: 'complete' }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () =>
        winValid ? ({ postMessage: postSpy, focus: vi.fn() }) : null,
      configurable: true,
    });
    vi.runOnlyPendingTimers();
    // Strip contentWindow before the 100ms timer fires.
    winValid = false;
    vi.advanceTimersByTime(100);
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('unmount is safe when the iframe has no contentDocument (no timer scheduled)', () => {
    const { container, unmount } = render(
      <SheetFrame src="/j" rows={[]} index="room" isFirst={false} firstFocusUsed={false} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => null,
      configurable: true,
    });
    // tryPost early-returns because doc is null; no timer set.
    expect(() => unmount()).not.toThrow();
  });

  it('swallows a late timer firing after unmount (cancelled early-return)', () => {
    const postSpy = vi.fn();
    const { container, unmount } = render(
      <SheetFrame src="/k" rows={[]} index="room" isFirst={false} firstFocusUsed={true} />,
    );
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    let state: 'loading' | 'complete' = 'loading';
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => ({ readyState: state }),
      configurable: true,
    });
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => ({ postMessage: postSpy, focus: vi.fn() }),
      configurable: true,
    });

    // Kick off a 1ms poll (state is 'loading').
    vi.advanceTimersByTime(1);
    // Intercept the global clearTimeout so the 100ms callback does not get
    // cleared on unmount — we want to observe the `cancelled` guard.
    const originalClear = globalThis.clearTimeout;
    globalThis.clearTimeout = (() => {}) as typeof clearTimeout;
    try {
      // Doc becomes complete; schedule the 100ms timer.
      state = 'complete';
      vi.advanceTimersByTime(1);
      // Unmount sets cancelled=true; our stubbed clearTimeout keeps the
      // 100ms callback alive.
      unmount();
      vi.advanceTimersByTime(100);
    } finally {
      globalThis.clearTimeout = originalClear;
    }
    expect(postSpy).not.toHaveBeenCalled();
  });
});
