# Skew & reconnect: production candidate range → current `main`

> **Status / scope — corrected 2026-08-10.** The original analysis used
> `0.20260717.0` / `149ebcf` as production. Read-only production evidence in
> `PROD_UPGRADE_PLAN.md` disproves that premise and bounds the deployed source
> to **`[d2afa90, b7d8840)`**: passkeys and the `AuthDO` stack are present, but
> the security-audit page-script extraction at `b7d8840` is not.
>
> This document therefore compares **`d2afa90` → classification target
> `76ce06a`**. `d2afa90` is the earliest possible production revision, so
> this is the conservative **upper bound** on browser/Worker skew. If the
> operator later pins production to a later commit in the candidate range,
> the real delta and skew can only be smaller. Finding-ledger
> classifications were verified against tree **`76ce06a`** (the branch tip
> when the original 2026-08-10 correction landed). Post-classification
> packages tip used for the spot-check is **`c789249`**:
> `git diff --stat 76ce06a..HEAD -- packages/` is **not** empty —
>
> ```
>  packages/worker/src/index.ts                      | 18 ++++++
>  packages/worker/src/lib/robots.ts                 | 51 +++++++
>  packages/worker/test/lib-robots.node.test.ts      | 62 +++++++++
>  packages/worker/test/routes-security.node.test.ts | 72 ++++++++++
>  4 files changed, 203 insertions(+)
> ```
>
> (search-indexing `robots.ts` restore + tests only — `c789249` /
> related). That packages delta does **not** change the skew verdicts
> below: an added `X-Robots-Tag` response header and a new
> `GET /robots.txt` route are inert for an already-open browser tab and
> for Socket.IO clients, since neither is part of any client-held
> contract. Commits after `c789249` on this branch are
> documentation-only; do not re-pin the Status block to each successive
> docs commit SHA.
>
> Scope: a browser tab already open across a Worker deploy or rollback, plus
> HTTP and Socket.IO clients whose behavior is directly coupled to the same
> limits. Where this file and the runbook disagree, the runbook is
> authoritative.

Evidence was re-derived with read-only repository commands:

```bash
git show d2afa90:packages/client/src/boot.ts
git diff d2afa90..HEAD -- packages/shared/src packages/socketio-shim/src
git show d2afa90:packages/worker/src/room.ts
git diff d2afa90..HEAD -- packages/client/src/ws-adapter.ts \
  packages/client/src/main.ts
git show d2afa90:packages/worker/src/lib/session.ts
git diff d2afa90..HEAD -- index.html manifest.appcache \
  packages/worker/src/lib/session.ts
```

---

## 1. Corrected finding ledger

| Finding | Corrected verdict | Consequence for this migration |
| :------ | :---------------- | :----------------------------- |
| `formDataViewer` initial hydrate | **Still applies.** `d2afa90` has the same old-client quirk as `149ebcf`; the fix landed later in `2acd1d0`. | An already-open `d2afa90` form/app tab can fail to hydrate the main sheet after reconnecting to the new Worker. A full reload obtains the fixed client. |
| WebSocket canonical parser and field caps | **Still applies; genuinely new relative to `d2afa90`.** | Stock frames remain compatible. Malformed or over-limit native/Socket.IO frames are rejected. The raw 1 MiB native string-frame ceiling itself was already present, but its close behavior and the field-level limits are new. |
| Sheet/range command limits | **Still applies.** `packages/worker/src/lib/command-limits.ts` is absent at `d2afa90` and was introduced by `b7d8840`. | Large pastes or dimension-expanding commands that production may accept can be rejected by the target Worker. |
| Reconnect plus `hadSnapshot` | **Standing property, not a migration regression.** | `d2afa90` and `HEAD` have the same fixed-delay reconnect, queue flush, one-shot hydrate, and `hadSnapshot` guard. Deploy-induced DO restart exposes the pre-existing limitation, but the target did not introduce it. Communicate “reload after the deploy,” not “the upgrade changed reconnect semantics.” |
| Root asset/cache layout | **Newly corrected and broader than the old analysis.** | Cached old HTML still references assets the new Worker serves, so it normally boots rather than 404ing. It prolongs old-HTML/new-Worker skew; AppCache-capable browsers can pin the old master HTML because the unchanged manifest is still served. |
| Session cookie name | **New finding missed by the old-baseline analysis.** | `ec_sess` becomes `__Host-ec_sess`, with no legacy read fallback. Every passkey user holding only the production cookie appears signed out on the new Worker until re-authentication; private-room reconnects fail until then. |
| Passkeys/private ACLs described as newly arriving | **Already deployed; superseded.** | Passkey UI, `AuthDO`, private-room ACLs, and the old `ec_sess` cookie exist at `d2afa90`. Do not communicate private rooms as a new feature. The migration-specific event is the cookie rename, not ACL introduction. |
| HTTP command rejection propagation | **New target behavior, separate from the sheet-limit introduction.** | `5d37bd0` makes public `POST /_/:room` return the RoomDO's truthful non-2xx response instead of a false 202. API clients may newly observe 413. |

