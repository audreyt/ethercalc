import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import type { HackFoldr } from './Foldr.ts';
import { titleTaken } from './state.ts';

interface XlsxWorkbook {
  readonly SheetNames: readonly string[];
  readonly Sheets: Readonly<Record<string, unknown>>;
}
interface XlsxCell {
  readonly t?: string;
  readonly v?: unknown;
  readonly f?: string;
}

interface XlsxRange {
  readonly s: { readonly r: number; readonly c: number };
  readonly e: { readonly r: number; readonly c: number };
}

export interface XlsxApi {
  read(data: Uint8Array, options: { readonly type: 'array'; readonly cellFormula: true }): XlsxWorkbook;
  readonly utils: {
    decode_range(ref: string): XlsxRange;
    encode_cell(cell: { readonly r: number; readonly c: number }): string;
  };
}

declare global {
  interface Window {
    XLSX?: XlsxApi;
  }
}

export interface ImportWorkbookOptions {
  readonly foldr: HackFoldr;
  readonly index: string;
  readonly basePath: string;
  readonly file: File;
  readonly fetchImpl: typeof fetch;
  readonly alertImpl: (message: string) => void;
  readonly xlsxImpl?: XlsxApi | undefined;
}

export interface ParsedSheet {
  readonly title: string;
  readonly contentType: string;
  readonly body: string;
}

const reservedMaxByFoldr = new WeakMap<HackFoldr, number>();

function loadScript(src: string, documentImpl: Document): Promise<void> {
  // Script load completion is callback-only; the Promise executor bridges
  // those DOM events on targets whose TypeScript lib predates withResolvers.
  return new Promise((resolve, reject) => {
    const script = documentImpl.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`failed to load ${src}`));
    documentImpl.head.append(script);
  });
}

export async function loadXlsx(
  windowImpl: Window = window,
  documentImpl: Document = document,
): Promise<XlsxApi> {
  if (windowImpl.XLSX) return windowImpl.XLSX;
  await loadScript('/static/jszip.js', documentImpl);
  await loadScript('/static/xlsx.core.min.js', documentImpl);
  if (!windowImpl.XLSX) throw new Error('SheetJS did not initialize');
  return windowImpl.XLSX;
}

export function getMaxSubsheetIndex(links: readonly string[], index: string): number {
  const prefix = `/${index}.`;
  let max = 0;
  for (const link of links) {
    if (!link.startsWith(prefix)) continue;
    const suffix = link.slice(prefix.length);
    if (!/^\d+$/.test(suffix)) continue;
    const value = Number(suffix);
    if (value > max) max = value;
  }
  return max;
}


function encodeSocialCalcValue(value: unknown): string {
  return String(value).replace(/\\/g, '\\b').replace(/:/g, '\\c').replace(/\n/g, '\\n');
}

export function sheetToSocialCalc(sheet: unknown, xlsx: XlsxApi): string {
  const header = [
    'socialcalc:version:1.5',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary=SocialCalcSpreadsheetControlSave',
  ].join('\n');
  const separator = [
    '--SocialCalcSpreadsheetControlSave',
    'Content-type: text/plain; charset=UTF-8',
    '',
  ].join('\n');
  const metadata = ['# SocialCalc Spreadsheet Control Save', 'part:sheet'].join('\n');
  const end = '--SocialCalcSpreadsheetControlSave--';
  const worksheet = sheet as Record<string, XlsxCell | string | undefined>;
  const ref = worksheet['!ref'];
  const rows: string[] = [];

  if (typeof ref === 'string') {
    const range = xlsx.utils.decode_range(ref);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let column = range.s.c; column <= range.e.c; column++) {
        const coordinate = xlsx.utils.encode_cell({ r: row, c: column });
        const cell = worksheet[coordinate] as XlsxCell | undefined;
        if (cell?.v == null) continue;
        if (cell.t === 's' || cell.t === 'str') {
          rows.push(`cell:${coordinate}:t:${encodeSocialCalcValue(cell.v)}`);
        } else if (cell.t === 'n' && cell.f) {
          rows.push(
            `cell:${coordinate}:vtf:n:${String(cell.v)}:${encodeSocialCalcValue(cell.f)}`,
          );
        } else if (cell.t === 'n') {
          rows.push(`cell:${coordinate}:v:${String(cell.v)}`);
        }
      }
    }
    rows.push(
      `sheet:c:${range.e.c - range.s.c + 1}:r:${range.e.r - range.s.r + 1}:tvf:1`,
      'valueformat:1:text-wiki',
      `copiedfrom:${ref}`,
    );
  }

  return [header, separator, metadata, separator, rows.join('\n'), end].join('\n');
}

