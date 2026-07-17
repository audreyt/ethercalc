# E2E findings

## Current asset strategy

The Worker declares `[assets] directory = "../../assets"` in
`packages/worker/wrangler.toml`. CI and local setup build both clients and run
`scripts/build-assets.ts` before E2E. The curated directory contains the
single-sheet bundle under `static/` and the React 19 multi-sheet bundle under
`multi/`.

Both SPAs are therefore tested from the real Worker origin:

- `/:room` serves the single-sheet `index.html` and its production bundles.
- `/=<room>` serves `multi/index.html`; its `/multi/assets/*` chunks are also
  served by Workers Assets.

The former `src/fixtures-client.ts` Vite server was removed. No E2E spec should
start or assume a Vite server.

## Fixture strategy

`src/fixtures.ts` owns Worker process lifetime with worker-scoped fixtures and
random ports. The ordinary `test`/`workerBase` fixture starts the default Worker.
`authTest`/`authWorkerBase` is additive and starts a second Worker with localhost
WebAuthn RP/origin overrides for the real passkey spec. A top-level Playwright
`webServer` is intentionally not used: fixtures provide deterministic teardown
and avoid double-starting wrangler.

The suite uses one Chromium worker because concurrent Miniflare startups contend
on CI. Firefox/WebKit are not configured; that remains P2 rather than a nightly
claim.

## Coverage now landed

- Production single-sheet boot/edit/reload is covered by
  `client-single-smoke.spec.ts`.
- Production React 19 multi-sheet boot and frame/error checks are covered by
  `client-multi-smoke.spec.ts`; add/rename/delete/reload is covered by
  `multi-toc-csv.spec.ts` and sibling preservation by `multi-rename.spec.ts`.
- `room-crud-export.spec.ts` covers create, raw-save read, CSV overwrite,
  command writes, cells, delete/nonexistence, and CSV, `csv.json`, HTML, XLSX,
  and Markdown exports. CSV/JSON/HTML/Markdown/XLSX exercise both the explicit
  `/_/:room/<format>` and suffix `/:room.<format>` forms where applicable.
  XLSX checks the ZIP signature, required package entries, and worksheet data.
- `realtime-collab.spec.ts` covers two independent browser contexts exchanging
  edits over native WebSockets without reload, in both directions, followed by
  reload/reconnect convergence.
- `passkey-webauthn-real.spec.ts` covers real Chromium CDP virtual-authenticator
  registration, discoverable login, private-room owner writes, anonymous and
  second-identity HTTP/WS denial, and logout denial. The separate
  `passkey-room-access.spec.ts` covers UI/access chrome with mocked ceremony
  endpoints.

## Known gaps

A genuine read-only viewer ACL state is not covered. `POST /_/private` currently
seeds empty reader/writer lists, and there is no HTTP sharing/ACL-editing route to
add a reader to an existing private room. `decideMount()` already has the
private-readable-view-only branch for when that route lands.

The suite is feature-oriented rather than a line-coverage gate. Cross-browser
(Firefox/WebKit) runs and broader parallelism remain future work.
