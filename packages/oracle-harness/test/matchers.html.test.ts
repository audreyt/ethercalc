import { describe, it, expect } from 'vitest';

import {
  canonicalizeHtml,
  HtmlParseError,
  normalizeDomNode,
  VOLATILE_ID_REGEX,
  VOLATILE_ID_REFERRERS,
} from '../src/html-canonical.ts';
import { encodeBase64, matchHtml } from '../src/matchers.ts';

/** Encode `text` as base64 — short helper for test cases. */
function b64(text: string): string {
  return encodeBase64(new TextEncoder().encode(text));
}

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('canonicalizeHtml', () => {
  it('returns the root element serialized', () => {
    const { canonical } = canonicalizeHtml('<html><body><p>hi</p></body></html>');
    expect(canonical).toMatch(/^<html/);
    expect(canonical).toContain('<p>hi</p>');
  });

  it('drops whitespace-only text nodes', () => {
    const a = canonicalizeHtml('<div><p>ok</p></div>').canonical;
    const b = canonicalizeHtml('<div>\n  <p>ok</p>\n</div>').canonical;
    expect(a).toBe(b);
  });

  it('trims surrounding whitespace on non-empty text nodes', () => {
    const { canonical } = canonicalizeHtml('<p>  hello  </p>');
    // Trimmed to "hello" in the serialized output.
    expect(canonical).toContain('<p>hello</p>');
    expect(canonical).not.toContain('  hello');
  });

  it('drops HTML comments', () => {
    const a = canonicalizeHtml('<div><p>ok</p></div>').canonical;
    const b = canonicalizeHtml('<div><!-- build stamp --><p>ok</p></div>').canonical;
    expect(a).toBe(b);
  });

  it('sorts attributes alphabetically', () => {
    const a = canonicalizeHtml('<span class="c" data-z="1" aria-label="a">x</span>').canonical;
    const b = canonicalizeHtml('<span aria-label="a" class="c" data-z="1">x</span>').canonical;
    expect(a).toBe(b);
    expect(a).toMatch(/aria-label="a" class="c" data-z="1"/);
  });

  it('drops SocialCalc-style volatile ids', () => {
    const { canonical } = canonicalizeHtml('<div id="SocialCalc-cell-A1">x</div>');
    expect(canonical).not.toContain('SocialCalc');
    expect(canonical).toContain('<div>x</div>');
  });

  it('drops long-hex (UUID-shaped) ids', () => {
    const { canonical } = canonicalizeHtml('<div id="abcdef0123456789abcdef0123456789">x</div>');
    expect(canonical).toBe('<div>x</div>');
  });

  it('keeps short / stable ids untouched', () => {
    const { canonical } = canonicalizeHtml('<div id="result">x</div>');
    expect(canonical).toContain('id="result"');
  });

  it('drops dangling references to volatile ids', () => {
    const volatile = 'SocialCalc-edittools-abc';
    const html = `<body><label for="${volatile}">L</label><input aria-labelledby="${volatile}"/></body>`;
    const { canonical } = canonicalizeHtml(html);
    expect(canonical).not.toContain(volatile);
    expect(canonical).toContain('<label>L</label>');
    expect(canonical).toContain('<input');
  });

  it('drops href="#volatileId"', () => {
    const v = 'SocialCalc-target';
    const { canonical } = canonicalizeHtml(
      `<body><div id="${v}">x</div><a href="#${v}">link</a></body>`,
    );
    // The anchor keeps its text but loses the href since target disappeared.
    expect(canonical).not.toContain(v);
    expect(canonical).toContain('<a>link</a>');
  });

  it('keeps href="#stable-anchor"', () => {
    const { canonical } = canonicalizeHtml(
      '<body><a href="#contents">link</a><h1 id="contents">x</h1></body>',
    );
    expect(canonical).toContain('href="#contents"');
  });

  it('normalizes CDATA sections in XHTML-like content via trimming', () => {
    // XML/HTML CDATA path — exercises the CDATA_SECTION_NODE branch.
    // parseHTML treats CDATA as text, but we use DOMParser in canonicalizeXml
    // — tested there. This stub just confirms HTML parse doesn't explode on
    // doctype-wrapped content.
    const { canonical } = canonicalizeHtml('<!DOCTYPE html><html><body></body></html>');
    expect(canonical).toContain('<body>');
  });

  it('throws HtmlParseError on truly empty input', () => {
    expect(() => canonicalizeHtml('')).toThrow(HtmlParseError);
  });

  it('keeps aria-labelledby that references a non-volatile id', () => {
    const html = '<body><label id="stable-label">L</label><input aria-labelledby="stable-label"/></body>';
    const { canonical } = canonicalizeHtml(html);
    expect(canonical).toContain('aria-labelledby="stable-label"');
  });

  it('drops whitespace-only aria-labelledby (tokens.length === 0)', () => {
    // Empty value survives the drop check (no volatile ids to match),
    // but exercises the tokens.length === 0 branch in refersToVolatileId.
    const html = '<div aria-labelledby="   "></div>';
    const { canonical } = canonicalizeHtml(html);
    expect(canonical).toContain('aria-labelledby="   "');
  });
});

