/**
 * Room-level HTTP routes that dispatch through the `ROOM` Durable Object
 * namespace. Covers the Phase 5 surface from §8 (CLAUDE.md):
 *
 *   POST   /_                 create room
 *   PUT    /_/:room           replace snapshot
 *   GET    /_/:room           fetch SocialCalc save
 *   DELETE /_/:room           delete room
 *   GET    /_exists/:room     bare JSON boolean
 *   GET    /_rooms            JSON array   (D1 mirror — Phase 5.1)
 *   GET    /_roomlinks        HTML <a> list (diverges from legacy bug, see
 *                             tests/oracle/FINDINGS.md and §6.1 §13 Q1)
 *   GET    /_roomtimes        JSON hash    (D1 mirror — Phase 5.1)
 *   GET    /_from/:template   302 → new room id (copies template snapshot)
 *
 * Excluded from coverage for the same reason as `src/index.ts` — workerd
 * istanbul can't reach hits here. Pure logic lives in
 * `src/handlers/rooms.ts` (request body classification),
 * `src/lib/{csv,do-dispatch,room-name,rooms-index}.ts`.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { upsertCronTriggers } from '../handlers/cron.ts';
import { classifyCommandBody, joinCommands } from '../handlers/post-command.ts';
import { classifyRequestBody } from '../handlers/rooms.ts';
import { parseSettimetrigger } from '../lib/cron.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import {
  enrichLoadClipboard,
  isBannedWikiFormat,
  isLoadClipboard,
  isMultiCascade,
} from '../lib/loadclipboard.ts';
import { generateRoomId } from '../lib/room-name.ts';
import {
  listRooms,
  listRoomTimes,
  renderRoomLinks,
} from '../lib/rooms-index.ts';
import type { Env } from '../env.ts';

const TEXT_CT = 'text/plain; charset=utf-8';
const HTML_CT = 'text/html; charset=utf-8';
const JSON_CT = 'application/json; charset=utf-8';

/**
 * Response with `Content-Length` set from the body. Workers auto-emits it
 * for buffered bodies, but the oracle recordings pin the value so we set
 * it explicitly to avoid mismatches if a future workerd update flips the
 * default.
 */
function sizedResponse(
  body: string,
  status: number,
  contentType: string,
  extraHeaders: Record<string, string> = {},
): Response {
  const bytes = new TextEncoder().encode(body);
  return new Response(body, {
    status,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bytes.byteLength),
      ...extraHeaders,
    },
  });
}

function xlsxDeferredResponse(): Response {
  const body = 'xlsx import lands in Phase 8';
  const bytes = new TextEncoder().encode(body);
  return new Response(body, {
    status: 501,
    headers: {
      'Content-Type': TEXT_CT,
      'Content-Length': String(bytes.byteLength),
    },
  });
}

async function readBodyBytes(request: Request): Promise<Uint8Array> {
  return new Uint8Array(await request.arrayBuffer());
}

/**
 * Register all Phase 5 room routes on the provided Hono app. Ordering
 * matters — Hono dispatches literal prefixes before params, so `/_rooms`,
 * `/_roomlinks`, `/_roomtimes`, `/_from/:template`, `/_exists/:room`,
 * `/_new`, `/_start`, `/_health` all have to come before `/_/:room` (the
 * `_` vs `_…` split in Hono's trie is exact-match-first).
 */
