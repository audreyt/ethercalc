/**
 * Close GitHub issues bucketed as close_fixed by triage-open-issues.ts.
 * Run: bun scripts/triage-open-issues.ts --http http://127.0.0.1:8787
 *      bun scripts/close-fixed-issues.ts [--dry-run]
 */
import { readFileSync } from 'node:fs';

const dryRun = process.argv.includes('--dry-run');
const reportPath = '/tmp/triage-report.json';

interface TriageRow {
  issue: number;
  title: string;
  bucket: string;
  evidence: string;
}

const rows = JSON.parse(readFileSync(reportPath, 'utf8')) as TriageRow[];
const toClose = rows.filter((r) => r.bucket === 'close_fixed');

if (!toClose.length) {
  console.log('No close_fixed issues in triage report.');
  process.exit(0);
}

console.log(`Closing ${toClose.length} issues${dryRun ? ' (dry-run)' : ''}…`);

for (const row of toClose) {
  const body = [
    'Verified fixed in the TypeScript rewrite.',
    '',
    `**Evidence:** ${row.evidence}`,
    '',
    'Automated triage pass — reopen if you can still reproduce on current `main`.',
  ].join('\n');

  if (dryRun) {
    console.log(`  #${row.issue} ${row.title}`);
    continue;
  }

  Bun.spawnSync(
    ['gh', 'issue', 'comment', String(row.issue), '--repo', 'audreyt/ethercalc', '--body', body],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  Bun.spawnSync(
    ['gh', 'issue', 'close', String(row.issue), '--repo', 'audreyt/ethercalc', '--reason', 'completed'],
    { stdout: 'inherit', stderr: 'inherit' },
  );
  console.log(`  closed #${row.issue}`);
}