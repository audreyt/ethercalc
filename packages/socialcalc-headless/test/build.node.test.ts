import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  transformSocialCalcSource,
  wrapSocialCalcSource,
  generateBundle,
  TransformError,
} from '../scripts/build.js';

/**
 * A minimal-but-representative slice of the real UMD shape emitted by
 * `github:audreyt/socialcalc`'s `dist/SocialCalc.js` — the actual
 * `(function (root, factory) { … })(typeof globalThis !== 'undefined' ?
 * globalThis : this, function (window) { … })` wrapper, plus one
 * `document.createElement(` and one `alert(` call site drawn from real
 * SocialCalc render/popup code, so the three required patterns and their
 * real-world contexts are exercised without inlining the whole 800KB file.
 */
function fixture(): string {
  return [
    "(function (root, factory) {",
    "  'use strict';",
    "  var exported = factory.call(root, root);",
    "  root.SocialCalc = exported;",
    "  if (typeof module === 'object' && module && module.exports) {",
    "    module.exports = exported;",
    "  }",
    "})(typeof globalThis !== 'undefined' ? globalThis : this, function (window) {",
    "  'use strict';",
    "  var SocialCalc = {};",
    "  SocialCalc.CreateCellHTML = function () {",
    "    return document.createElement('span');",
    "  };",
    "  SocialCalc.ShowToolbar = function (id) {",
    "    if (!SocialCalc.ButtonElements[id]) {",
    "      alert('Missing element: ' + id);",
    "    }",
    "  };",
    "  return SocialCalc;",
    "});",
  ].join('\n');
}

describe('transformSocialCalcSource', () => {
  it('rewrites createElement/alert/globalThis for a well-formed fixture', () => {
    const out = transformSocialCalcSource(fixture());

    expect(out).toContain('SocialCalc.document.createElement(');
    expect(out).not.toMatch(/[^.]document\.createElement\(/);
    expect(out).toContain("(function(){})('Missing element: ' + id)");
    expect(out).not.toContain('alert(');
    expect(out).toContain(
      "})(this, function (window) {",
    );
    expect(out).not.toContain("typeof globalThis !== 'undefined' ? globalThis : this");
  });

  it('throws a precise TransformError when document.createElement( is absent (renamed/removed upstream)', () => {
    const drifted = fixture().replace('document.createElement(', 'doc.createElement(');

    expect(() => transformSocialCalcSource(drifted)).toThrow(TransformError);
    expect(() => transformSocialCalcSource(drifted)).toThrow(/document\.createElement\(.*matched 0/);
  });

  it('throws a precise TransformError when alert( is absent (error path removed upstream)', () => {
    const drifted = fixture().replace("alert('Missing element: ' + id);\n", '');

    expect(() => transformSocialCalcSource(drifted)).toThrow(TransformError);
    expect(() => transformSocialCalcSource(drifted)).toThrow(/"alert\(".*matched 0/);
  });

  it('throws a precise TransformError when the globalThis fallback marker drifts (e.g. self instead of globalThis)', () => {
    const drifted = fixture().replace(
      "typeof globalThis !== 'undefined' ? globalThis : this",
      "typeof self !== 'undefined' ? self : this",
    );

    expect(() => transformSocialCalcSource(drifted)).toThrow(TransformError);
    expect(() => transformSocialCalcSource(drifted)).toThrow(/globalThis fallback.*matched 0/);
  });

  it('throws when the globalThis fallback marker appears more than once (unsafe to target with a single replace)', () => {
    const duplicated = `${fixture()}\n// duplicate wrapper site\nvar g2 = typeof globalThis !== 'undefined' ? globalThis : this;`;

    expect(() => transformSocialCalcSource(duplicated)).toThrow(TransformError);
    expect(() => transformSocialCalcSource(duplicated)).toThrow(/globalThis fallback.*matched 2.*expected exactly 1/);
  });

  it('does not throw on repeated document.createElement(/alert( occurrences — only the globalThis marker requires exactly one', () => {
    const repeated = fixture() + '\n  document.createElement("div");\n  alert("again");\n';

    expect(() => transformSocialCalcSource(repeated)).not.toThrow();
  });
});

describe('wrapSocialCalcSource', () => {
  it('embeds the patched source inside the host-binding factory module', () => {
    const patched = transformSocialCalcSource(fixture());
    const wrapped = wrapSocialCalcSource(patched);

    expect(wrapped).toContain("import { ShimNode } from './dom-shim';");
    expect(wrapped).toContain('export function createSocialCalcFactory()');
    expect(wrapped).toContain(patched);
    expect(wrapped).toContain('SocialCalc.document.createElement = function (tag) { return new ShimNode(tag); };');
  });
});

describe('generateBundle', () => {
  const cleanups: string[] = [];
  afterEach(() => {
    for (const p of cleanups.splice(0)) fs.rmSync(p, { force: true, recursive: true });
  });

  it('generates byte-identical output to the tracked bundle for the currently installed SocialCalc', () => {
    const headlessRoot = path.resolve(__dirname, '..');
    const trackedOutput = path.join(headlessRoot, 'src/socialcalc.bundled.ts');
    const trackedBefore = fs.readFileSync(trackedOutput, 'utf8');

    const tmpOutput = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sc-headless-build-')), 'socialcalc.bundled.ts');
    cleanups.push(path.dirname(tmpOutput));

    const result = generateBundle({
      input: path.join(headlessRoot, 'node_modules/socialcalc/dist/SocialCalc.js'),
      output: tmpOutput,
    });

    expect(result.output).toBe(tmpOutput);
    const generated = fs.readFileSync(tmpOutput, 'utf8');
    expect(generated).toBe(trackedBefore);

    // Never overwrite/commit the tracked bundle from a test run.
    expect(fs.readFileSync(trackedOutput, 'utf8')).toBe(trackedBefore);
  });

  it('propagates the TransformError from a drifted input instead of writing a bad bundle', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-headless-build-fail-'));
    const badInput = path.join(dir, 'SocialCalc.js');
    const output = path.join(dir, 'socialcalc.bundled.ts');
    fs.writeFileSync(badInput, fixture().replace('document.createElement(', 'doc.createElement('));
    cleanups.push(dir);

    expect(() => generateBundle({ input: badInput, output })).toThrow(TransformError);
    expect(fs.existsSync(output)).toBe(false);
  });
});