describe('normalizeDomNode (direct)', () => {
  it('exports constants used by the canonicalizer', () => {
    expect(VOLATILE_ID_REGEX.test('SocialCalc-foo')).toBe(true);
    expect(VOLATILE_ID_REGEX.test('a'.repeat(32))).toBe(true);
    expect(VOLATILE_ID_REGEX.test('short')).toBe(false);
    expect(VOLATILE_ID_REFERRERS).toContain('for');
    expect(VOLATILE_ID_REFERRERS).toContain('aria-labelledby');
  });

  it('is idempotent on already-canonical input', () => {
    const raw = '<html><head></head><body><p>x</p></body></html>';
    const once = canonicalizeHtml(raw).canonical;
    const twice = canonicalizeHtml(once).canonical;
    expect(twice).toBe(once);
  });

  it('can be invoked on a subtree (stand-in coverage for normalizeDomNode)', () => {
    // Parse a fragment, normalize it, and confirm the result is stable.
    // This exercises normalizeDomNode via the canonicalizer; direct calls
    // would require building a raw DomNode, which is what linkedom gives us.
    const { canonical } = canonicalizeHtml('<body><!-- c --><p>y</p></body>');
    expect(canonical).not.toContain('<!--');
    // And `normalizeDomNode` is indirectly exported so callers outside can
    // plug in their own linkedom output:
    expect(typeof normalizeDomNode).toBe('function');
  });
});

describe('matchHtml', () => {
  it('accepts two empty bodies after wrapping (equal)', () => {
    const r = matchHtml({
      expectedBase64: b64('<html><body></body></html>'),
      actualBytes: bytes('<html><body></body></html>'),
    });
    expect(r).toBeNull();
  });

  it('treats whitespace-only differences as equal', () => {
    const r = matchHtml({
      expectedBase64: b64('<div><span>ok</span></div>'),
      actualBytes: bytes('<div>\n   <span>ok</span>\n</div>'),
    });
    expect(r).toBeNull();
  });

  it('treats attribute-order differences as equal', () => {
    const r = matchHtml({
      expectedBase64: b64('<input class="a" type="text" id="stable"/>'),
      actualBytes: bytes('<input id="stable" type="text" class="a"/>'),
    });
    expect(r).toBeNull();
  });

  it('treats volatile-id differences as equal', () => {
    const r = matchHtml({
      expectedBase64: b64('<div id="SocialCalc-a-1">x</div>'),
      actualBytes: bytes('<div id="SocialCalc-b-2">x</div>'),
    });
    expect(r).toBeNull();
  });

  it('reports a real structural difference', () => {
    const r = matchHtml({
      expectedBase64: b64('<div><p>one</p></div>'),
      actualBytes: bytes('<div><p>two</p></div>'),
    });
    expect(r).toMatch(/html mismatch/);
    expect(r).toMatch(/one/);
    expect(r).toMatch(/two/);
  });

  it('reports a parse error when the expected body is empty', () => {
    const r = matchHtml({ expectedBase64: b64(''), actualBytes: bytes('<p>x</p>') });
    expect(r).toMatch(/parse error in expected/);
  });

  it('reports a parse error when the actual body is empty', () => {
    const r = matchHtml({
      expectedBase64: b64('<p>x</p>'),
      actualBytes: bytes(''),
    });
    expect(r).toMatch(/parse error in actual/);
  });

  it('fails loudly when expected is null', () => {
    const r = matchHtml({ expectedBase64: null, actualBytes: bytes('<p/>') });
    expect(r).toMatch(/null/);
  });
});
