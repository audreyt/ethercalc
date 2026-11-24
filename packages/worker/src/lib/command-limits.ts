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
/** Bounded headroom for sheets that were already larger before this limit. */
export const MAX_LEGACY_SHEET_CELLS = MAX_SHEET_CELLS * 2;

/** Maximum statically visible range work in one command batch. */
export const MAX_COMMAND_RANGE_WORK = MAX_SHEET_CELLS;

/** Maximum entries whole-sheet verbs may walk in one command batch. */
export const MAX_COMMAND_SHEET_WORK = MAX_SHEET_CELLS * 10;

/**
 * Verbs SocialCalc runs over the whole sheet whatever their target. `copy`
 * and `cut` canonicalize it to serialize a clipboard that carries every named
 * range and row setting, which each `paste` parses again; structural edits
 * shift the declared area and rewrite every formula and named range; `pane`
 * steps over every hidden row.
 */
const WHOLE_SHEET_VERBS: ReadonlySet<string> = new Set([
  'copy',
  'cut',
  'paste',
  'insertrow',
  'insertcol',
  'deleterow',
  'deletecol',
  'movepaste',
  'moveinsert',
  'pane',
]);

export interface SheetDimensions {
  readonly rows: number;
  readonly columns: number;
  /**
   * Entries the sheet already holds: cells, named ranges, saved area. The
   * declared rows and columns alone do not bound them, because
   * `set sheet lastrow 1` shrinks the area without dropping anything.
   */
  readonly entries?: number;
}

interface MutableDimensions {
  rows: number;
  columns: number;
}

