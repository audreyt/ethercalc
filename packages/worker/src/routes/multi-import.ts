/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`.
 *
 *   - `PUT /=:room.{xlsx,ods,fods}` / `PUT /_/=:room/{xlsx,ods,fods}`:
 *     Full room REPLACE operation (`API.md:24`). Parses the uploaded workbook
 *     into a TOC sheet + one sub-room per worksheet starting at `.1` and overwrites
 *     the TOC. Sub-rooms first, TOC last, so the TOC never points at a missing sub-room.
 *
 *   - `POST /=:room.{xlsx,ods,fods}` / `POST /_/=:room/{xlsx,ods,fods}`:
 *     Multi-sheet APPEND operation. Reads the room's current TOC (fails closed
 *     unless status is 200 or 404), allocates sub-room indices strictly after the
 *     current maximum, rewrites cross-sheet formula references, PUTs each sub-room
 *     snapshot, and appends TOC rows via `POST /_do/commands`.
 *
 * Returns `201 OK`. Access is gated by parent room write permissions when operating on existing rooms.
 */
import type { Hono } from 'hono';

import type { Env, EtherCalcHonoEnv } from '../env.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { getSessionPrincipal } from '../lib/session-middleware.ts';
import type { SessionPrincipal } from '../lib/session.ts';
import {
  buildMultiSheetImport,
  buildMultiSheetAppendImport,
  ImportTooManySheetsError,
  type MultiSheetAppendSheet,
} from '../lib/multi-sheet-import.ts';
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportDimensionsTooLargeError,
  ImportRowOutOfRangeError,
  ImportTooLargeError,
  workbookToLoadClipboardCommand,
} from '../lib/xlsx-import.ts';

const TEXT_CT = 'text/plain; charset=utf-8';
const IMPORT_FORMATS = ['xlsx', 'ods', 'fods'] as const;

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

async function importWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
  principal: SessionPrincipal | null,
): Promise<Response> {
  let tocSave: string;
  let subSheets: ReadonlyArray<{ readonly subroom: string; readonly save: string }>;
  try {
    const res = buildMultiSheetImport(bytes, base);
    tocSave = res.tocSave;
    subSheets = res.subSheets;
  } catch (err) {
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
      err instanceof ImportRowOutOfRangeError
    ) {
      return new Response(err.message, {
        status: 400,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
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
): Promise<Response> {
  const { isPrivate, errorResponse } = await getParentAccessInfo(env, base, principal);
  if (errorResponse) return errorResponse;

  if (isPrivate) {
    return new Response('Private room append is not supported', {
      status: 403,
      headers: { 'Content-Type': TEXT_CT },
    });
  }
  const tocRes = await doFetch(env, base, '/_do/csv.json', {}, principal);
  const denied = await authVerdict(tocRes);
  if (denied) return denied;

  const existingLinks: string[] = [];
  const existingTitles: string[] = [];

  if (tocRes.status === 200) {
    const text = await tocRes.text().catch(() => '');
    try {
      const rows = JSON.parse(text);
      if (!Array.isArray(rows)) {
        return new Response('import failed', {
          status: 500,
          headers: { 'Content-Type': TEXT_CT },
        });
      }
      if (rows.length > 1) {
        for (const r of rows.slice(1)) {
          if (Array.isArray(r) && typeof r[0] === 'string') {
            existingLinks.push(r[0]);
            existingTitles.push(typeof r[1] === 'string' ? r[1] : '');
          }
        }
      }
    } catch {
      return new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
  } else if (tocRes.status !== 404) {
    return new Response('import failed', {
      status: 500,
      headers: { 'Content-Type': TEXT_CT },
    });
  }

  let subSheets: ReadonlyArray<MultiSheetAppendSheet>;
  try {
    const res = buildMultiSheetAppendImport(bytes, base, existingLinks, existingTitles);
    subSheets = res.subSheets;
  } catch (err) {
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
      err instanceof ImportRowOutOfRangeError
    ) {
      return new Response(err.message, {
        status: 400,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
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
    const subDenied = await authVerdict(res);
    if (subDenied) return subDenied;
    if (res.status >= 300) {
      return new Response('import failed', {
        status: 500,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
  }

  let offset = 0;
  for (const { link, title } of subSheets) {
    const csvBody = `"${link.replace(/"/g, '""')}","${title.replace(/"/g, '""')}"`;
    const loadcmd = workbookToLoadClipboardCommand(new TextEncoder().encode(csvBody));
    if (!loadcmd) continue;
    const pasteRow = existingLinks.length + offset + 2;
    offset++;
    const commandText = `${loadcmd}\npaste A${pasteRow} all`;
    const appendTocRes = await doFetch(
      env,
      base,
      '/_do/commands',
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', Accept: 'application/json' },
        body: commandText,
      },
      principal,
    );
    const appendDenied = await authVerdict(appendTocRes);
    if (appendDenied) return appendDenied;
    if (appendTocRes.status >= 300) {
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

export function registerMultiSheetImport(app: Hono<EtherCalcHonoEnv>): void {
  // 1. `/_/=:room/<fmt>` form — explicit segment form.
  app.put('/_/:room/:fmt', async (c, next) => {
    const room = c.req.param('room') ?? '';
    const fmt = c.req.param('fmt') ?? '';
    if (!room.startsWith('=') || !(IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 2. `/=:room.<fmt>` form — suffix form.
  app.put('/:room', async (c, next) => {
    const room = c.req.param('room') ?? '';
    if (!room.startsWith('=')) {
      return next();
    }
    const fmt = IMPORT_FORMATS.find((f) => room.endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return importWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 3. `POST /_/:room/:fmt` append form.
  app.post('/_/:room/:fmt', async (c, next) => {
    const room = c.req.param('room') ?? '';
    const fmt = c.req.param('fmt') ?? '';
    if (!room.startsWith('=') || !(IMPORT_FORMATS as readonly string[]).includes(fmt)) {
      return next();
    }
    const base = room.slice(1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });

  // 4. `POST /=:room.<fmt>` append form.
  app.post('/:room', async (c, next) => {
    const room = c.req.param('room') ?? '';
    if (!room.startsWith('=')) {
      return next();
    }
    const fmt = IMPORT_FORMATS.find((f) => room.endsWith(`.${f}`));
    if (!fmt) {
      return next();
    }
    const base = room.slice(1, room.length - fmt.length - 1);
    const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
    return appendWorkbook(c.env, base, bytes, await getSessionPrincipal(c));
  });
}
