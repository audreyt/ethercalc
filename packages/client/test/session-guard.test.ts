import { describe, expect, it, vi } from 'vite-plus/test';

import type { WhoamiState } from '../src/passkey/logic.ts';
import {
  EXPIRY_GRACE_MS,
  EXPIRY_LEAD_MS,
  MAX_CHECK_INTERVAL_MS,
  RECONNECTING_NOTICE_ATTEMPT,
  createSessionGuard,
  describeSessionGuardView,
  type SessionGuardView,
} from '../src/session-guard.ts';
import { createFakeTimers } from './mock-ws.ts';

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

function setup(whoamiStates: WhoamiState[] = [{ enabled: true, uid: null }]) {
  const timers = createFakeTimers();
  const adapter = { hold: vi.fn(), reconnectNow: vi.fn(), queuedEditCount: 0 };
  const views: Array<SessionGuardView | null> = [];
  const whoami = vi.fn(async () => whoamiStates.shift() ?? { enabled: true, uid: null });
  const signIn = vi.fn(async () => 'uid-1');
  const clearTimeout = vi.fn(timers.clearTimeoutFn);
  const guard = createSessionGuard(adapter, {
    whoami,
    signIn,
    setTimeout: timers.setTimeoutFn,
    clearTimeout,
    render: (view) => views.push(view),
  });
  return { guard, adapter, timers, views, whoami, signIn, clearTimeout };
}

describe('session guard expiry hold', () => {
  it('schedules nothing for anonymous visitors or sessions without a lifetime', async () => {
    const { guard, adapter, timers, views } = setup([
      { enabled: true, uid: null },
      { enabled: true, uid: 'uid-1' },
    ]);
    await guard.refresh();
    await guard.refresh();
    expect(timers.pending).toHaveLength(0);
    expect(adapter.hold).not.toHaveBeenCalled();
    expect(views).toEqual([]);
  });

  it('re-checks at most hourly, then holds edits and prompts before the session ends', async () => {
    const { guard, adapter, timers, views, whoami } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: 30 * 24 * 60 * 60 * 1000 },
      { enabled: true, uid: 'uid-1', expiresInMs: EXPIRY_LEAD_MS + 1_000 },
      { enabled: true, uid: 'uid-1', expiresInMs: 60_000 },
    ]);
    await guard.refresh();
    expect(timers.pending.map((t) => t.ms)).toEqual([MAX_CHECK_INTERVAL_MS]);

    timers.advance();
    await flush();
    expect(whoami).toHaveBeenCalledTimes(2);
    expect(timers.pending.map((t) => t.ms)).toEqual([1_000]);
    expect(adapter.hold).not.toHaveBeenCalled();

    timers.advance();
    await flush();
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'expiring', signInFailed: false });
    expect(timers.pending.map((t) => t.ms)).toEqual([60_000 + EXPIRY_GRACE_MS]);

    expect(adapter.reconnectNow).not.toHaveBeenCalled();
    timers.advance();
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
    expect(timers.pending).toHaveLength(0);

    guard.onStatus({ type: 'open' });
    expect(views.at(-1)).toBeNull();
  });

  it('holds immediately when the session is already inside the lead window', async () => {
    const { guard, adapter, timers } = setup([{ enabled: true, uid: 'uid-1', expiresInMs: 0 }]);
    await guard.refresh();
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    expect(timers.pending.map((t) => t.ms)).toEqual([EXPIRY_GRACE_MS]);
  });

  it('replaces a scheduled check instead of stacking timers', async () => {
    const long = { enabled: true, uid: 'uid-1', expiresInMs: 10 * MAX_CHECK_INTERVAL_MS };
    const { guard, timers, clearTimeout } = setup([long, long]);
    await guard.refresh();
    await guard.refresh();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(timers.pending).toHaveLength(1);
  });

  it('keeps the signed-out reason when the expiry hold fires afterwards', async () => {
    const { guard, views } = setup([{ enabled: true, uid: 'uid-1', expiresInMs: 0 }]);
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    await guard.refresh();
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
  });
});

