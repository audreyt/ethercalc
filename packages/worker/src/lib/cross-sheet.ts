/**
 * Cross-sheet formula resolution helpers.
 *
 * SocialCalc formulas like `'other'!A1` need the referenced sheet loaded
 * into `SocialCalc.Formula.SheetCache` before recalc — otherwise the
 * formula evaluates to `#NAME?`. The DO fetches sibling snapshots via the
 * standard `/_do/snapshot` route; these helpers handle the orchestration
 * (pure / testable) so `room.ts` stays focused on I/O.
 */
import {
  MAX_CROSS_SHEET_REFS,
  MAX_CROSS_SHEET_TOTAL_CHARS,
} from '@ethercalc/shared/messages';

/**
 * Pull the `sheet:` MIME part out of a full SocialCalc spreadsheet save.
 * `SocialCalc.Formula.AddSheetToCache` wants only the sheet-section body
 * (lines starting with `version:1.5` up to the next MIME boundary or EOF).
 *
 * If the input is a bare sheet save (no MIME envelope — e.g. what
 * `AddSheetToCache` itself produces, or what the migration tool stores),
 * returns it unchanged. If no recognizable sheet body is present, returns
 * the input untouched so the caller can still attempt `ParseSheetSave` —
 * `hydrateCrossSheetRefs` catches its throw and leaves the ref unresolved.
 */
export function extractSheetSave(save: string): string {
  // No `m` flag: a save line ends in LF (or CRLF). A multiline `^`/`$` also
  // matches next to a bare CR, U+2028 or U+2029, which a field may contain.
  const match = /(?<=^|\n)version:1\.5(?=\r?\n|$)[\s\S]*?(?=(?<=\n)--SocialCalcSpreadsheetControlSave|$)/.exec(save);
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
  resetSiblingSheets(): void;
  addSiblingSheet(name: string, save: string): void;
  recalc(): void;
}

// Shared with the browser's cross-sheet loader, which does the same work.
export { MAX_CROSS_SHEET_REFS, MAX_CROSS_SHEET_TOTAL_CHARS };
export const MAX_CROSS_SHEET_NAME_CHARS = 2048;
export const MAX_CROSS_SHEET_SAVE_BYTES = 2 * 1024 * 1024;

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
 * Sibling saves keyed by the sheet name a formula uses. A `null` value
 * records a sheet that was asked for and is unavailable.
 */
export type SiblingSaves = ReadonlyMap<string, string | null>;

/**
 * Fetch the saves of `refs` via the caller-supplied `fetchSibling`.
 *
 * This touches no spreadsheet state, so a Durable Object can (and must) run
 * it BEFORE entering `blockConcurrencyWhile` and hand the result to
 * `applySiblingSaves` under the lock. A sibling answers through its own
 * input gate: fetching it while holding the lock deadlocks as soon as that
 * sibling holds its lock and waits for this room in the same way.
 *
 * `ownName` is the current room's name (from the `?name=` query param);
 * it's used to skip self-references which would be re-entrant DO calls.
 * Pass `undefined` when the caller doesn't know the name (e.g. unit
 * tests).
 */
export async function fetchSiblingSaves(
  refs: readonly string[],
  fetchSibling: (name: string) => Promise<string | null>,
  ownName?: string,
): Promise<Map<string, string | null>> {
  const saves = new Map<string, string | null>();
  let attempted = 0;
  let totalChars = 0;
  for (const ref of refs) {
    saves.set(ref, null);
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
    saves.set(ref, save);
  }
  return saves;
}

/**
 * Replace the spreadsheet's formula cache with the fetched `saves` of
 * `refs` and recalculate. Synchronous, so it is safe under a lock.
 * Returns the number of siblings added (for metrics / tests).
 */
export function applySiblingSaves(
  ss: CrossSheetSpreadsheet,
  refs: readonly string[],
  saves: SiblingSaves,
): number {
  ss.resetSiblingSheets();
  let added = 0;
  for (const ref of refs) {
    const save = saves.get(ref);
    if (!save) continue;
    try {
      ss.addSiblingSheet(ref, extractSheetSave(save));
    } catch {
      // SocialCalc's ParseSheetSave throws on a save it cannot parse, and
      // the sibling's save is whatever its writers last stored. Leave the
      // ref unresolved rather than fail this room's request.
      continue;
    }
    added++;
  }
  ss.recalc();
  // Release parsed sibling snapshots once recalculation finishes so cached
  // rooms do not retain up to MAX_CROSS_SHEET_TOTAL_CHARS each in memory.
  ss.resetSiblingSheets();
  return added;
}

/**
 * Walk the spreadsheet's cross-sheet refs, fetch each sibling's save via
 * the caller-supplied `fetchSibling`, and inject into the spreadsheet's
 * formula cache. Recalculates referenced cells after rebuilding the cache.
 * Returns the number of siblings added (for metrics / tests).
 *
 * Not for use under `blockConcurrencyWhile` — see `fetchSiblingSaves`.
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
  return applySiblingSaves(ss, refs, await fetchSiblingSaves(refs, fetchSibling, ownName));
}
