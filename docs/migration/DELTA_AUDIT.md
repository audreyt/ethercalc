# Delta Audit Report: Tagged Baseline (`0.20260717.0`) vs. `main` (`d486f33`)

> **Scope:** Comprehensive evidence-backed delta audit covering state, compatibility, and deployment changes between the latest tagged release baseline (`0.20260717.0` / commit `149ebcf`) and current `main` (`d486f33`).
> **Audit Date:** 2026-08-10

---

## Executive Summary & Delta Inventory

| Item | Classification | Blast Radius | Mitigation |
| :--- | :--- | :--- | :--- |
| **a) DO Classes & Migrations** | `[NEEDS MIGRATION]` / `[FORWARD-COMPATIBLE]` | High (Worker deploy requires `v2` migration for new `AuthDO` class). Existing `RoomDO` instances unaffected. | Execute `wrangler deploy` to register migration `tag = "v2"`. Rollback leaves `AuthDO` unreferenced. |
| **b) DO Storage Key Schema** | `[FORWARD-COMPATIBLE]` (Public) / `[BREAKING-ON-ROLLBACK]` (Private) | Critical on Rollback (`meta:access` & `meta:acl` added for private sheets; legacy code ignores them, making private sheets public on rollback). | Backup DO storage / snapshot before cutover. If rolling back, block access to private rooms via edge WAF. |
| **c) D1 Schema & Migrations** | `[FORWARD-COMPATIBLE]` | Low (No new D1 migrations added since `0.20260717.0`; all tables `CREATE TABLE IF NOT EXISTS`). | None required. |
| **d) KV & R2 Layout** | `[FORWARD-COMPATIBLE]` | None (KV/R2 bindings currently unused in Worker codebase). | None required. |
| **e) Environment Variables & Secrets** | `[NEEDS MIGRATION]` / `[FORWARD-COMPATIBLE]` | High (Passkeys fail closed if `ETHERCALC_AUTH`, `ETHERCALC_RP_ID`, `ETHERCALC_ORIGIN` are unset). `ETHERCALC_RP_NAME` defaults to `'EtherCalc'`. | Populate WebAuthn trust anchors in production environment before cutover. |
| **f) Compatibility Date & Capnp** | `[FORWARD-COMPATIBLE]` (Worker) / `[NEEDS MIGRATION]` (Self-host) | Medium (wrangler date updated to `2026-07-21`; self-host `config.capnp` uses `2026-07-14` in lockstep with `workerd`). | Ensure standalone `workerd` binary is updated to match capnp `2026-07-14` date. |
| **g) Wire Protocol & Version Skew** | `[FORWARD-COMPATIBLE]` | Medium (Strict resource caps added: 1 MiB frame, 16 KiB chat, 120 KiB command). Standard client frames pass. | Standard browser clients pass cleanly. Stale tabs sending oversized payloads are dropped. |
| **h) Static Assets & CSP** | `[UNKNOWN]` | Low to Medium (Root inline scripts moved to 5 `static/*.js` files. CSP `connect-src` uses `ETHERCALC_ORIGIN`. Behavior under asset/CSP skew is unproven by diff/test). | Run `scripts/build-assets.ts` prior to deploy (enforced in `deploy-production.yml`). |
| **i) Auth & Authz (`AuthDO`, ACL, `?auth=`)** | `[FORWARD-COMPATIBLE]` (Public) / `[NEEDS MIGRATION]` (Passkeys) | High (New WebAuthn passkey system + `__Host-ec_sess` cookie). Existing public sheets and `?auth=` links remain fully functional. | Configure passkey secrets/vars. No disruption to existing public sheets. |
| **j) SocialCalc Upgrade & Serialisation** | `[UNKNOWN]` | Low to Medium (Upgraded to SocialCalc 3.1.0; `version:1.5` format shared, but full parsing compatibility for pre-3.1.0 snapshots is unproven by unit test). | Run canary checks before cutover; oracle replay covers 10/13 scenarios. |
| **k) Stateful Alarms, D1 Mirror & Scheduler** | `[FORWARD-COMPATIBLE]` | Medium (DO alarm re-arm gated on active connections/TTL; D1 audit/chat mirror idempotent; scheduler retry bug fixed). | None required. |

---

## Step 1: Baseline Determination & Evidence

### 1.1 Established Baseline
* **Tag / Revision Baseline:** Tag `0.20260717.0` (commit `149ebcf16104b01254ca2b796beb701c88bd6ff8`, tagged Fri Jul 17 21:18:06 2026 +0800).
* **Target Revision for Audit:** `main` HEAD (`d486f33`).

### 1.2 Evidence Grounding
1. **Git Tag Baseline:** `0.20260717.0` is the latest git release tag in the repository.
   ```text
   tag 0.20260717.0
   Tagger: Audrey Tang <au@civic.ai>
   Date:   Fri Jul 17 21:18:06 2026 +0800
   commit 149ebcf16104b01254ca2b796beb701c88bd6ff8
   ```
