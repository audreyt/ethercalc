/**
 * Minimal inline CSV parser — takes the CSV text SocialCalc emits via
 * `exportCSV()` and returns a `string[][]` grid. Used by the `csv.json`
 * export route to mirror the legacy `csv-parse(csv, delimiter: ',')` call
 * in `src/main.ls:156-160`.
 *
 * Why inline instead of importing `csv-parse`:
 *   1. The legacy version (`csv-parse@0.0.6`) has an ancient callback API we
 *      don't want to port shapes to.
 *   2. The modern `csv-parse/sync` imports `node:util` / `node:buffer` which
 *      weren't worth dragging into the Worker bundle when the grammar we need
 *      is a strict subset (RFC 4180, comma-delimited, double-quote
 *      escaping, LF or CRLF line terminators).
 *   3. SocialCalc's `ConvertSaveToOtherFormat(…, 'csv')` only emits this
 *      same strict subset, so a minimal parser covers 100% of the export
 *      surface without edge cases we'd otherwise inherit from a general
 *      library.
 *
 * Round-trip invariant (exercised in the .node.test.ts):
 *   parseCSV(socialcalc.exportCSV()) === the same 2D grid you'd get from
 *   walking `sheet.cells` and laying them out row-major.
 */

/**
 * Parse a CSV string into a 2D grid. Behavior:
 *   - Empty input yields `[]` (zero rows). The legacy ethercalc response is
 *     `[]` as well.
 *   - A trailing LF/CRLF does NOT create an extra empty row (SocialCalc
 *     always terminates with a newline).
 *   - Fields may be quoted; a doubled `""` inside a quoted field is a literal
 *     `"`. Unquoted fields are taken verbatim until the next `,` or line
 *     terminator.
 *   - Mixed CRLF / LF inside the same document is handled (SocialCalc emits
 *     LF-only but we accept both for robustness against intermediaries).
 *
 * The parser is a small state machine — five states (FIELD_START, UNQUOTED,
 * QUOTED, QUOTE_IN_QUOTED, AFTER_QUOTED). The state is encoded implicitly in
 * the local variables `inQuotes`, `fieldStarted`, and `justExitedQuote`.
 */
export function parseCSV(csv: string): string[][] {
  if (csv.length === 0) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let inQuotes = false;
  let justExitedQuote = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (inQuotes) {
      if (ch === '"') {
        // Peek: a doubled "" inside a quoted field is a literal quote.
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
          justExitedQuote = true;
        }
      } else {
        field += ch;
      }
      continue;
    }

    // Outside quotes.
    if (ch === ',') {
      currentRow.push(field);
      field = '';
      justExitedQuote = false;
      continue;
    }
    if (ch === '\r') {
      // Swallow; either CRLF (LF handled below) or a lone CR (rare, but treat
      // as end-of-record for symmetry with SocialCalc's tolerant emitter).
      if (csv[i + 1] === '\n') {
        i++;
      }
      currentRow.push(field);
      rows.push(currentRow);
      currentRow = [];
      field = '';
      justExitedQuote = false;
      continue;
    }
    if (ch === '\n') {
      currentRow.push(field);
      rows.push(currentRow);
      currentRow = [];
      field = '';
      justExitedQuote = false;
      continue;
    }
    if (ch === '"' && !justExitedQuote && field.length === 0) {
      inQuotes = true;
      continue;
    }
    field += ch;
  }

  // Emit a trailing row if the source did NOT end on a newline. SocialCalc
  // always terminates rows with LF so in practice this only fires for
  // caller-supplied CSV (e.g. PUT /_/:room with text/csv).
  if (field.length > 0 || currentRow.length > 0) {
    currentRow.push(field);
    rows.push(currentRow);
  }

  return rows;
}