describe('session guard status handling', () => {
  it('treats only 1008 session closes as signed-out', () => {
    const { guard, views } = setup();
    guard.onStatus({ type: 'close', code: 1006, reason: 'Session expired' });
    guard.onStatus({ type: 'close', code: 1008, reason: 'Message rate exceeded' });
    guard.onStatus({ type: 'close', code: 1008 });
    guard.onStatus({ type: 'error' });
    expect(views).toEqual([]);

    guard.onStatus({ type: 'close', code: 1008, reason: 'Session invalid' });
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
    guard.onStatus({ type: 'open' });
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
  });

  it('shows a dropped connection only after a few attempts, then a give-up', () => {
    const { guard, views } = setup();
    for (let attempt = 1; attempt < RECONNECTING_NOTICE_ATTEMPT; attempt += 1) {
      guard.onStatus({ type: 'reconnecting', attempt });
    }
    expect(views).toEqual([]);
    guard.onStatus({ type: 'reconnecting', attempt: RECONNECTING_NOTICE_ATTEMPT });
    expect(views.at(-1)).toEqual({ kind: 'reconnecting' });
    guard.onStatus({ type: 'reconnect_failed' });
    expect(views.at(-1)).toEqual({ kind: 'unreachable' });
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    expect(views.at(-1)).toMatchObject({ kind: 'sign-in' });
  });

  it('retry clears the unreachable notice and reconnects', () => {
    const { guard, adapter, views } = setup();
    guard.onStatus({ type: 'reconnecting', attempt: RECONNECTING_NOTICE_ATTEMPT });
    guard.onStatus({ type: 'reconnect_failed' });
    guard.retry();
    expect(views.at(-1)).toBeNull();
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
  });

  it('warns on unload exactly while sheet edits are queued', () => {
    const { guard, adapter } = setup();
    expect(guard.shouldWarnOnUnload()).toBe(false);
    adapter.queuedEditCount = 2;
    expect(guard.shouldWarnOnUnload()).toBe(true);
  });
});

describe('session guard sign-in', () => {
  it('reconnects and reschedules after a successful sign-in', async () => {
    const { guard, adapter, timers, signIn, whoami } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: 10 * MAX_CHECK_INTERVAL_MS },
    ]);
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    await guard.signIn();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
    expect(whoami).toHaveBeenCalledTimes(1);
    expect(timers.pending.map((t) => t.ms)).toEqual([MAX_CHECK_INTERVAL_MS]);
  });

  it('keeps the prompt and flags a failed sign-in until one succeeds', async () => {
    const { guard, adapter, signIn, views } = setup();
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    signIn.mockRejectedValueOnce(new Error('cancelled'));
    await guard.signIn();
    expect(adapter.reconnectNow).not.toHaveBeenCalled();
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'signed-out', signInFailed: true });

    await guard.signIn();
    guard.onStatus({ type: 'close', code: 1008, reason: 'Session expired' });
    expect(views.at(-1)).toEqual({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
  });
});

describe('describeSessionGuardView', () => {
  it('offers sign-in for both sign-in reasons and mentions a failed attempt', () => {
    const expiring = describeSessionGuardView({ kind: 'sign-in', reason: 'expiring', signInFailed: false });
    const signedOut = describeSessionGuardView({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
    const failed = describeSessionGuardView({ kind: 'sign-in', reason: 'signed-out', signInFailed: true });
    expect(expiring.action).toEqual({ kind: 'sign-in', label: 'Sign in again' });
    expect(signedOut.action).toEqual({ kind: 'sign-in', label: 'Sign in again' });
    expect(expiring.message).not.toBe(signedOut.message);
    expect(failed.message.startsWith(signedOut.message)).toBe(true);
    expect(failed.message.length).toBeGreaterThan(signedOut.message.length);
  });

  it('offers retry only when the adapter gave up', () => {
    expect(describeSessionGuardView({ kind: 'unreachable' }).action).toEqual({
      kind: 'retry',
      label: 'Retry',
    });
    expect(describeSessionGuardView({ kind: 'reconnecting' }).action).toBeNull();
  });
});
