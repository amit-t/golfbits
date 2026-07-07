# Handoff: golfbits UI redesign (spec 002)

## Overview
Implementation handoff for the golfbits UI redesign executed against `docs/specs/002-ui-redesign.md` in the `amit-t/golfbits` repo. Design intent: make learning more graphical — journey map as the hero, stronger fact → diagram → lesson → quiz hierarchy, four-state storytelling (learned / already-knew / today / ahead), personality of a quietly premium golf club.

## About the Design Files
The files in this bundle are **design references created as HTML/React prototypes** — they show intended look and behavior, and are **not production code to copy**. The target codebase is **vanilla HTML/CSS/JS with no build step** (`app/index.html`, `app/styles.css`, `app/app.js`, served by `lib/server.js`). Recreate the design in that three-file shape, preserving the existing render-function architecture in `app.js` (`renderToday()`, `renderJourney()`, etc.) and the frozen API contract (`/api/bits`, `/api/progress`, `/api/summary`, `/api/config`). React idioms in the prototype (state objects, per-item handlers) map back to the existing string-template + `bindDynamic()` pattern.

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, and interaction states are final. Recreate pixel-perfectly.

## Hard constraints (from spec 002 — violating any = failed redesign)
1. No build step, no frameworks, no external fonts/CDNs (offline-first). Payload < 200KB excl. bit data; first paint < ~100ms.
2. API contract + `golfbits-progress/2` schema frozen.
3. Flows intact: one-bit-per-day lock; quiz-before-complete; "learned something new" vs "already knew this" (`knownBefore`); journey with four states; library reread; stats; agent command panel.
4. Existing 14 bit SVGs (viewBox ~320×200) must render unedited. See "Diagrams on dark" below.
5. WCAG AA, 44px targets, keyboard-completable quiz, visible focus, `prefers-reduced-motion` respected.

## Design Tokens

### Light theme (default)
| Token | Old value | New value | Use |
|---|---|---|---|
| `--bg` | `#FAFAFA` | `#F5F3ED` | page (warm parchment) |
| `--card` | `#FFFFFF` | `#FFFFFF` | surfaces |
| `--track` | `#F3F4F6` | `#EDEAE0` | progress tracks, code chips, hovers |
| `--ink` | `#1F2937` | `#1E2722` | headings |
| `--ink-2` | `#374151` | `#3C4A42` | body |
| `--ink-3` | `#6B7280` | `#68766C` | secondary |
| `--ink-4` | `#9CA3AF` | `#98A49B` | faint |
| `--line` | `#E5E7EB` | `#E2DFD3` | borders |
| `--accent` | `#059669` | `#166B47` | primary green (deeper, "club" green) |
| `--accent-ink` | `#047857` | `#115538` | green text / hover |
| `--accent-soft` | `#ECFDF5` | `#E7F0E7` | tints |
| `--amber` | `#D97706` | `#A85B08` | amber **text** (AA on white) |
| `--amber-soft` | `#FFFBEB` | `#F8EFDD` | amber tint |
| `--knew` / `--knew-bd` / `--on-knew` | — | `#D97706` / `#B45309` / `#FFFFFF` | "already knew" **fills** (nodes/badges) |
| `--on-accent` / `--on-danger` | — | `#FFFFFF` / `#FFFFFF` | text on filled accent/danger |
| `--danger` / `--danger-soft` | `#B91C1C`/`#FEF2F2` | `#B3261E` / `#FAECEA` | wrong/error |
| `--shadow` | `0 1px 3px rgba(0,0,0,.1)` | `0 1px 2px rgba(28,35,30,.06)` | resting |
| `--shadow-lg` | `0 4px 12px rgba(0,0,0,.08)` | `0 6px 18px rgba(28,35,30,.10)` | hover |
| `--r` (cards) | `12px` | `14px` | card radius (controls 10px, chips 999px) |

### Dark theme (optional per spec — implemented; toggle via `data-theme="dark"` on `<body>` or `prefers-color-scheme`)
`--bg #131A15 · --card #1B241D · --track #242F26 · --ink #EDEFE8 · --ink-2 #C6CFC4 · --ink-3 #93A295 · --ink-4 #5F6E62 · --line #2B372D · --accent #3FA97A · --accent-ink #7FCBA4 · --accent-soft #20362A · --amber #E3A44A · --amber-soft #352A18 · --knew #E3A44A · --knew-bd #B57F2E · --on-knew #221703 · --on-accent #0F1D15 · --on-danger #2B1210 · --danger #E07B6E · --danger-soft #3A241F · shadows rgba(0,0,0,.3)/.35`

