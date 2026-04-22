# EtherCalc TypeScript Rewrite — Ultraplan

> **Status:** near-complete · all §13 questions answered · **Owner:** Audrey Tang · **Started:** 2026-04-19
>
> This file is `CLAUDE.md` so it auto-loads into every Claude Code session. It is the durable plan-of-record for rewriting EtherCalc in modern TypeScript on the Cloudflare fullstack (Hono + Workers + Durable Objects + D1 + KV + R2), locally runnable via Miniflare, and also self-hostable without a Cloudflare account via `docker compose up`. 100% line/branch/function/statement coverage is enforced in CI on gated packages.
>
> **How to use this doc:** §1 is the contract. §13 is the canonical decision log — do not re-ask. §8 lists what's still open. §14 is the session log for context continuity. Update §14 when you finish work; edit other sections in place when reality diverges.

---

## 1. North Star

### 1.1 Done definition

Ship a greenfield TypeScript implementation of EtherCalc that:

1. **Passes a golden-fixture oracle-equivalence suite** against the current `main` branch — every §6.1 HTTP endpoint (identical status/headers/body for deterministic formats, structural equivalence for HTML/XLSX/ODS), every §6.2 WS message, every §6.3 Redis key pattern mapped to the new storage layer with equivalent semantics. Small allow-list of "sensible fixes" (§13 Q1) documented in §6.1.
2. **Runs locally under Miniflare** with the full feature set — DO WebSockets, D1 snapshots, KV indexes, R2 — no Redis/Node dependency.
3. **Deploys to Cloudflare Workers** via `wrangler deploy`.
4. **Is self-hostable** via `docker compose up` (Miniflare container, persistent volume, no CF account needed — §13 Q5).
5. **Maintains 100% coverage** on gated packages in CI. Any PR dropping a metric below 100 fails.
6. **Preserves the public HTTP API** byte-for-byte where deterministic (minus sensible fixes).
7. **Client speaks new WS protocol** (raw JSON). Legacy `/socket.io/*` shim retained indefinitely for external embeds (§13 Q4).
8. **`multi/` ported to React 18 + TypeScript** (§13 Q2), preserving `/=:room` URL scheme.
9. **`ethercalc` CLI kept** as a thin wrapper around `wrangler dev` / Miniflare (§13 Q6).

### 1.2 Explicit non-goals

- Rewriting SocialCalc itself.
- Changing the spreadsheet wire format.
- Bug-for-bug preservation as absolute rule — sensible fixes allowed per §13 Q1 (default still leans preservation).
- New user-facing features.
- Multi-region / strong consistency upgrades.
- OAuth/Gmail email sending (replaced by `send_email` binding, §13 Q3).
- Dead-platform configs (`snapcraft`/`dotcloud`/`openshift`/`stackato`).
- `webworker-threads` backend (DO isolates cover the sandboxing property).
- Application-layer rate limiting (relies on CF platform layer, §13 Q7).

---

## 2. Glossary

- **Oracle** — current `main` branch on Node/Bun + Redis; source of truth for semantics.
- **Target** — the new TypeScript Worker implementation.
- **Room** — spreadsheet / page, identified by a URL-safe string.
- **Multi-sheet** — URL prefix `/=:room` routing; sub-sheets per row of a TOC sheet.
- **DO** — Durable Object; one per room.
- **Snapshot** — SocialCalc save string (multi-section text blob).
- **Log** — commands since last snapshot; periodically folded back.
- **Audit** — append-only log of all commands (never folded).
- **ECell** — "editing cell"; each user's cursor position.

---

## 3. Target Architecture (Cloudflare fullstack)

### 3.1 Component map

| Concern                       | Old                                              | New                                                           |
| ----------------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| HTTP router                   | `zappajs` on Express 3                           | **Hono** on Workers                                           |
| Static assets                 | `express.static`                                 | **Workers Assets** (ASSETS binding)                           |
| Live spreadsheet state        | `SC[room]` global + `vm.createContext`           | **Durable Object** `RoomDO` — one per room                    |
| Persistent snapshot/log/audit | Redis `snapshot-*`, `log-*`, `audit-*`, `chat-*` | **DO storage** (primary) + **D1** mirror for cross-room query |
| Room index                    | `KEYS snapshot-*`                                | **D1** `rooms` table + optional KV hot path                   |
| Realtime transport            | socket.io 0.9                                    | DO-hosted **WebSocket** (hibernation API), raw JSON protocol  |
| Cron                          | External cron pinging `/_timetrigger`            | **Cron Triggers** invoking the Worker                         |
| Email                         | `nodemailer` + gmail xoauth2                     | **`send_email` binding** or stub                              |
| Secrets                       | CLI flag `--key`                                 | Worker secret `ETHERCALC_KEY` **and** CLI `--key` (§13 Q6)    |
| Self-host                     | `docker-compose.yml` (Node + Redis)              | Miniflare image (§13 Q5)                                      |

### 3.2 Request flow

