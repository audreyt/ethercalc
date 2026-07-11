/**
 * Browser-only room-access/passkey UI entry (Material 3 Expressive — `@m3e/web`).
 *
 * This is the ONLY module in the passkey UI that imports `@m3e/web/*`,
 * touches `document`/`window`/`navigator`, or constructs DOM. `logic.ts`
 * holds every pure, DOM-free function this file consumes and is unit
 * tested under Vitest's Node environment; this file is verified only by
 * Playwright (see `packages/e2e/tests/passkey-room-access.spec.ts`) — see
 * `docs/superpowers/specs/2026-07-11-passkey-ui-m3e-design.md`.
 *
 * Built by a SEPARATE Vite config (`vite.passkey.config.ts`), not part of
 * `player.js`'s bundle: `boot.ts` never imports `@m3e/web/*` and instead
 * constructs `<m3e-dialog>`/`<m3e-button>` markup by tag name, relying on
 * the custom elements this file registers (see the design doc's Build
 * pipeline + "Cold-load upgrade race" sections for why the passkey
 * entry's `<script>` tag loads before `player.js`'s).
 */

// M3E component registrations — side-effect imports. Never `@m3e/web/all`.
import '@m3e/web/theme';
import '@m3e/web/toolbar';
import '@m3e/web/button';
import '@m3e/web/menu';
import '@m3e/web/dialog';
import '@m3e/web/bottom-sheet';
// `m3e-action-list` / `m3e-list-action` (used by the mobile bottom sheet's
// content) are defined by `@m3e/web/list`, NOT `@m3e/web/bottom-sheet`.
import '@m3e/web/list';
import '@m3e/web/snackbar';
import '@m3e/web/card';
import '@m3e/web/icon';
// Self-hosted SVG Material Symbols — never the Google Fonts CDN (would
// break EtherCalc's self-host/offline deployment model). Exactly two
// icons are used anywhere in this UI: lock (private gate) and key
// (passkey actions).
import '@m3e/icons/outlined/lock';
import '@m3e/icons/outlined/key';
// Light-DOM layout only (flex row, mobile inline-vs-overflow toggle) —
// M3E's own shadow-DOM component styles never need this file.
import './ui.css';

import type { M3eBottomSheetElement } from '@m3e/web/bottom-sheet';
import type { M3eDialogElement } from '@m3e/web/dialog';

import type { SpreadsheetLike } from '../types.ts';
import {
  copyToPrivate,
  currentRoom,
  decideMount,
  logout,
  newPrivateSheet,
  register,
  roomAccess,
  roomEditLocation,
  signIn,
  whoami,
  type PasskeyLogicHost,
  type RoomAccessVerdict,
  type WhoamiState,
} from './logic.ts';

function createHost(): PasskeyLogicHost {
  return {
    fetch: window.fetch.bind(window),
    navigator: window.navigator,
    location: window.location,
  };
}

function removeById(id: string): void {
  document.getElementById(id)?.remove();
}

function showNotice(message: string): void {
  M3eSnackbar.open(message);
}

type ButtonVariant = 'filled' | 'tonal' | 'text';

function actionButton(label: string, onClick: () => unknown, variant: ButtonVariant = 'text'): HTMLElement {
  const button = document.createElement('m3e-button');
  button.setAttribute('variant', variant);
  button.textContent = label;
  button.addEventListener('click', () => {
    Promise.resolve(onClick()).catch(() => showNotice('Could not complete that action. Try again.'));
  });
  return button;
}

function waitForSpreadsheet(): Promise<SpreadsheetLike | null> {
  const { promise, resolve } = Promise.withResolvers<SpreadsheetLike | null>();
  let framesRemaining = 180;
  const poll = (): void => {
    const spreadsheet = window.spreadsheet;
    if (spreadsheet?.spreadsheetDiv?.firstElementChild) {
      resolve(spreadsheet);
      return;
    }
    framesRemaining -= 1;
    if (framesRemaining <= 0) {
      resolve(null);
      return;
    }
    window.requestAnimationFrame(poll);
  };
  poll();
  return promise;
}

