/**
 * Session guard — keeps sheet edits from being lost silently when the
 * WebSocket can no longer deliver them.
 *
 * The RoomDO closes a signed-in socket with 1008 "Session expired" or
 * "Session invalid" and discards the frame that triggered the check, and
 * the server never acknowledges `execute` back to its sender. Without a
 * guard the adapter kept retrying a socket the server refuses, queued every
 * later edit in memory, and showed nothing, so a reload lost all of them.
 *
 * The guard therefore:
 *   1. Reads the session's remaining lifetime from `/_auth/whoami` and holds
 *      outbound frames shortly before it ends, asking the user to sign in
 *      again; a successful sign-in reconnects and flushes the held edits.
 *   2. Treats a session close as signed-out (the backstop for revocation or
 *      a missed deadline) and says the most recent edit may be gone.
 *   3. Surfaces a lost connection and a reconnect give-up, and lets the page
 *      warn before unload while edits are still queued.
 *
 * DOM-free: `boot.ts` supplies whoami/sign-in/timers and renders the view.
 */
import type { WhoamiState } from './passkey/logic.ts';
import type { WsAdapter, WsStatus } from './ws-adapter.ts';

/** Hold edits this long before the session ends. */
export const EXPIRY_LEAD_MS = 2 * 60 * 1000;
/** After the deadline, wait this long before retrying without the old session. */
export const EXPIRY_GRACE_MS = 5 * 1000;
/** Re-check whoami at least this often (also keeps setTimeout in range). */
export const MAX_CHECK_INTERVAL_MS = 60 * 60 * 1000;
/** Reconnect attempt (500 ms apart) at which a dropped connection is shown. */
export const RECONNECTING_NOTICE_ATTEMPT = 3;

const SESSION_CLOSE_CODE = 1008;
const SESSION_CLOSE_REASON = /^Session (?:expired|invalid)$/;

export type SessionGuardView =
  | {
      readonly kind: 'sign-in';
      readonly reason: 'expiring' | 'signed-out';
      readonly signInFailed: boolean;
    }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'reconnecting' };

export interface SessionGuardHost {
  readonly whoami: () => Promise<WhoamiState>;
  readonly signIn: () => Promise<unknown>;
  readonly setTimeout: (fn: () => void, ms: number) => number;
  readonly clearTimeout: (id: number) => void;
  readonly render: (view: SessionGuardView | null) => void;
}

export interface SessionGuard {
  onStatus(status: WsStatus): void;
  /** Re-read the session lifetime and (re)schedule the expiry hold. */
  refresh(): Promise<void>;
  /** Passkey sign-in from the banner; reconnects and flushes on success. */
  signIn(): Promise<void>;
  retry(): void;
  /** True while sheet edits are queued that the server has not received. */
  shouldWarnOnUnload(): boolean;
}

export type SessionGuardAdapter = Pick<WsAdapter, 'hold' | 'reconnectNow' | 'queuedEditCount'>;

export function createSessionGuard(
  adapter: SessionGuardAdapter,
  host: SessionGuardHost,
): SessionGuard {
  let signInReason: 'expiring' | 'signed-out' | null = null;
  let signInFailed = false;
  let unreachable = false;
  let reconnecting = false;
  let timer: number | null = null;

  function render(): void {
    if (signInReason !== null) {
      host.render({ kind: 'sign-in', reason: signInReason, signInFailed });
    } else if (unreachable) {
      host.render({ kind: 'unreachable' });
    } else if (reconnecting) {
      host.render({ kind: 'reconnecting' });
    } else {
      host.render(null);
    }
  }

  function clearTimer(): void {
    if (timer === null) return;
    host.clearTimeout(timer);
    timer = null;
  }

  function holdForSignIn(expiresInMs: number): void {
    adapter.hold();
    signInReason ??= 'expiring';
    render();
    // Once the old session is certainly over, retry without it: a public
    // room accepts the anonymous socket and flushes the held edits, while a
    // private room keeps refusing and the sign-in prompt stays up.
    timer = host.setTimeout(() => {
      timer = null;
      adapter.reconnectNow();
    }, expiresInMs + EXPIRY_GRACE_MS);
  }

  async function refresh(): Promise<void> {
    const state = await host.whoami();
    clearTimer();
    if (state.uid === null || state.expiresInMs === undefined) return;
    const lead = state.expiresInMs - EXPIRY_LEAD_MS;
    if (lead <= 0) {
      holdForSignIn(state.expiresInMs);
      return;
    }
    timer = host.setTimeout(() => {
      timer = null;
      void refresh();
    }, Math.min(lead, MAX_CHECK_INTERVAL_MS));
  }

  function onStatus(status: WsStatus): void {
    switch (status.type) {
      case 'open':
        signInReason = null;
        signInFailed = false;
        unreachable = false;
        reconnecting = false;
        break;
      case 'close':
        if (status.code !== SESSION_CLOSE_CODE || !SESSION_CLOSE_REASON.test(status.reason ?? '')) {
          return;
        }
        signInReason = 'signed-out';
        break;
      case 'reconnecting':
        if (status.attempt < RECONNECTING_NOTICE_ATTEMPT) return;
        reconnecting = true;
        break;
      case 'reconnect_failed':
        unreachable = true;
        break;
      case 'error':
        return;
    }
    render();
  }

  async function signIn(): Promise<void> {
    try {
      await host.signIn();
    } catch {
      signInFailed = true;
      render();
      return;
    }
    signInFailed = false;
    adapter.reconnectNow();
    await refresh();
  }

  function retry(): void {
    unreachable = false;
    reconnecting = false;
    render();
    adapter.reconnectNow();
  }

  return {
    onStatus,
    refresh,
    signIn,
    retry,
    shouldWarnOnUnload: () => adapter.queuedEditCount > 0,
  };
}

export function describeSessionGuardView(view: SessionGuardView): {
  readonly message: string;
  readonly action: { readonly kind: 'sign-in' | 'retry'; readonly label: string } | null;
} {
  switch (view.kind) {
    case 'sign-in': {
      const base =
        view.reason === 'expiring'
          ? 'Your EtherCalc sign-in is about to expire. New changes are held in this tab until you sign in again.'
          : "You've been signed out, so changes are not being saved. Sign in again to save them, then check your most recent edit.";
      return {
        message: view.signInFailed ? `${base} Sign-in didn't complete; please try again.` : base,
        action: { kind: 'sign-in', label: 'Sign in again' },
      };
    }
    case 'unreachable':
      return {
        message: "Can't reach the EtherCalc server. Your changes are held in this tab; keep it open.",
        action: { kind: 'retry', label: 'Retry' },
      };
    case 'reconnecting':
      return {
        message: "Connection lost. Reconnecting; your changes are held in this tab until it's back.",
        action: null,
      };
  }
}
