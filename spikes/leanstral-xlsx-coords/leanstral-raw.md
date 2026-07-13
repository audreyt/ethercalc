# Leanstral raw capture

## Attempt 1 (meta-refusal — not used)

- utc_timestamp: 2026-07-13T04:36:11Z
- model_id: mistral/labs-leanstral-1-5-1
- exact_command: `omp --print --no-tools --no-session --mode text --model mistral/labs-leanstral-1-5-1 @/tmp/leanstral-xlsx-coords-prompt-6uBCSm.md`
- exit_status: 0
- result: model declined to analyze and asked for human step 3

## Attempt 2 (analysis used)

- utc_timestamp: 2026-07-13T04:37:56Z
- model_id: mistral/labs-leanstral-1-5-1
- exact_command: `omp --print --no-tools --no-session --mode text --model mistral/labs-leanstral-1-5-1 @/tmp/leanstral-xlsx-coords-prompt-attempt2-hf41L0.md`
- exit_status: 0

### stdout (verbatim)

```text
## Findings

### 1. `colLetters(lastcol - 1)` off-by-one in `workbookToLoadClipboardCommand` → **NOT COVERED**

```
Case: Single-cell workbook (A1 only)
─────────────────────────────────────
Shipping code:  colLetters(lastcol - 1)
                 lastcol from SheetJS = 0 (A is 0-based index 0)
                 colLetters(0 - 1) = colLetters(-1) = ""     ← while n >= 0 is false
                 range = `A1:${""}${lastRow}` = "A1:1"       ← malformed

Expected:        colLetters(lastcol) = colLetters(0) = "A"
                 range = "A1:A1" or "A1:1"

Concrete JS:
  const sheet = { attribs: { lastcol: 0, lastrow: 1 }, cells: { "A1": ... } };
  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  // lastCol === ""  (should be "A")

Production impact: clipboard range is empty-string column,
which may cause SocialCalc to interpret the range as "A1 only"
or reject it entirely. Data not lost but formatting/clipping wrong.
```

```
Case: Full ZZ workbook on clipboard path
────────────────────────────────────────
Shipping code:  colLetters(lastcol - 1)
                 SheetJS lastcol = 701 (0-based, ZZ is index 701)
                 colLetters(701 - 1) = colLetters(700) = "ZY"   ← should be "ZZ"
                 range = "A1:ZY702"                              ← off by one

Expected:        colLetters(701) = "ZZ"
                 range = "A1:ZZ702"

Concrete JS:
  const sheet = { attribs: { lastcol: 701, lastrow: 1 }, cells: { "A1": ..., "ZZ1": ... } };
  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  // lastCol === "ZY"  (should be "ZZ")
```

**Why this is a bug:** `colLetters` takes a 0-based column index (verified: `colLetters(25)` → `"Z"`, `colLetters(26)` → `"AA"`). SheetJS `lastcol` is 0-based. The `-1` shifts it further down by one, producing the wrong column label. The correct callsite is `colLetters(lastcol)`.

**Overlap:** No existing test exercises `workbookToLoadClipboardCommand` with a valid ZZ workbook. The ZZ acceptance test (`accepts a full-width ZZ workbook`) only calls `xlsxToSave`, not the clipboard path.

---

### 2. `encodeColumn(702)` round-trip — **NOT COVERED**

```
Case: encodeColumn 702 (AAA) round-trip
──────────────────────────────────────
Shipping encodeColumn(702):
  n=702: digit=702%26=0→'A', n=27-1=26
  n=26:  digit=26%26=0→'A', n=1-1=0
  n=0:   digit=0%26=0→'A', n=-1
  result = "AAA"

Shipping parseCoord("AAA1"):
  letters="AAA", rowStr="1"
  col = ((1*26+1)*26+1) = 703
  toZeroBased(703) = 702
  row = 0
  result = { r: 0, c: 702 }

Round-trip: encodeColumn(702) → "AAA" → parseCoord("AAA1").c = 702 ✓

