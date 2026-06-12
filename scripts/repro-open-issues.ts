/**
 * Batch repro checker for trivial-to-test open GitHub issues.
 * Run: bun scripts/repro-open-issues.ts [--http http://127.0.0.1:8787]
 */
import { createSpreadsheet } from '../packages/socialcalc-headless/src/index.ts';

type Verdict = 'fixed' | 'broken' | 'unchanged' | 'skip';

interface Result {
  issue: number;
  title: string;
  verdict: Verdict;
  detail: string;
}

const results: Result[] = [];

function record(
  issue: number,
  title: string,
  verdict: Verdict,
  detail: string,
): void {
  results.push({ issue, title, verdict, detail });
}

function cellVal(ss: ReturnType<typeof createSpreadsheet>, coord: string): unknown {
  const c = ss.exportCell(coord) as { datavalue?: unknown; formula?: string } | null;
  return c?.datavalue ?? c?.formula ?? null;
}

function cellText(ss: ReturnType<typeof createSpreadsheet>, coord: string): string {
  const c = ss.exportCell(coord) as { datavalue?: unknown } | null;
  return c?.datavalue == null ? '' : String(c.datavalue);
}

// ─── Headless SocialCalc formula/export repros ─────────────────────────

function test506(): void {
  const ss = createSpreadsheet();
  ss.executeCommand('set A1 text t hello\nset A2 text t world\nset A3 formula CONCAT(A1,A2)\nrecalc');
  const csv = ss.exportCSV();
  const a3 = cellText(ss, 'A3');
  const broken = csv.includes('Unknown function') || a3.includes('Unknown');
  record(506, 'CONCAT export', broken ? 'broken' : 'fixed', `A3=${a3!}, csv tail=${csv.split('\n').pop()}`);
}

function test511(): void {
  const ss = createSpreadsheet();
  const cmds = ['set C1 value n 4.01'];
  for (let i = 1; i <= 20; i++) cmds.push(`set A${i} value n ${i * 0.5}`);
  cmds.push('set B1 formula COUNTIF(A1:A20,">4")');
  cmds.push('set B2 formula COUNTIF(A1:A20,">"&C1)');
  cmds.push('recalc');
  ss.executeCommand(cmds.join('\n'));
  const b1 = cellVal(ss, 'B1');
  const b2 = cellVal(ss, 'B2');
  const broken = Number(b2) === 0 || Number.isNaN(Number(b2));
  record(511, 'COUNTIF decimal', broken ? 'broken' : 'fixed', `B1=${b1}, B2=${b2}`);
}

function test534(): void {
  const ss = createSpreadsheet();
  for (let r = 1; r <= 5; r++) ss.executeCommand(`set N${r} value n ${r}`, false);
  ss.executeCommand('set A1 formula SUM(N:N)\nrecalc');
  const a1 = cellText(ss, 'A1');
  const broken = a1.includes('?') || a1.includes('Wrong') || a1.includes('Falsche') || a1 === '0';
  record(534, 'SUM(N:N)', broken ? 'broken' : 'fixed', `A1=${a1}`);
}

function test260(): void {
  const ss = createSpreadsheet();
  ss.executeCommand('set A1 formula B1+1\nrecalc');
  const a1 = cellVal(ss, 'A1');
  // Blank B1 → SocialCalc treats as 0 → A1 becomes 1
  const treatsBlankAsZero = Number(a1) === 1;
  record(
    260,
    'Blank cell as zero',
    treatsBlankAsZero ? 'unchanged' : 'fixed',
    `A1=B1+1 with empty B1 → ${a1} (0=unchanged SocialCalc semantics)`,
  );
}

function test577(): void {
  const ss = createSpreadsheet();
  ss.executeCommand(
    [
      'set A1 value n 142.234',
      'format A1 value-numberformat $#,##0.00',
      'set B1 formula A1*3',
      'set C1 formula A1/2',
      'set D1 formula A1*(1/2)',
      'recalc',
    ].join('\n'),
  );
  const b1 = cellText(ss, 'B1');
  const c1 = cellText(ss, 'C1');
  const d1 = cellText(ss, 'D1');
  const broken = c1.includes('71.117') && !c1.includes('$');
  record(577, 'Money /2 coercion', broken ? 'unchanged' : 'fixed', `B1=${b1}, C1=${c1}, D1=${d1}`);
}

