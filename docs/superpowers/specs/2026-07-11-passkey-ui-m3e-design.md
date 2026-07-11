# Passkey UI on Material 3 Expressive (M3E) — Phase 1 Design

## Problem

`static/passkey.js` + `static/passkey.css` (the room-access row, account menu,
passkey dialog, private gate, mobile action sheet, and landing actions) is
hand-rolled: bespoke CSS for every surface, no shared spacing/motion/focus
language, and visibly inconsistent chrome across the five components. The
export-format chooser in `packages/client/src/boot.ts` is a separate
one-off dependency (`vex.js`) for a single dialog.

The user wants a comprehensive, consistent design-system treatment using
[M3E](https://github.com/matraic/m3e) (`@m3e/web` — MIT-licensed Material 3
Expressive Lit web components, v2.5.14) with full adoption of Material 3
Expressive's visual language (not just borrowing structural primitives while
keeping EtherCalc's current look).

This is a four-phase project (see Roadmap). This document specs **Phase 1
only**: the passkey UI cluster + deleting `vex.js`. SocialCalc's own
toolbar/panel chrome, `client-multi`, and `panels.html` are explicitly out of
scope here.

## Goals

- Replace every hand-rolled element in `static/passkey.js`/`.css` with M3E
  components, themed with Material 3 Expressive's full visual language
  (dynamic color from an EtherCalc-navy seed, expressive motion, M3 shape).
- Delete `vex.js`/`vex.css`/`vex-theme-flat-attack.css` entirely, replacing
  the single export-format dialog with `m3e-dialog`.
- Preserve every existing authorization/display-capability contract:
  `RoomDO` stays the sole authz boundary; the client still only renders
  what `/_/:room/access`'s verdict says; the SocialCalc DOM-insertion
  invariants proven during the prior staging pass (row placement,
  `nonviewheight` math, editable-vs-viewer branching) do not regress.

## Non-goals (this phase)

- SocialCalc's own Format/Sort/Names/Comment/Audit/Clipboard tool panels —
  Phase 3 (see Roadmap; requires its own research pass).
- `client-multi`'s React components — Phase 2.
- `panels.html` — Phase 4.
- Any change to `/_/:room/access` or RoomDO authorization logic.

## Architecture

### Module split (browser-only vs. testable-in-Node)

`packages/client/vitest.config.ts` runs under `environment: 'node'` (no
DOM). M3E's `@m3e/web/theme` module runs browser-only side effects — a
`static {}` class initializer that calls `document.adoptedStyleSheets` /
constructs a `CSSStyleSheet` / registers custom elements — the instant the
module is imported, guarded only by `typeof window !== 'undefined'`.
Importing any `@m3e/web/*` module from a file that the Node-environment
Vitest suite imports would make those tests either no-op silently or
break outright depending on which M3E submodule is involved, and in any
case couldn't assert anything about real shadow-DOM rendering.

The new code therefore splits into two files:

- `packages/client/src/passkey/logic.ts` — pure, DOM-free: `whoami()`,
  `roomAccess()` fetch+validation, `currentRoom()` path parsing, the
  mount-decision routing (public / private-readable / private-denied /
  viewer vs. editable-control). Unit-tested in the existing Node Vitest
  harness with injected `fetch`, mirroring the current
  `boot.test.ts`/`mock-socialcalc.ts` pattern. **Never imports `@m3e/web/*`.**
- `packages/client/src/passkey/ui.ts` — the browser-only entry point.
  Imports `@m3e/web/theme`, `@m3e/web/toolbar`, `@m3e/web/button`,
  `@m3e/web/menu`, `@m3e/web/dialog`, `@m3e/web/bottom-sheet`,
  `@m3e/web/snackbar`, `@m3e/web/card`, and (if icons are used) specific
  `@m3e/icons/<style>/<name>` subpaths. Consumes `logic.ts`'s pure
  functions and composes the actual DOM/custom elements. Verified only
  via Playwright (real browser, real shadow DOM), not Vitest.

### Build pipeline

`static/passkey.js` is currently raw-copied by `scripts/build-assets.ts`,
not bundled — bare `@m3e/web/*` specifiers won't resolve in a browser
without a bundler.

