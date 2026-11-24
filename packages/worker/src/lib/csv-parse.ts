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
 *   - A lone CR (not followed by LF) is field data, never a line terminator:
 *     SocialCalc ends rows with LF and does not quote a field for containing
 *     a CR, so splitting there would invent rows the sheet does not have.
 *
 * The parser is a small state machine — five states (FIELD_START, UNQUOTED,
 * QUOTED, QUOTE_IN_QUOTED, AFTER_QUOTED). The state is encoded implicitly in
 * the local variables `field` and `justExitedQuote`; the quoted states are
 * consumed in one step.
 *
 * Field text is taken as one slice per run, never one character at a time:
 * every `field += ch` allocates, and those per-character allocations stay
 * reachable through `rows` until the whole document is parsed, which costs
 * tens of heap bytes per input character on a large export.
 */
export function parseCSV(csv: string): string[][] {
  if (csv.length === 0) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let justExitedQuote = false;
  const fieldEnd = /,|\r\n|\n/g;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];

    if (ch === ',') {
      currentRow.push(field);
      field = '';
      justExitedQuote = false;
      continue;
    }
    if (ch === '\r' && csv[i + 1] === '\n') {
      // CRLF ends a record. A lone CR is cell data (see above) and falls
      // through to `field += ch`; ending a record on it would turn one cell
      // into one row per CR, past the sheet-size caps checked on the way in.
      i++;
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
      // Quoted field: runs to the first quote that is not doubled, or to the
      // end of the input when it is never closed.
      let end = csv.indexOf('"', i + 1);
      // A doubled "" inside a quoted field is a literal quote.
      while (end !== -1 && csv[end + 1] === '"') end = csv.indexOf('"', end + 2);
      if (end === -1) end = csv.length;
      field = csv.slice(i + 1, end).replaceAll('""', '"');
      justExitedQuote = true;
      i = end;
      continue;
    }
    // Unquoted text (or text trailing a closing quote) is taken verbatim up
    // to the next delimiter.
    fieldEnd.lastIndex = i;
    const end = fieldEnd.exec(csv)?.index ?? csv.length;
    field += csv.slice(i, end);
    i = end - 1;
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
