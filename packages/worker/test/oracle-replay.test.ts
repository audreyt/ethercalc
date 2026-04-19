import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';
import { dispatchMatcher } from '@ethercalc/oracle-harness/matchers';

import worker from '../src/index.ts';

/**
 * Oracle replay for Phase 4 stateless routes.
 *
 * Loads recorded scenarios from `tests/oracle/recorded/**` (eagerly
 * bundled via Vite's `import.meta.glob`) and replays them against
 * `worker.fetch()` inside workerd. No external URL, no `wrangler dev`,
 * no docker oracle — just the fixture JSON vs the new Worker's
 * in-isolate response.
 *
 * The fixtures were captured against the docker oracle pinned at commit
 * `042b731` (pre-rewrite). Scenarios that depend on Workers Assets or
 * the room CRUD layer (Phase 5) are expected to fail here — we assert
 * the subset of stateless redirects and blocked paths that Phase 4
 * owns. The deferred scenarios are listed in FINDINGS.md.
 *
 * This file intentionally does NOT pull in the oracle-harness
 * `headers.ts` / `replay.ts` modules directly — those import
 * `node:fs/promises` which isn't in workerd. Instead we open-code the
 * small diff helpers below. The body matcher (`dispatchMatcher`) is
 * pure, so we import it from the harness for consistency.
 */

interface RecordedFile {
  readonly scenario: HttpScenario;
}

/**
 * Vite's `import.meta.glob` isn't in the `@cloudflare/*` ambient types,
 * so we redeclare the shape we use locally. Narrow enough not to leak
 * into other files — this is scoped via `ImportMetaGlob` below.
 */
interface ImportMetaGlob {
  glob(
    pattern: string,
    opts: { eager: true; import: 'default' },
  ): Record<string, unknown>;
}

// Vite eagerly bundles every recorded fixture as a module that default-
// exports the parsed JSON. Works in every pool that runs under Vite
// (including vitest-pool-workers). Resolved at build time.
const MODULES = (import.meta as unknown as ImportMetaGlob).glob(
  '../../../tests/oracle/recorded/**/*.json',
  { eager: true, import: 'default' },
) as Record<string, RecordedFile>;

/**
 * Mirror of oracle-harness `VOLATILE_HEADERS`, extended with a small
 * set of Express-static / platform-static implementation-detail headers
 * that aren't part of our compatibility contract:
 *
 *   - `accept-ranges`: Express emits `bytes` on every static file;
 *     Workers Assets doesn't advertise range support and the spec says
 *     the absence is equivalent to `none`. Not semantic.
 *   - `cache-control`: Express emits `public, max-age=0`; Workers Assets
 *     emits `public, max-age=0, must-revalidate`. Caching policy is a
 *     deployment knob tuned to the serving platform.
 *   - `last-modified`: already flagged "semi-volatile" in §4.4 (tied to
 *     docker image build mtime). Dropping here keeps fixtures portable
 *     across rebuilds.
 *   - `content-length`: Express pre-computes from the file, Workers
 *     Assets streams (no CL emitted). Body equivalence is asserted by
 *     the body matcher — CL would be a duplicate check, not a semantic
 *     one, and the lack of it is a transport-layer choice.
 */
const VOLATILE = new Set([
  'date',
  'server',
  'etag',
  'x-powered-by',
  'connection',
  'accept-ranges',
  'cache-control',
  'last-modified',
  'content-length',
]);

function normalizeHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (!VOLATILE.has(lower)) out[lower] = v;
  });
  return out;
}

/** Port of oracle-harness `matchHeaderValue` (supports `re:` prefix). */
function matchHeaderValue(expected: string, actual: string | undefined): boolean {
  if (actual === undefined) return false;
  if (expected.startsWith('re:')) return new RegExp(expected.slice(3)).test(actual);
  return expected === actual;
}

function diffHeaders(
  expected: Readonly<Record<string, string>>,
  actual: Readonly<Record<string, string>>,
): string | null {
  for (const [name, v] of Object.entries(expected)) {
    const lower = name.toLowerCase();
    // Expected volatile entries (e.g. content-length) are skipped — we
    // don't want the oracle's value to constrain us when the actual
    // side has been filtered out for the same reason.
    if (VOLATILE.has(lower)) continue;
    const actualValue = actual[lower];
    if (!matchHeaderValue(v, actualValue)) {
      return `header ${JSON.stringify(name)}: expected ${JSON.stringify(v)}, got ${JSON.stringify(actualValue)}`;
    }
  }
  return null;
}

