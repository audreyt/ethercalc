import { describe, expect, it } from 'vite-plus/test';

import { createSocialCalcFactory } from '../src/socialcalc.bundled.js';
import { createSpreadsheet } from '../src/index.js';

type CellResult = {
  datavalue?: unknown;
  valuetype?: string;
};

type RawSocialCalc = {
  SpreadsheetControl: new () => {
    sheet: { cells: Record<string, CellResult> };
    context: { sheetobj: { attribs: Record<string, unknown>; recalconce?: boolean } };
  };
  Parse: new (commands: string) => {
    EOF(): boolean;
    NextLine(): void;
  };
  ExecuteSheetCommand(
    sheet: unknown,
    parser: unknown,
    saveUndo: boolean,
  ): unknown;
  RecalcSheet(sheet: unknown): void;
};

const rawSocialCalc =
  createSocialCalcFactory() as unknown as RawSocialCalc;

function evaluateRaw(formula: string): CellResult {
  const control = new rawSocialCalc.SpreadsheetControl();
  const sheet = control.context.sheetobj;
  const parser = new rawSocialCalc.Parse(`set A1 formula ${formula}\nrecalc`);
  while (!parser.EOF()) {
    rawSocialCalc.ExecuteSheetCommand(sheet, parser, false);
    parser.NextLine();
  }
  if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
    rawSocialCalc.RecalcSheet(sheet);
    sheet.attribs.needsrecalc = 'no';
  }
  return control.sheet.cells.A1 ?? {};
}

function evaluate(formula: string): CellResult {
  const sheet = createSpreadsheet();
  sheet.executeCommand(`set A1 formula ${formula}\nrecalc`);
  return sheet.exportCell('A1') as CellResult;
}

function expectFormulaError(formula: string): void {
  expect(evaluate(formula).valuetype).toMatch(/^e/);
}

describe('formula resource limits', () => {
  it('preserves ordinary text formula behavior', () => {
    expect(evaluate('REPT("ab",3)').datavalue).toBe('ababab');
    expect(evaluate('SUBSTITUTE("abca","a","x")').datavalue).toBe('xbcx');
    expect(evaluate('CONCATENATE("ab",12,"cd")').datavalue).toBe('ab12cd');
  });

  it('matches upstream semantics across every replaced handler branch', () => {
    const formulas = [
      'ROUND(1234,-2)',
      'ROUND(2.5,0)',
      'ROUND(-1.5,0)',
      'ROUND(-1.005,2)',
      'ROUND(1.2345)',
      'ROUND(1,2,3)',
      'ROUND(1,\"x\")',
      'TRUNC(1234,-2)',
      'TRUNC(-1234,-2)',
      'TRUNC(-1.987,2)',
      'DDB(1000,100,10,2,1.5)',
      'DDB(1000,100,10,12)',
      'DDB(1000,900,10,2)',
      'SUBSTITUTE(\"a-b-a-b\",\"a\",\"x\",2)',
      'SUBSTITUTE(\"a-b-a-b\",\"a\",\"x\",5)',
      'SUBSTITUTE(\"a-b-a-b\",\"a\",\"x\",1.5)',
      'REPT(\"xy\",2.5)',
      'CONCATENATE(\"ab\",12,\"cd\")',
      'SUM(A1:B2)',
    ];
    for (const formula of formulas) {
      const raw = evaluateRaw(formula);
      const hardened = evaluate(formula);
      expect(
        { datavalue: hardened.datavalue, valuetype: hardened.valuetype },
        formula,
      ).toEqual({ datavalue: raw.datavalue, valuetype: raw.valuetype });
    }
  });

  it('turns unbounded REPT counts into a formula error', () => {
    expectFormulaError('REPT("x",1e99)');
    expectFormulaError('REPT("xx",600000)');
  });

  it('makes SUBSTITUTE with an empty search string a bounded no-op', () => {
    expect(evaluate('SUBSTITUTE("abc","","x")').datavalue).toBe('abc');
  });

  it('rejects SUBSTITUTE and CONCAT output amplification', () => {
    expectFormulaError('SUBSTITUTE(REPT("a",600000),"a","aa")');
    expectFormulaError('CONCAT(REPT("a",600000),REPT("b",600000))');
    expectFormulaError('REPT("a",600000)&REPT("b",600000)');
  });

  it('bounds aggregate formula text produced by one recalculation', () => {
    const sheet = createSpreadsheet();
    const commands = Array.from(
      { length: 9 },
      (_, index) => `set A${index + 1} formula REPT("x",1000000)`,
    );
    sheet.executeCommand([...commands, 'recalc'].join('\n'));
    expect(
      ((sheet.exportCell('A8') as CellResult).datavalue as string).length,
    ).toBe(1_000_000);
    expect((sheet.exportCell('A9') as CellResult).valuetype).toMatch(/^e/);
  });

  it('rejects ranges outside the maintained sheet and work ceilings', () => {
    expectFormulaError('SUM(A1:A100001)');
    expectFormulaError('SUM(A1:C100000)');
  });

  it('iterates an allowed range once and preserves aggregate results', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand(
      ['set A1 value n 1', 'set A100000 value n 2', 'set B1 formula SUM(A1:A100000)', 'recalc'].join(
        '\n',
      ),
    );
    expect((sheet.exportCell('B1') as CellResult).datavalue).toBe(3);
  });

  it('evaluates extreme decimal precision without attacker-sized loops', () => {
    expect(evaluate('TRUNC(1.2345,1e99)').datavalue).toBe(1.2345);
    expect(evaluate('ROUND(1.2345,1e99)').datavalue).toBe(1.2345);
    expectFormulaError('TRUNC(1.2345,1e999)');
    expectFormulaError('ROUND(1.2345,1e999)');
  });

  it('rejects attacker-sized DDB iteration counts', () => {
    expectFormulaError('DDB(100,0,1000000000,1000000000)');
    expect(evaluate('DDB(100,0,10,1)').datavalue).toBe(20);
  });
});
