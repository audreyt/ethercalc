/**
 * `GET /:room/edit`, `/:room/view`, `/:room/app`, and `/:room` (entry).
 *
 * Legacy (src/main.ls:277-305):
 *   - `/:room/edit` → 302 `/<room>?auth=<hmac>`
 *   - `/:room/view` → 302 `/<room>?auth=<hmac>&view=1`
 *   - `/:room/app`  → 302 `/<room>?auth=<hmac>&app=1`
 *   - `/:room` when KEY set and `?auth` is missing → 302 `/<room>?auth=0`
 *   - `/:room` when KEY set and `?auth` present → serve `index.html`
 *   - `/:room` when no KEY → serve `index.html`
 *
 * Under no-KEY identity HMAC (see `auth.ts` + FINDINGS F-03), the `edit`
 * redirect becomes `?auth=<room>` — the oracle recording
 * `misc/get-edit-no-key-redirect.json` confirms this. We preserve it.
 *
 * Pure slice: returns a `RedirectInfo` for the three 302 paths and `null`
 * for `/:room` entry when the raw index page should be served. The Hono
 * glue either returns the redirect or hands off to the assets handler.
 */
import { computeAuth } from '../lib/auth.ts';
import { encodeRoom } from '../lib/room-name.ts';
import type { RedirectInfo } from './new-room.ts';

export type RoomMode = 'edit' | 'view' | 'app' | 'entry';

export interface BuildRoomRedirectOpts {
  readonly basepath?: string;
  readonly room: string;
  readonly mode: RoomMode;
  /** Undefined/empty → identity HMAC. */
  readonly key?: string;
  /**
   * Only consulted for `mode: 'entry'`. When KEY is set and no `auth` is
   * present, we 302 to `?auth=0`. Otherwise null → serve index.
   */
  readonly authQuery?: string | undefined;
}

/**
 * Returns a redirect to the 302 target, or `null` to mean "serve the
 * index page". The caller (Hono glue) handles the null by falling
 * through to the Workers Assets fetch for `index.html`.
 */
export async function buildRoomRedirect(
  opts: BuildRoomRedirectOpts,
): Promise<RedirectInfo | null> {
  const basepath = opts.basepath ?? '';
  const room = encodeRoom(opts.room);
  const base = `${basepath}/${room}`;
  switch (opts.mode) {
    case 'edit': {
      const auth = await computeAuth(opts.key, room);
      return { status: 302, headers: { Location: `${base}?auth=${auth}` } };
    }
    case 'view': {
      const auth = await computeAuth(opts.key, room);
      return { status: 302, headers: { Location: `${base}?auth=${auth}&view=1` } };
    }
    case 'app': {
      const auth = await computeAuth(opts.key, room);
      return { status: 302, headers: { Location: `${base}?auth=${auth}&app=1` } };
    }
    case 'entry': {
      // Legacy: no KEY → always serve index; KEY set → require ?auth=…
      // present (any length, per `@query.auth?length`) else 302 to
      // `?auth=0` (view-only sentinel). Note that legacy does NOT
      // validate the supplied auth here — that happens on the WS path.
      const keyed = !!opts.key;
      if (!keyed) return null;
      if (opts.authQuery !== undefined && opts.authQuery.length > 0) return null;
      return { status: 302, headers: { Location: `${base}?auth=0` } };
    }
  }
}
