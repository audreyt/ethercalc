/**
 * Body classification for POST /_/:room -- command execution.
 *
 * This is the pure counterpart to the handler glue in src/routes/rooms.ts.
 * The HTTP handler:
 *   1. reads the body bytes
 *   2. calls classifyCommandBody(contentType, bytes) -> ClassifiedCommand
 *   3. applies the text-wiki filter, multi-cascade rename, and
 *      loadclipboard enrichment in the glue layer
 *   4. dispatches to POST /_do/commands on RoomDO
 *   5. returns 202 with a JSON body { command }
 *
 * Legacy reference: src/main.ls:321-343 (request-to-command) and
 * src/main.ls:406-446 (the post handler). The legacy server's
 * content-type dispatch:
 *   application/json   -> read body.command (string)
 *   text/x-socialcalc  -> use body literally
 *   text/plain         -> use body literally
 *   else (xlsx/ods)    -> run J lib to produce a loadclipboard command
 *
 * For xlsx/ods bodies this classifier returns kind 'xlsx-deferred' as a
 * pure signal; the glue layer (`src/routes/rooms.ts`) decodes the bytes
 * into a `loadclipboard <save>` + `paste A1 all` command pair via
 * `xlsxToLoadClipboardCommands` and dispatches it like any other command,
 * replying 202 {command} — matching the legacy J-library behavior. (The
 * kind name predates the import landing; it now means "needs binary
 * decode", not "returns 501".)
 */

/** The command types returned to the caller. */
export type ClassifiedCommand =
  | { readonly kind: 'empty' }
  | {
      readonly kind: 'json-command';
      /** JSON .command -- may be a string or an array of strings. */
      readonly command: string | readonly string[];
    }
  | {
      readonly kind: 'text-command';
      /** Raw body text (treated as-is; subject to loadclipboard enrichment). */
      readonly command: string;
    }
  | { readonly kind: 'csv-deferred' }
  | { readonly kind: 'xlsx-deferred' };

const XLSX_MIMES: readonly string[] = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
];

/**
 * Classify the POST body into one of:
 *   - empty         (missing / blank body -- return 400 at the caller)
 *   - json-command  (JSON with a non-empty .command; forward as-is)
 *   - text-command  (plain text / text/x-socialcalc; subject to
 *                    isLoadClipboard / isMultiCascade checks in the glue)
 *   - csv-deferred  (text/csv body; the glue decodes it via SheetJS into a
 *                    loadclipboard command and feeds it through the
 *                    text-command enrichment path)
 *   - xlsx-deferred (binary workbook; the glue decodes it into a
 *                    loadclipboard+paste command pair and replies 202)
 *
 * The caller is responsible for applying loadclipboard enrichment,
 * multi-cascade rename, and the text-wiki filter before dispatching
 * to the DO.
 */
export function classifyCommandBody(
  contentType: string,
  bytes: Uint8Array,
): ClassifiedCommand {
  const ct = contentType.split(';')[0]!.trim().toLowerCase();
  if (XLSX_MIMES.includes(ct)) return { kind: 'xlsx-deferred' };

  const bodyText = new TextDecoder('utf-8').decode(bytes);

  if (ct === 'application/json') {
    try {
      const parsed = JSON.parse(bodyText) as unknown;
      const candidate =
        parsed && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>).command
          : undefined;
      if (typeof candidate === 'string' && candidate.length > 0) {
        return { kind: 'json-command', command: candidate };
      }
      if (Array.isArray(candidate) && candidate.every((c) => typeof c === 'string')) {
        if (candidate.length === 0) return { kind: 'empty' };
        return { kind: 'json-command', command: candidate as readonly string[] };
      }
    } catch {
      /* fall through to empty */
    }
    return { kind: 'empty' };
  }

  // CSV body: SheetJS auto-detects CSV format via XLSX.read(bytes, {type:'array'}),
  // producing a single-sheet workbook. Defer to the glue layer which converts
  // it to a loadclipboard command and feeds it through the existing
  // text-command enrichment path (paste A2 all for cold rooms, paste A<N+1>
  // all for existing sheets). Legacy routed text/csv through its J-library
  // decoder the same way.
  if (ct === 'text/csv') {
    if (bodyText.length === 0) return { kind: 'empty' };
    return { kind: 'csv-deferred' };
  }

  // text/x-socialcalc, text/plain, or anything else treated literally.
  // Legacy matches request.is('application/json') and request.is('text/x-socialcalc')
  // specifically; unmatched types fall into the J-library xlsx path
  // which we defer. We accept text/plain here to match the legacy
  // fallback for bodies posted without a content-type (browsers default
  // to text/plain for plain strings).
  if (bodyText.length === 0) return { kind: 'empty' };
  return { kind: 'text-command', command: bodyText };
}

/**
 * Join an array of commands with newlines for DO dispatch. Mirrors
 * legacy main.ls:439 (cmdstr = command * '\n'). Exported so the test
 * layer can pin the exact wire shape.
 */
export function joinCommands(command: string | readonly string[]): string {
  return Array.isArray(command) ? command.join('\n') : (command as string);
}
