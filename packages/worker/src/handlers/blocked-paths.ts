/**
 * `GET /etc/*` and `GET /var/*` — 404 with empty body.
 *
 * Legacy (src/main.ls:56-57):
 *   @get "#BASEPATH/etc/*": -> @response.send 404 ''
 *   @get "#BASEPATH/var/*": -> @response.send 404 ''
 *
 * Oracle recordings `misc/get-etc-foo-404` and `misc/get-var-foo-404`
 * show the legacy response carries `Content-Type: text/html; charset=utf-8`
 * (Express's default for `.send()`). The Phase 4 task description asks
 * for `text/plain; charset=utf-8`, but the oracle is authoritative —
 * we match the recording so the replay test passes. See FINDINGS.md.
 */

export interface BlockedPathResponse {
  readonly status: 404;
  readonly body: '';
  readonly headers: {
    readonly 'Content-Type': 'text/html; charset=utf-8';
  };
}

/** Returns the canned 404 shape for `/etc/*` and `/var/*`. */
export function buildBlockedPathResponse(): BlockedPathResponse {
  return {
    status: 404,
    body: '',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  };
}
