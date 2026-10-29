import type { EditorRange, SpreadsheetLike, SocialCalcGlobal } from './types.ts';

type PivotCell = { valuetype?: string; datavalue?: string | number; displaystring?: string; nontextvalueformat?: number };
type PivotSheet = SpreadsheetLike['sheet'] & {
  GetAssuredCell?: (coord: string) => PivotCell;
  valueformats?: Record<number, string>;
  attribs?: { defaultnontextvalueformat?: number };
};
type PivotHost = {
  SocialCalc: SocialCalcGlobal & {
    rcColname?: (col: number) => string;
    FormatNumber?: { formatNumberWithFormat?: (value: number, format: string, currency: string) => string };
    FormatCellForExport?: (sheet: unknown, cell: unknown, coord: string) => string;
  };
  spreadsheet?: SpreadsheetLike | undefined;
  document: Document;
};

/** Handles the parent multi-sheet UI's pivot creation messages. */
export function installPivotTable(host: PivotHost): void {
  if (host.document.documentElement.dataset['pivotListener'] === 'installed') return;
  host.document.documentElement.dataset['pivotListener'] = 'installed';
  restorePivotOptionsWhenReady(host);
  window.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
    const message = event.data as { type?: unknown; source?: SourceTable };
    if (message.type === 'ethercalc:pivot-data' && validSource(message.source)) {
      const settings: PivotSettings = {
        group: 0,
        value: Math.min(1, message.source.headers.length - 1),
        method: 'Sum',
        column: -1,
        sort: 'A-Z',
      };
      populateSheet(host, message.source, settings);
      showPivotOptions(host, message.source, settings);
      return;
    }
    if (message.type !== 'ethercalc:create-pivot-table') return;
    const ss = host.spreadsheet;
    const range = (ss?.editor as unknown as { range?: EditorRange } | undefined)?.range;
    if (!ss || !range?.hasrange) {
      window.alert('Select a range first.');
      return;
    }
    const table = readSource(host, ss, range);
    if (table.rows.length === 0 || table.headers.length === 0) {
      window.alert('The selected range has no data to summarize.');
      return;
    }
    window.parent.postMessage({ type: 'ethercalc:pivot-source', source: table }, window.location.origin);
  });
}

interface SourceTable { headers: string[]; rows: string[][]; rawRows: string[][] }
interface PivotSettings {
  group: number;
  value: number;
  method: string;
  column: number;
  sort: string;
}
interface PivotValue { raw: string; display: string }
const PIVOT_META_COL = 'AA';
const AGGREGATIONS = [
  'Sum', 'Count', 'Distinct count', 'Minimum', 'Maximum', 'Median', 'Product',
  'Standard deviation', 'Variance', 'Percentage of total', 'Running total',
  'Difference from', 'Rank', 'Count of numbers', 'Count of nonblank values',
];

function readSource(host: PivotHost, ss: SpreadsheetLike, range: EditorRange): SourceTable {
  const sheet = ss.sheet as PivotSheet;
  const getCell = sheet.GetAssuredCell;
  const colname = host.SocialCalc.rcColname;
  if (!getCell || !colname) return { headers: [], rows: [], rawRows: [] };
  const headers: string[] = [];
  for (let col = range.left; col <= range.right; col++) {
    const coord = `${colname(col)}${range.top}`;
    const cell = getCell.call(sheet, coord);
    headers.push(displayCell(host, sheet, cell, coord) || `Column ${col - range.left + 1}`);
  }
  const rows: string[][] = [];
  const rawRows: string[][] = [];
  for (let row = range.top + 1; row <= range.bottom; row++) {
    const cells = headers.map((_, offset) => {
      const coord = `${colname(range.left + offset)}${row}`;
      const cell = getCell.call(sheet, coord);
      return { display: displayCell(host, sheet, cell, coord), raw: String(cell.datavalue ?? '') };
    });
    rows.push(cells.map((cell) => cell.display));
    rawRows.push(cells.map((cell) => cell.raw));
  }
  return { headers, rows, rawRows };
}

