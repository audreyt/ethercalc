===== BEGIN spikes/leanstral-xlsx-coords/prompt.md =====
# Leanstral prompt — xlsx A1 column codec (EtherCalc)

All of the following files are included in this same request:

1. `spikes/leanstral-xlsx-coords/prompt.md` (this prompt)
2. `spikes/leanstral-xlsx-coords/context.md` (verbatim shipping-source context)
3. `spikes/leanstral-xlsx-coords/lemma/xlsx-a1.def.lean` (generated facade)
4. `spikes/leanstral-xlsx-coords/lemma/xlsx-a1.types.lean`

Do not call tools, run commands, hit external APIs, or ask for permission. Do not
request clarifications. Analyze the attached artifacts directly.

You are a counterexample hunter for `xlsx` column-address codecs used by EtherCalc.
The shipping TypeScript in `context.md` is the oracle. The generated Lean is a thin
integer-only facade.

Task:
- Independently infer additional invariants and concrete counterexamples
  not already covered by listed tests.
- For each item, provide: short name, concrete JS/public-workbook case,
  expected vs actual, and whether it is already covered by context tests.
- Favor cases that can be promoted into Bun assertions against public APIs:
  `xlsxToSave`, `xlsxToLoadClipboardCommands`, `encodeColumn`, `parseCoord`.

Domain facts:
- Production uses a 0-based SheetJS column index but SocialCalc caps at `ZZ`
  (1-based 702). `encodeColumn(702) === "AAA"` is a SheetJS-valid label that is
  outside SocialCalc range.
- Import/clipboard formatting uses `colLetters` (private) at the sheet boundary
  callsite with `sheet.attribs.lastcol - 1`.
- `parseCoord` currently rejects lowercase labels, row 0, digit-prefix labels,
  empty input, and trailing junk.

Promotion constraints:
- Do not formalize SocialCalc parser internals.
- Do not conflate 0-based and 1-based conventions.
- Return only concrete, testable findings (and mark overlap with existing tests).
- Return no invented model-text wrapper; only direct findings.

Return all findings as concrete cases now.  

## Generated Lean (generated once per run)

After running:

```bash
bunx lsc gen --backend=lean \
  spikes/leanstral-xlsx-coords/lemma/xlsx-a1.ts
```

`paste lemma/xlsx-a1.def.lean` and `.types.lean` when invoking Leanstral.

## Stop rule for the human operator

- Promote only findings that produce a new observable Bun assertion.
- If Leanstral only restates already-tested boundaries, stop after one pump.
- Never claim Leanstral findings without `leanstral-raw.md` capture.

===== END spikes/leanstral-xlsx-coords/prompt.md =====

===== BEGIN spikes/leanstral-xlsx-coords/context.md =====
# Leanstral / LemmaScript context pack — xlsx A1 column codec

Generated: 2026-07-13T04:33:58.781Z
Generator: spikes/leanstral-xlsx-coords/build-context.mjs
Repo root: ethercalc (sibling ../socialcalc)

## Reproduce

```bash
# From ~/w/ethercalc:
bun spikes/leanstral-xlsx-coords/build-context.mjs
node ~/w/LemmaScript/tools/dist/lsc.js gen --backend=lean \
  spikes/leanstral-xlsx-coords/lemma/xlsx-a1.ts
# Leanstral: feed prompt.md + this file + lemma/xlsx-a1.def.lean
# to labs-leanstral-1-5-1. Capture raw output into leanstral-raw.md.
```

## Purpose

Discover boundary/invariant cases for the EtherCalc xlsx A1 column codec
that existing point tests miss. Production shipping code is the oracle;
the LemmaScript facade is pump input only.

## Empirical finding (pre-Leanstral)

SocialCalc `coordToCr("AAA1")` returns `{col:0}` and `ExecuteSheetCommand`
silently drops the cell. A 703-column workbook previously produced a save
missing AAA1 and a `copiedfrom` range that never reached AAA. Production
now rejects such imports with `ImportColumnOutOfRangeError` before replay.

## 1. Shipping encodeColumn / parseCoord (verbatim)

Source: `packages/worker/src/lib/xlsx-build.ts`

