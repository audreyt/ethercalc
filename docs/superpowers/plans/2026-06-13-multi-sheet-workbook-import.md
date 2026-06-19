# Multi-sheet workbook import — Implementation Plan

> Status: implemented 2026-06-19 (see commits)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `PUT /=:room.{xlsx,ods,fods}` and `PUT /_/=:room/{xlsx,ods,fods}` so an uploaded workbook is imported into a TOC sheet + one sub-room per worksheet, preserving per-sheet formulas/merges/formats and round-tripping with the existing multi-sheet export.

**Architecture:** Refactor the existing single-sheet importer (`xlsxToSave`) to expose a per-worksheet converter (`worksheetToSave`), add a pure `buildMultiSheetImport` transform (workbook bytes → `{tocSave, subSheets[]}`), and a thin route module that fans the saves out to per-room Durable Objects via `doFetch('/_do/snapshot', PUT)` — sub-rooms first, TOC last. The CSV-per-sheet `parseMultiSheetWorkbook` (values-only, now superseded) is deleted.

**Tech Stack:** TypeScript, Hono on Cloudflare Workers, `@e965/xlsx` (SheetJS), SocialCalc-headless, vitest (node config + vitest-pool-workers), oracle-harness.

**Spec:** `docs/superpowers/specs/2026-06-13-multi-sheet-workbook-import-design.md`

---

## File structure

| File | Responsibility | Change |
| ---- | -------------- | ------ |
| `packages/worker/src/lib/xlsx-import.ts` | Workbook→SocialCalc-save conversion | **Modify** — extract `worksheetToSave(ws)`; `xlsxToSave` delegates to it |
| `packages/worker/src/lib/multi-sheet-import.ts` | Pure `buildMultiSheetImport(bytes, room)` transform | **Create** |
| `packages/worker/src/routes/multi-import.ts` | `registerMultiSheetImport(app)` — the 6 PUT routes + DO fan-out | **Create** |
| `packages/worker/src/index.ts` | App wiring | **Modify** — call `registerMultiSheetImport(app)` |
| `packages/worker/src/lib/xlsx-build.ts` | Workbook **build** (export) | **Modify** — delete dead `parseMultiSheetWorkbook` |
| `packages/worker/test/multi-sheet-import.node.test.ts` | Unit tests for the pure transform + `worksheetToSave` | **Create** |
| `packages/worker/test/multi-import.test.ts` | Worker-pool round-trip integration test | **Create** |
| `packages/worker/test/xlsx-build.node.test.ts` | Build unit tests | **Modify** — drop `parseMultiSheetWorkbook` tests |
| `packages/oracle-harness/src/scenarios/fixtures.ts` | Shared fixture constants | **Modify** — add import room + xlsx base64 |
| `packages/oracle-harness/src/scenarios/multi-import.ts` | Import oracle scenarios | **Create** |
| `packages/oracle-harness/src/scenarios/index.ts` | Scenario aggregation | **Modify** — spread the new scenarios |
| `packages/oracle-harness/test/scenarios.test.ts` | Scenario count assertions | **Modify** — bump 24→26, 27→29 |

---

## Task 1: Extract a per-worksheet converter (`worksheetToSave`)

Behaviour-preserving refactor: pull the single-sheet conversion body out of `xlsxToSave` into a reusable `worksheetToSave(ws)`, so the multi-sheet path can call it per worksheet. The cross-workbook cell-limit moves to the callers (single-sheet checks the first sheet; multi-sheet checks the sum).

**Files:**
- Modify: `packages/worker/src/lib/xlsx-import.ts:122-214`
- Test: `packages/worker/test/multi-sheet-import.node.test.ts` (new; Task 1 adds the `worksheetToSave` block, Task 2 adds the rest)