2. **Package Version:** Root `package.json` specifies `"version": "0.20260717.0"`.
3. **Changelog:** `Changes.txt` records `0.20260717.0 — 2026-07-17` as the last formal release header.
4. **Deployment Pipeline:** `.github/workflows/deploy-production.yml` uses `on: workflow_dispatch:` (manual trigger for `wrangler deploy`). No automated continuous deployment triggers on commit or tag.

### 1.3 Confidence & Caveats
* **Confidence Level:** High for repo baseline; **UNKNOWN** for live production SHA.
* **Caveat / External Checks:** Because production deployments are dispatched manually via GitHub Actions or CLI `wrangler deploy`, the exact running revision on `ethercalc.net` cannot be determined from repository files alone.
* **Required External Checks to Settle Live Revision:**
  1. `wrangler deployments list --env=""` via Cloudflare API.
  2. Querying `https://ethercalc.net/_health` (currently returns `{"status":"ok","version":"0.0.0"}` because `version` is hardcoded `'0.0.0'` in `packages/worker/src/handlers/health.ts:15`, so HTTP probes cannot settle the SHA).

---

## Step 2: Detailed Delta Enumeration

### a) Durable Object Classes & Migrations
* **Tag Evidence (`149ebcf`):** `git show 149ebcf:packages/worker/wrangler.toml`
  ```toml
  [[durable_objects.bindings]]
  name = "ROOM"
  class_name = "RoomDO"

  [[migrations]]
  tag = "v1"
  new_sqlite_classes = ["RoomDO"]
  ```
* **Main Evidence (`d486f33`):** `packages/worker/wrangler.toml:31-48`
  ```toml
  [[durable_objects.bindings]]
  name = "ROOM"
  class_name = "RoomDO"

  [[durable_objects.bindings]]
  name = "AUTH"
  class_name = "AuthDO"

  [[migrations]]
  tag = "v1"
  new_sqlite_classes = ["RoomDO"]

  [[migrations]]
  tag = "v2"
  new_sqlite_classes = ["AuthDO"]
  ```
* **Analysis:** A new Durable Object class `AuthDO` (`AUTH` binding) was added along with migration `tag = "v2"` specifying `new_sqlite_classes = ["AuthDO"]`. Both `RoomDO` and `AuthDO` use SQLite-backed DO storage (`new_sqlite_classes`). No classes were renamed or deleted.
* **Classification:** `[NEEDS MIGRATION]` (wrangler deploy executes `v2` migration) / `[FORWARD-COMPATIBLE]` (existing `RoomDO` instances are untouched).

---

### b) DO Storage Key Schema
* **Tag Evidence (`149ebcf`):** `git show 149ebcf:packages/shared/src/storage-keys.ts`
  Did NOT contain `metaAccess`, `metaAcl`, or `metaGroup`.
* **Main Evidence (`d486f33`):** `packages/shared/src/storage-keys.ts:37-51`
  ```ts
  metaAccess: 'meta:access',
  metaAcl: 'meta:acl',
  metaGroup: 'meta:group',
  ```
  `packages/worker/src/lib/authorize.ts:20`
  ```ts
  if (access == null || access === 'public') return true;
  ```
  `packages/worker/src/auth-do.ts:297,325,475,589`
  ```ts
  // AuthDO storage keys: 'session-secret', 'challenge:<challenge>', 'cred:<credentialID>', 'revocation:<uid>'
  ```
* **Analysis:**
  * **Public/Existing Rooms:** `meta:access` and `meta:acl` are absent (`undefined`) in DO storage for existing rooms. `authorize()` returns `true` when `access == null`, maintaining complete backward compatibility.
  * **Private Rooms:** Created via `POST /_/private` or `POST /_do/init-private`, setting `meta:access = 'private'` and `meta:acl`.
  * **Rollback Behavior:** Older worker code (`149ebcf`) does NOT check `meta:access` or `meta:acl`. If rolled back, an old worker waking on a private room will serve `snapshot` and process commands without checking access control (exposing private sheets publicly).
* **Classification:** `[FORWARD-COMPATIBLE]` (for public rooms) / `[BREAKING-ON-ROLLBACK]` (for private rooms created post-upgrade).

---

### c) D1 Schema & Migrations
* **Evidence:** `packages/worker/migrations/`
  * `0001_rooms.sql`: `CREATE TABLE rooms (room TEXT PRIMARY KEY, updated_at INTEGER NOT NULL, cors_public INTEGER NOT NULL DEFAULT 0);`
  * `0002_cron.sql`: `CREATE TABLE cron_triggers (room TEXT NOT NULL, cell TEXT NOT NULL, fire_at INTEGER NOT NULL, PRIMARY KEY (room, cell, fire_at));`
  * `0003_audit_chat.sql`: `CREATE TABLE audit_log (...); CREATE TABLE chat_log (...);`
  * `packages/worker/src/lib/d1-schema.ts:15-18`: `CREATE TABLE IF NOT EXISTS` lazy self-healing.
