import { describe, it, expect } from 'vite-plus/test';

import {
  DANGEROUS_ELEMENTS,
  URL_ATTRIBUTES,
  isEventHandlerAttribute,
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

describe('DANGEROUS_ELEMENTS', () => {
  it('covers the active-content tags', () => {
    expect(DANGEROUS_ELEMENTS).toEqual(['script', 'iframe', 'object', 'embed']);
  });
});

describe('URL_ATTRIBUTES', () => {
  it('lists the URL-bearing attributes we scheme-check', () => {
    expect(URL_ATTRIBUTES).toEqual(['href', 'src', 'xlink:href']);
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
});

describe('isUnsafeUrlValue', () => {
  it('flags javascript:/data:/vbscript: schemes', () => {
    expect(isUnsafeUrlValue('javascript:alert(1)')).toBe(true);
    expect(isUnsafeUrlValue('data:text/html,<script>')).toBe(true);
    expect(isUnsafeUrlValue('vbscript:msgbox(1)')).toBe(true);
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
  });

  it('keeps non-URL, non-handler attributes even with colon-y values', () => {
    expect(attributeAction('title', 'javascript:not-a-url')).toBe('keep');
    expect(attributeAction('class', 'foo')).toBe('keep');
  });
});
