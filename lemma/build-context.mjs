#!/usr/bin/env bun
/**
 * Build lemma/context.md from shipping sources.
 * Deterministic: same sources → identical context.md (no timestamps).
 *
 *   bun run verify:context
 *   # or: bun lemma/build-context.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

function read(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    const hint = rel.startsWith('../socialcalc/')
      ? `\n  verify:context needs a sibling audreyt/socialcalc checkout at ../socialcalc\n` +
        `  (git clone https://github.com/audreyt/socialcalc ../socialcalc).\n` +
        `  Tracked lemma/context.md and lemma/request.md remain usable without regen.`
      : '';
    throw new Error(`missing ${rel}${hint}`);
  }
  return readFileSync(p, 'utf8');
}

function extract(source, startRe, endRe) {
  const start = source.search(startRe);
  if (start < 0) throw new Error(`start not found: ${startRe}`);
  const rest = source.slice(start);
  const endMatch = rest.search(endRe);
  if (endMatch < 0) return rest;
  return rest.slice(0, endMatch).trimEnd();
}

const xlsxBuild = read('packages/worker/src/lib/xlsx-build.ts');
const xlsxImport = read('packages/worker/src/lib/xlsx-import.ts');
const buildTest = read('packages/worker/test/xlsx-build.node.test.ts');
const importTest = read('packages/worker/test/xlsx-import.node.test.ts');
const socialA1 = read('../socialcalc/lemma/a1.ts');
const socialDfy = read('../socialcalc/lemma/a1.dfy');
const facade = read('lemma/xlsx-a1.ts');

const encodeParse = extract(
  xlsxBuild,
  /\/\*\* Parse "A1"/,
  /\n\/\*\*\n \* Translate one SocialCalc cell/,
);

const colLettersMatch = xlsxImport.match(
  /function colLetters\(c: number\): string \{[\s\S]*?\n\}/,
);
if (!colLettersMatch) throw new Error('colLetters not found');
const colLettersBlock = colLettersMatch[0];

const lastcolCall = extract(
  xlsxImport,
  /export function workbookToLoadClipboardCommand/,
  /\n\/\*\*\n \* Convert a binary workbook into the pair/,
);

const columnLimit = extract(
  xlsxImport,
  /\/\*\* SocialCalc max column \(1-based ZZ\)/,
  /\nexport const MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES/,
);

const enforceCol = extract(
  xlsxImport,
  /\/\*\*\n \* Reject worksheets that touch any column beyond SocialCalc/,
  /\ninterface SheetJSCell/,
);

const existingBuildTests = extract(
  buildTest,
  /describe\('parseCoord \/ encodeColumn'/,
  /\ndescribe\('translateCell'/,
);

const existingImportTests = extract(
  importTest,
  /describe\('SocialCalc ZZ column ceiling on import'/,
  /\ndescribe\('xlsxToLoadClipboardCommands'/,
);

const socialClamp = extract(
  socialA1,
  /export const MAX_COL = 702/,
  /\nexport function isColInBounds/,
);
const dfyBounds = extract(
  socialDfy,
  /function clampCol\(c: int\): int/,
  /\nfunction offsetCol/,
);
const dfyRanks = extract(
  socialDfy,
  /function colFromRcRanks\(colhigh: int, collow: int\): int/,
  /\nfunction colToRcRanks/,
);

const out = `# Leanstral / LemmaScript context pack — xlsx A1 column codec

Generator: lemma/build-context.mjs
Repo root: ethercalc (sibling ../socialcalc)
Deterministic: re-run yields identical bytes for unchanged sources.

## Reproduce

\`\`\`bash
# From ~/w/ethercalc:
bun run verify:context
# or: bun lemma/build-context.mjs

# LemmaScript (root scripts, lemmascript@0.5.13):
bun run verify:lean
bun run verify:dafny

# Leanstral pump request:
bun run verify:request
omp --print --no-tools --no-session --mode text \\
  --model mistral/labs-leanstral-1-5-1 @lemma/request.md
\`\`\`

## Purpose

Discover boundary/invariant cases for the EtherCalc xlsx A1 column codec
that existing point tests miss. Production shipping code is the oracle;
the LemmaScript facade is a reduced integer model for Dafny CI and Leanstral.

## Empirical finding (pre-Leanstral)

SocialCalc \`coordToCr("AAA1")\` returns \`{col:0}\` and \`ExecuteSheetCommand\`
silently drops the cell. A 703-column workbook previously produced a save
missing AAA1 and a \`copiedfrom\` range that never reached AAA. Production
now rejects such imports with \`ImportColumnOutOfRangeError\` before replay.

## Leanstral Attempt 2 high-impact challenge (corrected)

Model claimed \`colLetters(lastcol - 1)\` underflows because it treated
\`sheet.attribs.lastcol\` as SheetJS 0-based. The callsite reads the
**replayed SocialCalc sheet**, where \`lastcol\` is 1-based (A=1, ZZ=702).
So \`colLetters(lastcol - 1)\` is the correct 0↔1 adapter, not a bug.
Promoted public regression: A1:ZZ1 clipboard must encode
\`copiedfrom\\\\cA1\\\\cZZ1\` (and A1-only → \`A1:A1\`).
Historical Attempt 2 capture: \`spikes/leanstral-xlsx-coords/leanstral-raw.md\`.

## 1. Shipping encodeColumn / parseCoord (verbatim)

Source: \`packages/worker/src/lib/xlsx-build.ts\`

\`\`\`typescript
${encodeParse}
\`\`\`

## 2. Shipping colLetters (verbatim, private)

Source: \`packages/worker/src/lib/xlsx-import.ts\`

\`\`\`typescript
${colLettersBlock}
\`\`\`

## 3. lastcol callsite (verbatim)

Source: \`packages/worker/src/lib/xlsx-import.ts\`

\`\`\`typescript
${lastcolCall}
\`\`\`

## 4. Production ZZ ceiling (verbatim)

Source: \`packages/worker/src/lib/xlsx-import.ts\`

\`\`\`typescript
${columnLimit}

${enforceCol}
\`\`\`

## 5. Existing tests (verbatim excerpts)

### packages/worker/test/xlsx-build.node.test.ts

\`\`\`typescript
${existingBuildTests}
\`\`\`

### packages/worker/test/xlsx-import.node.test.ts

\`\`\`typescript
${existingImportTests}
\`\`\`

## 6. Upstream SocialCalc bounds (verbatim)

### lemma/a1.ts (MAX_COL + clamp)

\`\`\`typescript
${socialClamp}
\`\`\`

### lemma/a1.dfy (clampCol + colFromRcRanks)

\`\`\`dafny
${dfyBounds}

${dfyRanks}
\`\`\`

## 7. LemmaScript facade (verbatim)

Source: \`lemma/xlsx-a1.ts\`

\`\`\`typescript
${facade}
\`\`\`

## Correspondence limits

- SheetJS 0-based vs SocialCalc 1-based: do not co-prove without 0↔1 shim.
- Facade omits string builders; Bun locks letter strings.
- Leanstral output is not authoritative until promoted to a Bun test against
  shipping public APIs. A **passing** test that defends a model-authored
  plausible bug (even when the model premise is wrong) is a valid promotion.

## Leanstral status

Historical Attempt 2: \`spikes/leanstral-xlsx-coords/leanstral-raw.md\`.
Maintained workflow: \`lemma/README.md\`.
`;

writeFileSync(join(here, 'context.md'), out);
console.log(`wrote ${join(here, 'context.md')} (${out.length} bytes)`);
