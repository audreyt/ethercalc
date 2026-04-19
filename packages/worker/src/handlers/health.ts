/**
 * Health endpoint — pure logic decoupled from Hono so it can be unit-tested
 * in the main test isolate with full istanbul coverage tracking. The Hono
 * wiring in `src/index.ts` calls this and serializes the result.
 */
export interface HealthBody {
  status: 'ok';
  version: string;
  now: string;
}

export function buildHealthBody(nowFn: () => Date = () => new Date()): HealthBody {
  return {
    status: 'ok',
    version: '0.0.0',
    now: nowFn().toISOString(),
  };
}
