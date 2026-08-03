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
 * Why strip rather than escape: `text-html` is a legitimate feature. The
 * policy mirrors the client DOMPurify allowlist: safe formatting survives,
 * unknown tags are unwrapped, and active/raw-text elements are removed.
 */

/**
 * Elements removed with their contents. This includes executable/embedded
 * content plus parser-state and document-control elements that are unsafe
 * when a downloaded export is opened without response CSP headers.
 */
export const DANGEROUS_ELEMENTS: readonly string[] = [
  'applet',
  'base',
  'embed',
  'frame',
  'frameset',
  'iframe',
  'link',
  'math',
  'meta',
  'noembed',
  'noframes',
  'noscript',
  'object',
  'plaintext',
  'script',
  'style',
  'svg',
  'template',
  'textarea',
  'title',
  'xmp',
];

/** Formatting elements permitted by the live client sanitizer. */
export const ALLOWED_ELEMENTS: readonly string[] = [
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'div',
  'em',
  'font',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strike',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
];

/** Safe presentation/link attributes retained on allowed elements. */
export const ALLOWED_ATTRIBUTES: readonly string[] = [
  'align',
  'alt',
  'border',
  'cellpadding',
  'cellspacing',
  'class',
  'color',
  'colspan',
  'face',
  'height',
  'href',
  'rel',
  'rowspan',
  'size',
  'src',
  'style',
  'target',
  'title',
  'valign',
  'width',
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
 * URL-bearing attributes retained by the allowlist and scheme-checked.
 */
export const URL_ATTRIBUTES: readonly string[] = ['href', 'src'];

/**
 * True unless a URL uses http(s), mailto, tel, ftp, or a relative/reference
 * form. C0 controls are removed before classification to catch obfuscated
 * schemes such as `java\tscript:`.
 */
export function isUnsafeUrlValue(value: string): boolean {
  // `+` vs a single-char class is a wash under the `g` flag (every occurrence
  // is replaced either way) — the quantifier is kept for intent.
  // eslint-disable-next-line no-control-regex
  // Stryker disable next-line Regex
  const collapsed = value.replace(/[\x00-\x20]+/g, '');
  return !/^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i.test(
    collapsed,
  );
}

/**
 * Image sources in exported user content must stay local. Served exports
 * already have CSP, but downloaded HTML loses response headers; allowing an
 * absolute or protocol-relative source there would turn a sheet into a
 * viewer-tracking beacon.
 */
export function isExternalImageSource(value: string): boolean {
  // eslint-disable-next-line no-control-regex
  // Stryker disable next-line Regex
  const collapsed = value.replace(/[\x00-\x20]+/g, '');
  return /^(?:[a-z][a-z0-9+.-]*:|[\\/]{2})/i.test(collapsed);
}

/**
 * Inline styles preserve spreadsheet formatting, but CSS can also issue
 * network requests. Strip the whole attribute when it contains a fetch-capable
 * construct (including common escaped/comment-obfuscated spellings) so a
 * downloaded HTML export cannot become a tracking beacon after response CSP
 * headers are gone.
 */
export function isUnsafeInlineStyle(value: string): boolean {
  // Backslash escapes and comments can splice attacker-controlled CSS tokens.
  if (value.includes('\\') || value.includes('/*') || value.includes('@')) {
    return true;
  }
  // eslint-disable-next-line no-control-regex
  // Stryker disable next-line Regex
  const compact = value.toLowerCase().replace(/[\x00-\x20]+/g, '');
  return (
    /(?:url|image(?:-set)?|cross-fade|element|paint|expression|behavior|-moz-binding)\s*\(/.test(
      compact,
    ) ||
    /(?:https?|ftp|file|data|blob):|[\\/]{2}/.test(compact)
  );
}

/**
 * Decide what to do with a single attribute during sanitisation.
 * Returns `'remove'` when the attribute must be dropped, `'keep'` otherwise.
 *
 * Factored out so the route's `HTMLRewriter` element handler is a thin
 * adapter and every branch is exercised by the Node unit suite.
 */
export function attributeAction(name: string, value: string): 'keep' | 'remove' {
  // Defence in depth: no allowlisted attribute name starts with `on`, so the
  // allowlist check below already rejects handlers. This keeps the intent
  // explicit if the allowlist ever grows.
  // Stryker disable next-line ConditionalExpression
  if (isEventHandlerAttribute(name)) return 'remove';
  const normalized = name.toLowerCase();
  if (!ALLOWED_ATTRIBUTES.includes(normalized)) return 'remove';
  if (URL_ATTRIBUTES.includes(normalized) && isUnsafeUrlValue(value)) {
    return 'remove';
  }
  if (normalized === 'src' && isExternalImageSource(value)) return 'remove';
  if (normalized === 'style' && isUnsafeInlineStyle(value)) return 'remove';
  return 'keep';
}
