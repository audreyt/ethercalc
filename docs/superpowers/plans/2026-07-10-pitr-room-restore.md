# Hosted Room PITR Restore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose Cloudflare’s existing 30-day SQLite Durable Object point-in-time history through a capability-authenticated per-room restore API with a reversible undo bookmark.

**Architecture:** Put request parsing and runtime PITR feature detection in a Node-covered library. Add an internal RoomDO restore protocol that resolves/schedules bookmarks, returns before a delayed instance abort, exposes a per-instance nonce for restart detection, and finalizes restored metadata in the replacement instance. The public Hono route authenticates, validates, dispatches, observes the nonce change, finalizes D1/alarm state, and only then reports success.

**Tech Stack:** TypeScript, Hono, Cloudflare Workers, SQLite-backed Durable Objects PITR, D1, Vitest node coverage, `@cloudflare/vitest-pool-workers`, Wrangler staging/production environments.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-10-pitr-room-restore-design.md` exactly.
- Use TDD: every production behavior must have a focused test that was observed failing first.
- Preserve static imports; use `import type` for type-only dependencies.
- Reuse `verifyAuth`, `doFetch`, `hasSnapshot`, `STORAGE_KEYS`, `#mirrorIndex()`, and `#armAlarm()`; do not add a parallel auth, snapshot, D1, or alarm convention.
- `POST /_/:room/pitr-restore` uses the same auth contract as `DELETE /_/:room`.
- No Wrangler binding or migration change: `RoomDO` is already SQLite-backed.
- No local PITR emulation. Unsupported runtimes return `501`.
- No user-facing `/log` UI, R2 backup tier, workbook-wide restore, or release-version bump.
- Keep implementation allocations bounded: tiny JSON bodies only, bounded polling, no snapshot materialization during restore finalization.
- Run focused tests until the behavioral smoke works; broader verification and documentation are post-smoke cleanup.

---

### Task 1: Parse Restore Requests and Detect PITR Capability

**Files:**
- Create: `packages/worker/src/lib/pitr.ts`
- Test: `packages/worker/test/pitr.node.test.ts`

**Interfaces:**
- Consumes: platform `DurableObjectStorage.getBookmarkForTime(timestamp)` and `onNextSessionRestoreBookmark(bookmark)` method shapes.
- Produces:
  - `PitrRequest = {bookmark: string; dryRun: boolean} | {at: number; dryRun: boolean}`
  - `PitrParseResult = {ok: true; value: PitrRequest} | {ok: false; error: string}`
  - `PitrStorage` with the two required async bookmark methods
  - `parsePitrRequest(body: unknown): PitrParseResult`
  - `bookmarkStorage(storage: unknown): PitrStorage | null`

- [ ] **Step 1: Finish the parser and feature-detection tests**

Require these observable results:

```text
non-object body -> "body must be a JSON object"
neither / both targets -> "send exactly one of {bookmark} or {at}"
non-empty bookmark -> normalized bookmark request
empty/non-string bookmark -> bookmark validation error
positive finite ms epoch -> normalized at request
ISO string -> Date.parse(...) ms
zero/negative/NaN/Infinity/unparseable/boolean at -> at validation error
dryRun omitted -> false; boolean retained; non-boolean rejected
bookmarkStorage -> original object only when both functions exist
```

- [ ] **Step 2: Run the new test file and verify RED**

Run:

```bash
bunx vitest run --config vitest.node.config.ts test/pitr.node.test.ts
```

Expected: module resolution failure for missing `src/lib/pitr.ts`. Fix only test syntax/configuration if the failure is unrelated.

- [ ] **Step 3: Implement the pure module**

Use this public shape:

```ts
export type PitrRequest =
  | { readonly bookmark: string; readonly dryRun: boolean }
  | { readonly at: number; readonly dryRun: boolean };

export type PitrParseResult =
  | { readonly ok: true; readonly value: PitrRequest }
  | { readonly ok: false; readonly error: string };

export interface PitrStorage {
  getBookmarkForTime(timestamp: number | Date): Promise<string>;
  onNextSessionRestoreBookmark(bookmark: string): Promise<string>;
}
```

`parsePitrRequest()` must use own-property checks to enforce exactly one target, validate `dryRun` before constructing the discriminated union, and normalize ISO text with `Date.parse()`. `bookmarkStorage()` must reject null and primitives before checking both method properties; it must not use `any`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: all `pitr.node.test.ts` cases pass.

- [ ] **Step 5: Commit the isolated unit**

```bash
git add packages/worker/src/lib/pitr.ts packages/worker/test/pitr.node.test.ts
git commit -m "feat(worker): validate PITR restore requests"
```

---

### Task 2: Add the RoomDO Recovery Protocol

**Files:**
- Modify: `packages/worker/src/room.ts`
- Modify: `packages/worker/test/room.node.test.ts`

