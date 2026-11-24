import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'bun:test';

import {
  buildAssetPlan,
  patchSocialCalcRuntime,
  REQUIRED_ICON_FILES,
  REQUIRED_LOCALES,
} from './build-assets.ts';

describe('patchSocialCalcRuntime', () => {
  test('3.1.0: applies the guarded runtime transform', () => {
    const input = readFileSync(
      new URL('../packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js', import.meta.url),
      'utf8',
    );

    const patched = patchSocialCalcRuntime(input);

    expect(patched).not.toContain("(function (root, factory) {\n  'use strict';");
    expect(patched).toContain('EscapeUntrustedHtml');
    expect(patched).toContain('sheet.cells = Object.create(null);');
    expect(patched).toContain("if (s === undefined) return '';");
    expect(patched).toContain('if (parts[1] - 0 > (sheetobj.valueformats.length || 1)) break;');
    expect(patched).toContain('sheet.ioEventTree = Object.create(null);');
    expect(patched).toContain("v = SocialCalc.SafeValueType(parts[j++] || '');");
    expect(patched).toContain('cell.valuetype = SocialCalc.SafeValueType(rest.substring(0, pos));');
    expect(patched).toContain('return SocialCalc.special_chars(String(displayvalue));');
    expect(patched).toContain('SocialCalc.special_chars(operandstr)');
    expect(patched).toContain('if (/[, \\r\\n"]/.test(str)) {');
    expect(patched).toContain('SocialCalc.FormatNumber.plain_text = true;');
    expect(patched).not.toContain('&(amp|lt|gt|quot);');
    expect(patched).toContain(
      'SocialCalc.special_chars(String(editor.context.colwidth[mouseinfo.mouseresizecolnum])) +',
    );
    expect(patched).toContain(
      'SocialCalc.special_chars(String(editor.context.rowheight[mouseinfo.mouseresizerownum])) +',
    );
    expect(patched).toContain('SocialCalc.special_chars(spcdata.value) +');
    expect(patched).not.toContain("      spcdata.value +\n      '\"><br><br>' +");
    expect(patched).toContain('      SocialCalc.special_chars(whichpart) +');
    expect(patched).toContain("SocialCalc.CtrlSEditorDone('socialcalc-editbox', whichpart);");
    expect(patched).not.toContain('onclick="SocialCalc.CtrlSEditorDone');
    expect(patched).toContain("s.replace(/\\r\\n?|[\\n\\u2028\\u2029]/g, '\\\\n')");
    expect(patched).toContain('SocialCalc.ExecAtSaveLineStart(boundaryregex, str)');
    expect(patched).not.toContain('boundaryregex.exec(str)');
    expect(patched).not.toContain('coordToCol');
    expect(patched).not.toContain('coordToRow');
    expect(patched).toContain('stylestr = SocialCalc.SafeCellStyle(stylestr);');
    expect(patched).toContain("line.charAt(i - 1) == '!' ||");
    expect(patched).not.toContain("str.charAt(str.length - 1) == '!' ||");
    expect(patched).not.toMatch(/while \(\s*[\w.]+\.colattribs\.hide\[/);
    expect(patched.match(/ < 702 && [\w.]+\.colattribs\.hide\[/g)).toHaveLength(9);
    expect(patched).toContain('while (col > 0 && col < 702 &&');
    expect(patched).toContain('for (; value > 0 && isFinite(f); value--) {');
    expect(patched).not.toContain('for (; value > 0; value--) {');
    expect(patched).toContain('if (!(spancells <= skipbudget)) continue;');
    expect(patched).toContain('if (cell.colspan > 1 && context.coordToCR[coord]) {');
    expect(patched).toContain('if (cell.rowspan > 1 && context.coordToCR[coord]) {');
    expect(patched).toContain('cond = SocialCalc.Formula.WildcardMatch(value, criteria.toLowerCase());');
    expect(patched).not.toContain('new RegExp(basevalue.value)');
    expect(patched).not.toContain('/(.+)');
    expect(patched).not.toContain("result.replace(/ *$/, '')");
    expect(patched).toContain('!SocialCalc.RecalcRangeAllowed(coordvals, parseinfo)');
    expect(patched).not.toContain(String.raw`(\d*,\d*)+`);
    expect(patched).toContain('SocialCalc.ContainsHtmlElement(tvalue)');
    expect(patched).toContain('scfn.format_definitions_size > 32768');
    expect(patched).toContain('if (!TableEditorSC.IsSavedEditorPane(parts, 1048576)) break;');
    expect(patched).toContain('if (!TableEditorSC.IsSavedEditorPane(parts, 702)) break;');
    expect(patched).toContain(
      'if (range.hasrange || !TableEditorSC.IsSavedEditorRange(parts)) break;',
    );
    expect(
      patched.split('if (parseinfo.some((token) => token.type === tokentype.error)) return formula;'),
    ).toHaveLength(4);
    expect(patched).toContain('for (num in sheetobj.fonts)');
    expect(patched).toContain('for (num in sheetobj.layouts)');
    expect(patched).toContain("eresult = { value: 0, type: 'e#VALUE!', error: 'Formula failed' };");
    expect(patched).toContain('Object.prototype.hasOwnProperty.call(typelookup, type1)');
  });

  test('3.1.0: rejects a changed render path', () => {
    const input = readFileSync(
      new URL('../packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js', import.meta.url),
      'utf8',
    );
    const changed = input.replace('result += operandstr;', 'result += operandstr.trim();');
    expect(() => patchSocialCalcRuntime(changed)).toThrow(/number format literal/);
  });

  test('3.1.0: rejects a changed hidden column scan', () => {
    const input = readFileSync(
      new URL('../packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js', import.meta.url),
      'utf8',
    );
    const changed = input.replace(
      "while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] == 'yes') {",
      "while (editor.context.sheetobj.colattribs.hide[SocialCalc.rcColname(col)] === 'yes') {",
    );
    expect(() => patchSocialCalcRuntime(changed)).toThrow(/hidden column scan transform expected 9/);
  });


  test('3.0.x: strips strict-mode and injects sanitizer hook for pre-3.1.0 runtime', () => {
    const input = `(function (root, factory) {\n    "use strict";\n  factory(root);\n})(this, function (window) {\n"use strict";\nif (valueformat=="text-html") { // HTML - output as it as is\n   ;\n}\n});`;

    const patched = patchSocialCalcRuntime(input);

    expect(patched).not.toContain('(function (root, factory) {\n    "use strict";');
    expect(patched).not.toContain('function (window) {\n"use strict";');
    expect(patched).toContain(
      'displayvalue = (SocialCalc.sanitizeHTML ? SocialCalc.sanitizeHTML(displayvalue) : displayvalue);',
    );
  });

  test('throws when neither the 3.1.0 security model nor the pre-3.1.0 text-html sink is found', () => {
    expect(() => patchSocialCalcRuntime('function untouched() {}')).toThrow(
      /text-html sanitize hook not injected/,
    );
  });
});

describe('buildAssetPlan', () => {
  test('keeps the legacy required file contract explicit', () => {
    const plan = buildAssetPlan('/repo');

    expect(REQUIRED_ICON_FILES).toEqual([
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'android-chrome-192x192.png',
      'apple-touch-icon.png',
      'mstile-150x150.png',
      'mstile-310x310.png',
      'safari-pinned-tab.svg',
      'browserconfig.xml',
      'manifest.json',
    ]);
    expect(REQUIRED_LOCALES).toEqual(['en', 'de', 'es-ES', 'fr', 'ru-RU', 'zh-CN', 'zh-TW']);
    expect(plan.requiredFiles).toContain('/repo/index.html');
    expect(plan.requiredFiles).toContain('/repo/packages/client/dist/player.js');
    expect(plan.requiredDirectories).toContain('/repo/packages/client-multi/dist');
    expect(plan.requiredDirectories).toContain('/repo/packages/client/dist-passkey');
    expect(plan.staticCopies).toContainEqual({ from: '/repo/start.html', to: 'start.html' });
    expect(plan.directoryCopies).toContainEqual({ from: '/repo/images', to: 'images' });
    // Directory-copied (not a single named file, matching client-multi's
    // treatment): `@m3e/web`'s internal chunk-splitting is unverified, so
    // whatever Rollup emits into `dist-passkey/` ships wholesale.
    expect(plan.directoryCopies).toContainEqual({
      from: '/repo/packages/client/dist-passkey',
      to: 'static/passkey',
    });
    // Served alongside the passkey bundle so the license-notice banner
    // baked into `dist-passkey/ui.js` points somewhere the deployed site
    // can actually serve (not just a repo-root path git-only readers can
    // resolve) - see vite.passkey.config.ts's `licenseNoticeBanner`.
    expect(plan.staticCopies).toContainEqual({
      from: '/repo/third-party/m3e/NOTICE',
      to: 'static/passkey/NOTICE',
    });
  });
});

describe('passkey UI asset references', () => {
  test('index.html and start.html reference the pinned passkey entry path', () => {
    // `vite.passkey.config.ts` pins `entryFileNames: 'ui.js'` specifically
    // so these two STATIC (not Vite-built) HTML files can reference a
    // stable path — a real build confirmed Vite's default naming is
    // content-hashed (e.g. `assets/ui-DT5s7B6u.js`), which static HTML can
    // never reference. Both files must point at the same pinned path.
    for (const file of ['index.html', 'start.html']) {
      const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
      expect(html).toContain('./static/passkey/ui.js');
      expect(html).not.toMatch(/static\/passkey\.js/);
      expect(html).not.toMatch(/vex/i);
    }
  });

  test('index.css carries no dead vex CSS from the deleted static/vex*.css files', () => {
    // Deleting static/vex.css/vex-theme-flat-attack.css didn't stop
    // shipping vex's rules — they were also duplicated inline into
    // static/index.css (still `<link>`ed from index.html). Guards against
    // that dead weight (and its now-broken vendor SASS attribution)
    // coming back.
    const css = readFileSync(new URL('../static/index.css', import.meta.url), 'utf8');
    expect(css).not.toMatch(/vex/i);
  });
});

describe('package manifest (npm pack)', () => {
  // Behavioral test: packs from the actual repo tree and asserts no
  // test/e2e/oracle/stryker artifacts leak into the published tarball.
  // This catches directory-level leaks that individual file exclusions
  // in package.json `files[]` miss.
  test('tarball excludes e2e, oracle-harness, stryker-setup, and test artifacts', async () => {
    // --ignore-scripts: prepack is orthogonal to this test's contract (file
    // inclusion/exclusion) and would rebuild assets via `vp build`, which is
    // unnecessary here and can fail in sandboxes without a global `vite`.
    const proc = Bun.spawn(['bun', 'pm', 'pack', '--dry-run', '--ignore-scripts'], {
      cwd: import.meta.dir + '/..',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    const [stdout] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);

    // Parse the output lines from `bun pm pack --dry-run` to extract packed paths.
    // Each packed line starts with 'packed <size> <path>'
    const paths = stdout
      .split('\n')
      .filter((line) => line.startsWith('packed '))
      .map((line) => {
        const parts = line.split(' ');
        return parts.slice(2).join(' ').trim();
      })
      .filter(Boolean);

    // Forbidden artifacts that must never ship.
    const forbidden = [
      /packages\/e2e\//,
      /packages\/oracle-harness\//,
      /stryker-setup-.*\.js$/,
      /\/test\//,
      /\/tests\//,
      /\.stryker-tmp\//,
      /playwright-report\//,
      /test-results\//,
      /coverage\//,
      /vitest\.config\./,
      /vitest\.node\.config\./,
      /playwright\.config\./,
      /stryker\.conf\.json$/,
      /packages\/worker\/dist\//,
    ];

    const leaked = paths.filter((p) => forbidden.some((re) => re.test(p)));
 expect(leaked).toEqual([]);
  });
});
