/**
 * Export HTTP routes (Phase 8 — CLAUDE.md §6.1 and §8).
 *
 * Covers the read-only export surface from the inventory:
 *
 *   GET /_/:room/html, /:room.html
 *   GET /_/:room/csv,  /:room.csv           + Content-Disposition
 *   GET /_/:room/csv.json, /:room.csv.json
 *   GET /_/:room/xlsx, /:room.xlsx          + Content-Disposition (binary)
 *   GET /_/:room/ods,  /:room.ods           + Content-Disposition (binary)
 *   GET /_/:room/fods, /:room.fods          + Content-Disposition (binary)
 *   GET /_/:room/md,   /:room.md
 *
 * Each route dispatches to the target DO's `/_do/<format>` endpoint and
 * streams the body back. Text bodies go through `Response.text()` (fine —
 * each DO response fits in memory by construction); binary bodies are read
 * as `ArrayBuffer` so we can re-emit them verbatim with the correct headers.
 *
 * ─── Multi-sheet export (`GET /_/=:room/xlsx` etc.) ─────────────────────
 *
 * Legacy behavior (src/main.ls:363-392): iterates the TOC sheet rows,
 * fetches each sub-sheet by its `<room>.<N>` key, and merges them into a
 * single workbook with one named sheet per row. This requires DO-to-DO
 * fetches plus some TOC-parsing glue that depends on Phase 6 exec routes
 * and the multi-sheet routing in §1. Scoped out of Phase 8 per the phase
 * spec — routes return `501 Phase 8.1` with a brief explanation body.
 *
 * Route registration is via `registerExports(app)`, separate from
 * `registerRoomRoutes(app)` to avoid collisions with Phase 6's planned
 * POST /_/:room additions on the same file. The registration order in
 * `src/index.ts` is documented there.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { doFetch } from '../lib/do-dispatch.ts';
import {
  BINARY_CONTENT_TYPES,
  type BinaryFormat,
  buildMultiSheetWorkbookFromSheets,
} from '../lib/xlsx-build.ts';
import type { Env } from '../env.ts';

const TEXT_CT = 'text/plain; charset=utf-8';

/**
 * Fetch the TOC sheet (at `:room`, sans `=` prefix) and its sub-rooms, then
 * build a single workbook with one worksheet per TOC row. TOC shape matches
 * `packages/client-multi/src/Foldr.ts`: first row is headers; subsequent
 * rows are `[link, title]` where link is `/<subroom>` and title is the
 * user-chosen sheet tab name.
 *
 * Returns `null` when the TOC is missing or empty — caller emits 404.
 */
async function fetchMultiSheetBundle(
  env: Env,
  room: string,
): Promise<Array<{ name: string; view: unknown }> | null> {
  const tocRes = await doFetch(env, room, '/_do/csv.json');
  if (tocRes.status !== 200) return null;
  const rows = (await tocRes.json()) as unknown;
  if (!Array.isArray(rows) || rows.length < 2) return null;

  // Skip header row. Each remaining row is `[link, title]`.
  const tocRows = rows.slice(1) as unknown[];
  const bundle: Array<{ name: string; view: unknown }> = [];
  for (const raw of tocRows) {
    if (!Array.isArray(raw)) continue;
    const link = typeof raw[0] === 'string' ? raw[0] : '';
    const title = typeof raw[1] === 'string' && raw[1] ? raw[1] : `Sheet${bundle.length + 1}`;
    // Links start with `/` — strip to get the sub-room name.
    if (!link || link.startsWith('#')) continue;
    const subroom = link.replace(/^\//, '');
    if (!subroom) continue;
    const sheetRes = await doFetch(env, subroom, '/_do/sheet-data');
    if (sheetRes.status !== 200) continue;
    const view = (await sheetRes.json()) as unknown;
    bundle.push({ name: title, view });
  }
  return bundle.length > 0 ? bundle : null;
}

async function dispatchMultiSheetExport(
  env: Env,
  room: string,
  format: BinaryFormat,
): Promise<Response> {
  const bundle = await fetchMultiSheetBundle(env, room);
  if (!bundle) {
    return new Response('', { status: 404, headers: { 'Content-Type': TEXT_CT } });
  }
  // `buildMultiSheetWorkbookFromSheets` expects `SocialCalcSheetView` —
  // the JSON we got from the DO is structurally identical.
  const bytes = buildMultiSheetWorkbookFromSheets(
    bundle as ReadonlyArray<{ name: string; view: Parameters<typeof buildMultiSheetWorkbookFromSheets>[0][number]['view'] }>,
    format,
  );
  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': BINARY_CONTENT_TYPES[format],
      'Content-Disposition': attachmentHeader(room, format),
    },
  });
}

/** Format registry for dispatcher. Keyed by URL suffix / slot. */
interface ExportFormat {
  /** `/_do/<path>` on the DO. */
  readonly doPath: string;
  /** Content type that overrides whatever the DO sent (for defensive sanity). */
  readonly contentType: string;
  /** Whether this format is binary (read as ArrayBuffer) or text. */
  readonly binary: boolean;
  /** If set, emit `Content-Disposition: attachment; filename="<room>.<ext>"`. */
  readonly attachmentExt?: string;
}

