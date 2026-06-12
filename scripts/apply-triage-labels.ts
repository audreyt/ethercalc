/**
 * Apply GitHub labels to open issues from /tmp/triage-report.json.
 * Run: bun scripts/triage-open-issues.ts [--http URL]
 *      bun scripts/apply-triage-labels.ts [--dry-run]
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

/** Map triage buckets → GitHub label names. */
const BUCKET_LABEL: Record<string, string> = {
  close_fixed: 'triage:fixed',
  close_obsolete: 'triage:obsolete',
  close_wontfix: 'triage:wontfix',
  keep_broken: 'triage:broken',
  keep_enhancement: 'triage:enhancement',
  keep_question: 'triage:question',
  keep_ui: 'triage:ui',
  keep_ci: 'triage:ci',
  untested: 'triage:untested',
};

const ALL_LABELS = [...new Set(Object.values(BUCKET_LABEL))];

const rows = JSON.parse(readFileSync(reportPath, 'utf8')) as TriageRow[];

function gh(args: string[]): { ok: boolean; out: string } {
  const proc = Bun.spawnSync(['gh', ...args, '--repo', 'audreyt/ethercalc'], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  return {
    ok: proc.exitCode === 0,
    out: proc.stdout.toString() + proc.stderr.toString(),
  };
}

function ensureLabels(): void {
  for (const name of ALL_LABELS) {
    const color =
      name.includes('fixed') ? '1d76db'
      : name.includes('broken') ? 'd73a4a'
      : name.includes('enhancement') ? 'a2eeef'
      : name.includes('ui') ? 'fbca04'
      : name.includes('question') ? 'd4c5f9'
      : name.includes('obsolete') || name.includes('wontfix') ? 'ffffff'
      : 'ededed';
    const listed = gh(['label', 'list', '--json', 'name']);
    const names = listed.ok ? (JSON.parse(listed.out) as { name: string }[]).map((l) => l.name) : [];
    if (names.includes(name)) continue;
    if (dryRun) {
      console.log(`  create label ${name}`);
      continue;
    }
    const created = gh(['label', 'create', name, '--color', color, '--description', `EtherCalc triage bucket (${name})`]);
    if (!created.ok) console.warn(`  warn: label ${name}: ${created.out.trim()}`);
    else console.log(`  created label ${name}`);
  }
}

/** Strip prior triage:* labels before applying the current bucket. */
function clearTriageLabels(issue: number): string[] {
  const res = gh(['issue', 'view', String(issue), '--json', 'labels', '--jq', '.labels[].name']);
  if (!res.ok) return [];
  return res.out
    .trim()
    .split('\n')
    .filter((l) => l.startsWith('triage:'));
}

ensureLabels();

let applied = 0;
let skipped = 0;

for (const row of rows) {
  const label = BUCKET_LABEL[row.bucket];
  if (!label) continue;

  const stateRes = gh(['issue', 'view', String(row.issue), '--json', 'state', '--jq', '.state']);
  if (!stateRes.ok || stateRes.out.trim() !== 'OPEN') {
    skipped++;
    continue;
  }

  if (dryRun) {
    console.log(`  #${row.issue} → ${label}`);
    applied++;
    continue;
  }

  for (const old of clearTriageLabels(row.issue)) {
    gh(['issue', 'edit', String(row.issue), '--remove-label', old]);
  }
  const edit = gh(['issue', 'edit', String(row.issue), '--add-label', label]);
  if (edit.ok) {
    console.log(`  #${row.issue} → ${label}`);
    applied++;
  } else {
    console.warn(`  #${row.issue} failed: ${edit.out.trim()}`);
  }
}

console.log(`\nLabels applied to ${applied} open issues (${skipped} skipped — closed or missing).`);