function displayCell(host: PivotHost, sheet: PivotSheet, cell: PivotCell, coord: string): string {
  const formatCell = host.SocialCalc.FormatCellForExport;
  if (formatCell) {
    try {
      const formatted = formatCell(sheet, cell, coord);
      if (formatted !== '') return String(formatted);
    } catch { /* use the cell's cached display below */ }
  }
  if (cell.displaystring !== undefined && cell.displaystring !== '') return String(cell.displaystring);
  const raw = cell.datavalue;
  if (raw === undefined || raw === null) return '';
  const valueFormat = cell.nontextvalueformat ?? sheet.attribs?.defaultnontextvalueformat;
  if (cell.valuetype === 'n' && valueFormat) {
    const format = sheet.valueformats?.[valueFormat];
    const formatter = host.SocialCalc.FormatNumber?.formatNumberWithFormat;
    if (format && formatter && typeof raw === 'number') {
      try { return String(formatter(raw, format, '')); } catch { /* use raw value below */ }
    }
  }
  return String(raw);
}

function validSource(value: unknown): value is SourceTable {
  if (!value || typeof value !== 'object') return false;
  const source = value as SourceTable;
  return Array.isArray(source.headers) && source.headers.every((item) => typeof item === 'string') &&
    Array.isArray(source.rows) && source.rows.every((row) => Array.isArray(row) && row.every((item) => typeof item === 'string')) &&
    Array.isArray(source.rawRows) && source.rawRows.every((row) => Array.isArray(row) && row.every((item) => typeof item === 'string'));
}

function populateSheet(
  host: PivotHost,
  source: SourceTable,
  settings: PivotSettings,
): void {
  const { group, value, method, column, sort } = settings;
  const ss = host.spreadsheet;
  const command = (cell: string, text: string): string => `set ${cell} text t ${encodeSocialCalcText(text)}`;
  const matrix = new Map<string, Map<string, PivotValue[]>>();
  const columnKeys = new Set<string>();
  source.rows.forEach((row, rowIndex) => {
    const key = row[group] ?? '';
    const columnKey = column < 0 ? '' : row[column] ?? '';
    columnKeys.add(columnKey);
    const byColumn = matrix.get(key) ?? new Map<string, PivotValue[]>();
    const raw = source.rawRows[rowIndex]?.[value] ?? row[value] ?? '';
    const values = byColumn.get(columnKey) ?? [];
    values.push({ raw, display: row[value] ?? '' });
    byColumn.set(columnKey, values);
    matrix.set(key, byColumn);
  });
  const compare = (a: string, b: string): number => sort === 'A-Z' ? a.localeCompare(b) : sort === 'Z-A' ? b.localeCompare(a) : 0;
  const rowKeys = [...matrix.keys()].sort(compare);
  const sortedColumns = [...columnKeys].sort(compare);
  const lines: string[] = ['erase A1:Z1000 all'];
  lines.push(textCommand(`${PIVOT_META_COL}1`, 'ethercalc-pivot-v1'));
  lines.push(textCommand(`${PIVOT_META_COL}2`, JSON.stringify(source.headers)));
  lines.push(textCommand('AB1', JSON.stringify(settings)));
  lines.push(`set AB2 value n ${source.rows.length}`);
  source.rows.forEach((row, i) => {
    lines.push(textCommand(`${PIVOT_META_COL}${i + 3}`, JSON.stringify(row)));
    lines.push(textCommand(`AB${i + 3}`, JSON.stringify(source.rawRows[i] ?? row)));
  });
  lines.push(command('A1', source.headers[group] ?? 'Row'));
  if (column < 0) lines.push(command('B1', `${method} of ${source.headers[value] ?? 'Value'}`));
  else {
    sortedColumns.forEach((name, i) => lines.push(command(`${columnName(i + 2)}1`, name || '(blank)')));
    lines.push(command(`${columnName(sortedColumns.length + 2)}1`, 'Grand Total'));
  }
  const output = buildOutputValues(rowKeys, sortedColumns, matrix, method);
  let rowNum = 2;
  for (const key of rowKeys) {
    lines.push(command(`A${rowNum}`, key || '(blank)'));
    const byColumn = matrix.get(key)!;
    const cells = column < 0 ? [''] : sortedColumns;
    cells.forEach((colKey, i) => {
      const result = output.get(key)?.get(colKey) ?? 0;
      const targetCol = column < 0 ? 2 : i + 2;
      lines.push(`set ${columnName(targetCol)}${rowNum} value n ${result}`);
    });
    if (column >= 0) {
      const rowValues = [...byColumn.values()].flat();
      const total = aggregate(rowValues, method);
      lines.push(`set ${columnName(sortedColumns.length + 2)}${rowNum} value n ${rowTotalValue(rowKeys, matrix, key, method, total)}`);
    }
    rowNum++;
  }
  const totalRow = rowNum;
  lines.push(command(`A${totalRow}`, 'Grand Total'));
  const totalColumns = column < 0 ? [''] : sortedColumns;
  const allValues = rowKeys.flatMap((key) => [...(matrix.get(key)?.values() ?? [])].flat());
  const grandSum = numericValues(allValues).reduce((sum, value) => sum + value, 0);
  totalColumns.forEach((colKey, i) => {
    const values = rowKeys.flatMap((key) => matrix.get(key)?.get(colKey) ?? []);
    const targetCol = column < 0 ? 2 : i + 2;
    const result = method === 'Percentage of total'
      ? (grandSum ? numericValues(values).reduce((sum, value) => sum + value, 0) / grandSum * 100 : 0)
      : grandTotalValue(values, method);
    lines.push(`set ${columnName(targetCol)}${totalRow} value n ${result}`);
  });
  if (column >= 0) {
    lines.push(`set ${columnName(sortedColumns.length + 2)}${totalRow} value n ${grandTotalValue(allValues, method)}`);
  }
  ss?.context.sheetobj.ScheduleSheetCommands(`${lines.join('\n')}\n`, true, false);
}

