# Operator Runbook: Production Upgrade Plan (`0.20260717.0` → `main`)

## Companion documents

This runbook is the entry point. The other four files in this directory are supporting evidence — read them when the runbook points you there, or when you need the underlying audit:

- **`DELTA_AUDIT.md`** — prod→`main` delta with per-item classification and irreversibility analysis. Read before approving the cutover shape.
- **`SKEW_AND_RECONNECT.md`** — what breaks for a browser tab already open across the cutover. Read when planning operator comms or soak checks.
- **`PREFLIGHT_RESULTS.md`** — recorded results of this runbook's §1 gates against the final tree. Read to confirm preflight already passed (or what failed).
- **`INVENTORY.md`** — verbatim mechanical inventory of wrangler config, workflows, D1 migrations, and self-host env. Read when a command or binding needs a ground-truth dump.

**Target Service:** `ethercalc.net` (Cloudflare Workers + Hono + Durable Objects + D1 + Assets)  
**Baseline Release:** Git Tag `0.20260717.0` (Commit `149ebcf16104b01254ca2b796beb701c88bd6ff8`)  
**Target Release:** Current `main`  
**Document Purpose:** Complete operator runbook to execute a zero-data-loss, three-phase production migration and verify post-upgrade stability under Cloudflare Workers platform constraints.

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
   - **Conclusion**: Setting `ETHERCALC_AUTH = "0"` in Phase 2 **structurally guarantees** that no private room or passkey can be created while major code changes soak, eliminating the private-room rollback hazard entirely.

4. **Integration Proof for Legacy Oversized Sheets (`packages/worker/test/room.test.ts:356-395`)**:
   - Legacy sheets exceeding `MAX_SHEET_CELLS = 200_000` (e.g. 500×500 = 250,000 cells) load and serve fine (HTTP 200).
   - The `#postSeed` migration path imports snapshots without bounding-box checks.
   - Non-growing edits to existing cells within current declared area succeed (`202`).
   - RoomDO rejects edits expanding declared area beyond existing bounds with HTTP 413, and native WebSocket writes close with 1008.
   - **Phase 2 prerequisite**: PR 4 (§8 item 5 / §9 item 6) has restored HTTP rejection signaling on `POST /_/:room`, surfacing RoomDO 413 status and body for over-limit writes prior to cutover.

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

# 3. Check production D1 database status, schema state, and storage subsystem version (INSPECT `version` FIELD)
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
   The output `version` field MUST be `"production"`. Per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/) and [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/):
   > *"Databases with `version: production` support the new Time Travel API. Databases with `version: alpha` only support the older, snapshot-based backup API."*
   > *"To understand which storage subsystem your database uses, run `wrangler d1 info YOUR_DATABASE` and inspect the `version` field."*

2. **Wrangler Version Compatibility**:
   Cloudflare D1 Time Travel requires Wrangler CLI version `>= v3.4.0` (per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/)). In this repository, root `package.json` pins `"wrangler": "^4.112.0"`, satisfying the CLI version requirement.

3. **Decision Branch (`version: "alpha"`) & Degraded Rollback State**:
   If `wrangler d1 info ethercalc_rooms` returns `version: "alpha"`:
   - **Time Travel is completely unavailable**: Time Travel commands (`wrangler d1 time-travel info`, `wrangler d1 time-travel restore`) will fail or operate under legacy snapshot behavior.
   - **Rollback floor collapses**: Section §2's rollback floor collapses strictly to the manual `d1 export` SQL dump (`npx wrangler d1 export ethercalc_rooms --remote --output=...`), materially weakening rollback protection by eliminating continuous point-in-time recovery (PITR).

4. **Operator Go/No-Go Judgment on `version: "alpha"` Blocker Status**:
   - **Operator Judgment**: `version: "alpha"` **SHOULD block the cutover outright** if continuous D1 point-in-time recovery (PITR) or automated Time Travel restoration is required by the production operational SLA or change management policy.
   - **Justification**: D1 `ethercalc_rooms` stores the room index (`rooms` table mirroring room names, updated_at timestamps, and cors_public flags per `packages/worker/migrations/0001_rooms.sql:17-21` and `packages/worker/src/lib/rooms-index.ts:46-49`) plus bounded per-room audit and chat log tails (`audit_log` and `chat_log` tables per `packages/worker/migrations/0003_audit_chat.sql:22-38` and `packages/worker/src/lib/seq-store.ts:39-41`). Authoritative sheet content, cell values, SocialCalc command logs, and snapshots are stored solely inside Durable Objects (`RoomDO`). If D1 schema migration (`packages/worker/migrations/0001_rooms.sql`) or database state corruption occurs during cutover, `version: "alpha"` leaves the operator with zero automated PITR options — reverting D1 requires manually dropping/recreating tables and importing a static SQL dump, which risks losing any room index or log updates created between the export time and cutover failure. If the operator or team explicitly chooses to proceed under `version: "alpha"` anyway (e.g., because primary cell state lives in `RoomDO` Durable Objects and D1 is a mirror index/log store), this MUST be logged as a formal GO/NO-GO risk acceptance: the operator explicitly acknowledges that §2/§6 Time Travel rollback capabilities are disabled and that D1 recovery relies solely on `d1 export`.

### 0.3 Baseline Decision Table `[OPERATOR-VERIFY]`

| Observed Baseline State             | Variance from `149ebcf16104b01254ca2b796beb701c88bd6ff8`                   | Required Action                                                                                                                                                    |
| :---------------------------------- | :------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exact Match** (`149ebcf...`)      | Deployed version corresponds to tag `0.20260717.0` (commit `149ebcf...`).  | Proceed directly with this upgrade runbook.                                                                                                                        |
| **Older Version** (< `149ebcf...`)  | Production is behind `0.20260717.0`.                                       | Pause upgrade. Run git diff between deployed version and `149ebcf...` to audit any missing intermediate state before deploying `main`.                             |
| **Newer Version** (> `149ebcf...`)  | Production is already ahead of `0.20260717.0`.                             | Run `git log 149ebcf..HEAD` to determine exactly which commits are deployed. Check if DO migration `v2` (`AuthDO`) is already present in `wrangler versions list`. |
| **`v2` Migration Already Deployed** | `AuthDO` migration `v2` is shown as active in `wrangler deployments list`. | Skip Phase 1 (Phase 1 lifecycle deploy has already occurred). Proceed to Phase 2.                                                                                  |
| **D1 Subsystem `version: "alpha"`** | Database uses legacy `alpha` storage subsystem; Time Travel API unsupported. | GO/NO-GO BLOCKER if continuous PITR is required by SLA. If proceeding by explicit sign-off, operator MUST NOT rely on Time Travel and MUST execute manual `d1 export` SQL backups only (§0.2.1, §2.1). |
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
# Expected output: 100% coverage across Statements, Branches, Functions, and Lines in @ethercalc/worker, and 100% pass across all 8 gated packages.
# Critical Note: Plain `vp run @ethercalc/worker#test:node` and `vp run --filter './packages/*' test` do NOT pass `--coverage` or enforce vitest threshold configs (`thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 }`). An operator running only `test` or `test:node` skips this mandatory CI gate — plain `test:node` verifies correctness but does NOT enforce coverage. Gated packages with 100% coverage enforcement in their vitest configs are `@ethercalc/worker`, `@ethercalc/cli`, `@ethercalc/client`, `@ethercalc/client-multi`, `@ethercalc/migrate`, `@ethercalc/oracle-harness`, `@ethercalc/shared`, and `@ethercalc/socketio-shim`.

