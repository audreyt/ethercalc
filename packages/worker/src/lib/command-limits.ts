/**
 * CPU/memory limits for attacker-controlled SocialCalc command batches.
 *
 * SocialCalc accepts arbitrary decimal row numbers and expands declared sheet
 * dimensions and command-target ranges with synchronous loops. This preflight
 * parses only command argument positions; cell text and formula payloads are
 * intentionally opaque so ordinary content cannot be mistaken for a range.
 */

/** SocialCalc's parser supports columns A through ZZ. */
export const MAX_SOCIALCALC_COL = 702;

/** Match the standard spreadsheet row ceiling used by scheduler cell IDs. */
export const MAX_SOCIALCALC_ROW = 1_048_576;

/** Shared declared-area, populated-cell, and direct range-operation budget. */
export const MAX_SHEET_CELLS = 200_000;

/** Maximum statically visible range work in one command batch. */
export const MAX_COMMAND_RANGE_WORK = MAX_SHEET_CELLS;

export interface SheetDimensions {
  readonly rows: number;
  readonly columns: number;
}

interface MutableDimensions {
  rows: number;
  columns: number;
}

interface TargetAnalysis {
  readonly work: number;
  readonly startRow: number;
  readonly startColumn: number;
  readonly endRow: number;
  readonly endColumn: number;
}

const OPAQUE_TARGET: TargetAnalysis = {
  work: 0,
  startRow: 0,
  startColumn: 0,
  endRow: 0,
  endColumn: 0,
};

function columnNumber(name: string): number {
  let value = 0;
  for (const char of name.toUpperCase()) {
    value = value * 26 + char.charCodeAt(0) - 64;
  }
  return value;
}

function isValidDimension(value: string, maximum: number): boolean {
  if (value === '') return false;
  const parsed = Number(value);
  return (
    Number.isSafeInteger(parsed) &&
    parsed >= 0 &&
    parsed <= maximum
  );
}

function initialDimension(value: number | undefined, maximum: number): number {
  return Number.isSafeInteger(value) && value !== undefined && value >= 1 && value <= maximum
    ? value
    : 1;
}

/** Parse one command target without looking at payload text or formulas. */
function analyzeTarget(rawTarget: string): TargetAnalysis | null {
  const target = rawTarget.replaceAll('$', '');
  const cells =
    /^([a-z]{1,2})([0-9]+)(?::([a-z]{1,2})([0-9]+))?$/i.exec(target);
  if (cells) {
    const startColumn = columnNumber(cells[1]!);
    const startRow = Number(cells[2]);
    const endColumn =
      cells[3] === undefined ? startColumn : columnNumber(cells[3]);
    const endRow = cells[4] === undefined ? startRow : Number(cells[4]);
    if (
      !Number.isSafeInteger(startRow) ||
      startRow < 1 ||
      startRow > MAX_SOCIALCALC_ROW ||
      !Number.isSafeInteger(endRow) ||
      endRow < 1 ||
      endRow > MAX_SOCIALCALC_ROW
    ) {
      return null;
    }
    return {
      work:
        (Math.abs(endColumn - startColumn) + 1) *
        (Math.abs(endRow - startRow) + 1),
      startRow,
      startColumn,
      endRow,
      endColumn,
    };
  }

  const rows = /^([0-9]+)(?::([0-9]+))?$/.exec(target);
  if (rows) {
    const startRow = Number(rows[1]);
    const endRow = rows[2] === undefined ? startRow : Number(rows[2]);
    if (
      !Number.isSafeInteger(startRow) ||
      startRow < 1 ||
      startRow > MAX_SOCIALCALC_ROW ||
      !Number.isSafeInteger(endRow) ||
      endRow < 1 ||
      endRow > MAX_SOCIALCALC_ROW
    ) {
      return null;
    }
    return {
      work: Math.abs(endRow - startRow) + 1,
      startRow,
      startColumn: 1,
      endRow,
      endColumn: 1,
    };
  }

  const columns = /^([a-z]{1,2})(?::([a-z]{1,2}))?$/i.exec(target);
  if (columns) {
    const startColumn = columnNumber(columns[1]!);
    const endColumn =
      columns[2] === undefined ? startColumn : columnNumber(columns[2]);
    return {
      work: Math.abs(endColumn - startColumn) + 1,
      startRow: 1,
      startColumn,
      endRow: 1,
      endColumn,
    };
  }

  // Named ranges are resolved by SocialCalc. They cannot be bounded lexically,
  // but rejecting them would break a documented spreadsheet feature.
  return OPAQUE_TARGET;
}

function declaredArea(dimensions: MutableDimensions): number {
  return dimensions.rows * dimensions.columns;
}