```typescript
/** Parse "A1" / "AA12" into zero-based `{r, c}`. Returns null on invalid input. */
export function parseCoord(coord: string): { r: number; c: number } | null {
  const m = /^([A-Z]+)(\d+)$/.exec(coord);
  if (!m) return null;
  const letters = m[1] as string;
  const rowStr = m[2] as string;
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  const row = parseInt(rowStr, 10) - 1;
  if (row < 0) return null;
  return { r: row, c: col - 1 };
}

/** Inverse of `parseCoord` for the column part. */
export function encodeColumn(c: number): string {
  let out = '';
  let n = c;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}
```

## 2. Shipping colLetters (verbatim, private)

Source: `packages/worker/src/lib/xlsx-import.ts`

```typescript
function colLetters(c: number): string {
  let out = '';
  let n = c;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}
```

## 3. lastcol callsite (verbatim)

Source: `packages/worker/src/lib/xlsx-import.ts`

```typescript
export function workbookToLoadClipboardCommand(bytes: Uint8Array): string | null {
  const SC = loadSocialCalc() as any;
  const { sheet } = replayWorkbook(bytes);

  // Nothing populated → no-op import. `attribs.lastrow`/`lastcol` default
  // to 1 even for an empty sheet, so they can't distinguish "one cell" from
  // "zero cells"; the populated `cells` map can.
  if (Object.keys(sheet.cells as Record<string, unknown>).length === 0) {
    return null;
  }

  // A range argument makes CreateSheetSave emit a `copiedfrom:` trailer,
  // which the `paste` executor reads to size the destination range. Use
  // the populated extent (A1 → last col/row) so the clipboard covers
  // exactly the imported cells.
  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  const lastRow = sheet.attribs.lastrow as number;
  const range = `A1:${lastCol}${lastRow}`;
  const clipboardSave: string = sheet.CreateSheetSave(range);
  const encoded: string = SC.encodeForSave(clipboardSave);
  return `loadclipboard ${encoded}`;
}
```

## 4. Production ZZ ceiling (verbatim)

Source: `packages/worker/src/lib/xlsx-import.ts`

```typescript
/** SocialCalc max column (1-based ZZ). SheetJS 0-based max is 701. */
export const MAX_SOCIALCALC_COL = 702;

/** Thrown by `xlsxToSave` when an import exceeds {@link MAX_IMPORT_CELLS}. */
export class ImportTooLargeError extends Error {
  readonly cellCount: number;
  constructor(cellCount: number) {
    super(`xlsx/ods import exceeds ${MAX_IMPORT_CELLS} cells (${cellCount})`);
    this.name = 'ImportTooLargeError';
    this.cellCount = cellCount;
  }
}

/**
 * Thrown when a workbook cell or merge ends beyond SocialCalc's ZZ column.
 * SocialCalc's `coordToCr("AAA1")` returns `{col:0}` and silently drops the
 * cell during `ExecuteSheetCommand` — that is unintentional data loss, so
 * imports reject the whole workbook before replay rather than clipping.
 */
export class ImportColumnOutOfRangeError extends Error {
  readonly coord: string;
  /** 1-based column index that exceeded {@link MAX_SOCIALCALC_COL}. */
  readonly column: number;
  constructor(coord: string, column: number) {
    super(
      `xlsx/ods import column ${coord} exceeds SocialCalc max ZZ (${MAX_SOCIALCALC_COL}); column index ${column}`,
    );
    this.name = 'ImportColumnOutOfRangeError';
    this.coord = coord;
    this.column = column;
  }
}

export function enforceSocialCalcColumnLimit(
  ws: Record<string, unknown>,
): void {
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const rc = parseCoord(addr);
    if (rc === null) continue;
    if (rc.c > MAX_SOCIALCALC_COL - 1) {
      throw new ImportColumnOutOfRangeError(addr, rc.c + 1);
    }
  }
  const merges: Array<{ s?: { r?: number; c?: number }; e?: { r?: number; c?: number } }> =
    Array.isArray(ws['!merges']) ? (ws['!merges'] as Array<{ s?: { r?: number; c?: number }; e?: { r?: number; c?: number } }>) : [];
  for (const m of merges) {
    const endC = m?.e?.c;
    if (typeof endC === 'number' && endC > MAX_SOCIALCALC_COL - 1) {
      const endR = typeof m?.e?.r === 'number' ? m.e.r : 0;
      const coord = `${encodeColumn(endC)}${endR + 1}`;
      throw new ImportColumnOutOfRangeError(coord, endC + 1);
    }
  }
}
```

