import { describe, it, expect } from 'vitest';

import { buildHealthBody } from '../src/handlers/health.ts';

describe('buildHealthBody (pure)', () => {
  it('returns status ok, fixed version, and injected timestamp', () => {
    const frozen = new Date('2026-04-19T12:00:00.000Z');
    expect(buildHealthBody(() => frozen)).toEqual({
      status: 'ok',
      version: '0.0.0',
      now: '2026-04-19T12:00:00.000Z',
    });
  });

  it('defaults nowFn to the real Date constructor', () => {
    const before = Date.now();
    const body = buildHealthBody();
    const after = Date.now();
    const reported = new Date(body.now).getTime();
    expect(reported).toBeGreaterThanOrEqual(before);
    expect(reported).toBeLessThanOrEqual(after);
  });
});
