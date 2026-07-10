# Multi-sheet TOC CSV POST Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore pinned-legacy `POST /_/:room` `text/csv` append behavior so a fresh multi-sheet room persists its TOC and renders `Sheet1`.

**Architecture:** Classify CSV separately from literal SocialCalc commands, convert it through the existing SheetJS replay pipeline into one encoded `loadclipboard` command, then reuse the established loadclipboard row-enrichment and RoomDO dispatch path. Preserve the XLSX/ODS POST pair, `PUT text/csv`, and client protocol unchanged.

**Tech Stack:** TypeScript, Hono, Cloudflare Durable Objects, `@e965/xlsx`, `@ethercalc/socialcalc-headless`, Vitest node/workers-pool, oracle recorder/replayer, Playwright browser smoke.

## Global Constraints

- Pin behavior to legacy commit `042b731d9e98f1d30537e6cb656f65792afdecdf`.
- Use TDD: regression tests must fail for the current raw-CSV dispatch before production code changes.
- The Tester agent authors all automated test code; implementation agents do not write or weaken tests.
- CSV POST appends below existing rows and returns the enriched command array.
- No `client-multi`, D1 schema, Wrangler binding, or `PUT text/csv` change.
- Run only focused tests until the browser smoke works; cleanup and broader verification happen afterward.

---

### Task 1: Pin the regression red

**Files:**
- Modify: `packages/worker/test/post-command.node.test.ts`
- Modify: `packages/worker/test/xlsx-import.node.test.ts`
- Modify: `packages/worker/test/routes-rooms-post.node.test.ts`
- Modify: `packages/worker/test/routes-rooms.test.ts`
- Modify: `packages/oracle-harness/src/scenarios/room-crud.ts`
- Modify: `packages/oracle-harness/src/scenarios/fixtures.ts`
- Modify: `packages/oracle-harness/src/normalize.ts`
- Create: `tests/oracle/recorded/room-crud/post-csv-toc.json`
- Create: `tests/oracle/recorded/room-crud/get-csv-json-after-post.json`
- Create: `tests/oracle/recorded/room-crud/post-csv-toc-cold.json`
- Create: `tests/oracle/recorded/room-crud/get-csv-json-after-post-cold.json`
- Create: `tests/oracle/recorded/room-crud/delete-csv-toc-cold.json`

**Interfaces:**
- Consumes: existing `classifyCommandBody`, `xlsxToLoadClipboardCommands`, real Worker `request()` helper, oracle `HttpScenario` format.
- Produces: failing expectations for `csv-deferred`, a generic workbook clipboard-command helper, append-at-row semantics, real RoomDO persistence, and pinned-oracle state.

- [ ] **Step 1: Have the Tester agent add focused classifier and helper expectations**

The tests must require:

```text
classifyCommandBody('text/csv', nonEmptyBytes) === { kind: 'csv-deferred' }
classifyCommandBody('text/csv; charset=utf-8', nonEmptyBytes) === { kind: 'csv-deferred' }
classifyCommandBody('text/csv', zeroBytes) === { kind: 'empty' }
workbookToLoadClipboardCommand(csvBytes) starts with "loadclipboard "
replaying that command plus "paste A2 all" yields typed TOC cells at A2:B3
workbookToLoadClipboardCommand(emptyBytes) === null
xlsxToLoadClipboardCommands(xlsxBytes) retains [loadclipboard, "paste A1 all"]
```

- [ ] **Step 2: Have the Tester agent add route-shape expectations**

For an existing snapshot whose sheet dimension ends at row 5, POST this body:

```csv
"#url","#title"
"/r.1","Sheet1"
```

Require `202 application/json`, a two-element command array, final command `paste A6 all`, and one `POST /_do/commands` whose body is the response array joined by `\n`. Explicitly reject raw CSV as the DO body.

- [ ] **Step 3: Have the Tester agent add real RoomDO persistence cases**

Use `packages/worker/test/routes-rooms.test.ts` and its existing real Worker/DO `request()` helper:

```text
cold room CSV POST -> command[1] is "paste A2 all" -> csv.json has blank row 1 and TOC rows beginning row 2
seeded room with A1/B1 -> CSV POST -> original row remains -> TOC rows begin row 2
```

