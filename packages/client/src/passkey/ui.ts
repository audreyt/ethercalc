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
import '@m3e/web/button';
import '@m3e/web/icon-button';
import '@m3e/web/toolbar';
import '@m3e/web/menu';
import '@m3e/web/dialog';
import '@m3e/web/snackbar';
import '@m3e/web/card';
import '@m3e/web/icon';
// Self-hosted SVG Material Symbols — never the Google Fonts CDN (would
// break EtherCalc's self-host/offline deployment model). Three icons are
// used anywhere in this UI: lock (private gate), key (passkey trigger and
// dialog), person (the signed-in account avatar trigger).
import '@m3e/icons/outlined/lock';
import '@m3e/icons/outlined/key';
import '@m3e/icons/outlined/person';
// Light-DOM layout only — M3E's own shadow-DOM component styles never
// need this file.
import './ui.css';

import type { M3eDialogElement } from '@m3e/web/dialog';

import {
  copyToPrivate,
  currentRoom,
  decideMount,
  logout,
  newPrivateSheet,
  type PasskeyLogicHost,
  type RoomAccessVerdict,
  register,
  roomAccess,
  roomEditLocation,
  signIn,
  type WhoamiState,
  whoami,
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

/** The landing page uses a plain tonal "Passkey" button; the sheet-page
 * cluster uses a circular avatar-style icon button (Gsheet's own account
 * trigger shape) — same menu (New private sheet / Sign out) either way,
 * only the trigger's visual shape differs.
 *
 * Only the `'avatar'` variant (the toolbar-bound one) gets a pre-set
 * `tabindex="-1"`, matching every OTHER control this file appends into
 * `#ec-room-access` (see `mountRoomAccess`'s directly-appended context
 * action buttons and `buildPasskeyIconTrigger`) — needed BEFORE the element is even
 * connected, not after, or `m3e-toolbar`'s roving-tabindex group can
 * silently miss it.
 *
 * `m3e-button`/`m3e-icon-button`'s own `Focusable` mixin only sets its
 * OWN default `tabindex="0"` inside Lit's async `firstUpdated` lifecycle
 * hook (see `core.js`) - that fires once Lit's OWN render schedule gets
 * to a freshly-created element, which can land AFTER `m3e-toolbar`'s
 * synchronous `slotchange` handler has already scanned for `[tabindex]`
 * candidates. A button with no `tabindex` attribute yet fails that scan
 * outright and never enters the toolbar's roving-tabindex group at all
 * (confirmed live: Arrow-key navigation got stuck partway through the
 * toolbar, exactly at the boundary between synchronously-scanned and
 * still-pending elements). Setting `tabindex="-1"` explicitly,
 * synchronously, BEFORE the element is even connected sidesteps the race
 * entirely: `Focusable` only applies its own default `if
 * (!this.hasAttribute("tabindex"))`, so an explicit `-1` here is never
 * overwritten, and the toolbar's own `RovingTabIndexManager` promotes
 * exactly one managed item to `0`.
 *
 * The `'button'` variant sits in the landing page's plain flex row,
 * outside any `m3e-toolbar`, so it keeps `Focusable`'s own natural
 * default `0` - none of the above applies there.
 */
function buildAccountTrigger(kind: 'button' | 'avatar'): HTMLElement {
  const trigger = document.createElement(kind === 'avatar' ? 'm3e-icon-button' : 'm3e-button');
  trigger.id = 'ec-account-trigger';
  trigger.setAttribute('variant', kind === 'avatar' ? 'filled' : 'tonal');
  if (kind === 'avatar') trigger.setAttribute('tabindex', '-1');
  const triggerLabel = document.createElement('m3e-menu-trigger');
  triggerLabel.setAttribute('for', 'ec-account-menu');
  if (kind === 'avatar') {
    trigger.setAttribute('aria-label', 'Account');
    const personIcon = document.createElement('m3e-icon');
    personIcon.setAttribute('name', 'person');
    triggerLabel.appendChild(personIcon);
  } else {
    triggerLabel.textContent = 'Passkey';
  }
  trigger.appendChild(triggerLabel);
  return trigger;
}

/**
 * Shared by the room-access cluster and the landing page. Returns just the
 * TRIGGER (appended by the caller into the toolbar/landing markup) — the
 * `<m3e-menu>` itself is appended straight to `document.body`, a sibling
 * of the trigger rather than its DOM descendant.
 *
 * This matters specifically for the toolbar caller: `m3e-toolbar` builds
 * its roving-tabindex group by calling the shared
 * `M3eInteractivityChecker.findInteractiveElements(this, true)` — that
 * `true` is `allowVisiblyHidden`, so a `display: none`-hidden descendant
 * would still be picked up, but a genuinely absent one (never a
 * descendant in the first place) can't be. A closed menu's `m3e-menu-item`s
 * are real, focusable elements even while the popover itself isn't open,
 * so leaving them nested inside the toolbar would hand the toolbar's own
 * Arrow-key navigation extra stops that visually do nothing until the
 * menu is separately opened — confirmed live, that desyncs the roving
 * manager's single-`tabindex="0"` invariant and can make Arrow-key
 * navigation appear to stop advancing partway through the toolbar.
 * `m3e-menu-trigger`'s `for="ec-account-menu"` is ID-based (via the
 * shared `HtmlFor` mixin), not DOM-nesting-based, so the trigger/menu
 * association is unaffected by where the menu itself actually lives.
 */
function buildAccountMenu(host: PasskeyLogicHost, triggerKind: 'button' | 'avatar' = 'button'): HTMLElement {
  const trigger = buildAccountTrigger(triggerKind);

  removeById('ec-account-menu');
  const menu = document.createElement('m3e-menu');
  menu.id = 'ec-account-menu';

  const addMenuItem = (label: string, run: () => unknown): void => {
    const item = document.createElement('m3e-menu-item');
    item.textContent = label;
    item.addEventListener('click', () => {
      Promise.resolve(run()).catch(() => showNotice('Could not complete that action. Try again.'));
    });
    menu.appendChild(item);
  };

  addMenuItem('New private sheet', () => newPrivateSheet(host));
  addMenuItem('Sign out', async () => {
    await logout(host);
    window.location.reload();
  });

  document.body.appendChild(menu);
  return trigger;
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

/**
 * Builds (or returns the existing) top-right cluster shell — an empty
 * `m3e-toolbar` inserted immediately before `#tableeditor`, ready for
 * `mountRoomAccess`/`mountPrivateGate` to populate. No project-navigation
 * content of its own: Docs/API/GitHub only make sense as a discovery aid
 * on the landing page (`start.html`'s own static `.ec-floatnav` pill) -
 * once a user is actually inside a sheet, the account/passkey status is
 * the only thing this corner needs to carry.
 *
 * `position: fixed` above 840px viewport width: no knowledge of
 * SocialCalc's own menu/toolbar DOM, no insertion into it, so it never
 * touches `spreadsheet.viewheight`/`nonviewheight` — SocialCalc keeps its
 * full natural height and the cluster floats over the top-right corner of
 * its own tab-menu row, which is otherwise empty there (confirmed live:
 * the "Edit Format Sort Audit Comment Names Clipboard" row's own content
 * ends around x=482 of a 1410px-wide row).
 *
 * Below 840px that clearance is gone (SocialCalc's menu row is a fixed
 * ~482px wide, non-reflowing table — a `position: fixed` cluster
 * anchored to the viewport's right edge WILL cross into it on any
 * narrower viewport; confirmed live via bounding-rect intersection down
 * to the ~757px mark - the widest realistic content, badge + "Sheet
 * access"/"Make a private copy" + avatar, measures ~256px wide).
 * `ui.css`'s `@media (max-width: 840px)` switches the cluster to
 * `position: static`, so it
 * needs to sit in normal DOM flow immediately before `#tableeditor` — not
 * appended to the end of `body` the way a `position: fixed` element could
 * get away with — so the in-flow fallback renders ABOVE the grid instead
 * of after it. SocialCalc itself needs no special-casing for the height
 * this reserves at that width: `SizeSSDiv()` sizes off `#tableeditor`'s
 * own actual `offsetTop` (wherever that ends up) and `<body onresize>`
 * already calls `DoOnResize()`, so pushing `#tableeditor` down is
 * self-accounting.
 */
function mountRoomAccessCluster(): HTMLElement {
  const existing = document.getElementById('ec-room-access');
  if (existing) return existing;
  const tableeditor = document.getElementById('tableeditor');
  // A real `m3e-toolbar`, not a hand-rolled div: its shadow DOM provides
  // the actual `toolbar` ARIA role AND real roving-tabindex keyboard
  // navigation (arrow/Home/End) — a plain div claiming `role="toolbar"`
  // would advertise that contract without delivering it. `elevated` +
  // `shape="rounded"` give it the pill chrome itself (see ui.css).
  const cluster = document.createElement('m3e-toolbar');
  cluster.id = 'ec-room-access';
  cluster.setAttribute('variant', 'standard');
  cluster.setAttribute('shape', 'rounded');
  cluster.setAttribute('elevated', '');
  cluster.setAttribute('aria-label', 'Sheet access');
  if (tableeditor) {
    tableeditor.before(cluster);
  } else {
    document.body.appendChild(cluster);
  }
  return cluster;
}

/**
 * Signed-out counterpart to `buildAccountTrigger('avatar')`: same
 * circular `m3e-icon-button` shape, but a `key` icon instead of `person`,
 * and a direct click handler instead of `m3e-menu-trigger` wiring - there
 * is no menu to open when signed out, just the one action ("Use a
 * passkey" opens the sign-in dialog directly). Kept as a full accessible
 * name (`aria-label="Use a passkey"`, not just "Sign in") so what the
 * icon DOES stays unambiguous without relying on the key glyph alone.
 */
function buildPasskeyIconTrigger(host: PasskeyLogicHost, room: string): HTMLElement {
  const trigger = document.createElement('m3e-icon-button');
  trigger.id = 'ec-passkey-trigger';
  trigger.setAttribute('variant', 'filled');
  trigger.setAttribute('aria-label', 'Use a passkey');
  // See `buildAccountTrigger`'s doc comment for why this has to happen
  // before the element is even connected, not after.
  trigger.setAttribute('tabindex', '-1');
  const keyIcon = document.createElement('m3e-icon');
  keyIcon.setAttribute('name', 'key');
  trigger.appendChild(keyIcon);
  trigger.addEventListener('click', () => {
    showPasskeyDialog(host, { onAuthenticated: () => window.location.assign(roomEditLocation(room)) });
  });
  return trigger;
}

/**
 * Adds the passkey/account-specific portion into the cluster
 * `mountRoomAccessCluster` already built. `verdict` is `null` on the
 * private-denied path — access
 * itself was refused, so no room-specific permission is known, only the
 * global sign-in state applies (still enough to offer "Use a passkey").
 */
function mountRoomAccess(
  host: PasskeyLogicHost,
  state: WhoamiState,
  room: string,
  verdict: RoomAccessVerdict | null,
): void {
  const cluster = mountRoomAccessCluster();
  if (cluster.querySelector('#ec-account-trigger, #ec-passkey-trigger')) return;

  if (verdict?.isPrivate) {
    cluster.classList.add('ec-room-access--private');
    const badge = document.createElement('span');
    badge.className = 'ec-room-access__badge';
    badge.textContent = 'Private';
    cluster.insertBefore(badge, cluster.firstChild);
  }

  // Signed out: just the passkey trigger, no context action - there's
  // nothing else a signed-out visitor can do from here. Signed in: an
  // optional context action ("Make a private copy" for a public room,
  // "Sheet access" for one this account owns) alongside the avatar. The
  // cluster's widest realistic content (badge + "Sheet access" + avatar)
  // measures ~256px - comfortably within even a 320px viewport with
  // ui.css's own margins, so unlike the project links this replaced,
  // nothing here needs a narrow-width fold-into-overflow treatment.
  let trigger: HTMLElement;
  if (state.uid) {
    if (verdict && !verdict.isPrivate) {
      const button = actionButton('Make a private copy', () => copyToPrivate(host, room), 'filled');
      // See `buildAccountTrigger`'s doc comment: pre-set before this
      // button is appended to the toolbar, ahead of Lit's own async
      // `firstUpdated` default, or `m3e-toolbar`'s slotchange scan can
      // miss it entirely.
      button.setAttribute('tabindex', '-1');
      cluster.appendChild(button);
    } else if (verdict?.canWrite) {
      const button = actionButton('Sheet access', () => showSheetAccessDialog());
      button.setAttribute('tabindex', '-1');
      cluster.appendChild(button);
    }
    trigger = buildAccountMenu(host, 'avatar');
  } else {
    trigger = buildPasskeyIconTrigger(host, room);
  }
  cluster.appendChild(trigger);
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
  actions.appendChild(actionButton('Create private sheet', createPrivate, 'tonal'));

  if (state.uid) {
    actions.appendChild(buildAccountMenu(host));
  } else {
    actions.appendChild(actionButton('Use a passkey', () => showPasskeyDialog(host)));
  }
  introLinks.appendChild(actions);
}

async function mount(): Promise<void> {
  const host = createHost();
  const room = currentRoom(host.location.pathname);

  const state = await whoami(host);
  if (!state.enabled) return;

  if (!room) {
    mountLandingActions(host, state);
    return;
  }

  const verdict = await roomAccess(host, room);
  const decision = decideMount(room, verdict);
  if (!decision || decision.kind === 'landing') return;
  if (decision.kind === 'private-denied') {
    // Access itself was refused, but the cluster still needs the sign-in
    // affordance — an anonymous or under-privileged visitor is exactly who
    // most needs "Use a passkey" reachable, not hidden behind the gate.
    mountRoomAccess(host, state, room, null);
    mountPrivateGate(host, state, room);
    return;
  }
  // `decideMount` only reaches a non-landing, non-'private-denied' kind
  // when `verdict` was non-null — this check is a defensive fail-safe,
  // not a logically reachable branch, matching "never render a guessed
  // access mode" even under a future `decideMount` refactor.
  if (!verdict) return;
  mountRoomAccess(host, state, room, verdict);
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
