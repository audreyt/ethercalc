/**
 * Inverse of `xlsx-build.ts` — convert an xlsx/ods/fods workbook into a
 * SocialCalc spreadsheet save. Formula-preserving: Excel's `SUM(A1:A2)`
 * lands as a live SocialCalc formula rather than the cached value, so
 * editing the result in EtherCalc still recalculates.
 *
 * Pipeline:
 *   bytes → XLSX.read → for each cell emit a SocialCalc command
 *        → dispatch into a fresh SpreadsheetControl → CreateSpreadsheetSave
 *
 * We go through SocialCalc commands rather than hand-building the save
 * string so the resulting save includes every invariant (audit trail,
 * attribs, default cell/value formats) that `CreateSpreadsheetSave`
 * maintains — identical in shape to a save produced by `csvToSave` or
 * browser-driven edits.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from '@e965/xlsx';
import { loadSocialCalc, newSocialCalcNamespace } from '@ethercalc/socialcalc-headless';
import { inflateRawSync } from 'node:zlib';
import { encodeColumn, parseCoord } from './xlsx-build.ts';
import {
  MAX_SHEET_CELLS,
  MAX_SOCIALCALC_COL,
  MAX_SOCIALCALC_ROW,
} from './command-limits.ts';

/**
 * Upper bound on the number of populated cells we will replay from an
 * imported workbook. Each cell drives a synchronous SocialCalc
 * `Parse` + `ExecuteSheetCommand` (plus a final full-sheet recalc), so an
 * unbounded count is a CPU/memory DoS primitive: a small, highly-compressed
 * xlsx/ods can declare millions of cells. 200k comfortably covers any real
 * spreadsheet while capping the replay work. Exported so callers/tests can
 * reference the limit.
 */
export const MAX_IMPORT_CELLS = MAX_SHEET_CELLS;

/** Thrown by `xlsxToSave` when an import exceeds {@link MAX_IMPORT_CELLS}. */
export class ImportTooLargeError extends Error {
  readonly cellCount: number;
  constructor(cellCount: number) {
    super(`xlsx/ods import exceeds ${MAX_IMPORT_CELLS} cells (${cellCount})`);
    this.name = 'ImportTooLargeError';
    this.cellCount = cellCount;
  }
}

/**
 * Thrown when a workbook cell or merge ends beyond SocialCalc's ZZ column.
 * SocialCalc's `coordToCr("AAA1")` returns `{col:0}` and silently drops the
 * cell during `ExecuteSheetCommand` — that is unintentional data loss, so
 * imports reject the whole workbook before replay rather than clipping.
 */
export class ImportColumnOutOfRangeError extends Error {
  readonly coord: string;
  /** 1-based column index that exceeded {@link MAX_SOCIALCALC_COL}. */
  readonly column: number;
  constructor(coord: string, column: number) {
    super(
      `xlsx/ods import column ${coord} exceeds SocialCalc max ZZ (${MAX_SOCIALCALC_COL}); column index ${column}`,
    );
    this.name = 'ImportColumnOutOfRangeError';
    this.coord = coord;
    this.column = column;
  }
}

/** Thrown when a workbook cell or merge exceeds the maintained row ceiling. */
export class ImportRowOutOfRangeError extends Error {
  readonly coord: string;
  readonly row: number;
  constructor(coord: string, row: number) {
    super(
      `xlsx/ods import row ${coord} exceeds EtherCalc max ${MAX_SOCIALCALC_ROW}; row index ${row}`,
    );
    this.name = 'ImportRowOutOfRangeError';
    this.coord = coord;
    this.row = row;
  }
}

/** Thrown when a sparse workbook's declared rectangular extent is too large. */
export class ImportDimensionsTooLargeError extends Error {
  readonly rows: number;
  readonly columns: number;
  constructor(rows: number, columns: number) {
    super(
      `xlsx/ods import dimensions ${columns}x${rows} exceed ${MAX_SHEET_CELLS} cells`,
    );
    this.name = 'ImportDimensionsTooLargeError';
    this.rows = rows;
    this.columns = columns;
  }
}

export const MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES = 25 * 1024 * 1024;
export const MAX_WORKBOOK_READ_BYTES = 100 * 1024 * 1024;

export class ImportArchiveTooLargeError extends Error {
  readonly byteCount: number;
  readonly limit: number;
  constructor(byteCount: number, limit = MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    super(`xlsx/ods import expands to ${byteCount} bytes (limit ${limit})`);
    this.name = 'ImportArchiveTooLargeError';
    this.byteCount = byteCount;
    this.limit = limit;
  }
}

export class ImportArchiveInvalidError extends Error {
  constructor() {
    super('invalid workbook archive');
    this.name = 'ImportArchiveInvalidError';
  }
}

export class ImportOdfUnsupportedFeatureError extends Error {
  constructor() {
    super('ODF conditional style maps are unsupported for import');
    this.name = 'ImportOdfUnsupportedFeatureError';
  }
}

const MAX_ODF_TEXT_SPACES = 1024 * 1024;
const MAX_ODF_FORMAT_WIDTH = 4096;
const ODF_FORMAT_WIDTH_ATTRIBUTES = new Set([
  'decimal-places',
  'min-decimal-places',
  'min-integer-digits',
  'min-exponent-digits',
  'min-numerator-digits',
  'min-denominator-digits',
]);

/**
 * The flat ODF root tag in the one shape SheetJS's tag pattern (`xlmlregex`)
 * matches: whitespace-separated `name="value"` attributes, double-quoted,
 * with no `<` in a value. SheetJS skips a root it does not match, and the
 * first tag behind it then picks the reader.
 */
