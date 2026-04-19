/**
 * EtherCalc Worker entry point. HTTP routing lives in Hono; pure request-
 * handling logic lives in `./handlers/`. This file is intentionally tiny
 * glue — it's excluded from the 100% coverage gate (see `vitest.config.ts`)
 * because istanbul inside `@cloudflare/vitest-pool-workers` doesn't track
 * hits through Hono's bundled invocation path (see CLAUDE.md §5.2).
 */
/* istanbul ignore file */
import { Hono } from 'hono';

import { buildHealthBody } from './handlers/health.ts';
import type { Env } from './env.ts';

export { RoomDO } from './room.ts';

export function buildApp(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();
  app.get('/_health', (c) => c.json(buildHealthBody()));
  return app;
}

export default buildApp();
