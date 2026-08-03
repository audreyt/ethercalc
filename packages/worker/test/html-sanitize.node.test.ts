import { describe, it, expect } from 'vite-plus/test';

import {
  ALLOWED_ATTRIBUTES,
  ALLOWED_ELEMENTS,
  DANGEROUS_ELEMENTS,
  URL_ATTRIBUTES,
  isEventHandlerAttribute,
  isExternalImageSource,
  isUnsafeInlineStyle,
  isUnsafeUrlValue,
  attributeAction,
} from '../src/lib/html-sanitize.ts';

/**
 * Coverage-gated unit tests for the pure HTML-export sanitisation policy.
 * The `HTMLRewriter` wiring that consumes these predicates lives in the
 * istanbul-ignored `routes/exports.ts`; the security-relevant decisions are
 * proven here and exercised end-to-end in `test/exports.test.ts` (workers
 * pool, where `HTMLRewriter` exists).
 */

describe('element allowlist', () => {
  it('keeps spreadsheet formatting and excludes document-control markup', () => {
    expect(ALLOWED_ELEMENTS).toEqual(
      expect.arrayContaining(['a', 'b', 'img', 'table', 'tr', 'td']),
    );
    expect(ALLOWED_ELEMENTS).not.toEqual(
      expect.arrayContaining(['form', 'input', 'meta', 'style', 'svg']),
    );
    expect(DANGEROUS_ELEMENTS).toEqual(
      expect.arrayContaining([
        'base',
        'iframe',
        'link',
        'meta',
        'script',
        'style',
        'svg',
        'template',
      ]),
    );
  });
});

describe('attribute allowlist', () => {
  it('keeps presentation/link attributes and excludes active navigation controls', () => {
    expect(ALLOWED_ATTRIBUTES).toEqual(
      expect.arrayContaining(['class', 'href', 'src', 'style', 'target']),
    );
    expect(ALLOWED_ATTRIBUTES).not.toEqual(
      expect.arrayContaining(['action', 'formaction', 'http-equiv', 'srcset']),
    );
  });
});

describe('URL_ATTRIBUTES', () => {
  it('lists the URL-bearing attributes we scheme-check', () => {
    expect(URL_ATTRIBUTES).toEqual(['href', 'src']);
  });
});

describe('policy lists are pinned, not merely non-empty', () => {
  // These arrays ARE the export policy: `routes/exports.ts` turns them into
  // HTMLRewriter selectors. A silent edit (or a typo'd entry) would reopen
  // an export sink, so the exact contents are the contract.
  it('pins every removed element', () => {
    expect([...DANGEROUS_ELEMENTS]).toEqual([
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
    ]);
  });

  it('pins every kept element', () => {
    expect([...ALLOWED_ELEMENTS]).toEqual([
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
    ]);
  });

  it('pins every kept attribute', () => {
    expect([...ALLOWED_ATTRIBUTES]).toEqual([
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
    ]);
  });

  it('never keeps an element it also removes', () => {
    for (const element of DANGEROUS_ELEMENTS) {
      expect(ALLOWED_ELEMENTS).not.toContain(element);
    }
  });
});

describe('isEventHandlerAttribute', () => {
  it('matches on* handlers regardless of case', () => {
    expect(isEventHandlerAttribute('onerror')).toBe(true);
    expect(isEventHandlerAttribute('onClick')).toBe(true);
    expect(isEventHandlerAttribute('ONLOAD')).toBe(true);
  });

  it('does not match plain attributes', () => {
    expect(isEventHandlerAttribute('href')).toBe(false);
    expect(isEventHandlerAttribute('class')).toBe(false);
  });

  it('does not match the bare two-character name "on"', () => {
    expect(isEventHandlerAttribute('on')).toBe(false);
  });

  it('anchors the match at the attribute name start', () => {
    // A trailing `on…` (e.g. `data-onclick`) is not an event handler; only a
    // leading one is, and the letter after `on` is what distinguishes it.
    expect(isEventHandlerAttribute('data-onclick')).toBe(false);
    expect(isEventHandlerAttribute('on-click')).toBe(false);
    expect(isEventHandlerAttribute('on1')).toBe(false);
  });
});

