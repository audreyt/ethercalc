#!/usr/bin/env bun
/**
 * Assert LemmaScript generated artifacts are fresh for this no-hand-proof
 * facade. After `lsc check --backend=dafny`, `.dfy` must equal `.dfy.gen`
 * (no hand proofs). After `lsc gen --backend=lean`, the Lean files must
 * match what is already on disk (CI: run gen then `git diff --exit-code`).
 *
 * Usage:
 *   bun lemma/assert-fresh.mjs dafny
 *   bun lemma/assert-fresh.mjs lean
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const mode = process.argv[2];

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (mode === 'dafny') {
  const dfy = join(here, 'xlsx-a1.dfy');
  const gen = join(here, 'xlsx-a1.dfy.gen');
  if (!existsSync(dfy) || !existsSync(gen)) {
    fail('missing lemma/xlsx-a1.dfy or .dfy.gen — run: bun run verify:dafny:regen');
  }
  const a = readFileSync(dfy);
  const b = readFileSync(gen);
  if (!a.equals(b)) {
    fail(
      'lemma/xlsx-a1.dfy !== lemma/xlsx-a1.dfy.gen\n' +
        'This facade has no hand proofs; keep them identical.\n' +
        'Fix: bun run verify:dafny:regen  (then commit both files)',
    );
  }
  console.log('dafny fresh: xlsx-a1.dfy == xlsx-a1.dfy.gen');
  process.exit(0);
}

if (mode === 'lean') {
  // After `lsc gen`, working tree Lean artifacts must match HEAD (CI) or
  // simply exist non-empty (local). Prefer git diff when inside a repo.
  try {
    const out = execFileSync(
      'git',
      ['diff', '--name-only', '--', 'lemma/xlsx-a1.def.lean', 'lemma/xlsx-a1.types.lean'],
      { cwd: root, encoding: 'utf8' },
    ).trim();
    if (out) {
      fail(
        `Lean artifacts dirty after gen:\n${out}\n` +
          'Commit regenerated lemma/xlsx-a1.{def,types}.lean or restore them.',
      );
    }
    console.log('lean fresh: no git diff on generated Lean files');
  } catch (e) {
    if (e && e.status === 1 && e.stdout) {
      // git diff --name-only rarely exits 1; keep message
      fail(String(e.stdout));
    }
    // Outside git: just require non-empty files
    for (const f of ['xlsx-a1.def.lean', 'xlsx-a1.types.lean']) {
      const p = join(here, f);
      if (!existsSync(p) || readFileSync(p).length === 0) {
        fail(`missing/empty lemma/${f}`);
      }
    }
    console.log('lean fresh: artifacts non-empty (no git)');
  }
  process.exit(0);
}

fail('usage: bun lemma/assert-fresh.mjs dafny|lean');
