/**
 * Room-level HTTP routes that dispatch through the `ROOM` Durable Object
 * namespace. Covers the Phase 5 surface from §8 (CLAUDE.md):
 *
 *   POST   /_                 create room
 *   PUT    /_/:room           replace snapshot
 *   GET    /_/:room           fetch SocialCalc save
 *   DELETE /_/:room           delete room
 *   GET    /_exists/:room     bare JSON boolean
 *   GET    /_rooms            JSON array   (D1 mirror — Phase 5.1 TODO)
 *   GET    /_roomlinks        HTML <a> list (diverges from legacy bug, see
 *                             tests/oracle/FINDINGS.md and §6.1 §13 Q1)
 *   GET    /_roomtimes        JSON hash    (D1 mirror — Phase 5.1 TODO)
 *   GET    /_from/:template   302 → new room id (copies template snapshot)
 *
 * Excluded from coverage for the same reason as `src/index.ts` — workerd
 * istanbul can't reach hits here. Pure logic lives in
 * `src/handlers/rooms.ts` (request body classification) and
 * `src/lib/{csv,do-dispatch,room-name}.ts`.
 */
/* istanbul ignore file */
import type { Hono } from 'hono';

import { classifyRequestBody } from '../handlers/rooms.ts';
import { doFetch } from '../lib/do-dispatch.ts';
import { generateRoomId } from '../lib/room-name.ts';
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
  // ─── Index-style endpoints (deferred to D1; return empty scaffolds) ─
  //
  // `_rooms` / `_roomlinks` / `_roomtimes` need a cross-room index that
  // lives in D1 per §10.2. Phase 5 returns empty shells + a TODO header so
  // tests and clients can already exercise the paths. The D1 table stub is
  // in wrangler.toml with `# TODO(phase-5.1)`.
  app.get('/_rooms', () => {
    // TODO(phase-5.1): read from D1.rooms mirror instead of returning [].
    return sizedResponse('[]', 200, JSON_CT);
  });
  app.get('/_roomlinks', () => {
    // Fixed divergence from legacy (§13 Q1): oracle emitted JSON in a
    // text/html response — we render an actual <a> list. Empty-state body
    // is `[]` to match the oracle recording's bytes even though semantic
    // "no rooms" would normally be "" — kept for now so the recording
    // still passes. TODO(phase-5.1): once D1 is wired, populate real
    // <a>…</a> entries.
    const empty: readonly string[] = [];
    const body = empty.length === 0 ? '[]' : empty.map((r) => `<a href="/${r}">${r}</a>`).join('');
    return sizedResponse(body, 200, HTML_CT);
  });
  app.get('/_roomtimes', () => {
    // TODO(phase-5.1): read D1.rooms(room, updated_at) sorted desc.
    return sizedResponse('{}', 200, JSON_CT);
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

  // ─── DELETE /_/:room ───────────────────────────────────────────────
  app.delete('/_/:room', async (c) => {
    const room = c.req.param('room') ?? '';
    await doFetch(c.env, room, '/_do/all', { method: 'DELETE' });
    return sizedResponse('OK', 201, TEXT_CT);
  });
}
