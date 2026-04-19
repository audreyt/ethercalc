# @ethercalc/e2e

Playwright end-to-end tests. Fixtures boot `wrangler dev` (Worker) and
`vite dev` (client-multi SPA) per Playwright worker on random ports —
no shared state, no port collisions, clean tear-down.

## Run locally

```bash
# once per machine: fetch Chromium
bun run --cwd packages/e2e install:browsers

# the whole suite
bun run --cwd packages/e2e test

# a single spec
bun run --cwd packages/e2e test -- tests/health.spec.ts

# headed + inspect the HTML report
bun run --cwd packages/e2e test:headed
bun run --cwd packages/e2e report
```

## Specs

| Spec                          | Proves                                                                    |
| ----------------------------- | ------------------------------------------------------------------------- |
| `health.spec.ts`              | Worker boots; `/_health` returns `{status:'ok', version, now}` JSON.      |
| `redirects.spec.ts`           | `/_new`, `/=_new`, `/:room/{edit,view,app}` redirect as per CLAUDE.md §6. |
| `blocked.spec.ts`             | `/etc/*` and `/var/*` stay 404 with `text/html` empty body.               |
| `client-multi-smoke.spec.ts`  | React 18 SPA mounts on `/=<room>`, Radix tablist renders.                 |
| `client-single-smoke.spec.ts` | Skipped: waits on Phase 11 Workers Assets pipeline.                       |

## Strategy for client assets (current)

Worker has no live `[assets]` binding yet (see
`packages/worker/wrangler.toml`). Until Phase 11 lands the curated
`assets/` directory, the client-multi smoke test boots `vite dev` on a
fixture-owned port and the single-sheet smoke is `test.skip`-ed. Once
Phase 11 wires Workers Assets, both smoke specs point at `workerBase`
directly and the client Vite fixture goes away.

## Expanding coverage as phases land

- Phase 5 (Room CRUD): `POST /_` 201, `PUT /_/:room` body-type matrix,
  `DELETE /_/:room`, `GET /_/:room` read-back, `/_rooms` + `/_roomtimes`.
- Phase 6 (exec): `POST /_/:room` with `set A1 value n 1`, verify via
  `GET /_/:room`.
- Phase 7 (WS): two pages on one room; type in one, assert the second
  sees the update via `page.waitForFunction`.
- Phase 8 (exports): `/_/:room/csv`, `/:room.html`, `/:room.xlsx` —
  assert via `@ethercalc/oracle-harness` structural matchers.
- Phase 10/10b (realtime client): drop the skip on
  `client-single-smoke.spec.ts` — wait for `window.SocialCalc`, edit a
  cell, reload, assert persistence.
- Phase 11 (assets): drop the Vite fixture; both SPAs come via Workers
  Assets served by the Worker.
