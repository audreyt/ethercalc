# Mutation Testing Report — Phase 12A Baseline

> **Generated:** 2026-04-19 · **Runner:** StrykerJS 9.6.1 + `@stryker-mutator/vitest-runner` · **CI:** `.github/workflows/nightly.yml` (full matrix) + `.github/workflows/ci.yml#mutation-gate` (PR fast-gate on changed packages)

This report captures the first mutation-testing baseline across the seven Node-env packages that already have 100% line/branch/function/statement coverage enforced in CI (see `AGENTS.md` §5.2). Its purpose is to surface the gap between "every line hit" and "every behavior asserted": a test that calls code without asserting on the outcome will satisfy istanbul but not survive mutation. Mutation testing flips arithmetic operators, swaps string literals, negates conditionals, removes block statements, and rechecks the test suite — any mutation that survives is a test gap.

The 100% line-coverage gate already filters the obvious dead-code gaps. Everything below is about **assertion richness** on code that is already fully exercised.

## Ratcheting the baseline

Each package's `stryker.conf.json` now carries three thresholds:

| key     | meaning                                                    | enforcement                  |
| ------- | ---------------------------------------------------------- | ---------------------------- |
| `break` | current measured mutation score, floored to the integer    | **hard fail** if score drops |
| `low`   | `break + 3` — near-term ratchet target                     | warning only                 |
| `high`  | `break + 8` — stretch goal                                 | informational                |

