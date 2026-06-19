# Phase 11 e2e — FINDINGS

## Client asset strategy (option chosen)

**Update (2026-06-13):** the Worker's `wrangler.toml` now ships a live
`[assets]` block (`directory = "../../assets"`, populated by
`scripts/build-assets.sh` into a curated dir that avoids the legacy
repo's >25 MiB files). So the **single-sheet** smoke takes only the
`workerBase` fixture and navigates to `${workerBase}/<room>` — the
Worker serves `index.html` + `player.js` + `socialcalc.js` directly.

Historical note (kept for context): before the binding landed, the
single-sheet smoke was a `test.skip` placeholder and the original plan
boot `vite dev` as a second child process for the SPA. Vite dev gives
SPA fallback for `/=<room>` for free — `curl
http://127.0.0.1:<port>/=test-room` returns the `index.html` shell
without extra config. Option A (mount `dist/` via a static server) was
rejected because it adds a new dependency (`serve`, `sirv-cli`, or
equivalent) for something Vite already does.

Remaining cleanup for the **multi-sheet** smoke:

1. Drop `src/fixtures-client.ts` once `assets/multi/` is rebuilt as part
   of the standard e2e setup.
2. Have `client-multi-smoke` take only the `workerBase` fixture and
   navigate to `${workerBase}/=<room>`, matching the single-sheet smoke.

## Boot strategy: fixtures, not `webServer`

The task brief asked for both a `webServer` config AND fixtures. We
picked fixtures only and documented it at the top of
`playwright.config.ts`. Reasons:

- `webServer` starts processes BEFORE Playwright workers spin up; if a
  fixture also boots wrangler, we double-boot.
- `scope: 'worker'` fixtures give deterministic teardown tied to the
  Playwright worker's lifetime. `webServer`'s own teardown is all-or-
  nothing across the whole run, which loses isolation guarantees the
  brief asks for.
- One downside: a no-fixture `import from '@playwright/test'` in a spec
  would see no base URL. All specs now import a fixture
  (`src/fixtures.ts` or `src/fixtures-client.ts`) and use `workerBase` /
  `clientBase` accordingly, so none navigate against an unset base URL.

## Surprised by

1. **Detached process group is required.** `wrangler dev` spawns
   `workerd` as a grandchild. Killing the wrangler PID alone orphans
   `workerd` and leaks the port. Fix: `spawn({ detached: true })` and
   `process.kill(-pid, 'SIGTERM')` to signal the whole group. Both
   fixtures do this.
2. **`wait-port` is not enough.** The TCP socket opens before Hono is
   ready to handle requests — first `/_health` fetches get `ECONNRESET`.
   Added a `pingHealth` loop that retries `fetch()` on the readiness
   URL until a 2xx comes back.
3. **Playwright's two generics flip the other way.** `test.extend<T, W>`
   is `<TestFixtures, WorkerFixtures>`. Since our fixtures are
   worker-scoped, they go in position 2 — passing `Record<string, never>`
   in position 1 hit the `never` constraint on `use`. Fix:
   `NonNullable<unknown>` as the first generic parameter.

## Known gaps / blocked

- **Single-sheet SocialCalc boot & edit** — UNBLOCKED and landed. The Worker's
  `[assets]` binding (`directory = "../../assets"`, populated by
  `scripts/build-assets.sh`) now serves `index.html` + `player.js` +
  `socialcalc.js` from one origin, so `client-single-smoke.spec.ts`
  drives a real Chromium page against `workerBase`, boots the editor,
  types a cell value, verifies server persistence, and asserts reload
  hydration over live WebSockets. The earlier `test.skip` placeholder is gone.
- **Parallelism** — set `workers: 1` in `playwright.config.ts` because
  concurrent wrangler dev instances on a CI runner hammer each other.
  When spec count grows past ~20, revisit to allow `workers: 2`.

## CLAUDE.md amendments requested (not applied here)

- §5.3: add "Playwright coverage is about feature coverage not line
  coverage" (task brief says it, doc doesn't).
- §11.1 item 8: mention `packages/e2e/` as the home.
- §8 Phase 10 / 10b: "Playwright" checkbox can reference this package.
- §9 directory tree: add `packages/e2e/` row.
