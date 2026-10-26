/**
 * Session guard: edits made while a passkey session is about to end must be
 * held in the tab, never silently dropped, and saved after an in-place
 * sign-in.
 *
 * Real WebAuthn ceremonies against `authWorkerBase` (see
 * passkey-webauthn-real.spec.ts). Only `/_auth/whoami` is intercepted, to
 * report a session that ends in a minute; the RoomDO, AuthDO and WebSocket
 * are live. The reactive path (a revoked session closing the socket) is
 * covered by session-guard unit tests: reaching it here would mean waiting
 * out RoomDO's session-verify cache.
 */
import type { Page } from '@playwright/test';

import { authTest as test, expect } from '../src/fixtures.ts';

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

async function typeIntoCell(page: Page, coord: string, value: string): Promise<void> {
  const editorTable = page.locator('#tableeditor table').first();
  await expect(editorTable).toBeVisible({ timeout: 15_000 });
  await editorTable.click();
  await page.evaluate((cellCoord) => {
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

async function serverCell(page: Page, base: string, room: string, coord: string): Promise<unknown> {
  const res = await page.request.get(`${base}/_/${room}/cells/${coord}`);
  if (!res.ok()) return null;
  const body: unknown = await res.json();
  return body && typeof body === 'object' && 'datavalue' in body ? body.datavalue : null;
}

test.describe('session guard', () => {
  test('holds edits before the session ends and saves them after an in-place sign-in', async ({
    authWorkerBase,
    page,
  }) => {
    test.setTimeout(90_000);
    let sessionEnding = true;
    await page.context().route('**/_auth/whoami', async (route) => {
      if (!sessionEnding) return route.continue();
      const real: unknown = await (await route.fetch()).json();
      await route.fulfill({ json: { ...(real as object), expiresInMs: 60_000 } });
    });

    await page.goto(`${authWorkerBase}/_start`);
    await addVirtualAuthenticator(page);
    await page.getByRole('button', { name: 'Create private sheet' }).click();
    await page.locator('#ec-passkey-dialog').getByRole('button', { name: 'Create a new passkey' }).click();
    await page.waitForURL(/\/[^/]+\/edit$/, { timeout: 15_000 });
    const room = new URL(page.url()).pathname.split('/').filter(Boolean)[0]!;

    const banner = page.locator('#ec-session-banner');
    await expect(banner).toBeVisible({ timeout: 15_000 });
    await expect(banner).toHaveAttribute('role', 'alert');
    await expect(banner).toContainText('about to expire');

    await typeIntoCell(page, 'A1', 'held edit');
    const warnsOnUnload = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(warnsOnUnload).toBe(true);
    expect(await serverCell(page, authWorkerBase, room, 'A1')).not.toBe('held edit');

    sessionEnding = false;
    await banner.getByRole('button', { name: 'Sign in again' }).click();
    await expect(banner).toHaveCount(0, { timeout: 15_000 });
    await expect
      .poll(() => serverCell(page, authWorkerBase, room, 'A1'), { timeout: 15_000 })
      .toBe('held edit');

    await page.reload();
    await expect(page.locator('#tableeditor table').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#ec-session-banner')).toHaveCount(0);
    expect(await serverCell(page, authWorkerBase, room, 'A1')).toBe('held edit');
  });
});