```
Browser  ──HTTP/WS──>  Worker (Hono)
                         │
                         ├── static: Workers Assets
                         ├── stateless HTTP (rooms list, exists): D1
                         └── per-room (R/W, WS, exports):
                                 env.ROOM.get(idFromName(room)) ──> RoomDO
                                     ├── in-memory SocialCalc.SpreadsheetControl
                                     ├── state.storage (snapshot/log/audit/chat/ecell)
                                     ├── state.acceptWebSocket(ws) per client
                                     └── scheduled() — fold log into snapshot, mirror to D1
```

### 3.3 Data model

**DO storage (per-room)** — authoritative:
- `snapshot` — SocialCalc save string (versioned v2: prefix; reader falls back to v1)
- `log:<seq>` — indexed command strings
- `audit:<seq>` — same pattern, never truncated
- `chat:<seq>` — same pattern
- `ecell:<user>` — map of user → cell coord
- `meta:updated_at` — Date.now()

**D1**:
```sql
CREATE TABLE rooms (
  room        TEXT PRIMARY KEY,
  updated_at  INTEGER NOT NULL,
  cors_public INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE cron_triggers (
  room      TEXT NOT NULL,
  cell      TEXT NOT NULL,
  fire_at   INTEGER NOT NULL,
  PRIMARY KEY (room, cell, fire_at)   -- compound PK preserves legacy comma-list semantics
);
```

### 3.4 SocialCalc inside a Durable Object

`packages/socialcalc-headless/` wraps SocialCalc (loaded via Vite `?raw` import) through a `new Function(...)` eval scaffold, with DOM stubs (`Node`, `document`, `window`, `navigator`) and a synchronous `setTimeout` shim. Plan A green; Plans B/C not needed. Full details in §16.A.

---

## 4. Oracle strategy

### 4.1 Equivalence

For each recorded scenario replayed against the target:
- **HTTP**: same status, `Content-Type`, body (exact bytes for deterministic; structural equality after normalization for HTML/XLSX/ODS).
- **DO state**: after each scenario, dump keys under the room and compare against oracle's Redis dump (normalized).
- **WebSocket transcript**: `(direction, timestamp_delta, message)` tuples; same sequence modulo timestamps.

### 4.2 Normalization rules