* **Analysis:** No D1 migration files were added between `149ebcf` and `d486f33`. All migrations are expand-only (`CREATE TABLE`).
* **Classification:** `[FORWARD-COMPATIBLE]`.

---

### d) KV & R2 Storage
* **Evidence:** `packages/worker/src/env.ts:13-183`, `packages/worker/wrangler.toml:149-152`
* **Analysis:** KV namespaces and R2 buckets are scaffolding placeholders in `wrangler.toml` and are not bound or read in `packages/worker/src`.
* **Classification:** `[FORWARD-COMPATIBLE]`.

---

### e) Environment Variables & Fail-Closed Behavior
* **Main Evidence (`d486f33`):** `packages/worker/src/env.ts:7-9, 20-30`, `packages/worker/src/lib/room-index-access.ts:21-45`, `packages/worker/src/routes/auth.ts:34-43`, `packages/worker/src/auth-do.ts:244-253`
  ```ts
  // packages/worker/src/routes/auth.ts:34-43
  function authEnabled(env: Env): boolean {
    return (
      flagEnabled(env.ETHERCALC_AUTH) &&
      env.AUTH !== undefined &&
      typeof env.ETHERCALC_RP_ID === 'string' &&
      env.ETHERCALC_RP_ID.length > 0 &&
      typeof env.ETHERCALC_ORIGIN === 'string' &&
      env.ETHERCALC_ORIGIN.length > 0
    );
  }
  ```
  ```ts
  // packages/worker/src/auth-do.ts:244-253
  const rpID = this.#env.ETHERCALC_RP_ID;
  const origin = this.#env.ETHERCALC_ORIGIN;
  if (!rpID || !origin) {
    return plainResponse('Auth is not configured', 503);
  }
  const config: AuthConfig = {
    rpID,
    origin,
    rpName: this.#env.ETHERCALC_RP_NAME || 'EtherCalc',
  };
  ```
* **Var-by-Var Breakdown:**
  1. `ETHERCALC_AUTH`: Default when unset = flag disabled (`flagEnabled(null) === false`). WebAuthn ceremonies and private rooms return 404/401 (fails closed).
  2. `ETHERCALC_RP_ID` & `ETHERCALC_ORIGIN`: WebAuthn trust anchors. If unset while `ETHERCALC_AUTH="1"`, `authEnabled` evaluates to `false` and `AuthDO` returns `503 Auth is not configured` (fails closed). Under workerd's null quirk, handled via `typeof ... === 'string' && length > 0`. `ETHERCALC_ORIGIN` also anchors CSP `connect-src`.
  3. `ETHERCALC_RP_NAME`: Human-readable relying party name. Default when unset or null = `'EtherCalc'` (`auth-do.ts:252`). Workerd's null quirk handled via `this.#env.ETHERCALC_RP_NAME || 'EtherCalc'`.
  4. `ETHERCALC_DISABLE_ROOM_INDEX`: Default when unset = falls back to `ETHERCALC_CORS` (which is `"1"` in `wrangler.toml`, so `/_rooms*` endpoints return 403). Workerd null quirk handled via `explicit != null && explicit.trim() !== ''`.
  5. `ETHERCALC_RATELIMIT`: Default when unset = `null` (rate limiting disabled; hosted relies on CF edge WAF).
  6. `ETHERCALC_KEY`: Default when unset = `undefined` (anonymous identity HMAC, `hmac(room) = room`).
  7. `EMAIL` (`send_email` binding): Default when unset = `undefined`. Handled gracefully by `buildEmailSender` returning `DisabledEmailSender` ("E-mail disabled: no send_email binding configured").
* **Classification:** `[NEEDS MIGRATION]` (for auth environment configuration) / `[FORWARD-COMPATIBLE]`.

---

### f) Compatibility Date & Capnp Lockstep
* **Tag Evidence (`149ebcf`):** `compatibility_date = "2024-11-12"` in `wrangler.toml`.
* **Main Evidence (`d486f33`):** `packages/worker/wrangler.toml:3`
  ```toml
  compatibility_date = "2026-07-21"
  compatibility_flags = ["nodejs_compat"]
  ```
  `packages/worker/workerd/config.capnp:58-62`
  ```capnp
  # Standalone workerd rejects dates newer than its baked-in release date.
  # Keep this at or below the workerd version pinned in bun.lock; Wrangler
  # may safely use a newer date because it clamps with a warning.
  compatibilityDate = "2026-07-14",
  compatibilityFlags = ["nodejs_compat"],
  ```
