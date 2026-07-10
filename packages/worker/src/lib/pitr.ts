/**
 * Pure request normalization and runtime capability detection for
 * SQLite-backed Durable Object point-in-time recovery (PITR).
 */

export type PitrRequest =
  | { readonly bookmark: string; readonly dryRun: boolean }
  | { readonly at: number; readonly dryRun: boolean };

export type PitrParseResult =
  | { readonly ok: true; readonly value: PitrRequest }
  | { readonly ok: false; readonly error: string };

/** The PITR methods EtherCalc needs from a SQLite-backed DO storage object. */
export interface PitrStorage {
  getBookmarkForTime(timestamp: number | Date): Promise<string>;
  onNextSessionRestoreBookmark(bookmark: string): Promise<string>;
}

const LOCAL_PITR_UNAVAILABLE =
  "This Durable Object's storage back-end does not implement point-in-time recovery.";

/** Match only workerd's documented local-runtime PITR capability failure. */
export function isPitrUnavailableError(error: unknown): boolean {
  return error instanceof Error && error.message === LOCAL_PITR_UNAVAILABLE;
}

/**
 * Return the platform PITR surface only when both required methods exist.
 * Local workerd/Miniflare exposes these methods but time lookup/restore
 * throws because it does not retain the change log PITR needs.
 */
export function bookmarkStorage(storage: unknown): PitrStorage | null {
  if (storage === null || typeof storage !== 'object') return null;
  const candidate = storage as {
    readonly getBookmarkForTime?: unknown;
    readonly onNextSessionRestoreBookmark?: unknown;
  };
  if (
    typeof candidate.getBookmarkForTime !== 'function' ||
    typeof candidate.onNextSessionRestoreBookmark !== 'function'
  ) {
    return null;
  }
  return storage as PitrStorage;
}

/** Normalize one public or internal restore request. */
export function parsePitrRequest(body: unknown): PitrParseResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'body must be a JSON object' };
  }

  const value = body as Record<string, unknown>;
  const hasBookmark = Object.prototype.hasOwnProperty.call(value, 'bookmark');
  const hasAt = Object.prototype.hasOwnProperty.call(value, 'at');
  if (hasBookmark === hasAt) {
    return { ok: false, error: 'send exactly one of {bookmark} or {at}' };
  }

  const dryRunValue = value.dryRun;
  if (dryRunValue !== undefined && typeof dryRunValue !== 'boolean') {
    return { ok: false, error: 'dryRun must be a boolean' };
  }
  const dryRun = dryRunValue ?? false;

  if (hasBookmark) {
    const bookmark = value.bookmark;
    if (typeof bookmark !== 'string' || bookmark.length === 0) {
      return { ok: false, error: 'bookmark must be a non-empty string' };
    }
    return { ok: true, value: { bookmark, dryRun } };
  }

  const atValue = value.at;
  const at =
    typeof atValue === 'number'
      ? atValue
      : typeof atValue === 'string'
        ? Date.parse(atValue)
        : Number.NaN;
  if (!Number.isFinite(at) || at <= 0) {
    return {
      ok: false,
      error: 'at must be a ms-epoch number or ISO-8601 string',
    };
  }
  return { ok: true, value: { at, dryRun } };
}
