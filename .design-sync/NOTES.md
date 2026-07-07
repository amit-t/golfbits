# design-sync notes — golfbits

Repo-specific gotchas for future syncs. Read before re-syncing.

## Layout / how to run

- The design system is a **subdir package**: `design-system/` (not repo root). Run the converter/driver from repo root with:
  - `--node-modules design-system/node_modules`
  - `--entry ./design-system/dist/golfbits-ds.esm.js`
- `buildCmd` = `cd design-system && node build.mjs` → emits `dist/golfbits-ds.{js,esm.js,css}` (IIFE global `GolfbitsDS`, ESM for tests, flat CSS).
- `cssEntry` = `dist/golfbits-ds.css` (PKG_DIR-relative; flat file, `@import`-inlined tokens + component rules).

## No TypeScript — discovery is config-driven

- Components are **`.jsx`, no `.d.ts`, no TS source**. So `exportedNames` finds ZERO — discovery relies ENTIRELY on:
  - `componentSrcMap` (all 14 pinned to `src/components/<Name>.jsx`) — this is what *adds* them.
  - `dtsPropsFor` (hand-written `<Name>Props` body per component) — the emitted `.d.ts` has none otherwise.
- **Adding a component** means adding BOTH a `componentSrcMap` entry AND a `dtsPropsFor` entry, plus its `@category` JSDoc and a `.design-sync/previews/<Name>.tsx`.
- `@types/react` + `typescript` were added to `design-system/` devDeps so validate's `.d.ts` parse check runs (`import * as React` in the emitted `.d.ts` needs React types to resolve). `typescript` is also installed in `.ds-sync/` (validate imports it from there). On a fresh clone, `.ds-sync/` deps are reinstalled by the setup step; `design-system/node_modules` needs `npm install` (includes those devDeps).

## Grouping

- Groups come from each component's `@category` JSDoc line (dir names `components`/`src` are generic, so they're skipped). Categories in use: Actions, Data Display, Layout, Navigation, Content, Quiz, Forms, Feedback, Brand.

## Presentation overrides

- 5 wide components use `cardMode: "column"` (rows/lists that overflow the grid cell): CatRow, PlanTask, LibItem, Tab, QuizOption. This was the fix for `[GRID_OVERFLOW]` — expected, not a new warn.

## Known render warns

- None outstanding. `[GRID_OVERFLOW]` was resolved via the column overrides above; re-syncs should not see it again.

## Re-sync risks (watch-list)

- **`dtsPropsFor` is hand-maintained.** If a component's real props change in `src/components/<Name>.jsx`, the emitted `.d.ts` will NOT reflect it — update `dtsPropsFor.<Name>` by hand. There is no type extraction to catch drift.
- **`@types/react` resolved to v19** while `react` is 18 (types-only, harmless — bodies use only `React.ReactNode` / event types). If a future prop needs a v18-specific type, pin `@types/react@^18`.
- **Previews port app content** (golf categories, quiz answers). Purely illustrative composition — no coupling to app data files, safe to leave.
- **`app/styles.css` is the source of truth.** `design-system/src/{tokens.css,styles.css}` were extracted from it. If the app's CSS changes, re-extract the changed rules into the DS `styles.css` (component rules) / `tokens.css` (the `:root` block) so the two don't drift.
