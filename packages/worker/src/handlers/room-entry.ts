/**
 * `GET /:room`, `GET /:template/form`, `GET /:template/appeditor` —
 * Phase 4.1 entry routes.
 *
 * Legacy (src/main.ls:277-294):
 *
 * ```livescript
 * @get "#BASEPATH/:room": ->
 *   room = encodeURI(@params.room)
 *   ui-file = if room is /^=/ then \multi/index.html else \index.html
 *   if KEY then
 *     if @query.auth?length
 *       sendFile(ui-file).call @
 *     else @response.redirect "#BASEPATH/#{ @params.room }?auth=0"
 *   else sendFile(ui-file).call @
 *
 * @get "#BASEPATH/:template/form": ->
 *   template = encodeURI(@params.template)
 *   room = template + \_ + new-room!
 *   delete SC[room]
 *   {snapshot} <~ SC._get template, IO
 *   <~ SC._put room, snapshot
 *   @response.redirect "#BASEPATH/#room/app"
 *
 * @get "#BASEPATH/:template/appeditor": sendFile \panels.html
 * ```
 *
 * This module owns the two pure-logic parts:
 *
 *   1. `buildRoomEntry` — decides "serve `/index.html`", "serve
 *      `/multi/index.html`", or "302 to `?auth=0`" based on the KEY /
 *      `?auth` query state.
 *
 *   2. `buildTemplateFormRedirect` — produces the shape legacy emits
 *      when `/some-template/form` is hit. Full implementation depends
 *      on Phase 5 Room CRUD — specifically, cloning the template's
 *      snapshot into `<template>_<newid>`. Since that lands in a
 *      parallel agent, we STUB for now: return a 503 with a body
 *      describing the deferral. When Phase 5 wires the DO-to-DO fetch,
 *      this function's stubbed branch swaps to produce a 302.
 *
 * `GET /:template/appeditor` is just a static `panels.html` serve — no
 * pure logic needed here; the route layer hands off to ASSETS directly.
 *
 * Encoding note: legacy applies `encodeURI(@params.room)` everywhere.
 * Hono decodes the param before we see it, so we re-encode via
 * `encodeRoom` to keep storage keys byte-identical with the oracle.
 */
import { encodeRoom, generateRoomId } from '../lib/room-name.ts';

/** Marker statuses for the template-form stub. Exported so the route
 * layer can read `TEMPLATE_FORM_STUB_STATUS` as its `init.status`.
 */
export const TEMPLATE_FORM_STUB_STATUS = 503;

export interface BuildRoomEntryOpts {
  readonly basepath?: string;
  readonly room: string;
  /** The `?auth=` query value, undefined if absent. Empty string = present but empty. */
  readonly authQuery?: string | undefined;
  /** `ETHERCALC_KEY`. When unset, we serve the index page regardless of `authQuery`. */
  readonly key?: string;
}

/** The decision carried back from `buildRoomEntry`. */
export type RoomEntryDecision =
  | {
      readonly kind: 'redirect';
      readonly status: 302;
      readonly body: string;
      readonly headers: {
        readonly Location: string;
        readonly 'Content-Type': string;
        readonly 'Content-Length': string;
        readonly Vary: string;
      };
    }
  | {
      readonly kind: 'serve';
      /** The asset path to hand off to `env.ASSETS.fetch` — `/index.html` or `/multi/index.html`. */
      readonly path: string;
    };

/**
 * Decide how to handle a `GET /:room` request. See file header for the
 * legacy semantics. Returns a discriminated union so the route layer
 * can either return a 302 or forward to `env.ASSETS.fetch(path)`.
 *
 * Defense-in-depth: `:room` path params that collide with the reserved
 * prefixes (`_rooms`, `_exists`, `_from`, etc.) would already be
 * routed to those specific handlers by Hono's trie (static wins over
 * `/:room`). We do NOT re-check that here — double-guarding would just
 * diverge from Hono's routing table and create subtle bugs if a new
 * reserved prefix lands. Ordering is enforced at registration time in
 * `src/routes/assets.ts`.
 */
