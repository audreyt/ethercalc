# Skew & reconnect: `0.20260717.0` (149ebcf) ↔ current `main`

Read-only cutover audit for **browser tabs already open** across a
Worker deploy (or rollback). Baseline production tag:

- tag `0.20260717.0` = commit `149ebcf16104b01254ca2b796beb701c88bd6ff8`
- head of this audit = current `main` (`HEAD`)

Scope: old client bundle talking to new Worker, and the inverse.
Evidence quotes are verbatim from the trees named above.

> **Status:** Supporting evidence for `PROD_UPGRADE_PLAN.md` (the operator
> runbook). Produced early on 2026-08-10 for open-tab behaviour across the
> cutover, **before** several runbook fact-check revisions (including the
> front-door `POST /_/:room` 413 propagation fix). Historical observations
> are retained and marked **Superseded** where the tree later changed.
> **Where this file and the runbook disagree, the runbook is authoritative.**


---

## 1. WebSocket protocol diff

Command:

```bash
git diff 149ebcf..HEAD -- packages/shared/src packages/socketio-shim/src
```

Touched files: `messages.ts` (+limits +strict parse), `multi.ts` (new TOC
limits; HTTP multi-sheet only), `storage-keys.ts` (access/ACL meta; not WS
frames), `socketio-shim` adapter/translate (same parser + transport caps).

### 1.1 Discriminator / shape inventory

**Client → server type set is unchanged** at both ends:

`chat | ask.ecells | my.ecell | execute | ask.log | ask.recalc | stopHuddle | ecell | ask.ecell`

**Server → client type set is unchanged**:

`log | recalc | snapshot | ecells | execute | chat | confirmemailsent | ignore | stopHuddle | ecell | my.ecell | ask.ecell`

No field was renamed. No new required wire field was added to the
discriminated unions themselves. The breaking change is **validation
depth and room binding**, not the schema vocabulary.

### 1.2 `parseClientMessage` — old vs new

**Old (149ebcf)** — type-only gate; extra/missing fields not stripped or
checked beyond `type ∈ CLIENT_MESSAGE_TYPES`:

```ts
export function parseClientMessage(raw: string): ClientMessage | null {
  return parseTypedMessage<ClientMessage>(raw, CLIENT_MESSAGE_TYPES);
}
```

(`packages/shared/src/messages.ts` at 149ebcf)

**New (HEAD)** — frame size gate + per-field required/optional/bounds,
returning a **canonicalized** object (unknown keys dropped):

```ts
export const MAX_WS_FRAME_CHARS = 1024 * 1024;
// ...
export function parseClientMessage(raw: string): ClientMessage | null {
  if (raw.length > MAX_WS_FRAME_CHARS) return null;
  return parseClientMessageValue(safeJsonParse(raw));
}
```

(`packages/shared/src/messages.ts:117-252`)

Canonical rules (`parseClientMessageValue`, HEAD `messages.ts:256-363`):

| type | required fields | optional | bounds / notes |
| ---- | --------------- | -------- | -------------- |
| all | `type`, non-empty `room` | — | `room` ≤ `MAX_WS_ROOM_CHARS` (2048); empty room rejected |
| `chat` | `user`, `msg` | — | user ≤ 256; msg ≤ 16 KiB |
| `ask.ecells`, `ask.recalc` | `room` only | — | |
| `my.ecell` | `user`, `ecell` | — | ecell ≤ **64 chars** |
| `execute` | `user`, `cmdstr` | `auth` | cmdstr ≤ 1 MiB chars; auth ≤ 512 |
| `ask.log`, `ask.ecell` | `user` | — | user ≤ 256 |
| `stopHuddle` | `room` | `auth` | auth ≤ 512 |
| `ecell` | `user`, `ecell` | `original`, `auth`, `to` | ecell/original ≤ 64; to/user ≤ 256; auth ≤ 512 |

Non-object / array / unknown `type` → `null` (silent drop at DO).

### 1.3 Socket.IO translate path

**Old:** only checked `args[0].type ∈ CLIENT_MESSAGE_TYPES`.

**New:** delegates to the same `parseClientMessageValue`:

