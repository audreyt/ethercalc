import { describe, expect, it, vi } from 'vite-plus/test';

import type { WhoamiState } from '../src/passkey/logic.ts';
import {
  EXPIRY_GRACE_MS,
  EXPIRY_LEAD_MS,
  MAX_CHECK_INTERVAL_MS,
  RECONNECTING_NOTICE_ATTEMPT,
  SOCKET_ROLL_MS,
  WHOAMI_RETRY_MS,
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
  let clock = 0;
  const setNow = (value: number): void => {
    clock = value;
  };
  const guard = createSessionGuard(adapter, {
    whoami,
    signIn,
    setTimeout: timers.setTimeoutFn,
    clearTimeout,
    now: () => clock,
    render: (view) => views.push(view),
  });
  return { guard, adapter, timers, views, whoami, signIn, clearTimeout, setNow };
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

  it('keeps monitoring through failed whoami calls and holds on the last known deadline', async () => {
    const failed = { enabled: false, uid: null, unavailable: true as const };
    const MINUTE = 60_000;
    const { guard, adapter, timers, setNow } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: EXPIRY_LEAD_MS + 90 * MINUTE },
      failed,
      failed,
    ]);
    await guard.refresh();
    expect(timers.pending.map((t) => t.ms)).toEqual([60 * MINUTE]);

    setNow(60 * MINUTE);
    timers.advance();
    await flush();
    expect(timers.pending.map((t) => t.ms)).toEqual([30 * MINUTE]);
    expect(adapter.hold).not.toHaveBeenCalled();

    setNow(90 * MINUTE);
    timers.advance();
    await flush();
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    expect(timers.pending.map((t) => t.ms)).toEqual([EXPIRY_LEAD_MS + EXPIRY_GRACE_MS]);
  });

  it('resumes normal monitoring when whoami recovers after a failure', async () => {
    const long = { enabled: true, uid: 'uid-1', expiresInMs: 10 * MAX_CHECK_INTERVAL_MS };
    const { guard, timers, whoami } = setup([long, { enabled: false, uid: null, unavailable: true }, long]);
    await guard.refresh();
    for (let check = 0; check < 2; check += 1) {
      timers.advance();
      await flush();
    }
    expect(whoami).toHaveBeenCalledTimes(3);
    expect(timers.pending.map((t) => t.ms)).toEqual([MAX_CHECK_INTERVAL_MS]);
  });

  it('retries a whoami that fails before any lifetime is known, then starts monitoring', async () => {
    const { guard, timers, whoami } = setup([
      { enabled: false, uid: null, unavailable: true },
      { enabled: true, uid: 'uid-1', expiresInMs: 10 * MAX_CHECK_INTERVAL_MS },
    ]);
    await guard.refresh();
    expect(timers.pending.map((t) => t.ms)).toEqual([WHOAMI_RETRY_MS]);
    timers.advance();
    await flush();
    expect(whoami).toHaveBeenCalledTimes(2);
    expect(timers.pending.map((t) => t.ms)).toEqual([MAX_CHECK_INTERVAL_MS]);
  });

  it('does not hold again after expiry while whoami keeps failing', async () => {
    const unavailable = { enabled: false, uid: null, unavailable: true as const };
    const { guard, adapter, timers, setNow } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: 60_000 },
      unavailable,
      unavailable,
    ]);
    await guard.refresh();
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    setNow(60_000 + EXPIRY_GRACE_MS);
    timers.advance();
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
    guard.onStatus({ type: 'open' });
    await flush();
    expect(timers.pending.map((t) => t.ms)).toEqual([WHOAMI_RETRY_MS]);
    timers.advance();
    await flush();
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
    expect(timers.pending.map((t) => t.ms)).toEqual([WHOAMI_RETRY_MS]);
  });

  it('stops guarding once whoami definitively reports no session', async () => {
    const { guard, adapter, timers } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: 10 * MAX_CHECK_INTERVAL_MS },
      { enabled: true, uid: null },
    ]);
    await guard.refresh();
    timers.advance();
    await flush();
    expect(timers.pending).toHaveLength(0);
    expect(adapter.hold).not.toHaveBeenCalled();
  });

  it('re-checks when the post-expiry reconnect opens, without holding again for an anonymous sheet', async () => {
    const { guard, adapter, timers, whoami } = setup([
      { enabled: true, uid: 'uid-1', expiresInMs: 0 },
      { enabled: true, uid: null },
    ]);
    await guard.refresh();
    timers.advance();
    expect(adapter.reconnectNow).toHaveBeenCalledTimes(1);
    guard.onStatus({ type: 'open' });
    await flush();
    expect(whoami).toHaveBeenCalledTimes(2);
    expect(adapter.hold).toHaveBeenCalledTimes(1);
    expect(timers.pending).toHaveLength(0);
    guard.onStatus({ type: 'open' });
    await flush();
    expect(whoami).toHaveBeenCalledTimes(2);
  });

  it('rolls the socket exactly a day after it opened, through the real scheduler', async () => {
    const long = { enabled: true, uid: 'uid-1', expiresInMs: 60 * SOCKET_ROLL_MS };
    const { guard, adapter, timers, setNow } = setup(Array.from({ length: 40 }, () => long));
    let clock = 0;
    const rolls: number[] = [];
    adapter.reconnectNow.mockImplementation(() => rolls.push(clock));
    await guard.refresh();
    clock = 100;
    setNow(clock);
    guard.onStatus({ type: 'open' });
    for (let check = 0; check < 30 && rolls.length === 0; check += 1) {
      clock += timers.pending[0]!.ms;
      setNow(clock);
      timers.advance();
      await flush();
    }
    expect(rolls).toEqual([100 + SOCKET_ROLL_MS]);

    clock += timers.pending[0]!.ms;
    setNow(clock);
    timers.advance();
    await flush();
    expect(rolls).toHaveLength(1);
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
  it('offers sign-in for both sign-in reasons and distinguishes each state', () => {
    const expiring = describeSessionGuardView({ kind: 'sign-in', reason: 'expiring', signInFailed: false });
    const signedOut = describeSessionGuardView({ kind: 'sign-in', reason: 'signed-out', signInFailed: false });
    const failed = describeSessionGuardView({ kind: 'sign-in', reason: 'signed-out', signInFailed: true });
    expect(expiring.action?.kind).toBe('sign-in');
    expect(signedOut.action?.kind).toBe('sign-in');
    expect(new Set([expiring.message, signedOut.message, failed.message]).size).toBe(3);
  });

  it('offers retry only when the adapter gave up', () => {
    expect(describeSessionGuardView({ kind: 'unreachable' }).action?.kind).toBe('retry');
    expect(describeSessionGuardView({ kind: 'reconnecting' }).action).toBeNull();
  });
});
