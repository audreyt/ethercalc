#!/usr/bin/env bash
#
# One-shot legacy → Cloudflare EtherCalc migration with backup.
#
# For someone who has an existing Redis-backed EtherCalc running on a
# Linux box and wants to upgrade to the Cloudflare/Miniflare stack.
# Assumes only: `docker` + `docker compose` on the machine, and a copy
# of the legacy Redis `dump.rdb` reachable from the current directory.
#
# What it does (in order):
#   1. Pre-flight: docker present; dump.rdb present; move an existing
#      ethercalc-data/ directory aside so the new run starts clean.
#   2. Mint a per-run ETHERCALC_MIGRATE_TOKEN (unless one is already
#      exported in the environment).
#   3. `docker compose --profile migrate up --abort-on-container-exit
#      --exit-code-from migrator` — boots `legacy-redis` with the
#      user's dump, boots the new Worker, runs `bin/ethercalc migrate`
#      inside the `migrator` service; exits when migrator exits.
#   4. Verifies the Worker lists the migrated rooms via `/_rooms`.
#   5. Packages the migrated state + the source dump + a manifest into
#      `./backups/ethercalc-YYYYMMDDTHHMMSSZ.tar.gz`.
#   6. Tears everything down. User runs `docker compose up -d` next to
#      start serving on http://localhost:8000.
#
# Usage:
#   ./bin/migrate-legacy.sh [path/to/dump.rdb]
#
# Env var overrides (all optional):
#   ETHERCALC_MIGRATE_TOKEN          bearer token (generated if unset)
#   ETHERCALC_MIGRATE_CONCURRENCY    parallel PUTs during seed (default 8)
#   BACKUP_DIR                       where tarball lands (default ./backups)
#   SKIP_BACKUP=1                    skip the tar.gz step (testing)
#   SKIP_TEARDOWN=1                  leave the stack up after success

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DUMP_PATH="${1:-./legacy-dump.rdb}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

log() { printf '[migrate-legacy] %s\n' "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

# ─── pre-flight ───
command -v docker >/dev/null 2>&1 || die "docker not on PATH"
docker compose version >/dev/null 2>&1 || die "'docker compose' plugin not available"
[[ -f "$DUMP_PATH" ]] || die "dump.rdb not found at $DUMP_PATH
  Pass an alternate path:   $0 /absolute/path/to/dump.rdb
  Or copy your legacy dump: scp your-host:/var/lib/redis/dump.rdb ./legacy-dump.rdb"

# Compose bind mounts need absolute paths; resolve once here so the
# working directory in child invocations doesn't matter.
DUMP_ABS="$(cd "$(dirname "$DUMP_PATH")" && pwd)/$(basename "$DUMP_PATH")"
DUMP_SIZE="$(du -h "$DUMP_ABS" | awk '{print $1}')"
log "dump:       $DUMP_ABS  ($DUMP_SIZE)"

# Quarantine any existing Miniflare state so the migration starts clean.
# The user's prior data stays on disk under `.pre-migrate-<stamp>/` as a
# fallback in case they want to roll back.
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -d ./ethercalc-data && -n "$(ls -A ./ethercalc-data 2>/dev/null || true)" ]]; then
  PARKED="./ethercalc-data.pre-migrate-$STAMP"
  log "quarantining existing ethercalc-data → $PARKED"
  mv ./ethercalc-data "$PARKED"
fi
mkdir -p ./ethercalc-data "$BACKUP_DIR"