/**
 * Await an inserted M3E element's actual rendered layout before measuring
 * it. Native element insertion paints synchronously; a Lit element's
 * shadow-DOM render is scheduled via a microtask, so measuring
 * `offsetHeight` immediately after insertion can observe a `0`-height or
 * partially-rendered element (see the design doc's "New requirement" under
 * SocialCalc DOM-insertion contract).
 */
async function waitForElementRender(element: HTMLElement): Promise<void> {
  await customElements.whenDefined(element.localName);
  const withUpdateComplete = element as HTMLElement & { updateComplete?: Promise<unknown> };
  if (withUpdateComplete.updateComplete) await withUpdateComplete.updateComplete;
  const { promise, resolve } = Promise.withResolvers<void>();
  window.requestAnimationFrame(() => resolve());
  await promise;
}

function resizeForAccessRow(spreadsheet: SpreadsheetLike): void {
  const height = Number(spreadsheet.height);
  const nonviewheight = Number(spreadsheet.nonviewheight);
  if (!Number.isFinite(height) || !Number.isFinite(nonviewheight)) return;
  const viewheight = Math.max(0, height - nonviewheight);
  spreadsheet.viewheight = viewheight;
  for (const view of Object.values(spreadsheet.views ?? {})) {
    const element = (view as { element?: HTMLElement } | undefined)?.element;
    if (element?.style) {
      element.style.width = `${spreadsheet.width}px`;
      element.style.height = `${viewheight}px`;
    }
  }
  spreadsheet.editor.ResizeTableEditor?.(spreadsheet.width ?? 0, viewheight);
  spreadsheet.DoOnResize?.();
}

interface MobileAction {
  readonly label: string;
  readonly run: () => unknown;
}

