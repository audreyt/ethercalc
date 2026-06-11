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
import { parseCSV } from './csv-parse.ts';

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

// A field is treated as a potential spreadsheet formula if it begins with one
// of these characters (OWASP CSV-injection guidance). Tab/CR are included
// because Excel/Sheets trim leading whitespace before evaluating the cell.
const CSV_INJECTION_LEAD = /^[=+\-@\t\r]/;
// Genuinely numeric values (incl. signed and scientific) are NOT formulas —
// neutralizing `-5` or `+3.14` would corrupt ordinary data, so they're exempt.
const CSV_NUMERIC = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Defang a single CSV field against formula/DDE injection. When a field
 * starts with a formula-trigger character and is not a plain number, prefix
 * it with a single quote so spreadsheet apps render it as literal text
 * instead of evaluating `=HYPERLINK(...)`, `=cmd|'/c calc'!A1`, etc. on
 * download. Everything else is returned unchanged.
 */
export function neutralizeCSVFormula(field: string): string {
  if (CSV_INJECTION_LEAD.test(field) && !CSV_NUMERIC.test(field)) {
    return `'${field}`;
  }
  return field;
}

/**
 * Re-emit a CSV document with every field defanged against formula
 * injection. Parses the source (the strict subset SocialCalc emits),
 * neutralizes each field, and re-encodes. Benign documents round-trip
 * byte-for-byte; only formula-shaped cells gain a leading `'`.
 */
export function neutralizeCSVDocument(csv: string): string {
  return encodeCSV(parseCSV(csv).map((row) => row.map(neutralizeCSVFormula)));
}

/**
 * Encode a 2D grid of strings as a CSV document terminated by a trailing LF
 * (matches what SocialCalc emits). An empty grid yields an empty string.
 */
export function encodeCSV(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return '';
  return rows.map((row) => row.map(encodeCSVField).join(',')).join('\n') + '\n';
}