interface SheetWork {
  /** High-water mark of the entries one whole-sheet verb walks. */
  size: number;
  /** Whole-sheet work charged so far. */
  value: number;
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

/**
 * Seed the model from the size the sheet reports. A size past the addressable
 * maximum is kept, not reset: `paste` and `movepaste` at ZZ leave `lastcol`
 * beyond 702, SocialCalc's loops run to that value, and judging the sheet as
 * one column wide would multiply the area limit by it.
 */
function initialDimension(value: number | undefined): number {
  return Number.isSafeInteger(value) && value !== undefined && value >= 1
    ? value
    : 1;
}

/**
 * Parse one command target without looking at payload text or formulas.
 * `unrecognized` is the result for a token that is not a coordinate; only a
 * verb whose SocialCalc branch ignores such a token may pass OPAQUE_TARGET.
 */
function analyzeTarget(
  rawTarget: string,
  unrecognized: TargetAnalysis | null = null,
): TargetAnalysis | null {
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

  // SocialCalc does not resolve defined names in command targets. ParseRange
  // and coordToCr read whatever token they are given and skip characters they
  // do not know, so `A1:@ZZ1048576` executes as A1:ZZ1048576. A target that
  // cannot be bounded lexically is therefore never free.
  return unrecognized;
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

function chargeSheet(sheet: SheetWork): boolean {
  if (sheet.size > MAX_COMMAND_SHEET_WORK - sheet.value) return false;
  sheet.value += sheet.size;
  return true;
}

/**
 * Range declared by a `loadclipboard` save, read the way `paste` reads it:
 * decodeFromSave, then ParseSheetSave's last `copiedfrom:<from>:<to>` record
 * handed to ParseRange, which takes a missing range as A1:A1.
 */
function parseClipboardRange(line: string): TargetAnalysis | null {
  const save = line
    .slice(line.indexOf(' ') + 1)
    .replace(/\\c/g, ':')
    .replace(/\\n/g, '\n')
    .replace(/\\b/g, '\\');
  let found = analyzeTarget('A1');
  for (const record of save.split(/\r\n|\n/)) {
    const parts = record.split(':');
    if (parts[0] !== 'copiedfrom') continue;
    found = analyzeTarget(`${parts[1]}:${parts[2]}`);
    if (found === null || found.work > MAX_SHEET_CELLS) return null;
  }
  return found;
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
    rows: initialDimension(initial?.rows),
    columns: initialDimension(initial?.columns),
  };
  const counter = { value: 0 };
  const sheet: SheetWork = {
    size: Math.max(initial?.entries ?? 0, declaredArea(dimensions)),
    value: 0,
  };
  let clipboard: TargetAnalysis | null = null;

  for (const line of command.split('\n')) {
    const parts = line.split(' ', 4);
    // `String.prototype.split` always yields at least one element, so the
    // verb needs no default — the argument positions do.
    const verb = parts[0]!;
    const first = parts[1] ?? '';
    const second = parts[2] ?? '';
    const third = parts[3] ?? '';
    switch (verb) {
      case 'set': {
        // SocialCalc matches `sheet` and its attribute names exactly. Any
        // other spelling is a no-op there, so folding case here would let
        // `set sheet LASTROW 1` shrink this model while the engine keeps its
        // real dimensions.
        if (first === 'sheet') {
          const dimension = second;
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
          } else if (
            // A default value format drops every cell's cached display string.
            (dimension === 'defaulttextvalueformat' ||
              dimension === 'defaultnontextvalueformat') &&
            !chargeSheet(sheet)
          ) {
            return false;
          }
          break;
        }
        // SocialCalc's `set` matches its target against anchored coordinate
        // patterns and ignores any other token, so unrecognized names cost 0.
        // Whole-row height/hide and whole-column width/hide still extend the
        // canonical sheet rectangle and count toward sheet dimensions.
        const target = analyzeTarget(first, OPAQUE_TARGET);
        if (
          target === null ||
          !chargeTarget(target, counter) ||
          !expandForTarget(dimensions, target)
        ) {
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
        // SocialCalc tiles the clipboard over the destination range: on each
        // axis it writes the larger of the two extents, starting from the
        // destination's first corner.
        const rows = Math.max(
          Math.abs(destination.endRow - destination.startRow) + 1,
          Math.abs(clipboard.endRow - clipboard.startRow) + 1,
        );
        const columns = Math.max(
          Math.abs(destination.endColumn - destination.startColumn) + 1,
          Math.abs(clipboard.endColumn - clipboard.startColumn) + 1,
        );
        if (!chargeTarget({ ...destination, work: rows * columns }, counter)) {
          return false;
        }
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
        const insertingRows = verb === 'insertrow';
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
        // SocialCalc shifts by `start - end - 1` without ordering the corners,
        // so a reversed range adds rows/columns (`deleterow A284:A1` inserts
        // 282) that this model never sees.
        if (
          target === null ||
          (verb === 'deleterow'
            ? target.endRow < target.startRow
            : target.endColumn < target.startColumn) ||
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
        // The destination goes to coordToCr alone, which skips the colon and
        // reads a range as one coordinate (`A1:Z9` is AZ19).
        const destination = second.includes(':') ? null : analyzeTarget(second);
        if (
          source === null ||
          destination === null ||
          !chargeTarget(source, counter) ||
          !expandForTarget(dimensions, source)
        ) {
          return false;
        }
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
        if (
          verb === 'moveinsert' &&
          !setDimensions(
            dimensions,
            dimensions.rows + rows,
            dimensions.columns + columns,
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
        // `sort` goes on with up to four `<column> <direction>` pairs and
        // looks up the cell `<column><row>` for every row of the range, so a
        // key that is not a column multiplies its own length by the rows.
        if (verb === 'sort') {
          const keys = line.split(' ', 10);
          for (let index = 2; index < keys.length; index += 2) {
            if (!/^[a-z]{0,2}$/i.test(keys[index]!)) return false;
          }
        }
        // SocialCalc's `cut` saves its range to the clipboard before erasing
        // it, exactly as `copy` does, so a later `paste` expands this range.
        if (verb === 'cut') clipboard = target;
        break;
      }
      case 'name':
        // A definition is one more entry for structural verbs to rewrite.
        sheet.size += 1;
        break;
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
    // Measure the sheet at its high-water mark: a later `set sheet lastrow 1`
    // shrinks the declared area but keeps every cell the batch has stored.
    sheet.size = Math.max(sheet.size, declaredArea(dimensions));
    if (WHOLE_SHEET_VERBS.has(verb) && !chargeSheet(sheet)) return false;
  }

  return true;
}

/**
 * Bound the rectangle SocialCalc is about to serialize. Canonicalization
 * derives it from the sheet's content rather than from the declared
 * dimensions the command preflight tracks, and the save visits every
 * coordinate in it, so this has to hold before the save is created rather
 * than be discovered from its `sheet:c:r` line afterwards.
 */
export function isSaveAreaWithinLimits(
  dimensions: SheetDimensions,
  maxArea = MAX_SHEET_CELLS,
): boolean {
  return dimensions.rows * dimensions.columns <= maxArea;
}

/**
 * Validate both the declared dimensions and the coordinates SocialCalc will
 * use when it next serializes a save. A small `sheet:c/r` claim cannot hide a
 * distant cell or row/column setting: canonicalization expands the sheet to
 * include those records, even if the command being applied is innocuous.
 */
export function isSnapshotWithinSheetLimits(
  snapshot: string,
  maxArea = MAX_SHEET_CELLS,
): boolean {
  let declaredRows = 1;
  let declaredColumns = 1;
  let actualRows = 1;
  let actualColumns = 1;
  // Records are the lines SocialCalc's ParseSheetSave sees: it splits on LF
  // or CRLF only, so a bare CR inside a field stays on the same record line.
  for (const record of snapshot.matchAll(/(?:^|\n)(cell|row|col|sheet):([^\n]*)/g)) {
    const kind = record[1]!;
    const payload = record[2]!.replace(/\r$/, '');
    if (kind === 'sheet') {
      // A bare `sheet:` is the default for an empty sheet. Other sheet
      // records must begin with the canonical c/r pair.
      if (payload.length === 0) continue;
      const dimensions = /^c:(\d+):r:(\d+)(?::|$)/.exec(payload);
      if (dimensions === null) return false;
      // The rest of the line is name:value fields as well, and a later `c`
      // or `r` replaces the leading one, so that pair must be the only one.
      const fields = payload.split(':');
      for (let i = 4; i < fields.length; i += 2) {
        if (fields[i] === 'c' || fields[i] === 'r') return false;
      }
      const columns = Number(dimensions[1]);
      const rows = Number(dimensions[2]);
      if (
        !Number.isSafeInteger(columns) ||
        columns < 1 ||
        columns > MAX_SOCIALCALC_COL ||
        !Number.isSafeInteger(rows) ||
        rows < 1 ||
        rows > MAX_SOCIALCALC_ROW ||
        rows * columns > maxArea
      ) return false;
      declaredColumns = columns;
      declaredRows = rows;
      continue;
    }

    const coordinate = payload.split(':', 1)[0]!;
    if (kind === 'row') {
      if (!/^[1-9][0-9]*$/.test(coordinate)) return false;
      const row = Number(coordinate);
      if (!Number.isSafeInteger(row) || row > MAX_SOCIALCALC_ROW) return false;
      actualRows = Math.max(actualRows, row);
    } else {
      const parsed = kind === 'cell'
        ? /^([A-Za-z]{1,2})([1-9][0-9]*)$/.exec(coordinate)
        : /^([A-Za-z]{1,2})$/.exec(coordinate);
      if (parsed === null) return false;
      const column = columnNumber(parsed[1]!);
      actualColumns = Math.max(actualColumns, column);
      if (kind === 'cell') {
        const row = Number(parsed[2]);
        if (!Number.isSafeInteger(row) || row > MAX_SOCIALCALC_ROW) return false;
        actualRows = Math.max(actualRows, row);
      }
    }
    if (actualRows * actualColumns > maxArea) return false;
  }
  // Empty/log-only rooms legitimately have no sheet line. In that case the
  // parser's implicit 1x1 dimensions still constrain any saved coordinates.
  return actualRows <= declaredRows && actualColumns <= declaredColumns;
}

/**
 * Entries a stored save gives whole-sheet verbs to walk: its declared area,
 * which contains every saved cell and row or column setting, plus its named
 * ranges.
 */
export function storedSnapshotEntries(snapshot: string): number {
  let area = 0;
  let names = 0;
  for (const match of snapshot.matchAll(/(?:^|[\r\n])(?:name:|sheet:c:(\d+):r:(\d+)(?=[:\r\n]|$))/g)) {
    if (match[1] === undefined) names += 1;
    else area = Math.max(area, Number(match[1]) * Number(match[2]));
  }
  return area + names;
}

/** Permit existing oversized rooms to keep editing within their old area. */
export function storedSnapshotAreaLimit(snapshot: string): number {
  let area = MAX_SHEET_CELLS;
  for (const match of snapshot.matchAll(/(?:^|\n)sheet:c:(\d+):r:(\d+)(?=[:\r\n]|$)/g)) {
    area = Math.max(MAX_SHEET_CELLS, Math.min(Number(match[1]) * Number(match[2]), MAX_LEGACY_SHEET_CELLS));
  }
  return area;
}