export function rewriteSheetReferences(
  body: string,
  sheetNames: readonly string[],
  index: string,
  firstIndex: number,
): string {
  if (sheetNames.length === 0) return body;
  const escapedNames = sheetNames.map((name) =>
    name.replace(/'/g, "''").replace(/(\W)/g, '\\$1'),
  );
  const targets = new Map(
    sheetNames.map((name, offset) => [name, `${index}.${firstIndex + offset}`]),
  );
  return body.replace(
    new RegExp(`('?)\\b(${escapedNames.join('|')})\\1!`, 'g'),
    (_match, _quote: string, reference: string) =>
      `'${targets.get(reference.replace(/''/g, "'"))}'!`,
  );
}

export async function parseFileToSheets(
  file: File,
  xlsxImpl?: XlsxApi,
): Promise<ParsedSheet[]> {
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.socialcalc')) {
    return [{
      title: fileName,
      contentType: 'text/x-socialcalc; charset=utf-8',
      body: await file.text(),
    }];
  }

  if (nameLower.endsWith('.csv') || nameLower.endsWith('.tsv') || nameLower.endsWith('.txt')) {
    return [{
      title: fileName,
      contentType: 'text/csv; charset=utf-8',
      body: await file.text(),
    }];
  }

  const xlsx = xlsxImpl ?? await loadXlsx();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const workbook = xlsx.read(bytes, { type: 'array', cellFormula: true });
  const sheets: ParsedSheet[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet === undefined) continue;
    sheets.push({
      title: name,
      contentType: 'text/x-socialcalc; charset=utf-8',
      body: sheetToSocialCalc(sheet, xlsx),
    });
  }
  return sheets;
}

export async function appendImportedWorkbook({
  foldr,
  index,
  basePath,
  file,
  fetchImpl,
  alertImpl,
  xlsxImpl,
}: ImportWorkbookOptions): Promise<boolean> {
  let sheets: ParsedSheet[];
  try {
    sheets = await parseFileToSheets(file, xlsxImpl);
  } catch {
    alertImpl('Import failed — could not parse file.');
    return false;
  }

  if (foldr.size() + sheets.length > MAX_MULTI_SHEETS) {
    alertImpl(`Import failed: a workbook may contain at most ${MAX_MULTI_SHEETS} sheets.`);
    return false;
  }

  let currentMaxIndex = Math.max(
    getMaxSubsheetIndex(foldr.links(), index),
    reservedMaxByFoldr.get(foldr) ?? 0,
  );
  const firstImportedIndex = currentMaxIndex + 1;
  const sheetNames = sheets.map((sheet) => sheet.title);
  const base = basePath.replace(/\/+$/, '');

  for (const sheet of sheets) {
    currentMaxIndex++;
    const subroomLink = `/${index}.${currentMaxIndex}`;
    reservedMaxByFoldr.set(foldr, currentMaxIndex);
    const subroomId = `${index}.${currentMaxIndex}`;
    let title = sheet.title.trim();
    if (titleTaken(foldr.titles(), title)) title = `${title}_${currentMaxIndex}`;

    const body = sheet.contentType.startsWith('text/x-socialcalc')
      ? rewriteSheetReferences(sheet.body, sheetNames, index, firstImportedIndex)
      : sheet.body;
    let response: Response;
    try {
      response = await fetchImpl(`${base}/_/${subroomId}`, {
        method: 'PUT',
        headers: { 'content-type': sheet.contentType },
        body,
      });
    } catch {
      alertImpl('Import failed: Network error');
      return false;
    }

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      alertImpl(`Import failed (${response.status}): ${message || 'Server rejected sheet.'}`);
      return false;
    }

    const tocAccepted = await foldr.pushChecked({ link: subroomLink, title, row: 0 });
    if (!tocAccepted) {
      alertImpl('Import failed: sheet saved, but the table of contents update was rejected.');
      return false;
    }
  }

  return true;
}