function textCommand(coord: string, value: string): string {
  return `set ${coord} text t ${encodeSocialCalcText(value)}`;
}

function buildOutputValues(
  rowKeys: string[],
  columns: string[],
  matrix: Map<string, Map<string, PivotValue[]>>,
  method: string,
): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  const allEntries = rowKeys.flatMap((key) => [...(matrix.get(key)?.values() ?? [])].flat());
  const grandSum = numericValues(allEntries).reduce((sum, value) => sum + value, 0);
  for (const column of columns) {
    let running = 0;
    let previous = 0;
    const sums = rowKeys.map((key) => aggregate(matrix.get(key)?.get(column) ?? [], 'Sum'));
    const ranks = descendingRanks(sums);
    rowKeys.forEach((key, index) => {
      const entries = matrix.get(key)?.get(column) ?? [];
      let value: number;
      if (method === 'Running total') {
        running += sums[index] ?? 0;
        value = running;
      } else if (method === 'Difference from') {
        value = index === 0 ? 0 : (sums[index] ?? 0) - previous;
        previous = sums[index] ?? 0;
      } else if (method === 'Rank') value = ranks[index] ?? 0;
      else if (method === 'Percentage of total') value = grandSum ? (sums[index] ?? 0) / grandSum * 100 : 0;
      else value = aggregate(entries, method);
      const row = result.get(key) ?? new Map<string, number>();
      row.set(column, value);
      result.set(key, row);
    });
  }
  return result;
}