But the existing test loop covers 0..701 only:
  for (let c = 0; c <= 701; c++) { ... }

702 is outside the loop. The function works correctly but
has no regression guard at this boundary.
```

**Overlap:** No test covers c=702. The `AAA1` rejection test covers c=703 (which also works) but only as a rejection case.

---

### 3. `parseCoord` accepts row 0 via leading-zero row numbers — **NOT COVERED**

```
Case: parseCoord with leading-zero row
──────────────────────────────────────
Shipping parseCoord("A00"):
  rowStr="00", row=parseInt("00")-1=-1 → null (rejected, correct)

Shipping parseCoord("A01"):
  rowStr="01", row=parseInt("01")-1=0 → { r: 0, c: 0 }
  This is row 0 (SocialCalc A1). Functionally equivalent to "A1".

No explicit test covers this. The invalid-row test covers "A0" → null,
but not "A01" → row 0.
```

**Overlap:** Covered implicitly by `parseCoord("A1")` but no test asserts that `"A01"` → row 0.

---

### 4. `parseCoord` — column-only input returns `null` but no test for digit-prefix — **NOT COVERED**

```
Case: Digit-prefix label
────────────────────────
parseCoord("1A"):
  /^([A-Z]+)(\d+)$/ → no match (starts with digit) → null ✓

Already in test: it('returns null for invalid coordinates') → '1A'

But not tested: "1", "0", "00", "0A", "99A"
These all fail the regex anchor ^[A-Z]. Not a codec bug,
but the rejection is untested for edge shapes.
```

**Overlap:** Existing test covers `"1A"` but not simpler digit-prefixed forms like `"1"`.

---

### Summary table

| # | Name | JS case | Expected | Actual | Covered |
|---|------|---------|----------|--------|---------|
| 1 | `colLetters` off-by-one | `workbookToLoadClipboardCommand` with A1-only or ZZ workbook | `"A"` / `"ZZ"` | `""` / `"ZY"` | **NO** |
| 2 | `encodeColumn(702)` round-trip | `encodeColumn(702) → parseCoord("AAA1")` | c=702 | c=702 ✓ | **NO** |
| 3 | Leading-zero row | `parseCoord("A01")` | `{r:0,c:0}` | `{r:0,c:0}` ✓ | **NO** |
| 4 | Digit-prefix rejection | `parseCoord("0")` | null | null ✓ | **PARTIAL** |

Findings 1–3 are the actionable ones. Finding 1 is the most impactful: it's an untested off-by-one in the clipboard path that affects every valid ZZ workbook import.
```

## Promotion map

| Finding | Model claim | Execution result | Promoted? | Test |
|---------|-------------|------------------|-----------|------|
| #1 lastcol−1 off-by-one | lastcol is SheetJS 0-based → ZY / empty column | **Refuted:** lastcol is SocialCalc 1-based after replay; `copiedfrom\cA1\cZZ1` and `copiedfrom\cA1\cA1` | **yes** (passing defense of model-authored challenge) | `xlsx-import.node.test.ts` — `A1:ZZ1 clipboard encodes…`, `A1-only clipboard encodes…` |
| #2 encodeColumn(702) RT | untested AAA round-trip | Works; AAA already point-tested in xlsx-build; import rejects AAA cells | **no** (duplicate / low value) | — |
| #3 leading-zero row A01 | untested | Works; trivia | **no** | — |
| #4 digit-prefix extras | untested shapes | Already covered via `1A` | **no** | — |

### Correction note (finding #1 premise)

`workbookToLoadClipboardCommand` calls `replayWorkbook` first, then reads
`sheet.attribs.lastcol` from the **SocialCalc** sheet object. SocialCalc
uses 1-based columns (A=1 … ZZ=702). Therefore `colLetters(lastcol - 1)` is
the intentional 0↔1 adapter into SheetJS-style `colLetters` / `encodeColumn`.
The model's predicted `ZY` / empty-column outcomes do **not** occur; the
promoted tests lock that execution fact.