### Superseded statements retained from the original audit

The following statements explain older runbook wording but are no longer valid
against real production:

1. **Superseded baseline:** production is not `149ebcf`; all “feature new since
   tag” conclusions must be tested again from `d2afa90`.
2. **Superseded passkey conclusion:** anonymous old tabs do not break because
   passkeys/ACLs are newly introduced. They are already deployed. Logged-in
   tabs can instead lose identity because `ec_sess` is renamed.
3. **Superseded classification:** reconnect without re-hydration is not a
   target-code regression. It is unchanged behavior that a Worker restart
   makes operationally visible.
4. **Superseded asset framing:** the risk is not only an unhashed
   `static/player.js`. Production HTML itself still contains inline bootstrap
   scripts and declares `manifest.appcache`, while the target extracts page
   logic to five `static/*.js` files and removes the manifest attribute.
5. **Superseded HTTP note:** the first audit recorded public command POSTs
   falsely returning 202 after a RoomDO 413. Commit `5d37bd0` fixed that path;
   current `main` propagates the non-2xx status and body.

The original `formDataViewer`, protocol-cap, and command-limit findings are
**not** superseded: each remains present in `d2afa90..HEAD`, with the
qualifications below.

---

## 2. WebSocket protocol delta from `d2afa90`

Command:

```bash
git diff d2afa90..HEAD -- packages/shared/src packages/socketio-shim/src
```

The client→server and server→client discriminator sets are unchanged. No wire
field was renamed and no new message type is required for stock clients. The
new Worker is a stricter acceptor.

### 2.1 Genuinely new shared parser rules

At `d2afa90`, `parseClientMessage` only parses JSON and checks that `type` is in
`CLIENT_MESSAGE_TYPES`. At `HEAD`, `parseClientMessageValue` validates each
shape and returns a fresh canonical object, dropping unknown properties.

| Rule at `HEAD` | Status at `d2afa90` | Open-tab effect |
| :------------- | :------------------- | :-------------- |
| Non-empty `room` ≤ 2,048 chars | **New** | Stock adapter supplies the handshake room and passes. Empty/huge third-party frames are silently dropped. |
| `user` ≤ 256 chars | **New** | Stock random usernames pass. |
| `auth` ≤ 512 chars | **New** | Normal legacy HMAC/query values pass. |
| `chat.msg` ≤ 16 KiB | **New** | Normal chat passes; oversized chat is dropped. |
| `ecell` / `original` ≤ 64 chars | **New** | These are cursor coordinates, not cell contents; normal A1 coordinates pass. |
| `execute.cmdstr` ≤ 1 MiB chars | **New field validation** | The entire native frame is also bounded, so this mainly makes validation canonical and applies equally to decoded Socket.IO values. |
| Required fields by discriminator | **New** | Stock `ws-adapter` envelopes remain valid; malformed third-party frames formerly accepted by the type-only parser are dropped. |
| Unknown object keys removed | **New canonicalization** | Stock handlers do not rely on extras. |
| `MAX_COMMAND_UTF8_BYTES = 120 KiB` | **New** | This redacts an oversized command from the audit copy; it does not itself reject execution. |

`packages/shared/src/multi.ts` is also new and caps multi-sheet TOC rows (256
sheets, 256-char titles, 2,048-char links), but that is an HTTP/TOC boundary,
not the single-sheet WebSocket reconnect path.

### 2.2 The 1 MiB frame ceiling: threshold old, failure mode new

`d2afa90` already defines `MAX_FRAME = 1024 * 1024` in `room.ts` and silently
returns for an oversized **string** frame. `HEAD` shares the same numeric
ceiling as `MAX_WS_FRAME_CHARS`, measures string or binary input before parse,
and closes the socket with `1009 "Message too large"`.

Therefore “a 1 MiB ceiling is newly imposed” is false. The migration changes a
silent drop into an explicit connection close, covers binary frames, and adds
per-field validation under that ceiling.

