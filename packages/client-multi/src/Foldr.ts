import {
  isSafeMultiSheetLink,
  MAX_MULTI_SHEETS,
  MAX_MULTI_SHEET_TITLE_LENGTH,
} from '@ethercalc/shared';

/**
 * Port of `multi/foldr.ls` (`HackFoldr`) from LiveScript/superagent to TS/fetch.
 *
 * Semantics preserved:
 *   - Strip trailing slashes from `base` on construction.
 *   - `fetch(id)` GETs `{base}/_/{id}/csv.json`, drops the header row, and
 *     builds `rows = [{link, title, row}]` for each body row where `link` is
 *     non-empty and not `#…`-prefixed. Missing titles become `SheetN` where
 *     `N = idx+2` in the source sheet (row `2` onwards, matching legacy).
 *   - If the TOC is empty, seeds the first sheet through the guarded
 *     `POST /_/=:room/sheet` endpoint.
 *   - `push(row)` asks that endpoint to allocate and initialize the child
 *     sheet, then mounts only the authoritative row returned by the server.
 *   - `setAt(idx, {title})` sends `set B{row} text t {title}` via POST.
 *   - `deleteAt(idx)` sends `set A{row}:B{row} empty multi-cascade`.
 *
 * Any behavior below not marked "legacy bug" is a faithful port.
 *
 * Add-sheet failures are intentionally swallowed by `push`, which preserves
 * its `Promise<this>` API. `pushChecked` reports the same failure as `false`.
 */

export interface FoldrRow {
  link: string;
  title: string;
  row: number;
}

export interface FoldrPushResponse {
  // Command server may echo back a `paste A<n>` in the body; legacy reads
  // `res.body.command[1]`. Its body is sometimes an array (`[status,cmd]`).
  command?: unknown;
}

export type FetchImpl = typeof fetch;
export type RequestIdFactory = () => string;

export interface FoldrOptions {
  /** Override `fetch` (e.g. test mock). Defaults to the global `fetch`. */
  readonly fetchImpl?: FetchImpl;
  /** Override guarded Add Sheet request IDs (e.g. deterministic unit tests). */
  readonly requestIdFactory?: RequestIdFactory;
}

/**
 * `HackFoldr` — the name is kept from the legacy source for grep-ability.
 * This class is intentionally framework-free so it can be unit-tested
 * exhaustively without a DOM.
 */
export class HackFoldr {
  readonly base: string;
  id = '';
  rows: FoldrRow[] = [];
  wasNonExistent = false;
  wasEmpty = false;
  private readonly fetchImpl: FetchImpl;
  private readonly requestIdFactory: RequestIdFactory;

  constructor(base: string, options: FoldrOptions = {}) {
    this.base = base.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
    this.requestIdFactory = options.requestIdFactory ?? defaultRequestId;
  }

  size(): number {
    return this.rows.length;
  }

  lastIndex(): number {
    return this.rows.length - 1;
  }

  lastRow(): { link?: string; title?: string; row?: number } {
    return this.rows.length ? (this.rows[this.rows.length - 1] as FoldrRow) : {};
  }

  links(): string[] {
    return this.rows.map((r) => r.link);
  }

  titles(): string[] {
    return this.rows.map((r) => r.title);
  }

  at(idx: number): { link?: string; title?: string; row?: number } {
    return this.rows[idx] ?? {};
  }

  /**
   * Load TOC from the CSV-as-JSON endpoint. Resolves when the Foldr is ready.
   */
  async fetch(id: string): Promise<this> {
    this.id = id;
    const body = await this.loadTocJson();
    if (Array.isArray(body) && body.length > 0) {
      this.rows = parseTocBody(body);
    } else {
      this.wasNonExistent = true;
    }

    if (this.rows.length === 0) {
      this.wasEmpty = true;
      const seed: FoldrRow = { link: `/${this.id}.1`, title: 'Sheet1', row: 2 };
      this.rows = [];
      await this.push(seed);
    }
    return this;
  }

  /**
   * Re-fetch the TOC without seeding or touching init flags. Returns `true`
   * when the in-memory row list changed (add/rename/delete from a peer).
   */
  async refreshToc(): Promise<boolean> {
    if (!this.id) return false;
    const body = await this.loadTocJson();
    if (!Array.isArray(body) || body.length === 0) return false;
    const next = parseTocBody(body);
    if (tocRowsEqual(this.rows, next)) return false;
    this.rows = next;
    return true;
  }

