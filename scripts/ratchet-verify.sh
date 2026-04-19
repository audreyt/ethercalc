#!/usr/bin/env bash
#
# ratchet-verify.sh — Local-dev mutation-ratchet audit.
#
# For each package with a stryker.conf.json:
#   1. Run `bun run --cwd packages/<pkg> mutation`.
#   2. Parse the JSON report at packages/<pkg>/reports/mutation/mutation.json.
#   3. Compare the measured score against the `break` threshold in the
#      package's stryker.conf.json.
#   4. Print a per-package diff row: measured, floor, delta, status.
#
# Exit status:
#   0 — all packages meet or exceed their `break` floor.
#   1 — at least one package dropped below `break` (a regression).
#   2 — one or more mutation runs failed / produced no report.
#
# Not part of CI; this is the script you run locally before filing a
# ratchet PR. See docs/MUTATION_REPORT.md → "Ratcheting the baseline".
#
# Usage:
#   scripts/ratchet-verify.sh                # all packages
#   scripts/ratchet-verify.sh shared worker  # subset

set -u -o pipefail

# Resolve repo root regardless of where the script is invoked from.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Packages to audit. Can be overridden via argv.
if [ $# -gt 0 ]; then
  PACKAGES=("$@")
else
  PACKAGES=(shared socketio-shim migrate oracle-harness client worker)
fi

# ANSI helpers — plain if stdout isn't a TTY (e.g. piped to a file).
if [ -t 1 ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; DIM=""; RESET=""
fi

header() {
  printf '\n%s═══ %s ═══%s\n' "$DIM" "$1" "$RESET"
}

# jq is typical on dev machines; fall back to node JSON parse if absent.
read_score() {
  local json="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r '.. | .mutationScore? // empty' "$json" | head -n1
  else
    node -e "const d=require('$json'); const s=d.mutationScore ?? (d.summary && d.summary.mutationScore); process.stdout.write(String(s ?? ''));"
  fi
}

read_break() {
  local conf="$1"
  if command -v jq >/dev/null 2>&1; then
    jq -r '.thresholds.break' "$conf"
  else
    node -e "const d=require('$conf'); process.stdout.write(String(d.thresholds.break));"
  fi
}

exit_code=0
fail_pkgs=()
drop_pkgs=()
up_pkgs=()

printf '%-16s %8s %8s %8s %s\n' "package" "measured" "break" "delta" "status"
printf '%-16s %8s %8s %8s %s\n' "───────" "────────" "─────" "─────" "──────"

for pkg in "${PACKAGES[@]}"; do
  conf="packages/$pkg/stryker.conf.json"
  report="packages/$pkg/reports/mutation/mutation.json"
  if [ ! -f "$conf" ]; then
    printf '%-16s %8s %8s %8s %s\n' "$pkg" "-" "-" "-" "${YELLOW}no config${RESET}"
    continue
  fi

  header "mutation — $pkg"
  if ! bun run --cwd "packages/$pkg" mutation; then
    fail_pkgs+=("$pkg")
    printf '%-16s %8s %8s %8s %s\n' "$pkg" "-" "-" "-" "${RED}run failed${RESET}"
    exit_code=2
    continue
  fi

  if [ ! -f "$report" ]; then
    fail_pkgs+=("$pkg")
    printf '%-16s %8s %8s %8s %s\n' "$pkg" "-" "-" "-" "${RED}no report${RESET}"
    exit_code=2
    continue
  fi

  score="$(read_score "$report" || echo "")"
  floor="$(read_break "$conf" || echo "")"
  if [ -z "$score" ] || [ -z "$floor" ]; then
    fail_pkgs+=("$pkg")
    printf '%-16s %8s %8s %8s %s\n' "$pkg" "${score:-?}" "${floor:-?}" "?" "${RED}parse error${RESET}"
    exit_code=2
    continue
  fi

  # Bash math can't do floats; use awk for the delta.
  delta="$(awk -v s="$score" -v f="$floor" 'BEGIN{printf "%+.2f", s - f}')"
  if awk -v s="$score" -v f="$floor" 'BEGIN{exit !(s < f)}'; then
    drop_pkgs+=("$pkg")
    status="${RED}REGRESSED${RESET}"
    [ $exit_code -eq 0 ] && exit_code=1
  elif awk -v s="$score" -v f="$floor" 'BEGIN{exit !(s >= f + 1)}'; then
    up_pkgs+=("$pkg")
    status="${GREEN}RATCHET READY (raise break → $(awk -v s="$score" 'BEGIN{printf "%d", int(s)}'))${RESET}"
  else
    status="${GREEN}ok${RESET}"
  fi
  printf '%-16s %8s %8s %8s %s\n' "$pkg" "$score" "$floor" "$delta" "$status"
done

echo
if [ ${#drop_pkgs[@]} -gt 0 ]; then
  printf '%s%d package(s) regressed: %s%s\n' "$RED" "${#drop_pkgs[@]}" "${drop_pkgs[*]}" "$RESET"
fi
if [ ${#up_pkgs[@]} -gt 0 ]; then
  printf '%s%d package(s) ready to ratchet: %s%s\n' "$GREEN" "${#up_pkgs[@]}" "${up_pkgs[*]}" "$RESET"
  echo "Follow docs/MUTATION_REPORT.md → 'Workflow to raise break' for each."
fi
if [ ${#fail_pkgs[@]} -gt 0 ]; then
  printf '%s%d package(s) failed to produce a report: %s%s\n' "$RED" "${#fail_pkgs[@]}" "${fail_pkgs[*]}" "$RESET"
fi

exit $exit_code