Note the dark theme flips `--on-accent`/`--on-knew` to dark ink: light-green/amber fills need dark text for AA.

### Typography (system stacks only — no webfonts)
- `--display: Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif` — bit titles (30px/1.15/600), section headings (18–26px/600), stat values (32px/600), hole numbers, quiz key letters, brand wordmark (22px/600).
- `--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` — everything else. Body 16px/1.6 (lesson), 15px controls, 13px meta.
- Overline labels: 11px / 700 / uppercase / letter-spacing 1.2–1.6px (e.g. "30-SECOND FACT", "QUICK QUIZ", "CLOVER GREENS · ONE BIT A DAY").
- Spacing: 8px grid. Card padding 24px (16px ≤480px). Max-width 800px.

### Four-state semantics (load-bearing; identical in journey, scorecard, library, stats)
| State | Fill | Border | Content |
|---|---|---|---|
| learned | `--accent` | `--accent-ink` | ✓ (`--on-accent`) |
| already knew | `--knew` | `--knew-bd` | ★ (`--on-knew`) |
| today | `--card` | `--accent` (2px) | number / "today" in `--accent-ink`, pulsing halo |
| ahead | `--track` | `--line` | number in `--ink-4` |

## Screens / Views

### Shell
- **Topbar**: flag-in-circle mark (32px, `--accent`) + serif wordmark "golfbits" + overline tagline "CLOVER GREENS · ONE BIT A DAY". Right: agent chip, streak chip (🔥 n), progress ring (46px, r=18, stroke 5, `--accent` on `--track`, % label).
- **Tabs**: replaced boxed buttons with an **underline nav** on a 1px `--line` rule: 14px labels, active = 600 weight `--ink` + 2px `--accent` underline; inactive = 500 `--ink-3`, transparent underline; horizontal scroll ≤480px. Min-height 44px.
- **Footer**: unchanged copy, 12px `--ink-4`.

### Today (bit card)
Card: chips row (category chip `--accent-soft`/`--accent-ink`; "hole n of N" chip `--track`/`--ink-3`; "★ already knew" chip amber when applicable) → serif title 30px → micro-fact panel (`--accent-soft`, 3px `--accent` left border, radius 0 10 10 0, overline "30-SECOND FACT") → visual (max-width 480px, centered, 1px `--line` border, radius 10, caption 13px `--ink-3`) → lesson (16px/1.6, pre-line) → quiz (top border separator, 24px padding-top).

**Quiz option row**: 48px min-height, radius 10, serif key letter in 26px circle. States: default (card/line, hover → `--accent` border + `--accent-soft` bg); correct (accent-soft bg, accent border, key filled accent); wrong (danger equivalents); others faded to 45% opacity. Keyboard: options are `<button>`s, A–D also acceptable as accelerators.

**Finish row** (after answering): primary filled `--accent` "Learned something new ✓" (hover `--accent-ink`); secondary outlined "★ I already knew this" (amber text, hover amber border). Note line below in `--amber` 13px explaining the depth signal.

### Journey (the hero) — two art directions; ship "course routing", keep scorecard optional
**Course routing (default)**: full-width generated SVG (viewBox 700×446 for 28 bits, 7/row serpentine, rowH 106):
- 3–4 faint contour lines (`#E9E5D8` light / `#20291F` dark, 1.5px) across the background for a topographic feel.
- The route drawn 3×: 44px stroke `#CBDCC2`, 30px `#DEEAD6` (dark: `#23392B`/`#2C4634`), then 2px dotted centerline (`dasharray 1 9`, `--ink-4`) = the walked path. Rounded caps/joins; S-curves between rows (control offset ±72, same math as current `renderJourney`).
- Tee rectangle before node 1; red flag (pole `--ink` 2.5px, triangle `#B3261E`) above the final node.
- Nodes r=15, stroke 2.5, per the four-state table; marks 13px/700. Today node adds an outer halo circle (r=15, accent stroke) animating scale 1→1.5 + opacity fade, 1.8s loop — **only under `prefers-reduced-motion: no-preference`** (the sole looping animation).
- Week labels "W1…W4" left margin, 11px/700 `--ink-4`. `<title>` tooltips on nodes; visited nodes clickable → library reread (keyboard: tabindex 0 + Enter/Space).
- Card header: serif "The course — n of N walked" + inline legend (12px dots, four states).