- Drop headers: `Date`, `Server`, `ETag`, `X-Powered-By`, `Connection`, `Accept-Ranges`, `Cache-Control`, `Content-Length`. `Last-Modified` semi-volatile → relax via `re:<regex>` matcher.
- **HTML** (`packages/oracle-harness/src/html-canonical.ts`): parse via linkedom; drop comments, whitespace-only text, `id` matching `/^(SocialCalc|[a-f0-9-]{32,})/`, referrer attributes pointing at dropped ids (`for`, `aria-labelledby`, `aria-controls`, `aria-describedby`, `headers`, `form`, `list`, `href="#volatileId"`). Attributes sorted alphabetically (note: linkedom's `setAttribute` prepends — sort reverse-alpha before re-insertion).
- **XLSX** (`packages/oracle-harness/src/zip-canonical.ts`): unzip via fflate, sort entries, canonicalize XML. Drop `docProps/core.xml` (`dcterms:created`, `dcterms:modified`, `cp:lastModifiedBy`, `cp:revision`) and `docProps/app.xml` (`AppVersion`, `TotalTime`).
- **ODS**: same pipeline; `meta.xml` drops `meta:creation-date`, `dc:date`, `meta:editing-duration`, `meta:editing-cycles`, `meta:generator`, `dc:creator` (depth-walk under `<office:meta>`).
- **SocialCalc save**: ignore `version:…` line and metadata-section ordering; compare `sheet:`/`cell:` lines exactly.
- **CSV/JSON/Markdown**: exact bytes.
- Socket IDs, timestamps, UUIDs, HMACs: `__PLACEHOLDER__` during comparison.

---

## 5. Testing strategy & coverage

### 5.1 Two vitest configs per package

- `vitest.config.ts` — `@cloudflare/vitest-pool-workers`, test files `*.test.ts`. **No coverage gate** (neither istanbul nor v8 reliably track hits through the workerd bundle).
- `vitest.node.config.ts` — Node env, test files `*.node.test.ts`. **100% coverage gate** on `src/handlers/**`, `src/lib/**`, `src/room.ts`.

`src/index.ts` (Hono glue) and workers-only shims like `src/lib/ws-upgrade.ts` are excluded from the Node gate.

### 5.2 Coverage — known limitation

**`@cloudflare/vitest-pool-workers` does not play well with istanbul or v8 coverage.** v8 reports 0% because workerd lacks Node's inspector; istanbul misses functions routed through Hono's bundled router. The two-config split above is the workaround; side-effect is handlers stay pure (DI for clocks, no direct env access) which aids testability.

### 5.3 Mutation testing — REQUIRED

Per-package `stryker.conf.json` with a `break` threshold pinned to the measured floor. PRs fail a fast `mutation-gate` CI job that runs Stryker only on packages whose `src/` changed. To raise a floor: close mutants (see `docs/MUTATION_REPORT.md` top-gaps), re-run `bun run mutation`, bump `break` in the same PR. Nightly runs the full matrix.

### 5.4 Test file naming

- `*.test.ts` — workers-pool integration tests.
- `*.node.test.ts` — pure-logic unit tests, coverage-gated.

---

## 6. Surface inventory

### 6.1 HTTP endpoints

`BASEPATH` is a prefix (default empty). `KEY` gates edit/view if set. `CORS` toggles headers + disables `_rooms*`.

| Method | Path                              | Content-Type req/res                                     | Notes                                                                                                                         |
| ------ | --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/`                               | → `index.html`                                           |                                                                                                                               |
| GET    | `/_start`                         | → `start.html`                                           |                                                                                                                               |
| GET    | `/etc/*`, `/var/*`                | 404 `Content-Type: text/html; charset=utf-8`             | Explicit block; legacy Express default is `text/html`.                                                                        |
| GET    | `/favicon.ico`                    | `image/vnd.microsoft.icon`                               | **Sensible-fix** (§13 Q1) — legacy served as `text/html`.                                                                     |
| GET    | `/manifest.appcache`              | `text/cache-manifest`                                    | DevMode stub via `DEVMODE=1`.                                                                                                 |
| GET    | `/static/socialcalc.js`           | `application/javascript`                                 | From Workers Assets; external embeds depend on this path (§13 Q8).                                                            |
| GET    | `/static/form:part.js`            | `application/javascript`                                 | Literal colon in path; routed via `/static/:file{form.+\.js}` constrained segment.                                            |
| GET    | `/_new`, `/=_new`                 | 302 → new room (+`/edit` if KEY)                         | Auto-generated uuid.                                                                                                          |
| GET    | `/_timetrigger`                   | `application/json`                                       | Legacy cron endpoint; fires due triggers.                                                                                     |
| GET    | `/_rooms`                         | `application/json`                                       | `403` if CORS.                                                                                                                |
| GET    | `/_roomlinks`                     | `text/html`                                              | **Sensible-fix** (§13 Q1) — legacy emitted JSON body with HTML CT.                                                            |
| GET    | `/_roomtimes`                     | `application/json`                                       | Sorted desc by `updated_at`.                                                                                                  |
| GET    | `/_from/:template`                | 302 → new room                                           | Copies template via DO-to-DO fetch.                                                                                           |
| GET    | `/_exists/:room`                  | `application/json` (**bare** boolean)                    | Per oracle F-05.                                                                                                              |
| GET    | `/:room`                          | → `index.html` (or `multi/index.html` for `=`)           | Redirect to `?auth=0` / `?auth=<hmac>` if `KEY` set.                                                                          |
| GET    | `/:template/form`                 | 302 → `/<room>_<uuid>/app`                               | Uses `/_do/clone`.                                                                                                            |
| GET    | `/:template/appeditor`            | → `panels.html`                                          |                                                                                                                               |
| GET    | `/:room/{edit,view,app}`          | 302 with `?auth=<hmac>&…`                                |                                                                                                                               |
| GET    | `/_/:room`                        | `text/plain; charset=utf-8`                              | SocialCalc save; 404 with empty body if missing.                                                                              |
| GET    | `/_/:room/html`, `/:room.html`    | `text/html`                                              |                                                                                                                               |
| GET    | `/_/:room/csv`, `/:room.csv`      | `text/csv`; `Content-Disposition: attachment`            |                                                                                                                               |
| GET    | `/_/:room/csv.json`, `.csv.json`  | `application/json`                                       |                                                                                                                               |
| GET    | `/_/:room/{ods,fods}`             | `application/vnd.oasis.opendocument.spreadsheet`         |                                                                                                                               |
| GET    | `/_/:room/xlsx`, `/:room.xlsx`    | `application/vnd.openxml….sheet`                         |                                                                                                                               |
| GET    | `/_/:room/md`, `/:room.md`        | `text/x-markdown`                                        |                                                                                                                               |
| GET    | `/_/=:room/xlsx` etc              | multi-sheet export                                       | Merges sub-sheets via TOC.                                                                                                    |
| GET    | `/_/:room/cells`                  | `application/json`                                       | **Unwrapped** `JSON.stringify(sheet.cells)` — legacy shape.                                                                   |
| GET    | `/_/:room/cells/:cell`            | `application/json`                                       | Single cell.                                                                                                                  |
| PUT    | `/_/:room`                        | sc / json / csv / xlsx bodies                            | Returns `201 OK`. Replaces snapshot, clears log, broadcasts `snapshot` WS event.                                              |
| PUT    | `/=:room.xlsx`, `/_/=:room/xlsx`  | xlsx/ods/fods                                            | Multi-sheet import: parses, writes TOC + sub-sheets.                                                                          |
| POST   | `/_/:room`                        | json `{command}` OR text `loadclipboard …` OR xlsx       | Text-wiki filter → multi-cascade rename → loadclipboard enrichment → DO dispatch → `202 {command}`.                          |
| POST   | `/_`                              | same as PUT                                              | `201` + Location; generates `room` if absent.                                                                                 |
| DELETE | `/_/:room`                        | `201 OK`                                                 | Deletes all room keys + D1 row.                                                                                               |

**Bug-for-bug preserved**: `PUT /_/:room` returns `201` (not 200) even when overwriting. `POST /_/:room` empty body → `400 'Please send command'` `text/plain`. `encodeURI(room)` everywhere. `GET /_/:room` missing → `404` empty `text/plain`.

### 6.2 WebSocket message types

Native `WebSocket` at `wss://<host>/_ws/:room?user=<user>&auth=<hmac>`. JSON messages, one per frame.

**Client → server**:

| type         | payload                                | server action                                                                                                      |
| ------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `chat`       | `{room, msg, user}`                    | Append to chat log; broadcast to log-room.                                                                         |
| `ask.ecells` | `{room}`                               | Reply `{type:ecells, ecells, room}`.                                                                               |
| `ask.ecell`  | `{room, user, ecell}`                  | Rebroadcast as catch-all to peers (client polls this on DoPositionCalculations; peers reply with `ecell`).         |
| `my.ecell`   | `{room, user, ecell}`                  | Store `ecell:<user>`.                                                                                              |
| `execute`    | `{room, cmdstr, user, auth, saveundo?}`| Validates auth; rejects `set sheet defaulttextvalueformat text-wiki`; appends log+audit; runs in SC; broadcasts. **`submitform` path**: auto-creates `<room>_formdata` sibling, broadcasts with `include_self: true` (legacy invariant; form clients hang without it). |
| `ask.log`    | `{room, user}`                         | Replies `{type:log, room, log, chat, snapshot}` (or `{type:ignore}` if DB not ready).                              |
| `ask.recalc` | `{room}`                               | Reply `{type:recalc, room, log, snapshot}`. Also called by `RecalcInfo.LoadSheet` for cross-sheet formulas.        |
| `stopHuddle` | `{room, auth}`                         | Validates auth; deletes all room keys + D1 row.                                                                    |
| `ecell`      | `{room, user, ecell, original?, to?, auth}` | Validates auth; broadcasts. **`to?` field preserved** for private-channel routing.                           |

**Server → client**: `log`, `recalc`, `snapshot`, `execute`, `ecells`, `confirmemailsent`, `ignore`, plus fallback-forwarded client messages.

**Auth rules** (§6.4): WS `execute`/`ecell`/`stopHuddle` require `auth === hmac(room)` OR no KEY set; `auth === '0'` is view-only and **must be rejected unconditionally** (identity-HMAC when KEY unset would otherwise make `computeAuth(undefined, '0') === '0'` permissive). `verifyAuth` hard-rejects `'0'` first; if `!key`, short-circuits `true` for any non-'0' auth (matches legacy `src/main.ls:506` semantics). HTTP endpoints do **not** require auth (known weakness; preserve).

### 6.3 Storage keys (legacy Redis, for oracle mapping)

| Key pattern                    | Type | New impl                                                             |
| ------------------------------ | ---- | -------------------------------------------------------------------- |
| `snapshot-<room>`              | str  | DO `snapshot` + D1 mirror on command/snapshot.                       |
| `log-<room>`                   | list | DO `log:<seq>` ordered keys.                                         |
| `audit-<room>`                 | list | DO `audit:<seq>`.                                                    |
| `chat-<room>`                  | list | DO `chat:<seq>` (§13 Q9: D1 mirror beyond DO lifetime).              |
| `ecell-<room>`                 | hash | DO `ecell:<user>`.                                                   |
| `timestamps`                   | hash | D1 `rooms.updated_at`.                                               |
| `cron-list`, `cron-nextTriggerTime` | —    | D1 `cron_triggers` table.                                            |

TTL (`--expire`) implemented via DO `setAlarm` (§13 Q10).

---

## 7. Live compatibility risks

Remaining items worth flagging. Resolved risks are documented in the code; see git history for rationale.

1. **`?raw` Vite imports vs wrangler `[[rules]]` cross-toolchain trap**: wrangler needs `[[rules]] type="Text" globs=["**/SocialCalc.js"]` to bundle the UMD for `wrangler deploy --dry-run`. But when vitest-pool-workers reads `wrangler.configPath`, that same rule gets merged into Miniflare's `modulesRules`, which mangles our Vite `?raw` imports by appending `?mf_vitest_force=Text` and breaking the resolver. Workaround in `packages/worker/vitest.config.ts`: drop `wrangler.configPath`, supply `main` + `miniflare.durableObjects` + `miniflare.assets` inline.

2. **Cross-sheet formula resolution** (`RecalcInfo.LoadSheet`): formulas like `'other-room'!A1` need DO-to-DO fetches. Single-room scenarios are fine; cross-sheet needs wiring through `env.ROOM.get(idFromName(otherRoom)).fetch('/_do/get-save')` before it works end-to-end.

3. **Docker Desktop on macOS/ARM + workerd networking quirk**: `docker compose up` binds 0.0.0.0:8000 inside the container, but Docker Desktop's virtio networking on Apple Silicon returns zero bytes to host curls. Linux CI runners don't reproduce it. Dev-affordance only. If a contributor reports "docker compose up works but curl hangs", answer is "run `bun run --cwd packages/worker dev` directly, or use Linux/WSL".

4. **CLI env vars partially wired**: `ETHERCALC_EXPIRE`, `ETHERCALC_CORS`, `ETHERCALC_BASEPATH` are set by `bin/ethercalc` into Miniflare env, but the worker doesn't fully read them yet. `ETHERCALC_KEY` IS read. Wire the rest as their governing routes mature.

5. **Third-party bundled libs** (`third-party/class-js/`, `third-party/wikiwyg/`, plus jQuery + vex inlined into `static/ethercalc.js`): some are IE-era. Audit before re-bundling under Vite in the client pipeline.

6. **Offline/sessionStorage client behavior** (`SocialCalc.hadSnapshot` flag): client caches last sheet to sessionStorage and restores on reconnect. Port preserves current behavior; revisit if it becomes load-bearing.

7. **`ScheduleSheetCommands` async path**: headless bypasses it with sync `ExecuteSheetCommand`. Fine for HTTP requests. If any command sequence depends on the async scheduler's `cmdend` callback, we'll need to switch. No known case yet.

---

## 8. Phase plan

Phases 0–11 complete (see §14 for merge history). Remaining:

### Phase 3 — Oracle coverage
- [ ] Expand recorded scenarios beyond the stateless 13 to cover each ported endpoint and WS path.
- [ ] Structural equality oracle tests for HTML/XLSX/ODS actually wired to export responses (matchers exist at 100% coverage in `packages/oracle-harness`).

### Phase 8 — Export polish
- [x] csv/csv.json/html/xlsx/ods/fods/md implemented via SocialCalc + SheetJS + pure GFM.
- [x] Multi-sheet xlsx/ods/fods via `parseMultiSheetWorkbook`/`buildMultiSheetWorkbook`/`sanitizeSheetName`.
- [ ] Cross-sheet formula resolution via DO-to-DO fetches (see §7 item 2).

### Phase 11 — Loose ends
- [x] Playwright skeleton at `packages/e2e/` with 10 passing specs.
- [ ] `/:template/form` DO-to-DO clone (currently 503 stub).

### Phase 12 — CI hardening
- [ ] Nightly `wrangler deploy --dry-run --env staging`.
- [ ] Nightly oracle-replay against fresh `origin/main` checkout (catches silent drift).
- [ ] Docs site (Starlight) covering new architecture.

---

## 9. Directory structure (actual)

```
ethercalc/
  CLAUDE.md                 # this file
  bin/ethercalc             # CLI wrapping wrangler dev / Miniflare
  Dockerfile                # Miniflare self-host image
  docker-compose.yml        # self-host compose (§13 Q5)
  assets/                   # curated by scripts/build-assets.sh
  migrations/               # D1 migrations
  packages/
    worker/                 # Hono Worker + RoomDO (D1, KV, R2, cron, send_email)
    socialcalc-headless/    # SocialCalc wrapper for workerd
    shared/                 # cross-package contracts (WS messages, storage keys)
    client/                 # single-sheet UI (Vite + TS)
    client-multi/           # multi-sheet UI (React 18 + Vite)
    oracle-harness/         # record/replay + canonicalizers
    socketio-shim/          # socket.io v0.9 wire-format adapter
    migrate/                # Redis RDB → DO/D1 migration tool
    cli/                    # bin/ethercalc logic
    e2e/                    # Playwright specs
  tests/oracle/             # docker-pinned oracle + recorded fixtures
  scripts/                  # build-assets.sh, smoke-selfhost.sh, ratchet-verify.sh
  docs/MUTATION_REPORT.md   # mutation-score baseline + top-gaps tracker
  .github/workflows/        # ci.yml, nightly.yml
```

Legacy LS/compiled JS (`src/*.ls`, root `*.js`, `multi/`, `Makefile`, `webpack.config.js`, etc.) preserved until Phase 12 sweep for oracle recording.

---

## 10. Protocol & storage mappings

### 10.1 Socket.IO → native WS

- One WS per user per room at `wss://<host>/_ws/:room?user=<user>&auth=<hmac>`.
- Server treats WS as joining `log-<room>` + `user-<user>` implicitly.
- Frame shape: `{"type": "...", ...payload}`, JSON, one message per frame.
- Legacy `/socket.io/*` shim translates packets 1:1: `42["data",{…}]` ↔ `JSON.stringify({…})`.

### 10.2 Redis → DO/D1/KV

| Redis call                                  | New implementation                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET snapshot-<room>`                       | DO `storage.get('snapshot')` / D1 fallback.                                      |
| `SET snapshot-<room>`                       | DO `storage.put('snapshot', …)` + D1 mirror.                                     |
| `LRANGE log-<room>`                         | DO `storage.list({prefix:'log:'})`.                                              |
| `RPUSH log-<room>`                          | DO `storage.put('log:'+padSeq(), value)`.                                        |
| `HGETALL ecell-<room>`                      | DO `storage.list({prefix:'ecell:'})`.                                            |
| `HSET ecell-<room>`                         | DO `storage.put('ecell:'+user, coord)`.                                          |
| `HGETALL timestamps`                        | D1 `SELECT room, updated_at FROM rooms ORDER BY updated_at DESC`.                |
| `KEYS snapshot-*`                           | D1 `SELECT room FROM rooms`.                                                     |
| `EXISTS snapshot-<room>`                    | D1 `SELECT 1 FROM rooms WHERE room=?`.                                           |
| `BGSAVE`                                    | no-op.                                                                           |
| `EXPIRE`                                    | DO `setAlarm(now + ttl)` + alarm handler.                                        |
| `cron-list` / `cron-nextTriggerTime`        | D1 `cron_triggers` table + `SELECT MIN(fire_at)`.                                |

---

## 11. CI / gates

### 11.1 PR gate (`ci.yml`)

1. Install (bun, cached).
2. Lint: eslint, prettier.
3. Typecheck: `tsc --noEmit` per package.
4. Node unit tests + 100% coverage gate (per gated package).
5. Workers-pool integration tests.
6. socialcalc-headless smoke tests.
7. Oracle replay (docker oracle + `wrangler dev --local`).
8. Playwright e2e against `wrangler dev`.
9. `wrangler deploy --dry-run`.
10. `build-selfhost`: build Miniflare image, `docker compose up`, smoke curl `/_health`.
11. `mutation-gate`: Stryker on packages with `src/` changes vs merge-base. Conditionally required.

### 11.2 Nightly

- Stryker full matrix.
- (Pending) Oracle replay against fresh `origin/main`.
- (Pending) `wrangler deploy --dry-run --env staging`.

### 11.3 Branch protection

All core PR-gate jobs required before merge to `main`. `mutation-gate` conditionally required (skips docs-only PRs). No admin bypass on coverage job.

---

## 12. Data migration

`packages/migrate/` — streams rooms out of a legacy EtherCalc deployment into the new worker's `PUT /_migrate/seed/:room` (`src/targets/http.ts`). Two sources are supported:

- **`redis://…`** (`src/sources/redis-source.ts`) — SCAN-paginated RESP client in `src/resp-client.ts` talks to a live Redis/Zedis that has already loaded `dump.rdb`. The server owns decoding; the migrator stays O(1-per-room) regardless of dump size.
- **`file:///path`** or plain `/abs/path` (`src/sources/filesystem-source.ts`) — reads a legacy on-disk dump written by `src/db.ls`'s Redis-unavailable fallback. Auto-detects layout: `dump.json` blob (flat map of legacy Redis keys) or `dump/` directory of per-key `.txt` files. Only snapshot+audit persist in dir mode — legacy keeps log/chat/ecell in-memory only, so those are empty after dir migration (matches what the legacy app itself would show).

**Sandstorm grain first-load migration**: the Sandstorm app ID `a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0` ran the legacy LiveScript EtherCalc with `OPENSHIFT_DATA_DIR=/var` and no Redis, producing `/var/dump/` or `/var/dump.json`. When the grain updates to the new Worker, `run_grain.sh` should invoke `./bin/ethercalc migrate --source file:///var --target http://127.0.0.1:$PORT --token "$ETHERCALC_MIGRATE_TOKEN"` once (idempotent — same-room PUTs overwrite), then start the worker normally. A `.migrated` sentinel in `/var` is an easy way to avoid re-running.

`InMemoryTarget` + `DryRunTarget` cover tests and `--dry-run` previews. 100% coverage on gated files. CLI entry: `./bin/ethercalc migrate --source <url> --target <url> --token <bearer>`.

Snapshot format versioning: new DO snapshots prefixed `v2:`; reader falls back to v1 (raw SocialCalc save) when prefix absent.

---

## 13. Resolved decisions

Canonical record as of 2026-04-19. Do not re-ask. To change a decision, edit it here with the new date and rationale, then update affected sections.

| # | Question | Decision | Affects |
| - | -------- | -------- | ------- |
| 1 | Bug-for-bug preservation? | **No — apply sensible fixes.** Each fix enumerated in §6.1 with an oracle-divergence test. Default still leans preservation; only fix unambiguous bugs (e.g. `/_roomlinks` `text/html` CT vs JSON body). | §1.2, §6.1 |
| 2 | `multi/` React 0.12 UI | **Port to React 18 + TypeScript.** Preserve `/=:room` URL scheme. | §1.1, §9 |
| 3 | Email strategy | **Cloudflare `send_email` binding.** Old gmail-xoauth2 dropped. Tests use stub transport. | §3.1 |
| 4 | Legacy socket.io shim | **Keep indefinitely** (no sunset date). External embeds depend on it. | §3.1 |
| 5 | Docker self-host | **Yes.** Miniflare container with persistent volume; no CF account required. | §1.1, §3.1 |
| 6 | Secrets | **Both.** CLI `--key` for self-host; Worker secret `ETHERCALC_KEY` for CF deploy. | §3.1 |
| 7 | Rate limiting | **None at application layer.** Rely on CF platform / WAF. | §1.2 |
| 8 | `/static/socialcalc.js` | **Keep serving.** External embeds depend on this path. | §6.1 |
| 9 | `chat-<room>` persistence | **Mirror to D1** beyond DO lifetime. | §3.3, §10.2 |
| 10 | Snapshot TTL (`--expire`) | **DO `setAlarm`.** CLI flag honored. | §10.2 |

---

## 14. Session log

Append one entry per session.

| Date       | Phase | Summary                                                                                              | PR      |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------- | ------- |
| 2026-04-19 | 0–11 | **Rewrite largely complete in one sprint.** Highlights: Phase 1 SocialCalc-in-DO prototype green (§16.A). Phase 2–4 scaffolding, assets, stateless routes. Phase 5–6 RoomDO with D1 mirror, command execution, multi-cascade rename via `/_do/rename`+`/_do/install`. Phase 7 native WS + `/socket.io/*` shim. Phase 8 exports (csv/html/xlsx/ods/fods/md via SheetJS + pure GFM + multi-sheet). Phase 9 cron + `send_email`. Phase 10 client + Phase 10b client-multi (React 18 + Radix). Phase 11 Miniflare Docker, `bin/ethercalc` CLI, Playwright e2e, socketio-shim, Redis migration tool. StrykerJS mutation ratchet with per-package floors. ~1150 tests across 9 packages; 100% line/branch/function/statement coverage on gated packages. | many |
| 2026-04-19 | 7.1 | WS handlers extracted from `src/room.ts` to pure `src/lib/ws-handlers.ts` (42 Node tests). Workers-only upgrade glue quarantined in `src/lib/ws-upgrade.ts` (coverage-excluded leaf). `room.ts` back at 100% Node gate. | fd97fb5, fc02f71 |
| 2026-04-20 | 10/11 | **Browser multiplayer smoke — fixed anonymous auth regression.** First full stack-up: `build-assets.sh` → `wrangler dev` → Chrome. `execute` frames silently dropped server-side. Root cause in `verifyAuth`: when `ETHERCALC_KEY` unset, legacy accepts any non-'0' auth, but we were timing-safe-comparing empty string against `computeAuth(undefined, room) === room` and rejecting. Fix: short-circuit `if (!key) return true` after the '0' check. Verified two-tab edit/reload flow. | 72f558c |
| 2026-04-20 | headless | **Swapped socialcalc dep from npm 2.3.0 to `github:audreyt/socialcalc`.** Fork is strict-mode clean (tsgo + Bun port) and already emits `factory.call(root, root)`. `scripts/build.js` drops the ES5 `delete varname` / reserved-`eval` / factory-call rewrites; adds one new wrapper-level transform rewriting `typeof globalThis !== 'undefined' ? globalThis : this` to `this`. Implicit-globals pre-declaration removed — underlying `var`-less assignments fixed upstream. 7/7 headless smoke + 456 worker node + 120 workers-pool all green. | 4af7265 |
| 2026-04-20 | 5.1/7/8 | **Second-wave browser sweep — six behavioral regressions fixed.** (1) WS `execute` didn't mirror D1 `rooms` row → refactored to shared `#applyCommandAndMirror`. (2) `stopHuddle` left D1 row → `#deleteAllAndUnindex`. (3) `ask.ecell` (singular) was dropped by closed-union parser → added `AskEcellClientMessage`/`AskEcellServerMessage` + `handleAskEcell` + client-side `applyAskEcell`. (4) `ecell.to` field stripped by builder → preserved. (5) `client-multi` absolute `/assets/...` URLs 404'd under `/=:room` → `base: '/multi/'`. (6) `/_/:room/cells[/:cell]` not wired in Hono + wrapped JSON shape → unwrapped to legacy `JSON.stringify(sheet.cells)`. Also: `csvToSave` rewritten to paste via `Clipboard` + `CreateSpreadsheetSave`. Mutation floor 92 → 88. ~900 tests, 100% coverage on gated packages. | 85e6fa9, 7eed195, e13c1ea, d19bacb, 17b9aa2, bd004d1 |
| 2026-04-21 | 11b/12 | **Migration is RESP-only; RDB parser removed.** `packages/migrate/` now streams from a live Redis/Zedis via RESP (SCAN + pipelined GET/LRANGE/HGETALL) into the worker's `PUT /_migrate/seed/:room`. Dropped ~3 300 LOC: hand-rolled RDB parser + LZF worker-thread pool + `ChunkedReader` streaming parser + `WranglerTarget` shell-out + all rdb/lzf/extract-rooms/stream tests. CLI surface simplified to `--source redis://…` + `--target http://…` + `--token …` (+ `--dry-run`). `bin/ethercalc migrate` no longer imports `node:worker_threads` / `node:fs`. 100 tests, 100% coverage on migrate; 492 node tests, 100% on worker. Also added `PUT /_migrate/seed/:room` route + `POST /_do/seed` handler on worker side; gated by `env.ETHERCALC_MIGRATE_TOKEN` (unset → 404). Wiped 5.2 GB halfway-migrated Miniflare store. | (this commit) |
| 2026-04-22 | 12 | **Filesystem source for first-load Sandstorm migration.** Added `packages/migrate/src/sources/filesystem-source.ts` to enumerate rooms out of a legacy `src/db.ls`-written on-disk dump (what EtherCalc falls back to when no Redis is reachable — notably the Sandstorm grain, app id `a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0`, which sets `OPENSHIFT_DATA_DIR=/var`). Auto-detects `dump.json` (flat map of legacy Redis keys) vs `dump/` directory (per-key `snapshot-*.txt` raw + `audit-*.txt` with legacy `\\n/\\r/\\\\` escape encoding). Log/chat/ecell absent in dir mode — matches legacy in-memory-only behavior so migrated rooms look the same as what the user last saw. CLI accepts `--source file:///path` or bare `/abs/path`; scheme validated at parse time via new `parseSource` helper in `cli-args.ts`. `RunDeps.connectRedis` and new `RunDeps.fs` are both optional; `bin/ethercalc` wires `node:fs/promises` into `fs`. 166 migrate tests, 100% coverage retained. Usage from a Sandstorm `run_grain.sh`: boot worker, block on `/_health`, run `./bin/ethercalc migrate --source file:///var --target http://127.0.0.1:$PORT --token $TOKEN`, drop a `.migrated` sentinel, proceed. Also extracted the oversized-entry filter to shared `filter-oversized.ts` (redis-source.ts now imports from there). | (this commit) |

---

## 15. Runbook

```bash
# fresh clone
git clone https://github.com/audreyt/ethercalc
cd ethercalc
bun install
bun run --cwd packages/worker test

# run the new worker locally
bun run --cwd packages/worker dev       # wrangler dev --local

# run the oracle (current main) for comparison
docker compose -f tests/oracle/docker-compose.yml up -d

# record new oracle fixtures after adding a scenario
bun run --cwd packages/oracle-harness record

# replay against local worker
bun run --cwd packages/oracle-harness replay --target http://127.0.0.1:8787
```

To resume work:
1. §14 for last session's context.
2. §8 for next pending item.
3. §7 for live risks on the affected area.
4. Commit; update §14.
5. If plan diverges from reality, edit this doc *before* merging the code.

---

## 16. Appendix

### 16.A — socialcalc-in-DO wrapper (current state)

Post source-swap (2026-04-20): `socialcalc` dep resolves to `github:audreyt/socialcalc#4463d50` — a strict-mode-clean, Bun + tsgo port of 2.3.0. Runs inside workerd via `@cloudflare/vitest-pool-workers`. 7/7 smoke tests green.

**Load pipeline** (`packages/socialcalc-headless/`):
1. Vite `?raw` import of `socialcalc/dist/SocialCalc.js` — string-loads the UMD at build time.
2. `scripts/build.js` applies two source transforms on the bundled string:
   - `document.createElement(` → `SocialCalc.document.createElement(` (redirect DOM creation to our shim).
   - `alert(` → `(function(){})(` (silence error-path alerts).
3. One wrapper-level transform: `typeof globalThis !== 'undefined' ? globalThis : this` → `this` (so the host-binding IIFE captures `root`/`window`).
4. `new Function(...)` eval inside the DO (permitted; no CSP restriction). Sloppy mode by default — required because SocialCalc uses `delete varname;` at a few lines.
5. Eval scaffold installs DOM stubs (`ShimNode` class covering `id`, `width`, `height`, `className`, `colSpan`, `rowSpan`, `title`, `innerHTML`, `outerHTML`, `appendChild`) and a **synchronous `setTimeout` shim** (`function(cb){cb();return 0;}`) so recalc state machines unroll inline.
6. Factory memoized module-wide; 27k-line eval runs once per isolate.
7. Manual `SocialCalc.RecalcSheet(sheet)` kick after command batches (without an editor, `recalc` only sets `needsrecalc="yes"`).

Upstream fixes (now in `audreyt/socialcalc`): the ES5 `delete varname;` rewrites, reserved-`eval` renames, and `factory.call(root, this)` → `factory.call(root, root)` that we used to do by hand. Implicit-globals pre-declaration removed — `var`-less assignments in paste/render/format/MIME paths fixed upstream.

**Proven**: SUM formulas, snapshot+log round-trip, text+number mix, recalc without formulas, `exportCSV`/`exportCells`/`exportCell`, `csvToSave` via Clipboard + CreateSpreadsheetSave.

**Not yet exercised end-to-end**:
- Cross-sheet formula references (`'other-room'!A1`) — needs `RecalcInfo.LoadSheet` hook wired to sibling DOs (§7 item 2).
- `ScheduleSheetCommands` async path — we bypass with sync `ExecuteSheetCommand` (§7 item 7).

### 16.B — Deferred decisions not in §13

(none; append when new open questions emerge mid-execution)

---

*End of plan.*
claude --resume 7059f882-1b8d-44c5-8c9e-c246879c20fd
