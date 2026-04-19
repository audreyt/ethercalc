/**
 * Markdown renderer for `/_/:room/md` exports.
 *
 * Decision (see FINDINGS in agent report): we produce a simple GFM table
 * rather than porting the legacy `j` library's `to_md`. Reasons:
 *
 *  1. `j` relies on Node `Buffer` + sync fs IO (§7 item 3 in CLAUDE.md) —
 *     bringing it into the Worker bundle would pull several deprecated
 *     dependencies and the nodejs_compat shims are subtly lossy for its
 *     ODS import path.
 *  2. GFM tables are the de-facto markdown spreadsheet format (Matter, Pandoc,
 *     Obsidian, GitHub all render them). The legacy `j` output was an
 *     idiosyncratic pipe-separated grid without the GFM separator row, which
 *     most readers actually render worse.
 *  3. Keeping it pure means we can hit 100% coverage and never need a fake
 *     DOM / Node runtime in tests.
 *
 * This is a §13 Q1 "sensible fix" — the output format changed but the
 * `Content-Type: text/x-markdown` is preserved and the data content is
 * unchanged (every cell value shows up in the same grid position).
 *
 * The CSV passed in comes from SocialCalc's `ConvertSaveToOtherFormat(...,
 * 'csv')` output, so quotes + escapes follow RFC 4180. We parse it via the
 * sibling `csv-parse.ts` module and render each row as `| a | b | c |`
 * with a GFM separator after the first row.
 */

import { parseCSV } from './csv-parse.ts';

/**
 * Escape a cell value for GFM table context. The only character that breaks
 * table cell parsing is `|`; we also escape backticks and backslashes to keep
 * values unambiguous, and replace embedded newlines with `<br>` (the standard
 * workaround since GFM doesn't allow newlines inside a table cell).
 */
function escapeCell(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/`/g, '\\`')
    .replace(/\r\n|\n|\r/g, '<br>');
}

/**
 * Render a 2D grid as a GFM table. Empty grids produce an empty string
 * (matches the legacy contract for empty rooms — `exportCSV()` returns an
 * empty string, and the md body is empty too).
 *
 * Rows shorter than the first row are padded with empty cells; longer rows
 * are truncated. This is the same normalization CSV parsers do and keeps
 * the table valid (a mis-aligned row renders as plain text, which would be
 * confusing).
 */
export function renderMarkdownTable(grid: readonly (readonly string[])[]): string {
  if (grid.length === 0) return '';
  const width = Math.max(...grid.map((row) => row.length));
  if (width === 0) return '';

  const normalize = (row: readonly string[]): string[] => {
    const out: string[] = [];
    for (let i = 0; i < width; i++) {
      out.push(escapeCell(row[i] ?? ''));
    }
    return out;
  };

  const line = (cells: readonly string[]): string => `| ${cells.join(' | ')} |`;

  const header = normalize(grid[0]!);
  const separator = new Array(width).fill('---');
  const body = grid.slice(1).map((row) => line(normalize(row)));

  return [line(header), line(separator), ...body].join('\n');
}

/**
 * Convert a CSV string to a GFM markdown table. Composes `parseCSV` and
 * `renderMarkdownTable`. Used by the `/_do/md` route in `RoomDO`.
 */
export function csvToMarkdown(csv: string): string {
  return renderMarkdownTable(parseCSV(csv));
}