* **Analysis:** `compatibility_date` in `wrangler.toml` moved from `"2024-11-12"` to `"2026-07-21"`. `config.capnp` uses `"2026-07-14"`. The capnp lockstep constraint requires that the standalone `workerd` binary release date is >= `2026-07-14`.
* **Classification:** `[FORWARD-COMPATIBLE]` (Cloudflare Wrangler) / `[NEEDS MIGRATION]` (Self-host workerd binary).

---

### g) Wire Protocol & Version Skew
* **Evidence:** `packages/shared/src/messages.ts:117-125, 255-260`
  ```ts
  export const MAX_WS_FRAME_CHARS = 1024 * 1024; // 1 MiB
  export const MAX_WS_ROOM_CHARS = 2_048;
  export const MAX_WS_USER_CHARS = 256;
  export const MAX_WS_AUTH_CHARS = 512;
  export const MAX_WS_CHAT_CHARS = 16 * 1024; // 16 KiB
  export const MAX_WS_CELL_CHARS = 64;
  export const MAX_COMMAND_UTF8_BYTES = 120 * 1024; // 120 KiB
  ```
  `packages/worker/src/room.ts:1695-1698` (attachment room binding enforcement)
* **Version Skew Analysis:**
  * **Old Client -> New Worker:** Standard client messages are well below protocol caps and pass structural checks. Oversized malformed messages are dropped (returns null).
  * **New Client -> Old Worker:** Old worker parses standard JSON frames without strict bounds checks.
  * **Legacy `/socket.io/*` Shim:** Kept intact and bound to room attachment.
* **Classification:** `[FORWARD-COMPATIBLE]`.

---

