import type { Page } from '@playwright/test';

import { expect, test } from '../src/fixtures.ts';

interface SpreadsheetUi {
  spreadsheetDiv?: Element;
  editorDiv?: Element;
  height?: number;
  nonviewheight?: number;
  viewheight?: number;
}

interface EtherCalcWindow extends Window {
  spreadsheet?: SpreadsheetUi;
  __confirmCalls?: number;
}

const anonymousAuth = { enabled: true, uid: null };
const signedInAuth = { enabled: true, uid: '0123456789abcdef0123456789abcdef' };
const publicAccess = { isPrivate: false, canRead: true, canWrite: true };
const privateOwnerAccess = { isPrivate: true, canRead: true, canWrite: true };
const privateDeniedAccess = { isPrivate: true, canRead: false, canWrite: false };

async function routeWhoami(
  page: Page,
  body: typeof anonymousAuth | typeof signedInAuth,
): Promise<void> {
  await page.route('**/_auth/whoami', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

/** Parses a `rgb(r, g, b)` / `rgba(r, g, b, a)` computed-style string into an [r, g, b] tuple. */
function parseRgb(value: string): [number, number, number] {
  const match = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(value);
  if (!match) throw new Error(`Could not parse computed color: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, per https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rl, gl, bl] = [srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b)];
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/** WCAG contrast ratio (1:1 to 21:1), per https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Verifies the "cold-load upgrade race" fix (see
 * docs/superpowers/specs/2026-07-11-passkey-ui-m3e-design.md): while
 * `m3e-theme` sits parsed-but-undefined (network still fetching
 * `static/passkey/ui.js`), the synchronous `m3e-theme:not(:defined) {
 * display: contents }` CSS must already be holding it inert so
 * SocialCalc's boot-time layout math never measures against a corrupted
 * inline-box wrapper. Once the module is allowed to load and the page
 * settles, the room-access row must be an upgraded `m3e-toolbar` and the
 * spreadsheet's own height bookkeeping must already reflect the space it
 * occupies - both immediately, not just eventually.
 */
async function assertColdLoadUpgradeRaceIsSafe(page: Page, gotoPath: string): Promise<void> {
  let releaseUiJs: (() => void) | undefined;
  const uiJsGate = new Promise<void>((resolve) => {
    releaseUiJs = resolve;
  });
  // Routing this pattern also takes it out of Playwright's HTTP cache, so
  // every run genuinely refetches the module instead of resolving instantly.
  await page.route('**/static/passkey/ui.js', async (route) => {
    await uiJsGate;
    await route.continue();
  });

  await page.addInitScript(() => {
    const w = window as unknown as { __sawUndefinedTheme?: boolean; __preUpgradeDisplay?: string };
    w.__sawUndefinedTheme = false;
    const check = (): void => {
      if (w.__sawUndefinedTheme) return;
      const theme = document.querySelector('m3e-theme');
      if (!theme || customElements.get('m3e-theme') !== undefined) return;
      w.__sawUndefinedTheme = true;
      w.__preUpgradeDisplay = getComputedStyle(theme).display;
    };
    new MutationObserver(check).observe(document, { childList: true, subtree: true });
    check();
  });

  const navigation = page.goto(gotoPath);

  // ui.js is still gated here, so this can only resolve from the
  // parser-inserted, not-yet-upgraded <m3e-theme> the init script watches for.
  await page.waitForFunction(
    () => (window as unknown as { __sawUndefinedTheme?: boolean }).__sawUndefinedTheme === true,
    undefined,
    { timeout: 10_000 },
  );
  const preUpgradeDisplay = await page.evaluate(
    () => (window as unknown as { __preUpgradeDisplay?: string }).__preUpgradeDisplay,
  );
  expect(
    preUpgradeDisplay,
    'm3e-theme must be display:contents while still undefined, or SocialCalc measures a corrupted inline-box layout',
  ).toBe('contents');

  releaseUiJs?.();
  await navigation;

  await expect(page.locator('#ec-room-access')).toBeVisible();
  const layout = await page.evaluate(() => {
    const host = window as unknown as EtherCalcWindow;
    const spreadsheet = host.spreadsheet;
    const grid = document.querySelector('#tableeditor table');
    return {
      viewheight: spreadsheet?.viewheight ?? 0,
      gridHeight: grid ? grid.getBoundingClientRect().height : 0,
    };
  });
  expect(layout.viewheight).toBeGreaterThan(0);
  expect(layout.gridHeight).toBeGreaterThan(0);
}

test.describe('passkey room-access chrome', () => {
  test('inserts a public access row inside the real SocialCalc menu wrapper without cropping the editor', async ({
    workerBase,
    page,
  }) => {
    const room = `access-public-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);

    await page.goto(`${workerBase}/${room}`);

    const access = page.locator('#ec-room-access');
    await expect(access).toBeVisible();
    await expect(access).toContainText('Public');
    await expect(access).toContainText('Anyone with the link can edit');
    await expect(access.getByRole('button', { name: 'Use a passkey' })).toBeVisible();
    await expect(page.locator('#ec-passkey-bar')).toHaveCount(0);
    await expect(page.locator('#tableeditor table').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const host = window as EtherCalcWindow;
      const spreadsheet = host.spreadsheet;
      const accessRow = document.getElementById('ec-room-access');
      const menuWrapper = spreadsheet?.spreadsheetDiv?.firstElementChild;
      const tabBar = accessRow?.nextElementSibling;
      const toolbar = tabBar?.nextElementSibling;
      return {
        accessIsFirstChildOfMenu: menuWrapper?.firstElementChild === accessRow,
        tabBarFollowsAccess: Boolean(tabBar?.querySelector('[id$="tab"]')),
        tabBarCssHeight: tabBar ? getComputedStyle(tabBar).height : '',
        toolbarCssHeight: toolbar ? getComputedStyle(toolbar).height : '',
        toolbarBorderTop: toolbar ? getComputedStyle(toolbar).borderTopWidth : '',
        editorHeight: spreadsheet?.editorDiv?.getBoundingClientRect().height ?? 0,
        height: spreadsheet?.height ?? 0,
        nonviewheight: spreadsheet?.nonviewheight ?? 0,
        viewheight: spreadsheet?.viewheight ?? 0,
      };
    });

    expect(layout.accessIsFirstChildOfMenu).toBe(true);
    expect(layout.tabBarFollowsAccess).toBe(true);
    expect(layout.tabBarCssHeight).toBe('24px');
    expect(layout.toolbarCssHeight).toBe('40px');
    expect(layout.toolbarBorderTop).toBe('1px');
    expect(layout.editorHeight).toBeGreaterThan(0);
    expect(layout.viewheight).toBeGreaterThan(0);
    expect(layout.nonviewheight).toBeLessThan(layout.height);
  });

  test('places readable private viewer access beside, never inside, the read-only grid', async ({
    workerBase,
    page,
  }) => {
    const room = `access-viewer-${Date.now().toString(36)}`;
    const privateViewerAccess = { isPrivate: true, canRead: true, canWrite: false };
    await routeWhoami(page, signedInAuth);
    await page.route(`**/_/${room}/access`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateViewerAccess) }),
    );

    await page.goto(`${workerBase}/${room}/view`);

    const access = page.locator('#ec-room-access');
    await expect(access).toBeVisible();
    await expect(access).toContainText('Private');
    await expect(access).toContainText('Your account can view this sheet');

    const layout = await page.evaluate(() => {
      const host = window as EtherCalcWindow;
      const spreadsheet = host.spreadsheet;
      const accessRow = document.getElementById('ec-room-access');
      const editor = spreadsheet?.editorDiv;
      return {
        rowIsTopLevel: accessRow?.parentElement === spreadsheet?.spreadsheetDiv,
        rowPrecedesEditor: accessRow?.nextElementSibling === editor,
        rowIsOutsideGrid: !editor?.contains(accessRow),
        editorHeight: editor?.getBoundingClientRect().height ?? 0,
        viewheight: spreadsheet?.viewheight ?? 0,
      };
    });

    expect(layout.rowIsTopLevel).toBe(true);
    expect(layout.rowPrecedesEditor).toBe(true);
    expect(layout.rowIsOutsideGrid).toBe(true);
    expect(layout.editorHeight).toBeGreaterThan(0);
    expect(layout.viewheight).toBeGreaterThan(0);
  });

  test('replaces an unreadable private room with an account-safe gate', async ({
    workerBase,
    page,
  }) => {
    const room = `access-private-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);
    await page.route(`**/_/${room}/access`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateDeniedAccess) }),
    );

    await page.goto(`${workerBase}/${room}`);

    const gate = page.locator('#ec-private-gate');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText('A shared link alone does not grant access.');
    await expect(gate.getByRole('button', { name: 'Use a passkey' })).toBeVisible();
    await expect(page.locator('#tableeditor')).toBeHidden();
  });

  test('treats an interrupted discoverable sign-in as retryable, never implicit registration', async ({
    workerBase,
    page,
  }) => {
    const room = `access-signin-${Date.now().toString(36)}`;
    await page.addInitScript(() => {
      Object.defineProperty(window, '__confirmCalls', {
        configurable: true,
        writable: true,
        value: 0,
      });
      window.confirm = () => {
        const host = window as EtherCalcWindow;
        host.__confirmCalls = (host.__confirmCalls ?? 0) + 1;
        return false;
      };
      Object.defineProperty(CredentialsContainer.prototype, 'get', {
        configurable: true,
        value: () => Promise.reject(new DOMException('cancelled', 'NotAllowedError')),
      });
    });
    await routeWhoami(page, anonymousAuth);
    await page.route('**/_auth/login-init', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          options: { challenge: 'AA', rpId: 'test.invalid', timeout: 60_000, userVerification: 'preferred' },
        }),
      }),
    );

    await page.goto(`${workerBase}/${room}`);
    await page.getByLabel('Sheet access').getByRole('button', { name: 'Use a passkey' }).click();

    const dialog = page.locator('#ec-passkey-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Try passkey sign-in' }).click();
    await expect(dialog).toContainText('Passkey sign-in wasn’t completed.');
    await expect(dialog.getByRole('button', { name: 'Try again' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create a new passkey' })).toBeVisible();
    await expect(dialog).toContainText(
      'It will not unlock private sheets owned by another account.',
    );
    const confirmCalls = await page.evaluate(() => {
      const host = window as EtherCalcWindow;
      return host.__confirmCalls ?? 0;
    });
    expect(confirmCalls).toBe(0);
  });

  test('keeps public creation primary while adding an explicit private route on the landing page', async ({
    workerBase,
    page,
  }) => {
    await routeWhoami(page, anonymousAuth);

    await page.goto(`${workerBase}/_start`);

    await expect(page.locator('#newpadbutton')).toBeVisible();
    const landingActions = page.locator('#ec-landing-actions');
    await expect(landingActions).toBeVisible();
    await expect(landingActions.getByRole('button', { name: 'Create private sheet' })).toBeVisible();
  });

  test('keeps signed-in and narrow-screen actions reachable from the compact row', async ({
    workerBase,
    page,
  }) => {
    const publicRoom = `access-owner-public-${Date.now().toString(36)}`;
    const privateRoom = `access-owner-private-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) => {
      const path = new URL(route.request().url()).pathname;
      const verdict = path.includes(privateRoom) ? privateOwnerAccess : publicAccess;
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(verdict) });
    });

    await page.goto(`${workerBase}/${publicRoom}`);
    const publicRow = page.locator('#ec-room-access');
    await expect(publicRow.getByRole('button', { name: 'Make a private copy' })).toBeVisible();
    const accountMenu = page.locator('#ec-account-menu');
    await expect(accountMenu).toBeHidden();
    await publicRow.getByRole('button', { name: 'Passkey' }).click();
    await expect(accountMenu).toBeVisible();
    await expect(accountMenu.getByRole('menuitem', { name: 'New private sheet' })).toBeVisible();
    await expect(accountMenu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();

    await page.goto(`${workerBase}/${privateRoom}`);
    const privateRow = page.locator('#ec-room-access');
    await expect(privateRow).toContainText('Private');
    await expect(privateRow.getByRole('button', { name: 'Sheet access' })).toBeVisible();
    await expect(privateRow.getByRole('button', { name: 'Make a private copy' })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${workerBase}/${publicRoom}`);
    await page.locator('#ec-room-overflow').click();
    const actions = page.locator('#ec-room-actions');
    await expect(actions).toBeVisible();
    await expect(actions.getByRole('button', { name: 'Make a private copy' })).toBeVisible();
    await expect(actions.getByRole('button', { name: 'New private sheet' })).toBeVisible();
    await expect(actions.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });

  test('survives the cold-load custom-element upgrade race on the editable path', async ({
    workerBase,
    page,
  }) => {
    const room = `access-coldload-edit-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);
    await assertColdLoadUpgradeRaceIsSafe(page, `${workerBase}/${room}`);
  });

  test('survives the cold-load custom-element upgrade race on the viewer path', async ({
    workerBase,
    page,
  }) => {
    const room = `access-coldload-view-${Date.now().toString(36)}`;
    const privateViewerAccess = { isPrivate: true, canRead: true, canWrite: false };
    await routeWhoami(page, signedInAuth);
    await page.route(`**/_/${room}/access`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateViewerAccess) }),
    );
    await assertColdLoadUpgradeRaceIsSafe(page, `${workerBase}/${room}/view`);
  });

  test('keeps SocialCalc chrome legible against the m3e-theme body background', async ({
    workerBase,
    page,
  }) => {
    // <m3e-theme> nested directly under <body> sets `body { background-color:
    // var(--md-sys-color-background); color: var(--md-sys-color-on-background) }`
    // document-wide (see docs/superpowers/specs/2026-07-11-passkey-ui-m3e-design.md
    // "visual/contrast regression"). SocialCalc's own toolbar/tabs/grid are
    // untouched and rely on `background:transparent`, so they now render
    // against that theme background instead of the page's old implicit
    // white - this asserts WCAG AA (>= 4.5:1) still holds for its text.
    const room = `access-contrast-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);
    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();

    const samples = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      const activeTab = document.querySelector<HTMLElement>('#tableeditor td[id$="tab"]');
      const gridCell = document.querySelector<HTMLElement>('#te_fullgrid td');
      // SocialCalc drives the "other tabs" CSS rule off an attribute
      // selector matching the tab's own inline style (`[style*="#808080"]`);
      // simulate that state on a detached clone to read the real cascade
      // without disturbing the only (active) tab actually on screen.
      let inactiveTabColor: string | null = null;
      if (activeTab) {
        const probe = activeTab.cloneNode(true) as HTMLElement;
        probe.style.cssText += ';background-color:#808080;';
        probe.style.visibility = 'hidden';
        activeTab.parentElement?.appendChild(probe);
        inactiveTabColor = getComputedStyle(probe).color;
        probe.remove();
      }
      return {
        bodyBackground: body.backgroundColor,
        activeTabColor: activeTab ? getComputedStyle(activeTab).color : null,
        inactiveTabColor,
        gridCellColor: gridCell ? getComputedStyle(gridCell).color : null,
      };
    });

    const background = parseRgb(samples.bodyBackground);
    expect(samples.activeTabColor, 'active tab color not found').not.toBeNull();
    expect(samples.inactiveTabColor, 'inactive tab color not found').not.toBeNull();
    expect(samples.gridCellColor, 'grid cell color not found').not.toBeNull();

    const minContrast = 4.5; // WCAG AA, normal text
    expect(contrastRatio(background, parseRgb(samples.activeTabColor as string))).toBeGreaterThanOrEqual(
      minContrast,
    );
    expect(contrastRatio(background, parseRgb(samples.inactiveTabColor as string))).toBeGreaterThanOrEqual(
      minContrast,
    );
    expect(contrastRatio(background, parseRgb(samples.gridCellColor as string))).toBeGreaterThanOrEqual(
      minContrast,
    );
  });

  test('stretches the shadow toolbar row across the full width on desktop and mobile', async ({
    workerBase,
    page,
  }) => {
    // `m3e-toolbar`'s shadow root lays out slotted children inside an
    // internal `.base` div (`display: flex`, no explicit width) - the
    // HOST must stay block-level/full-width (not itself `display: flex`)
    // for `.base` to stretch across it via ordinary block sizing; a flex
    // or inline-block host instead makes `.base` a shrink-to-fit flex
    // item, leaving the row's trailing space dead and unreachable by the
    // `margin-right: auto` trick `.ec-room-access__summary` relies on to
    // push actions to the right edge (see passkey/ui.css).
    const room = `access-geometry-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);
    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();

    const desktop = await page.evaluate(() => {
      const host = document.getElementById('ec-room-access');
      const base = host?.shadowRoot?.querySelector('.base');
      const inlineActions = host?.querySelector('.ec-room-access__inline-actions');
      return {
        hostWidth: host?.getBoundingClientRect().width ?? 0,
        baseWidth: base?.getBoundingClientRect().width ?? 0,
        baseRight: base?.getBoundingClientRect().right ?? 0,
        actionsRight: inlineActions?.getBoundingClientRect().right ?? 0,
      };
    });
    // `.base` should span nearly the whole host (only the light-DOM
    // padding should be missing), not shrink to its slotted content.
    expect(desktop.baseWidth).toBeGreaterThan(desktop.hostWidth - 30);
    // Trailing inline actions must land near .base's right edge, not
    // stranded far short of it (the pre-fix bug: ~430px of a 1250px row).
    expect(desktop.baseRight - desktop.actionsRight).toBeLessThan(40);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();
    const mobile = await page.evaluate(() => {
      const host = document.getElementById('ec-room-access');
      const base = host?.shadowRoot?.querySelector('.base');
      const overflow = document.getElementById('ec-room-overflow');
      return {
        overflowDisplay: overflow ? getComputedStyle(overflow).display : null,
        overflowRight: overflow?.getBoundingClientRect().right ?? 0,
        baseRight: base?.getBoundingClientRect().right ?? 0,
      };
    });
    expect(mobile.overflowDisplay).not.toBe('none');
    expect(mobile.baseRight - mobile.overflowRight).toBeLessThan(40);
  });

  test('disables the account menu open animation under prefers-reduced-motion', async ({
    workerBase,
    page,
  }) => {
    // `m3e-menu`'s own `@media (prefers-reduced-motion)` rule only
    // zeroes its `transition` - the separate `animation: bounce-open …`
    // it applies on `:popover-open` (see @m3e/web/dist/menu.js) is
    // untouched, so the menu still visibly bounces open at full duration
    // under reduced motion unless something else neutralizes it. ui.css
    // zeroes the underlying `--md-sys-motion-duration-*`/`-spring-*`
    // tokens `!important` at the `html` level specifically to close this
    // (and any other component's) gap without touching shadow-DOM-
    // private selectors directly.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const room = `access-reduced-motion-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(publicAccess) }),
    );
    await page.goto(`${workerBase}/${room}`);

    const row = page.locator('#ec-room-access');
    await row.getByRole('button', { name: 'Passkey' }).click();
    await expect(page.locator('#ec-account-menu')).toBeVisible();

    const animation = await page.evaluate(() => {
      const menu = document.getElementById('ec-account-menu');
      if (!menu) return null;
      const style = getComputedStyle(menu);
      return { animationName: style.animationName, animationDuration: style.animationDuration };
    });
    expect(animation, 'account menu not found').not.toBeNull();
    // A zero (or effectively zero) duration means the animation completes
    // instantly regardless of animation-name - assert on duration, which
    // is what actually determines visible motion.
    expect(animation?.animationDuration).toMatch(/^0s$|^0ms$/);
  });
});