function test304(): void {
  const csv = `,Input,Squares
A,3,=B2*B2
B,12,=B3*B3
,,
,,=SUM(B2:B3)`;
  const ss = createSpreadsheet();
  ss.executeCommand(`loadclipboard socialcalc${csv}\nrecalc`);
  const c3 = ss.exportCell('C3') as { datavalue?: unknown; formula?: string } | null;
  const c4 = ss.exportCell('C4') as { datavalue?: unknown; formula?: string } | null;
  const hasFormula = Boolean(c3?.formula || c4?.formula);
  const quotedLiteral = String(c3?.datavalue ?? '').startsWith("'") || String(c4?.datavalue ?? '').startsWith("'");
  record(
    304,
    'CSV formulas as literals',
    quotedLiteral && !hasFormula ? 'unchanged' : hasFormula ? 'fixed' : 'broken',
    `C3=${JSON.stringify(c3)}, C4=${JSON.stringify(c4)}`,
  );
}

function test638(): void {
  const ss = createSpreadsheet();
  ss.executeCommand(
    'set A1 value n 1.9859735\nformat A1 value-numberformat #,##0\nrecalc',
  );
  const csv = ss.exportCSV().trim();
  record(
    638,
    'CSV export rounding',
    csv === '2' ? 'fixed' : 'unchanged',
    `formatted #,##0 exported as "${csv}"`,
  );
}

function test355(): void {
  const ss = createSpreadsheet();
  ss.executeCommand('set B1 value t 1/1/1990\nrecalc');
  const csv = ss.exportCSV().trim();
  const broken = csv === '32874' || /^\d{5}$/.test(csv);
  record(355, 'Date export as serial', broken ? 'unchanged' : 'fixed', `B1 csv="${csv}"`);
}

function test646(): void {
  const ss = createSpreadsheet();
  ss.executeCommand('set A1 value t 11:30\nrecalc');
  const csv = ss.exportCSV().trim();
  const broken = csv.includes('0.4791');
  record(646, 'Hour as float in export', broken ? 'unchanged' : 'fixed', `A1 csv="${csv}"`);
}

function test122(): void {
  const ss = createSpreadsheet();
  for (let i = 1; i <= 5; i++) ss.executeCommand(`set A${i} value n 1`, false);
  ss.executeCommand('set B1 formula COUNT(A:A)\nrecalc');
  const b1 = cellVal(ss, 'B1');
  record(122, 'COUNT(A:A) after setup', Number(b1) === 5 ? 'fixed' : 'broken', `COUNT(A:A)=${b1}`);
}

function test19(): void {
  const ss = createSpreadsheet();
  for (let r = 2; r <= 6; r++) ss.executeCommand(`set B${r} value n 1`, false);
  const t0 = performance.now();
  ss.executeCommand('set A1 formula SUM(B2:B100000)', false);
  const ms = performance.now() - t0;
  record(19, 'Huge SUM freeze', ms > 500 ? 'unchanged' : 'fixed', `SUM(B2:B100000) took ${ms.toFixed(0)}ms`);
}

function test514(): void {
  record(514, 'Wiki syntax export', 'skip', 'Feature request — no /md route tested here');
}

// ─── HTTP repros (optional) ───────────────────────────────────────────

