#!/usr/bin/env bash
# Curated asset builder (Phase 4.1 / 11-assets).
#
# Regenerates `assets/` at the repo root from its sources. Deterministic
# and idempotent: the script always reproduces the same tree given the
# same inputs. Committing `assets/` itself is avoided — it's listed in
# `.gitignore` — because it contains built JS that goes stale; the
# script is committed, and CI runs it before `wrangler deploy --dry-run`.
#
# Inputs:
#   - Repo-root static files (index.html, start.html, panels.html, icons,
#     manifest.appcache, manifest.json, l10n/*.json) — preserved from the
#     legacy server and referenced by the client JS.
#   - `node_modules/socialcalc/dist/SocialCalc.js` — vendored via the
#     `socialcalc` npm dep pinned in `packages/socialcalc-headless`.
#   - `packages/client/dist/player.js` — vite build output of the
#     single-sheet client.
#   - `packages/client-multi/dist/` — vite build output of the multi-
#     sheet React app (Radix tabs + Foldr), served under `/multi/`.
#
# A `wrangler deploy` or `wrangler deploy --dry-run` must be preceded by
# `bun run --cwd packages/client build` and
# `bun run --cwd packages/client-multi build`; this script assumes both
# `dist/` dirs exist.
#
# Outputs land at `$ROOT/assets/` with the following layout:
#
#   assets/
#     index.html
#     start.html
#     panels.html
#     favicon.ico  favicon-16x16.png  favicon-32x32.png
#     android-chrome-192x192.png  apple-touch-icon.png
#     mstile-150x150.png  mstile-310x310.png
#     browserconfig.xml  manifest.json  manifest.appcache
#     safari-pinned-tab.svg
#     l10n/{en,de,es-ES,fr,ru-RU,zh-CN,zh-TW}.json
#     static/socialcalc.js   (from node_modules/socialcalc/dist/SocialCalc.js)
#     static/player.js       (from packages/client/dist/player.js)
#     multi/…                (copied whole tree from packages/client-multi/dist)
#
# Deliberately NOT copied: `robots.txt` (we serve a minimal bespoke version
# in the worker if ever needed), `node_modules/`, `.git/`, `src/`,
# anything compiled from LiveScript.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$ROOT/assets"

# Under bun workspaces the `socialcalc` package is hoisted to the
# per-package node_modules of `socialcalc-headless` (it's the only
# workspace that lists it). Fall back to the root node_modules for
# non-workspace installs.
if [ -f "$ROOT/packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js" ]; then
  SOCIALCALC_JS="$ROOT/packages/socialcalc-headless/node_modules/socialcalc/dist/SocialCalc.js"
else
  SOCIALCALC_JS="$ROOT/node_modules/socialcalc/dist/SocialCalc.js"
fi
PLAYER_JS="$ROOT/packages/client/dist/player.js"
MULTI_DIST="$ROOT/packages/client-multi/dist"

die() { echo "[build-assets] FAIL: $*" >&2; exit 1; }

[ -f "$SOCIALCALC_JS" ] || die "missing $SOCIALCALC_JS (run \`bun install\`)"
[ -f "$PLAYER_JS" ]     || die "missing $PLAYER_JS (run \`bun run --cwd packages/client build\`)"
[ -d "$MULTI_DIST" ]    || die "missing $MULTI_DIST (run \`bun run --cwd packages/client-multi build\`)"

echo "[build-assets] rebuilding $DEST"
rm -rf "$DEST"
mkdir -p "$DEST/l10n" "$DEST/static" "$DEST/multi"

# HTML entry pages.
cp "$ROOT/index.html"  "$DEST/index.html"
cp "$ROOT/start.html"  "$DEST/start.html"
cp "$ROOT/panels.html" "$DEST/panels.html"

# Icon / PWA family (10 files per CLAUDE.md §6.1 list).
for f in favicon.ico favicon-16x16.png favicon-32x32.png \
         android-chrome-192x192.png apple-touch-icon.png \
         mstile-150x150.png mstile-310x310.png \
         safari-pinned-tab.svg browserconfig.xml manifest.json; do
  cp "$ROOT/$f" "$DEST/$f"
done

# Application-cache manifest (static copy; DevMode dynamic stub is served
# by the worker route at runtime — see packages/worker/src/routes/assets.ts).
cp "$ROOT/manifest.appcache" "$DEST/manifest.appcache"

# i18n (CLAUDE.md §7 item 24). Seven locales; regex fallback logic lives
# in index.html's inline loader, untouched.
for f in en de es-ES fr ru-RU zh-CN zh-TW; do
  cp "$ROOT/l10n/$f.json" "$DEST/l10n/$f.json"
done

# SocialCalc runtime — served at /static/socialcalc.js (§13 Q8).
cp "$SOCIALCALC_JS" "$DEST/static/socialcalc.js"

# Built single-sheet client — served at /static/player.js.
cp "$PLAYER_JS" "$DEST/static/player.js"

# Multi-sheet React app — whole dist tree mounted under /multi.
cp -R "$MULTI_DIST/." "$DEST/multi/"

# Report summary.
TOTAL_BYTES="$(find "$DEST" -type f -exec wc -c {} + | awk 'END { print $1 }')"
TOTAL_COUNT="$(find "$DEST" -type f | wc -l | tr -d ' ')"
echo "[build-assets] wrote $TOTAL_COUNT files, $TOTAL_BYTES bytes"