## 5. Existing tests (verbatim excerpts)

### packages/worker/test/xlsx-build.node.test.ts

```typescript
describe('parseCoord / encodeColumn', () => {
  it('parses A1 / Z99 / AA1 / AAA1', () => {
    expect(parseCoord('A1')).toEqual({ r: 0, c: 0 });
    expect(parseCoord('Z99')).toEqual({ r: 98, c: 25 });
    expect(parseCoord('AA1')).toEqual({ r: 0, c: 26 });
    expect(parseCoord('AAA1')).toEqual({ r: 0, c: 702 });
  });

  it('returns null for invalid coordinates', () => {
    expect(parseCoord('')).toBeNull();
    expect(parseCoord('1A')).toBeNull();
    expect(parseCoord('A')).toBeNull();
    expect(parseCoord('A0')).toBeNull();
    expect(parseCoord('a1')).toBeNull(); // lowercase
    expect(parseCoord('A1B')).toBeNull();
  });

  it('rejects coords whose letters are not at the start (`^` anchor)', () => {
    // Mutation drops the leading `^` in `/^([A-Z]+)(\d+)$/`. Without it,
    // `9A1` would match the `A1` suffix and wrongly parse as column A row 1.
    expect(parseCoord('9A1')).toBeNull();
    expect(parseCoord('1B2')).toBeNull();
  });

  it('encodeColumn is inverse of parseCoord column', () => {
    expect(encodeColumn(0)).toBe('A');
    expect(encodeColumn(25)).toBe('Z');
    expect(encodeColumn(26)).toBe('AA');
    expect(encodeColumn(701)).toBe('ZZ');
    expect(encodeColumn(702)).toBe('AAA');
  });

  it('round-trips encodeColumn → parseCoord for every column 0..701 (A..ZZ)', () => {
    // Complete inverse-law sweep over SocialCalc's supported 0-based column
    // domain. Point samples (0/25/26/701/702) cannot catch an off-by-one in
    // the encode while-loop or parse accumulator mid-range.
    for (let c = 0; c <= 701; c++) {
      const letters = encodeColumn(c);
      const parsed = parseCoord(`${letters}1`);
      if (parsed === null || parsed.c !== c || parsed.r !== 0) {
        throw new Error(
          `round-trip failed at c=${c}: encode=${letters} parse=${JSON.stringify(parsed)}`,
        );
      }
    }
  });
});
```

### packages/worker/test/xlsx-import.node.test.ts

```typescript
describe('SocialCalc ZZ column ceiling on import', () => {
  it('rejects a workbook with AAA1 (column 703) via xlsxToSave', () => {
    // Empirical: SocialCalc.coordToCr("AAA1") → {col:0} and ExecuteSheetCommand
    // silently drops the cell. Import must fail closed before replay rather
    // than return a save missing AAA1.
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 702 },
        AAA1: { t: 'n', v: 703 },
      },
      'A1:AAA1',
    );
    expect(() => xlsxToSave(bytes)).toThrow(ImportColumnOutOfRangeError);
    try {
      xlsxToSave(bytes);
    } catch (err) {
      expect(err).toBeInstanceOf(ImportColumnOutOfRangeError);
      const e = err as ImportColumnOutOfRangeError;
      expect(e.coord).toBe('AAA1');
      expect(e.column).toBe(MAX_SOCIALCALC_COL + 1);
      expect(e.message).toMatch(/ZZ/);
    }
  });

  it('rejects the same wide workbook on the loadclipboard path', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        AAA1: { t: 'n', v: 703 },
      },
      'A1:AAA1',
    );
    expect(() => xlsxToLoadClipboardCommands(bytes)).toThrow(
      ImportColumnOutOfRangeError,
    );
    expect(() => workbookToLoadClipboardCommand(bytes)).toThrow(
      ImportColumnOutOfRangeError,
    );
  });

  it('accepts a full-width ZZ workbook (lastcol=702)', () => {
    const bytes = makeXlsx(
      {
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 702 },
      },
      'A1:ZZ1',
    );
    const save = xlsxToSave(bytes);
    expect(save).toContain('cell:A1');
    expect(save).toContain('cell:ZZ1');
  });

  it('enforceSocialCalcColumnLimit rejects merge ends beyond ZZ', () => {
    const ws: Record<string, unknown> = {
      '!ref': 'A1:AAA1',
      A1: { t: 'n', v: 1 },
      '!merges': [{ s: { r: 0, c: 0 }, e: { r: 0, c: 702 } }],
    };
    expect(() => enforceSocialCalcColumnLimit(ws)).toThrow(
      ImportColumnOutOfRangeError,
    );
  });

  it('enforceSocialCalcColumnLimit accepts ZZ-only worksheets', () => {
    expect(() =>
      enforceSocialCalcColumnLimit({
        '!ref': 'A1:ZZ1',
        A1: { t: 'n', v: 1 },
        ZZ1: { t: 'n', v: 2 },
      }),
    ).not.toThrow();
  });
});
```

