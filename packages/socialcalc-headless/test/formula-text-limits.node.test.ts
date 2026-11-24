import { describe, expect, it } from 'vite-plus/test';

import { MAX_SHEET_FORMULA_CHARS, createSpreadsheet, csvToSave } from '../src/index.js';

type Cell = { datavalue?: unknown; formula?: string };

function cells(sheet: ReturnType<typeof createSpreadsheet>): Record<string, Cell> {
  return sheet.exportCells() as Record<string, Cell>;
}

/** 1,001 characters that are quick to recalculate. */
const LONG_FORMULA = `LEN("${'x'.repeat(994)}")`;
const LONG_VALUE = 994;
/** Copies of `LONG_FORMULA` that still fit in one sheet. */
const FITTING_ROWS = Math.floor(MAX_SHEET_FORMULA_CHARS / LONG_FORMULA.length);
const ROWS = 190_000;

function clipboard(formula: string): string {
  return `loadclipboard version\\c1.5\\ncell\\cA1\\cvtf\\cn\\c0\\c${formula}\\ncopiedfrom\\cA1\\cA1`;
}

describe('formula text limits', () => {
  it('runs ordinary pastes, fills, sorts and ranged sets', () => {
    const sheet = createSpreadsheet();
    expect(
      sheet.executeCommand(
        [
          clipboard('B1*2'),
          'paste A1:A1000 formulas',
          'set C1 formula B1+1',
          'filldown C1:C1000 all',
          'set D1:D1000 formula C1+1',
          'sort A1:D1000 A up',
        ].join('\n'),
      ),
    ).toBe(true);
    expect(cells(sheet).A1000?.formula).toBe('B1000*2');
    expect(cells(sheet).C1000?.formula).toBe('B1000+1');
    expect(cells(sheet).D1000?.datavalue).toBe(2);
    expect(sheet.executeCommand('')).toBe(true);
  });

  it.each([
    ['a loaded clipboard', `${clipboard(LONG_FORMULA)}\npaste A1:A${ROWS} formulas`],
    ['a copied cell', `set A1 formula ${LONG_FORMULA}\ncopy A1 formulas\npaste A1:A${ROWS} formulas`],
    ['a fill', `set A1 formula ${LONG_FORMULA}\nfilldown A1:A${ROWS} all`],
    ['a ranged set by inserting a row', `set A2:A${ROWS} formula ${LONG_FORMULA}\ninsertrow A1`],
    ['a ranged set by deleting a column', `set B1:B${ROWS} formula ${LONG_FORMULA}\ndeletecol A1`],
    ['a ranged set by moving a cell', `set A2:A${ROWS} formula ${LONG_FORMULA}\nmovepaste C1 D1 all`],
  ])('stops rebuilding a long formula from %s across a sheet', (_source, batch) => {
    const sheet = createSpreadsheet();
    expect(sheet.executeCommand(`${batch}\nset B1 text t later`)).toBe(false);
    const after = cells(sheet);
    expect(Object.values(after).some((cell) => cell.datavalue === 'later')).toBe(false);
    expect(Object.values(after).some((cell) => cell.datavalue === LONG_VALUE)).toBe(false);
  });

  it('refuses a ranged set of a long formula before recalculating it', () => {
    const sheet = createSpreadsheet();
    expect(sheet.executeCommand(`set A1:A${ROWS} formula ${LONG_FORMULA}`)).toBe(false);
    expect(cells(sheet).A1?.datavalue).not.toBe(LONG_VALUE);
  });

  it('counts the formula text a sheet accumulates over several batches', () => {
    const sheet = createSpreadsheet();
    expect(sheet.executeCommand(`set A1:A${FITTING_ROWS} formula ${LONG_FORMULA}`)).toBe(true);
    expect(cells(sheet).A1?.datavalue).toBe(LONG_VALUE);
    expect(sheet.executeCommand(`set B1 formula ${LONG_FORMULA}`)).toBe(false);
  });

  it('starts a new budget for each batch and lets a full sheet be restructured', () => {
    const sheet = createSpreadsheet();
    const batch = `${clipboard(LONG_FORMULA)}\npaste A1:A${FITTING_ROWS} formulas`;
    expect(sheet.executeCommand(batch)).toBe(true);
    expect(sheet.executeCommand(batch)).toBe(true);
    expect(cells(sheet)[`A${FITTING_ROWS}`]?.datavalue).toBe(LONG_VALUE);
    expect(sheet.executeCommand(`insertrow A1\nsort A2:A${FITTING_ROWS + 1} A up`)).toBe(true);
    expect(cells(sheet)[`A${FITTING_ROWS + 1}`]?.datavalue).toBe(LONG_VALUE);
  });

  it('lets an already oversized sheet be edited and shrunk but not grown', () => {
    const rows = FITTING_ROWS + 10;
    const field = `"=${LONG_FORMULA.replaceAll('"', '""')}"`;
    const snapshot = csvToSave(Array.from({ length: rows }, () => field).join('\n'));
    const sheet = createSpreadsheet({ snapshot });
    expect(cells(sheet)[`A${rows}`]?.formula).toBe(LONG_FORMULA);
    expect(sheet.executeCommand('set B1 text t edited')).toBe(true);
    expect(sheet.executeCommand('set A1 formula 1+1')).toBe(true);
    expect(cells(sheet).A1?.datavalue).toBe(2);
    expect(sheet.executeCommand('insertrow A1')).toBe(true);
    expect(cells(sheet).A2?.datavalue).toBe(2);
    expect(sheet.executeCommand(`set C1:C20 formula ${LONG_FORMULA}`)).toBe(false);
  });
});