**A single Vite build owns every `@m3e/web`/`lit`/`tslib`/`@m3e/icons`
import — via a fully separate Vite config, not a second input added to
the existing one.** `Vite`'s `build.outDir` applies to an entire build
invocation, not per-input, so a second `rollupOptions.input` inside the
existing `vite.config.ts` cannot emit to its own directory. `packages/client`
therefore gets a second config file, `vite.passkey.config.ts`, with its
own `outDir: 'dist-passkey'` and its own `emptyOutDir: true` (safe: two
distinct, non-nested output directories, so neither build's
`emptyOutDir` can erase the other's). A new `build:passkey` script runs
it (`vite build --config vite.passkey.config.ts`); the package's `build`
script (and `build:clients` in the root `package.json`) runs both.

(Correction to an earlier draft of this section: `boot.ts` already
bundles a real npm dependency today — `dompurify` — into a single
`player.js` file, so "single-entry output stays one file" was never
about having zero dependencies. It holds because there is exactly one
entry point and no dynamic `import()` calls in that graph. The actual
open question for `@m3e/web` is whether *its own* modules contain
internal dynamic imports that would still split a single-entry build
into multiple chunks — not yet verified either way.)

- `passkey/ui.ts` is the sole input for `vite.passkey.config.ts`, built
  to `packages/client/dist-passkey/`. Because whether `@m3e/web`
  internally triggers chunk-splitting is unverified, `build-assets.ts`
  copies that **whole directory** (a new `directoryCopies` entry,
  mirroring the existing `client-multi` → `multi/` treatment exactly,
  which exists for the identical reason: that build can emit more than
  one file) into `assets/static/passkey/`, rather than assuming a
  single named output file. `index.html`/`start.html`'s
  `<script type="module" src="./static/passkey/...">` reference is
  confirmed against the real emitted entry filename from a build run —
  never hardcoded from a guess. Any CSS Vite extracts from this entry
  (our own light-DOM layout/token-override CSS — M3E's shadow-DOM
  component styles never emit as a separate asset) lands in that same
  copied directory; `static/passkey.css` is deleted, not replaced
  1:1 with a new root-level file.
- `boot.ts` stays on the existing `vite.config.ts` → `player.js` build
  and **does not import any `@m3e/web/*` module** — this isn't merely a
  style preference, it's what keeps `player.js` a single, independent
  Rollup graph with nothing to extract a shared chunk from in the first
  place. The vex.js replacement dialog constructs `<m3e-dialog>` /
  `<m3e-button>` markup by tag name only (`document.createElement` or a
  template string), relying on those custom elements already being
  registered globally by `passkey/ui.ts`'s separately loaded script.
  Safe without an explicit load-order dependency: `index.html` always
  loads both scripts, and the export dialog only opens on a later user
  gesture (clicking Export), never at module-evaluation time. (This
  tolerates either script-tag order — but see Theming's "Cold-load
  upgrade race": the passkey entry's `<script>` tag still moves *before*
  `player.js`'s in `index.html`, for SocialCalc's own boot-time layout
  math, not for this dialog.)
- New test coverage (extending the existing `scripts/build-assets.test.ts`
  pattern that already asserts `plan.directoryCopies` contains the
  `multi` entry) asserts the new passkey directory-copy entry exists and
  that `index.html`/`start.html` reference exactly the files a real
  build emits.

### Theming

`<m3e-theme>` is placed as `<body>`'s **direct child**, wrapping all
existing body content (SocialCalc's toolbar/grid included), with:

```html
<m3e-theme color="#0c3159" scheme="light" variant="expressive" motion="expressive">
  <!-- entire existing body content -->
</m3e-theme>
```

`variant` defaults to `"neutral"` and `motion` defaults to `"standard"` —
both are set explicitly here since the user chose full Expressive
adoption, not the defaults.

**Confirmed, accepted side effect** (verified against
`packages/web/src/theme/ThemeElement.ts` source, not assumed): when
`m3e-theme` is a direct child of `<body>`, its `connectedCallback` adopts
its derived color stylesheet at **document** level via
`document.adoptedStyleSheets`, and its own JSDoc states plainly: *"the
`<body>`'s `background-color` is set to the computed value of
`--md-sys-color-background` and `color` is set to the computed value of
`--md-sys-color-on-background`. In addition, the document's
`scrollbar-color` is set..."* This is page-wide, not scoped to the new
UI's subtree — SocialCalc's own toolbar/grid, sitting inside `<body>`,
will render against the new background color even though Phase 1 does
not touch SocialCalc's own styling. (The separate `static {}`-installed
`html{...}` stylesheet — typescale/elevation/shape/motion/density token
*definitions*, not applied styles — is inert for anything that doesn't
reference those custom property names, which SocialCalc's CSS doesn't;
that part carries no visible risk.)

This is treated as an **intentional consequence** of "adopt Material 3
Expressive's visual language" as chosen, not an oversight — but it is a
real, page-wide visual change that Phase 1's testing must verify doesn't
break legibility/contrast around SocialCalc's untouched chrome (see
Testing). The alternative — nesting `<m3e-theme>` somewhere other than
directly under `<body>`, which scopes the color stylesheet to that
theme's own shadow root instead of the document — was considered and
rejected: it reintroduces the earlier-rejected "per-mount-point theme"
approach (duplicated palette computation, config drift risk across
mount points) to avoid an effect that's arguably the intended point of
the user's choice.