The `break` threshold is **the regression floor.** Any PR that lowers the mutation score below this floor fails the Stryker run (PR-gate if the package's `src/` changed, nightly otherwise). A ratchet update is always paired with the test change that earned it.

### Workflow to raise `break`

1. **Pick a target.** Open the "Top gaps" list for your package below. The ordering is intentional — the top entry is the single mutant whose coverage deficit is most load-bearing (a behavioural boundary, wire-format validator, or URL-parsing edge).
2. **Write the test.** It should assert on the *observable difference* the mutant would have produced — not just that the code ran. If the mutant flips `<` to `<=`, the test must exercise the boundary index; if it zeroes a string literal, the test must match the literal content.
3. **Re-run locally.**

   ```bash
   vp run --filter "./packages/<pkg>" mutation
   ```

   Inspect `packages/<pkg>/reports/mutation/mutation.html`. Confirm the target mutant is now marked `killed` (green). Note the new total score (shown at the top of the HTML report and in the terminal's `clear-text` reporter output).

4. **Update `stryker.conf.json`.** Floor the new score to the nearest integer, set `break` to that floor, and recompute `low = break + 3` and `high = break + 8`. Example:

   ```diff
     "thresholds": {
   -   "high": 81,
   -   "low":  76,
   -   "break": 73
   +   "high": 82,
   +   "low":  77,
   +   "break": 74
     }
   ```

5. **Commit both files together** — the new test and the ratcheted config in the same PR. Two reasons:
   - The PR-gate `mutation-gate` job runs Stryker on any package whose `src/` changed. If the test lands in a separate PR from the ratchet, the gate has to infer the new score from scratch.
   - Reviewers can check "yes, this test kills that mutant" by reading one diff.

6. **Nightly re-verifies.** The full nightly matrix confirms no other packages regressed.

### Walkthrough: closing the top gap in `client` (73.81% → ~74.00%)

The worst-scoring package is `client` at 73.81% (482 killed / 653 mutants, 171 survived). The #1 top-gap is `src/main.ts:71` — the `stripRoom` regex that decides which room the client connects to:

```ts
// packages/client/src/main.ts:71
return raw.replace(/^_+/, '').replace(/\?.*/, '');
```

Five mutants survive on this one line. The test file has a `stripRoom` block, but every input it feeds already satisfies both the anchored and unanchored forms of the regex, so mutants dropping `^` from `/^_+/` (or `*` from `/\?.*/`) produce identical output.

**Before** (hypothetical — representative of the current gap):

```ts
// packages/client/test/main.test.ts
describe('stripRoom', () => {
  it('strips leading underscore', () => {
    expect(stripRoom('_room')).toBe('room');
  });
  it('strips query string', () => {
    expect(stripRoom('room?x=1')).toBe('room');
  });
});
```

Both inputs survive with `^` dropped (`/_+/` still matches `_room` from index 0) and with `.*` replaced by `.` (`/\?./` still matches `?x=1` — though the suffix `=1` is left behind; no test asserts).

**Ratcheted** — add three parametrized cases each pinned to one of the five surviving mutants:

```ts
describe('stripRoom', () => {
  // Existing cases preserved...

  it.each([
    // Pins the `^` anchor on /^_+/: unanchored form would match
    // internal `__` inside `prefix__room` and strip them.
    ['prefix__room', 'prefix__room'],
    // Pins `+` on /^_+/: /^_/ would leave the second underscore.
    ['__room',       'room'],
  ])('leading-underscore boundary: %s → %s', (input, expected) => {
    expect(stripRoom(input)).toBe(expected);
  });

  it.each([
    // Pins `*` on /\?.*/: /\?./ leaves single trailing char.
    ['room?',        'room'],
    ['room?x=1',     'room'],
    ['room?x=1&y=2', 'room'],
  ])('query-string boundary: %s → %s', (input, expected) => {
    expect(stripRoom(input)).toBe(expected);
  });
});
```

These five cases target all five surviving mutants on line 71. Each assertion fails for the corresponding regex mutation, meaning the mutant gets `killed` on the next Stryker pass.

**Re-run:**

```bash
vp run @ethercalc/client#mutation
# ... (roughly 30–60s later) ...
# All files
# ----------|---------|----------|-----------|------------|----------|---------|
# File      | % score | # killed | # timeout | # survived | # no cov | # error |
# ----------|---------|----------|-----------|------------|----------|---------|
# All files |   74.12 |      484 |         0 |        169 |        0 |       0 |
```

The score moves from 73.81% to 74.12% — 5 mutants closed. Floor to 74, update the config:

```jsonc
// packages/client/stryker.conf.json
"thresholds": {
  "high": 82,
  "low":  77,
  "break": 74
}
```

Commit the test file + config together. The nightly run confirms the new floor; the next ratchet (#2 gap: `ws-adapter.ts:304` `isConnected()` null path) becomes the next PR's target.

> **Note:** The walkthrough above is prose-only — no test code has been added yet in this ratchet PR. The actual `stripRoom` test expansion (and subsequent ratchet) is tracked as follow-up work in the §F top-gaps list below.

## How to re-run locally

```bash
# one package at a time (minutes each)
vp run @ethercalc/shared#mutation

# or everything (slow)
vp run mutation
```

Reports land in `packages/<pkg>/reports/mutation/{mutation.html,mutation.json}` (gitignored). CI uploads them as artifacts.

## Configuration

Per-package `stryker.conf.json`. Key settings:

- **testRunner**: `vitest` + explicit `plugins: ["@stryker-mutator/vitest-runner"]` (bun workspaces don't hoist the plugin to cwd's `node_modules` in a way `stryker` picks up without the explicit reference).
- **coverageAnalysis**: `perTest` — only re-runs the tests that cover each mutated region.
- **thresholds**: per-package, ratcheted to the measured floor. See the "Ratcheting the baseline" section above for the workflow and the table below for current values:

  | Package          | break | low (+3) | high (+8) |
  | ---------------- | ----- | -------- | --------- |
  | shared           | 89    | 92       | 97        |
  | socketio-shim    | 81    | 84       | 89        |
  | migrate          | 90    | 93       | 98        |
  | oracle-harness   | 83    | 86       | 91        |
  | client           | 73    | 76       | 81        |
  | worker           | 90    | 93       | 98        |

- **Excludes**: barrel re-exports (`index.ts`), thin CLI glue (`cli.ts`, `bin.ts`), oracle recorder/replayer integration modules (`record.ts`, `replay.ts`), declarative scenario/normalize maps (`oracle-harness`: `src/scenarios/**`, `src/normalize.ts`), Hono-bundled routes (not traced by istanbul per §5.2), `src/graph.ts` in the client (615-line canvas-heavy; covered but too large for first-pass mutation).

## Scores

| Package          | Score (killed+timeout / total) | Survived | Verdict |
| ---------------- | ------------------------------ | -------- | ------- |
| shared           | **89.23%** (58 / 65)           | 7        | high    |
| socketio-shim    | **81.08%** (300 / 370)         | 70       | high    |
| migrate          | **90.16%** (605 / 671)         | 66       | high    |
| oracle-harness   | **83.46%** (1337 / 1602)      | 264      | floor   |
| client           | **73.81%** (482 / 653)         | 171      | low-ish |
| worker           | **88.66%** (after 2026-04-20 browser-smoke-fixes) | ~90 | high-ish |
| **weighted avg** | **~86%** (~2491 / ~2903)       | ~420     | —       |

All six packages clear their newly-ratcheted `break` floor (each floor = current measured score floored to the integer). The client package is the standout — 171 surviving mutants driven largely by `main.ts` (89) and `socialcalc-callbacks.ts` (60). Both files are full of side-effectful DOM glue where tests verify a call happened but not every parameter. See the walkthrough above for how to close the top gap.

### worker regression note (2026-04-20)

The worker floor dropped from 92 → 88 during the 2026-04-20 browser-smoke
sweep. The browser-found fixes (`anonymous-auth`, `D1-mirror-on-WS`,
`stopHuddle-D1-drop`, `ask.ecell-cursor-poll`, `to-preservation`,
`cells-routes`, `csvToSave-full-envelope`) each landed with 100% line +
branch + function + statement coverage and new Node tests. The
mutation regression is concentrated in `src/room.ts` — its mutant
count almost doubled (399 → ~700+) because the DO grew several
branching helpers (`#applyCommandAndMirror`, `#deleteAllAndUnindex`,
WS ctx closures, cell-route forwarders, `#buildWsContext` attachment
fallbacks). The fix-authoring tests cover behavior but not every
literal/boundary in the new DO code paths.

`src/lib/ws-dispatch.ts` and `src/lib/ws-handlers.ts` — the handler
files most edited during the sweep — are at 98.68% and 97.53%
respectively (near-perfect), so the new behavior itself is well
tested. The regression is from untested literal/conditional shapes
inside `src/room.ts`.

Follow-up target: close the `room.ts` 84.69% → ≥90% by auditing the
top-gap list (`vp run @ethercalc/worker#mutation` + reports/
mutation/mutation.html) and ratcheting `break` back toward 92.

---

## Package: `shared`

**Score: 89.23% (58 killed / 65 mutants, 7 survived)**

Small, contract-only package. Most survivors are in the `parseClientMessage` / `parseServerMessage` guards — a `ConditionalExpression` swap to `false` is caught because a malformed message does slip through, but the individual clauses (`!parsed`, `typeof parsed !== 'object'`, `typeof type !== 'string'`) can each be removed without any test noticing, because the subsequent `includes(type)` check still returns `null` for the malformed inputs our tests use.

### Top 5 surviving mutants

1. **`src/messages.ts:199:18` — ConditionalExpression**
   `if (!parsed || typeof parsed !== 'object') return null;` → `if (!parsed || false) return null;`
   **Why uncaught:** Tests pass `null`, `true`, and well-formed objects — none exercise the "valid JSON but not an object" path (e.g. `JSON.parse("42")` returns a number). The next line's `type` lookup on a non-object hits a TypeError that is caught by `parseServerMessage`'s outer try, but `parseClientMessage` has no such wrapper — and our tests never hit that path.

2. **`src/messages.ts:201:7` — ConditionalExpression**
   `if (typeof type !== 'string') return null;` → `if (false) return null;`
   **Why uncaught:** Same cluster — tests don't feed a parsed object with a non-string `type` (e.g. `{type: 42}`). Removing the guard leaves the subsequent `includes(type)` returning `false`, which also yields `null`, so the observable output is unchanged for every input the tests actually use.

3. **`src/messages.ts:208:18` and `:210:7`** — same ConditionalExpression gaps in `parseServerMessage`. Identical root cause.

4. **`src/messages.ts:218:11` — BlockStatement**
   `} catch { return null; }` → `} catch {}`
   **Why uncaught:** With the catch body removed, `safeJsonParse` returns `undefined` instead of `null` on a JSON parse error. Downstream, `!parsed || typeof parsed !== 'object'` treats both equivalently (`!undefined === true`). No test asserts the return value is specifically `null` vs `undefined`.

5. **`src/storage-keys.ts:35:26` and `:53:35` — StringLiteral**
   Error messages inside `throw new RangeError(…)` get replaced with empty strings. **Why uncaught:** Our tests `.toThrow(RangeError)` without matching the message. Low-severity — the error still rejects invalid input — but it is a real gap in usability if future debugging relies on the message.

### Recommended test additions

- [ ] `parseClientMessage` / `parseServerMessage` — add cases for `JSON.parse("42")` (number), `JSON.parse("null")`, and `{}` (missing `type`), and for objects whose `type` is non-string (`{type: 42}`).
- [ ] `safeJsonParse` return value — assert exactly `null` on parse failure, not `=== undefined || === null`.
- [ ] `padSeq` / `ecellKey` error messages — use `.toThrow(/non-negative integer/)` and `.toThrow(/non-empty user/)`.

---

## Package: `socketio-shim`

**Score: 81.08% (300 killed / 370 mutants, 70 survived)**

Largest surface (5 files, 370 mutants). Biggest contributors are `framing.ts` (25 surviving) and `adapter.ts` (24). Both handle wire-format parsing where we have solid positive-case coverage but a lot of defensive `return null` clauses that are individually redundant.

### Top 5 surviving mutants

1. **`src/framing.ts:117` — multiple Conditional/Logical/Equality mutants on**
   `if (typeStr.length !== 1 || typeStr < '0' || typeStr > '9') return null;`
   Several mutators (`true`/`false`, swapping `||` for `&&`, dropping individual predicates) all survive.
   **Why uncaught:** The three clauses over-constrain the same space — any single clause suffices to reject the realistic inputs we test (`''`, `'42…'`, `':1:…'`). Tests don't check the *exact* boundary (e.g. a single non-digit character like `'a'`).

2. **`src/framing.ts:129` — Regex + StringLiteral on**
   `if (trimmed === '' || !/^\d+$/.test(trimmed)) return null;`
   Anchors `^` and `$` can each be dropped and the test suite doesn't notice.
   **Why uncaught:** Tests pass either numeric ids or obviously-invalid ones. No test passes something like `'1a'` (fails `^$`-anchored but matches unanchored) or `' 1'` (leading space).

3. **`src/adapter.ts:164:24,25` — ArithmeticOperator on**
   `const intervalMs = (hbTimeoutSec * 1000) / 2;`
   `*` → `/`, `/` → `*`. Both survive.
   **Why uncaught:** Tests never assert on the heartbeat interval value. They verify the timer fires, but not the ratio.

4. **`src/translate.ts:48:7` — LogicalOperator**
   `if (packet.data === undefined || packet.data === '')` → `&&`
   **Why uncaught:** Our tests pass either `undefined` or a real payload. Never `''`. So `||` vs `&&` is indistinguishable.

5. **`src/adapter.ts:135:6 / :138:6` — ArrowFunction (default clock/timer injections)**
   `((cb, ms) => globalThis.setInterval(cb, ms))` → `() => undefined`
   **Why uncaught:** Tests always pass their own fake clock/timer — the default-injection path is dead in-test. Genuine runtime-only code.

### Recommended test additions

- [ ] `decodeFrame` boundary cases: single non-digit type (`'a:1::'`), id with leading space (`'5: 1::'`), id with trailing non-digit (`'5:1a::'`).
- [ ] Assert heartbeat interval value (`hbTimeoutSec * 500`) rather than just "some timer fires".
- [ ] Translate empty-string data vs undefined: both should yield `null`; add a test that distinguishes them.
- [ ] `decodeFrame` data-section containing an embedded colon: already tested but add one where the `id` trailing `+` is present alongside.

---

## Package: `migrate`

**Baseline needs a rerun after the 2026-04-21 RESP-only rewrite.** The
hand-rolled RDB parser + LZF worker pool + `WranglerTarget` were
removed — migration now always streams RESP from a live Redis into the
worker's `PUT /_migrate/seed/:room`. The entries below are stale; the
next nightly Stryker run will repopulate this section. Retained here as
historical context in case we ever re-add an RDB-parsing path.

<details>
<summary>Stale baseline (pre-2026-04-21)</summary>

Score before rewrite: 90.16% (605 killed+timeout / 671 mutants, 66 survived). The top surviving clusters were in `parse-rdb.ts` arithmetic offsets, `extract-rooms.ts` default-branch coverage, and `targets/wrangler.ts` SQL-string substitutions — none of which exist in the current `src/` tree.

</details>

---

## Package: `oracle-harness`

**Score: 83.46% (1337 killed+timeout / 1602 mutants, 264 survived, 1 no coverage)** — measured 2026-07-18 after targeted zip canonicalizer boundary tests.

`break` was ratcheted **80 → 83** after 15 behavioral tests pinned volatile metadata names, required-vs-optional ZIP paths, prefixed XML elements, specialized entry routing, numbered worksheet paths, and the byte-to-hex boundary. Stryker exclusions remain unchanged: `src/scenarios/**` and `src/normalize.ts` are declarative maps, not behavioral logic.

The largest survivor cluster remains **`zip-canonical.ts` (82.34% file score, 98 survived)**, down from 153 survivors on the same 1602-mutant surface. The remaining clusters are primarily defensive DOM guards, namespace fallbacks, and parser arguments whose mutations are equivalent under linkedom.

### Top 5 surviving clusters (2026-07-18)

1. **`src/zip-canonical.ts` (98 survived)** — defensive linkedom node guards, namespace fallbacks, XML parser MIME literals, and optional-parent removal.

2. **`src/ws-transport.ts` (53 survived)** — event-frame validation and socket cleanup boundaries.

3. **`src/ws-runner.ts` (40 survived)** — timeout, cleanup, and failure-reporting branches.

4. **`src/matchers.ts` (32 survived)** — HTML/ZIP matcher glue where integration tests cover the route but not every defensive fallback.

5. **`src/html-canonical.ts` (23 survived)** — less-common volatile-ID and referrer-attribute branches.

### Recommended test additions

- [x] `zip-canonical.ts` — behavioral cases for every previously surviving volatile drop name and specialized ZIP/XML route.
- [x] `zip-canonical.ts` — negative-branch tests proving required `hasPart`, `Relationship`, manifest, and archive paths survive canonicalization.
- [ ] HTML canonical — add targeted fixtures for each `REFERRER_ATTRS` entry individually.
- [ ] `headers.ts` — distinguish "header missing" from "header mismatch" in assertions.

### oracle-harness regression note (2026-06-12; resolved 2026-07-18)

Zip canonicalizers grew to close nightly worker replay (`exports/get-xlsx`, `exports/get-ods`). The mutation score initially dropped from ~84.95% to 80.04%, so `break` was temporarily lowered to **80**. On the current 1602-mutant surface, the added boundary tests raised the measured score from **80.02% to 83.46%**, killed 55 additional mutants, and reduced `zip-canonical.ts` survivors from 153 to 98. The floor is restored to **83**, with `low`/`high` recomputed to **86**/**91**.

---

## Package: `client`

**Score: 73.81% (482 killed+timeout / 653 mutants, 171 survived) — WORST**

The client is DOM-heavy glue code with side-effects wrapped in try/catch. The test suite stubs SocialCalc and WebSocket extensively, but stubs verify "this method was called" more than "this method was called with these exact arguments."

### Top 5 surviving mutants

1. **`src/main.ts:71` — Regex cluster (5 mutants on one line)**
   `return raw.replace(/^_+/, '').replace(/\?.*/, '');`
   Anchors + quantifiers can each be removed.
   **Why uncaught:** `stripRoom` tests input strings that already satisfy all forms (both anchored and unanchored regexes agree). No test with `"prefix__room"` (where `^` matters) or `"room?"` with nothing after `?` (where `*` vs `.` matters).

2. **`src/socialcalc-callbacks.ts` — 60 survived.** Dominated by `ConditionalExpression` and `OptionalChaining` mutants on callback glue. Typical pattern: `if (cb?.onSnapshot)` → removing the optional-chain still works when `cb` is defined. Most tests provide a fully-populated stub.

3. **`src/ws-adapter.ts:281 — BlockStatement** on `try { socket.close(); } catch {}` → `try {} catch {}`
   **Why uncaught:** The swallowed exception path (close() failing) isn't tested; the happy path doesn't care whether `close()` was actually called because the mock socket's close is already a no-op.

4. **`src/ws-adapter.ts:304:14 — ConditionalExpression** on `return socket !== null && socket.readyState === WS_OPEN;` → `return true && …;`
   **Why uncaught:** Our tests never call `isConnected()` when socket is null (the adapter always constructs one first).

5. **`src/main.ts:101:28 — BooleanLiteral** on `SocialCalc.isConnected = true;` → `= false;`
   **Why uncaught:** Tests don't read back `SocialCalc.isConnected` after `runMain` returns. The value sits unused.

### Recommended test additions

- [ ] `stripRoom` — add targeted cases: `"_____room"` (multi-underscore), `"room?"` (bare `?`), `"room?foo=bar"` (verify suffix stripped).
- [ ] `runMain` — assert that `SocialCalc.isConnected === true` on the returned handle / global after execution.
- [ ] `ws-adapter.close()` — test the `socket.close()` throw path explicitly; assert adapter state after.
- [ ] `ws-adapter.isConnected()` — call it with both null and live socket; currently only live.
- [ ] `socialcalc-callbacks` — provide stubs with selective missing handlers (no `onSnapshot`, no `onLog`, etc.) to exercise the optional-chain branches.

---

## Package: `worker`

**Score: 92.23% (368 killed+timeout / 399 mutants, 31 survived) — BEST**

Worker handlers are small, pure, and thoroughly unit-tested via the Node config. Survivors cluster in `room.ts` (19 out of 31), which is the DO class — still Node-constructable, but has more dense branching.

### Top 5 surviving mutants

1. **`src/handlers/rooms.ts:52-56` — LogicalOperator/ConditionalExpression cluster** on the `&&`-chain inside `classifyRequestBody`'s JSON-path. `parsed && typeof parsed === 'object' && 'snapshot' in …`. Individual clauses can be dropped; the `parsed as Record<string, unknown>` cast masks type-confusion issues.
   **Why uncaught:** Tests pass either a well-formed `{snapshot: "..."}` or obvious non-objects. Edge cases like `{snapshot: 42}` (non-string snapshot) or `[]` (array is an object in JS) aren't tested.

2. **`src/handlers/room-entry.ts:179,200 — StringLiteral** on plain-text 503 error messages inside the `/:template/form` stub.
   **Why uncaught:** Tests assert on the 503 status; the body text is not matched. Low-severity.

3. **`src/lib/auth.ts:72:7 — ConditionalExpression** on constant-time comparison `if (a.length !== b.length) return false;` → `if (false) return false;`
   **Why uncaught:** Removing the early return delegates the length check to the following loop, which still rejects mismatched lengths (it iterates up to `Math.max(a.length, b.length)` … wait, no — it iterates up to `a.length`. So a 0-length `a` would short-circuit and return true for any `b`). This is a real but low-risk gap — the caller always passes fixed-length hex strings.

4. **`src/room.ts` cluster (19 survived)** — optional-chaining and method-call mutants inside the storage-list helpers. E.g. `storage.list({prefix: STORAGE_KEYS.ecellPrefix})` → `storage.list({})` survives because the test only checks that some value comes back, not that only-prefixed keys are returned.

5. **`src/lib/csv.ts:88.89%** — a `ConditionalExpression` + a `StringLiteral` tied to edge cases in CSV parsing that the happy-path tests don't hit.

### Recommended test additions

- [ ] `classifyRequestBody` — add `{snapshot: 42}`, `[]`, and `null` JSON-body cases; assert the returned `kind` for each.
- [ ] `auth.timingSafeEqual` — test with empty strings and mismatched-length strings; assert boolean result (not just "didn't throw").
- [ ] `RoomDO.listEcells` — assert that the returned keys are **only** the ecell-prefixed ones, not all keys in storage.
- [ ] `/:template/form` 503 stub — match on the body message, not just the status code.

---

## Top 3 gaps across all packages

These are the mutants whose test deficit is most impactful if a future change triggers the mutated behavior.

1. **`shared/src/messages.ts:199/201/208/210` — the `parseClientMessage`/`parseServerMessage` guard chain.**
   All four clauses can be individually removed without any test catching it. This is a wire-protocol boundary — a malformed message from a legacy client or a corrupted WS frame should be rejected *specifically* and observably. Current tests assert `=== null` only on obvious garbage (empty string, invalid JSON). Fix: parametrized test covering every reject-path explicitly.

2. **`socketio-shim/src/framing.ts:117 / :129` — type-code + id-format validators in `decodeFrame`.**
   Multiple mutants survive across two lines of critical wire-format parsing. Any single-character `typeStr` that isn't in `0-8`, and any numeric-but-oddly-prefixed id, can slip through. The socketio-shim is the compat-bridge for external embeds (Drupal sheetnode, etc.); wrong-frame-accepted here = external client misbehavior we won't see in tests.

3. **`client/src/main.ts:71` — `stripRoom` regex.**
   Five mutants survive on one line of URL parsing that decides which room the client connects to. If the regex silently admits a wrong prefix in a future refactor, users get routed to the wrong DO. Already-100%-line-covered but 0%-assertion-covered on the boundary characters.

---

## Fixed-in-this-PR mutants (§F)

**None.** All surviving mutants are concentrated in legitimate gaps but none qualify as "test doesn't assert at all" — each test file has reasonable assertions on the happy-path. Per §F constraint ("keep scope tight"), closing these in a separate follow-up is the appropriate path. The recommended test additions per package above are the follow-up checklist.

## Nightly CI

Stryker runs in `.github/workflows/nightly.yml` — see that file for the configured cron + artifact upload + regression-issue-opener. **Not added to `ci.yml`** per the phase-12 spec (too slow; minutes per package).

## Follow-up

- **Ratchet the baselines.** `break` now locks in the current measured score. Progressive tightening happens PR-by-PR as top-gap mutants are closed — see the "Ratcheting the baseline" section at the top of this file for the workflow and the walkthrough for `client`'s top gap (`stripRoom` regex at `src/main.ts:71`).
- Add `socialcalc-headless` to the mutation matrix once `@cloudflare/vitest-pool-workers` coverage instrumentation is resolved (§5.2 follow-up).
- Consider adding `@stryker-mutator/typescript-checker` to catch mutants that produce typecheck failures more cheaply than running the full test suite — not critical at current speed (every run is under 30 s).

## Nightly profiling (§12 Phase 12.D) — recommendations

The full nightly matrix runs six packages in parallel jobs. Indicative per-package magnitudes, projected from the baseline-run mutant counts (exact GitHub Actions wall-clock is visible per cell on the Actions tab; revisit this table after the next nightly completes to pin concrete numbers):

| Package        | Approx. runtime | Total mutants | Notes                                                          |
| -------------- | --------------- | ------------- | -------------------------------------------------------------- |
| shared         | under 1 min     | 65            | Smallest surface; no action.                                   |
| worker         | 1–2 min         | 399           | Well-bounded; no action.                                       |
| socketio-shim  | 1–2 min         | 370           | Well-bounded; no action.                                       |
| oracle-harness | 2–3 min         | ~1400         | Zip canonicalizers dominate survivors; scenarios/normalize excluded. |
| client         | 2–3 min         | 653           | `graph.ts` excluded; 3 files dominate. No action.              |
| migrate        | under 2 min     | rerun pending | RDB parser removed 2026-04-21; runtime will drop dramatically. |

After the 2026-04-21 RESP-only rewrite `migrate` is the smallest mutation surface in the repo (parser/LZF/stream modules gone). A fresh nightly will settle the runtime and mutant count; no sharding or concurrency knobs look necessary.

The PR-gate `mutation-gate` job (ci.yml) is already scoped to changed packages, so a single-package edit stays under ~2 minutes regardless of migrate's full-matrix cost.

---

## Addendum: `worker` — passkey Phase A remeasurement (2026-07-17)

**Score: 90.20%** (3987 killed+timeout / 4415 mutants, 401 survived) — passes `break: 90`. Fresh main-baseline comparison on a clean `origin/main` worktree (same mutate scope minus `auth-do.ts`/session files, which don't exist on main): **90.16%**.

PR #841 (passkey accounts + private sheets, Phase A) added `src/auth-do.ts` and expanded `src/room.ts`'s branching surface, which initially dragged the combined worker score from ~91% to 84.1% and forced `break` down to 84 in that PR's original commit history. After rebasing PR #841 onto post-Vite+-migration `main`, `break` was restored to 90 and kept there through four rounds of **test-only** hardening (no source or config behavior changes) targeting the specific survivor clusters the rebase surfaced:

1. `auth-do.ts` — WebAuthn ceremony response contracts, signed-session schema/expiry boundaries, challenge purpose/expiry/delete semantics, alarm re-arm exactness, verifier fail-closed guards, counter-regression rejection. **87 → 15 survivors (77.55% → 96.17%)**.
2. `auth-session.ts` / `authorize.ts` / `ws-upgrade.ts` (via `ws.test.ts`) — malformed session-verification payload matrix, ACL member-list type validation, principal/owner malformation, WS handshake attachment defaulting and legacy-upgrade tagging. `authorize.ts` **14 → 2 survivors (98.20%)**.
3. `rate-limit.ts` / `room-create-limit.ts` — token-bucket boundary conditions. **26 → 19** and **30 → 19 survivors** respectively.

`break` was never silently lowered while the score was below 90 during this effort — the interim 88.72% measurement (after round 1 alone) was left as a failing gate on purpose, exactly documenting the real gap, until enough of rounds 2–3 landed to clear the floor.

### Top remaining survivor clusters (this run)

| File | Survivors | File score | Note |
| --- | --- | --- | --- |
| `src/room.ts` | 183 | 86.41% | Largest cluster, deliberately untouched this round — see below. |
| `src/lib/xlsx-import.ts` | 46 | 82.03% | Pre-existing, unrelated to passkey work. |
| `src/lib/xlsx-build.ts` | 21 | 93.23% | Pre-existing, unrelated to passkey work. |
| `src/lib/rate-limit.ts` | 19 | 83.90% | Reduced from 26 this round; boundary-condition remainder. |
| `src/lib/room-create-limit.ts` | 19 | 84.43% | Reduced from 30 this round; boundary-condition remainder. |
| `src/auth-do.ts` | 15 | 96.17% | Reduced from 87; remainder concentrated in ~8 documented clusters (see `auth-do.node.test.ts` commit history), several confirmed mathematically/behaviorally equivalent. |
| `src/lib/snapshot-storage.ts` | 10 | 86.90%/87.95% | Pre-existing. |
| `src/lib/auth-session.ts` | 10 | 81.48% | Reduced from the pre-hardening baseline; remainder is malformed-payload edge combinations not yet parametrized. |
| `src/lib/ws-upgrade.ts` | 9 | 5.26%/18.18% | `istanbul ignore file` (workerd-only glue, AGENTS.md §5.2) — low file score is expected; behavioral coverage lives in `ws.test.ts`'s workers-pool integration tests, not this file's own unit surface. |
| `src/lib/sandstorm-access.ts` | 8 | 90.12% | Pre-existing, unrelated to passkey work. |

`room.ts`'s 183 survivors were deliberately left untouched this round: a dedicated hardening pass mapped its clusters (`#armAlarm`/housekeeping-alarm boolean and conditional mutants around L2058–2134, `storage.list` `ObjectLiteral` prefix-argument mutants at several call sites, chunk-cleanup loop-bound mutants, `init-private` ACL/JSON guard mutants) and confirmed the other three workstreams' combined kills were sufficient to clear the `break: 90` floor without it. That cluster map is preserved here for whoever picks up the next ratchet-raise pass on `room.ts` specifically — it is largely pre-existing `main` surface (main's own `room.ts` score is 88.70%/89.21% at 112 survivors before any passkey-specific additions), not passkey-Phase-A-specific debt.

### Measurement-noise caveat

Roughly 27 of the ~4415 total mutants in this run are `Timeout`-classified — Stryker's wall-clock-limit status for a mutant, which is sensitive to machine load and scheduling rather than being a purely deterministic function of the code. A single mutant flipping between `Timeout` and `Killed`/`Survived` across runs shifts the aggregate score by roughly `1/4415 ≈ 0.023pt`. The 90.20% (integrated) vs. 90.16% (fresh `main` baseline) comparison is a real, above-floor result, but the margin is thin enough to sit within that noise band — flagged here rather than presented as an unambiguous wide-margin clear.

### `webauthn-ops.ts` exclusion rationale (independent-review MEDIUM finding, addressed)

`src/lib/webauthn-ops.ts` carries both an `istanbul ignore file` directive and a Stryker `mutate` negation (`!src/lib/webauthn-ops.ts`). This is not a blind spot: the file is a zero-branch forwarding adapter — four direct re-exports of `@simplewebauthn/server` functions behind an injectable interface, with no conditional logic of its own to test at this boundary. Coverage of the actual WebAuthn ceremony logic lives at two layers instead: unit tests mock this interface at the `AuthDO` boundary (`auth-do.node.test.ts`, which is exactly the file responsible for the 87→15 survivor reduction above), and `packages/e2e/tests/passkey-webauthn-real.spec.ts` exercises the real `@simplewebauthn/server` calls end-to-end via a genuine Chromium CDP virtual authenticator (real registration + discoverable-login WebAuthn ceremony bytes, not mocked). The file's own header comment was expanded in this same pass to state this explicitly rather than leaving a bare, unexplained exclusion.
