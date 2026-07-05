/**
 * Client-side HTML sanitiser for `valueformat===text-html` cells.
 *
 * SocialCalc renders a `text-html` cell's raw value straight into the cell
 * `<div>`'s `innerHTML` (see `FormatValueForDisplay`, the
 * `if (valueformat=="text-html")` branch in the served
 * `/static/socialcalc.js`). `text-html` is a legitimate feature — cells
 * carry links, images, and inline formatting — so we must NOT strip it.
 * Instead we route the raw value through DOMPurify before it reaches the
 * DOM, neutralising stored XSS (`<script>`, `on*` handlers, `javascript:`
 * URLs, `<iframe>`/`<object>`/`<embed>`) while keeping the safe formatting
 * tags intact.
 *
 * The hook is wired by `scripts/build-assets.ts`, which rewrites the
 * served runtime's text-html branch to
 *
 *   displayvalue = (SocialCalc.sanitizeHTML ? SocialCalc.sanitizeHTML(displayvalue) : displayvalue);
 *
 * so the install below is what makes that branch actually sanitise. If the
 * hook is ever absent (old cached asset), the branch falls back to the raw
 * value — exactly the legacy behaviour — so nothing breaks, it just isn't
 * sanitised. We always install it at boot to close that window.
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
export interface SanitizeHost {
  sanitizeHTML?: (raw: string) => string;
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
 * Install `SocialCalc.sanitizeHTML` on the host global.
 *
 * Idempotent: if a hook is already present we leave it in place (a host page
 * may have installed a stricter policy of its own). Returns `true` when we
 * installed, `false` when we skipped.
 */
export function installSanitizeHtml(host: SanitizeHost, purify: PurifyLike): boolean {
  if (host.sanitizeHTML) return false;
  host.sanitizeHTML = (raw: string): string =>
    purify.sanitize(raw, TEXT_HTML_SANITIZE_CONFIG);
  return true;
}