```ts
return parseClientMessageValue(parsed.args[0]);
```

(`packages/socketio-shim/src/translate.ts` HEAD)

So legacy `/socket.io/*` embeds now fail closed on the same field/limit
rules as native `/_ws/:room`.

### 1.4 Per-change acceptance matrix

| Change | OLD client → NEW worker | NEW client → OLD worker |
| ------ | ----------------------- | ----------------------- |
| Stricter required fields (`user`/`cmdstr`/`ecell`/non-empty `room`) | **Accepted** for the stock 149ebcf `ws-adapter` envelope (always injects `type`, `user`, `room`, optional `auth`). Malformed third-party frames that 149ebcf accepted may now be **dropped** (`parseClientMessage` → `null` → `webSocketMessage` returns). | **Accepted** — old parser only checks `type`. Canonical new frames are a subset. |
| Field bounds (`MAX_WS_*`) | **Degrades/breaks** only when a field exceeds the new cap (see §2). Over-limit frame → parse `null` → **silent drop** (or 1009 if raw length > 1 MiB). | **Accepted** — old parser has no bounds. |
| Unknown extra JSON keys | **Accepted** (stripped on canonicalize). | **Accepted** (old cast keeps them; handlers ignore). |
| Server message shapes | N/A (client parse) | **Accepted** — `parseServerMessage` / type set unchanged; old client still understands every server type. |
| `attachment.room` binding (see §3) | **Works** when `parsed.room ===` handshake room (normal edits). **Breaks** when old client deliberately overrides `room` (formdata `ask.log` — see §3/§4). | **Works** — old worker used `parsed.room` as the context room. |
| Socket.IO session/poll caps (shim only) | **Degrades** under extreme poll backlog / session flood (close / 413 / 503). Normal single-tab embeds unaffected. | N/A if rolling back worker only while new embeds still use native WS. |

**Bottom line (protocol):** the JSON vocabulary is backward compatible.
The new worker is a **stricter acceptor**. A vanilla 149ebcf single-sheet
tab keeps speaking a legal dialect. Pathological or formdata-room-override
frames are the real skew surface.

---

## 2. New server-side limits

### 2.1 Every `MAX_*` in `packages/shared/src/messages.ts` (HEAD)

```ts
export const MAX_WS_FRAME_CHARS = 1024 * 1024;
export const MAX_WS_ROOM_CHARS = 2_048;
export const MAX_WS_USER_CHARS = 256;
export const MAX_WS_AUTH_CHARS = 512;
export const MAX_WS_CHAT_CHARS = 16 * 1024;
export const MAX_WS_CELL_CHARS = 64;
/** Durable Object values must stay below 128 KiB including key overhead. */
export const MAX_COMMAND_UTF8_BYTES = 120 * 1024;
```

(`messages.ts:117-124`)

### 2.2 Enforcement sites in `packages/worker/src/room.ts` (and parse)

| Limit | Enforcement | On exceed |
| ----- | ----------- | --------- |
| `MAX_WS_FRAME_CHARS` | `webSocketMessage` **before** parse | **Close socket** `1009` `"Message too large"` |
| same (parse) | `parseClientMessage` | returns `null` → **silent drop** if somehow reached |
| `MAX_WS_ROOM/USER/AUTH/CHAT/CELL_CHARS` + cmdstr char cap | `parseClientMessageValue` | `null` → **silent drop** (`if (!parsed \|\| !attachment.room) return`) |
| `MAX_COMMAND_UTF8_BYTES` via `isStorageSafeCommand` | `#appendCommand` audit path only | Command **still executes**; audit log stores placeholder `"[oversized command omitted: …]"` — **not a user-visible reject** |
| Sheet/range product limits (`isCommandBatchWithinLimits` in `lib/command-limits.ts`, new since 149ebcf) | `#appendCommand` → `applyCommand` | returns false → WS **`ws.close(1008, 'Command exceeds sheet limits')`**; RoomDO HTTP `POST /_do/commands` → `413` `"command exceeds sheet limits"`; **front-door** `POST /_/:room` now propagates that non-2xx status/body (runbook §8 PR 4 / §10 item 3; both sites in `routes/rooms.ts`) — see **Superseded** note below for the pre-fix always-202 behaviour |
| `MAX_WS_MESSAGES_PER_WINDOW = 300` / `MAX_ROOM_WS_MESSAGES_PER_WINDOW = 1500` per 10s | `#rateLimitSocket` | **Close** `1008` `"Message rate exceeded"` / `"Room message rate exceeded"` |
| `MAX_CONN = 128` | accept paths | upgrade rejected (pre-existing class of cap; still present) |