**Scorecard (alt)**: 4 rows ("W1"–"W4") × 7 cells, 48px min-height, radius 10, 2px borders per state table, serif hole number + 10px mark (✓ / ★ / "today" / ·), weekly tally column "n/7". Same click behavior.

### Library
Filter chips (pill, active = `--ink` fill / `--bg` text). Rows 52px: serif number (`--ink-4`) · title 500 · category 12px · 26px state badge circle. Locked rows: 45% opacity, dashed empty badge, non-interactive, title "Locked — day n". Hover (unlocked): accent border + shadow. Reread = "← Back to library" ghost button + bit card with answer revealed (correct highlighted, rest faded, explanation shown).

### Stats
4 stat tiles (serif 32px values: completed in `--accent-ink`, known in `--amber`) → category progress card (overline heading, 8px bars, notes "★n known · n missed") → agent panel (serif heading "Your AI content agent: {agent}", dark command blocks `#1D2A22`/`#D9E3DA`, mono 13px, copy button with "copied!" feedback).

### Plan / Playbook
Restyle only — same structure as current. Serif headings, pill week labels (`--accent-soft`/`--accent-ink`), 22px custom checkboxes (checked = `--accent` fill + ✓, strikethrough text), gear/contact rows as bordered lists. Playbook keeps `md.js` renderer + sticky TOC chips; apply serif to `.md h1/h2/h3`.

### Empty / edge states
- **Fresh start**: welcome strip above bit 1 — `--accent-soft` card, serif "1", copy "Welcome to the club. 28 holes ahead, one a day…".
- **Done for today**: centered card, flag SVG with **completion micro-moment** — one-shot pop (translateY 10px + scale .92 → none, 400ms, `cubic-bezier(.2,.9,.3,1.15)`, reduced-motion gated), serif "That's a hole walked." (subsequent loads: "Done for today"), amber note when marked known: "★ marked as already known — your agent will go deeper here." Revealed bit card below.
- **All done**: serif "28 / 28" + "Course walked. Every hole." + `golfbits extend` / `golfbits restructure` command blocks.
- **Daemon off**: "The clubhouse is closed" card with flag glyph + `golfbits open` command block (replaces the red error box).

## Interactions & Behavior
- All transitions ≤ 0.2s (border-color, background, color). Completion pop 400ms one-shot. Today-node pulse is the only loop. Everything animation-gated on `prefers-reduced-motion`.
- Focus: `:focus-visible` 2px `--accent` outline, offset 2.
- Copy buttons: clipboard write, label → "copied!" for 1.2s.
- Journey/library clicks on visited bits open reread; clicking the today cell/row jumps to Today.
- Responsive: single column, max-width 800px; ≤480px reduce card padding to 16px, hide agent chip, tabs scroll horizontally. Verify at 375px per spec DoD.

## State Management
No new state. Same globals as current `app.js` (`view`, `quizAnswered`, `readingId`, `libFilter`) + optional `theme` (persist to `localStorage`, default `prefers-color-scheme`). Progress writes unchanged.

## Diagrams on dark
Bit SVGs carry their own light `#e7f0e2` background — render them unmodified inside the bordered light figure panel in both themes (spec constraint 4 satisfied with zero edits to bit JSON). If diagram style later evolves, update the contract in `AGENTS.md`.

## Deliverables checklist (spec 002 §4–5)
1. `app/index.html`, `app/styles.css`, `app/app.js` updated (three-file shape kept).
2. `docs/design/DESIGN_SYSTEM.md` rewritten with the token tables above (same section structure).
3. `AGENTS.md` diagram contract: unchanged unless you evolve diagrams.
4. `docs/design/REDESIGN_NOTES.md`: what changed, why, before/after token table (copy from this README).
5. `npm test` green; `node bin/golfbits.js validate` passes; manual pass at 375px + desktop: quiz → known/new → journey updates → stats update. Commit as `feat: UI redesign per spec 002`.

## Files in this bundle (design references)
- `UiRedesign.dc.html` — main prototype: shell, today/quiz/completion flow, journey (both directions), edge states, theme/density/type variants. The `<style>` block in its `<helmet>` holds the canonical token sets; the `courseSvg()` method holds the exact journey-map geometry to port into `renderJourney()`.
- `LibraryView.dc.html`, `StatsView.dc.html`, `PlanView.dc.html`, `PlaybookView.dc.html` — per-view markup/styles.
- `data.js` — sample content mirroring real `content/bits/*.json` (do not ship; the app loads real bits).