## 6. Upstream SocialCalc bounds (verbatim)

### lemma/a1.ts (MAX_COL + clamp)

```typescript
export const MAX_COL = 702;

/**
 * Column index 1..702 → A..ZZ. Out-of-range clamps (shipping rcColname).
 */
export function rcColname(c: number): string {
  //@ verify
  //@ ensures \result.length >= 1
  //@ ensures \result.length <= 2
  // length ≤ 2 already excludes the length-5 token "#REF!"; Bun locks alphabet.
  let col = c;
  if (col > 702) col = 702;
  if (col < 1) col = 1;
  const collow = (col - 1) % 26;
  const colhigh = Math.floor((col - 1) / 26);
  if (colhigh > 0) {
    return LETTERS[colhigh - 1]! + LETTERS[collow]!;
  }
  return LETTERS[collow]!;
}

/**
 * (col,row) → A1 string; col clamped 1..702, row >= 1 (shipping crToCoord).
 */
export function crToCoord(c: number, r: number): string {
  //@ verify
  //@ ensures \result.length >= 2
  // Never emits "#REF!" (clamps); full string inequality not auto-proved by Dafny.
  let col = c;
  let row = r;
  if (col < 1) col = 1;
  if (col > 702) col = 702;
  if (row < 1) row = 1;
  const collow = (col - 1) % 26;
  const colhigh = Math.floor((col - 1) / 26);
  if (colhigh > 0) {
    return LETTERS[colhigh - 1]! + LETTERS[collow]! + row;
  }
  return LETTERS[collow]! + row;
}

/** Clamp helper for builders that clamp rather than #REF!. */
export function clampCol(c: number): number {
  //@ verify
  //@ ensures \result >= 1
  //@ ensures \result <= 702
  //@ ensures c >= 1 && c <= 702 ==> \result === c
  if (c < 1) return 1;
  if (c > 702) return 702;
  return c;
}

export function clampRow(r: number): number {
  //@ verify
  //@ ensures \result >= 1
  //@ ensures r >= 1 ==> \result === r
  if (r < 1) return 1;
  return r;
}

/**
 * Whether a column is inside SocialCalc's supported band [1, 702].
 * Shipping Offset/Adjust use this policy (not clamp) for #REF!.
 */
```

### lemma/a1.dfy (clampCol + colFromRcRanks)

