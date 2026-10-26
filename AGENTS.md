# EtherCalc — Agent context

> **Status:** rewrite complete · **Owner:** Audrey Tang · doc updated 2026-10-26
>
> Slim agent doc. Rewrite ultraplan + per-session history archived in
> [`docs/historic/REWRITE_ULTRAPLAN.md`](./docs/historic/REWRITE_ULTRAPLAN.md) (§14).

## What this repo is

TypeScript EtherCalc on Cloudflare Workers (Hono + Durable Objects + D1 +
KV + R2). Runs locally via `wrangler dev` / Miniflare; self-hosts via
standalone `workerd` (`docker compose up`, no CF account). 100%
line/branch/function/statement coverage on gated packages in CI.

## Key docs (read these first)

| Topic | Where |
| ----- | ----- |
| User guide + FAQ | [docs.ethercalc.net](https://docs.ethercalc.net) · `packages/docs/` |
| HTTP API | `API.md` |
| Self-host hardening | `docs/SELFHOST_HARDENING.md` |
| Prod upgrade runbook | `docs/migration/PROD_UPGRADE_PLAN.md` |
| Oracle replay | `tests/oracle/README.md` · `packages/oracle-harness/` |
| Mutation baselines | `docs/MUTATION_REPORT.md` |
| Sandstorm `.spk` | `SANDSTORM.md` (manual `spk pack` — app owner signs) |
| Formal verification / Leanstral pump | `lemma/README.md` |
| Rewrite history | `docs/historic/REWRITE_ULTRAPLAN.md` |

## Resolved decisions (do not re-ask)

| # | Decision |
| - | -------- |
| 1 | Sensible fixes allowed; default still leans oracle preservation |
| 2 | `multi/` → React 18 + TS; keep `/=:room` URLs |
| 3 | Email via CF `send_email` binding (no gmail-xoauth2) |
| 4 | Legacy `/socket.io/*` shim kept indefinitely |
| 5 | Self-host = standalone workerd Docker image |
| 6 | Secrets: CLI `--key` + Worker `ETHERCALC_KEY` |
| 7 | Hosted: no in-Worker rate limit (CF edge). Internet-facing self-host: **mandatory nginx proxy**; optional `ETHERCALC_RATELIMIT` (default off) |
| 8 | Keep serving `/static/socialcalc.js` |
| 9 | Mirror `chat-<room>` to D1 beyond DO lifetime |
| 10 | Snapshot TTL via DO `setAlarm` |
| 11 | `ETHERCALC_DISABLE_ROOM_INDEX` gates `/_rooms*` + `/_exists` (default ON in Docker/Helm); legacy `ETHERCALC_CORS` fallback; CORS headers unconditional |
| 12 | Formal stack: root `lemma/` is a **pump surface** (Dafny CI + Lean gen for Leanstral). Shipping TS is the oracle; findings promote only via Bun tests. Full SocialCalc algebra stays upstream in `../socialcalc/lemma/`. No `lake build` gate. |
| 13 | Vite+ is the repository interface: `vp install/add/remove/update` for packages, `vp run` for tasks, `vp exec` for local binaries. Bun 1.3.14 remains the package manager and Bun-native runtime. Bare Bun package commands are confined to Docker and packed-package bootstrap/runtime paths where Vite+ is not shipped. |
| 14 | Passkeys (Phase A): singleton `AuthDO` is the WebAuthn RP (`ETHERCALC_AUTH` + RP_ID/RP_NAME/ORIGIN trust anchors from env only); RoomDO is the SOLE authz *enforcement* boundary — top-level rooms use local `meta:access`/`meta:acl`; parented workbook children derive the parent's verdict via immutable `meta:parent` (parent RoomDO authoritative via `/_do/access`, fail-closed; both parent marker and local ACL → deny) (Worker cookie→`X-EC-Uid` is UX only, `doFetch` strips inbound identity/capability spoofs); private rooms use deny-overrides (legacy `?auth=` demoted); `/_do/ping` + `/_do/pitr-*` are gate-exempt operator paths; `ETHERCALC_KEY` never signs sessions |

## Runbook

```bash
git clone https://github.com/audreyt/ethercalc
cd ethercalc && vp install

vp run @ethercalc/worker#dev          # local worker (:8787)
docker compose -f tests/oracle/docker-compose.yml up -d   # legacy oracle (:8000)

vp run @ethercalc/oracle-harness#record   # record fixtures
# Replay requires the source-pinned, operator-token command in tests/oracle/README.md.
vp run @ethercalc/oracle-harness#replay --target http://127.0.0.1:8787

vp run @ethercalc/worker#test         # workers-pool + node unit tests

vp run verify:dafny                       # LemmaScript Dafny VCs (needs dafny)
vp run verify:lean                        # Lean gen + non-empty + fresh smoke
vp run verify:context && vp run verify:request   # Leanstral pack (sibling ../socialcalc)
```

## CI gates (PR)

Typecheck → node tests (100% coverage) → workers-pool → Playwright e2e →
`wrangler deploy --dry-run` → self-host smoke → conditional `mutation-gate`.
Parallel: LemmaScript Dafny check + Lean gen smoke
(`.github/workflows/lemmascript.yml`). Nightly: full Stryker matrix + oracle
replay against legacy docker + staging dry-run (`.github/workflows/nightly.yml`).
(Oracle replay is nightly-only, not a PR gate; Vite+ Oxlint is gated on every PR.)

## Package map

```
packages/worker/          Hono Worker + RoomDO
packages/socialcalc-headless/   SocialCalc in workerd
packages/shared/          WS messages, storage keys
packages/socketio-shim/   legacy /socket.io/* compat shim
packages/client/          single-sheet UI
packages/client-multi/    multi-sheet UI (React 19)
packages/oracle-harness/  record/replay + canonicalizers
packages/migrate/         Redis/filesystem → worker seed
packages/cli/             ethercalc CLI (bin/ethercalc)
packages/docs/            Starlight site
packages/e2e/             Playwright
lemma/                    LemmaScript facades + Leanstral pump (see lemma/README.md)
spikes/                   Immutable research provenance (not the maintained workflow)
```

## Live risks

1. **vitest-pool-workers config shape** — keep
   `packages/worker/vitest.config.ts` off `wrangler.configPath` (inline `main`
   + bindings); merging the wrangler config mangles the `[[rules]]` Text glob.
   The runtime `?raw` import is gone (SocialCalc is now a build-time
   `createSocialCalcFactory()`), but keep the `[[rules]]` entry for `wrangler
   deploy`.
2. **Docker Desktop macOS/ARM** — virtio networking may hang host curls;
   use `vp run @ethercalc/worker#dev` instead.
3. **workerd null bindings** — unset env vars arrive as `null`, not `''`.
4. **`ScheduleSheetCommands`** — headless uses sync `ExecuteSheetCommand`;
   no known gap yet.
5. **LemmaScript pump is not a product proof** — Dafny VCs cover the reduced
   integer facade only; string codecs, HTTP, and SocialCalc `coordToCr` are
   Bun-tested. Leanstral findings require execution checks before promotion.
   Do not co-prove EtherCalc 0-based facades against SocialCalc 1-based
   `lemma/a1` without an explicit 0↔1 shim. IEEE-754 `NaN`/`Infinity`/fractions
   are outside the Int model — Bun-test them. `verify:context` reads
   `../socialcalc/lemma/a1.{ts,dfy}` (clone
   [audreyt/socialcalc](https://github.com/audreyt/socialcalc) as sibling);
   EtherCalc-only clones still run Dafny/Lean and may use tracked context/request.

## Session log

Per-session history is in `docs/historic/REWRITE_ULTRAPLAN.md` §14 (append-only,
newest last). Latest: session-expiry fix and renewal. A hosted user lost
about a week of private-sheet edits: his 30-day passkey session expired in an
open tab, RoomDO closed the socket with 1008 "Session expired", and the client
silently queued edits in memory until the browser closed. #852 adds a
DOM-free client session guard (`session-guard.ts`, fed by a relative
`expiresInMs` from `/_auth/whoami`) that holds edits behind a banner with
in-place passkey sign-in two minutes before expiry, plus a beforeunload
warning while edits are queued. #853 adds AuthDO `POST /_auth/refresh-session`
(at most daily, exp = min(now+30d, auth+90d), revocation compares `auth`) and
a client socket roll at 24h. Three review-work rounds, CI 7/7, 100% coverage.
Production now runs `c169f863` = main@`4707a79` (10%, 50%, 100% on
2026-10-26, 0 5xx in the split); rollback target is `50d0e089`. Known
limits: the one edit that hits a revoked session is still lost (no ack on
execute frames), public-sheet users also see the expiring banner, and whoami
polling adds AuthDO load.
Prior: the 2026-08-10 operator runbook for upgrading production to `main`
(`docs/migration/PROD_UPGRADE_PLAN.md` plus companions). It found production
already had passkeys/`AuthDO`/ACL live, so the plan became one gradual ramp
with `AUTH="1"` throughout. That upgrade has since been carried out:
production moved on 2026-08-11 (version `50d0e089` = main@`fb5e284`) and
again on 2026-10-26. Take the current version from
`wrangler deployments list --env=""`.