export function buildRoomEntry(opts: BuildRoomEntryOpts): RoomEntryDecision {
  const basepath = opts.basepath ?? '';
  const encoded = encodeRoom(opts.room);
  const isMulti = encoded.startsWith('=');
  const path = isMulti ? '/multi/index.html' : '/index.html';

  // KEY unset → always serve the index page.
  if (!opts.key) {
    return { kind: 'serve', path };
  }
  // KEY set and a non-empty `?auth=…` value was supplied → serve index.
  // The auth value itself is validated later on the WS connect path;
  // legacy doesn't gate the page serve on HMAC match (§6.4).
  if (opts.authQuery !== undefined && opts.authQuery.length > 0) {
    return { kind: 'serve', path };
  }
  // KEY set, no `?auth` → 302 to the view-only sentinel. Express's
  // redirect body shape is `Found. Redirecting to <url>` with a
  // `text/plain; charset=UTF-8` body; we reproduce it so oracle replays
  // stay byte-aligned with the rest of the redirect family.
  const location = `${basepath}/${encoded}?auth=0`;
  const body = `Found. Redirecting to ${location}`;
  return {
    kind: 'redirect',
    status: 302,
    body,
    headers: {
      Location: location,
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Length': String(body.length),
      Vary: 'Accept',
    },
  };
}

export interface BuildTemplateFormRedirectOpts {
  readonly basepath?: string;
  readonly template: string;
  /** Injectable for deterministic tests. Defaults to `generateRoomId`. */
  readonly idGen?: () => string;
  /**
   * Signals whether Phase 5 Room CRUD is ready. When `false` (default),
   * we return the stub. When `true`, we produce the redirect — the
   * route layer is expected to have already cloned the snapshot via
   * `env.ROOM.get(…).fetch('/_do/clone')` before calling this builder.
   */
  readonly phase5Ready?: boolean;
}

export type TemplateFormResult =
  | {
      readonly status: 302;
      readonly body: string;
      readonly headers: Readonly<Record<string, string>>;
    }
  | {
      readonly status: typeof TEMPLATE_FORM_STUB_STATUS;
      readonly body: string;
      readonly headers: Readonly<Record<string, string>>;
    };

/**
 * Legacy-shape redirect for `/:template/form` → 302 `/<template>_<uuid>/app`.
 * The new room id is the template name plus an underscore plus a fresh
 * 12-char id — preserving the legacy `_formdata` naming convention used
 * by the `submitform` WS command (see §7 item 22).
 *
 * Behavior controlled by `phase5Ready`:
 *   - unset / false → 503 stub explaining the dependency
 *   - true          → 302 redirect with Express-style body
 */
export function buildTemplateFormRedirect(
  opts: BuildTemplateFormRedirectOpts,
): TemplateFormResult {
  const basepath = opts.basepath ?? '';
  const template = encodeRoom(opts.template);
  const id = (opts.idGen ?? generateRoomId)();
  const newRoom = `${template}_${id}`;

  if (!opts.phase5Ready) {
    const body =
      'Template duplication is not yet available — Phase 5 (Room CRUD) ' +
      'has not landed. Once DO-to-DO fetches are wired, this endpoint ' +
      'will 302 to /' +
      newRoom +
      '/app.';
    return {
      status: TEMPLATE_FORM_STUB_STATUS,
      body,
      headers: {
        'Content-Type': 'text/plain; charset=UTF-8',
        'Content-Length': String(body.length),
      },
    };
  }

  const location = `${basepath}/${newRoom}/app`;
  const body = `Found. Redirecting to ${location}`;
  return {
    status: 302,
    body,
    headers: {
      Location: location,
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Length': String(body.length),
      Vary: 'Accept',
    },
  };
}
