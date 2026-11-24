import { describe, expect, it } from 'vite-plus/test';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

import {
  exceedsHtmlSanitizeCost,
  installSecurityPolicy,
  MAX_FORMATTING_REOPEN_WORK,
  MAX_TEXT_HTML_LENGTH,
  MAX_TEXT_HTML_NODES,
  MAX_UNLISTED_UNWRAP_WORK,
  TEXT_HTML_SANITIZE_CONFIG,
  type PurifyLike,
  type SecurityPolicyHost,
} from '../src/sanitize-html.ts';

/**
 * Coverage-gated unit tests for the `text-html` cell sanitiser.
 *
 * Two layers:
 *   1. install logic (idempotency, config wiring) via a recording stub so we
 *      assert *what* config DOMPurify is called with — deterministic, no DOM.
 *   2. real-inertness via the actual DOMPurify backed by a jsdom window, so we
 *      prove the allowlist neutralises stored XSS while keeping safe markup.
 *      In the browser DOMPurify auto-binds `window`; here we wire jsdom in.
 */

function realPurify(): PurifyLike {
  const { window } = new JSDOM('');
  return createDOMPurify(window as unknown as Window & typeof globalThis);
}

describe('installSecurityPolicy', () => {
  it('enables untrustedContent and wires securityPolicy.sanitizeHtml with our config', () => {
    const calls: Array<{ dirty: string; config: Record<string, unknown> | undefined }> = [];
    const purify: PurifyLike = {
      sanitize: (dirty, config) => {
        calls.push({ dirty, config });
        return `CLEAN(${dirty})`;
      },
    };
    const host: SecurityPolicyHost = {};

    const installed = installSecurityPolicy(host, purify);

    expect(installed).toBe(true);
    expect(host.Callbacks?.untrustedContent).toBe(true);
    expect(typeof host.Callbacks?.securityPolicy?.sanitizeHtml).toBe('function');
    expect(host.Callbacks!.securityPolicy!.sanitizeHtml!('<b>x</b>')).toBe('CLEAN(<b>x</b>)');
    expect(calls).toHaveLength(1);
    expect(calls[0]!.dirty).toBe('<b>x</b>');
    expect(calls[0]!.config).toBe(TEXT_HTML_SANITIZE_CONFIG);
  });

  it('also installs SocialCalc.sanitizeHTML for backward compatibility', () => {
    const purify: PurifyLike = { sanitize: (d) => `SANITIZED(${d})` };
    const host: SecurityPolicyHost = {};

    installSecurityPolicy(host, purify);

    expect(typeof host.sanitizeHTML).toBe('function');
    expect(host.sanitizeHTML!('<b>x</b>')).toBe('SANITIZED(<b>x</b>)');
  });

  it('preserves a pre-existing SocialCalc.sanitizeHTML but still enables untrustedContent', () => {
    const purify: PurifyLike = { sanitize: (d) => `NEW(${d})` };
    const existing = (raw: string): string => `EXISTING(${raw})`;
    const host: SecurityPolicyHost = { sanitizeHTML: existing };

    installSecurityPolicy(host, purify);

    expect(host.sanitizeHTML).toBe(existing);
    expect(host.Callbacks?.untrustedContent).toBe(true);
  });

  it('is idempotent — leaves a pre-existing policy untouched', () => {
    const purify: PurifyLike = { sanitize: (d) => `NEW(${d})` };
    const existing = (raw: string): string => `EXISTING(${raw})`;
    const host: SecurityPolicyHost = {
      Callbacks: { untrustedContent: true, securityPolicy: { sanitizeHtml: existing } },
    };

    const installed = installSecurityPolicy(host, purify);

    expect(installed).toBe(false);
    expect(host.Callbacks?.securityPolicy?.sanitizeHtml).toBe(existing);
    expect(host.Callbacks?.securityPolicy?.sanitizeHtml!('x')).toBe('EXISTING(x)');
  });
});

