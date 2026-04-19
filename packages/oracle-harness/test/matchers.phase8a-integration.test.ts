/**
 * Integration-ish tests that exercise the full Phase-8a matcher path
 * via `dispatchMatcher` — the same entry point `replay.ts` uses — to
 * confirm the new matchers compose cleanly with the existing
 * scenario/replay plumbing.
 *
 * These tests complement the per-matcher unit files and add
 * edge-case coverage that would clutter the focused test files.
 */

import { describe, it, expect } from 'vitest';

import {
  dispatchMatcher,
  encodeBase64,
  type MatcherContext,
} from '../src/matchers.ts';
import { canonicalizeHtml } from '../src/html-canonical.ts';
import { buildBasicOds, buildBasicXlsx, buildCorruptedZip } from './zip-fixtures.ts';

function b64(text: string): string {
  return encodeBase64(new TextEncoder().encode(text));
}

function bytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

describe('dispatchMatcher — html edge cases', () => {
  it('handles a realistic SocialCalc-style table with volatile ids', () => {
    const oracle = `<html><body>
      <table id="SocialCalc-table-00aabbccdd">
        <tr><td id="SocialCalc-cell-A1">1</td></tr>
        <tr><td id="SocialCalc-cell-A2">2</td></tr>
      </table>
    </body></html>`;
    const target = `<html><body>
      <table id="SocialCalc-table-11223344">
        <tr><td id="SocialCalc-cell-A1">1</td></tr>
        <tr><td id="SocialCalc-cell-A2">2</td></tr>
      </table>
    </body></html>`;
    expect(
      dispatchMatcher('html', {
        expectedBase64: b64(oracle),
        actualBytes: bytes(target),
      } satisfies MatcherContext),
    ).toBeNull();
  });

  it('diffs a table where a cell value changed (matcher-reported diff)', () => {
    const oracle = '<html><body><table><tr><td>1</td></tr></table></body></html>';
    const target = '<html><body><table><tr><td>2</td></tr></table></body></html>';
    const r = dispatchMatcher('html', {
      expectedBase64: b64(oracle),
      actualBytes: bytes(target),
    });
    expect(r).toMatch(/html mismatch/);
    expect(r).toMatch(/<td>1<\/td>/);
    expect(r).toMatch(/<td>2<\/td>/);
  });

  it('treats two HTML docs that only differ in comment content as equal', () => {
    const oracle = '<html><body><!-- build 100 --><p>x</p></body></html>';
    const target = '<html><body><!-- build 999 --><p>x</p></body></html>';
    expect(
      dispatchMatcher('html', {
        expectedBase64: b64(oracle),
        actualBytes: bytes(target),
      }),
    ).toBeNull();
  });
});

describe('canonicalizeHtml — additional edge cases', () => {
  it('handles deeply nested whitespace', () => {
    const a = canonicalizeHtml('<div><ul><li>1</li><li>2</li></ul></div>').canonical;
    const b = canonicalizeHtml(`
      <div>
        <ul>
          <li>1</li>
          <li>2</li>
        </ul>
      </div>
    `).canonical;
    expect(a).toBe(b);
  });

  it('keeps empty elements (<br/>, <hr/>, <input/>) stable across re-serialization', () => {
    const { canonical } = canonicalizeHtml('<html><body><br/><hr/><input/></body></html>');
    // Void elements should round-trip.
    expect(canonical).toContain('<br>');
    expect(canonical).toContain('<hr>');
    expect(canonical).toContain('<input>');
  });
});

describe('dispatchMatcher — xlsx/ods edge cases', () => {
  it('routes xlsx through compareZipArchives', () => {
    const xlsx = buildBasicXlsx();
    const r = dispatchMatcher('xlsx', { expectedBase64: encodeBase64(xlsx), actualBytes: xlsx });
    expect(r).toBeNull();
  });

  it('routes ods through compareZipArchives', () => {
    const ods = buildBasicOds();
    const r = dispatchMatcher('ods', { expectedBase64: encodeBase64(ods), actualBytes: ods });
    expect(r).toBeNull();
  });

  it('returns a terse diff for corrupted-both-sides', () => {
    const bad = buildCorruptedZip();
    const r = dispatchMatcher('xlsx', {
      expectedBase64: encodeBase64(bad),
      actualBytes: bad,
    });
    expect(r).toMatch(/xlsx mismatch/);
    expect(r).toMatch(/not a valid zip/);
  });

  it('xlsx fails loudly when expected is null', () => {
    const r = dispatchMatcher('xlsx', { expectedBase64: null, actualBytes: buildBasicXlsx() });
    expect(r).toMatch(/null/);
  });

  it('ods fails loudly when expected is null', () => {
    const r = dispatchMatcher('ods', { expectedBase64: null, actualBytes: buildBasicOds() });
    expect(r).toMatch(/null/);
  });
});