const FORMATS: Readonly<Record<string, ExportFormat>> = {
  html: {
    doPath: '/_do/html',
    contentType: 'text/html; charset=utf-8',
    binary: false,
  },
  csv: {
    doPath: '/_do/csv',
    contentType: 'text/csv; charset=utf-8',
    binary: false,
    attachmentExt: 'csv',
  },
  'csv.json': {
    doPath: '/_do/csv.json',
    contentType: 'application/json; charset=utf-8',
    binary: false,
  },
  md: {
    doPath: '/_do/md',
    contentType: 'text/x-markdown; charset=utf-8',
    binary: false,
  },
  xlsx: {
    doPath: '/_do/xlsx',
    contentType: BINARY_CONTENT_TYPES.xlsx,
    binary: true,
    attachmentExt: 'xlsx',
  },
  ods: {
    doPath: '/_do/ods',
    contentType: BINARY_CONTENT_TYPES.ods,
    binary: true,
    attachmentExt: 'ods',
  },
  fods: {
    doPath: '/_do/fods',
    contentType: BINARY_CONTENT_TYPES.fods,
    binary: true,
    attachmentExt: 'fods',
  },
};

function attachmentHeader(room: string, ext: string): string {
  // `encodeURI` preserves the shape legacy used everywhere (src/main.ls line
  // 143-144). Spaces become `%20`; quotes are escaped at the header level.
  const safe = encodeURI(room).replace(/"/g, '%22');
  return `attachment; filename="${safe}.${ext}"`;
}

async function dispatchExport(
  env: Env,
  room: string,
  format: ExportFormat,
): Promise<Response> {
  const res = await doFetch(env, room, format.doPath);
  if (res.status === 404) {
    return new Response('', { status: 404, headers: { 'Content-Type': TEXT_CT } });
  }
  const headers: Record<string, string> = { 'Content-Type': format.contentType };
  if (format.attachmentExt) {
    headers['Content-Disposition'] = attachmentHeader(room, format.attachmentExt);
  }
  if (format.binary) {
    const body = await res.arrayBuffer();
    return new Response(body, { status: res.status, headers });
  }
  const body = await res.text();
  return new Response(body, { status: res.status, headers });
}

/**
 * Register export routes on the Hono app. Call AFTER `registerRoomRoutes`
 * (which owns `/_/:room`) and BEFORE `registerRoomCatchAll` (which owns
 * `/:room`). Hono's trie matches longer literals first, so `/_/:room/csv`
 * still wins over `/_/:room` despite being registered after it.
 */
export function registerExports(app: Hono<{ Bindings: Env }>): void {
  // Multi-sheet export routes — CLAUDE.md §6.1. These MUST come before the
  // single-sheet routes so Hono's literal prefix matcher routes `/=:room`
  // before `/:room`. Each walks the TOC via DO-to-DO fetches and assembles
  // one workbook with formula-fidelity per sub-sheet.
  for (const fmt of ['xlsx', 'ods', 'fods'] as const) {
    app.get(`/_/=:room/${fmt}`, async (c) =>
      dispatchMultiSheetExport(c.env, c.req.param('room') ?? '', fmt),
    );
    app.get(`/=:room.${fmt}`, async (c) => {
      const raw = c.req.param('room') ?? '';
      const room = raw.slice(0, raw.length - fmt.length - 1);
      return dispatchMultiSheetExport(c.env, room, fmt);
    });
  }

  // Single-sheet routes. Registered under both `/_/:room/<fmt>` and
  // `/:room.<fmt>` aliases — legacy API surface preserved byte-for-byte
  // (CLAUDE.md §6.1 table entries).
  for (const [key, format] of Object.entries(FORMATS)) {
    // `/_/:room/<key>` form — explicit, no suffix-matching needed.
    //
    // Guard: if the room name starts with `=` we're actually in the
    // multi-sheet path. Hono's `:room` matcher greedily consumes `=room`
    // into the param so we peel it at runtime and hand back the 501 the
    // explicit multi-sheet route above would have emitted.
    app.get(`/_/:room/${key}`, async (c) => {
      const room = c.req.param('room') ?? '';
      if (room.startsWith('=')) {
        // Multi-sheet only supports binary formats.
        if (format.binary && format.attachmentExt) {
          return dispatchMultiSheetExport(c.env, room.slice(1), format.attachmentExt as BinaryFormat);
        }
        return new Response(
          `multi-sheet ${key} export: only xlsx/ods/fods supported`,
          { status: 501, headers: { 'Content-Type': TEXT_CT } },
        );
      }
      return dispatchExport(c.env, room, format);
    });
    // `/:room.<key>` form — the room name may NOT contain a dot-extension
    // matching another registered format (legacy rule; rooms with dots are
    // encoded via `encodeURI` but the `.xlsx`/`.csv` suffixes are special).
    //
    // Hono's matcher treats `.` as a literal in the pattern, so this route
    // registers exactly as written. Rooms that end in the same suffix would
    // eagerly match this route — that matches legacy behavior.
    app.get(`/:room{.+\\.${key.replace('.', '\\.')}}`, async (c) => {
      const raw = c.req.param('room') ?? '';
      const room = raw.slice(0, raw.length - key.length - 1);
      if (room.startsWith('=')) {
        if (format.binary && format.attachmentExt) {
          return dispatchMultiSheetExport(c.env, room.slice(1), format.attachmentExt as BinaryFormat);
        }
        return new Response(
          `multi-sheet ${key} export: only xlsx/ods/fods supported`,
          { status: 501, headers: { 'Content-Type': TEXT_CT } },
        );
      }
      return dispatchExport(c.env, room, format);
    });
  }
}
