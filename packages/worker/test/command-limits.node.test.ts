import { describe, expect, it } from 'vite-plus/test';

import {
  MAX_COMMAND_RANGE_WORK,
  MAX_SHEET_CELLS,
  MAX_SOCIALCALC_COL,
  MAX_SOCIALCALC_ROW,
  isCommandBatchWithinLimits,
  isSnapshotWithinSheetLimits,
} from '../src/lib/command-limits.ts';

describe('isCommandBatchWithinLimits', () => {
  it('accepts ordinary commands and exact maintained boundaries', () => {
    expect(
      isCommandBatchWithinLimits('set A1 text t hello\nset ZZ284 value n 1'),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'set sheet lastrow 100000\nset sheet lastcol 2',
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        `set sheet usermaxrow ${MAX_SOCIALCALC_ROW}\nset sheet usermaxcol ${MAX_SOCIALCALC_COL}`,
      ),
    ).toBe(true);
    expect(isCommandBatchWithinLimits('pane row 10\npane col 2')).toBe(true);
  });

  it('rejects per-axis declared-dimension bypasses in one or separate batches', () => {
    expect(
      isCommandBatchWithinLimits(`set sheet lastrow ${MAX_SHEET_CELLS + 1}`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        'set sheet lastrow 100000\nset sheet lastcol 3',
      ),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set sheet lastcol 3', {
        rows: 100_000,
        columns: 1,
      }),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set B1 value n 1', {
        rows: MAX_SHEET_CELLS,
        columns: 1,
      }),
    ).toBe(false);
  });

  it('rejects malformed or out-of-protocol dimensions', () => {
    expect(isCommandBatchWithinLimits('set sheet usermaxrow Infinity')).toBe(
      false,
    );
    expect(isCommandBatchWithinLimits('set sheet lastcol 702.5')).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet usermaxcol -1')).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet lastrow')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`pane row ${MAX_SOCIALCALC_ROW + 1}`),
    ).toBe(false);
    expect(isCommandBatchWithinLimits(`pane col ${MAX_SOCIALCALC_COL + 1}`)).toBe(
      false,
    );
  });

  it('rejects oversized direct targets including absolute references', () => {
    expect(
      isCommandBatchWithinLimits(`set A${MAX_SOCIALCALC_ROW + 1} value n 1`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        `erase $A$1:$A$${MAX_SOCIALCALC_ROW + 1} all`,
      ),
    ).toBe(false);
    expect(isCommandBatchWithinLimits('set A0 value n 1')).toBe(false);
    expect(isCommandBatchWithinLimits('set A1:ZZ100000 value n 1')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`moveinsert A1:A2 A${MAX_SOCIALCALC_ROW + 1}`),
    ).toBe(false);
  });

  it('counts cumulative, reversed, row, and column target work', () => {
    const halfPlusOne = MAX_COMMAND_RANGE_WORK / 2 + 1;
    expect(
      isCommandBatchWithinLimits(
        `set A1:A${halfPlusOne} bgcolor red\nset A1:A${halfPlusOne} bgcolor blue`,
      ),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        `set A${MAX_COMMAND_RANGE_WORK}:A1 bgcolor red`,
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set 1:${MAX_COMMAND_RANGE_WORK} hide yes`),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set 1:${MAX_COMMAND_RANGE_WORK + 1} hide yes`),
    ).toBe(false);
    expect(isCommandBatchWithinLimits('set A:ZZ width 80')).toBe(true);
  });

  it('never interprets cell content or formula payloads as command targets', () => {
    expect(isCommandBatchWithinLimits('set A1 text t N:A')).toBe(true);
    expect(isCommandBatchWithinLimits('set A1 text t 1:250000')).toBe(true);
    expect(isCommandBatchWithinLimits('set A1 formula SUM(A:B)')).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        `set A1 formula SUM($A$1:$A$${MAX_SOCIALCALC_ROW + 1})`,
      ),
    ).toBe(true);
  });

  it('requires a bounded clipboard in the same command batch', () => {
    expect(isCommandBatchWithinLimits('paste C3 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:B2\npaste C3 all')).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard cell:A1:t:x\\ncopiedfrom\\cA1\\cB2\\n\npaste C3 all',
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cZZ100000\npaste A1 all',
      ),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('loadclipboard malformed\npaste A1 all'),
    ).toBe(true);
  });

  it('bounds structural commands by current declared area', () => {
    for (const verb of [
      'merge',
      'unmerge',
      'erase',
      'cut',
      'fillright',
      'filldown',
      'sort',
      'deletecol',
      'deleterow',
    ]) {
      expect(isCommandBatchWithinLimits(`${verb} A1:B2 all`)).toBe(true);
    }
    expect(isCommandBatchWithinLimits('insertrow A2')).toBe(true);
    expect(isCommandBatchWithinLimits('insertcol B1')).toBe(true);
    expect(isCommandBatchWithinLimits('movepaste A1:B2 C3 all')).toBe(true);
    expect(isCommandBatchWithinLimits('moveinsert A1:B2 C3 all')).toBe(true);
    expect(
      isCommandBatchWithinLimits('insertrow A1', {
        rows: MAX_SHEET_CELLS,
        columns: 1,
      }),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('deleterow A1', {
        rows: MAX_SHEET_CELLS + 1,
        columns: 1,
      }),
    ).toBe(false);
    expect(isCommandBatchWithinLimits('name define RANGE A1:B2')).toBe(true);
    expect(isCommandBatchWithinLimits('')).toBe(true);
  });

  it('bounds whole-row and whole-column targets', () => {
    expect(isCommandBatchWithinLimits('set 5:9 height 20')).toBe(true);
    expect(isCommandBatchWithinLimits('set 7 height 20')).toBe(true);
    expect(isCommandBatchWithinLimits('set A:C width 100')).toBe(true);
    expect(isCommandBatchWithinLimits('set B width 100')).toBe(true);
    // Row 0 does not exist, and the ceiling is exclusive of MAX+1.
    expect(isCommandBatchWithinLimits('set 0:9 height 20')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set 1:${MAX_SOCIALCALC_ROW + 1} height 20`),
    ).toBe(false);
    // Whole-row/column edits never expand the declared area, so an
    // already-oversized legacy sheet can still be edited.
    expect(
      isCommandBatchWithinLimits('set 9 height 20', {
        rows: MAX_SHEET_CELLS,
        columns: 1,
      }),
    ).toBe(true);
  });

  it('treats named ranges as opaque without expanding the sheet', () => {
    expect(isCommandBatchWithinLimits('set myrange bgcolor red')).toBe(true);
    expect(isCommandBatchWithinLimits('erase myrange all')).toBe(true);
    expect(isCommandBatchWithinLimits('movepaste myrange other all')).toBe(true);
  });

  it('rejects a paste whose destination pushes the area past the cap', () => {
    expect(
      isCommandBatchWithinLimits(
        `loadclipboard copiedfrom\\cA1\\cB1000\npaste A${MAX_SHEET_CELLS} all`,
      ),
    ).toBe(false);
  });

  it('rejects structural verbs with unparseable targets', () => {
    expect(isCommandBatchWithinLimits('insertrow 0:5')).toBe(false);
    expect(isCommandBatchWithinLimits('insertcol 0:5')).toBe(false);
    expect(isCommandBatchWithinLimits('deleterow 0:5')).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol 0:5')).toBe(false);
    expect(isCommandBatchWithinLimits('moveinsert 0:5 A1')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste A1:B2 0:5')).toBe(false);
  });

  it('bounds move verbs against the declared area', () => {
    // moveinsert grows the sheet, so it is refused outright once the
    // existing declared area is already over budget.
    expect(
      isCommandBatchWithinLimits('moveinsert A1:B2 C3 all', {
        rows: MAX_SHEET_CELLS + 1,
        columns: 1,
      }),
    ).toBe(false);
    // movepaste does not insert, but its destination still expands.
    expect(
      isCommandBatchWithinLimits(
        `movepaste A1:A1000 A${MAX_SHEET_CELLS} all`,
      ),
    ).toBe(false);
    // Row growth from the insert itself is what breaks this one: the
    // destination lands inside the current area but the shift does not.
    expect(
      isCommandBatchWithinLimits('moveinsert A1:A1000 A2 all', {
        rows: MAX_SHEET_CELLS - 500,
        columns: 1,
      }),
    ).toBe(false);
  });

  it('rejects copy, paste, and insert work beyond the budget', () => {
    expect(isCommandBatchWithinLimits('copy 0:5 all')).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        `loadclipboard copiedfrom\\cA1\\cB${MAX_SHEET_CELLS}\npaste A1 all`,
      ),
    ).toBe(false);
    // The clipboard itself fits, but pasting it exceeds what the batch has
    // left: copy charges 120k of the 200k range budget, paste charges again.
    expect(isCommandBatchWithinLimits('copy A1:B60000 all')).toBe(true);
    expect(
      isCommandBatchWithinLimits('copy A1:B60000 all\npaste C1 all'),
    ).toBe(false);
    // An already-oversized declared area refuses structural growth outright.
    expect(
      isCommandBatchWithinLimits('insertrow A1', {
        rows: MAX_SHEET_CELLS + 1,
        columns: 1,
      }),
    ).toBe(false);
  });

  it('pins the cell-target row boundaries', () => {
    expect(isCommandBatchWithinLimits('set A1 value n 1')).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set A${MAX_SOCIALCALC_ROW} value n 1`, {
        rows: MAX_SOCIALCALC_ROW,
        columns: 1,
      }),
    ).toBe(true);
    expect(isCommandBatchWithinLimits('set A0 value n 1')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set A${MAX_SOCIALCALC_ROW + 1} value n 1`),
    ).toBe(false);
    // Row indexes beyond 2^53 stop being safe integers.
    expect(isCommandBatchWithinLimits('set A99999999999999999999 value n 1')).toBe(
      false,
    );
    // The same bounds apply to the end of a range, not just its start.
    expect(isCommandBatchWithinLimits('set A1:B0 bgcolor red')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set A1:B${MAX_SOCIALCALC_ROW + 1} bgcolor red`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set A99999999999999999999:B1 bgcolor red'),
    ).toBe(false);
  });

  it('parses absolute refs, mixed case, and two-letter columns', () => {
    expect(isCommandBatchWithinLimits('set $A$1 value n 1')).toBe(true);
    expect(isCommandBatchWithinLimits('set zz1 value n 1')).toBe(true);
    expect(isCommandBatchWithinLimits('set a1:Zz2 bgcolor red')).toBe(true);
    // Column ZZ (702) is the last one SocialCalc's parser understands; a
    // three-letter reference is not a cell target at all, so it falls
    // through to the opaque named-range path rather than being charged.
    expect(isCommandBatchWithinLimits('set AAA1 value n 1')).toBe(true);
  });

  it('charges range area, not just row count', () => {
    // 400 columns x 500 rows = 200_000 = the whole budget.
    expect(isCommandBatchWithinLimits('erase A1:OJ500 all')).toBe(true);
    // One more row crosses it.
    expect(isCommandBatchWithinLimits('erase A1:OJ501 all')).toBe(false);
  });

  it('validates declared dimensions and the caller-supplied initial area', () => {
    // `set sheet lastrow` rejects blanks, non-numbers, negatives, and
    // fractions; zero is legal (an empty sheet).
    expect(isCommandBatchWithinLimits('set sheet lastrow 0')).toBe(true);
    expect(isCommandBatchWithinLimits('set sheet lastrow')).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet lastrow abc')).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet lastrow -1')).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet lastrow 1.5')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set sheet lastcol ${MAX_SOCIALCALC_COL}`),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set sheet lastcol ${MAX_SOCIALCALC_COL + 1}`),
    ).toBe(false);
    // A malformed or out-of-range initial area falls back to 1x1 rather
    // than trusting the caller.
    for (const initial of [
      { rows: 0, columns: 1 },
      { rows: 1.5, columns: 1 },
      { rows: MAX_SOCIALCALC_ROW + 1, columns: 1 },
      { rows: Number.NaN, columns: 1 },
    ]) {
      expect(
        isCommandBatchWithinLimits('set sheet lastcol 2', initial),
        JSON.stringify(initial),
      ).toBe(true);
    }
  });

  it('bounds pane offsets on both axes', () => {
    expect(isCommandBatchWithinLimits('pane row 0')).toBe(true);
    expect(isCommandBatchWithinLimits('pane row')).toBe(false);
    expect(
      isCommandBatchWithinLimits(`pane row ${MAX_SOCIALCALC_ROW + 1}`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(`pane col ${MAX_SOCIALCALC_COL + 1}`),
    ).toBe(false);
    // An unknown pane axis carries no dimension to validate.
    expect(isCommandBatchWithinLimits('pane diagonal 9999999')).toBe(true);
  });

  it('reads the clipboard range from either copiedfrom delimiter', () => {
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom:A1:B2\npaste C3 all',
      ),
    ).toBe(true);
    // The last copiedfrom in the batch wins, and an over-area one is refused.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cB2 copiedfrom\\cA1\\cZZ100000\npaste C3 all',
      ),
    ).toBe(false);
  });

  it('distinguishes row inserts from column inserts, case-insensitively', () => {
    // 199_999 x 1 leaves room for exactly one more row but not one more
    // column, so the two verbs must not be interchangeable.
    const nearlyFull = { rows: 199_999, columns: 1 } as const;
    expect(isCommandBatchWithinLimits('insertrow A1', nearlyFull)).toBe(true);
    expect(isCommandBatchWithinLimits('INSERTROW A1', nearlyFull)).toBe(true);
    expect(isCommandBatchWithinLimits('insertcol A1', nearlyFull)).toBe(false);
    expect(isCommandBatchWithinLimits('INSERTCOL A1', nearlyFull)).toBe(false);
  });

  it('applies the structural pre-check to moveinsert only', () => {
    // An already-oversized sheet may still move content around, but not
    // insert more of it.
    const oversized = { rows: MAX_SHEET_CELLS + 1, columns: 1 } as const;
    expect(isCommandBatchWithinLimits('movepaste A1:A2 A3 all', oversized)).toBe(
      true,
    );
    expect(isCommandBatchWithinLimits('moveinsert A1:A2 A3 all', oversized)).toBe(
      false,
    );
    expect(isCommandBatchWithinLimits('MOVEINSERT A1:A2 A3 all', oversized)).toBe(
      false,
    );
  });

  it('measures the pasted block from its destination corner', () => {
    // A two-row clipboard landing on row 199_999 ends exactly at the cap.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cA2\npaste A199999 all',
      ),
    ).toBe(true);
    // A three-row clipboard on the same row runs one past it.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cA3\npaste A199999 all',
      ),
    ).toBe(false);
  });

  it('rejects a cell range whose start row is out of range even when its end is valid', () => {
    // Only the start-row clause can catch this: the end row is legal and
    // the range is small enough to stay inside the work budget.
    expect(isCommandBatchWithinLimits('set A0:B5 bgcolor red')).toBe(false);
    expect(isCommandBatchWithinLimits('set 0:5 height 20')).toBe(false);
  });
});

