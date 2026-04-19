/**
 * Session-id helpers for the socket.io v0.9 shim.
 *
 * Legacy v0.9 SIDs were typically a 15-char random string; modern clients
 * don't care about the length or character set as long as we echo back the
 * same value on subsequent transport requests. We use a `crypto.randomUUID()`-
 * derived token: hex + hyphen-free, 32 chars. Plenty of entropy; no
 * collision risk at any practical scale.
 */

/**
 * Generate a fresh session id. Uses `globalThis.crypto.randomUUID()`
 * which exists in workerd, modern Node (>= 19), and all current browsers.
 * We strip hyphens to keep the on-wire form compact and to avoid any
 * downstream path-parsing code that treats hyphens specially.
 */
export function generateSid(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, '');
}

/**
 * Validate an inbound sid. We only accept what `generateSid` would have
 * produced — 32 lowercase hex chars — so malicious clients can't smuggle
 * path segments or control characters through the transport URL.
 *
 * Returns false for non-string inputs, empty strings, wrong length, or
 * any character outside the hex set.
 */
export function validateSid(s: unknown): boolean {
  if (typeof s !== 'string') return false;
  if (s.length !== 32) return false;
  return /^[0-9a-f]{32}$/.test(s);
}
