import type { HackFoldr } from './Foldr.ts';

/**
 * Must match the Worker `bodyLimit` / `MAX_IMPORT_ARCHIVE_UNCOMPRESSED_BYTES`
 * ceiling (25 MiB). Checked on the client before any `file.text()` / body read
 * so an oversized text upload never enters JS heap on the multi-sheet page.
 */
export const MAX_MULTI_IMPORT_UPLOAD_BYTES = 25 * 1024 * 1024;

const APPEND_FORMATS = [
  'xlsx',
  'ods',
  'fods',
  'csv',
  'tsv',
  'txt',
  'socialcalc',
] as const;

export interface ImportWorkbookOptions {
  readonly foldr: HackFoldr;
  readonly index: string;
  readonly basePath: string;
  readonly file: File;
  readonly fetchImpl: typeof fetch;
  readonly alertImpl: (message: string) => void;
}

export function extensionOf(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0 || dot === lower.length - 1) return null;
  return lower.slice(dot + 1);
}

export function isSupportedImportFormat(ext: string | null): ext is (typeof APPEND_FORMATS)[number] {
  return ext !== null && (APPEND_FORMATS as readonly string[]).includes(ext);
}

/**
 * Append an uploaded workbook/text file to the current multi-sheet room.
 *
 * Every supported format posts through the single guarded server append door
 * (`POST /_/=:room/<fmt>`). The client never PUTs a sub-room directly — that
 * path used to mint a public child under a private parent.
 */
export async function appendImportedWorkbook({
  foldr,
  index,
  basePath,
  file,
  fetchImpl,
  alertImpl,
}: ImportWorkbookOptions): Promise<boolean> {
  const ext = extensionOf(file.name);
  if (!isSupportedImportFormat(ext)) {
    alertImpl(`Import failed — unsupported file type: ${file.name}`);
    return false;
  }

  // Reject before reading bytes into memory (critical for csv/tsv/txt/socialcalc).
  if (typeof file.size === 'number' && file.size > MAX_MULTI_IMPORT_UPLOAD_BYTES) {
    alertImpl(
      `Import failed (413): file exceeds ${MAX_MULTI_IMPORT_UPLOAD_BYTES} bytes (limit ${MAX_MULTI_IMPORT_UPLOAD_BYTES}).`,
    );
    return false;
  }

  const base = basePath.replace(/\/+$/, '');
  const stem = file.name.replace(/\.[^/.]+$/, '');
  const params = stem.trim() ? `?title=${encodeURIComponent(stem.trim().slice(0, 256))}` : '';
  const url = `${base}/_/=${index}/${ext}${params}`;

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
    const detail = (message || 'Server rejected sheet.').trim();
    alertImpl(`Import failed (${response.status}): ${detail}`);
    return false;
  }

  await foldr.refreshToc();
  return true;
}
