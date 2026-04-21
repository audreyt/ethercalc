/**
 * Node-gated tests for the migration helpers:
 *   - `src/handlers/migrate.ts::parseSeedPayload` — payload validation.
 *   - `src/lib/migrate-auth.ts::verifyMigrateToken` — bearer-token gate.
 *
 * Both modules are 100% coverage-required; these tests exercise every
 * rejection branch plus the happy path. The workers-pool end-to-end
 * suite (`test/migrate.test.ts`) proves the full dispatch through the
 * Hono route into the DO.
 */
import { describe, it, expect } from 'vitest';

import { parseSeedPayload } from '../src/handlers/migrate.ts';
import { verifyMigrateToken } from '../src/lib/migrate-auth.ts';

describe('parseSeedPayload', () => {
  const NOW = 1_700_000_000_000;
  const now = (): number => NOW;

  it('fills every optional field with defaults for an empty object', () => {
    const r = parseSeedPayload({}, now);
    if (!r.ok) throw new Error(r.error);
    expect(r.value).toEqual({
      snapshot: '',
      log: [],
      audit: [],
      chat: [],
      ecell: {},
      updatedAt: NOW,
    });
  });

  it('preserves a full well-formed payload', () => {
    const r = parseSeedPayload(
      {
        snapshot: 'socialcalc:v1',
        log: ['cmd-1'],
        audit: ['cmd-1'],
        chat: ['hi'],
        ecell: { alice: 'A1' },
        updatedAt: 42,
      },
      now,
    );
    if (!r.ok) throw new Error(r.error);
    expect(r.value.snapshot).toBe('socialcalc:v1');
    expect(r.value.log).toEqual(['cmd-1']);
    expect(r.value.audit).toEqual(['cmd-1']);
    expect(r.value.chat).toEqual(['hi']);
    expect(r.value.ecell).toEqual({ alice: 'A1' });
    expect(r.value.updatedAt).toBe(42);
  });

  it('rejects null body', () => {
    const r = parseSeedPayload(null, now);
    expect(r).toEqual({ ok: false, error: 'body must be a JSON object' });
  });

  it('rejects non-object body (array)', () => {
    const r = parseSeedPayload([], now);
    expect(r).toEqual({ ok: false, error: 'body must be a JSON object' });
  });

  it('rejects non-object body (primitive)', () => {
    const r = parseSeedPayload('a string', now);
    expect(r).toEqual({ ok: false, error: 'body must be a JSON object' });
  });

  it('rejects non-string snapshot', () => {
    const r = parseSeedPayload({ snapshot: 123 }, now);
    expect(r).toEqual({ ok: false, error: 'snapshot must be a string' });
  });

  it('rejects non-array log', () => {
    const r = parseSeedPayload({ log: 'nope' }, now);
    expect(r).toEqual({ ok: false, error: 'log must be a string[]' });
  });

  it('rejects log array containing a non-string', () => {
    const r = parseSeedPayload({ log: ['ok', 7] }, now);
    expect(r).toEqual({ ok: false, error: 'log must be a string[]' });
  });

  it('rejects non-array audit', () => {
    const r = parseSeedPayload({ audit: {} }, now);
    expect(r).toEqual({ ok: false, error: 'audit must be a string[]' });
  });

  it('rejects audit array containing a non-string', () => {
    const r = parseSeedPayload({ audit: [null] }, now);
    expect(r).toEqual({ ok: false, error: 'audit must be a string[]' });
  });

  it('rejects non-array chat', () => {
    const r = parseSeedPayload({ chat: 1 }, now);
    expect(r).toEqual({ ok: false, error: 'chat must be a string[]' });
  });

  it('rejects chat array containing a non-string', () => {
    const r = parseSeedPayload({ chat: [{}] }, now);
    expect(r).toEqual({ ok: false, error: 'chat must be a string[]' });
  });

  it('rejects non-object ecell', () => {
    const r = parseSeedPayload({ ecell: 'x' }, now);
    expect(r).toEqual({
      ok: false,
      error: 'ecell must be Record<string, string>',
    });
  });

  it('rejects null ecell', () => {
    const r = parseSeedPayload({ ecell: null }, now);
    expect(r).toEqual({
      ok: false,
      error: 'ecell must be Record<string, string>',
    });
  });

  it('rejects array ecell', () => {
    const r = parseSeedPayload({ ecell: [] }, now);
    expect(r).toEqual({
      ok: false,
      error: 'ecell must be Record<string, string>',
    });
  });

  it('rejects ecell value that is not a string', () => {
    const r = parseSeedPayload({ ecell: { alice: 1 } }, now);
    expect(r).toEqual({
      ok: false,
      error: 'ecell must be Record<string, string>',
    });
  });

  it('rejects empty ecell user key', () => {
    const r = parseSeedPayload({ ecell: { '': 'A1' } }, now);
    expect(r).toEqual({ ok: false, error: 'ecell keys must be non-empty' });
  });

  it('rejects non-finite updatedAt', () => {
    const r = parseSeedPayload({ updatedAt: Number.NaN }, now);
    expect(r).toEqual({ ok: false, error: 'updatedAt must be a finite number' });
  });

  it('rejects string updatedAt', () => {
    const r = parseSeedPayload({ updatedAt: '42' }, now);
    expect(r).toEqual({ ok: false, error: 'updatedAt must be a finite number' });
  });

  it('accepts updatedAt=0 (legacy rooms with no recorded timestamp)', () => {
    const r = parseSeedPayload({ updatedAt: 0 }, now);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.updatedAt).toBe(0);
  });

  it('accepts an empty snapshot by coercing it to `""`', () => {
    const r = parseSeedPayload({ snapshot: '' }, now);
    if (!r.ok) throw new Error(r.error);
    expect(r.value.snapshot).toBe('');
  });
});

describe('verifyMigrateToken', () => {
  it('disabled when token env var is undefined', () => {
    expect(verifyMigrateToken(undefined, 'Bearer anything')).toEqual({
      kind: 'disabled',
    });
  });

  it('disabled when token env var is empty', () => {
    expect(verifyMigrateToken('', 'Bearer anything')).toEqual({
      kind: 'disabled',
    });
  });

  it('disabled when token env var is whitespace', () => {
    expect(verifyMigrateToken('   ', 'Bearer anything')).toEqual({
      kind: 'disabled',
    });
  });

  it('missing when no Authorization header', () => {
    expect(verifyMigrateToken('secret', null)).toEqual({ kind: 'missing' });
  });

  it('missing when Authorization is not a Bearer', () => {
    expect(verifyMigrateToken('secret', 'Basic deadbeef')).toEqual({
      kind: 'missing',
    });
  });

  it('bad when token value is wrong', () => {
    expect(verifyMigrateToken('secret', 'Bearer wrong')).toEqual({
      kind: 'bad',
    });
  });

  it('bad when tokens share a prefix but differ in length', () => {
    // Triggers the length-difference short-circuit in the constant-time
    // comparator — covers the `a.length !== b.length` branch.
    expect(verifyMigrateToken('secret', 'Bearer secre')).toEqual({
      kind: 'bad',
    });
  });

  it('ok when token matches exactly', () => {
    expect(verifyMigrateToken('secret', 'Bearer secret')).toEqual({
      kind: 'ok',
    });
  });

  it('ignores surrounding whitespace in the configured token', () => {
    expect(verifyMigrateToken('  secret  ', 'Bearer secret')).toEqual({
      kind: 'ok',
    });
  });
});