async function httpRepros(base: string): Promise<void> {
  const uid = () => `repro-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // #119 illegal POST content-type
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'cell:A1:t:hello\n',
    });
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      body: '1,2,3', // missing Content-Type
    });
    const csv = await fetch(`${base}/_/${room}/csv`);
    const html = await fetch(`${base}/_/${room}/html`);
    record(
      119,
      'GET export after bad POST',
      csv.ok && html.ok ? 'fixed' : 'broken',
      `csv=${csv.status}, html=${html.status}`,
    );
  }

  // #385 / recalc via POST
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: ['set A1 value n 1', 'set A2 value n 2', 'set A3 formula SUM(A1:A2)'] }),
    });
    const cells = await fetch(`${base}/_/${room}/cells/A3`);
    const j = (await cells.json()) as { datavalue?: number };
    record(385, 'Recalc after API POST', j.datavalue === 3 ? 'fixed' : 'broken', `A3=${j.datavalue}`);
  }

  // #304 via PUT csv
  {
    const room = uid();
    const csv = '1,=A1*2\n2,=A2*2\n';
    await fetch(`${base}/_/${room}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/csv' },
      body: csv,
    });
    const snap = await fetch(`${base}/_/${room}`);
    const body = await snap.text();
    const hasFormula = body.includes('formula');
    record(304, 'PUT csv preserves formulas', hasFormula ? 'fixed' : 'unchanged', hasFormula ? 'snapshot has formula' : 'no formula in snapshot');
  }

  // #442 DELETE + formdata sibling
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 text t hi' }),
    });
    // Seed formdata sibling directly via migrate seed if available, else WS path skipped
    const formRoom = `${room}_formdata`;
    const token = process.env.ETHERCALC_MIGRATE_TOKEN;
    if (token) {
      await fetch(`${base}/_migrate/seed/${formRoom}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
        body: 'cell:A1:t:form\n',
      });
      await fetch(`${base}/_/${room}`, { method: 'DELETE' });
      const main = await fetch(`${base}/_exists/${room}`);
      const form = await fetch(`${base}/_exists/${formRoom}`);
      const mainJ = await main.json();
      const formJ = await form.json();
      record(
        442,
        'DELETE cascades _formdata',
        mainJ === false && formJ === false ? 'fixed' : 'broken',
        `exists main=${mainJ}, form=${formJ}`,
      );
    } else {
      record(442, 'DELETE cascades _formdata', 'skip', 'ETHERCALC_MIGRATE_TOKEN unset — cannot seed sibling');
    }
  }

  // #533 formdata in room index
  {
    const rooms = await fetch(`${base}/_rooms`);
    if (rooms.status === 403) {
      record(533, '_formdata in _rooms', 'skip', '_rooms gated (403)');
    } else {
      const list = (await rooms.json()) as string[];
      const dupes = list.filter((r) => r.endsWith('_formdata'));
      record(
        533,
        '_formdata in _rooms',
        dupes.length === 0 ? 'fixed' : 'unchanged',
        dupes.length ? `sample: ${dupes.slice(0, 3).join(', ')}` : 'no _formdata rooms listed',
      );
    }
  }

  // #275 multi-sheet redirect — check route exists
  {
    const room = uid();
    const res = await fetch(`${base}/_/${room}`, { redirect: 'manual' });
    record(275, 'Multi-sheet redirect', res.status < 500 ? 'skip' : 'broken', `GET /_/:room → ${res.status} (redirect logic needs multi room)`);
  }

  // #514 markdown export
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 text t hi' }),
    });
    const md = await fetch(`${base}/_/${room}/md`);
    record(514, 'Wiki/markdown export', md.ok ? 'fixed' : 'broken', `GET /md → ${md.status}`);
  }

  // #638 / #355 / #646 via HTTP export
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: [
          'set A1 value n 1.9859735',
          'format A1 value-numberformat #,##0',
          'set B1 value t 1/1/1990',
          'recalc',
        ],
      }),
    });
    const csv = (await (await fetch(`${base}/_/${room}/csv`)).text()).trim();
    // only annotate if not already set by headless
    if (!results.find((r) => r.issue === 638)) {
      record(638, 'CSV export rounding (HTTP)', csv.startsWith('2') ? 'fixed' : 'unchanged', `csv="${csv.split('\n')[0]}"`);
    }
  }

  // xlsx export has Content-Disposition (was #367, closed)
  {
    const room = uid();
    await fetch(`${base}/_/${room}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'set A1 text t x' }),
    });
    const xlsx = await fetch(`${base}/_/${room}/xlsx`);
    const cd = xlsx.headers.get('Content-Disposition') ?? '';
    record(367, 'Content-Disposition (verify)', cd.includes('attachment') ? 'fixed' : 'broken', cd || '(missing)');
  }
}

// ─── main ─────────────────────────────────────────────────────────────

test19();
test506();
test511();
test534();
test260();
test577();
test304();
test638();
test355();
test646();
test122();

const httpBase = process.argv.find((a) => a.startsWith('--http='))?.slice(7)
  ?? (process.argv.includes('--http') ? process.argv[process.argv.indexOf('--http') + 1] : undefined);

if (httpBase) {
  try {
    const health = await fetch(`${httpBase}/_health`);
    if (!health.ok) throw new Error(`health ${health.status}`);
    await httpRepros(httpBase);
  } catch (e) {
    console.error(`HTTP repros skipped: ${e}`);
  }
} else {
  record(119, 'HTTP repros', 'skip', 'pass --http URL');
  record(385, 'HTTP repros', 'skip', 'pass --http URL');
  record(442, 'HTTP repros', 'skip', 'pass --http URL');
  record(533, 'HTTP repros', 'skip', 'pass --http URL');
}

const byVerdict = (v: Verdict) => results.filter((r) => r.verdict === v);

console.log('\n=== REPRO RESULTS ===\n');
for (const v of ['fixed', 'broken', 'unchanged', 'skip'] as const) {
  const group = byVerdict(v);
  if (!group.length) continue;
  console.log(`## ${v.toUpperCase()} (${group.length})`);
  for (const r of group.sort((a, b) => a.issue - b.issue)) {
    console.log(`  #${r.issue} ${r.title}: ${r.detail}`);
  }
  console.log();
}