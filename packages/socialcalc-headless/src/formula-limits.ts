/**
 * Resource guards for the untrusted SocialCalc formula evaluator.
 *
 * Formula text and range references are room data. A tiny command such as
 * `REPT("x",1e99)`, `SUBSTITUTE("x","","y")`, or `SUM(A1:ZZ100000)`
 * must not pin a Durable Object isolate or allocate an attacker-selected
 * amount of memory. The upstream evaluator predates hostile multi-tenant
 * inputs, so install bounded drop-in handlers around the small set of
 * amplification primitives while preserving ordinary formula semantics.
 */

const MAX_FORMULA_TEXT_CHARS = 1_048_576;
const MAX_FORMULA_RANGE_CELLS = 200_000;
const MAX_FORMULA_COLUMN = 702; // SocialCalc A:ZZ parser ceiling.
const MAX_FORMULA_ROW = 100_000; // EtherCalc's maintained sheet ceiling.
const MAX_FORMULA_ITERATIONS = 10_000;
const MAX_FORMULA_NAME_DEPTH = 64; // Excel's ceiling for nested formula levels.
const MAX_FORMULA_RECALC_TEXT_CHARS = 8 * 1024 * 1024;
const MAX_FORMULA_RECALC_RANGE_STEPS = 1_000_000;
const MAX_FORMULA_RECALC_NAME_CHARS = 4 * 1024 * 1024;
const MAX_FORMULA_RECALC_ORDER_STEPS = 10_000_000;
const MAX_FORMULA_RECALC_MATCH_STEPS = 100_000_000;
const FORMULA_TEXT_CHARS_PER_RANGE_STEP = 64;
const LIMIT_ERROR = 'Formula exceeds resource limits';
const LIMIT_ERROR_RESULT_CHARS = 'e#VALUE!'.length + LIMIT_ERROR.length;
const SELECT_OPTION_MARKUP_CHARS = '<option></option>'.length;

type FormulaOperand = {
  type: string;
  value: unknown;
  error?: string;
};

type FormulaStack = FormulaOperand[];

// What an IO (form-widget) function leaves in `sheet.ioParameterList[coord]`:
// its evaluated operands, plus SELECT's option markup and STYLE's CSS.
type IoParameters = FormulaStack & {
  html?: unknown[];
  css?: unknown;
  cssParameter?: unknown;
};

type IoSheet = {
  ioParameterList: Record<string, IoParameters>;
};

type FormulaFunction = (
  name: string,
  operand: FormulaStack,
  functionOperand: FormulaStack,
  sheet: unknown,
) => unknown;

type FormulaEntry = [FormulaFunction, ...unknown[]];

type RangeParts = {
  c1: number;
  c2: number;
  r1: number;
  r2: number;
};

type RangeSheet = {
  GetAssuredCell: (coord: string) => { datavalue?: unknown };
};

type DecodedRange = {
  sheetdata: RangeSheet;
  ncols: number;
  nrows: number;
};

type FormulaApi = {
  FunctionList: Record<string, FormulaEntry>;
  PushOperand: (operand: FormulaStack, type: string, value: unknown) => void;
  OperandValueAndType: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  OperandAsText: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  OperandAsNumber: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  TopOfStackValueAndType: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  TestCriteria: (value: unknown, type: string, criteria: unknown) => boolean;
  EvaluatePolish: (
    parseInfo: unknown,
    reversePolish: unknown,
    sheet: unknown,
    allowRangeReturn?: boolean,
  ) => FormulaOperand;
  CalculateFunction: (
    name: string,
    operand: FormulaStack,
    sheet: unknown,
    coord: unknown,
  ) => unknown;
  getStandardizedList: (sheet: unknown, parameter: unknown) => string[];
  LookupName: (sheet: unknown, name: string, isEnd?: boolean) => FormulaOperand;
  SheetCache: { waitingForLoading: string | null };
  OperandsAsRangeOnSheet: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  StepThroughRangeDown: (
    operand: FormulaStack,
    rangeValue: string,
  ) => FormulaOperand | undefined;
  OrderRangeParts: (start: string, end: string) => RangeParts;
  DecodeRangeParts: (sheet: unknown, rangeValue: string) => DecodedRange | null;
  StoreIoEventFormula: (
    name: string,
    coord: unknown,
    functionOperand: FormulaStack,
    sheet: unknown,
    ioParameters: unknown,
  ) => void;
  LookupResultType: (left: string, right: string, table: unknown) => string;
  TypeLookupTable: {
    oneargnumeric: unknown;
    twoargnumeric: unknown;
    plus: unknown;
  };
  FunctionArgsError: (name: string, operand: FormulaStack) => unknown;
  FunctionSpecificError: (
    name: string,
    operand: FormulaStack,
    type: string,
    message: string,
  ) => unknown;
  CheckForErrorValue: (operand: FormulaStack, value: FormulaOperand) => boolean;
  WildcardMatch: (text: string, pattern: string) => boolean;
  StringFunctions: FormulaFunction;
  IoFunctions: FormulaFunction;
  SeriesFunctions: FormulaFunction;
  SumifsFunction: FormulaFunction;
  Math2Functions: FormulaFunction;
  RoundFunction: FormulaFunction;
  DDBFunction: FormulaFunction;
};

