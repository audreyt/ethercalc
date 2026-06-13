# Multi-sheet workbook import — design

> **Date:** 2026-06-13 · **Owner:** Audrey Tang · **Status:** approved for planning
>
> Closes the one genuine regression found in the 2026-06-13 "is the rewrite
> finished?" audit: multi-sheet workbook **import** is unrouted (`PUT /=:room.xlsx`
> 404s) while the legacy LiveScript oracle (`042b731d`, `src/main.ls`) implements
> it. This falsifies the Phase-8 checkbox `[x] multi-sheet xlsx/ods import` and
> §6.1 row 204 in `docs/historic/REWRITE_ULTRAPLAN.md`.

## 1. Problem

The rewrite implements multi-sheet **export** (`GET /_/=:room/{xlsx,ods,fods}` →
walks the TOC + sub-rooms via DO-to-DO fetches) but never registered the inverse
**import** routes. The pure parser `parseMultiSheetWorkbook` (`lib/xlsx-build.ts:468`)
exists but has **zero callers**; `lib/xlsx-import.ts:124` even documents a fan-out
route (`PUT /=:room.xlsx`) that was never wired. Legacy splits an uploaded workbook
into a TOC sheet at `snapshot-<room>` plus one `snapshot-<room>.<idx>` sub-room per
worksheet and returns `201 OK`.

## 2. Goal / non-goals

**Goal.** Register `PUT /=:room.{xlsx,ods,fods}` and `PUT /_/=:room/{xlsx,ods,fods}`
so an uploaded workbook is imported into a TOC sheet (at the base room) + one
sub-room per worksheet, **preserving per-sheet formulas/merges/number-formats**, and
round-tripping with the existing multi-sheet export. Return `201 OK` text/plain.

**Non-goals.**
- The broader doc-truth cleanup from the audit (stale `xlsx-deferred` comments on
  the single-room path, `POST /_/:room` xlsx 501, `ignore`/`snapshot` WS frames,
  "10 passing specs", §1.1 criterion-1 wording, widening oracle coverage beyond this
  one scenario). Tracked separately; not in this change.
- Changing the single-sheet `PUT /_/:room` import behaviour (it already matches
  legacy). The refactor below must be behaviour-preserving for it.
- Multi-sheet **non-binary** export (`/_/=room/{csv,html,md}` → 501) — confirmed
  legacy-matching, no change.

## 3. Decisions (resolved with the owner)

| # | Decision |
| - | -------- |
| 1 | **Fidelity: formula-preserving (Approach A).** Generalise `xlsxToSave` to a per-worksheet converter and import every sheet with full fidelity. Rejected: CSV-values-only fan-out via `parseMultiSheetWorkbook` (loses formulas/formats/merges — a fidelity regression). |
| 2 | **Oracle scenario recorded in CI.** Define a `multi-sheet-import` oracle scenario; record/replay it against the legacy Docker on the Linux nightly runner (sidesteps the macOS/ARM oracle-hang, live-risk §7.2). Correctness is *also* proven locally by an import→export round-trip integration test. |

## 4. Surface (new routes)

Six PUT patterns, mirroring the export registration loop in `routes/exports.ts`
(`for (const fmt of ['xlsx','ods','fods'])`):

| Method | Path | Body | Response |
| ------ | ---- | ---- | -------- |
| PUT | `/=:room.xlsx`, `.ods`, `.fods` | workbook bytes | `201 OK` text/plain |
| PUT | `/_/=:room/xlsx`, `/ods`, `/fods` | workbook bytes | `201 OK` text/plain |

Room-name handling matches the export side exactly: for `/=:room.<fmt>` the `:room`
param captures `foo.xlsx`, sliced to base `foo`; for `/_/=:room/<fmt>` the param is the
base `foo` directly. Sub-rooms are `` `${base}.${i}` `` (1-based worksheet order); the TOC
lives at the base room. **No route collision:** `/_/=:room/xlsx` is three segments vs
`PUT /_/:room`'s two; `PUT /=:room.xlsx` is method-distinct from the existing GET export.

**Auth.** Like `PUT /_/:room` and the legacy oracle, these HTTP import routes do **not**
require an `auth` HMAC (§6.4: HTTP endpoints are unauthenticated by design; anonymous
write is the documented contract). No new auth gate is introduced.

## 5. Architecture / components

**5.1 `lib/xlsx-import.ts` — extract a per-worksheet converter (behaviour-preserving).**
Pull the cell-walk + merges + recalc + `CreateSpreadsheetSave` body out of `xlsxToSave`
into:

```ts
export function worksheetToSave(ws: SheetJSWorksheet): string
```

`xlsxToSave(bytes)` becomes: `XLSX.read` → `worksheetToSave(wb.Sheets[wb.SheetNames[0]])`.
The cell-limit (`enforceImportLimit`/`MAX_IMPORT_CELLS`) and the defensive empty-sheet
guards stay. The existing single-sheet tests must remain green unchanged.