describe('isSnapshotWithinSheetLimits', () => {
  it('accepts empty and bounded canonical saves', () => {
    expect(isSnapshotWithinSheetLimits('')).toBe(true);
    // Bare `sheet:` is the empty default SocialCalc emits before any c/r.
    expect(isSnapshotWithinSheetLimits('sheet:')).toBe(true);
    expect(
      isSnapshotWithinSheetLimits(
        [
          'SocialCalcSpreadsheetControlSave',
          'version:1.5',
          'part:sheet',
          'sheet:',
          'cell:A1:t:tpl-seed:1',
          'end',
        ].join('\n'),
      ),
    ).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1')).toBe(true);
    expect(
      isSnapshotWithinSheetLimits(
        'socialcalc:version:1.5\nsheet:c:2:r:100000:tvf:1\n',
      ),
    ).toBe(true);
  });

  it('rejects malformed, over-area, and out-of-axis saves', () => {
    expect(isSnapshotWithinSheetLimits('\nsheet:not-canonical\n')).toBe(false);
    expect(
      isSnapshotWithinSheetLimits('\nsheet:c:3:r:100000:tvf:1\n'),
    ).toBe(false);
    expect(
      isSnapshotWithinSheetLimits(
        `\nsheet:c:1:r:${MAX_SOCIALCALC_ROW + 1}:tvf:1\n`,
      ),
    ).toBe(false);
    expect(
      isSnapshotWithinSheetLimits(
        `\nsheet:c:${MAX_SOCIALCALC_COL + 1}:r:1:tvf:1\n`,
      ),
    ).toBe(false);
    expect(
      isSnapshotWithinSheetLimits(
        'sheet:c:1:r:1\rsheet:c:702:r:1048576',
      ),
    ).toBe(false);
    expect(
      isSnapshotWithinSheetLimits(
        'sheet:c:1:r:1\nsheet:c:702:r:1048576',
      ),
    ).toBe(false);
  });

  it('pins the canonical dimension grammar', () => {
    // Both terminators are canonical: end-of-line and a further `:field`.
    expect(isSnapshotWithinSheetLimits('sheet:c:2:r:3')).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:2:r:3:tvf:1')).toBe(true);
    // The dimensions must start the sheet payload and be digits only.
    expect(isSnapshotWithinSheetLimits('sheet:xc:2:r:3')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:2:r:3x')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:2:r:')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c::r:3')).toBe(false);
  });

  it('pins each axis bound independently', () => {
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1')).toBe(true);
    expect(
      isSnapshotWithinSheetLimits(`sheet:c:${MAX_SOCIALCALC_COL}:r:1`),
    ).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:0:r:1')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:0')).toBe(false);
    // Beyond 2^53 the declared count stops being a safe integer.
    expect(
      isSnapshotWithinSheetLimits('sheet:c:1:r:99999999999999999999'),
    ).toBe(false);
    expect(
      isSnapshotWithinSheetLimits('sheet:c:99999999999999999999:r:1'),
    ).toBe(false);
    // Exact area ceiling passes; one cell more does not.
    expect(
      isSnapshotWithinSheetLimits(`sheet:c:2:r:${MAX_SHEET_CELLS / 2}`),
    ).toBe(true);
    expect(
      isSnapshotWithinSheetLimits(`sheet:c:2:r:${MAX_SHEET_CELLS / 2 + 1}`),
    ).toBe(false);
  });
});