/** Allow legacy oversized sheets to shrink/edit, but never grow their area. */
function setDimensions(
  dimensions: MutableDimensions,
  rows: number,
  columns: number,
): boolean {
  const priorArea = declaredArea(dimensions);
  const nextArea = rows * columns;
  if (nextArea > MAX_SHEET_CELLS && nextArea > priorArea) return false;
  dimensions.rows = rows;
  dimensions.columns = columns;
  return true;
}

function expandForTarget(
  dimensions: MutableDimensions,
  target: TargetAnalysis,
): boolean {
  if (target.endRow === 0 || target.endColumn === 0) return true;
  return setDimensions(
    dimensions,
    Math.max(dimensions.rows, target.startRow, target.endRow),
    Math.max(dimensions.columns, target.startColumn, target.endColumn),
  );
}

function chargeTarget(
  target: TargetAnalysis,
  counter: { value: number },
): boolean {
  if (target.work > MAX_COMMAND_RANGE_WORK - counter.value) return false;
  counter.value += target.work;
  return true;
}

function parseClipboardRange(line: string): TargetAnalysis | null {
  const matches = line.matchAll(
    /copiedfrom(?::|\\c)([a-z]{1,2}[0-9]+)(?::|\\c)([a-z]{1,2}[0-9]+)/gi,
  );
  let found: TargetAnalysis | null = null;
  for (const match of matches) {
    const parsed = analyzeTarget(`${match[1]}:${match[2]}`);
    if (parsed === null || parsed.work > MAX_SHEET_CELLS) return null;
    found = parsed;
  }
  return found ?? OPAQUE_TARGET;
}

function boundedStructuralSheet(dimensions: MutableDimensions): boolean {
  return declaredArea(dimensions) <= MAX_SHEET_CELLS;
}

/**
 * Return false when command arguments or their resulting declared dimensions
 * can statically expand beyond limits. Callers handling an existing room must
 * pass its current dimensions so separate command batches cannot bypass the
 * product bound one axis at a time.
 */
