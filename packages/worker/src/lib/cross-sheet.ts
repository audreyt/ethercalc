/**
 * Cross-sheet formula resolution helpers.
 *
 * SocialCalc formulas like `'other'!A1` need the referenced sheet loaded
 * into `SocialCalc.Formula.SheetCache` before recalc — otherwise the
 * formula evaluates to `#NAME?`. The DO fetches sibling snapshots via the
 * standard `/_do/snapshot` route; these helpers handle the orchestration
 * (pure / testable) so `room.ts` stays focused on I/O.
 */

/**
 * Pull the `sheet:` MIME part out of a full SocialCalc spreadsheet save.
 * `SocialCalc.Formula.AddSheetToCache` wants only the sheet-section body
 * (lines starting with `version:1.5` up to the next MIME boundary or EOF).
 *
 * If the input is a bare sheet save (no MIME envelope — e.g. what
 * `AddSheetToCache` itself produces, or what the migration tool stores),
 * returns it unchanged. If no recognizable sheet body is present, returns
 * the input untouched so the caller can still attempt `ParseSheetSave` —
 * it'll fail gracefully and SocialCalc will treat the ref as unresolvable.
 */
export function extractSheetSave(save: string): string {
  const match = /^version:1\.5$[\s\S]*?(?=^--SocialCalcSpreadsheetControlSave|$(?![\r\n]))/m.exec(save);
  if (match) return match[0];
  return save;
}

/**
 * Shape of a spreadsheet wrapper we can orchestrate recalc against.
 * Kept as a structural type so the helper doesn't force a direct
 * dependency on `@ethercalc/socialcalc-headless`.
 */
export interface CrossSheetSpreadsheet {
  findCrossSheetRefs(limit?: number): readonly string[];
  addSiblingSheet(name: string, save: string): void;
  recalc(): void;
}

export const MAX_CROSS_SHEET_REFS = 16;
export const MAX_CROSS_SHEET_NAME_CHARS = 2048;
export const MAX_CROSS_SHEET_SAVE_BYTES = 2 * 1024 * 1024;
export const MAX_CROSS_SHEET_TOTAL_CHARS = 4 * 1024 * 1024;

/** Read a sibling response without buffering an attacker-sized snapshot. */
export async function readBoundedResponseText(
  response: Response,
  maxBytes = MAX_CROSS_SHEET_SAVE_BYTES,
): Promise<string | null> {
  const declared = response.headers.get('Content-Length');
  if (
    declared !== null &&
    Number.isFinite(Number(declared)) &&
    Number(declared) > maxBytes
  ) {
    return null;
  }
  if (response.body === null) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let received = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    received += part.value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    chunks.push(decoder.decode(part.value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join('');
}

/**
 * Walk the spreadsheet's cross-sheet refs, fetch each sibling's save via
 * the caller-supplied `fetchSibling`, and inject into the spreadsheet's
 * formula cache. Calls `recalc()` once at the end iff any sibling was
 * added. Returns the number of siblings added (for metrics / tests).
 *
 * `ownName` is the current room's name (from the `?name=` query param);
 * it's used to skip self-references which would be re-entrant DO calls.
 * Pass `undefined` when the caller doesn't know the name (e.g. unit
 * tests).
 */
export async function hydrateCrossSheetRefs(
  ss: CrossSheetSpreadsheet,
  fetchSibling: (name: string) => Promise<string | null>,
  ownName?: string,
): Promise<number> {
  const refs = ss.findCrossSheetRefs(MAX_CROSS_SHEET_REFS);
  // Stryker disable next-line ConditionalExpression : early-out optimization
  // that's functionally redundant — an empty `refs` makes the for-loop a
  // no-op, so dropping the guard produces identical output.
  if (refs.length === 0) return 0;
  let added = 0;
  let attempted = 0;
  let totalChars = 0;
  for (const ref of refs) {
    if (ownName && ref === ownName) continue;
    if (ref.length === 0 || ref.length > MAX_CROSS_SHEET_NAME_CHARS) continue;
    if (attempted >= MAX_CROSS_SHEET_REFS) break;
    attempted += 1;
    let save: string | null;
    try {
      save = await fetchSibling(ref);
    } catch {
      // Sibling unreachable (e.g. workers recursion limit). Skip.
      // Stryker disable next-line BlockStatement : dropping the `continue`
      // falls through to `if (!save) continue;` below, and `save` is still
      // undefined because the assignment threw — so the net effect is the
      // same next-iteration skip.
      continue;
    }
    if (!save) continue;
    if (save.length > MAX_CROSS_SHEET_SAVE_BYTES) continue;
    if (totalChars + save.length > MAX_CROSS_SHEET_TOTAL_CHARS) continue;
    totalChars += save.length;
    ss.addSiblingSheet(ref, extractSheetSave(save));
    added++;
  }
  if (added > 0) {
    ss.recalc();
  }
  return added;
}