**5.2 `lib/multi-sheet-import.ts` — pure transform (node-tested, 100% gate).**

```ts
export function buildMultiSheetImport(
  bytes: Uint8Array,
  room: string,
): { tocSave: string; subSheets: Array<{ subroom: string; save: string }> }
```

- `XLSX.read(bytes, { type:'array', cellFormula:true })`.
- Enforce `MAX_IMPORT_CELLS` across the **whole** workbook (sum of `countWorksheetCells`
  over all sheets) before any per-sheet replay — keeps the DoS bound.
- For each worksheet `i` (1-based, workbook order): `subroom = \`${room}.${i}\``,
  `save = worksheetToSave(ws)`.
- TOC: `encodeCSV([header, ...rows])` → `csvToSocialCalc` → `tocSave`, where each data
  row is `[\`/${subroom}\`, sheetTitle]` and `sheetTitle` is the **workbook sheet name**.
  Header row matches `packages/client-multi/src/Foldr.ts` and the export reader
  `fetchMultiSheetBundle` (row 0 = header, skipped; rows 1..N = `[/<subroom>, title]`).
- Empty / zero-sheet workbook → a TOC with no data rows (legacy `{'':''}` analogue);
  no sub-sheets.

**5.3 Route glue in `routes/rooms.ts` (`registerMultiSheetImport(app)` or inline loop).**
Handler per format:
1. read body bytes;
2. `const { tocSave, subSheets } = buildMultiSheetImport(bytes, base)`;
3. for each `subSheets[]`: `await doFetch(env, subroom, '/_do/snapshot', { method:'PUT', body: save })` — **sub-rooms first**;
4. then `await doFetch(env, base, '/_do/snapshot', { method:'PUT', body: tocSave })` — **TOC last** (the TOC never points at a missing sub-room);
5. `sizedResponse('OK', 201, TEXT_CT)`.
   Each `doFetch` status is checked; a non-2xx from any DO write → `500` (orphan
   sub-rooms are harmless — overwritten on the next import).

## 6. Cross-sheet formulas

EtherCalc resolves cross-sheet refs (`'Sheet2'!A1`) **by sheet title** at recalc time
via the existing `hydrateCrossSheetRefs` path that the export already relies on. Because
the TOC titles are set to the workbook sheet names, imported cross-sheet formulas resolve
without any ref rewriting. A focused round-trip test covers this; if the title→subroom
mapping needs a nudge, that is a bounded addition, not a redesign.

## 7. Error handling & limits

| Case | Behaviour |
| ---- | --------- |
| Oversized workbook | `ImportTooLargeError` (same as single-sheet path). |
| Empty / zero-sheet workbook | Empty TOC, no sub-rooms, `201 OK`. |
| Mid-fan-out DO write failure | `500`; partial sub-rooms harmless (idempotent on retry). |
| Non-workbook bytes on these routes | SheetJS read error → surfaced as a clean error, not a crash. |

## 8. Testing

**8.1 Node unit (100% coverage gate)** — `lib/multi-sheet-import.ts` + the
`worksheetToSave` extraction:
- multi-sheet xlsx → correct sub-room count, TOC rows, and titles;
- a formula on a **non-first** sheet is preserved as a live SocialCalc formula;
- whole-workbook cell-limit triggers `ImportTooLargeError`;
- single-sheet workbook (one sub-room + TOC);
- empty workbook;
- `.ods` and `.fods` inputs.

**8.2 Worker pool integration** —
- `PUT /=room.xlsx` → `201`; the named sub-rooms exist (`GET /_/room.1` etc.);
- `GET /_/=room/xlsx` re-export **round-trips** structurally (zip-canonical matcher);
- a cross-sheet formula recalculates after import.

**8.3 Oracle** — add a `multi-sheet-import` scenario to `packages/oracle-harness`;
recorded + replayed against the legacy Docker in the nightly `oracle-replay` job.

**8.4 Doc** — flip the dead `lib/xlsx-import.ts:124` comment to reference the now-real
route; tick the Phase-8 multi-sheet-import checkbox in the ultraplan once green.

## 9. Acceptance criteria

1. `PUT /=:room.{xlsx,ods,fods}` and `PUT /_/=:room/{xlsx,ods,fods}` return `201 OK`
   and create a TOC + one sub-room per worksheet.
2. Per-sheet formulas/merges/number-formats survive import (verified on a non-first sheet).
3. Import→export round-trips structurally for a multi-sheet workbook.
4. The CSV-per-sheet `parseMultiSheetWorkbook` (`lib/xlsx-build.ts`), superseded by the
   formula-preserving `worksheetToSave` path, is **removed** together with its now-orphaned
   tests — no dead multi-sheet parser remains. (If a residual consumer surfaces during
   implementation, it is rewired to `worksheetToSave` instead.)
5. 100% coverage holds on all gated packages; `wrangler deploy --dry-run` stays green.
6. The `multi-sheet-import` oracle scenario records + replays green in nightly.
7. Single-sheet `PUT /_/:room` import behaviour is unchanged (existing tests green).
