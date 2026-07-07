# golfbits Design System (v2 — current state)

Source of truth for the spec 002 UI redesign. Canonical values come from `docs/design/design_handoff_ui_redesign/README.md`; implementation values live in `app/styles.css`. Hand this document to any design agent before UI work.

## Principles
Local-first daily golf learning should feel graphical, calm, and quietly premium: a Clover Greens practice book rather than a generic web app. The journey is the hero; each daily bit follows a fact → diagram → lesson → quiz hierarchy. Four-state storytelling is load-bearing everywhere: learned, already knew, today, ahead. No build step, no frameworks, no external fonts/CDNs.

## Tokens

### Color

#### Light theme (default)
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

#### Dark theme
`--bg #131A15 · --card #1B241D · --track #242F26 · --ink #EDEFE8 · --ink-2 #C6CFC4 · --ink-3 #93A295 · --ink-4 #5F6E62 · --line #2B372D · --accent #3FA97A · --accent-ink #7FCBA4 · --accent-soft #20362A · --amber #E3A44A · --amber-soft #352A18 · --knew #E3A44A · --knew-bd #B57F2E · --on-knew #221703 · --on-accent #0F1D15 · --on-danger #2B1210 · --danger #E07B6E · --danger-soft #3A241F · shadows rgba(0,0,0,.3)/.35`

Dark theme flips `--on-accent` and `--on-knew` to dark ink so light-green and amber fills keep AA contrast.

#### Four-state semantics
| State | Fill | Border | Content |
|---|---|---|---|
| learned | `--accent` | `--accent-ink` | ✓ (`--on-accent`) |
| already knew | `--knew` | `--knew-bd` | ★ (`--on-knew`) |
| today | `--card` | `--accent` (2px) | number / "today" in `--accent-ink`, pulsing halo |
| ahead | `--track` | `--line` | number in `--ink-4` |

State semantics appear identically in the journey map, scorecard alternative, library badges, and stats.

### Space, radius, elevation, type
8px grid. Card padding 24px, reduced to 16px at ≤480px. Single-column layout, max-width 800px.

Radii: cards use `--r` = 14px; controls use 10px; chips use 999px. Shadows: resting `0 1px 2px rgba(28,35,30,.06)`, hover `0 6px 18px rgba(28,35,30,.10)`.

Typography uses system stacks only. `--display: Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif` for bit titles, section headings, stat values, hole numbers, quiz key letters, and brand wordmark. `--sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif` for everything else.

Type scale: bit titles 30px/1.15/600; section headings 18–26px/600; stat values 32px/600; body lesson 16px/1.6; controls 15px; meta 13px; brand wordmark 22px/600. Overline labels: 11px / 700 / uppercase / letter-spacing 1.2–1.6px, e.g. “30-SECOND FACT”, “QUICK QUIZ”, “CLOVER GREENS · ONE BIT A DAY”.

## Components
- **Topbar**: flag-in-circle mark (32px, `--accent`) + serif wordmark “golfbits” + overline tagline “CLOVER GREENS · ONE BIT A DAY”. Right side keeps agent chip, streak chip (🔥 n), and 46px progress ring with r=18, stroke 5, `--accent` on `--track`, and percent label.
- **Tabs**: underline nav on a 1px `--line` rule. Labels 14px. Active = 600 weight `--ink` plus 2px `--accent` underline. Inactive = 500 `--ink-3`, transparent underline. Horizontal scroll ≤480px. Min-height 44px.
- **Bit card**: category chip (`--accent-soft`/`--accent-ink`) + “hole n of N” chip (`--track`/`--ink-3`) + optional “★ already knew” amber chip → serif title 30px → micro-fact panel (`--accent-soft`, 3px `--accent` left border, radius 0 10 10 0, overline “30-SECOND FACT”) → optional visual → lesson → quiz.
- **Visual figure**: max-width 480px, centered, 1px `--line` border, radius 10, caption 13px `--ink-3`. Existing bit SVGs render unedited inside the light figure panel in both themes.
- **Quiz option**: `<button>` row, 48px min-height, radius 10, serif key letter in 26px circle. Default is card/line; hover moves to `--accent` border and `--accent-soft` background. Correct uses accent-soft background, accent border, key filled accent. Wrong uses danger equivalents. Other answered options fade to 45% opacity. A–D keyboard accelerators are acceptable.
- **Finish row**: primary filled `--accent` “Learned something new ✓” with `--accent-ink` hover; secondary outlined “★ I already knew this” with amber text and amber-border hover. Note below uses `--amber` at 13px to explain the depth signal.
- **Journey map**: hero generated SVG, default art direction is course routing. ViewBox 700×446 for 28 bits, 7 nodes per row, serpentine routing, topographic contour lines, layered walked path, tee rectangle before node 1, red final flag, week labels, four-state nodes, and today halo. Visited nodes click to library reread; today jumps to Today. Scorecard is optional alternative: 4 rows × 7 cells plus weekly tally.
- **Library row**: filter chips, active = `--ink` fill / `--bg` text. Rows 52px: serif number, title 500, category 12px, 26px state badge circle. Locked rows at 45% opacity with dashed empty badge, non-interactive title “Locked — day n”. Unlocked hover adds accent border and shadow. Reread uses “← Back to library” ghost button and revealed bit card.
- **Stats**: 4 stat tiles with serif 32px values. Completed uses `--accent-ink`; known uses `--amber`. Category progress card uses overline heading, 8px bars, and notes “★n known · n missed”. Agent panel uses serif heading “Your AI content agent: {agent}”, dark command blocks `#1D2A22`/`#D9E3DA`, mono 13px, and copy button with “copied!” feedback.
- **Plan / Playbook**: restyle existing structure only. Serif headings, pill week labels (`--accent-soft`/`--accent-ink`), 22px custom checkboxes (checked = `--accent` fill + ✓, strikethrough text), gear/contact rows as bordered lists. Playbook keeps `md.js` renderer + sticky TOC chips; apply serif to `.md h1/h2/h3`.
- **Empty / edge states**: fresh start welcome strip above bit 1; done-for-today centered card with flag SVG and one-shot completion pop; all-done card with “28 / 28” and command blocks; daemon-off card “The clubhouse is closed” with `golfbits open` command block.

## Interaction rules
Min target 44px. Transitions max 0.2s for border-color, background, and color. Completion pop is one-shot 400ms with `cubic-bezier(.2,.9,.3,1.15)`. Today-node pulse is the sole looping animation. All animation is gated behind `prefers-reduced-motion: no-preference`.

Focus uses `:focus-visible` with 2px `--accent` outline and offset 2. Copy buttons write to clipboard and switch label to “copied!” for 1.2s. Journey and library clicks on visited bits open reread; clicking today cell or row jumps to Today.

## Diagram (SVG visual) contract
Existing bit SVGs carry their own light background (`#e7f0e2`) and must render unmodified inside the bordered light figure panel in both themes. This preserves the existing diagram set while the app shell changes around it.

New app-level journey art is generated SVG, not bit content: course routing uses 3–4 faint contour lines (`#E9E5D8` light / `#20291F` dark), layered route strokes `#CBDCC2`, `#DEEAD6` (dark: `#23392B`/`#2C4634`), a dotted `--ink-4` centerline, and a final flag triangle `#B3261E`.

## Accessibility bar
WCAG AA required. 44px targets required. Quiz must be keyboard-completable. Journey nodes need `<title>` tooltips plus keyboard access with tabindex 0 and Enter/Space. `:focus-visible` must remain visible. Existing diagrams stay in a light panel on dark theme for contrast and spec compliance.
