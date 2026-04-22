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
  findCrossSheetRefs(): readonly string[];
  addSiblingSheet(name: string, save: string): void;
  recalc(): void;
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
  const refs = ss.findCrossSheetRefs();
  if (refs.length === 0) return 0;
  let added = 0;
  for (const ref of refs) {
    if (ownName && ref === ownName) continue;
    let save: string | null;
    try {
      save = await fetchSibling(ref);
    } catch {
      // Sibling unreachable (e.g. workers recursion limit). Skip.
      continue;
    }
    if (!save) continue;
    ss.addSiblingSheet(ref, extractSheetSave(save));
    added++;
  }
  if (added > 0) {
    ss.recalc();
  }
  return added;
}