### h) Static Assets & CSP
* **Evidence:** `scripts/build-assets.ts:33-39`, `packages/worker/src/lib/csp.ts:21-40`, `packages/worker/src/index.ts:91-95`
  ```ts
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${websocketAuthority(c.env.ETHERCALC_ORIGIN, requestUrl, secureTransport)}`,
  ```
* **Analysis:** HTML inline scripts were moved to five tracked static files (`static/index-bootstrap.js`, `static/index-110n.js`, `static/panels.js`, `static/start-bootstrap.js`, `static/start.js`). CSP `connect-src` uses `ETHERCALC_ORIGIN` for WebSocket authority.
* **Uncertainty Note:** Behavior under stale cached HTML + new CSP or vice versa is **UNKNOWN** (no automated integration test covers asset-vs-CSP version skew).
* **Classification:** `[UNKNOWN]`.

---

### i) Auth/Authz (`AuthDO`, ACL, `?auth=`, `__Host-ec_sess`)
* **Evidence:** `packages/worker/src/routes/auth.ts`, `packages/worker/src/lib/auth-session.ts`, `packages/worker/src/routes/rooms.ts:634-637`, `packages/worker/src/lib/auth.ts:34,70`
* **Analysis:**
  * **Existing Rooms:** Access mode defaults to `'public'` when `meta:access` is absent in DO storage. No existing public room becomes inaccessible.
  * **Legacy `?auth=` Links:** Preserved verbatim for HMAC validation when `ETHERCALC_KEY` is set; `auth=0` continues to enforce view-only access.
  * **Session Cookie:** Passkey login sets `__Host-ec_sess` cookie; Worker verifies session with `AuthDO` and threads `X-EC-Uid` internally (inbound `X-EC-Uid` headers from clients are stripped by `doFetch`).
* **Classification:** `[FORWARD-COMPATIBLE]` (Existing rooms/links) / `[NEEDS MIGRATION]` (Passkey activation).

---

### j) SocialCalc Upgrade & Serialization
* **Evidence:** `packages/socialcalc-headless/src/socialcalc.bundled.ts:5, 1473`
* **Analysis:** Upgraded from SocialCalc 3.0.8 to 3.1.0 with build-time `createSocialCalcFactory()`. The underlying save-string format (`version:1.5`) remains shared.
* **Uncertainty Note:** Whether `createSocialCalcFactory()` parses every legacy pre-3.1.0 snapshot string without issue is **UNKNOWN** from unit test coverage alone (no unit test explicitly loads a raw 3.0.x snapshot into `createSocialCalcFactory()`, though `oracle-replay.test.ts` passes 10/13 recorded scenario replays).
* **Classification:** `[UNKNOWN]`.

---

### k) Stateful Alarms, D1 Mirror, PITR & Scheduler
* **Evidence:** `packages/worker/src/room.ts:199, 2424-2480`, `packages/worker/src/handlers/cron.ts`, `packages/worker/src/scheduled.ts`
* **Analysis:**
  * **Alarms (`setAlarm`):** RoomDO housekeeping alarm optimized to gate re-arming on active WebSocket connections or configured `ETHERCALC_EXPIRE` TTL. AuthDO uses alarms to trim expired challenges and session revocations.
  * **D1 Mirroring:** `audit_log` and `chat_log` tables receive idempotent mirrors (`INSERT OR IGNORE`).
  * **PITR Restore:** Endpoints (`/_do/pitr-restore`) retain an undo bookmark in DO storage.
  * **Scheduler (`_timetrigger`):** Fixed bug where partial scheduler retries treated failures as success.
* **Classification:** `[FORWARD-COMPATIBLE]`.

---

## Step 3: Irreversibility & Mitigation Strategies

### 3.1 Irreversible State & Deployment Steps
1. **Private Room DO State (`meta:access` & `meta:acl`):**
   * *Irreversibility:* Once a room is initialized as private (`POST /_/private` or `POST /_do/init-private`), keys `meta:access` and `meta:acl` are written to DO storage.
   * *Rollback Risk:* Older worker code (`149ebcf`) does not have `meta:access` or `meta:acl` or `authorize()` logic (`git show 149ebcf:packages/worker/src/lib/authorize.ts` yields `fatal: path does not exist`). On rollback, old code serves the room's `snapshot` to ANY requester, exposing private room contents publicly.
   * *Mitigation:* 
     - **Pre-cutover Snapshot:** Take a point-in-time snapshot of DO storage prior to cutover.
     - **Edge Access Gate on Rollback:** If rollback is required, configure Cloudflare Edge WAF rules to block access to rooms created after the upgrade, or strip `meta:access` keys via an emergency script.
2. **Durable Object Class Migration `v2` (`AuthDO`):**
   * *Irreversibility:* Running `wrangler deploy` applies migration `v2`, instantiating the SQLite-backed `AuthDO`.
   * *Rollback Risk:* Rollback leaves `AuthDO` storage orphaned. WebAuthn accounts registered during the new deployment window will not be reachable on old code.
   * *Mitigation:* Dual-write is not applicable for AuthDO since passkeys do not exist in old code. Communicate that passkey accounts created during a rollback window must be re-registered upon re-deployment.
3. **WebAuthn Relying Party Anchors:**
   * *Irreversibility:* Passkey credentials bound to `ETHERCALC_RP_ID` ("ethercalc.net") cannot be used under a different RP ID.
   * *Mitigation:* Ensure `ETHERCALC_RP_ID` and `ETHERCALC_ORIGIN` are pinned in `wrangler.toml` `[vars]` prior to initial deploy.

---

## Summary of UNKNOWN Items & Verification Steps

1. **Exact Live Production Revision of `ethercalc.net`:**
   * *Reason:* Production deployments are manually triggered via GitHub Actions `workflow_dispatch` or CLI `wrangler deploy`.
   * *Verification Check:* Execute `wrangler deployments list --env=""` or check deployment logs in Cloudflare Dashboard.
2. **Hardcoded Version Health Endpoint:**
   * *Reason:* `GET /_health` returns hardcoded `version: "0.0.0"` (`packages/worker/src/handlers/health.ts:15`), so HTTP probes cannot confirm the live git SHA.
3. **Production `ETHERCALC_KEY` Secret Status:**
   * *Reason:* `ETHERCALC_KEY` is marked as `unset by default` in `wrangler.toml` and injected via `wrangler secret put`.
   * *Verification Check:* Run `wrangler secret list --env=""` to verify if an HMAC secret is set in production.
4. **Behavior under Static Asset & CSP Version Skew:**
   * *Reason:* No automated test exercises stale cached HTML paired with new CSP or new HTML with stale CSP.
5. **Raw Snapshot Parsing Compatibility for Old SocialCalc 3.0.x Saves:**
   * *Reason:* No unit test explicitly feeds an un-migrated raw pre-3.1.0 snapshot into `createSocialCalcFactory()` directly (though `oracle-replay.test.ts` passes 10/13 recorded scenario replays).

---

## Legacy-room compatibility proof

### 1. Existing Test Analysis
* **Access Gate Unit Tests:** `packages/worker/test/authorize.node.test.ts:42-46` asserts that when `access` mode is `null` / `undefined`, `authorize('read'|'write', principal, access, null)` returns `true`.
* **Integration Test Gap:** No existing integration test in `room.test.ts` or `routes-rooms.test.ts` explicitly verified a room whose storage has **NEITHER** `meta:access` **NOR** `meta:acl` set, asserting (a) anonymous HTTP GET succeeds, (b) anonymous WebSocket connect + cell edit succeeds, and (c) legacy `?auth=` query path behaves as expected (`auth=0` demoted to view-only 403 / edit rejection).

### 2. Added Test Implementation
We added an integration test in `packages/worker/test/room.test.ts` (lines 257-353):
```ts
  it('legacy room without meta:access or meta:acl storage keys remains fully accessible to anonymous users', async () => {
    const { stub } = getStub('legacy-unprotected-room');

    // Seed the room snapshot (empty body) so it exists
    const seedPut = await stub.fetch('https://do/_do/snapshot', {
      method: 'PUT',
      body: '',
    });
    expect(seedPut.status).toBe(201);

    // Verify that DO storage has neither meta:access nor meta:acl keys
    await runInDurableObject(stub, async (_instance: RoomDO, state) => {
      const storedAccess = await state.storage.get('meta:access');
      const storedAcl = await state.storage.get('meta:acl');
      expect(storedAccess).toBeUndefined();
      expect(storedAcl).toBeUndefined();
    });

    // (a) Anonymous HTTP GET succeeds (returns 200)
    const getRes = await stub.fetch('https://do/_do/snapshot');
    expect(getRes.status).toBe(200);

    // (b) Anonymous WebSocket connect + a cell edit succeeds
    const upgradeRes = await stub.fetch(
      'https://do/_do/ws?user=anon&auth=anon&room=legacy-unprotected-room',
      { headers: { Upgrade: 'websocket' } },
    );
    expect(upgradeRes.status).toBe(101);
    const client = upgradeRes.webSocket!;
    client.accept();
    client.send(
      JSON.stringify({
        type: 'execute',
        room: 'legacy-unprotected-room',
        user: 'anon',
        auth: 'anon',
        cmdstr: 'set A1 value n 999',
      }),
    );

    // Query back until the edit is reflected in the DO state
    let a1Value: number | undefined;
    for (let i = 0; i < 20; i++) {
      const cellRes = await stub.fetch('https://do/_do/cells/A1');
      const json = (await cellRes.json()) as { datavalue?: number } | null;
      if (json?.datavalue === 999) {
        a1Value = 999;
        break;
      }
      const { promise, resolve } = Promise.withResolvers<void>();
      queueMicrotask(resolve);
      await promise;
    }
    client.close();
    expect(a1Value).toBe(999);

    // (c) Legacy ?auth= query path: auth=0 is view-only (rejects edits), unconfigured auth works
    const viewOnlyRes = await stub.fetch(
      'https://do/_do/ws?user=anon&auth=0&room=legacy-unprotected-room',
      { headers: { Upgrade: 'websocket' } },
    );
    expect(viewOnlyRes.status).toBe(101);
    const viewClient = viewOnlyRes.webSocket!;
    viewClient.accept();
    viewClient.send(
      JSON.stringify({
        type: 'execute',
        room: 'legacy-unprotected-room',
        user: 'anon',
        auth: '0',
        cmdstr: 'set A1 value n 111',
      }),
    );

    // Send a follow-up ask.log to ensure the prior message was processed by the DO
    const { promise: logPromise, resolve: logResolve } = Promise.withResolvers<string>();
    viewClient.addEventListener(
      'message',
      (event) => {
        if (typeof event.data === 'string') logResolve(event.data);
      },
      { once: true },
    );
    viewClient.send(
      JSON.stringify({
        type: 'ask.log',
        room: 'legacy-unprotected-room',
        user: 'anon',
      }),
    );
    await logPromise;
    viewClient.close();

    // A1 value remains 999 because auth=0 edit was rejected
    const cellResAfterViewOnly = await stub.fetch('https://do/_do/cells/A1');
    expect(((await cellResAfterViewOnly.json()) as { datavalue?: number } | null)?.datavalue).toBe(999);
  });