**Reduced motion** — not yet verified from source whether M3E's
`motion="expressive"` spring animations respect
`prefers-reduced-motion` automatically. Implementation must check this
empirically in a real browser (not assumed either way) and add an
app-level `@media (prefers-reduced-motion: reduce)` override if M3E
doesn't handle it.

**Cold-load upgrade race.** `m3e-theme` only gets `display: contents`
from its own shadow styles (`static override styles = css\`:host {
display: contents; }\`` in `ThemeElement.ts`) — applied once Lit
registers the element and its shadow root attaches. Before that (module
not yet loaded/parsed/executed), an unrecognized custom element wraps
its children as a plain inline box per the UA default stylesheet. Since
the design wraps `<body>`'s *entire* content — including SocialCalc's
block-level `#tableeditor` — in `<m3e-theme>`, there is a real window,
between first paint and the passkey Vite entry's module finishing
execution, where SocialCalc's own boot-time layout math
(`SizeSSDiv`/`GetViewportInfo`/`GetElementPosition`, run from `boot.ts`,
which itself never imports `@m3e/web`) can measure against a
corrupted inline layout, then visibly shift once the element upgrades.
Two mitigations, both required, not either/or:

1. A synchronous, always-present CSS rule — in `<head>`, before any
   module script, so it's active from first paint — pins the
   pre-upgrade state to match the post-upgrade one:
   `m3e-theme:not(:defined) { display: contents; }`.
2. `index.html`'s script tag order changes: the passkey Vite entry
   (which registers `m3e-theme` and every other M3E element used) loads
   **before** `player.js`, not after as in the current
   `socialcalc.js` → `player.js` → `passkey.js` order. This shrinks —
   it cannot fully eliminate — the race window. `waitForSpreadsheet()`'s
   existing polling loop already tolerates `window.spreadsheet` not
   being ready yet regardless of script order, so this reorder is safe
   for the passkey UI's own mounting logic; it exists purely to reduce
   SocialCalc's own boot-time exposure to an undefined `m3e-theme`.

Testing must include a cold-load (cache-disabled) browser check
asserting `spreadsheet.viewheight` and the rendered grid height stay
positive immediately after the custom elements upgrade — not only
after the page has fully settled, which the existing contracts already
cover.

## Component mapping

