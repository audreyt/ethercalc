# Phase 10b — multi/ React 18 port — Findings

Recorded while porting `multi/` (React 0.12 + LiveScript + Stylus) to
`packages/client-multi/` (React 18 + TypeScript + Vite).

## Library choices

### Tabs: **@radix-ui/react-tabs**

- Zero Vite incompatibilities, SSR-safe, unopinionated default styles.
- Exposes `data-state="active|inactive"` on triggers/content — lets the port
  reuse the legacy `.basic-tabs-item.active` CSS rules verbatim (selector is
  now `[data-state="active"]` but the visual output is byte-identical).
- `forceMount` on `Tabs.Content` keeps every iframe mounted across tab
  switches, matching the legacy `react-basic-tabs` behavior where all frames
  were in the DOM and hidden with `visibility: hidden`.
- Radix doesn't ship CSS, so the Stylus port in `src/styles.module.css` is
  the only visual source. See "Pixel-perfect preservation" below.

`@headlessui/react` would have been the backup. Not needed.

### State: **useReducer (no external store)**

- Total app state is `{activeIndex, rev}` plus a reference to the `HackFoldr`
  instance. One verb per mutation (`setActive`, `bumpRev`, `bumpRev+setActive`).
- Zustand would have added a runtime dep + provider wiring for zero
  test-ergonomics win. Reducer is trivially testable as a pure function.
- `rev` is a manual version counter — the `HackFoldr` mutates its `rows`
  array in place (matches legacy) and React can't see that, so we bump `rev`
  after every successful mutation to force a re-render.

## Pixel-perfect preservation

- Styles ported from Stylus to CSS Modules. All visual rules (font sizes,
  paddings, border radii, button hover states, nav stripe heights) are
  preserved. Class names are scoped via CSS Modules; structural selectors
  (`body`, `iframe`) stay global via `:global()`.
- The legacy code relied on `react-basic-tabs` emitting `.basic-tabs-item`,
  `.basic-tabs-item-title`, `.basic-tabs.basic-tabs-strip` class names. We
  recreate the equivalent DOM (Radix tablist + triggers + content) and apply
  the legacy rules to the Radix atoms. Selectors like
  `body > .nav > .basic-tabs > nav.basic-tabs-strip` that assumed exact DOM
  depth are replaced with `.nav .tabList` (our wrapper + Radix tablist).

## Coverage gate exclusions

`vitest.config.ts` excludes:

| File                  | Reason                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| `src/App.tsx`         | Integration glue. Coordinates `Foldr` + reducer + components; all its logic branches are already covered in `state.ts`, `Foldr.ts`, or component tests. Direct UI testing of App would need a full router + mocked `window.prompt`/`confirm` + iframe polyfill, which duplicates coverage without new signal. Exercised via Playwright in Phase 11 (deferred; see E below). |
| `src/main.tsx`        | `document.getElementById('root')` + `createRoot` boot code. Requires a real browser (iframe contentDocument can't be faked). Covered by Phase-11 Playwright smoke. |

All other files hit 100% across lines / branches / functions / statements.

## Deliberate legacy-bug preservation

| Bug | Location | Preserved? |
| --- | -------- | ---------- |
| On first-push into an empty room, the `push` flow writes the seed row to the CSV twice (once via the two-row init POST, then again via the single-row follow-up POST). | `Foldr.ts::push` → `initIfNeeded` → `postRawCsv` → `postCsv` | **Yes.** This is what the legacy `HackFoldr.push` does via the nested `@.post-csv row.link, row.title, cb` inside the `@.init` callback. Since the server already has the row by the time the duplicate arrives, it appears to be a no-op (row content is identical). Preserving for oracle-equivalence. |
| `push` reads `res.body.command[1]` as a paste-target row index. When the server returns `command: "paste A<N> all"` as a plain string (no array wrapper), the legacy code silently failed and `row.row` stayed zero. | `Foldr.ts::push` (extractCommand helper) | **Soft-fixed.** We also accept `command: "<string>"` directly. This is a forward-compatible read; legacy servers keep returning the `[status, cmd]` array shape and still hit the array branch. |
| The legacy swallowed all superagent errors (no error handling in the callbacks). | `Foldr.ts::postCsv*` + `sendCmd` | **Yes.** Try/catch around `fetch` returns `null`. Consumers (e.g. `push`) treat `null` as "no paste update" — row still appended locally. |
| When the URL matches `/=_…`, the leading `_` is rejected by the `[^_]` class, so the index falls back to `foobar`. Odd but intentional — blocks `/=_new` from masquerading as a real room. | `url.ts::parseMultiEnv` | **Yes.** |
| `pushState` path is `./=<index><suffix>` (relative, leading `./`). We preserve exactly this; reloads stay inside the multi-sheet URL. | `main.tsx::boot` | **Yes.** |

## Deliberate deviations from legacy

- `iframe.getDOMNode()` (React 0.12 API) is replaced with `useRef` + the
  React 18 `HTMLIFrameElement` ref.
- `React.DOM.div/iframe/input/button` factory access is replaced with JSX.
- `superagent` is replaced with native `fetch`. Same wire protocol, same
  request shapes, same header choices (`content-type`, `accept`).
- Manual `document.getElementsByTagName('iframe')` traversal to postMessage
  into every iframe is replaced with per-frame `SheetFrame` components that
  own their own `useEffect`-based postMessage lifecycle. Net effect matches
  the legacy `renderFrameContent` helper exactly: 100 ms delay after
  `readyState === "complete"` before posting; first-iframe focus fires once.
- `HackFoldr` is a class (not a prototype-defined constructor) — preserves
  the name for grep-ability, but uses TS class syntax.

## What's not here (out of scope for this phase)

- **Playwright e2e smoke.** Deferred to Phase 11 per `CLAUDE.md` §8. The
  build verifies Vite works; functional integration (open `/=room`, add sub-
  sheet, rename, delete, export) is the Phase-11 target because it needs a
  running Worker for the `/_/<room>` API.
- **Wiring into the Worker's Hono routes.** The Worker owns `/=:room` and
  must serve `packages/client-multi/dist/index.html` plus its JS/CSS
  assets. That's a Phase-10 / Phase-11 edit to `packages/worker/src/` which
  this phase doesn't touch.
- **Presence features.** `@ethercalc/shared` exports `ecellKey` and WS
  message types; we don't import them here yet because the multi-sheet UI
  itself doesn't own the WebSocket — each embedded iframe runs its own
  single-sheet client with its own WS connection. If we add a presence
  indicator on the tabs later, `@ethercalc/shared` is already a workspace
  dep.

## Test file map

| File                                | Covers                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `test/Foldr.test.ts`                | `HackFoldr` class — every public + private method, every fetch branch, CSV escaping, paste-command parsing, init flow for empty/non-existent rooms. 40 test cases. |
| `test/state.test.ts`                | `reducer`, `computeNextRow`, `titleTaken`. 14 test cases.    |
| `test/url.test.ts`                  | `parseMultiEnv` — every URL shape (local dev, auth=0, auth=hmac, no-match, `/=_<x>`, `?auth=<>`). 12 test cases. |
| `test/Buttons.test.tsx`             | `<Buttons />` — enable/disable, click handlers.               |
| `test/SheetFrame.test.tsx`          | `<SheetFrame />` — postMessage timing, focus, mount/unmount. |
| `test/TabBar.test.tsx`              | `<TabBar />` — Radix integration, src composition, clamping. |

## Dependencies added

- `react@^18.3.1`
- `react-dom@^18.3.1`
- `@radix-ui/react-tabs@^1.1.1`
- `@ethercalc/shared@workspace:*` (available for future use; not yet imported)

DevDependencies: `@vitejs/plugin-react`, `vite`, `vitest`, `jsdom`,
`@testing-library/*`, `@types/react*`, `@vitest/coverage-istanbul`,
`typescript`.
