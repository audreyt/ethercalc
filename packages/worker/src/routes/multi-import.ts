/**
 * Multi-sheet workbook IMPORT routes — the inverse of the multi-sheet
 * exports in `routes/exports.ts`. `PUT /=:room.{xlsx,ods,fods}` and
 * `PUT /_/=:room/{xlsx,ods,fods}` parse the uploaded workbook into a TOC
 * sheet + one sub-room per worksheet and fan the saves out to the per-room
 * DOs (sub-rooms first, TOC last, so the TOC never points at a missing
 * sub-room). Returns `201 OK`, matching legacy and the single-sheet
 * `PUT /_/:room`. Like all HTTP endpoints these are unauthenticated by
 * design (§6.4).
 *
 * Routing note: the `=`-prefixed multi-sheet form is captured exactly the
 * way the multi-sheet *exports* are (Hono 4 does not match a literal `=`
 * ahead of a `:param` in a path segment). The `.<fmt>` alias rides the
 * regex param `/:room{.+\.<fmt>}` and the `/_/` form rides `/_/:room/<fmt>`;
 * both peel the leading `=` (and, for the alias, the `.<fmt>` suffix) at
 * runtime — identical to `registerExports`.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import type { Env } from '../env.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { buildMultiSheetImport } from '../lib/multi-sheet-import.ts';

const TEXT_CT = 'text/plain; charset=utf-8';
const IMPORT_FORMATS = ['xlsx', 'ods', 'fods'] as const;

function ok(): Response {
  return new Response('OK', {
    status: 201,
    headers: { 'Content-Type': TEXT_CT, 'Content-Length': '2' },
  });
}

function failed(): Response {
  return new Response('import failed', {
    status: 500,
    headers: { 'Content-Type': TEXT_CT },
  });
}

async function importWorkbook(
  env: Env,
  base: string,
  bytes: Uint8Array,
): Promise<Response> {
  const { tocSave, subSheets } = buildMultiSheetImport(bytes, base);
  // Sub-rooms first so the TOC never references a missing sub-room.
  for (const { subroom, save } of subSheets) {
    const res = await doFetch(env, subroom, '/_do/snapshot', {
      method: 'PUT',
      body: save,
    });
    if (res.status >= 300) return failed();
  }
  const toc = await doFetch(env, base, '/_do/snapshot', {
    method: 'PUT',
    body: tocSave,
  });
  if (toc.status >= 300) return failed();
  return ok();
}

export function registerMultiSheetImport(app: Hono<{ Bindings: Env }>): void {
  for (const fmt of IMPORT_FORMATS) {
    // `/_/=:room/<fmt>` — Hono captures `=name` into `:room`; strip the `=`.
    app.put(`/_/:room/${fmt}`, async (c) => {
      const raw = c.req.param('room') ?? '';
      if (!raw.startsWith('=')) {
        return new Response('Not Found', {
          status: 404,
          headers: { 'Content-Type': TEXT_CT },
        });
      }
      const base = raw.slice(1);
      const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
      return importWorkbook(c.env, base, bytes);
    });
    // `/=:room.<fmt>` alias — the regex param greedily captures `=name.<fmt>`;
    // peel the leading `=` and the trailing `.<fmt>` suffix.
    app.put(`/:room{.+\\.${fmt}}`, async (c) => {
      const raw = c.req.param('room') ?? '';
      if (!raw.startsWith('=')) {
        return new Response('Not Found', {
          status: 404,
          headers: { 'Content-Type': TEXT_CT },
        });
      }
      const base = raw.slice(1, raw.length - fmt.length - 1);
      const bytes = new Uint8Array(await c.req.raw.arrayBuffer());
      return importWorkbook(c.env, base, bytes);
    });
  }
}
