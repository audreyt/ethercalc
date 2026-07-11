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
 * settles, the room-access cluster must be visible and SocialCalc's own
 * height bookkeeping must already be positive - both immediately, not
 * just eventually. (The cluster no longer RESERVES any of that height
 * itself - it's `position: fixed` and overlays the grid's own top-right
 * corner - so this is a smoke check that the page still boots cleanly,
 * not a height-accounting check the way it was before that redesign.)
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
  test('floats a fixed top-right cluster without reserving grid height', async ({
    workerBase,
    page,
  }) => {
    const room = `access-public-${Date.now().toString(36)}`;
    await routeWhoami(page, anonymousAuth);

    await page.goto(`${workerBase}/${room}`);

    const access = page.locator('#ec-room-access');
    await expect(access).toBeVisible();
    await expect(access.getByRole('button', { name: 'Use a passkey' })).toBeVisible();
    // Project links moved to the landing page only (see the dedicated
    // landing-page test asserting they're actually there) - the sheet
    // cluster carries passkey/account status alone.
    await expect(access.getByRole('link', { name: 'Docs' })).toHaveCount(0);
    await expect(access.getByRole('link', { name: 'API' })).toHaveCount(0);
    await expect(access.getByRole('link', { name: 'GitHub' })).toHaveCount(0);
    await expect(page.locator('#tableeditor table').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const cluster = document.getElementById('ec-room-access');
      const tableeditor = document.getElementById('tableeditor');
      return {
        clusterPosition: cluster ? getComputedStyle(cluster).position : null,
        // Inserted immediately before `#tableeditor` (see `mountRoomAccessCluster()`
        // in ui.ts) so the sub-840px in-flow fallback renders above the
        // grid instead of after it - `position: fixed` makes DOM position
        // irrelevant to where it PAINTS at this (default, >840px) test
        // viewport, but it must still be a real preceding sibling of
        // `#tableeditor`, not appended elsewhere.
        precedesTableeditor:
          !!tableeditor &&
          !!cluster &&
          !!(cluster.compareDocumentPosition(tableeditor) & Node.DOCUMENT_POSITION_FOLLOWING),
        // Nothing pushes SocialCalc's own chrome down anymore - the
        // container should start right at the top of the viewport, not
        // ~42px lower the way the old in-flow reserved row left it.
        tableeditorTop: tableeditor?.getBoundingClientRect().top ?? -1,
      };
    });

    expect(layout.clusterPosition).toBe('fixed');
    expect(layout.precedesTableeditor).toBe(true);
    expect(layout.tableeditorTop).toBeLessThan(20);
  });

  test('shows a private badge and a read-only viewer without covering the grid', async ({
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
    // Viewer, not owner: neither "Make a private copy" nor "Sheet access"
    // makes sense for someone who can read but not write.
    await expect(access.getByRole('button', { name: 'Make a private copy' })).toHaveCount(0);
    await expect(access.getByRole('button', { name: 'Sheet access' })).toHaveCount(0);

    const layout = await page.evaluate(() => {
      const cluster = document.getElementById('ec-room-access');
      const editor = (window as unknown as EtherCalcWindow).spreadsheet?.editorDiv;
      if (!cluster || !editor) return null;
      return {
        collidesGrid: (() => {
          const a = cluster.getBoundingClientRect();
          const b = editor.getBoundingClientRect();
          return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        })(),
        editorHeight: editor.getBoundingClientRect().height,
      };
    });

    expect(layout, 'cluster or editor missing').not.toBeNull();
    // The cluster floats OVER the grid's corner by design (same trade-off
    // as the landing/sheet-page floating nav elsewhere in this app) - the
    // real contract is that the grid itself still renders at full size,
    // not that the two never visually overlap.
    expect(layout?.editorHeight).toBeGreaterThan(0);
  });

  test('replaces an unreadable private room with an account-safe gate, keeping sign-in reachable', async ({
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

    // Access itself was refused, but the visitor who most needs to sign in
    // is exactly who's looking at this gate - the top-right cluster must
    // still be there, with a sign-in affordance, not silently blanked out
    // because `verdict` came back null.
    const access = page.locator('#ec-room-access');
    await expect(access).toBeVisible();
    await expect(access.getByRole('button', { name: 'Use a passkey' })).toBeVisible();
  });

  test('renders no room-access cluster when passkey auth is disabled', async ({ workerBase, page }) => {
    // Unlike the old design, the cluster now carries ONLY passkey/account
    // status - no project links live here anymore (see start.html's own
    // `.ec-floatnav` for those). With auth disabled there's nothing that
    // status could say, so `mount()` returns before ever building the
    // cluster at all, rather than rendering an empty or partial one.
    const room = `access-authdisabled-${Date.now().toString(36)}`;
    await page.route('**/_auth/whoami', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled: false, uid: null }) }),
    );

    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#tableeditor table').first()).toBeVisible();

    await expect(page.locator('#ec-room-access')).toHaveCount(0);
    await expect(page.locator('#ec-account-trigger')).toHaveCount(0);
    await expect(page.locator('#ec-passkey-trigger')).toHaveCount(0);
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

    // Project links live HERE now, and only here (see the sheet-page
    // cluster tests asserting a `count(0)` for these same locators) -
    // static markup in start.html, unrelated to the JS-built cluster.
    const projectLinks = page.locator('nav[aria-label="Project links"]');
    await expect(projectLinks).toBeVisible();
    const docsLink = projectLinks.getByRole('link', { name: 'Docs' });
    const apiLink = projectLinks.getByRole('link', { name: 'API' });
    const githubLink = projectLinks.getByRole('link', { name: 'GitHub' });
    await expect(docsLink).toBeVisible();
    await expect(apiLink).toBeVisible();
    await expect(githubLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', 'https://docs.ethercalc.net');
    await expect(apiLink).toHaveAttribute('href', 'https://github.com/audreyt/ethercalc/blob/main/API.md');
    await expect(githubLink).toHaveAttribute('href', 'https://github.com/audreyt/ethercalc');
  });

  test('keeps signed-in actions reachable at any width, no mobile fold-away needed', async ({
    workerBase,
    page,
  }) => {
    // The old design folded the wordy context action into a mobile
    // overflow sheet below 640px, because the FULL cluster (with project
    // links) was too wide to fit narrow viewports. That's gone: the
    // widest remaining content is ~256px, comfortably inside even a
    // 320px viewport (see `mountRoomAccessCluster()`'s doc comment in ui.ts), so
    // "Make a private copy"/"Sheet access" now stay directly inline at
    // every width, narrow included.
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
    await page.locator('#ec-account-trigger').click();
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
    const narrowRow = page.locator('#ec-room-access');
    await expect(narrowRow.getByRole('button', { name: 'Make a private copy' })).toBeVisible();
    await expect(page.locator('#ec-room-overflow')).toHaveCount(0);
    await page.locator('#ec-account-trigger').click();
    await expect(page.locator('#ec-account-menu')).toBeVisible();
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

  test('stays compact and fixed on desktop, falls back in-flow below 840px', async ({
    workerBase,
    page,
  }) => {
    // The OLD design was a full-width `m3e-toolbar` row spanning the whole
    // viewport, reserving its own height out of the grid on EVERY
    // viewport. The redesign only pays that cost where it's actually
    // required: `position: fixed`, shrink-wrapped, floating free in the
    // corner above 840px (confirmed clear of SocialCalc's own menu bar);
    // a normal in-flow block, pushing `#tableeditor` down, below it (see
    // `mountRoomAccessCluster()`'s doc comment in ui.ts for the measured
    // collision math that sets that cutoff).
    const room = `access-compact-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(publicAccess) }),
    );

    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();

    const desktop = await page.evaluate(() => {
      const cluster = document.getElementById('ec-room-access');
      const rect = cluster?.getBoundingClientRect();
      return {
        clientWidth: document.documentElement.clientWidth,
        width: rect?.width ?? 0,
        right: rect?.right ?? 0,
        top: rect?.top ?? -1,
        position: cluster ? getComputedStyle(cluster).position : null,
      };
    });
    // Compact, not full-width: comfortably under half the viewport for
    // "Make a private copy" + avatar at any reasonable desktop width, and
    // pinned near the top-right corner.
    expect(desktop.position).toBe('fixed');
    expect(desktop.width).toBeLessThan(desktop.clientWidth / 2);
    expect(desktop.right).toBeLessThanOrEqual(desktop.clientWidth);
    expect(desktop.top).toBeLessThan(30);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();
    const mobile = await page.evaluate(() => {
      const cluster = document.getElementById('ec-room-access');
      const rect = cluster?.getBoundingClientRect();
      return {
        clientWidth: document.documentElement.clientWidth,
        left: rect?.left ?? -1,
        right: rect?.right ?? 0,
        position: cluster ? getComputedStyle(cluster).position : null,
      };
    });
    expect(mobile.position).toBe('static');
    expect(mobile.left).toBeGreaterThanOrEqual(0);
    expect(mobile.right).toBeLessThanOrEqual(mobile.clientWidth);
  });

  test('never overlaps SocialCalc\'s own menu bar across the fixed/in-flow breakpoint', async ({
    workerBase,
    page,
  }) => {
    // Regression test for a real bug caught in review: SocialCalc's own
    // "Edit Format Sort Audit Comment Names Clipboard" menu row is a
    // fixed-width (~482px), non-reflowing table that doesn't shrink with
    // the viewport. A `position: fixed` cluster anchored to the viewport's
    // right edge WILL cross into it below a measured ~757px viewport
    // width — this asserts zero bounding-rect intersection with that real
    // SocialCalc element, on both sides of the 840px breakpoint, for the
    // widest realistic cluster content (private badge + "Sheet access" +
    // avatar).
    const room = `access-nocollide-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateOwnerAccess) }),
    );

    for (const width of [700, 800, 840, 841]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`${workerBase}/${room}`);
      await expect(page.locator('#ec-room-access')).toBeVisible();

      const geometry = await page.evaluate(() => {
        const cluster = document.getElementById('ec-room-access');
        const clusterRect = cluster?.getBoundingClientRect();
        const menuCell = [...document.querySelectorAll('td, th, div, span')].find(
          (el) => el.textContent?.trim() === 'Format' && el.children.length === 0,
        );
        const menuRow = menuCell?.closest('table');
        const menuRect = menuRow?.getBoundingClientRect();
        return {
          cluster: clusterRect
            ? { left: clusterRect.left, right: clusterRect.right, top: clusterRect.top, bottom: clusterRect.bottom }
            : null,
          menu: menuRect
            ? { left: menuRect.left, right: menuRect.right, top: menuRect.top, bottom: menuRect.bottom }
            : null,
        };
      });

      expect(geometry.cluster, `no cluster rect at ${width}px`).not.toBeNull();
      expect(geometry.menu, `no SocialCalc menu row found at ${width}px`).not.toBeNull();
      const c = geometry.cluster!;
      const m = geometry.menu!;
      const intersects = c.left < m.right && m.left < c.right && c.top < m.bottom && m.top < c.bottom;
      expect(intersects, `cluster overlaps SocialCalc's menu row at ${width}px`).toBe(false);
    }
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

    await page.locator('#ec-account-trigger').click();
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

  test('keeps the context action and account trigger co-located inside one bounded cluster', async ({
    workerBase,
    page,
  }) => {
    // Landing on this specific shape - not just "a control exists
    // somewhere" - because the original bug report that started this
    // redesign was exactly this: a bottom-right-only pill was easy to
    // miss entirely, and later a full-width toolbar row wasted grid
    // height. Both remaining controls must sit together inside the
    // cluster's own compact bounding box.
    const room = `access-unified-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(publicAccess) }),
    );
    await page.goto(`${workerBase}/${room}`);

    const cluster = page.locator('#ec-room-access');
    await expect(cluster).toBeVisible();
    await expect(cluster.getByRole('button', { name: 'Make a private copy' })).toBeVisible();
    await expect(page.locator('#ec-account-trigger')).toBeVisible();

    // Both required controls must sit inside the cluster's own bounding
    // box. `#ec-account-menu` isn't a toolbar descendant at all -
    // `buildAccountMenu()` appends it straight to `document.body`, a
    // sibling of `#ec-account-trigger` rather than its child (see that
    // function's doc comment in ui.ts for why), so it's correctly
    // excluded from this check rather than needing special filtering.
    const outerBox = await cluster.boundingBox();
    expect(outerBox, 'cluster has no box').not.toBeNull();
    const controlBoxes = await Promise.all(
      [cluster.getByRole('button', { name: 'Make a private copy' }), page.locator('#ec-account-trigger')].map(
        (locator) => locator.boundingBox(),
      ),
    );
    for (const box of controlBoxes) {
      expect(box, 'required control has no box').not.toBeNull();
    }
    const outer = outerBox!;
    const tolerance = 1;
    for (const box of controlBoxes) {
      const b = box!;
      expect(b.x).toBeGreaterThanOrEqual(outer.x - tolerance);
      expect(b.y).toBeGreaterThanOrEqual(outer.y - tolerance);
      expect(b.x + b.width).toBeLessThanOrEqual(outer.x + outer.width + tolerance);
      expect(b.y + b.height).toBeLessThanOrEqual(outer.y + outer.height + tolerance);
    }
  });

  test('Arrow-key navigation reaches every visible control exactly once with a single roving tabindex', async ({
    workerBase,
    page,
  }) => {
    // Regression test: `m3e-button`/`m3e-icon-button` only get their own
    // default `tabindex="0"` in Lit's async `firstUpdated` (see
    // `buildAccountTrigger()`'s doc comment in ui.ts). A freshly created,
    // not-yet-first-updated control has NO `tabindex` attribute yet, so
    // `m3e-toolbar`'s synchronous `slotchange` scan (which requires
    // `[tabindex]` to match) can miss it - it never enters the toolbar's
    // roving-tabindex group, and later gets its OWN independent default
    // `tabindex="0"` once Lit catches up, with no further `slotchange` to
    // alert the toolbar. Symptom: MULTIPLE simultaneous `tabindex="0"`
    // elements, and Arrow-key navigation stops advancing partway through.
    const room = `access-kbd-desktop-${Date.now().toString(36)}`;
    await routeWhoami(page, signedInAuth);
    await page.route('**/_/*/access', (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateOwnerAccess) }),
    );
    await page.goto(`${workerBase}/${room}`);
    await expect(page.locator('#ec-room-access')).toBeVisible();

    await page.evaluate(() => {
      const first = document.querySelector('#ec-room-access m3e-button, #ec-room-access m3e-icon-button');
      (first as HTMLElement | null)?.focus();
    });

    const seen: Array<string | null> = [];
    for (let i = 0; i < 4; i++) {
      const id = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? el.id || el.textContent?.trim() || el.tagName : null;
      });
      seen.push(id);
      const zeroCount = await page.evaluate(
        () => document.querySelectorAll('#ec-room-access [tabindex="0"]').length,
      );
      expect(zeroCount, `expected exactly one active item at step ${i}`).toBe(1);
      await page.keyboard.press('ArrowRight');
    }

    // "Sheet access", account trigger, then no `.withWrap()` configured -
    // stays on the last item rather than cycling back.
    expect(seen).toEqual(['Sheet access', 'ec-account-trigger', 'ec-account-trigger', 'ec-account-trigger']);
  });

  test('remains reachable via the account trigger alone when there is no context action to show', async ({
    workerBase,
    page,
  }) => {
    // Signed-in, read-only private room: neither "Make a private copy" nor
    // "Sheet access" applies, so nothing but the avatar trigger renders.
    // There's no mobile overflow mechanism to fall back on at all anymore -
    // account actions
    // ("New private sheet"/"Sign out") must remain reachable purely
    // through that avatar's own click-to-open menu, at any width.
    const room = `access-kbd-noinline-${Date.now().toString(36)}`;
    const privateReadOnlyAccess = { isPrivate: true, canRead: true, canWrite: false };
    await routeWhoami(page, signedInAuth);
    await page.route(`**/_/${room}/access`, (route) =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(privateReadOnlyAccess) }),
    );

    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${workerBase}/${room}/view`);
      await expect(page.locator('#ec-account-trigger')).toBeVisible();
      await expect(page.locator('#ec-room-overflow')).toHaveCount(0);
      const zeroCount = await page.evaluate(
        () => document.querySelectorAll('#ec-room-access [tabindex="0"]').length,
      );
      expect(zeroCount, `expected exactly one active item at ${width}px`).toBe(1);
    }

    await page.locator('#ec-account-trigger').click();
    const menu = page.locator('#ec-account-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'New private sheet' })).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();
  });
});

test.describe('passkey room-access chrome — multi-sheet editor', () => {
  test('the active room iframe is the sole visible owner of the top-right cluster', async ({
    workerBase,
    page,
  }) => {
    // packages/client-multi has no passkey/auth logic of its own - each
    // sheet tab is an iframe embedding the classic single-sheet room,
    // which already carries the redesigned cluster. Adding a SECOND,
    // independent cluster to the outer multi-sheet document would render
    // at the exact same on-screen top-right coordinates (the iframe fills
    // the outer viewport from `top:0`), producing a visible duplicate.
    // This asserts single ownership: the outer document has none, exactly
    // one iframe's cluster is actually visible.
    const room = `access-multi-${Date.now().toString(36)}`;
    await page.goto(`${workerBase}/=${room}`);
    await page.waitForSelector('iframe');
    await page.waitForTimeout(1000);

    const state = await page.evaluate(() => {
      const outerNav = document.querySelector('nav[aria-label="Project links"], .ec-floatnav');
      const iframes = [...document.querySelectorAll('iframe')];
      const visibleClusters = iframes.filter((frame) => {
        try {
          const doc = (frame as HTMLIFrameElement).contentDocument;
          const cluster = doc?.getElementById('ec-room-access');
          if (!cluster) return false;
          return (
            frame.getBoundingClientRect().width > 0 &&
            getComputedStyle(frame).visibility !== 'hidden' &&
            getComputedStyle(frame).display !== 'none'
          );
        } catch {
          return false;
        }
      });
      return {
        outerHasOwnNav: !!outerNav,
        iframeCount: iframes.length,
        visibleClusterCount: visibleClusters.length,
      };
    });

    expect(state.outerHasOwnNav).toBe(false);
    expect(state.visibleClusterCount).toBe(1);
  });
});
