/**
 * Real WebAuthn passkey + private-room authorization coverage.
 *
 * Every other passkey spec (`passkey-room-access.spec.ts`) stubs
 * `/_auth/whoami`, `/_/:room/access`, and the ceremony endpoints via
 * `page.route()` — necessary because `workerBase` boots wrangler with
 * wrangler.toml's production WebAuthn trust anchors
 * (`ETHERCALC_RP_ID=ethercalc.net`, `ETHERCALC_ORIGIN=https://ethercalc.net`),
 * which can never validate a ceremony performed against a
 * `127.0.0.1`/`localhost` origin.
 *
 * This spec uses the `authWorkerBase` fixture instead (see
 * `src/fixtures.ts`): a SECOND `wrangler dev` instance booted with
 * `ETHERCALC_RP_ID=localhost` / `ETHERCALC_ORIGIN=http://localhost:<port>`,
 * matching Playwright's own navigation origin. Combined with a real
 * Chromium CDP virtual authenticator (`WebAuthn.addVirtualAuthenticator`),
 * every ceremony below is genuine: `navigator.credentials.create()` /
 * `.get()` run for real, AuthDO's `verifyRegistrationResponse` /
 * `verifyAuthenticationResponse` actually verify them, and every
 * `/_auth/*`, `/_/:room/access`, `/_/:room`, and `/_ws/:room` response
 * comes from the live Worker + RoomDO — nothing is mocked.
 *
 * Coverage (RoomDO is the sole authz boundary per AGENTS.md decision #12):
 *   - register a real passkey and create/use a private room in one flow
 *   - owner write (real keyboard edit, persisted through RoomDO)
 *   - anonymous read + write denial at the HTTP boundary (403)
 *   - anonymous denial in the UI (`#ec-private-gate`)
 *   - native WS admission (owner) and denial (anonymous) at `/_ws/:room`
 *   - logout denial (owner's own session, post sign-out)
 *   - discoverable (usernameless) re-login restoring owner access
 *   - a second, distinct real passkey identity denied on someone else's
 *     private room (HTTP read/write + native WS), representing the
 *     "denied" authenticated-but-unauthorized state
 *
 * NOT covered: a genuine read-only "viewer" ACL state. `POST /_/private`
 * always seeds `{readers: [], writers: []}` and there is currently no
 * HTTP-reachable route to add a reader/writer to an existing private
 * room's ACL (sharing/ACL-editing UI is a known follow-up — AGENTS.md
 * decision #12 / session log). `decideMount()` already has a
 * `private-readable-viewonly` UI branch ready for when that route lands.
 */
import type { Page } from '@playwright/test';

import { authTest as test, expect } from '../src/fixtures.ts';

// ─── Real CDP virtual authenticator ────────────────────────────────────────

/**
 * Installs a REAL Chromium CDP virtual authenticator on `page`'s browsing
 * context. `hasResidentKey`/`hasUserVerification`/`isUserVerified` are all
 * explicit because AuthDO's registration options require
 * `residentKey: 'required'` + `userVerification: 'required'`
 * (`auth-do.ts#registerInit`), and login is discoverable/usernameless
 * (`auth-do.ts#loginInit` sends no `allowCredentials`) — both need a
 * resident-key-capable, UV-satisfying authenticator or the real ceremony
 * fails closed exactly like it would against a real security key that
 * lacks those capabilities.
 */