const FLAT_ODF_ROOT = /^<office:document(?:\s+[^<>=?"'\s]+="[^"<]*")*\s*>/;

/**
 * `XLSX.read` ignores the caller's format. For text it sniffs the first
 * 1,024 characters (`,` or `;` ahead of the first `>` selects delimited
 * text; `<table`, `<div`... without `<?xml` selects HTML) and then takes the
 * first tag it matches anywhere, inside a processing instruction too. Only
 * `<office:document>` there selects the ODF reader. This declaration directly
 * in front of the root tag settles all three.
 */
const FLAT_ODF_DECLARATION = '<?xml version="1.0"?>';

/**
 * Find the flat ODF root after XML declarations and comments of any length.
 * Returns the document from its root tag on, behind
 * {@link FLAT_ODF_DECLARATION}, or `null` when `xml` is not flat ODF. That
 * text is what gets checked and what gets read, so SheetJS never sees the
 * skipped prolog and cannot read the upload as anything but ODF.
 */
function flatOdfDocument(xml: string): string | null {
  // TextDecoder strips a UTF-8 BOM, if present.
  let offset = 0;
  while (offset < xml.length) {
    while (offset < xml.length) {
      const char = xml.charCodeAt(offset);
      if (char !== 0x20 && char !== 0x09 && char !== 0x0a && char !== 0x0d) break;
      offset++;
    }
    if (xml.startsWith('<!--', offset)) {
      const end = xml.indexOf('-->', offset + 4);
      if (end < 0) return null;
      offset = end + 3;
    } else if (xml.startsWith('<?', offset)) {
      const end = xml.indexOf('?>', offset + 2);
      if (end < 0) return null;
      offset = end + 2;
    } else {
      const fromRoot = xml.slice(offset);
      return FLAT_ODF_ROOT.test(fromRoot) ? FLAT_ODF_DECLARATION + fromRoot : null;
    }
  }
  return null;
}

/**
 * Rewrite ODF XML the way SheetJS does before it looks for tags: comments
 * go first, then a leading DOCTYPE up to the first element. Either step can
 * hide a tag from the reader or splice one together.
 */
function normalizeOdfXml(xml: string): string {
  let stripped = '';
  let last = 0;
  for (let start = xml.indexOf('<!--'); start >= 0; start = xml.indexOf('<!--', last)) {
    const end = xml.indexOf('-->', start + 4);
    if (end < 0) throw new ImportArchiveInvalidError();
    stripped += xml.slice(last, start);
    last = end + 3;
  }
  stripped += xml.slice(last);
  // Flat files are stripped twice; the first pass must leave nothing for the second.
  if (stripped.includes('<!--')) throw new ImportArchiveInvalidError();
  // A DOCTYPE in the first 1024 characters is cut out up to the first `<\w`;
  // if that lies ahead of it, the text between the two is read twice instead.
  const doctype = stripped.slice(0, 1024).indexOf('<!DOCTYPE');
  const element = doctype < 0 ? -1 : stripped.search(/<\w/);
  return element < 0 ? stripped : stripped.slice(0, doctype) + stripped.slice(element);
}

/**
 * SheetJS expands ODF row and cell repetition while parsing XML. Check the
 * expanded rectangular extent first, while the representation is still
 * small. This covers flat FODS and an ODS archive's content.xml alike.
 */
function enforceOdfXmlLimits(source: string): void {
  const xml = normalizeOdfXml(source);
  // SheetJS's ODF tokenizer (`xlmlregex`), anchored. The reader expands only
  // what this matches, so the preflight must split tags the same way.
  const tagAt = /<(\/?)([^\s?><!/:"]*:|)([^\s?<>:/"]+)(?:\s+[^<>=?"'\s]+="[^"]*?")*\s*\/?>/y;
  // Match SheetJS's attribute grammar. Its parser removes any namespace
  // prefix, truncates an unprefixed name at `_`, and keeps the last duplicate.
  // Checking every recognized occurrence also handles duplicates safely.
  const attributes = /\s([^"\s?>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^'">\s]+))/g;
  let offset = 0;
  let totalCells = 0;
  let tableRows = 0;
  let tableColumns = 0;
  let rowRepeat = 0;
  let rowColumns = 0;
  let cellRepeat = 1;
  let cellOpen = false;
  let expandedText = 0;
  let cdataEnd = -1;

  const parseCount = (raw: string, allowZero: boolean): number => {
    if (!/^[0-9]+$/.test(raw) || (!allowZero && raw[0] === '0')) {
      throw new ImportArchiveInvalidError();
    }
    const count = Number(raw);
    if (!Number.isSafeInteger(count)) throw new ImportArchiveTooLargeError(count);
    return count;
  };
  const chargeText = (count: number): void => {
    expandedText += count;
    if (expandedText > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
      throw new ImportArchiveTooLargeError(expandedText);
    }
  };
  const finishRow = (): void => {
    if (rowRepeat === 0) return;
    if (cellOpen) throw new ImportArchiveInvalidError();
    tableRows += rowRepeat;
    tableColumns = Math.max(tableColumns, Math.max(1, rowColumns));
    totalCells += rowRepeat * Math.max(1, rowColumns);
    if (tableRows * tableColumns > MAX_SHEET_CELLS || totalCells > MAX_IMPORT_CELLS) {
      throw new ImportDimensionsTooLargeError(tableRows, tableColumns);
    }
    rowRepeat = 0;
    rowColumns = 0;
    cellRepeat = 1;
  };

  while (offset < xml.length) {
    const start = xml.indexOf('<', offset);
    if (start < 0) break;
    // The archive limit covers literal text once; a repeated row or cell
    // copies it per repetition.
    chargeText((start - offset) * (Math.max(1, rowRepeat) * cellRepeat - 1));
    tagAt.lastIndex = start;
    const element = tagAt.exec(xml);
    if (!element) {
      if (xml.startsWith('<![CDATA[', start)) {
        if (cdataEnd < start + 9) cdataEnd = xml.indexOf(']]>', start + 9);
        if (cdataEnd < 0) throw new ImportArchiveInvalidError();
      } else {
        const end = xml.indexOf('>', start);
        const next = xml.indexOf('<', start + 1);
        if (end < 0 || (next >= 0 && next < end)) throw new ImportArchiveInvalidError();
      }
      offset = start + 1;
      continue;
    }
    const tag = element[0];
    offset = start + tag.length;
    // SheetJS removes an underscore suffix from element names before dispatch,
    // and matches them case-sensitively.
    const name = element[3]!.replace(/_.*/, '');
    const closing = element[1] === '/';
    const selfClosing = /\/\s*>$/.test(tag);
    const isRow = name === 'table-row' || name === '行';
    const isCell = name === 'table-cell' || name === 'covered-table-cell' || name === '数据';
    const isSpace = name === 's';
    let styleMapAttribute = false;
    let repeatedRows = 1;
    let repeatedColumns = 1;
    let spaces = 1;
    let cellText = 0;
    for (const match of tag.matchAll(attributes)) {
      const rawName = match[1]!;
      const colon = rawName.indexOf(':');
      const underscore = rawName.indexOf('_');
      const key = (colon >= 0
        ? rawName.slice(colon + 1)
        : underscore > 0 ? rawName.slice(0, underscore) : rawName).toLowerCase();
      const raw = match[2] ?? match[3] ?? match[4]!;
      if (key === 'apply-style-name' || key === 'condition') styleMapAttribute = true;
      if (isRow && !closing && key === 'number-rows-repeated') {
        const count = parseCount(raw, false);
        if (count > MAX_IMPORT_CELLS) throw new ImportTooLargeError(count);
        repeatedRows = Math.max(repeatedRows, count);
      } else if (isCell && !closing && key === 'number-columns-repeated') {
        const count = parseCount(raw, false);
        if (count > MAX_IMPORT_CELLS) throw new ImportTooLargeError(count);
        repeatedColumns = Math.max(repeatedColumns, count);
      } else if (isSpace && !closing && key === 'c') {
        const count = parseCount(raw, true);
        if (count > MAX_ODF_TEXT_SPACES) {
          throw new ImportArchiveTooLargeError(count, MAX_ODF_TEXT_SPACES);
        }
        spaces = Math.max(spaces, count);
      } else if (ODF_FORMAT_WIDTH_ATTRIBUTES.has(key)) {
        const count = parseCount(raw, true);
        if (count > MAX_ODF_FORMAT_WIDTH) {
          throw new ImportArchiveTooLargeError(count, MAX_ODF_FORMAT_WIDTH);
        }
        chargeText(count);
      } else if (isCell && !closing && (key === 'string-value' || key === 'formula')) {
        cellText += raw.length;
      }
    }
    if (name === 'map' && !closing &&
      (element[2]!.toLowerCase().startsWith('style:') || styleMapAttribute)) {
      throw new ImportOdfUnsupportedFeatureError();
    }
    if (isSpace && !closing) {
      chargeText(spaces * Math.max(1, rowRepeat) * cellRepeat);
    }
    if (name === 'table' || name === '工作表') {
      if (!closing) {
        finishRow();
        tableRows = 0;
        tableColumns = 0;
      }
    } else if (isRow) {
      if (closing) finishRow();
      else {
        finishRow();
        rowRepeat = repeatedRows;
        if (selfClosing) finishRow();
      }
    } else if (isCell) {
      if (rowRepeat === 0 || closing !== cellOpen) throw new ImportArchiveInvalidError();
      if (closing) {
        cellOpen = false;
        cellRepeat = 1;
      } else {
        rowColumns += repeatedColumns;
        cellOpen = !selfClosing;
        cellRepeat = selfClosing ? 1 : repeatedColumns;
        if (rowColumns > MAX_SOCIALCALC_COL) {
          throw new ImportDimensionsTooLargeError(Math.max(1, tableRows + rowRepeat), rowColumns);
        }
        chargeText(cellText * (rowRepeat * cellRepeat - 1));
      }
    }
  }
  finishRow();
}

export function assertWorkbookFormat(
  bytes: Uint8Array,
  format: 'xlsx' | 'ods' | 'fods' | 'ods-or-fods',
): void {
  const zip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 && bytes[1] === 0x4b &&
    bytes[2] === 0x03 && bytes[3] === 0x04;
  if (zip && format !== 'fods') return;
  if (format === 'fods' || format === 'ods-or-fods') {
    if (flatOdfDocument(new TextDecoder('utf-8').decode(bytes)) !== null) return;
  }
  throw new ImportArchiveInvalidError();
}

export function enforceImportArchiveLimit(bytes: Uint8Array): void {
  // Every read below is bounds-guarded, so the index is always populated —
  // the assertion keeps the bitwise arithmetic typed under
  // `noUncheckedIndexedAccess` without reaching for `any`.
  const b = (index: number): number => bytes[index] as number;
  const length = bytes.length;
  // Stryker disable all
  if (length < 2 || b(0) !== 0x50 || b(1) !== 0x4b) {
    return;
  }
  if (length < 22) {
    return;
  }
  let eocdOffset = -1;
  const startScan = length - 22;
  const endScan = Math.max(0, length - 22 - 0xffff);
  for (let i = startScan; i >= endScan; i--) {
    if (
      b(i) === 0x50 &&
      b(i + 1) === 0x4b &&
      b(i + 2) === 0x05 &&
      b(i + 3) === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
// Stryker restore all
  if (eocdOffset === -1) {
    return;
  }
  const entryCount = b(eocdOffset + 10) | (b(eocdOffset + 11) << 8);
  const cdSize = (b(eocdOffset + 12) | (b(eocdOffset + 13) << 8) | (b(eocdOffset + 14) << 16) | (b(eocdOffset + 15) << 24)) >>> 0;
  const cdOffset = (b(eocdOffset + 16) | (b(eocdOffset + 17) << 8) | (b(eocdOffset + 18) << 16) | (b(eocdOffset + 19) << 24)) >>> 0;

  if (entryCount === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
    throw new ImportArchiveTooLargeError(Number.MAX_SAFE_INTEGER);
  }

  let offset = cdOffset;
  if (offset + 4 <= length) {
    const sig = (b(offset) | (b(offset + 1) << 8) | (b(offset + 2) << 16) | (b(offset + 3) << 24)) >>> 0;
    if (sig !== 0x02014b50) {
      const expectedEocdOffset = cdOffset + cdSize;
      if (expectedEocdOffset < eocdOffset) {
        const prefixLength = eocdOffset - expectedEocdOffset;
        const testOffset = cdOffset + prefixLength;
        /* istanbul ignore else -- expectedEocdOffset sits ~22B before buffer end, so testOffset + 4 <= length is always true. Defensive guard. */
        if (testOffset + 4 <= length) {
          const testSig = (b(testOffset) | (b(testOffset + 1) << 8) | (b(testOffset + 2) << 16) | (b(testOffset + 3) << 24)) >>> 0;
          if (testSig === 0x02014b50) {
            offset = testOffset;
          }
        }
      }
    }
  }

  let totalUncompressedSize = 0;
  for (let i = 0; i < entryCount; i++) {
    // Stryker disable next-line all : equivalent check on out-of-bounds offset
    if (offset + 46 > length) {
      return;
    }
    const signature = (b(offset) | (b(offset + 1) << 8) | (b(offset + 2) << 16) | (b(offset + 3) << 24)) >>> 0;
    if (signature !== 0x02014b50) {
      return;
    }
    const compressedSize = (b(offset + 20) | (b(offset + 21) << 8) | (b(offset + 22) << 16) | (b(offset + 23) << 24)) >>> 0;
    const uncompressedSize = (b(offset + 24) | (b(offset + 25) << 8) | (b(offset + 26) << 16) | (b(offset + 27) << 24)) >>> 0;
    const fileNameLength = b(offset + 28) | (b(offset + 29) << 8);
    const extraLength = b(offset + 30) | (b(offset + 31) << 8);
    const commentLength = b(offset + 32) | (b(offset + 33) << 8);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new ImportArchiveTooLargeError(Number.MAX_SAFE_INTEGER);
    }

    // Stryker disable next-line all : equivalent check on out-of-bounds offset
    if (offset + 46 + fileNameLength > length) {
      return;
    }

    const nameBytes = bytes.subarray(offset + 46, offset + 46 + fileNameLength);
    const name = new TextDecoder().decode(nameBytes);
    const normName = name.replace(/^\/+/, '').toLowerCase();

    const isRelevant =
      normName === '[content_types].xml' ||
      normName === 'xl/workbook.xml' ||
      normName === 'xl/_rels/workbook.xml.rels' ||
      normName === 'xl/sharedstrings.xml' ||
      normName === 'xl/styles.xml' ||
      normName === 'content.xml' ||
      normName === 'styles.xml' ||
      normName === 'meta.xml' ||
      /^xl\/worksheets\/sheet\d+\.xml$/.test(normName) ||
      /^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/.test(normName);

    if (isRelevant) {
      if (uncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
        throw new ImportArchiveTooLargeError(uncompressedSize);
      }
      totalUncompressedSize += uncompressedSize;
      if (totalUncompressedSize > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
        throw new ImportArchiveTooLargeError(totalUncompressedSize);
      }
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }
}

/**
 * SheetJS's worksheet reader walks every address of each hyperlink range
 * while parsing and creates a cell wherever none exists, so the post-read
 * limits come too late. Charge one range the way that walk runs it: the row
 * loop turns even when the column span is empty, and it never ends once a row
 * index passes 2^53. Corners are zero-based, -1 for a missing part.
 */
function countHyperlinkRangeCells(
  start: { r: number; c: number },
  end: { r: number; c: number },
): number {
  if (start.r > end.r) return 0;
  if (end.r > MAX_SOCIALCALC_ROW - 1) {
    throw new ImportRowOutOfRangeError(`hyperlink:e.r=${end.r}`, end.r + 1);
  }
  if (start.c > end.c) return end.r - start.r + 1;
  if (end.c > MAX_SOCIALCALC_COL - 1) {
    throw new ImportColumnOutOfRangeError(`hyperlink:e.c=${end.c}`, end.c + 1);
  }
  return (end.r - start.r + 1) * (end.c - start.c + 1);
}

/** One corner of a range as SheetJS's `safe_decode_range` accumulates it. */
function decodeHyperlinkCorner(letters: string, digits: string): { r: number; c: number } {
  let column = 0;
  for (let i = 0; i < letters.length; i++) {
    column = 26 * column + letters.charCodeAt(i) - 64;
  }
  return { r: Number(digits) - 1, c: column - 1 };
}

/** SpreadsheetML worksheets: the `ref` of every `<hyperlink>` tag. */
function countXmlHyperlinkCells(xml: string): number {
  let cells = 0;
  for (const [tag] of xml.matchAll(/<(?:\w+:)?hyperlink [^<>]*>/g)) {
    for (const [attribute] of tag.matchAll(/\s[^"\s?>/]+\s*=\s*(?:"[^"]*"|'[^']*'|[^'">\s]+)/g)) {
      const equals = attribute.indexOf('=');
      const rawName = attribute.slice(1, equals).trim();
      const colon = rawName.indexOf(':');
      const underscore = rawName.indexOf('_');
      const key = (colon >= 0
        ? rawName.slice(colon + 1)
        : underscore > 0 ? rawName.slice(0, underscore) : rawName).toLowerCase();
      if (key !== 'ref') continue;
      let at = equals + 1;
      while (attribute[at] === ' ') at++;
      const quoted = attribute[at] === '"' || attribute[at] === "'";
      const ref = quoted ? attribute.slice(at + 1, -1) : attribute.slice(at);
      const corners = /^([A-Z]*)([0-9]*)(?::([A-Z]*)([0-9]*))?/.exec(ref)!;
      const start = decodeHyperlinkCorner(corners[1]!, corners[2]!);
      const end = corners[3] === undefined
        ? start
        : decodeHyperlinkCorner(corners[3], corners[4]!);
      cells += countHyperlinkRangeCells(start, end);
    }
  }
  return cells;
}

/**
 * The text SheetJS may read from an archive entry: UTF-8, or UTF-16 behind a
 * byte-order mark. Its Buffer path looks for the big-endian mark one byte late.
 */
function decodeArchiveEntryTexts(content: Uint8Array): string[] {
  const texts = [new TextDecoder('utf-8').decode(content)];
  if (content[0] === 0xff && content[1] === 0xfe) {
    texts.push(new TextDecoder('utf-16le').decode(content.subarray(2)));
  }
  if (
    (content[0] === 0xfe && content[1] === 0xff) ||
    (content[1] === 0xfe && content[2] === 0xff)
  ) {
    texts.push(new TextDecoder('utf-16be').decode(content.subarray(2)));
  }
  return texts;
}

/**
 * A ZIP member's name as SheetJS compares it when it looks a member up: under
 * its `Root Entry/` container root, case-insensitive, with `\` for `/`.
 */
function sheetJsMemberName(name: string): string {
  const path = name.startsWith('Root Entry/')
    ? name
    : `Root Entry/${name}`.replace('//', '/');
  return path.slice('Root Entry/'.length).toLowerCase().replace(/\\/g, '/');
}

function encodedTextLength(text: string): number {
  // Backslash, colon, and newline each cost two extra characters in a
  // SocialCalc save. Counting them with native replacements keeps the import
  // text-limit fixtures (a megabyte of plain text, repeated) off a
  // per-code-unit walk, which otherwise exceeds the mutation dry-run timeout.
  const extra = (ch: string) => text.length - text.replaceAll(ch, '').length;
  return text.length + 2 * extra('\\') + 2 * extra(':') + 2 * extra('\n');
}

/**
 * Charge OOXML `<f t="shared" si="N">` expansion before SheetJS copies the
 * base formula into every referencing cell.
 */
function enforceOoxmlSharedFormulaLimit(xml: string): void {
  const formulaOpen = /<(?:[A-Za-z_][\w.-]*:)?f(?=[\s>/])([^>]*)>/g;
  const baseLength = new Map<string, number>();
  const refCount = new Map<string, number>();
  let match: RegExpExecArray | null;
  while ((match = formulaOpen.exec(xml)) !== null) {
    const rawAttrs = match[1]!;
    const selfClosing = rawAttrs.endsWith('/');
    const attrs = selfClosing ? rawAttrs.slice(0, -1) : rawAttrs;
    let isShared = false;
    let si = '';
    for (const attr of attrs.matchAll(/\s([^"\s?>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^'">\s]+))/g)) {
      const rawName = attr[1]!;
      const colon = rawName.indexOf(':');
      const key = (colon >= 0 ? rawName.slice(colon + 1) : rawName).toLowerCase();
      const val = attr[2] ?? attr[3] ?? attr[4]!;
      if (key === 't' && val === 'shared') isShared = true;
      else if (key === 'si') si = val;
    }
    if (!isShared || !si) continue;
    refCount.set(si, (refCount.get(si) ?? 0) + 1);
    if (!selfClosing) {
      const bodyStart = match.index + match[0].length;
      const closeAt = xml.indexOf('</', bodyStart);
      if (closeAt > bodyStart) {
        const len = encodedTextLength(xml.slice(bodyStart, closeAt));
        baseLength.set(si, Math.max(baseLength.get(si) ?? 0, len));
      }
    }
  }
  let expanded = 0;
  for (const [si, count] of refCount) {
    expanded += (baseLength.get(si) ?? 0) * count;
    if (expanded > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
      throw new ImportArchiveTooLargeError(expanded);
    }
  }
}

/**
 * Check what a workbook really expands to. Returns the bytes to hand to the
 * workbook reader: the input itself, or a copy in which the reader cannot
 * find XLSB parts.
 */
export function enforceActualImportArchiveLimit(bytes: Uint8Array): Uint8Array {
  if (bytes.length > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new ImportArchiveTooLargeError(bytes.length);
  }
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    if (
      bytes[0] === 0xff && bytes[1] === 0xfe &&
      /^[\n\r ]*</.test(new TextDecoder('utf-16le').decode(bytes.subarray(2)))
    ) {
      throw new ImportArchiveInvalidError();
    }
    const odf = flatOdfDocument(new TextDecoder('utf-8').decode(bytes));
    if (odf !== null) {
      enforceOdfXmlLimits(odf);
    }
    return bytes;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const validSpan = (start: number, size: number): boolean =>
    Number.isSafeInteger(start) && start >= 0 && size >= 0 && start + size <= bytes.length;
  const u16 = (at: number): number => view.getUint16(at, true);
  const u32 = (at: number): number => view.getUint32(at, true);
  const invalid = (): never => { throw new ImportArchiveInvalidError(); };
  let end = -1;
  // Start where SheetJS does, at the last four bytes, so both read the same record.
  for (let at = bytes.length - 4; at >= Math.max(0, bytes.length - 22 - 0xffff); at--) {
    if (u32(at) === 0x06054b50) { end = at; break; }
  }
  if (end < 0 || !validSpan(end, 22) || end + 22 + u16(end + 20) !== bytes.length) invalid();
  const count = u16(end + 10);
  const cdSize = u32(end + 12);
  const cdStart = u32(end + 16);
  const cdEnd = cdStart + cdSize;
  if (
    u16(end + 4) !== 0 || u16(end + 6) !== 0 ||
    u16(end + 8) !== count || count > 4096 || count === 0xffff ||
    cdSize === 0xffffffff || cdStart === 0xffffffff ||
    !validSpan(cdStart, cdSize) || cdEnd > end
  ) invalid();

  let offset = cdStart;
  let total = 0;
  let storedTotal = 0;
  let hyperlinkCells = 0;
  let readable = bytes;
  let localEnd = 0;
  let inOrder = true;
  let renamed = false;
  const members = new Set<string>();
  for (let index = 0; index < count; index++) {
    if (!validSpan(offset, 46) || offset + 46 > cdEnd || u32(offset) !== 0x02014b50) invalid();
    const flags = u16(offset + 8);
    const method = u16(offset + 10);
    const compressedSize = u32(offset + 20);
    const declaredSize = u32(offset + 24);
    const nameLength = u16(offset + 28);
    const extraLength = u16(offset + 30);
    const commentLength = u16(offset + 32);
    const localOffset = u32(offset + 42);
    const entryEnd = offset + 46 + nameLength + extraLength + commentLength;
    if (
      compressedSize === 0xffffffff || declaredSize === 0xffffffff ||
      localOffset === 0xffffffff || entryEnd > cdEnd ||
      !validSpan(offset, entryEnd - offset) ||
      !validSpan(localOffset, 30) || u32(localOffset) !== 0x04034b50
    ) invalid();

    const localFlags = u16(localOffset + 6);
    const localMethod = u16(localOffset + 8);
    const localCompressedSize = u32(localOffset + 18);
    const localDeclaredSize = u32(localOffset + 22);
    const localNameLength = u16(localOffset + 26);
    const localExtraLength = u16(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    if (
      flags !== localFlags || method !== localMethod ||
      localNameLength !== nameLength ||
      !validSpan(localOffset + 30, localNameLength + localExtraLength) ||
      !validSpan(dataStart, compressedSize) || dataStart + compressedSize > cdStart ||
      (localCompressedSize !== 0 && localCompressedSize !== compressedSize) ||
      (localDeclaredSize !== 0 && localDeclaredSize !== declaredSize) ||
      ((flags & 8) === 0 && (localCompressedSize !== compressedSize || localDeclaredSize !== declaredSize))
    ) invalid();
    storedTotal += dataStart - localOffset + compressedSize;
    if (storedTotal > cdStart) invalid();
    let member = '';
    for (let i = 0; i < nameLength; i++) {
      if (bytes[offset + 46 + i] !== bytes[localOffset + 30 + i]) invalid();
      member += String.fromCharCode(bytes[offset + 46 + i]!);
    }
    members.add(sheetJsMemberName(member));
    if (localOffset < localEnd) inOrder = false;
    localEnd = dataStart + compressedSize;
    for (const [start, length] of [
      [offset + 46 + nameLength, extraLength],
      [localOffset + 30 + localNameLength, localExtraLength],
    ] as const) {
      let at = start;
      while (at < start + length) {
        if (at + 4 > start + length) invalid();
        const fieldLength = u16(at + 2);
        if (u16(at) === 1 || at + 4 + fieldLength > start + length) invalid();
        at += 4 + fieldLength;
      }
    }

    let content: Uint8Array = bytes.subarray(dataStart, dataStart);
    if (method === 0) {
      content = bytes.subarray(dataStart, dataStart + compressedSize);
    } else if (method === 8) {
      try {
        content = inflateRawSync(
          bytes.subarray(dataStart, dataStart + compressedSize),
          { maxOutputLength: MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES - total + 1 },
        );
      } catch {
        throw new ImportArchiveTooLargeError(MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES + 1);
      }
    } else {
      invalid();
    }
    const actualSize = content.length;
    total += actualSize;
    if (total > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
      throw new ImportArchiveTooLargeError(total);
    }
    if (actualSize !== declaredSize) invalid();
    const name = new TextDecoder('utf-8').decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const texts = decodeArchiveEntryTexts(content);
    for (const xml of texts) hyperlinkCells += countXmlHyperlinkCells(xml);
    if (hyperlinkCells > MAX_IMPORT_CELLS) throw new ImportTooLargeError(hyperlinkCells);
    if (/(?:^|[\\/])xl[\\/]workbook\.bin$/i.test(name)) invalid();
    if (name.toLowerCase().endsWith('.bin')) {
      if (readable === bytes) readable = new Uint8Array(bytes);
      readable[offset + 46 + nameLength - 1] = 0x5f;
      readable[localOffset + 30 + nameLength - 1] = 0x5f;
      renamed = true;
    }
    if (name.toLowerCase().endsWith('.xml')) {
      const canonical = sheetJsMemberName(name);
      const fatal = !canonical.startsWith('customxml/') || canonical.endsWith('/content.xml');
      let xml: string;
      try {
        xml = new TextDecoder('utf-8', { fatal }).decode(content);
      } catch {
        throw new ImportArchiveInvalidError();
      }
      if (xml.includes('shared')) enforceOoxmlSharedFormulaLimit(xml);
      enforceOdfXmlLimits(xml);
    }
    offset = entryEnd;
  }
  if (offset !== cdEnd) invalid();
  if (
    !members.has('meta-inf/manifest.xml') &&
    (!members.has('[content_types].xml') ||
      members.has('objectdata.xml') ||
      members.has('index/document.iwa'))
  ) invalid();
  if (renamed && !inOrder) return enforceActualImportArchiveLimit(readable);
  return readable;
}

/**
 * The bytes to hand `XLSX.read` for a workbook that passed
 * {@link enforceActualImportArchiveLimit}. A ZIP archive is read as it is.
 * Flat ODF is read in the form that check scanned (see
 * {@link flatOdfDocument}), so SheetJS cannot take the same bytes for Excel
 * 2003 XML, HTML or delimited text, whose readers no ODF limit covers.
 */
export function workbookReadBytes(bytes: Uint8Array): Uint8Array {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return bytes;
  const odf = flatOdfDocument(new TextDecoder('utf-8').decode(bytes));
  return odf === null ? bytes : new TextEncoder().encode(odf);
}

/**
 * Parse a pre-checked workbook while capping how many bytes SheetJS may read
 * across repeated archive member references (e.g. 256 `<sheet>` aliases,
 * repeated `externalLink` or case-variant `comments`).
 */
export function readBoundedWorkbook(
  bytes: Uint8Array,
  readFn: typeof XLSX.read = XLSX.read,
  opts: Record<string, unknown> = { type: 'array', cellFormula: true },
): XLSX.WorkBook {
  const target = workbookReadBytes(bytes);
  if ((readFn as unknown) === XLSX.read) {
    const readOpts = { ...opts, cellText: false };
    if (target.length >= 2 && target[0] === 0x50 && target[1] === 0x4b) {
      const cfb = (XLSX as any).CFB.read(target, { type: 'array' });
      let reads = 0;
      let exceeded = false;
      for (const entry of cfb.FileIndex) {
        if (!entry.content || entry.type !== 2) continue;
        const raw = entry.content;
        const size = raw.length;
        Object.defineProperty(entry, 'content', {
          configurable: true,
          get() {
            reads += size;
            if (reads > MAX_WORKBOOK_READ_BYTES) {
              exceeded = true;
              throw new ImportArchiveTooLargeError(reads, MAX_WORKBOOK_READ_BYTES);
            }
            return raw;
          },
        });
      }
      const wb = (XLSX as any).parse_zip(cfb, readOpts) as XLSX.WorkBook;
      if (exceeded) throw new ImportArchiveTooLargeError(reads, MAX_WORKBOOK_READ_BYTES);
      return wb;
    }
    return readFn(target, readOpts as any);
  }
  return readFn(target, opts as any);
}

/**
 * Count the populated cells on a SheetJS worksheet (keys that aren't
 * `!`-prefixed metadata like `!ref` / `!merges`). This is the number of
 * synchronous SocialCalc commands the import replay will dispatch.
 */
export function countWorksheetCells(ws: Record<string, unknown>): number {
  return Object.keys(ws).filter((a) => !a.startsWith('!')).length;
}

/**
 * Sum the areas of a SheetJS worksheet's `!merges`: the number of cells the
 * replayed SocialCalc `merge` commands will visit. Ranges are not
 * deduplicated (repeated or overlapping merges each pay their full area), so
 * this is the merge work and not the merged extent. Call only after
 * {@link enforceSocialCalcColumnLimit} has validated the merge endpoints.
 */
export function countWorksheetMergedCells(ws: Record<string, unknown>): number {
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];
  let total = 0;
  for (const { s, e } of merges) {
    total += (Math.abs(e.r - s.r) + 1) * (Math.abs(e.c - s.c) + 1);
  }
  return total;
}

/**
 * Count the characters of cell text the import replay will inline into
 * SocialCalc commands (including `:` / `\` / `\n` save escaping overhead).
 */
export function countWorksheetText(ws: Record<string, unknown>): number {
  const length = (text: unknown): number =>
    typeof text === 'string' ? encodedTextLength(text) : 0;
  let chars = 0;
  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const cell = ws[addr] as SheetJSCell;
    chars += Math.max(length(cell.f), length(cell.v), length(cell.w));
  }
  return chars;
}

export function enforceImportTextLimit(textLength: number): void {
  if (textLength > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new ImportArchiveTooLargeError(textLength);
  }
}

export function enforceImportLimit(cellCount: number): void {
  if (cellCount > MAX_IMPORT_CELLS) {
    throw new ImportTooLargeError(cellCount);
  }
}

export function enforceSocialCalcColumnLimit(
  ws: Record<string, unknown>,
): number {
  let maxRow = 1;
  let maxColumn = 1;

  const ref = typeof ws['!ref'] === 'string' ? ws['!ref'] : '';
  if (ref) {
    const parts = ref.split(':');
    const startCoord = parseCoord(parts[0] as string);
    if (startCoord !== null) {
      const endCoord = parts[1] !== undefined ? parseCoord(parts[1]) : startCoord;
      if (endCoord !== null) {
        const refLabel = parts.length > 1 ? (parts[1] as string) : ref;
        if (endCoord.c > MAX_SOCIALCALC_COL - 1) {
          throw new ImportColumnOutOfRangeError(refLabel, endCoord.c + 1);
        }
        if (!Number.isSafeInteger(endCoord.r) || endCoord.r > MAX_SOCIALCALC_ROW - 1) {
          throw new ImportRowOutOfRangeError(refLabel, endCoord.r + 1);
        }
        const refRows = Math.max(1, endCoord.r - startCoord.r + 1);
        const refCols = Math.max(1, endCoord.c - startCoord.c + 1);
        maxRow = Math.max(maxRow, refRows);
        maxColumn = Math.max(maxColumn, refCols);
      }
    }
  }

  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const rc = parseCoord(addr);
    if (rc === null) {
      throw new ImportColumnOutOfRangeError(
        `unparseable:${addr}`,
        Number.NaN,
      );
    }
    if (rc.c > MAX_SOCIALCALC_COL - 1) {
      throw new ImportColumnOutOfRangeError(addr, rc.c + 1);
    }
    if (
      !Number.isSafeInteger(rc.r) ||
      rc.r > MAX_SOCIALCALC_ROW - 1
    ) {
      throw new ImportRowOutOfRangeError(addr, rc.r + 1);
    }
    maxRow = Math.max(maxRow, rc.r + 1);
    maxColumn = Math.max(maxColumn, rc.c + 1);
  }
  const merges: Array<{
    s?: { r?: number; c?: number };
    e?: { r?: number; c?: number };
  }> = Array.isArray(ws['!merges'])
    ? (ws['!merges'] as Array<{
        s?: { r?: number; c?: number };
        e?: { r?: number; c?: number };
      }>)
    : [];
  for (const merge of merges) {
    for (const endpointName of ['s', 'e'] as const) {
      const endpoint = merge[endpointName];
      const column = endpoint?.c;
      const row = endpoint?.r;
      if (
        typeof column !== 'number' ||
        !Number.isSafeInteger(column) ||
        column < 0 ||
        column > MAX_SOCIALCALC_COL - 1
      ) {
        if (Number.isSafeInteger(column) && (column as number) >= 0) {
          const labelRow =
            typeof row === 'number' && Number.isFinite(row) ? row + 1 : 1;
          throw new ImportColumnOutOfRangeError(
            `${encodeColumn(column as number)}${labelRow}`,
            (column as number) + 1,
          );
        }
        throw new ImportColumnOutOfRangeError(
          `merge:${endpointName}.c=${String(column)}`,
          typeof column === 'number' && Number.isFinite(column)
            ? Math.trunc(column)
            : Number.NaN,
        );
      }
      if (
        typeof row !== 'number' ||
        !Number.isSafeInteger(row) ||
        row < 0 ||
        row > MAX_SOCIALCALC_ROW - 1
      ) {
        throw new ImportRowOutOfRangeError(
          `${encodeColumn(column)}${
            typeof row === 'number' && Number.isFinite(row)
              ? row + 1
              : String(row)
          }`,
          typeof row === 'number' ? row + 1 : Number.NaN,
        );
      }
      maxRow = Math.max(maxRow, row + 1);
      maxColumn = Math.max(maxColumn, column + 1);
    }
  }
  if (maxRow * maxColumn > MAX_SHEET_CELLS) {
    throw new ImportDimensionsTooLargeError(maxRow, maxColumn);
  }
  return maxRow * maxColumn;
}

interface SheetJSCell {
  readonly v?: unknown;
  readonly t?: string;
  readonly f?: string;
  readonly w?: string;
}

/**
 * Emit the SocialCalc command string to populate `coord` from a SheetJS cell.
 * Returns `null` when the cell shape has nothing to set (e.g. pure error cells
 * — Excel stores `#N/A` with no usable value to transplant).
 *
 * Rules:
 *   - formula cells (`f` present) → `set <coord> formula <f>` (SocialCalc
 *     stores formulas `=`-less, matching SheetJS's shape).
 *   - numeric (`t:'n'`) → `set <coord> value n <v>`.
 *   - string (`t:'s'`) → `set <coord> text t <v>`.
 *   - boolean (`t:'b'`) → `set <coord> value n <0|1>`.
 *   - date (`t:'d'`) → serialized Date → Excel serial number → value n.
 *   - anything else graceful-degrades to the formatted text (`w`) or the
 *     stringified `v`.
 */
function encodeCellTextForCommand(value: unknown): string {
  const SC = loadSocialCalc() as any;
  return SC.encodeForSave(String(value ?? ''));
}

/**
 * The sheet named before each `!` of a formula, as SocialCalc reads it: the
 * text of a quoted name (`'My Sheet'!A1`), or `null` where anything else
 * stands there — a bare name, which SocialCalc may resolve further, a cell,
 * a closing parenthesis, nothing. SocialCalc's own tokenizer decides, so a
 * `!` inside a string literal or an error value (`#REF!`) does not count.
 */
export function sheetReferences(formula: string): Array<string | null> {
  // Stryker disable next-line ConditionalExpression,StringLiteral : fast path
  // only — without a `!` the tokenizer finds no sheet operator either.
  if (!formula.includes('!')) return [];
  const SC = loadSocialCalc() as any;
  const tokens: Array<{ text: string; type: unknown; opcode: unknown }> =
    SC.Formula.ParseFormulaIntoTokens(formula);
  const names: Array<string | null> = [];
  tokens.forEach((token, index) => {
    if (token.opcode !== '!') return;
    const name = tokens[index - 1];
    names.push(name && name.type === SC.Formula.TokenType.string ? name.text : null);
  });
  return names;
}

/**
 * What a formula that refers to another sheet is imported as: the formula
 * to store, or `null` for the value the file carries for the cell.
 */
export type SheetRefImport = (formula: string) => string | null;

/** A single-sheet import brings along none of the sheets such a formula names. */
const importSheetRefAsValue: SheetRefImport = () => null;

// Stryker disable all
export function cellToCommand(
  coord: string,
  cell: SheetJSCell,
  importSheetRef?: SheetRefImport,
): string | null {
  // Formulas take priority — the cached value is kept by recalc.
  let formula = typeof cell.f === 'string' && cell.f.length > 0 ? cell.f : null;
  if (formula !== null && importSheetRef && sheetReferences(formula).length > 0) {
    formula = importSheetRef(formula);
  }
  if (formula !== null) {
    // SocialCalc's `set A1 formula FOO(…)` stores without leading `=`,
    // which is already the shape SheetJS uses.
    return `set ${coord} formula ${formula}`;
  }
  switch (cell.t) {
    case 'n': {
      const v = Number(cell.v);
      if (!Number.isFinite(v)) return null;
      return `set ${coord} value n ${v}`;
    }
    case 's':
      // Allow empty string — preserves explicitly-blanked cells.
      return `set ${coord} text t ${encodeCellTextForCommand(cell.v ?? '')}`;
    case 'b':
      return `set ${coord} value n ${cell.v ? 1 : 0}`;
    case 'd': {
      // SheetJS v0.x and later returns Date objects for `t:'d'`. Convert
      // to an Excel serial (days since 1900-01-00 with the leap-year bug).
      if (!(cell.v instanceof Date)) return null;
      const ms = cell.v.getTime();
      const serial = ms / 86_400_000 + 25569; // Unix epoch day = 25569
      return `set ${coord} value n ${serial}`;
    }
    case 'e':
      // Error cell — skip; leaving the cell blank on import is safer than
      // hard-coding an error into a fresh sheet.
      return null;
    default:
      // Unknown type — try the formatted text, then raw value.
      if (cell.w !== undefined) return `set ${coord} text t ${encodeCellTextForCommand(cell.w)}`;
      if (cell.v !== undefined) return `set ${coord} text t ${encodeCellTextForCommand(cell.v)}`;
      return null;
  }
}

function replayWorksheetCells(
  SC: any,
  sheet: any,
  ws: Record<string, unknown>,
  importSheetRef?: SheetRefImport,
): void {
  const merges: Array<{
    s: { r: number; c: number };
    e: { r: number; c: number };
  }> = Array.isArray(ws['!merges']) ? ws['!merges'] : [];

  for (const addr of Object.keys(ws)) {
    if (addr.startsWith('!')) continue;
    const cell = ws[addr] as SheetJSCell;
    const cmd = cellToCommand(addr, cell, importSheetRef);
    if (!cmd) continue;
    try {
      const parse = new SC.Parse(cmd);
      // Stryker disable next-line BooleanLiteral
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
      /* istanbul ignore next -- defensive fallback */
      if (typeof cell.f === 'string' && cell.v !== undefined) {
        const fallback =
          typeof cell.v === 'number'
            ? `set ${addr} value n ${cell.v}`
            : `set ${addr} text t ${encodeCellTextForCommand(cell.v)}`;
        try {
          const parse = new SC.Parse(fallback);
          SC.ExecuteSheetCommand(sheet, parse, false);
        } catch {
          // Give up on this cell.
        }
      }
    }
  }

  for (const m of merges) {
    const top = `${colLetters(m.s.c)}${m.s.r + 1}`;
    const bot = `${colLetters(m.e.c)}${m.e.r + 1}`;
    try {
      const parse = new SC.Parse(`merge ${top}:${bot}`);
      // Stryker disable next-line BooleanLiteral
      SC.ExecuteSheetCommand(sheet, parse, false);
    } catch {
    }
  }

  if (sheet.attribs.needsrecalc === 'yes' || sheet.recalconce === true) {
    try {
      SC.RecalcSheet(sheet);
    } catch {
      // RecalcSheet failures leave computed values unset but don't
      // corrupt the save — user sees the imported formulas anyway.
    }
    sheet.attribs.needsrecalc = 'no';
  }
}

function replayWorkbook(
  bytes: Uint8Array,
  importSheetRef?: SheetRefImport,
): { ss: any; sheet: any } {
  const SC = newSocialCalcNamespace() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;

  enforceImportArchiveLimit(bytes);
  const readable = enforceActualImportArchiveLimit(bytes);

  const wb = readBoundedWorkbook(readable, XLSX.read, { type: 'array', cellFormula: true, sheets: 0 });
  const firstName = (wb.SheetNames as string[])[0];
  /* istanbul ignore next -- SheetJS always populates SheetNames[0] */
  if (!firstName) return { ss, sheet };
  const ws = wb.Sheets[firstName];
  /* istanbul ignore next -- SheetJS guarantees Sheets[SheetNames[0]] */
  if (!ws) return { ss, sheet };

  enforceImportLimit(countWorksheetCells(ws));
  enforceSocialCalcColumnLimit(ws);
  enforceImportLimit(countWorksheetMergedCells(ws));
  enforceImportTextLimit(countWorksheetText(ws));

  replayWorksheetCells(SC, sheet, ws, importSheetRef);

  return { ss, sheet };
}

export function xlsxToSave(bytes: Uint8Array): string {
  const { ss } = replayWorkbook(bytes, importSheetRefAsValue);
  return ss.CreateSpreadsheetSave();
}

export function worksheetToSave(
  ws: Record<string, unknown>,
  importSheetRef?: SheetRefImport,
  namespace?: unknown,
): string {
  enforceSocialCalcColumnLimit(ws);
  const SC = (namespace ?? newSocialCalcNamespace()) as any;
  const ss = new SC.SpreadsheetControl();
  replayWorksheetCells(SC, ss.context.sheetobj, ws, importSheetRef);
  return ss.CreateSpreadsheetSave();
}

export function workbookToLoadClipboardCommand(
  bytes: Uint8Array,
  importSheetRef?: SheetRefImport,
): string | null {
  return sheetToLoadClipboardCommand(replayWorkbook(bytes, importSheetRef).sheet);
}

/**
 * Convert CSV text into a single `loadclipboard <encoded-clipboard-save>`
 * command with SocialCalc's own CSV converter.
 */
export function csvToLoadClipboardCommand(csv: string): string | null {
  const SC = loadSocialCalc() as any;
  const clipboardSave: string = SC.ConvertOtherFormatToSave(csv, 'csv');
  if (clipboardSave === '') return null;
  const encoded: string = SC.encodeForSave(clipboardSave);
  const command = `loadclipboard ${encoded}`;
  if (command.length > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new ImportArchiveTooLargeError(command.length);
  }
  return command;
}

function replayTextRows(rows: readonly (readonly string[])[]): { ss: any; sheet: any } {
  const SC = newSocialCalcNamespace() as any;
  const ss = new SC.SpreadsheetControl();
  const sheet = ss.context.sheetobj;
  replayWorksheetCells(SC, sheet, (XLSX as any).utils.aoa_to_sheet(rows));
  return { ss, sheet };
}

/** Rows of literal text as a full SocialCalc spreadsheet save of text cells. */
export function textRowsToSave(rows: readonly (readonly string[])[]): string {
  return replayTextRows(rows).ss.CreateSpreadsheetSave();
}

/**
 * Rows of literal text as a single `loadclipboard <encoded-clipboard-save>`
 * command of text cells. Returns `null` when there is nothing to paste.
 */
export function textRowsToLoadClipboardCommand(
  rows: readonly (readonly string[])[],
): string | null {
  return sheetToLoadClipboardCommand(replayTextRows(rows).sheet);
}

function sheetToLoadClipboardCommand(sheet: any): string | null {
  const SC = loadSocialCalc() as any;

  if (Object.keys(sheet.cells as Record<string, unknown>).length === 0) {
    return null;
  }

  const lastCol = colLetters((sheet.attribs.lastcol as number) - 1);
  const lastRow = sheet.attribs.lastrow as number;
  const range = `A1:${lastCol}${lastRow}`;
  const clipboardSave: string = sheet.CreateSheetSave(range);
  const encoded: string = SC.encodeForSave(clipboardSave);
  const command = `loadclipboard ${encoded}`;
  if (command.length > MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES) {
    throw new ImportArchiveTooLargeError(command.length);
  }
  return command;
}

export function xlsxToLoadClipboardCommands(bytes: Uint8Array): string[] {
  const command = workbookToLoadClipboardCommand(bytes, importSheetRefAsValue);
  return command === null ? [] : [command, 'paste A1 all'];
}

function colLetters(c: number): string {
  let out = '';
  let n = c;
  while (n >= 0) {
    out = String.fromCharCode(65 + (n % 26)) + out;
    n = Math.floor(n / 26) - 1;
  }
  return out;
}
// Stryker restore all
