/**
 * Tiny CSV encoder — the inverse of `csv-parse.ts`. Used by the multi-sheet
 * PUT import path (Phase 8.1) to assemble the TOC sheet's CSV body from
 * `(url, title)` pairs before handing it to SocialCalc's
 * `csvToSave`.
 *
 * Why a purpose-built encoder rather than importing a library:
 *   1. We only need the strict RFC 4180 subset that the sibling parser
 *      already accepts (LF terminators, double-quote escape for `"`, quote
 *      fields containing `,`/`"`/LF).
 *   2. The output is fed straight back through SocialCalc — which is
 *      aggressively tolerant — so we never need to emit CRLF, BOMs, or
 *      anything fancy.
 *   3. Keeping it a pure function keeps the 100% Node coverage gate trivial.
 *
 * Round-trip invariant (enforced in the .node.test.ts):
 *   parseCSV(encodeCSV(rows)) === rows  (for rows of strings)
 */

/**
 * Return `field` quoted if any of `,`, `"`, `\r`, or `\n` appear; otherwise
 * emit the raw string. Doubles embedded `"` to `""` per RFC 4180.
 */
export function encodeCSVField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Encode a 2D grid of strings as a CSV document terminated by a trailing LF
 * (matches what SocialCalc emits). An empty grid yields an empty string.
 */
export function encodeCSV(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return '';
  return rows.map((row) => row.map(encodeCSVField).join(',')).join('\n') + '\n';
}
