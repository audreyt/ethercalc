/**
 * LemmaScript facade — maintained verification / Leanstral pump surface.
 *
 * Correspondence limits (read before treating any proof as shipping truth):
 * - Shipping code lives in packages/worker/src/lib/xlsx-build.ts
 *   (`encodeColumn`, `parseCoord`) and packages/worker/src/lib/xlsx-import.ts
 *   (`colLetters` private, `colLetters(lastcol - 1)` callsite).
 * - This facade extracts the pure integer steps of the 0-based SheetJS codec
 *   so `lsc gen` can emit Dafny / Lean models. String building
 *   (`String.fromCharCode`) and regex parsing are intentionally omitted:
 *   Lean-unfriendly and already covered by Bun round-trip tests.
 * - Domain is SheetJS 0-based: c=0 → "A", c=701 → "ZZ". SocialCalc is 1-based
 *   with max col 702 (ZZ). Do NOT co-verify this facade against
 *   socialcalc/lemma/a1.ts ensures without an explicit 0↔1 index shim.
 * - Production rejection of columns beyond ZZ is
 *   `ImportColumnOutOfRangeError` in xlsx-import.ts (not modeled here).
 * - IEEE-754: TypeScript `number` is reduced to mathematical `Int` in Dafny
 *   and Lean. `NaN`, `±Infinity`, and non-integer fractions are **outside**
 *   the model — callers that may see them (e.g. merge end columns) must be
 *   Bun-tested; see `enforceSocialCalcColumnLimit` safe-integer gate.
 * - `//@ requires` preconditions are mandatory so generated Lean `require`
 *   clauses make ensures meaningful (not vacuous on arbitrary Int).
 *
 * Reproduce (from repo root, lemmascript@0.5.13 via root package scripts):
 *   bun run verify:dafny          # check + assert .dfy == .dfy.gen
 *   bun run verify:dafny:regen    # rewrite .dfy/.dfy.gen after facade edits
 *   bun run verify:lean
 *   bun run verify:context        # needs sibling ../socialcalc checkout
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
  //@ requires n >= 0
  //@ ensures \result < n
  //@ ensures \result >= -1
  return Math.floor(n / 26) - 1;
}

/**
 * Digit emitted for position n (n >= 0): 65 + (n % 26) → 'A'..'Z'.
 */
export function encodeDigit(n: number): number {
  //@ verify
  //@ requires n >= 0
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
  //@ requires col >= 0
  //@ requires charCode >= 65
  //@ requires charCode <= 90
  //@ ensures \result >= 1
  //@ ensures \result >= col * 26 + 1
  return col * 26 + (charCode - 64);
}

/**
 * Convert 1-based accumulator result to SheetJS 0-based column.
 */
export function toZeroBased(col1based: number): number {
  //@ verify
  //@ requires col1based >= 1
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
  //@ requires c >= 0
  //@ requires decoded >= 1
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
