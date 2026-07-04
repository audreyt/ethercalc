import { describe, expect, test } from 'bun:test';

import {
  buildAssetPlan,
  patchSocialCalcRuntime,
  REQUIRED_ICON_FILES,
  REQUIRED_LOCALES,
} from './build-assets.ts';

describe('patchSocialCalcRuntime', () => {
  test('removes SocialCalc UMD strict-mode wrappers and injects sanitizer hook', () => {
    const input = `(function (root, factory) {\n    "use strict";\n  factory(root);\n})(this, function (window) {\n"use strict";\nif (valueformat=="text-html") { // HTML - output as it as is\n   ;\n}\n});`;

    const patched = patchSocialCalcRuntime(input);

    expect(patched).not.toContain('(function (root, factory) {\n    "use strict";');
    expect(patched).not.toContain('function (window) {\n"use strict";');
    expect(patched).toContain(
      'displayvalue = (SocialCalc.sanitizeHTML ? SocialCalc.sanitizeHTML(displayvalue) : displayvalue);',
    );
  });

  test('throws when the text-html render sink marker is missing', () => {
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
