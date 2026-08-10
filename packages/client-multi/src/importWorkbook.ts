import { MAX_MULTI_SHEETS } from '@ethercalc/shared';
import type { HackFoldr } from './Foldr.ts';
import { titleTaken } from './state.ts';

export interface ImportWorkbookOptions {
  readonly foldr: HackFoldr;
  readonly index: string;
  readonly basePath: string;
  readonly file: File;
  readonly fetchImpl: typeof fetch;
  readonly alertImpl: (message: string) => void;
}

export interface ParsedSheet {
  readonly title: string;
  readonly contentType: string;
  readonly body: string;
}

const reservedMaxByFoldr = new WeakMap<HackFoldr, number>();

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

export function rewriteSheetReferences(
  body: string,
  sheetNames: readonly string[],
  room: string,
  firstIndex: number,
): string {
  if (sheetNames.length === 0) return body;
  const escapedNames = sheetNames.map((name) =>
    name.replace(/'/g, "''").replace(/(\W)/g, '\\$1'),
  );
  const targets = new Map(
    sheetNames.map((name, offset) => [name, `${room}.${firstIndex + offset}`]),
  );
  return body.replace(
    new RegExp(`('?)\\b(${escapedNames.join('|')})\\1!`, 'g'),
    (_match, _quote: string, reference: string) =>
      `'${targets.get(reference.replace(/''/g, "'"))}'!`,
  );
}

export async function parseFileToSheets(file: File): Promise<ParsedSheet[]> {
  const fileName = file.name.replace(/\.[^/.]+$/, '');
  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.socialcalc')) {
    return [
      {
        title: fileName,
        contentType: 'text/x-socialcalc; charset=utf-8',
        body: await file.text(),
      },
    ];
  }

  if (nameLower.endsWith('.csv') || nameLower.endsWith('.tsv') || nameLower.endsWith('.txt')) {
    return [
      {
        title: fileName,
        contentType: 'text/csv; charset=utf-8',
        body: await file.text(),
      },
    ];
  }

  throw new Error(`Unsupported text import format: ${file.name}`);
}

export async function appendImportedWorkbook({
  foldr,
  index,
  basePath,
  file,
  fetchImpl,
  alertImpl,
}: ImportWorkbookOptions): Promise<boolean> {
  const nameLower = file.name.toLowerCase();
  const isBinaryWorkbook =
    nameLower.endsWith('.xlsx') || nameLower.endsWith('.ods') || nameLower.endsWith('.fods');

  const base = basePath.replace(/\/+$/, '');

  if (isBinaryWorkbook) {
    const ext = nameLower.slice(nameLower.lastIndexOf('.') + 1);
    const url = `${base}/_/=${index}/${ext}`;
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'POST',
        body: file,
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

    await foldr.refreshToc();
    return true;
  }

  let sheets: ParsedSheet[];
  try {
    sheets = await parseFileToSheets(file);
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