async function addVirtualAuthenticator(page: Page): Promise<void> {
  const client = await page.context().newCDPSession(page);
  await client.send('WebAuthn.enable', { enableUI: false });
  await client.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

// ─── Type guards for real network JSON (no inline cast-and-access) ────────

interface WhoamiBody {
  readonly enabled: boolean;
  readonly uid: string | null;
}

function isWhoamiBody(value: unknown): value is WhoamiBody {
  return (
    !!value &&
    typeof value === 'object' &&
    'enabled' in value &&
    typeof value.enabled === 'boolean' &&
    'uid' in value &&
    (typeof value.uid === 'string' || value.uid === null)
  );
}

interface AccessVerdictBody {
  readonly isPrivate: boolean;
  readonly canRead: boolean;
  readonly canWrite: boolean;
}

function isAccessVerdictBody(value: unknown): value is AccessVerdictBody {
  return (
    !!value &&
    typeof value === 'object' &&
    'isPrivate' in value &&
    typeof value.isPrivate === 'boolean' &&
    'canRead' in value &&
    typeof value.canRead === 'boolean' &&
    'canWrite' in value &&
    typeof value.canWrite === 'boolean'
  );
}

interface CellBody {
  readonly datavalue?: unknown;
}

function isCellBody(value: unknown): value is CellBody {
  return !!value && typeof value === 'object';
}

// ─── Small DOM/editor helpers (mirrors client-single-smoke.spec.ts) ───────

function roomFromUrl(url: string): string {
  const segment = new URL(url).pathname.split('/').filter(Boolean)[0];
  if (!segment) throw new Error(`no room segment in URL: ${url}`);
  return segment;
}

async function typeIntoCell(page: Page, coord: string, value: string): Promise<void> {
  const editorTable = page.locator('#tableeditor table').first();
  await expect(editorTable).toBeVisible({ timeout: 15_000 });
  await editorTable.click();
  await page.evaluate((cellCoord) => {
    // Well-known DOM global augmented at runtime by socialcalc.js/player.js
    // — same unchecked-cast-to-a-named-const pattern as
    // client-single-smoke.spec.ts; never read inline off the cast.
    const host = window as unknown as {
      SocialCalc?: {
        CurrentSpreadsheetControlObject?: {
          editor?: { MoveECell: (coord: string) => string };
        };
        KeyboardFocus?: () => void;
      };
    };
    const sc = host.SocialCalc;
    const editor = sc?.CurrentSpreadsheetControlObject?.editor;
    if (!editor || !sc?.KeyboardFocus) throw new Error('SocialCalc editor not ready');
    editor.MoveECell(cellCoord);
    sc.KeyboardFocus();
  }, coord);
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

/**
 * Opens a REAL native `/_ws/:room` WebSocket from inside `page`'s own
 * browsing context — same-origin, so the browser attaches whatever
 * session cookie (if any) is currently set, exactly like the production
 * client does. Resolves `'open'` if the upgrade succeeds, `'denied'` if
 * the socket closes/errors/never opens within the guard window (RoomDO's
 * pre-dispatch gate returns a plain 403 *before* the 101 upgrade for an
 * unauthorized private-room request — see `room.ts#fetch`).
 */
async function wsAdmission(page: Page, base: string, room: string): Promise<'open' | 'denied'> {
  const wsUrl = `${base.replace(/^http/, 'ws')}/_ws/${encodeURIComponent(room)}`;
  return page.evaluate((url) => {
    return new Promise<'open' | 'denied'>((resolveOutcome) => {
      let settled = false;
      const settle = (outcome: 'open' | 'denied'): void => {
        if (settled) return;
        settled = true;
        resolveOutcome(outcome);
      };
      const socket = new WebSocket(url);
      const guard = setTimeout(() => {
        try {
          socket.close();
        } catch {
          // already closed
        }
        settle('denied');
      }, 5000);
      socket.addEventListener('open', () => {
        clearTimeout(guard);
        socket.close();
        settle('open');
      });
      socket.addEventListener('close', () => {
        clearTimeout(guard);
        settle('denied');
      });
    });
  }, wsUrl);
}

test.describe('real passkey + private-room authorization', () => {
  test('registers a real passkey, creates/uses a private room, and enforces owner write, anonymous HTTP+WS denial, logout denial, and discoverable re-login', async ({
    authWorkerBase,
    page,
    browser,
  }) => {
    test.setTimeout(90_000);

    await page.goto(`${authWorkerBase}/_start`);
    await addVirtualAuthenticator(page);

    // "Create private sheet" while signed out opens the passkey dialog
    // first (`onAuthenticated: () => newPrivateSheet(host)`), so one real
    // registration ceremony covers "register a passkey" AND "create a
    // private room" in a single, realistic user action.
    await page.getByRole('button', { name: 'Create private sheet' }).click();
    const dialog = page.locator('#ec-passkey-dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Create a new passkey' }).click();

    await page.waitForURL(/\/[^/]+\/edit$/, { timeout: 15_000 });
    const room = roomFromUrl(page.url());
    expect(room.length).toBeGreaterThan(0);
    await expect(page.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });

    // The ceremony actually round-tripped through the real AuthDO: whoami
    // now reports a genuine uid, not a mocked one.
    const whoamiRaw: unknown = await (await page.request.get(`${authWorkerBase}/_auth/whoami`)).json();
    if (!isWhoamiBody(whoamiRaw)) throw new Error('malformed /_auth/whoami body');
    expect(whoamiRaw.enabled).toBe(true);
    expect(whoamiRaw.uid).not.toBeNull();
    const ownerUid = whoamiRaw.uid;

    // ─── Owner write ──────────────────────────────────────────────────
    await typeIntoCell(page, 'A1', 'owner write');
    await expect
      .poll(async () => {
        const res = await page.request.get(`${authWorkerBase}/_/${room}/cells/A1`);
        if (res.status() !== 200) return null;
        const raw: unknown = await res.json();
        return isCellBody(raw) ? (raw.datavalue ?? null) : null;
      }, { timeout: 10_000 })
      .toBe('owner write');

    const ownerAccessRaw: unknown = await (
      await page.request.get(`${authWorkerBase}/_/${room}/access`)
    ).json();
    if (!isAccessVerdictBody(ownerAccessRaw)) throw new Error('malformed access verdict body');
    expect(ownerAccessRaw).toEqual({ isPrivate: true, canRead: true, canWrite: true });

    // ─── Native WS admission (owner) ─────────────────────────────────
    expect(await wsAdmission(page, authWorkerBase, room)).toBe('open');

    // ─── Anonymous denial — fresh context, zero cookies ──────────────
    const anonContext = await browser.newContext();
    try {
      const anonPage = await anonContext.newPage();
      await anonPage.goto(`${authWorkerBase}/${room}`);

      const gate = anonPage.locator('#ec-private-gate');
      await expect(gate).toBeVisible();
      await expect(gate).toContainText('A shared link alone does not grant access.');
      await expect(anonPage.locator('#tableeditor')).toBeHidden();

      const anonRead = await anonPage.request.get(`${authWorkerBase}/_/${room}`);
      expect(anonRead.status()).toBe(403);

      const anonWrite = await anonPage.request.post(`${authWorkerBase}/_/${room}`, {
        data: 'set A2 text t denied-write',
        headers: { 'content-type': 'text/plain' },
      });
      expect([401, 403]).toContain(anonWrite.status());

      expect(await wsAdmission(anonPage, authWorkerBase, room)).toBe('denied');
    } finally {
      await anonContext.close();
    }

    // The anonymous write attempt must not have landed.
    const afterAnonRes = await page.request.get(`${authWorkerBase}/_/${room}/cells/A2`);
    expect(afterAnonRes.status()).toBe(200);
    const afterAnonRaw: unknown = await afterAnonRes.json();
    const afterAnonCell = isCellBody(afterAnonRaw) ? (afterAnonRaw.datavalue ?? null) : null;
    expect(afterAnonCell).not.toBe('denied-write');

    // ─── Logout denial (same owner session) ──────────────────────────
    await page.locator('#ec-account-trigger').click();
    const accountMenu = page.locator('#ec-account-menu');
    await expect(accountMenu).toBeVisible();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      accountMenu.getByRole('menuitem', { name: 'Sign out' }).click(),
    ]);

    await expect(page.locator('#ec-private-gate')).toContainText(
      'A shared link alone does not grant access.',
    );
    await expect(page.locator('#tableeditor')).toBeHidden();

    const loggedOutRead = await page.request.get(`${authWorkerBase}/_/${room}`);
    expect(loggedOutRead.status()).toBe(403);

    // ─── Discoverable (usernameless) re-login restores owner access ──
    const gateAfterLogout = page.locator('#ec-private-gate');
    await gateAfterLogout.getByRole('button', { name: 'Use a passkey' }).click();
    const loginDialog = page.locator('#ec-passkey-dialog');
    await expect(loginDialog).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/[^/]+\/edit$/, { timeout: 15_000 }),
      loginDialog.getByRole('button', { name: 'Try passkey sign-in' }).click(),
    ]);

    await expect(page.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });

    const restoredWhoamiRaw: unknown = await (
      await page.request.get(`${authWorkerBase}/_auth/whoami`)
    ).json();
    if (!isWhoamiBody(restoredWhoamiRaw)) throw new Error('malformed /_auth/whoami body');
    expect(restoredWhoamiRaw.uid).toBe(ownerUid);

    const restoredAccessRaw: unknown = await (
      await page.request.get(`${authWorkerBase}/_/${room}/access`)
    ).json();
    if (!isAccessVerdictBody(restoredAccessRaw)) throw new Error('malformed access verdict body');
    expect(restoredAccessRaw).toEqual({ isPrivate: true, canRead: true, canWrite: true });

    // Prove write access is genuinely restored, not just the verdict.
    await typeIntoCell(page, 'A3', 'restored after re-login');
    await expect
      .poll(async () => {
        const res = await page.request.get(`${authWorkerBase}/_/${room}/cells/A3`);
        if (res.status() !== 200) return null;
        const raw: unknown = await res.json();
        return isCellBody(raw) ? (raw.datavalue ?? null) : null;
      }, { timeout: 10_000 })
      .toBe('restored after re-login');
  });

  test('a second, distinct real passkey identity is denied HTTP and native-WS access to another account’s private room', async ({
    authWorkerBase,
    page,
    browser,
  }) => {
    test.setTimeout(60_000);

    // Identity #1 (owner) — throwaway context, its own virtual
    // authenticator, closed once the room exists so nothing below could
    // accidentally reuse its session.
    const ownerContext = await browser.newContext();
    let room: string;
    try {
      const ownerPage = await ownerContext.newPage();
      await ownerPage.goto(`${authWorkerBase}/_start`);
      await addVirtualAuthenticator(ownerPage);
      await ownerPage.getByRole('button', { name: 'Create private sheet' }).click();
      await ownerPage
        .locator('#ec-passkey-dialog')
        .getByRole('button', { name: 'Create a new passkey' })
        .click();
      await ownerPage.waitForURL(/\/[^/]+\/edit$/, { timeout: 15_000 });
      room = roomFromUrl(ownerPage.url());
      await expect(ownerPage.locator('#tableeditor table').first()).toBeVisible({
        timeout: 15_000,
      });
    } finally {
      await ownerContext.close();
    }

    // Identity #2 — distinct real passkey (its own virtual authenticator,
    // its own resident credential, its own uid), on the shared `page`
    // fixture's own context.
    await page.goto(`${authWorkerBase}/_start`);
    await addVirtualAuthenticator(page);
    await page.getByRole('button', { name: 'Use a passkey' }).click();
    const dialog = page.locator('#ec-passkey-dialog');
    await expect(dialog).toBeVisible();
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load' }),
      dialog.getByRole('button', { name: 'Create a new passkey' }).click(),
    ]);

    const secondWhoamiRaw: unknown = await (
      await page.request.get(`${authWorkerBase}/_auth/whoami`)
    ).json();
    if (!isWhoamiBody(secondWhoamiRaw)) throw new Error('malformed /_auth/whoami body');
    expect(secondWhoamiRaw.enabled).toBe(true);
    expect(secondWhoamiRaw.uid).not.toBeNull();

    // Identity #2 has never been granted access to identity #1's room.
    await page.goto(`${authWorkerBase}/${room}`);
    const gate = page.locator('#ec-private-gate');
    await expect(gate).toBeVisible();
    await expect(gate).toContainText('This account does not have access to this sheet.');
    await expect(gate.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.locator('#tableeditor')).toBeHidden();

    const readRes = await page.request.get(`${authWorkerBase}/_/${room}`);
    expect(readRes.status()).toBe(403);

    const writeRes = await page.request.post(`${authWorkerBase}/_/${room}`, {
      data: 'set A9 text t nope',
      headers: { 'content-type': 'text/plain' },
    });
    expect([401, 403]).toContain(writeRes.status());

    expect(await wsAdmission(page, authWorkerBase, room)).toBe('denied');
  });
});