**Interfaces:**
- Consumes: Task 1 `parsePitrRequest()` / `bookmarkStorage()`, existing `hasSnapshot()`, `STORAGE_KEYS.metaUpdatedAt`, `#mirrorIndex()`, `#armAlarm()`.
- Produces:
  - `GET /_do/ping` → `{id, name, nonce}`
  - `POST /_do/pitr-restore` dry-run → `{dryRun: true, bookmark}`
  - `POST /_do/pitr-restore` accepted → `{bookmark, undoBookmark, nonce}`
  - `POST /_do/pitr-touch` → `{exists: false}` or `{exists: true, updatedAt}`

- [ ] **Step 1: Extend the direct-construction fake state**

Allow tests to inject a `DurableObjectStorage` carrying bookmark functions and a state `abort(reason?)` spy without weakening the existing fake. Use actual method implementations rather than mocking private RoomDO methods.

- [ ] **Step 2: Add failing nonce tests**

Require:

```text
same RoomDO instance -> ping nonce stays stable
two RoomDO constructions -> ping nonces differ
existing id/name fields remain unchanged
```

Run:

```bash
bunx vitest run --config vitest.node.config.ts test/room.node.test.ts -t "ping"
```

Expected RED: `nonce` is absent.

- [ ] **Step 3: Add failing restore handler tests**

Cover:

```text
missing bookmark API -> 501
invalid direct internal body -> 400
dryRun at -> calls getBookmarkForTime, returns bookmark, no restore, no abort
dryRun bookmark -> returns supplied bookmark
getBookmarkForTime rejection -> 400
onNextSessionRestoreBookmark rejection -> 400
accepted restore -> returns target + undo + nonce and schedules exactly one abort
```

Use fake timers for the delayed abort. Await the response before advancing timers so the contract proves the DO returns its undo bookmark before restart.

- [ ] **Step 4: Add failing finalizer tests**

Cover both storage layouts through `hasSnapshot()`:

```text
no snapshot -> {exists:false}, no metadata write, D1 mirror, or alarm
existing snapshot -> writes current numeric meta:updated_at
existing snapshot -> upserts D1 room index with the same timestamp
existing snapshot -> arms alarm
```

- [ ] **Step 5: Implement nonce and dispatch branches**

Add one immutable instance field:

```ts
readonly #instanceNonce = crypto.randomUUID();
```

Extend ping without changing existing fields. Register exact-method branches before the unknown-path `501`:

```ts
if (path === '/_do/pitr-restore' && request.method === 'POST') {
  return this.#postPitrRestore(request);
}
if (path === '/_do/pitr-touch' && request.method === 'POST') {
  return this.#postPitrTouch(roomName);
}
```

- [ ] **Step 6: Implement restore scheduling**

`#postPitrRestore()` must:

1. parse JSON with a caught `400`;
2. call `parsePitrRequest()` and return its error as `400`;
3. call `bookmarkStorage(this.#state.storage)` and return `501` if null;
4. resolve `at` with `getBookmarkForTime()` or use `bookmark`;
5. return `{dryRun:true, bookmark}` without calling restore/abort;
6. call `onNextSessionRestoreBookmark()` and return `400` on platform rejection;
7. schedule one short delayed `this.#state.abort('PITR restore scheduled')` only after receiving the undo bookmark;
8. return `{bookmark, undoBookmark, nonce:this.#instanceNonce}`.

The timer callback is synchronous; no promise may float.

- [ ] **Step 7: Implement replacement-instance finalization**

`#postPitrTouch(roomName)` must call `hasSnapshot()` without reassembling the snapshot. If false, return `{exists:false}`. If true:

```ts
const updatedAt = Date.now();
await this.#state.storage.put(STORAGE_KEYS.metaUpdatedAt, updatedAt);
await this.#mirrorIndex(roomName, updatedAt);
await this.#armAlarm();
return jsonResponse({ exists: true, updatedAt });
```

- [ ] **Step 8: Run direct RoomDO tests and verify GREEN**

```bash
bunx vitest run --config vitest.node.config.ts test/room.node.test.ts test/pitr.node.test.ts
```

Expected: both files pass with no unhandled timer errors.

- [ ] **Step 9: Commit the DO protocol**

```bash
git add packages/worker/src/room.ts packages/worker/test/room.node.test.ts
git commit -m "feat(worker): add RoomDO PITR protocol"
```

---

### Task 3: Orchestrate Authenticated Public Restore

**Files:**
- Modify: `packages/worker/src/routes/rooms.ts`
- Create: `packages/worker/test/routes-rooms-pitr.node.test.ts`

**Interfaces:**
- Consumes: `verifyAuth()`, `parsePitrRequest()`, `doFetch()`, Task 2 DO response shapes.
- Produces: `POST /_/:room/pitr-restore?auth=...` public API from the design spec.

- [ ] **Step 1: Build a fake namespace recorder**

Follow `routes-rooms-post.node.test.ts`: capture URL, method, and body; let each test respond by internal path and call count. Do not mock `verifyAuth`, `doFetch`, or Hono.

- [ ] **Step 2: Add failing authentication and validation cases**