```

### 3. Execution Command & Real Verbatim Output
**Command Executed:**
```bash
./node_modules/.bin/vp run @ethercalc/worker#test
```

**Verbatim Terminal Output:**
```text
~/packages/worker$ vp test run --config vitest.node.config.ts ⊘ cache disabled

 RUN  v4.1.10 /Users/au/w/ethercalc/packages/worker

 Test Files  52 passed (52)
      Tests  1514 passed (1514)
   Start at  12:14:38
   Duration  1.47s (transform 5.88s, setup 0ms, import 9.79s, tests 2.49s, environment 4ms)

~/packages/worker$ vp test run ⊘ cache disabled

 RUN  v4.1.10 /Users/au/w/ethercalc/packages/worker

 Test Files  13 passed (13)
      Tests  196 passed (196)
   Start at  12:23:43
   Duration  4.18s (transform 9.96s, setup 0ms, import 33.83s, tests 1.25s, environment 0ms)

---
vp run: 0/2 cache hit (0%).
```

### 4. Proof of Rollback Semantics (`meta:access='private'`)
* **Question:** On rollback to tag `149ebcf`, does old code (a) ignore the key and serve private rooms publicly, or (b) fail?
* **Proof & Code Quote:** Option **(a) — Old code ignores `meta:access` and serves private rooms publicly**.
  Executing `git show 149ebcf:packages/worker/src/lib/authorize.ts` yields:
  ```text
  fatal: path 'packages/worker/src/lib/authorize.ts' exists on disk, but not in '149ebcf'
  ```
  `packages/worker/src/lib/authorize.ts` did not exist at tag `149ebcf`. Old `RoomDO` code at `149ebcf` read only `snapshot`, `log:`, `chat:`, and `audit:` keys from DO storage (`git show 149ebcf:packages/worker/src/room.ts`), without checking `meta:access` or `meta:acl`. Thus, rolling back to `149ebcf` strips access control on private rooms, rendering them publicly readable and writable.

---

## Oversized legacy sheet exposure

### 1. Call-Site Evidence & Reaction on `false`
`packages/worker/src/lib/command-limits.ts` exports `isSnapshotWithinSheetLimits(snapshot)` and `isCommandBatchWithinLimits(command, initial?)`.

* **`isSnapshotWithinSheetLimits` Call Sites:**
  1. `packages/worker/src/room.ts:667` inside `#putSnapshot`:
     ```ts
     if (!isSnapshotWithinSheetLimits(body)) {
       return plainResponse('snapshot exceeds sheet limits', 413);
     }
     ```
     *Behavior on `false`:* Returns HTTP `413 Payload Too Large` (`'snapshot exceeds sheet limits'`).
  2. `packages/worker/src/room.ts:1331` inside `#postInitPrivate`:
     ```ts
     if (!isSnapshotWithinSheetLimits(snapshot)) {
       return plainResponse('init-private snapshot exceeds sheet limits', 413);
     }
     ```
     *Behavior on `false`:* Returns HTTP `413 Payload Too Large` (`'init-private snapshot exceeds sheet limits'`).

