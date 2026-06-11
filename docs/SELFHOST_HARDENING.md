# Self-Host Hardening — Implementor Handoff

> **Status:** main self-host hardening pass applied incl. SH-8 (non-root + RO rootfs); Sandstorm
> branch work and optional in-Worker rate/room quotas remain · **Owner:** Audrey Tang · **Drafted:** 2026-06-11
> **Source:** a six-surface parallel audit + adversarial verification of the self-host
> deployment paths against the already-shipped worker code, followed by the 2026-06-11
> implementation pass recorded below.
>
> This doc is both an implementation record and a work order for follow-up agents. Each task in §3 is
> self-contained: read §0–§2.5 first (orientation, constraints, implementation record), then pick a
> remaining task. Tasks are independent unless a dependency is noted. Do **not** start coding before
> reading §2 (hard constraints).

---

## 0. Orientation — read this first

### 0.1 The one central fact

**The worker code is identical on Cloudflare-hosted and self-host. The important divergence is
configuration plus the presence or absence of an edge.** The hosted `ethercalc.net` deploy is hardened because
`packages/worker/wrangler.toml` pins `[vars] ETHERCALC_CORS = "1"` (the legacy room-index gate) *and* it sits behind the
Cloudflare edge (WAF rate-limiting, TLS, DDoS). The self-host paths read config from a different place
and have no edge in front; `main` now supplies the room-index config default, but the edge still remains
an operator responsibility.

Implementation note, 2026-06-11: `main` now also supports the clearer
`ETHERCALC_DISABLE_ROOM_INDEX` switch. Self-host Docker/workerd and Helm default it to `1`;
`ETHERCALC_CORS` remains honoured for hosted/back-compat. CORS response headers themselves are
emitted unconditionally by the Worker for embed compatibility.

So almost nothing here is "fix the worker code". It is "ship safe-by-default config" plus
"document/provide the abuse-prevention layer the CF platform gives the hosted version".

### 0.2 The three self-host launch paths (they differ!)

| Path | Launcher | How it gets env | Room-index default | Has an edge? |
|------|----------|-----------------|--------------------------|--------------|
| **A. CLI** | `bin/ethercalc` → `bunx wrangler dev` (Miniflare) | inherits `wrangler.toml [vars]` + `--var` passthrough | **`"1"` via legacy CORS (gated)** ✅ | no |
| **B. Docker / workerd** | `docker compose up` / bare `workerd serve` → `bin/workerd-entrypoint.sh` → `packages/worker/workerd/config.capnp` | `fromEnvironment` (process env) | **`ETHERCALC_DISABLE_ROOM_INDEX=1` (gated)** ✅ | no |
| **C. Sandstorm grain** | `sandstorm-http-bridge` → `run_grain.sh` → `workerd serve` | `run_grain.sh` exports | **empty (OPEN)** but mostly moot | **yes** (Sandstorm ACL/TLS) |

- **Path B is the flagship self-host story** (CLAUDE.md §13 Q5, README docker quickstart). `main` now
  ships it gated by default via `ETHERCALC_DISABLE_ROOM_INDEX=1`. `wrangler.toml [vars]` is still a
  `wrangler deploy`/`wrangler dev` concept and is
  **never** read by `workerd serve`. `scripts/build-workerd-bundle.sh` only bundles `index.js`; runtime
  bindings for Path B come from `config.capnp`'s `fromEnvironment`, with self-host defaults exported by
  `bin/workerd-entrypoint.sh`.
- **Path C (Sandstorm)** is *not* a bare `0.0.0.0` deploy: Sandstorm wraps each grain in its own
  capability-gated access proxy, per-grain TLS (sandcats), and network isolation — i.e. it **is** the
  edge that §13 Q7 deferred to Cloudflare. Most generic self-host gaps are therefore *moot* under
  Sandstorm; only two app-level Sandstorm issues remain (SH-6, SH-7). Sandstorm packaging files live on
  the **`sandstorm` git branch**, not `main`.

### 0.3 Threat model for self-host

Bare Path B binds `0.0.0.0:8000` plaintext with **no** Cloudflare edge: no WAF, no rate limiting,
no DDoS scrubbing, no TLS. Anonymous read/write is the **product core** (CLAUDE.md §6.4, oracle F-03) —
knowing a room URL = ability to read+edit it. That is intentional and must not be broken. The exposure
*beyond* that core is: (a) room discovery (`/_exists/:room` everywhere the gate is off, and full-corpus
room **enumeration** anywhere a D1 room-index binding is present); (b) unbounded **abuse rate** (no
per-source/per-rate limit); (c) cleartext transport.

---

## 1. Already covered — DO NOT re-implement

