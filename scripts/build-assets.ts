#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_ICON_FILES = [
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
] as const;

export const REQUIRED_LOCALES = ['en', 'de', 'es-ES', 'fr', 'ru-RU', 'zh-CN', 'zh-TW'] as const;

const ROOT_HTML_FILES = ['index.html', 'start.html', 'panels.html'] as const;

export interface CopyFileStep {
  readonly from: string;
  readonly to: string;
}

export interface CopyDirectoryStep {
  readonly from: string;
  readonly to: string;
}

export interface AssetBuildPlan {
  readonly root: string;
  readonly destination: string;
  readonly socialCalcCandidates: readonly string[];
  readonly playerBundle: string;
  readonly multiDist: string;
  readonly requiredFiles: readonly string[];
  readonly requiredDirectories: readonly string[];
  readonly staticCopies: readonly CopyFileStep[];
  readonly directoryCopies: readonly CopyDirectoryStep[];
}

export function buildAssetPlan(rootInput: string): AssetBuildPlan {
  const root = resolve(rootInput);
  const destination = join(root, 'assets');
  const playerBundle = join(root, 'packages/client/dist/player.js');
  const multiDist = join(root, 'packages/client-multi/dist');
  const socialCalcCandidates = [
    join(root, 'packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js'),
    join(root, 'node_modules/socialcalc/dist/SocialCalc.js'),
  ];

  const staticCopies: CopyFileStep[] = [
    ...ROOT_HTML_FILES.map((file) => ({ from: join(root, file), to: file })),
    ...REQUIRED_ICON_FILES.map((file) => ({ from: join(root, file), to: file })),
    { from: join(root, 'manifest.appcache'), to: 'manifest.appcache' },
    ...REQUIRED_LOCALES.map((locale) => ({
      from: join(root, 'l10n', `${locale}.json`),
      to: join('l10n', `${locale}.json`),
    })),
    { from: playerBundle, to: join('static', 'player.js') },
  ];

  const directoryCopies: CopyDirectoryStep[] = [
    { from: join(root, 'images'), to: 'images' },
    { from: join(root, 'static'), to: 'static' },
    { from: multiDist, to: 'multi' },
  ];

  return {
    root,
    destination,
    socialCalcCandidates,
    playerBundle,
    multiDist,
    requiredFiles: [...staticCopies.map((step) => step.from), playerBundle],
    requiredDirectories: directoryCopies.map((step) => step.from),
    staticCopies,
    directoryCopies,
  };
}

