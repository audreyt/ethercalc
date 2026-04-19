# Worker — Phase 4 findings

Append-only log. Each item is an observed legacy or runtime quirk worth
documenting so a later phase agent doesn't re-discover it. Load-bearing
items will be folded into `CLAUDE.md` §6/§7 during the next phase-
integration pass.

## Phase 4

### F-P4-01 — Express redirect body + headers not automatic in Hono

Hono's `c.redirect(url, 302)` emits only `Location` — no body, no
`Content-Type`, no `Content-Length`. Legacy Express emits:

```
Status: 302 Found
Content-Type: text/plain; charset=UTF-8
Content-Length: <N>
Location: <url>
Vary: Accept

Found. Redirecting to <url>
```

The oracle recordings keep these. To stay oracle-compatible we added
`expressRedirect()` in `src/routes/stateless.ts` that reproduces the
full shape. Scenario bodies are `bodyMatcher: "ignore"` today so only
the headers matter, but setting the body now means future "exact"
scenarios don't need a second pass.

### F-P4-02 — `/etc/*` and `/var/*` 404 Content-Type is `text/html`, not `text/plain`

Task spec asked for `text/plain; charset=utf-8`. Oracle recordings show
`text/html; charset=utf-8` — Express's default for `res.send(404, '')`
when the body is empty. We preserve the oracle value. If the §13-Q1
"sensible fix" list later decides this is a bug worth fixing, the fix
belongs in `src/handlers/blocked-paths.ts` (one-line header change +
oracle recording refresh).

### F-P4-03 — `import.meta.glob` types need a local declaration

`tsconfig.json` `types: [workers-types, vitest-pool-workers]` doesn't
include `vite/client`, so `import.meta.glob` is `never`. The replay
test declares a local `ImportMetaGlob` interface and casts. Cleaner
fix later: add `vite/client` to the tsconfig `types` array, but that
pulls in DOM lib declarations we don't want in worker code. Local
cast is the right trade-off.

### F-P4-04 — Workers Assets binding can't point at repo root

Attaching `[assets] directory = "../../"` tripped Workers' 25 MiB per-
asset limit because the worktree has `node_modules/.../workerd/bin/workerd`
(~82 MiB). We left the `[assets]` block commented in `wrangler.toml`
and documented the Phase 11 follow-up inline. Routes that depend on
ASSETS (`/`, `/_start`, `/manifest.appcache`, icons) return 404 when
the binding is absent (see `src/routes/assets.ts`).

### F-P4-05 — Oracle replay scenarios that are Phase-4-out-of-scope

Of the 13 recorded fixtures, 5 pass and 8 are deferred:

| Scenario                                | Phase | Why                                  |
| --------------------------------------- | ----- | ------------------------------------ |
| misc/get-new-redirect                   | 4 ✔   |                                      |
| misc/get-edit-no-key-redirect           | 4 ✔   |                                      |
| misc/get-view-no-key-redirect           | 4 ✔   |                                      |
| misc/get-etc-foo-404                    | 4 ✔   |                                      |
| misc/get-var-foo-404                    | 4 ✔   |                                      |
| misc/get-exists-unknown-room            | 5     | needs room CRUD + KV/D1 index        |
| rooms-index/get-rooms-empty             | 5     | needs /_rooms handler + index        |
| rooms-index/get-roomlinks-empty         | 5     | needs /_roomlinks (oracle bug-for-bug) |
| rooms-index/get-roomtimes-empty         | 5     | needs /_roomtimes + timestamps hash  |
| static/get-root-index                   | 11    | needs ASSETS binding + index.html    |
| static/get-start                        | 11    | needs ASSETS + start.html            |
| static/get-favicon                      | 11    | needs ASSETS + favicon.ico           |
| static/get-socialcalc-js                | 11    | needs ASSETS + SocialCalc.js copy    |

The oracle-replay vitest file asserts the 5 passes explicitly + a
meta-count floor of ≥4, so a future regression surfaces immediately.

### F-P4-06 — Phase 4.1 follow-up — `/:room` entry page route

Deliberately NOT registered in `src/index.ts`. Two reasons:
1. Serving `index.html` requires the ASSETS binding (deferred to Phase 11).
2. A naked `/:room` route would shadow the `/_rooms`, `/_roomlinks`,
   `/_roomtimes`, `/_new` etc that Phase 5 wants. Hono's trie router
   handles literal prefixes before params, so the ordering does work —
   but leaving the registration out until Phase 5 guarantees nobody
   accidentally short-circuits the future handlers.

`buildRoomRedirect({mode: 'entry', ...})` pure logic is ready; when
Phase 5 wires it, it returns `null` (serve ASSETS index) or a 302 to
`?auth=0` based on `ETHERCALC_KEY` + query.

### F-P4-07 — `verifyAuth('secret', 'room', '0')` must be false

Wasn't previously codified. Under identity HMAC, `computeAuth(undefined, '0')
=== '0'`, so a naive `supplied === expected` check would *accept*
`?auth=0` as a valid edit token. Our `verifyAuth` short-circuits
`supplied === '0'` before any comparison. The Phase 7 WS `execute`
handler must call `verifyAuth` (not re-implement the compare) or the
view-only sentinel leaks into write operations.