  private async loadTocJson(): Promise<unknown> {
    const url = `${this.base}/_/${this.id}/csv.json`;
    try {
      const res = await this.fetchImpl(url);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  /** Ask the server to create and append a new sheet, preserving the `this` API. */
  async push(row: FoldrRow): Promise<this> {
    await this.pushChecked(row);
    return this;
  }

  /**
   * Append only after the guarded server endpoint has initialized the child
   * sheet and returned its authoritative TOC metadata.
   */
  async pushChecked(row: FoldrRow): Promise<boolean> {
    if (!isSafeMultiSheetLink(row.link)) return false;
    const title = row.title.slice(0, MAX_MULTI_SHEET_TITLE_LENGTH);
    let requestId: string;
    try {
      requestId = this.requestIdFactory();
    } catch {
      return false;
    }
    if (
      typeof requestId !== 'string' ||
      requestId.length === 0 ||
      !REQUEST_ID_RE.test(requestId)
    ) {
      return false;
    }
    const sheet = await this.postSheet(title, requestId);
    if (!sheet) return false;
    Object.assign(row, sheet);
    this.rows.push(row);
    this.wasNonExistent = false;
    this.wasEmpty = false;
    return true;
  }

  private async postSheet(title: string, requestId: string): Promise<FoldrRow | null> {
    try {
      const res = await this.fetchImpl(`${this.base}/_/=${this.id}/sheet`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ title, requestId }),
      });
      if (res.status !== 201) return null;
      return parseCreatedSheet(await res.json());
    } catch {
      return null;
    }
  }

  /**
   * Update a row in-place. When `title` is set, dispatches a
   * `set B<row> text t <title>` command to the server. Returns `this`.
   */
  async setAt(idx: number, patch: Partial<FoldrRow>): Promise<this> {
    const existing = this.rows[idx];
    if (!existing) return this;
    if (patch.link !== undefined && !isSafeMultiSheetLink(patch.link)) return this;
    if (patch.title !== undefined) {
      const title = patch.title.slice(0, MAX_MULTI_SHEET_TITLE_LENGTH);
      await this.sendCmd(`set B${existing.row} text t ${encodeSocialCalcText(title)}`);
      Object.assign(existing, patch, { title });
      return this;
    }
    Object.assign(existing, patch);
    return this;
  }

  /**
   * Remove a row. Sends `set A<row>:B<row> empty multi-cascade` to let the
   * server cascade-clear the TOC entry + its associated sub-sheet blob.
   */
  async deleteAt(idx: number): Promise<this> {
    const existing = this.rows[idx];
    if (!existing) return this;
    await this.sendCmd(`set A${existing.row}:B${existing.row} empty multi-cascade`);
    this.rows.splice(idx, 1);
    return this;
  }

  /** Send a raw SocialCalc command string via text/plain POST. */
  async sendCmd(cmd: string): Promise<void> {
    await this.initIfNeeded();
    try {
      await this.fetchImpl(`${this.base}/_/${this.id}`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: cmd,
      });
    } catch {
      // Legacy swallowed errors silently.
    }
  }

  private async initIfNeeded(): Promise<void> {
    if (this.wasNonExistent) {
      this.wasNonExistent = false;
      this.wasEmpty = false;
      await this.postRawCsv('#url', '#title', `/${this.id}.1`, 'Sheet1');
      return;
    }
    if (this.wasEmpty) {
      this.wasEmpty = false;
      await this.postCsv(`/${this.id}.1`, 'Sheet1');
    }
  }

  /** Low-level single-row CSV POST retained for raw TOC initialization callers. */
  async postCsv(a = '', b = ''): Promise<FoldrPushResponse | null> {
    const body = `"${escapeCsv(a)}","${escapeCsv(b)}"`;
    return this.postCsvBody(body);
  }

  /** Low-level two-row CSV POST retained for raw TOC initialization callers. */
  async postRawCsv(a = '', b = '', c = '', d = ''): Promise<FoldrPushResponse | null> {
    const body = `"${escapeCsv(a)}","${escapeCsv(b)}"\n"${escapeCsv(c)}","${escapeCsv(d)}"`;
    return this.postCsvBody(body);
  }

  /** Low-level three-row CSV POST retained for non-Add-sheet callers. */
  async postInitCsv(
    a = '',
    b = '',
    c = '',
    d = '',
    e = '',
    f = '',
  ): Promise<FoldrPushResponse | null> {
    const body = `"${escapeCsv(a)}","${escapeCsv(b)}"\n"${escapeCsv(c)}","${escapeCsv(d)}"\n"${escapeCsv(e)}","${escapeCsv(f)}"`;
    return this.postCsvBody(body);
  }

  private async postCsvBody(body: string): Promise<FoldrPushResponse | null> {
    try {
      const res = await this.fetchImpl(`${this.base}/_/${this.id}`, {
        method: 'POST',
        headers: {
          'content-type': 'text/csv',
          accept: 'application/json',
        },
        body,
      });
      if (!res.ok) return null;
      const parsed = await res.json().catch(() => null);
      return parsed as FoldrPushResponse | null;
    } catch {
      return null;
    }
  }
}

