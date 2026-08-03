/**
 * Phase 9 — backwards-compat `/_timetrigger` HTTP endpoint (§6.1).
 *
 * Hosted deployments use Cloudflare Cron Triggers. Self-host operators may
 * still invoke this compatibility endpoint, but it performs email side
 * effects and therefore requires the same deployment-operator bearer token
 * as migration and PITR routes.
 *
 * Excluded from the Node coverage gate — exercised via a workers-pool
 * integration test (`test/timetrigger.test.ts`).
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { buildTimetriggerBody, toEpochMinutes } from '../lib/cron.ts';
import { verifyMigrateToken } from '../lib/migrate-auth.ts';
import { runScheduled } from '../scheduled.ts';
import type { EtherCalcHonoEnv } from '../env.ts';

const JSON_CT = 'application/json; charset=utf-8';
const TEXT_CT = 'text/plain; charset=utf-8';

/**
 * Register `GET /_timetrigger`. Match the legacy 200 JSON body shape:
 * a hash of `<room>!<cell>` keyed to comma-separated remaining fire_at
 * values (in epoch minutes) — i.e. the state AFTER due rows have been
 * pruned and fired.
 */
export function registerTimetrigger(app: Hono<EtherCalcHonoEnv>): void {
  app.get('/_timetrigger', async (c) => {
    const verdict = verifyMigrateToken(
      c.env.ETHERCALC_MIGRATE_TOKEN,
      c.req.header('Authorization') ?? null,
    );
    if (verdict.kind === 'disabled') {
      return c.text('Not Found', 404, { 'Content-Type': TEXT_CT });
    }
    if (verdict.kind !== 'ok') {
      return c.text('Unauthorized', 401, { 'Content-Type': TEXT_CT });
    }
    const nowMinutes = toEpochMinutes(Date.now());
    const { keep } = await runScheduled({ env: c.env, nowMinutes });
    const body = buildTimetriggerBody(keep);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': JSON_CT },
    });
  });
}
