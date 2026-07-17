/**
 * Client-side HTML sanitiser for `valueformat===text-html` cells.
 *
 * SocialCalc 3.1.0 ships its own opt-in rendering security model. When
 * `SocialCalc.Callbacks.untrustedContent` is `true`, the runtime routes
 * `text-html` cell values through `SocialCalc.EscapeUntrustedHtml`, which
 * calls `securityPolicy.sanitizeHtml(html)` when that callback is a
 * function. We wire DOMPurify as that callback at boot, neutralising
 * stored XSS (`<script>`, `on*` handlers, `javascript:` URLs,
 * `<iframe>`/`<object>`/`<embed>`) while keeping the safe formatting
 * tags intact.
 *
 * The `SocialCalc.sanitizeHTML` property is also installed for backward
 * compatibility with any cached `static/socialcalc.js` assets that still
 * carry the pre-3.1.0 regex-injected hook.
 */

/**
 * The DOMPurify surface we depend on. Carved out so Node tests can inject a
 * stub (or a happy-dom-backed real DOMPurify) without dragging the browser
 * global into the unit suite.
 */
export interface PurifyLike {
  sanitize: (dirty: string, config?: Record<string, unknown>) => string;
}

/** Just the slice of `window.SocialCalc` this module touches. */
export interface SecurityPolicyHost {
  sanitizeHTML?: (raw: string) => string;
  Callbacks?: {
    untrustedContent?: boolean;
    securityPolicy?: {
      sanitizeHtml?: (html: string) => string;
      allowedUrlSchemes?: string[];
      allowedDataMimeTypes?: string[];
    };
  };
}

/**
 * DOMPurify allowlist for `text-html` cells.
 *
 * `ALLOWED_TAGS` covers the formatting + media tags real spreadsheets use
 * (links, images, lists, tables, basic inline styling). `<script>`,
 * `<iframe>`, `<object>`, and `<embed>` are deliberately absent, so they are
 * dropped. `ALLOWED_ATTR` keeps `href`/`src`/`alt`/`title`/`style` etc. but
 * NOT any `on*` event-handler attribute (those are never on the list, so
 * DOMPurify removes them). `ALLOWED_URI_REGEXP` constrains `href`/`src` to
 * safe schemes — `http`, `https`, `mailto`, `tel`, and relative URLs — so a
 * `javascript:` (or `data:`) URL is stripped from the attribute.
 */
export const TEXT_HTML_SANITIZE_CONFIG: Readonly<Record<string, unknown>> = {
  ALLOWED_TAGS: [
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
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'target',
    'rel',
    'style',
    'class',
    'colspan',
    'rowspan',
    'align',
    'valign',
    'width',
    'height',
    'color',
    'face',
    'size',
  ],
  // Safe schemes only — anything else (notably `javascript:` and `data:`)
  // is stripped from the attribute. Matches DOMPurify's documented pattern
  // minus `data:` so inline data-URI payloads cannot ride through.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  // We only ever feed DOMPurify a cell's value, never a full document, so
  // returning a string (not a Node) is what the render sink expects.
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Install SocialCalc 3.1.0's security policy on the host global.
 *
 * Enables `untrustedContent` and wires DOMPurify as the
 * `securityPolicy.sanitizeHtml` callback. Also installs
 * `SocialCalc.sanitizeHTML` for backward compatibility with cached
 * pre-3.1.0 `static/socialcalc.js` assets that still carry the
 * regex-injected hook.
 *
 * Idempotent: if `untrustedContent` is already `true` we leave the policy
 * in place (a host page may have installed a stricter policy of its own).
 * Returns `true` when we installed, `false` when we skipped.
 */
export function installSecurityPolicy(host: SecurityPolicyHost, purify: PurifyLike): boolean {
  const callbacks = host.Callbacks ?? (host.Callbacks = {});
  if (callbacks.untrustedContent) return false;

  const sanitizer = (raw: string): string => purify.sanitize(raw, TEXT_HTML_SANITIZE_CONFIG);

  callbacks.untrustedContent = true;
  callbacks.securityPolicy = callbacks.securityPolicy ?? {};
  callbacks.securityPolicy.sanitizeHtml = sanitizer;

  // Backward compat: cached pre-3.1.0 assets may call SocialCalc.sanitizeHTML.
  if (!host.sanitizeHTML) {
    host.sanitizeHTML = sanitizer;
  }

  return true;
}