- [ ] **Step 1: Write the failing test** — create `packages/worker/test/multi-sheet-import.node.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { worksheetToSave } from '../src/lib/xlsx-import.ts';

/** Build a one-sheet workbook and return its single worksheet object. */
function sheetFrom(aoa: unknown[][]): Record<string, unknown> {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa as any);
  XLSX.utils.book_append_sheet(wb, ws, 'S');
  return wb.Sheets['S'] as Record<string, unknown>;
}

describe('worksheetToSave', () => {
  it('converts a worksheet (not just the first in a workbook) to a SocialCalc save', () => {
    const ws = sheetFrom([
      ['name', 'qty'],
      ['apples', 3],
    ]);
    const save = worksheetToSave(ws);
    expect(save).toContain('version:1.5'); // a real sheet section was emitted
    expect(save).toContain('name'); // the A1 text value survived
  });

  it('preserves a formula cell', () => {
    const ws: any = sheetFrom([[1], [2]]);
    ws['A3'] = { t: 'n', f: 'SUM(A1:A2)' };
    ws['!ref'] = 'A1:A3';
    const save = worksheetToSave(ws);
    // SocialCalc stores formulas in the cell's `vtf` field; assert on the
    // formula text rather than a presumed `formula:` prefix.
    expect(save).toContain('SUM(A1:A2)');
  });

  it('an empty worksheet yields a valid (empty) save', () => {
    expect(worksheetToSave({})).toContain('version:1.5');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run --cwd packages/worker test:node multi-sheet-import`
Expected: FAIL — `worksheetToSave` is not exported from `../src/lib/xlsx-import.ts`.

- [ ] **Step 3: Refactor `xlsx-import.ts`** — replace the body of `xlsxToSave` (currently lines ~128-214) so the per-worksheet work lives in `worksheetToSave`. Replace this block:

```ts
export function xlsxToSave(bytes: Uint8Array): string {
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  // Stryker disable next-line ObjectLiteral,StringLiteral : @e965/xlsx
  // auto-infers `type` from a Uint8Array and defaults `cellFormula:true`
  // for xlsx/ods reads, so mutations to this options object produce
  // byte-identical workbooks. Equivalent mutants at 92:40 / 92:48.
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  const firstName = (wb.SheetNames as string[])[0];
  /* istanbul ignore next -- SheetJS always populates SheetNames[0]
     (defaulting to "Sheet1") even for empty input. Defensive guard. */
  if (!firstName) return ss.CreateSpreadsheetSave();
  const ws = wb.Sheets[firstName];
  /* istanbul ignore next -- SheetJS guarantees Sheets[SheetNames[0]]
     exists. Defensive guard against malformed workbook shapes. */
  if (!ws) return ss.CreateSpreadsheetSave();

  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];

  // Bail before the expensive per-cell SocialCalc replay if the workbook
  // declares an unreasonable number of cells (zip-bomb / oversized used
  // range). Counting keys is O(cells) but cheap relative to the replay.
  enforceImportLimit(countWorksheetCells(ws));

  for (const addr of Object.keys(ws)) {
```

with:

```ts
export function xlsxToSave(bytes: Uint8Array): string {
  // Stryker disable next-line ObjectLiteral,StringLiteral : @e965/xlsx
  // auto-infers `type` from a Uint8Array and defaults `cellFormula:true`
  // for xlsx/ods reads, so mutations to this options object produce
  // byte-identical workbooks. Equivalent mutants at 92:40 / 92:48.
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  const firstName = (wb.SheetNames as string[])[0];
  const ws = firstName ? wb.Sheets[firstName] : undefined;
  /* istanbul ignore next -- SheetJS always populates SheetNames[0] and its
     Sheets entry even for empty input; defensive guard against malformed
     workbook shapes. */
  if (!ws) return worksheetToSave({});
  enforceImportLimit(countWorksheetCells(ws));
  return worksheetToSave(ws);
}

/**
 * Convert a single SheetJS worksheet into a SocialCalc spreadsheet save.
 * Formula-preserving (see {@link cellToCommand}). Does NOT enforce the
 * cell-limit — callers do, so the multi-sheet path can bound the whole
 * workbook rather than each sheet independently.
 */
export function worksheetToSave(ws: Record<string, unknown>): string {
  const SC = loadSocialCalc() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];

  for (const addr of Object.keys(ws)) {
```

