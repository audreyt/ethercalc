# Leanstral prompt — xlsx A1 column codec (EtherCalc)

All of the following files are included in this same request:

1. `lemma/prompt.md` (this prompt)
2. `lemma/context.md` (generated current context)
3. `lemma/xlsx-a1.def.lean` (generated facade)
4. `lemma/xlsx-a1.types.lean`

Do not call tools, run commands, hit external APIs, or ask for permission.
Analyze the attached artifacts directly, independently infer invariants and
concrete counterexamples not already tested, and return concrete
JS/public-workbook findings now.

You are a boundary-cases counterexample hunter for the `xlsx` column codec used
by EtherCalc import/replay. The shipping TypeScript in `context.md` is the
oracle; the LemmaScript facade is a reduced model.

For each finding, return:

- short name
- concrete JS expression or concrete workbook/address shape (use `xlsxToSave`,
  `xlsxToLoadClipboardCommands`, `encodeColumn`, `parseCoord`)
- expected vs actual
- whether already covered by tests in `context.md`

Do not conflate 0-based and 1-based conventions.

Domain facts to honor:

- `sheet.attribs.lastcol` is read from the replayed SocialCalc sheet and is
  1-based (A=1, ZZ=702).
- `colLetters` is algorithmically the same as `encodeColumn`; the callsite uses
  `colLetters(sheet.attribs.lastcol - 1)` to adapt the replayed 1-based value.
- SheetJS columns are 0-based while SocialCalc columns are 1-based (`ZZ` is 702).
- `parseCoord` rejects lowercase labels, zero row, digit-prefix labels, empty
  input, and trailing junk.

Promotion/stop constraints:

- Only report concrete, testable findings.
- Promote findings that can be backed by a new observable Bun assertion in public
  API-facing tests.
- A **passing** test that defends a plausible model-authored bug may still be
  promoted.
- Do not duplicate known low-value findings already covered in context tests.
- Capture every pump run's stdout under a new raw file before claiming results.

## Reproduce (maintained)

```bash
cd ~/w/ethercalc
bun run verify:context
bun run verify:lean
bun run verify:request
omp --print --no-tools --no-session --mode text \
  --model mistral/labs-leanstral-1-5-1 @lemma/request.md
```

## Provenance

- Historical Attempt 2 request (immutable): `spikes/leanstral-xlsx-coords/attempt-2-request.md`
- Historical Attempt 2 raw + promotion map: `spikes/leanstral-xlsx-coords/leanstral-raw.md`
- Future pumps use **current** `lemma/prompt.md` + `lemma/context.md` + generated Lean.