export function registerRoomRoutes(app: Hono<{ Bindings: Env }>): void {
  // ─── Cross-room index endpoints (Phase 5.1 — backed by D1) ─────────
  //
  // The D1 `rooms` table (migrations/0001_rooms.sql) is maintained by
  // the DO — every snapshot write upserts a row, every DELETE /_do/all
  // removes one. These handlers read from that table. When `env.DB` is
  // unbound (Node unit tests without Miniflare, or a deployment that
  // opts out of the index) we short-circuit to the empty-state body
  // shapes the oracle recorded.
  app.get('/_rooms', async (c) => {
    if (!c.env.DB) return sizedResponse('[]', 200, JSON_CT);
    const rooms = await listRooms(c.env.DB);
    return sizedResponse(JSON.stringify(rooms), 200, JSON_CT);
  });
  app.get('/_roomlinks', async (c) => {
    // Sensible-fix (§13 Q1): oracle emitted JSON in a text/html
    // response — we render an actual <a> list. Empty-state body is
    // still `[]` to keep the oracle's byte recording passing.
    if (!c.env.DB) return sizedResponse('[]', 200, HTML_CT);
    const rooms = await listRooms(c.env.DB);
    const body = renderRoomLinks(rooms, c.env.BASEPATH ?? '');
    return sizedResponse(body, 200, HTML_CT);
  });
  app.get('/_roomtimes', async (c) => {
    if (!c.env.DB) return sizedResponse('{}', 200, JSON_CT);
    const times = await listRoomTimes(c.env.DB);
    return sizedResponse(JSON.stringify(times), 200, JSON_CT);
  });

  // ─── Template copy ─────────────────────────────────────────────────
  app.get('/_from/:template', async (c) => {
    const template = c.req.param('template') ?? '';
    const snapshotRes = await doFetch(c.env, template, '/_do/snapshot');
    if (snapshotRes.status === 404) {
      // Template doesn't exist — legacy still redirects into a blank room.
      // Preserve that but note it in FINDINGS for a potential fix later.
      const newRoom = generateRoomId();
      return c.redirect(
        `${c.env.BASEPATH ?? ''}/${newRoom}${c.env.ETHERCALC_KEY ? '/edit' : ''}`,
        302,
      );
    }
    const snapshot = await snapshotRes.text();
    const newRoom = generateRoomId();
    await doFetch(c.env, newRoom, '/_do/snapshot', {
      method: 'PUT',
      body: snapshot,
    });
    return c.redirect(
      `${c.env.BASEPATH ?? ''}/${newRoom}${c.env.ETHERCALC_KEY ? '/edit' : ''}`,
      302,
    );
  });

  // ─── _exists ────────────────────────────────────────────────────────
  app.get('/_exists/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    const res = await doFetch(c.env, room, '/_do/exists');
    const { exists } = (await res.json()) as { exists: 0 | 1 };
    // Oracle emits a bare JSON boolean with `application/json; charset=utf-8`
    // (see tests/oracle/FINDINGS F-05 + the recorded fixture). Matches the
    // legacy `@response.json (exists === 1)` in src/main.ls:275.
    return sizedResponse(exists === 1 ? 'true' : 'false', 200, JSON_CT);
  });

  // ─── POST /_ (create) ──────────────────────────────────────────────
  app.post('/_', async (c) => {
    const bytes = await readBodyBytes(c.req.raw);
    const ct = c.req.header('content-type') ?? '';
    // For POST `/_`, a JSON body can carry `{room?, snapshot}` — pull the
    // room out before the generic body classifier consumes it. The
    // classifier also handles the snapshot part.
    let userRoom: string | undefined;
    if (ct.split(';')[0]!.trim().toLowerCase() === 'application/json') {
      try {
        const parsed = JSON.parse(new TextDecoder('utf-8').decode(bytes)) as {
          room?: unknown;
        };
        if (typeof parsed.room === 'string' && parsed.room.length > 0) {
          userRoom = parsed.room;
        }
      } catch {
        /* fall through; classifyRequestBody handles bad JSON */
      }
    }
    const decoded = classifyRequestBody(ct, bytes);
    if (decoded.kind === 'xlsx-deferred') return xlsxDeferredResponse();
    const snapshot = decoded.kind === 'save' ? decoded.snapshot : '';
    const room = userRoom ?? generateRoomId();
    await doFetch(c.env, room, '/_do/snapshot', {
      method: 'PUT',
      body: snapshot,
    });
    return sizedResponse(`/${room}`, 201, TEXT_CT, { Location: `/_/${room}` });
  });

  // ─── PUT /_/:room (overwrite snapshot) ─────────────────────────────
  app.put('/_/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    const bytes = await readBodyBytes(c.req.raw);
    const ct = c.req.header('content-type') ?? '';
    const decoded = classifyRequestBody(ct, bytes);
    if (decoded.kind === 'xlsx-deferred') return xlsxDeferredResponse();
    const snapshot = decoded.kind === 'save' ? decoded.snapshot : '';
    await doFetch(c.env, room, '/_do/snapshot', {
      method: 'PUT',
      body: snapshot,
    });
    // Legacy responds with exactly `201 OK` text/plain (src/main.ls:404).
    return sizedResponse('OK', 201, TEXT_CT);
  });

  // ─── GET /_/:room (raw save) ───────────────────────────────────────
  app.get('/_/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    const res = await doFetch(c.env, room, '/_do/snapshot');
    if (res.status === 404) {
      return sizedResponse('', 404, TEXT_CT);
    }
    const body = await res.text();
    return sizedResponse(body, 200, TEXT_CT);
  });

  // ─── GET /_/:room/cells (full cell map JSON) ───────────────────────
  //
  // Legacy `src/main.ls` mapped this to `JSON.stringify(ss.sheet.cells)`.
  // The DO exposes the same via `/_do/cells`. Must register BEFORE the
  // `/_/:room/cells/:cell` route so Hono picks the trailing-slashless
  // literal before the param form.
  app.get('/_/:room/cells', async (c) => {
    const room = c.req.param('room') ?? '';
    const res = await doFetch(c.env, room, '/_do/cells');
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  });

  // ─── GET /_/:room/cells/:cell (single cell JSON) ───────────────────
  app.get('/_/:room/cells/:cell', async (c) => {
    const room = c.req.param('room') ?? '';
    const cell = c.req.param('cell') ?? '';
    const res = await doFetch(c.env, room, `/_do/cells/${encodeURIComponent(cell)}`);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  });

  // ─── DELETE /_/:room ───────────────────────────────────────────────
  app.delete('/_/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    await doFetch(c.env, room, '/_do/all', { method: 'DELETE' });
    return sizedResponse('OK', 201, TEXT_CT);
  });

  // ─── POST /_/:room (execute commands) ───────────────────────────────
  //
  // Phase 6 implementation. Direct port of src/main.ls:406-446:
  //
  //   1. classify body (JSON {command} / text / xlsx-deferred)
  //   2. empty body -> 400 'Please send command'
  //   3. xlsx -> 501 (J-lib decoder deferred to Phase 8)
  //   4. apply text-wiki filter -- the banned command is silently
  //      dropped at the top (sec 7 item 12); we return 202 with the
  //      original command echoed so clients don't re-issue it.
  //   5. if the command is loadclipboard AND it arrived as plain text,
  //      auto-enrich per legacy:
  //        row = ?row query if present and truthy, else derive from
  //        the current snapshot's sheet dimension line
  //        -> [cmd, insertrow A<row>, paste A<row> all] if ?row given
  //        -> [cmd, paste A<row> all] otherwise
  //   6. if the command matches `^set A\d+:B\d+ empty multi-cascade`,
  //      read the referenced cell's t:-prefixed content out of the
  //      current snapshot and rename that foreign room <ref> -> <ref>.bak
  //      via POST /_do/rename on the source DO.
  //   7. join the (possibly-array) command with newlines and
  //      dispatch to POST /_do/commands on the room DO.
  //   8. reply 202 application/json with body {command} -- command
  //      may be a string or an array of strings.
  //
  // The WS broadcast (`{type: execute, cmdstr, room}`) is Phase 7's
  // responsibility; this handler trusts the DO has already surfaced
  // the change via its own WS fan-out when that layer lands.
  app.post('/_/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    const bytes = await readBodyBytes(c.req.raw);
    const ct = c.req.header('content-type') ?? '';
    const classified = classifyCommandBody(ct, bytes);

    if (classified.kind === 'xlsx-deferred') return xlsxDeferredResponse();
    if (classified.kind === 'empty') {
      return sizedResponse('Please send command', 400, TEXT_CT);
    }

    // Apply text-wiki filter first (at the top per legacy sec 7 item 12).
    // Single-string only -- the banned command is never an array member
    // in practice; if a client ever nests it, the DO's own executor
    // would still process it (we match legacy's surface-only filter).
    if (
      typeof classified.command === 'string' &&
      isBannedWikiFormat(classified.command)
    ) {
      return new Response(
        JSON.stringify({ command: classified.command }),
        { status: 202, headers: { 'Content-Type': JSON_CT } },
      );
    }

    // For plain-text bodies the legacy auto-enriches loadclipboard and
    // handles multi-cascade renames. Those branches don't apply when
    // the command arrived as JSON -- the client has already composed
    // the array shape it wants.
    let commandOut: string | readonly string[] = classified.command;

    if (classified.kind === 'text-command') {
      const textCmd = classified.command;

      // Multi-cascade rename (src/main.ls:425-436). Reads the current
      // snapshot out of this room's DO, matches the
      // `cell:<ref>:t:/<foreignRoom>` line, and issues /_do/rename on
      // the foreign room's DO. Errors (missing snapshot, missing cell
      // line, rename 5xx) are swallowed: legacy proceeds to execute
      // the command regardless.
      const cascadeRef = isMultiCascade(textCmd);
      if (cascadeRef !== null) {
        const snapshotRes = await doFetch(c.env, room, '/_do/snapshot');
        if (snapshotRes.ok) {
          const snapshot = await snapshotRes.text();
          const cellLine = new RegExp(`cell:${cascadeRef}:t:/(.+)`, 'i').exec(snapshot);
          if (cellLine) {
            const foreignRoom = cellLine[1]!.replace(/\r?$/, '');
            await doFetch(c.env, foreignRoom, '/_do/rename', {
              method: 'POST',
              body: JSON.stringify({ to: `${foreignRoom}.bak` }),
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
      }

      // Loadclipboard auto-enrichment (src/main.ls:414-424).
      if (isLoadClipboard(textCmd)) {
        const rowQ = Number(c.req.query('row'));
        const rowQueryParam = Number.isNaN(rowQ) ? null : rowQ;
        // Snapshot is needed for the lastrow derivation. Treat 404 as empty.
        const snapshotRes = await doFetch(c.env, room, '/_do/snapshot');
        const snapshot = snapshotRes.ok ? await snapshotRes.text() : '';
        commandOut = enrichLoadClipboard(textCmd, { rowQueryParam, snapshot });
      }
    }

    // Dispatch the joined commands to the DO. Array commands become a
    // single newline-separated batch (matches legacy
    // `cmdstr = command * '\n'`).
    const cmdstr = joinCommands(commandOut);

    // Phase 9 — settimetrigger side-effect. The legacy flow posted the
    // command to a worker-thread which then emitted a `setcrontrigger`
    // message (src/sc.ls:220); we short-circuit by detecting the verb
    // here and writing to D1 before the DO runs the command. The DO
    // still executes the command (which records a log entry), but the
    // actual scheduling lives in `cron_triggers`.
    //
    // Multi-line dispatches (array command or newline-joined text
    // block) can carry several settimetrigger lines; we parse each.
    if (c.env.DB) {
      for (const line of cmdstr.split('\n')) {
        const parsed = parseSettimetrigger(line);
        if (parsed) {
          await upsertCronTriggers(c.env.DB, room, parsed.cell, parsed.times);
        }
      }
    }

    await doFetch(c.env, room, '/_do/commands', {
      method: 'POST',
      body: cmdstr,
    });

    // Legacy replies `@response.json 202 {command}` -- `command` is the
    // post-enrichment value (string or array), not the raw body text.
    return new Response(JSON.stringify({ command: commandOut }), {
      status: 202,
      headers: { 'Content-Type': JSON_CT },
    });
  });
}