# 5. Run Worker unit & integration test suites (packages/worker/package.json)
vp run @ethercalc/worker#test:node
vp run @ethercalc/worker#test:workers
# Expected output: 52 node test files (1520 tests) pass in vitest.node environment; 13 workers-pool integration test files (196 tests) pass in vitest-pool-workers environment.

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

Prior to cutover, record explicit backups for every durable store and acknowledge the physical limitations of Cloudflare Workers backup APIs.

### 2.1 Durable Store Backup Matrix

| Store                                     | Capture Command / Procedure                                                                                                                                                                                                                                                                                                                                                                                           | Backup Artifact Location                                                                    | Recovery Limitation / Reality                                                                                                                      |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1 Database** (`ethercalc_rooms`)       | `npx wrangler d1 export ethercalc_rooms --remote --output=./backup_ethercalc_rooms_$(date +%Y%m%d_%H%M%S).sql`<br><br>Also verify D1 subsystem `version: "production"` (§0.2.1) and record current Time Travel bookmark:<br>`npx wrangler d1 time-travel info ethercalc_rooms` | Local SQL file `./backup_ethercalc_rooms_*.sql` and Cloudflare D1 Time Travel snapshot log. | Fully exportable and restorable via D1 SQL import or D1 Time Travel restore.<br><br>**Command Syntax**: `--output` flag is **REQUIRED** for `wrangler d1 export` (per [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/#export)).<br><br>**Retention Caveat**: D1 Time Travel retention is plan-dependent per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/).<br><br>**Sensitive Material Handling**: Exported `.sql` files contain unfiltered audit commands (SocialCalc code) and user chat messages from both public and private rooms (see §2.2) and MUST be handled as sensitive, access-restricted material. |
| **Durable Objects** (`RoomDO` / `AuthDO`) | **NO BULK EXPORT API EXISTS** in Cloudflare Workers for Durable Object SQLite storage.<br><br>**D1 Mirror Scope & Reality**: D1 `ethercalc_rooms` holds the public cross-room index (`room`, `updated_at`, `cors_public` per `packages/worker/migrations/0001_rooms.sql:17-21` and `packages/worker/src/lib/rooms-index.ts:46-49`) plus bounded per-room audit and chat log tails for **all** rooms (including private rooms; `audit_log` and `chat_log` per `packages/worker/migrations/0003_audit_chat.sql:22-38` and `packages/worker/src/lib/seq-store.ts:39-41`). **NO authoritative SocialCalc sheet snapshots, cell state, or full command logs are stored in D1.**<br><br>**Available Safeguards:**<br>1. Per-room PITR snapshot restoration via operator endpoint `POST /_/:room/pitr-restore` (`API.md:133-197`).<br>2. Active private room discovery via `SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log` (§2.4). |
| **Static Assets**                         | Built from source code via `scripts/build-assets.ts`.                                                                                                                                                                                                                                                                                                                                                                 | Source repository commits (`assets/` directory built during deploy).                        | 100% reproducible; re-deploys instantly from git source.                                                                                           |
| **Secrets & Environment Variables**       | Verified via `npx wrangler secret list --config=packages/worker/wrangler.toml --env=""`.                                                                                                                                                                                                                                                                                                                              | Cloudflare Workers Secret Manager.                                                          | Secret values CANNOT be retrieved/read back via CLI. Precondition checks in §0.1 ensure secrets are set prior to cutover.                          |

### 2.2 Rollback Floor Definition & DO Content Non-Exportability

Because Cloudflare Workers provides no operator-side bulk export API for Durable Object SQLite storage, the operator MUST understand what each backup artifact covers:

1. **What `wrangler d1 export` Backs Up**:
   - Backs up the `rooms` index table (`room`, `updated_at`, `cors_public`), `audit_log`, `chat_log`, and `cron_triggers` tables across all rooms (including private rooms, since `#mirrorAudit` and `#mirrorChat` in `packages/worker/src/room.ts:2303-2309` do not filter on `access === 'private'`).
   - Allows restoring the list of public room names, last-modified timestamps, bounded audit/chat log tails, and enumerating active private rooms (`SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log`).
   - **DOES NOT** back up or restore sheet cell data, authoritative SocialCalc command logs, or sheet snapshots. A D1 export cannot reconstruct RoomDO cell state.
   - **Sensitive Material Handling**: Because `audit_log` and `chat_log` contain raw SocialCalc commands and chat messages from private rooms without write-time access filtering, `wrangler d1 export` SQL dumps contain private room data. Backup `.sql` artifacts MUST be handled as sensitive, access-restricted material.

2. **What Cloudflare D1 Time Travel Restores**:
   - Restores D1 tables (`rooms`, `audit_log`, `chat_log`, `cron_triggers`) to a prior point-in-time (§6.4).
   - **DOES NOT** roll back or restore Durable Object SQLite storage (`RoomDO` / `AuthDO`).

3. **Implications for Cutover Strategy & Phase Ordering**:
   - Because DO sheet content cannot be bulk-exported, **preventing data corruption during cutover is paramount**.
   - This non-exportability strongly reinforces the mandatory **Three-Phase Upgrade Strategy** (§4):
     - **Phase 1** applies the `v2` migration (`AuthDO` class addition) in a behaviorally inert bundle (`149ebcf` code).
     - **Phase 2** deploys `main` with `ETHERCALC_AUTH = "0"`. Setting `ETHERCALC_AUTH = "0"` **structurally guarantees** that no passkey registration or private room creation can occur while major code changes soak. If Phase 2 encounters bugs, rolling Phase 2 back to Phase 1 carries **zero risk** of private room data exposure or lockout.
     - **Phase 3** enables `ETHERCALC_AUTH = "1"` only after Phase 2 has soaked and proven stable.

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

### 2.4 Mass RoomDO Recovery Procedure

 D1 and Durable Object PITR supply complementary halves of broad recovery: the D1 `rooms` table supplies indexed public room names and their last-write times, while `audit_log` and `chat_log` provide enumeration of active private rooms. Per-room PITR restores the content of each corresponding `RoomDO`. `GET /_rooms` and `GET /_roomtimes` expose the public index, but direct D1 SQL queries are safer for an operator procedure because they return exact fields in captured results.
 
 1. **Freeze the recovery inputs.** Record the incident start and end in UTC and select one restore timestamp immediately before the first bad write. It MUST be within Cloudflare's 30-day Durable Object PITR window. Do not derive a different timestamp for each room unless the incident analysis explicitly requires it.
 2. **Capture the candidate list before restoring anything.** `updated_at` is a JavaScript millisecond epoch (`Date.now()`), so query with millisecond boundaries. Replace the example values with the incident window and save the complete output:
 
    ```bash
    # 2a. Public indexed rooms (with last update timestamps):
    npx wrangler d1 execute ethercalc_rooms \
      --remote \
      --config=packages/worker/wrangler.toml \
      --env="" \
      --command="SELECT room, updated_at FROM rooms WHERE updated_at BETWEEN 1786363200000 AND 1786366800000 ORDER BY updated_at ASC;"
 
    # 2b. Private active rooms (enumerated via unfiltered D1 audit and chat logs):
    npx wrangler d1 execute ethercalc_rooms \
      --remote \
      --config=packages/worker/wrangler.toml \
      --env="" \
      --command="SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log;"
    ```
 
    The equivalent HTTP sources for public rooms are `GET /_rooms` for names and `GET /_roomtimes` for timestamps. Prefer the D1 queries when filtering an incident window.
 3. **Dry-run every candidate sequentially.** For each D1 candidate room (from public `rooms` or private `audit_log`/`chat_log`), URL-encode the room as one path segment and resolve the common pre-incident timestamp without scheduling a restore:
 
    ```bash
    curl -sS --fail-with-body -w '\nHTTP %{http_code}\n' -X POST "https://ethercalc.net/_/<URL_ENCODED_ROOM>/pitr-restore" \
      -H "Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"at":"2026-08-10T11:59:59.000Z","dryRun":true}'
    ```
 
    Record the room, D1 `updated_at` (or `[private-log]`), requested timestamp, resolved `bookmark`, HTTP status, and response. Stop on any non-200 response; do not silently skip a room.
 4. **Apply and verify one room at a time.** Submit the dry-run bookmark, retain the returned `undoBookmark`, then verify the room's snapshot/content before advancing:
 
    ```bash
    curl -sS --fail-with-body -w '\nHTTP %{http_code}\n' -X POST "https://ethercalc.net/_/<URL_ENCODED_ROOM>/pitr-restore" \
      -H "Authorization: Bearer $ETHERCALC_MIGRATE_TOKEN" \
      -H "Content-Type: application/json" \
      --data '{"bookmark":"<BOOKMARK_FROM_DRY_RUN>"}'
    ```
 
    A successful response reports `restored: true`; `exists: false` means the target predates creation of that room. If verification fails, submit the recorded `undoBookmark` as `bookmark` before investigating. Preserve the full candidate list and per-room responses as the recovery audit record.
 
 This is intentionally a **sequential, per-room** procedure. Its throughput and request rate are limited by the delay, retry, and concurrency controls the operator puts into an incident script; EtherCalc supplies none. PITR rewinds the entire RoomDO SQLite database to the selected timestamp, including later key-value state, so it cannot selectively remove one bad SocialCalc command while retaining later good commands.
 
 **Headline Enumeration Structure & Asymmetry:**
 
 1. **Private Room Index Exclusion**: Tracing `POST /_/private` -> `/_do/init-private` (`packages/worker/src/room.ts:1310-1386`) shows that private room creation sets `STORAGE_KEYS.metaAccess = 'private'` directly in DO storage without calling `#mirrorIndex`. Furthermore, every subsequent write routes through `RoomDO.#mirrorIndex` (`packages/worker/src/room.ts:2266-2273`), which explicitly checks `const { access } = await this.#getAccessMeta(); if (access === 'private') return;` (lines 2270-2271) and returns before calling `mirrorRoomToD1`. In addition, `#postTouch` (`packages/worker/src/room.ts:620-622`) checks `access === 'private'` and calls `#deleteIndex` (`DELETE FROM rooms WHERE room = ?1`). Private rooms are **structurally excluded from the public D1 `rooms` index at write time**. They are invisible to `GET /_rooms`, `GET /_roomtimes`, and `SELECT room FROM rooms`.
 2. **Unfiltered D1 Audit/Chat Mirroring**: In contrast to `#mirrorIndex`, tracing `#applyCommandAndMirror` (`packages/worker/src/room.ts:726-750`) and `appendChat` (`packages/worker/src/room.ts:2330-2348`) reveals that audit entries (`#mirrorAudit` -> `appendAuditRows` at lines 2303-2304) and chat messages (`#mirrorChat` -> `appendChatRows` at lines 2308-2309) contain **no access check whatsoever**. When a command or chat message is executed in a private room, its audit row (containing the raw SocialCalc command) or chat row (containing user text) is mirrored to D1 `audit_log` or `chat_log`.
 3. **Form-Data Sibling Exclusion**: Rooms ending in `_formdata` (internal submitform storage) are filtered out of public listings by `isPublicRoomIndexEntry` (`packages/worker/src/lib/formdata-sibling.ts:18-19`).
 
 **Consequence for Incident Recovery & Data Handling**:
 
 - **Recovery Upside**: `SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log` acts as a platform-native D1 enumeration source for private rooms, materially softening the "no mass-recovery path" gap for private rooms.
 - **Enumeration Caveats & Limits**: The D1 audit/chat query only discovers private rooms that have had at least one command or chat message mirrored. Completely idle/empty private rooms (created with no edits or chat) or rooms whose D1 records were explicitly deleted via `DELETE /_do/all` (`#deleteAuditChatFromD1` at lines 2313-2318) will not appear in D1. In addition, D1 log tails are bounded (`AUDIT_HISTORY_KEEP = 1024`, `CHAT_HISTORY_KEEP = 500` per `packages/worker/src/lib/seq-store.ts:40-41`). D1 log queries serve as an **enumeration aid**, NOT a complete content backup. For zero-activity private rooms, edge access logs or application audit trails remain necessary.
 - **Privacy & Artifact Handling**: While the design intentionally keeps private room IDs out of the public `rooms` index (`/_rooms` and `/_roomtimes`), private room names, SocialCalc commands, and chat messages sit unfiltered in D1 `audit_log` and `chat_log`. D1 is an internal store and treated as sensitive, but operators MUST recognize that `wrangler d1 export` SQL dumps contain private-room material and handle exported `.sql` files as sensitive, access-restricted data.
 
 **Tooling Gap Summary**: No bulk-PITR script or CLI exists under `packages/cli/`, `scripts/`, or `bin/`; only the single-room HTTP endpoint exists. An operator facing a broad incident must write and peer-review the enumeration/restore driver under pressure unless one is prepared in advance. The D1 `audit_log`/`chat_log` distinct-room query provides native enumeration for active private rooms, restricting the out-of-band edge log search requirement to zero-activity private rooms only.

---

## §3 Staging Rehearsal & Phase 1 Rehearsal

Deploy all three phases to `[env.staging]` (`ethercalc-staging`) to execute end-to-end acceptance validation in an isolated Cloudflare environment.

### 3.1 Rehearsing Phase 1 & Deploying to Staging

Deploy Phase 1 from the worktree (`.worktrees/phase1-lifecycle`), followed by Phase 2 from the Phase 2 release branch (`release/phase2-rollout`).

Note on configuration variables & staging deployment safety:

- The Phase 1 branch (`.worktrees/phase1-lifecycle/packages/worker/wrangler.toml`) contains no `ETHERCALC_AUTH` in `[env.staging.vars]`, so Phase 1 on staging is passkey-off by construction.
- Conversely, Phase 2 for production requires a release branch (`release/phase2-rollout`) whose `packages/worker/wrangler.toml` sets `ETHERCALC_AUTH = "0"` in both `[vars]` and `[env.staging.vars]` (see §4.3). Staging rehearsal MUST deploy from this release branch.
- **CRITICAL WARNING [EMPIRICALLY VERIFIED]**: When `.wrangler/deploy/config.json` exists, running `wrangler deploy --env staging` without `--config wrangler.toml` does **NOT** throw an error — Wrangler silently falls back to the top-level production configuration in `dist/ethercalc/wrangler.json` (which drops `[env.staging]`), binding directly to the **production D1 database (`ethercalc_rooms`)** and **production WebAuthn RP ID (`ethercalc.net`)**. Operators MUST ALWAYS pass `--config wrangler.toml --env=staging` to guarantee staging database and domain isolation.
- **WARNING**: An ambient exported shell variable (e.g., `ETHERCALC_AUTH="0" wrangler deploy`) has no effect on deployed Worker vars because Wrangler resolves Worker variables from `wrangler.toml`, not the ambient process environment.
- **[OPERATOR-VERIFY]**: An operator MAY use a `wrangler deploy --var ETHERCALC_AUTH:0` override as an alternative, provided they run `wrangler deploy --help` first to verify that `--var` exists in the pinned Wrangler CLI version (it is not confirmed in published Wrangler CLI documentation).

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
### 3.2 Scripted Staging Acceptance Verification

Execute the following verification checklist against `https://ethercalc-staging.audreyt.workers.dev`:

1. **Legacy Un-migrated Room Handling**:
   - Access a room created prior to the upgrade (or a newly generated room without `meta:access`/`meta:acl` DO storage keys).
   - Verify `authorize()` in `packages/worker/src/lib/authorize.ts:20-22` evaluates `access == null` as `'public'`, returning HTTP 200 and allowing full read/write access (proven by `packages/worker/test/room.test.ts:257-353`).
2. **Legacy `?auth=` Query Parameter Link**:
   - Request `https://ethercalc-staging.audreyt.workers.dev/testroom?auth=legacysecret`.
   - Verify room opens without 500 error or authentication breakdown (`auth=0` remains view-only).
3. **Form/App-Mode Room Hydration**:
   - Open a form-mode sheet (`ss.formDataViewer` active).
   - Verify that the new client bundle (`boot.ts:384-390`) sends `ask.log` for the main room in addition to `<room>_formdata`, successfully hydrating the sheet grid.
4. **Large Command Batch & Limit Enforcement**:
   - Submit a command batch exceeding `MAX_SHEET_CELLS = 200_000` (e.g. `POST /_/staging-limit-test` expanding dimensions to A1:Z10000 = 260,000 cells).
   - Verify the HTTP response is `413 Payload Too Large` with `Content-Type: text/plain; charset=utf-8` and the exact lowercase body `command exceeds sheet limits` (`packages/worker/src/room.ts:703`, matching local Worker baseline in §5 Probe 6), while the WebSocket closes with `1008` and the distinct capitalized reason `Command exceeds sheet limits` (`packages/worker/src/room.ts:1805`).
5. **Legacy `/socket.io/*` Transport Shim**:
   - Request `curl -fsS "https://ethercalc-staging.audreyt.workers.dev/socket.io/1/?t=$(date +%s)"`.
   - Verify response returns HTTP 200, `Content-Type: text/plain; charset=utf-8`, and body matching `<32-hex-session-id>:60:60:websocket,xhr-polling` (matching local Worker baseline in §5 Probe 8).
6. **XLSX Import and Export**:
   - Upload a test `.xlsx` file via `POST /_/staging-xlsx-test` with header `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (which decodes binary workbook data into `loadclipboard` + `paste A1 all` commands via the `xlsx-deferred` handler in `packages/worker/src/routes/rooms.ts:745`).
   - Export sheet via `GET /staging-xlsx-test.xlsx` (or the alternative valid export spelling `GET /_/staging-xlsx-test/xlsx`). Verify response returns `200 OK` with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, binary body starting with ZIP signature bytes `PK\x03\x04`, and `Content-Disposition: attachment; filename="staging-xlsx-test.xlsx"`. Confirm downloaded file parses correctly and preserves cell data.
   - **CRITICAL WARNING**: The `GET /_/staging-xlsx-test.xlsx` spelling is **NOT** an export route. It targets a raw room named `staging-xlsx-test.xlsx` and returns `404 Not Found` with an empty `text/plain` body (matching local Worker baseline in §5 Probe 10a). An operator following the incorrect `/_/<room>.xlsx` spelling during staging rehearsal would see a 404, erroneously conclude XLSX export is broken, and could halt an otherwise healthy cutover.
7. **Phase 2 Passkey Disabled Check (`ETHERCALC_AUTH="0"`)**:
   - Query `curl -fsS https://ethercalc-staging.audreyt.workers.dev/_auth/whoami`.
   - Verify body returns `{"uid":null,"enabled":false}` and `POST /_/private` returns `401 Unauthorized`.
   - This single probe proves the kill switch actually shipped to staging with passkeys disabled and would have caught deploying staging with `ETHERCALC_AUTH="1"`. Local proof of kill-switch lockout behavior is in `packages/worker/test/routes-rooms.node.test.ts` (test named `keeps an existing private room locked when ETHERCALC_AUTH is off`).
8. **Phase 3 Passkey Enabled Check (`ETHERCALC_AUTH="1"`)**:
   - Query `curl -fsS https://ethercalc-staging.audreyt.workers.dev/_auth/whoami`.
   - Verify body returns `{"uid":null,"enabled":true}`.
   - Initiate passkey registration ceremony at `POST /_auth/register-init` and complete at `POST /_auth/register-complete`.
   - **CRITICAL NOTE**: Passkeys registered on staging are bound to WebAuthn RP ID `ethercalc-staging.audreyt.workers.dev` (`packages/worker/wrangler.toml:84`). They are **NOT portable** to production (`ethercalc.net`) because WebAuthn RP IDs strictly enforce exact domain matching.
9. **Asset Purge & Freshness Check**:
   - Request `curl -fsSI https://ethercalc-staging.audreyt.workers.dev/static/player.js`.
   - Confirm asset loads cleanly with `200 OK` and `Content-Type: text/javascript; charset=utf-8` (matching local Worker baseline in §5 Probe 4).
   - **Note**: Production Cloudflare Workers Assets edge may emit `Content-Type: application/javascript` or `text/javascript` depending on global edge MIME tables; operators should treat a MIME subtype mismatch as informational as long as HTTP status is `200 OK`.
10. **Cross-Room Index Gating (`/_rooms*`)**:
   - Request `curl -sS -i https://ethercalc-staging.audreyt.workers.dev/_rooms`.
   - On staging (`ETHERCALC_CORS="1"`), verify endpoint returns HTTP `403 Forbidden`, `Content-Type: text/plain; charset=utf-8`, and body matching exactly `_rooms not available with CORS` (30 bytes, no trailing newline, matching local Worker baseline in §5 Probe 9).

---

## §4 Cutover Execution (Three-Phase Strategy)

To guarantee 100% safe rollback capabilities during major code changes, cutover MUST follow this Three-Phase strategy.

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
  7. **Stale `[vars]` Risk**: Edits made to `packages/worker/wrangler.toml` during Phase 2/3 (such as toggling `ETHERCALC_AUTH = "0"`) will NOT take effect if Wrangler reads a stale `dist/ethercalc/wrangler.json` generated prior to the edit.

**Operator Positive Verification Step (Before Every Deploy):**  
Before running `vp exec wrangler deploy --env=""` or `npx wrangler deploy` in `packages/worker`, the operator MUST verify configuration resolution:
1. Confirm that `wrangler deploy --dry-run` output does **NOT** display the line:  
   `Using redirected Wrangler configuration.`
2. If a redirect exists locally, ALWAYS pass `--config wrangler.toml` explicitly (e.g. `npx wrangler deploy --config wrangler.toml --env=""`) to force Wrangler to read `wrangler.toml` directly and upload from `assets/`.
3. For staging deploys, ALWAYS pass `--config wrangler.toml --env staging` (e.g. `npx wrangler deploy --config wrangler.toml --env staging`) so Wrangler reads `wrangler.toml` directly and applies `[env.staging]` overlay bindings.

### 4.1 Step 1: Pre-Deploy D1 Database Migrations

Execute D1 migrations prior to deploying Worker code:

```bash
npx wrangler d1 migrations apply ethercalc_rooms --remote --config=packages/worker/wrangler.toml --env=""
```

**Reasoning for Order:**  
All database migration scripts (`0001_rooms.sql`, `0002_cron.sql`, `0003_audit_chat.sql`) are strictly **expand-only** using `CREATE TABLE IF NOT EXISTS`. Old worker code (commit `149ebcf...`) ignores these new tables, making D1 migration execution 100% safe to run before code deployment.

---

### 4.2 Phase 1: Lifecycle-Only Deployment (`npx wrangler deploy`)

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

> **Caveat on Verification**: Successful `typecheck` and `build:dry` prove that the minimal Phase 1 bundle **compiles and bundles** without type errors or missing imports. They do not substitute for testing live runtime behavior on Cloudflare infrastructure. The staging rehearsal in §3 remains mandatory before Phase 1 is deployed to production.

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
# Capture returned PHASE1_VERSION_ID
```

**PLATFORM EFFECT & ROLLBACK TARGET**: Executing `npx wrangler deploy` in Phase 1 completes the DO lifecycle schema change (`v2`). Cloudflare platform rules permanently prevent rollbacks to pre-v2 versions (`149ebcf...`). However, because Phase 1 code is behaviorally inert, Phase 1 has zero user impact. **Rollback Target for Phase 1**: The Phase 1 deployment itself (`release/phase1-lifecycle` IS the forward-fix artifact retaining `149ebcf` code + `AuthDO` + `v2` migration).

---

### 4.3 Phase 2: Main Code & Assets Gradual Rollout (`ETHERCALC_AUTH = "0"`)

Phase 2 deploys all of `main` (updated `RoomDO`, `command-limits.ts`, `authorize.ts`, assets) with `ETHERCALC_AUTH = "0"` in `packages/worker/wrangler.toml`.
The Phase 2 artifact is built from `main` after the command-rejection propagation PR (§8 item 5 / §9 item 6) landed. That behavioral fix ships in Phase 2; it MUST NOT be added to the deliberately inert, `149ebcf`-based Phase 1 lifecycle bundle.

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
# Monitor analytics for 10 minutes, then scale to 50% and 100%:
npx wrangler versions deploy <PHASE2_VERSION_ID>@50% --env=""
npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""

# 6. MANDATORY EDGE CACHE PURGE:
# Cloudflare Dashboard -> Caching -> Configuration -> Purge Everything
```

**ROLLBACK TARGET FOR PHASE 2**: Phase 2 contains ZERO DO lifecycle changes. **Phase 2 can be rolled back to Phase 1 instantly at any time via `npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`**. Because `ETHERCALC_AUTH = "0"`, no private rooms or passkeys can be created during Phase 2, making rollback completely safe and hazard-free.

---

### 4.4 Phase 3: Enable Passkeys (`ETHERCALC_AUTH = "1"`)

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
```
**ROLLBACK TARGET FOR PHASE 3**: Phase 3 can be rolled back to Phase 2 via `npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""`. The private-room Point of No Return lives HERE in Phase 3, after all major code changes have already soaked cleanly in Phase 2.

---

### 4.5 Quantified Downtime Budget & Reconnect Behavior Analysis

> Zero HTTP downtime. Every open WebSocket drops when its corresponding Durable Object restarts. Under gradual deployments (Phase 2), DO restarts are staged across percentage tranches. The client auto-reconnects at a FIXED 500 ms interval (`ws-adapter.ts`, `reconnectDelayMs ?? 500`, up to 1800 attempts) and flushes its outbound queue — so the socket comes back in about a second. **But the client does NOT re-hydrate**: `hadSnapshot` (`main.ts:347-348`) blocks any later `log`/snapshot from being applied, so a tab that stays open across the deploy keeps rendering its pre-deploy model and will NOT see edits other users made during the gap. Frames already handed to the dying socket without an ack can be lost — there is no delivery receipt or replay log.

### 4.6 Open-Tab Regressions and Their Mitigations

The following scenario matrix (verified in `docs/migration/SKEW_AND_RECONNECT.md`) documents the exact outcomes for browser tabs and API clients across the Worker deployment:

| Scenario / Skew Vector                                      | Impact / Outcome                                                                                                                                                                                                                                        | Code Evidence                                                                                                                                                                                                              | Operator Mitigation                                                                                                                                                                                                                                                                                                       |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. No State Resync on Reconnect**                         | Silent model divergence for tabs open across deploy. Socket reconnects and flushes local queue, but remote concurrent edits made during the restart gap are never fetched.                                                                              | `packages/client/src/main.ts:347-348`<br>`if (SocialCalc.hadSnapshot) return;`<br>`SocialCalc.hadSnapshot = true;`<br>`packages/client/src/boot.ts:390`                                                                    | Deploy in lowest-traffic window; announce maintenance window; advise active users to perform browser page reload post-deploy.                                                                                                                                                                                             |
| **2. Form/App-Mode Hydration Breakdown**                    | The 149ebcf client sends `ask.log` with `room = "<room>_formdata"` on the main socket. New Worker drops frames where `parsed.room !== attachment.room`, preventing main sheet hydration.                                                                | `packages/worker/src/room.ts:1550`<br>`if (parsed.type !== 'ask.recalc' && parsed.room !== attachment.room) return;`<br>`git show 149ebcf:packages/client/src/boot.ts`                                                     | Users in form/app mode must perform a full page reload onto the new client bundle (`boot.ts:384-390` in HEAD, which broadcasts main `ask.log`).                                                                                                                                                                           |
| **3. Large Pastes / Big Command Batches**                   | Pastes or command batches exceeding sheet limits fail. Native WS closes with `1008 ('Command exceeds sheet limits')`; snapshot writes through `PUT /_/:room` propagate the RoomDO's HTTP 413. The command-POST exception is the next row.                 | `packages/worker/src/lib/command-limits.ts:16-20`<br>`packages/worker/src/room.ts:699-716`<br>`packages/worker/src/room.ts:1803-1808`<br>`packages/worker/src/routes/rooms.ts:355-369`                                    | **Real Sheet Risk**: Sheets/pastes exceeding 200,000 cells (e.g. 10,000 rows × 26 columns = 260,000 cells) succeeded at 149ebcf but fail on main. Advise users to split large pastes.                                                                                                                                     |
| **4. HTTP Command API Rejection Signaling (Corrected)** | `POST /_/:room` previously returned `202 {"command":"…"}` even when RoomDO rejected the batch with 413 (silent write loss). §8 PR 4 landed and now propagates the RoomDO status and body verbatim (e.g. HTTP 413 `command exceeds sheet limits`), matching `PUT /_/:room`. | `packages/worker/src/routes/rooms.ts:778-784`<br>`packages/worker/src/routes/rooms.ts:924-936`<br>`packages/worker/test/routes-rooms.node.test.ts` | §8 PR 4 landed in `main` and ships in Phase 2. API callers now receive truthful HTTP status codes (e.g. 413 for over-limit commands). |
| **5. Legacy Oversized Sheets (>200k cells)**                | Pre-existing sheets above 200k cells load fine and allow internal cell edits, but **cannot expand declared rows or columns** (HTTP 413 / WS 1008).                                                                                                      | `packages/worker/test/room.test.ts:356-395`<br>`packages/worker/src/lib/command-limits.ts:198-200`                                                                                                                         | **Permanent Product Ceiling**: Existing >200k cell sheets keep full read/write access to cells inside current bounds, but cannot add rows/columns. D1 `rooms` index (`0001_rooms.sql`) carries `(room, updated_at, cors_public)` only, so estimating oversized rooms requires DO snapshot inspection `[OPERATOR-VERIFY]`. |
| **6. Edge/Browser Asset Skew (`static/player.js`)**         | `serveAsset` sets `Content-Type` only; it never sets `Cache-Control`. `static/player.js` is an unhashed URL. Old bundle can persist in edge/browser cache post-deploy.                                                                                  | `packages/worker/src/routes/assets.ts:92-136`<br>`packages/worker/src/index.ts:115-117`                                                                                                                                    | Operator MUST purge Cloudflare Cache for `/` and `/static/*` immediately after Phase 2 deployment (Step 4.3).                                                                                                                                                                                                             |

---

## §5 Post-Cutover Verification

Execute this numbered probe checklist immediately following Phase 2 & Phase 3
cutovers.

The response contracts below were exercised on 2026-08-10 with
`wrangler dev` at `http://127.0.0.1:8787`. The Phase 2 run used
`--var ETHERCALC_AUTH:0`; the Phase 3 run used the checked-in local
`ETHERCALC_AUTH = "1"`. D1 and Durable Object state was Miniflare-local, not
production state. The local Workers Assets binding also supplies its own MIME
and cache headers. Finally, local requests retain the configured
`ETHERCALC_ORIGIN`, so their CSP contained
`connect-src 'self' wss://ethercalc.net` even though the request host was
`127.0.0.1`. Re-run the same probes against the production host; do not treat
the local run as evidence about production data, edge cache state, or
custom-domain redirects.

```bash
# ─── PHASE 2 PROBES (ETHERCALC_AUTH = "0") ───────────────────────────

# Probe 1: Health Check Probe (Confirms Worker runtime execution)
curl -fsS -i https://ethercalc.net/_health
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: application/json, body
# `{"status":"ok","version":"0.0.0","now":"<ISO-8601 timestamp>"}`

# Probe 2: Phase 2 Behavioral Probe (Verifies new code running with Passkeys OFF)
curl -fsS -i https://ethercalc.net/_auth/whoami
# Expected [VERIFIED LOCALLY]: HTTP 200, body `{"uid":null,"enabled":false}`

# Probe 3: Anonymous Private Room Creation Check
curl -sS -i -X POST https://ethercalc.net/_/private
# Expected [VERIFIED LOCALLY]: HTTP 401, body exactly `Unauthorized`
# (no trailing newline). This proves an anonymous caller cannot create a
# private room. It does not by itself prove the flag is off: the same anonymous
# request also returned 401 with ETHERCALC_AUTH="1"; Probe 2 proves the flag.

# Probe 4: Fresh Client Asset Probe (Verifies Cache Purge)
curl -fsSI https://ethercalc.net/static/player.js
# Expected [VERIFIED LOCALLY]: HTTP 200 with
# `Content-Type: text/javascript; charset=utf-8`. The local Workers Assets
# binding also returned `Cache-Control: public, max-age=0, must-revalidate`;
# production edge-cache freshness must still be checked after the purge.

# Probe 5: Public Sheet Read/Write Probe
curl -fsS -i https://ethercalc.net/testprodcutover
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: text/html; charset=utf-8,
# body beginning `<!DOCTYPE html>`
curl -sS -i -X POST https://ethercalc.net/_/testprodcutover -d "page-size: A4"
# Expected [VERIFIED LOCALLY]: HTTP 202, Content-Type:
# application/json; charset=utf-8, body `{"command":"page-size: A4"}`

# Probe 6: Sheet Limit Enforcement Probe
# Use a fresh room so a rejected command is observable as an absent snapshot.
LIMIT_ROOM="testprodcutover-limit-$(date +%s)"
curl -sS -i -X POST "https://ethercalc.net/_/${LIMIT_ROOM}" \
  -d "set Z10000 value n 1"
# Expected [VERIFIED AFTER §8 PR 4]: HTTP 413, Content-Type:
# text/plain; charset=utf-8, body exactly `command exceeds sheet limits`.
# This well-formed SocialCalc command expands the declared area to
# 10,000 rows × 26 columns = 260,000 cells. It is the production acceptance
# probe for §9 item 6: the HTTP route surfaces RoomDO's status and body.
# Before PR 4, raw main returned HTTP 202 with
# `{"command":"set Z10000 value n 1"}` here; reproducing that false success is
# a NO-GO.
curl -sS -i "https://ethercalc.net/_/${LIMIT_ROOM}"
# Expected: HTTP 404 with an empty body, independently proving the rejected
# mutation did not create a snapshot in the fresh room.

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

# Probe 8: Legacy socket.io Compatibility Probe
curl -fsS -i "https://ethercalc.net/socket.io/1/?t=$(date +%s)"
# Expected [VERIFIED LOCALLY]: HTTP 200, Content-Type: text/plain; charset=utf-8,
# body `<32-hex-session-id>:60:60:websocket,xhr-polling`

# Probe 9: Cross-Room Index Gate
curl -sS -i https://ethercalc.net/_rooms
# Expected [VERIFIED LOCALLY]: HTTP 403, Content-Type:
# text/plain; charset=utf-8, body exactly `_rooms not available with CORS`
# (30 bytes, no trailing newline) when ETHERCALC_CORS="1" and
# ETHERCALC_DISABLE_ROOM_INDEX is unset.

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

# ─── PHASE 3 PROBES (ETHERCALC_AUTH = "1") ───────────────────────────

# Probe 11: Phase 3 Behavioral Probe (Verifies Passkeys ON)
curl -fsS -i https://ethercalc.net/_auth/whoami
# Expected [VERIFIED LOCALLY]: HTTP 200, body `{"uid":null,"enabled":true}`

# Probe 12: WebAuthn www Alias Redirect Probe
curl -fsSI https://www.ethercalc.net/_auth/register-init
# Expected [NOT VERIFIABLE LOCALLY — wrangler dev does not emulate the
# Cloudflare custom-domain/redirect layer]: production must return HTTP 301
# with `Location: https://ethercalc.net/_auth/register-init`. A local request
# to 127.0.0.1 with `Host: www.ethercalc.net` returned HTTP 404 with an empty
# body because it reached the Worker directly; that is not evidence for or
# against the production edge redirect.
```

---

## §6 Rollback Plan, Platform Limits & Point of No Return

### 6.1 Rollback Semantics per Deployment Phase

1. **Rollback During Phase 2 (Main Code & Assets Rollout)**:
   - **100% SAFE & FULLY SUPPORTED**. Roll back Phase 2 to Phase 1 using:
     ```bash
     cd packages/worker
     npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""
     cd ..
     ```
   - **Zero Data Exposure Hazard**: Because `ETHERCALC_AUTH = "0"` was set during Phase 2, no user could register a passkey or create a private room. Rolling Phase 2 back to Phase 1 carries **zero risk** of private room data exposure.
2. **Rollback During Phase 3 (Passkey Enablement)**:
   - Roll back Phase 3 to Phase 2 using `npx wrangler versions deploy <PHASE2_VERSION_ID>@100% --env=""`.
3. **Rollback Past Phase 1 (Pre-v2 Commit `149ebcf...`)**:
   - **BLOCKED BY CLOUDFLARE PLATFORM**. Platform rules reject rollbacks to pre-v2 versions. Recovery from Phase 2 or Phase 3 to pre-passkey code is executed by redeploying the Phase 1 version (`npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`). The Phase 1 `release/phase1-lifecycle` bundle **is** the forward-fix artifact (`149ebcf` code with `AuthDO` class & `v2` migration retained); no separate forward-fix bundle needs to be built. If Phase 1 itself ever requires a code fix in production, the operator branches from `release/phase1-lifecycle` and forward-fixes from there.

### 6.2 Rollback Hazards: Lockout vs. Exposure

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

### 6.3 Points of No Return Definition

- **PRIMARY POINT OF NO RETURN**:

  > **The moment `npx wrangler deploy` is executed in Phase 1 (applying `v2` migration).**
  - Past this point, Cloudflare platform rules permanently prevent reverting to pre-v2 code (`149ebcf...`). Recovery can only occur forward via Phase 1 or a Forward-Fix Bundle.

- **SECONDARY POINT OF NO RETURN**:
  > **The moment `ETHERCALC_AUTH = "1"` is activated in Phase 3 and the first user creates a private room (`POST /_/private`) OR completes a passkey registration (`POST /_auth/register-complete`).**
  - Past this point, rolling Phase 3 back to Phase 2 causes private room owner lockout (resolved immediately by re-enabling Phase 3), while rolling back to Phase 1 / Forward-Fix bundle causes world-readability unless WAF URL rules block affected room paths.

### 6.4 D1 Database Rollback & Time Travel Procedure `[OPERATOR-VERIFY]`

If D1 database state must be restored to a pre-cutover state, use Cloudflare D1 Time Travel or manual SQL export restore per [Cloudflare D1 Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/) and [Wrangler D1 CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/d1/):


> **CRITICAL OPERATOR NOTICE**: Restoring D1 via Time Travel or SQL dump restores D1 tables — the cross-room index plus bounded audit/chat tails — but it **DOES NOT** roll back or restore Durable Object SQLite storage (`RoomDO` sheet cell data, authoritative SocialCalc snapshots, or command logs). The index schema is `packages/worker/migrations/0001_rooms.sql:17-21`; D1 audit/chat tables and retention bounds are documented in `packages/worker/migrations/0003_audit_chat.sql:22-38` and `packages/worker/src/lib/seq-store.ts:39-41`. Because DO sheet content has no operator bulk export API, cutover safety relies on the three-phase rollout sequence (§4) and per-room PITR recovery.

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

For self-hosted deployments running EtherCalc via Docker Compose or Kubernetes/Helm:

### 7.1 Container Image Bump & Workerd Compatibility Lockstep

1. Update image tag from `ethercalc:0.20260717.0` to `ethercalc:main` (or newest tag).
2. **Compatibility Date Lockstep Check**:
   - `packages/worker/wrangler.toml:3` specifies `compatibility_date = "2026-07-21"`.
   - `packages/worker/workerd/config.capnp:61` specifies `compatibilityDate = "2026-07-14"`.
   - Standalone `workerd` binary releases enforce that `compatibilityDate` must be `<= workerd release date`. Operator MUST verify host `workerd` binary version is dated `>= 2026-07-14`.

### 7.2 Durable Object On-Disk Storage Backup

Before restarting containers, back up the local DO storage directory.

- **Docker Compose Track**:
  - The shipped compose file mounts DO storage at `./ethercalc-data:/data` (`docker-compose.yml:37`).
  - Container entrypoint (`bin/workerd-entrypoint.sh:25-27`) writes SQLite files under `$DATA_DIR/do` (`/data/do`).
  - **Host Backup Command**:
    ```bash
    tar -czvf ethercalc-do-backup-$(date +%Y%m%d_%H%M%S).tar.gz ./ethercalc-data
    ```
- **Kubernetes / Helm Track**:
  - `helm/values.yaml:80-90` configures `persistence.enabled: true` (`accessMode: ReadWriteOnce`, `size: 10Gi`).
  - `helm/templates/deployment.yaml:117-129` binds the PVC `persistentVolumeClaim: claimName: {{ include "ethercalc.pvcName" . }}` to `mountPath: /data`.
  - **Cluster Backup Procedure**: Take a volume snapshot of the backing PersistentVolumeClaim (`ethercalc-data`), or stream an archive out via `kubectl exec`:
    ```bash
    kubectl exec deploy/ethercalc -- tar -czf - /data > ethercalc-pv-backup-$(date +%Y%m%d_%H%M%S).tar.gz
    ```

### 7.3 Mandatory Nginx Reverse Proxy Requirement

Internet-facing self-host installations MUST run the nginx proxy recipe (`deploy/nginx/ethercalc.conf`) for rate-limiting, CSP header injection, and client IP header sanitization (`CF-Connecting-IP` stripping). Validate with `./scripts/smoke-proxy.sh`.

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

- **Docker Compose Operator Overrides (`.env` or shell export)**:

  ```bash
  ETHERCALC_AUTH="1"
  ETHERCALC_RP_ID="sheets.example.com"
  ETHERCALC_RP_NAME="Example Sheets"
  ETHERCALC_ORIGIN="https://sheets.example.com"
  ```

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

- **Consequence of Leaving Unset**: `authEnabled()` in `packages/worker/src/routes/auth.ts:34-43` checks `flagEnabled(env.ETHERCALC_AUTH) && env.AUTH !== undefined && env.ETHERCALC_RP_ID && env.ETHERCALC_ORIGIN`. If passkey variables are left unset, `authEnabled()` returns `false` (fails closed), returning HTTP 404 for `/_auth/*` endpoints and HTTP 401 for private room creation.
- **Room Index Access Fallback**: `shouldDisableRoomIndex()` in `packages/worker/src/lib/room-index-access.ts:40-46` checks `ETHERCALC_DISABLE_ROOM_INDEX` first; if absent, it falls back to legacy `ETHERCALC_CORS`. Defaults to `1` (gated) in self-host manifests.
- **Validation Commands**:
  ```bash
  bash scripts/check-helm-hardening.sh
  ./scripts/smoke-selfhost.sh
  ```

---

## §8 Pre-Cutover PRs & Preparation Bundles

The following five items have been evaluated and categorized:

1. **Phase 1 Minimal Branch (Forward-Fix Artifact) Preparation**:
   - **Specification**: Build and validate `release/phase1-lifecycle` branch (`149ebcf...` + `AuthDO` + `v2` migration).
   - **Status**: **DONE**. Local branch `release/phase1-lifecycle` built and verified in git worktree `.worktrees/phase1-lifecycle` (`5351653` / `6b7c758`). Both `vp run @ethercalc/worker#typecheck` and `vp run @ethercalc/worker#build:dry` pass cleanly with zero errors. The branch is committed locally and has NOT been pushed or deployed.
   - **Artifact Identity & Forward-Fix Strategy**: The `release/phase1-lifecycle` branch **is** the forward-fix artifact. Because Cloudflare blocks rollbacks past the `v2` migration tag, rolling back from Phase 2 or Phase 3 to a pre-passkey state is executed by redeploying the Phase 1 deployment ID (`npx wrangler versions deploy <PHASE1_VERSION_ID>@100% --env=""`). The version already exists on Cloudflare, so recovery is a redeployment of a known-good version, not a new build. A new build is needed only if Phase 1 itself proves defective in production, in which case the operator branches from `release/phase1-lifecycle` and forward-fixes from there — which is why Phase 1's diff is kept minimal and behaviorally inert (a small surface is a small failure surface).

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
   - **Phase Placement**: Landed on `main` and ships in the Phase 2 bundle. It MUST NOT be folded into Phase 1: §4.2 defines Phase 1 as the behaviorally inert lifecycle-only bundle based on `149ebcf`, while §4.3 is the rollout of `main` and its behavioral changes.

6. **Bulk PITR Automation and Private Room Inventory Tooling Gap**
   - **Specification**: Build operator CLI tooling (e.g. under `packages/cli/` or `scripts/`) to automate mass PITR iteration over candidate rooms from D1, and maintain an authenticated audit stream of private room creations (`POST /_/private`) to enable private room discovery.
   - **Cutover Blocker Decision**: **NON-BLOCKING FOLLOW-UP GAP**. Single-room PITR endpoint (`POST /_/:room/pitr-restore`) is fully functional. Operators facing mass incidents on public rooms can execute manual loops or write one-off scripts using `npx wrangler d1 execute` and `curl`. Active private room enumeration during an incident is supported via D1 queries (`SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log`), while zero-activity private rooms rely on edge access logs.

---

## §9 Go / No-Go Checklist

This checklist has nine conditions and spans the full cutover. Before executing Phase 1 (`npx wrangler deploy --env=""`), items 1–7 MUST be satisfied; items 5 and 6 are already complete and therefore intentionally checked below. Item 8 gates the Phase 2 upload, and item 9 gates Phase 3.

- [ ] **1. Baseline Capture & Subsystem Verification**: `wrangler deployments list`, `wrangler versions list`, and `wrangler d1 info ethercalc_rooms --json` executed and recorded, confirming D1 storage subsystem `version: "production"` for Time Travel availability (§0.2, §0.2.1).
- [ ] **2. Preflight Gates Green Against Final Tree (9/9 Runnable Gates Verified; 2 Docker Smokes Pending CI)**: All 9 locally-runnable preflight gates (`vp run typecheck`, `vp lint`, `vp run test`, worker `test:node` & `test:workers`, worker 100% coverage gate `test:coverage`, `build:assets` + `e2e#test`, `build:dry`, `check-helm-hardening.sh`, and `ratchet-verify.sh`) passed 100% green against the final tree state including the `rooms.ts` command-rejection status propagation fix (§1.2, `docs/migration/PREFLIGHT_RESULTS.md`). The 2 Docker smoke gates (`./scripts/smoke-selfhost.sh`, `./scripts/smoke-proxy.sh`) remain unverified locally due to missing local `docker compose` CLI subcommand and require CI execution before final cutover.
- [ ] **3. Secrets Provisioned in Production**: `wrangler secret list` confirms `ETHERCALC_KEY` and `ETHERCALC_MIGRATE_TOKEN` are active in Cloudflare Secrets (§0.1).
- [ ] **4. D1 Database Export & Time Travel Bookmark Recorded**: `npx wrangler d1 export ethercalc_rooms --remote --output=...` executed (using required `--output` flag), account plan confirmed (30d Paid / 7d Free retention), and Time Travel bookmark timestamp captured (§2.1, §6.4).
- [x] **5. Phase 1 Branch (Forward-Fix Artifact) Prepared**: `release/phase1-lifecycle` branch built, typechecks, and dry-runs cleanly (§4.2, §6.1, and §8 item 1; verified via `vp run @ethercalc/worker#typecheck` and `vp run @ethercalc/worker#build:dry`).
- [x] **6. PR 4 Command-Rejection Propagation Landed and Verified for Phase 2**: `POST /_/:room` returns the RoomDO status and body for every non-2xx verdict, matching `PUT /_/:room` at `packages/worker/src/routes/rooms.ts:355-369`. Verified via route contract tests `POST /_/:room command mutations propagate a DO 413 sheet-limit verdict` and `POST /_/:room returns 202 command echo on successful DO dispatch` in `packages/worker/test/routes-rooms.node.test.ts` (52 node files / 1520 tests; 13 workers-pool files / 196 tests; §8 item 5; §10 item 3).
- [ ] **7. Staging Rehearsal Passed**: Phase 1, Phase 2, and Phase 3 deployed and verified on `https://ethercalc-staging.audreyt.workers.dev` (§§3.1–3.2).
- [ ] **8. Phase 1 Deployed & Soaked Before Phase 2 Upload**: Phase 1 (`npx wrangler deploy`) executed and verified stable before uploading the Phase 2 gradual release (§4.2 and §4.3).
- [ ] **9. Phase 2 Soaked with `ETHERCALC_AUTH="0"` Before Phase 3**: Phase 2 fully rolled out to 100% and soaked before activating passkeys in Phase 3 (§4.3 and §4.4).

---

## §10 User-Visible Behavior Changes Summary

The following user-visible behavior changes take effect upon completing the upgrade:

1. **Sheet Dimension Ceiling**: Max declared area is capped at 200,000 cells (`packages/worker/src/lib/command-limits.ts:17`). _Nuance_: Existing sheets already exceeding 200k cells keep full read and edit access to cells inside their current bounds; they only lose the ability to add new rows or columns (`packages/worker/test/room.test.ts:356-395`).
2. **Large Paste Rejection at the Room Boundary**: Command batches expanding a sheet beyond 200,000 declared cells are rejected by RoomDO with HTTP 413 (`packages/worker/src/room.ts:699-703`); native WebSocket writes close with `1008 'Command exceeds sheet limits'` (`packages/worker/src/room.ts:1803-1808`). Snapshot writes through `PUT /_/:room` propagate the DO's 413 (`packages/worker/src/routes/rooms.ts:355-369`).
3. **HTTP Command API Rejection Signaling**: `POST /_/:room` now propagates RoomDO's non-2xx status and body (e.g., HTTP 413 with body `command exceeds sheet limits` for batches exceeding `MAX_SHEET_CELLS = 200_000`), matching `PUT /_/:room` at `packages/worker/src/routes/rooms.ts:355-369`. Native WebSocket writes close with 1008 (`command exceeds sheet limits`). _Behavioral Shift_: An API client or script that previously received HTTP 202 for an over-limit write under legacy EtherCalc (which had no sheet limits) now receives HTTP 413. This correctly eliminates the silent write-loss defect while surfacing explicit error signaling.
4. **Form/App-Mode Tab Hydration**: Browser tabs in form/app mode open across cutover must perform a page reload (`packages/client/src/boot.ts:384-390`).
5. **Passkey Accounts & Private Sheets**: Passkeys and private room creation become available after Phase 3 (`packages/worker/src/routes/auth.ts:133-137`).
6. **WebSocket Message Rate Limits**: Exceeding 1500 messages per 10-second window closes the WebSocket with 1008 (`packages/worker/src/room.ts:1887-1890`).
7. **Private Room D1 Asymmetry & Recovery Mechanics**: Private rooms (`meta:access === 'private'`) are write-time excluded from the public D1 `rooms` index (`packages/worker/src/room.ts:2270-2271`). They are invisible to `GET /_rooms`, `GET /_roomtimes`, and direct D1 queries (`SELECT room FROM rooms`). However, `#applyCommandAndMirror` and `appendChat` mirror command audit entries and chat messages to D1 `audit_log` and `chat_log` without access checks (`packages/worker/src/room.ts:2303-2309`). Consequently: (1) `SELECT DISTINCT room FROM audit_log UNION SELECT DISTINCT room FROM chat_log` provides a platform-native D1 enumeration source for active private rooms during mass PITR recovery; (2) `wrangler d1 export` SQL backups contain private-room SocialCalc commands and chat messages, requiring exported `.sql` files to be handled as sensitive, access-restricted material.
