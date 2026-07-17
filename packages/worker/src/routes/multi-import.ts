/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`. `PUT /=:room.{xlsx,ods,fods}` and
 * `PUT /_/=:room/{xlsx,ods,fods}` parse the uploaded workbook into a TOC
 * sheet + one sub-room per worksheet and fan the saves out to the per-room
 * DOs (sub-rooms first, TOC last, so the TOC never points at a missing
 * sub-room). Returns `201 OK`, matching legacy and the single-sheet
 * `PUT /_/:room`. Like all HTTP endpoints these are unauthenticated by
 * design (§6.4).
 */
import type { Hono } from 'hono';

import type { Env, EtherCalcHonoEnv } from '../env.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { getSessionPrincipal } from '../lib/session-middleware.ts';
import type { SessionPrincipal } from '../lib/session.ts';
import { buildMultiSheetImport } from '../lib/multi-sheet-import.ts';
import {
  ImportArchiveTooLargeError,
  ImportColumnOutOfRangeError,
  ImportTooLargeError,
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
    if (err instanceof ImportTooLargeError || err instanceof ImportArchiveTooLargeError) {
      return new Response(err.message, {
        status: 413,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
    if (err instanceof ImportColumnOutOfRangeError) {
      return new Response(err.message, {
        status: 400,
        headers: { 'Content-Type': TEXT_CT },
      });
    }
    throw err;
  }

  // Fan out sub-sheets first, TOC last, failing on the FIRST non-2xx:
  // a denial (401/403) propagates verbatim; anything else keeps the
  // legacy opaque 500. Nothing further is dispatched after a failure.
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
}
