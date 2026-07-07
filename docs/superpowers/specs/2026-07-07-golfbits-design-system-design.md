# golfbits design system — design spec

**Date:** 2026-07-07
**Status:** approved (design), pending implementation plan

## Goal

Extract the implicit design system baked into `app/styles.css` into a real, buildable **React component library** so `claude.ai/design` can be synced against it (via `/design-sync`). The design agent then builds golfbits UI from real, on-brand components that map 1:1 onto shippable code.

The existing vanilla-JS app (`app/app.js`, `app/md.js`) is **not changed**. The library is a parallel package that mirrors the app's visual language.

## Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React + esbuild | What `claude.ai/design`'s agent codes against; esbuild `dist/` is what design-sync's package shape consumes. |
| Roster | Full ~14 components | Complete coverage of every distinct UI part; agent can rebuild any golfbits screen. |
| Styling | Ship existing CSS + `className` strings | `app/styles.css` is the source of truth; components render the same class names → zero visual drift. |

## Non-goals

- No rewrite of the golfbits content engine or the vanilla app.
- No new visual design — pure extraction of the existing look.
- No CSS-in-JS, no CSS Modules, no inline-style token system.
- No Storybook (design-sync runs the **package shape**, not storybook shape).

## Architecture

New top-level package, isolated from the content-engine root:

```
design-system/
  package.json          # deps: react, react-dom (peer/external), esbuild (dev)
  build.mjs             # esbuild entry → dist/
  src/
    index.js            # barrel: export every component → IIFE global GolfbitsDS
    tokens.css          # :root custom properties (single token source)
    styles.css          # component rules; @imports tokens.css
    components/
      Button.jsx  Chip.jsx  Card.jsx  StatTile.jsx  ProgressBar.jsx
      ProgressRing.jsx  Tab.jsx  MicroFact.jsx  QuizOption.jsx
      LibItem.jsx  PlanTask.jsx  CatRow.jsx  DoneBanner.jsx  Brand.jsx
  dist/                 # build output — design-sync bundle source
    golfbits-ds.js      # IIFE, global GolfbitsDS, react/react-dom external
    golfbits-ds.css     # bundled component + token CSS
```

### Styling / CSS reachability

