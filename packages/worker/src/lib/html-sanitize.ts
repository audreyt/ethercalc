/**
 * HTML-export sanitisation policy (defence-in-depth for `/:room.html`).
 *
 * SocialCalc emits `valueformat===text-html` cells verbatim into the export
 * `<table>` (the same render sink the live editor uses). The export response
 * already carries a strict `Content-Security-Policy` (see
 * `routes/exports.ts`), but the CSP only protects user agents that honour it
 * and only when the document is loaded top-level — a downloaded `.html`
 * opened from disk, or an embed in a context that strips response headers,
 * sees no CSP. So we ALSO strip the dangerous markup from the bytes before
 * they leave the worker, using Cloudflare's native `HTMLRewriter` in the
 * route layer. The CSP stays as the outer layer.
 *
 * This module is the PURE policy — the element/attribute decision rules —
 * so it is fully Node-testable and coverage-gated. The `HTMLRewriter`
 * wiring that consumes it lives in `routes/exports.ts` (workerd-only,
 * istanbul-ignored). Keeping the predicates here means the security-relevant
 * decisions are unit-tested rather than hidden inside an uncovered route.
 *
 * Why strip rather than escape: `text-html` is a legitimate feature — cells
 * hold links/images/formatting — so we preserve safe markup and only remove
 * script-bearing elements, `on*` event handlers, and `javascript:`/`data:`
 * URLs. This mirrors the client-side DOMPurify allowlist
 * (`@ethercalc/client` `src/sanitize-html.ts`).
 */

/**
 * Elements removed from the export entirely (tag + contents). These can
 * execute script or load active content regardless of CSP-stripping
 * environments. `<embed>` is void (no contents) but still listed so its
 * `src` never resolves.
 */
export const DANGEROUS_ELEMENTS: readonly string[] = [
  'script',
  'iframe',
  'object',
  'embed',
];

/**
 * True for an `on*` inline event-handler attribute (`onerror`, `onclick`,
 * `onload`, …). Case-insensitive — HTML attribute names are ASCII
 * case-insensitive and an attacker may use mixed case to dodge a naive
 * filter. We treat the bare two-character name `on` as not a handler (it
 * carries no event), matching how browsers ignore it.
 */
export function isEventHandlerAttribute(name: string): boolean {
  return /^on[a-z]/i.test(name);
}

/**
 * True when a URL-bearing attribute value uses a dangerous scheme
 * (`javascript:`, `data:`, or `vbscript:`). Leading ASCII whitespace and
 * embedded control characters are stripped first because browsers tolerate
 * `java\tscript:` and ` javascript:` — the canonical bypasses. Matching is
 * case-insensitive.
 */
export function isUnsafeUrlValue(value: string): boolean {
  // Drop ASCII whitespace + C0 control chars (U+0000..U+0020, incl. tab /
  // newline) that browsers ignore when resolving the scheme, then inspect
  // the prefix.
  // eslint-disable-next-line no-control-regex
  const collapsed = value.replace(/[\x00-\x20]+/g, '').toLowerCase();
  return /^(?:javascript|data|vbscript):/.test(collapsed);
}

/** URL-bearing attributes we scheme-check on every surviving element. */
export const URL_ATTRIBUTES: readonly string[] = ['href', 'src', 'xlink:href'];

/**
 * Decide what to do with a single attribute during sanitisation.
 * Returns `'remove'` when the attribute must be dropped, `'keep'` otherwise.
 *
 * Factored out so the route's `HTMLRewriter` element handler is a thin
 * adapter and every branch is exercised by the Node unit suite.
 */
export function attributeAction(name: string, value: string): 'keep' | 'remove' {
  if (isEventHandlerAttribute(name)) return 'remove';
  if (URL_ATTRIBUTES.includes(name.toLowerCase()) && isUnsafeUrlValue(value)) {
    return 'remove';
  }
  return 'keep';
}