describe('exceedsHtmlSanitizeCost', () => {
  it('accepts benign markup, comments, math, quotes, void tags, and closing tags', () => {
    expect(exceedsHtmlSanitizeCost('plain text')).toBe(false);
    expect(exceedsHtmlSanitizeCost('<p>a<br>b</p><!-- <x><y> --> 1 < 2 <')).toBe(false);
    expect(exceedsHtmlSanitizeCost('<!-- unclosed')).toBe(false);
    expect(exceedsHtmlSanitizeCost('<a href="x>y" title=\'a>b\'>ok</a><b/><b x="1')).toBe(false);
    expect(exceedsHtmlSanitizeCost('<x>1</x></neveropened>')).toBe(false);
    expect(exceedsHtmlSanitizeCost('<table><tr><td>1</td></tr></table>')).toBe(false);
  });

  it('caps total length and total tag count', () => {
    expect(exceedsHtmlSanitizeCost(`<b>${'x'.repeat(MAX_TEXT_HTML_LENGTH - 3)}`)).toBe(false);
    expect(exceedsHtmlSanitizeCost(`<b>${'x'.repeat(MAX_TEXT_HTML_LENGTH - 2)}`)).toBe(true);
    expect(exceedsHtmlSanitizeCost('<a>'.repeat(MAX_TEXT_HTML_NODES))).toBe(false);
    expect(exceedsHtmlSanitizeCost('<a>'.repeat(MAX_TEXT_HTML_NODES + 1))).toBe(true);
  });

  it('caps cumulative unwrap work across nested unlisted tags', () => {
    // 32 nested <x> hits sum(0..31) = 496 <= 512; a 33rd reaches 528 > 512.
    expect(exceedsHtmlSanitizeCost('<x>'.repeat(32))).toBe(false);
    expect(exceedsHtmlSanitizeCost('<x>'.repeat(33))).toBe(true);

    // 16 nested <x> already accrue sum(0..15) = 120 unwrap work, leaving budget for 24 <br>.
    const innerCount = Math.floor((MAX_UNLISTED_UNWRAP_WORK - 120) / 16);
    const fits = '<x>'.repeat(16) + '<br>'.repeat(innerCount);
    expect(exceedsHtmlSanitizeCost(fits)).toBe(false);
    expect(exceedsHtmlSanitizeCost(`${fits}<br>`)).toBe(true);
  });

  it('caps attribute-bearing formatting reconstruction across block boundaries', () => {
    // Closed formatting tags reset the stack: 100-link lists and tables pass.
    const links = `<ul>${'<li><a href="https://example.com">link</a></li>'.repeat(100)}</ul>`;
    expect(exceedsHtmlSanitizeCost(links)).toBe(false);

    // Unclosed attribute-bearing formatting tags accumulate work on block tags.
    const count = 40;
    const blocks = Math.floor(MAX_FORMATTING_REOPEN_WORK / count);
    const fits = '<a href="https://x">'.repeat(count) + '<p>'.repeat(blocks);
    expect(exceedsHtmlSanitizeCost(fits)).toBe(false);
    expect(exceedsHtmlSanitizeCost(`${fits}<p>`)).toBe(true);
  });
});

describe('installSecurityPolicy — cell HTML the sanitiser is not asked to handle', () => {
  function recordingSanitizer(): { sanitize: (html: string) => string; seen: unknown[] } {
    const seen: unknown[] = [];
    const host: SecurityPolicyHost = {};
    installSecurityPolicy(host, {
      sanitize: (dirty) => {
        seen.push(dirty);
        return 'CLEAN';
      },
    });
    return { sanitize: host.Callbacks!.securityPolicy!.sanitizeHtml!, seen };
  }

  it('shows over-budget HTML as escaped source without invoking DOMPurify', () => {
    const { sanitize, seen } = recordingSanitizer();
    const html = '<x y="1">&amp;</x>'.repeat(200);
    // 200 sequential closed <x> pairs stay depth 1, total work = 200 <= 512.
    expect(sanitize(html)).toBe('CLEAN');
    const nested = '<x y="1">&amp;'.repeat(33);
    expect(sanitize(nested)).toBe('&lt;x y=&quot;1&quot;&gt;&amp;amp;'.repeat(33));
    expect(seen).toEqual([html]);
  });

  it('leaves a value that is not a string to DOMPurify', () => {
    const { sanitize, seen } = recordingSanitizer();
    expect(sanitize(42 as unknown as string)).toBe('CLEAN');
    expect(seen).toEqual([42]);
  });
});