Verbatim close paths:

```ts
if (messageSize > MAX_WS_FRAME_CHARS) {
  try {
    ws.close(1009, 'Message too large');
  } catch {
    // The peer may already be gone.
  }
  return;
}
```

(`room.ts:1522-1528`)

```ts
if (!parsed || !attachment.room) return;
```

(`room.ts:1545-1546`)

```ts
const auditBody = isStorageSafeCommand(body)
  ? body
  : `[oversized command omitted: ${body.length} UTF-16 code units]`;
ss.executeCommand(body);
```

(`room.ts:2090-2093`)

```ts
if (!applied) {
  try {
    ws.close(1008, 'Command exceeds sheet limits');
  } catch {
    // The peer may already be gone.
  }
}
```

(`room.ts:1803-1808`)

**Superseded — front-door HTTP command API (audit-time → current tree):**

At the time this skew audit was written, a reader could reasonably infer
that any HTTP path returning sheet-limit `413` was already user-visible.
That was true at the **RoomDO** boundary (`POST /_do/commands`) and for
`PUT /_/:room` snapshot writes, but **not** yet for the public command
API: `POST /_/:room` still answered `202 {"command":…}` even when the DO
had rejected the batch (silent write loss for API clients / scripts).
**Current tree (runbook §8 PR 4):** both Worker dispatch sites propagate
the DO status and body on non-2xx (e.g. `413 command exceeds sheet limits`)
and only emit the legacy 202 command echo on success
(`packages/worker/src/routes/rooms.ts` ~778-784 and ~924-936 / ~972-975;
tests in `packages/worker/test/routes-rooms.node.test.ts`). Browser tabs
use native WebSocket `execute` frames for ordinary edits, so the primary
open-tab paste path remains the **1008 close** above; the HTTP fix matters
for API clients and for runbook §5 Probe 6.


```ts
ws.close(
  1008,
  roomExceeded ? 'Room message rate exceeded' : 'Message rate exceeded',
);
```

(`room.ts:1652-1655`)

### 2.3 Can a normal old-client action trip these?

**`MAX_WS_CELL_CHARS = 64` — NOT cell content.**  
It bounds **cursor coordinates** (`ecell` / `original` on `my.ecell` /
`ecell` frames), e.g. `A1`, `BCZ999`. A legitimate SocialCalc A1-style
coord cannot approach 64 characters. **Normal navigation cannot trip
this.** A paste does **not** ride this field.

**Large paste / long formula — the real path is `execute.cmdstr`:**

1. **Wire frame:** `cmdstr` may be up to `MAX_WS_FRAME_CHARS` (1 MiB
   chars) at parse; raw WebSocket payload over 1 MiB → **1009 close**.
   Old worker already had `MAX_FRAME = 1024 * 1024` but **silently
   dropped** (`if (message.length > MAX_FRAME) return;` at 149ebcf
   `room.ts`) instead of closing.
2. **Sheet limits (NEW since 149ebcf):** `isCommandBatchWithinLimits`
   did not exist at 149ebcf (`command-limits.ts` absent). A paste that
   previously applied can now fail closed with **1008** and the client
   reconnects with **no error toast** (adapter only sees `close`).
3. **`MAX_COMMAND_UTF8_BYTES` (120 KiB):** does **not** reject the
   paste. It only redacts the audit copy. **A legitimate big paste is
   not rejected by this constant alone.**

**Chat:** messages > 16 KiB chars → silent drop (old accepted any
string). Normal chat lines are fine.

