/**
 * Port of `multi/foldr.ls` (`HackFoldr`) from LiveScript/superagent to TS/fetch.
 *
 * Semantics preserved:
 *   - Strip trailing slashes from `base` on construction.
 *   - `fetch(id)` GETs `{base}/_/{id}/csv.json`, drops the header row, and
 *     builds `rows = [{link, title, row}]` for each body row where `link` is
 *     non-empty and not `#…`-prefixed. Missing titles become `SheetN` where
 *     `N = idx+2` in the source sheet (row `2` onwards, matching legacy).
 *   - If the room was never-before-seen (response body empty), the first
 *     write of a row writes two CSV lines (`#url/#title` header + row).
 *   - If the room is known but empty, the first push writes two CSV lines
 *     (header, then row).
 *   - `push(row)` appends a row, POSTs CSV, and updates `row.row` from the
 *     server's returned `paste A<N>` command.
 *   - `setAt(idx, {title})` sends `set B{row} text t {title}` via POST.
 *   - `deleteAt(idx)` sends `set A{row}:B{row} empty multi-cascade`.
 *
 * Any behavior below not marked "legacy bug" is a faithful port.
 *
 * Error handling: the legacy code silently ignored POST failures (the
 * superagent callback didn't check status). We preserve that — HTTP errors
 * don't throw, they only prevent the `row.row` update in `push`.
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

export interface FoldrOptions {
  /** Override `fetch` (e.g. test mock). Defaults to the global `fetch`. */
  readonly fetchImpl?: FetchImpl;
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

  constructor(base: string, options: FoldrOptions = {}) {
    this.base = base.replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
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
    const url = `${this.base}/_/${this.id}/csv.json`;
    let body: unknown;
    try {
      const res = await this.fetchImpl(url);
      body = res.ok ? await res.json() : null;
    } catch {
      body = null;
    }

    if (Array.isArray(body) && body.length > 0) {
      // Drop header row (legacy `res.body.shift()`).
      const rowsIn = body.slice(1) as unknown[];
      this.rows = [];
      rowsIn.forEach((raw, idx) => {
        if (!Array.isArray(raw)) return;
        const link = typeof raw[0] === 'string' ? raw[0] : '';
        let title = typeof raw[1] === 'string' ? raw[1] : '';
        if (!link || link.startsWith('#')) return;
        if (!title) title = 'Sheet' + (idx + 1);
        this.rows.push({ link, title, row: idx + 2 });
      });
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

  /** Append a new row (writes to server, then pushes locally). */
  async push(row: FoldrRow): Promise<this> {
    await this.initIfNeeded(row);
    const res = await this.postCsv(row.link, row.title);
    const command = extractCommand(res);
    if (typeof command === 'string') {
      const m = /paste A(\d+) all/.exec(command);
      if (m) {
        row.row = parseInt(m[1] as string, 10);
      }
    }
    this.rows.push(row);
    return this;
  }

  /**
   * Update a row in-place. When `title` is set, dispatches a
   * `set B<row> text t <title>` command to the server. Returns `this`.
   */
  async setAt(idx: number, patch: Partial<FoldrRow>): Promise<this> {
    const existing = this.rows[idx];
    if (!existing) return this;
    if (patch.title !== undefined) {
      await this.sendCmd(`set B${existing.row} text t ${patch.title}`);
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
    await this.initIfNeeded(null);
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

  private async initIfNeeded(row: FoldrRow | null): Promise<void> {
    if (this.wasNonExistent) {
      this.wasNonExistent = false;
      this.wasEmpty = false;
      if (row) {
        row.row = 2;
        await this.postInitCsv(
          '#url',
          '#title',
          `/${this.id}.1`,
          'Sheet1',
          row.link,
          row.title,
        );
      } else {
        await this.postRawCsv('#url', '#title', `/${this.id}.1`, 'Sheet1');
      }
      return;
    }
    if (this.wasEmpty) {
      this.wasEmpty = false;
      if (row) {
        row.row = 2;
        await this.postRawCsv(`/${this.id}.1`, 'Sheet1', row.link, row.title);
      } else {
        await this.postCsv(`/${this.id}.1`, 'Sheet1');
      }
      return;
    }
    // Nothing to do.
  }

  /** Single-row CSV POST (used for incremental `push` on an existing sheet). */
  async postCsv(a = '', b = ''): Promise<FoldrPushResponse | null> {
    const body = `"${escapeCsv(a)}","${escapeCsv(b)}"`;
    return this.postCsvBody(body);
  }

  /** Two-row CSV POST (header + row for sheets that were empty on load). */
  async postRawCsv(a = '', b = '', c = '', d = ''): Promise<FoldrPushResponse | null> {
    const body = `"${escapeCsv(a)}","${escapeCsv(b)}"\n"${escapeCsv(c)}","${escapeCsv(d)}"`;
    return this.postCsvBody(body);
  }

  /** Three-row CSV POST used the first time we touch a never-before-existed sheet. */
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

function escapeCsv(s: string): string {
  return s.replace(/"/g, '""');
}

/**
 * The legacy code read `res.body.command[1]` — body.command is an array
 * shaped `[status, commandString]`. Pull the string out defensively.
 */
function extractCommand(res: FoldrPushResponse | null): string | undefined {
  if (!res) return undefined;
  const cmd = res.command;
  if (Array.isArray(cmd) && typeof cmd[1] === 'string') return cmd[1];
  if (typeof cmd === 'string') return cmd;
  return undefined;
}