The remainder of the original function (the `for (const addr …)` cell loop, the merges loop, the recalc block, and `return ss.CreateSpreadsheetSave();`) stays exactly as-is — it now closes `worksheetToSave` instead of `xlsxToSave`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bun run --cwd packages/worker test:node multi-sheet-import`
Expected: PASS (3 `worksheetToSave` tests).

- [ ] **Step 5: Run the existing import suite to confirm no regression**

Run: `bun run --cwd packages/worker test:node xlsx-import`
Expected: PASS — all pre-existing `xlsxToSave`/`cellToCommand` tests still green.

- [ ] **Step 6: Commit**

```bash
git add packages/worker/src/lib/xlsx-import.ts packages/worker/test/multi-sheet-import.node.test.ts
git commit -m "refactor(worker): extract worksheetToSave from xlsxToSave"
```

---

## Task 2: Pure `buildMultiSheetImport` transform

Workbook bytes → `{ tocSave, subSheets[] }`. Enforces the cell-limit across the whole workbook; builds the TOC (`['#url','#title']` header + `[/<room>.<N>, sheetName]` rows) via `encodeCSV` → `csvToSocialCalc`.

**Files:**
- Create: `packages/worker/src/lib/multi-sheet-import.ts`
- Test: `packages/worker/test/multi-sheet-import.node.test.ts` (extend)

- [ ] **Step 1: Write the failing tests** — append to `packages/worker/test/multi-sheet-import.node.test.ts`:

```ts
import { buildMultiSheetImport } from '../src/lib/multi-sheet-import.ts';
import { MAX_IMPORT_CELLS } from '../src/lib/xlsx-import.ts';

