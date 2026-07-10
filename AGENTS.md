# EtherCalc — Agent context

> **Status:** rewrite complete · **Owner:** Audrey Tang · doc updated 2026-07-10
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
| Oracle replay | `tests/oracle/README.md` · `packages/oracle-harness/` |
| Mutation baselines | `docs/MUTATION_REPORT.md` |
| Sandstorm `.spk` | `SANDSTORM.md` (manual `spk pack` — app owner signs) |
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

## Runbook

```bash
git clone https://github.com/audreyt/ethercalc
cd ethercalc && bun install

bun run --cwd packages/worker dev          # local worker (:8787)
docker compose -f tests/oracle/docker-compose.yml up -d   # legacy oracle (:8000)

bun run --cwd packages/oracle-harness record   # record fixtures
bun run --cwd packages/oracle-harness replay --target http://127.0.0.1:8787

bun run --cwd packages/worker test         # workers-pool + node unit tests
```

## CI gates (PR)

Typecheck → node tests (100% coverage) → workers-pool → Playwright e2e →
`wrangler deploy --dry-run` → self-host smoke → conditional `mutation-gate`.
Nightly: full Stryker matrix + oracle replay against legacy docker + staging
dry-run (`.github/workflows/nightly.yml`). (Oracle replay is nightly-only,
not a PR gate; Biome lint is gated on every PR.)

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
```

## Live risks

1. **vitest-pool-workers config shape** — keep
   `packages/worker/vitest.config.ts` off `wrangler.configPath` (inline `main`
   + bindings); merging the wrangler config mangles the `[[rules]]` Text glob.
   The runtime `?raw` import is gone (SocialCalc is now a build-time
   `createSocialCalcFactory()`), but keep the `[[rules]]` entry for `wrangler
   deploy`.
2. **Docker Desktop macOS/ARM** — virtio networking may hang host curls;
   use `bun run --cwd packages/worker dev` instead.
3. **workerd null bindings** — unset env vars arrive as `null`, not `''`.
4. **`ScheduleSheetCommands`** — headless uses sync `ExecuteSheetCommand`;
   no known gap yet.

## Session log

Per-session history is in `docs/historic/REWRITE_ULTRAPLAN.md` §14 (append-only,
newest last). Latest: hosted per-room PITR restore landed — operator API
`POST /_/:room/pitr-restore` (Bearer `ETHERCALC_MIGRATE_TOKEN`, 404 when
unset) with dry-run, undo bookmarks, D1/alarm finalization, and JSON
partial-failure contract; staging smoke proved restore + undo end to end.