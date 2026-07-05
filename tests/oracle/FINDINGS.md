# Oracle findings — running log

Oracle quirks and divergences discovered during Phase 3 recording.
Append as they come up; the phase-integration pass folds the
load-bearing items into `AGENTS.md` §6/§7.

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
AGENTS.md note — the §6.1 table currently says `?auth=<hmac>` without
the no-KEY case spelled out.

Files: `src/main.ls:23,296-305`.

### F-04 — `GET /_roomlinks` serves JSON body with `text/html` content-type

Confirmed. `Content-Type: text/html; charset=utf-8`, body `[]` for an
empty oracle. This is the "bug-for-bug preservation" item already
enumerated in AGENTS.md §6.1 / Q1, recording exercises it.

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

### F-10 — `GET /_/:room` snapshot is `text/plain`, not `text/x-socialcalc`

Oracle serves the SocialCalc save string with `Content-Type: text/plain;
charset=utf-8` (`main.ls:319`, `api -> [Text, it]`). The recorder's
default matcher would therefore pick `exact`; scenario
`exports/get-snapshot` registers a `NormalizeHook` that rewrites
`bodyMatcher` to `scsave` so version-line drift doesn't invalidate
recordings.

Files: `packages/oracle-harness/src/normalize.ts`,
`packages/oracle-harness/src/scenarios/exports.ts`.

### F-11 — `GET /:template/form` Location embeds `new-room()` uuid

`main.ls:287-293` — clones the template snapshot into
`<template>_<12-char-base36>` and 302s to `/<that-room>/app`. Scenario
`form/get-template-form-redirect` relaxes `Location` to
`re:^/oracle-phase3-template_[a-z0-9]{12}/app$` and ignores the
redirect body (same pattern as F-02).

### F-12 — `POST /_/:room` JSON command response is `{command: ...}`

Oracle returns `202` with `application/json` body `{command: "<cmdstr>"}`
where `command` may be a string or joined array (`main.ls:446`).
Scenario `room-crud/post-command` records `set B1 text t phase3` after
the export batch so csv/html fixtures stay stable.

### F-13 — `GET /:template/form` leaves a clone room in Redis after replay

The form handler clones into `<template>_<uuid>` and we never DELETE
that sibling. After a full record pass the oracle's Redis holds the
clone even though `room-crud/delete-template-room` removed the
template itself. Replaying immediately on the **same** oracle fails
`rooms-index/*-empty` (non-empty `_rooms`). Fix: `docker compose down
-v` (or a fresh Redis) before replay, or accept 19/22 on a hot oracle.
Fresh-oracle replay is 22/22.

Files: `packages/oracle-harness/src/scenarios/form.ts`,
`packages/oracle-harness/src/replay.ts` (`sortRecordedByScenarioOrder`).

### F-14 — Replay must forward `request.bodyBase64` (PUT/POST bodies)

`replay.ts` originally only replayed method+headers; stateful scenarios
(`PUT /_/:room`, `POST /_/:room`) silently sent empty bodies and GET
exports 404'd. Fixed via shared `buildScenarioRequestInit()` in
`record.ts`.

### F-09 — Docker compose v1 vs v2 subtleties

The modern `docker compose` (v2 plugin) is what our Dockerfile targets.
No action needed, just a heads-up if a contributor is still on
`docker-compose` v1 — our YAML uses the `services:` top-level
structure which v2+ requires.