/** Build a multi-sheet workbook as xlsx bytes. */
function workbookBytes(sheets: Array<{ name: string; aoa: unknown[][] }>): Uint8Array {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(s.aoa as any), s.name);
  }
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('buildMultiSheetImport', () => {
  it('produces one sub-room per worksheet, named <room>.<N>', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['a']] },
      { name: 'Beta', aoa: [['b']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    expect(out.subSheets.map((s) => s.subroom)).toEqual(['demo.1', 'demo.2']);
  });

  it('builds a TOC whose rows are [/<subroom>, sheetName] under a #url/#title header', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['a']] },
      { name: 'Beta', aoa: [['b']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    // TOC is a SocialCalc save; the link + title land in column A/B cells.
    expect(out.tocSave).toContain('#url');
    expect(out.tocSave).toContain('/demo.1');
    expect(out.tocSave).toContain('Alpha');
    expect(out.tocSave).toContain('/demo.2');
    expect(out.tocSave).toContain('Beta');
  });

  it('each worksheet becomes its own sub-sheet save (second sheet is real, not the first)', () => {
    const bytes = workbookBytes([
      { name: 'Alpha', aoa: [['alpha-only']] },
      { name: 'Beta', aoa: [['beta-only']] },
    ]);
    const out = buildMultiSheetImport(bytes, 'demo');
    expect(out.subSheets[0]!.save).toContain('alpha-only');
    expect(out.subSheets[1]!.save).toContain('beta-only');
    expect(out.subSheets[1]!.save).not.toContain('alpha-only');
  });

  it('a single-sheet workbook yields one sub-room + TOC', () => {
    const out = buildMultiSheetImport(workbookBytes([{ name: 'Only', aoa: [['x']] }]), 'solo');
    expect(out.subSheets).toHaveLength(1);
    expect(out.subSheets[0]!.subroom).toBe('solo.1');
  });

  it('enforces the cell-limit across the whole workbook', () => {
    // Two sheets that each individually fit but together exceed the cap.
    const half = Math.ceil(MAX_IMPORT_CELLS / 2) + 1;
    const aoa = Array.from({ length: half }, (_, i) => [i]);
    const bytes = workbookBytes([
      { name: 'A', aoa },
      { name: 'B', aoa },
    ]);
    expect(() => buildMultiSheetImport(bytes, 'big')).toThrow(/exceeds/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `bun run --cwd packages/worker test:node multi-sheet-import`
Expected: FAIL — module `../src/lib/multi-sheet-import.ts` not found.

- [ ] **Step 3: Implement `multi-sheet-import.ts`** — create `packages/worker/src/lib/multi-sheet-import.ts`:

```ts
/**
 * Multi-sheet workbook import (inverse of the multi-sheet export in
 * `routes/exports.ts`). Splits an uploaded xlsx/ods/fods workbook into a
 * TOC sheet (one row per worksheet) plus one SocialCalc save per worksheet,
 * destined for sub-rooms `<room>.<N>`. Pure / node-testable; the DO fan-out
 * lives in `routes/multi-import.ts`.
 *
 * TOC shape matches `packages/client-multi/src/Foldr.ts` and the export
 * reader `fetchMultiSheetBundle`: header row `['#url', '#title']`, then one
 * `['/<room>.<N>', sheetName]` row per worksheet (sub-rooms are 1-based, in
 * workbook order). Titles are the workbook sheet names so cross-sheet
 * formulas (`'SheetName'!A1`) resolve by title through the existing recalc
 * hydration.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import { csvToSocialCalc } from './csv.ts';
import { encodeCSV } from './csv-encode.ts';
import {
  countWorksheetCells,
  enforceImportLimit,
  worksheetToSave,
} from './xlsx-import.ts';

/** TOC header row — matches `Foldr.ts` (`#url`/`#title`), dropped on read. */
const TOC_HEADER: readonly string[] = ['#url', '#title'];

export interface MultiSheetImport {
  /** SocialCalc save for the TOC sheet, written to the base room. */
  readonly tocSave: string;
  /** One save per worksheet, written to sub-room `<room>.<N>`. */
  readonly subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
}

/**
 * Parse a workbook and produce the TOC + per-sub-sheet saves for `room`.
 * Throws `ImportTooLargeError` when the whole workbook exceeds the cell cap.
 */
export function buildMultiSheetImport(bytes: Uint8Array, room: string): MultiSheetImport {
  const wb = (XLSX as any).read(bytes, { type: 'array', cellFormula: true });
  const names: string[] = Array.isArray(wb.SheetNames) ? wb.SheetNames : [];

  // Bound the WHOLE workbook before any per-sheet SocialCalc replay.
  let totalCells = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    if (ws) totalCells += countWorksheetCells(ws);
  }
  enforceImportLimit(totalCells);

  const subSheets: Array<{ subroom: string; save: string }> = [];
  const tocRows: string[][] = [[...TOC_HEADER]];
  let idx = 0;
  for (const name of names) {
    const ws = wb.Sheets[name];
    // Defensive: a SheetName without a Sheets entry is skipped (mirrors
    // parseMultiSheetWorkbook's old guard). Covered by tests via a workbook
    // whose every name resolves, plus the empty-workbook case.
    if (!ws) continue;
    idx++;
    const subroom = `${room}.${idx}`;
    subSheets.push({ subroom, save: worksheetToSave(ws as Record<string, unknown>) });
    tocRows.push([`/${subroom}`, name]);
  }

  return { tocSave: csvToSocialCalc(encodeCSV(tocRows)), subSheets };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `bun run --cwd packages/worker test:node multi-sheet-import`
Expected: PASS (all `worksheetToSave` + `buildMultiSheetImport` tests).

- [ ] **Step 5: Commit**

```bash
git add packages/worker/src/lib/multi-sheet-import.ts packages/worker/test/multi-sheet-import.node.test.ts
git commit -m "feat(worker): buildMultiSheetImport pure transform"
```

---

## Task 3: Register the PUT routes + DO fan-out + round-trip test

**Files:**
- Create: `packages/worker/src/routes/multi-import.ts`
- Modify: `packages/worker/src/index.ts` (import + call after `registerExports`)
- Test: `packages/worker/test/multi-import.test.ts` (worker-pool integration)

- [ ] **Step 1: Write the failing integration test** — create `packages/worker/test/multi-import.test.ts`:

```ts
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';

import worker from '../src/index.ts';
import type { Env } from '../src/env.ts';

async function request(method: string, path: string, body?: BodyInit): Promise<Response> {
  const req = new Request(`https://example.test${path}`, { method, body });
  return worker.fetch(req, env as unknown as Env, {
    waitUntil() {},
    passThroughOnException() {},
  } as any);
}

function twoSheetXlsx(): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['hello', 1]]), 'First');
  // Second sheet carries a formula so we can prove formula fidelity on a
  // NON-first sheet (acceptance criterion 2).
  const second: any = XLSX.utils.aoa_to_sheet([[10], [20]]);
  second['A3'] = { t: 'n', f: 'SUM(A1:A2)' };
  second['!ref'] = 'A1:A3';
  XLSX.utils.book_append_sheet(wb, second, 'Second');
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