### 2.3 Socket.IO caps genuinely new from `d2afa90`

`packages/socketio-shim/src/translate.ts` now delegates decoded payloads to the
same `parseClientMessageValue` canonical parser. The adapter also newly adds:

- `MAX_SOCKET_IO_SESSIONS = 1,024` → excess handshake returns 503;
- `MAX_XHR_POLL_BYTES = 1 MiB` → oversized poll POST returns 413;
- `MAX_XHR_POLL_FRAMES = 64` → oversized batch returns 413;
- `MAX_XHR_POLL_QUEUE = 128` → queue overflow closes the session;
- idle-session pruning and rejection of a second concurrent pending poll.

Ordinary legacy handshakes, WebSocket upgrades, and single-frame XHR polls stay
compatible. Abuse, unbounded backlogs, and malformed payloads fail closed.

### 2.4 Attachment-room and identity binding

`d2afa90` builds the message context from client-supplied `parsed.room` and uses
an empty per-message auth fallback. `HEAD`:

- requires `attachment.room`;
- drops every non-`ask.recalc` frame whose parsed room differs from the
  accepted socket room;
- replaces message `user` with the handshake identity;
- falls back to handshake `attachment.auth` when a message omits `auth`;
- uses `attachment.room` for storage and mirror side effects.

The stock envelope sets `room` to the adapter room unless a caller deliberately
overrides it, so normal edits, chat, and cursors remain compatible. The known
stock override is the old formdata bootstrap below.

---

## 3. `formDataViewer`: still a real old-client → new-Worker break

At `d2afa90`, `boot.ts` does this when a formdata viewer exists:

```ts
if (!SocialCalc._view && ss.formDataViewer) {
  const room = `${SocialCalc._room ?? ''}_formdata`;
  ss.formDataViewer.sheet._room = room;
  ss.formDataViewer._room = room;
  SocialCalc.Callbacks.broadcast?.('ask.log', { room });
} else {
  SocialCalc.Callbacks.broadcast?.('ask.log');
}
```

The initial frame is sent on the **main room socket** but labels itself
`<room>_formdata`. The `d2afa90` Worker trusts that label when constructing the
message context. Its `ask.log` reply is therefore labelled as formdata even
though the request is handled by the main RoomDO. The client routes that reply
to `applyFormDataLog`, which then broadcasts an unqualified main-room
`ask.log`; that follow-up hydrates the main grid.

The `HEAD` attachment-room equality gate drops the old client's initial
mismatched frame before any reply can trigger the follow-up. Result: an already
open `d2afa90` form/app tab reconnecting to the new Worker can remain on its
loader/stale model.

The client fix landed after the floor in `2acd1d0`. `HEAD` retains the sibling
request but also always sends a main-room request:

```ts
if (!SocialCalc._view && ss.formDataViewer) {
  // ...
  SocialCalc.Callbacks.broadcast?.('ask.log', { room });
}
SocialCalc.Callbacks.broadcast?.('ask.log');
```

The mismatched sibling-labelled frame may still be dropped, but it is no longer
the sole hydrate request. **Mitigation: full page reload onto the target
client bundle.** This finding therefore still applies to the real migration;
it is not removed or re-scoped away.

---

## 4. Sheet limits: still a migration delta

`git cat-file -e d2afa90:packages/worker/src/lib/command-limits.ts` fails because
the path does not exist in that tree. `git log --diff-filter=A` identifies
`b7d8840` as its introduction.

At the target:

- a native WebSocket `execute` that exceeds sheet/range limits closes with
  `1008 "Command exceeds sheet limits"`;
- RoomDO command/snapshot HTTP paths return 413;
- current public `POST /_/:room` propagates the RoomDO's non-2xx response after
  `5d37bd0`, rather than falsely returning 202;
- `MAX_WS_CELL_CHARS` is only a cursor-coordinate cap and is unrelated to
  pasted cell contents;
- `MAX_COMMAND_UTF8_BYTES` only substitutes an audit-log placeholder and is
  not the rejection mechanism.

Therefore the original “large paste can now be rejected” warning **still
applies** from the corrected floor. It must not be labeled already deployed.
Existing sheets above 200,000 declared cells remain readable and editable
within their current bounds but cannot expand rows/columns past the target
limits.

---

## 5. Reconnect: standing property, not target regression

`packages/client/src/main.ts` has identical `applyLog` / `hadSnapshot` behavior
at `d2afa90` and `HEAD`:

