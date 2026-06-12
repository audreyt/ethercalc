/**
 * Close ethercalc issues fixed in socialcalc@3.0.4.
 * Run: bun scripts/close-socialcalc-3.0.4-issues.ts [--dry-run]
 */
const dryRun = process.argv.includes('--dry-run');

const closes: Array<{ issue: number; body: string }> = [
  {
    issue: 88,
    body: [
      'Verified fixed with `socialcalc@3.0.4` (bundled in `@ethercalc/socialcalc-headless`).',
      '',
      '**Evidence:** `OffsetFormulaCoords` now doubles every embedded quote in string literals (`replace(/"/g, \'""\')`).',
      'Covered by `packages/socialcalc-headless/test/smoke.test.ts` and upstream `formula-quote-escaping.test.ts`.',
      '',
      'Reopen if you can still reproduce on current `main`.',
    ].join('\n'),
  },
  {
    issue: 493,
    body: [
      'Verified fixed with `socialcalc@3.0.4`.',
      '',
      '**Evidence:** fill/paste/copy no longer mangle VB-style `""` inside formula strings.',
      'Covered by `packages/socialcalc-headless/test/smoke.test.ts` and upstream `formula-quote-escaping.test.ts`.',
      '',
      'Reopen if you can still reproduce on current `main`.',
    ].join('\n'),
  },
  {
    issue: 512,
    body: [
      'Verified fixed with `socialcalc@3.0.4`.',
      '',
      '**Evidence:** pasting HTML formulas preserves doubled quotes in string literals.',
      'Covered by upstream `formula-quote-escaping.test.ts`.',
      '',
      'Reopen if you can still reproduce on current `main`.',
    ].join('\n'),
  },
  {
    issue: 501,
    body: [
      'Verified fixed with `socialcalc@3.0.4`.',
      '',
      '**Evidence:** `DetermineValueType` recognizes `https://` URLs as text-link (`tl`).',
      'Covered by `packages/socialcalc-headless/test/smoke.test.ts` and upstream `formula-quote-escaping.test.ts`.',
      '',
      'Reopen if you can still reproduce on current `main`.',
    ].join('\n'),
  },
  {
    issue: 358,
    body: [
      'Verified fixed with `socialcalc@3.0.4`.',
      '',
      '**Evidence:** Page Up/Down uses the visible row span when scroll positions are known.',
      'Covered by upstream `page-scroll.test.ts`.',
      '',
      'Reopen if you can still reproduce on current `main`.',
    ].join('\n'),
  },
];

for (const { issue, body } of closes) {
  if (dryRun) {
    console.log(`#${issue} (dry-run)`);
    continue;
  }
  Bun.spawnSync(
    ['gh', 'issue', 'comment', String(issue), '--repo', 'audreyt/ethercalc', '--body', body],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  Bun.spawnSync(
    ['gh', 'issue', 'close', String(issue), '--repo', 'audreyt/ethercalc', '--reason', 'completed'],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  console.log(`closed #${issue}`);
}