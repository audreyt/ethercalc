# Mutation Testing Report — Phase 12A Baseline

> **Generated:** 2026-04-19 · **Runner:** StrykerJS 9.6.1 + `@stryker-mutator/vitest-runner` · **CI:** `.github/workflows/nightly.yml` (full matrix) + `.github/workflows/ci.yml#mutation-gate` (PR fast-gate on changed packages)

This report captures the first mutation-testing baseline across the seven Node-env packages that already have 100% line/branch/function/statement coverage enforced in CI (see `CLAUDE.md` §5.2). Its purpose is to surface the gap between "every line hit" and "every behavior asserted": a test that calls code without asserting on the outcome will satisfy istanbul but not survive mutation. Mutation testing flips arithmetic operators, swaps string literals, negates conditionals, removes block statements, and rechecks the test suite — any mutation that survives is a test gap.

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
   bun run --cwd packages/<pkg> mutation
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
bun run --cwd packages/client mutation
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
bun run --cwd packages/shared mutation

# or everything (slow)
bun run mutation
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
  | oracle-harness   | 84    | 87       | 92        |
  | client           | 73    | 76       | 81        |
  | worker           | 92    | 95       | 100       |

- **Excludes**: barrel re-exports (`index.ts`), thin CLI glue (`cli.ts`, `bin.ts`), oracle recorder/replayer integration modules (`record.ts`, `replay.ts`), Hono-bundled routes (not traced by istanbul per §5.2), `src/graph.ts` in the client (615-line canvas-heavy; covered but too large for first-pass mutation).

## Scores

| Package          | Score (killed+timeout / total) | Survived | Verdict |
| ---------------- | ------------------------------ | -------- | ------- |
| shared           | **89.23%** (58 / 65)           | 7        | high    |
| socketio-shim    | **81.08%** (300 / 370)         | 70       | high    |
| migrate          | **90.16%** (605 / 671)         | 66       | high    |
| oracle-harness   | **84.95%** (463 / 545)         | 82       | high    |
| client           | **73.81%** (482 / 653)         | 171      | low-ish |
| worker           | **92.23%** (368 / 399)         | 31       | high    |
| **weighted avg** | **~83%** (2276 / 2703)         | 427      | —       |

All six packages clear their newly-ratcheted `break` floor (each floor = current measured score floored to the integer). The client package is the standout — 171 surviving mutants driven largely by `main.ts` (89) and `socialcalc-callbacks.ts` (60). Both files are full of side-effectful DOM glue where tests verify a call happened but not every parameter. See the walkthrough above for how to close the top gap.

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

**Score: 90.16% (605 killed+timeout / 671 mutants, 66 survived)**

The RDB parser is the largest file (573 LOC). Most survivors are arithmetic offsets in binary-parsing inner loops where the code is over-specified — `i + 1 < arr.length` vs `i + 1 <= arr.length` is invisible because we never feed it an odd-length pair array.

### Top 5 surviving mutants

1. **`src/parse-rdb.ts:174,195` — EqualityOperator** on `for (let i = 0; i + 1 < arr.length; i += 2)`
   `<` → `<=`
   **Why uncaught:** RDB hash/zset payloads always come in pairs. No fixture feeds an odd-length array, so `<=` and `<` agree on all realistic inputs. Defensive code; the `<=` variant would over-read the last index but tests never hit it.

2. **`src/parse-rdb.ts:571:31` — StringLiteral** on `Buffer.from(s, 'utf8')` → `Buffer.from(s, "")`
   **Why uncaught:** Node's `Buffer.from` with an unknown encoding falls back to UTF-8 by default. Real equivalence — no test can distinguish.

3. **`src/cli-args.ts:58:9` — ConditionalExpression** on `if (out.input === '')` → `if (false)`
   **Why uncaught:** Default for `out.input` is `''`, but tests always pass `--input=<something>`. The `--input=''` explicit empty-string case isn't tested.

4. **`src/extract-rooms.ts:81:7` — ConditionalExpression** on `if (raw === undefined) return {};`
   **Why uncaught:** Tests always provide the key. The "snapshot missing" path through `extractRooms` isn't exercised in unit tests (only in the `fixtures-roundtrip` integration).

5. **`src/targets/wrangler.ts` cluster (7 survived)** — a mix of `StringLiteral` replacements on SQL strings (`'INSERT INTO …'` → `''`) and method-call arg mutations. `wrangler.ts` is tested via a mock that records the call shape but doesn't assert on the SQL string bytes.

### Recommended test additions

- [ ] `extractRooms` — feed a missing snapshot key, assert empty result (not just "no crash").
- [ ] `CliArgs` — test `--input=` (empty-value) separately from "argument omitted".
- [ ] `targets/wrangler.ts` — assert on SQL string contents, not just "query was called".
- [ ] `parse-rdb` — add a fixture with an odd-length hash payload (malformed); assert it errors cleanly.

