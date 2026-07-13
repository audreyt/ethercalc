# Spike provenance: Leanstral / LemmaScript pump for xlsx A1 columns

**Immutable history only.** The maintained workflow lives in root
[`lemma/`](../../lemma/README.md). Do not re-pump from this directory; use:

```bash
bun run verify:context
bun run verify:lean
bun run verify:request
omp --print --no-tools --no-session --mode text \
  --model mistral/labs-leanstral-1-5-1 @lemma/request.md
```

## Why this spike remains

Attempt 2 produced a high-impact challenge against
`colLetters(lastcol - 1)`. The model premise was wrong (it treated
`sheet.attribs.lastcol` as SheetJS 0-based; after `replayWorkbook` it is
SocialCalc **1-based**). The promoted **passing** Bun tests still lock the
0↔1 adapter boundary the model challenged — a valid promotion under the
stop rule.

## Actual Leanstral invocation (Attempt 2)

```bash
omp --print --no-tools --no-session --mode text \
  --model mistral/labs-leanstral-1-5-1 \
  @spikes/leanstral-xlsx-coords/attempt-2-request.md
```

- **utc:** 2026-07-13T04:37:56Z
- **model_id:** `mistral/labs-leanstral-1-5-1`
- **exit_status:** 0
- **raw capture:** [`leanstral-raw.md`](./leanstral-raw.md)
- **immutable request:** [`attempt-2-request.md`](./attempt-2-request.md)
  (self-contained: prompt + context + Lean sections inlined)

Attempt 1 meta-refused; Attempt 2 body is verbatim in `leanstral-raw.md`.

## Promotion map (model → test → result)

| Leanstral finding | Claim | Execution | Promoted test | Result |
|-------------------|-------|-----------|---------------|--------|
| #1 `colLetters(lastcol-1)` off-by-one | SheetJS 0-based lastcol → `ZY` / empty column | Premise wrong: lastcol is SocialCalc **1-based** after replay | `xlsx-import.node.test.ts`: A1:ZZ1 → `copiedfrom\cA1\cZZ1`; A1-only → `copiedfrom\cA1\cA1` | **PASS** (locks adapter) |
| #2 encodeColumn(702) RT | untested AAA | Works; import rejects AAA cells | not promoted (duplicate) | — |
| #3 `A01` leading zero | untested | works | not promoted (trivia) | — |
| #4 digit-prefix extras | untested | covered by existing `1A` | not promoted | — |

Stop rule: a **passing** Bun test that defends a plausible model-authored bug
is a valid promotion even when the model premise is wrong.

## Empirical pre-Leanstral finding (still shipping)

SocialCalc `coordToCr("AAA1")` → `{col:0}`; `set AAA1` silently drops.
Production: `ImportColumnOutOfRangeError` before replay (HTTP 400).

## Layout (provenance only)

| Path | Role |
|------|------|
| `README.md` | This provenance note |
| `attempt-2-request.md` | Immutable self-contained Attempt 2 request — do not rewrite |
| `leanstral-raw.md` | Verbatim Attempt 2 stdout + promotion map — do not rewrite |

Everything else that once lived here (builders, generated Lean/Dafny, live
context) moved to root [`lemma/`](../../lemma/README.md).
