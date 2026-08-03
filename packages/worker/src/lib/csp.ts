/**
 * Content-Security-Policy authority resolution.
 *
 * `connect-src` has to name the WebSocket authority explicitly, and the
 * obvious source for it — the request URL — is attacker-controlled: `Host`
 * decides `new URL(request.url).host`. Naming a spoofed host in our own
 * policy is only self-inflicted (the forged request's response goes back to
 * the forger, and Cloudflare's cache key includes the hostname), but it
 * contradicts the rule the `www` redirect already follows: trust anchors come
 * from configuration, never from a header. So prefer `ETHERCALC_ORIGIN` and
 * fall back to the request host only for self-hosts that never set it.
 */

/**
 * Resolve the `ws://`/`wss://` authority to advertise in `connect-src`.
 *
 * `configuredOrigin` is the deployment's `ETHERCALC_ORIGIN`. A missing,
 * non-string, empty, or unparseable value falls back to the request host, so
 * a self-host that never configured an origin keeps working.
 */
export function websocketAuthority(
  configuredOrigin: unknown,
  requestUrl: URL,
  secureTransport: boolean,
): string {
  const scheme = secureTransport ? 'wss' : 'ws';
  if (typeof configuredOrigin === 'string' && configuredOrigin.length > 0) {
    try {
      const canonical = new URL(configuredOrigin);
      // An origin with no host (`data:`, `about:blank`) cannot anchor a
      // WebSocket authority; treat it as unconfigured.
      if (canonical.host.length > 0) {
        return `${canonical.protocol === 'https:' ? 'wss' : 'ws'}://${canonical.host}`;
      }
    } catch {
      // Invalid deploy configuration must not break the policy header.
    }
  }
  return `${scheme}://${requestUrl.host}`;
}
