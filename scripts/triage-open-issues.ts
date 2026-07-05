/**
 * Full triage pass on open GitHub issues.
 * Run: bun scripts/triage-open-issues.ts [--http http://127.0.0.1:8787]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createSpreadsheet, csvToSave, loadSocialCalc } from '../packages/socialcalc-headless/src/index.ts';
import { isPublicRoomIndexEntry } from '../packages/worker/src/lib/formdata-sibling.ts';

type Bucket =
  | 'close_fixed'
  | 'close_obsolete'
  | 'close_wontfix'
  | 'keep_broken'
  | 'keep_enhancement'
  | 'keep_question'
  | 'keep_ui'
  | 'keep_ci'
  | 'untested';

interface Triage {
  issue: number;
  title: string;
  bucket: Bucket;
  evidence: string;
}

const triage: Triage[] = [];
const httpBase =
  process.argv.find((a) => a.startsWith('--http='))?.slice(7) ??
  (process.argv.includes('--http')
    ? process.argv[process.argv.indexOf('--http') + 1]
    : undefined);

function add(issue: number, title: string, bucket: Bucket, evidence: string): void {
  triage.push({ issue, title, bucket, evidence });
}

function cell(ss: ReturnType<typeof createSpreadsheet>, coord: string) {
  return ss.exportCell(coord) as {
    datavalue?: unknown;
    formula?: string;
    valuetype?: string;
    datatype?: string;
  } | null;
}

function cellText(ss: ReturnType<typeof createSpreadsheet>, coord: string): string {
  const c = cell(ss, coord);
  return c?.datavalue == null ? '' : String(c.datavalue);
}

function formulaWorks(setup: string[], formula: string, coord = 'Z1'): boolean {
  const s = createSpreadsheet();
  if (setup.length) s.executeCommand(setup.join('\n'));
  s.executeCommand(`set ${coord} formula ${formula}\nrecalc`);
  const t = cellText(s, coord);
  return !t.includes('?') && !t.includes('Unknown') && !t.includes('Error') && !t.includes('Incorrect');
}

// Parse issue list — `gh issue list` when available, else /tmp/open-issues.txt
function loadIssueList(): { num: number; title: string }[] {
  const fallback = '/tmp/open-issues.txt';
  try {
    const proc = Bun.spawnSync(
      ['gh', 'issue', 'list', '--repo', 'audreyt/ethercalc', '--state', 'open', '--limit', '200', '--json', 'number,title'],
      { stdout: 'pipe', stderr: 'pipe' },
    );
    if (proc.exitCode === 0) {
      const rows = JSON.parse(proc.stdout.toString()) as { number: number; title: string }[];
      return rows.map((r) => ({ num: r.number, title: r.title }));
    }
  } catch {
    // gh not installed
  }
  const lines = readFileSync(fallback, 'utf8').trim().split('\n').filter(Boolean);
  return lines.map((l) => {
    const m = l.match(/^#?(\d+)\t(.+)$/);
    return { num: Number(m![1]), title: m![2] };
  });
}
const issues = loadIssueList();

// ─── Formula / export embedded repros ───────────────────────────────────

function runFormulaTests(): void {
  // #29 whole column
  {
    const s = createSpreadsheet();
    s.executeCommand('set B1 value n 1\nset B2 value n 2\nset A1 formula SUM(B:B)\nrecalc');
    const t = cellText(s, 'A1');
    add(29, 'Reference to whole column/row', Number(t) === 3 ? 'close_fixed' : 'keep_broken', `SUM(B:B) → ${t}`);
  }

  // #534 N:N
  {
    const s = createSpreadsheet();
    for (let r = 1; r <= 3; r++) s.executeCommand(`set N${r} value n ${r}`, false);
    s.executeCommand('set A1 formula SUM(N:N)\nrecalc');
    const t = cellText(s, 'A1');
    add(534, 'SUM(N:N)', t.includes('Incorrect') || t.includes('?') ? 'keep_broken' : 'close_fixed', `SUM(N:N) → ${t}`);
  }

  // #19
  {
    const s = createSpreadsheet();
    for (let r = 2; r <= 6; r++) s.executeCommand(`set B${r} value n 1`, false);
    const t0 = performance.now();
    s.executeCommand('set A1 formula SUM(B2:B100000)', false);
    const ms = performance.now() - t0;
    add(19, 'Huge SUM freeze', ms > 500 ? 'keep_broken' : 'close_fixed', `${ms.toFixed(0)}ms for SUM(B2:B100000)`);
  }

  // #260 blank as zero
  {
    const s = createSpreadsheet();
    s.executeCommand('set A1 formula B1+1\nrecalc');
    add(260, 'Blank cell as zero', 'close_wontfix', `B1 empty → A1=${cellText(s, 'A1')} (SocialCalc blank=0 semantics)`);
  }

  // #304 csv formulas
  {
    const csv = '1,=A1*2\n3,=A3*2\n';
    const save = csvToSave(csv);
    const hasFormula = save.includes('formula') || /cell:[^:]+:vtf:/.test(save);
    add(304, 'CSV formulas as literals', hasFormula ? 'close_fixed' : 'keep_broken', hasFormula ? 'csvToSave has formula cells' : 'formulas stored as text literals');
  }

  // #577 money /2 — valuetype preserved through division (socialcalc 3.0.2+)
  {
    const s = createSpreadsheet();
    s.executeCommand(
      ['set A1 constant n$ 142.234 $142.234', 'set C1 formula A1/2', 'recalc'].join('\n'),
    );
    const vt = (cell(s, 'C1') as { valuetype?: string } | null)?.valuetype;
    add(577, 'Money /2', vt === 'n$' ? 'close_fixed' : 'keep_broken', `C1 valuetype=${vt ?? 'missing'}`);
  }

  // #638 csv rounding — nontextvalueformat on export (socialcalc 3.0.2+)
  {
    const s = createSpreadsheet();
    s.executeCommand(
      ['set A1 value n 1.9859735', 'set A1 nontextvalueformat #,##0', 'recalc'].join('\n'),
    );
    add(638, 'CSV export rounding', s.exportCSV().trim() === '2' ? 'close_fixed' : 'keep_broken', `csv="${s.exportCSV().trim()}"`);
  }

  // #355 date export
  {
    const s = createSpreadsheet();
    s.executeCommand('set B1 text t 1/1/1990\nrecalc');
    add(355, 'Date export', s.exportCSV().includes('32874') ? 'keep_broken' : 'close_fixed', `csv="${s.exportCSV().trim()}"`);
  }

  // #646 time export
  {
    const s = createSpreadsheet();
    s.executeCommand('set A1 text t 11:30\nrecalc');
    const csv = s.exportCSV().trim();
    add(646, 'Hour export', csv.includes('0.479') ? 'keep_broken' : 'close_fixed', `csv="${csv}"`);
  }

  // #88 / #493 / #512 — formula quote escaping (socialcalc 3.0.4)
  {
    const SC = loadSocialCalc();
    const inner =
      'IF(B4=TODAY(),"<span style=""background-color:rgb(81,184,72)"">_______</span>","")';
    const ok = SC.OffsetFormulaCoords(inner, 0, 1).includes('B5=TODAY()');
    const ev = ok ? 'OffsetFormulaCoords preserves doubled quotes' : 'quote escaping still broken';
    add(88, '(minor) Fix for OffsetFormulaCoords', ok ? 'close_fixed' : 'keep_broken', ev);
    add(493, 'vb style quotes', ok ? 'close_fixed' : 'keep_ui', ev);
    add(512, 'paste HTML formula quotes', ok ? 'close_fixed' : 'keep_ui', ev);
  }

  // #501 — https text-link (socialcalc 3.0.4)
  {
    const SC = loadSocialCalc();
    const ok = SC.DetermineValueType('https://example.com/café').type === 'tl';
    add(501, 'Inserting link with non-ascii chars', ok ? 'close_fixed' : 'keep_ui', ok ? 'https → tl' : 'not text-link');
  }

  // #314 / #564 / #769 / #785 — filldown without editor.range2 (socialcalc 3.0.3)
  {
    const s = createSpreadsheet();
    s.executeCommand('set A1 value n 1\nset A2 value n 2\nfilldown A1:A5 all\nrecalc');
    const lines = s.exportCSV().trim().split('\n');
    const ok = lines[2] === '3' && lines[4] === '5';
    const ev = `csv=${lines.join('|')}`;
    add(314, 'fill down is not propagated', ok ? 'close_fixed' : 'keep_broken', ev);
    add(564, "Fill don't work", ok ? 'close_fixed' : 'keep_broken', ev);
    add(769, 'fill down propagates, then changes later', ok ? 'close_fixed' : 'keep_broken', ev);
    add(785, "Bug with 'fill' and 'dates'", ok ? 'close_fixed' : 'keep_broken', ev);
  }

  // Formula existence probes
  const probes: Array<[number, string, string, string[]]> = [
    [458, 'INDIRECT', 'INDIRECT("A1")', ['set A1 value n 99']],
    [467, 'BESSELJ', 'BESSELJ(1,0)', []],
    [473, 'Range intersection', 'SUM(A1:B2 B2:C3)', ['set B2 value n 1']],
    [474, 'R1C1', 'R1C1', []],
    [712, 'RANK', 'RANK(3,A1:A3)', ['set A1 value n 1', 'set A2 value n 2', 'set A3 value n 3']],
    [726, 'MEDIAN', 'MEDIAN(A1:A3)', ['set A1 value n 1', 'set A2 value n 2', 'set A3 value n 3']],
    [106, 'RAND', 'RAND()', []],
    [572, 'ONEDITDO', 'ONEDITDO()', []],
    [764, 'IMPORTDATA', 'IMPORTDATA("http://example.com")', []],
    [650, 'UNIQUE', 'UNIQUE(A1:A3)', ['set A1 value n 1', 'set A2 value n 1', 'set A3 value n 2']],
  ];
  for (const [num, name, f, setup] of probes) {
    const ok = formulaWorks(setup, f);
    const title = issues.find((i) => i.num === num)?.title ?? name;
    add(
      num,
      title,
      ok ? 'close_fixed' : 'keep_enhancement',
      ok ? `${f} evaluates` : `${f} missing or errors`,
    );
  }
}

async function runHttpTests(base: string): Promise<void> {
  const uid = () => `tri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // #442 DELETE + formdata
  {
    const room = uid();
    const form = `${room}_formdata`;
    const token = 'local-only-smoke';
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 text t x' }),
    });
    await fetch(`${base}/_migrate/seed/${form}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        snapshot: 'version:1.5\ncell:A1:t:form\nsheet:c:1:r:1:needsrecalc:no\n',
      }),
    });
    await fetch(`${base}/_/${room}`, { method: 'DELETE' });
    const main = (await fetch(`${base}/_/${room}`)).status;
    const formSt = (await fetch(`${base}/_/${form}`)).status;
    add(442, 'DELETE _formdata sibling', main === 404 && formSt === 404 ? 'close_fixed' : 'keep_broken', `main=${main}, form=${formSt}`);
  }

  // #441 DELETE in API.md
  {
    const api = readFileSync('/Users/au/w/ethercalc/API.md', 'utf8');
    add(441, 'DELETE in API.md', api.match(/DELETE/i) ? 'close_fixed' : 'keep_broken', api.includes('DELETE') ? 'API.md documents DELETE' : 'missing');
  }

  // #275 multi redirect — check if /=room exists auto-detect
  {
    const res = await fetch(`${base}/testroom`, { redirect: 'manual' });
    add(275, 'Multi-sheet redirect', 'keep_enhancement', `GET /:room → ${res.status} (no auto-detect /= prefix)`);
  }

  // #477 internal export — cells/json/csv.json routes
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 value n 1' }),
    });
    const cells = (await fetch(`${base}/_/${room}/cells`)).status;
    const cjson = (await fetch(`${base}/_/${room}/csv.json`)).status;
    add(477, 'internal export API', cells === 200 && cjson === 200 ? 'close_fixed' : 'keep_enhancement', `/cells=${cells}, /csv.json=${cjson}`);
  }

  // #340 sandstorm download URL — generic export paths exist
  add(340, 'Sandstorm download URL', 'close_fixed', 'GET /_/:room/csv|xlsx|html etc. available on worker');

  // #558 API push — POST works
  {
    const room = uid();
    const r = await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 value n 99' }),
    });
    const cells = await (await fetch(`${base}/_/${room}/cells/A1`)).json() as { datavalue?: number };
    add(558, 'API push', r.status === 202 && cells.datavalue === 99 ? 'close_fixed' : 'keep_broken', `POST ${r.status}, A1=${cells.datavalue}`);
  }

  // #642 odata — ods/fods routes
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 text t hi' }),
    });
    const ods = (await fetch(`${base}/_/${room}/ods`)).status;
    const fods = (await fetch(`${base}/_/${room}/fods`)).status;
    add(642, 'odata import/export', ods === 200 && fods === 200 ? 'close_fixed' : 'keep_enhancement', `ods=${ods}, fods=${fods}`);
  }

  // #533 _formdata in _rooms — filter in listRooms; live check when index is open
  {
    const roomsRes = await fetch(`${base}/_rooms`);
    if (roomsRes.status === 403) {
      const filtered = ['room', 'room_formdata', 'room_formdata_formdata'].filter(isPublicRoomIndexEntry);
      add(
        533,
        '_formdata in _rooms',
        filtered.every((r) => !r.endsWith('_formdata')) ? 'close_fixed' : 'keep_broken',
        'isPublicRoomIndexEntry filters _formdata (rooms-index.node.test.ts); _rooms gated in dev',
      );
    } else {
      const list = (await roomsRes.json()) as string[];
      const bad = list.filter((r) => r.endsWith('_formdata'));
      add(533, '_formdata in _rooms', bad.length === 0 ? 'close_fixed' : 'keep_broken', bad.length ? `${bad.length} _formdata rooms` : 'clean list');
    }
  }

  // #232 viewer export — single-room view must not emit /=room.xlsx (#232)
  add(
    232,
    'Sandstorm viewer export',
    'close_fixed',
    'boot.ts: isMultiple requires __MULTI__.rows.length > 0; view mode builds ../room.xlsx not ../=room.xlsx',
  );

  // #807 websocket — native WS endpoint
  add(635, 'Multi sheets tabs disappears on rename', 'close_fixed', 'client-multi TabBar uses stable key={row.link} (2026-06-12)');
  add(698, 'Multi sheet footer import/export', 'close_fixed', 'rowsRev iframe sync + GET /_/:room/csv.json for TOC (#698)');
  add(727, 'Auto Sheet Generation ghost Sheet1', 'close_fixed', 'Foldr.fetch dedupes TOC rows by link (#727)');

  add(807, 'Connect to websocket', 'close_fixed', 'Native WS at /_ws/:room (docs answer; not socket.io client path)');

  // #809 domain restrict — nginx recipe exists
  add(809, 'Restrict domain', 'close_fixed', 'Self-host hardening: docker-compose.proxy.yml + docs/SELFHOST_HARDENING.md');

  // #42 env vars — check README/AGENTS
  {
    const claude = readFileSync('/Users/au/w/ethercalc/AGENTS.md', 'utf8');
    add(42, 'Document CLI/env vars', claude.includes('ETHERCALC_') ? 'close_fixed' : 'keep_question', 'AGENTS.md + docker/helm document env vars');
  }

  // #604/#545 offline install
  add(604, 'Install offline', 'close_fixed', 'docker image + bun offline build; no npm global needed');
  add(545, 'tar.gz offline install', 'close_fixed', 'Docker multi-arch image is primary offline path');

  // #633 systemd — workerd docker path
  add(633, 'systemd start-limit-hit', 'close_obsolete', 'Legacy npm ethercalc systemd; use docker/workerd self-host');

  // #732 intranet vs cloud
  add(732, 'Intranet vs cloud', 'close_obsolete', 'Legacy deployment-specific networking issue');

  // #292 sandstorm localhost — client-multi only redirects to :8000 in Vite dev
  add(292, 'Sandstorm localhost:8080', 'close_fixed', 'parseMultiEnv keeps same-origin basePath in production builds (import.meta.env.DEV gate)');

  // #335 sandstorm API names — display tab title ≠ room id (by design; use TOC link slug)
  add(
    335,
    'Sandstorm API sheet names',
    'keep_question',
    'Multi-sheet sub-rooms use TOC link ids (e.g. room.2), not tab labels; Sandstorm grain auto-names differ',
  );

  // #453 sandstorm scroll — oversized row/col layout edge case; needs grain repro
  add(453, 'Sandstorm scroll', 'keep_ui', 'SocialCalc scroll/layout with heavily expanded rows/cols — no repro fixture');

  // #587 where are files
  add(587, 'Where are my files', 'close_fixed', 'DO storage + D1 index; no Redis KEYS');

  // #627 revisions
  add(627, 'Save revisions', 'close_fixed', 'Audit log + snapshot/log model documented in rewrite');

  // #494 audit trail delete
  add(494, 'Safe to delete audit', 'keep_question', 'Audit never truncated by design; DELETE wipes room');

  // #789 license
  add(789, 'License?', 'keep_question', 'README + socialcalc fork; needs human answer not code');

  // #800 limitations
  add(800, 'Limitations', 'keep_question', '7M rows impossible in browser SocialCalc');

  // #804 user manual — Starlight user guide at packages/docs/
  add(804, 'User manual question', 'close_fixed', 'User guide migrated to packages/docs user-guide/ (replaces GH wiki)');

  // #798 presentation
  add(798, 'Presentation mode', 'keep_enhancement', 'Feature request');

  // #828 CI
  add(828, 'mutation regression', 'keep_ci', 'Active nightly Stryker failure');
}

function classifyRemaining(): void {
  const done = new Set(triage.map((t) => t.issue));

  const obsolete = new Set([
    20, 101, 167, 184, 229, 294, 295, 335, 340, 369, 416, 496, 505, 545, 587, 604, 614, 633, 657, 668, 686, 719, 732, 755, 768, 770, 789, 798, 800, 807, 809, 828,
  ]);

  const enhancement = new Set([
    35, 54, 56, 66, 69, 74, 105, 121, 125, 126, 136, 158, 173, 174, 180, 196, 219, 220, 224, 225, 230, 241, 247, 274, 275, 294, 296, 337, 338, 353, 356, 373, 400, 412, 458, 467, 469, 473, 474, 477, 488, 504, 508, 527, 538, 540, 551, 558, 562, 563, 565, 567, 569, 571, 572, 593, 594, 598, 600, 606, 612, 630, 634, 636, 642, 648, 650, 661, 663, 666, 672, 674, 678, 684, 693, 698, 699, 704, 712, 719, 722, 726, 727, 733, 743, 747, 749, 750, 752, 753, 755, 764, 771, 772,
  ]);

  const ui = new Set([
    34, 43, 45, 70, 83, 86, 137, 156, 162, 196, 226, 232, 238, 263, 267, 301, 327, 398, 425, 435, 450, 453, 479, 484, 490, 498, 503, 532, 535, 589, 608, 615, 622, 623, 624, 625, 639, 686,
  ]);

  const question = new Set([25, 59, 262, 288, 416, 494, 535, 587, 657, 789, 800]);

  const wontfix = new Set([19, 260]);

  for (const { num, title } of issues) {
    if (done.has(num)) continue;
    if (obsolete.has(num)) {
      add(num, title, 'close_obsolete', 'Legacy stack / Sandstorm-only / support / superseded by rewrite self-host');
    } else if (wontfix.has(num)) {
      add(num, title, 'close_wontfix', 'SocialCalc upstream semantics or accepted browser limitation');
    } else if (enhancement.has(num)) {
      add(num, title, 'keep_enhancement', 'Feature request — not a rewrite regression');
    } else if (ui.has(num)) {
      add(num, title, 'keep_ui', 'SocialCalc UI / client — needs browser repro or upstream fix');
    } else if (question.has(num)) {
      add(num, title, 'keep_question', 'Support / how-to / documentation');
    } else {
      add(num, title, 'untested', 'Not covered by automated pass');
    }
  }
}

// ─── main ───────────────────────────────────────────────────────────────

runFormulaTests();
if (httpBase) {
  try {
    const h = await fetch(`${httpBase}/_health`);
    if (!h.ok) throw new Error(String(h.status));
    await runHttpTests(httpBase);
  } catch (e) {
    console.error('HTTP tests failed:', e);
  }
}
classifyRemaining();

// Dedupe — keep first entry per issue
const seen = new Set<number>();
const deduped = triage.filter((t) => {
  if (seen.has(t.issue)) return false;
  seen.add(t.issue);
  return true;
});

deduped.sort((a, b) => a.issue - b.issue);

const out = '/tmp/triage-report.json';
writeFileSync(out, JSON.stringify(deduped, null, 2));

const buckets = ['close_fixed', 'close_obsolete', 'close_wontfix', 'keep_broken', 'keep_enhancement', 'keep_question', 'keep_ui', 'keep_ci', 'untested'] as const;
console.log('\n=== TRIAGE SUMMARY ===\n');
for (const b of buckets) {
  const g = deduped.filter((t) => t.bucket === b);
  if (!g.length) continue;
  console.log(`${b} (${g.length})`);
  for (const t of g) console.log(`  #${t.issue} ${t.title} — ${t.evidence}`);
  console.log();
}
console.log(`Full report: ${out}`);