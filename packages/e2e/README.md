# @ethercalc/e2e

Playwright end-to-end tests for the EtherCalc Worker and clients. The standard
fixtures boot `wrangler dev` with Workers Assets on a random port; both the
single-sheet client and the React 19 multi-sheet client are production builds
served by that Worker. There is no Vite fixture or separate client server.

## Run locally

```bash
# once per machine: fetch Chromium
vp run @ethercalc/e2e#install:browsers

# the whole suite
vp run @ethercalc/e2e#test

# a single spec
vp run @ethercalc/e2e#test tests/health.spec.ts

# headed + inspect the HTML report
vp run @ethercalc/e2e#test:headed
vp run @ethercalc/e2e#report

# typecheck
vp run @ethercalc/e2e#typecheck
```

## Specs

| Spec | Proves |
| --- | --- |
| `health.spec.ts` | Worker health JSON contract. |
| `redirects.spec.ts` | New-room and room mode redirects. |
| `blocked.spec.ts` | Reserved `/etc/*` and `/var/*` paths remain blocked. |
| `client-single-smoke.spec.ts` | Production single-sheet assets boot; a cell persists through the Worker and reload. |
| `client-multi-smoke.spec.ts` | Production React 19 multi-sheet assets boot at `/=<room>`; tabs, frame layout, and browser errors are clean. |
| `multi-toc-csv.spec.ts` | Multi-sheet add, rename, delete, and reload lifecycle. |
| `multi-rename.spec.ts` | Renaming one multi-sheet tab preserves its sibling. |
| `room-crud-export.spec.ts` | Worker room create/read/overwrite/command/cells/delete lifecycle plus CSV, `csv.json`, HTML, XLSX, and Markdown exports on both high-value route forms. |
| `filldown-persistence.spec.ts` | HTTP command persistence and exported fill-down values. |
| `form-clone.spec.ts` | Template clone redirect and seeded room behavior. |
| `landing-import.spec.ts` | Landing-page CSV and workbook imports, including binary fallback. |
| `landing-layout.spec.ts` | Responsive landing navigation, attribution, and layout. |
| `passkey-room-access.spec.ts` | Passkey UI/viewer/access chrome with mocked ceremony/access responses. |
| `passkey-webauthn-real.spec.ts` | Real Chromium virtual-authenticator registration/login, private-room authorization, and WS denial. |
| `realtime-collab.spec.ts` | Two independent browser contexts exchange live edits over native WebSockets and converge after reload. |

## Production asset strategy

`scripts/build-assets.ts` copies the built clients into the curated root
`assets/` directory. `packages/worker/wrangler.toml` binds that directory as
Workers Assets. A request to `/:room` serves the single-sheet entry; a request
to `/=<room>` serves `assets/multi/index.html`, whose `/multi/assets/*` chunks
are served by the same Worker. CI builds both clients and `assets/` before the
Worker/E2E stages.

## Real WebAuthn fixture and known viewer gap

`passkey-webauthn-real.spec.ts` uses additive `authTest`/`authWorkerBase`
fixtures. That fixture starts a second Worker with localhost RP/origin vars so
Chromium's CDP virtual authenticator can complete real ceremonies. The ordinary
passkey UI spec remains a fast mocked-ceremony suite.

A genuine read-only viewer ACL state is not covered: `POST /_/private` seeds
empty reader/writer lists and no HTTP sharing/ACL-editing route currently adds a
reader to an existing private room. This is the known follow-up documented by
AGENTS.md decision #12.

## Harness note

Fixtures, rather than a top-level `webServer`, own Worker process lifetime and
teardown. The suite intentionally runs one Chromium worker to avoid concurrent
Miniflare startup contention. Firefox/WebKit coverage is not configured (P2).
