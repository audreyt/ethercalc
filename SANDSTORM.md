# Packaging EtherCalc for Sandstorm

Sandstorm packaging for the TypeScript EtherCalc rewrite lives on `main`
alongside the worker:

  - `sandstorm-pkgdef.capnp` — the Sandstorm package definition
    (Cap'n Proto), signed with the EtherCalc app ID
    `a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0`.
  - `DESCRIPTION.mkdn`, `CHANGELOG.mkdn` — App Market metadata embedded
    in the package definition.
  - `run_grain.sh` — the grain's boot script. Starts standalone
    `workerd` on port 33411 (the port sandstorm-http-bridge proxies),
    waits for `/_health`, then migrates any legacy `/var/dump*` content
    into the Worker's Durable Object storage on first boot.
  - `sandstorm-files.list` — runtime dependency list traced with
    `spk dev --proc`.

## Building the .spk

On a machine with Sandstorm + `spk` installed:

    # 1. Ensure Bun and Vite+ are available. run_grain.sh assumes
    #    `/usr/local/bin/bun`.
    curl -fsSL https://bun.sh/install | bash
    curl -fsSL https://vite.plus | bash
    export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
    sudo install -m 0755 "$HOME/.bun/bin/bun" /usr/local/bin/bun

    # 2. Install workspace deps (one-time).
    vp install

    # 3. Build the client assets and standalone worker bundle.
    vp run build:assets
    bash scripts/build-workerd-bundle.sh

    # 4. Generate sandstorm-files.list by tracing a dev-mode run.
    spk dev --proc
    # Create a grain, poke around, stop; spk will write the file list.

    # 5. Build the signed package.
    spk pack ethercalc.spk
    spk verify ethercalc.spk

The resulting `ethercalc.spk` is the upgrade artifact for Sandstorm's
app market listing.

## Who publishes the `.spk`?

EtherCalc's Sandstorm app ID
(`a0n6hwm32zjsrzes8gnjg734dh6jwt7x83xdgytspe761pe2asw0`) is its
public key. An upgrade for existing grains must be signed with the
matching private key; this repository has no signing credential. The
[maintained Sandstorm package](https://github.com/sandstorm-org/ethercalc-sandstorm)
has separate packaging and release infrastructure. Coordinate an App
Market update with its current maintainer and key holder.

The Sandstorm package smoke workflow builds and tests a temporary-ID
`.spk` on an x86_64 runner, then retains the test package as a short-lived
CI artifact. It does not create an update for the existing App Market
listing. That requires the original app-ID private signing key, which is
held outside this repository.

Release checklist on a machine with Sandstorm + `spk` + the app private key:

1. Prepare the release branch, including `appVersion` /
   `appMarketingVersion` in `sandstorm-pkgdef.capnp`.
2. Install the Linux runtime dependencies and build from that branch.
3. `vp run build:assets` and `bash scripts/build-workerd-bundle.sh`.
4. `spk dev --proc` to refresh `sandstorm-files.list`; exercise fresh
   and legacy grains, then review the generated file list.
5. `spk pack ethercalc.spk` and `spk verify ethercalc.spk`.
6. Upload the SPK to a test server and exercise the packaged grain,
   including a restart and a legacy-grain upgrade. Coordinate App
   Market submission with the maintainer who holds the signing key. Tag
   the tested source commit before publishing the other release channels.

If `spk pack` fails with a signing/keyring error, the private key is not
on that machine — recover it from your Sandstorm key backup or the
machine that originally ran `spk init`, not from this repository.

## Legacy-grain migration path

Before this release, Sandstorm's EtherCalc ran the LiveScript codebase
with `OPENSHIFT_DATA_DIR=/var` and no Redis. Per-grain state lived in:

  - `/var/dump.json` — single-blob JSON, older layout.
  - `/var/dump/snapshot-<room>.txt` + `/var/dump/audit-<room>.txt` —
    directory layout, with `\\n`/`\\r`/`\\\\`-escaped audit lines.

On the first boot after upgrade, `run_grain.sh` detects either layout
and pipes it through `ethercalc migrate --source file:///var…` with a
temporary bearer. This is idempotent — re-running would just
overwrite each room with the same value — but we drop a
`/var/.migrated` sentinel to avoid paying the per-boot probe cost.

The grain root opens `/=sheet`: `sheet` is the workbook table-of-contents
room and its links identify the worksheet rooms (legacy grains normally use
`sheet1` for the first tab). Rewrite releases before issue #838 instead opened
`/sheet1` directly, hiding the tab bar. The root handler now classifies the
configured `sheet` room: migrated TOCs and fresh grains open with tabs. If
`sheet` is absent but a rewrite-era `sheet1` room exists, the root falls back
to `/sheet1` so the upgrade never hides user data.

What carries over:

  - Directory layout → snapshots + audit logs (legacy keeps only these
    on disk; log/chat/ecell are in-memory only and lost across any
    Redis-unavailable restart).
  - JSON blob layout → everything (snapshots, logs, audit, chat, ecell,
    timestamps).

What does not carry over (either layout):

  - Cron triggers (`cron-list`, `cron-nextTriggerTime` — in-memory only
    in legacy).
  - socket.io session IDs (transport detail, not user data).

If `run_grain.sh` reports a migration failure, it does NOT drop the
sentinel, so the next grain boot retries. Check the grain log.

## Worker runtime inside the grain: standalone workerd

The grain runs `workerd` directly rather than `wrangler dev` +
Miniflare. Wrangler and Miniflare both make an outbound HTTP call to
`workers.cloudflare.com` during `setupCf` to fetch metadata; Sandstorm
grains have **no outbound network by default**, so that fetch hangs
and aborts with `Unexpected server response: 101` before the worker
ever binds to :33411. `workerd serve` skips that dance entirely — it
just loads the pre-bundled worker, the DO/asset configuration, and
listens.

### The bundle

`scripts/build-workerd-bundle.sh` produces a self-contained tree at
`packages/worker/workerd/`:

  - `config.capnp`  — Cap'n Proto config checked in; declares the
                       worker, bindings, DO namespace, HTTP socket.
  - `worker/index.js` — bundled worker (built by
                       `wrangler deploy --dry-run --outdir=…`).
  - `assets/`       — symlink to the repo-root `assets/` tree
                       (re-pointed at runtime via `-dassets=`).
  - `do-storage/`   — empty dir; workerd creates per-DO SQLite files
                       (re-pointed at runtime via `-ddo=`).

`run_grain.sh` finds the `workerd` binary under `node_modules/` (the
`@cloudflare/workerd-linux-64` package ships it), then runs:

```
workerd serve packages/worker/workerd/config.capnp \
    -ddo=/var/do-storage \
    -dassets=./assets
```

### Live-verified on a real Sandstorm grain (2026-04-22)

End-to-end upgrade test against `apps.sandstorm.io` legacy
v2017.02.21.0 on Ubuntu 24.04 x86_64:

  1. Legacy grain boots, writes `/var/dump.json` with cells
     `A1=HELLO-FROM-LEGACY-2017`, `B1=42`, `C1=preserve-me`, 3 log
     entries, 3 audit entries, 1 chat, 1 ecell, timestamps.
  2. `spk dev` swaps in the new app. Legacy grain is torn down;
     Sandstorm starts a fresh supervisor against the new pkgdef.
  3. New `run_grain.sh` boots workerd on :33411, hits `/_health` in
     <1s, detects `/var/dump.json`, invokes `ethercalc migrate`.
  4. Migrator seeds the worker's Durable Object storage:
     `migrated 1 rooms (1 snapshots, 3 log, 3 audit, 1 chat, 1 ecell)`.
  5. `/var/.migrated` sentinel dropped.
  6. Verified via `curl /_/sheet1` inside the grain's network
     namespace: all three cells preserved in the returned SocialCalc
     save. DO storage at `/var/do-storage/<uniqueKey>/<objId>.sqlite`
     contains `audit:`, `chat:`, `ecell:`, `log:`, `snapshot`, and
     `meta:updated_at` entries.

### Grain sandbox env vars (applied in run_grain.sh)

  - `HOME=/var/home` — the `bun bin/ethercalc migrate` step still
                        uses `bunx wrangler` under the hood for the
                        CF-less `--dry-run` bundle build path, which
                        calls `os.homedir()`. Set early so nothing
                        ENOENTs.
  - `TMPDIR=/var/tmp` — grain-writable temp, used by bun when running
                        the migrate CLI.

`spk dev --proc` mounts `/proc` during development, which Bun may need.
Packaged grains do not get `/proc`; test the installed SPK, including a
legacy-grain upgrade, before publishing it.

## Grain-local migrate token

When a grain contains legacy data, `run_grain.sh` creates a fresh bearer
for that migration attempt and gives it to the temporary worker and
migrator. The worker accepts the bearer on migration routes during that
attempt. Normal grain operation starts without a migration bearer, so
the seed routes are disabled.
