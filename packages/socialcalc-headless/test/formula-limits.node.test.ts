import { describe, expect, it, vi } from 'vitest';

import { installFormulaLimits } from '../src/formula-limits.js';
import { createSocialCalcFactory } from '../src/socialcalc.bundled.js';
import { HeadlessSpreadsheet, createSpreadsheet, loadSocialCalc, withSharedRecalcBudget } from '../src/index.js';

type CellResult = {
  datavalue?: unknown;
  valuetype?: string;
  errors?: string;
};

type IoParameters = { value: unknown }[] & {
  html?: string[];
  css?: string;
  cssParameter?: string;
};

type RawSheet = {
  cells: Record<string, CellResult>;
  attribs: Record<string, unknown>;
  recalconce?: boolean;
  ioParameterList: Record<string, IoParameters>;
  statuscallback?: (() => void) | null;
  checknamecirc?: unknown;
  recalcdata?: unknown;
};

type RawSocialCalc = {
  SpreadsheetControl: new () => {
    sheet: { cells: Record<string, CellResult> };
    context: { sheetobj: RawSheet };
    CreateSheetHTML(): string;
    CreateSheetSave(): string;
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
  RecalcInfo: {
    currentState: number;
    maxtimeslice: number;
    state: { idle: number };
    sheet: unknown;
    queue: unknown[];
  };
  RecalcSetTimeout: () => void;
  RecalcTimerRoutine: () => void;
  RecalcLoadedSheet: (name: string, save: string, recalc: boolean) => void;
  crToCoord(column: number, row: number): string;
  Formula: {
    FunctionList: Record<string, unknown[]>;
    ParseFormulaIntoTokens(formula: string): unknown;
    evaluate_parsed_formula(
      parseInfo: unknown,
      sheet: unknown,
      allowRange: boolean,
    ): CellResult;
    getStandardizedList(sheet: unknown, parameter: unknown): string[];
    DecodeRangeParts(
      sheet: unknown,
      rangeValue: string,
    ): {
      sheetdata: { GetAssuredCell(coord: string): unknown };
      ncols: number;
      nrows: number;
    } | null;
    CalculateFunction(
      name: string,
      operand: unknown[],
      sheet: unknown,
      coord: string,
    ): string;
    TestCriteria(value: unknown, type: string, criteria: unknown): boolean;
    SheetCache: { sheets: Record<string, { sheet: { cells: Record<string, CellResult> } }> };
  };
};

const rawSocialCalc =
  createSocialCalcFactory() as unknown as RawSocialCalc;
const limitedSocialCalc =
  createSocialCalcFactory() as unknown as RawSocialCalc;
installFormulaLimits(limitedSocialCalc);

const MEBIBYTE = 1_048_576;
const RECALC_TEXT_BUDGET = 8 * MEBIBYTE;

function rawControl(limits: boolean) {
  const socialCalc = createSocialCalcFactory() as unknown as RawSocialCalc;
  if (limits) installFormulaLimits(socialCalc);
  const control = new socialCalc.SpreadsheetControl();
  const sheet = control.context.sheetobj;
  const execute = (commands: string): void => {
    const parser = new socialCalc.Parse(commands);
    while (!parser.EOF()) {
      socialCalc.ExecuteSheetCommand(sheet, parser, false);
      parser.NextLine();
    }
    socialCalc.RecalcSheet(sheet);
  };
  return { socialCalc, control, sheet, execute };
}

function ioTextKept(sheet: RawSheet): number {
  let chars = 0;
  for (const parameters of Object.values(sheet.ioParameterList)) {
    for (const text of [
      ...parameters.map(({ value }) => value),
      ...(parameters.html ?? []),
      parameters.css,
      parameters.cssParameter,
    ]) {
      if (typeof text === 'string') chars += text.length;
    }
  }
  return chars;
}

function evaluateRaw(
  formula: string,
  setup: readonly string[] = [],
): CellResult {
  const control = new rawSocialCalc.SpreadsheetControl();
  const sheet = control.context.sheetobj;
  const parser = new rawSocialCalc.Parse(
    [...setup, `set A1 formula ${formula}`, 'recalc'].join('\n'),
  );
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

function evaluate(formula: string, setup: readonly string[] = []): CellResult {
  const sheet = createSpreadsheet();
  sheet.executeCommand([...setup, `set A1 formula ${formula}`, 'recalc'].join('\n'));
  return sheet.exportCell('A1') as CellResult;
}

function doublingNames(count: number): { last: string; commands: string[] } {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const names = Array.from(
    { length: count },
    (_, index) => `x${letters[Math.floor(index / 26)]}${letters[index % 26]}`,
  );
  return {
    last: names[count - 1]!,
    commands: names.map((name, index) =>
      index === 0
        ? `name define ${name} =1`
        : `name define ${name} =${names[index - 1]}+${names[index - 1]}`,
    ),
  };
}

function evaluateOver(texts: readonly string[], formula: string): unknown {
  const sheet = createSpreadsheet();
  sheet.executeCommand(
    [
      ...texts.map((text, index) => `set A${index + 1} text t ${text}`),
      `set B1 formula ${formula}`,
      'recalc',
    ].join('\n'),
  );
  return (sheet.exportCell('B1') as CellResult).datavalue;
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
      'SUBSTITUTE(\"aaaa\",\"aa\",\"b\")',
      'SUBSTITUTE(\"abab-abaab\",\"abaab\",\"x\")',
      'SUBSTITUTE(\"a-b-a\",\"a\",\"$&$&\")',
      'FIND(\"b\",\"abcabc\")',
      'FIND(\"b\",\"abcabc\",3)',
      'FIND(\"b\",\"abcabc\",2.5)',
      'FIND(\"abaab\",\"abab-abaab\")',
      'FIND(\"z\",\"abc\")',
      'FIND(\"a\",\"abc\",2)',
      'FIND(\"a\",\"abc\",0)',
      'FIND(\"a\",\"abc\",9)',
      'FIND(\"\",\"abc\",2)',
      'FIND(\"\",\"abc\",9)',
      'FIND(\"a\",\"abc\",\"x\")',
      'FIND(1/0,\"abc\")',
      'FIND(2,1234)',
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

  it('trims a long inner run of spaces in linear time', () => {
    expect(evaluate('TRIM("  a   b  ")').datavalue).toBe('a b');
    expect(evaluate('TRIM(" a ")').datavalue).toBe('a');
    expect(evaluate('TRIM("   ")').datavalue).toBe('');
    expect(evaluate('TRIM("")').datavalue).toBe('');
    const started = performance.now();
    expect(evaluate('TRIM("x"&REPT(" ",100000)&"x")').datavalue).toBe('x x');
    expect(performance.now() - started).toBeLessThan(1000);
    expect(evaluate('TRIM("x"&REPT(" ",1048574)&"x")').datavalue).toBe('x x');
  });

  it('searches megabyte near-miss SUBSTITUTE and FIND patterns in linear time', () => {
    const nearMiss = 'REPT("a",1000)&"b"&REPT("a",523287)';
    expect(
      evaluate(`LEN(SUBSTITUTE(REPT("a",1048576),${nearMiss},"c"))`).datavalue,
    ).toBe(1_048_576);
    expect(
      evaluate(`LEN(SUBSTITUTE(REPT("a",1048576),${nearMiss},"c",1))`).datavalue,
    ).toBe(1_048_576);
    expectFormulaError(`FIND(${nearMiss},REPT("a",1048576))`);
    expect(
      evaluate(`FIND(${nearMiss},REPT("a",524288)&"b"&REPT("a",523287))`)
        .datavalue,
    ).toBe(523_289);
  });

  it('matches upstream semantics for defined names', () => {
    const chain = doublingNames(8);
    const setup = [
      'set B1 value n 2',
      'set B2 value n 3',
      'name define cells B1:B2',
      'name define total =SUM(cells)',
      'name define twice =total+total',
      'name define area =B1:B2',
      'name define loop =loop+1',
      'name define ping =pong+1',
      'name define pong =ping+1',
      ...chain.commands,
    ];
    const formulas = [
      chain.last,
      'SUM(cells)',
      'total',
      'twice+total',
      'SUM(area)+SUM(area)',
      'loop',
      'ping+pong',
      'nosuchname',
    ];
    for (const formula of formulas) {
      const raw = evaluateRaw(formula, setup);
      const hardened = evaluate(formula, setup);
      expect(
        { datavalue: hardened.datavalue, valuetype: hardened.valuetype },
        formula,
      ).toEqual({ datavalue: raw.datavalue, valuetype: raw.valuetype });
    }
    expect(evaluate(chain.last, setup).datavalue).toBe(128);
    expect(evaluate('twice+total', setup).datavalue).toBe(15);
  });

  it('evaluates a chain of formula-valued names once per name and bounds depth', () => {
    const chain = doublingNames(40);
    expect(evaluate(chain.last, chain.commands).datavalue).toBe(2 ** 39);

    const refChain = (names: number): CellResult[] => {
      const sheet = createSpreadsheet();
      sheet.executeCommand(
        [
          'set B1 value n 7',
          `name define NAME${names} B1`,
          ...Array.from(
            { length: names - 1 },
            (_, index) => `name define NAME${index + 1} =NAME${index + 2}`,
          ),
          'set A1 formula SUM(NAME1)',
          'set A2 formula 1+1',
        ].join('\n'),
      );
      return [sheet.exportCell('A1'), sheet.exportCell('A2')] as CellResult[];
    };
    expect(refChain(64).map((cell) => cell.datavalue)).toEqual([7, 2]);
    expect(refChain(65).map((cell) => cell.valuetype)).toEqual(['e#NAME?', 'n']);
    const deep = refChain(5000);
    expect(deep.map((cell) => cell.valuetype)).toEqual(['e#NAME?', 'n']);
    expect(deep[1]?.datavalue).toBe(2);
  });

  it('bounds name definition text evaluated by one recalculation', () => {
    const sheet = createSpreadsheet();
    const definition = Array.from({ length: 100_000 }, () => '1').join('+');
    const commands = Array.from(
      { length: 12 },
      (_, index) => `set A${index + 1} formula big`,
    );
    sheet.executeCommand(
      [`name define big =${definition}`, ...commands, 'recalc'].join('\n'),
    );
    expect((sheet.exportCell('A1') as CellResult).datavalue).toBe(100_000);
    expect((sheet.exportCell('A12') as CellResult).valuetype).toMatch(/^e/);
  });

  it('contains per-cell formula exceptions and returns to idle if recalc throws', () => {
    const sheet = createSpreadsheet();
    sheet.executeCommand(
      [
        'set A1 text constructor 9',
        'set A2 constant custom 5 5',
        'set B1 formula A1+1',
        'set B2 formula EMAILAT(1)',
        'set B3 formula A2="yes"',
        'set B4 formula HLOOKUP(1,A1:A1,0*1E999)',
        'set B5 formula 1+1',
      ].join('\n'),
    );
    expect(sheet.exportCell('B5')).toMatchObject({ datavalue: 2, valuetype: 'n' });
    expect((sheet.exportCell('B1') as CellResult).valuetype).toMatch(/^e#VALUE!/);
    expect((sheet.exportCell('B3') as CellResult).datavalue).toBe(0);
    expect((sheet.exportCell('B4') as CellResult).valuetype).toBe('e#VALUE!');

    const { socialCalc: engine, control, sheet: rawSheet, execute } = rawControl(true);
    engine.Formula.FunctionList.THROWS = [
      () => {
        throw new Error('thrown by a formula');
      },
      100,
    ];
    execute(['name define BROKEN =THROWS(1)', 'set A1 formula BROKEN', 'set A2 formula 1+1'].join('\n'));
    expect(engine.RecalcInfo.currentState).toBe(engine.RecalcInfo.state.idle);
    expect(rawSheet.checknamecirc).toBeUndefined();
    expect(control.sheet.cells.A2?.datavalue).toBe(2);

    // An exception escaping outside per-cell guards still restores RecalcInfo to idle.
    rawSheet.statuscallback = () => {
      throw new Error('status failed');
    };
    expect(() => execute('set A3 formula 40+2')).toThrow('status failed');
    expect(engine.RecalcInfo.currentState).toBe(engine.RecalcInfo.state.idle);
    expect(engine.RecalcInfo.sheet).toBeNull();
    expect(rawSheet.recalcdata).toBeUndefined();

    rawSheet.statuscallback = null;
    execute('name define BROKEN =40+2\nset A3 formula 40+2');
    expect(engine.RecalcInfo.queue).toEqual([]);
    expect(control.sheet.cells.A1?.datavalue).toBe(42);
    expect(control.sheet.cells.A3?.datavalue).toBe(42);
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

  it('counts error and type strings toward the recalculation text bound', () => {
    for (const [field, source, formula] of [
      ['error', 'set A1 formula REPT("x",100000)', 'A1!A1'],
      ['type', `set A1 text t${'x'.repeat(100_000)} hi`, 'A1'],
    ] as const) {
      const sheet = createSpreadsheet();
      sheet.executeCommand([source, `set B1:B300 formula ${formula}`, 'recalc'].join('\n'));
      const first = sheet.exportCell('B1') as CellResult;
      const last = sheet.exportCell('B300') as CellResult;
      expect((field === 'error' ? first.errors : first.valuetype)?.length).toBeGreaterThan(100_000);
      expect(last.valuetype).toBe('e#VALUE!');
      expect(last.errors).toBe('Formula exceeds resource limits');
      expect(sheet.createSheetSave().length).toBeLessThan(9 * 1024 * 1024);
    }

    const hugeErr = createSpreadsheet();
    hugeErr.executeCommand(
      ['set A1 formula REPT("x",1048576)', 'set B1 formula A1!A1', 'recalc'].join('\n'),
    );
    expect((hugeErr.exportCell('B1') as CellResult).errors).toBe('Formula exceeds resource limits');

    const sheet = createSpreadsheet();
    const commands = Array.from(
      { length: 8 },
      (_, index) => `set A${index + 1} formula REPT("x",1048575)`,
    );
    sheet.executeCommand(
      [
        ...commands,
        'set A9 formula "over"&REPT("x",40)',
        'set A10 formula 1+1',
        'set A11 formula 1/0',
        'set A12 formula Missing!A1',
        'recalc',
      ].join('\n'),
    );
    expect(((sheet.exportCell('A8') as CellResult).datavalue as string).length).toBe(1_048_575);
    expect((sheet.exportCell('A9') as CellResult).valuetype).toBe('e#VALUE!');
    expect(sheet.exportCell('A10')).toMatchObject({ datavalue: 2, valuetype: 'n' });
    expect(sheet.exportCell('A11')).toMatchObject({ valuetype: 'e#DIV/0!' });
    expect(sheet.exportCell('A12')).toMatchObject({
      valuetype: 'e#REF!',
      errors: 'Sheet unavailable: MISSING',
    });
  });

  it('rejects ranges outside the maintained sheet and work ceilings', () => {
    expectFormulaError('SUM(A1:A100001)');
    expectFormulaError('SUM(A1:C100000)');
  });

  it('orders a recalculation without walking ranges the evaluator refuses and bounds order steps', () => {
    const { socialCalc, control, sheet } = rawControl(true);
    const crToCoord = socialCalc.crToCoord;
    let coordinates = 0;
    socialCalc.crToCoord = (column, row) => {
      coordinates += 1;
      return crToCoord(column, row);
    };
    const parser = new socialCalc.Parse('set D1 formula SUM(A1:C100000)\nset D2 formula SUM(A1:A100001)');
    while (!parser.EOF()) {
      socialCalc.ExecuteSheetCommand(sheet, parser, false);
      parser.NextLine();
    }
    coordinates = 0;
    socialCalc.RecalcSheet(sheet);
    expect(coordinates).toBe(0);
    expect(control.sheet.cells.D1?.valuetype).toBe('e#NUM!');
    expect(control.sheet.cells.D2?.valuetype).toBe('e#NUM!');
    expect(sheet.cells.D1).toBeDefined();
    expectFormulaError('SUM(B1:ZZ999999999)');

    const ordered = createSpreadsheet();
    ordered.executeCommand(
      ['set B1 formula SUM(A1:A3)', 'set A1 formula 1+1', 'set A3 formula A1*2', 'recalc'].join('\n'),
    );
    expect((ordered.exportCell('B1') as CellResult).datavalue).toBe(6);

    const evaluateAfter = (ranges: number): CellResult[] => {
      const s = createSpreadsheet();
      s.executeCommand(
        [
          `set B1:B${ranges} formula ROWS(A1:B100000)`,
          'set D2 formula SUM(D1:D1)',
          'set D3 formula D1+1',
          'set D1 formula 1+1',
          'recalc',
        ].join('\n'),
      );
      return ['D2', 'D3'].map((coord) => s.exportCell(coord) as CellResult);
    };
    expect(evaluateAfter(49).map((cell) => cell.datavalue)).toEqual([2, 3]);
    const [unordered, stillOrdered] = evaluateAfter(50);
    expect(unordered?.valuetype).toBe('e#NUM!');
    expect(stillOrdered?.datavalue).toBe(3);
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

  it('preserves functions that walk decoded ranges and charges their reads', () => {
    const data = [
      'set B1 text t id',
      'set C1 text t qty',
      'set B2 value n 1',
      'set C2 value n 10',
      'set B3 value n 2',
      'set C3 value n 20',
      'set B4 value n 3',
      'set C4 value n 30',
      'set E1 text t id',
      'set E2 text t >1',
      'name define TABLE B2:C4',
    ];
    for (const formula of [
      'SUMPRODUCT(B2:B4,C2:C4)',
      'SUMPRODUCT(B2:B4,C2:C3)',
      'SUMPRODUCT(TABLE)',
      'VLOOKUP(2,B2:C4,2,0)',
      'VLOOKUP(9,B2:C4,2,0)',
      'VLOOKUP(2,TABLE,3,0)',
      'HLOOKUP("qty",B1:C4,3,0)',
      'MATCH(3,B2:B4,0)',
      'DSUM(B1:C4,"qty",E1:E2)',
      'DCOUNT(B1:C4,2,E1:E2)',
      'DGET(B1:C4,"nope",E1:E2)',
      'INDEX(B2:C4,3,2)',
      'ROWS(B2:C4)',
      'COLUMNS(TABLE)',
    ]) {
      const raw = evaluateRaw(formula, data);
      const hardened = evaluate(formula, data);
      expect({ datavalue: hardened.datavalue, valuetype: hardened.valuetype }, formula).toEqual({
        datavalue: raw.datavalue,
        valuetype: raw.valuetype,
      });
    }

    const expectRangeBudget = (formula: string, allowed: number, setup: readonly string[]): void => {
      const sheet = createSpreadsheet();
      sheet.executeCommand(
        [
          ...setup,
          `set A11:A${10 + allowed + 1} formula ${formula}`,
          `set A${10 + allowed + 2} formula 1+1`,
          'recalc',
        ].join('\n'),
      );
      const cell = (row: number) => sheet.exportCell(`A${row}`) as CellResult;
      expect(cell(10 + allowed).valuetype, formula).not.toMatch(/^e/);
      expect(cell(10 + allowed + 1).valuetype, formula).toBe('e#NUM!');
      expect(cell(10 + allowed + 2).datavalue, formula).toBe(2);
    };

    const range = ['name define FIRST B1', 'name define LAST ZZ284'];
    expectRangeBudget('SUMPRODUCT(FIRST:LAST)', 5, range);
    const selectBudget = createSpreadsheet();
    selectBudget.executeCommand(
      [
        ...range,
        'set A11:A16 formula SELECT("a",FIRST:LAST)',
        'set A17 formula 1+1',
        'recalc',
      ].join('\n'),
    );
    expect((selectBudget.exportCell('A12') as CellResult).valuetype).not.toMatch(/^e/);
    expect((selectBudget.exportCell('A13') as CellResult).valuetype).toBe('e#VALUE!');
    expect((selectBudget.exportCell('A16') as CellResult).valuetype).toBe('e#NUM!');
    expect((selectBudget.exportCell('A17') as CellResult).datavalue).toBe(2);
    expectRangeBudget('EMAILONEDIT(FIRST:LAST,"to","subject","body")', 5, range);
    expectRangeBudget('VLOOKUP(1,FIRST:LAST,2,0)', 9, [
      'set B100000 value n 1',
      'set C100000 value n 5',
      'name define FIRST B1',
      'name define LAST C100000',
    ]);
    expectRangeBudget('MATCH(1,FIRST:LAST,0)', 10, [
      'set B100000 value n 1',
      'name define FIRST B1',
      'name define LAST B100000',
    ]);
    expectRangeBudget('DSUM(FIRST:LAST,1,CFIRST:CLAST)', 5, [
      'set B1 text t x',
      'set C1 text t x',
      'set C2:C10 text t nomatch',
      'name define CFIRST C1',
      'name define CLAST C10',
      'name define FIRST B1',
      'name define LAST B10000',
    ]);

    const untouched = createSpreadsheet();
    untouched.executeCommand(
      [
        'set B1 value n 1',
        'set C1 value n 5',
        'set C3 value n 7',
        'name define FIRST B1',
        'name define LAST ZZ284',
        'name define BOTTOM C100000',
        'set A1:A20 formula ROWS(FIRST:LAST)',
        'set A21:A40 formula COLUMNS(FIRST:LAST)',
        'set A41:A60 formula INDEX(FIRST:LAST,3,2)',
        'set A61:A80 formula VLOOKUP(1,FIRST:BOTTOM,2,0)',
        'recalc',
      ].join('\n'),
    );
    expect((untouched.exportCell('A20') as CellResult).datavalue).toBe(284);
    expect((untouched.exportCell('A40') as CellResult).datavalue).toBe(701);
    expect((untouched.exportCell('A60') as CellResult).datavalue).toBe(7);
    expect((untouched.exportCell('A80') as CellResult).datavalue).toBe(5);

    const hardenedFormula = (loadSocialCalc() as unknown as RawSocialCalc).Formula;
    const rawSheetObj = { GetAssuredCell: (coord: string) => `cell ${coord}` };
    const decoded = hardenedFormula.DecodeRangeParts(rawSheetObj, 'B1|ZZ284|');
    expect(decoded).toMatchObject({ ncols: 701, nrows: 284 });
    expect(decoded?.sheetdata.GetAssuredCell('B1')).toBe('cell B1');
    expect(hardenedFormula.DecodeRangeParts(rawSheetObj, 'B1|AAA284|')).toBeNull();

    hardenedFormula.FunctionList.BOOM = [
      () => {
        throw new Error('boom');
      },
      0,
    ];
    try {
      expect(() => hardenedFormula.CalculateFunction('BOOM', [], {}, 'A1')).toThrow('boom');
    } finally {
      delete hardenedFormula.FunctionList.BOOM;
    }
  });

  it('charges megabyte text reads and short criteria reads accurately', () => {
    for (const [formula, withinBudget] of [
      ['MATCH("z",A$1:A$2,0)', 'e#N/A'],
      ['MATCH("z",A$1:A$2,1)', 'n'],
      ['VLOOKUP("z",A$1:B$2,1,0)', 'e#N/A'],
      ['HLOOKUP("z",A$1:B$2,1,0)', 'e#N/A'],
      ['MATCH(A$1,B$1:B$2,0)', 'e#N/A'],
      ['DSUM(A$1:A$2,"z",B$1:B$2)', 'e#VALUE!'],
      ['A$1="z"', 'nl'],
      ['LEN(A$1)', 'n'],
    ] as const) {
      const sheet = createSpreadsheet();
      sheet.executeCommand(
        ['set A1 formula REPT("x",1048576)', `set C1:C62 formula ${formula}`, 'recalc'].join('\n'),
      );
      expect((sheet.exportCell('C1') as CellResult).valuetype).toBe(withinBudget);
      expect((sheet.exportCell('C61') as CellResult).valuetype).toBe(withinBudget);
      expect((sheet.exportCell('C62') as CellResult).valuetype).toBe('e#NUM!');
    }

    for (const mkFormula of [
      (rows: number) => `COUNTIF(B1:B${rows},A1)`,
      (rows: number) => `SUMIF(B1:B${rows},A1)`,
      (rows: number) => `SUMIFS(B1:B${rows},B1:B${rows},A1)`,
    ]) {
      const vt = (rows: number) => {
        const s = createSpreadsheet();
        s.executeCommand(['set A1 formula REPT("x",1048576)', `set C1 formula ${mkFormula(rows)}`, 'recalc'].join('\n'));
        return (s.exportCell('C1') as CellResult).valuetype;
      };
      expect(vt(59)).toBe('n');
      expect(vt(61)).toBe('e#NUM!');
    }

    const shortReads = createSpreadsheet();
    shortReads.executeCommand(
      [
        'set A1 formula REPT("x",1048576)',
        'set A2 formula REPT("x",63)',
        'set A3 formula REPT("x",64)',
        'set C1:C61 formula LEN(A$1)',
        'set D1:D600 formula MATCH("z",A$2:A$2,0)',
        'set E1:E577 formula MATCH("z",A$3:A$3,0)',
        'recalc',
      ].join('\n'),
    );
    expect((shortReads.exportCell('D600') as CellResult).valuetype).toBe('e#N/A');
    expect((shortReads.exportCell('E576') as CellResult).valuetype).toBe('e#N/A');
    expect((shortReads.exportCell('E577') as CellResult).valuetype).toBe('e#NUM!');
  });

  it('matches upstream SUMIFS when criteria operands end before sum range and avoids re-reads', () => {
    const setup = [
      'set B1 value n 1',
      'set B2 value n 2',
      'set B3 value n 3',
      'set B4 value n$ 4',
      'set C1 text t x',
      'set C2 text t y',
      'set C3 text t x',
      'set C4 text t x',
      'set D1 value n 5',
      'set E1 formula 1/0',
      'set E2 value n 7',
      'set E3 formula SQRT(-1)',
      'set E4 text t z',
    ];
    for (const formula of [
      'SUMIFS(B1:B4,C1:C4,"x")',
      'SUMIFS(B1:B4,C1:C4,"x",D1,5)',
      'SUMIFS(B1:B4,C1:C4,"x",D1,"<abc")',
      'SUMIFS(B1:B4,B1:B2,">1",C1:C4,"y")',
      'SUMIFS(B1:B4,B1:B2,"<abc",C1:C4,"x")',
      'SUMIFS(B1:B4,C1:C4,"x",D1:D2,"=")',
      'SUMIFS(B1:B2,C1:C4,"x")',
      'SUMIFS(B1:B4,C1:C4,"x",D1)',
      'SUMIFS(B1:B4,C1:C4,1/0)',
      'SUMIFS(E1:E4,C1:C4,"x")',
      'SUMIFS(E1:E4,C1:C4,"y")',
      'SUMIFS(B1,C1,"x")',
      'SUMIFS(5,C1,"x")',
      'SUMIFS(B1:B4,5,"x")',
    ]) {
      const raw = evaluateRaw(formula, setup);
      const hardened = evaluate(formula, setup);
      expect({ datavalue: hardened.datavalue, valuetype: hardened.valuetype }, formula).toEqual({
        datavalue: raw.datavalue,
        valuetype: raw.valuetype,
      });
    }

    const bounded = createSpreadsheet();
    bounded.executeCommand(
      [
        'set B1 value n 1',
        'set C1 value n 7',
        'set D2 value n 9',
        `set A1 formula SUMIFS(C1:D100000${',B1,1'.repeat(20_000)})`,
        `set A2 formula SUMIFS(C1:D100000${',B1,"<x"'.repeat(500)})`,
        'set A3 formula SUM(C1:D100000)',
        'recalc',
      ].join('\n'),
    );
    expect((bounded.exportCell('A1') as CellResult).datavalue).toBe(7);
    expect((bounded.exportCell('A2') as CellResult).datavalue).toBe(16);
    expect((bounded.exportCell('A3') as CellResult).datavalue).toBe(16);
  });

  it('charges IO parameters to recalc text budget and forgets stale entries', () => {
    for (const formula of [
      'BUTTON(LOWER(A1))',
      'TEXTBOX(LOWER(A1))',
      'SUBMIT(LOWER(A1))',
      'BUTTON(LOWER(A1),LOWER(A1))',
      'EMAIL(LOWER(A1),LOWER(A1),LOWER(A1))',
      'BUTTON("x")&STYLE(LOWER(A1))',
    ]) {
      const { sheet, execute } = rawControl(true);
      execute(`set A1 formula REPT("X",${MEBIBYTE})\nset B1:B50 formula ${formula}`);
      expect(sheet.ioParameterList.B1, formula).toBeDefined();
      expect(ioTextKept(sheet), formula).toBeLessThanOrEqual(RECALC_TEXT_BUDGET);
      expect(sheet.ioParameterList.B50, formula).toBeUndefined();
      expect(sheet.cells.B50?.valuetype, formula).toMatch(/^e/);
    }

    const selectCtrl = rawControl(true);
    const join = vi.spyOn(Array.prototype, 'join');
    let markupsBuilt = 0;
    try {
      selectCtrl.execute(
        [
          `set A1 text t ${'x'.repeat(1.5 * MEBIBYTE)}`,
          `set A2 text t ${'y'.repeat(1.5 * MEBIBYTE)}`,
          'set B1:B50 formula SELECT("q",A1:A2)',
        ].join('\n'),
      );
      markupsBuilt = join.mock.calls.filter(([sep]) => sep === '</option><option>').length;
    } finally {
      join.mockRestore();
    }
    expect(markupsBuilt).toBe(2);
    expect(Object.keys(selectCtrl.sheet.ioParameterList)).toEqual(['B1', 'B2']);
    expect(selectCtrl.sheet.cells.B3).toMatchObject({
      valuetype: 'e#VALUE!',
      errors: 'Formula exceeds resource limits',
    });
    expect(selectCtrl.sheet.cells.B50?.valuetype).toMatch(/^e/);
    expect(selectCtrl.sheet.cells.B50?.errors).toBe('Formula exceeds resource limits');

    const erased = rawControl(true);
    erased.execute(`set A1 formula REPT("X",${MEBIBYTE})\nset B1:B3 formula BUTTON(LOWER(A1))`);
    erased.execute('erase B1:B3 all\nset C1:C3 formula BUTTON(LOWER(A1))');
    expect(Object.keys(erased.sheet.ioParameterList)).toEqual(['C1', 'C2', 'C3']);
  });

  it('matches wildcard criteria literally without backtracking and bounds match steps', () => {
    const cases: [unknown, string, string, boolean][] = [
      ['abc', 't', 'a*', true],
      ['abc', 't', '*c', true],
      ['abc', 't', 'a?c', true],
      ['ac', 't', 'a?c', true],
      ['abbc', 't', 'a?c', false],
      ['ABC', 't', 'a*c', true],
      ['', 't', '*', false],
      ['', 'b', '**', true],
      ['a*c', 't', 'a~*c*', true],
      ['abc', 't', 'a~*c*', false],
      ['a\nc', 't', 'a*', false],
      [12, 'n', '1*', true],
    ];
    for (const [value, type, pattern, expected] of cases) {
      for (const socialCalc of [rawSocialCalc, limitedSocialCalc]) {
        expect(socialCalc.Formula.TestCriteria(value, type, pattern)).toBe(expected);
      }
    }

    const texts = ['apple', '(a|b)c', '(a)z', 'a.c', 'abc', 'a*b*c'];
    expect(evaluateOver(texts, 'COUNTIF(A1:A6,"(a|b)*")')).toBe(1);
    expect(evaluateOver(texts, 'COUNTIF(A1:A6,"(a)*")')).toBe(1);
    expect(evaluateOver(texts, 'COUNTIF(A1:A6,"a.?")')).toBe(1);
    expect(evaluateOver(texts, 'COUNTIF(A1:A6,"a~*b~*?")')).toBe(1);
    expect(evaluateOver(texts, 'COUNTIF(A1:A6,"[a-z]*")')).toBe(0);
    expect(evaluateOver([`${'x'.repeat(30)}!`], 'COUNTIF(A1,"(x+)+y*")')).toBe(0);
    expect(evaluateOver(['a'.repeat(250)], 'COUNTIF(A1,"*a*a*a*a*b")')).toBe(0);

    const budgetSheet = createSpreadsheet();
    const optional = '?'.repeat(7_000);
    budgetSheet.executeCommand(
      [
        `set A1 text t ${'a'.repeat(7_000)}`,
        `set B1 formula COUNTIF(A1,"${optional}")`,
        `set B2 formula COUNTIF(A1,"${optional}")`,
        `set B3 formula COUNTIF(A1,"${optional}")`,
        'recalc',
      ].join('\n'),
    );
    expect((budgetSheet.exportCell('B1') as CellResult).datavalue).toBe(1);
    expect((budgetSheet.exportCell('B2') as CellResult).datavalue).toBe(1);
    expect((budgetSheet.exportCell('B3') as CellResult).datavalue).toBe(0);
    expect(limitedSocialCalc.Formula.TestCriteria('a'.repeat(10_000), 't', '?'.repeat(10_000))).toBe(false);
  });

  it('evaluates a formula once however many sibling sheets are missing', () => {
    const sc = loadSocialCalc();
    const formula = sc.Formula as unknown as {
      evaluate_parsed_formula: (...args: unknown[]) => unknown;
    };
    const orig = formula.evaluate_parsed_formula;
    let evaluations = 0;
    formula.evaluate_parsed_formula = function (this: unknown, ...args: unknown[]) {
      evaluations += 1;
      return orig.apply(this, args);
    };
    const sheet = new HeadlessSpreadsheet(
      sc,
      new (sc as unknown as {
        SpreadsheetControl: new () => ConstructorParameters<typeof HeadlessSpreadsheet>[1];
      }).SpreadsheetControl(),
    );
    const names = Array.from({ length: 50 }, (_, index) => `missing${index}`);
    try {
      sheet.executeCommand(`set A1 formula ${names.map((name) => `"${name}"!A1`).join('+')}`);
      expect(evaluations).toBe(1);
      expect((sheet.exportCell('A1') as CellResult).valuetype).toBe('e#REF!');
      sheet.resetSiblingSheets();
      for (const name of names) {
        sheet.addSiblingSheet(name, 'version:1.5\ncell:A1:v:1\nsheet:c:1:r:1\n');
      }
      sheet.recalc();
      expect((sheet.exportCell('A1') as CellResult).datavalue).toBe(50);
    } finally {
      formula.evaluate_parsed_formula = orig;
      sheet.resetSiblingSheets();
    }
  });

  it('keeps one budget per recalculation when a page runs it in timer slices', () => {
    const page = createSocialCalcFactory() as unknown as RawSocialCalc;
    installFormulaLimits(page);
    let pending = false;
    let slices = 0;
    page.RecalcSetTimeout = () => {
      pending = true;
    };
    page.RecalcInfo.maxtimeslice = 0;
    const runTimers = (limit = Infinity): void => {
      for (let fired = 0; pending && fired < limit; fired += 1) {
        pending = false;
        slices += 1;
        page.RecalcTimerRoutine();
      }
    };
    const load = () => {
      const control = new page.SpreadsheetControl();
      const sheet = control.context.sheetobj;
      const parser = new page.Parse(
        Array.from({ length: 9 }, (_, index) => `set A${index + 1} formula REPT("x",1000000)`).join('\n'),
      );
      while (!parser.EOF()) {
        page.ExecuteSheetCommand(sheet, parser, false);
        parser.NextLine();
      }
      return { control, sheet };
    };
    const expectOneBudget = (sheet: { cells: Record<string, CellResult> }): void => {
      expect((sheet.cells.A8?.datavalue as string).length).toBe(1_000_000);
      expect(sheet.cells.A9?.valuetype).toBe('e#VALUE!');
      expect(page.RecalcInfo.currentState).toBe(0);
    };

    const first = load();
    for (let recalculation = 0; recalculation < 2; recalculation += 1) {
      page.RecalcSheet(first.sheet);
      expect(pending).toBe(true);
      runTimers();
      expectOneBudget(first.sheet);
    }
    expect(slices).toBeGreaterThanOrEqual(2 * 9);

    const second = load();
    const third = load();
    page.RecalcSheet(second.sheet);
    while (pending && second.sheet.cells.A5?.valuetype !== 't') runTimers(1);
    page.RecalcSheet(third.sheet);
    expect(page.RecalcInfo.queue).toHaveLength(1);
    runTimers();
    expectOneBudget(second.sheet);
    expectOneBudget(third.sheet);

    page.RecalcLoadedSheet('other', first.control.CreateSheetSave(), true);
    runTimers();
    expectOneBudget(page.Formula.SheetCache.sheets.other!.sheet);
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

describe('withSharedRecalcBudget', () => {
  const limited = loadSocialCalc() as unknown as RawSocialCalc;
  // 6,000 of the 10,000 loop steps that one recalculation may spend; a
  // currency amount (`n$`) when it is evaluated.
  const sixThousandSteps = 'DDB(1000,0,6000,6000)';

  /** Recalculate a new sheet holding `formula` and return the type of its result. */
  function recalcType(formula = sixThousandSteps): string | undefined {
    const control = new limited.SpreadsheetControl();
    const sheet = control.context.sheetobj;
    limited.ExecuteSheetCommand(sheet, new limited.Parse(`set A1 formula ${formula}`), false);
    limited.RecalcSheet(sheet);
    return control.sheet.cells.A1?.valuetype;
  }

  it('gives each recalculation its own budget outside a shared one', () => {
    expect([recalcType(), recalcType()]).toEqual(['n$', 'n$']);
  });

  it('makes the recalculations of one stretch of work draw on one budget', () => {
    const types = withSharedRecalcBudget(limited, () => [recalcType(), recalcType(), recalcType('1+1')]);
    // The second sheet asks for more than the first one left; what costs
    // nothing still evaluates.
    expect(types).toEqual(['n$', 'e#NUM!', 'n']);
    // The budget ends with the work.
    expect(recalcType()).toBe('n$');
  });

  it('keeps one budget across nested shared work', () => {
    const types = withSharedRecalcBudget(limited, () => [
      withSharedRecalcBudget(limited, () => recalcType()),
      recalcType(),
    ]);
    expect(types).toEqual(['n$', 'e#NUM!']);
    expect(recalcType()).toBe('n$');
  });

  it('ends the shared budget when the work throws', () => {
    expect(() =>
      withSharedRecalcBudget(limited, () => {
        recalcType();
        throw new Error('stop');
      }),
    ).toThrow('stop');
    expect([recalcType(), recalcType()]).toEqual(['n$', 'n$']);
  });

  it('runs the work as is for an object without formula limits', () => {
    expect(withSharedRecalcBudget({}, () => 'done')).toBe('done');
  });
});
