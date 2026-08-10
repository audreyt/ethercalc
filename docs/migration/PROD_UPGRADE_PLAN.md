# Operator Runbook: Production Upgrade Plan (`[d2afa90, b7d8840)` → `main`; exact pin `[OPERATOR-VERIFY]`)

> ## ⛔ STOP — DOCUMENTED BASELINE DISPROVED (2026-08-10). DO NOT EXECUTE THE SUPERSEDED THREE-PHASE PLAN.
>
> **Live production at `https://ethercalc.net` is NOT git tag `0.20260717.0` / commit `149ebcf16104b01254ca2b796beb701c88bd6ff8`.** Read-only probes against the live site disproved that premise.
>
> **Execute this runbook via the corrected single-ramp procedure** in **§4 Hosted cutover (single gradual ramp)** after §§0–3 preparation. The critical-path quick reference maps the live sequence.
>
> The disproved three-phase cutover, its phase-graph rollback model, and its three-phase Go/No-Go checklist are preserved only as **Appendix A: Superseded Three-Phase Plan (baseline disproved 2026-08-10)**. That appendix keeps its SUPERSEDED banners and is **analysis / incident history — not a live procedure**. Do **not** run Appendix A; do **not** set `ETHERCALC_AUTH="0"` on production as a soak step.
>
> ### The self-inflicted-outage hazard (fix this first)
>
> Phase 2’s central safety measure sets `ETHERCALC_AUTH = "0"`, justified as making it “structurally impossible” for private rooms or passkeys to exist during the rollback-likely window (see Exec Summary item 3; historical write-up in Appendix A.1.3 / A.2.2 — old §4.3 / old §6.2). **That rationale is void against real production.**
>
> Passkeys and the `AuthDO` / `AUTH` binding are **already live**. Users may already hold registered credentials and private rooms. Setting `ETHERCALC_AUTH="0"` (or deploying a bundle with the flag off / `AUTH` unbound) would:
>
> 1. make `authEnabled()` fail closed → passkey ceremonies 404 and `GET /_auth/whoami` report `enabled:false`;
> 2. make `getSessionPrincipal` return `null` even for valid session cookies;
> 3. **lock every existing private room** (RoomDO deny-overrides → **403 to its owner**) without declassifying it public;
> 4. convert the plan’s main safety measure into a **self-inflicted production outage**.
>
> **Do not set `ETHERCALC_AUTH="0"` on production as part of any cutover derived from this document.** The corrected procedure (§4) leaves auth enabled for the entire ramp.
>
> ### Live evidence (re-verify in seconds; read-only GETs only)
>
> Gathered 2026-08-10 against `https://ethercalc.net`:
>
> ```bash
> # 1. Health — this codebase's hardcoded version stamp (packages/worker/src/handlers/health.ts)
> curl -fsS https://ethercalc.net/_health
> # → {"status":"ok","version":"0.0.0","now":"2026-08-10T09:27:15.896Z"}
> #    Confirms live Worker execution (not a cached static response).
>
> # 2. Auth surface — route absent at 149ebcf; enabled:true requires AUTH binding + RP anchors
> curl -fsS https://ethercalc.net/_auth/whoami
> # → {"uid":null,"enabled":true}
> #    registerAuth (packages/worker/src/routes/auth.ts) does not exist at 149ebcf.
> #    enabled:true requires authEnabled(): ETHERCALC_AUTH truthy, env.AUTH bound,
> #    and non-empty ETHERCALC_RP_ID / ETHERCALC_ORIGIN (routes/auth.ts).
>
> # 3. Root HTML — post-passkey UI, pre-security-audit asset layout
> curl -fsS https://ethercalc.net/ | head -c 8000
> # → contains: <script type="module" src="./static/passkey/ui.js">
> #             <m3e-theme …>, ./static/passkey/ui.css
> #             inline <script> bootstrap blocks
> #             <html manifest="manifest.appcache">
>
> # 4. Security-audit root scripts are NOT deployed
> curl -sS -o /dev/null -w '%{http_code}\n' https://ethercalc.net/static/index-bootstrap.js
> # → 404
> #    Filename is required by main's scripts/build-assets.ts REQUIRED_PAGE_SCRIPTS
> #    and was introduced when inline root scripts were externalized.
>
> # 5. Room index gate (non-discriminating; consistent with both revisions)
> curl -sS -o /dev/null -w '%{http_code}\n' https://ethercalc.net/_rooms
> # → 403
> ```
>
> **Conclusion from probes:** production is **newer than `149ebcf`** — *after* the passkey merge (PR #841) and *before* `main`’s security-audit work that moved inline root scripts into five tracked `static/*.js` files and dropped the appcache manifest.
>
> ### Repo-bounded candidate revision range (exact pin still open)
>
> | Bound | SHA | Date (author) | Marker |
> | :---- | :-- | :------------ | :----- |
> | **Lower (inclusive floor)** | `d2afa9047475d50eb5228db71067a6c8b7e6a186` | 2026-07-18 01:19:58 +0800 | `Merge feat/passkey-permissions (#841)` — introduces `packages/worker/src/routes/auth.ts`, `auth-do.ts`, passkey UI |
> | **Upper (exclusive ceiling)** | `b7d884087c15d01092584daa8f5f18445284f643` | 2026-08-04 06:49:58 +0800 | `security: harden EtherCalc trust boundaries` — adds `static/index-bootstrap.js` (+ related page scripts) and removes `manifest.appcache` from `index.html` |
>
> Production ∈ (`d2afa90` … `b7d8840`). **Pinning the exact revision still requires** (highest-priority `[OPERATOR-VERIFY]` in this document):
>
> ```bash
> npx wrangler deployments list --config=packages/worker/wrangler.toml --env=""
> npx wrangler versions list --config=packages/worker/wrangler.toml --env=""
> ```
>
> Until that pin exists, treat every SHA-specific procedure (Phase 1 worktree from `149ebcf`, “v2 not yet deployed”, “passkeys not yet live”) as **false**.
>
> ### Re-scoped delta (what remains to ship — not a cutover plan)
>
> From the exclusive upper bound through current tree tip, `git log --oneline b7d8840^..HEAD -- packages/ scripts/ static/` is dominated by:
>
> - the security-audit hardening commit itself (`b7d8840`) and its follow-ups (CSP/`__Host-ec_sess`, WS/frame caps, body limits, export sanitizer, externalized root scripts, infra lockstep);
> - `fix(worker): propagate RoomDO command rejections from POST /_/:room` (`5d37bd0`);
> - CI/test/ratchet and SocialCalc **load-compat test** commits (not a SocialCalc engine bump).
>
> **Explicitly already in production (do not re-ship as if new):** passkeys / `AuthDO` / private rooms (PR #841). **Explicitly not part of this delta:** SocialCalc `3.1.0` — shipped in release `0.20260716.0` (`Changes.txt`), before even the old assumed baseline `0.20260717.0`.
>
> If production sits earlier inside the candidate range, some of `d2afa90..b7d8840^` (multi-sheet entry restore, Vite+ workflow, headless/DOM harden, etc.) may also still be undeployed — only `wrangler deployments list` settles that.
>
> ### What still stands vs what must be reworked
>
> | Still valid (baseline-independent) | Needs rework after re-baseline |
> | :--------------------------------- | :----------------------------- |
> | §0.1 secrets preconditions | Document title / Baseline Release / Target lines (assumed `149ebcf`) |
> | §0.2 inspection commands (esp. **`wrangler deployments list` — now #1 priority**) | §0.3 baseline decision table (rows keyed off `149ebcf`) |
> | §0.2.1 D1 Time Travel subsystem GO/NO-GO | Exec Summary item 3 conclusion that `AUTH=0` “eliminates” private-room hazard in prod |
> | §0.2.2 D1 10 GB capacity gate & scale arithmetic | ~~Critical-path three-phase sequence~~ **done** — critical-path now maps §4 single-ramp |
> | §1 preflight matrix on the ship candidate | §2.2 Phase 2/3 narrative (Appendix A; assumes no private data pre-Phase-3) |
> | §2.1 backup matrix, DO non-exportability, SQL dump limits | **Appendix A / old Phase 1** (lifecycle-only from `149ebcf` — v2/`AuthDO` already live) |
> | §2.3–§2.4 PITR contract & bounded recovery at ~1.8M rooms | **Appendix A / old Phase 2 `AUTH=0`** (**hazardous** — see above) |
> | §4.0 deploy config source-of-truth / redirect-banner guard (now under live §4) | **Appendix A / old Phase 3** (passkeys already on; not a green-field enable) |
> | §4.8–§4.9 skew/reconnect + `SKEW_AND_RECONNECT.md` companion (live under §4) | ~~§5 Phase-2 `enabled:false` framing~~ **done** in live §5 (`enabled:true`). Probes 13a–13c (search-indexing) **added** in `c40f11f` |
> | §5 probe *mechanics* and many response contracts (health shape, `/_rooms` 403, XLSX paths, WS upgrade) | **Appendix A / old §6** phase-graph rollback predicated on Phase 2 having zero private rooms (live rollback is §4.4; D1≠DO restore remains §6) |
> | §6 D1 restore does not roll back DO SQLite | **§8** still carries Phase 1 bundle / three-phase placement framing in places; search-indexing ship requirement **added** as item 7 (`c40f11f`) |
> | §7 self-host divergence, `uniqueKey`, nginx, passkey anchor defaults | **Appendix A / old §9** three-phase Go/No-Go / item 9 `AUTH=0` soak (live gates: §4 Step 0 + still-valid §0/§1/§2 checks) |
> | Companion inventory / platform constraint citations | ~~§10 passkeys-as-new~~ **done** — item 5 re-baselined in `c94fd3e` (passkeys already live; ship change is `ec_sess` → `__Host-ec_sess`). Item 8 search-indexing added in `c40f11f`. |
>
> **Execution status:** the corrected single-ramp strategy is the **live hosted procedure in §4**. Exact production Worker version ID / git SHA is still open — `wrangler deployments list` remains the #1 `[OPERATOR-VERIFY]` before any upload (needed as the rollback-target version ID; ramp safety holds across the whole candidate range — see §4.1).
>
> ---

## Companion documents

This runbook is the entry point. The other four files in this directory are supporting evidence — read them when the runbook points you there, or when you need the underlying audit:

- **`DELTA_AUDIT.md`** — prod→`main` delta with per-item classification and irreversibility analysis. Read before approving the cutover shape.
- **`SKEW_AND_RECONNECT.md`** — what breaks for a browser tab already open across the cutover. Read when planning operator comms or soak checks.
- **`PREFLIGHT_RESULTS.md`** — recorded results of this runbook's §1 gates against the final tree. Read to confirm preflight already passed (or what failed).
- **`INVENTORY.md`** — verbatim mechanical inventory of wrangler config, workflows, D1 migrations, and self-host env. Read when a command or binding needs a ground-truth dump.

## Critical-path quick reference

Use this quick reference for **“what do I do next?”** Use §§0–3 for preparation, **§4 for hosted execution and rollback**, §5 for post-ramp probes, §6 for D1-only restore, §7 for self-host, and §§8/10 for preparation bundles and user-visible consequences. Follow the cited section whenever a line below sends you there; this is a map, not a substitute for the procedure.

> The disproved three-phase sequence is **not** on the critical path. It lives only in **Appendix A** (analysis / incident history).

### Sequence and rollback (live — single gradual ramp)

| Step | What ships | Execution command | Rollback target and command |
| :--- | :--------- | :---------------- | :-------------------------- |
| **Preflight / pin** | Record rollback floor | `npx wrangler deployments list` / `versions list` → `CURRENT_PROD_VERSION_ID`; secrets; capacity; ship-tree preflight; staging single-ramp rehearsal | n/a — blocking gate → §4.3 Step 0, §0.1, §0.2.1–§0.2.2, §1 |
| **Pre-deploy D1** | D1 migrations (expected no-op in candidate range) | `npx wrangler d1 migrations list` then `apply` on `ethercalc_rooms` with `--remote --config=packages/worker/wrangler.toml --env=""` | D1 bookmark / Time Travel only (does **not** roll back DO SQLite) → §4.3 Step 1, §6 |
| **Upload @0%** | Ship bundle, auth stays `"1"` | `vp run build:assets`; `npx wrangler versions upload --config=wrangler.toml --env=""` from `packages/worker`; record `SHIP_VERSION_ID` | No default traffic yet → §4.3 Step 2, §4.0 |
| **Override smoke** | Exercise ship version without ramp | `Cloudflare-Workers-Version-Overrides: ethercalc="<SHIP_VERSION_ID>"` probes (`whoami` **`enabled:true`**, health, root scripts, public sheet) | Do not ramp on failure → §4.3 Step 3 |
| **Ramp** | Gradual default traffic | `npx wrangler versions deploy <SHIP_VERSION_ID>@10%` → `@50%` → `@100%` with dwells; purge edge after first HTML/JS-serving step and at 100% | `npx wrangler versions deploy <CURRENT_PROD_VERSION_ID>@100% --env=""` + edge purge → §4.3 Step 4, §4.4 |
| **Verify** | Post-ramp acceptance | §5 probe mechanics with §4.3 Step 5 auth/asset expectations (`enabled:true`; `index-bootstrap.js`; sheet-limit 413) | Same ramp abort command if acceptance fails → §4.3 Step 5, §5, §4.4 |

### Points of no return (live baseline)

- **Platform point of no return (already behind production):** `v2` / `AuthDO` is already live in the candidate range. This cutover does **not** cross a new DO lifecycle boundary; pre-`v2` / `149ebcf` is **not** a rollback target. → §4.2, §4.4
- **Do not create a new authz hazard:** never deploy `ETHERCALC_AUTH="0"` / auth-unbound bundles to production as a soak or rollback tool — that 403-locks existing private rooms for their owners. → STOP banner, §4.3, §4.4
- **Residual user impact on ship (not ACL declassification):** session cookie rename `ec_sess` → `__Host-ec_sess` signs users out until passkey re-login; communicate re-auth. → §4.5

### Abort — stop and roll back to `CURRENT_PROD_VERSION_ID`

- Override smoke fails (`enabled` ≠ `true`, health fail, ship static assets 404). → §4.3 Step 3
- Ramp error/latency or spot-check failure during `@10%` / `@50%` / `@100%`. → §4.3 Step 4, §4.4
- Health, public-sheet read/write, or WebSocket upgrade misses its required response contract. → §5 Probes 1, 5, 7; §4.4
- Sheet-limit probe reports false success (202) or the rejected mutation creates a snapshot. → §5 Probe 6; §4.4
- After the required purge, client assets are missing or non-JavaScript; or socket.io, room-index gate, XLSX export, `www` redirect, or search-indexing probes miss contract. → §5 Probes 4, 8–10, 12, 13a–13c; §4.4
- Private-room owner path broken beyond expected re-login after cookie rename. → §4.5, §4.3 Step 5

### Manual hard gates — do not upload the ship version

- Pin `CURRENT_PROD_VERSION_ID` (and annotation) from `wrangler deployments list` / `versions list`; unresolved pin blocks upload. → §4.3 Step 0; §0.2
- Complete still-valid baseline / capacity path; any NO-GO or unsigned conditional result blocks the cutover. → §0.2–§0.3
- Confirm required production secrets are active. → §0.1
- Record the D1 Time Travel bookmark (and size-budgeted export if used), and settle restore viability against the live artifact. → §2.1; §6
- Green preflight on the **ship tree**. → §1
- Pass real-Cloudflare staging rehearsal of **this single-ramp shape** (upload → override smoke → percentage ramp → rollback to staging pre-ramp version) and PITR sequence as in-scope. → §4.3 Step 0; §2.3; §3 *(§3 text still describes the old three-phase staging shape — rehearse the single-ramp commands from §4.3; full §3 rewrite is a known gap)*

**Target Service:** `ethercalc.net` (Cloudflare Workers + Hono + Durable Objects + D1 + Assets)  
**Baseline window:** production ∈ `[d2afa90, b7d8840)` — after passkey merge (PR #841), before security-audit hardening; **exact pin `[OPERATOR-VERIFY]`** via `wrangler deployments list` / `versions list`  
**Target Release:** Current `main` (security-audit delta + command-rejection propagation + search-indexing policy)  
**Document Purpose:** Operator runbook for a zero-data-loss single-ramp production upgrade under Cloudflare Workers platform constraints, with the disproved three-phase plan retained only as Appendix A.

---

## Executive Summary & Verified Codebase Ground Truth

All file:line references below have been verified directly against the repository source code and official Cloudflare Workers platform documentation:

1. **Production & Staging Topology (`packages/worker/wrangler.toml`)**:
   - **Production Worker:** `workers_dev = false` (`packages/worker/wrangler.toml:13`), bound to custom domains `ethercalc.net` (`packages/worker/wrangler.toml:20-23`) and `www.ethercalc.net` (`packages/worker/wrangler.toml:24-27`).
   - **Staging Environment:** `[env.staging]` overlay named `ethercalc-staging` (`packages/worker/wrangler.toml:72-73`) with `workers_dev = true` (`packages/worker/wrangler.toml:74`), its own D1 database `ethercalc_rooms_staging` (`database_id = "273b1db3-17bc-44dd-bbc2-62ce1727abde"`, `packages/worker/wrangler.toml:98-99`), and passkey trust anchors pinned to `ethercalc-staging.audreyt.workers.dev` (`packages/worker/wrangler.toml:84-86`).
   - **Durable Object Migrations:** `tag = "v1"` maps `RoomDO` (`packages/worker/wrangler.toml:41-43`), `tag = "v2"` introduces new singleton class `AuthDO` (`packages/worker/wrangler.toml:45-47`).
   - **D1 Production Database:** `database_name = "ethercalc_rooms"`, `database_id = "bd9247bd-5b50-4c47-8ce6-de3196511684"` (`packages/worker/wrangler.toml:166-167`).
   - **Cron Triggers:** `crons = ["*/1 * * * *"]` (`packages/worker/wrangler.toml:135`).
   - **Workers Assets:** Directory points to `../../assets` (`packages/worker/wrangler.toml:127`) with `run_worker_first = true` (`packages/worker/wrangler.toml:129`, staging `packages/worker/wrangler.toml:105`).

2. **Cloudflare Platform Constraints on Gradual Deployments & Migrations**:
   - **DO Lifecycle Migration Rule**: Per [Cloudflare Workers Gradual Deployments with Durable Objects](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/):
     > _"Versions of Worker bundles that change Durable Object class lifecycle **cannot be uploaded**. This applies to both the declarative exports field and the legacy **migrations** array. This is because Durable Object lifecycle changes are atomic operations. **Once a lifecycle change is deployed, rollbacks cannot take place to any version prior to the one that included the change.**"_
   - **Deployment Strategy Requirement**:
     > _"Durable Object lifecycle changes can be deployed with the following command: `npx wrangler deploy`... **To limit the blast radius of these deployments, Durable Object lifecycle changes should be deployed independently of other code changes.**"_
   - **Version Overrides Header**: Per [Cloudflare Workers Version Overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/):
     > _"set the `Cloudflare-Workers-Version-Overrides` header on the request... `curl -s https://example.com -H 'Cloudflare-Workers-Version-Overrides: ethercalc="<VERSION_ID>"'`"_
     > _"Workers currently only supports serving **two** different versions in one deployment."_

3. **Verifiable Proof: Private-Room Gate Gating via `ETHERCALC_AUTH="0"`**:
   - `POST /_/private` (`packages/worker/src/routes/rooms.ts:673`) calls `getSessionPrincipal(c)`.
   - `getSessionPrincipal` (`packages/worker/src/lib/session-middleware.ts:21-30`) calls `verifyAuthSession(env, session)`.
   - `verifyAuthSession` (`packages/worker/src/lib/auth-session.ts:16`):
     ```ts
     if (!flagEnabled(env.ETHERCALC_AUTH) || !env.AUTH) return null;
     ```
   - When `ETHERCALC_AUTH = "0"`, `flagEnabled` returns `false`, `getSessionPrincipal` evaluates to `null`, and `POST /_/private` returns `401 Unauthorized` (`sizedResponse('Unauthorized', 401)`).
   - Passkey endpoints (`POST /_auth/register-init`, `POST /_auth/register-complete`) return `404 Not Found` when `authEnabled(env)` is false (`packages/worker/src/routes/auth.ts:87,102`).
   - `GET /_auth/whoami` (`packages/worker/src/routes/auth.ts:133-136`) returns `HTTP 200 OK` with `{"uid":null,"enabled":false}`.
   - **Conclusion (SUPERSEDED for ethercalc.net)**: The old Phase 2 plan treated `ETHERCALC_AUTH = "0"` as eliminating private-room rollback hazard. **Live production already has passkeys/private rooms** (STOP banner); applying that soak would **403-lock owners**. Live cutover leaves auth at `"1"` (§4). Historical three-phase rationale remains only in Appendix A.

4. **Integration Proof for Legacy Oversized Sheets (`packages/worker/test/room.test.ts:356-395`)**:
   - Legacy sheets exceeding `MAX_SHEET_CELLS = 200_000` (e.g. 500×500 = 250,000 cells) load and serve fine (HTTP 200).
   - The `#postSeed` migration path imports snapshots without bounding-box checks.
   - Non-growing edits to existing cells within current declared area succeed (`202`).
   - RoomDO rejects edits expanding declared area beyond existing bounds with HTTP 413, and native WebSocket writes close with 1008.
   - **Ship prerequisite**: PR 4 (§8 item 5; historical Go/No-Go item 6 in Appendix A.3) has restored HTTP rejection signaling on `POST /_/:room`, surfacing RoomDO 413 status and body for over-limit writes prior to cutover.

---

## §0 Baseline Capture (Operator Pre-Upgrade Checklist)

Before executing any migration steps, the operator MUST capture and record the exact state of the production environment.

### 0.1 Precondition Secret Checks & Provisioning

Cloudflare Worker secrets exist independently of code deploys (unlike `[vars]`). The operator MUST verify required secrets before cutover.

```bash
# 1. Inspect existing Cloudflare secrets (values are write-only, verify names exist)
npx wrangler secret list --config=packages/worker/wrangler.toml --env=""
```

**HARD PRECONDITIONS:**

- **`ETHERCALC_KEY`:** If `ETHERCALC_KEY` is absent from `wrangler secret list`, provision it now:
  ```bash
  npx wrangler secret put ETHERCALC_KEY --config=packages/worker/wrangler.toml --env=""
  ```
- **`ETHERCALC_MIGRATE_TOKEN`:** Section 2 relies on `POST /_/:room/pitr-restore` as an operator recovery tool. If `ETHERCALC_MIGRATE_TOKEN` is absent from `wrangler secret list`, the PITR endpoint returns `404 Not Found`. Provision it BEFORE cutover:
  ```bash
  npx wrangler secret put ETHERCALC_MIGRATE_TOKEN --config=packages/worker/wrangler.toml --env=""
  ```

### 0.2 Baseline Inspection Commands `[OPERATOR-VERIFY]`

Run the following commands from the repository root:

```bash
# 1. Query production deployments list
npx wrangler deployments list --config=packages/worker/wrangler.toml --env=""

# 2. Query production versions list
npx wrangler versions list --config=packages/worker/wrangler.toml --env=""

# 3. Check production D1 database status, size, and storage subsystem
#    INSPECT: `database_size` (bytes; human table form pretty-prints it) AND
#    `version` when present (Time Travel subsystem — see §0.2.1 / §0.2.2)
npx wrangler d1 info ethercalc_rooms --json
# 4. Capture current D1 Time Travel info and record the current bookmark timestamp
npx wrangler d1 time-travel info ethercalc_rooms

# 5. Capture live production health probe response
curl -fsS -i https://ethercalc.net/_health

# 6. Capture live production root headers
curl -fsSI https://ethercalc.net/
```

#### 0.2.1 Precondition: D1 Storage Subsystem Verification `[GO/NO-GO]`

Before proceeding with cutover or relying on Time Travel backups, the operator MUST verify the D1 database storage subsystem version from `npx wrangler d1 info ethercalc_rooms --json`:

1. **Pass Criterion (`version: "production"`)**:
   When present, the output `version` field MUST be `"production"`. Per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/) and [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/):
   > *"Databases with `version: production` support the new Time Travel API. Databases with `version: alpha` only support the older, snapshot-based backup API."*
   > *"To understand which storage subsystem your database uses, run `wrangler d1 info YOUR_DATABASE` and inspect the `version` field."*

   **Pinned-Wrangler caveat:** the repository's Wrangler build fetches `version` from the D1 API but **strips it** from both table and `--json` `d1 info` output before printing (it keeps `database_size`, metrics, etc.). If `version` is absent from the CLI output, do **not** treat that as `alpha`. Instead confirm Time Travel with:
   ```bash
   npx wrangler d1 time-travel info ethercalc_rooms
   ```
   Success ⇒ production subsystem usable for §2/§6. Failure with an alpha/unsupported error ⇒ apply the `version: "alpha"` branch below.

2. **Wrangler Version Compatibility**:
   Cloudflare D1 Time Travel requires Wrangler CLI version `>= v3.4.0` (per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/)). In this repository, root `package.json` pins `"wrangler": "^4.112.0"`, satisfying the CLI version requirement.

3. **Decision Branch (`version: "alpha"`) & Degraded Rollback State**:
   If `wrangler d1 info ethercalc_rooms` returns `version: "alpha"`:
   - **Time Travel is completely unavailable**: Time Travel commands (`wrangler d1 time-travel info`, `wrangler d1 time-travel restore`) will fail or operate under legacy snapshot behavior.
   - **Rollback floor collapses**: Section §2's rollback floor collapses strictly to the manual `d1 export` SQL dump (`npx wrangler d1 export ethercalc_rooms --remote --output=...`), materially weakening rollback protection by eliminating continuous point-in-time recovery (PITR).

4. **Operator Go/No-Go Judgment on `version: "alpha"` Blocker Status**:
   - **Operator Judgment**: `version: "alpha"` **SHOULD block the cutover outright** if continuous D1 point-in-time recovery (PITR) or automated Time Travel restoration is required by the production operational SLA or change management policy.
   - **Justification**: D1 `ethercalc_rooms` stores the room index (`rooms` table mirroring room names, updated_at timestamps, and cors_public flags per `packages/worker/migrations/0001_rooms.sql:17-21` and `packages/worker/src/lib/rooms-index.ts:46-49`) plus bounded per-room audit and chat log tails (`audit_log` and `chat_log` tables per `packages/worker/migrations/0003_audit_chat.sql:22-38` and `packages/worker/src/lib/seq-store.ts:39-41`). Authoritative sheet content, cell values, SocialCalc command logs, and snapshots are stored solely inside Durable Objects (`RoomDO`). If D1 schema migration (`packages/worker/migrations/0001_rooms.sql`) or database state corruption occurs during cutover, `version: "alpha"` leaves the operator with zero automated PITR options — reverting D1 requires manually dropping/recreating tables and importing a static SQL dump, which risks losing any room index or log updates created between the export time and cutover failure. If the operator or team explicitly chooses to proceed under `version: "alpha"` anyway (e.g., because primary cell state lives in `RoomDO` Durable Objects and D1 is a mirror index/log store), this MUST be logged as a formal GO/NO-GO risk acceptance: the operator explicitly acknowledges that §2/§6 Time Travel rollback capabilities are disabled and that D1 recovery relies solely on `d1 export`.

#### 0.2.2 Precondition: D1 Capacity Headroom Against the 10 GB Ceiling `[GO/NO-GO]`

Production is **not** a small-room fleet. `bulkMirrorRoomsToD1` documents that
migration seeds **~1.8M rooms** through `PUT /_migrate/seed/:room` with a
subsequent bulk index flush, and that a naive per-row D1 write path is
D1-bound for on the order of **~5 h at 100 rps**
(`packages/worker/src/lib/rooms-index.ts:63-82`). The same comment records
D1's prepared-statement parameter cap of **100** (not SQLite's 999); over-
batching produced a generic 500 during the 2026-04-21 migration work (see
the rooms-index comment and the rewrite session log). Operator backup and
recovery procedures MUST be planned against that order of magnitude, not
against a mental model of hundreds of rooms.

`npx wrangler d1 info ethercalc_rooms` (and `--json`) reports **current
database size**. Wrangler renames the API field `file_size` →
`database_size` before printing (`wrangler` D1 info handler). Per
[Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/):

- **Maximum database size: 10 GB (Workers Paid) / 500 MB (Free).**
- Cloudflare states plainly: *"Note that the 10 GB limit of a D1 database
  cannot be further increased."*
- Maximum SQL query duration: **30 seconds**
- Maximum Time Travel restore operations: **10 per 10 minutes per database**
- Maximum bound parameters per query: **100**
- Each D1 database is **single-threaded** and processes queries one at a time
- Large multi-million-row modifications must be batched; a single statement
  that touches hundreds of thousands of rows will exceed execution limits

**Operator action (record in the cutover log):**

1. Run `npx wrangler d1 info ethercalc_rooms --json` and record
   `database_size` (integer bytes). In table mode the same value is shown
   as a human-readable size.
2. Convert to GiB: `database_size / 1024^3`.
3. Compute headroom: `10 GiB - size` and used fraction `size / 10 GiB`.

**Pass criteria (cutover go/no-go):**

| Reading | Judgment |
| :------ | :------- |
| **&lt; 5.0 GiB** (&lt; 50% of ceiling) | **PASS** — comfortable margin for soak growth, export overhead, and audit/chat tail accumulation during the window. |
| **5.0–&lt;8.0 GiB** (50–&lt;80%) | **CONDITIONAL** — proceed only with an explicit owner sign-off, a recorded plan for what happens if D1 writes start failing mid-soak, and no discretionary bulk D1 rewrites during cutover. |
| **≥ 8.0 GiB** (≥ 80%) | **NO-GO** until size is reduced or the change window is redesigned. Crossing the hard 10 GB ceiling is an availability incident, not a soft warning. |
| **Field missing / command fails** | **NO-GO** until size is observed. Do not guess. |

**Why this is not optional.** D1 here holds:

- the public room index (`rooms`: `room`, `updated_at`, `cors_public` —
  `packages/worker/migrations/0001_rooms.sql:17-21`), and
- bounded per-room tails `audit_log` / `chat_log` with
  `AUDIT_HISTORY_KEEP = 1024` and `CHAT_HISTORY_KEEP = 500`
  (`packages/worker/src/lib/seq-store.ts:40-41`), each row carrying a
  `body` (SocialCalc command text or chat message).

Authoritative sheet bytes live in RoomDO, **not** in D1 — but the index and
mirrors still grow with the fleet and with active-room churn.

**Illustrative arithmetic (assumptions stated; live size unknown without
§0.2 step 3):**

Assumptions used below (order-of-magnitude only):

- Indexed public rooms on the order of the migration seed: **N_index ≈ 1.8×10^6**.
- Average `rooms` row + SQLite/leaf overhead ≈ **100 bytes** →
  `1.8e6 × 100 B ≈ 180 MB ≈ 0.17 GiB ≈ 1.7% of the 10 GiB cap` for the
  index alone, before any audit/chat tails.
- A "full-tail active" room is one that has filled the keep limits:
  `1024` audit rows + `500` chat rows.
- **Case M (modest bodies):** audit row ≈ 250 B, chat row ≈ 150 B
  (short commands / short messages + row overhead) →
  `1024×250 + 500×150 = 331 000 B ≈ 0.32 MiB` per full-tail room.
- **Case H (heavier bodies):** audit row ≈ 1050 B, chat row ≈ 200 B →
  `1024×1050 + 500×200 ≈ 1.15 MiB` per full-tail room.

| Full-tail active rooms | Case M total (index + tails) | Fraction of 10 GiB | Case H total | Fraction of 10 GiB |
| --------------------: | ---------------------------: | -----------------: | -----------: | -----------------: |
| 1 000 | ≈ 0.48 GiB | ≈ 5% | ≈ 1.3 GiB | ≈ 13% |
| 10 000 | ≈ 3.3 GiB | ≈ 33% | ≈ 11 GiB | **&gt; 100% (over ceiling)** |
| 18 000 (1% of 1.8M) | ≈ 5.7 GiB | ≈ 57% | ≈ 20 GiB | **far over ceiling** |
| 50 000 | ≈ 16 GiB | **over** | ≈ 55 GiB | **over** |

These rows are **not** a measurement of production. Most of the 1.8M index
entries are expected to be cold (empty or near-empty audit/chat tails). A
small hot cohort dominates D1 bytes. The only authoritative number is the
live `database_size` from `wrangler d1 info`. The table exists so the
operator treats headroom as a first-class go/no-go input instead of
discovering the ceiling mid-incident.

**Consequence of hitting the 10 GB cap.** D1 writes fail. In this codebase
that immediately affects:

1. **Room index mirrors** (`mirrorRoomToD1` / `bulkMirrorRoomsToD1`) — 
   `GET /_rooms`, `GET /_roomtimes`, and any recovery procedure that
   enumerates `rooms` drift from RoomDO reality.
2. **Audit/chat mirrors** (`appendAuditRows` / `appendChatRows`) — the
   long-term D1 record stops accepting new tails (RoomDO remains
   authoritative for live sheet state; the mirror is best-effort, but a
   full disk turns "best-effort" into "sustained loss of the recovery aid").

D1 is single-threaded: a database at or near the size ceiling is also more
likely to queue or overload under concurrent operator export + live traffic.
Do not schedule bulk `d1 export`, mass `d1 execute` scans, and peak write
traffic without looking at this number first.

### 0.3 Baseline Decision Table `[OPERATOR-VERIFY]`

> **Re-baseline note:** rows keyed off `149ebcf` / three-phase actions are historical. For current production use the STOP banner candidate window `[d2afa90, b7d8840)`, pin `CURRENT_PROD_VERSION_ID`, and execute **§4** — not Appendix A phases.

| Observed Baseline State             | Variance from `149ebcf16104b01254ca2b796beb701c88bd6ff8`                   | Required Action                                                                                                                                                    |
| :---------------------------------- | :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exact Match** (`149ebcf...`)      | Deployed version corresponds to tag `0.20260717.0` (commit `149ebcf...`).  | **Disproved for ethercalc.net** (STOP banner). Do not use this row; pin via `wrangler deployments list` and follow §4.                                           |
| **Older Version** (< `149ebcf...`)  | Production is behind `0.20260717.0`.                                       | Pause upgrade. Run git diff between deployed version and `149ebcf...` to audit any missing intermediate state before deploying `main`.                             |
| **Newer Version** (> `149ebcf...`)  | Production is already ahead of `0.20260717.0`.                             | Run `git log 149ebcf..HEAD` to determine exactly which commits are deployed. Check if DO migration `v2` (`AuthDO`) is already present in `wrangler versions list`. |
| **`v2` Migration Already Deployed** | `AuthDO` migration `v2` is shown as active in `wrangler deployments list`. | **Expected for ethercalc.net.** Do not run Appendix A Phase 1. Follow live §4 single-ramp (auth stays `"1"`).                                                      |
| **D1 Subsystem `version: "alpha"`** | Database uses legacy `alpha` storage subsystem; Time Travel API unsupported. | GO/NO-GO BLOCKER if continuous PITR is required by SLA. If proceeding by explicit sign-off, operator MUST NOT rely on Time Travel and MUST execute manual `d1 export` SQL backups only (§0.2.1, §2.1). |
| **D1 `database_size` ≥ 8.0 GiB** (or missing) | Live size is ≥ 80% of the hard 10 GB ceiling, or size was not recorded. | **NO-GO** until size is observed and headroom is restored (§0.2.2). At 5.0–&lt;8.0 GiB require explicit owner sign-off. |
---

## §1 Preflight on `main`

Run the repository CI gates locally using verified package scripts to guarantee that the `main` branch state is green before attempting deployment.

### 1.1 Local Environmental Prerequisites

When running preflight gates locally under sandboxed or non-root user environments, export the following environment variables to ensure tool caches and telemetry write to writeable paths:

```bash
export PATH="$PWD/node_modules/.bin:$PATH"
export ASTRO_TELEMETRY_DISABLED=1
export DO_NOT_TRACK=1
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers
export HOME=/tmp
export XDG_CONFIG_HOME=/tmp/config
```

### 1.2 Local CI Command Matrix

```bash
# 1. Typecheck all workspace packages (package.json: "typecheck")
ASTRO_TELEMETRY_DISABLED=1 vp run typecheck
# Expected output: Clean exit (code 0) with zero TypeScript errors across all workspace packages.
# Note: Requires ASTRO_TELEMETRY_DISABLED=1 to bypass telemetry EPERM errors under sandboxed execution.

# 2. Run Oxlint code linter (package.json: "lint")
vp lint
# Expected output: 0 lint errors found.

# 3. Run Node unit tests across all workspace packages (package.json: "test")
bun test scripts/build-assets.test.ts scripts/vite-workflow.test.ts && PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers vp run --filter './packages/*' test
# Expected output: 100% pass across all unit test suites and root test scripts (36 root tests + 47 Playwright specs + unit suites).

# 4. Run 100% Code Coverage Enforcement Gate across gated packages
vp run --filter './packages/*' test:coverage
# Or individually for worker:
./node_modules/.bin/vp run @ethercalc/worker#test:coverage
# Expected output: 100% coverage across Statements (2706/2706), Branches (1936/1936), Functions (298/298), and Lines (2416/2416) in @ethercalc/worker, and 100% pass across all 8 gated packages. (Pinned to the ship-tree measurement that last re-baselined this matrix — counts drift when tests or covered lines are added; a mismatch is drift to re-verify, not an automatic gate failure.)
# Critical Note: Plain `vp run @ethercalc/worker#test:node` and `vp run --filter './packages/*' test` do NOT pass `--coverage` or enforce vitest threshold configs (`thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }`). An operator running only `test` or `test:node` skips this mandatory CI gate — plain `test:node` verifies correctness but does NOT enforce coverage. Gated packages with 100% coverage enforcement in their vitest configs are `@ethercalc/worker`, `@ethercalc/cli`, `@ethercalc/client`, `@ethercalc/client-multi`, `@ethercalc/migrate`, `@ethercalc/oracle-harness`, `@ethercalc/shared`, and `@ethercalc/socketio-shim`.

# 5. Run Worker unit & integration test suites (packages/worker/package.json)
vp run @ethercalc/worker#test:node
vp run @ethercalc/worker#test:workers
# Expected output: 53 node test files (1526 tests) pass in vitest.node environment; 13 workers-pool integration test files (197 tests) pass in vitest-pool-workers environment. (Pinned to the ship-tree measurement that last re-baselined this matrix — counts drift when tests are added; a mismatch is drift to re-verify, not an automatic gate failure.)

# 6. Build client assets and run Playwright end-to-end suite (packages/e2e/package.json)
vp run build:assets
PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers vp run @ethercalc/e2e#test
# Expected output: All 47 Playwright e2e test specs pass against local worker instance.
# Note: CI-only in practice if local browser downloads or Miniflare execution are restricted; validated in `.github/workflows/ci.yml`.

# 7. Execute wrangler deploy dry-run to validate worker bundle & asset manifest
HOME=/tmp XDG_CONFIG_HOME=/tmp/config vp run @ethercalc/worker#build:dry
# Expected output: Asset manifest built, esbuild bundling succeeds, package size within Cloudflare limits.
# Note: Requires HOME/XDG_CONFIG_HOME overrides when home directory preferences are read-only.

# 8. Run local mutation ratchet audit (scripts/ratchet-verify.sh is +x)
scripts/ratchet-verify.sh
# Expected output: All audited packages meet or exceed their Stryker break threshold floor.
# Note: `read_score()` parser defect is fixed; offline report evaluation passes 100%.
# Risk Note: `@ethercalc/worker` sits ~0.02 above its break floor (90.02 vs 90), making this gate expected to be the most brittle of the eleven; operators should run it early in preflight rather than last.

# 9. Run self-host Docker smoke test (scripts/smoke-selfhost.sh is +x; requires Docker + docker compose CLI)
./scripts/smoke-selfhost.sh
# Expected output: "[smoke] OK"
# Note: CI-only in practice (requires active Docker daemon + `docker compose` CLI subcommand); validated in `.github/workflows/ci.yml`. If `docker compose` is missing locally, operator marks as NOT RUNNABLE HERE.

# 10. Run nginx proxy recipe smoke test (scripts/smoke-proxy.sh is +x; requires Docker + docker compose CLI)
./scripts/smoke-proxy.sh
# Expected output: "[smoke-proxy] OK"
# Note: CI-only in practice (requires active Docker daemon + `docker compose` CLI subcommand); validated in `.github/workflows/ci.yml`. If `docker compose` is missing locally, operator marks as NOT RUNNABLE HERE.

# 11. Verify Helm chart hardening & passkey template logic (scripts/check-helm-hardening.sh requires bash + helm CLI)
bash scripts/check-helm-hardening.sh
# Expected output: "[helm-hardening] OK"

---

## §2 Backups & Rollback Floor

Prior to cutover, record explicit backups for every durable store and acknowledge the physical limitations of Cloudflare Workers backup APIs. **Plan these procedures against production scale (~1.8M indexed rooms per `packages/worker/src/lib/rooms-index.ts:63-82`), not against a small test fleet.** See §0.2.2 for the D1 10 GB ceiling check that MUST precede export and any mass query work.

### 2.1 Durable Store Backup Matrix

| Store | Capture Command / Procedure | Backup Artifact Location | Recovery Limitation / Reality |
| :---- | :-------------------------- | :----------------------- | :---------------------------- |
| **D1 Database** (`ethercalc_rooms`) | 1. Record live size + subsystem (§0.2.2 / §0.2.1): `npx wrangler d1 info ethercalc_rooms --json` (inspect `database_size`, and `version` when present).<br>2. Record Time Travel bookmark: `npx wrangler d1 time-travel info ethercalc_rooms`.<br>3. Export SQL dump: `npx wrangler d1 export ethercalc_rooms --remote --output=./backup_ethercalc_rooms_$(date +%Y%m%d_%H%M%S).sql` | Local SQL file `./backup_ethercalc_rooms_*.sql` plus Cloudflare D1 Time Travel history. | Exportable/restorable via SQL import or Time Travel, **subject to size and rate limits** (below). `--output` is **REQUIRED** ([Wrangler D1 CLI](https://developers.cloudflare.com/workers/wrangler/commands/d1/#export)). Time Travel retention is plan-dependent (30d Paid / 7d Free). **Time Travel restore cap: 10 restores / 10 minutes / database** ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). |
| **Durable Objects** (`RoomDO` / `AuthDO`) | **NO BULK EXPORT API** for Durable Object SQLite. D1 holds only the public index + bounded audit/chat tails (including private-room log tails; not sheet bytes). Safeguards: (1) per-room `POST /_/:room/pitr-restore` for a **bounded** candidate set (§2.4); (2) D1 Time Travel for the index/mirrors only. | None at fleet scale. Per-room PITR bookmarks exist inside Cloudflare's DO storage layer for ~30 days. | **Whole-instance RoomDO recovery has no operator-side mechanism at ~1.8M-room scale.** Mass PITR is viable only for a bounded, pre-enumerated subset (§2.4). AuthDO has no checked-in restore route. |
| **Static Assets** | Built from source via `scripts/build-assets.ts`. | Git source / `assets/`. | Fully reproducible. |
| **Secrets & Environment Variables** | `npx wrangler secret list --config=packages/worker/wrangler.toml --env=""`. | Cloudflare Secrets Manager. | Values are write-only; §0.1 only verifies names exist. |

#### 2.1.1 `wrangler d1 export` practicality at multi-GB scale `[OPERATOR-VERIFY]`

A production `ethercalc_rooms` dump is **neither instant nor small** once `database_size` is multi-GB (§0.2.2). Before cutover:

1. Budget wall-clock for the export from the live size (expect minutes to tens of minutes on multi-GB databases; do not assume a quick local-dev-sized dump). **`[OPERATOR-VERIFY]`** the actual duration against production — only a live run settles it.
2. Budget local disk for the `.sql` artifact (often comparable to, or larger than, `database_size` because SQL text is less compact than the live DB pages) and treat the file as **sensitive** (private-room commands/chat appear unfiltered in `audit_log` / `chat_log`).
3. Run the export **before** the change window tightens, on a machine that can hold the file, and verify the output path is non-empty when the command exits 0.
4. Remember D1 is **single-threaded**: a long export competes with live room-index and audit/chat mirror writes. Prefer a low-traffic window.
5. D1 export / Time Travel bookmark capture (§6 / old Go/No-Go item 4 in Appendix A.3) is not a checkbox that can be ticked in seconds — schedule it explicitly in the cutover timeline.

SQL dump restore (`wrangler d1 execute --remote --file=...`) is likewise size-bound. Cloudflare documents a **5 GB maximum file import** size for `d1 execute` ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). If the export exceeds that, Time Travel (when `version: "production"`) is the practical whole-DB restore path; do not discover this during the incident.

### 2.2 Rollback Floor Definition & DO Content Non-Exportability

Because Cloudflare Workers provides no operator-side bulk export API for Durable Object SQLite storage, the operator MUST understand what each backup artifact covers:

1. **What `wrangler d1 export` Backs Up**:
   - Backs up the `rooms` index table (`room`, `updated_at`, `cors_public`), `audit_log`, `chat_log`, and `cron_triggers` tables across all rooms (including private rooms, since `#mirrorAudit` and `#mirrorChat` in `packages/worker/src/room.ts:2303-2309` do not filter on `access === 'private'`).
   - Allows restoring the list of public room names, last-modified timestamps, and bounded audit/chat log tails. Private-room *discovery* from those tails is a separate, scale-sensitive query problem (§2.4.2) — do not treat a successful export as proof that `SELECT DISTINCT room FROM audit_log UNION …` will complete inside D1's 30s ceiling.
   - **DOES NOT** back up or restore sheet cell data, authoritative SocialCalc command logs, or sheet snapshots. A D1 export cannot reconstruct RoomDO cell state.
   - **Scale / artifact handling**: At ~1.8M index rows plus audit/chat tails, the dump is a multi-GB sensitive artifact (§2.1.1). Handle `.sql` files as access-restricted material (private-room commands and chat are present without write-time access filtering).

2. **What Cloudflare D1 Time Travel Restores**:
   - Restores D1 tables (`rooms`, `audit_log`, `chat_log`, `cron_triggers`) to a prior point-in-time (§6).
   - **DOES NOT** roll back or restore Durable Object SQLite storage (`RoomDO` / `AuthDO`).
   - Restore rate is capped at **10 operations / 10 minutes / database** — irrelevant for a single pre-cutover undo, but material if an operator is iteratively hunting a good bookmark.

3. **Implications for Cutover Strategy (live vs superseded)**:
   - Because DO sheet content cannot be bulk-exported **and** cannot be bulk-restored at fleet scale (§2.4), **preventing data corruption during cutover is paramount**.
   - **Live procedure (§4):** production is already post-`v2` / auth-on in `[d2afa90, b7d8840)`. Ship `main` with a single gradual ramp, leave `ETHERCALC_AUTH = "1"`, and roll back to `CURRENT_PROD_VERSION_ID` if needed. Do **not** apply an `AUTH=0` soak against existing private rooms.
   - **Superseded analysis (Appendix A only):** the old three-phase shape (Phase 1 lifecycle from `149ebcf` → Phase 2 `AUTH=0` soak → Phase 3 enable) assumed no private-room population before Phase 3. That premise is false for ethercalc.net; keep the write-up for incident history, not execution.

### 2.3 Durable Object PITR Contract and Eligibility

The recovery floor for Durable Object state is real only because both deployed classes use the correct storage backend. Cloudflare's [SQLite-backed Durable Object Storage documentation](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) lists `PITR API` as available for SQLite-backed classes and unavailable for KV-backed classes. EtherCalc declares `RoomDO` in migration `v1` and `AuthDO` in migration `v2` under `new_sqlite_classes` (`packages/worker/wrangler.toml:41-47`), so both classes meet that prerequisite.

The same Cloudflare contract says that these methods can “restore a Durable Object's embedded SQLite database to any point in time in the past 30 days” and that they “apply to the entire SQLite database contents, including both the object's stored SQL data and stored key-value data using the key-value `put()` API.” This second guarantee is essential for EtherCalc: `RoomDO` persists snapshots, log/audit/chat entries, cell metadata, and room metadata through `this.#state.storage.put(...)` or transaction `put(...)` calls (for example `packages/worker/src/room.ts:619,1219,1235-1240,2125-2131,2334,2388`), rather than application-defined SQL tables. Those values are nevertheless inside the SQLite-backed object's PITR scope.

Cloudflare exposes three bookmark primitives:

- `getCurrentBookmark()` returns the object's current history bookmark.
- `getBookmarkForTime(timestamp)` resolves an approximate bookmark for a timestamp within the 30-day window.
- `onNextSessionRestoreBookmark(bookmark)` configures the object so that, on its next restart, its storage matches that bookmark. Cloudflare states: “After calling this, the application should typically invoke `ctx.abort()` to restart the Durable Object, thus completing the point-in-time recovery.” The method returns a bookmark for the moment immediately before recovery, so submitting that bookmark in a second restore undoes the first restore.

EtherCalc wraps the latter two primitives in the bearer-gated `POST /_/:room/pitr-restore` contract documented in `API.md:133-197`; the response includes `undoBookmark`, which the operator MUST retain before proceeding to the next room.

Cloudflare also states: “The PITR API is not supported in local development because a durable log of data changes is not stored locally.” This agrees with `API.md:137`: Miniflare and standalone workerd return `501`. Therefore **the PITR safeguard cannot be rehearsed locally**. The operator MUST exercise the dry-run, restore, verification, and undo sequence against a real Cloudflare staging deployment before relying on it in production.

PITR is scoped to one Durable Object instance, not a namespace. EtherCalc has one `RoomDO` per room (`packages/worker/wrangler.toml:28-33`), so there is no “restore all rooms” platform operation. `AuthDO` is different only in cardinality: the application addresses the singleton as `idFromName('auth')` (`packages/worker/src/routes/auth.ts:52-56`), so AuthDO recovery is a single-object operation rather than a room iteration. Although `AuthDO` is PITR-eligible, the checked-in operator endpoint currently dispatches only to `RoomDO`; the repository has no AuthDO restore command.

### 2.4 Bounded RoomDO Recovery (Not Whole-Instance Mass Restore)

#### 2.4.1 Scale reality — mass PITR is not a human incident procedure

D1 and Durable Object PITR supply complementary halves of recovery for a
**bounded** set of rooms: D1 names candidates; per-room
`POST /_/:room/pitr-restore` rewinds that room's RoomDO. There is **no**
"restore all rooms" platform operation (`packages/worker/wrangler.toml:28-33`
— one RoomDO per room; PITR is per object).

Production cardinality is the migration-seed order of magnitude:
**~1.8M rooms** (`packages/worker/src/lib/rooms-index.ts:63-82`). Quantify
before writing any loop:

| Candidate set | At 1 room/s sequential (dry-run **or** restore) | Dry-run + restore @ 1/s each | Notes |
| ------------: | ----------------------------------------------: | ---------------------------: | :---- |
| 100 rooms | ~2 minutes | ~3 minutes | Plausible interactive incident work. |
| 1 000 rooms | ~17 minutes | ~33 minutes | Scripted; still a single shift. |
| 18 000 rooms (1% of 1.8M) | **~5 hours** | **~10 hours** | Not a page-and-fix loop. Needs a reviewed driver, progress log, and staffing. |
| 1.8M rooms (whole index) | **~500 hours (~21 days)** | **~1000 hours** | **Not an incident procedure.** |

Even optimistic automation (e.g. 5 concurrent restores) only divides the
table by a small constant; it does not create a whole-fleet button. EtherCalc
ships **no** bulk-PITR CLI under `packages/cli/`, `scripts/`, or `bin/` —
only the single-room HTTP endpoint (`API.md` PITR section).

**Reframe (normative):**

- **In scope for §2.4:** a **bounded, pre-enumerated** candidate set —
  typically public rooms whose `rooms.updated_at` falls inside a known
  incident window, plus any private rooms discovered by a *successful*
  scale-safe enumeration (§2.4.2) or out-of-band inventory.
- **Out of scope:** whole-instance RoomDO recovery. **Say this plainly:
  there is no operator-side mechanism to rewind every Durable Object at
  this scale.** Because private rooms are already live on ethercalc.net
  (STOP banner), that recovery exposure exists from the first moment of
  the cutover — it is not deferred by any soak. The mitigations that
  actually apply are the §4 gradual ramp with its rollback floor
  (`CURRENT_PROD_VERSION_ID`) and the §2 backup artifacts.

#### 2.4.2 Candidate enumeration (public window + private discovery)

1. **Freeze the recovery inputs.** Record incident start/end in UTC and pick
   **one** restore timestamp immediately before the first bad write, inside
   Cloudflare's ~30-day DO PITR window. Do not invent per-room timestamps
   unless analysis requires it.
2. **Prefer windowed public-index queries** — this is the primary,
   scale-appropriate path. `updated_at` is a JS millisecond epoch; replace
   the example bounds; **page if the window is wide**:

   ```bash
   # 2a. Public rooms touched in the incident window (primary candidate source).
   #     rooms_updated_at index: packages/worker/migrations/0001_rooms.sql:23
   npx wrangler d1 execute ethercalc_rooms \
     --remote \
     --config=packages/worker/wrangler.toml \
     --env="" \
     --command="SELECT room, updated_at FROM rooms WHERE updated_at BETWEEN 1786363200000 AND 1786366800000 ORDER BY updated_at ASC LIMIT 1000;"

   # Continue paging with updated_at / room keyset when the window returns
   # LIMIT rows (D1 max query duration = 30s; single-threaded DB):
   # SELECT room, updated_at FROM rooms
   #  WHERE updated_at BETWEEN … AND …
   #    AND (updated_at > :last_ts OR (updated_at = :last_ts AND room > :last_room))
   #  ORDER BY updated_at ASC, room ASC
   #  LIMIT 1000;
   ```

   Equivalent HTTP sources for an unfiltered public list are `GET /_rooms`
   and `GET /_roomtimes` — prefer D1 when filtering by incident window.
   **Do not** `SELECT room FROM rooms` without a window if the goal is
   incident recovery; pulling ~1.8M names to restore "everything" is the
   whole-instance anti-pattern from §2.4.1.

3. **Private-room discovery is best-effort and may not be runnable as a
   single query at scale.** `[OPERATOR-VERIFY]`

   Schema facts:
   - Private rooms are write-time **excluded** from `rooms`
     (`RoomDO.#mirrorIndex` returns early when `access === 'private'`;
     `#postTouch` deletes any index row — `packages/worker/src/room.ts`).
   - Audit/chat mirrors are **not** access-filtered
     (`#mirrorAudit` / `#mirrorChat`), so active private rooms *can* appear
     in `audit_log` / `chat_log`.
   - Secondary indexes `audit_log_room` and `chat_log_room` exist on
     `room` (`packages/worker/migrations/0003_audit_chat.sql:29,38`) — they
     help **per-room** delete/history, **not** a full-table distinct scan.

   The historically documented one-shot form:

   ```sql
   SELECT DISTINCT room FROM audit_log
   UNION
   SELECT DISTINCT room FROM chat_log;
   ```

   is **likely to exceed D1's 30-second SQL duration limit** once those
   tables hold on the order of `active_rooms × keep` rows (e.g. thousands of
   full-tail rooms × ~1.5k rows each → multi-million to hundreds-of-millions
   of rows) on a **single-threaded** database
   ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/)). An
   index on `room` does not make `DISTINCT` across the whole table free.

   **Workable batched form (still `[OPERATOR-VERIFY]` on production):**
   page each table by `room` keyset, merge distinct names out-of-band, and
   optionally restrict by `ts` when the incident window is known:

   ```bash
   # 2b-i. Page distinct rooms from audit_log (repeat until < LIMIT rows).
   # Start with :after_room = '' (empty string sorts before names).
   npx wrangler d1 execute ethercalc_rooms \
     --remote \
     --config=packages/worker/wrangler.toml \
     --env="" \
     --command="SELECT room, MAX(ts) AS last_ts FROM audit_log WHERE room > '' GROUP BY room ORDER BY room ASC LIMIT 500;"

   # Next page: replace '' with the last `room` value from the prior page:
   # SELECT room, MAX(ts) AS last_ts FROM audit_log
   #  WHERE room > '<LAST_ROOM>'
   #  GROUP BY room ORDER BY room ASC LIMIT 500;

   # 2b-ii. Same pattern on chat_log.
   # 2b-iii. Optional incident filter while paging:
   # SELECT room, MAX(ts) AS last_ts FROM audit_log
   #  WHERE room > '<LAST_ROOM>' AND ts BETWEEN <start_ms> AND <end_ms>
   #  GROUP BY room ORDER BY room ASC LIMIT 500;
   ```

   If even the paged `GROUP BY room` form times out or overloads D1 under
   live traffic, **stop** — fall back to edge/access logs, application
   audit trails, or a pre-maintained private-room inventory. Do not burn
   the incident clock on a full-table scan that the platform will not
   finish.

   Idle private rooms (created, never edited/chatted) and rooms wiped via
   `DELETE /_do/all` (which clears D1 tails) **never** appear in these
   tables. Tails are also bounded
   (`AUDIT_HISTORY_KEEP = 1024`, `CHAT_HISTORY_KEEP = 500`), so D1 is an
   enumeration aid, not a content backup.