function aggregate(entries: PivotValue[], method: string): number {
  const numbers = numericValues(entries);
  const total = numbers.reduce((sum, value) => sum + value, 0);
  switch (method) {
    case 'Count':
    case 'Count of numbers': return numbers.length;
    case 'Count of nonblank values': return entries.filter((entry) => entry.raw.trim() !== '').length;
    case 'Distinct count': return new Set(entries.filter((entry) => entry.raw.trim() !== '').map(distinctKey)).size;
    case 'Minimum': return numbers.length ? Math.min(...numbers) : 0;
    case 'Maximum': return numbers.length ? Math.max(...numbers) : 0;
    case 'Median': {
      const sorted = [...numbers].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length === 0 ? 0 : sorted.length % 2 ? sorted[mid] ?? 0 : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
    case 'Product': return numbers.length ? numbers.reduce((product, value) => product * value, 1) : 0;
    case 'Standard deviation': return Math.sqrt(variance(numbers));
    case 'Variance': return variance(numbers);
    case 'Percentage of total': return 0; // Calculated across the complete pivot in buildOutputValues.
    case 'Running total':
    case 'Difference from':
    case 'Rank':
    case 'Sum':
    default: return total;
  }
}

function numericValues(entries: PivotValue[]): number[] {
  return entries.flatMap(({ raw }) => {
    if (raw.trim() === '') return [];
    const value = Number(raw);
    return Number.isFinite(value) ? [value] : [];
  });
}

function distinctKey(entry: PivotValue): string {
  const numeric = Number(entry.raw);
  return entry.raw.trim() !== '' && Number.isFinite(numeric) ? `number:${numeric}` : `text:${entry.display}`;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

function descendingRanks(values: number[]): number[] {
  return values.map((value) => 1 + values.filter((candidate) => candidate > value).length);
}

function rowTotalValue(
  rows: string[], matrix: Map<string, Map<string, PivotValue[]>>, key: string, method: string, aggregateValue: number,
): number {
  const totals = rows.map((row) => aggregate([...(matrix.get(row)?.values() ?? [])].flat(), 'Sum'));
  const index = rows.indexOf(key);
  if (method === 'Running total') return totals.slice(0, index + 1).reduce((sum, value) => sum + value, 0);
  if (method === 'Difference from') return index === 0 ? 0 : (totals[index] ?? 0) - (totals[index - 1] ?? 0);
  if (method === 'Rank') return 1 + totals.filter((value) => value > (totals[index] ?? 0)).length;
  if (method === 'Percentage of total') {
    const allValues = rows.flatMap((row) => [...(matrix.get(row)?.values() ?? [])].flat());
    const allSum = numericValues(allValues).reduce((sum, value) => sum + value, 0);
    const rowSum = totals[index] ?? 0;
    return allSum ? rowSum / allSum * 100 : 0;
  }
  return aggregateValue;
}

function grandTotalValue(entries: PivotValue[], method: string): number {
  if (method === 'Percentage of total') return numericValues(entries).length ? 100 : 0;
  if (method === 'Difference from' || method === 'Rank') return 0;
  return aggregate(entries, method === 'Running total' ? 'Sum' : method);
}

function columnName(index: number): string {
  let n = index;
  let name = '';
  while (n > 0) {
    const digit = (n - 1) % 26;
    name = String.fromCharCode(65 + digit) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function showPivotOptions(host: PivotHost, source: SourceTable, initial: PivotSettings): void {
  const { document } = host;
  document.getElementById('ec-pivot-sheet')?.remove();
  document.getElementById('ec-pivot-options-trigger')?.remove();
  const panel = document.createElement('section');
  panel.id = 'ec-pivot-sheet';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Pivot Options');
  panel.style.cssText = 'position:fixed;right:16px;top:64px;z-index:2147482001;max-width:360px;max-height:calc(100vh - 80px);overflow:auto;background:white;color:#222;padding:16px;border:1px solid #aaa;box-shadow:0 4px 20px #0004;font:14px system-ui';
  const heading = document.createElement('strong');
  heading.textContent = 'Pivot Options';
  panel.appendChild(heading);
  const controls = document.createElement('div');
  controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;padding:12px 0';
  const rowField = select(document, 'Rows', source.headers);
  const valueField = select(document, 'Values', source.headers);
  const columnField = select(document, 'Columns', ['(None)', ...source.headers]);
  const aggregation = select(document, 'Summarize by', AGGREGATIONS);
  const sorting = select(document, 'Sort', ['A-Z', 'Z-A', 'Source order']);
  rowField.select.selectedIndex = clampIndex(initial.group, source.headers.length);
  valueField.select.selectedIndex = clampIndex(initial.value, source.headers.length);
  columnField.select.selectedIndex = initial.column + 1;
  aggregation.select.value = initial.method;
  sorting.select.value = initial.sort;
  controls.append(rowField.label, columnField.label, valueField.label, aggregation.label, sorting.label);
  panel.appendChild(controls);
  document.body.appendChild(panel);

  const toolbar = ensurePivotToolbar(document);
  const trigger = document.createElement('m3e-button');
  trigger.id = 'ec-pivot-options-trigger';
  trigger.setAttribute('variant', 'text');
  trigger.setAttribute('aria-controls', panel.id);
  trigger.setAttribute('aria-expanded', 'false');
  trigger.textContent = 'Pivot Options';
  trigger.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    trigger.setAttribute('aria-expanded', String(!panel.hidden));
  });
  toolbar.appendChild(trigger);

  const render = (): void => populateSheet(
    { SocialCalc: (window as unknown as { SocialCalc: PivotHost['SocialCalc'] }).SocialCalc,
      spreadsheet: (window as unknown as { spreadsheet?: SpreadsheetLike }).spreadsheet, document },
    source,
    { group: rowField.select.selectedIndex, value: valueField.select.selectedIndex,
      method: aggregation.select.value, column: columnField.select.selectedIndex - 1, sort: sorting.select.value },
  );
  rowField.select.addEventListener('change', render);
  columnField.select.addEventListener('change', render);
  valueField.select.addEventListener('change', render);
  aggregation.select.addEventListener('change', render);
  sorting.select.addEventListener('change', render);
}

function ensurePivotToolbar(document: Document): HTMLElement {
  let toolbar = document.getElementById('ec-room-access');
  if (!toolbar) {
    toolbar = document.createElement('m3e-toolbar');
    toolbar.id = 'ec-room-access';
    toolbar.setAttribute('variant', 'standard');
    toolbar.setAttribute('shape', 'rounded');
    toolbar.setAttribute('elevated', '');
    toolbar.setAttribute('aria-label', 'Sheet actions');
    const tableeditor = document.getElementById('tableeditor');
    if (tableeditor) tableeditor.before(toolbar);
    else document.body.appendChild(toolbar);
  }
  return toolbar;
}

function select(document: Document, title: string, choices: string[]): { label: HTMLLabelElement; select: HTMLSelectElement } {
  const label = document.createElement('label');
  label.textContent = `${title}: `;
  const control = document.createElement('select');
  for (const choice of choices) { const option = document.createElement('option'); option.textContent = choice; control.appendChild(option); }
  label.appendChild(control);
  return { label, select: control };
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length - 1));
}