describe('isUnsafeUrlValue', () => {
  it('flags javascript:/data:/vbscript: schemes', () => {
    expect(isUnsafeUrlValue('javascript:alert(1)')).toBe(true);
    expect(isUnsafeUrlValue('data:text/html,<script>')).toBe(true);
    expect(isUnsafeUrlValue('vbscript:msgbox(1)')).toBe(true);
  });

  it('rejects every unapproved absolute scheme', () => {
    expect(isUnsafeUrlValue('file:///etc/passwd')).toBe(true);
    expect(isUnsafeUrlValue('blob:https://example.test/id')).toBe(true);
    expect(isUnsafeUrlValue('custom:payload')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isUnsafeUrlValue('JavaScript:alert(1)')).toBe(true);
  });

  it('strips leading whitespace and embedded control chars before matching', () => {
    expect(isUnsafeUrlValue('  javascript:alert(1)')).toBe(true);
    expect(isUnsafeUrlValue('java\tscript:alert(1)')).toBe(true);
    expect(isUnsafeUrlValue('java\nscript:alert(1)')).toBe(true);
  });

  it('allows safe schemes and relative URLs', () => {
    expect(isUnsafeUrlValue('https://example.test/x')).toBe(false);
    expect(isUnsafeUrlValue('mailto:a@b.test')).toBe(false);
    expect(isUnsafeUrlValue('/relative/path')).toBe(false);
    expect(isUnsafeUrlValue('#anchor')).toBe(false);
    expect(isUnsafeUrlValue('ftp://example.test/file')).toBe(false);
    expect(isUnsafeUrlValue('tel:+12025550123')).toBe(false);
  });

  it('treats a lone control character as collapsible whitespace', () => {
    expect(isUnsafeUrlValue('\u0000javascript:alert(1)')).toBe(true);
    expect(isUnsafeUrlValue('\u0020https://example.test/x')).toBe(false);
  });

  it('accepts a scheme-like path segment that is not a scheme', () => {
    // `a.b-c/x` has no colon, so it stays a relative path.
    expect(isUnsafeUrlValue('a.b-c/x')).toBe(false);
    // A digit before the colon is not a valid scheme prefix either.
    expect(isUnsafeUrlValue('1abc:payload')).toBe(false);
  });
});

describe('isExternalImageSource', () => {
  it('blocks network and data sources while keeping local paths', () => {
    expect(isExternalImageSource('https://tracker.test/pixel')).toBe(true);
    expect(isExternalImageSource('//tracker.test/pixel')).toBe(true);
    expect(isExternalImageSource('\\\\tracker.test\\pixel')).toBe(true);
    expect(isExternalImageSource('data:image/png;base64,AA')).toBe(true);
    expect(isExternalImageSource('/images/local.png')).toBe(false);
    expect(isExternalImageSource('relative.png')).toBe(false);
  });

  it('collapses control characters before classifying the source', () => {
    expect(isExternalImageSource('ht\ttps://tracker.test/pixel')).toBe(true);
    expect(isExternalImageSource('  /images/local.png')).toBe(false);
    // A single slash is a local absolute path; two start an authority.
    expect(isExternalImageSource('/tracker.test/pixel')).toBe(false);
    expect(isExternalImageSource('/\\tracker.test/pixel')).toBe(true);
  });
});

