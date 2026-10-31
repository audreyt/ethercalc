/**
 * `GET /_new` and `GET /=_new` — redirect to a freshly-minted room id.
 *
 * A keyed deployment places the edit capability in the redirect for the
 * newly generated name. Other room entry routes never mint one.
 *
 * Pure-logic slice; the Hono glue wraps this with `c.redirect(url, 302)`.
 * Tests assert the `Location` shape.
 */
import { computeAuth } from '../lib/auth.ts';
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
  readonly key?: string | undefined;
  /** true for `/=_new` (multi-sheet), false for `/_new` (single-sheet). */
  readonly multi: boolean;
  /** Injectable for determinism in tests. Defaults to `generateRoomId`. */
  readonly idGen?: () => string;
}

export async function buildNewRoomRedirect(opts: BuildNewRoomRedirectOpts): Promise<RedirectInfo> {
  const room = (opts.idGen ?? generateRoomId)();
  const basepath = opts.basepath ?? '';
  const prefix = opts.multi ? '=' : '';
  const name = `${prefix}${room}`;
  const tail = opts.key ? `?auth=${await computeAuth(opts.key, name)}` : '';
  return {
    status: 302,
    headers: {
      Location: `${basepath}/${name}${tail}`,
    },
  };
}