async function replayAgainstWorker(scenario: HttpScenario): Promise<{
  readonly ok: boolean;
  readonly error?: string;
}> {
  if (!scenario.expect) return { ok: false, error: 'no `expect` recorded' };
  const req = new Request(`https://example.test${scenario.request.path}`, {
    method: scenario.request.method,
    redirect: 'manual',
    ...(scenario.request.headers ? { headers: { ...scenario.request.headers } } : {}),
  });
  const ctx = createExecutionContext();
  const res = await worker.fetch(req, env as never, ctx);
  await waitOnExecutionContext(ctx);

  if (res.status !== scenario.expect.status) {
    return { ok: false, error: `status: expected ${scenario.expect.status}, got ${res.status}` };
  }
  const actualHeaders = normalizeHeaders(res.headers);
  const headerErr = diffHeaders(scenario.expect.headers, actualHeaders);
  if (headerErr) return { ok: false, error: headerErr };
  const bodyBytes = new Uint8Array(await res.arrayBuffer());
  const matcher = scenario.expect.bodyMatcher ?? 'exact';
  const bodyErr = dispatchMatcher(matcher, {
    expectedBase64: scenario.expect.bodyBase64,
    actualBytes: bodyBytes,
  });
  if (bodyErr) return { ok: false, error: bodyErr };
  return { ok: true };
}

/**
 * Scenarios that Phase 4 (stateless), Phase 4.1/11 (curated assets),
 * and Phase 5 (room CRUD + index) are expected to pass. Everything
 * else in the recorded set depends on Phase 8 (exports) or needs
 * populated D1 (Phase 5.1).
 *
 * `static/get-favicon` is intentionally excluded: the legacy oracle
 * emits `Content-Type: text/html; charset=utf-8` for `.ico` bytes
 * (Express-static mime-table bug). Per §13 Q1 the rewrite corrects
 * this; the divergence is documented in FINDINGS.
 */
const PHASE5_EXPECTED_PASS = [
  // Phase 4 — stateless redirects + 404s
  'misc/get-new-redirect',
  'misc/get-edit-no-key-redirect',
  'misc/get-view-no-key-redirect',
  'misc/get-etc-foo-404',
  'misc/get-var-foo-404',
  // Phase 4.1/11 — curated assets
  'static/get-root-index',
  'static/get-start',
  'static/get-socialcalc-js',
  // Phase 5 — empty-state rooms index + nonexistent room lookups
  'misc/get-exists-unknown-room',
  'rooms-index/get-rooms-empty',
  'rooms-index/get-roomlinks-empty',
  'rooms-index/get-roomtimes-empty',
] as const;

describe('oracle replay — Phase 4 + 4.1/11 + 5 subset', () => {
  const scenarios: HttpScenario[] = Object.values(MODULES).map((m) => m.scenario);
  it('loaded recorded fixtures via import.meta.glob', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(PHASE5_EXPECTED_PASS.length);
  });

  for (const expectedName of PHASE5_EXPECTED_PASS) {
    it(`passes ${expectedName}`, async () => {
      const scenario = scenarios.find((s) => s.name === expectedName);
      expect(scenario, `scenario ${expectedName} not found in recorded/`).toBeDefined();
      const result = await replayAgainstWorker(scenario!);
      if (!result.ok) {
        throw new Error(`${expectedName}: ${result.error}`);
      }
    });
  }

  // Meta-check: with Phase 4 + 4.1/11 + 5 combined, we expect ≥12/13.
  // Only static/get-favicon is intentionally divergent (§13 Q1 fix).
  it('at least 12 of the recorded scenarios pass against the new worker', async () => {
    let pass = 0;
    for (const scenario of scenarios) {
      const r = await replayAgainstWorker(scenario);
      if (r.ok) pass++;
    }
    expect(pass).toBeGreaterThanOrEqual(12);
    expect(pass).toBeLessThanOrEqual(scenarios.length);
  });
});