```dafny
function clampCol(c: int): int
{
  if (c < 1) then
    1
  else
    if (c > 702) then
      702
    else
      c
}

lemma clampCol_ensures(c: int)
  ensures (clampCol(c) >= 1)
  ensures (clampCol(c) <= 702)
  ensures ((c >= 1) ==> (c <= 702) ==> (clampCol(c) == c))
{
}

function clampRow(r: int): int
{
  if (r < 1) then
    1
  else
    r
}

lemma clampRow_ensures(r: int)
  ensures (clampRow(r) >= 1)
  ensures ((r >= 1) ==> (clampRow(r) == r))
{
}

function isColInBounds(c: int): bool
{
  ((c >= 1) && (c <= 702))
}

lemma isColInBounds_ensures(c: int)
  ensures ((isColInBounds(c) == true) || (isColInBounds(c) == false))
  ensures ((isColInBounds(c) == true) <==> ((c >= 1) && (c <= 702)))
{
}

function isRowInBounds(r: int): bool
{
  (r >= 1)
}

lemma isRowInBounds_ensures(r: int)
  ensures ((isRowInBounds(r) == true) || (isRowInBounds(r) == false))
  ensures ((isRowInBounds(r) == true) <==> (r >= 1))
{
}

function colFromRcRanks(colhigh: int, collow: int): int
{
  if ((collow < 0) || (collow > 25)) then
    -1
  else
    if ((colhigh < 0) || (colhigh > 26)) then
      -1
    else
      if (colhigh == 0) then
        (collow + 1)
      else
        (((colhigh * 26) + collow) + 1)
}

lemma colFromRcRanks_ensures(colhigh: int, collow: int)
  ensures ((colFromRcRanks(colhigh, collow) == -1) || ((colFromRcRanks(colhigh, collow) >= 1) && (colFromRcRanks(colhigh, collow) <= 702)))
  ensures ((collow >= 0) ==> (collow <= 25) ==> (colhigh == 0) ==> (colFromRcRanks(colhigh, collow) == (collow + 1)))
  ensures ((collow >= 0) ==> (collow <= 25) ==> (colhigh >= 1) ==> (colhigh <= 26) ==> (colFromRcRanks(colhigh, collow) == (((colhigh * 26) + collow) + 1)))
  ensures (((((collow < 0) || (collow > 25)) || (colhigh < 0)) || (colhigh > 26)) ==> (colFromRcRanks(colhigh, collow) == -1))
{
}
```

## 7. Spike LemmaScript facade (verbatim)

Source: `spikes/leanstral-xlsx-coords/lemma/xlsx-a1.ts`

```typescript
/**
 * LemmaScript facade (spike pump input only — not production wiring).
 *
 * Correspondence limits (read before treating any proof as shipping truth):
 * - Shipping code lives in packages/worker/src/lib/xlsx-build.ts
 *   (`encodeColumn`, `parseCoord`) and packages/worker/src/lib/xlsx-import.ts
 *   (`colLetters` private, `colLetters(lastcol - 1)` callsite).
 * - This facade extracts the pure integer steps of the 0-based SheetJS codec
 *   so `lsc gen --backend=lean` can emit Lean models for Leanstral prompting.
 * - String building (`String.fromCharCode`) and regex parsing are intentionally
 *   omitted: Lean-unfriendly and already covered by Bun round-trip tests.
 * - Domain is SheetJS 0-based: c=0 → "A", c=701 → "ZZ". SocialCalc is 1-based
 *   with max col 702 (ZZ). Do NOT co-verify this facade against
 *   socialcalc/lemma/a1.ts ensures without an explicit 0↔1 index shim.
 * - Production rejection of columns beyond ZZ is
 *   `ImportColumnOutOfRangeError` in xlsx-import.ts (not modeled here).
 *
 * Reproduce:
 *   node ~/w/LemmaScript/tools/dist/lsc.js gen --backend=lean \
 *     spikes/leanstral-xlsx-coords/lemma/xlsx-a1.ts
 */

/** Non-negative column index is a valid encodeColumn input. */
export function isValidCol(c: number): boolean {
  //@ verify
  //@ ensures \result === true || \result === false
  //@ ensures \result === true <==> c >= 0
  return c >= 0;
}

/**
 * One encodeColumn while-loop step: n' = floor(n/26) - 1.
 * Requires n >= 0. Ensures n' < n and n' >= -1 (strict progress to halt).
 */
export function encodeStep(n: number): number {
  //@ verify
  //@ ensures \result < n
  //@ ensures \result >= -1
  return Math.floor(n / 26) - 1;
}

/**
 * Digit emitted for position n (n >= 0): 65 + (n % 26) → 'A'..'Z'.
 */
export function encodeDigit(n: number): number {
  //@ verify
  //@ ensures \result >= 65
  //@ ensures \result <= 90
  return 65 + (n % 26);
}

/**
 * One parseCoord column-accumulator step.
 * col' = col * 26 + (charCode - 64) with charCode in [65,90].
 */
export function accumCol(col: number, charCode: number): number {
  //@ verify
  //@ ensures \result >= 1
  //@ ensures \result >= col * 26 + 1
  return col * 26 + (charCode - 64);
}

/**
 * Convert 1-based accumulator result to SheetJS 0-based column.
 */
export function toZeroBased(col1based: number): number {
  //@ verify
  //@ ensures \result >= 0
  //@ ensures \result === col1based - 1
  return col1based - 1;
}

/**
 * Round-trip success code: 0 iff decoded (1-based) equals c + 1.
 * For a correct codec, roundTripCode(c, decode(encode(c))) === 0 for c >= 0.
 */
export function roundTripCode(c: number, decoded: number): number {
  //@ verify
  //@ ensures \result === 0 || \result === 1
  //@ ensures decoded === c + 1 ==> \result === 0
  //@ ensures decoded !== c + 1 ==> \result === 1
  return decoded === c + 1 ? 0 : 1;
}

/**
 * Whether a 0-based column is inside SocialCalc's supported band [0, 701]
 * (1-based [1, 702] = A..ZZ).
 */
export function isWithinSocialCalc(c: number): boolean {
  //@ verify
  //@ ensures \result === true || \result === false
  //@ ensures \result === true <==> c >= 0 && c <= 701
  return c >= 0 && c <= 701;
}

```