**Username / auth query on upgrade:** `routes/ws.ts` also rejects
handshake if `user`/`auth` exceed the shared caps (400). Stock client
usernames are short random strings.

**Verdict on paste:**

> A **legitimate large paste can now be rejected** where it previously
> succeeded, but the deciding code is **`isCommandBatchWithinLimits` /
> `#appendCommand` → `ws.close(1008, 'Command exceeds sheet limits')`**,
> **not** `MAX_WS_CELL_CHARS` and **not** `MAX_COMMAND_UTF8_BYTES`.
> `MAX_WS_CELL_CHARS` is a cursor-coord cap and is irrelevant to paste
> body size. Pastes that inflate the WebSocket frame past 1 MiB now
> hard-close (1009) instead of silent-drop.

---

## 3. Authentication per-message & attachment-room binding

### 3.1 What changed

**Old worker (149ebcf `webSocketMessage`):**

```ts
const parsed = parseClientMessage(message);
if (!parsed) return;
const perMessageAuth =
  'auth' in parsed && typeof parsed.auth === 'string' ? parsed.auth : '';
const ctx = this.#buildWsContext(ws, attachment, parsed.room, perMessageAuth);
await dispatchWsMessage(ctx, parsed);
```

Client-supplied `parsed.room` selected the logical room context.
Handshake `attachment.auth` was **not** used as fallback (`''` default).

**New worker (HEAD):**

```ts
const parsed = parseClientMessage(message);
if (!parsed || !attachment.room) return;
// Every room-labelled frame stays on its accepted socket. `ask.recalc`
// is the one legacy exception: its room names a cross-sheet reference,
// while this DO supplies the current cached snapshot.
if (parsed.type !== 'ask.recalc' && parsed.room !== attachment.room) return;
// The handshake defines the cosmetic user identity for this socket.
if ('user' in parsed) parsed.user = attachment.user;
const perMessageAuth =
  'auth' in parsed && typeof parsed.auth === 'string'
    ? parsed.auth
    : attachment.auth;
const ctx = this.#buildWsContext(
  ws,
  attachment,
  attachment.room,
  perMessageAuth,
);
await dispatchWsMessage(ctx, parsed);
```

(`room.ts:1545-1565`)

And `applyCommand` always mirrors **`attachment.room`**, never the frame:

```ts
// Mirror the DO's own room (from the WS handshake attachment),
// not the per-frame `room` field, because the append lands in
// *this* DO's storage regardless of what room the frame names.
const applied = await this.#applyCommandAndMirror(
  attachment.room,
  cmdstr,
);
```

(`room.ts:1795-1801`)

Upgrade path still stamps identity only from the verified Worker session
(`routes/ws.ts` builds `X-EC-Uid` / `X-EC-Session-Exp` from
`getSessionPrincipal`; inbound `X-EC-*` is never copied).

### 3.2 Does an OLD client that still sends `parsed.room` work?

**Yes for the normal single-sheet path.** The 149ebcf (and HEAD) client
envelope always sets `room` to the adapter’s handshake room:

```ts
if (out.room === undefined) out.room = opts.room;
```

(`packages/client/src/ws-adapter.ts:169`, unchanged in spirit since 149ebcf)

So `parsed.room === attachment.room` and the new equality gate passes.
The field is no longer **trusted** for storage/index side effects, but it
is still **required** by the parser and must **match**.

**No for the 149ebcf formdata hydrate quirk.** Old boot did:

```ts
if (!SocialCalc._view && ss.formDataViewer) {
  const room = `${SocialCalc._room ?? ''}_formdata`;
  // ...
  SocialCalc.Callbacks.broadcast?.('ask.log', { room });
} else {
  SocialCalc.Callbacks.broadcast?.('ask.log');
}
```

(149ebcf `packages/client/src/boot.ts`)

That overrides `room` to `<room>_formdata` on the **main-room** socket.
HEAD worker drops it (`parsed.room !== attachment.room`). HEAD client
fixed this by **always** also broadcasting main-room `ask.log`
(`boot.ts:384-390`). An old tab in form/app mode with `formDataViewer`
therefore **fails to hydrate the main sheet** against a new Worker until
reload picks up the new bundle.