- Extract the `:root { ... }` block from `app/styles.css` verbatim into `design-system/src/tokens.css`.
- Copy the **component** rules from `app/styles.css` into `design-system/src/styles.css`. Exclude app-page-only rules: `.wrap`, `.foot`, `.topbar` layout wrapper, `.pb-toc`, and the `.md *` playbook-markdown block. Keep every rule that a rostered component renders.
- `styles.css` begins with `@import "./tokens.css";` so the whole style closure is reachable from one entry — the invariant design-sync requires (rendered designs receive only `styles.css`'s transitive `@import` closure).
- Components emit the **exact** class names already in the CSS (`.btn.primary`, `.chip.deep`, `.opt.correct`, etc.). No new class vocabulary is invented.

### Build

`build.mjs` runs two esbuild builds:

1. **JS** — `src/index.js` (JSX only, no CSS import) →
   `esbuild --bundle --format=iife --global-name=GolfbitsDS --external:react --external:react-dom --outfile=dist/golfbits-ds.js`
2. **CSS** — `src/styles.css` (which `@import`s `tokens.css`) →
   `esbuild --bundle --outfile=dist/golfbits-ds.css` (esbuild inlines the `@import`, producing one flat stylesheet).

- `--global-name=GolfbitsDS` → components reachable at `window.GolfbitsDS.*` (design-sync `_ds_bundle.js` contract).
- `react` / `react-dom` external → design-sync supplies them via `_vendor/`.
- Keeping JS and CSS as separate esbuild entries (not a JS-side `import "./styles.css"`) yields a clean standalone `.css` and keeps the JS bundle CSS-free.

## Components

All are thin, presentational, prop-driven wrappers over the existing markup. Every component:
- has one clear purpose,
- renders documented class names only,
- takes `className` passthrough + rest props where sensible,
- is understandable without reading internals.

| Component | Props | Renders |
|---|---|---|
| `Button` | `variant: "primary"\|"secondary"\|"ghost"` (default `primary`), `children`, `...rest` | `<button class="btn {variant}">` |
| `Chip` | `variant: "default"\|"new"\|"deep"` (default `default`), `children` | `<span class="chip [n\|deep]">` |
| `Card` | `children`, `...rest` | `<div class="card">` |
| `StatTile` | `value`, `label`, `green?: boolean` | `.stat > .v[.green] + .l` |
| `ProgressBar` | `pct: number` (0–100) | `.track > .fill` (width from pct) |
| `ProgressRing` | `pct: number`, `size?: number` (default 44) | inline SVG ring w/ stroke-dashoffset from pct + % label |
| `Tab` | `active?: boolean`, `children`, `onClick` | `<button class="tab [active]">` (uses `.tabs button` styles) |
| `MicroFact` | `label`, `children` | `.microfact > small(label) + body` |
| `QuizOption` | `letter`, `state: "default"\|"correct"\|"wrong"\|"faded"`, `children`, `onClick`, `disabled?` | `.opt[.state] > .key(letter) + text` |
| `LibItem` | `n`, `title`, `category`, `badge?`, `locked?: boolean` | `.lib-item[.locked] > .n .t .c .badge` |
| `PlanTask` | `text`, `detail?`, `checked?: boolean`, `onChange` | `.plan-task[.on] > hidden input + .box + .body` |
| `CatRow` | `name`, `pct: number` | `.cat-row > .name + .track/.fill + .pct` |
| `DoneBanner` | `emoji`, `title`, `children` | `.done-banner > .big(emoji) + h2 + p` |
| `Brand` | `size?: number` (default 28) | ⛳ flag SVG logo + `golfbits` wordmark |

Notes:
- `Tab` reuses the CSS currently scoped as `.tabs button` / `.tabs button.active`. A `.tab` / `.tab.active` alias is added to `styles.css` so the class name is self-describing at the component level (both selectors kept → app unaffected).
- `ProgressRing` mirrors the topbar SVG ring in `index.html`.
- `Brand` ships the SVG logo from `index.html`.

## Data flow

None beyond React props. Components are stateless/presentational; interactive state (`checked`, `active`, quiz `state`) is controlled by the consumer via props + callbacks. No stores, no context, no data fetching.

## Error handling

- Numeric props (`pct`) clamp to `[0,100]`; non-numeric → `0`.
- Unknown `variant`/`state` → falls back to the base class (no crash).
- Missing optional props render nothing for that slot (e.g. no `detail` → no `.detail` node).

## Testing

- `design-system/test/` with a lightweight render check per component: render to string (react-dom/server), assert the expected class names / structure appear. Runner: plain `node --test` (repo already uses zero-dep `node` test conventions).
- Build smoke test: `node build.mjs` exits 0 and emits `dist/golfbits-ds.js` (contains `GolfbitsDS`) + `dist/golfbits-ds.css` (contains `.card` and `--accent`).
- Repo contract unchanged: root `node bin/golfbits.js validate` must still pass (design-system is additive, must not break it).

## Definition of done

1. `design-system/` package builds: `node design-system/build.mjs` → `dist/golfbits-ds.{js,css}`.
2. All 14 components render with expected classes (tests green).
3. `dist/golfbits-ds.css` contains tokens + every rostered component rule; `--accent: #059669` present.
4. Root `node bin/golfbits.js validate` still exits 0.
5. Ready for `/design-sync` package shape (esbuild-bundlable `dist/`, global `GolfbitsDS`, CSS closure from `styles.css`).

## Sync (follow-on, separate step)

After the library is built and green, run `/design-sync`:
- shape = `package` (no Storybook),
- converter builds `_ds_bundle.js` from `dist/`, per-component `.d.ts` + `.prompt.md` + preview cards,
- conventions header documents the class vocabulary (`.btn`, `.chip`, token `var(--*)` names) for the design agent,
- uploads into a new Claude Design project.