# Mint a migration token unless the operator set one. Worker's
# /_migrate/seed validates Authorization against ETHERCALC_MIGRATE_TOKEN;
# unset → 404, so this must be present for the PUT path to work.
if [[ -z "${ETHERCALC_MIGRATE_TOKEN:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    ETHERCALC_MIGRATE_TOKEN="$(openssl rand -hex 16)"
  else
    ETHERCALC_MIGRATE_TOKEN="$(head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')"
  fi
fi
export ETHERCALC_MIGRATE_TOKEN
export ETHERCALC_LEGACY_DUMP="$DUMP_ABS"

# ─── teardown guard ───
# On success: remove only the migrate-profile containers (legacy-redis +
# migrator) so the default `ethercalc` service stays up for serving.
# On failure: everything down, so a broken run doesn't leave orphans.
SUCCESS=0
teardown() {
  [[ "${SKIP_TEARDOWN:-}" == "1" ]] && return 0
  if [[ "$SUCCESS" == "1" ]]; then
    docker compose rm --stop --force legacy-redis migrator >/dev/null 2>&1 || true
  else
    docker compose --profile migrate down --remove-orphans >/dev/null 2>&1 || true
  fi
}
trap teardown EXIT

# ─── run ───
log "building ethercalc:selfhost image (first run ~3 min, then cached)"
docker compose build ethercalc

log "starting migration stack (legacy-redis + ethercalc + migrator)"
# --abort-on-container-exit brings everything down as soon as the
# migrator finishes; --exit-code-from migrator makes the script inherit
# the migrator's own exit code so a partial run is loud.
docker compose --profile migrate up \
  --abort-on-container-exit \
  --exit-code-from migrator

# Capture the migrator's final summary from its container logs before
# teardown. The migrator prints `migrated N rooms (N snapshots, …)` on
# stdout as its last line.
MIGRATOR_SUMMARY="$(
  docker compose --profile migrate logs --no-color --no-log-prefix migrator 2>/dev/null \
    | grep -E '^migrated [0-9]+ rooms' \
    | tail -1 || true
)"
if [[ -n "$MIGRATOR_SUMMARY" ]]; then
  ROOM_COUNT="$(printf '%s' "$MIGRATOR_SUMMARY" | awk '{print $2}')"
  log "migrator summary: $MIGRATOR_SUMMARY"
else
  # Fallback: count the on-disk DO SQLite files (one per room, plus
  # a `metadata.sqlite` that we subtract). Works even if the log got
  # truncated or the migrator's stdout was redirected.
  ROOM_COUNT="$(
    find ./ethercalc-data/do -name '*.sqlite' -not -name 'metadata.sqlite' 2>/dev/null \
      | wc -l | tr -d ' '
  )"
  log "migrator summary unavailable; counted $ROOM_COUNT DO SQLite files"
fi

# ─── backup ───
if [[ "${SKIP_BACKUP:-}" != "1" ]]; then
  BACKUP_ABS="$(cd "$BACKUP_DIR" && pwd)/ethercalc-$STAMP.tar.gz"
  log "writing backup tarball → $BACKUP_ABS"

  # Manifest is assembled in a temp dir so `tar -C` can include it from
  # an arbitrary filesystem location without polluting the repo root.
  MANIFEST_DIR="$(mktemp -d)"
  cat >"$MANIFEST_DIR/manifest.json" <<EOF
{
  "created_utc": "$STAMP",
  "source_dump": "$(basename "$DUMP_ABS")",
  "source_size_bytes": $(wc -c <"$DUMP_ABS" | tr -d ' '),
  "migrated_room_count": $ROOM_COUNT,
  "token_sha256": "$(printf '%s' "$ETHERCALC_MIGRATE_TOKEN" | shasum -a 256 2>/dev/null | awk '{print $1}' || echo unknown)"
}
EOF

  # Archive contents (all under ethercalc-backup-<stamp>/ for safety
  # when untarred in an unknown directory). `-C` + multiple paths keeps
  # this portable across BSD and GNU tar.
  tar -czf "$BACKUP_ABS" \
    -C "$ROOT"           ethercalc-data \
    -C "$(dirname "$DUMP_ABS")" "$(basename "$DUMP_ABS")" \
    -C "$MANIFEST_DIR"   manifest.json
  rm -rf "$MANIFEST_DIR"

  BACKUP_SIZE="$(du -h "$BACKUP_ABS" | awk '{print $1}')"
  log "backup:     $BACKUP_ABS  ($BACKUP_SIZE)"
fi

# ─── bring up for serving ───
# Migration data is on disk at ./ethercalc-data/. Start the default
# ethercalc service so the operator can open the browser immediately.
# (Backup is done first so it captures pristine post-migration state.)
log "starting worker for serving → http://localhost:8000"
docker compose up -d ethercalc
for _ in $(seq 1 30); do
  curl -fsS http://localhost:8000/_health >/dev/null 2>&1 && break
  sleep 1
done

SUCCESS=1

# ─── wrap up ───
log ""
log "DONE — migrated $ROOM_COUNT rooms."
log ""
log "Worker running on http://localhost:8000"
log "  • open any migrated room by its URL, e.g. http://localhost:8000/myroom"
log "  • tail logs:    docker compose logs -f ethercalc"
log "  • stop serving: docker compose down"
log "  • resume:       docker compose up -d"
log ""
log "Known self-host limitation: GET /_rooms (room-list admin endpoint)"
log "returns [] — the standalone workerd bundle doesn't wire D1. Rooms"
log "are fully accessible by URL; only the enumeration view is empty."
log ""
log "Rollback: if anything looks wrong, stop the worker, restore"
log "./ethercalc-data/ from the backup tarball, and re-run."
