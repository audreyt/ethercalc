import type { BodyMatcher } from '@ethercalc/shared/oracle-scenarios';

import { canonicalizeHtml } from './html-canonical.ts';

/**
 * Body matchers used by `replay.ts`. Each matcher takes the expected
 * bytes (as base64) and the actual response body (as Uint8Array) and
 * returns `null` on success or a short explanation on failure.
 *
 * Phase 3 implements `exact`, `json`, `ignore`, and `scsave`. Phase 8a
 * adds `html` via linkedom; `xlsx` and `ods` follow in Phase 8b using
 * the same linkedom XML path plus fflate unzip. See §4.4 of CLAUDE.md
 * and the drop lists documented in `html-canonical.ts` (and, once it
 * lands, `zip-canonical.ts`).
 */
export type MatcherResult = string | null;

export interface MatcherContext {
  readonly expectedBase64: string | null;
  readonly actualBytes: Uint8Array;
}

/** Base64-decode into a Uint8Array (cross-runtime: browser + Node + workerd). */
export function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/** Base64-encode a Uint8Array. */
export function encodeBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

/** Byte-for-byte comparison. */
export function matchExact(ctx: MatcherContext): MatcherResult {
  if (ctx.expectedBase64 === null) return 'expected body is null but matcher is "exact"';
  const expected = decodeBase64(ctx.expectedBase64);
  if (expected.length !== ctx.actualBytes.length) {
    return `body length differs: expected ${expected.length} bytes, got ${ctx.actualBytes.length}`;
  }
  for (let i = 0; i < expected.length; i++) {
    if (expected[i] !== ctx.actualBytes[i]) {
      return `body differs at byte ${i}: expected ${expected[i]}, got ${ctx.actualBytes[i]}`;
    }
  }
  return null;
}

/** Parse both sides as JSON and deep-compare the resulting values. */
export function matchJson(ctx: MatcherContext): MatcherResult {
  if (ctx.expectedBase64 === null) return 'expected body is null but matcher is "json"';
  const dec = new TextDecoder();
  let expectedValue: unknown;
  let actualValue: unknown;
  try {
    expectedValue = JSON.parse(dec.decode(decodeBase64(ctx.expectedBase64)));
  } catch (err) {
    return `expected body is not valid JSON: ${(err as Error).message}`;
  }
  try {
    actualValue = JSON.parse(dec.decode(ctx.actualBytes));
  } catch (err) {
    return `actual body is not valid JSON: ${(err as Error).message}`;
  }
  return deepEqual(expectedValue, actualValue)
    ? null
    : `json mismatch: expected ${stableStringify(expectedValue)}, got ${stableStringify(actualValue)}`;
}

/**
 * SocialCalc save format comparison.
 *
 * The legacy server always embeds the current `socialcalc` library
 * version into a `version:N.N.N` line near the top; we ignore that
 * exact line so oracle upgrades don't invalidate every recording.
 * Everything else (sheet, cell, edit, copiedfrom, etc.) is compared
 * line-for-line after trimming trailing whitespace. Section ordering
 * is also loose — we sort the non-version lines so minor reordering
 * in metadata doesn't trip the diff (§4.4).
 */
export function matchScsave(ctx: MatcherContext): MatcherResult {
  if (ctx.expectedBase64 === null) return 'expected body is null but matcher is "scsave"';
  const dec = new TextDecoder();
  const expected = normalizeScsave(dec.decode(decodeBase64(ctx.expectedBase64)));
  const actual = normalizeScsave(dec.decode(ctx.actualBytes));
  if (expected === actual) return null;
  return `scsave mismatch:\n--- expected\n${expected}\n--- actual\n${actual}`;
}

function normalizeScsave(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !/^version:/i.test(line));
  return lines.sort().join('\n');
}

/** Ignore body entirely. Always passes. */
export function matchIgnore(_ctx: MatcherContext): MatcherResult {
  return null;
}

/**
 * Structural HTML matcher. Parses both sides with `linkedom`,
 * canonicalizes (drop whitespace-only text nodes, sort attributes,
 * strip volatile ids + dangling references, drop comments), and
 * byte-compares the serialized result.
 *
 * See `html-canonical.ts` for the complete rule set.
 */
export function matchHtml(ctx: MatcherContext): MatcherResult {
  if (ctx.expectedBase64 === null) return 'expected body is null but matcher is "html"';
  const dec = new TextDecoder();
  const expectedRaw = dec.decode(decodeBase64(ctx.expectedBase64));
  const actualRaw = dec.decode(ctx.actualBytes);
  let expected: string;
  let actual: string;
  try {
    expected = canonicalizeHtml(expectedRaw).canonical;
  } catch (err) {
    return `html parse error in expected body: ${(err as Error).message}`;
  }
  try {
    actual = canonicalizeHtml(actualRaw).canonical;
  } catch (err) {
    return `html parse error in actual body: ${(err as Error).message}`;
  }
  if (expected === actual) return null;
  return `html mismatch:\n--- expected\n${expected}\n--- actual\n${actual}`;
}

/** Structural XLSX matcher. Deferred to Phase 8b (after html lands). */
export function matchXlsx(_ctx: MatcherContext): MatcherResult {
  throw new Error('not implemented — Phase 8');
}

/** Structural ODS matcher. Deferred to Phase 8b (after html lands). */
export function matchOds(_ctx: MatcherContext): MatcherResult {
  throw new Error('not implemented — Phase 8');
}

/** Table of matcher functions keyed by `BodyMatcher` name. */
export const MATCHERS: Readonly<Record<BodyMatcher, (ctx: MatcherContext) => MatcherResult>> = {
  exact: matchExact,
  json: matchJson,
  scsave: matchScsave,
  ignore: matchIgnore,
  html: matchHtml,
  xlsx: matchXlsx,
  ods: matchOds,
};

/** Dispatch a body comparison to the right matcher. */
export function dispatchMatcher(matcher: BodyMatcher, ctx: MatcherContext): MatcherResult {
  return MATCHERS[matcher](ctx);
}

// ─── internal helpers ─────────────────────────────────────────────────────

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  if (Array.isArray(b)) return false;
  const ao = a as Record<string, unknown>;
  const bo = b as Record<string, unknown>;
  const keys = Object.keys(ao);
  if (keys.length !== Object.keys(bo).length) return false;
  for (const k of keys) {
    if (!Object.prototype.hasOwnProperty.call(bo, k)) return false;
    if (!deepEqual(ao[k], bo[k])) return false;
  }
  return true;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}
