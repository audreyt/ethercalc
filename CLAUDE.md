# EtherCalc — Agent context

> **Status:** rewrite complete (2026-06-12) · **Owner:** Audrey Tang
>
> Slim agent doc. Full rewrite ultraplan archived at
> [`docs/historic/REWRITE_ULTRAPLAN.md`](./docs/historic/REWRITE_ULTRAPLAN.md).

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

Lint → typecheck → node tests (100% coverage) → workers-pool → oracle
replay → Playwright e2e → `wrangler deploy --dry-run` → self-host smoke →
conditional `mutation-gate`. Nightly: full Stryker matrix + oracle replay
against legacy docker + staging dry-run (`.github/workflows/nightly.yml`).

## Package map

```
packages/worker/          Hono Worker + RoomDO
packages/socialcalc-headless/   SocialCalc in workerd
packages/shared/          WS messages, storage keys
packages/client/          single-sheet UI
packages/client-multi/    multi-sheet UI (React 18)
packages/oracle-harness/  record/replay + canonicalizers
packages/migrate/         Redis/filesystem → worker seed
packages/docs/            Starlight site
packages/e2e/             Playwright
```

## Live risks

1. **Vite `?raw` vs wrangler `[[rules]]`** — vitest-pool-workers drops
   `wrangler.configPath` inline (see `packages/worker/vitest.config.ts`).
2. **Docker Desktop macOS/ARM** — virtio networking may hang host curls;
   use `bun run --cwd packages/worker dev` instead.
3. **workerd null bindings** — unset env vars arrive as `null`, not `''`.
4. **`ScheduleSheetCommands`** — headless uses sync `ExecuteSheetCommand`;
   no known gap yet.

## Session log

| Date | Summary |
| ---- | ------- |
| 2026-06-12 | Nightly fixes: oracle `last-modified` + ws snapshot matchers; mutation floors worker 90 / oracle-harness 83; nightly summary covers oracle + staging. CLAUDE.md slimmed; ultraplan → `docs/historic/`. Sandstorm publish doc (app-owner `spk`, not CI). |
| 2026-06-12 | Release 0.20260612.4 — SH-2/3 rate limit + room-create cap, Sandstorm SH-6/SH-7, proxy defaults. Nightly oracle-replay + staging dry-run added. Docs site + production deploy workflow. |
| 2026-06-11 | Self-host hardening (room-index gate, nginx proxy recipe, workerd image, Helm 0.3.1). Released 0.20260611.1. |
| 2026-04-19 | Rewrite landed — DO SocialCalc, native WS, exports, migrate tool, e2e, mutation ratchet. |

Older entries: `docs/historic/REWRITE_ULTRAPLAN.md` §14.