Require:

```text
configured KEY + missing/wrong auth -> 403 and zero DO calls
auth=0 without KEY -> 403 and zero DO calls
malformed JSON -> 400 and zero DO calls
invalid request shape -> 400 and zero DO calls
```

- [ ] **Step 3: Add failing dry-run and error forwarding cases**

Require:

```text
dry run -> normalized body dispatched once to /_do/pitr-restore
DO 501 -> public 501 with same text
DO rejected target -> public 400 with same text
DO fetch throws -> public 502
```

- [ ] **Step 4: Add failing completed-restore cases**

The fake returns `{bookmark:'target',undoBookmark:'undo',nonce:'old'}`. Require:

```text
ping old nonce, transient throw, then new nonce -> route keeps polling
after new nonce -> exactly one POST /_do/pitr-touch
existing touch -> 200 combined response with exists:true + updatedAt
empty touch -> 200 combined response with exists:false and no updatedAt
nonce never changes within the bound -> 500 and no touch
```

Keep timeout test deterministic with Vitest fake timers if needed.

- [ ] **Step 5: Run route tests and verify RED**

```bash
bunx vitest run --config vitest.node.config.ts test/routes-rooms-pitr.node.test.ts
```

Expected RED: public route is missing (`404`).

- [ ] **Step 6: Implement the public route before generic `POST /_/:room`**

The handler must authenticate first, read bounded JSON, parse with `parsePitrRequest()`, and dispatch normalized JSON to `/_do/pitr-restore`. Preserve non-2xx status/body as `application/json` or `text/plain` according to the DO response.

For accepted restore, parse the internal payload, then perform a bounded loop:

```ts
for (let attempt = 0; attempt < PITR_POLL_ATTEMPTS; attempt += 1) {
  if (attempt > 0) {
    const { promise, resolve } = Promise.withResolvers<void>();
    setTimeout(resolve, PITR_POLL_INTERVAL_MS);
    await promise;
  }
  try {
    const ping = await doFetch(c.env, room, '/_do/ping');
    const body = (await ping.json()) as { nonce?: unknown };
    if (typeof body.nonce === 'string' && body.nonce !== accepted.nonce) {
      restarted = true;
      break;
    }
  } catch {
    // Expected while state.abort() replaces the instance.
  }
}
```

If not restarted, return `500`. Otherwise `POST /_do/pitr-touch`, validate its response, and return the combined public JSON. Do not expose the internal nonce.

- [ ] **Step 7: Run route and direct DO tests and verify GREEN**

```bash
bunx vitest run --config vitest.node.config.ts \
  test/pitr.node.test.ts \
  test/room.node.test.ts \
  test/routes-rooms-pitr.node.test.ts
```

Expected: all focused Node tests pass.

- [ ] **Step 8: Commit the public route**

```bash
git add packages/worker/src/routes/rooms.ts packages/worker/test/routes-rooms-pitr.node.test.ts
git commit -m "feat(worker): expose authenticated room PITR restore"
```

---

### Task 4: Pin Unsupported Local Runtime and Smoke Hosted Recovery

**Files:**
- Modify: `packages/worker/test/room.test.ts`

**Interfaces:**
- Consumes: Task 2 internal dry-run protocol, real workers-pool `env.ROOM` namespace.
- Produces: deterministic local-platform `501` contract and hosted staging evidence.

- [ ] **Step 1: Add the workers-pool discovery test**

Call `POST /_do/pitr-restore` through the real namespace with:

```json
{ "at": 1, "dryRun": true }
```

Pin the documented local outcome: `501` and `PITR is unavailable on this deployment`. The test must not call restore or abort.

- [ ] **Step 2: Run the workers-pool test**

```bash
bunx vitest run --config vitest.config.ts test/room.test.ts -t "PITR"
```

If workerd exposes methods that throw instead of omitting them, keep the public `501` contract by recognizing only the documented local unsupported error; do not convert arbitrary bookmark errors into `501`.

- [ ] **Step 3: Run the focused Worker package verification**

```bash
bun run test:node
bun run test:workers
bun run typecheck
```

Expected: zero failures and no type errors.

- [ ] **Step 4: Commit the local contract test**

```bash
git add packages/worker/test/room.test.ts
git commit -m "test(worker): pin local PITR unavailability"
```

- [ ] **Step 5: Request code review before hosted deployment**

Review the complete branch against the design spec, including auth order, platform-error classification, abort/timer safety, nonce polling, D1/alarm finalization, response contracts, and tests. Resolve every Critical/Important finding and rerun its focused proof.

- [ ] **Step 6: Deploy the reviewed candidate to staging**

```bash
bun x wrangler deploy --env staging
```

Use a unique scratch room and the real route to execute the design spec’s hosted smoke: seed known content, dry-run a timestamp/bookmark, capture a pre-change bookmark, change/delete the room, restore, verify content and D1 index, restore the undo bookmark, verify the changed/deleted state returns, then delete the scratch room.