export function isCommandBatchWithinLimits(
  command: string,
  initial?: SheetDimensions,
): boolean {
  const dimensions: MutableDimensions = {
    rows: initialDimension(initial?.rows, MAX_SOCIALCALC_ROW),
    columns: initialDimension(initial?.columns, MAX_SOCIALCALC_COL),
  };
  const counter = { value: 0 };
  let clipboard: TargetAnalysis | null = null;

  for (const line of command.split(/\r\n?|\n/)) {
    const parts = line.trim().split(/\s+/, 4);
    // `String.prototype.split` always yields at least one element, so the
    // verb needs no default — the argument positions do.
    const verb = parts[0]!;
    const first = parts[1] ?? '';
    const second = parts[2] ?? '';
    const third = parts[3] ?? '';
    switch (verb.toLowerCase()) {
      case 'set': {
        if (first.toLowerCase() === 'sheet') {
          const dimension = second.toLowerCase();
          if (dimension === 'lastrow') {
            if (!isValidDimension(third, MAX_SOCIALCALC_ROW)) return false;
            if (
              !setDimensions(
                dimensions,
                Math.max(1, Number(third)),
                dimensions.columns,
              )
            ) {
              return false;
            }
          } else if (dimension === 'lastcol') {
            if (!isValidDimension(third, MAX_SOCIALCALC_COL)) return false;
            if (
              !setDimensions(
                dimensions,
                dimensions.rows,
                Math.max(1, Number(third)),
              )
            ) {
              return false;
            }
          } else if (
            dimension === 'usermaxrow' &&
            !isValidDimension(third, MAX_SOCIALCALC_ROW)
          ) {
            return false;
          } else if (
            dimension === 'usermaxcol' &&
            !isValidDimension(third, MAX_SOCIALCALC_COL)
          ) {
            return false;
          }
          break;
        }
        const target = analyzeTarget(first);
        if (target === null || !chargeTarget(target, counter)) return false;
        // Only cell targets use ParseRange and mutate lastrow/lastcol in this
        // branch. Whole-row height/hide and whole-column width/hide do not.
        if (/^[a-z]{1,2}[0-9]/i.test(first.replaceAll('$', '')) &&
            !expandForTarget(dimensions, target)) {
          return false;
        }
        break;
      }
      case 'copy': {
        const target = analyzeTarget(first);
        if (target === null || !chargeTarget(target, counter)) return false;
        clipboard = target;
        break;
      }
      case 'loadclipboard':
        clipboard = parseClipboardRange(line);
        if (clipboard === null) return false;
        break;
      case 'paste': {
        const destination = analyzeTarget(first);
        // A server clipboard is isolate-global and non-durable. Requiring the
        // same batch to establish it prevents cross-room/stale clipboard use.
        if (destination === null || clipboard === null) return false;
        if (!chargeTarget(clipboard, counter)) return false;
        if (destination.startRow > 0 && clipboard.endRow > 0) {
          const rows = Math.abs(clipboard.endRow - clipboard.startRow) + 1;
          const columns =
            Math.abs(clipboard.endColumn - clipboard.startColumn) + 1;
          if (
            !setDimensions(
              dimensions,
              Math.max(dimensions.rows, destination.startRow + rows - 1),
              Math.max(
                dimensions.columns,
                destination.startColumn + columns - 1,
              ),
            )
          ) {
            return false;
          }
        }
        break;
      }
      case 'insertrow':
      case 'insertcol': {
        if (!boundedStructuralSheet(dimensions)) return false;
        const target = analyzeTarget(first);
        if (
          target === null ||
          !chargeTarget(target, counter) ||
          !expandForTarget(dimensions, target)
        ) {
          return false;
        }
        const insertingRows = verb.toLowerCase() === 'insertrow';
        const targetRows = Math.abs(target.endRow - target.startRow) + 1;
        const targetColumns =
          Math.abs(target.endColumn - target.startColumn) + 1;
        if (
          !setDimensions(
            dimensions,
            dimensions.rows + (insertingRows ? targetRows : 0),
            dimensions.columns + (insertingRows ? 0 : targetColumns),
          )
        ) {
          return false;
        }
        break;
      }
      case 'deletecol':
      case 'deleterow': {
        if (!boundedStructuralSheet(dimensions)) return false;
        const target = analyzeTarget(first);
        if (
          target === null ||
          !chargeTarget(target, counter) ||
          !expandForTarget(dimensions, target)
        ) {
          return false;
        }
        break;
      }
      case 'movepaste':
      case 'moveinsert': {
        if (verb.toLowerCase() === 'moveinsert' && !boundedStructuralSheet(dimensions)) {
          return false;
        }
        const source = analyzeTarget(first);
        const destination = analyzeTarget(second);
        if (
          source === null ||
          destination === null ||
          !chargeTarget(source, counter) ||
          !expandForTarget(dimensions, source)
        ) {
          return false;
        }
        if (destination.startRow > 0 && source.endRow > 0) {
          const rows = Math.abs(source.endRow - source.startRow) + 1;
          const columns = Math.abs(source.endColumn - source.startColumn) + 1;
          if (
            !setDimensions(
              dimensions,
              Math.max(dimensions.rows, destination.startRow + rows - 1),
              Math.max(
                dimensions.columns,
                destination.startColumn + columns - 1,
              ),
            )
          ) {
            return false;
          }
        }
        if (
          verb.toLowerCase() === 'moveinsert' &&
          source.endRow > 0 &&
          !setDimensions(
            dimensions,
            dimensions.rows + Math.abs(source.endRow - source.startRow) + 1,
            dimensions.columns +
              Math.abs(source.endColumn - source.startColumn) +
              1,
          )
        ) {
          return false;
        }
        break;
      }
      case 'merge':
      case 'unmerge':
      case 'erase':
      case 'cut':
      case 'fillright':
      case 'filldown':
      case 'sort': {
        const target = analyzeTarget(first);
        if (
          target === null ||
          !chargeTarget(target, counter) ||
          !expandForTarget(dimensions, target)
        ) {
          return false;
        }
        break;
      }
      case 'pane': {
        const kind = first.toLowerCase();
        if (
          kind === 'row' &&
          !isValidDimension(second, MAX_SOCIALCALC_ROW)
        ) {
          return false;
        }
        if (
          kind === 'col' &&
          !isValidDimension(second, MAX_SOCIALCALC_COL)
        ) {
          return false;
        }
        break;
      }
      default:
        break;
    }
  }

  return true;
}

/** Validate the canonical declared dimensions in a SocialCalc save. */
export function isSnapshotWithinSheetLimits(snapshot: string): boolean {
  for (const sheetLine of snapshot.matchAll(
    /(?:^|[\r\n])sheet:([^\r\n]*)/g,
  )) {
    const dimensions = /^c:(\d+):r:(\d+)(?::|$)/.exec(sheetLine[1]!);
    if (dimensions === null) return false;
    const columns = Number(dimensions[1]);
    const rows = Number(dimensions[2]);
    if (
      !Number.isSafeInteger(columns) ||
      columns < 1 ||
      columns > MAX_SOCIALCALC_COL ||
      !Number.isSafeInteger(rows) ||
      rows < 1 ||
      rows > MAX_SOCIALCALC_ROW ||
      rows * columns > MAX_SHEET_CELLS
    ) {
      return false;
    }
  }
  // Empty/log-only rooms legitimately have no sheet line.
  return true;
}