type SocialCalcFormulaHost = {
  Formula?: FormulaApi;
  Constants?: Record<string, string>;
  crToCoord?: (column: number, row: number) => string;
  RecalcSheet?: (sheet: unknown) => unknown;
  RecalcTimerRoutine?: () => unknown;
  RecalcRangeAllowed?: (range: RangeParts, parseInfo: object) => boolean;
  RecalcInfo?: {
    currentState: number;
    state: { idle: number };
    sheet: { recalcdata?: unknown } | null;
    queue: unknown[];
  };
};

const installed = new WeakSet<object>();
const sharedRecalcBudgets = new WeakMap<
  object,
  <T>(work: () => T, multiplier?: number) => T
>();

/**
 * Run synchronous `work` with every recalculation it starts on `host` drawing
 * on one shared budget (scaled by `multiplier`) instead of a fresh set each.
 */
export function withSharedRecalcBudget<T>(
  host: object,
  work: () => T,
  multiplier = 1,
): T {
  const share = sharedRecalcBudgets.get(host);
  return share ? share(work, multiplier) : work();
}

function limitError(type = 'e#VALUE!'): FormulaOperand {
  return { type, value: 0, error: LIMIT_ERROR };
}

function textLength(text: unknown): number {
  return typeof text === 'string' ? text.length : 0;
}

/**
 * A result carries up to three strings, and recalculation stores all of them
 * in the cell, where every save writes them out again: besides the value,
 * `type` is the valuetype of whichever cell the formula read, and `error`
 * quotes room data such as the sheet name of an unavailable `name!A1`.
 */
function boundedOperand(value: FormulaOperand): FormulaOperand {
  return Math.max(
    textLength(value.value),
    textLength(value.type),
    textLength(value.error),
  ) > MAX_FORMULA_TEXT_CHARS
    ? limitError()
    : value;
}

function ioTextLength(parameters: IoParameters = []): number {
  let chars = 0;
  for (const text of [
    ...parameters.map(({ value }) => value),
    ...(parameters.html ?? []),
    parameters.css,
    parameters.cssParameter,
  ]) {
    if (typeof text === 'string') chars += text.length;
  }
  return chars;
}

/**
 * Linear-time drop-in for `text.indexOf(pattern, position)`.
 *
 * Both strings are room data of up to MAX_FORMULA_TEXT_CHARS each, and the
 * native search is O(text × pattern) in the worst case: a long pattern that
 * almost matches at every offset costs minutes of isolate CPU. Knuth-Morris-
 * Pratt looks at each text character at most twice regardless of content.
 */
function linearIndexOf(
  pattern: string,
): (text: string, position: number) => number {
  const length = pattern.length;
  const fallback = new Int32Array(length);
  for (let index = 1, matched = 0; index < length; index += 1) {
    const code = pattern.charCodeAt(index);
    while (matched > 0 && code !== pattern.charCodeAt(matched)) {
      matched = fallback[matched - 1]!;
    }
    if (code === pattern.charCodeAt(matched)) matched += 1;
    fallback[index] = matched;
  }
  return (text, position) => {
    const start = Math.min(Math.max(Math.trunc(position) || 0, 0), text.length);
    if (length === 0) return start;
    let matched = 0;
    for (let index = start; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      while (matched > 0 && code !== pattern.charCodeAt(matched)) {
        matched = fallback[matched - 1]!;
      }
      if (code === pattern.charCodeAt(matched)) matched += 1;
      if (matched === length) return index - length + 1;
    }
    return -1;
  };
}

function replaceHandler(
  formula: FormulaApi,
  names: readonly string[],
  original: FormulaFunction,
  replacement: FormulaFunction,
): void {
  for (const name of names) {
    const entry = formula.FunctionList[name];
    if (entry?.[0] === original) entry[0] = replacement;
  }
}

function decodedRange(
  formula: FormulaApi,
  rangeValue: unknown,
): (RangeParts & { start: string; end: string; cells: number }) | null {
  if (typeof rangeValue !== 'string') return null;
  const firstPipe = rangeValue.indexOf('|');
  const secondPipe = rangeValue.indexOf('|', firstPipe + 1);
  if (firstPipe < 1 || secondPipe < 0) return null;

  let start = rangeValue.slice(0, firstPipe);
  let end = rangeValue.slice(firstPipe + 1, secondPipe);
  const startSheet = start.indexOf('!');
  const endSheet = end.indexOf('!');
  if (startSheet >= 0) start = start.slice(0, startSheet);
  if (endSheet >= 0) end = end.slice(0, endSheet);

  const parts = formula.OrderRangeParts(start, end);
  const values = [parts.c1, parts.c2, parts.r1, parts.r2];
  if (!values.every((value) => Number.isSafeInteger(value))) return null;
  const columns = parts.c2 - parts.c1 + 1;
  const rows = parts.r2 - parts.r1 + 1;
  const cells = columns * rows;
  return { ...parts, start, end, cells };
}

function rangeCells(range: RangeParts): number {
  return (range.c2 - range.c1 + 1) * (range.r2 - range.r1 + 1);
}

function rectangleIsAllowed(range: RangeParts): boolean {
  const cells = rangeCells(range);
  return (
    range.c1 >= 1 &&
    range.c2 <= MAX_FORMULA_COLUMN &&
    range.r1 >= 1 &&
    range.r2 <= MAX_FORMULA_ROW &&
    cells >= 1 &&
    cells <= MAX_FORMULA_RANGE_CELLS
  );
}

