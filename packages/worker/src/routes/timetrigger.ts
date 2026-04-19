/**
 * Phase 9 — backwards-compat `/_timetrigger` HTTP endpoint (§6.1).
 *
 * Legacy external cron pinged `GET /_timetrigger` once a minute. With
 * Cloudflare Cron Triggers that path is obsolete for hosted deploys,
 * but self-host users whose external cron still points at this URL
 * must keep working. We delegate to the same `runScheduled` helper
 * the cron handler uses, then respond with the legacy
 * `<room>!<cell>` → comma-separated-fire_at JSON shape.
 *
 * Excluded from the Node coverage gate — exercised via a workers-pool
 * integration test (`test/timetrigger.test.ts`).
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { buildTimetriggerBody, toEpochMinutes } from '../lib/cron.ts';
import { runScheduled } from '../scheduled.ts';
import type { Env } from '../env.ts';

const JSON_CT = 'application/json; charset=utf-8';

/**
 * Register `GET /_timetrigger`. Match the legacy 200 JSON body shape:
 * a hash of `<room>!<cell>` keyed to comma-separated remaining fire_at
 * values (in epoch minutes) — i.e. the state AFTER due rows have been
 * pruned and fired.
 */
export function registerTimetrigger(app: Hono<{ Bindings: Env }>): void {
  app.get('/_timetrigger', async (c) => {
    const nowMinutes = toEpochMinutes(Date.now());
    const { keep } = await runScheduled({ env: c.env, nowMinutes });
    const body = buildTimetriggerBody(keep);
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': JSON_CT },
    });
  });
}