#### 2.4.3 Per-room dry-run / restore loop (bounded set only)

Run only after §2.4.2 has produced a **finite** candidate file whose size
matches the wall-clock budget in §2.4.1.

1. **Dry-run every candidate sequentially** (or with modest, reviewed
   concurrency). URL-encode the room as one path segment:

   ```bash
   curl -sS --fail-with-body -w '\nHTTP %{http_code}\n' -X POST "https://ethercalc.net/_/<URL_ENCODED_ROOM>/pitr-restore" \
     -H "Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"at":"2026-08-10T11:59:59.000Z","dryRun":true}'
   ```

   Record room, source (`rooms.updated_at` or `[private-log]`), requested
   timestamp, resolved `bookmark`, HTTP status, and body. Stop on any
   non-200; do not silently skip.

2. **Apply and verify one room at a time.** Submit the dry-run bookmark,
   retain `undoBookmark`, verify snapshot/content, then advance:

   ```bash
   curl -sS --fail-with-body -w '\nHTTP %{http_code}\n' -X POST "https://ethercalc.net/_/<URL_ENCODED_ROOM>/pitr-restore" \
     -H "Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN" \
     -H "Content-Type: application/json" \
     --data '{"bookmark":"<BOOKMARK_FROM_DRY_RUN>"}'
   ```

   Success reports `restored: true`; `exists: false` means the target
   predates room creation. On verification failure, submit `undoBookmark`
   as `bookmark` before investigating. Keep the candidate list and
   per-room responses as the recovery audit record.