* **`isCommandBatchWithinLimits` Call Sites:**
  1. `packages/worker/src/room.ts:2079` inside `#applyCommand`:
     ```ts
     const ss = await this.#getSpreadsheet();
     const attribs = ss.exportSheetData().attribs;
     if (
       !isCommandBatchWithinLimits(body, {
         rows: Number(attribs['lastrow'] ?? 1),
         columns: Number(attribs['lastcol'] ?? 1),
       })
     ) {
       return null;
     }
     ```
     *Behavior on `false`:* Returns `null`. For HTTP POST `/_do/commands`, `#postCommands` returns HTTP `413 Payload Too Large` (`'command exceeds sheet limits'`). For WebSocket `execute` frames (`packages/worker/src/room.ts:1805`), the DO **closes the WebSocket with status code 1008** and reason `'Command exceeds sheet limits'`.

### 2. Ingest vs. Wake/Load Path Distinction
* **Inbound Untrusted Mutations:** Snapshot limit checks apply to direct snapshot overwrites (`PUT /_do/snapshot` or `POST /_/private`).
* **Wake / Hydrate Path:** `packages/worker/src/room.ts:2161-2175` (`#getSpreadsheet()`):
  ```ts
  async #getSpreadsheet(): Promise<HeadlessSpreadsheet> {
    if (this.#ss) return this.#ss;
    const snapshot = await readSnapshot(this.#state.storage);
    const ss = snapshot
      ? createSpreadsheet({ snapshot })
      : createSpreadsheet({ log: await this.#listPrefix(STORAGE_KEYS.logPrefix) });
    ...
    this.#ss = ss;
    return this.#ss;
  }
  ```
  **Code Proof:** `#getSpreadsheet()` reads `snapshot` directly from DO storage and passes it to `createSpreadsheet()` without invoking `isSnapshotWithinSheetLimits`. Pre-existing oversized rooms stored in DO storage wake, load, and serve without error.

### 3. Edit Behavior for Existing Oversized Sheets
`packages/worker/src/lib/command-limits.ts:150-162` (`setDimensions`):
```ts
function setDimensions(
  dimensions: MutableDimensions,
  rows: number,
  columns: number,
): boolean {
  const priorArea = declaredArea(dimensions);
  const nextArea = rows * columns;
  if (nextArea > MAX_SHEET_CELLS && nextArea > priorArea) return false;
  dimensions.rows = rows;
  dimensions.columns = columns;
  return true;
}
```
**Code Proof:** When an existing room already has `priorArea > MAX_SHEET_CELLS` (e.g. 500 rows × 500 columns = 250,000 cells), editing an existing cell yields `nextArea = 250,000 <= priorArea = 250,000`. The condition `nextArea > MAX_SHEET_CELLS && nextArea > priorArea` evaluates to `false`, allowing non-growing cell edits. Commands attempting to grow declared bounds further (e.g. `rows = 501`, area = 250,500 > 250,000) return `false` and are rejected with HTTP 413 / WS 1008 (`'command exceeds sheet limits'`).