```ts
if (SocialCalc.hadSnapshot) return;
SocialCalc.hadSnapshot = true;
```

`ws-adapter.ts` is not byte-identical: `HEAD` resolves relative WebSocket URLs
against `location.href` for older-browser compatibility. However, the
reconnect state machine is unchanged:

- fixed 500 ms delay by default, not exponential;
- up to 1,800 attempts (about 15 minutes);
- `close` schedules reconnect;
- `open` resets the attempt count and flushes queued outbound frames;
- no `ask.log` / snapshot refetch;
- no reset of `SocialCalc.hadSnapshot`.

Consequences across any Worker deploy that restarts the room DO:

- the tab usually reconnects automatically;
- frames queued while offline flush after reopen;
- frames already handed to the dying socket have no ack/replay guarantee;
- edits made by peers during the gap are not fetched;
- peers can retain divergent optimistic models until a full reload.

This is operationally important but must be communicated as a **standing
client limitation exposed by the restart**, not as behavior introduced by the
production→target migration.

`packages/client-multi` still delegates each sheet to a single-sheet iframe;
its TOC freshness is HTTP polling and does not repair iframe sheet state.

---

## 6. Root HTML, normal cache, and AppCache skew

### 6.1 Actual layout delta

At `d2afa90`, `index.html`:

- declares `<html manifest="manifest.appcache">`;
- contains inline room/bootstrap, localization, resize, and chat-submit logic;
- loads the already-deployed passkey UI and `static/player.js`.

At `HEAD`, the manifest attribute is gone and page logic is extracted to five
tracked files introduced at `b7d8840`:

- `static/index-bootstrap.js`;
- `static/index-l10n.js`;
- `static/panels.js`;
- `static/start-bootstrap.js`;
- `static/start-page.js`.

The target still ships `manifest.appcache` and all assets referenced by the old
root. The manifest blob itself is unchanged from `d2afa90`.

### 6.2 Cached old root HTML against the new Worker

A cached `d2afa90` root normally **does not fail with asset 404s** against the
new Worker. Its inline bootstraps need no extracted files, and the target still
serves `jquery.js`, `socialcalc.js`, passkey assets, `player.js`, localization,
styles, and images. Instead it prolongs a hybrid window:

- the DOM/page bootstrap remains old;
- unhashed external files may be old or new depending on browser/edge cache;
- the old `player.js` can continue speaking to the new stricter Worker;
- a reload is not proof that every cached resource changed unless cache is
  purged or bypassed.

The inverse direction is sharper during gradual rollout or rollback: target
HTML requires the extracted `static/*.js`; a request routed to a Worker/assets
version before `b7d8840` can return 404 for those files. Version-coherent asset
routing and the runbook's root/asset probes are therefore load-bearing.

### 6.3 Browsers that still honor Application Cache

Modern browsers that removed AppCache ignore the manifest attribute; normal
HTTP/browser/edge caching remains the risk. In a browser that still honors it,
the old root is a **master entry** and the manifest's explicit CACHE entries
stay pinned. `NETWORK: *` permits non-cached URLs to use the network, but does
not evict the cached master document or explicit entries.

Because the target continues serving a byte-identical `manifest.appcache`, such
a browser sees no manifest update. It can keep serving the cached old root and
listed legacy assets, never observing that the network's new root removed the
manifest attribute. Purging Cloudflare's edge cache alone cannot clear a
client-side Application Cache. The user must clear site data/application cache
or use a browser that no longer supports AppCache; changing/retiring the
manifest response would require a separate source decision and is not part of
this documentation change.

---

## 7. Session-cookie rename: user-visible rollout event

At `d2afa90`:

```ts
export const SESSION_COOKIE_NAME = 'ec_sess';
```

At `HEAD`:

```ts
export const SESSION_COOKIE_NAME = '__Host-ec_sess';
```

The rest of `packages/worker/src/lib/session.ts` is unchanged by this diff.
`parseSessionCookie` compares each cookie name only to
`SESSION_COOKIE_NAME`; there is no `ec_sess` fallback. Login and logout also
set/clear only the active constant.

Consequences:

1. every logged-in production passkey user whose browser has only `ec_sess`
   appears anonymous when routed to the target Worker;
2. an open private-room tab loses its verified principal when the deploy drops
   its socket, so reconnect can be denied until the user re-authenticates;
3. public rooms remain usable anonymously, but passkey UI/whoami state flips to
   signed out;