## Correspondence limits

- SheetJS 0-based vs SocialCalc 1-based: do not co-prove without 0↔1 shim.
- Facade omits string builders; Bun locks letter strings.
- Leanstral output is not authoritative until promoted to a failing/passing
  Bun test against shipping public APIs.

## Leanstral status

See `leanstral-raw.md`. Do not invent model output.

===== END spikes/leanstral-xlsx-coords/context.md =====

===== BEGIN spikes/leanstral-xlsx-coords/lemma/xlsx-a1.def.lean =====
/-
  Generated by lsc from xlsx-a1.ts
  Do not edit — re-run `lsc gen` to regenerate.
-/
import «xlsx-a1.types»

set_option loom.semantics.termination "total"
set_option loom.semantics.choice "demonic"

method isValidCol (c : Int) return (res : Bool)
  ensures res = true ∨ res = false
  ensures res = true ↔ c ≥ 0
  do
    return Pure.isValidCol c

method encodeStep (n : Int) return (res : Int)
  ensures res < n
  ensures res ≥ -1
  do
    return Pure.encodeStep n

method encodeDigit (n : Int) return (res : Int)
  ensures res ≥ 65
  ensures res ≤ 90
  do
    return Pure.encodeDigit n

method accumCol (col : Int) (charCode : Int) return (res : Int)
  ensures res ≥ 1
  ensures res ≥ col * 26 + 1
  do
    return Pure.accumCol col charCode

method toZeroBased (col1based : Int) return (res : Int)
  ensures res ≥ 0
  ensures res = col1based - 1
  do
    return Pure.toZeroBased col1based

method roundTripCode (c : Int) (decoded : Int) return (res : Int)
  ensures res = 0 ∨ res = 1
  ensures decoded = c + 1 → res = 0
  ensures decoded ≠ c + 1 → res = 1
  do
    return Pure.roundTripCode c decoded

method isWithinSocialCalc (c : Int) return (res : Bool)
  ensures res = true ∨ res = false
  ensures res = true ↔ c ≥ 0 ∧ c ≤ 701
  do
    return Pure.isWithinSocialCalc c

===== END spikes/leanstral-xlsx-coords/lemma/xlsx-a1.def.lean =====

===== BEGIN spikes/leanstral-xlsx-coords/lemma/xlsx-a1.types.lean =====
/-
  Generated by lsc — Lean types and pure function mirrors.
-/
import LemmaScript

namespace Pure

def isValidCol (c : Int) : Bool :=
  c ≥ 0

def encodeStep (n : Int) : Int :=
  n / 26 - 1

def encodeDigit (n : Int) : Int :=
  65 + Int.tmod n 26

def accumCol (col : Int) (charCode : Int) : Int :=
  col * 26 + charCode - 64

def toZeroBased (col1based : Int) : Int :=
  col1based - 1

def roundTripCode (c : Int) (decoded : Int) : Int :=
  if decoded = c + 1 then
    0
  else
    1

def isWithinSocialCalc (c : Int) : Bool :=
  c ≥ 0 ∧ c ≤ 701

end Pure

===== END spikes/leanstral-xlsx-coords/lemma/xlsx-a1.types.lean =====