function restorePivotOptionsWhenReady(host: PivotHost): void {
  let attempts = 0;
  const poll = (): void => {
    if (document.getElementById('ec-pivot-sheet')) return;
    const sheet = host.spreadsheet?.sheet as PivotSheet | undefined;
    const getCell = sheet?.GetAssuredCell;
    if (sheet && getCell && String(getCell.call(sheet, `${PIVOT_META_COL}1`).datavalue ?? '') === 'ethercalc-pivot-v1') {
      try {
        const headers = JSON.parse(String(getCell.call(sheet, `${PIVOT_META_COL}2`).datavalue ?? '')) as unknown;
        const settings = JSON.parse(String(getCell.call(sheet, 'AB1').datavalue ?? '{}')) as PivotSettings;
          const rowCount = Number(getCell.call(sheet, 'AB2').datavalue ?? 0);
        if (Array.isArray(headers) && headers.every((item) => typeof item === 'string')) {
          const rows: string[][] = [];
          const rawRows: string[][] = [];
            for (let row = 3; row < rowCount + 3; row++) {
            const display = String(getCell.call(sheet, `${PIVOT_META_COL}${row}`).datavalue ?? '');
            if (!display) break;
            const raw = String(getCell.call(sheet, `AB${row}`).datavalue ?? '');
            rows.push(JSON.parse(display) as string[]);
            rawRows.push(JSON.parse(raw || display) as string[]);
          }
          if (rows.length) showPivotOptions(host, { headers, rows, rawRows }, settings);
          return;
        }
      } catch { /* Ignore partially loaded or invalid pivot metadata. */ }
    }
    attempts++;
    if (attempts < 100) window.setTimeout(poll, 200);
  };
  window.setTimeout(poll, 200);
}

function encodeSocialCalcText(value: string): string {
  return value.replace(/\\/g, '\\b').replace(/:/g, '\\c').replace(/\r\n?|\n/g, '\\n');
}
