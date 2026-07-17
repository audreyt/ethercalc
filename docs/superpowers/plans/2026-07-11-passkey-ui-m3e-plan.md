# Passkey UI on M3E — Phase 1 Implementation Plan

Executes `docs/superpowers/specs/2026-07-11-passkey-ui-m3e-design.md`
(read that first — this plan doesn't repeat the *why*, only the *what*).
Inline execution (tasks are tightly sequenced: `logic.ts` must exist
before `ui.ts`, the Vite config before anything is testable, the markup
changes depend on the build's real output filenames).

## Task 1 — Dependencies

`packages/client/package.json`: add `@m3e/web`, `lit`, `tslib` as
`dependencies`; add `@m3e/icons` as a `dependency` (used for exactly two
icons per the design — lock, key). Run `bun install`. Confirm exact
`@m3e/icons` subpath import convention from its published `exports` map
before wiring any icon import (design flagged this as unverified).

## Task 2 — `vite.passkey.config.ts` + build script

New `packages/client/vite.passkey.config.ts`: separate config (Vite's
`outDir` is build-wide, can't share `vite.config.ts`'s single-file-output
setup). `outDir: 'dist-passkey'`, `emptyOutDir: true`, input
`src/passkey/ui.ts`, ESM output, `target: 'es2022'`. Pin
`entryFileNames: 'ui.js'` (same reason `vite.config.ts` pins `player.js`
for its entry: `index.html`/`start.html` are plain static HTML, not
Vite-built entries, so their `<script src>` must be a stable path known
at design time — a real build confirmed Vite's default naming is
content-hashed, e.g. `dist-passkey/assets/ui-DT5s7B6u.js`, which static
HTML can never reference). Leave `chunkFileNames` unpinned and let
`build-assets.ts` copy the whole output directory (Task 8) — covers any
extra file Rollup emits (`@m3e/web` chunk-splitting is unverified)
without needing to know its name, since only the pinned entry is
referenced by name from static HTML.

`package.json` scripts: add `"build:passkey": "vite build --config vite.passkey.config.ts"`.
`"build"` script (if one exists at this package level) or the root
`build:clients` script runs both `vite build` and `vite build --config vite.passkey.config.ts`.

## Task 3 — `packages/client/src/passkey/logic.ts` (TDD)

Pure, DOM-free port of the current `static/passkey.js`'s non-DOM
functions: `whoami()`, `roomAccess(room)` (fetch + three-boolean-field
validation), `currentRoom(pathname)` (path parsing), `enc`
(base64url helpers for WebAuthn), `login()`/`register()`/`signIn()`/
`logout()` (WebAuthn ceremonies — these touch `navigator.credentials`
but not the DOM, so they belong here), `newPrivateSheet()`/
`copyToPrivate()`/`roomEditLocation()`. Also a pure mount-decision
function: given `{state, verdict}` → one of
`'public' | 'private-owner-writable' | 'private-readable-viewonly' | 'private-denied' | 'landing'`.
**Never imports `@m3e/web/*`.**

Write `packages/client/test/passkey-logic.test.ts` first (TDD red), one
`describe` per function, mirroring `boot.test.ts`'s injected-`fetch`
style. Add this file to `vitest.config.ts`'s coverage `include` array
alongside the existing five files (100% gate applies the same way).
Run red, then implement `logic.ts`, run green.

## Task 4 — `packages/client/src/passkey/ui.ts`

Browser-only. Imports (only what's used, never `@m3e/web/all`):
`@m3e/web/theme`, `@m3e/web/toolbar`, `@m3e/web/button`, `@m3e/web/menu`,
`@m3e/web/dialog`, `@m3e/web/bottom-sheet`, `@m3e/web/snackbar`,
`@m3e/web/card`, `@m3e/web/icon`, two `@m3e/icons/<style>/<name>`
subpaths (lock, key — confirm exact names against Material Symbols'
catalog).

Verified component API (source: matraic.github.io/m3e/components/*):

- **Dialog**: build `<m3e-dialog dismissible>` imperatively (no
  `m3e-dialog-trigger` — opened from JS via `.show()`), header slot for
  title, default slot for body/status text, `actions` slot with plain
  `m3e-button`s (NOT `m3e-dialog-action` — confirmed from source:
  `m3e-dialog-action`'s click handler unconditionally calls
  `closest('m3e-dialog').hide(...)`, which would close the dialog
  before a cancelled/failed WebAuthn ceremony could show its required
  retry state; call `dialog.hide()` manually, only after success).
  Bind cleanup to the `closed` event (fires on every dismissal path),
  per the design's `Keyboard.passThru` note — not needed for the
  passkey dialogs themselves (they don't touch `Keyboard.passThru`;
  only the vex-swap dialog in Task 6 does).
- **Menu**: `m3e-menu-trigger for="ec-account-menu"` nested inside the
  `m3e-button` account trigger; `m3e-menu id="ec-account-menu"` containing
  two `m3e-menu-item` (New private sheet, Sign out).
- **Bottom sheet**: `m3e-bottom-sheet modal`, content wrapped in
  `m3e-action-list` > `m3e-list-action` > `m3e-bottom-sheet-action`
  per-item (the docs' documented content pattern — not a bare button
  list).
- **Snackbar**: `M3eSnackbar.open(message)` — no action/dismiss needed,
  matching the current best-effort `showNotice()` behavior.
- **Card**: `m3e-card` with `header`/`content`(default? confirm slot
  name)/`actions` slots for the private gate.
- **Toolbar**: `m3e-toolbar` as the `#ec-room-access` host, containing
  the summary text + `m3e-button`s + the account menu's trigger button +
  a trailing "More actions" `m3e-button` opening the bottom sheet.
- **Theme**: `<m3e-theme color="#0c3159" scheme="light" variant="expressive" motion="expressive">`
  — this element lives in HTML markup (Task 5), not constructed by
  `ui.ts`; `ui.ts` only needs to `import "@m3e/web/theme"` so it
  registers.

Mounting logic (`mountRoomAccess`, `mountPrivateGate`, `mountLandingActions`,
dialog/menu/sheet builders) is a straight rebuild of the current
`static/passkey.js` functions using the components above instead of
plain elements, consuming `logic.ts`'s pure functions. Preserve
unchanged: the `firstChild === spreadsheet.editorDiv` control-vs-viewer
detection, never re-running `CalculateSheetNonViewHeight` post-init, the
`ec-socialcalc-tabbar`/`ec-socialcalc-toolbar` semantic-class
stabilization. **New**: the height-delta measurement
(`resizeForAccessRow` equivalent) must `await customElements.whenDefined('m3e-toolbar')`,
then `await toolbarElement.updateComplete`, then one
`requestAnimationFrame`, before reading `offsetHeight` — per the design's
Lit async-render fix.

## Task 5 — `index.html` / `start.html` markup

- Delete the `vex.combined.min.js`/`vex.css`/`vex-theme-flat-attack.css`
  `<script>`/`<link>` tags.
- Delete the `passkey.css` `<link>`; there is no replacement root-level
  CSS file (any light-DOM CSS `ui.ts`'s build emits lives under
  `/static/passkey/`, added as its own `<link>` if the build actually
  produces one — confirm from a real build, don't assume).
- Add, in `<head>`, before any module script:
  `<style>m3e-theme:not(:defined) { display: contents; }</style>`
  (per the design's cold-load upgrade-race fix).
- Reorder scripts: the new passkey entry's `<script type="module">` moves
  *before* `player.js`'s (currently `socialcalc.js` → `player.js` →
  `passkey.js`; becomes `socialcalc.js` → passkey entry → `player.js`).
  `start.html` has no `player.js` to reorder against — just update its
  single passkey script's `src`.
- Wrap `<body>`'s existing literal children (`#msg`, `#tableeditor` in
  `index.html`; the landing markup in `start.html`) in
  `<m3e-theme color="#0c3159" scheme="light" variant="expressive" motion="expressive">`.
  This is markup-only — SocialCalc's own runtime-created DOM lands inside
  `#tableeditor`, which is already inside the wrapper, so no JS-side DOM
  surgery is needed.

## Task 6 — `boot.ts` vex.js removal

Rewrite `openLegacyExportDialog` (the only `vex.*` call site — confirmed
single occurrence): build `<m3e-dialog dismissible>` with the same five
choices (Excel/CSV/HTML/ODS/Cancel) as `m3e-dialog-action`-wrapped
`m3e-button`s. `Keyboard.passThru` restore moves from vex's `callback`
option to the dialog's `closed` event listener (fires on every dismissal
path — action click, Escape, or backdrop — matching what vex's callback
covered). `boot.ts` does **not** import any `@m3e/web/*` module — it
constructs `<m3e-dialog>` markup by tag name, relying on the custom
element already being registered by the co-loaded, now-earlier-loading
passkey entry (Task 5's reorder). Existing `boot.test.ts` coverage for
this function needs updating for the new construction, staying within
`packages/client`'s Node-environment harness (no real custom-element
upgrade needed to test the *logic* — verify via plain DOM assertions on
the constructed markup/attributes, not shadow-DOM behavior).

## Task 7 — Delete superseded files

`static/passkey.js`, `static/passkey.css`, `static/vex.combined.min.js`,
`static/vex.css`, `static/vex-theme-flat-attack.css`.

## Task 8 — `scripts/build-assets.ts` + its tests

Add a `directoryCopies` entry: `{ from: join(root, 'packages/client/dist-passkey'), to: 'static/passkey' }`,
mirroring the existing `client-multi` → `multi/` entry. Add
`dist-passkey` (or whatever `packages/client/dist-passkey` resolves to)
to `requiredDirectories`. Update `scripts/build-assets.test.ts`: assert
the new `directoryCopies` entry exists (same pattern as the existing
`plan.directoryCopies).toContainEqual({ from: ..., to: 'images' })`
assertion). `index.html`/`start.html` reference the pinned
`./static/passkey/ui.js` path directly (Task 2's `entryFileNames` pin
makes this a known, stable value — no dynamic discovery needed).

## Task 9 — `packages/e2e/tests/passkey-room-access.spec.ts`

Update all six existing contracts for the new custom-element structure.
Component host elements keep the same stable IDs the tests already
assert on (`#ec-room-access` now on `m3e-toolbar`, etc.) — most locator
strategy stays intact; content-text assertions that pierce into
component internals may need role/text-based Playwright locators instead
of raw CSS since M3E renders into shadow DOM (Playwright's
accessibility-tree locators already pierce shadow DOM; verify this holds
for M3E specifically, don't assume).

## Task 10 — New browser tests

- **Cold-load upgrade race**: cache disabled (`page.setCacheEnabled(false)`
  or equivalent), assert `spreadsheet.viewheight` and rendered grid
  height are positive immediately after the custom elements finish
  upgrading, on both the editable-control and viewer paths.
- **Visual/contrast regression**: assert SocialCalc's own
  toolbar/grid region remains legible against the new
  `<m3e-theme>`-driven `body` background (computed-style assertion or
  screenshot comparison — pick whichever the existing Playwright setup
  in this repo already supports without new infrastructure).

## Task 11 — License notices

Add `@m3e/web` (MIT) and Material Symbols (Apache License 2.0, via
`@m3e/icons`) notices, matching the existing third-party notice pattern
in this repo (checked: `third-party/wikiwyg/LICENSE` is the closest
existing precedent for a vendored-dependency license file; follow its
shape).

## Task 12 — Full verification

`bun run build:assets` (clean), `bun run typecheck` (root, filters all
packages), targeted Biome check on every touched file, `packages/client`
unit tests (100% coverage gate — confirm whether `passkey-logic.test.ts`
needs adding to that gate's `include` array per Task 3), full
`packages/e2e` Playwright run (not just the passkey spec — confirm the
single-sheet smoke test and any others still pass against the new
markup/scripts), `wrangler deploy --env staging --dry-run`.

## Task 13 — Staging rollout

Deploy to staging, then a focused acceptance pass matching the
established pattern from the prior passkey Phase A work: public room
chrome, private gate, signed-in account menu, mobile bottom sheet, the
vex.js-replacement export dialog, and the cold-load layout check against
the real deployed bundle (not just local `wrangler dev`).