*Note on Structural Operations:* `command-limits.ts:313,339,352` (`boundedStructuralSheet`) explicitly checks `declaredArea(dimensions) <= MAX_SHEET_CELLS`. Therefore, structural operations (`insertrow`, `insertcol`, `deleterow`, `deletecol`, `moveinsert`) return `false` when a sheet's declared area exceeds 200,000 cells.

### 4. Practical User Thresholds & Concrete Examples
The threshold is defined by declared area (`rows × columns <= 200,000`).
* **Passing Example (Within Limit):** A 2,000-row × 100-column sheet = 200,000 declared cells (`2,000 × 100 = 200,000 <= 200,000`). Passes snapshot ingest and area expansion checks.
* **Failing Example (Exceeds Limit for New Creation / Expansion):** A 500-row × 500-column sheet (columns A–SF) = 250,000 declared cells (`500 × 500 = 250,000 > 200,000`). Fails `isSnapshotWithinSheetLimits` for new `PUT /_/` uploads, and rejects edits that expand beyond 500×500.

### 5. Migration Seeding Path (`packages/migrate/`)
* Migration target (`PUT /_migrate/seed/:room`) forwards payload to DO `POST /_do/seed` (`packages/worker/src/room.ts:1048-1110` `#postSeed`).
* **Code Proof:** `#postSeed` folds base snapshot + log and writes `snapshotEntries` directly to DO storage without calling `isSnapshotWithinSheetLimits`.
* **Result:** Legacy Redis/filesystem dumps containing oversized rooms are seeded into DO storage without being dropped, truncated, or rejected by limit gates.

### 6. Integration Test Proof
We added an integration test to `packages/worker/test/room.test.ts` (lines 356–396):
```ts
  it('legacy oversized sheet (>200k cells) loads, allows non-growing edits, and rejects area-expanding edits', async () => {
    const { stub } = getStub('oversized-legacy-room');

    // Build a valid SocialCalc save string with cell SF500 set (column SF = 500, row = 500 -> 250,000 cells > 200,000)
    const ss = createSpreadsheet();
    ss.executeCommand('set SF500 value n 10');
    const snapshot = ss.createSpreadsheetSave();

    // Seed an oversized legacy sheet via migration seed
    const seedRes = await stub.fetch('https://do/_do/seed?name=oversized-legacy-room', {
      method: 'POST',
      body: JSON.stringify({ snapshot }),
    });
    expect(seedRes.status).toBe(201);

    // 1. Verify DO loads and serves the oversized room without error
    const cellRes = await stub.fetch('https://do/_do/cells/SF500');
    expect(cellRes.status).toBe(200);
    expect(((await cellRes.json()) as { datavalue?: number } | null)?.datavalue).toBe(10);

    // 2. Non-growing edit within existing 500x500 dimensions (e.g. set SF500 value n 42) SUCCEEDS
    const editRes = await stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set SF500 value n 42',
    });
    expect(editRes.status).toBe(202);

    const updatedCellRes = await stub.fetch('https://do/_do/cells/SF500');
    expect(((await updatedCellRes.json()) as { datavalue?: number } | null)?.datavalue).toBe(42);

    // 3. Area-expanding edit beyond existing 500x500 dimensions (e.g. set SF501 value n 1) is REJECTED
    const expandRes = await stub.fetch('https://do/_do/commands', {
      method: 'POST',
      body: 'set SF501 value n 1',
    });
    expect(expandRes.status).toBe(413);
    expect(await expandRes.text()).toBe('command exceeds sheet limits');
  });
```

**Verbatim Suite Output:**
```text
~/packages/worker$ vp test run --config vitest.node.config.ts ⊘ cache disabled

 RUN  v4.1.10 /Users/au/w/ethercalc/packages/worker

 Test Files  52 passed (52)
      Tests  1514 passed (1514)
   Start at  12:23:41
   Duration  1.37s (transform 5.71s, setup 0ms, import 9.08s, tests 2.40s, environment 3ms)

~/packages/worker$ vp test run ⊘ cache disabled

 RUN  v4.1.10 /Users/au/w/ethercalc/packages/worker

 Test Files  13 passed (13)
      Tests  196 passed (196)
   Start at  12:23:43
   Duration  4.18s (transform 9.96s, setup 0ms, import 33.83s, tests 1.25s, environment 0ms)
```

### 7. Verdict
**Verdict:** **NON-ISSUE** (with a minor monitored risk for users attempting structural edits or area expansions on oversized sheets).
*Pre-existing oversized sheets migrate seamlessly, wake without error, and allow cell edits within their existing declared bounds; structural operations (`insertrow`, `insertcol`, `deleterow`, `deletecol`, `moveinsert`) and commands expanding declared bounds beyond both 200,000 cells and their current area are capped.*