The seeded-room expected grid is:

```json
[["existing","row"],["#url","#title"],["/toc.1","Sheet1"]]
```

- [ ] **Step 4: Add and record pinned oracle scenarios**

In `fixtures.ts`, add a stable never-touched room name for the cold-room case.
In `room-crud.ts`, after `POST_COMMAND` and before delete, add:

```text
room-crud/post-csv-toc-cold
POST /_/oracle-phase3-csv-cold
Content-Type: text/csv
body: "#url","#title"\n"/oracle-phase3-csv-cold.1","Sheet1"

room-crud/get-csv-json-after-post-cold
GET /_/oracle-phase3-csv-cold/csv.json

room-crud/post-csv-toc
POST /_/oracle-phase3-export
Content-Type: text/csv
body: "#url","#title"\n"/oracle-phase3-export.1","Sheet1"

room-crud/get-csv-json-after-post
GET /_/oracle-phase3-export/csv.json

room-crud/delete-csv-toc-cold
DELETE /_/oracle-phase3-csv-cold
```

Normalize both POST bodies with `ignore` plus relaxed content length; normalize
both follow-up GETs with `json` plus relaxed content length. Record against the
pinned legacy Docker container. The cold follow-up must retain a blank first
row before the TOC, empirically pinning the legacy `paste A2 all` fallback.

- [ ] **Step 5: Run the focused tests and verify RED**

Run from `packages/worker`:

```bash
bunx vitest run --config vitest.node.config.ts \
  test/post-command.node.test.ts \
  test/xlsx-import.node.test.ts \
  test/routes-rooms-post.node.test.ts
bunx vitest run --config vitest.config.ts test/routes-rooms.test.ts
```

Expected: failures specifically show missing `csv-deferred`, missing `workbookToLoadClipboardCommand`, raw CSV dispatch, and empty `csv.json`; no syntax/configuration errors.

---

### Task 2: Implement the minimal conversion and dispatch fix

**Files:**
- Modify: `packages/worker/src/handlers/post-command.ts`
- Modify: `packages/worker/src/lib/xlsx-import.ts`
- Modify: `packages/worker/src/routes/rooms.ts`

**Interfaces:**
- Consumes: `replayWorkbook(bytes)`, SocialCalc `CreateSheetSave(range)`/`encodeForSave`, `enrichLoadClipboard()`, `joinCommands()`.
- Produces: `workbookToLoadClipboardCommand(bytes: Uint8Array): string | null` and the `csv-deferred` execution path.

- [ ] **Step 1: Add `csv-deferred` classification**

Extend `ClassifiedCommand`:

```ts
| { readonly kind: 'csv-deferred' }
```

After XLSX/ODS MIME detection and before literal-text fallback, normalize the body and classify CSV:

```ts
if (ct === 'text/csv') {
  if (bytes.byteLength === 0) return { kind: 'empty' };
  return { kind: 'csv-deferred' };
}
```

Keep all existing branches unchanged.

- [ ] **Step 2: Extract the generic clipboard helper**

In `xlsx-import.ts`, move the current range-save construction from `xlsxToLoadClipboardCommands()` into:

```ts
export function workbookToLoadClipboardCommand(
  bytes: Uint8Array,
): string | null {
  const SC = loadSocialCalc() as any;
  const { sheet } = replayWorkbook(bytes);
  if (Object.keys(sheet.cells as Record<string, unknown>).length === 0) {
    return null;
  }
  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  const lastRow = sheet.attribs.lastrow as number;
  const range = `A1:${lastCol}${lastRow}`;
  const clipboardSave: string = sheet.CreateSheetSave(range);
  return `loadclipboard ${SC.encodeForSave(clipboardSave)}`;
}
```

Rebuild the existing XLSX function without changing its contract:

```ts
export function xlsxToLoadClipboardCommands(bytes: Uint8Array): string[] {
  const command = workbookToLoadClipboardCommand(bytes);
  return command === null ? [] : [command, 'paste A1 all'];
}
```

- [ ] **Step 3: Normalize CSV to the existing text-command path**

Import `workbookToLoadClipboardCommand` in `routes/rooms.ts`. After the existing XLSX/ODS early return and empty-body check, derive local executable state:

