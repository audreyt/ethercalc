/**
 * HMAC-SHA256 auth over room names, with the identity fallback the legacy
 * server uses when no KEY is configured.
 *
 * Legacy reference (`src/main.ls:23-26`):
 *
 * ```livescript
 * hmac = if !KEY then -> it else -> HMAC_CACHE[it] ||= do
 *   encoder = require \crypto .createHmac \sha256 (new Buffer KEY)
 *   encoder.update it.toString!
 *   encoder.digest \hex
 * ```
 *
 * Two behaviors preserved verbatim:
 *   1. When KEY is unset, `hmac(room) = room` (identity). This is exercised
 *      by the oracle recording `misc/get-edit-no-key-redirect.json` which
 *      302s to `?auth=<room-itself>`. See `tests/oracle/FINDINGS.md` F-03.
 *   2. When KEY is set, hex SHA-256 HMAC of the room string.
 *
 * We drop the in-memory cache — legacy was a Node module global; DO isolates
 * recycle, so cache hits would be rare. If it ever shows up in profiles,
 * fold the cache back in inside the DO instance. Meanwhile the Web Crypto
 * call is cheap (~5µs) relative to any round-trip it gates.
 *
 * Runtime note: this module uses Web Crypto (`crypto.subtle`) so it works
 * in both workerd (DO + Worker) and Node 20+ (the Node test harness).
 */

/**
 * Compute the HMAC hex for `room` under `key`. When `key` is undefined or
 * empty string, returns `room` unchanged (identity fallback).
 */
export async function computeAuth(key: string | undefined, room: string): Promise<string> {
  if (!key) return room;
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(room));
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Timing-safe comparison of a supplied `auth` value against the expected
 * HMAC. `supplied === '0'` is the well-known "view-only" sentinel and is
 * always rejected — that flows through the `/:room` key-gate where a
 * missing query redirects to `?auth=0` and the WS layer (§6.4) rejects
 * it. Neither should ever be treated as a valid HMAC.
 */
export async function verifyAuth(
  key: string | undefined,
  room: string,
  supplied: string,
): Promise<boolean> {
  if (supplied === '0') return false;
  const expected = await computeAuth(key, room);
  return timingSafeEqualString(expected, supplied);
}

/**
 * Constant-time string compare. Returns false immediately on length
 * mismatch (which is itself non-secret information in our threat model —
 * the expected HMAC is a fixed 64 hex chars when KEY is set, so length
 * leaks nothing a timing-unaware attacker couldn't already deduce from
 * the protocol).
 */
function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    s += (byte < 0x10 ? '0' : '') + byte.toString(16);
  }
  return s;
}
