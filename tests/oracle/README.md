# Oracle harness

The **oracle** is the current `main` branch of EtherCalc (legacy LiveScript
on zappajs, Redis-backed) running in Docker. The TypeScript rewrite is
proven equivalent by recording oracle responses to a scenario set, then
replaying those same scenarios against the new worker and diffing.

See `CLAUDE.md` §4 for the why and §6.1/§6.2/§6.3 for what we're recording.

## Layout

```
tests/oracle/
  docker-compose.yml    # redis + ethercalc (pinned SHA)
  Dockerfile.oracle     # bun-based oracle image
  recorded/             # JSON artifacts, one per scenario
  FINDINGS.md           # running log of oracle quirks discovered here
  README.md             # this file

packages/oracle-harness/
  src/scenarios/        # scenario definitions (pure data)
  src/record.ts         # hits oracle, writes tests/oracle/recorded/
  src/replay.ts         # re-hits target URL, asserts vs recorded/
  src/matchers.ts       # body comparators: exact, json, scsave, ignore
  src/normalize.ts      # per-scenario post-record header rewrites
  src/cli.ts            # `record` / `replay` subcommands
```

## Bring up the oracle

```bash
docker compose -f tests/oracle/docker-compose.yml up --build -d
curl -s http://127.0.0.1:8000/_rooms       # → []
docker compose -f tests/oracle/docker-compose.yml logs ethercalc
```

Pinned SHA is `042b731d9e98f1d30537e6cb656f65792afdecdf` (last legacy
commit on `origin/main` before the Phase 1-2 rewrite scaffolding). The
oracle clones that SHA into the container on build. Bump it in
`docker-compose.yml` (`ORACLE_SHA` build-arg) whenever upstream moves;
re-record every scenario after you do.

Tear down:

```bash
docker compose -f tests/oracle/docker-compose.yml down -v
```

## Record scenarios

```bash
bun run --cwd packages/oracle-harness record \
  --target http://127.0.0.1:8000 \
  --out tests/oracle/recorded
```

Each scenario writes to `tests/oracle/recorded/<name>.json`. Commit
those alongside the scenario source in `packages/oracle-harness/src/scenarios/`.

When adding a new scenario:

1. Add a `const` to the appropriate family file (`static.ts`, `misc.ts`,
   `rooms-index.ts`, or a new file if a new family emerges).
2. Export it from the family's `SCENARIOS` array and from
   `scenarios/index.ts`.
3. Re-record (`bun run record`).
4. Inspect `recorded/<name>.json`. If the response embeds a UUID /
   timestamp, register a `NormalizeHook` in `src/normalize.ts` that
   rewrites volatile headers to `re:`-prefixed regex patterns.

## Replay against the new worker

```bash
# Terminal 1 — new worker (Phase 4+).
bun run --cwd packages/worker dev

# Terminal 2 — diff it against recordings.
bun run --cwd packages/oracle-harness replay \
  --target http://127.0.0.1:8787 \
  --recorded tests/oracle/recorded
```

Replay asserts status, non-volatile headers, and the body per the
recorded `bodyMatcher` (`exact` / `json` / `scsave` / `ignore`; the
structural HTML / XLSX / ODS matchers fire `not implemented — Phase 8`
until we wire them up).

## Sanity check

Replay against the oracle itself should always pass — it's the
round-trip that validates a recording session:

```bash
bun run --cwd packages/oracle-harness replay \
  --target http://127.0.0.1:8000 \
  --recorded tests/oracle/recorded
```

Output line `replay: N/N passed` confirms the golden set is internally
consistent.