| Current (hand-rolled) | Becomes | Notes |
|---|---|---|
| `#ec-room-access` row | `m3e-toolbar` | Compact strip, not `app-bar` (that's for page-level titles; SocialCalc already owns that role) |
| Buttons (primary/secondary/quiet) | `m3e-button` | `variant="filled"` / `"tonal"` / `"text"` respectively |
| `#ec-account-menu` | `m3e-menu` + `m3e-menu-trigger` + `m3e-menu-item` | |
| `#ec-passkey-dialog`, `#ec-sheet-access-dialog` | `m3e-dialog` | Cleanup (`Keyboard.passThru` restore, when reused for the vex swap) binds to the `closed` event, which fires on **any** dismissal path (Escape, backdrop click, or an action button) — not per-button `click` handlers only, which would miss Escape/backdrop dismissal |
| `#ec-room-actions` mobile sheet | `m3e-bottom-sheet` (modal) | |
| `.ec-passkey-notice` | `M3eSnackbar.open(...)` | |
| `#ec-private-gate` | `m3e-card` (header/content/actions slots) | |
| `vex.dialog` export-format chooser (`boot.ts:218`) | `m3e-dialog` + `m3e-button` | Only vex.js call site in the app; removing it deletes `vex.combined.min.js` + `vex.css` + `vex-theme-flat-attack.css` and their `<script>`/`<link>` tags from `index.html`/`start.html` |

## Icons

Material Symbols are available two ways: a Google Fonts CDN link, or the
self-hosted `@m3e/icons` SVG package. EtherCalc is explicitly
self-hostable/offline-capable (`docker compose`, zero external CDN
dependencies anywhere in `index.html`/`start.html` today) — the CDN font
is ruled out.

`@m3e/icons`'s published npm package is ~12 MB unpacked, but that figure
is the *entire* package (every symbol × every style × every weight) — it
publishes per-icon subpath exports, so only the specific icons actually
imported (e.g. `@m3e/icons/outlined/lock`) end up in the passkey Vite
entry's output. Icons appear in exactly two places — a lock icon on the
private-mode indicator/gate, and a key icon on passkey sign-in actions —
both as reinforcement alongside the existing text label, never replacing
it. No other surface (menu items, the account trigger, generic buttons,
the snackbar, the mobile action sheet) gets an icon; text labels stay
primary there, matching EtherCalc's existing plain-language tone. Bulk
imports (`@m3e/icons/all` or similar) are explicitly disallowed.
Implementation must confirm the exact subpath convention against the
published package's `exports` map (not guessed) before wiring imports.
`@m3e/icons` is MIT-licensed; the underlying Material Symbols glyphs are
Apache License 2.0 — both notices are added to the repo's existing
`LICENSE.txt` third-party section (or a new `THIRD-PARTY-NOTICES` entry,
matching whatever pattern the existing `third-party/wikiwyg/LICENSE`
already establishes).

## SocialCalc DOM-insertion contract (mostly unchanged, one new timing requirement)

The mounting logic proven during the prior staging pass does not change:
`#ec-room-access` (now `m3e-toolbar`) still mounts as the first child of
SocialCalc's existing tab/menu wrapper for editable controls, or as a
top-level sibling immediately before `editorDiv` for a read-only viewer
(never inside the grid) — detected via `firstChild === spreadsheet.editorDiv`
identity, not DOM shape heuristics. `nonviewheight` is still adjusted by
the *measured* inserted-element height delta, never by re-running
`SocialCalc.CalculateSheetNonViewHeight()` post-initialization (that
would count the live grid as chrome and collapse `viewheight`). The
`makeup.css` positional selectors for SocialCalc's real tab bar/toolbar
still need their semantic-class stabilization (`ec-socialcalc-tabbar` /
`ec-socialcalc-toolbar`) since the access row still becomes their new
first sibling.

**New requirement:** the prior implementation measured
`offsetHeight` synchronously right after inserting a plain native
`<section>` — safe, because native element insertion paints
synchronously. `m3e-toolbar` is a `LitElement`; its shadow-DOM render
is asynchronous (scheduled via a microtask), so measuring
`offsetHeight` immediately after `insertBefore`/`appendChild` can
observe a `0`-height or partially-rendered element and corrupt the
`nonviewheight` delta. The height measurement must instead await, in
order: `customElements.whenDefined('m3e-toolbar')` (defensive — should
already be resolved given the module import, but not guaranteed by
load order), then the inserted element's own `updateComplete` promise,
then one `requestAnimationFrame` (covers any child components inside
the toolbar with their own async render, and any layout-affecting
CSS transition on mount) — only then measure the before/after height
delta and resize. This must be covered by browser tests on both the
editable-control and viewer insertion paths, not just the existing
DOM-shape assertions.

## Error handling

- `roomAccess()` probe failure: same as today — render nothing rather
  than a guessed access mode.
- Passkey dialog: any sign-in failure (cancellation, timeout, no
  credential, policy failure) surfaces as a normal retry state, never an
  auto-fallback to registration. `NotAllowedError` is not distinguished
  from other failure causes (browsers don't reliably expose that
  distinction) and is never presented as "you have no passkey."
- Snackbar failures use `M3eSnackbar.open(...)` for the same
  best-effort, non-blocking notice pattern `showNotice()` used before.

## Testing

- **Unit (Vitest, Node env, `packages/client`):** `logic.ts`'s pure
  functions — `whoami`, `roomAccess` validation, `currentRoom` parsing,
  mount-decision routing — with injected `fetch`. No `@m3e/web` import
  anywhere in this test-reachable graph.
- **Browser (Playwright, `packages/e2e`):** extends
  `packages/e2e/tests/passkey-room-access.spec.ts`'s existing contracts
  (public row placement, private gate, interrupted sign-in retry,
  landing actions, signed-in/mobile-overflow reachability) updated for
  the new custom-element structure. Component host elements keep stable
  IDs (e.g. `<m3e-toolbar id="ec-room-access">`) so ID-based locators
  keep working; content inside shadow DOM is queried via Playwright's
  accessibility-tree-based role/text locators, which already pierce
  shadow DOM.
- **New: visual/contrast regression for the body-level theme side
  effect.** Since `<m3e-theme>` changes `body`'s background/text color
  and the document's scrollbar color page-wide, and SocialCalc's own
  chrome is untouched in this phase, add a check (screenshot comparison
  or a computed-style assertion on SocialCalc's toolbar/grid
  region against the new body background) confirming no visual
  regression — this is a materially new risk this phase introduces
  that the prior test suite never had to cover.
- **New: cold-load custom-element upgrade race.** Cache disabled, assert
  `spreadsheet.viewheight` and the rendered grid height are positive
  immediately once `m3e-theme`/`m3e-toolbar` finish upgrading — not
  only after the page has fully settled (see "Cold-load upgrade race"
  under Theming). Covers both the pre-upgrade `:not(:defined)` CSS
  safeguard and the `updateComplete`-gated height measurement together,
  since the height-measurement fix alone does not address SocialCalc's
  own boot-time layout math running before the theme element upgrades.
- **Build:** extend `scripts/build-assets.test.ts` to assert the new
  `directoryCopies` entry and that `index.html`/`start.html` reference
  exactly the emitted file names.

## Rollout

Same pattern as the prior passkey Phase A staging work: build, `wrangler
deploy --env staging --dry-run`, deploy, then a focused staging
acceptance pass (public/private/anonymous/signed-in/mobile) before any
production dispatch.

---

## Roadmap (Phases 2–4 — future sessions, each gets its own brainstorm → spec → plan cycle)

### Phase 2 — `client-multi` on `@m3e/react`

`Buttons.tsx` (Add/Rename/Delete) is a direct `m3e-button` swap.
`TabBar.tsx` currently uses `@radix-ui/react-tabs` with `forceMount` to
keep every sheet's iframe mounted — `SheetFrame`'s cross-iframe
`postMessage` state sync depends on inactive tabs' iframes staying
alive, not unmounting. Checked `m3e-tabs`' actual implementation: it
renders one persistent `<slot name="panel">` shared by every
`m3e-tab-panel`, and selection only toggles index/transform/visibility
— it does not remove inactive panels from the DOM. This is feasible
without an always-mounted workaround, but needs its own tab-switch
iframe-identity regression test before committing, and its own design
pass for `@m3e/react`'s binding ergonomics (`@lit/react`-wrapped custom
elements vs. Radix's native React component API).

### Phase 3 — SocialCalc's native panels (Format/Sort/Names/Comment/Audit/Clipboard)

These are not dialogs — they're inline tool panels rendered by the
vendored 19k-line SocialCalc UMD bundle's own `PopupList`/
`ColorChooser`/`BorderSide` control types. Every one of those routes
through one internal API surface: `SocialCalc.Popup.Types.List`'s
function-object contract (`Create` / `Initialize` / `SetValue` /
`GetValue` / `SetDisabled` / `Show` / `Hide` / `Cancel`), called by
stable, external-facing functions (`PopupListInitialize`,
`ColorChooserInitialize`, etc.) that themselves are safe to leave
untouched.

The *only* architecturally sound seam is overriding that
`Popup.Types.List` contract wholesale, externally, after the bundle
loads — the same non-invasive "extend without patching the vendored
text" pattern `passkey.js` already uses elsewhere. It must **not** be a
MutationObserver or DOM-post-processing/hidden-native-input layer:
`Popup` owns its own state in `Popup.Controls` and repeatedly
regenerates its rendered DOM on `Show` / `ItemClicked` / `CustomToList`
/ `Hide` — any external DOM-watcher would race those regenerations and
risk duplicated or desynced focus/state. `Popup.Controls`' state and
the existing `Popup.SetValue`-driven `changedcallback` wiring must be
retained exactly as-is; only the rendering the contract produces
changes.

**Not yet validated** — `SocialCalc.Popup.Types.List`'s actual
implementation hasn't been read. Some controls (`BorderSide`) mix
Popup-rendering with raw `document.getElementById` checkbox
manipulation, so full uniformity may not be achievable. This needs its
own research pass — prototype the override, confirm the contract holds
end-to-end for at least `PopupList` and `ColorChooser` — before a real
design is written. If the contract can't be preserved cleanly, the
fallback ceiling is a CSS-only retheme of `static/makeup.css`'s
existing selectors to M3 color/shape/type tokens: real visual
consistency, zero new dependency, zero behavior change, zero risk to
the protected vendored bundle.

Formula-embedded cell widgets (`SELECT`/`CHECKBOX`/`RADIOBUTTON`/
`AUTOCOMPLETE` `IoFunctions`) are explicitly out of scope for all of
Phase 3 — those are user-authored spreadsheet content rendered inside
cells, not application chrome.

### Phase 4 — `panels.html`

Separate, ancient Bootstrap-in-iframes form-builder "appeditor" page
(`/webappFrame`, `/spreadsheetFrame`, `/formdataFrame`). No shared code
with any of the above. Lowest priority; reskin once Phases 1–3 are
settled.