PITR rewinds the **entire** RoomDO SQLite database (including later
key-value state). It cannot surgically drop one bad SocialCalc command
while keeping later good ones. Throughput is whatever delay/retry/
concurrency the operator's reviewed script enforces — EtherCalc supplies
none.

#### 2.4.4 Enumeration asymmetry & privacy (unchanged facts, scale-aware reading)

1. **Private Room Index Exclusion**: `POST /_/private` → `/_do/init-private`
   sets `meta:access = 'private'` without `#mirrorIndex`; subsequent writes
   hit `RoomDO.#mirrorIndex` which returns early on private access; `#postTouch`
   deletes any `rooms` row for private rooms. Private names never appear in
   `GET /_rooms` / `GET /_roomtimes` / `SELECT room FROM rooms`.
2. **Unfiltered audit/chat mirroring**: `#mirrorAudit` / `#mirrorChat` perform
   no access check — private commands and chat land in D1 tails.
3. **`_formdata` siblings**: filtered from the public index by
   `isPublicRoomIndexEntry`.
4. **Privacy**: `wrangler d1 export` artifacts contain private-room material;
   handle as sensitive.
5. **Tooling gap**: no bulk-PITR driver ships in-repo. At this scale that gap
   is not "write a quick for-loop during the incident" for anything beyond a
   small bounded set — prepare and peer-review any driver **before** cutover
   if the change-management plan assumes scripted multi-room restore.

---

## §3 Staging Rehearsal (single gradual ramp)

> **Live staging dress rehearsal for the §4 cutover.** Rehearse the **§4.3 single-ramp** sequence against `[env.staging]` (`ethercalc-staging`) with `ETHERCALC_AUTH` left at `"1"` throughout: upload → version-override smoke → `@10%` / `@50%` / `@100%` → rollback to the pre-ramp staging version. Do **not** rehearse Phase 1 lifecycle worktrees, a `release/phase2-rollout` branch, or any `ETHERCALC_AUTH="0"` / `enabled:false` acceptance path. That superseded three-phase staging material is preserved only in **Appendix A.0** (analysis / incident history — not a live procedure).

Rehearse end-to-end acceptance on `https://ethercalc-staging.audreyt.workers.dev` so the production §4.3 sequence is practiced before any production upload.

### 3.1 Staging deployment safety (any staging deploy)

These guards are baseline-independent and load-bearing for **every** staging deploy — single-ramp or otherwise:

- **CRITICAL WARNING [EMPIRICALLY VERIFIED]**: When `.wrangler/deploy/config.json` exists, running `wrangler deploy --env staging` without `--config wrangler.toml` does **NOT** throw an error — Wrangler silently falls back to the top-level production configuration in `dist/ethercalc/wrangler.json` (which drops `[env.staging]`), binding directly to the **production D1 database (`ethercalc_rooms`)** and **production WebAuthn RP ID (`ethercalc.net`)**. Operators MUST ALWAYS pass `--config wrangler.toml --env=staging` to guarantee staging database and domain isolation.
  > **PARTIALLY AUTOMATED** — Root test `nightly staging validation bypasses the generated production config` (`scripts/vite-workflow.test.ts:458-469`; root `vp run test`) pins the nightly command to `--config wrangler.toml --env staging` and rejects its unqualified form. It does not protect an operator's ad hoc CLI command; the explicit `--config` live-deploy check remains load-bearing.
- **WARNING**: An ambient exported shell variable (e.g., `ETHERCALC_AUTH="0" wrangler deploy`) has no effect on deployed Worker vars because Wrangler resolves Worker variables from `wrangler.toml`, not the ambient process environment. Checked-in staging vars already set `ETHERCALC_AUTH = "1"` (`packages/worker/wrangler.toml` `[env.staging.vars]`); leave that value alone for this rehearsal.
- **[OPERATOR-VERIFY]**: Whether `wrangler deploy --var <KEY>:<VALUE>` is accepted at all is **not** confirmed in published Wrangler CLI documentation for the pinned CLI. Run `wrangler deploy --help` before relying on `--var` for any key. Ambient shell exports are not a substitute for values in `wrangler.toml` (or a confirmed `--var` mechanism). **This cutover's staging rehearsal must not override `ETHERCALC_AUTH` off** — keep the checked-in `"1"`.

Also apply the §4.0 deploy-configuration source-of-truth / redirect-banner guard before any local Wrangler upload or deploy to staging.

### 3.2 Single-ramp staging rehearsal (derive from §4.3)

Mirror **§4.3 Steps 0–5 and the ramp-abort path**, retargeted at staging. Keep `ETHERCALC_AUTH = "1"` in `packages/worker/wrangler.toml` for every artifact (including `[env.staging.vars]`). **Never** deploy an `AUTH=0` / auth-unbound bundle to staging as a soak stand-in for this cutover.

#### Staging rehearsal log — capture **before** any staging upload

| Artifact | When | Why |
| :------- | :--- | :-- |
| **`STAGING_PRE_RAMP_VERSION_ID`** | **First** — from staging `wrangler deployments list` / `versions list` before upload | **Rollback floor** for the rehearsal (staging analogue of `CURRENT_PROD_VERSION_ID`) |
| Staging annotation (git SHA / message if present) | Same time | Pins what staging was serving before the rehearsal |
| `STAGING_SHIP_VERSION_ID` | Output of staging `versions upload` | Ramp + smoke target |
| Edge purge confirmation (if staging HTML/JS is cached at a custom hostname; workers.dev may not need it) | After traffic-affecting steps | **`[OPERATOR-VERIFY]`** whether staging requires the same Cloudflare Dashboard purge used in §4.3 Step 4 |

#### Step 0 — Pin staging baseline (blocking)

1. Record `STAGING_PRE_RAMP_VERSION_ID` from staging `wrangler deployments list` / `versions list` before upload (staging analogue of §4.3 Step 0’s `CURRENT_PROD_VERSION_ID` pin). **§4.3 does not publish exact CLI flags for these list commands** (production or staging). **`[OPERATOR-VERIFY]`**: settle and record the working staging-selection form on the pinned Wrangler CLI (must isolate `ethercalc-staging` / `[env.staging]`; carry explicit `--config wrangler.toml` per §3.1 whenever the command accepts it). Do not invent flags here.
2. Green preflight on the **ship tree** (not a Phase 1 worktree) — §1.
3. Confirm checked-in `[env.staging.vars]` still has `ETHERCALC_AUTH = "1"` — do not edit it for this rehearsal.

#### Step 1 — Staging D1 migrations (still run and record)

```bash
npx wrangler d1 migrations list ethercalc_rooms_staging --remote \
  --config=packages/worker/wrangler.toml --env=staging
npx wrangler d1 migrations apply ethercalc_rooms_staging --remote \
  --config=packages/worker/wrangler.toml --env=staging
```

If `list` shows unexpected pending migrations, **STOP** and reconcile before uploading. **`[OPERATOR-VERIFY]`**

#### Step 2 — Build and upload ship version to staging at 0% traffic

Follow §4.0 (config source-of-truth / no generated-config redirect banner) and §3.1 (`--config wrangler.toml --env=staging`).

```bash
# MANDATORY: §4.0 verification (no wrangler redirect banner; explicit --config)
vp run build:assets
cd packages/worker
npx wrangler versions upload --config=wrangler.toml --env=staging
# Record STAGING_SHIP_VERSION_ID from CLI output → staging rehearsal log
cd ../..
```

`ETHERCALC_AUTH` must remain `"1"` in the uploaded staging config. Do not pass a `--var ETHERCALC_AUTH:0` override.

#### Step 3 — Version-override smoke at 0% on staging

Exercise the ship bundle on the staging hostname **without** shifting default staging traffic ([Version Overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/)):

```bash
HDR='Cloudflare-Workers-Version-Overrides: ethercalc-staging="<STAGING_SHIP_VERSION_ID>"'

# Auth steady-state MUST stay enabled
curl -fsS -H "$HDR" https://ethercalc-staging.audreyt.workers.dev/_auth/whoami
# Expected: {"uid":null,"enabled":true}

curl -fsS -H "$HDR" https://ethercalc-staging.audreyt.workers.dev/_health
# Expected: {"status":"ok","version":"0.0.0","now":"<ISO-8601>"}

# Root HTML should reference externalized page scripts once ship assets are served
curl -fsS -H "$HDR" https://ethercalc-staging.audreyt.workers.dev/ | head -c 8000
# Expect: static/index-bootstrap.js (and related page scripts); no manifest.appcache

curl -fsS -H "$HDR" -o /dev/null -w '%{http_code}\n' \
  https://ethercalc-staging.audreyt.workers.dev/static/index-bootstrap.js
# Expected: 200

# Public sheet read still works under override
curl -fsS -H "$HDR" -o /dev/null -w '%{http_code}\n' \
  https://ethercalc-staging.audreyt.workers.dev/testprodcutover
# Expected: 200
```

**`[OPERATOR-VERIFY]`**: §4.3 uses Worker name `ethercalc` in the version-overrides header. Staging Worker name is `ethercalc-staging` (`packages/worker/wrangler.toml` `[env.staging] name`). Confirm the header key above is accepted on staging; if Cloudflare expects a different worker-name key, record the working header before treating smoke as green.

**Abort** if `enabled` is not `true`, if health fails, or if ship-required static assets 404 under the override. Do not ramp.

Optional but strongly recommended under override before ramp (**`[OPERATOR-VERIFY]`**, needs a throwaway staging private room + test passkey — staging passkeys are bound to RP ID `ethercalc-staging.audreyt.workers.dev` and are **not** portable to production):

- complete a discoverable login;
- confirm owner can `GET`/`POST` an owned private room;
- confirm anonymous `GET` on that private room is 403;
- confirm `POST /_/:room` over-limit command returns **413** (rejection propagation), not 202.

#### Step 4 — Gradual ramp on staging

```bash
cd packages/worker
npx wrangler versions deploy <STAGING_SHIP_VERSION_ID>@10% --config=wrangler.toml --env=staging
# Dwell; watch error/latency analytics; spot-check Step 5 / §5-style probes on default staging traffic
npx wrangler versions deploy <STAGING_SHIP_VERSION_ID>@50% --config=wrangler.toml --env=staging
# Dwell again
npx wrangler versions deploy <STAGING_SHIP_VERSION_ID>@100% --config=wrangler.toml --env=staging
cd ../..
```

**`[OPERATOR-VERIFY]`**: §4.3 production ramp uses `--env=""` (and explicit `--config` on upload). Confirm `versions deploy … --config=wrangler.toml --env=staging` selects the staging Worker on the pinned CLI; if not, record the working form (still with explicit `--config=wrangler.toml` per §3.1 / §4.0).

After the first percentage step that serves new HTML/JS to real staging clients, and again at 100%, purge edge cache **if** staging is fronted by a cached hostname — same Dashboard path as §4.3:

```text
Cloudflare Dashboard → Caching → Configuration → Purge Everything
```

**`[OPERATOR-VERIFY]`** whether `ethercalc-staging.audreyt.workers.dev` requires this purge for the rehearsal to be valid; do not skip a needed purge, and do not invent a different purge API here.

**Ramp abort (must rehearse):** return 100% staging traffic to the pre-ramp version:

```bash
cd packages/worker
npx wrangler versions deploy <STAGING_PRE_RAMP_VERSION_ID>@100% --config=wrangler.toml --env=staging
cd ../..
# Purge edge again if Step 4 required purge, so clients drop ship HTML that points at new static/* files
```

Rehearsal is incomplete until this rollback path has been executed successfully at least once on staging.

#### Step 5 — Post-ramp verification on staging

Reuse §5 probe *mechanics* with corrected auth expectations, against `https://ethercalc-staging.audreyt.workers.dev`:

- Probe 1 health — unchanged.
- **whoami:** `{"uid":null,"enabled":true}` (old Phase 2 expected `enabled:false` — **discard that contract** for this cutover; see Appendix A.0 only).
- Probe 3 anonymous `POST /_/private` → 401 still valid (auth on, no session).
- Probe 4 / asset probes — must include **`/static/index-bootstrap.js` → 200`** and root HTML without `manifest.appcache`.
- Probes 5–10 (public sheet, sheet-limit **413**, WS upgrade, socket.io, `/_rooms` 403, XLSX) — still valid; prefer staging room names such as `staging-limit-test` / `staging-xlsx-test` so rehearsal artifacts stay obvious.
- Probe 11 style whoami enabled — already steady-state, not a “Phase 3 flip”.
- Probe 12 www redirect — **production-only** edge behavior; **`[OPERATOR-VERIFY]`** whether staging has an analogue worth checking (do not invent a staging www host).

Plus operator checks:

- logged-in private room owner path on staging RP (credentials are not portable to production);
- security-header / CSP smoke on a room page **`[OPERATOR-VERIFY]`**;
- API client that previously relied on over-limit `POST /_/:room` → 202 must see 413.

XLSX spelling trap (still live; unchanged fact): `GET /_/<room>.xlsx` is **not** an export route — it targets a raw room name and 404s. Valid export spellings remain `GET /<room>.xlsx` and `GET /_/<room>/xlsx` (see former §3.2 item 6 / §5 Probe 10).

### 3.3 Pass criteria before production §4

Staging rehearsal passes only when **all** of the following hold:

1. Override smoke accepted `enabled:true` (never `enabled:false`).
2. `@10%` → `@50%` → `@100%` completed without abort, **or** an intentional abort was executed and `STAGING_PRE_RAMP_VERSION_ID@100%` restored cleanly.
3. The rollback command in Step 4 was practiced successfully at least once.
4. Post-ramp probes match the §4.3 Step 5 / §5 live contracts above.
5. No runnable step in the rehearsal sets or implies `ETHERCALC_AUTH="0"`.

On pass, proceed to production **§4**. On fail, **do not** upload a production ship version.

---


## §4 Hosted cutover (single gradual ramp)

> **Status (2026-08-10):** **live hosted cutover procedure.** Derived from repo evidence against the live-probe bounds in the STOP banner. **Blocking before upload:** record `CURRENT_PROD_VERSION_ID` from `wrangler deployments list` / `versions list`, and rehearse this single-ramp shape on staging. This section supersedes the three-phase sequence preserved in Appendix A (old §4.2–§4.4 / old rollback graph / old three-phase Go/No-Go). Appendix A is retained for analysis only — do **not** execute it.

### 4.0 Deploy-Configuration Source of Truth & Operator Verification Guard

**Configuration Source of Truth:**  
In production CI (`.github/workflows/deploy-production.yml`), deploys execute on a fresh checkout where `.wrangler/` and `dist/` are gitignored and absent. Wrangler reads `packages/worker/wrangler.toml` directly and uploads curated static assets from repo-root `assets/`.

**Local Operator Workspace Artifact Risk:**  
If an operator runs root `vp build` (or Vite `build` targeting `vite.config.mts`) locally prior to deployment, Vite's `@cloudflare/vite-plugin` generates `packages/worker/dist/ethercalc/wrangler.json` and writes a Wrangler redirect file at `packages/worker/.wrangler/deploy/config.json`.
- When `.wrangler/deploy/config.json` exists, Wrangler redirects configuration lookup to `dist/ethercalc/wrangler.json` instead of `wrangler.toml`.
- **Field-by-Field Discrepancies in Generated `dist/ethercalc/wrangler.json`:**
  1. **`compatibility_date`**: `wrangler.toml` specifies `2026-07-21`; `wrangler.json` changes this to `2024-11-12`.
  2. **`rules`**: `wrangler.toml` defines a `Text` rule for `**/SocialCalc.js`; `wrangler.json` replaces it with an `ESModule` rule for `**/*.js`, `**/*.mjs`.
  3. **`main`**: `wrangler.toml` points to `"src/index.ts"`; `wrangler.json` points to pre-bundled `"index.js"`.
  4. **`assets.run_worker_first`**: `wrangler.toml` sets `run_worker_first = true`; `wrangler.json` **omits `run_worker_first` entirely**, altering route precedence.
  5. **`assets.directory`**: `wrangler.toml` points to `../../assets` (repo-root curated assets); `wrangler.json` points to `../client` (`packages/worker/dist/client`), which lacks 5 static JS files (`static/index-bootstrap.js`, `static/index-l10n.js`, `static/panels.js`, `static/start-bootstrap.js`, `static/start-page.js`) and contains stale asset hashes.
  6. **`[env.staging]` Overlay**: `wrangler.toml` defines the staging environment (`ethercalc_rooms_staging`, `ethercalc-staging.audreyt.workers.dev`); `wrangler.json` **drops `[env.staging]` entirely**, causing `wrangler deploy --env staging` to target production database and RP ID if run under the redirect.
  7. **Stale `[vars]` Risk**: Edits made to `packages/worker/wrangler.toml` before upload (including any mistaken `ETHERCALC_AUTH` toggle) will NOT take effect if Wrangler reads a stale `dist/ethercalc/wrangler.json` generated prior to the edit. Live cutover must keep `ETHERCALC_AUTH = "1"`.

**Operator Positive Verification Step (Before Every Deploy):**  
Before running `vp exec wrangler deploy --env=""` or `npx wrangler deploy` in `packages/worker`, the operator MUST verify configuration resolution:
1. Confirm that `wrangler deploy --dry-run` output does **NOT** display the line:  
   `Using redirected Wrangler configuration.`
2. If a redirect exists locally, ALWAYS pass `--config wrangler.toml` explicitly (e.g. `npx wrangler deploy --config wrangler.toml --env=""`) to force Wrangler to read `wrangler.toml` directly and upload from `assets/`.
3. For staging deploys, ALWAYS pass `--config wrangler.toml --env staging` (e.g. `npx wrangler deploy --config wrangler.toml --env staging`) so Wrangler reads `wrangler.toml` directly and applies `[env.staging]` overlay bindings.
> **PARTIALLY AUTOMATED** — Root test `nightly staging validation bypasses the generated production config` (`scripts/vite-workflow.test.ts:458-469`; root `vp run test`) guarantees the checked-in nightly staging gate uses explicit source config. It does not inspect an operator workspace, production workflow command, or ad hoc deploy, so the redirect-banner check above still protects the artifact actually being uploaded.

### 4.1 Derivation checks (repo-verified)

| # | Claim | Verdict | Evidence |
| - | :---- | :------ | :------- |
| **D1** | No DO lifecycle change remains between production’s candidate floor and `main`/`HEAD` | **Holds**, conditional on prod already running PR #841-era code (live `enabled:true` ⇒ `env.AUTH` bound ⇒ `v2`/`AuthDO` present) | `packages/worker/wrangler.toml` at `d2afa90`, `b7d8840^`, `b7d8840`, `main`, and `HEAD` all declare **only** `[[migrations]] tag=v1 new_sqlite_classes=["RoomDO"]` and `tag=v2 new_sqlite_classes=["AuthDO"]` — identical class set. `git diff d2afa90 HEAD -- packages/worker/wrangler.toml` changes `compatibility_date`, comments, `run_worker_first`, and email-binding comments — **not** migrations/bindings class list. |
| **D2** | Do not manipulate `ETHERCALC_AUTH`; leave production at `"1"` | **Holds** | Checked-in `[vars]` keep `ETHERCALC_AUTH = "1"` at `d2afa90` through `HEAD` (prod + staging overlays). Live `GET /_auth/whoami` → `enabled:true`. `verifyAuthSession` / `authEnabled` fail closed when the flag is off (`packages/worker/src/lib/auth-session.ts`, `routes/auth.ts`); RoomDO private ACL then 403s owners. The old Phase 2 `AUTH=0` soak is therefore an outage vector, not a safety measure. |
| **D3** | Rolling `main` back to current production does **not** declassify private rooms (both sides enforce ACL) | **Holds** for authz data path | At `d2afa90` (PR #841 merge): `packages/worker/src/lib/authorize.ts` implements deny-overrides private ACL; `room.ts` imports it and gates via `#isAuthorized` / `meta:access`+`meta:acl` before dispatch — same model AGENTS.md decision #14 describes. `git diff d2afa90 HEAD -- packages/worker/src/lib/authorize.ts` is **empty**. Exposure analysis in Appendix A.2 (old §6.2) that assumed rollback to pre-ACL / `AUTH=0` code is **inapplicable** to prod↔`main` rollback. |

**What D3 does *not* claim:** rollback is free of *all* user impact. Security-audit `main` renames the session cookie `ec_sess` → `__Host-ec_sess` (`packages/worker/src/lib/session.ts`) and does **not** read the old name. Token bytes remain AuthDO HMAC sessions over the same `session-secret` storage key, but browsers holding only `ec_sess` look anonymous on the new Worker until they complete a passkey ceremony again. That is **temporary lockout-until-relogin**, not world-readable declassification. Marked as a first-class residual risk in §4.5.

**Still open (cannot settle from git alone):**

- Exact production Worker version ID and git SHA — **`[OPERATOR-VERIFY]` #1:**
  ```bash
  npx wrangler deployments list --config=packages/worker/wrangler.toml --env=""
  npx wrangler versions list --config=packages/worker/wrangler.toml --env=""
  ```
- Whether every commit in `d2afa90..b7d8840^` is already live (multi-sheet entry restore, Vite+ workflow, headless harden, etc.) — same pin.
- Live D1 applied-migration set equals the three checked-in SQL files — expected, but confirm with `npx wrangler d1 migrations list ethercalc_rooms --remote --config=packages/worker/wrangler.toml --env=""` **`[OPERATOR-VERIFY]`**.
- Cloudflare account still allows `versions upload` + percentage `versions deploy` for this Worker (platform/docs assumption; rehearse on staging) **`[OPERATOR-VERIFY]`**.

### 4.2 Platform consequence (why the three-phase shape collapses)

Cloudflare refuses **upload** of a Worker version that *changes* Durable Object class lifecycle, and forbids rollback to any version from before the lifecycle-changing deploy ([Gradual deployments with Durable Objects](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/)).

Relative to real production (post-`v2`):

- `main` / current `HEAD` introduce **no** new `[[migrations]]` tag and no new DO class;
- therefore **`npx wrangler versions upload` is permitted** for the ship bundle;
- a normal gradual ramp (`@10%` → `@50%` → `@100%`) is available;
- **`npx wrangler versions deploy <CURRENT_PROD_VERSION_ID>@100%` (or equivalent rollback to the recorded pre-cutover version) is permitted** for the code/assets delta — the irreversible lifecycle boundary is **already behind** production, not ahead of this cutover.

This does **not** restore pre-`v2` / pre-passkey code as a rollback target (platform still forbids that). It means the rollback floor for *this* upgrade is **the currently serving production version**, not a freshly built Phase 1 lifecycle bundle and not `149ebcf`.

### 4.3 Corrected hosted sequence (single gradual ramp)

Keep `ETHERCALC_AUTH = "1"` in `packages/worker/wrangler.toml` for every artifact in this sequence. **Never** deploy an `AUTH=0` / auth-unbound bundle to production as a soak step.

#### Cutover log — capture **before** any upload

| Artifact | When | Why |
| :------- | :--- | :-- |
| **`CURRENT_PROD_VERSION_ID`** | **First** — from `wrangler deployments list` / `versions list` before upload | **Rollback floor** for the entire cutover |
| `CURRENT_PROD_ANNOTATION` (git SHA / message if present) | Same time | Pins candidate-range position; records what intermediate fixes are already live |
| D1 Time Travel bookmark + `database_size` | Before any remote change | §0.2.1 / §0.2.2 / §2.1 — unchanged |
| Optional D1 SQL export | Before any remote change | §2.1 — size-budgeted; not a DO sheet backup |
| `SHIP_VERSION_ID` | Output of `versions upload` | Ramp + soak target |
| Edge purge confirmation | After each traffic-affecting step that ships HTML/JS | Root HTML + `static/*` layout changes |

#### Step 0 — Pin and preflight (blocking)