These shipped in the worker code and **already protect every self-host path** (they are baked into
`workerd/worker/index.js` by `scripts/build-workerd-bundle.sh`, run identically under workerd/Miniflare):

- 25 MiB request body cap on `POST /_`, `PUT/POST /_/:room` — `src/index.ts:55-57` (`hono/body-limit`).
- H-4: multi-cascade cross-room rename restricted to the room's own `<room>.<n>` sub-sheet namespace — `src/routes/rooms.ts`.
- `DELETE /_/:room` routed through `verifyAuth` (gate exists; no-ops only in anonymous mode) — `src/routes/rooms.ts`.
- CSV-injection defang, email CRLF strip, xlsx 200k-cell import cap, HTML-export CSP + `nosniff` (#830) — `src/lib/csv-encode.ts`, `src/lib/email.ts`, `src/lib/xlsx-import.ts`, `src/routes/exports.ts`.
- text/html XSS sanitization: DOMPurify hook injected into the built `static/socialcalc.js` (`scripts/build-assets.sh`, which the Dockerfile runs) + HTMLRewriter on the HTML export.
- DO storage bounding: log ring (`LOG_RING`), alarm-driven chat/audit trim (`CHAT_KEEP`/`AUDIT_KEEP`), audit/chat → D1 offload (self-healing tables), TTL via `ETHERCALC_EXPIRE`, per-room WS connection cap (`MAX_CONN=128`), per-frame byte cap (`MAX_FRAME=1 MiB`) — `src/room.ts`.
- The `/_rooms` / `/_roomlinks` / `/_roomtimes` / `/_exists` 403 gate — **code present**, now keyed on `ETHERCALC_DISABLE_ROOM_INDEX` with legacy `ETHERCALC_CORS` fallback (see SH-1).

**Genuinely absent for self-host (CF-config-only, no worker-code equivalent):** the CF WAF rate-limit
rule (SH-2), CF platform TLS (SH-5) + DDoS, and `workers_dev=false`
(a CF-zone concept, N/A).

---

## 2. Hard constraints (apply to ALL tasks)

1. **Never break anonymous read/write.** No default `ETHERCALC_KEY`; do not add auth gates to
   `PUT`/`POST /_/:room`/WS-execute. Setting a default key would make *every* anonymous edit fail
   (`auth !== hmac(room)`).
2. **Keep CF and self-host on dual paths.** Any config change must not regress the hosted deploy
   (`wrangler.toml` stays authoritative for CF). A self-host default must be overridable
   (operator opt-out), e.g. `${ETHERCALC_DISABLE_ROOM_INDEX:-1}` not a hardcoded `1`.
3. **Worker-code changes are coverage- + mutation-gated.** Any edit under `src/handlers/**`,
   `src/lib/**`, or `src/room.ts` must keep `bun run --cwd packages/worker test:coverage` at **100%**
   (line/branch/function/statement) and not drop the Stryker score below the `break` floor (`92`).
   `src/index.ts` and `src/routes/**` are coverage-excluded but still must not break existing tests.
   **Commit before running `bun run mutation`** — Stryker `inPlace:true` instruments the working tree;
   a `git add` mid-run captures corrupted sources (see the StrykerJS memory note).
4. **British English** in prose/comments. Match surrounding style.
5. **Preserve oracle equivalence.** Config-default flips that change a default response (e.g. `/_rooms`
   now 403) need an oracle-divergence note + test per §13 Q1, the same way `/_roomlinks` was handled.
6. **Don't "fix" by loopback-binding the container.** The Docker container *must* bind `0.0.0.0`
   internally for the compose `ports:` mapping to forward; the host-exposure knob is the compose
   `ports:` publish, not `ETHERCALC_HOST`.

---

## 2.5 Implementation record — 2026-06-11

This is what landed in the main-branch hardening pass. It deliberately protects self-host defaults
without changing the hosted Cloudflare deployment contract or breaking anonymous collaboration.

### Code/config landed

- **Room-index gate:** added `packages/worker/src/lib/room-index-access.ts` and
  `ETHERCALC_DISABLE_ROOM_INDEX`, with explicit flag precedence over the legacy `ETHERCALC_CORS`
  fallback. `/_rooms`, `/_roomlinks`, `/_roomtimes`, and `/_exists/:room` now share that gate.
- **Docker/workerd defaults:** `Dockerfile`, `docker-compose.yml`, `bin/workerd-entrypoint.sh`, and
  `packages/worker/workerd/config.capnp` now default the room-index gate on for self-hosts while keeping
  it operator-overridable with `ETHERCALC_DISABLE_ROOM_INDEX=0`.
- **Hosted safety:** the Cloudflare path remains governed by `wrangler.toml`; hosted keeps the legacy
  `ETHERCALC_CORS="1"` gate. The new explicit flag is additive and is not required for the hosted deploy.
- **Basepath correctness:** workerd now maps operator `ETHERCALC_BASEPATH` into the Worker `BASEPATH`
  binding, and the CLI emits both `BASEPATH` and `ETHERCALC_BASEPATH` for local wrangler dev.
- **Keyless warnings:** CLI and workerd startup now warn when no `ETHERCALC_KEY` is configured on a
  non-loopback bind; Helm notes warn when ingress is enabled without a key.
- **Proxy baseline:** added `docker-compose.proxy.yml` and `deploy/nginx/ethercalc.conf` as the
  internet-facing self-host recipe, with nginx `limit_req`, `limit_conn`, WebSocket forwarding, and a
  25 MiB body limit aligned with the Worker cap.
- **Helm defaults/docs:** `helm/values.yaml` defaults `config.disableRoomIndex: true`, documents nginx
  ingress rate-limit annotations, and renders `ETHERCALC_DISABLE_ROOM_INDEX` explicitly as `"1"` or
  `"0"`. Helm README now calls out key, expiry, TLS, and ingress-rate guidance.
- **CI/smoke coverage:** `scripts/smoke-selfhost.sh` now proves the default Docker image gates the room
  index while preserving anonymous create/read/delete. `scripts/check-helm-hardening.sh` asserts the
  Helm env var and the ingress/key warning; CI runs it in the Helm job.
- **Packaging/docs:** README, CLAUDE.md, Helm chart metadata, and `package.json` now describe standalone
  workerd self-hosting and include the proxy recipe in packaged files.

### Verification run

Passed locally on 2026-06-11:

- `bun run --cwd packages/worker test:coverage`
- `bun run --cwd packages/worker test:workers`
- `bun run --cwd packages/worker typecheck`
- `bun run --cwd packages/worker build:dry`
- `bun run --cwd packages/cli test`
- `bun run --cwd packages/cli test:coverage`
- `bun run --cwd packages/cli typecheck`
- `helm lint ./helm`
- `bash scripts/check-helm-hardening.sh`
- `bash scripts/smoke-selfhost.sh`
- `docker compose config`
- `docker compose -f docker-compose.proxy.yml config`
- `bash -n bin/workerd-entrypoint.sh scripts/smoke-selfhost.sh scripts/check-helm-hardening.sh`
- `git diff --check`
- Docker basepath smoke: `ETHERCALC_BASEPATH=/sheets docker compose up -d ethercalc`, then
  `GET /_from/no-such-template` returned `Location: /sheets/...`.

The only check not completed was an optional `nginx -t` using `nginx:1.27-alpine`; Docker's image pull
path hung in the local credential helper because that image was not already present. The proxy compose
render itself passed.

### Residuals after this pass

- SH-6 and SH-7 remain Sandstorm-branch work.
- SH-8 remains as Helm/container isolation defence-in-depth.
- SH-2's in-Worker token bucket and SH-3's global room-creation quota remain optional follow-ups; the
  shipped baseline is an explicit edge/proxy recipe, not app-layer throttling.

---

## 2.6 Follow-up fix pass — 2026-06-11 (same day, pre-commit adversarial review)

A 38-agent adversarial review of the uncommitted diff confirmed no blockers but surfaced real
should-fixes, all addressed before commit:

- **workerd `fromEnvironment` null semantics (the big one).** An env var that is *unset* in the
  process environment arrives in the Worker as **`null`** — not the empty string the old
  `config.capnp` comment claimed (verified empirically against the pinned workerd 1.20260420.1;
  set-but-empty arrives as `''`). Fixed: the capnp comment, a null guard in
  `room-index-access.ts` (bare `workerd serve` without the entrypoint would otherwise 500 on all
  four gated endpoints), and — surfaced by the same review, pre-existing — `GET /` on
  `docker compose up` 302-redirecting to `/null` because the `ETHERCALC_DEFAULT_ROOM` guard
  checked `!== undefined`. `scripts/smoke-selfhost.sh` now asserts `GET /` returns 200.
- **`ETHERCALC_CORS` parsing change documented as a sensible fix.** The legacy fallback is parsed
  via `flagEnabled` (boolean-string), so `'0'`/`'false'`/`'no'`/`'off'` read as gate-OFF, where the
  pre-2026-06 worker treated any non-empty string as gate-ON. Deliberate (closer to the legacy
  optimist boolean `--cors` flag); cannot affect any shipped config (hosted pins `'1'`; self-host
  layers set the explicit flag). Recorded in `env.ts` and CLAUDE.md §13 Q11.
- **Proxy recipe corrections.** Added `proxy_read_timeout`/`proxy_send_timeout 1h` to the WS
  locations (nginx's 60s default severed idle spreadsheet sockets — no heartbeat on either end);
  split the single `limit_conn` zone into WS (100) vs HTTP (20) budgets so long-lived tabs behind
  one NAT IP cannot starve page loads; made the HTTPS path followable (commented 443 `ports:`
  mapping in `docker-compose.proxy.yml`, modern `http2 on;` syntax, in-repo `deploy/nginx/certs/`
  with gitignored contents); removed `ETHERCALC_BASEPATH` from the proxy compose (the bundled
  config does no prefix-stripping, so a basepath behind it breaks links). `nginx -t` validated
  during review (with an `--add-host` stub for the upstream name).
- **CLI.** `ETHERCALC_BASEPATH` is now inherited from the environment like `ETHERCALC_KEY`
  (README env table holds on the CLI path); README notes that `--var` forwarding makes values
  ps-visible locally — use `.dev.vars` for secrets on shared machines.
- **Packaging/docs.** Helm chart version bumped to 0.2.0 (behaviour-changing defaults);
  CLAUDE.md synced (Miniflare→workerd sweep completed in §1.1/§9/§13 Q5, new §13 Q11 decision row,
  §14 session entry).

~~Deferred as optional follow-ups~~ All three landed later the same day alongside SH-8:
`scripts/smoke-proxy.sh` (stubbed `nginx -t` + full proxy-compose stack + WS-upgrade-through-nginx
check, wired into the CI `build-selfhost` job), an `ETHERCALC_DISABLE_ROOM_INDEX=0` opt-out reboot
leg and a DELETE→404 assertion in `scripts/smoke-selfhost.sh`, plus route-level 403 tests for
`/_roomlinks`/`/_roomtimes` and a keyless-warning suppression assertion in
`scripts/check-helm-hardening.sh`. Released as `0.20260611.1` (Docker Hub + npm).
**Do not use the `0.20260611.0` image tag**: it crashes under plain `docker run` (anonymous
volume) — the entrypoint created `/data/do` as root before the privilege drop and the ownership
check keyed on `/data`, which anonymous/named volumes already initialise as `bun`-owned. Fixed in
`.1` by keying the check on the deepest dir plus an anonymous-volume smoke leg.

---

## 3. Tasks (prioritized)

Priority key: **SHOULD-FIX** = close before recommending self-host for internet-facing use;
**NICE-TO-HAVE** = defense-in-depth / polish. (The audit surfaced no true BLOCKER for self-host —
the worst item, enumeration, is a confidentiality/discovery leak, not a new write primitive.)

---

### SH-1 — Default room-enumeration gating ON for self-host  ·  SHOULD-FIX · config

**Gap (verified real; implemented on `main`).** The 403 gate at `src/routes/rooms.ts` —
`/_rooms` (`~:104`), `/_roomlinks` (`~:112`), `/_roomtimes` (`~:124`), `/_exists/:room` (`~:164`) —
used to fire only when `c.env.ETHERCALC_CORS` was truthy. Self-host left it empty/falsy, so all four were
anonymously reachable out of the box. Docker/workerd currently has no `DB` binding, so `/_rooms` and
`/_roomtimes` short-circuited to empty bodies there; the full-corpus directory risk applies when a D1
index binding is present (hosted/Miniflare/any future self-host DB binding). `/_exists/:room` was still
a live existence oracle on Path B.

Confirmed-open per path:
- **Path B docker-compose:** now exports `ETHERCALC_DISABLE_ROOM_INDEX: "${ETHERCALC_DISABLE_ROOM_INDEX:-1}"`.
- **Path B Dockerfile/workerd:** `Dockerfile` now sets `ETHERCALC_DISABLE_ROOM_INDEX=1`, and
  `config.capnp` reads it from the process env.
- **Helm:** `helm/values.yaml` now defaults `config.disableRoomIndex: true`, and
  `deployment.yaml` renders the env var explicitly as `"1"` or `"0"`.
- **Path A (CLI):** *already protected* (inherits `wrangler.toml` `[vars]`). Don't touch.

**Fix (do ALL self-host config layers — a single layer is incomplete):**
- `docker-compose.yml` → `ETHERCALC_DISABLE_ROOM_INDEX: "${ETHERCALC_DISABLE_ROOM_INDEX:-1}"`.
- `Dockerfile` → add `ETHERCALC_DISABLE_ROOM_INDEX=1` to the ENV block as the image default.
- `packages/worker/workerd/config.capnp` → give the binding a default. `fromEnvironment` has no
  inline default in capnp; the clean approach is for `bin/workerd-entrypoint.sh` to
  `export ETHERCALC_DISABLE_ROOM_INDEX="${ETHERCALC_DISABLE_ROOM_INDEX:-1}"` before `exec workerd serve`
  (single choke-point for Docker/bare workerd; Sandstorm branch invokes workerd directly and needs its
  own branch edit).
- `helm/values.yaml` → `config.disableRoomIndex: true`, and have `deployment.yaml` emit
  `ETHERCALC_DISABLE_ROOM_INDEX: "0"` explicitly when disabled (so "off" is unambiguous, not just
  "unset"). Update `helm/README.md` to document the new knob.

**Design note implemented.** `ETHERCALC_CORS` used to overload two concerns: permissive CORS headers and
the enumeration 403 gate. The Worker already emits CORS headers unconditionally for embeds, so `main`
now has a dedicated `ETHERCALC_DISABLE_ROOM_INDEX` gate. `ETHERCALC_CORS` is still honoured as a
fallback for hosted/back-compat.

**Constraints.** §2.2 (overridable default), §2.5 (oracle note — `/_rooms` etc. now 403 by default on
self-host configs; the CF oracle already runs with CORS=1 so no oracle delta there).

**Acceptance.**
- `docker compose up` with no env overrides → `curl http://localhost:8000/_rooms` returns **403**
  (and `/_roomlinks`, `/_roomtimes`, `/_exists/x`).
- Setting `ETHERCALC_DISABLE_ROOM_INDEX=0 docker compose up` → endpoints return data/empty index bodies
  (opt-out works).
- `helm template` with default values renders `ETHERCALC_DISABLE_ROOM_INDEX=1` (or `=0` explicitly) in
  the Deployment.
- `bin/ethercalc` path unchanged (still gated).

**Tests.** `scripts/smoke-selfhost.sh` now asserts `/_rooms → 403` on a default boot, and
`scripts/check-helm-hardening.sh` asserts the Helm env var + ingress warning. Worker tests cover the
new flag parser and the legacy fallback.

---

### SH-2 — Self-host abuse-prevention layer (the §13 Q7 gap)  ·  BASELINE DONE on `main` · docs (+ optional code)

**Gap (verified real).** There is **no** application-layer rate limiting anywhere — a repo grep for
`rate.?limit|throttle|429|token.?bucket|x-forwarded-for|cf-connecting-ip` over `packages/worker/src`
returns **only** the comment at `src/room.ts` ("real rate limiting at the edge", §13 Q7). The shipped
per-room caps (`MAX_CONN=128`, `MAX_FRAME`, 25 MiB body limit, storage trims) bound *per-room /
per-request* blast radius but **not request frequency or per-source volume**: an attacker spreads load
across unlimited distinct rooms, hammers CPU-heavy exports (`/:room.xlsx|ods|fods` — per-request SheetJS
+ SocialCalc recalc), and churns WS connects. §13 Q7 deferred *all* abuse-prevention to the CF
platform, which is absent for Path A/B.

**Chosen baseline on `main`: reverse-proxy-required, documented.** §13 Q7 has no self-host
answer inside the Worker. This pass did not add an in-Worker limiter; it shipped the operator edge
recipe instead:

- `docker-compose.proxy.yml` + `deploy/nginx/ethercalc.conf` add nginx in front with `limit_req`,
  `limit_conn`, WebSocket forwarding, and `client_max_body_size 25m` aligned to the app cap.
- Helm ships commented nginx-ingress rate-limit annotations in `helm/values.yaml` and documents them in
  `helm/README.md`.
- README now states that internet-facing self-hosts need a TLS-terminating, rate-limiting proxy.
- **(Optional, opt-in) In-Worker token bucket.** A lightweight per-IP limiter keyed on
  `CF-Connecting-IP` / `X-Forwarded-For`, **gated behind an env flag** (e.g. `ETHERCALC_RATELIMIT=…`),
  default off (so CF deploys and trusted LANs are unaffected). If built: it's worker code → 100%
  coverage + mutation gates apply; put the pure logic in `src/lib/` and the middleware wiring in
  `src/index.ts` (coverage-excluded). Note this revisits §13 Q7 — record the decision in CLAUDE.md.

**Constraints.** §2.1 (don't gate anonymous writes themselves — limit *rate*, not *access*),
§2.3 (if code, gates apply).

**Acceptance.** A documented, runnable proxy recipe exists; full flood demonstration remains an
operator/integration exercise. If a later in-Worker limiter is added, it must be off by default and
verified on/off by tests.

**Depends on:** none, but pairs naturally with SH-5 (the same proxy terminates TLS).

---

### SH-3 — Bound room *count* / recommend `ETHERCALC_EXPIRE`  ·  DOCS DONE on `main` · docs (+ optional code)

**Gap (verified real, subset of SH-2).** Per-room storage is bounded, but **room count is not**:
`generateRoomId()` lets any anonymous client mint unlimited rooms (`POST /_`, `/_new`,
`/_from/:template`, `PUT /_/:room`), each a fresh `RoomDO` SQLite. With `ETHERCALC_EXPIRE` unset
(the default everywhere — `docker-compose.yml:39`, `helm/values.yaml:83`, `config.capnp:90` empty;
`room.ts` `parseExpireMs` → `null` → alarm skips TTL, "rooms live forever"), this is a slow
disk/PVC-exhaustion vector (Helm PVC is 10Gi, single replica, `Recreate`).

**Fix.**
- **Docs (cheap, do first):** recommend setting `ETHERCALC_EXPIRE` (seconds) for untrusted/public
  instances, in README self-hosting + `helm/README.md`. It already works end-to-end (the alarm TTL is
  shipped) — only the default/guidance is missing.
- **(Optional code) Global room-creation quota.** A real defense is a per-deployment room-count or
  creation-rate cap (TTL only bounds *steady-state*, not a burst). This overlaps SH-2's limiter; if SH-2
  builds the in-Worker limiter, extend it to cover `POST /_`/`/_new`. Worker code → gates apply.

**Acceptance.** README + helm docs recommend `ETHERCALC_EXPIRE` with a 30-day example; no global
room-creation quota has been added yet.

---

### SH-4 — Startup security warning when `ETHERCALC_KEY` is unset  ·  DONE on `main` · small-code

**Gap (verified real, but the *behavior* is by-design).** Keyless = anonymous mode: `verifyAuth`
(`src/lib/auth.ts`) returns `true` for any non-`'0'` auth when no key is set, so `DELETE /_/:room`
(`routes/rooms.ts`) and WS `stopHuddle` (`lib/ws-handlers.ts`) let any visitor wipe any room. This is the
documented anonymous contract (no worse than legacy; not separable from anonymous-write, which is the
core) — so the fix is **not** a gate, it's **operator awareness**.

**Fix implemented.** Emit a one-line security warning on startup when `ETHERCALC_KEY` is empty **and** the bind is
non-loopback, on both launch paths (plumbing already exists):
- CLI: `packages/cli/src/map.ts` emits a `warnings[]` stderr warning unless `--key` or inherited
  `ETHERCALC_KEY` is present, or the bind is loopback.
- Docker/workerd: `bin/workerd-entrypoint.sh` emits a guarded warning.
- Helm: `NOTES.txt` emits a fail-loud block when `secrets.key == ""` **and** `ingress.enabled`.

**Constraints.** §2.1 — warn only; do not change default behavior.

**Acceptance.** `docker compose up` with no key prints the warning once at boot; setting a key suppresses
it. No behavior change otherwise.

---

### SH-5 — TLS guidance into the self-hosting docs + sample proxy  ·  DONE on `main` · docs

**Gap (low-impact / partly covered).** `config.capnp` socket is `http = ()` (cleartext); the bind is
`0.0.0.0` (`bin/workerd-entrypoint.sh`, `Dockerfile`); `bin/ethercalc --keyfile/--certfile` are
*silently downgraded* to a stderr warning (`packages/cli/src/map.ts`). This is the standard
app-server-behind-proxy pattern (not a code defect), and README **already** says "terminate TLS at a
reverse proxy" — but that note lives in the **CLI** section, not the **Docker self-hosting** quickstart,
so Path B operators miss it.

**Fix implemented.** Move/duplicate the TLS-at-proxy guidance into the self-hosting section; ship the
sample proxy compose from SH-2 (it terminates TLS too); note that `ports: "127.0.0.1:8000:8000"` is the
right knob when a *local* proxy fronts the container (not `ETHERCALC_HOST`).

**Acceptance.** A self-hosting reader reaches the TLS guidance without leaving the Docker section.

---

### SH-6 — Honor (or remove) the Sandstorm viewer role  ·  SHOULD-FIX (Sandstorm-scoped) · small-code · `sandstorm` branch

**Gap (verified real, low severity, Sandstorm only).** `sandstorm-pkgdef.capnp` `bridgeConfig` declares
a `modify` permission with editor/viewer roles, but the worker **never reads** the
`X-Sandstorm-Permissions` / `X-Sandstorm-User-Id` headers and runs keyless, so every grain-authorized
caller gets full read+write+**delete**. A user Sandstorm shares as read-only **"viewer" can still edit,
DELETE, and overwrite** — the declared viewer role is cosmetic/unenforced.

**Fix (pick one).**
- **(Better) Enforce it:** have the worker honor the Sandstorm permission header — treat absence of
  `modify` as view-only by mapping to the existing `auth='0'` view-only path (which `verifyAuth` already
  hard-rejects). This is worker code (`src/` — `index.ts`/middleware + the auth/WS gate); 100% coverage +
  mutation gates apply. Reads a Sandstorm-only header, so guard it behind a Sandstorm/env signal so it's
  inert on CF/Docker.
- **(Cheaper) Stop promising it:** drop the viewer role from `bridgeConfig` so the Sandstorm UI never
  offers a read-only share it can't enforce. Config-only on the `sandstorm` branch.

**Acceptance.** Either a grain "viewer" is provably blocked from write/DELETE, or the UI no longer offers
the viewer role.

---

### SH-7 — Disarm the Sandstorm migrate token after first-load  ·  NICE-TO-HAVE (Sandstorm) · small-code · `sandstorm` branch

**Gap (verified real, low severity).** `run_grain.sh` exports a **fixed, public**
`ETHERCALC_MIGRATE_TOKEN="sandstorm-grain-local"` *unconditionally*, leaving `PUT /_migrate/seed/:room`,
`/_migrate/bulk-index`, `/_migrate/snapshot-chunk/:room` armed for the grain's lifetime as a
known-bearer overwrite primitive (its own comment concedes it's "defense-in-depth, not the primary
isolation"). Bounded by the grain ACL, but unnecessary post-migration.

**Fix.** Set `ETHERCALC_MIGRATE_TOKEN` only for the one-time `ethercalc migrate` subprocess (or unset it
after the `.migrated` sentinel is written), so the seed routes return 404 (`migrate-auth.ts` "disabled")
during normal operation.

**Acceptance.** After first-load, `PUT /_migrate/seed/x` in a grain returns 404.

---

### SH-8 — Helm pod/container hardening  ·  DONE on `main` (2026-06-11) · config

**Gap (low-impact — container-isolation defense-in-depth, orthogonal to the anonymous-abuse surface).**
`helm/values.yaml` left `podSecurityContext:{}` / `securityContext:{}` empty; the Dockerfile had
no `USER` (oven/bun base runs as **root**). A default `helm install` yielded a root pod, writable rootfs,
full caps, `allowPrivilegeEscalation` defaulting true, no seccomp.

**Fix implemented.**
- `helm/values.yaml` ships restricted defaults: `runAsNonRoot: true` + uid/gid/fsGroup 1000 +
  `seccompProfile: RuntimeDefault` (pod), `allowPrivilegeEscalation: false` +
  `capabilities: {drop: [ALL]}` + `readOnlyRootFilesystem: true` (container).
  `deployment.yaml` mounts an `emptyDir` at `/tmp`.
- The `readOnlyRootFilesystem` blocker is gone at the source: the entrypoint no longer writes
  `config.runtime.capnp` into the app dir — the socket bind is overridden via
  `workerd serve --socket-addr http=$HOST:$PORT` instead, so nothing touches the rootfs at startup.
- **Docker keeps no `USER` directive deliberately**: Linux `docker compose` bind mounts arrive
  root-owned (and existing deployments' `./ethercalc-data` is root-owned from older images), so the
  entrypoint starts as root, chowns `$DATA_DIR` once if mismatched, then **drops to the
  unprivileged `bun` user via `setpriv`** before exec'ing workerd. The server process is never
  root; upgrades stay seamless. `ETHERCALC_RUN_AS_USER` overrides the target user. Under
  Kubernetes the chart's `runAsNonRoot` skips the drop branch entirely (fsGroup makes the PVC
  writable). `/data` is also pre-owned by `bun` at image build so named volumes initialise writable.
- `scripts/check-helm-hardening.sh` asserts the restricted render (and that the keyless-ingress
  warning is suppressed when a key is set). NetworkPolicy template not added (per the audit: it
  changes *who* can reach the anonymous surface, not *what* it exposes).

**Acceptance.** `helm template` renders a restricted `securityContext`; the container's workerd
process runs as uid 1000 on both Docker and Kubernetes paths.

---

### SH-9 — Helm fail-loud when key empty + ingress enabled  ·  DONE on `main` · docs

**Gap (real, bounded — ingress defaults off).** `helm/values.yaml` `key: ""` → anonymous mode;
`NOTES.txt` treats the key as routine rotation, with no alarm that an empty key **plus** an enabled
ingress = a world-writable, anonymously-wipeable instance on the network with no edge.

**Fix implemented.** Add a `NOTES.txt` warning block, e.g.
`{{- if and .Values.ingress.enabled (not .Values.secrets.existingSecret) (not .Values.secrets.key) }}`,
warning the deploy is currently world-writable with no edit-gate. Template-only; no contract change.

**Acceptance.** `helm install --set ingress.enabled=true` with no key prints the warning.

---

### SH-10 — Wire `ETHERCALC_BASEPATH` on the Docker path  ·  DONE on `main` · config

**Gap (correctness bug, now fixed).** The CLI accepts `--basepath`/`ETHERCALC_BASEPATH` and docker-compose
forwards it, but the worker reads `BASEPATH` (not `ETHERCALC_BASEPATH`). `config.capnp` now maps
`ETHERCALC_BASEPATH` from the process env into the Worker `BASEPATH` binding, and the CLI maps
`--basepath` to both `BASEPATH` and the legacy mirror env var.

**Fix.** Added `(name = "BASEPATH", fromEnvironment = "ETHERCALC_BASEPATH")` to `config.capnp`.

**Acceptance.** `ETHERCALC_BASEPATH=/sheets docker compose up` serves correctly under `/sheets`.

---

## 4. Verification / CI additions (do alongside the tasks)

- **`scripts/smoke-selfhost.sh`**: assert `/_rooms`, `/_roomlinks`, `/_roomtimes`, `/_exists/x` all
  return **403** on a default `docker compose up` (catches SH-1 regressions); assert `/_health` 200 and a
  create→read→delete round-trip still works.
- **Helm**: a `helm template` assertion (or `helm unittest`) that the default render sets
  `ETHERCALC_DISABLE_ROOM_INDEX` and (when added) the `securityContext`.
- **CI nightly** (CLAUDE.md §11.2): consider a job that boots the self-host image and curls the
  enumeration endpoints to keep the safe default from silently regressing.
- Any **worker-code** task (SH-2 limiter, SH-6 header enforcement) → keep
  `bun run --cwd packages/worker test:coverage` at 100% and `bun run --cwd packages/worker mutation`
  ≥ `break` (commit first — see §2.3).

---

## 5. Explicitly OUT of scope (do NOT do)

- **Do not** set a default `ETHERCALC_KEY` or add auth to `PUT`/`POST`/WS-execute — breaks anonymous
  collaboration (the product core).
- **Do not** flip the container's internal `ETHERCALC_HOST` to `127.0.0.1` — breaks the documented
  `docker compose up` (the compose `ports:` publish is the correct host-exposure knob).
- **Do not** bundle TLS into workerd — TLS termination is an edge/proxy responsibility.
- **Do not** gate the destructive verbs by default — diverges from the documented anonymous semantics;
  warn instead (SH-4).

---

## 6. One-glance priority table

| ID | Title | Priority | Effort | Surfaces / key files |
|----|-------|----------|--------|----------------------|
| SH-1 | Default `ETHERCALC_DISABLE_ROOM_INDEX=1` for self-host | DONE on `main` | config | `docker-compose.yml`, `Dockerfile`, `config.capnp`+entrypoint, `helm/values.yaml` |
| SH-2 | Self-host rate-limit / abuse layer | BASELINE DONE on `main` | docs (+opt code) | proxy compose/nginx, `helm/values.yaml`, README; opt `src/lib/`+`src/index.ts` |
| SH-3 | Room-count bound / recommend `ETHERCALC_EXPIRE` | DOCS DONE on `main` | docs (+opt code) | README, `helm/README.md`; opt worker code |
| SH-4 | Startup warning when no `ETHERCALC_KEY` | DONE on `main` | small-code | `bin/workerd-entrypoint.sh`, `packages/cli/src/`, `NOTES.txt` |
| SH-5 | TLS guidance into self-hosting docs + sample proxy | DONE on `main` | docs | README, sample compose |
| SH-6 | Enforce/remove Sandstorm viewer role | SHOULD-FIX (SS) | small-code | `sandstorm` branch + worker auth/WS |
| SH-7 | Disarm Sandstorm migrate token post-first-load | NICE (SS) | small-code | `run_grain.sh` (`sandstorm` branch) |
| SH-8 | Helm pod securityContext / non-root | DONE on `main` | config | `helm/values.yaml`, `Dockerfile`, entrypoint `setpriv` drop |
| SH-9 | Helm fail-loud on empty key + ingress | DONE on `main` | docs | `helm/templates/NOTES.txt` |
| SH-10 | Wire `ETHERCALC_BASEPATH` on Docker path | DONE on `main` | config | `config.capnp`, CLI map |

**Remaining suggested order:** Sandstorm branch SH-6/SH-7 → optional in-Worker limiter /
room-creation quota if the proxy baseline proves insufficient.

---

*Generated from a verified self-host audit on 2026-06-11. Line numbers are audit hints; confirm before
editing. Sandstorm tasks (SH-6/SH-7) target the `sandstorm` branch.*