export function patchSocialCalcRuntime(input: string): string {
  // Strip UMD-level "use strict" wrappers (present in 3.0.x with double
  // quotes and 3.1.0 with single quotes; harmless in-browser but stripped
  // for parity).
  const stripped = input
    .replace('(function (root, factory) {\n    "use strict";', '(function (root, factory) {')
    .replace('function (window) {\n"use strict";', 'function (window) {')
    .replace("(function (root, factory) {\n  'use strict';", '(function (root, factory) {')
    .replace("function (window) {\n  'use strict';", 'function (window) {');

  // SocialCalc 3.1.0 ships its own opt-in rendering security model
  // (`untrustedContent`, `securityPolicy.sanitizeHtml`,
  // `EscapeUntrustedHtml`, `SafeUrlForRender`). The client enables it at
  // boot via `installSecurityPolicy` (see packages/client/src/sanitize-html.ts),
  // so no regex-injected sanitiser hook is needed.
  if (stripped.includes('EscapeUntrustedHtml')) {
    return stripped;
  }

  // Pre-3.1.0 fallback: inject the SocialCalc.sanitizeHTML hook into the
  // text-html render sink (the live-editor stored-XSS fix). The client
  // installs SocialCalc.sanitizeHTML at boot; if absent (old cached asset),
  // the branch falls back to the raw value.
  const htmlSink =
    "      displayvalue = (SocialCalc.sanitizeHTML ? SocialCalc.sanitizeHTML(displayvalue) : displayvalue);\n";
  const patched = stripped.replace(
    /(if\s*\(\s*valueformat\s*==\s*["']text-html["']\s*\)\s*)\{[\s\S]*?\}/,
    `$1{${"\n"}${htmlSink}    }`,
  );

  if (!patched.includes("SocialCalc.sanitizeHTML(displayvalue)")) {
    throw new Error(
      "text-html sanitize hook not injected into socialcalc.js (upstream render sink changed?)",
    );
  }

  return patched;
}
function destinationPath(plan: AssetBuildPlan, relativePath: string): string {
  return join(plan.destination, relativePath);
}

async function assertFile(path: string, message: string): Promise<void> {
  if (!existsSync(path) || !(await stat(path)).isFile()) throw new Error(message);
}

async function assertDirectory(path: string, message: string): Promise<void> {
  if (!existsSync(path) || !(await stat(path)).isDirectory()) throw new Error(message);
}

async function copyFileStep(plan: AssetBuildPlan, step: CopyFileStep): Promise<void> {
  const target = destinationPath(plan, step.to);
  await mkdir(dirname(target), { recursive: true });
  await cp(step.from, target);
}

async function copyDirectoryStep(plan: AssetBuildPlan, step: CopyDirectoryStep): Promise<void> {
  await cp(step.from, destinationPath(plan, step.to), { recursive: true });
}

async function findSocialCalc(plan: AssetBuildPlan): Promise<string> {
  for (const candidate of plan.socialCalcCandidates) {
    if (existsSync(candidate) && (await stat(candidate)).isFile()) return candidate;
  }
  throw new Error(`missing ${plan.socialCalcCandidates[0]} (run \`vp install\`)`);
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await Array.fromAsync(new Bun.Glob('**/*').scan({ cwd: dir, onlyFiles: true }));
  return entries.map((entry) => join(dir, entry));
}

async function summarize(dir: string): Promise<{ count: number; bytes: number }> {
  const files = await collectFiles(dir);
  const sizes = await Promise.all(files.map(async (file) => (await stat(file)).size));
  return { count: files.length, bytes: sizes.reduce((sum, size) => sum + size, 0) };
}

export async function buildAssets(rootInput = resolve(dirname(fileURLToPath(import.meta.url)), '..')): Promise<{
  readonly files: number;
  readonly bytes: number;
}> {
  const plan = buildAssetPlan(rootInput);
  const socialCalc = await findSocialCalc(plan);

  await assertFile(plan.playerBundle, `missing ${plan.playerBundle} (run \`vp run @ethercalc/client#build\`)`);
  await assertDirectory(plan.multiDist, `missing ${plan.multiDist} (run \`vp run @ethercalc/client-multi#build\`)`);

  console.log(`[build-assets] rebuilding ${plan.destination}`);
  await rm(plan.destination, { recursive: true, force: true });
  await mkdir(join(plan.destination, 'l10n'), { recursive: true });
  await mkdir(join(plan.destination, 'static'), { recursive: true });
  await mkdir(join(plan.destination, 'multi'), { recursive: true });
  await mkdir(join(plan.destination, 'images'), { recursive: true });

  for (const step of plan.staticCopies) await copyFileStep(plan, step);
  for (const step of plan.directoryCopies) await copyDirectoryStep(plan, step);

  const patchedSocialCalc = patchSocialCalcRuntime(await readFile(socialCalc, 'utf8'));
  await writeFile(join(plan.destination, 'static/socialcalc.js'), patchedSocialCalc);

  const summary = await summarize(plan.destination);
  console.log(`[build-assets] wrote ${summary.count} files, ${summary.bytes} bytes`);
  return { files: summary.count, bytes: summary.bytes };
}

if (import.meta.main) {
  try {
    await buildAssets();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[build-assets] FAIL: ${message}`);
    process.exit(1);
  }
}
