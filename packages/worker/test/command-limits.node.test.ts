import { describe, expect, it } from 'vite-plus/test';

import {
  MAX_COMMAND_RANGE_WORK,
  MAX_COMMAND_SHEET_WORK,
  MAX_LEGACY_SHEET_CELLS,
  MAX_SHEET_CELLS,
  MAX_SOCIALCALC_COL,
  MAX_SOCIALCALC_ROW,
  isCommandBatchWithinLimits,
  isSaveAreaWithinLimits,
  isSnapshotWithinSheetLimits,
  storedSnapshotAreaLimit,
  storedSnapshotEntries,
} from '../src/lib/command-limits.ts';

const batch = (line: string, count: number): string =>
  Array<string>(count).fill(line).join('\n');

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

  it('ignores sheet attribute spellings SocialCalc does not execute', () => {
    // SocialCalc compares `sheet`, `lastrow` and `lastcol` case-sensitively,
    // so these lines leave the engine's dimensions alone. They must not
    // shrink the modelled sheet and hide its area from a later command.
    for (const noop of [
      'set sheet LASTROW 1',
      'set sheet LastRow 1',
      'set SHEET lastrow 1',
    ]) {
      expect(
        isCommandBatchWithinLimits(
          `set sheet lastrow 50000\n${noop}\nset sheet lastcol ${MAX_SOCIALCALC_COL}\ninsertrow A1`,
        ),
        noop,
      ).toBe(false);
      expect(
        isCommandBatchWithinLimits(`${noop}\ninsertrow A1`, {
          rows: MAX_SHEET_CELLS + 1,
          columns: 1,
        }),
        noop,
      ).toBe(false);
    }
    expect(
      isCommandBatchWithinLimits(
        `set sheet LASTCOL 1\nset sheet lastrow ${MAX_SHEET_CELLS / 2 + 1}`,
        { rows: MAX_SHEET_CELLS / 2, columns: 2 },
      ),
    ).toBe(false);
    // The exact spelling is a real shrink on both sides.
    expect(
      isCommandBatchWithinLimits(
        `set sheet lastrow 50000\nset sheet lastrow 1\nset sheet lastcol ${MAX_SOCIALCALC_COL}\ninsertrow A1`,
      ),
    ).toBe(true);
    // Unknown spellings are not dimension commands, so their operand is not
    // validated either.
    expect(isCommandBatchWithinLimits('set sheet LASTROW abc')).toBe(true);
    expect(isCommandBatchWithinLimits('set sheet USERMAXROW Infinity')).toBe(
      true,
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
    expect(isCommandBatchWithinLimits('COPY A1:B2\npaste C3 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy\tA1:B2\npaste C3 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:B2\rpaste C3 all')).toBe(false);
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
      'deletecol',
      'deleterow',
    ]) {
      expect(isCommandBatchWithinLimits(`${verb} A1:B2 all`)).toBe(true);
    }
    expect(isCommandBatchWithinLimits('sort A1:B2 A up')).toBe(true);
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
    // Whole-row/column edits inside the existing area do not expand it, so
    // an already-oversized legacy sheet can still be edited.
    expect(
      isCommandBatchWithinLimits('set 9 height 20', {
        rows: MAX_SHEET_CELLS,
        columns: 1,
      }),
    ).toBe(true);
  });

  it('counts row and column settings towards the sheet area', () => {
    // SocialCalc leaves lastrow/lastcol alone for these, but canonicalizes
    // the next save out to the farthest setting on each axis.
    expect(
      isCommandBatchWithinLimits(
        `set ${MAX_SOCIALCALC_ROW} height 20\nset ZZ width 20`,
      ),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SHEET_CELLS + 1} hide yes`),
    ).toBe(false);
    // 284 x 702 = 199_368 fits; one more row or the last column does not.
    expect(isCommandBatchWithinLimits('set 284 height 20\nset ZZ hide yes')).toBe(true);
    expect(isCommandBatchWithinLimits('set ZZ width 20\nset 285 height 20')).toBe(false);
    expect(isCommandBatchWithinLimits('set 285 hide yes\nset A:ZZ width 20')).toBe(false);
    expect(
      isCommandBatchWithinLimits('set ZZ width 20', { rows: 285, columns: 1 }),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set 285 height 20', { rows: 1, columns: 702 }),
    ).toBe(false);
  });

  it('accepts a non-coordinate target only where SocialCalc ignores it', () => {
    // `set` matches its target against anchored patterns and skips the rest.
    expect(isCommandBatchWithinLimits('set myrange bgcolor red')).toBe(true);
    expect(isCommandBatchWithinLimits('set A1:@ZZ1048576 bgcolor red')).toBe(true);
    // Every other verb hands the token to ParseRange/coordToCr, which has no
    // name lookup and skips the characters it does not know.
    expect(isCommandBatchWithinLimits('erase myrange all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste myrange other all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste A1 other all')).toBe(false);
    for (const verb of [
      'merge',
      'unmerge',
      'erase',
      'cut',
      'fillright',
      'filldown',
      'sort',
      'insertrow',
      'insertcol',
      'deleterow',
      'deletecol',
      'movepaste',
      'moveinsert',
    ]) {
      for (const target of [
        'A1:@ZZ1048576',
        '@A1:ZZ1048576',
        'A1:ZZ1048576\t',
        'A1:AAA1048576',
        'A1:1048576',
        '@ZZ1048576',
        '',
      ]) {
        expect(
          isCommandBatchWithinLimits(`${verb} ${target} B2 all`),
          `${verb} ${target}`,
        ).toBe(false);
      }
    }
    expect(isCommandBatchWithinLimits('copy A1\npaste @ZZ1048576 all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste A1 @ZZ1048576 all')).toBe(false);
    expect(isCommandBatchWithinLimits('moveinsert A1 A@1048576 all')).toBe(false);
  });

  it('reads a move destination as the single coordinate coordToCr sees', () => {
    expect(isCommandBatchWithinLimits('movepaste A1 B2 all')).toBe(true);
    expect(isCommandBatchWithinLimits('movepaste A1 B2:B2 all')).toBe(false);
    expect(isCommandBatchWithinLimits('moveinsert A1 A1:Z1048576 all')).toBe(false);
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
    // A malformed initial area falls back to 1x1 rather than trusting the
    // caller.
    for (const initial of [
      { rows: 0, columns: 1 },
      { rows: 1.5, columns: 1 },
      { rows: Number.NaN, columns: 1 },
    ]) {
      expect(
        isCommandBatchWithinLimits('set sheet lastcol 2', initial),
        JSON.stringify(initial),
      ).toBe(true);
    }
  });

  it('keeps a reported size beyond the addressable maximum instead of resetting it', () => {
    // `movepaste A1:B1 ZZ1` leaves SocialCalc with lastcol 703, and its
    // structural loops run to that column. The next batch must be judged
    // against 703 columns, not against a one-column sheet.
    expect(isCommandBatchWithinLimits('movepaste A1:B1 ZZ1 all')).toBe(true);
    const pastZZ = { rows: 1, columns: MAX_SOCIALCALC_COL + 1 };
    const grow = 'set sheet lastrow 100000\ninsertrow A1';
    expect(isCommandBatchWithinLimits(grow, { rows: 1, columns: 1 })).toBe(true);
    expect(isCommandBatchWithinLimits(grow, { rows: 1, columns: MAX_SOCIALCALC_COL })).toBe(false);
    expect(isCommandBatchWithinLimits(grow, pastZZ)).toBe(false);
    expect(isCommandBatchWithinLimits('set sheet lastrow 283\ninsertrow A1', pastZZ)).toBe(true);
    expect(isCommandBatchWithinLimits('set sheet lastrow 285', pastZZ)).toBe(false);
    // Such a sheet can still be edited and narrowed.
    expect(isCommandBatchWithinLimits('set A1 value n 1', pastZZ)).toBe(true);
    expect(isCommandBatchWithinLimits('set sheet lastcol 1\nset sheet lastrow 100000', pastZZ)).toBe(true);
    // The same holds on the row axis.
    expect(
      isCommandBatchWithinLimits('set sheet lastcol 2', { rows: MAX_SOCIALCALC_ROW + 1, columns: 1 }),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set A1 value n 1', { rows: MAX_SOCIALCALC_ROW + 1, columns: 1 }),
    ).toBe(true);
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
    // Every copiedfrom record in the clipboard is checked, and the last wins.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cZZ100000\\ncopiedfrom\\cA1\\cB2\npaste C3 all',
      ),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cB2\\ncopiedfrom\\cA1\\cA3\npaste A199998 all',
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cA3\\ncopiedfrom\\cA1\\cB2\npaste A199998 all',
      ),
    ).toBe(false);
  });

  it('reads a clipboard range the way SocialCalc parses the save', () => {
    // ParseRange skips `$` and the characters it does not know, and takes a
    // backslash for a column letter; none of these may hide the range.
    for (const range of [
      'A1:@ZZ1048576',
      '@A1:ZZ1048576',
      '$A$1:$ZZ$1048576',
      'A1:B2\\b1048576',
      'A1:B2 ',
      'A1',
    ]) {
      expect(
        isCommandBatchWithinLimits(`loadclipboard copiedfrom:${range}\npaste A1 all`),
        range,
      ).toBe(false);
      expect(
        isCommandBatchWithinLimits(
          `loadclipboard copiedfrom\\c${range.replace(':', '\\c')}\\n\npaste A1 all`,
        ),
        range,
      ).toBe(false);
    }
    expect(
      isCommandBatchWithinLimits('loadclipboard copiedfrom:$A$1:$B$2\npaste A1 all'),
    ).toBe(true);
    // Only a record at the start of a decoded line is a copiedfrom record.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard cell:A1:t:x copiedfrom:A1:ZZ100000\npaste A1 all',
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard cell:A1:t:x\rcopiedfrom:A1:ZZ100000\npaste A1 all',
      ),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard cell:A1:t:x\r\\ncopiedfrom:A1:ZZ100000\npaste A1 all',
      ),
    ).toBe(false);
    // Without a record the clipboard is A1:A1, and the paste still expands
    // the sheet to its destination.
    expect(isCommandBatchWithinLimits('loadclipboard\npaste A1 all')).toBe(true);
    expect(
      isCommandBatchWithinLimits('loadclipboard malformed\npaste ZZ284 all'),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits('loadclipboard malformed\npaste ZZ285 all'),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard malformed\npaste ZZ1048576 all\ninsertrow A1',
      ),
    ).toBe(false);
  });

  it('distinguishes executable row and column insert verbs', () => {
    // 199_999 x 1 leaves room for exactly one more row but not one more
    // column, so the two verbs must not be interchangeable.
    const nearlyFull = { rows: 199_999, columns: 1 } as const;
    expect(isCommandBatchWithinLimits('insertrow A1', nearlyFull)).toBe(true);
    expect(isCommandBatchWithinLimits('INSERTROW A1', nearlyFull)).toBe(true);
    expect(isCommandBatchWithinLimits('insertcol A1', nearlyFull)).toBe(false);
    expect(isCommandBatchWithinLimits('INSERTCOL A1', nearlyFull)).toBe(true);
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
      true,
    );
  });

  it('charges a paste for the range an earlier cut put on the clipboard', () => {
    expect(isCommandBatchWithinLimits('cut A1:B2 all\npaste C3 all')).toBe(true);
    // Only `cut` fills the clipboard; its sibling range verbs do not.
    expect(isCommandBatchWithinLimits('erase A1:B2 all\npaste C3 all')).toBe(false);
    // The cut range replaces a smaller clipboard loaded before it.
    expect(
      isCommandBatchWithinLimits(
        'loadclipboard copiedfrom\\cA1\\cA1\ncut A1:A120000 all\npaste A1 all',
      ),
    ).toBe(false);
    // ...and a larger one, so a one-cell cut makes the next paste cheap again.
    expect(
      isCommandBatchWithinLimits(
        'copy A1:A120000\ncut A1 all\npaste A1 all\npaste A1 all',
      ),
    ).toBe(true);
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

  it('uses valid initial dimensions when checking later structural growth', () => {
    expect(isCommandBatchWithinLimits('insertcol A1', {
      rows: 100_001,
      columns: 0,
    })).toBe(false);
    expect(isCommandBatchWithinLimits('insertcol A1', {
      rows: 100_001,
      columns: -1,
    })).toBe(false);
    expect(isCommandBatchWithinLimits('insertcol A1', {
      rows: 100_000,
      columns: 1.5,
    })).toBe(true);
    expect(isCommandBatchWithinLimits('insertrow A1', {
      rows: Number.POSITIVE_INFINITY,
      columns: 1,
    })).toBe(true);
  });

  it('distinguishes complete targets from named ranges', () => {
    expect(isCommandBatchWithinLimits('set prefixA200001 value n 1')).toBe(true);
    expect(isCommandBatchWithinLimits('set A200001suffix value n 1')).toBe(true);
    expect(isCommandBatchWithinLimits('set ZZ285 value n 1')).toBe(false);
    expect(isCommandBatchWithinLimits('set $ZZ$285 value n 1')).toBe(false);
    expect(isCommandBatchWithinLimits('set row_0 height 20')).toBe(true);
    expect(isCommandBatchWithinLimits('set 0suffix height 20')).toBe(true);
    expect(isCommandBatchWithinLimits('set 0 height 20')).toBe(false);
    expect(isCommandBatchWithinLimits('set 10:200010 height 20')).toBe(false);
  });

  it('keeps whole-column targets distinct from other tokens', () => {
    expect(isCommandBatchWithinLimits('copy prefixA:B\npaste A1 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A:Bsuffix\npaste A1 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A:B\npaste A1 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A:ZZ\npaste A285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy ZZ:A\npaste A285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy ZZ\npaste ZZ285 all')).toBe(false);
  });

  it('checks clipboard coordinates and the exact area ceiling', () => {
    expect(isCommandBatchWithinLimits('loadclipboard copiedfrom\\cA0\\cB2\npaste A1 all')).toBe(false);
    expect(isCommandBatchWithinLimits('loadclipboard copiedfrom\\cZZ1\\cZZ200001\npaste A1 all')).toBe(false);
    expect(isCommandBatchWithinLimits('loadclipboard copiedfrom\\cA1000\\cZZ1000\npaste A1 all')).toBe(true);
    expect(isCommandBatchWithinLimits('loadclipboard copiedfrom\\cA1\\cB100000\npaste A1 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1\npaste A1 all\nset 1:199998 height 20')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1\npaste A1 all\nset 1:199999 height 20')).toBe(false);
  });

  it('charges clipboard placement from its destination corner', () => {
    expect(isCommandBatchWithinLimits('copy A1:B1\npaste ZZ285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:C1\npaste namedrange all', {
      rows: MAX_SHEET_CELLS,
      columns: 1,
    })).toBe(false);
    expect(isCommandBatchWithinLimits('copy myrange\npaste ZZ285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:B2\npaste 0:5 all')).toBe(false);
  });

  it('checks structural operations at and beyond the area ceiling', () => {
    expect(isCommandBatchWithinLimits('deleterow A1', {
      rows: MAX_SHEET_CELLS,
      columns: 1,
    })).toBe(true);
    expect(isCommandBatchWithinLimits('deletecol A1', {
      rows: MAX_SHEET_CELLS,
      columns: 1,
    })).toBe(true);
    expect(isCommandBatchWithinLimits('insertcol A:B', {
      rows: 66_666,
      columns: 1,
    })).toBe(false);
  });

  it('refuses a delete whose range SocialCalc would turn into an insert', () => {
    // SocialCalc shifts by `start - end - 1` without ordering the corners, so
    // a reversed range adds rows or columns instead of removing them.
    const largest = { rows: 284, columns: 702 };
    expect(isCommandBatchWithinLimits('deleterow A284:A1', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deleterow 284:1', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deleterow $A$2:$A$1')).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol ZZ1:A1', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol ZZ:A', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol B1:A1')).toBe(false);
    // Only the deleted axis decides the direction of the shift.
    expect(isCommandBatchWithinLimits('deleterow B1:A284', largest)).toBe(true);
    expect(isCommandBatchWithinLimits('deletecol A284:ZZ1', largest)).toBe(true);
    expect(isCommandBatchWithinLimits('deleterow 1:284', largest)).toBe(true);
    expect(isCommandBatchWithinLimits('deletecol A:ZZ', largest)).toBe(true);
    // `coordToCr` reads `A284_:A1` as the same reversed corners, and these
    // verbs never resolve a named range.
    expect(isCommandBatchWithinLimits('deleterow A284_:A1', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol ZZ1:A1_', largest)).toBe(false);
    expect(isCommandBatchWithinLimits('deleterow namedrange')).toBe(false);
    expect(isCommandBatchWithinLimits('deletecol namedrange')).toBe(false);
  });

  it('checks both axes when moving a rectangular block', () => {
    expect(isCommandBatchWithinLimits('movepaste A3:A1 A199998 all')).toBe(true);
    expect(isCommandBatchWithinLimits('movepaste A3:A1 A199999 all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste A1:C1 ZY285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste namedrange ZZ285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('movepaste namedrange ZZ284 all')).toBe(false);
  });

  it('charges a paste for the destination range it tiles', () => {
    // SocialCalc repeats the clipboard across the destination range, so one
    // copied cell pasted over a rectangle costs as much as erasing it.
    expect(isCommandBatchWithinLimits('copy A1\npaste A1:ZZ5000 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1\npaste ZZ5000:A1 all')).toBe(false);
    // copy charges 1, so 400 x 499 fits the budget and 400 x 500 does not.
    expect(isCommandBatchWithinLimits('copy A1\npaste A1:OJ499 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1\npaste A1:OJ500 all')).toBe(false);
    // A bare clipboard defaults to 1x1 and is still tiled over the destination.
    expect(isCommandBatchWithinLimits('loadclipboard\npaste A1:OJ500 all')).toBe(true);
    expect(isCommandBatchWithinLimits('loadclipboard\npaste A1:OJ501 all')).toBe(false);
    expect(
      isCommandBatchWithinLimits('loadclipboard cell:A1:t:x\npaste A1:ZZ5000 all'),
    ).toBe(false);
    // The destination range extends the sheet even when it is cheap to fill.
    expect(isCommandBatchWithinLimits('copy A1\npaste ZZ1:ZZ284 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1\npaste ZZ1:ZZ285 all')).toBe(false);
  });

  it('takes the larger of clipboard and destination on each axis', () => {
    // 1000 clipboard rows x 199 destination columns, plus the copy itself,
    // is exactly the budget; neither operand alone comes close.
    expect(isCommandBatchWithinLimits('copy A1:A1000\npaste A1:GQ1 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1:A1000\npaste A1:GR1 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:GQ1\npaste A1:A1000 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1:GR1\npaste A1:A1000 all')).toBe(false);
    // Whole-row and whole-column destinations are tiled the same way.
    expect(isCommandBatchWithinLimits('copy A1:ZY1\npaste 1:284 all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1:ZY1\npaste 1:285 all')).toBe(false);
    expect(isCommandBatchWithinLimits('copy A1:A284\npaste A:ZY all')).toBe(true);
    expect(isCommandBatchWithinLimits('copy A1:A285\npaste A:ZY all')).toBe(false);
  });

  it('accounts for insertion after a move', () => {
    expect(isCommandBatchWithinLimits('moveinsert A1:A2 A3 all', {
      rows: 99_998,
      columns: 1,
    })).toBe(true);
    expect(isCommandBatchWithinLimits('moveinsert A1:A2 A3 all', {
      rows: 99_999,
      columns: 1,
    })).toBe(false);
    expect(isCommandBatchWithinLimits('moveinsert A1:C1 A1 all', {
      rows: 49_999,
      columns: 1,
    })).toBe(false);
    expect(isCommandBatchWithinLimits('moveinsert namedrange other all', {
      rows: MAX_SHEET_CELLS,
      columns: 1,
    })).toBe(false);
  });

  it('applies range work limits to each direct range verb', () => {
    for (const verb of ['merge', 'unmerge', 'erase', 'cut', 'fillright', 'filldown']) {
      expect(isCommandBatchWithinLimits(`${verb} A1:ZZ285 all`), verb).toBe(false);
    }
    expect(isCommandBatchWithinLimits('sort A1:ZZ285 A up')).toBe(false);
    expect(isCommandBatchWithinLimits('sort A1:ZZ284 A up')).toBe(true);
  });

  it('takes only columns as sort keys', () => {
    expect(isCommandBatchWithinLimits('sort A1:C9 A up')).toBe(true);
    expect(isCommandBatchWithinLimits('sort A1:C9 C down zz up A down B up')).toBe(true);
    expect(isCommandBatchWithinLimits('sort A1:C9  up')).toBe(true);
    expect(isCommandBatchWithinLimits(`sort A1:A9 ${'A'.repeat(20_000)} up`)).toBe(false);
    for (const key of ['AAA', 'A1', '$A', '1', 'A:B']) {
      expect(isCommandBatchWithinLimits(`sort A1:C9 ${key} up`), key).toBe(false);
      expect(isCommandBatchWithinLimits(`sort A1:C9 A up B up C up ${key} up`), key).toBe(false);
    }
    expect(isCommandBatchWithinLimits('sort A1:C9 A AAA B 12 C up A down AAA')).toBe(true);
  });

  it('leaves unrelated sheet settings outside the dimension check', () => {
    expect(isCommandBatchWithinLimits('set sheet printarea 1048577')).toBe(true);
  });

  it('charges whole-sheet verbs for the sheet rather than their target', () => {
    // One declared cell over a full sheet of entries: only the sheet budget
    // can refuse these batches, and it admits exactly ten walks.
    const full = { rows: 1, columns: 1, entries: MAX_SHEET_CELLS } as const;
    const walks = MAX_COMMAND_SHEET_WORK / MAX_SHEET_CELLS;
    expect(walks).toBe(10);
    for (const line of [
      'copy A1 all',
      'cut A1 all',
      'insertrow A1',
      'insertcol A1',
      'deleterow A1',
      'deletecol A1',
      'movepaste A1 A1 all',
      'moveinsert A1 A1 all',
      'pane row 2',
      'set sheet defaulttextvalueformat text-plain',
      'set sheet defaultnontextvalueformat #,##0',
    ]) {
      expect(isCommandBatchWithinLimits(batch(line, walks), full), line).toBe(true);
      expect(isCommandBatchWithinLimits(batch(line, walks + 1), full), line).toBe(false);
    }
    // A paste parses the clipboard that the copy before it serialized.
    expect(
      isCommandBatchWithinLimits(`copy A1 all\n${batch('paste B1 all', walks - 1)}`, full),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`copy A1 all\n${batch('paste B1 all', walks)}`, full),
    ).toBe(false);
    // The verbs draw on one budget between them.
    const mixed = [
      batch('copy A1 all', 3),
      batch('deleterow A1', 3),
      batch('movepaste A1 A1 all', 3),
    ].join('\n');
    expect(isCommandBatchWithinLimits(`${mixed}\ncut A1 all`, full)).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        `${mixed}\ncut A1 all\nset sheet defaulttextvalueformat text-plain`,
        full,
      ),
    ).toBe(false);
    // A small sheet keeps room for long structural batches such as an undo.
    expect(
      isCommandBatchWithinLimits(batch('deleterow A1', 2000), { rows: 100, columns: 10 }),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(batch('deleterow A1', 2001), { rows: 100, columns: 10 }),
    ).toBe(false);
  });

  it('leaves range-bound verbs and other settings outside the sheet budget', () => {
    const full = { rows: 1, columns: 1, entries: MAX_SHEET_CELLS } as const;
    for (const line of [
      'set A1 value n 1',
      'erase A1 all',
      'merge A1:B2',
      'unmerge A1',
      'sort A1:A2 A up',
      'fillright A1:B1 all',
      'filldown A1:A2 all',
      'name define RANGE A1:B2',
      'loadclipboard copiedfrom\\cA1\\cB2',
      'recalc',
      'set sheet defaulttextformat left',
      'set sheet defaultcolor rgb(0,0,0)',
      'COPY A1 all',
      'DELETEROW A1',
    ]) {
      expect(isCommandBatchWithinLimits(batch(line, 11), full), line).toBe(true);
    }
  });

  it('pins the whole-sheet budget boundary', () => {
    expect(
      isCommandBatchWithinLimits('copy A1 all', {
        rows: 1,
        columns: 1,
        entries: MAX_COMMAND_SHEET_WORK,
      }),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits('copy A1 all', {
        rows: 1,
        columns: 1,
        entries: MAX_COMMAND_SHEET_WORK + 1,
      }),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits('set sheet defaulttextvalueformat text-plain', {
        rows: 1,
        columns: 1,
        entries: MAX_COMMAND_SHEET_WORK + 1,
      }),
    ).toBe(false);
    // Without entries the declared area is the measure, legacy sheets included.
    const legacy = { rows: MAX_LEGACY_SHEET_CELLS, columns: 1 } as const;
    expect(isCommandBatchWithinLimits(batch('copy A1 all', 5), legacy)).toBe(true);
    expect(isCommandBatchWithinLimits(batch('copy A1 all', 6), legacy)).toBe(false);
    // Fewer entries than the declared area never lower the charge.
    expect(
      isCommandBatchWithinLimits(batch('copy A1 all', 6), { ...legacy, entries: 1 }),
    ).toBe(false);
  });

  it('measures the sheet at its high-water mark', () => {
    const copies = (count: number): string => batch('copy A1 all', count);
    const declared = { rows: MAX_SHEET_CELLS, columns: 1 } as const;
    // Shrinking the declared area keeps the stored cells.
    expect(
      isCommandBatchWithinLimits(`set sheet lastrow 1\n${copies(10)}`, declared),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set sheet lastrow 1\n${copies(11)}`, declared),
    ).toBe(false);
    // So does shrinking it after this batch has filled the cells.
    const filled = `set A1:A${MAX_SHEET_CELLS / 2} bgcolor red\nset sheet lastrow 1`;
    expect(isCommandBatchWithinLimits(`${filled}\n${copies(20)}`)).toBe(true);
    expect(isCommandBatchWithinLimits(`${filled}\n${copies(21)}`)).toBe(false);
    // A structural verb walks the area it has just grown.
    const half = { rows: MAX_SHEET_CELLS / 2, columns: 1 } as const;
    expect(isCommandBatchWithinLimits(batch('insertrow A1', 19), half)).toBe(true);
    expect(isCommandBatchWithinLimits(batch('insertrow A1', 20), half)).toBe(false);
  });

  it('counts row settings and named ranges the declared area leaves out', () => {
    const copies = (count: number): string => batch('copy A1 all', count);
    // A row setting within MAX_SHEET_CELLS stretches the canonical area, and
    // `copy` walks up to it.
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SHEET_CELLS} hide yes\n${copies(10)}`),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SHEET_CELLS} hide yes\n${copies(11)}`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(
        `set ${MAX_SHEET_CELLS}:${MAX_SHEET_CELLS - 1} height 20\n${copies(11)}`,
      ),
    ).toBe(false);
    // On a new sheet, a row setting past MAX_SHEET_CELLS is rejected up front
    // by save-area limits; on an existing legacy sheet, whole-sheet verbs
    // still walk its full height.
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SOCIALCALC_ROW} hide yes\n${copies(1)}`),
    ).toBe(false);
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SOCIALCALC_ROW} hide yes\n${copies(1)}`, {
        rows: MAX_SOCIALCALC_ROW,
        columns: 1,
      }),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(`set ${MAX_SOCIALCALC_ROW} hide yes\n${copies(2)}`, {
        rows: MAX_SOCIALCALC_ROW,
        columns: 1,
      }),
    ).toBe(false);
    // Column settings stay within the 702 columns every sheet may have.
    expect(isCommandBatchWithinLimits(`set A:ZZ width 80\n${copies(2849)}`)).toBe(true);
    // Each definition in the batch is one more entry for the verbs after it.
    const nearlyHalf = {
      rows: 1,
      columns: 1,
      entries: MAX_COMMAND_SHEET_WORK / 2 - 1,
    } as const;
    expect(isCommandBatchWithinLimits(copies(2), nearlyHalf)).toBe(true);
    expect(
      isCommandBatchWithinLimits(`name define ONE A1\n${copies(2)}`, nearlyHalf),
    ).toBe(true);
    expect(
      isCommandBatchWithinLimits(
        `name define ONE A1\nname define TWO A1\n${copies(2)}`,
        nearlyHalf,
      ),
    ).toBe(false);
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

  it('rejects a sheet record whose later fields replace the checked pair', () => {
    // ParseSheetSave keeps the last c/r it reads, not the first.
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:c:702:r:20000')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:c:1')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:80:r:1e8\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w::c:702')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:c')).toBe(false);
    // Only field names count; a value that happens to read `c` or `r` is inert.
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:recalc:c:needsrecalc:r')).toBe(true);
  });

  it('reads a sheet record through a bare CR like ParseSheetSave does', () => {
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1\r:c:702:r:20000')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:80\r:c:702:r:20000\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:\rx:r:20000\r\n')).toBe(false);
    // Not a bare `sheet:` either: the line goes on after the CR.
    expect(isSnapshotWithinSheetLimits('sheet:\r:x:c:702:r:20000')).toBe(false);
    expect(isSnapshotWithinSheetLimits('cell:A1:t:x\nsheet:\r:x:r:20000\n')).toBe(false);
    // CRLF command clients do leave a CR inside a stored value.
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:80\r:needsrecalc:no\ncell:A1:t:x\n')).toBe(true);
    // CRLF and a trailing CR still end the record.
    expect(isSnapshotWithinSheetLimits('sheet:\r\ncell:A1:t:x\r\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:80\r\ncell:A1:t:x\r\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1\r')).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1\r\ncell:ZZ1:t:x\r\n')).toBe(false);
    // A bare CR inside a field value keeps the record aligned so `:c:` after it
    // is caught when in field-name position and ignored when inside a value.
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1:w:80\rsheet:c:600:r:600\n')).toBe(false);
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

  it('rejects saved records that would expand beyond their declared sheet', () => {
    expect(isSnapshotWithinSheetLimits('cell:B2:t:ok\nsheet:c:2:r:2\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('cell:ZZ100000:t:x\nsheet:c:2:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('row:100000:h:20\nsheet:c:2:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('col:ZZ:w:80\nsheet:c:2:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('cell:A2:t:x\nsheet:\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('row:bad:h:20\nsheet:c:1:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits(`row:${MAX_SOCIALCALC_ROW + 1}:h:20\nsheet:c:1:r:1\n`)).toBe(false);
    expect(isSnapshotWithinSheetLimits('col:AAA:w:80\nsheet:c:1:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits('cell:A0:t:x\nsheet:c:1:r:1\n')).toBe(false);
    expect(isSnapshotWithinSheetLimits(`cell:A${MAX_SOCIALCALC_ROW + 1}:t:x\nsheet:c:1:r:1\n`)).toBe(false);
  });

  it('splits records where ParseSheetSave does, so a bare CR stays inside its field', () => {
    expect(isSnapshotWithinSheetLimits('cell:A1:vtf:tx\rcell:Z99:"news"!A1\nsheet:c:1:r:1\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('cell:A1:vtf:t:x\rcell:"news"!A1\nsheet:c:1:r:1\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:1:r:1\ncell:A1:t:x\rsheet:c:500:r:500\n')).toBe(true);
    expect(storedSnapshotAreaLimit('sheet:c:1:r:1\ncell:A1:t:x\rsheet:c:500:r:500\n')).toBe(MAX_SHEET_CELLS);
    expect(isSnapshotWithinSheetLimits('cell:B2\r\nsheet:c:2:r:2\r\n')).toBe(true);
    expect(isSnapshotWithinSheetLimits('cell:B3\r\nsheet:c:2:r:2\r\n')).toBe(false);
    expect(storedSnapshotAreaLimit('sheet:c:500:r:500\r\ncell:SF500:t:old\r\n')).toBe(250_000);
  });

  it('counts the declared area and named ranges a stored save holds', () => {
    expect(storedSnapshotEntries('')).toBe(0);
    expect(storedSnapshotEntries('sheet:')).toBe(0);
    expect(storedSnapshotEntries('sheet:c:3:r:4')).toBe(12);
    expect(
      storedSnapshotEntries(
        [
          'version:1.5',
          'cell:A1:v:1',
          'row:4:hide:yes',
          'sheet:c:3:r:4:tvf:1',
          'name:ONE::A1',
          'name:TWO::B2',
          '',
        ].join('\n'),
      ),
    ).toBe(14);
    expect(storedSnapshotEntries('name:ONE::A1\r\nname:TWO::B2')).toBe(2);
    // Only whole records count: not payload text, not a longer field name.
    expect(
      storedSnapshotEntries('cell:A1:t:name:x\nrename:Y::A1\nsheet:c:3:r:4x\nxsheet:c:3:r:4'),
    ).toBe(0);
    // The largest declared area wins wherever it appears.
    expect(storedSnapshotEntries('sheet:c:3:r:4\nsheet:c:1:r:1')).toBe(12);
    expect(storedSnapshotEntries('sheet:c:1:r:1\nsheet:c:3:r:4')).toBe(12);
  });

  it('bounds compatibility edits for internally consistent existing sheets', () => {
    const existing = 'sheet:c:500:r:500\ncell:SF500:t:old\n';
    const permittedArea = storedSnapshotAreaLimit(existing);
    expect(permittedArea).toBe(250_000);
    expect(isSnapshotWithinSheetLimits(existing)).toBe(false);
    expect(isSnapshotWithinSheetLimits(existing, permittedArea)).toBe(true);
    expect(isSnapshotWithinSheetLimits('sheet:c:500:r:500\ncell:ZZ500:t:x\n', permittedArea)).toBe(false);
    expect(storedSnapshotAreaLimit('sheet:c:702:r:1048576')).toBe(MAX_LEGACY_SHEET_CELLS);
    expect(isSnapshotWithinSheetLimits('sheet:c:702:r:1048576', MAX_LEGACY_SHEET_CELLS)).toBe(false);
  });
});

describe('isSaveAreaWithinLimits', () => {
  it('bounds the rectangle a save would serialize', () => {
    expect(isSaveAreaWithinLimits({ rows: 1, columns: 1 })).toBe(true);
    expect(isSaveAreaWithinLimits({ rows: MAX_SHEET_CELLS, columns: 1 })).toBe(true);
    expect(isSaveAreaWithinLimits({ rows: 400, columns: 500 })).toBe(true);
    expect(isSaveAreaWithinLimits({ rows: MAX_SHEET_CELLS + 1, columns: 1 })).toBe(false);
    expect(isSaveAreaWithinLimits({ rows: 401, columns: 500 })).toBe(false);
    expect(
      isSaveAreaWithinLimits({ rows: MAX_SOCIALCALC_ROW, columns: MAX_SOCIALCALC_COL }),
    ).toBe(false);
  });

  it('honours the compatibility area of an existing oversized sheet', () => {
    expect(isSaveAreaWithinLimits({ rows: 500, columns: 500 }, 250_000)).toBe(true);
    expect(isSaveAreaWithinLimits({ rows: 501, columns: 500 }, 250_000)).toBe(false);
  });
});