### 3.3 Per-message auth fallback

Old: missing `auth` on execute → `''` → view-only reject when KEY set.  
New: missing `auth` → **`attachment.auth`** from the query string on
upgrade. That is **more permissive for old clients** that relied on the
handshake `?auth=` and omitted per-frame auth (stock envelope still
copies `opts.auth` onto every frame when present).

Private rooms (passkeys) additionally require `attachment.uid` and ACL
membership; anonymous old tabs simply cannot write private sheets (by
design, new feature surface).

---

## 4. Reconnect behavior

### 4.1 Client logic (single-sheet) — quote

`packages/client/src/ws-adapter.ts` (same control flow at 149ebcf and HEAD):

```ts
const delay = opts.reconnectDelayMs ?? 500;
const maxAttempts = opts.maxReconnectAttempts ?? 1800;
// ...
function onOpen(): void {
  reconnectAttempts = 0;
  notifyStatus({ type: 'open' });
  flushQueue();
}
function onClose(ev: { code?: number | undefined; reason?: string | undefined }): void {
  notifyStatus({ type: 'close', code: ev.code, reason: ev.reason });
  socket = null;
  scheduleReconnect();
}
function scheduleReconnect(): void {
  if (closed) return;
  if (reconnectAttempts >= maxAttempts) {
    notifyStatus({ type: 'reconnect_failed' });
    return;
  }
  reconnectAttempts++;
  notifyStatus({ type: 'reconnecting', attempt: reconnectAttempts });
  pendingTimer = setTimeoutFn(() => {
    pendingTimer = null;
    connect();
  }, delay);
}
```

(`ws-adapter.ts:175-246`)

- **Backoff:** fixed **500 ms** delay, **not** exponential.
- **Budget:** 1800 attempts ≈ 15 minutes of retries, then `reconnect_failed`.
- **On open:** only `flushQueue()` of frames buffered while offline.
- **No** `ask.log` / snapshot refetch is issued from the adapter on
  reconnect.
- **No** reset of `SocialCalc.hadSnapshot`.

Initial hydrate is a one-shot from boot:

```ts
SocialCalc.Callbacks.broadcast?.('ask.log');
```

(`boot.ts:390`)

And `applyLog` intentionally no-ops after the first snapshot:

```ts
if (SocialCalc.hadSnapshot) return;
SocialCalc.hadSnapshot = true;
```

(`main.ts:347-348`)

`hadSnapshot` can flip false only via the CryptoJS editor-settings hash
callback when a loaded settings line matches the live sheet
(`socialcalc-callbacks.ts:114-120`) — not on transport reconnect.

### 4.2 Multi-sheet client

`packages/client-multi` does **not** own a WebSocket. Each sheet iframe
runs the single-sheet client above. TOC freshness is HTTP polling
(`useTocPoll.ts`), not WS resume.

### 4.3 Durable Object restart (every Worker deploy)

| Question | Answer |
| -------- | ------ |
| Does an open tab automatically reconnect? | **Yes** — `close` → `scheduleReconnect` → new `/_ws/:room`. |
| Does it resync sheet state without manual reload? | **No.** No snapshot/`ask.log` on reconnect; `hadSnapshot` blocks a late `log` even if one were pushed. |
| Are unsaved local edits preserved? | **Locally yes** (optimistic SocialCalc model). **On the server:** frames still in the offline `queue` flush on open; frames already handed to a dying socket with no ack are **at risk of loss**. There is no delivery receipt / replay log. |
| Multiplayer after deploy | Peers may each keep divergent local models until a full page reload forces `ask.log`. |

---

## 5. Asset / bundle skew

### 5.1 `manifest.appcache`

- Repo root + curated `assets/manifest.appcache` still ship a **2016**
  CACHE MANIFEST listing **legacy** paths (`static/ethercalc.js`,
  `player/main.js`, …) — **not** `static/player.js`.
- `NETWORK: *` is present (network fallback).
- Current `assets/index.html` has **no** `<html manifest=…>` and no
  appcache link; it loads:

```html
<script type="module" src="./static/player.js"></script>
```

