# `@ethercalc/worker` mutation survivors inventory

> Analysis only. No source, test, threshold, or `// Stryker disable` changes in this document's producing commit.

## Measurement provenance

Two independent measurements of the same package config are on record. They disagree
by **0.58 pp**. That gap is real and must not be collapsed into a single number.

### Which number gates the build

| Question | Answer |
| --- | --- |
| Config | `packages/worker/stryker.conf.json` |
| `thresholds.break` | **90** (integer floor) |
| Metric Stryker compares to `break` | **`metrics.mutationScore` (total)** — *not* `mutationScoreBasedOnCoveredCode` |
| Enforcement site | `@stryker-mutator/core` `mutation-test-report-helper.ts` `determineExitCode`: fails iff `mutationScore < thresholds.break` |
| CI job | `mutation-gate` in `.github/workflows/ci.yml` — runs `vp run --filter "./packages/$pkg" mutation` for each package with `packages/*/src/` changes vs `origin/main` |
| Local audit | `scripts/ratchet-verify.sh` — same `vp run … mutation`, then recomputes total score from `reports/mutation/mutation.json` statuses: `(Killed+Timeout) / (Killed+Timeout+Survived+NoCoverage) × 100` |
| Covered score | Display-only in the clear-text table (`total` vs `covered` columns). **Not** what `break` gates. |

So: **the gate enforces total score ≥ 90**. CI's 90.61 and the local ratchet's 90.03 are both total scores under that same formula; only CI's result is what `mutation-gate` saw for head `09673a4`.

### A. Local Gate-7 / ratchet measurement (scarier margin)

| Field | Value |
| --- | --- |
| Package | `@ethercalc/worker` |
| Report path | `packages/worker/reports/mutation/mutation.json` (+ `mutation.html`) |
| Report mtime | 2026-08-10 19:21:38 +0800 |
| How obtained | **Reused on-disk Stryker JSON** left by the Gate 7 / `scripts/ratchet-verify.sh` run. **Did not re-run** the full six-package ratchet (~14 min) or a worker-only Stryker pass for this inventory. |
| Matching tip (documented measurement) | `327fa3da24415ae0505f7b4e92f8564702d94537` (`327fa3d`), branch `feat/prod-upgrade-runbook`, 2026-08-10 |
| Mutate-scope vs later CI tip | `git diff --name-only 327fa3d..09673a4 -- packages/worker/src/{handlers,lib,room.ts,auth-do.ts}` is **empty** — same mutate surface; `robots.ts` already present at `327fa3d` |
| Score (from mutant statuses) | **90.03419638495359%** |
| Displayed score | 90.03% |
| `thresholds.break` floor | 90 |
| Margin | **+0.034196… pp** (~**+0.03 pp**) |
| Killed | 5488 |
| Timeout (counted detected) | 41 |
| Survived | **570** |
| NoCoverage | 42 |
| Ignored | 259 (excluded from score denominator) |
| RuntimeError | 5 (excluded from score denominator) |
| Score denominator (detected+undetected) | 5488+41+570+42 = **6141** |
| pp per mutant flipped survived→killed | 100/6141 ≈ **0.0163 pp** |
| Cross-check | Matches `docs/migration/PREFLIGHT_RESULTS.md` Gate 7 raw worker score `90.03419638495359%` and the local column of `docs/migration/PROD_UPGRADE_PLAN.md` §8. |

### B. CI `mutation-gate` measurement (what the PR gate enforced)

