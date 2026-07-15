import { describe, expect, test } from 'bun:test';

import {
  buildAssetPlan,
  patchSocialCalcRuntime,
  REQUIRED_ICON_FILES,
  REQUIRED_LOCALES,
} from './build-assets.ts';

describe('patchSocialCalcRuntime', () => {
  test('3.1.0: strips strict-mode, leaves native security model intact (no injection)', () => {
    const input = `(function (root, factory) {\n  'use strict';\n  factory(root);\n})(this, function (window) {\n  'use strict';\nSC.EscapeUntrustedHtml = function () {};\n});`;

    const patched = patchSocialCalcRuntime(input);

    expect(patched).not.toContain("'use strict'");
    expect(patched).toContain('EscapeUntrustedHtml');
    expect(patched).not.toContain('SocialCalc.sanitizeHTML');
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
    expect(plan.staticCopies).toContainEqual({ from: '/repo/start.html', to: 'start.html' });
    expect(plan.directoryCopies).toContainEqual({ from: '/repo/images', to: 'images' });
  });
});

describe('package manifest (npm pack)', () => {
  // Behavioral test: packs from the actual repo tree and asserts no
  // test/e2e/oracle/stryker artifacts leak into the published tarball.
  // This catches directory-level leaks that individual file exclusions
  // in package.json `files[]` miss.
  test('tarball excludes e2e, oracle-harness, stryker-setup, and test artifacts', async () => {
    const proc = Bun.spawn(['bun', 'pm', 'pack', '--dry-run'], {
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
    ];

    const leaked = paths.filter((p) => forbidden.some((re) => re.test(p)));
 expect(leaked).toEqual([]);
  });
});