describe('TEXT_HTML_SANITIZE_CONFIG with real DOMPurify (stored-XSS payloads)', () => {
  const host: SecurityPolicyHost = {};
  installSecurityPolicy(host, realPurify());
  const sanitize = host.Callbacks!.securityPolicy!.sanitizeHtml!;

  it('renders an onerror img payload inert (handler stripped)', () => {
    const out = sanitize('<img src=x onerror=alert(1)>');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('alert');
  });

  it('drops a <script> payload entirely', () => {
    const out = sanitize('<script>alert(1)</script>');
    expect(out.toLowerCase()).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('strips a javascript: href but keeps the anchor text', () => {
    const out = sanitize('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('x');
  });

  it('strips a data: URI on an image source', () => {
    const out = sanitize('<img src="data:text/html,<script>alert(1)</script>">');
    expect(out).not.toContain('data:');
  });

  it('drops <iframe>, <object> and <embed>', () => {
    const out = sanitize(
      '<iframe src="https://evil"></iframe><object data="x"></object><embed src="y">',
    );
    expect(out.toLowerCase()).not.toContain('<iframe');
    expect(out.toLowerCase()).not.toContain('<object');
    expect(out.toLowerCase()).not.toContain('<embed');
  });

  it('keeps benign formatting tags', () => {
    const out = sanitize('<b>bold</b> <i>italic</i>');
    expect(out).toContain('<b>bold</b>');
    expect(out).toContain('<i>italic</i>');
  });

  it('strips inline CSS and host-page class gadgets', () => {
    const out = sanitize(
      '<div class="vex-overlay" style="position:fixed;inset:0">cover</div>',
    );
    expect(out).toContain('<div>cover</div>');
    expect(out).not.toContain('class=');
    expect(out).not.toContain('style=');
  });

  it('keeps a safe https link', () => {
    const out = sanitize('<a href="https://x">link</a>');
    expect(out).toContain('href="https://x"');
    expect(out).toContain('link');
  });

  it('keeps a safe image with an https source', () => {
    const out = sanitize('<img src="https://x/y.png" alt="pic">');
    expect(out).toContain('src="https://x/y.png"');
    expect(out).toContain('alt="pic"');
  });

  it('still unwraps tags outside the allowlist, keeps a large table and 100-link list', () => {
    expect(sanitize('<center><label>a</label> <tt>b</tt></center>')).toBe('a b');
    const row = '<tr><td><b>1</b></td><td><i>2</i></td><td><a href="https://x">3</a></td></tr>';
    const table = `<table><tbody>${row.repeat(40)}</tbody></table>`;
    expect(sanitize(table)).toBe(table);
    const links = `<ul>${'<li><a href="https://example.com">link</a></li>'.repeat(100)}</ul>`;
    expect(sanitize(links)).toBe(links);
  });

  it('does not sanitise nested unknown tags around a long run of elements', () => {
    // DOMPurify would copy the 2,500 <br> once for each of the 150 levels.
    const html = '<x>'.repeat(150) + '<br>'.repeat(2500);
    expect(sanitize(html)).toBe('&lt;x&gt;'.repeat(150) + '&lt;br&gt;'.repeat(2500));
    // The same cell with a tag from the allowlist is copied once and still drawn.
    const listed = sanitize('<b>'.repeat(150) + '<br>'.repeat(2500));
    expect(listed.startsWith('<b>'.repeat(150) + '<br>')).toBe(true);
    expect(listed.split('<br>')).toHaveLength(2501);
  });

  it('does not sanitise unclosed formatting tags the parser would repeat in every block', () => {
    let open = '';
    for (let i = 0; i < 40; i++) open += `<a href="https://x?i=${i}">`;
    const out = sanitize(`<p>${open}${'x<p>'.repeat(40)}`);
    expect(out.startsWith('&lt;p&gt;&lt;a href=&quot;https://x?i=0&quot;&gt;')).toBe(true);
    expect(out).not.toContain('<');
  });
});