4. during a percentage ramp, the same browser can appear signed in on the old
   version and signed out on the new version;
5. passkey login against the target issues `__Host-ec_sess`; the old and new
   names can coexist because the target does not migrate or delete `ec_sess`.

Frame this plainly in user communications: **“You may be signed out during the
upgrade; sign in again to reopen private sheets.”** This is temporary
lockout-until-relogin, not ACL declassification.

---

## 8. Corrected scenario matrix

| Direction / scenario | Corrected outcome | Classification | Operator mitigation |
| :------------------- | :---------------- | :------------- | :------------------ |
| old open tab → new Worker: normal public edits/chat/cursors | **Works.** Stock room-labelled frames satisfy the canonical parser and attachment-room gate. | Compatible | None beyond general deploy notice. |
| old open tab → new Worker: DO restart/reconnect | Socket reopens and queued frames flush, but no snapshot is fetched; in-flight unacked edits and peer-gap edits can be lost/diverge. | **Standing property**, not migration regression | Lowest-traffic window; tell active users to reload after deploy. |
| old open form/app tab → new Worker | Initial `_formdata`-labelled `ask.log` is dropped; its main-room follow-up never occurs. | **Still-applicable regression** | Full reload onto target client, which always sends main-room `ask.log`. |
| old logged-in private tab → new Worker | Old `ec_sess` is ignored; reconnect/HTTP access appears anonymous and can be denied. | **Newly identified regression** | Warn users; reload and complete passkey login again. |
| old/new client → new Worker: over-limit paste/batch | Native WS closes 1008; public command HTTP now truthfully returns 413. | **Still-applicable regression/product ceiling** | Split paste; API callers handle 413; do not blame the 64-char cursor cap. |
| client → new Worker: native frame >1 MiB | New Worker closes 1009 instead of the old silent drop. | Changed failure mode; numeric ceiling already deployed | Retry smaller operation; reload after close if needed. |
| legacy Socket.IO client → new Worker | Normal traffic works; malformed/oversized payloads, excess sessions, huge poll batches, or queue overflow fail closed. | Stricter but compatible for normal use | Monitor 413/503/session closes for legacy embeds. |
| cached old root → new Worker | Normally boots because old references remain served, but HTML/bootstrap and unhashed resources can remain skewed. | **Degraded/prolonged skew** | Purge edge cache; advise hard reload; probe root and target assets. |
| AppCache-held old root → new Worker | AppCache-capable browser may keep the old master root indefinitely because the manifest is still served unchanged. | **Pinned stale client** | Clear client site/application cache or use non-AppCache browser; edge purge alone is insufficient. |
| target HTML → pre-`b7d8840` Worker/assets during ramp or rollback | Extracted page scripts can 404. | **Broken mixed-version asset path** | Version-coherent asset rollout; probe all five scripts; purge after ramp/rollback. |
| new client → old Worker (rollback): normal public WS | Old parser accepts canonical frames; normal edits work. | Compatible | Reload to version-coherent assets. |
| new client → old Worker: private auth after target login | Old Worker reads `ec_sess`, not `__Host-ec_sess`; a browser with only the new cookie appears signed out there. | Reverse cookie skew | Rollback communication must also ask users to sign in again if required. |
| new client → old Worker: large batches | Old Worker lacks sheet/range command limits, so formerly rejected batches may apply again. | Behavior reverts | Do not use rollback as a data-limit workaround. |
| multi-sheet TOC | TOC polls over HTTP; sheet iframes retain the single-sheet reconnect limitation. | Compatible TOC, standing iframe risk | Reload affected sheet iframe/page. |

---

## 9. Cutover verdict

A forced reload is not required for basic public single-sheet protocol
compatibility. It remains operationally necessary for a clean cutover because:

1. deploy-time reconnect has no state re-hydration (a standing limitation);
2. an old form/app tab has a real hydrate break against the room-bound Worker;
3. the session-cookie rename signs existing passkey users out and blocks
   private-room reconnect until re-login;
4. new command limits can reject edits that the candidate production floor
   accepts;
5. old inline/AppCache HTML and new extracted-script HTML create a broader
   cache/version-coherence surface than the original `player.js`-only warning.

Plan the window and communications around **reload plus possible passkey
re-authentication**, not around newly introducing passkeys or changing the
reconnect algorithm. If production is later pinned above `d2afa90`, re-run the
same diffs from that exact SHA and remove only findings whose introducing
commit is already deployed; the conservative analysis above cannot understate
the skew within the current candidate range.
