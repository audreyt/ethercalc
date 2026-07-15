import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

import {
  installSecurityPolicy,
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
});