(`assets/index.html:27`)

- DevMode can serve a dynamic always-dirty stub
  (`routes/assets.ts` `/manifest.appcache`); production serves the static
  file via ASSETS.

**Modern Chromium has removed AppCache.** This file does **not** force
old tabs to reload in current browsers. It is not a cutover control plane.

### 5.2 Cache headers

Global middleware (`packages/worker/src/index.ts:115-117`):

```ts
if (hasSession || isAuthRoute || hasAuthorization || isOperatorRoute) {
  c.header('Cache-Control', 'private, no-store');
}
```

That is **only** for session/auth/operator traffic — **not** anonymous
HTML or `/static/*`.

`serveAsset` (`routes/assets.ts:92-135`) rewrites `Content-Type` when
needed and **does not set `Cache-Control`**. HTML and `static/player.js`
therefore inherit **Cloudflare Workers Assets default caching** on the
hosted path.

**MIME split for `/static/player.js`** (runbook §3.2 item 9 / §5 Probe 4;
`mimeForPath` / `MIME_BY_EXT` in `routes/assets.ts:54-78,122-130`):

- **Hosted Cloudflare Workers Assets** (production/staging / `wrangler dev`):
  upstream already supplies a real type — empirically
  `text/javascript; charset=utf-8`. `serveAsset` passes non-
  `application/octet-stream` types through untouched.
- **Standalone workerd / Sandstorm `DiskDirectory`:** upstream is
  `application/octet-stream` for every file; `serveAsset` rewrites `.js`
  via `mimeForPath` to `application/javascript; charset=utf-8`.

Either JavaScript subtype is fine for `<script type="module">`; treat the
difference as informational. Fail only on missing/wrong major type.

`static/player.js` is a **fixed unhashed URL** produced by
`scripts/build-assets.ts` (`playerBundle → static/player.js`). There is
**no content hash** in the filename.

**Explicit skew hazard:**

> HTML is **not** universally `no-store`. `/static/player.js` is a
> long-lived, unhashed URL with **no** Worker-set short cache TTL. An
> open tab keeps its already-parsed JS forever; a new visit may still
> receive a cached `player.js` from the edge/browser until that cache
> entry expires or is purged. **This is a real old-bundle×new-worker
> skew window after cutover (and the inverse after rollback).**

---

## 6. `/socket.io/*` legacy shim

Still registered early in the Worker:

```ts
registerWs(app);
registerLegacySocketIo(app);
```

(`packages/worker/src/index.ts:258-259`)

Routes (`packages/worker/src/routes/legacy-socketio.ts:61-108`):

```ts
app.get('/socket.io/socket.io.js', () => { /* … Cache-Control: public, max-age=3600 */ });
app.get('/socket.io/1/', (c) => shim.handleHandshake(/* … */));
app.get('/socket.io/1', (c) => shim.handleHandshake(/* … */));
app.get('/socket.io/1/websocket/:sid', async (c) => { /* → RoomDO /_do/legacy-ws */ });
app.on(['GET', 'POST'], '/socket.io/1/xhr-polling/:sid', async (c) => shim.handleXhrPoll(/* … */));
app.all('/socket.io/*', (c) => c.text('Not Found', 404));
```

**Legacy handshake is still accepted.** New caps on the in-Worker XHR
adapter (`MAX_SOCKET_IO_SESSIONS`, poll body/frame/queue limits) can
413/503/close abusive pollers; ordinary handshake+websocket upgrades
still complete. Inbound event payloads now run through
`parseClientMessageValue` (stricter than 149ebcf).

AGENTS.md decision #4 remains: shim kept indefinitely.

---

## Scenario matrix

