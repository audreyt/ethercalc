/**
 * Pure helpers for the Phase 6 POST command-execution layer. See
 * CLAUDE.md sections 6.1, 7 items 12-14, and 8 Phase 6. Each function
 * below is a tight, side-effect-free port of one branch of the legacy
 * main.ls 406-446 POST handler.
 *
 * The Hono glue in routes/rooms.ts composes these together; the
 * individual helpers are coverage-gated in
 * test/lib-loadclipboard.node.test.ts.
 */

/**
 * Match cmdstr against the literal prefix "loadclipboard" followed by
 * any whitespace character. Mirrors the legacy LiveScript regex at
 * main.ls line 414.
 *
 * Callers use this to decide whether to run the paste-enrichment
 * pipeline. Auto-enrichment is only ever taken when the body arrived
 * as plain text, not JSON.
 */
export function isLoadClipboard(cmdstr: string): boolean {
  return /^loadclipboard\s/.test(cmdstr);
}

/**
 * If cmdstr matches the legacy multi-cascade form (main.ls line 425),
 * return the A-cell reference (the "sheet id" the legacy server
 * plucks with RegExp.dollar1). Otherwise null.
 *
 * The pattern accepted is: "set A<digits>:B<digits> empty multi-cascade".
 * The caller uses the returned ref to derive snapshot, log and audit
 * keys to rename (ref to ref.bak). See POST _do_rename on RoomDO.
 */
export function isMultiCascade(cmdstr: string): string | null {
  const m = /^set (A\d+):B\d+ empty multi-cascade/.exec(cmdstr);
  return m ? m[1]! : null;
}

/**
 * Match the single forbidden command the legacy server drops silently:
 * "set sheet defaulttextvalueformat text-wiki". See section 7 item 12
 * plus the WS handler in main.ls lines 506-507. Trailing whitespace is
 * tolerated; a trailing non-whitespace payload is rejected.
 */
export function isBannedWikiFormat(cmdstr: string): boolean {
  return /^set sheet defaulttextvalueformat text-wiki\s*$/.test(cmdstr);
}

/**
 * Parse the sheet-dimension line out of a SocialCalc save and return
 * the last-row value N (the row suffix inside the sheet attribute line).
 *
 * Matches the legacy regex behavior at main.ls lines 416-417:
 *
 *   if snapshot matches sheet with a row value
 *     row += Number(rowValue)
 *   else
 *     row = 2
 *
 * Callers add 1 to the return value to get the next empty row. When
 * the sheet line is absent (fresh room, empty snapshot), we return 1
 * so the caller can default to row = 2 in that branch.
 */
export function computeLastRow(snapshot: string): number {
  const m = /\nsheet:c:\d+:r:(\d+):/.exec(snapshot);
  if (!m) return 1;
  return Number(m[1]!);
}

/**
 * Options for enrichLoadClipboard.
 *
 * - rowQueryParam: the ?row=N value as a number. Pass null (or NaN) if
 *   the query param was absent or unparseable. Matches legacy
 *   parseInt falsiness: 0 and NaN both skip the insert.
 * - snapshot: the current stored snapshot (for last-row detection).
 *   Pass the empty string when the room has no snapshot yet.
 */
export interface EnrichOpts {
  readonly rowQueryParam: number | null;
  readonly snapshot: string;
}

/**
 * Return the ordered array of commands to execute for a loadclipboard
 * POST. Direct port of main.ls lines 414-424.
 *
 * This function assumes the caller has already determined the body is
 * the auto-enrich case (plain-text, matches isLoadClipboard). The
 * first legacy branch (JSON body) simply forwards [cmdstr] and does
 * not call this function.
 */
export function enrichLoadClipboard(
  cmdstr: string,
  opts: EnrichOpts,
): string[] {
  // Row derivation: legacy initializes to 1, adds lastrow if the sheet
  // dimension is present, else hard-forces 2. We match that via
  // computeLastRow returning 1 for the absent case.
  const last = computeLastRow(opts.snapshot);
  const hasSheetDim = /\nsheet:c:\d+:r:\d+:/.test(opts.snapshot);
  const autoRow = hasSheetDim ? 1 + last : 2;
  const queryRow = opts.rowQueryParam;
  if (
    typeof queryRow === 'number' &&
    Number.isFinite(queryRow) &&
    queryRow !== 0
  ) {
    // ?row=N present and truthy. Legacy inserts a blank row before pasting.
    return [cmdstr, `insertrow A${queryRow}`, `paste A${queryRow} all`];
  }
  return [cmdstr, `paste A${autoRow} all`];
}
