/**
 * Phase 5 room HTTP handlers (body classification + decode logic). The Hono
 * glue in `src/routes/rooms.ts` wraps these with DO dispatch and response
 * shaping; the pure functions here are 100% coverage-gated.
 *
 * Body content types accepted by PUT `/_/:room` and POST `/_` (per §6.1):
 *   - `application/json`                           → JSON `{snapshot: string}`
 *   - `text/x-socialcalc`                          → raw SocialCalc save text
 *   - `text/plain`                                 → treat like `text/x-socialcalc`
 *                                                   (legacy fallback when no
 *                                                   content-type matches — see
 *                                                   src/main.ls:329-330)
 *   - `text/csv`                                   → CSV converted via csvToSave
 *   - `text/x-ethercalc-csv-double-encoded`        → same, after UTF-8→Latin-1→UTF-8
 *   - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
 *   - `application/vnd.oasis.opendocument.spreadsheet`
 *                                                   → deferred to Phase 8
 *                                                   (501 `xlsx import lands
 *                                                   in Phase 8`)
 */
import { csvToSocialCalc, decodeDoubleEncoded } from '../lib/csv.ts';
import { xlsxToSave } from '../lib/xlsx-import.ts';

/** The two types of payload this layer understands. */
export type DecodedBody =
  | { readonly kind: 'save'; readonly snapshot: string }
  // Retained for POST `/_/:room` — bulk xlsx on POST is deferred; PUT
  // handles it directly below via `xlsxToSave`.
  | { readonly kind: 'xlsx-deferred' }
  | { readonly kind: 'empty' };

const XLSX_MIMES: readonly string[] = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];

/**
 * Classify a raw request body into a DecodedBody. `contentType` should be
 * the raw header value (or empty string); `bytes` is the read body. JSON
 * bodies are parsed here and asserted to contain a `snapshot` string — a
 * malformed payload produces `{kind: 'empty'}`, matching the legacy
 * `cb snapshot if snapshot` guard in src/main.ls:348-349.
 */
export function classifyRequestBody(
  contentType: string,
  bytes: Uint8Array,
): DecodedBody {
  const ct = contentType.split(';')[0]!.trim().toLowerCase();
  if (XLSX_MIMES.includes(ct)) {
    if (bytes.byteLength === 0) return { kind: 'empty' };
    try {
      return { kind: 'save', snapshot: xlsxToSave(bytes) };
    } catch {
      return { kind: 'empty' };
    }
  }
  if (ct === 'application/json') {
    try {
      const text = new TextDecoder('utf-8').decode(bytes);
      const parsed = JSON.parse(text) as unknown;
      if (
        parsed &&
        typeof parsed === 'object' &&
        'snapshot' in (parsed as Record<string, unknown>) &&
        typeof (parsed as Record<string, unknown>).snapshot === 'string'
      ) {
        return {
          kind: 'save',
          snapshot: (parsed as { snapshot: string }).snapshot,
        };
      }
    } catch {
      /* fall through to empty */
    }
    return { kind: 'empty' };
  }
  if (ct === 'text/x-ethercalc-csv-double-encoded') {
    const csv = decodeDoubleEncoded(bytes);
    return { kind: 'save', snapshot: csvToSocialCalc(csv) };
  }
  if (ct === 'text/csv') {
    const csv = new TextDecoder('utf-8').decode(bytes);
    return { kind: 'save', snapshot: csvToSocialCalc(csv) };
  }
  // `text/x-socialcalc`, `text/plain`, and anything else — treat as raw
  // SocialCalc save text. The legacy server also falls back to
  // `ConvertOtherFormatToSave(csv, 'csv')` for unknown bodies via `J`'s
  // to_socialcalc path, but for Phase 5 we mirror only the well-known
  // content-types. Future phases can add more fallback paths.
  if (bytes.byteLength === 0) return { kind: 'empty' };
  return {
    kind: 'save',
    snapshot: new TextDecoder('utf-8').decode(bytes),
  };
}
