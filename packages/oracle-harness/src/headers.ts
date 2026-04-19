/**
 * HTTP header normalization for the oracle recorder/replayer.
 *
 * Per CLAUDE.md §4.4 we drop a fixed set of non-deterministic response
 * headers before persisting to a recording, so day-over-day replays
 * don't diff on `Date:` or `Server:` alone.
 *
 * Replay-time header matching supports a tiny extension: values that
 * start with `re:` are compiled as regular expressions against the
 * actual response header. Exact-string matches remain the default and
 * cover the vast majority of cases. The `re:` prefix keeps the
 * on-disk shape a plain `Record<string,string>` so we don't have to
 * widen `@ethercalc/shared`'s HttpResponseExpectation union.
 */

/**
 * Headers that are non-deterministic and must be stripped before we
 * diff oracle vs target. Lowercased so lookups are case-insensitive.
 */
export const VOLATILE_HEADERS: ReadonlySet<string> = new Set([
  'date',
  'server',
  'etag',
  'x-powered-by',
  'connection',
]);

/**
 * Return a new Headers-like record with volatile entries removed and
 * all keys lowercased. Idempotent — safe to call on already-normalized
 * input.
 */
export function normalizeHeaders(raw: Readonly<Record<string, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const lower = k.toLowerCase();
    if (VOLATILE_HEADERS.has(lower)) continue;
    out[lower] = v;
  }
  return out;
}

/**
 * Extract a response's headers as a plain record for persistence. Fetch
 * `Headers` is iterable of [name, value] pairs; names are always
 * already lowercased by the platform.
 */
export function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

/**
 * Match a single expected header value against an actual value.
 *
 * If `expected` starts with `re:` the remainder is treated as a RegExp
 * source (tested with `RegExp#test`). Otherwise it must match the
 * actual string exactly (including trailing whitespace — the server's
 * response is ground truth).
 */
export function matchHeaderValue(expected: string, actual: string | undefined): boolean {
  if (actual === undefined) return false;
  if (expected.startsWith('re:')) {
    const pattern = expected.slice(3);
    return new RegExp(pattern).test(actual);
  }
  return expected === actual;
}

/**
 * Assert every header in `expected` is present (case-insensitive key
 * lookup) and its value matches. Extra actual headers are ignored —
 * we only care about the ones the scenario author wrote down.
 *
 * Returns `null` on success; on failure returns a short human-readable
 * explanation suitable for chaining into an assertion message.
 */
export function diffHeaders(
  expected: Readonly<Record<string, string>>,
  actual: Readonly<Record<string, string>>,
): string | null {
  for (const [name, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[name.toLowerCase()];
    if (!matchHeaderValue(expectedValue, actualValue)) {
      return `header ${JSON.stringify(name)}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`;
    }
  }
  return null;
}
