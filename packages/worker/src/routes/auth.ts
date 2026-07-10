/**
 * `/_auth/*` — passkey ceremony routes (Phase A).
 *
 * Thin glue between the browser and the singleton AuthDO: ceremony
 * bodies are forwarded verbatim (the DO validates them), and the opaque
 * session token minted on completion becomes an HttpOnly `ec_sess`
 * cookie — it never appears in a response body, so page-level XSS
 * cannot lift it.
 *
 * Excluded from the Node coverage gate like every `routes/*.ts` file
 * (workerd istanbul cannot trace Hono's bundled dispatch); behavioral
 * coverage lives in `test/routes-auth.node.test.ts`.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { flagEnabled } from '../lib/room-index-access.ts';
import { getSessionPrincipal } from '../lib/session-middleware.ts';
import {
  SESSION_COOKIE_NAME,
  createSessionCookie,
} from '../lib/session.ts';
import type { Env, EtherCalcHonoEnv } from '../env.ts';

const AUTH_DO_HOST = 'https://auth.local';

/**
 * Auth is live only when the feature flag, the DO binding, AND the
 * WebAuthn trust anchors are all configured — a partially configured
 * deployment must look like the feature does not exist.
 */
function authEnabled(env: Env): boolean {
  return (
    flagEnabled(env.ETHERCALC_AUTH) &&
    env.AUTH !== undefined &&
    typeof env.ETHERCALC_RP_ID === 'string' &&
    env.ETHERCALC_RP_ID.length > 0 &&
    typeof env.ETHERCALC_ORIGIN === 'string' &&
    env.ETHERCALC_ORIGIN.length > 0
  );
}

/** Forward one ceremony step to the singleton AuthDO. */
async function dispatchCeremony(
  env: Env,
  path: string,
  body: string,
): Promise<Response> {
  const namespace = env.AUTH;
  /* istanbul ignore next -- guarded by authEnabled at every callsite */
  if (!namespace) return new Response('Not Found', { status: 404 });
  const stub = namespace.get(namespace.idFromName('auth'));
  return stub.fetch(`${AUTH_DO_HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

export function registerAuth(app: Hono<EtherCalcHonoEnv>): void {
  // Ceremony initiation — the DO's JSON (options + uid) passes through
  // untouched; there is no session yet, so no cookie.
  for (const step of ['register-init', 'login-init'] as const) {
    app.post(`/_auth/${step}`, async (c) => {
      if (!authEnabled(c.env)) return c.text('Not Found', 404);
      const res = await dispatchCeremony(
        c.env,
        `/_auth/${step}`,
        await c.req.text(),
      );
      return new Response(res.body, res);
    });
  }
  // Ceremony completion — on success the DO returns `{uid, session}`;
  // the token is moved into the HttpOnly cookie and only `{uid}` is
  // echoed to the page.
  for (const step of ['register-complete', 'login-complete'] as const) {
    app.post(`/_auth/${step}`, async (c) => {
      if (!authEnabled(c.env)) return c.text('Not Found', 404);
      const res = await dispatchCeremony(
        c.env,
        `/_auth/${step}`,
        await c.req.text(),
      );
      if (!res.ok) return new Response(res.body, res);
      const body: unknown = await res.json();
      if (
        body === null ||
        typeof body !== 'object' ||
        !('uid' in body) ||
        typeof body.uid !== 'string' ||
        !('session' in body) ||
        typeof body.session !== 'string'
      ) {
        return c.text('Auth ceremony failed', 502);
      }
      return new Response(JSON.stringify({ uid: body.uid }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': createSessionCookie(body.session),
        },
      });
    });
  }
  // Session state probe for the client UI. Always answers — `enabled`
  // tells the client whether to render passkey affordances at all, and
  // a disabled deployment simply reports anonymous.
  app.get('/_auth/whoami', async (c) => {
    const enabled = authEnabled(c.env);
    const principal = enabled ? await getSessionPrincipal(c) : null;
    return c.json({ uid: principal?.uid ?? null, enabled });
  });
  // Logout is purely a cookie clear — AuthDO sessions are stateless
  // HMAC tokens, so there is nothing server-side to revoke in Phase A.
  app.post('/_auth/logout', () => {
    return new Response(null, {
      status: 204,
      headers: {
        'Set-Cookie': `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  });
}