---

## Package: `oracle-harness`

**Score: 84.95% (463 killed+timeout / 545 mutants, 82 survived)**

Most survivors are in `html-canonical.ts` (23) and `zip-canonical.ts` (24) — each drops individual attribute names from the volatile-drop list, which is cluster-validated rather than individually-validated. If we drop `'form'` from the list, the HTML canonical form will retain `form="x"` attributes that should have been normalized, but the test fixtures don't exercise every element in the list.

### Top 5 surviving mutants

1. **`src/html-canonical.ts:60-64` — StringLiteral cluster** replacing individual items in `REFERRER_ATTRS` (`'aria-controls'`, `'aria-describedby'`, `'headers'`, `'form'`, `'list'`) with `""`.
   **Why uncaught:** Tests exercise `for`, `aria-labelledby`, `href`-fragment — but the less-common attrs are only asserted in aggregate ("no volatile attrs remain") against fixtures that don't use them.

2. **`src/html-canonical.ts:68:34` — Regex**
   `VOLATILE_ID_REGEX = /^(SocialCalc|[a-f0-9-]{32,})/;` — `^` anchor removed.
   **Why uncaught:** Fixtures use id strings that begin with `SocialCalc` or a UUID. We don't test an id like `prefix-SocialCalcSheet` (which `^` blocks but the unanchored form would match).

3. **`src/zip-canonical.ts:60:5` — StringLiteral** on `'meta:editing-cycles'` etc. in the ODS meta.xml drop list. Same cluster as #1.

4. **`src/headers.ts:65:7` — ConditionalExpression** on `if (actual === undefined) return false;`
   **Why uncaught:** Removing the early return still yields a correct result because the subsequent `startsWith` on `undefined` throws, which is caught upstream by the test's assertion pattern (`expect(result).toBe(false)` is satisfied by *any* negative outcome).

5. **`src/matchers.ts` cluster (19 survived)** — primarily in HTML-matcher paths that aren't wired to real phase 8 exports yet (matchers are library code; the phase 8 integration tests are the ones that drive edge cases).

### Recommended test additions

- [ ] HTML canonical — add targeted fixtures for each `REFERRER_ATTRS` entry individually.
- [ ] `VOLATILE_ID_REGEX` — add an id string that passes the unanchored-but-fails-anchored form (e.g. `prefix-SocialCalc-Cell-A1`).
- [ ] `headers.ts` — distinguish "header missing" from "header mismatch" in assertions.
- [ ] `zip-canonical.ts` ODS meta — feed a fixture that exercises every listed drop-field.

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
| oracle-harness | 2–3 min         | 545           | Matchers + canonicalizers are heavy; no action.                |
| client         | 2–3 min         | 653           | `graph.ts` excluded; 3 files dominate. No action.              |
| migrate        | **3–6 min**     | 671           | `parse-rdb.ts` is the critical-path file; see below.           |

**Only `migrate` plausibly approaches the 5-minute ceiling** (CLAUDE.md §5.3 implies "minutes per package" as the expected worst case — not a hard limit, but the trigger for deeper slicing). Its 573-LOC `parse-rdb.ts` (a hand-rolled RDB binary parser) generates the largest per-file mutant count and dominates the wall-clock. Two non-implementation options if timings drift further:

1. **Split the `mutate` glob.** Current config is `src/**/*.ts`. Splitting `parse-rdb.ts` into its own nightly matrix cell (and the rest of `migrate` into a second cell) halves the critical-path time at the cost of one extra job slot. Config sketch:

   ```jsonc
   // packages/migrate/stryker.conf.json — split-mode variant
   "mutate": ["src/parse-rdb.ts"]
   // and a sibling config: "mutate": ["src/**/*.ts", "!src/parse-rdb.ts", ...]
   ```

2. **Bump `concurrency` on `migrate` only.** Other packages are I/O-bounded (vitest startup per re-run); `parse-rdb.ts` mutants are CPU-bounded (buffer parsing, no async). Raising concurrency from 4 to 8 on this package cuts wall-clock by ~30% on the 4-core ubuntu-latest runner at the cost of longer individual test re-runs. Lower-risk than option 1.

   ```jsonc
   "concurrency": 8   // was 4
   ```

Neither is blocking today. Apply if `parse-rdb.ts` grows (e.g. adding encoding support), if `migrate`'s score tightens and the additional test-runner cost pushes it past ~5 min, or if the next nightly's timing sheet confirms a concrete regression.

The PR-gate `mutation-gate` job (ci.yml) is already scoped to changed packages, so a single-package edit stays under ~2 minutes regardless of migrate's full-matrix cost.
