/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`.
 *
 *   - `PUT /=:room.{xlsx,ods,fods}` / `PUT /_/=:room/{xlsx,ods,fods}`:
 *     Full room REPLACE operation (`API.md:24`). Parses the uploaded workbook
 *     into a TOC sheet + one sub-room per worksheet starting at `.1` and overwrites
 *     the TOC. Sub-rooms first, TOC last, so the TOC never points at a missing sub-room.
 *
 *   - `POST /=:room.{xlsx,ods,fods,csv,tsv,txt,socialcalc}` /
 *     `POST /_/=:room/{xlsx,ods,fods,csv,tsv,txt,socialcalc}`:
 *     Multi-sheet APPEND operation. Parses the upload, then asks the parent
 *     RoomDO (`POST /_do/import-append-toc`) to atomically allocate unique child
 *     ids and append TOC rows under `blockConcurrencyWhile`. Child snapshots are
 *     PUT only after allocation succeeds. Concurrent appends therefore never
 *     share `base.N` or overwrite each other's TOC rows. Text formats
 *     (csv/tsv/txt/socialcalc) are single-sheet appends through this same door.
 *
 * Returns `201 OK`. Access is gated by parent room write permissions when operating
 * on existing rooms.
 *
 * Private multi-sheet rooms: multi-sheet workbook import (replace and append,
 * every format) is unavailable. Freshly minted sub-rooms have no `meta:access` /
 * `meta:acl`, and absent access is treated as public — so importing under a private
 * parent would publish sheet contents. Both PUT and POST refuse private parents
 * with `409` and create no child rooms. There is intentionally one guarded door
 * for every supported format; the multi-sheet client must not PUT sub-rooms itself.
 */
import type { Hono } from 'hono';

import type { Env, EtherCalcHonoEnv } from '../env.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { getSessionPrincipal } from '../lib/session-middleware.ts';
import type { SessionPrincipal } from '../lib/session.ts';
import {
  APPEND_IMPORT_FORMATS,
  WORKBOOK_IMPORT_FORMATS,
  buildMultiSheetImport,
  prepareAppendImportPlan,
  ImportTooManySheetsError,
  ImportUnsupportedFormatError,
} from '../lib/multi-sheet-import.ts';
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportDimensionsTooLargeError,
  ImportRowOutOfRangeError,
  ImportTooLargeError,
} from '../lib/xlsx-import.ts';

const TEXT_CT = 'text/plain; charset=utf-8';
const PRIVATE_IMPORT_MESSAGE =
  'Multi-sheet import is unavailable for private rooms because new sub-sheets would be public.';
/** Returned when the parent RoomDO lacks `/_do/import-append-toc` (old isolate). */
export const IMPORT_APPEND_DO_SKEW_MESSAGE =
  'Import is briefly unavailable while the server finishes updating. Please retry in a moment.';


/**
 * Mirror a DO 401/403 auth verdict to the client verbatim (status +
 * text/plain body). Returns null for any other status so callers fall
 * through to their normal handling.
 */
async function authVerdict(res: Response): Promise<Response | null> {
  if (res.status !== 401 && res.status !== 403) return null;
  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': TEXT_CT },
  });
}

async function getParentAccessInfo(
  env: Env,
  base: string,
  principal: SessionPrincipal | null,
): Promise<{ isPrivate?: boolean; errorResponse?: Response }> {
  const accessRes = await doFetch(env, base, '/_do/access', {}, principal);
  const denied = await authVerdict(accessRes);
  if (denied) return { errorResponse: denied };
  if (accessRes.status >= 300) {
    return {
      errorResponse: new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      }),
    };
  }
  const text = await accessRes.text().catch(() => '');
  try {
    const json = JSON.parse(text);
    if (
      json &&
      typeof json === 'object' &&
      typeof json.canWrite === 'boolean' &&
      typeof json.isPrivate === 'boolean'
    ) {
      if (!json.canWrite) {
        return {
          errorResponse: new Response('Forbidden', {
            status: 403,
            headers: { 'Content-Type': TEXT_CT },
          }),
        };
      }
      return { isPrivate: json.isPrivate };
    }
  } catch {
    // ignore
  }
  return {
    errorResponse: new Response('import failed', {
      status: 500,
      headers: { 'Content-Type': TEXT_CT },
    }),
  };
}

function mapImportBuildError(err: unknown): Response | null {
  if (
    err instanceof ImportTooLargeError ||
    err instanceof ImportArchiveTooLargeError ||
    err instanceof ImportDimensionsTooLargeError ||
    err instanceof ImportTooManySheetsError
  ) {
    return new Response(err.message, {
      status: 413,
      headers: { 'Content-Type': TEXT_CT },
    });
  }
  if (
    err instanceof ImportColumnOutOfRangeError ||
    err instanceof ImportRowOutOfRangeError ||
    err instanceof ImportUnsupportedFormatError
  ) {
    return new Response(err.message, {
      status: 400,
      headers: { 'Content-Type': TEXT_CT },
    });
  }
  return null;
}

async function importWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
  principal: SessionPrincipal | null,
): Promise<Response> {
  // Refuse private parents before parsing so a replace cannot mint public children.
  const { isPrivate, errorResponse } = await getParentAccessInfo(env, base, principal);
  if (errorResponse) return errorResponse;
  if (isPrivate) {
    return new Response(PRIVATE_IMPORT_MESSAGE, {
      status: 409,
      headers: { 'Content-Type': TEXT_CT },
    });
  }

  let tocSave: string;
  let subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
  try {
    const res = buildMultiSheetImport(bytes, base);
    tocSave = res.tocSave;
    subSheets = res.subSheets;
  } catch (err) {
    const mapped = mapImportBuildError(err);
    if (mapped) return mapped;
    throw err;
  }

  for (const { subroom, save } of subSheets) {
    const res = await doFetch(
      env,
      subroom,
      '/_do/snapshot',
      { method: 'PUT', body: save },
      principal,
    );
    const denied = await authVerdict(res);
    if (denied) return denied;
    if (res.status >= 300) {
      return new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
  }
  const toc = await doFetch(
    env,
    base,
    '/_do/snapshot',
    { method: 'PUT', body: tocSave },
    principal,
  );
  const tocDenied = await authVerdict(toc);
  if (tocDenied) return tocDenied;
  if (toc.status >= 300) {
    return new Response('import failed', {
      status: 500,
      headers: { 'Content-Type': TEXT_CT },
    });
  }
  return new Response('OK', {
    status: 201,
    headers: { 'Content-Type': TEXT_CT, 'Content-Length': '2' },
  });
}

async function appendWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
  principal: SessionPrincipal | null,
  format: string,
  titleHint?: string,
): Promise<Response> {
  const { isPrivate, errorResponse } = await getParentAccessInfo(env, base, principal);
  if (errorResponse) return errorResponse;
  if (isPrivate) {
    return new Response(PRIVATE_IMPORT_MESSAGE, {
      status: 409,
      headers: { 'Content-Type': TEXT_CT },
    });
  }

  let plan;
  try {
    plan = prepareAppendImportPlan(bytes, format, titleHint);
  } catch (err) {
    const mapped = mapImportBuildError(err);
    if (mapped) return mapped;
    throw err;
  }
  if (plan.count === 0) {
    return new Response('OK', {
      status: 201,
      headers: { 'Content-Type': TEXT_CT, 'Content-Length': '2' },
    });
  }

  // Atomically allocate unique child ids + TOC rows on the parent RoomDO.
  // Concurrent appends serialize inside the DO so two imports never share
  // base.N or overwrite each other's paste rows.
  const allocRes = await doFetch(
    env,
    base,
    '/_do/import-append-toc',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ titles: plan.preferredTitles }),
    },
    principal,
  );
  const allocDenied = await authVerdict(allocRes);
  if (allocDenied) return allocDenied;
  if (allocRes.status === 413) {
    return new Response(await allocRes.text(), {
      status: 413,
      headers: { 'Content-Type': TEXT_CT },
    });
  }
  // Old RoomDO isolates answer unknown /_do/* with bare 501. During a Worker/DO
  // version skew window that must not surface as "Not implemented" — map it to a
  // retryable 503 with operator-facing copy the multi client already alerts.
  if (allocRes.status === 501) {
    return new Response(IMPORT_APPEND_DO_SKEW_MESSAGE, {
      status: 503,
      headers: {
        'Content-Type': TEXT_CT,
        'Retry-After': '5',
      },
    });
  }
  if (allocRes.status >= 300) {
    const body = await allocRes.text().catch(() => '');
    return new Response(body || 'import failed', {
      status: allocRes.status >= 400 && allocRes.status < 600 ? allocRes.status : 500,
      headers: { 'Content-Type': TEXT_CT },
    });
  }

  let firstIndex: number;
  let sheets: Array<{ subroom: string; link: string; title: string }>;
  try {
    const json = (await allocRes.json()) as {
      firstIndex?: unknown;
      sheets?: unknown;
    };
    if (
      typeof json.firstIndex !== 'number' ||
      !Array.isArray(json.sheets) ||
      json.sheets.length !== plan.count
    ) {
      return new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
    firstIndex = json.firstIndex;
    sheets = [];
    for (const row of json.sheets) {
      if (
        !row ||
        typeof row !== 'object' ||
        typeof (row as { subroom?: unknown }).subroom !== 'string' ||
        typeof (row as { link?: unknown }).link !== 'string' ||
        typeof (row as { title?: unknown }).title !== 'string'
      ) {
        return new Response('import failed', {
          status: 500,
          headers: { 'Content-Type': TEXT_CT },
        });
      }
      sheets.push({
        subroom: (row as { subroom: string }).subroom,
        link: (row as { link: string }).link,
        title: (row as { title: string }).title,
      });
    }
  } catch {
    return new Response('import failed', {
      status: 500,
      headers: { 'Content-Type': TEXT_CT },
    });
  }

  const saves = plan.materializeSaves(base, firstIndex);
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i]!;
    const save = saves[i] ?? '';
    const res = await doFetch(
      env,
      sheet.subroom,
      '/_do/snapshot',
      { method: 'PUT', body: save },
      principal,
    );
    const subDenied = await authVerdict(res);
    if (subDenied) return subDenied;
    if (res.status >= 300) {
      return new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
  }

  return new Response('OK', {
    status: 201,
    headers: { 'Content-Type': TEXT_CT, 'Content-Length': '2' },
  });
}

function titleHintFromRequest(request: Request): string | undefined {
  const url = new URL(request.url);
  const q = url.searchParams.get('title');
  if (q && q.trim()) return q.trim().slice(0, 256);
  return undefined;
}

export function registerMultiSheetImport(app: Hono<EtherCalcHonoEnv>): void {
  // 1. `/_/=:room/<fmt>` form — explicit segment form (workbook replace only).
  app.put('/_/:room/:fmt', async (c, next) => {
    const room = c.req.param('room') ?? '';
    const fmt = (c.req.param('fmt') ?? '').toLowerCase();
    if (!room.startsWith('=') || !(WORKBOOK_IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 2. `/=:room.<fmt>` form — suffix form (workbook replace only).
  app.put('/:room', async (c, next) => {
    const room = c.req.param('room') ?? '';
    if (!room.startsWith('=')) {
      return next();
    }
    const fmt = WORKBOOK_IMPORT_FORMATS.find((f) => room.toLowerCase().endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 3. `POST /_/:room/:fmt` append form — workbook + text formats.
  app.post('/_/:room/:fmt', async (c, next) => {
    const room = c.req.param('room') ?? '';
    const fmt = (c.req.param('fmt') ?? '').toLowerCase();
    if (!room.startsWith('=') || !(APPEND_IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(
      c.env,
      base,
      bytes,
      await getSessionPrincipal(c),
      fmt,
      titleHintFromRequest(c.req.raw),
    );
  });

  // 4. `POST /=:room.<fmt>` append form — workbook + text formats.
  app.post('/:room', async (c, next) => {
    const room = c.req.param('room') ?? '';
    if (!room.startsWith('=')) {
      return next();
    }
    const fmt = APPEND_IMPORT_FORMATS.find((f) => room.toLowerCase().endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(
      c.env,
      base,
      bytes,
      await getSessionPrincipal(c),
      fmt,
      titleHintFromRequest(c.req.raw),
    );
  });
}
