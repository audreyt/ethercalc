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
// Non-comma consumers (`;`, `|`, tab, CR/LF) split inside quoted fields once
// quotes are no longer field-leading; guard any trigger preceded by those
// separators + optional quotes (including leading U+FEFF BOMs).
const CSV_INJECTION_INNER = /([;|\t\r\n]"*)(\uFEFF*[=+\-@][^;|\t\r\n]*)/g;
// Excel and SheetJS consume a first line `sep=<char>` as a delimiter directive.
const CSV_SEP_DIRECTIVE = /^[\s\ufeff]*sep=/i;
// Genuinely numeric values (incl. signed and scientific) are NOT formulas —
// neutralizing `-5` or `+3.14` would corrupt ordinary data, so they're exempt.
const CSV_NUMERIC = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/;
// Readers strip a leading U+FEFF as a byte-order mark.
const CSV_LEADING_BOM = /^\uFEFF+/;

/**
 * Defang a single CSV field against formula/DDE injection. When a field
 * starts with a formula-trigger character (looking past leading U+FEFF BOMs)
 * and is not a plain number, prefix it with a single quote so spreadsheet apps
 * render it as literal text instead of evaluating formulas on download. Also
 * quotes triggers following `;`, `|`, tab, or line breaks.
 */
export function neutralizeCSVFormula(field: string): string {
  const safe = field.replace(CSV_INJECTION_INNER, (match, split: string, rest: string) => {
    const visibleRest = rest.replace(CSV_LEADING_BOM, '');
    return CSV_NUMERIC.test(visibleRest) ? match : `${split}'${rest}`;
  });
  const visible = safe.replace(CSV_LEADING_BOM, '');
  if (CSV_INJECTION_LEAD.test(visible) && !CSV_NUMERIC.test(visible)) {
    return `'${safe}`;
  }
  return safe;
}

/**
 * Re-emit a CSV document with every field defanged against formula
 * injection. Parses the source (the strict subset SocialCalc emits),
 * neutralizes each field (plus any leading `sep=` directive in A1), and
 * re-encodes. Benign documents round-trip byte-for-byte.
 */
export function neutralizeCSVDocument(csv: string): string {
  const rows = parseCSV(csv).map((row) => row.map(neutralizeCSVFormula));
  const head = rows[0];
  if (head?.[0] !== undefined && CSV_SEP_DIRECTIVE.test(head[0])) {
    head[0] = `'${head[0]}`;
  }
  return encodeCSV(rows);
}

/**
 * Encode a 2D grid of strings as a CSV document terminated by a trailing LF
 * (matches what SocialCalc emits). An empty grid yields an empty string.
 */
export function encodeCSV(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return '';
  return rows.map((row) => row.map(encodeCSVField).join(',')).join('\n') + '\n';
}