```ts
let commandKind: 'json-command' | 'text-command';
let command: string | readonly string[];

if (classified.kind === 'csv-deferred') {
  let csvCommand: string | null;
  try {
    csvCommand = workbookToLoadClipboardCommand(bytes);
  } catch (err) {
    if (
      err instanceof ImportTooLargeError ||
      err instanceof ImportArchiveTooLargeError
    ) {
      return sizedResponse(err.message, 413, TEXT_CT);
    }
    return sizedResponse('Could not import CSV', 400, TEXT_CT);
  }
  if (csvCommand === null) {
    return new Response(JSON.stringify({ command: [] }), {
      status: 202,
      headers: { 'Content-Type': JSON_CT },
    });
  }
  commandKind = 'text-command';
  command = csvCommand;
} else {
  commandKind = classified.kind;
  command = classified.command;
}
```

Use `command` in the banned-format check and to initialize `commandOut`. Run loadclipboard/cascade handling when `commandKind === 'text-command'`. Leave the shared cron, DO dispatch, and response tail unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same node and workers-pool commands from Task 1. Expected: all selected tests pass with no warnings or unhandled errors.

---

### Task 3: Prove oracle compatibility

**Files:**
- Verify: `packages/oracle-harness/src/scenarios/room-crud.ts`
- Verify: `packages/oracle-harness/src/scenarios/fixtures.ts`
- Verify: `packages/oracle-harness/src/normalize.ts`
- Verify: `tests/oracle/recorded/room-crud/post-csv-toc.json`
- Verify: `tests/oracle/recorded/room-crud/get-csv-json-after-post.json`
- Verify: `tests/oracle/recorded/room-crud/post-csv-toc-cold.json`
- Verify: `tests/oracle/recorded/room-crud/get-csv-json-after-post-cold.json`
- Verify: `tests/oracle/recorded/room-crud/delete-csv-toc-cold.json`

**Interfaces:**
- Consumes: pinned legacy Docker oracle on `127.0.0.1:8000`, candidate Worker on `127.0.0.1:8787`.
- Produces: golden response/state fixtures and a successful replay.

- [ ] **Step 1: Start a fresh oracle and record**

```bash
docker compose -f tests/oracle/docker-compose.yml down -v
docker compose -f tests/oracle/docker-compose.yml up --build -d
bun run --cwd packages/oracle-harness record \
  --target http://127.0.0.1:8000 \
  --out tests/oracle/recorded
```

Inspect all five new fixtures: both POSTs must return `202`; the cold follow-up
must retain a blank first row before the TOC; the seeded follow-up must preserve
the original row and append the two TOC rows; the cold-room DELETE must return
`201`.

- [ ] **Step 2: Replay against the oracle itself**

Restart with fresh Redis, then run:

```bash
bun run --cwd packages/oracle-harness replay \
  --target http://127.0.0.1:8000 \
  --recorded tests/oracle/recorded
```

Expected: all oracle scenarios pass.

- [ ] **Step 3: Replay against the local Worker**

Start `bun run --cwd packages/worker dev`, then run the same replay with target `http://127.0.0.1:8787`. Expected: all scenarios, including both new CSV cases, pass.

---

### Task 4: Browser-smoke the actual multi-sheet flow

**Files:**
- Verify only: no production-file changes.

**Interfaces:**
- Consumes: local Worker URL and browser `/=:room` UI.
- Produces: end-to-end proof that the user-visible TOC persists.

- [ ] **Step 1: Open a unique fresh multi room**

Start the local Worker and navigate to:

```text
http://127.0.0.1:8787/=toc-csv-fix-<unique-suffix>
```

- [ ] **Step 2: Verify cold-room initialization**

Require one visible `Sheet1` tab, an editor iframe taller than 400 px, no page errors, and no console errors.

- [ ] **Step 3: Verify persistence and row-sensitive operations**

Reload and require `Sheet1` to remain. Add `Sheet2`, rename it, delete it, reload again, and require exactly one `Sheet1` tab with no duplicate or ghost tabs. Verify `GET /_/:room/csv.json` reflects the persisted TOC.

- [ ] **Step 4: Remove smoke state**

Delete the unique room and any generated sub-rooms; stop local Worker and oracle containers.