function rangeIsAllowed(formula: FormulaApi, rangeValue: unknown): boolean {
  const range = decodedRange(formula, rangeValue);
  return range !== null && rectangleIsAllowed(range);
}

/**
 * Install once on a newly-created SocialCalc namespace: the isolate-local
 * one of the headless engine, and the page's, which evaluates the same room
 * data in every visitor's tab.
 */
export function installFormulaLimits(rawHost: unknown): void {
  if (rawHost === null || typeof rawHost !== 'object') return;
  const host = rawHost as SocialCalcFormulaHost;
  const formula = host.Formula;
  if (!formula || installed.has(formula)) return;
  installed.add(formula);

  type BudgetSnapshot = {
    text: number | null;
    range: number | null;
    textRead: number | null;
    iterations: number | null;
    names: number | null;
    order: number | null;
    unordered: WeakSet<object>;
    match: number | null;
  };

  let textBudget: number | null = null;
  let rangeStepBudget: number | null = null;
  let textReadBudget: number | null = null;
  let iterationBudget: number | null = null;
  let nameBudget: number | null = null;
  let orderStepBudget: number | null = null;
  let unorderedFormulas = new WeakSet<object>();
  let matchBudget: number | null = null;

  const captureBudgets = (): BudgetSnapshot => ({
    text: textBudget,
    range: rangeStepBudget,
    textRead: textReadBudget,
    iterations: iterationBudget,
    names: nameBudget,
    order: orderStepBudget,
    unordered: unorderedFormulas,
    match: matchBudget,
  });

  const restoreBudgets = (snapshot: BudgetSnapshot): void => {
    textBudget = snapshot.text;
    rangeStepBudget = snapshot.range;
    textReadBudget = snapshot.textRead;
    iterationBudget = snapshot.iterations;
    nameBudget = snapshot.names;
    orderStepBudget = snapshot.order;
    unorderedFormulas = snapshot.unordered;
    matchBudget = snapshot.match;
  };

  const resetBudgets = (): void => {
    textBudget = null;
    rangeStepBudget = null;
    textReadBudget = null;
    iterationBudget = null;
    nameBudget = null;
    orderStepBudget = null;
    unorderedFormulas = new WeakSet();
    matchBudget = null;
  };

  const startBudgets = (multiplier = 1): void => {
    textBudget = MAX_FORMULA_RECALC_TEXT_CHARS * multiplier;
    rangeStepBudget = MAX_FORMULA_RECALC_RANGE_STEPS * multiplier;
    textReadBudget = MAX_FORMULA_RECALC_RANGE_STEPS * multiplier;
    iterationBudget = MAX_FORMULA_ITERATIONS * multiplier;
    nameBudget = MAX_FORMULA_RECALC_NAME_CHARS * multiplier;
    orderStepBudget = MAX_FORMULA_RECALC_ORDER_STEPS * multiplier;
    unorderedFormulas = new WeakSet();
    matchBudget = MAX_FORMULA_RECALC_MATCH_STEPS * multiplier;
  };

  // The headless engine's timers are synchronous, so its recalculation is
  // over when RecalcSheet returns. A page's continues in timer slices, and
  // across the wait for a referenced sheet, until RecalcInfo is idle again;
  // its budgets have to last as long.
  const recalcInProgress = (): boolean => {
    const info = host.RecalcInfo;
    return info !== undefined && info.currentState !== info.state.idle;
  };

  // Upstream returns RecalcInfo to idle only at the normal end of a
  // recalculation, and RecalcSheet merely queues the sheet in any other
  // state. Clear the in-flight state if anything throws so later passes run.
  const abandonRecalc = (): void => {
    const info = host.RecalcInfo;
    if (!info) return;
    if (info.sheet) delete info.sheet.recalcdata;
    info.sheet = null;
    info.queue = [];
    info.currentState = info.state.idle;
    formula.SheetCache.waitingForLoading = null;
  };

  let budgetIsShared = false;
  const withRecalcBudget = <T>(
    shared: boolean,
    sheet: IoSheet | null,
    multiplier: number,
    work: () => T,
  ): T => {
    if (budgetIsShared || recalcInProgress()) {
      if (sheet && !recalcInProgress()) sheet.ioParameterList = {};
      return work();
    }
    const previous = captureBudgets();
    startBudgets(multiplier);
    if (sheet) sheet.ioParameterList = {};
    budgetIsShared = shared;
    try {
      return work();
    } catch (error) {
      abandonRecalc();
      throw error;
    } finally {
      if (!recalcInProgress()) {
        restoreBudgets(previous);
        budgetIsShared = false;
      }
    }
  };
  sharedRecalcBudgets.set(host, (work, multiplier = 1) =>
    withRecalcBudget(true, null, multiplier, work),
  );

  const originalRecalcSheet = host.RecalcSheet;
  if (typeof originalRecalcSheet === 'function') {
    host.RecalcSheet = (sheet) =>
      withRecalcBudget(false, sheet as IoSheet, 1, () =>
        originalRecalcSheet.call(host, sheet),
      );
  }

  const originalRecalcTimerRoutine = host.RecalcTimerRoutine;
  if (typeof originalRecalcTimerRoutine === 'function') {
    host.RecalcTimerRoutine = () => {
      // RecalcLoadedSheet starts the recalculation of a referenced sheet
      // here, without RecalcSheet. Do not wipe an active shared budget.
      if (!budgetIsShared && textBudget === null) startBudgets();
      try {
        return originalRecalcTimerRoutine.call(host);
      } catch (error) {
        abandonRecalc();
        throw error;
      } finally {
        if (!budgetIsShared && !recalcInProgress()) resetBudgets();
      }
    };
  }

  // Before evaluating, recalculation orders the formulas by visiting every
  // coordinate of each same-sheet range they mention. A range the evaluator
  // refuses anyway needs no ordering. One that no longer fits the recalc's
  // order budget is not walked either, and its formula becomes an error
  // rather than reading inputs that may not have been calculated yet.
  host.RecalcRangeAllowed = (range, parseInfo) => {
    if (!rectangleIsAllowed(range)) return false;
    if (orderStepBudget === null) return true;
    const cells = rangeCells(range);
    if (cells > orderStepBudget) {
      unorderedFormulas.add(parseInfo);
      return false;
    }
    orderStepBudget -= cells;
    return true;
  };

  const originalPushOperand = formula.PushOperand;
  formula.PushOperand = (operand, type, value) => {
    if (typeof value === 'string' && value.length > MAX_FORMULA_TEXT_CHARS) {
      originalPushOperand.call(formula, operand, 'e#VALUE!', 0);
      return;
    }
    originalPushOperand.call(formula, operand, type, value);
  };

  // Whatever reads a text or walks a range charges against the recalculation
  // budgets, unwinding to CalculateFunction or EvaluatePolish when spent.
  const rangeBudgetExhausted = new Error(LIMIT_ERROR);
  const spendRangeSteps = (steps: number): void => {
    if (rangeStepBudget === null) return;
    if (steps > rangeStepBudget) throw rangeBudgetExhausted;
    rangeStepBudget -= steps;
  };
  const spendTextSteps = (value: unknown): void => {
    if (typeof value !== 'string' || textReadBudget === null) return;
    const steps = Math.floor(value.length / FORMULA_TEXT_CHARS_PER_RANGE_STEP);
    if (textReadBudget < steps) throw rangeBudgetExhausted;
    textReadBudget -= steps;
  };

  const originalOperandValueAndType = formula.OperandValueAndType;
  formula.OperandValueAndType = (sheet, operand) => {
    const result = boundedOperand(
      originalOperandValueAndType.call(formula, sheet, operand),
    );
    spendTextSteps(result.value);
    return result;
  };

  // Event registration indexes every cell of its range without reading any.
  let registeringEvents = false;
  const originalStoreIoEventFormula = formula.StoreIoEventFormula;
  formula.StoreIoEventFormula = (
    name,
    coord,
    functionOperand,
    sheet,
    ioParameters,
  ) => {
    registeringEvents = true;
    try {
      originalStoreIoEventFormula.call(
        formula,
        name,
        coord,
        functionOperand,
        sheet,
        ioParameters,
      );
    } finally {
      registeringEvents = false;
    }
  };

  const originalDecodeRangeParts = formula.DecodeRangeParts;
  formula.DecodeRangeParts = (sheet, rangeValue) => {
    const range = originalDecodeRangeParts.call(formula, sheet, rangeValue);
    if (range === null) return range;
    if (registeringEvents) {
      spendRangeSteps(range.ncols * range.nrows);
      return range;
    }
    const cells = range.sheetdata;
    const view = Object.create(cells) as RangeSheet;
    view.GetAssuredCell = (coord) => {
      spendRangeSteps(1);
      const cell = cells.GetAssuredCell(coord);
      spendTextSteps(cell.datavalue);
      return cell;
    };
    range.sheetdata = view;
    return range;
  };

  const originalTestCriteria = formula.TestCriteria;
  formula.TestCriteria = (value, type, criteria) => {
    spendTextSteps(criteria);
    return originalTestCriteria.call(formula, value, type, criteria);
  };

  const originalEvaluatePolish = formula.EvaluatePolish;
  formula.EvaluatePolish = (parseInfo, reversePolish, sheet, allowRangeReturn) => {
    if (unorderedFormulas.has(parseInfo as object)) return limitError('e#NUM!');
    let evaluated: FormulaOperand;
    try {
      evaluated = originalEvaluatePolish.call(
        formula,
        parseInfo,
        reversePolish,
        sheet,
        allowRangeReturn,
      );
    } catch (error) {
      if (error !== rangeBudgetExhausted) throw error;
      const coord = (parseInfo as { coord?: unknown } | null)?.coord;
      const kept = (sheet as Partial<IoSheet> | null)?.ioParameterList;
      if (typeof coord === 'string' && kept) delete kept[coord];
      return limitError('e#NUM!');
    }
    const result = boundedOperand(evaluated);
    if (textBudget === null) return result;
    const length =
      textLength(result.value) +
      textLength(result.type) +
      textLength(result.error);
    // Replacing a result no longer than the limit error itself would save
    // nothing, so numbers and short errors survive an exhausted budget.
    if (length <= LIMIT_ERROR_RESULT_CHARS) return result;
    if (length > textBudget) return limitError();
    textBudget -= length;
    return result;
  };

  // Charge IO parameter text kept on the sheet against `textBudget`.
  let ioListRefused = false;
  const originalCalculateFunction = formula.CalculateFunction;
  formula.CalculateFunction = (name, operand, sheet, coord) => {
    if (
      textBudget === null ||
      formula.FunctionList[name]?.[0] !== formula.IoFunctions
    ) {
      return originalCalculateFunction.call(
        formula,
        name,
        operand,
        sheet,
        coord,
      );
    }

    const kept = (sheet as IoSheet).ioParameterList;
    const coordKey = String(coord);
    const previous = kept[coordKey];
    const charged = ioTextLength(previous);
    ioListRefused = false;
    const error = originalCalculateFunction.call(
      formula,
      name,
      operand,
      sheet,
      coord,
    );
    // STYLE extends the entry an earlier function in the formula stored.
    const parameters = kept[coordKey];
    const chars =
      ioTextLength(parameters) - (parameters === previous ? charged : 0);
    if (!ioListRefused && chars <= textBudget) {
      textBudget -= Math.max(0, chars);
      return error;
    }
    delete kept[coordKey];
    operand[operand.length - 1] = limitError();
    return LIMIT_ERROR;
  };

  // SELECT, STYLE and PANEL read their list straight from the cells, and
  // SELECT joins it into that markup. Refuse a list that could not be kept
  // before the markup is built.
  const originalGetStandardizedList = formula.getStandardizedList;
  formula.getStandardizedList = (sheet, parameter) => {
    const list = originalGetStandardizedList.call(formula, sheet, parameter);
    let chars = 0;
    for (const item of list) chars += item.length + SELECT_OPTION_MARKUP_CHARS;
    ioListRefused = textBudget !== null && chars > textBudget;
    return ioListRefused ? [] : list;
  };

  const originalOperandsAsRangeOnSheet = formula.OperandsAsRangeOnSheet;
  formula.OperandsAsRangeOnSheet = (sheet, operand) => {
    const result = originalOperandsAsRangeOnSheet.call(formula, sheet, operand);
    return result.type === 'range' && !rangeIsAllowed(formula, result.value)
      ? limitError('e#NUM!')
      : result;
  };

  // Upstream re-parses and re-evaluates a formula-valued name at every
  // reference, so `b = a+a`, `c = b+b`, ... costs 2^n evaluations, and
  // deep chains can overflow the call stack. Cache each name per outermost
  // lookup, bound recursion depth, charge evaluated definitions, and clear
  // circular-name state if an evaluation throws.
  const originalLookupName = formula.LookupName;
  let nameValues: Map<unknown, FormulaOperand> | null = null;
  let nameDepth = 0;
  const boundedName = (result: FormulaOperand): FormulaOperand =>
    result.type === 'range' && !rangeIsAllowed(formula, result.value)
      ? limitError('e#NUM!')
      : result;
  formula.LookupName = (sheet, name, isEnd) => {
    if (nameDepth >= MAX_FORMULA_NAME_DEPTH) return limitError('e#NAME?');
    const walk = sheet as {
      checknamecirc?: unknown;
      names: Record<string, { definition?: unknown } | undefined>;
    };
    const entry = walk.names[name.toUpperCase()];
    const definition = entry?.definition;
    if (typeof definition !== 'string' || definition.charAt(0) !== '=') {
      return boundedName(originalLookupName.call(formula, sheet, name, isEnd));
    }

    const outermost = nameValues === null;
    const values = (nameValues ??= new Map());
    const startsWalk = walk.checknamecirc === undefined;
    nameDepth += 1;
    try {
      // Callers mutate the operand they get back; hand out and keep copies.
      const known = values.get(entry);
      if (known) return { ...known };
      if (nameBudget !== null) {
        if (definition.length > nameBudget) return limitError('e#NUM!');
        nameBudget -= definition.length;
      }
      const result = boundedName(
        originalLookupName.call(formula, sheet, name, isEnd),
      );
      // A circular reference stores its error here first; the evaluation it
      // interrupted then replaces that with the name's own result.
      values.set(entry, { ...result });
      return result;
    } catch (error) {
      if (startsWalk) delete walk.checknamecirc;
      throw error;
    } finally {
      nameDepth -= 1;
      if (outermost) nameValues = null;
    }
  };

  // Upstream restarts at the range origin for every item, making an N-cell
  // aggregate O(N²). Address the continuation sequence directly instead.
  formula.StepThroughRangeDown = (operand, rangeValue) => {
    const range = decodedRange(formula, rangeValue);
    if (!range) return limitError('e#REF!');
    if (!rangeIsAllowed(formula, rangeValue)) return limitError('e#NUM!');
    if (rangeStepBudget !== null) {
      if (rangeStepBudget < 1) return limitError('e#NUM!');
      rangeStepBudget -= 1;
    }

    const secondPipe = rangeValue.indexOf('|', rangeValue.indexOf('|') + 1);
    const rawSequence = Number(rangeValue.slice(secondPipe + 1));
    if (!Number.isFinite(rawSequence) || rawSequence < 0) {
      return limitError('e#NUM!');
    }
    const next = Math.floor(rawSequence) + 1;
    if (next > range.cells) return undefined;

    const columns = range.c2 - range.c1 + 1;
    const offset = next - 1;
    const row = range.r1 + Math.floor(offset / columns);
    const column = range.c1 + (offset % columns);
    if (next < range.cells) {
      formula.PushOperand(
        operand,
        'range',
        `${rangeValue.slice(0, secondPipe + 1)}${next}`,
      );
    }
    const sheetSuffixStart = rangeValue.slice(0, rangeValue.indexOf('|')).indexOf('!');
    const sheetSuffix =
      sheetSuffixStart < 0
        ? ''
        : rangeValue.slice(sheetSuffixStart, rangeValue.indexOf('|'));
    return {
      type: 'coord',
      value: `${host.crToCoord?.(column, row) ?? `${column}:${row}`}${sheetSuffix}`,
    };
  };

  const originalStringFunctions = formula.StringFunctions;
  const boundedStringFunctions: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    if (name !== 'FIND' && name !== 'REPT' && name !== 'SUBSTITUTE') {
      return originalStringFunctions.call(
        formula,
        name,
        operand,
        functionOperand,
        sheet,
      );
    }

    const expected = name === 'REPT' ? 2 : undefined;
    if (
      (expected !== undefined && functionOperand.length !== expected) ||
      (name === 'FIND' &&
        functionOperand.length !== 2 &&
        functionOperand.length !== 3) ||
      (name === 'SUBSTITUTE' &&
        functionOperand.length !== 3 &&
        functionOperand.length !== 4)
    ) {
      return originalStringFunctions.call(
        formula,
        name,
        operand,
        functionOperand,
        sheet,
      );
    }

    if (name === 'REPT') {
      const text = formula.OperandAsText(sheet, functionOperand);
      const countValue = formula.OperandAsNumber(sheet, functionOperand);
      if (text.type.startsWith('e')) {
        formula.PushOperand(operand, text.type, 0);
        return;
      }
      if (countValue.type.startsWith('e')) {
        formula.PushOperand(operand, countValue.type, 0);
        return;
      }
      const rawText = String(text.value);
      const rawCount = Number(countValue.value);
      if (rawCount < 0) {
        formula.PushOperand(operand, 'e#VALUE!', 'Negative count');
        return;
      }
      if (rawText.length === 0) {
        formula.PushOperand(operand, 't', '');
        return;
      }
      const count = Math.ceil(rawCount);
      const resultLength = rawText.length * count;
      if (
        !Number.isSafeInteger(count) ||
        count > Math.floor(MAX_FORMULA_TEXT_CHARS / rawText.length) ||
        (textBudget !== null && resultLength > textBudget)
      ) {
        formula.PushOperand(operand, 'e#VALUE!', 0);
        return;
      }
      formula.PushOperand(operand, 't', rawText.repeat(count));
      return;
    }

    if (name === 'FIND') {
      const needle = formula.OperandAsText(sheet, functionOperand);
      const haystack = formula.OperandAsText(sheet, functionOperand);
      const startValue =
        functionOperand.length === 1
          ? formula.OperandAsNumber(sheet, functionOperand)
          : null;
      for (const value of [needle, haystack, startValue]) {
        if (value?.type.startsWith('e')) {
          formula.PushOperand(operand, value.type, 0);
          return;
        }
      }
      const offset = startValue === null ? 0 : Number(startValue.value) - 1;
      if (offset < 0) {
        formula.PushOperand(operand, 'e#VALUE!', 'Start is before string');
        return;
      }
      const found = linearIndexOf(String(needle.value))(
        String(haystack.value),
        offset,
      );
      if (found < 0) {
        formula.PushOperand(operand, 'e#VALUE!', 'Not found');
        return;
      }
      formula.PushOperand(operand, 'n', found + 1);
      return;
    }

    const full = formula.OperandAsText(sheet, functionOperand);
    const oldValue = formula.OperandAsText(sheet, functionOperand);
    const replacementValue = formula.OperandAsText(sheet, functionOperand);
    const whichValue =
      functionOperand.length === 1
        ? formula.OperandAsNumber(sheet, functionOperand)
        : null;
    for (const value of [full, oldValue, replacementValue, whichValue]) {
      if (value?.type.startsWith('e')) {
        formula.PushOperand(operand, value.type, 0);
        return;
      }
    }

    const fullText = String(full.value);
    const oldText = String(oldValue.value);
    const replacement = String(replacementValue.value);
    const which = whichValue === null ? 0 : Number(whichValue.value);
    if (which <= 0 && whichValue !== null) {
      formula.PushOperand(operand, 'e#VALUE!', 'Non-positive instance number');
      return;
    }
    // The upstream loop never advances for an empty search string. Treat it
    // as a no-op, matching spreadsheet users' least-surprising expectation.
    if (oldText.length === 0) {
      formula.PushOperand(
        operand,
        textBudget !== null && fullText.length > textBudget ? 'e#VALUE!' : 't',
        textBudget !== null && fullText.length > textBudget ? 0 : fullText,
      );
      return;
    }

    const indexOfOldText = linearIndexOf(oldText);
    const positions: number[] = [];
    let occurrences = 0;
    let position = 0;
    let selectedPosition = -1;
    while (position <= fullText.length) {
      const found = indexOfOldText(fullText, position);
      if (found < 0) break;
      occurrences += 1;
      if (which === 0) {
        positions.push(found);
      } else if (occurrences === which) {
        selectedPosition = found;
        break;
      }
      position = found + oldText.length;
    }

    let resultLength = fullText.length;
    if (which === 0) {
      resultLength += occurrences * (replacement.length - oldText.length);
    } else if (selectedPosition >= 0) {
      resultLength += replacement.length - oldText.length;
    }
    if (
      !Number.isSafeInteger(resultLength) ||
      resultLength > MAX_FORMULA_TEXT_CHARS ||
      (textBudget !== null && resultLength > textBudget)
    ) {
      formula.PushOperand(operand, 'e#VALUE!', 0);
      return;
    }

    // Splice at the offsets found above instead of searching a second time
    // (`replaceAll` would repeat the worst case, and expands `$&` patterns
    // that the length check did not account for).
    let result = fullText;
    if (which === 0) {
      const parts: string[] = [];
      let start = 0;
      for (const found of positions) {
        parts.push(fullText.slice(start, found));
        start = found + oldText.length;
      }
      parts.push(fullText.slice(start));
      result = parts.join(replacement);
    } else if (selectedPosition >= 0) {
      result =
        fullText.slice(0, selectedPosition) +
        replacement +
        fullText.slice(selectedPosition + oldText.length);
    }
    formula.PushOperand(operand, 't', result);
  };
  formula.StringFunctions = boundedStringFunctions;
  replaceHandler(
    formula,
    ['FIND', 'REPT', 'SUBSTITUTE'],
    originalStringFunctions,
    boundedStringFunctions,
  );

  const originalSeriesFunctions = formula.SeriesFunctions;
  const boundedSeriesFunctions: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    if (name !== 'CONCAT' && name !== 'CONCATENATE') {
      return originalSeriesFunctions.call(
        formula,
        name,
        operand,
        functionOperand,
        sheet,
      );
    }
    let result = '';
    while (functionOperand.length > 0) {
      const value = formula.OperandValueAndType(sheet, functionOperand);
      const kind = value.type.charAt(0);
      if (kind === 'e' || kind === 'b') continue;
      const next = String(value.value);
      if (
        next.length > MAX_FORMULA_TEXT_CHARS - result.length ||
        (textBudget !== null && next.length > textBudget - result.length)
      ) {
        formula.PushOperand(operand, 'e#VALUE!', 0);
        return;
      }
      result += next;
    }
    formula.PushOperand(operand, 't', result);
  };
  formula.SeriesFunctions = boundedSeriesFunctions;
  replaceHandler(
    formula,
    ['CONCAT', 'CONCATENATE'],
    originalSeriesFunctions,
    boundedSeriesFunctions,
  );

  // Upstream reads every criteria operand once per sum-range cell, including
  // operands that ran out before the sum range did. Settle spent operands
  // once so cells x criteria cannot bypass range step limits.
  const originalSumifsFunction = formula.SumifsFunction;
  const boundedSumifsFunction: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    const sumRange = formula.TopOfStackValueAndType(sheet, functionOperand);
    if (sumRange.type !== 'coord' && sumRange.type !== 'range') {
      formula.FunctionArgsError(name, operand);
      return 0;
    }
    let pairs: { cells: FormulaStack; criteria: unknown }[] = [];
    while (functionOperand.length > 0) {
      const range = formula.TopOfStackValueAndType(sheet, functionOperand);
      const criteria = formula.OperandAsText(sheet, functionOperand);
      if (range.type !== 'coord' && range.type !== 'range') {
        formula.FunctionArgsError(name, operand);
        return 0;
      }
      pairs.push({
        cells: [range],
        criteria: criteria.type.charAt(0) === 'e' ? null : criteria.value,
      });
    }

    const sumCells: FormulaStack = [sumRange];
    let sum = 0;
    let resultType = '';
    while (sumCells.length > 0) {
      const value = formula.OperandValueAndType(sheet, sumCells);
      let matches = true;
      let spent = false;
      for (const { cells, criteria } of pairs) {
        const candidate = formula.OperandValueAndType(sheet, cells);
        if (cells.length === 0) spent = true;
        if (
          matches &&
          !formula.TestCriteria(candidate.value, candidate.type, criteria)
        ) {
          matches = false;
        }
      }
      if (matches) {
        const kind = value.type.charAt(0);
        if (kind === 'n') {
          sum += Number(value.value);
          resultType = formula.LookupResultType(
            value.type,
            resultType || value.type,
            formula.TypeLookupTable.plus,
          );
        } else if (kind === 'e' && resultType.charAt(0) !== 'e') {
          resultType = value.type;
        }
      }
      if (!spent) continue;

      const live: typeof pairs = [];
      let unmatchable = false;
      for (const pair of pairs) {
        if (pair.cells.length > 0) {
          live.push(pair);
          continue;
        }
        const empty = formula.OperandValueAndType(sheet, pair.cells);
        if (!formula.TestCriteria(empty.value, empty.type, pair.criteria)) {
          unmatchable = true;
          break;
        }
      }
      if (unmatchable) break;
      pairs = live;
    }
    formula.PushOperand(operand, resultType || 'n', sum);
  };
  formula.SumifsFunction = boundedSumifsFunction;
  replaceHandler(
    formula,
    ['SUMIFS'],
    originalSumifsFunction,
    boundedSumifsFunction,
  );

  const originalMath2Functions = formula.Math2Functions;
  const boundedMath2Functions: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    if (name !== 'TRUNC') {
      return originalMath2Functions.call(
        formula,
        name,
        operand,
        functionOperand,
        sheet,
      );
    }
    const number = formula.OperandAsNumber(sheet, functionOperand);
    const precisionValue = formula.OperandAsNumber(sheet, functionOperand);
    const result: FormulaOperand = {
      type: formula.LookupResultType(
        number.type,
        precisionValue.type,
        formula.TypeLookupTable.twoargnumeric,
      ),
      value: 0,
    };
    if (result.type === 'n') {
      const precision = Number(precisionValue.value);
      const value = Number(number.value);
      if (!Number.isFinite(precision)) {
        result.type = 'e#NUM!';
      } else if (precision >= 0) {
        const digits = Math.floor(precision);
        result.value =
          digits > 308
            ? value
            : Math.floor(Math.abs(value) * 10 ** digits) / 10 ** digits;
      } else {
        const digits = Math.floor(-precision);
        result.value =
          digits > 308
            ? 0
            : Math.floor(Math.abs(value) / 10 ** digits) * 10 ** digits;
      }
      if (value < 0) result.value = -Number(result.value);
    }
    operand.push(result);
    return null;
  };
  formula.Math2Functions = boundedMath2Functions;
  replaceHandler(
    formula,
    ['TRUNC'],
    originalMath2Functions,
    boundedMath2Functions,
  );

  const originalRoundFunction = formula.RoundFunction;
  const boundedRoundFunction: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    const value = formula.OperandValueAndType(sheet, functionOperand);
    const resultType = formula.LookupResultType(
      value.type,
      value.type,
      formula.TypeLookupTable.oneargnumeric,
    );
    let precisionValue: FormulaOperand;
    if (functionOperand.length === 1) {
      precisionValue = formula.OperandValueAndType(sheet, functionOperand);
      if (precisionValue.type.charAt(0) !== 'n') {
        return formula.FunctionSpecificError(
          name,
          operand,
          'e#NUM!',
          host.Constants?.s_sheetfuncroundsecondarg ?? 'Invalid precision',
        );
      }
    } else if (functionOperand.length !== 0) {
      return formula.FunctionArgsError(name, operand);
    } else {
      precisionValue = { value: 0, type: 'n' };
    }

    let result: unknown = 0;
    if (resultType === 'n') {
      const precision = Number(precisionValue.value);
      const number = Number(value.value);
      if (!Number.isFinite(precision)) {
        formula.PushOperand(operand, 'e#NUM!', 0);
        return;
      }
      if (precision === 0) {
        result = Math.round(number);
      } else if (precision > 0) {
        const digits = Math.floor(precision);
        result =
          digits > 308
            ? number
            : Math.round(number * 10 ** digits) / 10 ** digits;
      } else {
        const digits = Math.floor(-precision);
        result =
          digits > 308
            ? 0
            : Math.round(number / 10 ** digits) * 10 ** digits;
      }
    }
    formula.PushOperand(operand, resultType, result);
  };
  formula.RoundFunction = boundedRoundFunction;
  replaceHandler(
    formula,
    ['ROUND'],
    originalRoundFunction,
    boundedRoundFunction,
  );

  const originalDdbFunction = formula.DDBFunction;
  const boundedDdbFunction: FormulaFunction = (
    name,
    operand,
    functionOperand,
    sheet,
  ) => {
    const cost = formula.OperandAsNumber(sheet, functionOperand);
    const salvage = formula.OperandAsNumber(sheet, functionOperand);
    const lifetime = formula.OperandAsNumber(sheet, functionOperand);
    const period = formula.OperandAsNumber(sheet, functionOperand);
    for (const value of [cost, salvage, lifetime, period]) {
      if (formula.CheckForErrorValue(operand, value)) return;
    }
    if (Number(lifetime.value) < 1) {
      return formula.FunctionSpecificError(
        name,
        operand,
        'e#NUM!',
        host.Constants?.s_sheetfuncddblife ?? 'Invalid lifetime',
      );
    }
    const method =
      functionOperand.length > 0
        ? formula.OperandAsNumber(sheet, functionOperand)
        : { value: 2, type: 'n' };
    if (functionOperand.length !== 0) {
      return formula.FunctionArgsError(name, operand);
    }
    if (formula.CheckForErrorValue(operand, method)) return;

    const iterations = Math.max(
      0,
      Math.floor(Math.min(Number(period.value), Number(lifetime.value))),
    );
    if (
      !Number.isSafeInteger(iterations) ||
      iterations > MAX_FORMULA_ITERATIONS ||
      (iterationBudget !== null && iterations > iterationBudget)
    ) {
      formula.PushOperand(operand, 'e#NUM!', 0);
      return;
    }
    if (iterationBudget !== null) iterationBudget -= iterations;
    let depreciation = 0;
    let accumulated = 0;
    for (let index = 1; index <= iterations; index += 1) {
      depreciation =
        (Number(cost.value) - accumulated) *
        (Number(method.value) / Number(lifetime.value));
      if (
        Number(cost.value) - accumulated - depreciation <
        Number(salvage.value)
      ) {
        depreciation =
          Number(cost.value) - accumulated - Number(salvage.value);
      }
      accumulated += depreciation;
    }
    formula.PushOperand(operand, 'n$', depreciation);
  };
  formula.DDBFunction = boundedDdbFunction;
  replaceHandler(
    formula,
    ['DDB'],
    originalDdbFunction,
    boundedDdbFunction,
  );

  // The patched engine matches wildcard criteria in at most text length
  // times criteria length steps; both are room data, so charge that work to
  // the recalculation. Past the budget a value no longer meets the criteria.
  const originalWildcardMatch = formula.WildcardMatch;
  formula.WildcardMatch = (text, pattern) => {
    const steps = (text.length + 1) * (pattern.length + 1);
    if (
      steps > MAX_FORMULA_RECALC_MATCH_STEPS ||
      (matchBudget !== null && steps > matchBudget)
    ) {
      return false;
    }
    if (matchBudget !== null) matchBudget -= steps;
    return originalWildcardMatch.call(formula, text, pattern);
  };
}
