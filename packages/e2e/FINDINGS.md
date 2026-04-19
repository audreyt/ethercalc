# Phase 11 e2e — FINDINGS

## Client asset strategy (option chosen)

**B, revised:** boot `vite dev` as a second child process in a fixture,
not the Workers Assets pipeline. The Worker's `wrangler.toml` has the
`[assets]` block commented out today (Phase 4 deferred it to Phase 11
because the legacy repo root contains >25 MiB files that trip the
per-asset size limit). Vite dev gives us SPA fallback for `/=<room>`
for free — `curl http://127.0.0.1:<port>/=test-room` returns the
`index.html` shell without extra config.

Option A (mount `dist/` via a static server) was rejected because it
adds a new dependency (`serve`, `sirv-cli`, or equivalent) for
something Vite already does.

When Phase 11 finishes, the plan is:

1. Drop `src/fixtures-client.ts`.
2. Have both `client-single-smoke` and `client-multi-smoke` take only
   the `workerBase` fixture, and navigate to
   `${workerBase}/<room>` / `${workerBase}/=<room>` respectively.

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
  would see no base URL. That's OK — the only spec that does this is
  `client-single-smoke.spec.ts`, which is a `test.skip` placeholder.

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

- **Single-sheet SocialCalc boot** — blocked on Phase 11 Workers Assets.
  The single-sheet client needs `index.html` + `player.js` + SocialCalc
  served from one origin so the inline boot script can wire up. Will
  land when the curated `assets/` directory is populated.
- **Parallelism** — set `workers: 1` in `playwright.config.ts` because
  concurrent wrangler dev instances on a CI runner hammer each other.
  When spec count grows past ~20, revisit to allow `workers: 2`.

## CLAUDE.md amendments requested (not applied here)

- §5.3: add "Playwright coverage is about feature coverage not line
  coverage" (task brief says it, doc doesn't).
- §11.1 item 8: mention `packages/e2e/` as the home.
- §8 Phase 10 / 10b: "Playwright" checkbox can reference this package.
- §9 directory tree: add `packages/e2e/` row.