| Field | Value |
| --- | --- |
| Package | `@ethercalc/worker` (only package selected: `Changed packages: worker`) |
| CI run | [`31390939451`](https://github.com/audreyt/ethercalc/actions/runs/31390939451) · job `93462677720` |
| Head | `09673a45abc3e0aafcd691ef874fc7f3e37e4285` (`09673a4`) |
| When | 2026-08-10 · job wall **20m36s** (`started_at` 13:04:56Z → `completed_at` 13:25:32Z) |
| Conclusion | **success** (exit 0 under `break: 90`) |
| Score **total** (gated) | **90.61%** |
| Score **covered** (display only) | 91.24% |
| Killed | 5523 |
| Timeout | 46 |
| Survived | **535** |
| NoCoverage | 42 |
| Errors (clear-text `# errors` column) | 0 |
| Score denominator | 5523+46+535+42 = **6146** |
| Margin above `break: 90` | **+0.61 pp** |
| Avg tests per mutant | 7.59 |
| Config invoked | same `packages/worker/stryker.conf.json` via `vp exec stryker run` (mutate globs, `inPlace`, `coverageAnalysis: perTest`, `concurrency: 4`, `timeoutMS: 120000`, `break: 90`) |
| `socialcalc-308` alias | Present on this head as a **devDependency of `@ethercalc/socialcalc-headless` only**. Worker mutation does not load that package; it is **not** a cause of the score gap. |

### Why local 90.03 and CI 90.61 disagree

| Delta (CI − local) | Value |
| --- | ---: |
| Killed | **+35** |
| Timeout | **+5** |
| Survived | **−35** |
| NoCoverage | 0 |
| Denominator | **+5** (6146 vs 6141) |
| Total score | **+0.58 pp** |

**Cause (verified, not assumed):**

1. **Same harness, same formula.** Local `ratchet-verify.sh` and CI `mutation-gate` both run package `mutation` → Stryker with this `stryker.conf.json`. Both gate/compare **total** `mutationScore` = `(Killed+Timeout)/(Killed+Timeout+Survived+NoCoverage)`. Covered score is not the gate.
2. **Same mutate file set between the two tips.** No mutate-scope path differs from `327fa3d` to `09673a4`. Selection logic is not inventing extra packages; only `worker` ran in CI.
3. **Run-to-run status noise, dominated by Timeout ↔ Killed/Survived flapping.** Stryker's `Timeout` is wall-clock-sensitive (machine load, scheduling). The package's own `docs/MUTATION_REPORT.md` already records this: a single mutant flipping Timeout/Killed/Survived moves aggregate score by ~1/N. Here ~35 mutants flipped out of Survived into Killed and +5 into Timeout, with a +5 valid-mutant denominator drift (likely ignored/runtime-error boundary or non-deterministic mutant generation under `inPlace` + load — CI reported 0 errors; local JSON had 5 `RuntimeError` excluded from the score).
4. **Not a different threshold, not covered-vs-total confusion, not the reverse-compat alias.** CI clear-text printed both 90.61 total and 91.24 covered; exit used total (90.61 ≥ 90).

**Operational reading:** the two harnesses measure the **same contract**, but they are **not a faithful score-predictor of each other to 0.01 pp**. Local 90.03 is a real, scarier sample; CI 90.61 is the sample that cleared `mutation-gate` on this PR. Treat local ratchet as a **regression smoke** (will it clear 90?) and CI as the **enforced** number — do not cite only the scarier local margin as "what CI thinks."

### Survivor inventory below

The per-mutant REAL GAP / EQUIVALENT tables that follow were classified against **measurement A** (local JSON, **570** survivors at tip `327fa3d`). They are **not** re-derived from the CI run (no CI `mutation.json` artifact was retained beyond the clear-text summary). Counts of 570 / 552 / 18 refer to that local sample.

Stryker config: `packages/worker/stryker.conf.json` (`jsonReporter.fileName`: `reports/mutation/mutation.json`).

## Bucket summary

| Bucket | Count | Share of 570 survivors |
| --- | ---: | ---: |
| **REAL GAP** | 552 | 96.8% |
| **EQUIVALENT** | 18 | 3.2% |
| **UNCERTAIN** | 0 | 0.0% |
| **Total** | 570 | 100% |

Classification rules (conservative):

- **EQUIVALENT** — mutation cannot change observable behavior (redundant conjunct, empty cleanup admission, void-only block, CryptoKey `extractable` with no export, always-true defensive guard documented in source, max-find `>`/`>=` when equal is a no-op, exhaustiveness `default` that only breaks).
- **REAL GAP** — mutation changes observable behavior (limits, authz, protocol tokens, wire bodies/reasons, arithmetic, regex anchors, method guards, etc.) and no test kills it.
- **UNCERTAIN** — reserved when evidence is insufficient; **none remained** after source-context review.

Per-file bucket counts:

| File | Survivors | REAL GAP | EQUIVALENT |
| --- | ---: | ---: | ---: |
| `src/room.ts` | 236 | 231 | 5 |
| `src/lib/command-limits.ts` | 106 | 104 | 2 |
| `src/lib/xlsx-import.ts` | 50 | 48 | 2 |
| `src/lib/snapshot-storage.ts` | 33 | 33 | 0 |
| `src/auth-do.ts` | 31 | 26 | 5 |
| `src/lib/xlsx-build.ts` | 21 | 21 | 0 |
| `src/lib/room-create-limit.ts` | 11 | 11 | 0 |
| `src/lib/ws-upgrade.ts` | 9 | 9 | 0 |
| `src/handlers/rooms.ts` | 7 | 7 | 0 |
| `src/lib/csv-parse.ts` | 7 | 7 | 0 |
| `src/lib/rate-limit.ts` | 7 | 6 | 1 |
| `src/lib/cron.ts` | 6 | 6 | 0 |
| `src/handlers/post-command.ts` | 4 | 4 | 0 |
| `src/lib/cross-sheet.ts` | 4 | 4 | 0 |
| `src/lib/room-name.ts` | 4 | 4 | 0 |
| `src/lib/auth.ts` | 3 | 2 | 1 |
| `src/lib/csp.ts` | 3 | 3 | 0 |
| `src/lib/storage-batch.ts` | 3 | 3 | 0 |
| `src/handlers/migrate.ts` | 2 | 2 | 0 |
| `src/handlers/room-entry.ts` | 2 | 2 | 0 |
| `src/lib/auth-session.ts` | 2 | 2 | 0 |
| `src/lib/authorize.ts` | 2 | 2 | 0 |
| `src/lib/pitr.ts` | 2 | 2 | 0 |
| `src/lib/seq-store.ts` | 2 | 1 | 1 |
| `src/lib/session.ts` | 2 | 2 | 0 |
| `src/lib/ws-handlers.ts` | 2 | 1 | 1 |
| `src/lib/csv-encode.ts` | 1 | 1 | 0 |
| `src/lib/csv.ts` | 1 | 1 | 0 |
| `src/lib/do-dispatch.ts` | 1 | 1 | 0 |
| `src/lib/email.ts` | 1 | 1 | 0 |
| `src/lib/loadclipboard.ts` | 1 | 1 | 0 |
| `src/lib/migrate-auth.ts` | 1 | 1 | 0 |
| `src/lib/multi-sheet-import.ts` | 1 | 1 | 0 |
| `src/lib/sandstorm-access.ts` | 1 | 1 | 0 |
| `src/lib/ws-dispatch.ts` | 1 | 1 | 0 |

## What this means for the +0.03 pp margin

**The +0.03 pp margin is recoverable, not irreducible.**

- Only **18** survivors are judged **EQUIVALENT**. Ignoring all 18 (via justified `// Stryker disable`, not padded tests) removes them from the denominator and lifts the score by roughly **0.265 pp** → ~**90.30%** — helpful headroom, but **not** the bulk of the risk.
- **552 REAL GAP** survivors dominate. Each kill returns ≈**0.0163 pp**. Closing just **2** REAL GAPs recovers ~**0.033 pp**, enough to double the current margin; closing **10** recovers ~**0.16 pp**; closing **50** recovers ~**0.81 pp** (score ~**90.85%**).
- Highest-leverage clusters (many REAL GAPs, security/limit surface):
  - `src/room.ts` — DO fetch method guards, WS frame/rate limits, session attachment parsing, snapshot/chunk bounds, authz helpers (231 REAL GAP).
  - `src/lib/command-limits.ts` — range regex anchors, geometry arithmetic, verb switch labels, paste/moveinsert expansion (104 REAL GAP).
  - `src/lib/xlsx-import.ts` / `xlsx-build.ts` — ZIP/OOXML bounds and SheetJS options.
  - `src/auth-do.ts` — session cleanup boundaries, base64/MAC helpers, body validation (minus the few equivalents).
- **Do not** treat wire-visible strings (`OK` bodies, `ws.close` reasons, error text) as equivalent solely because tests currently ignore them: they are REAL GAPs under the “observable behavior” bar, even if low severity.
- Remedy choice (tests vs `// Stryker disable` vs leaving the thin margin) is the owner’s; this inventory is evidence only.

## Full survivor table

Every row is taken from `packages/worker/reports/mutation/mutation.json` with status `Survived`. Original code is sliced from the report’s embedded source using Stryker’s 1-based line / 1-based column (end exclusive) locations.

**No cell truncation:** Original and Mutated columns contain the full mutant text (newlines shown as `⏎`).

| # | Bucket | File | Line | Mutator | Original | Mutated | Reason | Mutant id |
| ---: | --- | --- | ---: | --- | --- | --- | --- | --- |
| 1 | REAL_GAP | `src/auth-do.ts` | 125 | `ConditionalExpression` | `value !== null` | `true` | nullish guard forced true | `27` |
| 2 | REAL_GAP | `src/auth-do.ts` | 141 | `StringLiteral` | `'-'` | `""` | significant character literal '-' emptied — encode/parse changes | `39` |
| 3 | REAL_GAP | `src/auth-do.ts` | 141 | `StringLiteral` | `'_'` | `""` | significant character literal '_' emptied — encode/parse changes | `40` |
| 4 | REAL_GAP | `src/auth-do.ts` | 141 | `Regex` | `/=+$/` | `/=+/` | regex altered: /=+$/ → /=+/ | `41` |
| 5 | REAL_GAP | `src/auth-do.ts` | 168 | `EqualityOperator` | `i < a.length` | `i <= a.length` | loop/index bound < → <=  | `69` |
| 6 | REAL_GAP | `src/auth-do.ts` | 185 | `ConditionalExpression` | `dot < 1` | `false` | condition→false disables branch: 'dot < 1' | `81` |
| 7 | REAL_GAP | `src/auth-do.ts` | 185 | `EqualityOperator` | `dot < 1` | `dot <= 1` | boundary/relational dot < 1 → dot <= 1 | `82` |
| 8 | REAL_GAP | `src/auth-do.ts` | 191 | `StringLiteral` | `'+'` | `""` | significant character literal '+' emptied — encode/parse changes | `88` |
| 9 | REAL_GAP | `src/auth-do.ts` | 191 | `StringLiteral` | `'/'` | `""` | significant character literal '/' emptied — encode/parse changes | `89` |
| 10 | REAL_GAP | `src/auth-do.ts` | 193 | `EqualityOperator` | `i < bin.length` | `i <= bin.length` | loop/index bound < → <=  | `91` |
| 11 | REAL_GAP | `src/auth-do.ts` | 194 | `BlockStatement` | `{ ⏎     return null; ⏎   }` | `{}` | removed return/reject — fallthrough | `94` |
| 12 | REAL_GAP | `src/auth-do.ts` | 202 | `BlockStatement` | `{ ⏎     return null; ⏎   }` | `{}` | removed return/reject — fallthrough | `99` |
| 13 | REAL_GAP | `src/auth-do.ts` | 256 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `166` |
| 14 | REAL_GAP | `src/auth-do.ts` | 259 | `StringLiteral` | `'unknown'` | `""` | wire-visible message/reason "'unknown'" emptied — clients can observe body/close reason | `172` |
| 15 | REAL_GAP | `src/auth-do.ts` | 332 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `264` |
| 16 | REAL_GAP | `src/auth-do.ts` | 335 | `EqualityOperator` | `value.exp <= now` | `value.exp < now` | boundary/relational value.exp <= now → value.exp < now | `271` |
| 17 | REAL_GAP | `src/auth-do.ts` | 337 | `ConditionalExpression` | `existingKey !== key` | `true` | guard/discriminant forced true: 'existingKey !== key' | `274` |
| 18 | REAL_GAP | `src/auth-do.ts` | 384 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `318` |
| 19 | REAL_GAP | `src/auth-do.ts` | 389 | `EqualityOperator` | `val.exp <= now` | `val.exp < now` | boundary/relational val.exp <= now → val.exp < now | `333` |
| 20 | REAL_GAP | `src/auth-do.ts` | 435 | `ConditionalExpression` | `body === null` | `false` | condition→false disables branch: 'body === null' | `375` |
| 21 | REAL_GAP | `src/auth-do.ts` | 502 | `ConditionalExpression` | `body === null \|\| ⏎       !isJsonObject(body.response) \|\| ⏎       typeof body.response.id !== 'string'` | `false` | condition→false disables branch: 'body === null \|\|\\n      !isJsonObject(body.response) \|\|\\n      typeof bo' | `433` |
| 22 | REAL_GAP | `src/auth-do.ts` | 502 | `ConditionalExpression` | `body === null` | `false` | condition→false disables branch: 'body === null' | `437` |
| 23 | REAL_GAP | `src/auth-do.ts` | 504 | `ConditionalExpression` | `typeof body.response.id !== 'string'` | `false` | condition→false disables branch: "typeof body.response.id !== 'string'" | `440` |
| 24 | REAL_GAP | `src/auth-do.ts` | 582 | `ConditionalExpression` | `body === null` | `false` | condition→false disables branch: 'body === null' | `512` |
| 25 | REAL_GAP | `src/auth-do.ts` | 600 | `ArithmeticOperator` | `now + SESSION_TTL_MS` | `now - SESSION_TTL_MS` | arithmetic now + SESSION_TTL_MS → now - SESSION_TTL_MS | `534` |
| 26 | REAL_GAP | `src/auth-do.ts` | 628 | `StringLiteral` | `'Invalid session'` | `""` | wire-visible message/reason "'Invalid session'" emptied — clients can observe body/close reason | `569` |
| 27 | REAL_GAP | `src/handlers/migrate.ts` | 79 | `ConditionalExpression` | `typeof rawTs === 'number'` | `true` | validation guard forced true | `656` |
| 28 | REAL_GAP | `src/handlers/migrate.ts` | 145 | `ConditionalExpression` | `typeof updatedAt !== 'number'` | `false` | condition→false disables branch: "typeof updatedAt !== 'number'" | `738` |
| 29 | REAL_GAP | `src/handlers/post-command.ts` | 71 | `MethodExpression` | `contentType.split(';')[0]!.trim()` | `contentType.split(';')[0]!` | trim removed | `827` |
| 30 | REAL_GAP | `src/handlers/post-command.ts` | 80 | `ConditionalExpression` | `parsed && typeof parsed === 'object'` | `true` | validation guard forced true | `840` |
| 31 | REAL_GAP | `src/handlers/post-command.ts` | 80 | `LogicalOperator` | `parsed && typeof parsed === 'object'` | `parsed \|\| typeof parsed === 'object'` | logical operator change alters short-circuit accept set: "parsed && typeof parsed === 'object'" → "parsed \|\| typeof parsed === 'object'" | `842` |
| 32 | REAL_GAP | `src/handlers/post-command.ts` | 80 | `ConditionalExpression` | `typeof parsed === 'object'` | `true` | validation guard forced true | `843` |
| 33 | REAL_GAP | `src/handlers/room-entry.ts` | 179 | `StringLiteral` | `'has not landed. Once DO-to-DO fetches are wired, this endpoint '` | `""` | string literal emptied: "'has not landed. Once DO-to-DO fetches are wired, this endpoint '" | `939` |
| 34 | REAL_GAP | `src/handlers/room-entry.ts` | 200 | `StringLiteral` | `'text/plain; charset=UTF-8'` | `""` | protocol/discriminant/default token 'text/plain; charset=UTF-8' emptied | `949` |
| 35 | REAL_GAP | `src/handlers/rooms.ts` | 33 | `StringLiteral` | `'application/vnd.oasis.opendocument.spreadsheet'` | `""` | protocol/discriminant/default token 'application/vnd.oasis.opendocument.spreadsheet' emptied | `994` |
| 36 | REAL_GAP | `src/handlers/rooms.ts` | 47 | `MethodExpression` | `contentType.split(';')[0]!.trim()` | `contentType.split(';')[0]!` | trim removed | `997` |
| 37 | REAL_GAP | `src/handlers/rooms.ts` | 57 | `ConditionalExpression` | `parsed && ⏎         typeof parsed === 'object' && ⏎         'snapshot' in (parsed as Record<string, unknown>)` | `true` | validation guard forced true | `1019` |
| 38 | REAL_GAP | `src/handlers/rooms.ts` | 57 | `ConditionalExpression` | `parsed && ⏎         typeof parsed === 'object'` | `true` | validation guard forced true | `1021` |
| 39 | REAL_GAP | `src/handlers/rooms.ts` | 57 | `LogicalOperator` | `parsed && ⏎         typeof parsed === 'object' && ⏎         'snapshot' in (parsed as Record<string, unknown>)` | `parsed && typeof parsed === 'object' \|\| 'snapshot' in (parsed as Record<string, unknown>)` | logical operator change alters short-circuit accept set: "parsed &&\\n        typeof parsed === 'object' &&\\n  " → "parsed && typeof parsed === 'object' \|\| 'snapshot'" | `1020` |
| 40 | REAL_GAP | `src/handlers/rooms.ts` | 57 | `LogicalOperator` | `parsed && ⏎         typeof parsed === 'object'` | `parsed \|\| typeof parsed === 'object'` | logical operator change alters short-circuit accept set: "parsed &&\\n        typeof parsed === 'object'" → "parsed \|\| typeof parsed === 'object'" | `1022` |
| 41 | REAL_GAP | `src/handlers/rooms.ts` | 58 | `ConditionalExpression` | `typeof parsed === 'object'` | `true` | validation guard forced true | `1023` |
| 42 | REAL_GAP | `src/lib/auth-session.ts` | 32 | `LogicalOperator` | `body === null \|\| ⏎       // Stryker disable next-line ConditionalExpression ⏎       typeof body !== 'object' \|\| ⏎       !('uid' in body)` | `(body === null \|\| ⏎ // Stryker disable next-line ConditionalExpression ⏎ typeof body !== 'object') && !('uid' in body)` | logical operator change alters short-circuit accept set: 'body === null \|\|\\n      // Stryker disable next-lin' → '(body === null \|\|\\n// Stryker disable next-line Con' | `1089` |
| 43 | REAL_GAP | `src/lib/auth-session.ts` | 32 | `LogicalOperator` | `body === null \|\| ⏎       // Stryker disable next-line ConditionalExpression ⏎       typeof body !== 'object'` | `body === null && ⏎ // Stryker disable next-line ConditionalExpression ⏎ typeof body !== 'object'` | logical operator change alters short-circuit accept set: 'body === null \|\|\\n      // Stryker disable next-lin' → 'body === null &&\\n// Stryker disable next-line Cond' | `1091` |
| 44 | REAL_GAP | `src/lib/auth.ts` | 83 | `ConditionalExpression` | `a.length !== b.length` | `false` | condition→false disables branch: 'a.length !== b.length' | `1138` |
| 45 | REAL_GAP | `src/lib/auth.ts` | 85 | `EqualityOperator` | `i < a.length` | `i <= a.length` | loop/index bound < → <=  | `1142` |
| 46 | REAL_GAP | `src/lib/authorize.ts` | 25 | `ConditionalExpression` | `principal.uid.length === 0` | `false` | condition→false disables branch: 'principal.uid.length === 0' | `1189` |
| 47 | REAL_GAP | `src/lib/authorize.ts` | 33 | `ConditionalExpression` | `typeof acl.owner !== 'string'` | `false` | condition→false disables branch: "typeof acl.owner !== 'string'" | `1221` |
| 48 | REAL_GAP | `src/lib/command-limits.ts` | 40 | `ObjectLiteral` | `{ ⏎   work: 0, ⏎   startRow: 0, ⏎   startColumn: 0, ⏎   endRow: 0, ⏎   endColumn: 0, ⏎ }` | `{}` | target/dimension object stripped — work/geometry fields become undefined | `1276` |
| 49 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `ConditionalExpression` | `Number.isSafeInteger(value) && value !== undefined && value >= 1` | `true` | validation guard forced true | `1304` |
| 50 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `ConditionalExpression` | `Number.isSafeInteger(value) && value !== undefined` | `true` | validation guard forced true | `1306` |
| 51 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `LogicalOperator` | `Number.isSafeInteger(value) && value !== undefined && value >= 1` | `Number.isSafeInteger(value) && value !== undefined \|\| value >= 1` | logical operator change alters short-circuit accept set: 'Number.isSafeInteger(value) && value !== undefined' → 'Number.isSafeInteger(value) && value !== undefined' | `1305` |
| 52 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `LogicalOperator` | `Number.isSafeInteger(value) && value !== undefined` | `Number.isSafeInteger(value) \|\| value !== undefined` | logical operator change alters short-circuit accept set: 'Number.isSafeInteger(value) && value !== undefined' → 'Number.isSafeInteger(value) \|\| value !== undefined' | `1307` |
| 53 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `ConditionalExpression` | `value >= 1` | `true` | condition→true: 'value >= 1' | `1310` |
| 54 | REAL_GAP | `src/lib/command-limits.ts` | 67 | `EqualityOperator` | `value >= 1` | `value > 1` | range boundary value >= 1→value > 1 | `1311` |
| 55 | REAL_GAP | `src/lib/command-limits.ts` | 76 | `Regex` | `/^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i` | `/([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i` | regex altered: /^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i → /([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i | `1319` |
| 56 | REAL_GAP | `src/lib/command-limits.ts` | 76 | `Regex` | `/^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i` | `/^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?/i` | regex altered: /^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i → /^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?/i | `1320` |
| 57 | REAL_GAP | `src/lib/command-limits.ts` | 76 | `Regex` | `/^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i` | `/^([a-z])([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i` | regex altered: /^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i → /^([a-z])([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i | `1321` |
| 58 | REAL_GAP | `src/lib/command-limits.ts` | 86 | `ConditionalExpression` | `startRow > MAX_SOCIALCALC_ROW` | `false` | condition→false disables branch: 'startRow > MAX_SOCIALCALC_ROW' | `1354` |
| 59 | REAL_GAP | `src/lib/command-limits.ts` | 89 | `ConditionalExpression` | `endRow > MAX_SOCIALCALC_ROW` | `false` | condition→false disables branch: 'endRow > MAX_SOCIALCALC_ROW' | `1361` |
| 60 | REAL_GAP | `src/lib/command-limits.ts` | 104 | `Regex` | `/^([0-9]+)(?::([0-9]+))?$/` | `/([0-9]+)(?::([0-9]+))?$/` | regex altered: /^([0-9]+)(?::([0-9]+))?$/ → /([0-9]+)(?::([0-9]+))?$/ | `1371` |
| 61 | REAL_GAP | `src/lib/command-limits.ts` | 104 | `Regex` | `/^([0-9]+)(?::([0-9]+))?$/` | `/^([0-9]+)(?::([0-9]+))?/` | regex altered: /^([0-9]+)(?::([0-9]+))?$/ → /^([0-9]+)(?::([0-9]+))?/ | `1372` |
| 62 | REAL_GAP | `src/lib/command-limits.ts` | 104 | `Regex` | `/^([0-9]+)(?::([0-9]+))?$/` | `/^([0-9])(?::([0-9]+))?$/` | regex altered: /^([0-9]+)(?::([0-9]+))?$/ → /^([0-9])(?::([0-9]+))?$/ | `1373` |
| 63 | REAL_GAP | `src/lib/command-limits.ts` | 104 | `Regex` | `/^([0-9]+)(?::([0-9]+))?$/` | `/^([0-9]+)(?::([0-9]+))$/` | regex altered: /^([0-9]+)(?::([0-9]+))?$/ → /^([0-9]+)(?::([0-9]+))$/ | `1375` |
| 64 | REAL_GAP | `src/lib/command-limits.ts` | 111 | `ConditionalExpression` | `startRow > MAX_SOCIALCALC_ROW` | `false` | condition→false disables branch: 'startRow > MAX_SOCIALCALC_ROW' | `1399` |
| 65 | REAL_GAP | `src/lib/command-limits.ts` | 111 | `EqualityOperator` | `startRow > MAX_SOCIALCALC_ROW` | `startRow >= MAX_SOCIALCALC_ROW` | boundary/relational startRow > MAX_SOCIALCALC_ROW → startRow >= MAX_SOCIALCALC_ROW | `1400` |
| 66 | REAL_GAP | `src/lib/command-limits.ts` | 113 | `ConditionalExpression` | `endRow < 1` | `false` | condition→false disables branch: 'endRow < 1' | `1403` |
| 67 | REAL_GAP | `src/lib/command-limits.ts` | 113 | `EqualityOperator` | `endRow < 1` | `endRow <= 1` | boundary/relational endRow < 1 → endRow <= 1 | `1404` |
| 68 | REAL_GAP | `src/lib/command-limits.ts` | 114 | `ConditionalExpression` | `endRow > MAX_SOCIALCALC_ROW` | `false` | condition→false disables branch: 'endRow > MAX_SOCIALCALC_ROW' | `1406` |
| 69 | REAL_GAP | `src/lib/command-limits.ts` | 114 | `EqualityOperator` | `endRow > MAX_SOCIALCALC_ROW` | `endRow >= MAX_SOCIALCALC_ROW` | boundary/relational endRow > MAX_SOCIALCALC_ROW → endRow >= MAX_SOCIALCALC_ROW | `1407` |
| 70 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /([a-z]{1,2})(?::([a-z]{1,2}))?$/i | `1413` |
| 71 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([a-z]{1,2})(?::([a-z]{1,2}))?/i | `1414` |
| 72 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([a-z])(?::([a-z]{1,2}))?$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([a-z])(?::([a-z]{1,2}))?$/i | `1415` |
| 73 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([^a-z]{1,2})(?::([a-z]{1,2}))?$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([^a-z]{1,2})(?::([a-z]{1,2}))?$/i | `1416` |
| 74 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([a-z]{1,2})(?::([a-z]{1,2}))$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([a-z]{1,2})(?::([a-z]{1,2}))$/i | `1417` |
| 75 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([a-z]{1,2})(?::([a-z]))?$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([a-z]{1,2})(?::([a-z]))?$/i | `1418` |
| 76 | REAL_GAP | `src/lib/command-limits.ts` | 127 | `Regex` | `/^([a-z]{1,2})(?::([a-z]{1,2}))?$/i` | `/^([a-z]{1,2})(?::([^a-z]{1,2}))?$/i` | regex altered: /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i → /^([a-z]{1,2})(?::([^a-z]{1,2}))?$/i | `1419` |
| 77 | REAL_GAP | `src/lib/command-limits.ts` | 128 | `ConditionalExpression` | `columns` | `false` | condition→false disables branch: 'columns' | `1421` |
| 78 | REAL_GAP | `src/lib/command-limits.ts` | 128 | `BlockStatement` | `{ ⏎     const startColumn = columnNumber(columns[1]!); ⏎     const endColumn = ⏎       columns[2] === undefined ? startColumn : columnNumber(columns[2]); ⏎     return { ⏎       work: Math.abs(endColumn - startColumn) + 1, ⏎       startRow: 1, ⏎       startColumn, ⏎       endRow: 1, ⏎       endColumn, ⏎     }; ⏎   }` | `{}` | removed return/reject — fallthrough | `1422` |
| 79 | REAL_GAP | `src/lib/command-limits.ts` | 131 | `ConditionalExpression` | `columns[2] === undefined` | `true` | nullish guard forced true | `1423` |
| 80 | REAL_GAP | `src/lib/command-limits.ts` | 132 | `ObjectLiteral` | `{ ⏎       work: Math.abs(endColumn - startColumn) + 1, ⏎       startRow: 1, ⏎       startColumn, ⏎       endRow: 1, ⏎       endColumn, ⏎     }` | `{}` | target/dimension object stripped — work/geometry fields become undefined | `1426` |
| 81 | REAL_GAP | `src/lib/command-limits.ts` | 133 | `ArithmeticOperator` | `Math.abs(endColumn - startColumn) + 1` | `Math.abs(endColumn - startColumn) - 1` | arithmetic Math.abs(endColumn - startColumn) + 1 → Math.abs(endColumn - startColumn) - 1 | `1427` |
| 82 | REAL_GAP | `src/lib/command-limits.ts` | 133 | `ArithmeticOperator` | `endColumn - startColumn` | `endColumn + startColumn` | arithmetic endColumn - startColumn → endColumn + startColumn | `1428` |
| 83 | REAL_GAP | `src/lib/command-limits.ts` | 147 | `ArithmeticOperator` | `dimensions.rows * dimensions.columns` | `dimensions.rows / dimensions.columns` | arithmetic dimensions.rows * dimensions.columns → dimensions.rows / dimensions.columns | `1430` |
| 84 | REAL_GAP | `src/lib/command-limits.ts` | 168 | `ConditionalExpression` | `target.endRow === 0 \|\| target.endColumn === 0` | `false` | condition→false disables branch: 'target.endRow === 0 \|\| target.endColumn === 0' | `1446` |
| 85 | REAL_GAP | `src/lib/command-limits.ts` | 168 | `ConditionalExpression` | `target.endRow === 0` | `false` | condition→false disables branch: 'target.endRow === 0' | `1448` |
| 86 | REAL_GAP | `src/lib/command-limits.ts` | 168 | `LogicalOperator` | `target.endRow === 0 \|\| target.endColumn === 0` | `target.endRow === 0 && target.endColumn === 0` | logical operator change alters short-circuit accept set: 'target.endRow === 0 \|\| target.endColumn === 0' → 'target.endRow === 0 && target.endColumn === 0' | `1447` |
| 87 | REAL_GAP | `src/lib/command-limits.ts` | 168 | `ConditionalExpression` | `target.endColumn === 0` | `false` | condition→false disables branch: 'target.endColumn === 0' | `1450` |
| 88 | REAL_GAP | `src/lib/command-limits.ts` | 187 | `Regex` | `/copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi` | `/copiedfrom(?::\|\\\\c)([a-z][0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi` | regex altered: /copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi → /copiedfrom(?::\|\\\\c)([a-z][0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi | `1465` |
| 89 | REAL_GAP | `src/lib/command-limits.ts` | 187 | `Regex` | `/copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi` | `/copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9])(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi` | regex altered: /copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9]+)(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi → /copiedfrom(?::\|\\\\c)([a-z]{1,2}[0-9])(?::\|\\\\c)([a-z]{1,2}[0-9]+)/gi | `1467` |
| 90 | REAL_GAP | `src/lib/command-limits.ts` | 192 | `ConditionalExpression` | `parsed === null \|\| parsed.work > MAX_SHEET_CELLS` | `false` | condition→false disables branch: 'parsed === null \|\| parsed.work > MAX_SHEET_CELLS' | `1476` |
| 91 | REAL_GAP | `src/lib/command-limits.ts` | 192 | `ConditionalExpression` | `parsed === null` | `false` | condition→false disables branch: 'parsed === null' | `1478` |
| 92 | REAL_GAP | `src/lib/command-limits.ts` | 192 | `LogicalOperator` | `parsed === null \|\| parsed.work > MAX_SHEET_CELLS` | `parsed === null && parsed.work > MAX_SHEET_CELLS` | logical operator change alters short-circuit accept set: 'parsed === null \|\| parsed.work > MAX_SHEET_CELLS' → 'parsed === null && parsed.work > MAX_SHEET_CELLS' | `1477` |
| 93 | REAL_GAP | `src/lib/command-limits.ts` | 192 | `ConditionalExpression` | `parsed.work > MAX_SHEET_CELLS` | `false` | condition→false disables branch: 'parsed.work > MAX_SHEET_CELLS' | `1480` |
| 94 | REAL_GAP | `src/lib/command-limits.ts` | 192 | `EqualityOperator` | `parsed.work > MAX_SHEET_CELLS` | `parsed.work >= MAX_SHEET_CELLS` | boundary/relational parsed.work > MAX_SHEET_CELLS → parsed.work >= MAX_SHEET_CELLS | `1481` |
| 95 | REAL_GAP | `src/lib/command-limits.ts` | 199 | `EqualityOperator` | `declaredArea(dimensions) <= MAX_SHEET_CELLS` | `declaredArea(dimensions) < MAX_SHEET_CELLS` | boundary/relational declaredArea(dimensions) <= MAX_SHEET_CELLS → declaredArea(dimensions) < MAX_SHEET_CELLS | `1487` |
| 96 | REAL_GAP | `src/lib/command-limits.ts` | 219 | `Regex` | `/\\r\\n?\|\\n/` | `/\\r\\n\|\\n/` | regex altered: /\\r\\n?\|\\n/ → /\\r\\n\|\\n/ | `1494` |
| 97 | REAL_GAP | `src/lib/command-limits.ts` | 220 | `MethodExpression` | `line.trim()` | `line` | trim removed | `1496` |
| 98 | REAL_GAP | `src/lib/command-limits.ts` | 220 | `Regex` | `/\\s+/` | `/\\s/` | regex altered: /\\s+/ → /\\s/ | `1497` |
| 99 | REAL_GAP | `src/lib/command-limits.ts` | 224 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `1500` |
| 100 | REAL_GAP | `src/lib/command-limits.ts` | 225 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `1502` |
| 101 | REAL_GAP | `src/lib/command-limits.ts` | 226 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `1504` |
| 102 | REAL_GAP | `src/lib/command-limits.ts` | 254 | `ConditionalExpression` | `dimension === 'usermaxrow'` | `true` | guard/discriminant forced true: "dimension === 'usermaxrow'" | `1549` |
| 103 | REAL_GAP | `src/lib/command-limits.ts` | 270 | `Regex` | `/^[a-z]{1,2}[0-9]/i` | `/[a-z]{1,2}[0-9]/i` | regex altered: /^[a-z]{1,2}[0-9]/i → /[a-z]{1,2}[0-9]/i | `1574` |
| 104 | REAL_GAP | `src/lib/command-limits.ts` | 270 | `Regex` | `/^[a-z]{1,2}[0-9]/i` | `/^[a-z][0-9]/i` | regex altered: /^[a-z]{1,2}[0-9]/i → /^[a-z][0-9]/i | `1575` |
| 105 | REAL_GAP | `src/lib/command-limits.ts` | 270 | `StringLiteral` | `'$'` | `""` | significant character literal '$' emptied — encode/parse changes | `1578` |
| 106 | REAL_GAP | `src/lib/command-limits.ts` | 270 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `1579` |
| 107 | REAL_GAP | `src/lib/command-limits.ts` | 284 | `ConditionalExpression` | `clipboard === null` | `false` | condition→false disables branch: 'clipboard === null' | `1596` |
| 108 | REAL_GAP | `src/lib/command-limits.ts` | 290 | `ConditionalExpression` | `destination === null` | `false` | condition→false disables branch: 'destination === null' | `1605` |
| 109 | REAL_GAP | `src/lib/command-limits.ts` | 291 | `ConditionalExpression` | `!chargeTarget(clipboard, counter)` | `false` | condition→false disables branch: '!chargeTarget(clipboard, counter)' | `1612` |
| 110 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `ConditionalExpression` | `destination.startRow > 0 && clipboard.endRow > 0` | `true` | guard/discriminant forced true: 'destination.startRow > 0 && clipboard.endRow > 0' | `1614` |
| 111 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `ConditionalExpression` | `destination.startRow > 0` | `true` | guard/discriminant forced true: 'destination.startRow > 0' | `1617` |
| 112 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `EqualityOperator` | `destination.startRow > 0` | `destination.startRow >= 0` | boundary/relational destination.startRow > 0 → destination.startRow >= 0 | `1618` |
| 113 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `LogicalOperator` | `destination.startRow > 0 && clipboard.endRow > 0` | `destination.startRow > 0 \|\| clipboard.endRow > 0` | logical operator change alters short-circuit accept set: 'destination.startRow > 0 && clipboard.endRow > 0' → 'destination.startRow > 0 \|\| clipboard.endRow > 0' | `1616` |
| 114 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `ConditionalExpression` | `clipboard.endRow > 0` | `true` | guard/discriminant forced true: 'clipboard.endRow > 0' | `1620` |
| 115 | REAL_GAP | `src/lib/command-limits.ts` | 292 | `EqualityOperator` | `clipboard.endRow > 0` | `clipboard.endRow >= 0` | boundary/relational clipboard.endRow > 0 → clipboard.endRow >= 0 | `1621` |
| 116 | REAL_GAP | `src/lib/command-limits.ts` | 295 | `ArithmeticOperator` | `Math.abs(clipboard.endColumn - clipboard.startColumn) + 1` | `Math.abs(clipboard.endColumn - clipboard.startColumn) - 1` | arithmetic Math.abs(clipboard.endColumn - clipboard.startColumn) + 1 → Math.abs(clipboard.endColumn - clipboard.startColumn) - 1 | `1626` |
| 117 | REAL_GAP | `src/lib/command-limits.ts` | 300 | `MethodExpression` | `Math.max( ⏎                 dimensions.columns, ⏎                 destination.startColumn + columns - 1, ⏎               )` | `Math.min(dimensions.columns, destination.startColumn + columns - 1)` | max→min | `1634` |
| 118 | REAL_GAP | `src/lib/command-limits.ts` | 302 | `ArithmeticOperator` | `destination.startColumn + columns` | `destination.startColumn - columns` | arithmetic destination.startColumn + columns → destination.startColumn - columns | `1636` |
| 119 | REAL_GAP | `src/lib/command-limits.ts` | 313 | `ConditionalExpression` | `!boundedStructuralSheet(dimensions)` | `false` | condition→false disables branch: '!boundedStructuralSheet(dimensions)' | `1645` |
| 120 | REAL_GAP | `src/lib/command-limits.ts` | 325 | `ArithmeticOperator` | `target.endColumn - target.startColumn` | `target.endColumn + target.startColumn` | arithmetic target.endColumn - target.startColumn → target.endColumn + target.startColumn | `1666` |
| 121 | REAL_GAP | `src/lib/command-limits.ts` | 352 | `ConditionalExpression` | `verb.toLowerCase() === 'moveinsert' && !boundedStructuralSheet(dimensions)` | `false` | condition→false disables branch: "verb.toLowerCase() === 'moveinsert' && !boundedStructuralSheet(dimensi" | `1698` |
| 122 | REAL_GAP | `src/lib/command-limits.ts` | 352 | `MethodExpression` | `verb.toLowerCase()` | `verb.toUpperCase()` | case-fold direction flipped | `1702` |
| 123 | REAL_GAP | `src/lib/command-limits.ts` | 352 | `StringLiteral` | `'moveinsert'` | `""` | switch case label 'moveinsert' emptied — that verb falls to default and skips limit checks | `1703` |
| 124 | REAL_GAP | `src/lib/command-limits.ts` | 352 | `BlockStatement` | `{ ⏎           return false; ⏎         }` | `{}` | removed return/reject — fallthrough | `1705` |
| 125 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `ConditionalExpression` | `destination.startRow > 0 && source.endRow > 0` | `true` | guard/discriminant forced true: 'destination.startRow > 0 && source.endRow > 0' | `1722` |
| 126 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `ConditionalExpression` | `destination.startRow > 0` | `true` | guard/discriminant forced true: 'destination.startRow > 0' | `1725` |
| 127 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `EqualityOperator` | `destination.startRow > 0` | `destination.startRow >= 0` | boundary/relational destination.startRow > 0 → destination.startRow >= 0 | `1726` |
| 128 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `LogicalOperator` | `destination.startRow > 0 && source.endRow > 0` | `destination.startRow > 0 \|\| source.endRow > 0` | logical operator change alters short-circuit accept set: 'destination.startRow > 0 && source.endRow > 0' → 'destination.startRow > 0 \|\| source.endRow > 0' | `1724` |
| 129 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `ConditionalExpression` | `source.endRow > 0` | `true` | guard/discriminant forced true: 'source.endRow > 0' | `1728` |
| 130 | REAL_GAP | `src/lib/command-limits.ts` | 365 | `EqualityOperator` | `source.endRow > 0` | `source.endRow >= 0` | boundary/relational source.endRow > 0 → source.endRow >= 0 | `1729` |
| 131 | REAL_GAP | `src/lib/command-limits.ts` | 366 | `ArithmeticOperator` | `Math.abs(source.endRow - source.startRow) + 1` | `Math.abs(source.endRow - source.startRow) - 1` | arithmetic Math.abs(source.endRow - source.startRow) + 1 → Math.abs(source.endRow - source.startRow) - 1 | `1732` |
| 132 | REAL_GAP | `src/lib/command-limits.ts` | 366 | `ArithmeticOperator` | `source.endRow - source.startRow` | `source.endRow + source.startRow` | arithmetic source.endRow - source.startRow → source.endRow + source.startRow | `1733` |
| 133 | REAL_GAP | `src/lib/command-limits.ts` | 367 | `ArithmeticOperator` | `Math.abs(source.endColumn - source.startColumn) + 1` | `Math.abs(source.endColumn - source.startColumn) - 1` | arithmetic Math.abs(source.endColumn - source.startColumn) + 1 → Math.abs(source.endColumn - source.startColumn) - 1 | `1734` |
| 134 | REAL_GAP | `src/lib/command-limits.ts` | 371 | `ArithmeticOperator` | `destination.startRow + rows - 1` | `destination.startRow + rows + 1` | arithmetic destination.startRow + rows - 1 → destination.startRow + rows + 1 | `1740` |
| 135 | REAL_GAP | `src/lib/command-limits.ts` | 372 | `MethodExpression` | `Math.max( ⏎                 dimensions.columns, ⏎                 destination.startColumn + columns - 1, ⏎               )` | `Math.min(dimensions.columns, destination.startColumn + columns - 1)` | max→min | `1742` |
| 136 | REAL_GAP | `src/lib/command-limits.ts` | 374 | `ArithmeticOperator` | `destination.startColumn + columns` | `destination.startColumn - columns` | arithmetic destination.startColumn + columns → destination.startColumn - columns | `1744` |
| 137 | REAL_GAP | `src/lib/command-limits.ts` | 383 | `ConditionalExpression` | `source.endRow > 0` | `true` | guard/discriminant forced true: 'source.endRow > 0' | `1756` |
| 138 | REAL_GAP | `src/lib/command-limits.ts` | 383 | `EqualityOperator` | `source.endRow > 0` | `source.endRow >= 0` | boundary/relational source.endRow > 0 → source.endRow >= 0 | `1757` |
| 139 | REAL_GAP | `src/lib/command-limits.ts` | 386 | `ArithmeticOperator` | `dimensions.rows + Math.abs(source.endRow - source.startRow) + 1` | `dimensions.rows + Math.abs(source.endRow - source.startRow) - 1` | arithmetic dimensions.rows + Math.abs(source.endRow - source.startRow) + 1 → dimensions.rows + Math.abs(source.endRow - source.startRow) - 1 | `1760` |
| 140 | REAL_GAP | `src/lib/command-limits.ts` | 386 | `ArithmeticOperator` | `dimensions.rows + Math.abs(source.endRow - source.startRow)` | `dimensions.rows - Math.abs(source.endRow - source.startRow)` | arithmetic dimensions.rows + Math.abs(source.endRow - source.startRow) → dimensions.rows - Math.abs(source.endRow - source.startRow) | `1761` |
| 141 | REAL_GAP | `src/lib/command-limits.ts` | 386 | `ArithmeticOperator` | `source.endRow - source.startRow` | `source.endRow + source.startRow` | arithmetic source.endRow - source.startRow → source.endRow + source.startRow | `1762` |
| 142 | REAL_GAP | `src/lib/command-limits.ts` | 387 | `ArithmeticOperator` | `dimensions.columns + ⏎               Math.abs(source.endColumn - source.startColumn)` | `dimensions.columns - Math.abs(source.endColumn - source.startColumn)` | arithmetic dimensions.columns + ⏎               Math.abs(source.endColumn - source.startColumn) → dimensions.columns - Math.abs(source.endColumn - source.startColumn) | `1764` |
| 143 | REAL_GAP | `src/lib/command-limits.ts` | 388 | `ArithmeticOperator` | `source.endColumn - source.startColumn` | `source.endColumn + source.startColumn` | arithmetic source.endColumn - source.startColumn → source.endColumn + source.startColumn | `1765` |
| 144 | REAL_GAP | `src/lib/command-limits.ts` | 396 | `StringLiteral` | `'merge'` | `""` | switch case label 'merge' emptied — that verb falls to default and skips limit checks | `1768` |
| 145 | REAL_GAP | `src/lib/command-limits.ts` | 397 | `StringLiteral` | `'unmerge'` | `""` | switch case label 'unmerge' emptied — that verb falls to default and skips limit checks | `1769` |
| 146 | REAL_GAP | `src/lib/command-limits.ts` | 399 | `StringLiteral` | `'cut'` | `""` | switch case label 'cut' emptied — that verb falls to default and skips limit checks | `1771` |
| 147 | REAL_GAP | `src/lib/command-limits.ts` | 400 | `StringLiteral` | `'fillright'` | `""` | switch case label 'fillright' emptied — that verb falls to default and skips limit checks | `1772` |
| 148 | REAL_GAP | `src/lib/command-limits.ts` | 401 | `StringLiteral` | `'filldown'` | `""` | switch case label 'filldown' emptied — that verb falls to default and skips limit checks | `1773` |
| 149 | REAL_GAP | `src/lib/command-limits.ts` | 402 | `StringLiteral` | `'sort'` | `""` | switch case label 'sort' emptied — that verb falls to default and skips limit checks | `1775` |
| 150 | REAL_GAP | `src/lib/command-limits.ts` | 456 | `ConditionalExpression` | `rows > MAX_SOCIALCALC_ROW` | `false` | condition→false disables branch: 'rows > MAX_SOCIALCALC_ROW' | `1855` |
| 151 | REAL_GAP | `src/lib/command-limits.ts` | 456 | `EqualityOperator` | `rows > MAX_SOCIALCALC_ROW` | `rows >= MAX_SOCIALCALC_ROW` | boundary/relational rows > MAX_SOCIALCALC_ROW → rows >= MAX_SOCIALCALC_ROW | `1856` |
| 152 | REAL_GAP | `src/lib/cron.ts` | 44 | `ConditionalExpression` | `typeof cell !== 'string'` | `false` | condition→false disables branch: "typeof cell !== 'string'" | `1867` |
| 153 | REAL_GAP | `src/lib/cron.ts` | 67 | `MethodExpression` | `cmdstr.trim()` | `cmdstr` | trim removed | `1891` |
| 154 | REAL_GAP | `src/lib/cron.ts` | 68 | `ConditionalExpression` | `trimmed.length === 0` | `false` | condition→false disables branch: 'trimmed.length === 0' | `1893` |
| 155 | REAL_GAP | `src/lib/cron.ts` | 72 | `Regex` | `/\\s+/` | `/\\s/` | regex altered: /\\s+/ → /\\s/ | `1895` |
| 156 | REAL_GAP | `src/lib/cron.ts` | 79 | `StringLiteral` | `' '` | `""` | significant character literal ' ' emptied — encode/parse changes | `1909` |
| 157 | REAL_GAP | `src/lib/cron.ts` | 82 | `MethodExpression` | `raw.trim()` | `raw` | trim removed | `1913` |
| 158 | REAL_GAP | `src/lib/cross-sheet.ts` | 51 | `ConditionalExpression` | `declared !== null && ⏎     Number.isFinite(Number(declared))` | `true` | validation guard forced true | `1972` |
| 159 | REAL_GAP | `src/lib/cross-sheet.ts` | 51 | `ConditionalExpression` | `declared !== null` | `true` | nullish guard forced true | `1974` |
| 160 | REAL_GAP | `src/lib/cross-sheet.ts` | 51 | `LogicalOperator` | `declared !== null && ⏎     Number.isFinite(Number(declared))` | `declared !== null \|\| Number.isFinite(Number(declared))` | logical operator change alters short-circuit accept set: 'declared !== null &&\\n    Number.isFinite(Number(de' → 'declared !== null \|\| Number.isFinite(Number(declar' | `1973` |
| 161 | REAL_GAP | `src/lib/cross-sheet.ts` | 108 | `BlockStatement` | `{ ⏎       // Sibling unreachable (e.g. workers recursion limit). Skip. ⏎       // Stryker disable next-line BlockStatement : dropping the `continue` ⏎       // falls through to `if (!save) continue;` below, and `save` is still ⏎       // undefined because the assignment threw — so the net effect is the ⏎       // same next-iteration skip. ⏎       continue; ⏎     }` | `{}` | removed continue | `2023` |
| 162 | REAL_GAP | `src/lib/csp.ts` | 27 | `ConditionalExpression` | `typeof configuredOrigin === 'string' && configuredOrigin.length > 0` | `true` | validation guard forced true | `2046` |
| 163 | REAL_GAP | `src/lib/csp.ts` | 27 | `ConditionalExpression` | `configuredOrigin.length > 0` | `true` | length guard forced true | `2052` |
| 164 | REAL_GAP | `src/lib/csp.ts` | 27 | `EqualityOperator` | `configuredOrigin.length > 0` | `configuredOrigin.length >= 0` | empty admitted as non-empty | `2053` |
| 165 | REAL_GAP | `src/lib/csv-encode.ts` | 38 | `Regex` | `/^[+-]?(?:\\d+(?:\\.\\d+)?\|\\.\\d+)(?:[eE][+-]?\\d+)?$/` | `/^[+-](?:\\d+(?:\\.\\d+)?\|\\.\\d+)(?:[eE][+-]?\\d+)?$/` | regex altered: /^[+-]?(?:\\d+(?:\\.\\d+)?\|\\.\\d+)(?:[eE][+-]?\\d+)?$/ → /^[+-](?:\\d+(?:\\.\\d+)?\|\\.\\d+)(?:[eE][+-]?\\d+)?$/ | `2081` |
| 166 | REAL_GAP | `src/lib/csv-parse.ts` | 41 | `ConditionalExpression` | `csv.length === 0` | `false` | condition→false disables branch: 'csv.length === 0' | `2116` |
| 167 | REAL_GAP | `src/lib/csv-parse.ts` | 60 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `2147` |
| 168 | REAL_GAP | `src/lib/csv-parse.ts` | 85 | `BooleanLiteral` | `false` | `true` | boolean false→true changes flag/default | `2171` |
| 169 | REAL_GAP | `src/lib/csv-parse.ts` | 93 | `BooleanLiteral` | `false` | `true` | boolean false→true changes flag/default | `2179` |
| 170 | REAL_GAP | `src/lib/csv-parse.ts` | 106 | `ConditionalExpression` | `field.length > 0` | `false` | condition→false disables branch: 'field.length > 0' | `2197` |
| 171 | REAL_GAP | `src/lib/csv-parse.ts` | 106 | `LogicalOperator` | `field.length > 0 \|\| currentRow.length > 0` | `field.length > 0 && currentRow.length > 0` | logical operator change alters short-circuit accept set: 'field.length > 0 \|\| currentRow.length > 0' → 'field.length > 0 && currentRow.length > 0' | `2196` |
| 172 | REAL_GAP | `src/lib/csv-parse.ts` | 106 | `ConditionalExpression` | `currentRow.length > 0` | `false` | condition→false disables branch: 'currentRow.length > 0' | `2200` |
| 173 | REAL_GAP | `src/lib/csv.ts` | 32 | `EqualityOperator` | `i < first.length` | `i <= first.length` | loop/index bound < → <=  | `2208` |
| 174 | REAL_GAP | `src/lib/do-dispatch.ts` | 17 | `ConditionalExpression` | `!isValidRoomName(room)` | `false` | condition→false disables branch: '!isValidRoomName(room)' | `2254` |
| 175 | REAL_GAP | `src/lib/email.ts` | 64 | `ConditionalExpression` | `trimmed.length === 0` | `false` | condition→false disables branch: 'trimmed.length === 0' | `2284` |
| 176 | REAL_GAP | `src/lib/loadclipboard.ts` | 105 | `ConditionalExpression` | `typeof queryRow === 'number'` | `true` | validation guard forced true | `2523` |
| 177 | REAL_GAP | `src/lib/migrate-auth.ts` | 56 | `EqualityOperator` | `i < a.length` | `i <= a.length` | loop/index bound < → <=  | `2609` |
| 178 | REAL_GAP | `src/lib/multi-sheet-import.ts` | 36 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `2627` |
| 179 | REAL_GAP | `src/lib/pitr.ts` | 34 | `ConditionalExpression` | `typeof storage !== 'object'` | `false` | condition→false disables branch: "typeof storage !== 'object'" | `2663` |
| 180 | REAL_GAP | `src/lib/pitr.ts` | 79 | `ConditionalExpression` | `typeof atValue === 'string'` | `true` | validation guard forced true | `2736` |
| 181 | REAL_GAP | `src/lib/rate-limit.ts` | 77 | `ConditionalExpression` | `rateLimitDisabled(trimmed)` | `false` | condition→false disables branch: 'rateLimitDisabled(trimmed)' | `2772` |
| 182 | REAL_GAP | `src/lib/rate-limit.ts` | 91 | `EqualityOperator` | `colon >= 0` | `colon > 0` | non-negative tightened colon >= 0→colon > 0 | `2783` |
| 183 | REAL_GAP | `src/lib/rate-limit.ts` | 92 | `MethodExpression` | `trimmed.slice(0, colon).trim()` | `trimmed.slice(0, colon)` | method trimmed.slice(0, colon).trim() → trimmed.slice(0, colon) | `2786` |
| 184 | REAL_GAP | `src/lib/rate-limit.ts` | 93 | `MethodExpression` | `trimmed.slice(colon + 1).trim()` | `trimmed.slice(colon + 1)` | method trimmed.slice(colon + 1).trim() → trimmed.slice(colon + 1) | `2788` |
| 185 | REAL_GAP | `src/lib/rate-limit.ts` | 157 | `ConditionalExpression` | `oldest !== undefined` | `true` | nullish guard forced true | `2862` |
| 186 | REAL_GAP | `src/lib/rate-limit.ts` | 164 | `EqualityOperator` | `elapsedSec > 0` | `elapsedSec >= 0` | positive loosened elapsedSec > 0→elapsedSec >= 0 | `2871` |
| 187 | REAL_GAP | `src/lib/room-create-limit.ts` | 47 | `ConditionalExpression` | `limitDisabled(trimmed)` | `false` | condition→false disables branch: 'limitDisabled(trimmed)' | `2924` |
| 188 | REAL_GAP | `src/lib/room-create-limit.ts` | 61 | `EqualityOperator` | `colon >= 0` | `colon > 0` | non-negative tightened colon >= 0→colon > 0 | `2935` |
| 189 | REAL_GAP | `src/lib/room-create-limit.ts` | 62 | `MethodExpression` | `trimmed.slice(0, colon).trim()` | `trimmed.slice(0, colon)` | method trimmed.slice(0, colon).trim() → trimmed.slice(0, colon) | `2938` |
| 190 | REAL_GAP | `src/lib/room-create-limit.ts` | 63 | `MethodExpression` | `trimmed.slice(colon + 1).trim()` | `trimmed.slice(colon + 1)` | method trimmed.slice(colon + 1).trim() → trimmed.slice(colon + 1) | `2940` |
| 191 | REAL_GAP | `src/lib/room-create-limit.ts` | 101 | `ConditionalExpression` | `method === 'POST'` | `true` | condition→true: "method === 'POST'" | `3019` |
| 192 | REAL_GAP | `src/lib/room-create-limit.ts` | 101 | `Regex` | `/^\\/_from\\/[^/]+\\/private$/` | `/\\/_from\\/[^/]+\\/private$/` | regex altered: /^\\/_from\\/[^/]+\\/private$/ → /\\/_from\\/[^/]+\\/private$/ | `3022` |
| 193 | REAL_GAP | `src/lib/room-create-limit.ts` | 104 | `ConditionalExpression` | `method === 'GET'` | `true` | condition→true: "method === 'GET'" | `3031` |
| 194 | REAL_GAP | `src/lib/room-create-limit.ts` | 106 | `ConditionalExpression` | `method === 'PUT'` | `true` | condition→true: "method === 'PUT'" | `3042` |
| 195 | REAL_GAP | `src/lib/room-create-limit.ts` | 107 | `Regex` | `/^\\/=[^/]+\\.(?:xlsx\|ods\|fods)$/` | `/\\/=[^/]+\\.(?:xlsx\|ods\|fods)$/` | regex altered: /^\\/=[^/]+\\.(?:xlsx\|ods\|fods)$/ → /\\/=[^/]+\\.(?:xlsx\|ods\|fods)$/ | `3047` |
| 196 | REAL_GAP | `src/lib/room-create-limit.ts` | 108 | `Regex` | `/^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/` | `/\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/` | regex altered: /^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/ → /\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/ | `3051` |
| 197 | REAL_GAP | `src/lib/room-create-limit.ts` | 108 | `Regex` | `/^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/` | `/^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)/` | regex altered: /^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)$/ → /^\\/_\\/=[^/]+\\/(?:xlsx\|ods\|fods)/ | `3052` |
| 198 | REAL_GAP | `src/lib/room-name.ts` | 33 | `EqualityOperator` | `index < raw.length` | `index <= raw.length` | loop/index bound < → <=  | `3123` |
| 199 | REAL_GAP | `src/lib/room-name.ts` | 39 | `ConditionalExpression` | `next <= 0xdfff` | `true` | guard/discriminant forced true: 'next <= 0xdfff' | `3147` |
| 200 | REAL_GAP | `src/lib/room-name.ts` | 55 | `StringLiteral` | `'0'` | `""` | protocol/discriminant/default token '0' emptied | `3169` |
| 201 | REAL_GAP | `src/lib/room-name.ts` | 69 | `StringLiteral` | `'Invalid room name'` | `""` | wire-visible message/reason "'Invalid room name'" emptied — clients can observe body/close reason | `3175` |
| 202 | REAL_GAP | `src/lib/sandstorm-access.ts` | 34 | `ConditionalExpression` | `method === 'GET'` | `true` | condition→true: "method === 'GET'" | `3270` |
| 203 | REAL_GAP | `src/lib/seq-store.ts` | 65 | `UnaryOperator` | `-1` | `+1` | UnaryOperator -1 → +1 | `3323` |
| 204 | REAL_GAP | `src/lib/session.ts` | 29 | `ConditionalExpression` | `equals < 0` | `false` | condition→false disables branch: 'equals < 0' | `3372` |
| 205 | REAL_GAP | `src/lib/session.ts` | 29 | `EqualityOperator` | `equals < 0` | `equals <= 0` | boundary/relational equals < 0 → equals <= 0 | `3373` |
| 206 | REAL_GAP | `src/lib/snapshot-storage.ts` | 48 | `ConditionalExpression` | `value !== null && ⏎     typeof value === 'object' && ⏎     'chunks' in value` | `true` | validation guard forced true | `3411` |
| 207 | REAL_GAP | `src/lib/snapshot-storage.ts` | 48 | `ConditionalExpression` | `value !== null && ⏎     typeof value === 'object'` | `true` | validation guard forced true | `3413` |
| 208 | REAL_GAP | `src/lib/snapshot-storage.ts` | 48 | `ConditionalExpression` | `value !== null` | `true` | nullish guard forced true | `3415` |
| 209 | REAL_GAP | `src/lib/snapshot-storage.ts` | 48 | `LogicalOperator` | `value !== null && ⏎     typeof value === 'object' && ⏎     'chunks' in value` | `value !== null && typeof value === 'object' \|\| 'chunks' in value` | logical operator change alters short-circuit accept set: "value !== null &&\\n    typeof value === 'object' &&" → "value !== null && typeof value === 'object' \|\| 'ch" | `3412` |
| 210 | REAL_GAP | `src/lib/snapshot-storage.ts` | 48 | `LogicalOperator` | `value !== null && ⏎     typeof value === 'object'` | `value !== null \|\| typeof value === 'object'` | logical operator change alters short-circuit accept set: "value !== null &&\\n    typeof value === 'object'" → "value !== null \|\| typeof value === 'object'" | `3414` |
| 211 | REAL_GAP | `src/lib/snapshot-storage.ts` | 49 | `ConditionalExpression` | `typeof value === 'object'` | `true` | validation guard forced true | `3417` |
| 212 | REAL_GAP | `src/lib/snapshot-storage.ts` | 86 | `ConditionalExpression` | `meta === null` | `false` | condition→false disables branch: 'meta === null' | `3447` |
| 213 | REAL_GAP | `src/lib/snapshot-storage.ts` | 90 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `3454` |
| 214 | REAL_GAP | `src/lib/snapshot-storage.ts` | 91 | `EqualityOperator` | `i < meta.chunks` | `i <= meta.chunks` | loop/index bound < → <=  | `3456` |
| 215 | REAL_GAP | `src/lib/snapshot-storage.ts` | 130 | `ConditionalExpression` | `chunks.length > MAX_SNAPSHOT_CHUNKS` | `false` | condition→false disables branch: 'chunks.length > MAX_SNAPSHOT_CHUNKS' | `3480` |
| 216 | REAL_GAP | `src/lib/snapshot-storage.ts` | 130 | `EqualityOperator` | `chunks.length > MAX_SNAPSHOT_CHUNKS` | `chunks.length >= MAX_SNAPSHOT_CHUNKS` | boundary/relational chunks.length > MAX_SNAPSHOT_CHUNKS → chunks.length >= MAX_SNAPSHOT_CHUNKS | `3481` |
| 217 | REAL_GAP | `src/lib/snapshot-storage.ts` | 136 | `EqualityOperator` | `i < chunks.length` | `i <= chunks.length` | loop/index bound < → <=  | `3488` |
| 218 | REAL_GAP | `src/lib/snapshot-storage.ts` | 175 | `EqualityOperator` | `index < s.length` | `index <= s.length` | loop/index bound < → <=  | `3508` |
| 219 | REAL_GAP | `src/lib/snapshot-storage.ts` | 181 | `ConditionalExpression` | `code <= 0x7ff` | `false` | condition→false disables branch: 'code <= 0x7ff' | `3517` |
| 220 | REAL_GAP | `src/lib/snapshot-storage.ts` | 181 | `EqualityOperator` | `code <= 0x7ff` | `code < 0x7ff` | boundary/relational code <= 0x7ff → code < 0x7ff | `3518` |
| 221 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ConditionalExpression` | `code >= 0xd800 && code <= 0xdbff && index + 1 < s.length` | `true` | length guard forced true | `3521` |
| 222 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ConditionalExpression` | `code >= 0xd800 && code <= 0xdbff` | `true` | guard/discriminant forced true: 'code >= 0xd800 && code <= 0xdbff' | `3524` |
| 223 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ConditionalExpression` | `code >= 0xd800` | `true` | guard/discriminant forced true: 'code >= 0xd800' | `3526` |
| 224 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `LogicalOperator` | `code >= 0xd800 && code <= 0xdbff && index + 1 < s.length` | `code >= 0xd800 && code <= 0xdbff \|\| index + 1 < s.length` | logical operator change alters short-circuit accept set: 'code >= 0xd800 && code <= 0xdbff && index + 1 < s.' → 'code >= 0xd800 && code <= 0xdbff \|\| index + 1 < s.' | `3523` |
| 225 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `LogicalOperator` | `code >= 0xd800 && code <= 0xdbff` | `code >= 0xd800 \|\| code <= 0xdbff` | logical operator change alters short-circuit accept set: 'code >= 0xd800 && code <= 0xdbff' → 'code >= 0xd800 \|\| code <= 0xdbff' | `3525` |
| 226 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ConditionalExpression` | `code <= 0xdbff` | `true` | guard/discriminant forced true: 'code <= 0xdbff' | `3529` |
| 227 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `EqualityOperator` | `code <= 0xdbff` | `code < 0xdbff` | boundary/relational code <= 0xdbff → code < 0xdbff | `3530` |
| 228 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ArithmeticOperator` | `index + 1` | `index - 1` | arithmetic index + 1 → index - 1 | `3535` |
| 229 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `ConditionalExpression` | `index + 1 < s.length` | `true` | length guard forced true | `3532` |
| 230 | REAL_GAP | `src/lib/snapshot-storage.ts` | 183 | `EqualityOperator` | `index + 1 < s.length` | `index + 1 <= s.length` | relational index + 1 < s.length → index + 1 <= s.length | `3533` |
| 231 | REAL_GAP | `src/lib/snapshot-storage.ts` | 184 | `ArithmeticOperator` | `index + 1` | `index - 1` | arithmetic index + 1 → index - 1 | `3537` |
| 232 | REAL_GAP | `src/lib/snapshot-storage.ts` | 185 | `ConditionalExpression` | `next >= 0xdc00 && next <= 0xdfff` | `true` | guard/discriminant forced true: 'next >= 0xdc00 && next <= 0xdfff' | `3538` |
| 233 | REAL_GAP | `src/lib/snapshot-storage.ts` | 185 | `ConditionalExpression` | `next >= 0xdc00` | `true` | guard/discriminant forced true: 'next >= 0xdc00' | `3541` |
| 234 | REAL_GAP | `src/lib/snapshot-storage.ts` | 185 | `LogicalOperator` | `next >= 0xdc00 && next <= 0xdfff` | `next >= 0xdc00 \|\| next <= 0xdfff` | logical operator change alters short-circuit accept set: 'next >= 0xdc00 && next <= 0xdfff' → 'next >= 0xdc00 \|\| next <= 0xdfff' | `3540` |
| 235 | REAL_GAP | `src/lib/snapshot-storage.ts` | 185 | `ConditionalExpression` | `next <= 0xdfff` | `true` | guard/discriminant forced true: 'next <= 0xdfff' | `3544` |
| 236 | REAL_GAP | `src/lib/snapshot-storage.ts` | 185 | `EqualityOperator` | `next <= 0xdfff` | `next < 0xdfff` | boundary/relational next <= 0xdfff → next < 0xdfff | `3545` |
| 237 | REAL_GAP | `src/lib/snapshot-storage.ts` | 197 | `ConditionalExpression` | `index > start` | `true` | guard/discriminant forced true: 'index > start' | `3557` |
| 238 | REAL_GAP | `src/lib/snapshot-storage.ts` | 197 | `EqualityOperator` | `index > start` | `index >= start` | relational index > start → index >= start | `3558` |
| 239 | REAL_GAP | `src/lib/storage-batch.ts` | 13 | `EqualityOperator` | `index < keys.length` | `index <= keys.length` | loop/index bound < → <=  | `3568` |
| 240 | REAL_GAP | `src/lib/storage-batch.ts` | 28 | `EqualityOperator` | `index < pairs.length` | `index <= pairs.length` | loop/index bound < → <=  | `3576` |
| 241 | REAL_GAP | `src/lib/storage-batch.ts` | 40 | `EqualityOperator` | `index < keys.length` | `index <= keys.length` | loop/index bound < → <=  | `3584` |
| 242 | REAL_GAP | `src/lib/ws-dispatch.ts` | 57 | `ConditionalExpression` | `cmdstr.length === 0` | `false` | condition→false disables branch: 'cmdstr.length === 0' | `3605` |
| 243 | REAL_GAP | `src/lib/ws-handlers.ts` | 328 | `BlockStatement` | `{ ⏎       // Exhaustiveness sentinel. If a new ClientMessage variant is added ⏎       // without a handler, TypeScript fails here at compile time. ⏎       const _exhaustive: never = msg; ⏎       void _exhaustive; ⏎     }` | `{}` | removed block side effects | `3760` |
| 244 | REAL_GAP | `src/lib/ws-upgrade.ts` | 60 | `LogicalOperator` | `url.searchParams.get('user') ?? ''` | `url.searchParams.get('user') && ''` | nullish coalescing mutated: url.searchParams.get('user') ?? '' → url.searchParams.get('user') && '' | `3762` |
| 245 | REAL_GAP | `src/lib/ws-upgrade.ts` | 60 | `StringLiteral` | `'user'` | `""` | protocol/discriminant/default token 'user' emptied | `3763` |
| 246 | REAL_GAP | `src/lib/ws-upgrade.ts` | 60 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `3764` |
| 247 | REAL_GAP | `src/lib/ws-upgrade.ts` | 61 | `LogicalOperator` | `url.searchParams.get('auth') ?? ''` | `url.searchParams.get('auth') && ''` | nullish coalescing mutated: url.searchParams.get('auth') ?? '' → url.searchParams.get('auth') && '' | `3765` |
| 248 | REAL_GAP | `src/lib/ws-upgrade.ts` | 61 | `StringLiteral` | `'auth'` | `""` | protocol/discriminant/default token 'auth' emptied | `3766` |
| 249 | REAL_GAP | `src/lib/ws-upgrade.ts` | 61 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `3767` |
| 250 | REAL_GAP | `src/lib/ws-upgrade.ts` | 62 | `LogicalOperator` | `url.searchParams.get('room') ?? ''` | `url.searchParams.get('room') && ''` | nullish coalescing mutated: url.searchParams.get('room') ?? '' → url.searchParams.get('room') && '' | `3768` |
| 251 | REAL_GAP | `src/lib/ws-upgrade.ts` | 62 | `StringLiteral` | `'room'` | `""` | protocol/discriminant/default token 'room' emptied | `3769` |
| 252 | REAL_GAP | `src/lib/ws-upgrade.ts` | 62 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `3770` |
| 253 | REAL_GAP | `src/lib/xlsx-build.ts` | 134 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `3840` |
| 254 | REAL_GAP | `src/lib/xlsx-build.ts` | 260 | `StringLiteral` | `'Sheet1'` | `""` | protocol/discriminant/default token 'Sheet1' emptied | `4015` |
| 255 | REAL_GAP | `src/lib/xlsx-build.ts` | 268 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `4019` |
| 256 | REAL_GAP | `src/lib/xlsx-build.ts` | 282 | `StringLiteral` | `'Sheet1'` | `""` | protocol/discriminant/default token 'Sheet1' emptied | `4029` |
| 257 | REAL_GAP | `src/lib/xlsx-build.ts` | 293 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `4033` |
| 258 | REAL_GAP | `src/lib/xlsx-build.ts` | 311 | `StringLiteral` | `'Sheet1'` | `""` | protocol/discriminant/default token 'Sheet1' emptied | `4041` |
| 259 | REAL_GAP | `src/lib/xlsx-build.ts` | 315 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `4044` |
| 260 | REAL_GAP | `src/lib/xlsx-build.ts` | 338 | `ConditionalExpression` | `value === ''` | `false` | condition→false disables branch: "value === ''" | `4051` |
| 261 | REAL_GAP | `src/lib/xlsx-build.ts` | 338 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `4053` |
| 262 | REAL_GAP | `src/lib/xlsx-build.ts` | 403 | `ConditionalExpression` | `base.length > 31` | `true` | length guard forced true | `4080` |
| 263 | REAL_GAP | `src/lib/xlsx-build.ts` | 403 | `EqualityOperator` | `base.length > 31` | `base.length >= 31` | boundary/relational base.length > 31 → base.length >= 31 | `4082` |
| 264 | REAL_GAP | `src/lib/xlsx-build.ts` | 443 | `StringLiteral` | `'Sheet1'` | `""` | protocol/discriminant/default token 'Sheet1' emptied | `4108` |
| 265 | REAL_GAP | `src/lib/xlsx-build.ts` | 447 | `ConditionalExpression` | `grid.length === 0` | `false` | condition→false disables branch: 'grid.length === 0' | `4111` |
| 266 | REAL_GAP | `src/lib/xlsx-build.ts` | 447 | `ArrayDeclaration` | `[['']]` | `[]` | array initializer mutated — can poison lists if not fully overwritten before read | `4113` |
| 267 | REAL_GAP | `src/lib/xlsx-build.ts` | 447 | `ArrayDeclaration` | `['']` | `[]` | array initializer mutated — can poison lists if not fully overwritten before read | `4114` |
| 268 | REAL_GAP | `src/lib/xlsx-build.ts` | 447 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `4115` |
| 269 | REAL_GAP | `src/lib/xlsx-build.ts` | 456 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `4118` |
| 270 | REAL_GAP | `src/lib/xlsx-build.ts` | 472 | `ObjectLiteral` | `{ type: 'array' }` | `{}` | SheetJS options object emptied — read/csv format changes | `4120` |
| 271 | REAL_GAP | `src/lib/xlsx-build.ts` | 472 | `StringLiteral` | `'array'` | `""` | protocol/discriminant/default token 'array' emptied | `4121` |
| 272 | REAL_GAP | `src/lib/xlsx-build.ts` | 476 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `4122` |
| 273 | REAL_GAP | `src/lib/xlsx-build.ts` | 483 | `ObjectLiteral` | `{ ⏎       FS: ',', ⏎       RS: '\\n', ⏎     }` | `{}` | SheetJS options object emptied — read/csv format changes | `4128` |
| 274 | REAL_GAP | `src/lib/xlsx-import.ts` | 137 | `ConditionalExpression` | `eocdOffset === -1` | `false` | condition→false disables branch: 'eocdOffset === -1' | `4199` |
| 275 | REAL_GAP | `src/lib/xlsx-import.ts` | 137 | `UnaryOperator` | `-1` | `+1` | UnaryOperator -1 → +1 | `4201` |
| 276 | REAL_GAP | `src/lib/xlsx-import.ts` | 137 | `BlockStatement` | `{ ⏎     return; ⏎   }` | `{}` | removed return/reject — fallthrough | `4202` |
| 277 | REAL_GAP | `src/lib/xlsx-import.ts` | 149 | `ArithmeticOperator` | `offset + 4` | `offset - 4` | arithmetic offset + 4 → offset - 4 | `4229` |
| 278 | REAL_GAP | `src/lib/xlsx-import.ts` | 149 | `ConditionalExpression` | `offset + 4 <= length` | `true` | length guard forced true | `4225` |
| 279 | REAL_GAP | `src/lib/xlsx-import.ts` | 149 | `EqualityOperator` | `offset + 4 <= length` | `offset + 4 < length` | boundary/relational offset + 4 <= length → offset + 4 < length | `4227` |
| 280 | REAL_GAP | `src/lib/xlsx-import.ts` | 150 | `ArithmeticOperator` | `offset + 1` | `offset - 1` | arithmetic offset + 1 → offset - 1 | `4231` |
| 281 | REAL_GAP | `src/lib/xlsx-import.ts` | 150 | `ArithmeticOperator` | `offset + 2` | `offset - 2` | arithmetic offset + 2 → offset - 2 | `4232` |
| 282 | REAL_GAP | `src/lib/xlsx-import.ts` | 150 | `ArithmeticOperator` | `offset + 3` | `offset - 3` | arithmetic offset + 3 → offset - 3 | `4233` |
| 283 | REAL_GAP | `src/lib/xlsx-import.ts` | 151 | `ConditionalExpression` | `sig !== 0x02014b50` | `true` | guard/discriminant forced true: 'sig !== 0x02014b50' | `4234` |
| 284 | REAL_GAP | `src/lib/xlsx-import.ts` | 153 | `ConditionalExpression` | `expectedEocdOffset < eocdOffset` | `true` | guard/discriminant forced true: 'expectedEocdOffset < eocdOffset' | `4239` |
| 285 | REAL_GAP | `src/lib/xlsx-import.ts` | 153 | `EqualityOperator` | `expectedEocdOffset < eocdOffset` | `expectedEocdOffset <= eocdOffset` | boundary/relational expectedEocdOffset < eocdOffset → expectedEocdOffset <= eocdOffset | `4241` |
| 286 | REAL_GAP | `src/lib/xlsx-import.ts` | 157 | `ArithmeticOperator` | `testOffset + 4` | `testOffset - 4` | arithmetic testOffset + 4 → testOffset - 4 | `4250` |
| 287 | REAL_GAP | `src/lib/xlsx-import.ts` | 159 | `ConditionalExpression` | `testSig === 0x02014b50` | `true` | guard/discriminant forced true: 'testSig === 0x02014b50' | `4255` |
| 288 | REAL_GAP | `src/lib/xlsx-import.ts` | 168 | `EqualityOperator` | `i < entryCount` | `i <= entryCount` | loop/index bound < → <=  | `4260` |
| 289 | REAL_GAP | `src/lib/xlsx-import.ts` | 168 | `UpdateOperator` | `i++` | `i--` | UpdateOperator i++ → i-- | `4262` |
| 290 | REAL_GAP | `src/lib/xlsx-import.ts` | 174 | `ConditionalExpression` | `signature !== 0x02014b50` | `false` | condition→false disables branch: 'signature !== 0x02014b50' | `4274` |
| 291 | REAL_GAP | `src/lib/xlsx-import.ts` | 174 | `BlockStatement` | `{ ⏎       return; ⏎     }` | `{}` | removed return/reject — fallthrough | `4276` |
| 292 | REAL_GAP | `src/lib/xlsx-import.ts` | 178 | `ArithmeticOperator` | `offset + 25` | `offset - 25` | arithmetic offset + 25 → offset - 25 | `4282` |
| 293 | REAL_GAP | `src/lib/xlsx-import.ts` | 179 | `ArithmeticOperator` | `offset + 29` | `offset - 29` | arithmetic offset + 29 → offset - 29 | `4286` |
| 294 | REAL_GAP | `src/lib/xlsx-import.ts` | 183 | `ConditionalExpression` | `uncompressedSize === 0xffffffff` | `false` | condition→false disables branch: 'uncompressedSize === 0xffffffff' | `4296` |
| 295 | REAL_GAP | `src/lib/xlsx-import.ts` | 205 | `Regex` | `/^xl\\/worksheets\\/sheet\\d+\\.xml$/` | `/xl\\/worksheets\\/sheet\\d+\\.xml$/` | regex altered: /^xl\\/worksheets\\/sheet\\d+\\.xml$/ → /xl\\/worksheets\\/sheet\\d+\\.xml$/ | `4356` |
| 296 | REAL_GAP | `src/lib/xlsx-import.ts` | 206 | `Regex` | `/^xl\\/worksheets\\/_rels\\/sheet\\d+\\.xml\\.rels$/` | `/xl\\/worksheets\\/_rels\\/sheet\\d+\\.xml\\.rels$/` | regex altered: /^xl\\/worksheets\\/_rels\\/sheet\\d+\\.xml\\.rels$/ → /xl\\/worksheets\\/_rels\\/sheet\\d+\\.xml\\.rels$/ | `4360` |
| 297 | REAL_GAP | `src/lib/xlsx-import.ts` | 209 | `ConditionalExpression` | `uncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES` | `false` | condition→false disables branch: 'uncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES' | `4368` |
| 298 | REAL_GAP | `src/lib/xlsx-import.ts` | 209 | `BlockStatement` | `{ ⏎         throw new ImportArchiveTooLargeError(uncompressedSize); ⏎       }` | `{}` | removed block side effects | `4371` |
| 299 | REAL_GAP | `src/lib/xlsx-import.ts` | 271 | `EqualityOperator` | `rc.r > MAX_SOCIALCALC_ROW - 1` | `rc.r >= MAX_SOCIALCALC_ROW - 1` | boundary/relational rc.r > MAX_SOCIALCALC_ROW - 1 → rc.r >= MAX_SOCIALCALC_ROW - 1 | `4417` |
| 300 | REAL_GAP | `src/lib/xlsx-import.ts` | 273 | `ArithmeticOperator` | `rc.r + 1` | `rc.r - 1` | arithmetic rc.r + 1 → rc.r - 1 | `4421` |
| 301 | REAL_GAP | `src/lib/xlsx-import.ts` | 276 | `MethodExpression` | `Math.max(maxColumn, rc.c + 1)` | `Math.min(maxColumn, rc.c + 1)` | max→min | `4424` |
| 302 | REAL_GAP | `src/lib/xlsx-import.ts` | 276 | `ArithmeticOperator` | `rc.c + 1` | `rc.c - 1` | arithmetic rc.c + 1 → rc.c - 1 | `4425` |
| 303 | REAL_GAP | `src/lib/xlsx-import.ts` | 293 | `ConditionalExpression` | `typeof column !== 'number'` | `false` | condition→false disables branch: "typeof column !== 'number'" | `4439` |
| 304 | REAL_GAP | `src/lib/xlsx-import.ts` | 298 | `ConditionalExpression` | `(column as number) >= 0` | `true` | guard/discriminant forced true: '(column as number) >= 0' | `4454` |
| 305 | REAL_GAP | `src/lib/xlsx-import.ts` | 298 | `EqualityOperator` | `(column as number) >= 0` | `column as number > 0` | non-negative tightened (column as number) >= 0→column as number > 0 | `4455` |
| 306 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `ConditionalExpression` | `typeof row === 'number' && Number.isFinite(row)` | `false` | condition→false disables branch: "typeof row === 'number' && Number.isFinite(row)" | `4459` |
| 307 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `ConditionalExpression` | `typeof row === 'number'` | `true` | validation guard forced true | `4461` |
| 308 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `EqualityOperator` | `typeof row === 'number'` | `typeof row !== 'number'` | typeof comparison mutated typeof row === 'number' → typeof row !== 'number' | `4462` |
| 309 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `LogicalOperator` | `typeof row === 'number' && Number.isFinite(row)` | `typeof row === 'number' \|\| Number.isFinite(row)` | logical operator change alters short-circuit accept set: "typeof row === 'number' && Number.isFinite(row)" → "typeof row === 'number' \|\| Number.isFinite(row)" | `4460` |
| 310 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `StringLiteral` | `'number'` | `""` | wire-visible message/reason "'number'" emptied — clients can observe body/close reason | `4463` |
| 311 | REAL_GAP | `src/lib/xlsx-import.ts` | 300 | `ArithmeticOperator` | `row + 1` | `row - 1` | arithmetic row + 1 → row - 1 | `4464` |
| 312 | REAL_GAP | `src/lib/xlsx-import.ts` | 308 | `ConditionalExpression` | `typeof column === 'number' && Number.isFinite(column)` | `false` | condition→false disables branch: "typeof column === 'number' && Number.isFinite(column)" | `4469` |
| 313 | REAL_GAP | `src/lib/xlsx-import.ts` | 308 | `ConditionalExpression` | `typeof column === 'number'` | `true` | validation guard forced true | `4471` |
| 314 | REAL_GAP | `src/lib/xlsx-import.ts` | 308 | `EqualityOperator` | `typeof column === 'number'` | `typeof column !== 'number'` | typeof comparison mutated typeof column === 'number' → typeof column !== 'number' | `4472` |
| 315 | REAL_GAP | `src/lib/xlsx-import.ts` | 308 | `StringLiteral` | `'number'` | `""` | wire-visible message/reason "'number'" emptied — clients can observe body/close reason | `4473` |
| 316 | REAL_GAP | `src/lib/xlsx-import.ts` | 314 | `ConditionalExpression` | `typeof row !== 'number'` | `false` | condition→false disables branch: "typeof row !== 'number'" | `4481` |
| 317 | REAL_GAP | `src/lib/xlsx-import.ts` | 316 | `ConditionalExpression` | `row < 0` | `false` | condition→false disables branch: 'row < 0' | `4485` |
| 318 | REAL_GAP | `src/lib/xlsx-import.ts` | 317 | `EqualityOperator` | `row > MAX_SOCIALCALC_ROW - 1` | `row >= MAX_SOCIALCALC_ROW - 1` | boundary/relational row > MAX_SOCIALCALC_ROW - 1 → row >= MAX_SOCIALCALC_ROW - 1 | `4489` |
| 319 | REAL_GAP | `src/lib/xlsx-import.ts` | 321 | `ConditionalExpression` | `typeof row === 'number'` | `true` | validation guard forced true | `4497` |
| 320 | REAL_GAP | `src/lib/xlsx-import.ts` | 321 | `LogicalOperator` | `typeof row === 'number' && Number.isFinite(row)` | `typeof row === 'number' \|\| Number.isFinite(row)` | logical operator change alters short-circuit accept set: "typeof row === 'number' && Number.isFinite(row)" → "typeof row === 'number' \|\| Number.isFinite(row)" | `4496` |
| 321 | REAL_GAP | `src/lib/xlsx-import.ts` | 325 | `ConditionalExpression` | `typeof row === 'number'` | `true` | validation guard forced true | `4501` |
| 322 | REAL_GAP | `src/room.ts` | 251 | `ObjectLiteral` | `{ snapshot, log }` | `{}` | payload/options object emptied | `4681` |
| 323 | REAL_GAP | `src/room.ts` | 251 | `ObjectLiteral` | `{ log }` | `{}` | foldSnapshot({log}) emptied — log commands dropped when snapshot is empty | `4682` |
| 324 | REAL_GAP | `src/room.ts` | 264 | `ConditionalExpression` | `raw === undefined` | `false` | condition→false disables branch: 'raw === undefined' | `4685` |
| 325 | REAL_GAP | `src/room.ts` | 267 | `ArithmeticOperator` | `seconds * 1000` | `seconds / 1000` | arithmetic seconds * 1000 → seconds / 1000 | `4694` |
| 326 | REAL_GAP | `src/room.ts` | 321 | `ConditionalExpression` | `typeof WebSocketRequestResponsePair === 'function'` | `false` | condition→false disables branch: "typeof WebSocketRequestResponsePair === 'function'" | `4698` |
| 327 | REAL_GAP | `src/room.ts` | 321 | `StringLiteral` | `'function'` | `""` | wire-visible message/reason "'function'" emptied — clients can observe body/close reason | `4700` |
| 328 | REAL_GAP | `src/room.ts` | 335 | `ConditionalExpression` | `roomName` | `true` | guard/discriminant forced true: 'roomName' | `4706` |
| 329 | REAL_GAP | `src/room.ts` | 335 | `ConditionalExpression` | `roomName` | `false` | condition→false disables branch: 'roomName' | `4707` |
| 330 | REAL_GAP | `src/room.ts` | 353 | `ConditionalExpression` | `request.method === 'GET'` | `true` | HTTP method guard forced true | `4753` |
| 331 | REAL_GAP | `src/room.ts` | 363 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4769` |
| 332 | REAL_GAP | `src/room.ts` | 366 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4779` |
| 333 | REAL_GAP | `src/room.ts` | 385 | `ConditionalExpression` | `request.method === 'GET'` | `true` | HTTP method guard forced true | `4843` |
| 334 | REAL_GAP | `src/room.ts` | 391 | `Regex` | `/^\\/_do\\/cells\\/(.+)$/` | `/\\/_do\\/cells\\/(.+)$/` | regex altered: /^\\/_do\\/cells\\/(.+)$/ → /\\/_do\\/cells\\/(.+)$/ | `4857` |
| 335 | REAL_GAP | `src/room.ts` | 391 | `Regex` | `/^\\/_do\\/cells\\/(.+)$/` | `/^\\/_do\\/cells\\/(.+)/` | regex altered: /^\\/_do\\/cells\\/(.+)$/ → /^\\/_do\\/cells\\/(.+)/ | `4858` |
| 336 | REAL_GAP | `src/room.ts` | 425 | `ConditionalExpression` | `request.method === 'GET'` | `true` | HTTP method guard forced true | `4949` |
| 337 | REAL_GAP | `src/room.ts` | 433 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4959` |
| 338 | REAL_GAP | `src/room.ts` | 436 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4969` |
| 339 | REAL_GAP | `src/room.ts` | 439 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4979` |
| 340 | REAL_GAP | `src/room.ts` | 449 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4989` |
| 341 | REAL_GAP | `src/room.ts` | 461 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `4999` |
| 342 | REAL_GAP | `src/room.ts` | 465 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `5009` |
| 343 | REAL_GAP | `src/room.ts` | 469 | `ConditionalExpression` | `request.method === 'GET'` | `true` | HTTP method guard forced true | `5019` |
| 344 | REAL_GAP | `src/room.ts` | 475 | `ConditionalExpression` | `request.method === 'GET'` | `true` | HTTP method guard forced true | `5029` |
| 345 | REAL_GAP | `src/room.ts` | 486 | `ConditionalExpression` | `request.method === 'POST'` | `true` | HTTP method guard forced true | `5039` |
| 346 | REAL_GAP | `src/room.ts` | 500 | `ConditionalExpression` | `uid === null` | `false` | condition→false disables branch: 'uid === null' | `5051` |
| 347 | REAL_GAP | `src/room.ts` | 506 | `ConditionalExpression` | `uid === null` | `false` | condition→false disables branch: 'uid === null' | `5057` |
| 348 | REAL_GAP | `src/room.ts` | 508 | `ConditionalExpression` | `access === 'private'` | `true` | authz/session condition forced true | `5061` |
| 349 | REAL_GAP | `src/room.ts` | 519 | `ConditionalExpression` | `this.#accessMeta` | `false` | condition→false disables branch: 'this.#accessMeta' | `5069` |
| 350 | REAL_GAP | `src/room.ts` | 541 | `ConditionalExpression` | `stored.has(key)` | `true` | guard/discriminant forced true: 'stored.has(key)' | `5075` |
| 351 | REAL_GAP | `src/room.ts` | 571 | `ConditionalExpression` | `parsed.value.dryRun` | `true` | guard/discriminant forced true: 'parsed.value.dryRun' | `5095` |
| 352 | REAL_GAP | `src/room.ts` | 614 | `BooleanLiteral` | `false` | `true` | boolean false→true changes flag/default | `5123` |
| 353 | REAL_GAP | `src/room.ts` | 707 | `LogicalOperator` | `roomName ?? this.#ownName` | `roomName && this.#ownName` | nullish coalescing mutated: roomName ?? this.#ownName → roomName && this.#ownName | `5177` |
| 354 | REAL_GAP | `src/room.ts` | 708 | `ConditionalExpression` | `broadcastRoom` | `true` | guard/discriminant forced true: 'broadcastRoom' | `5178` |
| 355 | REAL_GAP | `src/room.ts` | 777 | `BooleanLiteral` | `false` | `true` | boolean false→true changes flag/default | `5204` |
| 356 | REAL_GAP | `src/room.ts` | 815 | `ConditionalExpression` | `!sibling` | `false` | condition→false disables branch: '!sibling' | `5221` |
| 357 | REAL_GAP | `src/room.ts` | 822 | `StringLiteral` | `'DELETE'` | `""` | protocol/discriminant/default token 'DELETE' emptied | `5225` |
| 358 | REAL_GAP | `src/room.ts` | 823 | `ConditionalExpression` | `uid === null` | `false` | condition→false disables branch: 'uid === null' | `5227` |
| 359 | REAL_GAP | `src/room.ts` | 873 | `ConditionalExpression` | `a1 === '#url'` | `true` | guard/discriminant forced true: "a1 === '#url'" | `5249` |
| 360 | REAL_GAP | `src/room.ts` | 874 | `ConditionalExpression` | `a2 === '#url'` | `true` | guard/discriminant forced true: "a2 === '#url'" | `5257` |
| 361 | REAL_GAP | `src/room.ts` | 979 | `StringLiteral` | `'https://do.local/_do/install'` | `""` | wire-visible message/reason "'https://do.local/_do/install'" emptied — clients can observe body/close reason | `5294` |
| 362 | REAL_GAP | `src/room.ts` | 980 | `StringLiteral` | `'POST'` | `""` | wire-visible message/reason "'POST'" emptied — clients can observe body/close reason | `5296` |
| 363 | REAL_GAP | `src/room.ts` | 982 | `ObjectLiteral` | `{ 'Content-Type': 'application/json' }` | `{}` | fetch init emptied | `5298` |
| 364 | REAL_GAP | `src/room.ts` | 982 | `StringLiteral` | `'application/json'` | `""` | wire-visible message/reason "'application/json'" emptied — clients can observe body/close reason | `5299` |
| 365 | REAL_GAP | `src/room.ts` | 995 | `StringLiteral` | `'OK'` | `""` | wire-visible message/reason "'OK'" emptied — clients can observe body/close reason | `5307` |
| 366 | REAL_GAP | `src/room.ts` | 1024 | `StringLiteral` | ``https://do.local/_do/snapshot?name=${encodeURIComponent(to)}`` | ```` | wire-visible message/reason '`https://do.local/_do/snapshot?name=${encodeURIComponent(to)}`' emptied — clients can observe body/close reason | `5322` |
| 367 | REAL_GAP | `src/room.ts` | 1030 | `StringLiteral` | `'OK'` | `""` | wire-visible message/reason "'OK'" emptied — clients can observe body/close reason | `5333` |
| 368 | REAL_GAP | `src/room.ts` | 1074 | `ConditionalExpression` | `payload.snapshot.length > 0` | `false` | condition→false disables branch: 'payload.snapshot.length > 0' | `5348` |
| 369 | REAL_GAP | `src/room.ts` | 1078 | `MethodExpression` | `(payload.log as string[]).slice(-LOG_RING)` | `payload.log as string[]` | ring slice removed | `5355` |
| 370 | REAL_GAP | `src/room.ts` | 1133 | `EqualityOperator` | `payload.audit.length > 0` | `payload.audit.length >= 0` | empty admitted as non-empty | `5386` |
| 371 | REAL_GAP | `src/room.ts` | 1145 | `EqualityOperator` | `payload.chat.length > 0` | `payload.chat.length >= 0` | empty admitted as non-empty | `5393` |
| 372 | REAL_GAP | `src/room.ts` | 1197 | `ConditionalExpression` | `chunksRaw === null` | `false` | condition→false disables branch: 'chunksRaw === null' | `5406` |
| 373 | REAL_GAP | `src/room.ts` | 1202 | `ConditionalExpression` | `chunks < 1` | `false` | condition→false disables branch: 'chunks < 1' | `5424` |
| 374 | REAL_GAP | `src/room.ts` | 1203 | `EqualityOperator` | `chunks > MAX_SNAPSHOT_CHUNKS` | `chunks >= MAX_SNAPSHOT_CHUNKS` | boundary/relational chunks > MAX_SNAPSHOT_CHUNKS → chunks >= MAX_SNAPSHOT_CHUNKS | `5428` |
| 375 | REAL_GAP | `src/room.ts` | 1211 | `EqualityOperator` | `bytes.byteLength > SNAPSHOT_CHUNK_BYTES` | `bytes.byteLength >= SNAPSHOT_CHUNK_BYTES` | boundary/relational bytes.byteLength > SNAPSHOT_CHUNK_BYTES → bytes.byteLength >= SNAPSHOT_CHUNK_BYTES | `5438` |
| 376 | REAL_GAP | `src/room.ts` | 1231 | `EqualityOperator` | `i < priorMeta.chunks` | `i <= priorMeta.chunks` | loop/index bound < → <=  | `5457` |
| 377 | REAL_GAP | `src/room.ts` | 1261 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `5476` |
| 378 | REAL_GAP | `src/room.ts` | 1262 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `5477` |
| 379 | REAL_GAP | `src/room.ts` | 1276 | `MethodExpression` | `(log as string[]).slice(-LOG_RING)` | `log as string[]` | ring slice removed | `5502` |
| 380 | REAL_GAP | `src/room.ts` | 1284 | `EqualityOperator` | `i < logTail.length` | `i <= logTail.length` | loop/index bound < → <=  | `5507` |
| 381 | REAL_GAP | `src/room.ts` | 1287 | `EqualityOperator` | `i < audit.length` | `i <= audit.length` | loop/index bound < → <=  | `5512` |
| 382 | REAL_GAP | `src/room.ts` | 1298 | `StringLiteral` | `'OK'` | `""` | wire-visible message/reason "'OK'" emptied — clients can observe body/close reason | `5516` |
| 383 | REAL_GAP | `src/room.ts` | 1312 | `ConditionalExpression` | `uid === null \|\| uid.length === 0` | `false` | condition→false disables branch: 'uid === null \|\| uid.length === 0' | `5520` |
| 384 | REAL_GAP | `src/room.ts` | 1312 | `ConditionalExpression` | `uid.length === 0` | `false` | condition→false disables branch: 'uid.length === 0' | `5524` |
| 385 | REAL_GAP | `src/room.ts` | 1312 | `BlockStatement` | `{ ⏎       return plainResponse('Forbidden', 403); ⏎     }` | `{}` | removed return/reject — fallthrough | `5526` |
| 386 | REAL_GAP | `src/room.ts` | 1321 | `ConditionalExpression` | `raw === null` | `false` | condition→false disables branch: 'raw === null' | `5534` |
| 387 | REAL_GAP | `src/room.ts` | 1332 | `StringLiteral` | `'init-private snapshot exceeds sheet limits'` | `""` | wire-visible message/reason "'init-private snapshot exceeds sheet limits'" emptied — clients can observe body/close reason | `5557` |
| 388 | REAL_GAP | `src/room.ts` | 1337 | `ConditionalExpression` | `typeof acl !== 'object'` | `false` | condition→false disables branch: "typeof acl !== 'object'" | `5582` |
| 389 | REAL_GAP | `src/room.ts` | 1343 | `ConditionalExpression` | `typeof r === 'string'` | `true` | validation guard forced true | `5601` |
| 390 | REAL_GAP | `src/room.ts` | 1346 | `ConditionalExpression` | `typeof w === 'string'` | `true` | validation guard forced true | `5616` |
| 391 | REAL_GAP | `src/room.ts` | 1365 | `ConditionalExpression` | `group === undefined` | `false` | condition→false disables branch: 'group === undefined' | `5644` |
| 392 | REAL_GAP | `src/room.ts` | 1370 | `ObjectLiteral` | `{ limit: 1 }` | `{}` | storage list options stripped | `5649` |
| 393 | REAL_GAP | `src/room.ts` | 1429 | `ConditionalExpression` | `typeof cellRecord.formula === 'string' && cellRecord.formula.length > 0` | `false` | condition→false disables branch: "typeof cellRecord.formula === 'string' && cellRecord.formula.length > " | `5675` |
| 394 | REAL_GAP | `src/room.ts` | 1429 | `StringLiteral` | `'string'` | `""` | wire-visible message/reason "'string'" emptied — clients can observe body/close reason | `5679` |
| 395 | REAL_GAP | `src/room.ts` | 1429 | `ConditionalExpression` | `cellRecord.formula.length > 0` | `true` | length guard forced true | `5680` |
| 396 | REAL_GAP | `src/room.ts` | 1429 | `EqualityOperator` | `cellRecord.formula.length > 0` | `cellRecord.formula.length >= 0` | empty admitted as non-empty | `5681` |
| 397 | REAL_GAP | `src/room.ts` | 1429 | `EqualityOperator` | `cellRecord.formula.length > 0` | `cellRecord.formula.length <= 0` | non-empty check polarity inverted | `5682` |
| 398 | REAL_GAP | `src/room.ts` | 1432 | `ConditionalExpression` | `typeof cellRecord.datavalue === 'string'` | `true` | validation guard forced true | `5684` |
| 399 | REAL_GAP | `src/room.ts` | 1432 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `5688` |
| 400 | REAL_GAP | `src/room.ts` | 1465 | `StringLiteral` | `'X-EC-Uid'` | `""` | protocol/discriminant/default token 'X-EC-Uid' emptied | `5710` |
| 401 | REAL_GAP | `src/room.ts` | 1466 | `StringLiteral` | `'X-EC-Session-Exp'` | `""` | protocol/discriminant/default token 'X-EC-Session-Exp' emptied | `5711` |
| 402 | REAL_GAP | `src/room.ts` | 1467 | `StringLiteral` | `'X-EC-Session'` | `""` | protocol/discriminant/default token 'X-EC-Session' emptied | `5712` |
| 403 | REAL_GAP | `src/room.ts` | 1470 | `ConditionalExpression` | `sessionExpHeader === null` | `true` | nullish guard forced true | `5713` |
| 404 | REAL_GAP | `src/room.ts` | 1470 | `ConditionalExpression` | `sessionExpHeader === null` | `false` | condition→false disables branch: 'sessionExpHeader === null' | `5714` |
| 405 | REAL_GAP | `src/room.ts` | 1470 | `EqualityOperator` | `sessionExpHeader === null` | `sessionExpHeader !== null` | null check inverted | `5715` |
| 406 | REAL_GAP | `src/room.ts` | 1472 | `ObjectLiteral` | `{ ⏎       ...(isSandstormEnforced(this.#env) ⏎         ? { sandstormModify: sandstormCanModify(request.headers) } ⏎         : {}), ⏎       ...(uid === null ? {} : { uid }), ⏎       ...(sessionExp === null \|\| !Number.isFinite(sessionExp) ⏎         ? {} ⏎         : { sessionExp }), ⏎       ...(session === null ? {} : { session }), ⏎     }` | `{}` | payload/options object emptied | `5716` |
| 407 | REAL_GAP | `src/room.ts` | 1474 | `ObjectLiteral` | `{ sandstormModify: sandstormCanModify(request.headers) }` | `{}` | payload/options object emptied | `5717` |
| 408 | REAL_GAP | `src/room.ts` | 1476 | `ConditionalExpression` | `uid === null` | `true` | nullish guard forced true | `5718` |
| 409 | REAL_GAP | `src/room.ts` | 1476 | `ConditionalExpression` | `uid === null` | `false` | condition→false disables branch: 'uid === null' | `5719` |
| 410 | REAL_GAP | `src/room.ts` | 1476 | `EqualityOperator` | `uid === null` | `uid !== null` | null check inverted | `5720` |
| 411 | REAL_GAP | `src/room.ts` | 1476 | `ObjectLiteral` | `{ uid }` | `{}` | payload/options object emptied | `5721` |
| 412 | REAL_GAP | `src/room.ts` | 1477 | `ConditionalExpression` | `sessionExp === null \|\| !Number.isFinite(sessionExp)` | `true` | validation guard forced true | `5722` |
| 413 | REAL_GAP | `src/room.ts` | 1477 | `ConditionalExpression` | `sessionExp === null \|\| !Number.isFinite(sessionExp)` | `false` | condition→false disables branch: 'sessionExp === null \|\| !Number.isFinite(sessionExp)' | `5723` |
| 414 | REAL_GAP | `src/room.ts` | 1477 | `ConditionalExpression` | `sessionExp === null` | `false` | condition→false disables branch: 'sessionExp === null' | `5725` |
| 415 | REAL_GAP | `src/room.ts` | 1477 | `EqualityOperator` | `sessionExp === null` | `sessionExp !== null` | null check inverted | `5726` |
| 416 | REAL_GAP | `src/room.ts` | 1477 | `LogicalOperator` | `sessionExp === null \|\| !Number.isFinite(sessionExp)` | `sessionExp === null && !Number.isFinite(sessionExp)` | logical operator change alters short-circuit accept set: 'sessionExp === null \|\| !Number.isFinite(sessionExp' → 'sessionExp === null && !Number.isFinite(sessionExp' | `5724` |
| 417 | REAL_GAP | `src/room.ts` | 1480 | `ConditionalExpression` | `session === null` | `true` | nullish guard forced true | `5729` |
| 418 | REAL_GAP | `src/room.ts` | 1480 | `ConditionalExpression` | `session === null` | `false` | condition→false disables branch: 'session === null' | `5730` |
| 419 | REAL_GAP | `src/room.ts` | 1480 | `EqualityOperator` | `session === null` | `session !== null` | null check inverted | `5731` |
| 420 | REAL_GAP | `src/room.ts` | 1519 | `ObjectLiteral` | `{ user: '', room: '', auth: '' }` | `{}` | default attachment fields object emptied | `5749` |
| 421 | REAL_GAP | `src/room.ts` | 1519 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `5750` |
| 422 | REAL_GAP | `src/room.ts` | 1519 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `5751` |
| 423 | REAL_GAP | `src/room.ts` | 1519 | `StringLiteral` | `''` | `"Stryker was here!"` | default/literal "''" replaced with marker — value can be stored, returned, or compared | `5752` |
| 424 | REAL_GAP | `src/room.ts` | 1521 | `ConditionalExpression` | `typeof message === 'string'` | `true` | validation guard forced true | `5753` |
| 425 | REAL_GAP | `src/room.ts` | 1522 | `EqualityOperator` | `messageSize > MAX_WS_FRAME_CHARS` | `messageSize >= MAX_WS_FRAME_CHARS` | boundary/relational messageSize > MAX_WS_FRAME_CHARS → messageSize >= MAX_WS_FRAME_CHARS | `5759` |
| 426 | REAL_GAP | `src/room.ts` | 1524 | `StringLiteral` | `'Message too large'` | `""` | wire-visible message/reason "'Message too large'" emptied — clients can observe body/close reason | `5763` |
| 427 | REAL_GAP | `src/room.ts` | 1531 | `ConditionalExpression` | `typeof message !== 'string'` | `false` | condition→false disables branch: "typeof message !== 'string'" | `5767` |
| 428 | REAL_GAP | `src/room.ts` | 1554 | `ConditionalExpression` | `'user' in parsed` | `true` | guard/discriminant forced true: "'user' in parsed" | `5790` |
| 429 | REAL_GAP | `src/room.ts` | 1556 | `LogicalOperator` | `'auth' in parsed && typeof parsed.auth === 'string'` | `'auth' in parsed \|\| typeof parsed.auth === 'string'` | logical operator change alters short-circuit accept set: "'auth' in parsed && typeof parsed.auth === 'string" → "'auth' in parsed \|\| typeof parsed.auth === 'string" | `5795` |
| 430 | REAL_GAP | `src/room.ts` | 1556 | `ConditionalExpression` | `typeof parsed.auth === 'string'` | `true` | validation guard forced true | `5797` |
| 431 | REAL_GAP | `src/room.ts` | 1573 | `ConditionalExpression` | `typeof startedAt === 'number' && ⏎       Number.isFinite(startedAt) && ⏎       now >= startedAt` | `true` | validation guard forced true | `5804` |
| 432 | REAL_GAP | `src/room.ts` | 1573 | `ConditionalExpression` | `typeof startedAt === 'number' && ⏎       Number.isFinite(startedAt)` | `true` | validation guard forced true | `5806` |
| 433 | REAL_GAP | `src/room.ts` | 1573 | `ConditionalExpression` | `typeof startedAt === 'number'` | `true` | validation guard forced true | `5808` |
| 434 | REAL_GAP | `src/room.ts` | 1573 | `LogicalOperator` | `typeof startedAt === 'number' && ⏎       Number.isFinite(startedAt) && ⏎       now >= startedAt` | `typeof startedAt === 'number' && Number.isFinite(startedAt) \|\| now >= startedAt` | logical operator change alters short-circuit accept set: "typeof startedAt === 'number' &&\\n      Number.isFi" → "typeof startedAt === 'number' && Number.isFinite(s" | `5805` |
| 435 | REAL_GAP | `src/room.ts` | 1573 | `LogicalOperator` | `typeof startedAt === 'number' && ⏎       Number.isFinite(startedAt)` | `typeof startedAt === 'number' \|\| Number.isFinite(startedAt)` | logical operator change alters short-circuit accept set: "typeof startedAt === 'number' &&\\n      Number.isFi" → "typeof startedAt === 'number' \|\| Number.isFinite(s" | `5807` |
| 436 | REAL_GAP | `src/room.ts` | 1575 | `ConditionalExpression` | `now >= startedAt` | `true` | rate/time condition forced true | `5811` |
| 437 | REAL_GAP | `src/room.ts` | 1578 | `ConditionalExpression` | `typeof attachment.rateMessageCount === 'number' && ⏎       Number.isFinite(attachment.rateMessageCount) && ⏎       attachment.rateMessageCount >= 0` | `true` | validation guard forced true | `5818` |
| 438 | REAL_GAP | `src/room.ts` | 1578 | `ConditionalExpression` | `typeof attachment.rateMessageCount === 'number' && ⏎       Number.isFinite(attachment.rateMessageCount)` | `true` | validation guard forced true | `5821` |
| 439 | REAL_GAP | `src/room.ts` | 1578 | `ConditionalExpression` | `typeof attachment.rateMessageCount === 'number'` | `true` | validation guard forced true | `5823` |
| 440 | REAL_GAP | `src/room.ts` | 1578 | `LogicalOperator` | `typeof attachment.rateMessageCount === 'number' && ⏎       Number.isFinite(attachment.rateMessageCount) && ⏎       attachment.rateMessageCount >= 0` | `typeof attachment.rateMessageCount === 'number' && Number.isFinite(attachment.rateMessageCount) \|\| attachment.rateMessageCount >= 0` | logical operator change alters short-circuit accept set: "typeof attachment.rateMessageCount === 'number' &&" → "typeof attachment.rateMessageCount === 'number' &&" | `5820` |
| 441 | REAL_GAP | `src/room.ts` | 1578 | `LogicalOperator` | `typeof attachment.rateMessageCount === 'number' && ⏎       Number.isFinite(attachment.rateMessageCount)` | `typeof attachment.rateMessageCount === 'number' \|\| Number.isFinite(attachment.rateMessageCount)` | logical operator change alters short-circuit accept set: "typeof attachment.rateMessageCount === 'number' &&" → "typeof attachment.rateMessageCount === 'number' \|\|" | `5822` |
| 442 | REAL_GAP | `src/room.ts` | 1580 | `ConditionalExpression` | `attachment.rateMessageCount >= 0` | `true` | rate/time condition forced true | `5826` |
| 443 | REAL_GAP | `src/room.ts` | 1580 | `EqualityOperator` | `attachment.rateMessageCount >= 0` | `attachment.rateMessageCount > 0` | boundary/relational attachment.rateMessageCount >= 0 → attachment.rateMessageCount > 0 | `5827` |
| 444 | REAL_GAP | `src/room.ts` | 1589 | `ConditionalExpression` | `this.#roomRateWindowStartedAt === 0` | `true` | rate/time condition forced true | `5830` |
| 445 | REAL_GAP | `src/room.ts` | 1594 | `ConditionalExpression` | `peer === ws` | `false` | condition→false disables branch: 'peer === ws' | `5837` |
| 446 | REAL_GAP | `src/room.ts` | 1594 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `5839` |
| 447 | REAL_GAP | `src/room.ts` | 1598 | `BlockStatement` | `{ ⏎           continue; ⏎         }` | `{}` | removed continue | `5841` |
| 448 | REAL_GAP | `src/room.ts` | 1604 | `ConditionalExpression` | `typeof peerStartedAt === 'number' && ⏎           Number.isFinite(peerStartedAt)` | `true` | validation guard forced true | `5855` |
| 449 | REAL_GAP | `src/room.ts` | 1604 | `ConditionalExpression` | `typeof peerStartedAt === 'number'` | `true` | validation guard forced true | `5857` |
| 450 | REAL_GAP | `src/room.ts` | 1604 | `LogicalOperator` | `typeof peerStartedAt === 'number' && ⏎           Number.isFinite(peerStartedAt)` | `typeof peerStartedAt === 'number' \|\| Number.isFinite(peerStartedAt)` | logical operator change alters short-circuit accept set: "typeof peerStartedAt === 'number' &&\\n          Num" → "typeof peerStartedAt === 'number' \|\| Number.isFini" | `5856` |
| 451 | REAL_GAP | `src/room.ts` | 1607 | `ConditionalExpression` | `now - peerStartedAt < WS_RATE_WINDOW_MS` | `true` | rate/time condition forced true | `5863` |
| 452 | REAL_GAP | `src/room.ts` | 1607 | `EqualityOperator` | `now - peerStartedAt < WS_RATE_WINDOW_MS` | `now - peerStartedAt <= WS_RATE_WINDOW_MS` | boundary/relational now - peerStartedAt < WS_RATE_WINDOW_MS → now - peerStartedAt <= WS_RATE_WINDOW_MS | `5864` |
| 453 | REAL_GAP | `src/room.ts` | 1608 | `ConditionalExpression` | `typeof peerCount === 'number'` | `true` | validation guard forced true | `5867` |
| 454 | REAL_GAP | `src/room.ts` | 1610 | `ConditionalExpression` | `peerCount >= 0` | `true` | guard/discriminant forced true: 'peerCount >= 0' | `5870` |
| 455 | REAL_GAP | `src/room.ts` | 1610 | `EqualityOperator` | `peerCount >= 0` | `peerCount > 0` | boundary/relational peerCount >= 0 → peerCount > 0 | `5871` |
| 456 | REAL_GAP | `src/room.ts` | 1612 | `MethodExpression` | `Math.min(restoredStartedAt, peerStartedAt)` | `Math.max(restoredStartedAt, peerStartedAt)` | min→max | `5874` |
| 457 | REAL_GAP | `src/room.ts` | 1613 | `MethodExpression` | `Math.min(peerCount, MAX_WS_MESSAGES_PER_WINDOW)` | `Math.max(peerCount, MAX_WS_MESSAGES_PER_WINDOW)` | min→max | `5876` |
| 458 | REAL_GAP | `src/room.ts` | 1616 | `ConditionalExpression` | `!sawCurrentSocket && inCurrentWindow` | `true` | rate/time condition forced true | `5877` |
| 459 | REAL_GAP | `src/room.ts` | 1616 | `LogicalOperator` | `!sawCurrentSocket && inCurrentWindow` | `!sawCurrentSocket \|\| inCurrentWindow` | logical operator change alters short-circuit accept set: '!sawCurrentSocket && inCurrentWindow' → '!sawCurrentSocket \|\| inCurrentWindow' | `5879` |
| 460 | REAL_GAP | `src/room.ts` | 1617 | `MethodExpression` | `Math.min(restoredStartedAt, rateWindowStartedAt)` | `Math.max(restoredStartedAt, rateWindowStartedAt)` | min→max | `5882` |
| 461 | REAL_GAP | `src/room.ts` | 1618 | `MethodExpression` | `Math.min(priorCount, MAX_WS_MESSAGES_PER_WINDOW)` | `Math.max(priorCount, MAX_WS_MESSAGES_PER_WINDOW)` | min→max | `5884` |
| 462 | REAL_GAP | `src/room.ts` | 1625 | `ConditionalExpression` | `now >= this.#roomRateWindowStartedAt && ⏎       now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS` | `true` | rate/time condition forced true | `5885` |
| 463 | REAL_GAP | `src/room.ts` | 1625 | `ConditionalExpression` | `now >= this.#roomRateWindowStartedAt` | `true` | rate/time condition forced true | `5888` |
| 464 | REAL_GAP | `src/room.ts` | 1625 | `LogicalOperator` | `now >= this.#roomRateWindowStartedAt && ⏎       now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS` | `now >= this.#roomRateWindowStartedAt \|\| now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS` | logical operator change alters short-circuit accept set: 'now >= this.#roomRateWindowStartedAt &&\\n      now ' → 'now >= this.#roomRateWindowStartedAt \|\| now - this' | `5887` |
| 465 | REAL_GAP | `src/room.ts` | 1626 | `ConditionalExpression` | `now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS` | `true` | rate/time condition forced true | `5891` |
| 466 | REAL_GAP | `src/room.ts` | 1626 | `EqualityOperator` | `now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS` | `now - this.#roomRateWindowStartedAt <= WS_RATE_WINDOW_MS` | boundary/relational now - this.#roomRateWindowStartedAt < WS_RATE_WINDOW_MS → now - this.#roomRateWindowStartedAt <= WS_RATE_WINDOW_MS | `5892` |
| 467 | REAL_GAP | `src/room.ts` | 1627 | `ConditionalExpression` | `roomInCurrentWindow` | `true` | rate/time condition forced true | `5895` |
| 468 | REAL_GAP | `src/room.ts` | 1629 | `BlockStatement` | `{ ⏎       this.#roomRateWindowStartedAt = now; ⏎       this.#roomRateMessageCount = 1; ⏎     }` | `{}` | removed block side effects | `5899` |
| 469 | REAL_GAP | `src/room.ts` | 1639 | `BlockStatement` | `{ ⏎       try { ⏎         ws.close(1011, 'Attachment state unavailable'); ⏎       } catch { ⏎         // The peer may already be gone. ⏎       } ⏎       return true; ⏎     }` | `{}` | removed return/reject — fallthrough | `5902` |
| 470 | REAL_GAP | `src/room.ts` | 1640 | `BlockStatement` | `{ ⏎         ws.close(1011, 'Attachment state unavailable'); ⏎       }` | `{}` | removed ws.close on error path | `5903` |
| 471 | REAL_GAP | `src/room.ts` | 1641 | `StringLiteral` | `'Attachment state unavailable'` | `""` | wire-visible message/reason "'Attachment state unavailable'" emptied — clients can observe body/close reason | `5904` |
| 472 | REAL_GAP | `src/room.ts` | 1645 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `5905` |
| 473 | REAL_GAP | `src/room.ts` | 1647 | `EqualityOperator` | `rateMessageCount > MAX_WS_MESSAGES_PER_WINDOW` | `rateMessageCount >= MAX_WS_MESSAGES_PER_WINDOW` | boundary/relational rateMessageCount > MAX_WS_MESSAGES_PER_WINDOW → rateMessageCount >= MAX_WS_MESSAGES_PER_WINDOW | `5908` |
| 474 | REAL_GAP | `src/room.ts` | 1649 | `EqualityOperator` | `this.#roomRateMessageCount > MAX_ROOM_WS_MESSAGES_PER_WINDOW` | `this.#roomRateMessageCount >= MAX_ROOM_WS_MESSAGES_PER_WINDOW` | boundary/relational this.#roomRateMessageCount > MAX_ROOM_WS_MESSAGES_PER_WINDOW → this.#roomRateMessageCount >= MAX_ROOM_WS_MESSAGES_PER_WINDOW | `5912` |
| 475 | REAL_GAP | `src/room.ts` | 1659 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `5923` |
| 476 | REAL_GAP | `src/room.ts` | 1684 | `ConditionalExpression` | `packet.type === PacketType.Heartbeat` | `false` | condition→false disables branch: 'packet.type === PacketType.Heartbeat' | `5935` |
| 477 | REAL_GAP | `src/room.ts` | 1685 | `ConditionalExpression` | `packet.type !== PacketType.Event` | `false` | condition→false disables branch: 'packet.type !== PacketType.Event' | `5938` |
| 478 | REAL_GAP | `src/room.ts` | 1705 | `StringLiteral` | `'POST'` | `""` | protocol/discriminant/default token 'POST' emptied | `5960` |
| 479 | REAL_GAP | `src/room.ts` | 1716 | `ConditionalExpression` | `parsed.type !== 'ask.recalc'` | `true` | guard/discriminant forced true: "parsed.type !== 'ask.recalc'" | `5964` |
| 480 | REAL_GAP | `src/room.ts` | 1716 | `StringLiteral` | `'ask.recalc'` | `""` | protocol/discriminant/default token 'ask.recalc' emptied | `5966` |
| 481 | REAL_GAP | `src/room.ts` | 1717 | `ConditionalExpression` | `'user' in parsed` | `true` | guard/discriminant forced true: "'user' in parsed" | `5969` |
| 482 | REAL_GAP | `src/room.ts` | 1717 | `ConditionalExpression` | `'user' in parsed` | `false` | condition→false disables branch: "'user' in parsed" | `5970` |
| 483 | REAL_GAP | `src/room.ts` | 1717 | `StringLiteral` | `'user'` | `""` | protocol/discriminant/default token 'user' emptied | `5971` |
| 484 | REAL_GAP | `src/room.ts` | 1719 | `LogicalOperator` | `'auth' in parsed && typeof parsed.auth === 'string'` | `'auth' in parsed \|\| typeof parsed.auth === 'string'` | logical operator change alters short-circuit accept set: "'auth' in parsed && typeof parsed.auth === 'string" → "'auth' in parsed \|\| typeof parsed.auth === 'string" | `5974` |
| 485 | REAL_GAP | `src/room.ts` | 1719 | `ConditionalExpression` | `typeof parsed.auth === 'string'` | `true` | validation guard forced true | `5976` |
| 486 | REAL_GAP | `src/room.ts` | 1757 | `ArrowFunction` | `(prefix) => this.#listPrefix(prefix)` | `() => undefined` | callback neutered | `5982` |
| 487 | REAL_GAP | `src/room.ts` | 1764 | `ConditionalExpression` | `prefix === STORAGE_KEYS.ecellPrefix` | `true` | guard/discriminant forced true: 'prefix === STORAGE_KEYS.ecellPrefix' | `5985` |
| 488 | REAL_GAP | `src/room.ts` | 1764 | `ConditionalExpression` | `prefix === STORAGE_KEYS.ecellPrefix` | `false` | condition→false disables branch: 'prefix === STORAGE_KEYS.ecellPrefix' | `5986` |
| 489 | REAL_GAP | `src/room.ts` | 1764 | `EqualityOperator` | `prefix === STORAGE_KEYS.ecellPrefix` | `prefix !== STORAGE_KEYS.ecellPrefix` | storage prefix branch inverted — ecell LRU cap bypassed or wrong path | `5987` |
| 490 | REAL_GAP | `src/room.ts` | 1785 | `LogicalOperator` | `attachment.uid ?? null` | `attachment.uid && null` | nullish coalescing mutated: attachment.uid ?? null → attachment.uid && null | `5996` |
| 491 | REAL_GAP | `src/room.ts` | 1803 | `ConditionalExpression` | `!applied` | `true` | guard/discriminant forced true: '!applied' | `6000` |
| 492 | REAL_GAP | `src/room.ts` | 1828 | `ConditionalExpression` | `messageAuth === '0'` | `false` | condition→false disables branch: "messageAuth === '0'" | `6016` |
| 493 | REAL_GAP | `src/room.ts` | 1828 | `StringLiteral` | `'0'` | `""` | protocol/discriminant/default token '0' emptied | `6018` |
| 494 | REAL_GAP | `src/room.ts` | 1840 | `ConditionalExpression` | `uid === undefined` | `false` | condition→false disables branch: 'uid === undefined' | `6026` |
| 495 | REAL_GAP | `src/room.ts` | 1851 | `ConditionalExpression` | `access === 'public'` | `false` | condition→false disables branch: "access === 'public'" | `6036` |
| 496 | REAL_GAP | `src/room.ts` | 1851 | `StringLiteral` | `'public'` | `""` | protocol/discriminant/default token 'public' emptied | `6038` |
| 497 | REAL_GAP | `src/room.ts` | 1861 | `OptionalChaining` | `init?.headers` | `init.headers` | optional chaining removed — may throw | `6042` |
| 498 | REAL_GAP | `src/room.ts` | 1863 | `ConditionalExpression` | `uid !== undefined` | `true` | nullish guard forced true | `6044` |
| 499 | REAL_GAP | `src/room.ts` | 1878 | `ConditionalExpression` | `stored === undefined` | `true` | nullish guard forced true | `6050` |
| 500 | REAL_GAP | `src/room.ts` | 1878 | `EqualityOperator` | `stored === undefined` | `stored !== undefined` | undefined check inverted | `6052` |
| 501 | REAL_GAP | `src/room.ts` | 1887 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `6058` |
| 502 | REAL_GAP | `src/room.ts` | 1893 | `ConditionalExpression` | `typeof sessionExp === 'number' && ⏎       Number.isFinite(sessionExp)` | `true` | validation guard forced true | `6069` |
| 503 | REAL_GAP | `src/room.ts` | 1893 | `ConditionalExpression` | `typeof sessionExp === 'number'` | `true` | validation guard forced true | `6071` |
| 504 | REAL_GAP | `src/room.ts` | 1893 | `LogicalOperator` | `typeof sessionExp === 'number' && ⏎       Number.isFinite(sessionExp)` | `typeof sessionExp === 'number' \|\| Number.isFinite(sessionExp)` | logical operator change alters short-circuit accept set: "typeof sessionExp === 'number' &&\\n      Number.isF" → "typeof sessionExp === 'number' \|\| Number.isFinite(" | `6070` |
| 505 | REAL_GAP | `src/room.ts` | 1895 | `EqualityOperator` | `Date.now() < sessionExp` | `Date.now() <= sessionExp` | boundary/relational Date.now() < sessionExp → Date.now() <= sessionExp | `6075` |
| 506 | REAL_GAP | `src/room.ts` | 1900 | `StringLiteral` | `'Session expired'` | `""` | wire-visible message/reason "'Session expired'" emptied — clients can observe body/close reason | `6080` |
| 507 | REAL_GAP | `src/room.ts` | 1925 | `EqualityOperator` | `this.#sessionVerifications.size <= SESSION_VERIFY_CAP` | `this.#sessionVerifications.size < SESSION_VERIFY_CAP` | boundary/relational this.#sessionVerifications.size <= SESSION_VERIFY_CAP → this.#sessionVerifications.size < SESSION_VERIFY_CAP | `6097` |
| 508 | REAL_GAP | `src/room.ts` | 1934 | `StringLiteral` | `'read'` | `""` | protocol/discriminant/default token 'read' emptied | `6099` |
| 509 | REAL_GAP | `src/room.ts` | 1940 | `BlockStatement` | `{ ⏎         try { ⏎           ws.close(1008, 'Session invalid'); ⏎         } catch { ⏎           // The socket may already be closed. ⏎         } ⏎         return true; ⏎       }` | `{}` | removed return/reject — fallthrough | `6106` |
| 510 | REAL_GAP | `src/room.ts` | 1942 | `StringLiteral` | `'Session invalid'` | `""` | wire-visible message/reason "'Session invalid'" emptied — clients can observe body/close reason | `6108` |
| 511 | REAL_GAP | `src/room.ts` | 1946 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `6109` |
| 512 | REAL_GAP | `src/room.ts` | 1953 | `ConditionalExpression` | `!stored \|\| ⏎       stored.uid === undefined \|\| ⏎       stored.session === undefined` | `false` | condition→false disables branch: '!stored \|\|\\n      stored.uid === undefined \|\|\\n      stored.session === ' | `6119` |
| 513 | REAL_GAP | `src/room.ts` | 1953 | `ConditionalExpression` | `!stored \|\| ⏎       stored.uid === undefined` | `false` | condition→false disables branch: '!stored \|\|\\n      stored.uid === undefined' | `6121` |
| 514 | REAL_GAP | `src/room.ts` | 1953 | `LogicalOperator` | `!stored \|\| ⏎       stored.uid === undefined \|\| ⏎       stored.session === undefined` | `(!stored \|\| stored.uid === undefined) && stored.session === undefined` | logical operator change alters short-circuit accept set: '!stored \|\|\\n      stored.uid === undefined \|\|\\n     ' → '(!stored \|\| stored.uid === undefined) && stored.se' | `6120` |
| 515 | REAL_GAP | `src/room.ts` | 1953 | `LogicalOperator` | `!stored \|\| ⏎       stored.uid === undefined` | `!stored && stored.uid === undefined` | logical operator change alters short-circuit accept set: '!stored \|\|\\n      stored.uid === undefined' → '!stored && stored.uid === undefined' | `6122` |
| 516 | REAL_GAP | `src/room.ts` | 1954 | `ConditionalExpression` | `stored.uid === undefined` | `false` | condition→false disables branch: 'stored.uid === undefined' | `6124` |
| 517 | REAL_GAP | `src/room.ts` | 1955 | `ConditionalExpression` | `stored.session === undefined` | `false` | condition→false disables branch: 'stored.session === undefined' | `6126` |
| 518 | REAL_GAP | `src/room.ts` | 1956 | `BlockStatement` | `{ ⏎       try { ⏎         ws.close(1008, 'Session invalid'); ⏎       } catch { ⏎         // The socket may already be closed. ⏎       } ⏎       return true; ⏎     }` | `{}` | removed return/reject — fallthrough | `6128` |
| 519 | REAL_GAP | `src/room.ts` | 1969 | `ConditionalExpression` | `authorizeRoom('read', principal, access, acl) \|\| ⏎         (purpose === 'read-or-write' && ⏎           authorizeRoom('write', principal, access, acl))` | `true` | authz/session condition forced true | `6145` |
| 520 | REAL_GAP | `src/room.ts` | 1970 | `ConditionalExpression` | `purpose === 'read-or-write'` | `true` | authz/session condition forced true | `6150` |
| 521 | REAL_GAP | `src/room.ts` | 1970 | `LogicalOperator` | `purpose === 'read-or-write' && ⏎           authorizeRoom('write', principal, access, acl)` | `purpose === 'read-or-write' \|\| authorizeRoom('write', principal, access, acl)` | logical operator change alters short-circuit accept set: "purpose === 'read-or-write' &&\\n          authorize" → "purpose === 'read-or-write' \|\| authorizeRoom('writ" | `6149` |
| 522 | REAL_GAP | `src/room.ts` | 2005 | `EqualityOperator` | `i < peers.length` | `i <= peers.length` | loop/index bound < → <=  | `6174` |
| 523 | REAL_GAP | `src/room.ts` | 2021 | `EqualityOperator` | `i < peers.length` | `i <= peers.length` | loop/index bound < → <=  | `6184` |
| 524 | REAL_GAP | `src/room.ts` | 2050 | `ConditionalExpression` | `prefix === STORAGE_KEYS.chatPrefix` | `true` | guard/discriminant forced true: 'prefix === STORAGE_KEYS.chatPrefix' | `6192` |
| 525 | REAL_GAP | `src/room.ts` | 2057 | `ObjectLiteral` | `{ prefix }` | `{}` | storage list options stripped | `6197` |
| 526 | REAL_GAP | `src/room.ts` | 2079 | `ObjectLiteral` | `{ ⏎         rows: Number(attribs['lastrow'] ?? 1), ⏎         columns: Number(attribs['lastcol'] ?? 1), ⏎       }` | `{}` | payload/options object emptied | `6203` |
| 527 | REAL_GAP | `src/room.ts` | 2080 | `LogicalOperator` | `attribs['lastrow'] ?? 1` | `attribs['lastrow'] && 1` | nullish coalescing mutated: attribs['lastrow'] ?? 1 → attribs['lastrow'] && 1 | `6204` |
| 528 | REAL_GAP | `src/room.ts` | 2080 | `StringLiteral` | `'lastrow'` | `""` | protocol/discriminant/default token 'lastrow' emptied | `6205` |
| 529 | REAL_GAP | `src/room.ts` | 2081 | `LogicalOperator` | `attribs['lastcol'] ?? 1` | `attribs['lastcol'] && 1` | nullish coalescing mutated: attribs['lastcol'] ?? 1 → attribs['lastcol'] && 1 | `6206` |
| 530 | REAL_GAP | `src/room.ts` | 2081 | `StringLiteral` | `'lastcol'` | `""` | protocol/discriminant/default token 'lastcol' emptied | `6207` |
| 531 | REAL_GAP | `src/room.ts` | 2110 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `6212` |
| 532 | REAL_GAP | `src/room.ts` | 2113 | `ConditionalExpression` | `priorMeta !== null` | `true` | nullish guard forced true | `6216` |
| 533 | REAL_GAP | `src/room.ts` | 2117 | `EqualityOperator` | `i < priorMeta.chunks` | `i <= priorMeta.chunks` | loop/index bound < → <=  | `6225` |
| 534 | REAL_GAP | `src/room.ts` | 2162 | `ConditionalExpression` | `this.#ss` | `false` | condition→false disables branch: 'this.#ss' | `6244` |
| 535 | REAL_GAP | `src/room.ts` | 2174 | `ObjectLiteral` | `{ snapshot }` | `{}` | payload/options object emptied | `6245` |
| 536 | REAL_GAP | `src/room.ts` | 2175 | `ObjectLiteral` | `{ log: await this.#listPrefix(STORAGE_KEYS.logPrefix) }` | `{}` | foldSnapshot({log}) emptied — log commands dropped when snapshot is empty | `6246` |
| 537 | REAL_GAP | `src/room.ts` | 2196 | `ObjectLiteral` | `{ ⏎       method: 'GET', ⏎     }` | `{}` | fetch init emptied | `6249` |
| 538 | REAL_GAP | `src/room.ts` | 2197 | `StringLiteral` | `'GET'` | `""` | protocol/discriminant/default token 'GET' emptied | `6250` |
| 539 | REAL_GAP | `src/room.ts` | 2199 | `ConditionalExpression` | `res.status !== 200` | `false` | condition→false disables branch: 'res.status !== 200' | `6252` |
| 540 | REAL_GAP | `src/room.ts` | 2232 | `ConditionalExpression` | `this.#nextLogSeq === null` | `true` | nullish guard forced true | `6262` |
| 541 | REAL_GAP | `src/room.ts` | 2235 | `ConditionalExpression` | `this.#nextAuditSeq === null` | `true` | nullish guard forced true | `6266` |
| 542 | REAL_GAP | `src/room.ts` | 2238 | `ConditionalExpression` | `this.#nextChatSeq === null` | `true` | nullish guard forced true | `6270` |
| 543 | REAL_GAP | `src/room.ts` | 2367 | `ObjectLiteral` | `{ ⏎         prefix: STORAGE_KEYS.ecellPrefix, ⏎       }` | `{}` | storage list options stripped | `6328` |
| 544 | REAL_GAP | `src/room.ts` | 2381 | `ArrayDeclaration` | `[]` | `["Stryker was here"]` | array initializer mutated — can poison lists if not fully overwritten before read | `6335` |
| 545 | REAL_GAP | `src/room.ts` | 2414 | `ConditionalExpression` | `this.#alarmArmed` | `false` | condition→false disables branch: 'this.#alarmArmed' | `6348` |
| 546 | REAL_GAP | `src/room.ts` | 2417 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `6353` |
| 547 | REAL_GAP | `src/room.ts` | 2421 | `BooleanLiteral` | `true` | `false` | boolean true→false changes flag/default | `6355` |
| 548 | REAL_GAP | `src/room.ts` | 2456 | `ConditionalExpression` | `typeof updatedAt === 'number'` | `true` | validation guard forced true | `6365` |
| 549 | REAL_GAP | `src/room.ts` | 2456 | `EqualityOperator` | `Date.now() - updatedAt >= ttlMs` | `Date.now() - updatedAt > ttlMs` | boundary/relational Date.now() - updatedAt >= ttlMs → Date.now() - updatedAt > ttlMs | `6369` |
| 550 | REAL_GAP | `src/room.ts` | 2457 | `LogicalOperator` | `this.#ownName ?? null` | `this.#ownName && null` | nullish coalescing mutated: this.#ownName ?? null → this.#ownName && null | `6373` |
| 551 | REAL_GAP | `src/room.ts` | 2492 | `EqualityOperator` | `keys.length <= keep` | `keys.length < keep` | boundary/relational keys.length <= keep → keys.length < keep | `6395` |
| 552 | REAL_GAP | `src/room.ts` | 2503 | `ObjectLiteral` | `{ ⏎       prefix: STORAGE_KEYS.ecellPrefix, ⏎     }` | `{}` | storage list options stripped | `6402` |
| 553 | EQUIVALENT | `src/auth-do.ts` | 157 | `BooleanLiteral` | `false` | `true` | CryptoKey extractable=true is unobservable: no exportKey/wrapKey on this material | `59` |
| 554 | EQUIVALENT | `src/auth-do.ts` | 341 | `ConditionalExpression` | `deletions.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not | `279` |
| 555 | EQUIVALENT | `src/auth-do.ts` | 341 | `EqualityOperator` | `deletions.length > 0` | `deletions.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not | `281` |
| 556 | EQUIVALENT | `src/auth-do.ts` | 391 | `ConditionalExpression` | `expired.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not | `335` |
| 557 | EQUIVALENT | `src/auth-do.ts` | 391 | `EqualityOperator` | `expired.length > 0` | `expired.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not | `337` |
| 558 | EQUIVALENT | `src/lib/auth.ts` | 40 | `BooleanLiteral` | `false` | `true` | CryptoKey extractable=true is unobservable: no exportKey/wrapKey on this material | `1122` |
| 559 | EQUIVALENT | `src/lib/command-limits.ts` | 67 | `ConditionalExpression` | `value !== undefined` | `true` | Number.isSafeInteger(undefined) is false, so this conjunct is redundant | `1308` |
| 560 | EQUIVALENT | `src/lib/command-limits.ts` | 429 | `ConditionalExpression` | `default: ⏎         break;` | `default:` | default branch only breaks / exhaustiveness sentinel; empty default is the same at runtime | `1810` |
| 561 | EQUIVALENT | `src/lib/rate-limit.ts` | 164 | `ConditionalExpression` | `elapsedSec > 0` | `true` | when elapsedSec==0 the refill adds 0 tokens; forcing the branch is a no-op | `2869` |
| 562 | EQUIVALENT | `src/lib/seq-store.ts` | 67 | `EqualityOperator` | `row.seq > highestSeq` | `row.seq >= highestSeq` | when equal, highestSeq already holds row.seq; max-finding is unchanged | `3327` |
| 563 | EQUIVALENT | `src/lib/ws-handlers.ts` | 328 | `ConditionalExpression` | `default: { ⏎       // Exhaustiveness sentinel. If a new ClientMessage variant is added ⏎       // without a handler, TypeScript fails here at compile time. ⏎       const _exhaustive: never = msg; ⏎       void _exhaustive; ⏎     }` | `default:` | default exhaustiveness/break only | `3759` |
| 564 | EQUIVALENT | `src/lib/xlsx-import.ts` | 157 | `ConditionalExpression` | `testOffset + 4 <= length` | `true` | source comment: expectedEocdOffset sits ~22B before buffer end so this guard is always true in reachable states | `4246` |
| 565 | EQUIVALENT | `src/lib/xlsx-import.ts` | 157 | `EqualityOperator` | `testOffset + 4 <= length` | `testOffset + 4 < length` | same always-true defensive ZIP guard; off-by-one still true for reachable EOCD geometry | `4248` |
| 566 | EQUIVALENT | `src/room.ts` | 1133 | `ConditionalExpression` | `payload.audit.length > 0` | `true` | empty audit/chat array write loop performs no puts | `5384` |
| 567 | EQUIVALENT | `src/room.ts` | 1145 | `ConditionalExpression` | `payload.chat.length > 0` | `true` | empty audit/chat array write loop performs no puts | `5391` |
| 568 | EQUIVALENT | `src/room.ts` | 1736 | `BlockStatement` | `{ ⏎     void ws; ⏎   }` | `{}` | block is only `void ws` (unused-param suppression) | `5979` |
| 569 | EQUIVALENT | `src/room.ts` | 2389 | `ConditionalExpression` | `evicted.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not | `6340` |
| 570 | EQUIVALENT | `src/room.ts` | 2389 | `EqualityOperator` | `evicted.length > 0` | `evicted.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not | `6342` |

## EQUIVALENT shortlist (annotate candidates)

These are the only survivors recommended for `// Stryker disable` *with a written justification* rather than new tests (per `AGENTS.md`).

| File | Line | Mutator | Original | Mutated | Justification |
| --- | ---: | --- | --- | --- | --- |
| `src/auth-do.ts` | 157 | `BooleanLiteral` | `false` | `true` | CryptoKey extractable=true is unobservable: no exportKey/wrapKey on this material |
| `src/auth-do.ts` | 341 | `ConditionalExpression` | `deletions.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not |
| `src/auth-do.ts` | 341 | `EqualityOperator` | `deletions.length > 0` | `deletions.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not |
| `src/auth-do.ts` | 391 | `ConditionalExpression` | `expired.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not |
| `src/auth-do.ts` | 391 | `EqualityOperator` | `expired.length > 0` | `expired.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not |
| `src/lib/auth.ts` | 40 | `BooleanLiteral` | `false` | `true` | CryptoKey extractable=true is unobservable: no exportKey/wrapKey on this material |
| `src/lib/command-limits.ts` | 67 | `ConditionalExpression` | `value !== undefined` | `true` | Number.isSafeInteger(undefined) is false, so this conjunct is redundant |
| `src/lib/command-limits.ts` | 429 | `ConditionalExpression` | `default: ⏎         break;` | `default:` | default branch only breaks / exhaustiveness sentinel; empty default is the same at runtime |
| `src/lib/rate-limit.ts` | 164 | `ConditionalExpression` | `elapsedSec > 0` | `true` | when elapsedSec==0 the refill adds 0 tokens; forcing the branch is a no-op |
| `src/lib/seq-store.ts` | 67 | `EqualityOperator` | `row.seq > highestSeq` | `row.seq >= highestSeq` | when equal, highestSeq already holds row.seq; max-finding is unchanged |
| `src/lib/ws-handlers.ts` | 328 | `ConditionalExpression` | `default: { ⏎       // Exhaustiveness sentinel. If a new ClientMessage variant is added ⏎       // without a handler, TypeScript fails here at compile time. ⏎       const _exhaustive: never = msg; ⏎       void _exhaustive; ⏎     }` | `default:` | default exhaustiveness/break only |
| `src/lib/xlsx-import.ts` | 157 | `ConditionalExpression` | `testOffset + 4 <= length` | `true` | source comment: expectedEocdOffset sits ~22B before buffer end so this guard is always true in reachable states |
| `src/lib/xlsx-import.ts` | 157 | `EqualityOperator` | `testOffset + 4 <= length` | `testOffset + 4 < length` | same always-true defensive ZIP guard; off-by-one still true for reachable EOCD geometry |
| `src/room.ts` | 1133 | `ConditionalExpression` | `payload.audit.length > 0` | `true` | empty audit/chat array write loop performs no puts |
| `src/room.ts` | 1145 | `ConditionalExpression` | `payload.chat.length > 0` | `true` | empty audit/chat array write loop performs no puts |
| `src/room.ts` | 1736 | `BlockStatement` | `{ ⏎     void ws; ⏎   }` | `{}` | block is only `void ws` (unused-param suppression) |
| `src/room.ts` | 2389 | `ConditionalExpression` | `evicted.length > 0` | `true` | empty key list: loop/batch is a storage no-op whether entered or not |
| `src/room.ts` | 2389 | `EqualityOperator` | `evicted.length > 0` | `evicted.length >= 0` | empty key list: loop/batch is a storage no-op whether entered or not |

## Notes

- `src/lib/robots.ts` is in the mutate set and scored **100%** (9 killed / 0 survived) in this report — no rows above.
- Hono route glue under `src/index.ts` / `src/routes/**` is excluded from mutation by config (`stryker.conf.json`), so this inventory is not a whole-Worker surface census.
- Ignored mutants (259) already carry Stryker ignore/disable directives; they are outside this survivor list.