describe('isUnsafeInlineStyle', () => {
  it('blocks CSS fetch and legacy execution constructs', () => {
    expect(isUnsafeInlineStyle('background:url(https://tracker.test/pixel)')).toBe(
      true,
    );
    expect(isUnsafeInlineStyle('background:u/**/rl(//tracker.test/pixel)')).toBe(
      true,
    );
    expect(isUnsafeInlineStyle('background:\\75rl(//tracker.test/pixel)')).toBe(
      true,
    );
    expect(isUnsafeInlineStyle('width:expression(alert(1))')).toBe(true);
  });

  it('keeps inert spreadsheet formatting', () => {
    expect(
      isUnsafeInlineStyle(
        'font-weight:bold;text-align:right;background-color:#fff;border:1px solid #000',
      ),
    ).toBe(false);
  });

  it('blocks each fetch-capable CSS function by name', () => {
    for (const css of [
      'background:url(/x)',
      'background:image(/x)',
      'background:image-set(/x)',
      'background:cross-fade(/x)',
      'background:element(#x)',
      'background:paint(worklet)',
      'width:expression(1)',
      'behavior:url(#default#x)',
      '-moz-binding:url(/x)',
    ]) {
      expect(isUnsafeInlineStyle(css), css).toBe(true);
    }
  });

  it('blocks each escape, comment, and at-rule splice independently', () => {
    expect(isUnsafeInlineStyle('color:re\\64')).toBe(true);
    expect(isUnsafeInlineStyle('color:/*x*/red')).toBe(true);
    expect(isUnsafeInlineStyle('@import "x"')).toBe(true);
  });

  it('blocks bare network references even without a CSS function', () => {
    for (const css of [
      'background:https://tracker.test/x',
      'background:http://tracker.test/x',
      'background:ftp://tracker.test/x',
      'background:file:///etc/passwd',
      'background:data:image/png;base64,AA',
      'background:blob:https://x/id',
      'background://tracker.test/x',
    ]) {
      expect(isUnsafeInlineStyle(css), css).toBe(true);
    }
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isUnsafeInlineStyle('background: URL (/x)')).toBe(true);
    expect(isUnsafeInlineStyle('BACKGROUND:HTTPS://tracker.test/x')).toBe(true);
  });
});

describe('attributeAction', () => {
  it('removes event-handler attributes', () => {
    expect(attributeAction('onerror', 'alert(1)')).toBe('remove');
  });

  it('removes URL attributes carrying a dangerous scheme (case-insensitive name)', () => {
    expect(attributeAction('href', 'javascript:alert(1)')).toBe('remove');
    expect(attributeAction('SRC', 'data:text/html,x')).toBe('remove');
    expect(attributeAction('xlink:href', 'vbscript:x')).toBe('remove');
  });

  it('keeps URL attributes with safe schemes', () => {
    expect(attributeAction('href', 'https://example.test')).toBe('keep');
    expect(attributeAction('src', '/img/x.png')).toBe('keep');
    expect(attributeAction('src', 'https://tracker.test/pixel')).toBe('remove');
  });

  it('keeps allowlisted non-URL attributes and removes every unknown one', () => {
    expect(attributeAction('title', 'javascript:not-a-url')).toBe('keep');
    expect(attributeAction('class', 'foo')).toBe('keep');
    expect(attributeAction('formaction', 'https://evil.test')).toBe('remove');
    expect(attributeAction('data-unknown', 'value')).toBe('remove');
  });
  it('removes inline styles that can issue network requests', () => {
    expect(
      attributeAction('style', 'background:url(//tracker.test/pixel)'),
    ).toBe('remove');
  });
});

describe('sanitizer regex lanes', () => {
  it('accepts plain http as well as https, and bare relative words', () => {
    // `https?` — not `https`.
    expect(isUnsafeUrlValue('http://example.test/x')).toBe(false);
    // The `|$` lane: a scheme-less, punctuation-free relative reference.
    expect(isUnsafeUrlValue('relative')).toBe(false);
  });

  it('anchors external-image detection at the start of the value', () => {
    // A colon later in a local path is not a scheme.
    expect(isExternalImageSource('images/logo:v2.png')).toBe(false);
    expect(isExternalImageSource('https://tracker.test/x.png')).toBe(true);
  });

  it('matches CSS function names exactly, not as prefixes', () => {
    // `url(` is fetch-capable; `urlencode(` is inert nonsense.
    expect(isUnsafeInlineStyle('background:url(x)')).toBe(true);
    expect(isUnsafeInlineStyle('background:urlencode(x)')).toBe(false);
  });

  it('flags bare http as a scheme and keeps a lone slash', () => {
    // `https?:` without the `//` authority still names a network scheme.
    expect(isUnsafeInlineStyle('background:http:x')).toBe(true);
    // A single slash is ordinary CSS shorthand, not a protocol-relative URL.
    expect(isUnsafeInlineStyle('font:10px/1.4 serif')).toBe(false);
  });
});