describe('PUT multi-sheet import', () => {
  it('PUT /=:room.xlsx imports a workbook into TOC + sub-rooms and round-trips through export', async () => {
    const room = 'mimport-' + Math.random().toString(36).slice(2, 8);
    const put = await request('PUT', `/=${room}.xlsx`, twoSheetXlsx());
    expect(put.status).toBe(201);
    expect(await put.text()).toBe('OK');

    // Sub-rooms exist.
    const sub1 = await request('GET', `/_/${room}.1`);
    expect(sub1.status).toBe(200);
    expect(await sub1.text()).toContain('hello');

    // Formula fidelity on the NON-first sheet (acceptance criterion 2):
    // the second sub-room's raw save keeps the formula text.
    const sub2 = await request('GET', `/_/${room}.2`);
    expect(await sub2.text()).toContain('SUM(A1:A2)');

    // Round-trip: re-export the multi-sheet workbook and confirm both sheets survive.
    const exp = await request('GET', `/_/=${room}/xlsx`);
    expect(exp.status).toBe(200);
    const wb = XLSX.read(new Uint8Array(await exp.arrayBuffer()), { type: 'array' });
    expect(wb.SheetNames).toEqual(['First', 'Second']);
  });

  it('PUT /_/=:room/ods is accepted too', async () => {
    const room = 'mimport-ods-' + Math.random().toString(36).slice(2, 8);
    const res = await request('PUT', `/_/=${room}/ods`, twoSheetXlsx());
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bun run --cwd packages/worker test:workers multi-import`
Expected: FAIL — no PUT route matches `/=:room.xlsx` (404, not 201).

- [ ] **Step 3: Implement the route module** — create `packages/worker/src/routes/multi-import.ts`:

```ts
/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`. `PUT /=:room.{xlsx,ods,fods}` and
 * `PUT /_/=:room/{xlsx,ods,fods}` parse the uploaded workbook into a TOC
 * sheet + one sub-room per worksheet and fan the saves out to the per-room
 * DOs (sub-rooms first, TOC last, so the TOC never points at a missing
 * sub-room). Returns `201 OK`, matching legacy and the single-sheet
 * `PUT /_/:room`. Like all HTTP endpoints these are unauthenticated by
 * design (§6.4).
 */
import type { Hono } from 'hono';

import type { Env } from '../env.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { buildMultiSheetImport } from '../lib/multi-sheet-import.ts';

const TEXT_CT = 'text/plain; charset=utf-8';
const IMPORT_FORMATS = ['xlsx', 'ods', 'fods'] as const;

function ok(): Response {
  return new Response('OK', {
    status: 201,
    headers: { 'Content-Type': TEXT_CT, 'Content-Length': '2' },
  });
}

function failed(): Response {
  return new Response('import failed', {
    status: 500,
    headers: { 'Content-Type': TEXT_CT },
  });
}

async function importWorkbook(env: Env, base: string, bytes: Uint8Array): Promise<Response> {
  const { tocSave, subSheets } = buildMultiSheetImport(bytes, base);
  for (const { subroom, save } of subSheets) {
    const res = await doFetch(env, subroom, '/_do/snapshot', { method: 'PUT', body: save });
    if (res.status >= 300) return failed();
  }
  const toc = await doFetch(env, base, '/_do/snapshot', { method: 'PUT', body: tocSave });
  if (toc.status >= 300) return failed();
  return ok();
}

export function registerMultiSheetImport(app: Hono<{ Bindings: Env }>): void {
  for (const fmt of IMPORT_FORMATS) {
    // `/_/=:room/<fmt>` — `:room` is the base name (no `=`).
    app.put(`/_/=:room/${fmt}`, async (c) => {
      const base = c.req.param('room') ?? '';
      const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
      return importWorkbook(c.env, base, bytes);
    });
    // `/=:room.<fmt>` — `:room` greedily captures `name.<fmt>`; strip the suffix.
    app.put(`/=:room.${fmt}`, async (c) => {
      const raw = c.req.param('room') ?? '';
      const base = raw.slice(0, raw.length - fmt.length - 1);
      const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
      return importWorkbook(c.env, base, bytes);
    });
  }
}
```

- [ ] **Step 4: Wire it into the app** — in `packages/worker/src/index.ts`, add the import near the other route imports (after the `registerExports` import, line ~27):

```ts
import { registerMultiSheetImport } from './routes/multi-import.ts';
```

and call it immediately after `registerExports(app);` (line ~154):

```ts
  registerExports(app);
  // Multi-sheet workbook IMPORT (PUT /=:room.xlsx etc) — register alongside
  // the multi-sheet exports, before the `/:room` catch-all.
  registerMultiSheetImport(app);
```

- [ ] **Step 5: Run the integration test to verify it passes**

Run: `bun run --cwd packages/worker test:workers multi-import`
Expected: PASS (2 tests — `.xlsx` round-trip + `.ods` accepted).

- [ ] **Step 6: Typecheck**

Run: `bun run --cwd packages/worker typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/worker/src/routes/multi-import.ts packages/worker/src/index.ts packages/worker/test/multi-import.test.ts
git commit -m "feat(worker): wire PUT multi-sheet workbook import routes"
```

---

## Task 4: Delete the superseded `parseMultiSheetWorkbook`

The CSV-per-sheet parser is values-only and now has no caller (the import uses the formula-preserving `worksheetToSave` path). Remove it and its tests.

**Files:**
- Modify: `packages/worker/src/lib/xlsx-build.ts` (delete `parseMultiSheetWorkbook` + its doc-comment bullet)
- Modify: `packages/worker/test/xlsx-build.node.test.ts` (delete its tests)

- [ ] **Step 1: Confirm there are no remaining callers**

Run: `grep -rn "parseMultiSheetWorkbook" packages/worker/src`
Expected: only the definition in `lib/xlsx-build.ts` (and its doc-comment bullet at line ~26). No `routes/`/`handlers/` references.

- [ ] **Step 2: Delete the function** — remove `export function parseMultiSheetWorkbook(...) { … }` (lib/xlsx-build.ts:468 to its closing brace) and the `- \`parseMultiSheetWorkbook\`: inverse; bytes → array of …` bullet in the file header comment (line ~26).

- [ ] **Step 3: Delete its tests** — in `packages/worker/test/xlsx-build.node.test.ts`, remove the `describe('parseMultiSheetWorkbook', …)` block and drop `parseMultiSheetWorkbook` from the import statement.

- [ ] **Step 4: Run the build suite + full node coverage**

Run: `bun run --cwd packages/worker test:node xlsx-build`
Expected: PASS (no `parseMultiSheetWorkbook` block).

Run: `bun run --cwd packages/worker test:coverage`
Expected: PASS at 100% lines/branches/functions/statements (no dead uncovered code introduced).

- [ ] **Step 5: Commit**

```bash
git add packages/worker/src/lib/xlsx-build.ts packages/worker/test/xlsx-build.node.test.ts
git commit -m "refactor(worker): drop dead CSV-only parseMultiSheetWorkbook"
```

---

## Task 5: Oracle equivalence scenario (recorded in CI)

Add a `multi-import` scenario group: a PUT that imports a fixed workbook (asserting `201 OK` against legacy) plus a GET that re-exports the imported multi-sheet room (structural xlsx equivalence). Fixtures are recorded by `oracle-harness record` on the Linux nightly runner — NOT locally (live-risk §7.2 macOS/ARM Docker hang).

**Files:**
- Modify: `packages/oracle-harness/src/scenarios/fixtures.ts` (room name + xlsx base64)
- Create: `packages/oracle-harness/src/scenarios/multi-import.ts`
- Modify: `packages/oracle-harness/src/scenarios/index.ts` (aggregate)
- Modify: `packages/oracle-harness/test/scenarios.test.ts` (counts 24→26, 27→29)

- [ ] **Step 1: Generate the fixed workbook base64** — run this one-off from the repo root and copy the printed string:

```bash
bun -e 'import("@e965/xlsx").then((X)=>{const wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([["hello",1]]),"First");X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet([["world",2]]),"Second");const b=X.write(wb,{type:"base64",bookType:"xlsx"});console.log(b)})'
```

Expected: a single base64 line (deterministic for these inputs). Hold it for Step 2.

- [ ] **Step 2: Add fixture constants** — in `packages/oracle-harness/src/scenarios/fixtures.ts`, add (near the other room constants):

```ts
/** Base room a multi-sheet workbook is imported into (oracle parity). */
export const ORACLE_MULTI_IMPORT_ROOM = 'oracle-multi-import';

/**
 * A fixed 2-sheet xlsx ("First":[hello,1], "Second":[world,2]) as base64,
 * PUT to both oracle and target so the imported state is identical on each
 * side. Generated via `bun -e` (see plan Task 5 Step 1).
 */
export const ORACLE_MULTI_IMPORT_XLSX_BASE64 =
  '<PASTE THE BASE64 FROM STEP 1 HERE>';
```

- [ ] **Step 3: Create the scenario module** — `packages/oracle-harness/src/scenarios/multi-import.ts`:

```ts
import type { HttpScenario } from '@ethercalc/shared/oracle-scenarios';

import {
  ORACLE_MULTI_IMPORT_ROOM,
  ORACLE_MULTI_IMPORT_XLSX_BASE64,
} from './fixtures.ts';

/**
 * Multi-sheet workbook import parity. PUT a fixed workbook (201 OK on both
 * sides), then re-export it and assert structural xlsx equivalence via the
 * zip-canonical matcher. Recorded against the legacy oracle in CI.
 */
export const PUT_MULTI_IMPORT: HttpScenario = {
  name: 'multi-import/put-xlsx',
  kind: 'http',
  request: {
    method: 'PUT',
    path: `/=${ORACLE_MULTI_IMPORT_ROOM}.xlsx`,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    bodyBase64: ORACLE_MULTI_IMPORT_XLSX_BASE64,
  },
};

export const GET_MULTI_IMPORT_EXPORT: HttpScenario = {
  name: 'multi-import/get-xlsx',
  kind: 'http',
  request: {
    method: 'GET',
    path: `/_/=${ORACLE_MULTI_IMPORT_ROOM}/xlsx`,
  },
};

/** Ordered: PUT (import) must run before GET (re-export). */
export const MULTI_IMPORT_SCENARIOS: readonly HttpScenario[] = [
  PUT_MULTI_IMPORT,
  GET_MULTI_IMPORT_EXPORT,
];
```

- [ ] **Step 4: Aggregate** — in `packages/oracle-harness/src/scenarios/index.ts`:

add the import + re-export near the others:

```ts
import { MULTI_IMPORT_SCENARIOS } from './multi-import.ts';
```
```ts
export { MULTI_IMPORT_SCENARIOS } from './multi-import.ts';
```

and spread it into BOTH lists, after `...EXPORT_SCENARIOS,` and before the teardown:

```ts
export const ALL_HTTP_SCENARIOS: readonly HttpScenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...EXPORT_SCENARIOS,
  ...MULTI_IMPORT_SCENARIOS,
  ...FORM_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];
```
```ts
export const ALL_SCENARIOS: readonly Scenario[] = [
  ...STATIC_SCENARIOS,
  ...MISC_SCENARIOS,
  ...ROOMS_INDEX_SCENARIOS,
  ...ROOM_CRUD_SETUP_SCENARIOS,
  ...EXPORT_SCENARIOS,
  ...MULTI_IMPORT_SCENARIOS,
  ...WS_SCENARIOS,
  ...FORM_SCENARIOS,
  ...ROOM_CRUD_TEARDOWN_SCENARIOS,
];
```

- [ ] **Step 5: Update the count assertions** — in `packages/oracle-harness/test/scenarios.test.ts`, change `expect(names.length).toBe(24);` to `toBe(26)` and `expect(names.length).toBe(27);` to `toBe(29)` (the two new HTTP scenarios add to both the HTTP-only and the combined totals).

- [ ] **Step 6: Run the oracle-harness unit tests**

Run: `bun run --cwd packages/oracle-harness test scenarios`
Expected: PASS — the count assertions and any uniqueness/name checks accept the two new scenarios.

- [ ] **Step 7: Commit**

```bash
git add packages/oracle-harness/src/scenarios/fixtures.ts packages/oracle-harness/src/scenarios/multi-import.ts packages/oracle-harness/src/scenarios/index.ts packages/oracle-harness/test/scenarios.test.ts
git commit -m "test(oracle): multi-sheet import scenario (recorded in CI)"
```

> **CI note:** the `.json` fixtures under `tests/oracle/recorded/multi-import/` are produced by `bun run --cwd packages/oracle-harness record` against the legacy Docker oracle on the nightly Linux runner. If the re-export structural comparison drifts (SheetJS vs legacy layout), tune the `multi-import/get-xlsx` matcher the same way the existing xlsx/ods export fixtures were stabilised (zip-canonical). Do NOT attempt to record locally on macOS/ARM (§7.2).

---

## Task 6: Documentation truth-up

**Files:**
- Modify: `packages/worker/src/lib/xlsx-import.ts:124` (comment)
- Modify: `docs/historic/REWRITE_ULTRAPLAN.md` (tick the Phase 8 multi-sheet-import checkbox)

- [ ] **Step 1: Fix the stale comment** — in `packages/worker/src/lib/xlsx-import.ts`, the `xlsxToSave` doc-comment currently reads "the multi-sheet import path (`PUT /=:room.xlsx`) handles fan-out to per-sub-sheet DOs separately." Confirm it now references a route that exists; if the wording implies the path is unimplemented, change "handles fan-out … separately" to "is `buildMultiSheetImport` + `routes/multi-import.ts`."

- [ ] **Step 2: Tick the plan checkbox** — in `docs/historic/REWRITE_ULTRAPLAN.md` §8 Phase 8, the line `- [x] Multi-sheet xlsx/ods/fods export + xlsx/ods import with formula fidelity (\`ecb18d3\`).` already reads `[x]` but the import half was unimplemented; append `+ multi-sheet import routes (\`PUT /=:room.{xlsx,ods,fods}\`)` so the checkbox is literally true.

- [ ] **Step 3: Commit**

```bash
git add packages/worker/src/lib/xlsx-import.ts docs/historic/REWRITE_ULTRAPLAN.md
git commit -m "docs: multi-sheet import now implemented (truth-up)"
```

---

## Task 7: Full-suite verification

- [ ] **Step 1: Worker node + workers-pool + coverage**

Run: `bun run --cwd packages/worker test`
Expected: PASS (node + workers-pool).

Run: `bun run --cwd packages/worker test:coverage`
Expected: 100% lines/branches/functions/statements.

- [ ] **Step 2: Typecheck + deploy dry-run**

Run: `bun run --cwd packages/worker typecheck`
Run: `bun run --cwd packages/worker build:dry`
Expected: both green (`wrangler deploy --dry-run` succeeds).

- [ ] **Step 3: Oracle-harness coverage**

Run: `bun run --cwd packages/oracle-harness test:coverage`
Expected: 100%.

- [ ] **Step 4: Final confirmation against acceptance criteria** — manually re-read the spec's §9 acceptance criteria and confirm each maps to a green test:
  1. routes return 201 + TOC/sub-rooms → Task 3 integration test
  2. formulas survive on a non-first sheet → Task 1/2 tests
  3. import→export round-trips → Task 3 integration test
  4. `parseMultiSheetWorkbook` removed → Task 4
  5. 100% coverage + dry-run green → Task 7
  6. oracle scenario records green in nightly → Task 5 (CI)
  7. single-sheet `PUT /_/:room` unchanged → Task 1 Step 5

---

## Self-review notes

- **Spec coverage:** all 7 acceptance criteria map to tasks (see Task 7 Step 4). Routes (§4) → Task 3; `worksheetToSave`/`buildMultiSheetImport` (§5.1/5.2) → Tasks 1–2; DO fan-out TOC-last (§5.3) → Task 3; cross-sheet-by-title (§6) → Task 2 (title rows) + Task 3 round-trip; error/limit (§7) → Task 2 cell-limit test + Task 3; tests (§8) → Tasks 2/3/5; `parseMultiSheetWorkbook` removal (criterion 4) → Task 4; doc truth-up (§8.4) → Task 6.
- **Type consistency:** `worksheetToSave(ws: Record<string, unknown>): string`, `buildMultiSheetImport(bytes, room): MultiSheetImport` with `{ tocSave, subSheets: [{ subroom, save }] }`, `registerMultiSheetImport(app)` — used identically across Tasks 1/2/3.
- **Known risk (flagged, not a blocker):** the oracle re-export structural comparison (Task 5) may need zip-canonical matcher tuning during CI recording; the worker round-trip test (Task 3) is the primary correctness proof and does not depend on the oracle.