const REQUEST_ID_RE = /^[A-Za-z0-9_-]+$/;

function defaultRequestId(): string {
  return globalThis.crypto.randomUUID();
}

function parseCreatedSheet(body: unknown): FoldrRow | null {
  if (body === null || typeof body !== 'object' || !('sheet' in body)) return null;
  const sheet = body.sheet;
  if (sheet === null || typeof sheet !== 'object') return null;
  if (!('subroom' in sheet) || typeof sheet.subroom !== 'string' || sheet.subroom.length === 0) {
    return null;
  }
  if (!('link' in sheet) || typeof sheet.link !== 'string' || !isSafeMultiSheetLink(sheet.link)) {
    return null;
  }
  if (
    !('title' in sheet) ||
    typeof sheet.title !== 'string' ||
    sheet.title.length > MAX_MULTI_SHEET_TITLE_LENGTH
  ) {
    return null;
  }
  if (
    !('row' in sheet) ||
    typeof sheet.row !== 'number' ||
    !Number.isInteger(sheet.row) ||
    sheet.row < 2
  ) {
    return null;
  }
  return { link: sheet.link, title: sheet.title, row: sheet.row };
}

/**
 * Parse a `csv.json` body (array-of-arrays) into deduped TOC rows.
 * Exported for unit tests; `fetch` and `refreshToc` both use this.
 */
export function parseTocBody(body: unknown): FoldrRow[] {
  if (!Array.isArray(body) || body.length === 0) return [];
  const rowsIn = body.slice(1, MAX_MULTI_SHEETS + 1) as unknown[];
  const parsed: FoldrRow[] = [];
  rowsIn.forEach((raw, idx) => {
    if (!Array.isArray(raw)) return;
    const link = typeof raw[0] === 'string' ? raw[0] : '';
    let title = typeof raw[1] === 'string' ? raw[1] : '';
    if (!isSafeMultiSheetLink(link)) return;
    if (!title) title = 'Sheet' + (idx + 1);
    title = title.slice(0, MAX_MULTI_SHEET_TITLE_LENGTH);
    parsed.push({ link, title, row: idx + 2 });
  });
  // Legacy seeding can POST the same link more than once (see FINDINGS.md).
  // Duplicate React keys made every tab but one vanish on rename (#635); a
  // stale "Sheet1" row also reappeared as a ghost tab after delete/rename
  // cycles (#727). Keep one entry per link, preferring the last server row.
  const byLink = new Map<string, number>();
  const deduped: FoldrRow[] = [];
  for (const row of parsed) {
    const at = byLink.get(row.link);
    if (at !== undefined) {
      deduped[at] = row;
    } else {
      byLink.set(row.link, deduped.length);
      deduped.push(row);
    }
  }
  return deduped;
}

/** Shallow compare of two TOC row lists (link, title, row index). */
export function tocRowsEqual(a: readonly FoldrRow[], b: readonly FoldrRow[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i]!;
    const right = b[i]!;
    if (left.link !== right.link || left.title !== right.title || left.row !== right.row) {
      return false;
    }
  }
  return true;
}

function escapeCsv(s: string): string {
  return s.replace(/"/g, '""');
}

/** Encode text embedded in a SocialCalc command without permitting a new command line. */
export function encodeSocialCalcText(value: string): string {
  return value
    .replace(/\\/g, '\\b')
    .replace(/:/g, '\\c')
    .replace(/\r\n?|\n/g, '\\n');
}