1. Record `CURRENT_PROD_VERSION_ID` (**#1 open item**).
2. Confirm secrets still present (`ETHERCALC_KEY`, and `ETHERCALC_MIGRATE_TOKEN` only if PITR/migrate routes are in-scope for the window) — §0.1.
3. Capacity + Time Travel gates — §0.2.1 / §0.2.2.
4. Green preflight on the **ship tree** (not the old Phase 1 worktree) — §1.
5. Staging rehearsal of **this** single-ramp shape (upload → version-override smoke → percentage ramp → rollback to the staging pre-ramp version) — **§3** (live single-ramp staging rehearsal). **`[OPERATOR-VERIFY]`**

#### Step 1 — D1 migrations (expected no-op; still run and record)

Checked-in D1 files `packages/worker/migrations/0001_rooms.sql`, `0002_cron.sql`, `0003_audit_chat.sql` are **byte-identical** at `d2afa90` and `HEAD` (same git blob OIDs). Relative to any production revision inside the candidate range, remote apply should report nothing pending.

```bash
npx wrangler d1 migrations list ethercalc_rooms --remote \
  --config=packages/worker/wrangler.toml --env=""
npx wrangler d1 migrations apply ethercalc_rooms --remote \
  --config=packages/worker/wrangler.toml --env=""
```

If `list` shows unexpected pending migrations, **STOP** and reconcile — do not assume the candidate-range premise. **`[OPERATOR-VERIFY]`**

#### Step 2 — Build and upload ship version at 0% traffic

Follow §4.0 (config source-of-truth / no generated-config redirect banner) unchanged.

```bash
# MANDATORY: §4.0 verification (no wrangler redirect banner; explicit --config)
vp run build:assets
cd packages/worker
npx wrangler versions upload --config=wrangler.toml --env=""
# Record SHIP_VERSION_ID from CLI output → cutover log
cd ../..
```

`ETHERCALC_AUTH` must remain `"1"` in the uploaded config. Do not pass a `--var ETHERCALC_AUTH:0` override.

#### Step 3 — Version-override smoke at 0% (survives from old §4.3)

Exercise the ship bundle on production hostname **without** shifting default traffic ([Version Overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/)):

```bash
HDR='Cloudflare-Workers-Version-Overrides: ethercalc="<SHIP_VERSION_ID>"'

# Auth steady-state MUST stay enabled (corrected expectation vs old Phase 2 probes)
curl -fsS -H "$HDR" https://ethercalc.net/_auth/whoami
# Expected: {"uid":null,"enabled":true}

curl -fsS -H "$HDR" https://ethercalc.net/_health
# Expected: {"status":"ok","version":"0.0.0","now":"<ISO-8601>"}

# Root HTML should reference externalized page scripts once ship assets are served
curl -fsS -H "$HDR" https://ethercalc.net/ | head -c 8000
# Expect: static/index-bootstrap.js (and related page scripts); no manifest.appcache

curl -fsS -H "$HDR" -o /dev/null -w '%{http_code}\n' \
  https://ethercalc.net/static/index-bootstrap.js
# Expected: 200

# Public sheet read still works under override
curl -fsS -H "$HDR" -o /dev/null -w '%{http_code}\n' \
  https://ethercalc.net/testprodcutover
# Expected: 200
```

**Abort** if `enabled` is not `true`, if health fails, or if ship-required static assets 404 under the override. Do not ramp.

Optional but strongly recommended under override before ramp (**`[OPERATOR-VERIFY]`**, needs a throwaway or operator-owned private room + test passkey — do not use customer data):

- complete a discoverable login;
- confirm owner can `GET`/`POST` an owned private room;
- confirm anonymous `GET` on that private room is 403;
- confirm `POST /_/:room` over-limit command returns **413** (rejection propagation), not 202.

#### Step 4 — Gradual ramp

```bash
cd packages/worker
npx wrangler versions deploy <SHIP_VERSION_ID>@10% --env=""
# Dwell; watch error/latency analytics; spot-check Step 5 / §5 probes on default traffic
npx wrangler versions deploy <SHIP_VERSION_ID>@50% --env=""
# Dwell again
npx wrangler versions deploy <SHIP_VERSION_ID>@100% --env=""
cd ../..
```

After the first percentage step that serves new HTML/JS to real clients, and again at 100%:

```text
Cloudflare Dashboard → Caching → Configuration → Purge Everything
```

(A cached production root normally still boots against the ship Worker because its old asset references remain served; it prolongs hybrid old-HTML/new-Worker skew. The broken mixed-version direction is ship HTML routed to pre-`b7d8840` assets, where the extracted `static/*.js` files 404. Browsers that still honor AppCache can additionally pin the old master HTML because `manifest.appcache` remains byte-identical — §4.5.)

**Ramp abort:** return 100% to the pre-cutover version immediately:

```bash
cd packages/worker
npx wrangler versions deploy <CURRENT_PROD_VERSION_ID>@100% --env=""
cd ../..
# Purge edge again so clients drop ship HTML that points at new static/* files
```

#### Step 5 — Post-ramp verification

Reuse §5 probe *mechanics* with corrected auth expectations:

- Probe 1 health — unchanged.
- **whoami:** `{"uid":null,"enabled":true}` (old Phase 2 expected `enabled:false` — **discard that contract** for this cutover).
- Probe 3 anonymous `POST /_/private` → 401 still valid (auth on, no session).
- Probe 4 / asset probes — must include **`/static/index-bootstrap.js` → 200`** and root HTML without `manifest.appcache`.
- Probes 5–10 (public sheet, sheet-limit **413**, WS upgrade, socket.io, `/_rooms` 403, XLSX) — still valid.
- Probe 11 style whoami enabled — already steady-state, not a “Phase 3 flip”.
- Probe 12 www redirect — still valid; still edge-only.

Plus operator checks that §5 never fully owned for this delta:

- logged-in private room owner path after possible cookie rename (§4.5);
- security-header / CSP smoke on a room page **`[OPERATOR-VERIFY]`**;
- API client that previously relied on over-limit `POST /_/:room` → 202 must see 413 (§4.5).

### 4.4 Rollback (corrected)

| Direction | Mechanism | Authz / private-room effect | Notes |
| :-------- | :-------- | :-------------------------- | :---- |
| Ship → current prod | `npx wrangler versions deploy <CURRENT_PROD_VERSION_ID>@100% --env=""` | **No ACL declassification** — both revisions enforce `meta:access`/`meta:acl` via `authorize.ts` | Primary rollback. Purge edge after. |
| Ship → pre-`v2` / `149ebcf` | **Not available** | n/a | Platform irreversible boundary already crossed when prod gained `AuthDO`. Do not build a Phase 1 lifecycle bundle expecting to “undo passkeys”. |
| Any → `AUTH=0` bundle | **Forbidden for this cutover** | Locks existing private rooms (owner 403) | Not a rollback tool. |

D1 Time Travel / SQL dump restore (§6) remains available for **D1 only** and still does **not** roll back RoomDO/AuthDO SQLite. Whole-fleet DO PITR remains non-viable at ~1.8M rooms (§2.4) — unchanged.

### 4.5 Residual risks for this smaller delta (honest list)

1. **Session cookie rename (`ec_sess` → `__Host-ec_sess`)** — security-audit change in `packages/worker/src/lib/session.ts`. New Worker ignores the old cookie name with no legacy fallback; users with only `ec_sess` appear signed out until they passkey-login again (new cookie issued), and an open private-room tab can fail to reconnect after the deploy drops its socket. During percentage ramp, clients may alternate versions and see intermittent whoami/uid. **Mitigations:** prefer low-traffic window; communicate “sign in again if private sheets 403”; consider staging a dual-read compatibility window in code only if operator rejects re-login (**not** in-repo today — would be a pre-cutover PR). Rollback to `CURRENT_PROD_VERSION_ID` restores old cookie-name behavior for browsers that still hold `ec_sess`.
2. **Root asset layout skew** — production root has inline bootstraps + `<html manifest="manifest.appcache">`; ship root requires five extracted `static/*.js` files and drops the manifest attribute (`b7d8840`). Cached old HTML normally still boots on the ship Worker because its references remain served, but prolongs hybrid skew. Ship HTML routed to pre-`b7d8840` assets can 404; AppCache-capable browsers can keep the old master root because the unchanged manifest still returns 200. **Mitigations:** mandatory edge purge at first traffic shift and at 100%; probe root plus all five extracted scripts; advise hard reload. Edge purge cannot clear a client-side Application Cache.
3. **`POST /_/:room` rejection propagation (`5d37bd0`)** — over-limit commands flip **202 false success → 413** with body `command exceeds sheet limits`. Correctness fix; API clients/scripts may observe new errors. Sheet-limit Probe 6 is load-bearing acceptance.
4. **Security-audit hardening behavior** — canonical WebSocket parsing plus frame/chat/cell caps, per-socket rates, body limits, export sanitizer tightening, CSP/`connect-src` origin anchoring, `__Host` cookie, AuthDO revoke-on-logout + per-IP ceremony limits, `/_timetrigger` gate, etc. The raw 1 MiB native string-frame threshold already existed at `d2afa90`, but the 1009 close, binary coverage, field caps, and Socket.IO caps are new. Expect more 413/1008/1009/401 responses on abusive or oversized clients; public anonymous write to public rooms remains by design.
5. **Open-tab WS reconnect without re-hydrate is a standing property** — `d2afa90` and ship source have the same fixed-delay reconnect, outbound queue flush, and `hadSnapshot` guard. The deploy restart exposes the limitation; the migration did not introduce it. Separately, a `d2afa90` form/app-mode tab has a real migration regression: its sole initial `_formdata`-labelled `ask.log` is dropped by the ship Worker's attachment-room gate, so it needs a reload onto the fixed client.
6. **`compatibility_date` 2024-11-12 → 2026-07-21** (and self-host workerd lockstep on ship tree) — behavior deltas are intended/audited but are still a runtime move; staging rehearsal must use the ship date **`[OPERATOR-VERIFY]`**.
7. **Candidate-range width (~17 days)** — until `CURRENT_PROD_VERSION_ID` is pinned, undeployed intermediate fixes inside `d2afa90..b7d8840^` are unknown. Strategy shape (single ramp, AUTH stays on) is stable across the range; **changelog/comms and exact probe expectations are not**.

### 4.6 What carries forward unchanged

- §4.0 deploy config redirect-banner guard (included above in this §4)
- §4.8–§4.9 corrected skew / reconnect analysis (+ companion `SKEW_AND_RECONNECT.md`; `d2afa90` conservative floor)
- §5 probe mechanics and non-auth response contracts (re-auth expectations per §4.3 Step 5)
- §0.2.2 capacity gate, §2 backup/PITR reality, §6 D1≠DO restore, §7 self-host divergence
- Version-override header smoke pattern (reused in §4.3 Step 3)

### 4.7 Explicitly retired for hosted prod cutover

- Phase 1 lifecycle-only deploy from `149ebcf` / `.worktrees/phase1-lifecycle` as a prerequisite to shipping `main`  
- Phase 2 `ETHERCALC_AUTH="0"` soak  
- Phase 3 green-field “enable passkeys” flip  
- Rollback narratives that treat “first private room / first passkey” as still in the future for ethercalc.net  
- Go/No-Go item 9’s `AUTH=0` justification (old §9)

---


### 4.8 Quantified Downtime Budget & Reconnect Behavior Analysis

> Zero HTTP downtime. Every open WebSocket drops when its corresponding Durable Object restarts. Under a gradual deployment, DO restarts are staged across percentage tranches. The client auto-reconnects at a FIXED 500 ms interval (`ws-adapter.ts`, `reconnectDelayMs ?? 500`, up to 1800 attempts) and flushes its outbound queue, so the socket usually returns in about a second. **But the client does NOT re-hydrate**: `hadSnapshot` in `main.ts` blocks later `log`/snapshot application, so a tab that stays open can miss edits made by other users during the gap. Frames already handed to the dying socket without an ack can be lost; there is no delivery receipt or replay log. **Corrected classification:** `git diff d2afa90..HEAD` shows this reconnect/`hadSnapshot` control flow is unchanged. It is a standing client limitation exposed by the restart, not a migration regression. Communicate “reload after deploy,” not “the upgrade changed reconnect.”

### 4.9 Open-Tab Regressions and Their Mitigations

The following matrix was re-derived in `docs/migration/SKEW_AND_RECONNECT.md` from **`d2afa90` → `HEAD`**. `d2afa90` is the earliest possible production revision and therefore the conservative upper bound; pinning production to a later candidate-range commit can only remove already-deployed deltas.

| Scenario / skew vector | Corrected impact / outcome | Classification / evidence | Operator mitigation |
| :--------------------- | :------------------------- | :------------------------ | :------------------ |
| **1. No state resync on reconnect** | Socket reconnects and flushes its local queue, but remote edits made during the restart gap are not fetched; unacknowledged in-flight frames can be lost. | **Standing property, not migration regression.** `main.ts` has the same `hadSnapshot` guard at `d2afa90` and `HEAD`; `ws-adapter.ts` reconnect state machine is unchanged (its source diff only fixes relative-URL construction). | Deploy in the lowest-traffic window; announce maintenance; advise active users to reload after deploy. |
| **2. Form/app-mode hydrate** | The `d2afa90` client sends only an `_formdata`-labelled `ask.log` on the main socket. The ship Worker drops it at the attachment-room equality gate before the reply can trigger the client's main-room follow-up. | **Still-applicable migration regression.** `git show d2afa90:packages/client/src/boot.ts`; `packages/worker/src/room.ts` room gate. The client fix landed later in `2acd1d0`. | Full reload onto the ship client, which retains the formdata request but also unconditionally sends the main-room `ask.log`. |
| **3. Existing passkey session / private-room reconnect** | Production issues `ec_sess`; ship parses only `__Host-ec_sess`. A logged-in user appears anonymous on ship traffic, and an open private-room tab can fail to reconnect until re-authentication. | **Newly identified migration regression.** `git diff d2afa90..HEAD -- packages/worker/src/lib/session.ts`; `parseSessionCookie` has no fallback. | Communicate “you may be signed out; sign in again to reopen private sheets.” During ramp, expect old/new versions to disagree on login state. |
| **4. Canonical WebSocket/Socket.IO parsing and caps** | Stock public edits/chat/cursors remain valid. Malformed or over-limit fields are dropped; oversized native frames close 1009; Socket.IO can return 413/503 or close overflowing sessions. | **Still applies.** All field caps and Socket.IO session/poll/queue caps are new from `d2afa90`. The native 1 MiB string-frame threshold was already deployed, but it silently dropped rather than closing and did not cover binary frames. | Watch 1009/413/503 telemetry and legacy embeds; normal users need no action. |
| **5. Large pastes / command batches** | Commands exceeding target sheet/range limits fail: native WS closes 1008; RoomDO HTTP returns 413. `MAX_WS_CELL_CHARS` is only a cursor-coordinate cap and is not the paste limit. | **Still-applicable migration regression.** `command-limits.ts` is absent at `d2afa90` and introduced by `b7d8840`. | Advise users to split large pastes; API callers must handle 413. |
| **6. HTTP command rejection signalling** | `POST /_/:room` now propagates RoomDO non-2xx responses (for example 413) instead of returning false-success 202 after a rejected write. | **New target behavior / correctness fix.** Commit `5d37bd0`; current `routes/rooms.ts` checks `writeRes.ok`. | Treat Probe 6 as load-bearing; notify API/script owners that truthful 413 is expected. |
| **7. Legacy oversized sheets (>200k cells)** | Existing sheets load and allow edits inside current bounds, but cannot expand declared rows/columns past target limits. | **Still-applicable product ceiling.** `command-limits.ts` absent at `d2afa90`. | Identify only from user reports or explicit room inspection; D1 room index has no dimensions. |
| **8. Root HTML / normal cache / AppCache** | Cached old HTML normally boots because ship still serves its referenced assets, but prolongs hybrid skew. Ship HTML routed to pre-`b7d8840` assets can 404 on extracted scripts. AppCache-capable browsers can pin the old master HTML because the manifest stays byte-identical. | **Corrected broader asset regression.** `git diff d2afa90..HEAD -- index.html manifest.appcache`; five `static/*.js` files introduced at `b7d8840`. | Purge edge cache, probe all target scripts, and advise hard reload. Client-side Application Cache requires site-data/appcache clearing; edge purge alone is insufficient. |
| **9. Passkeys/private ACL described as newly arriving** | Passkey UI, `AuthDO`, and private ACL enforcement already exist at `d2afa90`; they are not newly shipped by this cutover. | **Already deployed; prior `149ebcf` row superseded.** | Do not announce passkeys as new. Announce only the possible cookie-driven re-login event. |

---


## §5 Post-Cutover Verification

Execute this numbered probe checklist immediately after the **§4 single-ramp** reaches `@100%` and the required edge purge. **Live auth contract:** `ETHERCALC_AUTH` stays `"1"` for the entire cutover — accept `GET /_auth/whoami` → `{"uid":null,"enabled":true}` (see §4.3 Step 5). Do **not** expect `enabled:false`; that contract belonged to the superseded Phase 2 `AUTH=0` soak (Appendix A only).

The response contracts below were exercised on 2026-08-10 with
`wrangler dev` at `http://127.0.0.1:8787`. A superseded local matrix also ran
`--var ETHERCALC_AUTH:0` for historical Phase-2 labels; the **live** contracts
match the checked-in `ETHERCALC_AUTH = "1"` run. D1 and Durable Object state was Miniflare-local, not
production state. The local Workers Assets binding also supplies its own MIME
and cache headers. Finally, local requests retain the configured
`ETHERCALC_ORIGIN`, so their CSP contained
`connect-src 'self' wss://ethercalc.net` even though the request host was
`127.0.0.1`. Re-run the same probes against the production host; do not treat
the local run as evidence about production data, edge cache state, or
custom-domain redirects.

```bash
# ─── POST-RAMP PROBES (live cutover; ETHERCALC_AUTH = "1") ────────────

# Probe 1: Health Check Probe (Confirms Worker runtime execution)
curl -fsS -i https://ethercalc.net/_health
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: application/json, body
# `{"status":"ok","version":"0.0.0","now":"<ISO-8601 timestamp>"}`
# **PARTIALLY AUTOMATED** — `health.test.ts:6-19` (worker `test:workers`, CI `test`) and Playwright `health.spec.ts:9-24` (CI `e2e`) assert this status, MIME, and body shape locally. This production probe adds deployed-runtime and live-binding evidence; the tests do not identify the deployed SHA because `version` remains `0.0.0`.

# Probe 2: Auth steady-state (passkeys stay ON for this cutover)
curl -fsS -i https://ethercalc.net/_auth/whoami
# Expected [LIVE CUTOVER]: HTTP 200, body `{"uid":null,"enabled":true}`
# Abort if enabled is false — that indicates an AUTH=0 / auth-unbound bundle.
# **PARTIALLY AUTOMATED** — `routes-auth.node.test.ts:201-229` asserts the enabled anonymous response under worker `test:coverage` (CI `test`). Live response proves auth bindings and ETHERCALC_AUTH="1" on the version serving traffic.
# Historical note: superseded three-phase Phase 2 expected enabled:false (Appendix A only).

# Probe 3: Anonymous Private Room Creation Check
curl -sS -i -X POST https://ethercalc.net/_/private
# Expected [VERIFIED LOCALLY]: HTTP 401, body exactly `Unauthorized`
# (no trailing newline). This proves an anonymous caller cannot create a
# private room. The same anonymous 401 holds with auth on; Probe 2 confirms
# enabled:true so this is deny-anonymous, not AUTH=0 lockout.
# **PARTIALLY AUTOMATED** — `routes-rooms.node.test.ts:925-956` asserts exact 401 `Unauthorized` both anonymously and with a session while auth is off (worker `test:coverage`, CI `test`). The live probe confirms the deployed route, but—as noted above—Probe 2 is what identifies the flag state.

# Probe 4: Fresh Client Asset Probe (Verifies Cache Purge)
curl -fsSI https://ethercalc.net/static/player.js
# Expected [VERIFIED LOCALLY]: HTTP 200 with a JS Content-Type.
# Hosted Cloudflare Workers Assets path (this probe): empirically
# `Content-Type: text/javascript; charset=utf-8` — `serveAsset` passes it
# through because it is not application/octet-stream
# (`packages/worker/src/routes/assets.ts`). Standalone workerd self-host
# instead hits the mimeForPath fallback and serves
# `application/javascript; charset=utf-8`. Either subtype is fine for
# `<script type="module">`; reject only non-JS types.
# The local Workers Assets binding also returned
# `Cache-Control: public, max-age=0, must-revalidate`; production
# edge-cache freshness must still be checked after the purge.
# **PARTIALLY AUTOMATED** — `assets.test.ts` pins both the hosted
# pass-through (`text/javascript; charset=utf-8`) and the self-host
# rewrite (`application/javascript; charset=utf-8`) branches for
# `/static/player.js` (worker `test:workers`, CI `test`). Playwright
# `client-single-smoke.spec.ts:37-125` proves the shipped asset set
# boots locally (CI `e2e`). Only this live check can validate the
# post-purge production edge cache.
#
# Ship-tree root layout (security-audit): also require extracted page script
# and no appcache manifest on root HTML (§4.3 Step 5):
curl -fsS -o /dev/null -w '%{http_code}\n' https://ethercalc.net/static/index-bootstrap.js
# Expected: 200
curl -fsS https://ethercalc.net/ | head -c 8000
# Expect: static/index-bootstrap.js (and related page scripts); no manifest.appcache

# Probe 5: Public Sheet Read/Write Probe
curl -fsS -i https://ethercalc.net/testprodcutover
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: text/html; charset=utf-8,
# body beginning `<!DOCTYPE html>`
curl -sS -i -X POST https://ethercalc.net/_/testprodcutover -d "page-size: A4"
# Expected [VERIFIED LOCALLY]: HTTP 202, Content-Type:
# application/json; charset=utf-8, body `{"command":"page-size: A4"}`
# **PARTIALLY AUTOMATED** — Playwright `client-single-smoke.spec.ts:37-125` and `room-crud-export.spec.ts:4-204` cover a real local Worker public-sheet boot, edit, persistence, reload, and command API (CI `e2e`). This probe confirms the production route and Durable Object deployment.

# Probe 6: Sheet Limit Enforcement Probe
# Use a fresh room so a rejected command is observable as an absent snapshot.
LIMIT_ROOM="testprodcutover-limit-$(date +%s)"
curl -sS -i -X POST "https://ethercalc.net/_/${LIMIT_ROOM}" \
  -d "set Z10000 value n 1"
# Expected [VERIFIED AFTER §8 PR 4]: HTTP 413, Content-Type:
# text/plain; charset=utf-8, body exactly `command exceeds sheet limits`.
# This well-formed SocialCalc command expands the declared area to
# 10,000 rows × 26 columns = 260,000 cells. It is the production acceptance
# probe for command-rejection propagation (§8 item / live §4 residual risk): the HTTP route surfaces RoomDO's status and body.
# Before PR 4, raw main returned HTTP 202 with
# `{"command":"set Z10000 value n 1"}` here; reproducing that false success is
# a NO-GO.
curl -sS -i "https://ethercalc.net/_/${LIMIT_ROOM}"
# Expected: HTTP 404 with an empty body, independently proving the rejected
# mutation did not create a snapshot in the fresh room.
# **PARTIALLY AUTOMATED** — `routes-rooms.node.test.ts:810-838` asserts 413 propagation and the 202 positive control; `room.node.test.ts:1110-1122` asserts rejection leaves storage empty (worker `test:coverage`, CI `test`). The fresh production-room sequence adds proof that the deployed route and RoomDO agree and that no production snapshot was created.

# Probe 7: WebSocket Upgrade Probe
curl --http1.1 --max-time 2 -sS -D - -o /dev/null \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
  'https://ethercalc.net/_ws/testprodcutover?user=operator'
# Expected [VERIFIED LOCALLY]: HTTP 101 Switching Protocols with
# `Connection: Upgrade`, `Upgrade: websocket`, and a valid
# `Sec-WebSocket-Accept`. curl then exits 28 when --max-time closes the still
# open socket; that timeout after the 101 is expected. This raw probe verifies
# the upgrade, not the contents of a decoded snapshot frame.
# **PARTIALLY AUTOMATED** — `packages/worker/test/ws.test.ts:24-40` asserts 426 without Upgrade and 101 with a WebSocket handle (worker `test:workers`, CI `test`); Playwright `realtime-collab.spec.ts:75-152` proves real local WebSocket edits converge (CI `e2e`). The curl probe adds production proxy/edge upgrade evidence and an explicit `Sec-WebSocket-Accept` check.

# Probe 8: Legacy socket.io Compatibility Probe
curl -fsS -i "https://ethercalc.net/socket.io/1/?t=$(date +%s)"
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: text/plain; charset=utf-8,
# body `<32-hex-session-id>:60:60:websocket,xhr-polling`
# **PARTIALLY AUTOMATED** — `legacy-socketio.test.ts` asserts 200, text/plain, `/^[0-9a-f]{32}$/` SID, exact `60:60` timeouts, and transports `websocket,xhr-polling` (worker `test:workers`, CI `test`). Production routing remains a live check.

# Probe 9: Cross-Room Index Gate
curl -sS -i https://ethercalc.net/_rooms
# Expected [VERIFIED LOCALLY]: HTTP 403, Content-Type:
# text/plain; charset=utf-8, body exactly `_rooms not available with CORS`
# (30 bytes, no trailing newline) when ETHERCALC_CORS="1" and
# ETHERCALC_DISABLE_ROOM_INDEX is unset.
# **PARTIALLY AUTOMATED** — `routes-rooms.node.test.ts:606-631` asserts the two flag paths and exact 403 body, with precedence covered by `room-index-access.node.test.ts:29-87` (worker `test:coverage`, CI `test`). Production still confirms the intended vars are active.

# Probe 10a: Documented XLSX Path
curl -sS -i https://ethercalc.net/_/testprodcutover.xlsx
# Expected [VERIFIED LOCALLY]: HTTP 404, Content-Type:
# text/plain; charset=utf-8, with an empty body. This path names the raw room
# `testprodcutover.xlsx`; it is not an XLSX export route. The former HTTP 200
# expectation was wrong.

# Probe 10b: Corrected XLSX Export Path
curl -fsS -D - -o /dev/null https://ethercalc.net/testprodcutover.xlsx
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type:
# application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, binary
# body beginning with ZIP signature bytes `PK\x03\x04`, and
# `Content-Disposition: attachment; filename="testprodcutover.xlsx"`.
# The other valid export spelling is `/_/testprodcutover/xlsx`.
# **PARTIALLY AUTOMATED** — `exports.test.ts:151-172` asserts 200, XLSX MIME, exact disposition, ZIP signature, and both valid route forms (worker `test:workers`, CI `test`); Playwright `room-crud-export.spec.ts:157-186` parses the ZIP structure (CI `e2e`). The manual probe confirms that export behavior is present in production.

# ─── ADDITIONAL AUTH / EDGE PROBES (same auth-on steady state) ───────

# Probe 11: Auth steady-state recheck (same contract as Probe 2; not a Phase 3 flip)
curl -fsS -i https://ethercalc.net/_auth/whoami
# Expected [LIVE CUTOVER]: HTTP 200, body `{"uid":null,"enabled":true}`
# **PARTIALLY AUTOMATED** — `routes-auth.node.test.ts:201-229` asserts the enabled anonymous response (worker `test:coverage`, CI `test`), and `passkey-webauthn-real.spec.ts:194-407` performs a real localhost-RP ceremony (CI `e2e`). Live response reconfirms auth bindings after ramp; it does not replace a production passkey ceremony. Historical note: old three-phase used this as a Phase 3 enable probe (Appendix A).

# Probe 12: WebAuthn www Alias Redirect Probe
curl -fsSI https://www.ethercalc.net/_auth/register-init
# Expected [NOT VERIFIABLE LOCALLY — wrangler dev does not emulate the
# Cloudflare custom-domain/redirect layer]: production must return HTTP 301
# with `Location: https://ethercalc.net/_auth/register-init`. A local request
# to 127.0.0.1 with `Host: www.ethercalc.net` returned HTTP 404 with an empty
# body because it reached the Worker directly; that is not evidence for or
# against the production edge redirect.
# Probe 13: Search-indexing policy (X-Robots-Tag + robots.txt)
# Source of truth: packages/worker/src/lib/robots.ts + index.ts middleware
# (isIndexablePath allowlist is exactly {'/': true}; ROBOTS_NOINDEX =
# 'noindex, nofollow, noarchive'; GET /robots.txt serves ROBOTS_TXT as
# text/plain; charset=utf-8). Room slugs are the only privacy boundary for
# public rooms — indexing turns "unguessable URL" into "first search result".
#
# Probe 13a: Landing page stays indexable (sole allowlisted path)
curl -sSI https://ethercalc.net/
# Expected: HTTP 200. Response MUST NOT carry an `X-Robots-Tag` header.
# **PARTIALLY AUTOMATED** — `routes-security.node.test.ts` "does not noindex
# the public landing path" asserts `X-Robots-Tag` is null on `/` (worker
# `test:coverage`, CI `test`). Live probe confirms the deployed middleware
# still skips the landing surface.
#
# Probe 13b: Non-landing responses are noindex
curl -sSI https://ethercalc.net/testprodcutover
# Expected: HTTP 200 (or any non-error room response) with
# `X-Robots-Tag: noindex, nofollow, noarchive`.
# Any other non-`/` path (exports, `/_health`, `/robots.txt` itself) must
# carry the same tag — `isIndexablePath` is an exact allowlist of `/` only.
# **PARTIALLY AUTOMATED** — `routes-security.node.test.ts` "marks non-landing
# responses noindex…" asserts the exact header on room/export/health/robots
# paths (worker `test:coverage`, CI `test`). Live probe proves the header
# reached production edge responses.
#
# Probe 13c: robots.txt is a real robots file (LOAD-BEARING)
curl -sS -D - https://ethercalc.net/robots.txt -o /tmp/ec-robots.txt
# Expected:
#   - HTTP 200
#   - `Content-Type: text/plain; charset=utf-8`
#   - body begins `User-agent: *` and contains a directive line `Allow: /`
#   - body MUST NOT contain any directive line matching `^\s*Disallow\s*:`
#     (comments may mention the word; only a Disallow *directive* is a fail)
#   - body is NOT the HTML app shell (pre-ship production fell through the
#     `/:room` catch-all and rendered a "room" named `robots.txt`)
# LOAD-BEARING: a `Disallow` here forbids *fetching*, so crawlers can never
# observe `X-Robots-Tag: noindex` and already-indexed rooms freeze in the
# index permanently (see module comment in `lib/robots.ts`). Treat any
# Disallow directive as a ship-blocking regression.
# **PARTIALLY AUTOMATED** — `lib-robots.node.test.ts` pins `Allow: /` and
# forbids Disallow/Sitemap directive lines; `routes-security.node.test.ts`
# asserts the route body and Content-Type (worker `test:coverage`, CI
# `test`). Only this live check proves the Worker route beat both the
# `/:room` catch-all and any static asset (requires `run_worker_first =
# true` and registration before `registerRoomCatchAll`).
#
```

---

## §6 D1 Database Rollback & Time Travel `[OPERATOR-VERIFY]`

> **Live procedure.** Code/assets rollback for this cutover is **§4.4** (`npx wrangler versions deploy <CURRENT_PROD_VERSION_ID>@100%`). The superseded three-phase rollback graph (old §6.1–§6.3) is preserved only in Appendix A.


If D1 database state must be restored to a pre-cutover state, use Cloudflare D1 Time Travel or manual SQL export restore per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/) and [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/):


> **CRITICAL OPERATOR NOTICE**: Restoring D1 via Time Travel or SQL dump restores D1 tables — the cross-room index plus bounded audit/chat tails — but it **DOES NOT** roll back or restore Durable Object SQLite storage (`RoomDO` sheet cell data, authoritative SocialCalc snapshots, or command logs). The index schema is `packages/worker/migrations/0001_rooms.sql:17-21`; D1 audit/chat tables and retention bounds are documented in `packages/worker/migrations/0003_audit_chat.sql:22-38` and `packages/worker/src/lib/seq-store.ts:39-41`. Because DO sheet content has **no operator bulk export API** and **no whole-instance restore path at ~1.8M-room scale** (§2.4.1), cutover safety relies on the single-ramp sequence (§4) and **bounded** per-room PITR (§2.4) — not on a fleet-wide DO rewind. Multi-GB SQL dump import is further capped at 5 GB per [D1 limits](https://developers.cloudflare.com/d1/platform/limits/); prefer Time Travel for whole-D1 rollback when `version`/Time Travel is available (§0.2.1, §2.1.1).

#### 1. Destructive Nature & Operational Interruption
- **In-Place Overwrite**: Per Cloudflare docs: *"Restoring a database to a specific point-in-time is a destructive operation, and overwrites the database in place."*
- **Query Interruption**: *"Queries in flight will be cancelled, and an error returned to the client."* Operators should perform D1 restores during low-traffic windows or communicate potential transient database errors to active users.

#### 2. Mandatory Undo Bookmark Recording
- When `wrangler d1 time-travel restore` completes, the CLI prints an undo bookmark:
  ```text
  ↩️ To undo this operation, you can restore to the previous bookmark: <BOOKMARK>
  ```
- **MANDATORY OPERATOR ACTION**: The operator **MUST record and log this undo bookmark immediately** in cutover logs before proceeding. Capturing this bookmark is essential to reverse an accidental or incorrect restore operation forward.

#### 3. Timestamp Fallback & Deterministic Conversion
- If the pre-cutover bookmark was **never recorded or lost**, a forgotten bookmark is recoverable using:
  ```bash
  npx wrangler d1 time-travel info ethercalc_rooms --timestamp="2026-08-10T12:00:00Z"
  ```
  Per Cloudflare docs: *"conversion between a specific timestamp and a bookmark is deterministic (stable)"*.
- Furthermore, `wrangler d1 time-travel restore` accepts `--timestamp` directly, eliminating the need to look up the bookmark beforehand:
  ```bash
  npx wrangler d1 time-travel restore ethercalc_rooms --timestamp="2026-08-10T12:00:00Z"
  ```

#### 4. Execution Commands (Consistent with §2 Capture)

- **Primary Restore (by Pre-Cutover Bookmark)**:
  ```bash
  npx wrangler d1 time-travel restore ethercalc_rooms --bookmark=<PRE_CUTOVER_BOOKMARK>
  ```
- **Fallback Restore (by Timestamp, if Bookmark Missing)**:
  ```bash
  npx wrangler d1 time-travel restore ethercalc_rooms --timestamp="2026-08-10T12:00:00Z"
  ```
- **Undo Restore (Reverting to State Prior to Restoration)**:
  ```bash
  npx wrangler d1 time-travel restore ethercalc_rooms --bookmark=<UNDO_BOOKMARK_FROM_RESTORE_OUTPUT>
  ```
- **SQL Dump Fallback Restore (If `version: "alpha"` or Time Travel Unavailable)**:
  ```bash
  npx wrangler d1 execute ethercalc_rooms --remote --file=./backup_ethercalc_rooms_<TIMESTAMP>.sql
  ```
  *(Note: `wrangler d1 export` requires `--output=<path>`, whereas `wrangler d1 execute` requires `--file=<path>` per [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/).)*

---

## §7 Self-Host Upgrade Path (Docker / Helm)

For self-hosted deployments running EtherCalc via Docker Compose or Kubernetes/Helm.

**Self-host is not the hosted Worker on a different runtime.** The standalone workerd path loads `packages/worker/workerd/config.capnp`, which binds only `ROOM` (`RoomDO`), `AUTH` (`AuthDO`), `ASSETS` (DiskDirectory), `BASEPATH`, and a fixed set of `fromEnvironment` env vars (`config.capnp:64-117`). It does **not** bind D1 (`DB`), Cloudflare Cron Triggers, or Cloudflare Email (`send_email` / `EMAIL`). Authoritative per-room sheet state still lives in on-disk Durable Object SQLite under the mounted data directory (§7.2); the hosted-only D1/cron/email surfaces simply do not exist on this track. Read §7.0 before treating any hosted recovery or index procedure as applicable.

### 7.0 Self-host feature divergence from the hosted deployment

Verify these absences against `packages/worker/workerd/config.capnp` before an upgrade. They are structural, not configuration knobs an operator can flip in Compose/Helm alone.

| Capability | Hosted (Cloudflare Workers) | Standalone self-host (workerd) | Evidence |
| :--------- | :-------------------------- | :----------------------------- | :------- |
| **Cross-room index (`DB` / D1)** | `[[d1_databases]]` binds `DB` (`packages/worker/wrangler.toml:153-168`). `/_rooms`, `/_roomlinks`, `/_roomtimes` read the D1 `rooms` table. | **No `DB` binding** in `config.capnp`. Directory handlers short-circuit when `!c.env.DB`: `/_rooms` → `[]` (200 JSON), `/_roomlinks` → `[]` (200 HTML), `/_roomtimes` → `{}` (200 JSON) (`packages/worker/src/routes/rooms.ts:118-144`). | `config.capnp:64-117`; `rooms.ts:118-144`; wrangler D1 comment that reads “fall back to empty when the binding is absent” (`wrangler.toml:153-158`). |
| **Room-index *gate* vs empty index** | Hosted `ETHERCALC_CORS="1"` (and optional `ETHERCALC_DISABLE_ROOM_INDEX`) makes `shouldDisableRoomIndex()` true → **403** with `_rooms not available with CORS` (`room-index-access.ts:40-46`; `rooms.ts:119-120`). | Shipped Docker/Helm/entrypoint **default** `ETHERCALC_DISABLE_ROOM_INDEX=1` (`Dockerfile:90`, `docker-compose.yml:45`, `bin/workerd-entrypoint.sh:38`, `helm/values.yaml:100`) still returns **403** first — the gate is real and is what `smoke-proxy.sh` asserts. If an operator sets `ETHERCALC_DISABLE_ROOM_INDEX=0`, the gate opens but there is **still no index to serve**: directory endpoints return the empty bodies above. `/_exists/:room` is different: once ungated it probes the DO directly and can answer true/false (`rooms.ts:240-262`; README self-host note). **Do not treat `ETHERCALC_DISABLE_ROOM_INDEX` as the thing that empties the directory on self-host — absence of `DB` does.** | `room-index-access.ts:40-46`; `rooms.ts:118-144,240-262`; entrypoint/compose defaults above. |
| **Audit / chat D1 mirror** | RoomDO best-effort mirrors audit and chat tails into D1 `audit_log` / `chat_log` for all rooms, including private (`room.ts:2302-2309`). §2.4 mass recovery enumerates private rooms via those tables. | `#d1()` returns immediately when `!this.#env.DB` (`room.ts:2289-2294`), so `#mirrorAudit` / `#mirrorChat` never write. **There is no self-host `audit_log`/`chat_log` enumeration aid.** Private-room mass recovery via D1 is hosted-only. Per-room audit/chat history that still lives inside each RoomDO SQLite file remains in the filesystem backup (§7.2). | `room.ts:2289-2309`; §2.2 / §2.4 (hosted recovery). |
| **`settimetrigger` / `cron_triggers`** | After a successful `POST /_/:room` write, `if (c.env.DB)` upserts into D1 `cron_triggers` (`rooms.ts:946-952`; `handlers/cron.ts:43-48`). | The same `if (c.env.DB)` guard skips the upsert. The command may still be accepted and logged inside the RoomDO (sheet/log semantics), but **no durable schedule row is stored anywhere the scheduler can scan.** There is also no RoomDO-side `upsertCronTriggers` path. | `rooms.ts:937-952`; no matches in `room.ts`. |
| **Cron pulse (`scheduled()` / `/_timetrigger`)** | `wrangler.toml` `[triggers] crons = ["*/1 * * * *"]` (`wrangler.toml:131-135`) invokes Worker `scheduled()` → `runScheduled` every minute (`scheduled.ts:2-8,130-134`). | **No cron trigger service in workerd.** `scheduled()` never runs unless something external calls it. Legacy `GET /_timetrigger` remains as a bearer-gated HTTP pulse: `verifyMigrateToken` → 404 when `ETHERCALC_MIGRATE_TOKEN` unset, 401 on bad/missing bearer, else `runScheduled` (`routes/timetrigger.ts:30-47`). On self-host `runScheduled` still no-ops without `DB` (`scheduled.ts:67-70` returns empty due/keep/fired). **Operators who need cell email triggers must (1) provide a durable trigger store the code does not ship for workerd today, and (2) wire an external scheduler; with stock config, external cron against `/_timetrigger` only proves the gate — it cannot fire rows that were never persisted.** | `wrangler.toml:131-135`; `timetrigger.ts:30-47`; `scheduled.ts:67-70`. |
| **Email send path** | Optional Cloudflare `[[send_email]]` / `EMAIL` binding (commented out by default in `wrangler.toml:137-147`). | No `EMAIL` binding in `config.capnp`. `buildEmailSender` selects `DisabledEmailSender` when `!env.EMAIL` (`handlers/cron.ts:83-86`) and reports `EMAIL_DISABLED_MESSAGE` (`lib/email.ts:116,139-143`). | `config.capnp` bindings list; `handlers/cron.ts:83-86`; `lib/email.ts:116,139-143`. |
| **Durable Object PITR API** | Hosted SQLite-backed RoomDO supports `POST /_/:room/pitr-restore` (bearer-gated) within Cloudflare’s ~30-day change log (§2.3–2.4). | Platform PITR change log is **not** retained locally. Miniflare and standalone workerd return **501** for `/_/:room/pitr-restore` (`API.md:137`; `room` workers-pool test). **Trade-off:** self-host loses API PITR but gains a real filesystem tree (`./ethercalc-data` → `/data/do/...`) that operators can `tar`/snapshot bit-for-bit (§7.2) — often a stronger whole-instance recovery story than hosted bulk-export limits. | `API.md:137`; §2.3 local-dev note; §7.2. |

**Operator takeaway:** do not run §2.4’s D1 private-room enumeration, D1 Time Travel, or hosted PITR drills against a self-host instance and expect parity. Back up and restore the on-disk DO directory (§7.2) and treat `uniqueKey` stability (§7.2.1) as the cutover invariant that keeps those files addressable.

### 7.1 Container Image Bump & Workerd Compatibility Lockstep

1. Update image tag from `ethercalc:0.20260717.0` to `ethercalc:main` (or newest tag).
2. **Base Image & Workerd Bundle Verification (`[SOURCE-VERIFIED]`)**:
   - `Dockerfile:22` pins base image `FROM oven/bun:1.3.14`.
   - `Dockerfile:60` builds the standalone ES module bundle via `scripts/build-workerd-bundle.sh`, which runs `bunx wrangler deploy --dry-run --outdir=packages/worker/workerd/worker/` to produce `packages/worker/workerd/worker/index.js` alongside checked-in `packages/worker/workerd/config.capnp`.
   > **PARTIALLY AUTOMATED** — CI `build:selfhost` runs `scripts/smoke-selfhost.sh`, which builds this Dockerfile, rejects leaked `.dev.vars`/generated Wrangler config, boots the resulting workerd container, and exercises health plus persistent CRUD (`scripts/smoke-selfhost.sh:30-141`). That proves the checked-in image path builds and runs, not that the operator selected or pulled the intended release image.
3. **Compatibility Date Lockstep & Pinned Version Check (`[SOURCE-VERIFIED]`)**:
   - `packages/worker/wrangler.toml:3` specifies `compatibility_date = "2026-07-21"`.
   - `packages/worker/workerd/config.capnp:61` specifies `compatibilityDate = "2026-07-14"`.
   - Standalone `workerd` binary releases enforce that `compatibilityDate` must be `<= workerd release date`.
   - **Lockfile & Dual Workerd Package Version Resolution**: `bun.lock` resolves two distinct version sets for `workerd` and platform binaries (`@cloudflare/workerd-darwin-64`, `-darwin-arm64`, `-linux-64`, `-linux-arm64`, `-windows-64`):
     - **Hoisted / Production Dependency (`wrangler@4.112.0`)**: `workerd@1.20260714.1` (and all 5 platform packages at `1.20260714.1`), which decodes to release date `2026-07-14`.
     - **Nested Test Dependency (`@cloudflare/vitest-pool-workers@0.18.0`)**: `workerd@1.20260701.1` under `miniflare/workerd` and `wrangler/workerd` (and all 5 platform packages at `1.20260701.1`), which decodes to release date `2026-07-01` (`2026-07-01 < 2026-07-14`).
   - **Zero-Margin Lockstep Invariant — CI-Guarded**: The lockstep condition `2026-07-14 <= 2026-07-14` holds with **zero margin of slack**. Bumping `config.capnp`'s `compatibilityDate` by even a single day without simultaneously updating the pinned `workerd` dependency would make standalone `workerd serve` hard-reject the config. This mismatch is guarded by the root test `standalone compatibility date does not exceed the pinned workerd release` (`scripts/vite-workflow.test.ts:440-456`): after extracting the hoisted workerd release date from `bun.lock` and the configured date from `config.capnp`, `scripts/vite-workflow.test.ts:455` asserts `expect(Number(configuredDate)).toBeLessThanOrEqual(Number(workerdDate));`. The test runs through the root `test` script (`package.json:83`) under preflight Gate 3; the recorded Gate 3 run passed all 36 root tests (`docs/migration/PREFLIGHT_RESULTS.md:94-101`). Therefore, a mismatched date fails fast in CI/preflight rather than becoming a mystery production crash-loop, provided that gate is honored. Conversely, updating `workerd` alone is safe (it widens the margin). The deployment asymmetry remains critical: `wrangler.toml`'s `compatibility_date = "2026-07-21"` is 7 days ahead and safe because Wrangler clamps with a warning, but syncing `config.capnp` to `"2026-07-21"` without a workerd bump would fail the named test and break standalone self-host while Cloudflare edge deploys remain viable.
   > **ALREADY AUTOMATED — skim after a green root test gate.** `standalone compatibility date does not exceed the pinned workerd release` (`scripts/vite-workflow.test.ts:440-456`; root `vp run test`) parses the real `bun.lock` and `config.capnp` values and asserts `configuredDate <= workerdDate`. Recomputing that inequality manually adds no live-deployment evidence.
   - **Entrypoint Binary Targeting & Test-Runtime Skew**: `bin/workerd-entrypoint.sh:40-55` explicitly targets wrangler's pinned dependency `$APP_ROOT/node_modules/wrangler/../workerd/bin/workerd` (`1.20260714.1`) to ensure runtime execution does not pick up the older nested `1.20260701.1` binary (which would refuse the config and crash-loop). This is a historical failure guard, not hypothetical defensive complexity: the entrypoint comment records that a first-match `find` can boot whichever workerd the filesystem lists first. Maintainers MUST NOT simplify the preferred-binary block back to first-match discovery. Additionally, note that `@cloudflare/vitest-pool-workers` executes workers-pool tests against the older `1.20260701.1` binary (a 13-day skew from the `1.20260714.1` deployment runtime); while `config.capnp` is not loaded in vitest, test behavior depending on workerd engine changes between 2026-07-01 and 2026-07-14 is not exercised by the 196 workers-pool tests. Operator host `workerd` binary MUST be dated `>= 2026-07-14` (pinned release: `1.20260714.1`).

### 7.2 Durable Object On-Disk Storage Backup

Before restarting containers, back up the local DO storage directory. This filesystem tree is the self-host substitute for the hosted D1 export + per-room PITR floor (§7.0): it is what you have instead of Cloudflare change-log restore.

- **Docker Compose Track (`[SOURCE-VERIFIED]`)**:
  - The shipped compose file mounts DO storage at `./ethercalc-data:/data` (`docker-compose.yml:37`).
  - Container entrypoint (`bin/workerd-entrypoint.sh:25-27`) writes SQLite files under `$DATA_DIR/do` (`/data/do`), where `workerd serve` stores per-DO SQLite databases under `/data/do/<uniqueKey>/` (`config.capnp:31-34,137-139`).
  - **Host Backup Command**:
    ```bash
    tar -czvf ethercalc-do-backup-$(date +%Y%m%d_%H%M%S).tar.gz ./ethercalc-data
    ```
- **Kubernetes / Helm Track (`[SOURCE-VERIFIED]`)**:
  - `helm/values.yaml:80-90` configures `persistence.enabled: true` (`accessMode: ReadWriteOnce`, `size: 10Gi`).
  - `helm/templates/deployment.yaml:117-129` binds the PVC `persistentVolumeClaim: claimName: {{ include "ethercalc.pvcName" . }}` to `mountPath: /data`.
  - **Cluster Backup Procedure**: Take a volume snapshot of the backing PersistentVolumeClaim (`ethercalc-data`), or stream an archive out via `kubectl exec`:
    ```bash
    kubectl exec deploy/ethercalc -- tar -czf - /data > ethercalc-pv-backup-$(date +%Y%m%d_%H%M%S).tar.gz
    ```

#### 7.2.1 UPGRADE-CRITICAL — DO `uniqueKey` storage addressing anchor `[OPERATOR-VERIFY]`

workerd addresses on-disk Durable Object SQLite as `<uniqueKey>/<objectId>.sqlite` under the `do` disk service (`config.capnp:137-139`). The checked-in standalone config **pins**:

- `RoomDO` → `uniqueKey = "ethercalc-roomdo-v1"` (`config.capnp:119-128`)
- `AuthDO` → `uniqueKey = "ethercalc-authdo-v1"` (`config.capnp:129-134`)

The adjacent comment is load-bearing: *“Must match wrangler.toml's uniqueKey or legacy grains lose their existing DO storage on upgrade. EtherCalc's wrangler.toml doesn't explicitly set one, so workerd defaults to the class name hashed into a random-looking bytestring. We pin it so the value is stable across rebuilds.”* (`config.capnp:122-126`).

**If either pinned `uniqueKey` string ever changes (image rebuild, custom capnp, packaging fork), every existing self-hosted room is silently orphaned:** the `.sqlite` files remain on the volume, but the new process looks under a different subdirectory and serves empty rooms. There is no automatic migrate/rename.

**Pre-upgrade verification (record output in the change ticket):**

```bash
# 1. Confirm the image/source you are about to run still pins the expected keys:
grep -n 'uniqueKey' packages/worker/workerd/config.capnp
# Expect exactly:
#   uniqueKey = "ethercalc-roomdo-v1"
#   uniqueKey = "ethercalc-authdo-v1"

# 2. On the live data volume (Docker host path shown; Helm: kubectl exec … -- ls …):
ls -la ./ethercalc-data/do/
# Expect subdirectories named for the pinned keys, e.g.:
#   ethercalc-roomdo-v1/
#   ethercalc-authdo-v1/
# (First boot may create only RoomDO until AuthDO is first touched.)

# 3. Sample that room files actually live under the RoomDO key (names are object ids):
ls ./ethercalc-data/do/ethercalc-roomdo-v1/ | head
```

**Go / No-Go:**

- **GO** only if the `config.capnp` pins above are unchanged **and** the on-disk subdirectory names under `…/do/` match those pins (or this is a brand-new empty volume).
- **NO-GO** if the volume has room data under a *different* directory name than the `uniqueKey` about to boot — stop and restore/align keys before serving traffic; do not “fix it by restarting.”
- After upgrade, re-run step 2 and confirm the same subdirectory names still hold the pre-upgrade object files (byte counts / file names stable aside from normal runtime writes).

### 7.3 Mandatory Nginx Reverse Proxy Requirement

Internet-facing self-host installations MUST run the nginx proxy recipe (`deploy/nginx/ethercalc.conf`) for rate-limiting and client IP header sanitization (overwriting client-supplied `CF-Connecting-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto` with `$remote_addr` and `$scheme`). Note: CSP headers are injected directly by the Worker application layer (`packages/worker/src/lib/csp.ts`), not by Nginx. Validate basic proxy syntax, routing, health, room-index gating, and WebSocket upgrades with `./scripts/smoke-proxy.sh`.
> **PARTIALLY AUTOMATED** — CI `build:selfhost` runs `scripts/smoke-proxy.sh`, which asserts `nginx -t`, proxied health/root success, `/_rooms` 403, and a 101 WebSocket upgrade (`scripts/smoke-proxy.sh:29-85`). A self-host operator still must prove that this proxy is the public ingress; the script does not exercise rate-limit thresholds, header replacement semantics, TLS, or the operator's deployed stack.

### 7.4 Security Environment Variables & Passkey Anchors

Self-host operators MUST configure passkey environment variables to enable passkey features.

#### 1. What the Shipped Manifests Provide Today (Defaults)

- **Docker Compose Defaults (`docker-compose.yml:42-58`)**:

  ```yaml
  environment:
    ETHERCALC_PORT: "${ETHERCALC_PORT:-8000}"
    ETHERCALC_HOST: "${ETHERCALC_HOST:-0.0.0.0}"
    ETHERCALC_KEY: "${ETHERCALC_KEY:-}"
    ETHERCALC_DISABLE_ROOM_INDEX: "${ETHERCALC_DISABLE_ROOM_INDEX:-1}"
    ETHERCALC_CORS: "${ETHERCALC_CORS:-}"
    ETHERCALC_BASEPATH: "${ETHERCALC_BASEPATH:-}"
    ETHERCALC_EXPIRE: "${ETHERCALC_EXPIRE:-}"
    ETHERCALC_AUTH: "${ETHERCALC_AUTH:-}"
    ETHERCALC_RP_ID: "${ETHERCALC_RP_ID:-}"
    ETHERCALC_RP_NAME: "${ETHERCALC_RP_NAME:-}"
    ETHERCALC_ORIGIN: "${ETHERCALC_ORIGIN:-}"
    ETHERCALC_MIGRATE_TOKEN: "${ETHERCALC_MIGRATE_TOKEN:-}"
  ```

  _Passkeys are OFF by default_ (`ETHERCALC_AUTH` defaults to empty string).

- **Helm Chart Values Defaults (`helm/values.yaml:94-130`)**:

  ```yaml
  config:
    basepath: ""
    defaultRoom: ""
    disableRoomIndex: true
    cors: false
    expire: ""
    rateLimit: ""
    roomCreateLimit: ""
    auth:
      enabled: false
      rpId: ""
      rpName: "EtherCalc"
      origin: ""

  secrets:
    existingSecret: ""
    key: ""
    migrateToken: ""
  ```

  _Passkeys are OFF by default_ (`auth.enabled: false`).

#### 2. What an Operator Must Set to Enable Passkeys

To light up passkey authentication and private rooms, the operator MUST provide all four WebAuthn trust anchors matching their exact public HTTPS origin:
> **PARTIALLY AUTOMATED** — `check-helm-hardening.sh:41-61` (CI `helm-lint`) asserts all Helm trust anchors render together and incomplete enablement fails closed; worker `routes-auth.node.test.ts:160-251` (CI `test`) asserts disabled/enabled route behavior. Automation cannot decide whether an operator's RP ID and origin match the real public HTTPS host.

- **Docker Compose Operator Overrides (`.env` or shell export)**:

  ```bash
  ETHERCALC_AUTH="1"
  ETHERCALC_RP_ID="sheets.example.com"
  ETHERCALC_RP_NAME="Example Sheets"
  ETHERCALC_ORIGIN="https://sheets.example.com"
  ```
  > **PARTIALLY AUTOMATED** — Worker auth tests cover the resulting flag/binding semantics, but no Docker smoke enables passkeys or validates these Compose-supplied values. The operator must confirm the concrete environment and public origin.

- **Kubernetes / Helm Operator Overrides (`values.yaml` or `--set`)**:

  ```yaml
  config:
    auth:
      enabled: true
      rpId: "sheets.example.com"
      rpName: "Example Sheets"
      origin: "https://sheets.example.com"

  secrets:
    key: "openssl-rand-hex-32-value"
  ```
  > **PARTIALLY AUTOMATED** — `check-helm-hardening.sh:41-61` (CI `helm-lint`) proves these Helm values render all four Worker variables and rejects incomplete anchors. It does not apply the chart to a cluster or validate the chosen RP/origin and secret there.

- **Consequence of Leaving Unset**: `authEnabled()` in `packages/worker/src/routes/auth.ts:34-43` checks `flagEnabled(env.ETHERCALC_AUTH) && env.AUTH !== undefined && env.ETHERCALC_RP_ID && env.ETHERCALC_ORIGIN`. If passkey variables are left unset, `authEnabled()` returns `false` (fails closed), returning HTTP 404 for `/_auth/*` endpoints and HTTP 401 for private room creation.
- **Room Index Access Fallback (self-host nuance)**: `shouldDisableRoomIndex()` in `packages/worker/src/lib/room-index-access.ts:40-46` still runs first. Shipped Docker/Helm/entrypoint defaults keep `ETHERCALC_DISABLE_ROOM_INDEX=1`, so `/_rooms*` and `/_exists/:room` return **403** (what `smoke-proxy.sh` checks). That gate is only a hide-switch: standalone workerd has **no D1 `DB` binding** (`config.capnp`), so if an operator sets `ETHERCALC_DISABLE_ROOM_INDEX=0`, `/_rooms` / `/_roomlinks` / `/_roomtimes` open but still return empty bodies (`[]` / `[]` / `{}` per `packages/worker/src/routes/rooms.ts:122,133,142`). `/_exists/:room` can answer from the DO once ungated. See §7.0 — do not document self-host as if flipping the env var restores a hosted-style directory.
- **Validation Commands**:
  ```bash
  bash scripts/check-helm-hardening.sh
  ./scripts/smoke-selfhost.sh
  ```
  > **ALREADY AUTOMATED — skim manual reruns when the required CI jobs are green.** CI `helm-lint` runs `check-helm-hardening.sh` (`.github/workflows/ci.yml:138-171`), and CI `build:selfhost` runs both `smoke-selfhost.sh` and `smoke-proxy.sh` (`ci.yml:119-136`). Re-running the same scripts against the same tree adds no live-cluster evidence; validating the operator's deployed stack is a separate manual responsibility.

### 7.5 Verification Status & Local Execution Gate Note

- **Source-Verified Claims**:
  - Dockerfile base image (`oven/bun:1.3.14` at `Dockerfile:22`).
  - Standalone ES module bundle creation (`scripts/build-workerd-bundle.sh` producing `packages/worker/workerd/worker/index.js`).
  - Capnp compatibility date lockstep (`compatibilityDate = "2026-07-14"` in `config.capnp:61` satisfied with zero margin by hoisted `workerd@1.20260714.1` in `bun.lock`).
  - Dual workerd dependency mapping in `bun.lock` (hoisted `1.20260714.1` vs nested `vitest-pool-workers` `1.20260701.1`) and test-runtime skew documentation.
  - Entrypoint workerd binary targeting (`bin/workerd-entrypoint.sh:48-55` picking wrangler's hoisted dependency over older nested copies).
  - Volume mount target `./ethercalc-data:/data` mapping to DO SQLite storage path `/data/do` (`docker-compose.yml:37`, `bin/workerd-entrypoint.sh:25-27`, `Dockerfile:63-72`).
  - Security env defaults (`ETHERCALC_DISABLE_ROOM_INDEX=1` default ON in `Dockerfile:90`, `docker-compose.yml:45`, `helm/values.yaml:100`).
  - Nginx reverse proxy configuration (`deploy/nginx/ethercalc.conf`, which applies `limit_req`/`limit_conn` and replaces `CF-Connecting-IP`/`X-Forwarded-*` headers) and validator script (`scripts/smoke-proxy.sh`).
  - Standalone binding surface and hosted divergence (§7.0): no `DB` / cron / `EMAIL` in `config.capnp:64-117`; room-directory empty fallbacks at `rooms.ts:122,133,142`; `#d1` no-op at `room.ts:2289-2294`; `settimetrigger` D1 upsert gated at `rooms.ts:946-952`; `/_timetrigger` migrate-token gate at `timetrigger.ts:30-47`; PITR `501` on workerd per `API.md:137`.
  - DO `uniqueKey` pins `ethercalc-roomdo-v1` / `ethercalc-authdo-v1` (`config.capnp:119-135`) and on-disk layout `<uniqueKey>/<objectId>.sqlite` (`config.capnp:137-139`) — upgrade-critical check in §7.2.1.
- **Unexercised / Scope Limits**:
  - Docker smoke scripts (`./scripts/smoke-selfhost.sh` and `./scripts/smoke-proxy.sh`) could NOT be executed in this local environment due to missing `docker compose` CLI subcommand.
  - `./scripts/smoke-proxy.sh` validates `nginx -t` syntax, `/_health`, `GET /`, `/_rooms` HTTP 403, and `/_ws/` HTTP 101 WebSocket upgrade forwarding; it does not exercise rate-limiting thresholds or IP header substitution details.
  - End-to-end container boot, workerd execution, and reverse proxy routing for the self-host path remain unexercised locally and rely on CI execution (`.github/workflows/ci.yml` `build:selfhost` job).
  - §7.0 / §7.2.1 are documentation of structural platform gaps; CI does not simulate a `uniqueKey` rename or prove operator volume layout on a live cluster.
---

## §8 Pre-Cutover PRs & Preparation Bundles

The following seven items have been evaluated and categorized:

1. **Phase 1 Minimal Branch (Forward-Fix Artifact) Preparation** — **SUPERSEDED for live hosted cutover / not a live step** (v2/`AuthDO` already live; see STOP banner). Retained only as historical prep / **Appendix A** context. **Do not** build, push, or deploy `release/phase1-lifecycle` or `.worktrees/phase1-lifecycle` for the §4 single-ramp procedure.
   - **Historical specification** (Appendix A only): Build and validate `release/phase1-lifecycle` branch (`149ebcf...` + `AuthDO` + `v2` migration).
   - **Historical status**: **DONE** as analysis prep. Local branch `release/phase1-lifecycle` was built and verified in git worktree `.worktrees/phase1-lifecycle` (`5351653` / `6b7c758`). Both `vp run @ethercalc/worker#typecheck` and `vp run @ethercalc/worker#build:dry` passed cleanly with zero errors. The branch was committed locally and was **not** pushed or deployed — and must not be deployed for this cutover.
   - **Why it is not live**: The old three-phase plan treated Phase 1 as the forward-fix artifact and rollback target (`npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`). Live production is already post-`v2` in `[d2afa90, b7d8840)`; the live rollback floor is `CURRENT_PROD_VERSION_ID` (§4.4), not a lifecycle-only bundle. Full historical write-up: Appendix A.1.2 / A.2.

2. **PR 1: Build Version Stamp in `/_health`** (`packages/worker/src/handlers/health.ts:12-18` & `health.node.test.ts:8-12`)
   - **Specification**: Update `buildHealthBody` to return the version from root `package.json` (`0.20260717.0`) or git SHA via an esbuild `define` constant.
   - **Cutover Blocker Decision**: **NON-BLOCKING FOLLOW-UP**. Operators verify active code version via Probe 2 (`GET /_auth/whoami`), `Cloudflare-Workers-Version-Overrides` header, and `wrangler deployments list`.

3. **PR 2: Client Re-hydration on WebSocket Reconnect** (`packages/client/src/ws-adapter.ts` & `packages/client/src/main.ts:347`)
   - **Specification**: Wire `ws-adapter`'s `onStatus` callback on reconnect (`type === 'open'` following a `close` event) to reset `SocialCalc.hadSnapshot = false` and re-issue `SocialCalc.Callbacks.broadcast?.('ask.log')`.
   - **Cutover Blocker Decision**: **NON-BLOCKING FOLLOW-UP**. Does not help browser tabs already running pre-deploy bundle. Low-traffic window deploy + cache purge handles this release.

4. **PR 3: Asset Cache Policy & Content-Hashed Filenames** (`packages/worker/src/routes/assets.ts` & `scripts/build-assets.ts`)
   - **Specification**: Either update `serveAsset` in `routes/assets.ts:92-136` to set `Cache-Control: no-cache` for HTML/unhashed assets, or update `scripts/build-assets.ts` to emit content-hashed asset filenames (`player.[hash].js`).
   - **Cutover Blocker Decision**: **NON-BLOCKING FOLLOW-UP**. Manual Cloudflare Cache Purge during cutover (Step 4.3) mitigates asset skew.

5. **PR 4: Propagate RoomDO Command Rejections from `POST /_/:room`** (`packages/worker/src/routes/rooms.ts:778-784,924-936`)
   - **Specification & Implementation**: Implemented across both command dispatch sites in `packages/worker/src/routes/rooms.ts` (`xlsx-deferred` at lines 778-784 and main text-command tail at lines 924-936). When `/_do/commands` returns a non-2xx response, the handler returns its status and body to the HTTP caller instead of falling through to the unconditional 202 echo, matching `PUT /_/:room` (`routes/rooms.ts:355-369`). Verified by new tests `POST /_/:room command mutations propagate a DO 413 sheet-limit verdict` and `POST /_/:room returns 202 command echo on successful DO dispatch` in `packages/worker/test/routes-rooms.node.test.ts`. Confirmed zero oracle-fixture impact: recorded fixtures contain no over-limit commands (legacy EtherCalc had no sheet limits).
   - **Cutover Blocker Decision**: **LANDED & VERIFIED (BLOCKING PRE-CUTOVER FIX)**. The rejection is a no-op rather than data corruption, which limits the damage, but this upgrade changes an over-limit request from an applied write with a truthful 202 into a rejected write with a false 202. API clients have no error signal and may record work as accepted. The correction is localized and already has a route precedent, so accepting that brand-new silent-failure contract to avoid a small pre-cutover PR was not justified. Implemented and verified in `main` so API callers receive explicit rejection signaling (e.g. 413 with `command exceeds sheet limits`).
   - **Phase Placement**: Landed on `main` and ships in the single-ramp ship bundle (§4). It MUST NOT be folded into a lifecycle-only `149ebcf` artifact (Appendix A old Phase 1). Live §4.3 is the rollout of `main` behavioral changes with auth left on.

6. **Bulk PITR Automation and Private Room Inventory Tooling Gap**
   - **Specification**: Build operator CLI tooling (e.g. under `packages/cli/` or `scripts/`) to automate **bounded** PITR iteration over windowed D1 candidate sets, with paged private-room discovery and a retained private-room creation audit stream (`POST /_/private`) for inventories that D1 tails cannot reconstruct.
   - **Cutover Blocker Decision**: **NON-BLOCKING FOLLOW-UP GAP** (hosted track) — but **do not misread this as "manual mass restore is fine."** Single-room `POST /_/:room/pitr-restore` works on Cloudflare. At production scale (~1.8M rooms), whole-instance iteration is **not** an incident procedure (~500 h at 1 room/s; §2.4.1). Operators may script only a **bounded** candidate set (e.g. `rooms.updated_at` incident window). The one-shot `SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log` is **not** assumed runnable under D1's 30s/single-thread limits — use the paged form in §2.4.2 and mark live success `[OPERATOR-VERIFY]`. Zero-activity private rooms still need edge/access logs. **Self-host:** this entire D1+PITR recovery aid does not exist — use filesystem backup/restore of `./ethercalc-data` (§7.0, §7.2) instead.

7. **Search-indexing policy MUST ship** (`packages/worker/src/lib/robots.ts`, `packages/worker/src/index.ts` X-Robots-Tag middleware + `GET /robots.txt`, tests `lib-robots.node.test.ts` / `routes-security.node.test.ts`)
   - **Specification**: Exact-match allowlist `isIndexablePath` (`{'/': true}` only). Every non-landing response carries `X-Robots-Tag: noindex, nofollow, noarchive`. `GET /robots.txt` returns `ROBOTS_TXT` as `text/plain; charset=utf-8` with `Allow: /` and deliberately **no** `Disallow` directive (crawlers must stay able to fetch rooms so they can observe `noindex`; a Disallow freezes already-indexed rooms permanently — see module comment). Route is registered before `registerRoomCatchAll`; `run_worker_first = true` so the Worker beats static assets.
   - **Origin & restore**: Authored in `b7d4039` (subject `docs(migration): rescope DELTA_AUDIT f/g/h/k still-in-delta items` — dual-purpose docs+code commit). Stripped by `ae86756` (`revert: drop accidental robots changes from docs commit`) because the subject looked documentation-only. Restored forward by `c789249` (`fix(worker): restore search-indexing robots policy`) exactly as in `b7d4039`. **This code is required in the production ship.**
   - **Trap**: Any squash, rebase, cherry-pick, or subject-based triage that treats `b7d4039` as docs-only can silently drop production code again. Do not re-classify the robots paths as accidental.
   - **Pre-deploy check (ship tree)**: confirm `packages/worker/src/lib/robots.ts` exists and `app.get('/robots.txt'` is registered in `packages/worker/src/index.ts` **before** the `registerRoomCatchAll(app)` call (imports/comments also mention the symbol — match the call site):
     ```bash
     test -f packages/worker/src/lib/robots.ts \
       && test "$(grep -n "app.get('/robots.txt'" packages/worker/src/index.ts | head -1 | cut -d: -f1)" -lt \
               "$(grep -n 'registerRoomCatchAll(app)' packages/worker/src/index.ts | head -1 | cut -d: -f1)"
     ```
   - **Stale root `robots.txt`**: Repo-root `robots.txt` is a 26-byte file containing `User-agent: *\nDisallow: /\n` — the **opposite** policy. `scripts/build-assets.ts` `staticCopies` / `directoryCopies` do **not** copy it into `assets/` (plan covers root HTML, icons, `manifest.appcache`, locales, `player.js`, m3e NOTICE, and the `images/`, `static/`, passkey, multi directories only). Live `assets/` has no `robots.txt`. With `run_worker_first = true` the Worker route wins regardless, so the file is currently **dead weight, not a live conflict**. **Do not delete it in this cutover** — owner call whether to remove or rewrite later.
   - **Cutover Blocker Decision**: **BLOCKING SHIP REQUIREMENT**. The policy MUST be present in the shipped Worker artifact. Absence reverts production to today's behaviour where `GET /robots.txt` falls through `/:room` and returns the HTML shell. Verify with §5 Probes 13a–13c after ramp.
   - **Phase Placement**: Ships with the main behavioral bundle (same track as other `main` Worker changes). Not a Phase 1 lifecycle-only concern.

---

## §10 User-Visible Behavior Changes Summary

Operator-facing summary for this cutover. Each entry states whether it is a **change this ship introduces** or an **already-live mechanic** recorded here because operators still need it during cutover — do not announce already-live behavior as new.

1. **Sheet Dimension Ceiling**: Max declared area is capped at 200,000 cells (`packages/worker/src/lib/command-limits.ts:17`). _Nuance_: Existing sheets already exceeding 200k cells keep full read and edit access to cells inside their current bounds; they only lose the ability to add new rows or columns (`packages/worker/test/room.test.ts:356-395`).
2. **Large Paste Rejection at the Room Boundary**: Command batches expanding a sheet beyond 200,000 declared cells are rejected by RoomDO with HTTP 413 (`packages/worker/src/room.ts:699-703`); native WebSocket writes close with `1008 'Command exceeds sheet limits'` (`packages/worker/src/room.ts:1803-1808`). Snapshot writes through `PUT /_/:room` propagate the DO's 413 (`packages/worker/src/routes/rooms.ts:355-369`).
3. **HTTP Command API Rejection Signaling**: `POST /_/:room` now propagates RoomDO's non-2xx status and body (e.g., HTTP 413 with body `command exceeds sheet limits` for batches exceeding `MAX_SHEET_CELLS = 200_000`), matching `PUT /_/:room` at `packages/worker/src/routes/rooms.ts:355-369`. Native WebSocket writes close with 1008 (`Command exceeds sheet limits`). _Behavioral Shift_: An API client or script that previously received HTTP 202 for an over-limit write under legacy EtherCalc (which had no sheet limits) now receives HTTP 413. This correctly eliminates the silent write-loss defect while surfacing explicit error signaling.
4. **Form/App-Mode Tab Hydration**: Browser tabs in form/app mode open across cutover must perform a page reload (`packages/client/src/boot.ts:384-390`).
5. **Passkey session cookie rename (not a green-field passkey enable)**: Passkey accounts, `AuthDO`, and private sheets are **already live** in production (baseline window `[d2afa90, b7d8840)`; live `GET /_auth/whoami` → `{"uid":null,"enabled":true}` and root HTML already serves `./static/passkey/ui.js` — see STOP banner). This ship does **not** introduce them and must **not** be announced as a Phase 3 enable. What *does* change for those users is the session cookie rename `ec_sess` → `__Host-ec_sess` in `packages/worker/src/lib/session.ts:2`: `parseSessionCookie` (line 30) matches only `SESSION_COOKIE_NAME` with **no** legacy `ec_sess` fallback, so every currently signed-in passkey user is silently signed out at rollout and must re-authenticate. AuthDO-stored credentials and `session-secret` tokens survive; only the browser cookie name is orphaned. **Sharper consequence:** an open tab on a **private** room can fail to reconnect, because its WebSocket still presents a cookie the new Worker will not authenticate and RoomDO's deny-overrides ACL then returns 403 to the owner. Same residual risk as §4.5 item 1 / §4.1 D3 — temporary lockout-until-relogin, not declassification. Comms should say "sign in again if private sheets 403," not "passkeys are now available."
6. **WebSocket Message Rate Limits**: Exceeding 1500 messages per 10-second window closes the WebSocket with 1008 (`packages/worker/src/room.ts:1887-1890`).
7. **Private Room D1 Asymmetry & Recovery Mechanics**: Private rooms (`meta:access === 'private'`) are write-time excluded from the public D1 `rooms` index (`packages/worker/src/room.ts:2270-2271`). They are invisible to `GET /_rooms`, `GET /_roomtimes`, and `SELECT room FROM rooms`. Audit/chat mirrors remain unfiltered (`packages/worker/src/room.ts:2303-2309`), so **active** private rooms may appear in D1 tails — but fleet-scale discovery must use the **paged** form in §2.4.2 (`[OPERATOR-VERIFY]`); the one-shot `SELECT DISTINCT … UNION …` is likely to hit D1's 30s limit on large tables. Whole-instance DO PITR is not an operator procedure at ~1.8M rooms (§2.4.1). `wrangler d1 export` SQL backups still contain private-room SocialCalc commands and chat and MUST be handled as sensitive. Zero-activity private rooms require out-of-band inventory.

8. **Search-indexing policy (`X-Robots-Tag` + real `/robots.txt`)**: After this ship, every non-landing response carries `X-Robots-Tag: noindex, nofollow, noarchive` (`packages/worker/src/lib/robots.ts` `ROBOTS_NOINDEX`; middleware in `packages/worker/src/index.ts`), and only `/` remains indexable (`isIndexablePath` exact allowlist). `GET /robots.txt` becomes a real robots file (`Content-Type: text/plain; charset=utf-8`, body with `Allow: /` and no `Disallow` directive) instead of falling through the `/:room` catch-all. **Pre-ship production behaviour:** `GET https://ethercalc.net/robots.txt` returns the app HTML shell because the path is treated as a room named `robots.txt` — crawlers receive a page, not directives. **Intent:** room slugs are the only thing keeping public rooms private; indexing them turns "unguessable URL" into "first search result," and a linked sheet can drag neighbours into the index with it. **Do not "fix" this by adding `Disallow`:** forbidding fetch hides the `noindex` header and permanently freezes already-indexed rooms as bare-title results (module comment in `lib/robots.ts`). See §5 Probes 13a–13c and §8 item 7.


## Appendix A: Superseded Three-Phase Plan (baseline disproved 2026-08-10)

> **SUPERSEDED — DO NOT EXECUTE.** Preserved because the analysis and failure mode are instructive. Live production is in `[d2afa90, b7d8840)` with passkeys/`AuthDO` already on; the corrected procedure is **§4 Hosted cutover (single gradual ramp)**. Setting `ETHERCALC_AUTH="0"` against current production is a self-inflicted outage (STOP banner).

### A.0 Old §3 — Three-phase staging rehearsal (SUPERSEDED)

> **SUPERSEDED — DO NOT EXECUTE.** Historical three-phase staging path (Phase 1 lifecycle worktree → Phase 2 `ETHERCALC_AUTH="0"` / `enabled:false` → Phase 3 enable). Live production already has passkeys and private rooms (STOP banner). The live staging dress rehearsal is **§3** (single gradual ramp with `AUTH="1"`). The deploy-config CRITICAL WARNING about `--config wrangler.toml --env=staging` remains load-bearing and now lives in **live §3.1** (and §4.0).

Deploy all three phases to `[env.staging]` (`ethercalc-staging`) to execute end-to-end acceptance validation in an isolated Cloudflare environment.

#### A.0.1 Old §3.1 — Rehearsing Phase 1 & Deploying to Staging

> **Superseded staging path (analysis only).** For the live cutover, rehearse **§3** (single-ramp / `AUTH="1"`) instead. The Phase 1 worktree + Phase 2 `AUTH=0` release-branch steps below are retained to document the old three-phase rehearsal; **do not** use them as the production dress rehearsal.
>
> Historical text follows: deploy Phase 1 from the worktree (`.worktrees/phase1-lifecycle`), followed by Phase 2 from the Phase 2 release branch (`release/phase2-rollout`).

Note on configuration variables (historical three-phase only):

- The Phase 1 branch (`.worktrees/phase1-lifecycle/packages/worker/wrangler.toml`) contains no `ETHERCALC_AUTH` in `[env.staging.vars]`, so Phase 1 on staging is passkey-off by construction.
- Conversely, Phase 2 for production required a release branch (`release/phase2-rollout`) whose `packages/worker/wrangler.toml` sets `ETHERCALC_AUTH = "0"` in both `[vars]` and `[env.staging.vars]`. Staging rehearsal under the old plan deployed from that release branch.
- **Load-bearing staging deploy safety** (CRITICAL `--config wrangler.toml --env=staging` warning, ambient-shell-var warning, and `--var` `[OPERATOR-VERIFY]`) is **not** repeated here — it lives only in **live §3.1** (and §4.0). Apply those guards for any real staging deploy; do not treat this appendix block as the safety source of truth.

```bash
# 1. Build client assets
vp run build:assets

# 2. Apply D1 migrations to staging database
npx wrangler d1 migrations apply ethercalc_rooms_staging --remote --config=packages/worker/wrangler.toml --env=staging

# 3. Deploy Phase 1 (Lifecycle-only bundle from worktree) to staging to verify v2 DO migration on staging DO namespace
(cd .worktrees/phase1-lifecycle/packages/worker && vp exec wrangler deploy --config wrangler.toml --env=staging)

# 4. Deploy Phase 2 to staging from the release/phase2-rollout branch
cd packages/worker && vp exec wrangler deploy --config wrangler.toml --env=staging && cd ../..
```
#### A.0.2 Old §3.2 — Scripted Staging Acceptance Verification

Execute the following verification checklist against `https://ethercalc-staging.audreyt.workers.dev`:

1. **Legacy Un-migrated Room Handling**:
   - Access a room created prior to the upgrade (or a newly generated room without `meta:access`/`meta:acl` DO storage keys).
   - Verify `authorize()` in `packages/worker/src/lib/authorize.ts:20-22` evaluates `access == null` as `'public'`, returning HTTP 200 and allowing full read/write access (proven by `packages/worker/test/room.test.ts:257-353`).
   > **PARTIALLY AUTOMATED** — `legacy room without meta:access or meta:acl storage keys remains fully accessible to anonymous users` (`packages/worker/test/room.test.ts:258-353`; worker `test:workers`, CI `test`) proves anonymous HTTP, WebSocket, and write access without either key. Staging still proves that the deployed artifact can read an actual pre-upgrade DO.
2. **Legacy `?auth=` Query Parameter Link**:
   - Request `https://ethercalc-staging.audreyt.workers.dev/testroom?auth=legacysecret`.
   - Verify room opens without 500 error or authentication breakdown (`auth=0` remains view-only).
   > **PARTIALLY AUTOMATED** — The same workers-pool test (`room.test.ts:314-353`; worker `test:workers`, CI `test`) proves the legacy `auth=0` WebSocket path is view-only, while `packages/e2e/tests/redirects.spec.ts:52-62` (CI `e2e`) preserves generated `?auth=` links. Neither assertion opens this arbitrary legacy-secret URL against the deployed staging route.
3. **Form/App-Mode Room Hydration**:
   - Open a form-mode sheet (`ss.formDataViewer` active).
   - Verify that the new client bundle (`boot.ts:384-390`) sends `ask.log` for the main room in addition to `<room>_formdata`, successfully hydrating the sheet grid.
   > **PARTIALLY AUTOMATED** — `requests formdata then main-room log when a formDataViewer is present` (`packages/client/test/boot.test.ts:183-200`; client `test:coverage`, CI `test`) asserts both `ask.log` calls in order. The browser check adds proof that the built client shipped and hydrates through the live staging Worker.
4. **Large Command Batch & Limit Enforcement**:
   - Submit a command batch exceeding `MAX_SHEET_CELLS = 200_000` (e.g. `POST /_/staging-limit-test` expanding dimensions to A1:Z10000 = 260,000 cells).
   - Verify the HTTP response is `413 Payload Too Large` with `Content-Type: text/plain; charset=utf-8` and the exact lowercase body `command exceeds sheet limits` (`packages/worker/src/room.ts:703`, matching local Worker baseline in §5 Probe 6), while the WebSocket closes with `1008` and the distinct capitalized reason `Command exceeds sheet limits` (`packages/worker/src/room.ts:1805`).
   > **PARTIALLY AUTOMATED** — `routes-rooms.node.test.ts:810-825` asserts the route's exact HTTP 413, MIME, and lowercase body; `room.node.test.ts:3118-3139` asserts WebSocket close 1008 with the capitalized reason (worker `test:coverage`, CI `test`). Staging adds end-to-end proof for the deployed artifact and binding path.
5. **Legacy `/socket.io/*` Transport Shim**:
   - Request `curl -fsS "https://ethercalc-staging.audreyt.workers.dev/socket.io/1/?t=$(date +%s)"`.
   - Verify response returns HTTP 200, `Content-Type: text/plain; charset=utf-8`, and body matching `<32-hex-session-id>:60:60:websocket,xhr-polling` (matching local Worker baseline in §5 Probe 8).
   > **PARTIALLY AUTOMATED** — `GET /socket.io/1/ returns a colon-delimited handshake body` (`packages/worker/test/legacy-socketio.test.ts`; worker `test:workers`, CI `test`) asserts 200, text/plain, a `/^[0-9a-f]{32}$/` SID, exact `60:60` timeouts, and transports `websocket,xhr-polling`. It does not exercise staging routing.
6. **XLSX Import and Export**:
   - Upload a test `.xlsx` file via `POST /_/staging-xlsx-test` with header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (which decodes binary workbook data into `loadclipboard` + `paste A1 all` commands via the `xlsx-deferred` handler in `packages/worker/src/routes/rooms.ts:745`).
   - Export sheet via `GET /staging-xlsx-test.xlsx` (or the alternative valid export spelling `GET /_/staging-xlsx-test/xlsx`). Verify response returns `200 OK` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, binary body starting with ZIP signature bytes `PK\x03\x04`, and `Content-Disposition: attachment; filename="staging-xlsx-test.xlsx"`. Confirm downloaded file parses correctly and preserves cell data.
   - **CRITICAL WARNING**: The `GET /_/staging-xlsx-test.xlsx` spelling is **NOT** an export route. It targets a raw room named `staging-xlsx-test.xlsx` and returns `404 Not Found` with an empty `text/plain` body (matching local Worker baseline in §5 Probe 10a). An operator following the incorrect `/_/<room>.xlsx` spelling during staging rehearsal would see a 404, erroneously conclude XLSX export is broken, and could halt an otherwise healthy cutover.
   > **PARTIALLY AUTOMATED** — Worker tests assert XLSX import decoding (`routes-rooms-post.node.test.ts:167-218`) and export MIME, disposition, ZIP signature, and both valid routes (`exports.test.ts:151-172`); Playwright additionally imports real XLSX files (`packages/e2e/tests/landing-import.spec.ts:98-159`). Gates: worker `test:coverage`/`test:workers` and CI `e2e`. They do not assert the misleading `/_/<room>.xlsx` 404 or the staging artifact.
7. **Phase 2 Passkey Disabled Check (`ETHERCALC_AUTH="0"`)**:
   - Query `curl -fsS https://ethercalc-staging.audreyt.workers.dev/_auth/whoami`.
   - Verify body returns `{"uid":null,"enabled":false}` and `POST /_/private` returns `401 Unauthorized`.
   - This single probe proves the kill switch actually shipped to staging with passkeys disabled and would have caught deploying staging with `ETHERCALC_AUTH="1"`. Local proof of kill-switch lockout behavior is in `packages/worker/test/routes-rooms.node.test.ts` (test named `keeps an existing private room locked when ETHERCALC_AUTH is off`).
   > **PARTIALLY AUTOMATED** — `whoami reports enabled:false when ETHERCALC_AUTH is "0" or null` (`packages/worker/test/routes-auth.node.test.ts:232-251`) and private-room route tests (`routes-rooms.node.test.ts:925-1008`) prove the kill switch locally under worker `test:coverage` (CI `test`). This live probe adds the distinct, essential assertion that `ETHERCALC_AUTH="0"` actually shipped to staging.
8. **Phase 3 Passkey Enabled Check (`ETHERCALC_AUTH="1"`)**:
   - Query `curl -fsS https://ethercalc-staging.audreyt.workers.dev/_auth/whoami`.
   - Verify body returns `{"uid":null,"enabled":true}`.
   - Initiate passkey registration ceremony at `POST /_auth/register-init` and complete at `POST /_auth/register-complete`.
   - **CRITICAL NOTE**: Passkeys registered on staging are bound to WebAuthn RP ID `ethercalc-staging.audreyt.workers.dev` (`packages/worker/wrangler.toml:84`). They are **NOT portable** to production (`ethercalc.net`) because WebAuthn RP IDs strictly enforce exact domain matching.
   > **PARTIALLY AUTOMATED** — `whoami reports the verified principal, anonymity, and availability` (`routes-auth.node.test.ts:201-229`; worker `test:coverage`) covers the enabled response, while `packages/e2e/tests/passkey-webauthn-real.spec.ts:194-407` (CI `e2e`) completes real virtual-authenticator registration and private-room authorization against a localhost RP. The manual ceremony proves the staging RP/origin and deployed credentials, which those local gates cannot.
9. **Asset Purge & Freshness Check**:
   - Request `curl -fsSI https://ethercalc-staging.audreyt.workers.dev/static/player.js`.
   - Confirm asset loads cleanly with `200 OK` and a JavaScript `Content-Type` that browsers accept for `<script type="module">`.
   - **MIME split** (`packages/worker/src/routes/assets.ts` `serveAsset` / `mimeForPath`):
     - **Hosted Cloudflare Workers Assets** (staging/production, and `wrangler dev`) already supply a real type — empirically `text/javascript; charset=utf-8`. `serveAsset` passes non-`application/octet-stream` types through untouched.
     - **Standalone workerd self-host / Sandstorm `DiskDirectory`** returns `application/octet-stream` for every file; `serveAsset` then rewrites `.js` via `MIME_BY_EXT` to `application/javascript; charset=utf-8`.
   - Either subtype is acceptable for module-script loads; treat a `text/javascript` ↔ `application/javascript` difference as informational as long as status is `200 OK`. Fail on missing/wrong major type (e.g. `application/octet-stream` or `text/plain`).
   > **PARTIALLY AUTOMATED** — `packages/worker/test/assets.test.ts` pins both branches of `serveAsset` for `/static/player.js`: standalone-workerd rewrite to `application/javascript; charset=utf-8`, and pass-through of a non-opaque `text/javascript; charset=utf-8` from the assets binding (worker `test:workers`, CI `test`). `packages/e2e/tests/client-single-smoke.spec.ts:37-125` (CI `e2e`) proves the bundle boots and persists an edit. Neither checks staging edge-cache freshness.
10. **Cross-Room Index Gating (`/_rooms*`)**:
   - Request `curl -sS -i https://ethercalc-staging.audreyt.workers.dev/_rooms`.
   - On staging (`ETHERCALC_CORS="1"`), verify endpoint returns HTTP `403 Forbidden`, `Content-Type: text/plain; charset=utf-8`, and body matching exactly `_rooms not available with CORS` (30 bytes, no trailing newline, matching local Worker baseline in §5 Probe 9).
   > **PARTIALLY AUTOMATED** — `GET /_rooms returns 403 when room index is disabled` (`packages/worker/test/routes-rooms.node.test.ts:606-631`) asserts both `ETHERCALC_DISABLE_ROOM_INDEX` and legacy `ETHERCALC_CORS="1"` paths plus the exact body; `room-index-access.node.test.ts:29-87` covers precedence (worker `test:coverage`, CI `test`). Staging still proves the intended vars shipped.

### A.1 Old three-phase cutover execution

> The still-valid deploy-config guard that used to live here as old §4.0 is now **live §4.0**. Old §4.5–§4.6 skew analysis is now **live §4.8–§4.9**. What remains in this appendix subsection is the disproved Phase 1–3 sequence and its cutover-log/D1 preamble.

> **SUPERSEDED PENDING RE-BASELINE (2026-08-10).** The three-phase sequence below assumes production is pre-passkey `149ebcf`. Live probes show passkeys/`AuthDO` already on and security-audit assets not yet deployed. **Do not execute Appendix A.1.2–A.1.4 (old §4.2–§4.4).** See the STOP banner at the top of this document.

To guarantee 100% safe rollback capabilities during major code changes, cutover MUST follow this Three-Phase strategy.

### A.1.0 Old cutover log — named artifacts (record as you go)

Keep one operator log (ticket, notepad, or file). Fill each row when the step that produces it completes. Lost stdout is recoverable from the CLI; do not invent IDs.

| Artifact | When to record | Primary capture | If stdout was lost |
| :------- | :------------- | :-------------- | :----------------- |
| `PRE_CUTOVER_BOOKMARK` | Before any deploy (§2.1 / §0.2 step 4) | `npx wrangler d1 time-travel info ethercalc_rooms` (save stdout immediately) | **Do not** re-run `time-travel info` after cutover — that returns a *current* bookmark, not the pre-cutover one. Recover only from the saved command output / change log, or from a recorded pre-cutover UTC timestamp via §6.4. If neither exists, treat the bookmark as **indeterminate**. |
| `PRE_CUTOVER_D1_SIZE` | Before any deploy (§0.2.2) | `database_size` from `npx wrangler d1 info ethercalc_rooms --json` | Re-run §0.2.2 |
| `PHASE1_VERSION_ID` | Immediately after Phase 1 deploy succeeds (Appendix A.1.2 / old §4.2) | Version ID printed by `wrangler deploy` / CI deploy log | `npx wrangler versions list` / `npx wrangler deployments list` (§0.2) — take the active 100% post–Phase-1 version |
| `PHASE2_VERSION_ID` | Immediately after `wrangler versions upload` (Appendix A.1.3 / old §4.3) | Upload command stdout | `npx wrangler versions list` (§0.2) — the uploaded Phase 2 version (not necessarily 100% until ramp completes) |
| `PHASE3_VERSION_ID` | Immediately after Phase 3 deploy succeeds (Appendix A.1.4 / old §4.4) | Version ID printed by `wrangler deploy` / CI deploy log | `npx wrangler versions list` / `npx wrangler deployments list` (§0.2) — active 100% version with auth on |

`PHASE1_VERSION_ID` is required for any Phase 2 → Phase 1 rollback. `PHASE2_VERSION_ID` is required for Phase 3 → Phase 2. `PHASE3_VERSION_ID` is required to re-enable auth after a Phase 3 → Phase 2 lockout rollback without rebuilding (old §6.2).

### A.1.1 Old §4.1 — Pre-Deploy D1 Database Migrations

Execute D1 migrations prior to deploying Worker code:

```bash
npx wrangler d1 migrations apply ethercalc_rooms --remote --config=packages/worker/wrangler.toml --env=""
```

**Reasoning for Order:**  
All database migration scripts (`0001_rooms.sql`, `0002_cron.sql`, `0003_audit_chat.sql`) are strictly **expand-only** using `CREATE TABLE IF NOT EXISTS`. Old worker code (commit `149ebcf...`) ignores these new tables, making D1 migration execution 100% safe to run before code deployment.

---

### A.1.2 Old §4.2 — Phase 1: Lifecycle-Only Deployment (`npx wrangler deploy`) — **SUPERSEDED PENDING RE-BASELINE**
> **SUPERSEDED PENDING RE-BASELINE.** Phase 1 exists to land DO migration `v2` / `AuthDO` from a `149ebcf` baseline. Production already serves `/_auth/whoami` with `enabled:true`, so `AuthDO` + `AUTH` are live — re-running a lifecycle-only `149ebcf`+v2 bundle is the wrong operation and may be a no-op or a dangerous downgrade. Confirm with `wrangler deployments list` before any lifecycle deploy.

#### Building the Phase 1 Minimal Branch (PROVEN)

To isolate the DO lifecycle migration `v2`, a minimal branch `release/phase1-lifecycle` was created from `149ebcf16104b01254ca2b796beb701c88bd6ff8` in git worktree `.worktrees/phase1-lifecycle`.

The exact 8-file change set (`git diff --stat 149ebcf..HEAD`) is:

```text
 bun.lock                                 |  53 +++
 packages/worker/package.json             |   3 +-
 packages/worker/src/auth-do.ts           | 633 +++++++++++++++++++++++++++++++
 packages/worker/src/index.ts             |   1 +
 packages/worker/src/lib/rate-limit.ts    |   6 +-
 packages/worker/src/lib/storage-batch.ts |  61 +++
 packages/worker/src/lib/webauthn-ops.ts  |  52 +++
 packages/worker/wrangler.toml            |  12 +
 8 files changed, 819 insertions(+), 2 deletions(-)
```

**Proven Step-by-Step Recipe**:

1. **New Files Added from `main`**:
   - `packages/worker/src/auth-do.ts`
   - `packages/worker/src/lib/webauthn-ops.ts`
   - `packages/worker/src/lib/storage-batch.ts`
2. **Dependency Addition**: Add `"@simplewebauthn/server": "^13"` to `packages/worker/package.json` dependencies (updates `packages/worker/package.json` and locks transitive packages in `bun.lock`).
3. **`rate-limit.ts` Signature Reconciliation**:
   - At `149ebcf`, `packages/worker/src/lib/rate-limit.ts` exported `createRateLimitStore()` taking zero parameters (no `MAX_BUCKETS` constant, no bucket map eviction).
   - `auth-do.ts` imports `createRateLimitStore` and calls `createRateLimitStore(2_048)`.
   - **Reconciliation**: Change signature to `export function createRateLimitStore(maxBuckets?: number): RateLimitStore` and evict `buckets.keys().next().value` only when `maxBuckets !== undefined`.
   - **Inertness Rationale**: Defaulting `maxBuckets` to `10_000` for 0-argument callers would alter existing rate-limiter behavior in a bundle whose sole purpose is behavioral inertness. The optional parameter leaves all pre-existing rate limiters unmodified while allowing `AuthDO`'s explicit `2_048` capacity bound to compile and function. (Note: `main` defaults `maxBuckets = 10_000`; Phase 2 brings that default when full worker logic rolls out).
4. **Class Export (`packages/worker/src/index.ts`)**: Export `AuthDO` alongside `RoomDO`:
   ```ts
   export { RoomDO } from "./room.ts";
   export { AuthDO } from "./auth-do.ts";
   export { scheduled } from "./scheduled.ts";
   ```
5. **Wrangler Config (`packages/worker/wrangler.toml`)**: Add the `AUTH` Durable Object binding (both top-level and in `[env.staging]`) and the `v2` migration stanza:

   ```toml
   [[durable_objects.bindings]]
   name = "AUTH"
   class_name = "AuthDO"

   [[env.staging.durable_objects.bindings]]
   name = "AUTH"
   class_name = "AuthDO"

   [[migrations]]
   tag = "v2"
   new_sqlite_classes = ["AuthDO"]
   ```

#### Phase 1 Build Verification (PROVEN)

Both verification gates pass cleanly on `release/phase1-lifecycle`:

- **Gate 1 (`vp run @ethercalc/worker#typecheck`)**:

  ```text
  ~/packages/worker$ tsc --noEmit ⊘ cache disabled
  ```

- **Gate 2 (`vp run @ethercalc/worker#build:dry`)**:

  ```text
  ~/packages/worker$ wrangler deploy --dry-run ⊘ cache disabled

   ⛅️ wrangler 4.107.0 (update available 4.120.0)
  ───────────────────────────────────────────────
  ▲ [WARNING] Multiple environments are defined in the Wrangler configuration file, but no target environment was specified for the deploy command.

    To avoid unintentional changes to the wrong environment, it is recommended to explicitly specify the target environment using the `-e|--env` flag or CLOUDFLARE_ENV env variable.
    If your intention is to use the top-level environment of your configuration simply pass an empty string to the flag to target such environment. For example `--env=""`.


  ✨ Read 163 files from the assets directory /Users/au/w/ethercalc/.worktrees/phase1-lifecycle/assets
  Total Upload: 2869.17 KiB / gzip: 537.35 KiB
  Your Worker has access to the following bindings:
  Binding                                   Resource
  env.ROOM (RoomDO)                         Durable Object
  env.AUTH (AuthDO)                         Durable Object
  env.DB (ethercalc_rooms)                  D1 Database
  env.ASSETS                                Assets
  env.BASEPATH ("")                         Environment Variable
  env.ETHERCALC_CORS ("1")                  Environment Variable

  --dry-run: exiting now.
  ```

  And on staging (`wrangler deploy --dry-run --env=staging`), the verified staging dry-run binding table is:

```text
Binding                                           Resource
env.ROOM (RoomDO)                                 Durable Object
env.AUTH (AuthDO)                                 Durable Object
env.DB (ethercalc_rooms_staging)                  D1 Database
env.ASSETS                                        Assets
env.BASEPATH ("")                                 Environment Variable
env.ETHERCALC_CORS ("1")                          Environment Variable
```

_Verification Artifact Analysis_: The dry-run binding table confirms `env.AUTH (AuthDO)` is registered alongside `env.ROOM (RoomDO)`, and that no passkey environment variables (`ETHERCALC_AUTH`, `ETHERCALC_RP_ID`, `ETHERCALC_ORIGIN`) are included in Phase 1. Combined with the absence of `packages/worker/src/routes/auth.ts` (no `/_auth/*` HTTP routes registered), Phase 1 is behaviorally inert.

> **Caveat on Verification**: Successful `typecheck` and `build:dry` prove that the minimal Phase 1 bundle **compiles and bundles** without type errors or missing imports. They do not substitute for testing live runtime behavior on Cloudflare infrastructure. Under the superseded three-phase plan, the old staging rehearsal in **Appendix A.0** was mandatory before Phase 1 production deploy. **Live cutover does not run Phase 1**; the live staging dress rehearsal is **§3**.

#### Phase 1 Execution Procedure

##### Option A (Preferred / Production Path): GitHub Actions CI Workflow

1. Push `release/phase1-lifecycle` branch (or merge to target release branch).
2. Go to **GitHub Actions → Deploy Production → Run workflow**.
3. Type `"deploy"` to confirm execution.
*Why Option A is preferred*: GitHub Actions executes on a clean runner (fresh git checkout). Because `.wrangler/` and `dist/` are gitignored and never created by CI asset build steps (`client#build`, `client-multi#build`, `scripts/build-assets.ts`), CI is **structurally immune** to the configuration redirect artifact.

##### Option B (Secondary / Emergency Local CLI Fallback Path)

```bash
# MANDATORY PRECONDITION: Perform §4.0 verification check (confirm no redirect banner).
cd .worktrees/phase1-lifecycle/packages/worker
npx wrangler deploy --config=wrangler.toml --env=""
cd ../..
# Capture returned PHASE1_VERSION_ID → cutover log (table above / this section)
```

##### Decision card — Unknown Phase 1 outcome (deploy error / dead terminal)

**Situation:** Phase 1 `wrangler deploy` errored, hung, or the terminal died. You do not know whether migration `v2` is active. Irreversible boundary → Appendix A.2.3 (old §6.3).

**Inspect:** run §0.2 steps 1–2 (`deployments list`, `versions list`).

**Interpretation (no sample CLI output claimed):**

- **`v2` active:** live deployment is **100%** on a post–Phase-1 version that carried `AuthDO` / migration `v2` (same criterion as Appendix A.2.3 / old §6.3). Checks: (a) one version at 100%; (b) created time matches this attempt; (c) pre-cutover baseline is not the sole live version. A migration-tag field showing `v2` confirms; **missing field ≠ failure**.
- **`v2` not active:** still 100% on the pre-cutover baseline; no new 100% Phase 1 deployment.
- **Indeterminate:** lists disagree, traffic split, newest deploy not 100%, or live version unclear.

**Branch:**

| Result | Act |
| :----- | :-- |
| **`v2` active** | Record live 100% ID as `PHASE1_VERSION_ID` (Cutover log, start of §4). Continue to Phase 2. Never pre-v2. |
| **`v2` not active** | Fix error; re-run same Phase 1 deploy (Appendix A.1.2 / old §4.2). Pre-v2 rollback still valid until `v2` active. |
| **Indeterminate** | **STOP.** No Phase 2. No “safe” pre-v2 rollback. Escalate with: deploy/CI log, both §0.2 outputs (`--json` if available), UTC attempt time, any partial version in `versions list`. |

**Retry safety:** Same Phase 1 bundle (`new_sqlite_classes = ["AuthDO"]`, tag `v2`) is the recover path when `v2` is **not** active. Tags apply once; retry must not undo a successful `v2`. **`[OPERATOR-VERIFY]`** on staging: interrupt/re-run Phase 1 and confirm this branch matches Wrangler — not on production.

**Version ID:** Write `PHASE1_VERSION_ID` to the Cutover log before leaving Phase 1; if stdout lost but `v2` active, recover via §0.2 lists (Cutover log table).

**PLATFORM EFFECT & ROLLBACK TARGET**: Executing `npx wrangler deploy` in Phase 1 completes the DO lifecycle schema change (`v2`). Cloudflare platform rules permanently prevent rollbacks to pre-v2 versions (`149ebcf...`). However, because Phase 1 code is behaviorally inert, Phase 1 has zero user impact. **Rollback Target for Phase 1**: The Phase 1 deployment itself (`release/phase1-lifecycle` IS the forward-fix artifact retaining `149ebcf` code + `AuthDO` + `v2` migration).



---

### A.1.3 Old §4.3 — Phase 2: Main Code & Assets Gradual Rollout (`ETHERCALC_AUTH = "0"`) — **SUPERSEDED PENDING RE-BASELINE**
> **⛔ SUPERSEDED PENDING RE-BASELINE — HAZARDOUS AS WRITTEN.** Setting `ETHERCALC_AUTH = "0"` was justified only while production had **no** passkeys or private rooms. Live production has both. Deploying Phase 2 as written would disable passkey logins and **403-lock existing private rooms for their owners**. Do **not** upload or ramp a production version with `ETHERCALC_AUTH="0"` until the cutover is redesigned.

Phase 2 deploys all of `main` (updated `RoomDO`, `command-limits.ts`, `authorize.ts`, assets) with `ETHERCALC_AUTH = "0"` in `packages/worker/wrangler.toml`.
The Phase 2 artifact is built from `main` after the command-rejection propagation PR (§8 item 5 / Appendix A.3 item 6) landed. That behavioral fix ships in Phase 2; it MUST NOT be added to the deliberately inert, `149ebcf`-based Phase 1 lifecycle bundle.

#### Execution Procedure & Version Preview Override (`[OPERATOR-VERIFY]`)

##### Option A (Preferred / Production Path): GitHub Actions CI Workflow

1. Ensure `packages/worker/wrangler.toml` `[vars]` specifies `ETHERCALC_AUTH = "0"`.
2. Push commit to `main` (or release branch).
3. Go to **GitHub Actions → Deploy Production → Run workflow** and type `"deploy"`.
*Why Option A is preferred*: CI runs on a clean runner, eliminating the local `.wrangler/deploy/config.json` redirect trap entirely.

##### Option B (Secondary / Emergency Local CLI Fallback Path)

```bash
# 1. MANDATORY PRECONDITION: Perform §4.0 verification check. Ensure wrangler.toml [vars] specifies ETHERCALC_AUTH = "0"
# 2. Build production client assets
vp run build:assets

# 3. Upload Phase 2 Worker version WITHOUT deploying to production traffic (using explicit --config to bypass local redirect)
cd packages/worker
npx wrangler versions upload --config=wrangler.toml --env=""
# Capture the output PHASE2_VERSION_ID (e.g. "dc8dcd28-0123-4567-89ab-cdef01234567")

# 4. Smoke-test Phase 2 in production at 0% traffic using official Cloudflare header override:
curl -fsS -H 'Cloudflare-Workers-Version-Overrides: ethercalc="<PHASE2_VERSION_ID>"' https://ethercalc.net/_auth/whoami
# Expected: HTTP 200 OK {"uid":null,"enabled":false}

# 5. Ramp traffic gradually (staged 10% -> 50% -> 100%):
npx wrangler versions deploy <PHASE2_VERSION_ID>@10% --env=""
# Dwell + abort: follow Decision card — Phase 2 ramp abort (immediately below), not this comment alone.
npx wrangler versions deploy <PHASE2_VERSION_ID>@50% --env=""
npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""

# 6. MANDATORY EDGE CACHE PURGE:
# Cloudflare Dashboard -> Caching -> Configuration -> Purge Everything
```
> **PARTIALLY AUTOMATED** — The root nightly-config test (`scripts/vite-workflow.test.ts:458-469`; root `vp run test`) protects the checked-in staging dry run, worker auth tests (`routes-auth.node.test.ts:232-251`) protect the disabled response, and `build:assets` is a preflight gate. They do not upload this version, prove the flag/config selected by Wrangler, ramp live traffic, observe analytics, or purge the edge cache; those operator actions remain load-bearing.

**ROLLBACK TARGET FOR PHASE 2**: Phase 2 contains ZERO DO lifecycle changes. **Phase 2 can be rolled back to Phase 1 instantly at any time via `npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`**. Because `ETHERCALC_AUTH = "0"`, no private rooms or passkeys can be created during Phase 2, making rollback completely safe and hazard-free on the private-data axis. **Snapshot serialisation:** rooms edited under Phase 2 may be re-saved with the expanded multipart envelope (`part:edit` / `part:audit`, `socialcalc:version:1.0`). That is **not** a Phase 2→1 hazard here: Phase 1 (`149ebcf` / `.worktrees/phase1-lifecycle`) already ships the **same** SocialCalc 3.1.0 `socialcalc.bundled.ts` as `main` (byte-identical). Independently, genuine SocialCalc 3.0.8 also parses those 3.1.0-written saves with cell data preserved (`packages/socialcalc-headless/test/legacy-snapshot-reverse.node.test.ts`) — defense-in-depth if an older operator artifact is ever used.


##### Decision card — Phase 2 ramp abort (e.g. at 50%, errors climbing)

**Situation:** Phase 2 is partially ramped (10% or 50%). Error rate or probe failures are climbing. Minutes to decide.

**Cost of abort (read once):** Rolling a Phase-2-pinned Durable Object back to Phase 1 causes a **second** DO restart for that object — the same dropped-WebSocket and stale-tab / no-rehydrate consequences as the forward ramp (§4.5–§4.6). The abort is not free; still prefer abort over soaking a bad version.

**Per-room cohort observability:** Each RoomDO is pinned to one Worker version for the life of a gradual deployment ([DO gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/)), but **which version serves a given room id is not operator-observable** in this deployment (no `version_metadata` binding, no configured Workers Logpush `ScriptVersion` pipeline, no room→version admin API). **Do not spend incident time trying to attribute one room to 10% vs 90%.** Decide from fleet signals and §5 probes only.

**Inspect → dwell → abort rule:**

| Ramp step | Dwell before next step | Abort if any of these hold during dwell |
| :-------- | :--------------------- | :-------------------------------------- |
| `@10%` | **10 minutes** | §5 Probe 1 (`/_health`) or Probe 5 (public read/write) fails its contract on normal traffic; or version-override Probe 2 (`whoami` → `enabled:false`) fails against `PHASE2_VERSION_ID`; or Cloudflare Workers analytics shows a clear, sustained 5xx/error-rate climb on the deployment that is not explained by the known restart blip at step start |
| `@50%` | **10 minutes** | Same abort rule |
| `@100%` | Begin Phase 2 soak (not a short dwell); run full §5 Phase 2 probe set | Same abort rule, or any §5 Phase 2 probe hard-fail |

There is **no** numbered §5.1 metric watch-list with numeric thresholds in this runbook. The minimum viable abort signal is: **hard probe failure (§5 contracts above) OR a sustained analytics error-rate climb you would not accept at 100%.** If analytics are noisy and probes are green, prefer extend-dwell over guesswork — then escalate.

**Reduce 50%→10% vs all-or-nothing:** Cloudflare documents rollback from a split deployment as replacing both sides with **one** version at **100%** ([Rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)). DO gradual rules guarantee monotonic **increase** of a version’s percentage without reassigning objects already on that version — not a safe “dial down” ([DO gradual deployments](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/)). **Do not abort by reducing percentage (50→10).** Abort = pin Phase 1 at 100%:

```bash
cd packages/worker
npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""
cd ..
```

If `PHASE1_VERSION_ID` is missing, recover it from the Cutover log (start of §4) or §0.2 lists.

**`[OPERATOR-VERIFY]`:** Before cutover, confirm on staging that `wrangler versions deploy` rejects or unsafely handles a percentage decrease if you are tempted to rely on dial-down; production abort path remains Phase 1 @ 100% only.

**Post-rollback verification:** Re-run §5 Phase 2 probes **1, 4, 5, 7** against production (health, `player.js`, public read/write, WebSocket). Expect Probe 2 (`whoami`) to reflect whatever code Phase 1 serves (Phase 1 is inert / pre-auth routes — do not require Phase 2’s `enabled:false` shape). Confirm `deployments list` shows `PHASE1_VERSION_ID` @ 100%. Then stop the ramp; schedule a forward retry only after root cause.

**During Phase 2 soak:** if D1 writes begin failing, check `database_size` against the §0.2.2 capacity ceiling **first**. A full D1 capacity-incident procedure is **deliberately out of scope** here — capacity exhaustion is a pre-existing operational condition, not caused by this cutover.

#### A.1.3.1 Old §4.3.1 — Mixed-Version Cross-Room Interaction During the Phase 2 Ramp

Cloudflare gradual deployments pin **each Durable Object instance to one Worker version** for the life of that deployment, while the front-door Worker isolate that handles an ingress request may be a *different* version than a sibling room it later reaches ([Gradual deployments with Durable Objects](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/)). EtherCalc has **one `RoomDO` per room**, so a 10% / 50% ramp means different rooms can run Phase 1 (`149ebcf` + `AuthDO`) and Phase 2 (`main`, `ETHERCALC_AUTH="0"`) code **at the same time**. Cross-room traffic is therefore the real mixed-version surface — not only the per-room WebSocket restart already covered in §4.5–§4.6.

Unknown `/_do/*` paths on both trees fall through to **`501 Not implemented`** (baseline router end at the `149ebcf` `room.ts` fetch handler; HEAD `packages/worker/src/room.ts:489`) — not 404.

##### Cross-room path map (verified against `packages/worker/src`)

| Path | Initiator | Hop | Target `/_do/*` | Request / response contract |
| :--- | :-------- | :-- | :-------------- | :-------------------------- |
| **Cross-sheet formula hydration** | `RoomDO.#getSpreadsheet` → `#hydrateCrossSheetRefs` (`room.ts:2179`, `room.ts:2204-2208`; pure orchestration in `lib/cross-sheet.ts:87-126`) | **DO→DO** | sibling `GET /_do/snapshot` via `#fetchSibling` (`room.ts:2194-2201`) — no `?name=`, no `X-EC-Uid` | Body: raw SocialCalc save text. Non-200 or empty → `null`; caller skips the ref and formulas degrade to `#NAME?` (`room.ts:2157-2159`). HEAD also bounds body size via `readBoundedResponseText` (`cross-sheet.ts:45-74`, `room.ts:2200`). |
| **WS `submitform` → `_formdata` sibling** | `handleExecute` in the source room (`lib/ws-handlers.ts:177-198`) through `ctx.siblingDo` (`room.ts:1853-1866`) | **DO→DO** | `POST /_do/commands?name=<room>_formdata` with plaintext command body | Failures swallowed (`ws-handlers.ts:193-195`). HEAD additionally gates private rooms with `allowSubmitForm` (`room.ts:1849-1851`) and may thread `X-EC-Uid`. |
| **DELETE room → wipe `_formdata` sibling** | `RoomDO.#deleteFormdataSibling` (`room.ts:809-828`) from `#deleteAllAndUnindex` | **DO→DO** | `DELETE /_do/all?name=<sibling>` | Best-effort; errors swallowed (`room.ts:826-827`). HEAD may forward `X-EC-Uid`. |
| **Multi-cascade rename install leg** | Source `RoomDO.#postRename` after Worker `POST /_do/rename` (`room.ts:953-995`) | **DO→DO** | target `POST /_do/install` with JSON `{ snapshot, log, audit }` (`room.ts:979-982`) | Source expects 2xx or returns `502 install failed` (`room.ts:984-985`); on success source `deleteAll`s itself and returns `201`. Install body shape is unchanged from `149ebcf`. |
| **Template clone** | Source `RoomDO.#postClone` after Worker `POST /_do/clone` (`room.ts:1002-1030`; Worker glue `routes/assets.ts` template form) | **DO→DO** | target `PUT /_do/snapshot?name=<to>` with raw snapshot body | `201` / `502 clone failed`. |
| **Legacy socket.io sid-host `execute` forward** | Sid-keyed `RoomDO.#handleLegacyFrame` when `attachment.room` is empty (`room.ts:1693-1709`) | **DO→DO** | real room `POST /_do/commands?name=<room>` | Best-effort; errors swallowed. |
| **Multi-cascade rename (Worker leg)** | `POST /_/:room` when command matches multi-cascade (`routes/rooms.ts:870-967`) | **Worker→DO** then DO→DO above | (1) `GET /_do/snapshot` on TOC room; (2) after authorizing write, `POST /_do/rename` `{ to: "<subsheet>.bak" }` on namespace-guarded `<room>.<n>` | Rename failures swallowed (`rooms.ts:954-955`). HEAD defers rename until the TOC write returns 2xx; `149ebcf` issued rename *before* the write. |
| **Multi-sheet workbook entry / export** | Worker `getWorkbookKind` (`routes/assets.ts:140-151`); multi export walks TOC (`routes/exports.ts:100-138`) | **Worker→DO** (fan-out across child rooms) | `GET /_do/workbook-kind` → `{ kind: "absent"\|"multi"\|"single" }`; multi export uses `GET /_do/csv.json` then per-child `GET /_do/sheet-data` | `workbook-kind` non-OK → `"unknown"` (no throw). Missing child sheet-data → `continue` (skip sheet). |
| **Page / edit access probes** | `registerRoomCatchAll`, `/:room/edit`, `DELETE /_/:room` (`routes/assets.ts:349-350`, `routes/stateless.ts:82-85`, `routes/rooms.ts:638-650`) | **Worker→DO** | `GET /_do/access` → `{ isPrivate, canRead, canWrite }` | Non-OK / malformed JSON → `access = null`. **Not an authz decision:** HTML/`edit` only skip optional UX redirects (`assets.ts:351-378`, `stateless.ts:86-96`); DELETE is **fail-closed** (`access === null` → `403`, `rooms.ts:642-650`). RoomDO remains the sole authz boundary on subsequent content/command fetches (AGENTS.md decision #14). |
| **Private room init** | `POST /_/private` and `POST /_from/:template/private` (`routes/rooms.ts:218-234`, `678-694`) | **Worker→DO** | `POST /_do/init-private` with JSON `{ snapshot, acl, group? }` | Caller requires `201`; any other status (including old DO **`501 Not implemented`**) is returned **verbatim** to the client (`rooms.ts:232-234`, `692-694`) — user-visible failure, not a soft fallback. |
| **Ordinary room CRUD / commands / exports** | Worker route handlers via `doFetch` (`lib/do-dispatch.ts:38-57`) | **Worker→DO** | pre-existing `/_do/snapshot`, `/_do/commands`, `/_do/cells`, `/_do/html`, `/_do/csv`, `/_do/csv.json`, `/_do/md`, `/_do/xlsx`, `/_do/ods`, `/_do/fods`, `/_do/sheet-data`, `/_do/clone`, `/_do/rename`, `/_do/exists`, `/_do/all`, `/_do/log`, `/_do/ws`, … | Single-room; listed because the front-door Worker version and the target DO version can still diverge under a gradual ramp. |
| **Cron fire** | Worker `scheduled()` (`scheduled.ts:104-114`) | **Worker→DO** | `POST /_do/fire-trigger?cell=…&room=…` | Non-OK skipped (trigger not marked fired). |
| **`ask.recalc` (client label only)** | Native/legacy WS on the **already-attached** room socket (`room.ts:1547-1550`, `ws-handlers.ts:234+`) | **not cross-DO** | n/a — room field names a formula sheet; state is served from *this* DO’s storage | Not a room-boundary hop; included so operators do not mistake it for DO→DO. |

`doFetch` is always Worker→DO (`lib/do-dispatch.ts:38-57`): it resolves `env.ROOM.idFromName(encodeRoom(room))`, appends `?name=`, strips inbound `X-EC-Uid`, and sets `X-EC-Uid` only from a verified session principal. True DO→DO calls use `env.ROOM.get(…).fetch('https://do.local/…')` directly inside `RoomDO` / `ws-handlers` and therefore pair two room versions with **no** Worker mediator.

##### `/_do/*` protocol delta (`149ebcf` → HEAD)

**Endpoints added on HEAD (absent on Phase 1 `RoomDO`; old code answers `501 Not implemented`):**

| Endpoint | Shape | Who calls it on `main` |
| :------- | :---- | :--------------------- |
| `GET /_do/access` | JSON `{ isPrivate, canRead, canWrite }` (`room.ts:353-354`, `503-511`) | Worker HTML/edit/DELETE probes only. Gate-exempt. |
| `GET /_do/workbook-kind` | JSON `{ kind: "absent"\|"multi"\|"single" }` (`room.ts:385-386`, `843-875`) | Worker default-room / Sandstorm root classifier only (`assets.ts:140-151`). |
| `POST /_do/init-private` | JSON `{ snapshot, acl, group? }` → private access trio + optional snapshot (`room.ts:465-466`, `#postInitPrivate`) | `POST /_/private` and `POST /_from/:template/private` only. |

**Endpoints removed or renamed:** none. Every `149ebcf` `/_do/*` route still exists on HEAD.

**Same path, changed behaviour (public-room / Phase 2 relevant):**

| Endpoint | `149ebcf` | HEAD | Mixed-version note |
| :------- | :-------- | :--- | :----------------- |
| `POST /_do/commands` | Always applies body and returns `202` empty | May return `413 command exceeds sheet limits` when `#appendCommand` rejects (`room.ts:699-703`); also broadcasts `execute` to WS peers after HTTP success (`room.ts:707-714`) | Old DO + new Worker: Worker sees 202 (no new ceiling). New DO + old Worker: old Worker ignored DO status and always echoed HTTP 202 — oversized writes can still be rejected inside the new DO while the old front door lies. New+new: truthful 413 (Phase 2 product behaviour). |
| `DELETE /_do/all` | Wipes storage; no uid argument | Accepts optional `X-EC-Uid`; may preserve private access tombstone (`room.ts:752-757`, `772-775`) | Irrelevant under Phase 2 (`AUTH=0` ⇒ no private rooms created). |
| `POST /_do/rename` / `POST /_do/clone` | `to` is non-empty string; rename target id on `149ebcf` used `idFromName(to)` **without** `encodeRoom` | `to` must pass `isValidRoomName`; both refuse `meta:access === 'private'` with `409` (`room.ts:956-965`, `1005-1018`); rename target uses `idFromName(encodeRoom(to))` (`room.ts:976-977`) | Install/clone **body** contracts unchanged. Private `409` is Phase-3-relevant only. `encodeURI` leaves `.` unchanged (`lib/room-name.ts:63-70`), so multi-sheet names like `room.1` / `room.1.bak` are **not** affected; only names `encodeURI` actually rewrites (spaces, non-ASCII, etc.) could expose a target-id mismatch if such a rename ever ran mixed-version. |
| `POST /_do/install` | `{ snapshot: string, log: string[], audit: string[] }` → fold + replace storage | Same JSON contract; preserves any pre-existing access trio when reinstalling (`room.ts:1252-1290`) | DO→DO payload compatible both directions. |
| `GET /_do/snapshot` (DO→DO hydration) | Full `res.text()` | `readBoundedResponseText` cap 2 MiB (`room.ts:2200`, `cross-sheet.ts:41`) | Oversize sibling save skipped ⇒ `#NAME?` on the new caller only; old caller still buffers full body. |
| Gate on almost all `/_do/*` | No ACL gate | `#isAuthorized` unless path is gate-exempt (`room.ts:340-350`); public rooms (`access == null \| 'public'`) still allow all (`lib/authorize.ts:20`) | Under Phase 2 no room is private, so the new gate is a no-op for production data. |

**Unchanged cross-room contracts (safe both directions on public rooms):** `GET/PUT /_do/snapshot`, `POST /_do/commands` success `202` empty body, `POST /_do/install` JSON, `POST /_do/clone`/`rename` public-room happy path for ASCII names, `GET /_do/sheet-data`, `GET /_do/csv.json`, export suite, `DELETE /_do/all` public wipe, `POST /_do/fire-trigger`.

##### Per-path mixed-version verdict (Phase 2 = `main` @ N% with `ETHERCALC_AUTH="0"`, remainder = Phase 1 bundle)

| Path | A=`main`, B=`149ebcf` | A=`149ebcf`, B=`main` | Verdict |
| :--- | :-------------------- | :-------------------- | :------ |
| Cross-sheet hydration (DO→DO snapshot) | New A reads old B snapshot; protocol identical; bounds only on A | Old A reads new B snapshot; protocol identical | **SAFE** — failure mode is still `#NAME?` |
| WS `submitform` → `_formdata` | Commands text to old/new sibling; both accept `POST /_do/commands` | Same | **SAFE** (errors already best-effort) |
| DELETE → `_formdata` wipe | Old/new sibling both implement `DELETE /_do/all` | Same | **SAFE** |
| Cascade rename (`/_do/rename` → `/_do/install`) | Install body unchanged; public rooms only in Phase 2 | Same | **SAFE** for public multi-sheet cascade (ASCII/`encodeURI`-stable names) |
| Template clone | `PUT /_do/snapshot` unchanged | Same | **SAFE** |
| Legacy sid-host execute forward | `/_do/commands` exists both sides | Same | **SAFE** (best-effort) |
| Worker multi-export / child `sheet-data` | Endpoints exist on `149ebcf` | Same | **SAFE** |
| Worker `GET /_do/workbook-kind` | Old B returns **501** → `getWorkbookKind` returns `"unknown"` (`assets.ts:143,151`) | Old Worker never calls this endpoint | **DEGRADED (niche entry UX only).** Called only when `ETHERCALC_DEFAULT_ROOM` is set (`assets.ts:172-180`); ethercalc.net production root without that var never hits it. `"unknown"` makes `multi = false` (`assets.ts:180`), so `/` redirects to `/${room}` (single-sheet client) instead of `/=${room}`. No data path; wrong client shell at worst. Sandstorm `sheet1` fallback also skips because it keys only on `kind === "absent"` (`assets.ts:185`). |
| Worker `GET /_do/access` | Old B returns **501** → `access = null` | Old Worker never calls `/_do/access` | **SAFE — not a security hazard.** (1) HTML/`edit` probes only omit redirect *hints* when `access` is null; they do not grant content. RoomDO still enforces ACL on `/_do/snapshot` and commands. (2) DELETE treats null as **403** (fail-closed). (3) Structurally, a Phase 1 DO cannot host `meta:access=private` at all (no `/_do/init-private`), so a 501 from this probe implies a public room by construction. Worst case is cosmetic: a private room that *did* land on a `main` DO might not get the edit/view redirect polish if some other probe failed — still not declassification. |
| Worker `POST /_do/init-private` | New Worker hits old B → **501** returned **verbatim** to the client (`rooms.ts:232-234`, `692-694`) | Old Worker has no caller | **BROKEN if invoked against a Phase 1 DO** (user-visible create/copy failure). **Dormant in Phase 2** because `ETHERCALC_AUTH="0"` makes `getSessionPrincipal` null and both private routes return `401` before `doFetch` (`rooms.ts:201-202`, `673-675`; executive summary item 3). |
| Worker `POST /_do/commands` sheet limits | New Worker + old DO: old DO accepts oversize (no 413) | Old Worker + new DO: DO may 413/drop while old Worker still HTTP 202 | **DEGRADED** — enforcement and client-visible 413 only when **both** front door and target room are on `main`. Matches the already-documented product ceiling (§4.6 rows 3–5); ramp merely delays uniform enforcement. |

##### Overall verdict

**DEGRADED (not BROKEN) for the Phase 2 production ramp on public rooms.** Phase 2→Phase 3 ordering is a **correctness requirement**, not only soak/rollback discipline:

1. Every **DO→DO** payload used in production public flows (`/_do/snapshot`, `/_do/commands`, `/_do/install`, `/_do/all`) is forwards- and backwards-compatible between `149ebcf` and `main`.
2. `GET /_do/access` **501** during a split is **not** a security hazard: callers either skip UX redirects only (`assets.ts:351-378`, `stateless.ts:86-96`) or fail closed (`rooms.ts:642-650`), and RoomDO remains the sole authz boundary. A Phase 1 DO also cannot be private (no `init-private`), so the 501 case is public-by-construction.
3. `GET /_do/workbook-kind` **501** soft-falls to `"unknown"` and, only on hosts with `ETHERCALC_DEFAULT_ROOM`, may open the single-sheet client for a multi TOC — entry UX only (`assets.ts:143,180`).
4. `POST /_do/init-private` is **not** soft-fallback: a `main` Worker that reached a still-Phase-1 target DO would surface **501** to the user (`rooms.ts:232-234`, `692-694`). Phase 2 keeps those routes unreachable (`401` before dispatch under `AUTH=0`). Enabling `ETHERCALC_AUTH="1"` while any room fraction remains on Phase 1 makes private-room **create/copy BROKEN** for ids pinned to the old version. That is an independent correctness reason to hold Phase 3 until Phase 2 is at 100%, stacked on the original rollback-safety reason (no private rooms during the major-code soak).
5. Remaining user-visible asymmetry during a pure Phase 2 ramp is limited to **sheet-limit enforcement** (and the niche default-room workbook classifier), not to cross-sheet reads, formdata siblings, multi-sheet cascade rename, exports, or authorization.

**Operational mitigation:**

- **Mandatory (correctness + rollback):** Do **not** start Phase 3 (`ETHERCALC_AUTH="1"`) until Phase 2 is at **100%** and soaked. Two independent justifications: (a) rollback safety — no private rooms while major code soaks (Appendix A.1.3 / old §4.3); (b) mixed-version correctness — `POST /_do/init-private` against a Phase 1 DO returns **501** verbatim, so private create/copy is user-visibly broken for any room still pinned old (old §4.3.1). A future maintainer MUST NOT relax the 100% gate on either ground alone. This is old §9 item 9 (Appendix A.3).
- **Optional (not a Go/No-Go blocker for Phase 2 itself):** After the Phase 2 version-override smoke (`Cloudflare-Workers-Version-Overrides` whoami probe in Appendix A.1.3 / old §4.3) passes, prefer a **short** 10% observation window and then advance 10% → 50% → 100% without multi-hour soaks at partial percentages — or jump 10% → 100% if multi-sheet / large-paste traffic is active and uniform 413 signalling matters more than blast-radius staging. Partial percentages remain acceptable for public-room data integrity: they do not corrupt cross-room state under `AUTH=0`.


---

### A.1.4 Old §4.4 — Phase 3: Enable Passkeys (`ETHERCALC_AUTH = "1"`) — **SUPERSEDED PENDING RE-BASELINE**
> **SUPERSEDED PENDING RE-BASELINE.** Passkeys are already enabled in production (`GET /_auth/whoami` → `enabled:true`). Phase 3 as a green-field “turn auth on” step does not apply; any future cutover must treat auth-on as the **steady state** to preserve, not a post-soak flip.

After Phase 2 has soaked and verified stable in production, Phase 3 enables passkey authentication by flipping `ETHERCALC_AUTH = "1"` in `packages/worker/wrangler.toml`:

##### Option A (Preferred / Production Path): GitHub Actions CI Workflow

1. Flip `ETHERCALC_AUTH = "1"` in `packages/worker/wrangler.toml` `[vars]`.
2. Commit and push to `main`.
3. Run **GitHub Actions → Deploy Production → Run workflow**.

##### Option B (Secondary / Emergency Local CLI Fallback Path)

```bash
# 1. Set ETHERCALC_AUTH = "1" in wrangler.toml [vars]
# 2. Deploy Phase 3 to 100% traffic using explicit --config to bypass local redirect
cd packages/worker
npx wrangler deploy --config=wrangler.toml --env=""
cd ..
# Capture returned PHASE3_VERSION_ID → Cutover log (start of §4)
```
**ROLLBACK TARGET FOR PHASE 3**: Phase 3 can be rolled back to Phase 2 via `npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""`. The private-room Point of No Return lives HERE in Phase 3, after all major code changes have already soaked cleanly in Phase 2. Record `PHASE3_VERSION_ID` in the Cutover log (start of §4) before soak continues — required for clean re-enable after a lockout rollback (old §6.2).

---


### A.2 Old §6.1–§6.3 — Phase-graph rollback model

> **SUPERSEDED PENDING RE-BASELINE (2026-08-10).** Rollback semantics below assume Phase 2 runs with `AUTH=0` and zero private-room population, and that Phase 1 is the first `v2`/`AuthDO` deploy from `149ebcf`. Neither matches live production. Platform facts (no pre-v2 rollback once `v2` is active; D1 restore ≠ DO restore in §6.4) remain useful; the phase graph and “lockout only after Phase 3” story do **not**. **Do not execute rollbacks that set `ETHERCALC_AUTH="0"` against production private rooms.** See top-of-doc STOP banner.

### A.2.1 Old §6.1 — Rollback Semantics per Deployment Phase

1. **Rollback During Phase 2 (Main Code & Assets Rollout)**:
   - **100% SAFE & FULLY SUPPORTED**. Roll back Phase 2 to Phase 1 using:
     ```bash
     cd packages/worker
     npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""
     cd ..
     ```
   - **Zero Data Exposure Hazard**: Because `ETHERCALC_AUTH = "0"` was set during Phase 2, no user could register a passkey or create a private room. Rolling Phase 2 back to Phase 1 carries **zero risk** of private room data exposure.
   - **Snapshot / SocialCalc compatibility on Phase 2→1**: Phase 1 already runs SocialCalc **3.1.0** (same bundled runtime as Phase 2 / `main`; upgrade landed in `303d348`, ancestor of `149ebcf`). Rooms re-saved during the Phase 2 soak therefore rehydrate on Phase 1 without a 3.1.0→3.0.8 engine downgrade. Bidirectional save-string proof (legacy oracle → 3.1.0, and 3.1.0-written → genuine 3.0.8) is in `docs/migration/DELTA_AUDIT.md` item **j** and `packages/socialcalc-headless/test/legacy-snapshot-{compat,reverse*}.test.ts`.
2. **Rollback During Phase 3 (Passkey Enablement)**:
   - Roll back Phase 3 to Phase 2 using `npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""`.
3. **Rollback Past Phase 1 (Pre-v2 Commit `149ebcf...`)**:
   - **BLOCKED BY CLOUDFLARE PLATFORM**. Platform rules reject rollbacks to pre-v2 versions. Recovery from Phase 2 or Phase 3 to pre-passkey code is executed by redeploying the Phase 1 version (`npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`). The Phase 1 `release/phase1-lifecycle` bundle **is** the forward-fix artifact (`149ebcf` code with `AuthDO` class & `v2` migration retained); no separate forward-fix bundle needs to be built. If Phase 1 itself ever requires a code fix in production, the operator branches from `release/phase1-lifecycle` and forward-fixes from there.

### A.2.2 Old §6.2 — Rollback Hazards: Lockout vs. Exposure

#### 1. Phase 3 → Phase 2 Rollback Hazard: Temporary Private Room LOCKOUT (Not Exposure)

When Phase 3 is rolled back to Phase 2 (`ETHERCALC_AUTH="0"`):

- `packages/worker/src/lib/authorize.ts:20-28` is present in Phase 2 code:
  ```ts
  if (access == null || access === "public") return true;
  if (access !== "private") return false;
  if (!principal || typeof principal.uid !== "string" || principal.uid.length === 0) {
    return false;
  }
  ```
- Because `ETHERCALC_AUTH="0"`, `verifyAuthSession` (`packages/worker/src/lib/auth-session.ts:16`) returns `null`, so `getSessionPrincipal` yields `null`.
- For any private room (`access === 'private'`), `authorize()` sees `principal == null` and returns `false`.
- **Consequence**: Rolling Phase 3 back to Phase 2 causes a temporary **LOCKOUT** of private rooms (returning `403 Forbidden` to everyone, including room owners). Private sheet content remains **100% intact and unexposed** in DO storage.
- **Operator Response**: Recovery is forward and immediate by re-enabling `ETHERCALC_AUTH="1"` / re-deploying Phase 3.

#### 2. Phase 1 / Forward-Fix Rollback Hazard: Private Room EXPOSURE

Private room data exposure occurs **ONLY if code is rolled back past Phase 2 to Phase 1 or the Forward-Fix Bundle**, whose code is `149ebcf`-based and has no `authorize.ts` module at all:

- In `149ebcf` code, `meta:access` in DO storage is ignored, causing private rooms to be served publicly to anonymous requests.
- **Operator WAF Mitigation**: If the system must be rolled back to Phase 1 / Forward-Fix bundle while private rooms exist, the operator MUST deploy Cloudflare Zone WAF rules expressed in edge-evaluable URL predicates:
  - Block requests matching path `/private` or `/_from/*/private`
  - Block specific enumerated room URIs (e.g. `/_/private-room-id` or `/_ws/private-room-id`)
  - Or block all room API paths `/_/*` wholesale until data isolation is verified.


##### Decision card — Private-data rollback (Phase 3 live; private rooms/passkeys may exist)

**Pointers:** hazards → Appendix A.2.2 (old §6.2) items 1–2; room ID → **§2.4**. Idle private rooms + passkey users are **non-enumerable** — no complete affected-user list.

**Path A (prefer): Phase 3 → Phase 2 — lockout, not exposure**

1. Owner authorizes temporary private lockout.
2. **Comms first/with step 3:** private rooms temporarily unavailable (owners included); content intact, not exposed; public unaffected; restore when auth on + §5 Probe 11 passes.
3. `cd packages/worker && npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env="" && cd ..` — ID from Cutover log (start of §4) / §0.2.
4. **Verify:** Probe 2 `enabled:false`; Probe 3 `401` on `POST /_/private`; Probe 11 not enabled; known private `403`; public Probe 5 OK.
5. Stay on Phase 2 unless Path B is required.

**Re-enable:** `npx wrangler versions deploy <PHASE3_VERSION_ID>@100% --env=""` (Appendix A.1.4 / old §4.4 if missing) → Probe 11 `enabled:true`; owner read OK; Probes 1/5/7 green. Passkeys/`session-secret` persist in AuthDO; cookies valid until expiry/logout. **`[OPERATOR-VERIFY]`** staging: register → 3→2→3 → same credential.

**Path B (last resort): Phase 1 / forward-fix — exposure**

**Order:** **WAF install+verify BEFORE Phase 1 traffic** (reverse = exposure). Then `npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`. Re-check WAF.

**Fail-closed WAF** ([Custom rules](https://developers.cloudflare.com/waf/custom-rules/create-dashboard/) → Block). Deny **all** traffic on both hosts — path allowlists cannot cover idle privates; public outage is accepted.

```txt
http.host eq "ethercalc.net" or http.host eq "www.ethercalc.net"
```

Optional predeclared operator IP only: append `and not ip.src eq x.x.x.x`. Action Block (403). **No path exceptions in the default.**

**Verify BEFORE Phase 1** (non-exempt client → WAF 403 each): `/_/some-room`, `/_ws/some-room`, `/some-room`, `/some-room.xlsx`. Drop WAF only after Phase 2/3 recovery + private checks.

**Comms (B):** private down; containment is WAF not ACL; public also down; restore forward, then remove WAF.


### A.2.3 Old §6.3 — Points of No Return Definition

- **PRIMARY POINT OF NO RETURN**:

  > **The moment Cloudflare reports the Phase 1 deployment successful with migration `v2` active in `wrangler deployments list`.**
  - Past this point, Cloudflare platform rules permanently prevent reverting to pre-v2 code (`149ebcf...`). Recovery can only occur forward via Phase 1 or a Forward-Fix Bundle.

- **SECONDARY POINT OF NO RETURN**:
  > **The moment `ETHERCALC_AUTH = "1"` is activated in Phase 3 and the first user creates a private room (`POST /_/private`) OR completes a passkey registration (`POST /_auth/register-complete`).**
  - Past this point, rolling Phase 3 back to Phase 2 causes private room owner lockout (resolved immediately by re-enabling Phase 3), while rolling back to Phase 1 / Forward-Fix bundle causes world-readability unless WAF URL rules block affected room paths.


### A.3 Old §9 — Three-phase Go/No-Go checklist

> **SUPERSEDED PENDING RE-BASELINE (2026-08-10).** Items that gate or assume the three-phase `149ebcf` → Phase1 → Phase2(`AUTH=0`) → Phase3 sequence are void. **Item 1 is now the single highest-priority action**, with emphasis on `wrangler deployments list` / `versions list` to pin the real production SHA before any cutover redesign. Item 9’s `AUTH=0` soak justification is actively dangerous if applied to current production. See top-of-doc STOP banner.

This checklist has nine conditions and spans the full cutover. Before executing Phase 1 (`npx wrangler deploy --env=""`), items 1–7 MUST be satisfied; items 5 and 6 are already complete and therefore intentionally checked below. Item 8 gates the Phase 2 upload, and item 9 gates Phase 3.
### A.3.1 Old §9.1 — Manual-Attention Calibration

The audit unit is one `[OPERATOR-VERIFY]` site, numbered §3.2 check, §5 probe
(`10a` and `10b` counted separately), actionable §7 check, or §9 condition:
**47 checks total — 5 ALREADY AUTOMATED, 28 PARTIALLY AUTOMATED, and 14
GENUINELY MANUAL**. Thus **33/47 are automation-backed**, but 28 of those still
add a distinct live-artifact, live-binding, edge, or deployment assertion.
`ALREADY AUTOMATED` items may be skimmed after their named gate is green;
`PARTIALLY AUTOMATED` items must retain the stated live delta; the remaining
14 demand credentials, backups, operational judgment, soak observation, or the
self-host `uniqueKey` volume check (§7.2.1).


- [ ] **1. Baseline Capture, Subsystem & Capacity Verification**: `wrangler deployments list`, `wrangler versions list`, and `wrangler d1 info ethercalc_rooms --json` executed and recorded. Confirm (a) D1 Time Travel availability via `version: "production"` when visible, or via successful `wrangler d1 time-travel info` if the pinned Wrangler omits `version` from `d1 info` output (§0.2.1), and (b) `database_size` headroom against the hard 10 GB ceiling per §0.2.2 pass criteria (&lt; 5 GiB pass; 5–&lt;8 GiB conditional sign-off; ≥ 8 GiB or missing = NO-GO).
- [ ] **2. Preflight Gates Green Against Final Tree (9/9 Runnable Gates Verified; 2 Docker Smokes Pending CI)**: All 9 locally-runnable preflight gates (`vp run typecheck`, `vp lint`, `vp run test`, worker `test:node` & `test:workers`, worker 100% coverage gate `test:coverage`, `build:assets` + `e2e#test`, `build:dry`, `check-helm-hardening.sh`, and `ratchet-verify.sh`) passed 100% green against the final tree state including the `rooms.ts` command-rejection status propagation fix (§1.2, `docs/migration/PREFLIGHT_RESULTS.md`). The 2 Docker smoke gates (`./scripts/smoke-selfhost.sh`, `./scripts/smoke-proxy.sh`) remain unverified locally due to missing local `docker compose` CLI subcommand and require CI execution before final cutover.
  > **ALREADY AUTOMATED — inspect gate status rather than re-performing its assertions.** The root/worker/client gates run the named test and coverage commands; CI `test`, `e2e`, and `helm-lint` execute their corresponding suites, while CI `build:selfhost` runs both Docker smokes (`.github/workflows/ci.yml:17-235`). Once those required jobs are green on the final tree, repeating the same local assertions adds no deployment evidence.
- [ ] **3. Secrets Provisioned in Production**: `wrangler secret list` confirms `ETHERCALC_KEY` and `ETHERCALC_MIGRATE_TOKEN` are active in Cloudflare Secrets (§0.1).
- [ ] **4. D1 Database Export & Time Travel Bookmark Recorded**: `npx wrangler d1 export ethercalc_rooms --remote --output=...` executed (required `--output` flag), account plan confirmed (30d Paid / 7d Free retention), and Time Travel bookmark timestamp captured (§2.1, §2.1.1, live §6). **Budget real wall-clock and disk** from the live `database_size` — multi-GB exports are neither instant nor small; **`[OPERATOR-VERIFY]`** actual duration. If the `.sql` artifact may exceed the **5 GB** `d1 execute --file` import ceiling, confirm Time Travel is the whole-DB restore path before relying on the dump for rollback.
- [x] **5. Phase 1 Branch (Forward-Fix Artifact) Prepared**: `release/phase1-lifecycle` branch built, typechecks, and dry-runs cleanly (Appendix A.1.2 / A.2.1 (old §4.2/old §6.1), and §8 item 1; verified via `vp run @ethercalc/worker#typecheck` and `vp run @ethercalc/worker#build:dry`).
  > **ALREADY AUTOMATED — this preparation condition adds no live check.** The named worker `typecheck` and Wrangler `build:dry` gates compile and bundle the Phase 1 tree; their recorded green outputs are the condition itself. Deployment and soak are intentionally separate items 8 and 9.
- [x] **6. PR 4 Command-Rejection Propagation Landed and Verified for Phase 2**: `POST /_/:room` returns the RoomDO status and body for every non-2xx verdict, matching `PUT /_/:room` at `packages/worker/src/routes/rooms.ts:355-369`. Verified via route contract tests `POST /_/:room command mutations propagate a DO 413 sheet-limit verdict` and `POST /_/:room returns 202 command echo on successful DO dispatch` in `packages/worker/test/routes-rooms.node.test.ts` (53 node files / 1526 tests; 13 workers-pool files / 197 tests; §8 item 5; §10 item 3).
  > **ALREADY AUTOMATED — skim after the worker coverage gate.** `routes-rooms.node.test.ts:810-838` asserts exact 413 propagation plus the 202 success path under worker `test:coverage` (CI `test`), while `room.node.test.ts:1110-1122` asserts RoomDO rejection and no write. This checklist line contains no additional live assertion.
- [ ] **7. Staging Rehearsal Passed**: Phase 1, Phase 2, and Phase 3 deployed and verified on `https://ethercalc-staging.audreyt.workers.dev` (old §§3.1–3.2 → **Appendix A.0**). **Live cutover uses §3 single-ramp staging rehearsal instead — do not treat this item as a live gate.**
  > **PARTIALLY AUTOMATED** — Every old §3.2 / **Appendix A.0.2** behavior has a named local guard, and root test `nightly staging validation bypasses the generated production config` pins the nightly dry-run command. Only the three-phase rehearsal proved all three deployed artifacts, staging bindings/RP, existing DO state, and edge behavior together. **Live gate is §3**, not this item.
- [ ] **8. Phase 1 Deployed & Soaked Before Phase 2 Upload**: Phase 1 (`npx wrangler deploy`) executed and verified stable before uploading the Phase 2 gradual release (Appendix A.1.2–A.1.3 (old §4.2–§4.3)).
- [ ] **9. Phase 2 at 100% before Phase 3 (`ETHERCALC_AUTH="1"`) — correctness + rollback**: Phase 2 MUST reach **100%** (no residual Phase 1 room pin) and soak before enabling passkeys (Appendix A.1.3–A.1.4 (old §4.3/§4.4)). **Two independent justifications — do not relax on either alone:** (a) **rollback safety** (original): `AUTH=0` ensures no private rooms exist while major code soaks, so Phase 2→Phase 1 rollback stays hazard-free; (b) **mixed-version correctness** (old §4.3.1 / Appendix A.1.3.1): `POST /_do/init-private` is absent on Phase 1 DOs and returns **501** verbatim to create/copy callers (`rooms.ts:232-234`, `692-694`), so enabling auth while any room is still Phase 1-pinned makes private create/copy user-visibly broken for those ids. (`GET /_do/access` 501 is **not** an authz hole — UX redirect hints only; RoomDO remains the sole boundary; DELETE is fail-closed.)

---