| scenario | affected feature | outcome | evidence | mitigation |
| -------- | ---------------- | ------- | -------- | ---------- |
| old×new | Normal cell edits / chat / cursors on public rooms | **works** | Client envelope room matches attachment (`ws-adapter.ts:169`); types unchanged | None |
| old×new | Large paste / huge command batch (native WS) | **degrades → breaks** (1008 close; edit may be only local) | `isCommandBatchWithinLimits` + `room.ts:1803-1808`; absent at 149ebcf | Reload; split paste; or temporarily raise limits before cutover |
| old×new | Large paste via HTTP `POST /_/:room` | **breaks with truthful 413** on current `main` (was **silent 202** at audit time — **Superseded**, runbook §8 PR 4) | `routes/rooms.ts` propagates DO non-2xx; DO `#postCommands` 413 | API clients must handle 413; browser tabs use WS path above |
| old×new | WS frame > 1 MiB | **breaks** connection (1009) | `room.ts:1522-1528` (old: silent drop) | Rare; user reloads / retries smaller ops |
| old×new | Cursor `ecell` string | **works** (64-char cap irrelevant to A1 coords) | `MAX_WS_CELL_CHARS` on coord fields only | None |
| old×new | Audit log fidelity for huge commands | **degrades** (placeholder audit text; command still runs if sheet limits pass) | `room.ts:2090-2093` | Operator-only concern |
| old×new | Form/app `formDataViewer` initial hydrate | **breaks** without reload | 149ebcf boot only `ask.log`s `_formdata` room; HEAD drops mismatched room (`room.ts:1550`) | Full page reload to HEAD `player.js` (always main `ask.log`) |
| old×new | Private/passkey rooms | **breaks** for anonymous old tabs (feature new since tag) | ACL + `attachment.uid` (`room.ts:1829-1841`) | Expected; sign-in + new bundle |
| old×new | Deploy-time DO restart mid-edit | **degrades** — auto-reconnect, **no** state resync; possible lost in-flight executes | `ws-adapter.ts:210-246`; `main.ts:347-348` | Soft banner “reload to refresh”; drain edits before deploy |
| old×new | Multi-sheet TOC | **works** via HTTP poll (not WS) | `client-multi/src/useTocPoll.ts` | None |
| old×new | Legacy socket.io embeds | **works** with stricter payload validation | `legacy-socketio.ts:61-108`; `translate.ts` → `parseClientMessageValue` | Watch 413/session caps |
| old×new | Cached `static/player.js` after deploy | **degrades** (prolonged skew) | unhashed URL; `serveAsset` sets no cache policy; HTML not globally `no-store`; MIME may be `text/javascript` (hosted) or `application/javascript` (self-host rewrite) | Purge CF cache / add hash or `no-cache` on HTML+player at cutover |
| new×old (rollback) | Normal native WS edits | **works** | Old parser accepts new canonical frames; old worker trusts `parsed.room` (new client sends matching room) | None for public rooms |
| new×old | Sheet-limit closes / rate-limit closes | **N/A** (old worker lacks them) — large pastes **work again** | `command-limits.ts` absent at 149ebcf | — |
| new×old | Private room UX in new bundle | **breaks** against old worker without passkey/ACL stack | Phase A landed after tag | Don’t roll UI forward without worker; or hard-reload users to matching tag |
| new×old | Formdata boot fix (always main `ask.log`) | **works better** on old worker than old client did | HEAD `boot.ts:384-390` | — |
| new×old | Strict client still sends bounded frames | **works** | Subset of what old accepts | None |

---

## Verdict

**A forced client reload is not strictly required for the common public
single-sheet editing path** — the 149ebcf native client already speaks a
room-labelled JSON dialect the new Worker accepts, automatically
reopens `/_ws/:room` after the deploy drops Durable Object sockets, and
keeps optimistic local edits in memory. **However, a forced or
strongly-prompted reload is required for a clean cutover in production**
because (1) reconnect does **not** resnapshot, so multiplayer and
in-flight executes can diverge silently across the DO restart, (2) the
old form/app `formDataViewer` hydrate path is hard-broken by
attachment-room binding, (3) new sheet/command limits can close sockets
on pastes that used to succeed, and (4) unhashed `/static/player.js`
plus non-`no-store` HTML mean skew can persist long after the Worker
flips unless cache is purged or users reload. Treat cutover as
**Worker-compatible with old tabs for basic edits, operationally
requiring client refresh** (banner, cache purge, or hashed assets) before
calling the rollout done; the same reload discipline applies in reverse
on rollback if private-room UI has already been adopted.
