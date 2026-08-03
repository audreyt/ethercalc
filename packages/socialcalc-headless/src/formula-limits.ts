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
const MAX_FORMULA_RECALC_TEXT_CHARS = 8 * 1024 * 1024;
const MAX_FORMULA_RECALC_RANGE_STEPS = 1_000_000;
const LIMIT_ERROR = 'Formula exceeds resource limits';

type FormulaOperand = {
  type: string;
  value: unknown;
  error?: string;
};

type FormulaStack = FormulaOperand[];

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

type FormulaApi = {
  FunctionList: Record<string, FormulaEntry>;
  PushOperand: (operand: FormulaStack, type: string, value: unknown) => void;
  OperandValueAndType: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  OperandAsText: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  OperandAsNumber: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  EvaluatePolish: (
    parseInfo: unknown,
    reversePolish: unknown,
    sheet: unknown,
    allowRangeReturn?: boolean,
  ) => FormulaOperand;
  LookupName: (sheet: unknown, name: string, isEnd?: boolean) => FormulaOperand;
  OperandsAsRangeOnSheet: (sheet: unknown, operand: FormulaStack) => FormulaOperand;
  StepThroughRangeDown: (
    operand: FormulaStack,
    rangeValue: string,
  ) => FormulaOperand | undefined;
  OrderRangeParts: (start: string, end: string) => RangeParts;
  LookupResultType: (left: string, right: string, table: unknown) => string;
  TypeLookupTable: {
    oneargnumeric: unknown;
    twoargnumeric: unknown;
  };
  FunctionArgsError: (name: string, operand: FormulaStack) => unknown;
  FunctionSpecificError: (
    name: string,
    operand: FormulaStack,
    type: string,
    message: string,
  ) => unknown;
  CheckForErrorValue: (operand: FormulaStack, value: FormulaOperand) => boolean;
  StringFunctions: FormulaFunction;
  SeriesFunctions: FormulaFunction;
  Math2Functions: FormulaFunction;
  RoundFunction: FormulaFunction;
  DDBFunction: FormulaFunction;
};

type SocialCalcFormulaHost = {
  Formula?: FormulaApi;
  Constants?: Record<string, string>;
  crToCoord?: (column: number, row: number) => string;
  RecalcSheet?: (sheet: unknown) => unknown;
};

const installed = new WeakSet<object>();

function limitError(type = 'e#VALUE!'): FormulaOperand {
  return { type, value: 0, error: LIMIT_ERROR };
}

function boundedOperand(value: FormulaOperand): FormulaOperand {
  return typeof value.value === 'string' && value.value.length > MAX_FORMULA_TEXT_CHARS
    ? limitError()
    : value;
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

function rangeIsAllowed(formula: FormulaApi, rangeValue: unknown): boolean {
  const range = decodedRange(formula, rangeValue);
  return (
    range !== null &&
    range.c1 >= 1 &&
    range.c2 <= MAX_FORMULA_COLUMN &&
    range.r1 >= 1 &&
    range.r2 <= MAX_FORMULA_ROW &&
    range.cells >= 1 &&
    range.cells <= MAX_FORMULA_RANGE_CELLS
  );
}

/** Install once on a newly-created, isolate-local SocialCalc namespace. */
export function installFormulaLimits(rawHost: unknown): void {
  if (rawHost === null || typeof rawHost !== 'object') return;
  const host = rawHost as SocialCalcFormulaHost;
  const formula = host.Formula;
  if (!formula || installed.has(formula)) return;
  installed.add(formula);

  let textBudget: number | null = null;
  let rangeStepBudget: number | null = null;
  let iterationBudget: number | null = null;
  const originalRecalcSheet = host.RecalcSheet;
  if (typeof originalRecalcSheet === 'function') {
    host.RecalcSheet = (sheet) => {
      const previous = {
        text: textBudget,
        range: rangeStepBudget,
        iterations: iterationBudget,
      };
      textBudget = MAX_FORMULA_RECALC_TEXT_CHARS;
      rangeStepBudget = MAX_FORMULA_RECALC_RANGE_STEPS;
      iterationBudget = MAX_FORMULA_ITERATIONS;
      try {
        return originalRecalcSheet.call(host, sheet);
      } finally {
        textBudget = previous.text;
        rangeStepBudget = previous.range;
        iterationBudget = previous.iterations;
      }
    };
  }

  const originalPushOperand = formula.PushOperand;
  formula.PushOperand = (operand, type, value) => {
    if (typeof value === 'string' && value.length > MAX_FORMULA_TEXT_CHARS) {
      originalPushOperand.call(formula, operand, 'e#VALUE!', 0);
      return;
    }
    originalPushOperand.call(formula, operand, type, value);
  };

  const originalOperandValueAndType = formula.OperandValueAndType;
  formula.OperandValueAndType = (sheet, operand) =>
    boundedOperand(originalOperandValueAndType.call(formula, sheet, operand));

  const originalEvaluatePolish = formula.EvaluatePolish;
  formula.EvaluatePolish = (parseInfo, reversePolish, sheet, allowRangeReturn) => {
    const result = boundedOperand(
      originalEvaluatePolish.call(
        formula,
        parseInfo,
        reversePolish,
        sheet,
        allowRangeReturn,
      ),
    );
    if (typeof result.value !== 'string' || textBudget === null) return result;
    if (result.value.length > textBudget) return limitError();
    textBudget -= result.value.length;
    return result;
  };

  const originalOperandsAsRangeOnSheet = formula.OperandsAsRangeOnSheet;
  formula.OperandsAsRangeOnSheet = (sheet, operand) => {
    const result = originalOperandsAsRangeOnSheet.call(formula, sheet, operand);
    return result.type === 'range' && !rangeIsAllowed(formula, result.value)
      ? limitError('e#NUM!')
      : result;
  };

  const originalLookupName = formula.LookupName;
  formula.LookupName = (sheet, name, isEnd) => {
    const result = originalLookupName.call(formula, sheet, name, isEnd);
    return result.type === 'range' && !rangeIsAllowed(formula, result.value)
      ? limitError('e#NUM!')
      : result;
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
    if (name !== 'REPT' && name !== 'SUBSTITUTE') {
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

    let occurrences = 0;
    let position = 0;
    let selectedPosition = -1;
    while (position <= fullText.length) {
      const found = fullText.indexOf(oldText, position);
      if (found < 0) break;
      occurrences += 1;
      if (which !== 0 && occurrences === which) {
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

    const result =
      which === 0
        ? fullText.replaceAll(oldText, replacement)
        : selectedPosition < 0
          ? fullText
          : fullText.slice(0, selectedPosition) +
            replacement +
            fullText.slice(selectedPosition + oldText.length);
    formula.PushOperand(operand, 't', result);
  };
  formula.StringFunctions = boundedStringFunctions;
  replaceHandler(
    formula,
    ['REPT', 'SUBSTITUTE'],
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
}
