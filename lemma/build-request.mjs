#!/usr/bin/env bun
/**
 * Concatenate the current Leanstral request into lemma/request.md.
 * Deterministic: same inputs → identical request.md (no timestamps).
 *
 *   bun run verify:request
 *   # or: bun lemma/build-request.mjs
 *
 * Then:
 *   omp --print --no-tools --no-session --mode text \
 *     --model mistral/labs-leanstral-1-5-1 @lemma/request.md
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) throw new Error(`missing ${rel} — run verify:context / verify:lean first`);
  return readFileSync(p, 'utf8');
}

const parts = [
  ['lemma/prompt.md', read('lemma/prompt.md')],
  ['lemma/context.md', read('lemma/context.md')],
  ['lemma/xlsx-a1.def.lean', read('lemma/xlsx-a1.def.lean')],
  ['lemma/xlsx-a1.types.lean', read('lemma/xlsx-a1.types.lean')],
];

const out = parts
  .map(([path, body]) => `===== BEGIN ${path} =====\n${body.trimEnd()}\n===== END ${path} =====\n`)
  .join('\n');

writeFileSync(join(here, 'request.md'), out);
console.log(`wrote ${join(here, 'request.md')} (${out.length} bytes)`);
