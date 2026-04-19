/**
 * `GET /_new` and `GET /=_new` — redirect to a freshly-minted room id.
 *
 * Legacy (src/main.ls:91-96):
 *   - `/=_new` → `/=<room>/edit` if KEY set, else `/=<room>`
 *   - `/_new` → `/<room>/edit` if KEY set, else `/<room>`
 *
 * Pure-logic slice; the Hono glue wraps this with `c.redirect(url, 302)`.
 * Tests assert the `Location` shape.
 */
import { generateRoomId } from '../lib/room-name.ts';

/** Shape of a redirect that Hono can turn into an actual `Response`. */
export interface RedirectInfo {
  readonly status: 302;
  readonly headers: {
    readonly Location: string;
  };
}

export interface BuildNewRoomRedirectOpts {
  readonly basepath?: string;
  readonly hasKey: boolean;
  /** true for `/=_new` (multi-sheet), false for `/_new` (single-sheet). */
  readonly multi: boolean;
  /** Injectable for determinism in tests. Defaults to `generateRoomId`. */
  readonly idGen?: () => string;
}

export function buildNewRoomRedirect(opts: BuildNewRoomRedirectOpts): RedirectInfo {
  const room = (opts.idGen ?? generateRoomId)();
  const basepath = opts.basepath ?? '';
  const prefix = opts.multi ? '=' : '';
  const tail = opts.hasKey ? '/edit' : '';
  return {
    status: 302,
    headers: {
      Location: `${basepath}/${prefix}${room}${tail}`,
    },
  };
}