/** Shared by the room-access row and the landing page. */
function buildAccountMenu(host: PasskeyLogicHost, mobileActions: MobileAction[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'ec-room-access__account';

  const trigger = document.createElement('m3e-button');
  trigger.id = 'ec-account-trigger';
  trigger.setAttribute('variant', 'tonal');
  const triggerLabel = document.createElement('m3e-menu-trigger');
  triggerLabel.setAttribute('for', 'ec-account-menu');
  triggerLabel.textContent = 'Passkey';
  trigger.appendChild(triggerLabel);

  const menu = document.createElement('m3e-menu');
  menu.id = 'ec-account-menu';

  const addMenuItem = (label: string, run: () => unknown): void => {
    const item = document.createElement('m3e-menu-item');
    item.textContent = label;
    item.addEventListener('click', () => {
      Promise.resolve(run()).catch(() => showNotice('Could not complete that action. Try again.'));
    });
    menu.appendChild(item);
    mobileActions.push({ label, run });
  };

  addMenuItem('New private sheet', () => newPrivateSheet(host));
  addMenuItem('Sign out', async () => {
    await logout(host);
    window.location.reload();
  });

  container.append(trigger, menu);
  return container;
}

function showPasskeyDialog(host: PasskeyLogicHost, opts: { onAuthenticated?: () => unknown } = {}): void {
  const onAuthenticated = opts.onAuthenticated ?? (() => window.location.reload());
  removeById('ec-passkey-dialog');

  const dialog = document.createElement('m3e-dialog') as M3eDialogElement;
  dialog.id = 'ec-passkey-dialog';
  dialog.dismissible = true;

  const header = document.createElement('span');
  header.slot = 'header';
  const keyIcon = document.createElement('m3e-icon');
  keyIcon.setAttribute('name', 'key');
  header.append(keyIcon, ' Use a passkey');
  dialog.appendChild(header);

  const description = document.createElement('p');
  description.textContent = 'Sign in to continue with this EtherCalc account.';
  dialog.appendChild(description);

  const status = document.createElement('p');
  status.setAttribute('aria-live', 'polite');
  dialog.appendChild(status);

  const warning = document.createElement('p');
  warning.textContent =
    'Creating a new passkey creates a new EtherCalc identity. It will not unlock private sheets owned by another account.';
  dialog.appendChild(warning);

  const actions = document.createElement('div');
  actions.slot = 'actions';

  const loginButton = document.createElement('m3e-button');
  loginButton.setAttribute('variant', 'filled');
  loginButton.setAttribute('autofocus', '');
  loginButton.textContent = 'Try passkey sign-in';
  loginButton.addEventListener('click', () => {
    void (async () => {
      loginButton.setAttribute('disabled', '');
      status.textContent = 'Waiting for your passkey…';
      try {
        await signIn(host);
        dialog.hide();
        await onAuthenticated();
      } catch {
        status.textContent = 'Passkey sign-in wasn’t completed.';
        loginButton.textContent = 'Try again';
        loginButton.removeAttribute('disabled');
      }
    })();
  });
  actions.appendChild(loginButton);

  const registerButton = document.createElement('m3e-button');
  registerButton.setAttribute('variant', 'text');
  registerButton.textContent = 'Create a new passkey';
  registerButton.addEventListener('click', () => {
    void (async () => {
      registerButton.setAttribute('disabled', '');
      status.textContent = 'Creating a new EtherCalc identity…';
      try {
        await register(host);
        dialog.hide();
        await onAuthenticated();
      } catch {
        status.textContent = 'Could not create a new passkey. Try again.';
        registerButton.removeAttribute('disabled');
      }
    })();
  });
  actions.appendChild(registerButton);
  dialog.appendChild(actions);

  // `closed` fires on every dismissal path (action click via `.hide()`,
  // Escape, or backdrop click via `cancel` → `.hide()`) — verified against
  // `M3eDialogElement`'s source, not assumed.
  dialog.addEventListener('closed', () => dialog.remove());
  document.body.appendChild(dialog);
  void dialog.show();
}

function showSheetAccessDialog(): void {
  removeById('ec-sheet-access-dialog');
  const dialog = document.createElement('m3e-dialog') as M3eDialogElement;
  dialog.id = 'ec-sheet-access-dialog';
  dialog.dismissible = true;

  const header = document.createElement('span');
  header.slot = 'header';
  header.textContent = 'Sheet access';
  dialog.appendChild(header);

  const copy = document.createElement('p');
  copy.textContent = 'This sheet is private. Only accounts that have access can open it.';
  const limitation = document.createElement('p');
  limitation.textContent = 'This version does not yet support invitations or access requests.';
  dialog.append(copy, limitation);

  dialog.addEventListener('closed', () => dialog.remove());
  document.body.appendChild(dialog);
  void dialog.show();
}

function buildRoomActionsSheet(actions: readonly MobileAction[]): void {
  removeById('ec-room-actions');
  const sheet = document.createElement('m3e-bottom-sheet') as M3eBottomSheetElement;
  sheet.id = 'ec-room-actions';
  sheet.modal = true;
  sheet.setAttribute('aria-label', 'Sheet actions');

  const header = document.createElement('h2');
  header.slot = 'header';
  header.textContent = 'Sheet actions';
  sheet.appendChild(header);

  const list = document.createElement('m3e-action-list');
  for (const action of actions) {
    const item = document.createElement('m3e-list-action');
    const trigger = document.createElement('m3e-bottom-sheet-action');
    trigger.textContent = action.label;
    item.appendChild(trigger);
    // The bottom-sheet-action's own click handler closes the sheet; this
    // listener (on the containing list item, so the click still bubbles
    // through it) runs the actual action for the same click.
    item.addEventListener('click', () => {
      Promise.resolve(action.run()).catch(() => showNotice('Could not complete that action. Try again.'));
    });
    list.appendChild(item);
  }
  sheet.appendChild(list);
  document.body.appendChild(sheet);
}

async function mountRoomAccess(
  host: PasskeyLogicHost,
  state: WhoamiState,
  room: string,
  verdict: RoomAccessVerdict,
): Promise<void> {
  const spreadsheet = await waitForSpreadsheet();
  if (!spreadsheet || document.getElementById('ec-room-access')) return;
  const spreadsheetDiv = spreadsheet.spreadsheetDiv;
  if (!spreadsheetDiv) return;
  const firstChild = spreadsheetDiv.firstElementChild;
  if (!firstChild) return;
  const editorDiv = spreadsheet.editorDiv;
  const isViewer = firstChild === editorDiv;
  if (isViewer) {
    if (!editorDiv || editorDiv.parentElement !== spreadsheetDiv) return;
  } else {
    const menuParts = Array.from(firstChild.children);
    const tabBar = menuParts.find((part) => part.querySelector('[id$="tab"]'));
    const toolbar = menuParts.find((part) => part.querySelector('#SocialCalc-edittools'));
    if (!tabBar || !toolbar) return;
    // Legacy makeup.css styles these semantically distinct children by
    // ordinal position. Preserve their identity before the access row
    // shifts the order.
    tabBar.classList.add('ec-socialcalc-tabbar');
    toolbar.classList.add('ec-socialcalc-toolbar');
  }

  const row = document.createElement('m3e-toolbar');
  row.id = 'ec-room-access';
  row.setAttribute('variant', 'standard');
  row.setAttribute('aria-label', 'Sheet access');
  if (verdict.isPrivate) row.classList.add('ec-room-access--private');

  const summary = document.createElement('div');
  summary.className = 'ec-room-access__summary';
  const mode = document.createElement('strong');
  mode.textContent = verdict.isPrivate ? 'Private' : 'Public';
  const detail = document.createElement('span');
  if (!verdict.isPrivate) {
    detail.textContent = 'Anyone with the link can edit';
  } else if (verdict.canWrite) {
    detail.textContent = 'Only your signed-in account can open it';
  } else {
    detail.textContent = 'Your account can view this sheet';
  }
  summary.append(mode, detail);
  row.appendChild(summary);

  const inlineActions = document.createElement('div');
  inlineActions.className = 'ec-room-access__inline-actions';
  const mobileActions: MobileAction[] = [];
  const addContextAction = (label: string, run: () => unknown, variant: ButtonVariant = 'text'): void => {
    mobileActions.push({ label, run });
    inlineActions.appendChild(actionButton(label, run, variant));
  };

  if (!state.uid) {
    addContextAction(
      'Use a passkey',
      () => showPasskeyDialog(host, { onAuthenticated: () => window.location.assign(roomEditLocation(room)) }),
      'filled',
    );
  } else {
    if (!verdict.isPrivate) {
      addContextAction('Make a private copy', () => copyToPrivate(host, room), 'filled');
    } else if (verdict.canWrite) {
      addContextAction('Sheet access', () => showSheetAccessDialog());
    }
    inlineActions.appendChild(buildAccountMenu(host, mobileActions));
  }
  row.appendChild(inlineActions);

  const overflowButton = document.createElement('m3e-button');
  overflowButton.id = 'ec-room-overflow';
  overflowButton.setAttribute('variant', 'text');
  const overflowTrigger = document.createElement('m3e-bottom-sheet-trigger');
  overflowTrigger.setAttribute('for', 'ec-room-actions');
  overflowTrigger.textContent = 'More actions';
  overflowButton.appendChild(overflowTrigger);
  row.appendChild(overflowButton);
  buildRoomActionsSheet(mobileActions);

  // Keep SocialCalc's spreadsheetDiv.firstChild as its original menu
  // wrapper for a control (its row-resize math reads that wrapper's
  // aggregate height), or a top-level sibling before the grid for a
  // viewer (never inside it). Never re-run `CalculateSheetNonViewHeight`
  // post-init — it would count the live grid as chrome.
  let addedNonViewHeight: number;
  if (isViewer) {
    // `editorDiv` is guaranteed non-null here (validated above).
    spreadsheetDiv.insertBefore(row, editorDiv as Node);
    await waitForElementRender(row);
    addedNonViewHeight = row.offsetHeight;
  } else {
    const menuHeightBefore = (firstChild as HTMLElement).offsetHeight;
    firstChild.insertBefore(row, firstChild.firstChild);
    await waitForElementRender(row);
    addedNonViewHeight = Math.max(0, (firstChild as HTMLElement).offsetHeight - menuHeightBefore);
  }
  const nonviewheight = Number(spreadsheet.nonviewheight);
  if (Number.isFinite(nonviewheight)) {
    spreadsheet.nonviewheight = nonviewheight + addedNonViewHeight;
  }
  resizeForAccessRow(spreadsheet);
  window.requestAnimationFrame(() => resizeForAccessRow(spreadsheet));
}

function mountPrivateGate(host: PasskeyLogicHost, state: WhoamiState, room: string): void {
  removeById('ec-private-gate');
  const tableeditor = document.getElementById('tableeditor');
  if (tableeditor) {
    tableeditor.hidden = true;
    tableeditor.setAttribute('aria-hidden', 'true');
  }

  const gate = document.createElement('main');
  gate.id = 'ec-private-gate';

  const card = document.createElement('m3e-card');

  const header = document.createElement('h1');
  header.slot = 'header';
  const lockIcon = document.createElement('m3e-icon');
  lockIcon.setAttribute('name', 'lock');
  header.append(lockIcon, ' This sheet is private');
  card.appendChild(header);

  const content = document.createElement('div');
  content.slot = 'content';
  const message = document.createElement('p');
  message.textContent = state.uid
    ? 'This account does not have access to this sheet.'
    : 'A shared link alone does not grant access.';
  const limitation = document.createElement('p');
  limitation.textContent = 'This version does not yet support invitations or access requests.';
  content.append(message, limitation);
  card.appendChild(content);

  const actions = document.createElement('div');
  actions.slot = 'actions';
  if (state.uid) {
    actions.appendChild(
      actionButton(
        'Sign out',
        async () => {
          await logout(host);
          window.location.reload();
        },
        'filled',
      ),
    );
  } else {
    actions.appendChild(
      actionButton(
        'Use a passkey',
        () =>
          showPasskeyDialog(host, {
            onAuthenticated: () => window.location.assign(roomEditLocation(room)),
          }),
        'filled',
      ),
    );
  }
  actions.appendChild(actionButton('Go to EtherCalc', () => window.location.assign('/')));
  card.appendChild(actions);

  gate.appendChild(card);
  document.body.appendChild(gate);
}

function mountLandingActions(host: PasskeyLogicHost, state: WhoamiState): void {
  const introLinks = document.getElementById('intro-links');
  if (!introLinks || document.getElementById('ec-landing-actions')) return;
  const actions = document.createElement('div');
  actions.id = 'ec-landing-actions';

  const createPrivate = (): unknown =>
    state.uid
      ? newPrivateSheet(host)
      : showPasskeyDialog(host, { onAuthenticated: () => newPrivateSheet(host) });
  actions.appendChild(actionButton('Create private sheet', createPrivate, 'filled'));

  if (state.uid) {
    actions.appendChild(buildAccountMenu(host, []));
  } else {
    actions.appendChild(actionButton('Use a passkey', () => showPasskeyDialog(host)));
  }
  introLinks.appendChild(actions);
}

async function mount(): Promise<void> {
  const host = createHost();
  const state = await whoami(host);
  if (!state.enabled) return;

  const room = currentRoom(host.location.pathname);
  if (!room) {
    mountLandingActions(host, state);
    return;
  }

  const verdict = await roomAccess(host, room);
  const decision = decideMount(room, verdict);
  if (!decision || decision.kind === 'landing') return;
  if (decision.kind === 'private-denied') {
    mountPrivateGate(host, state, room);
    return;
  }
  // `decideMount` only reaches a non-landing, non-'private-denied' kind
  // when `verdict` was non-null — this check is a defensive fail-safe,
  // not a logically reachable branch, matching "never render a guessed
  // access mode" even under a future `decideMount` refactor.
  if (!verdict) return;
  await mountRoomAccess(host, state, room, verdict);
}

if (typeof document !== 'undefined' && typeof navigator !== 'undefined') {
  const run = (): void => {
    mount().catch(() => {});
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}
