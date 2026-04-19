# Oracle findings — running log

Oracle quirks and divergences discovered during Phase 3 recording.
Append as they come up; the phase-integration pass folds the
load-bearing items into `CLAUDE.md` §6/§7.

## Phase 3

### F-01 — `fetch()` auto-follows redirects; recorder needs `redirect: 'manual'`

Default `fetch` behavior is to transparently follow 30x responses. We
record scenarios like `GET /_new` (302) and `GET /:room/edit` (302), so
the recorder and replayer both set `redirect: 'manual'` in the
`RequestInit`. Without it the oracle's 302 becomes a 200-after-follow,
which would invalidate every redirect scenario.

Files: `packages/oracle-harness/src/record.ts:100`,
`packages/oracle-harness/src/replay.ts:67`.

### F-02 — `/_new` returns a fresh 12-char base36 UUID per call

`main.ls:53` — `new-room = -> require \uuid-pure .newId 12 36 .toLowerCase!`.
The `Location` header is `/<uuid>`, body is `Found. Redirecting to
/<uuid>`, and `Content-Length` depends on the id. None of the three
are reproducible, so the scenario `misc/get-new-redirect` registers a
`NormalizeHook` in `packages/oracle-harness/src/normalize.ts` that
rewrites `Location` to `re:^/[a-z0-9]{12}$` and `Content-Length` to
`re:^\d+$`. The body is `bodyMatcher: "ignore"` (which the recorder's
matcher selector picks automatically for 3xx).

### F-03 — `GET /:room/edit` with no KEY redirects to `?auth=<room-itself>`

When the server has no HMAC secret configured, `hmac(x) = x` (identity
— see `main.ls:23`'s ternary). So `/some-room/edit` 302s to
`/some-room?auth=some-room`, not `?auth=0`. This is stable and worth a
CLAUDE.md note — the §6.1 table currently says `?auth=<hmac>` without
the no-KEY case spelled out.

Files: `src/main.ls:23,296-305`.

### F-04 — `GET /_roomlinks` serves JSON body with `text/html` content-type

Confirmed. `Content-Type: text/html; charset=utf-8`, body `[]` for an
empty oracle. This is the "bug-for-bug preservation" item already
enumerated in CLAUDE.md §6.1 / Q1, recording exercises it.

### F-05 — `GET /_exists/:room` returns `true` / `false` (not `{"exists":0}`)

The §6.1 table hedges between `{"exists": 0}` and "similar". Actual
response: bare JSON boolean. For an unknown room it's exactly
`false\n`(?)  — actually `false` with no trailing newline, `Content-Length: 5`.
Same for `true`. Use `bodyMatcher: "json"` which the recorder picks
automatically from `application/json` CT.

### F-06 — `Last-Modified` header on static assets is `mtime` of the
container filesystem

`GET /`, `GET /_start`, and the static files all carry a
`Last-Modified` header pulled from the container's fs mtime (zappajs
→ express.static → send). Rebuilding the oracle image produces
slightly different timestamps across days. Current recordings accept
this as an **exact** match — if the CI job rebuilds weekly, the
recording needs refreshing too. Phase 4+ option: add `last-modified`
to the volatile drop-list in `headers.ts`, or keep asserting it.

Files: `packages/oracle-harness/src/headers.ts:16-22`.

### F-07 — `manifest.appcache` is dynamic only in DevMode

`main.ls:70-75` — when `fs.existsSync('.git')` is true (i.e. the repo
was run from a clone), the handler returns a dynamic stub; otherwise
it streams the file. Our oracle container clones from GitHub, so
`.git` exists, so we're in DevMode. Scenario `static/get-manifest-appcache`
is **not** in the Phase 3 batch for this reason — it would embed
`new Date()` which is absolutely non-deterministic. Add it in Phase 4
with `bodyMatcher: "ignore"` plus a `Content-Type` assertion.

### F-08 — `/_roomtimes` returns `{}` (empty object), not `[]`

Oracle's code path at `main.ls:252-262` iterates a Redis hash; on an
empty Redis that's `{}` with `Content-Length: 2`. Recorded as
`bodyMatcher: "json"` → passes.

### F-09 — Docker compose v1 vs v2 subtleties

The modern `docker compose` (v2 plugin) is what our Dockerfile targets.
No action needed, just a heads-up if a contributor is still on
`docker-compose` v1 — our YAML uses the `services:` top-level
structure which v2+ requires.
