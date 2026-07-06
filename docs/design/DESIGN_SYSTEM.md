# golfbits Design System (v2 — current state)

Source of truth for the shipped UI. All values live in `app/styles.css` (`:root` tokens) and `scripts/visuals.js` (diagram palette). Hand this document to any design agent before UI work.

## Principles
Local-first learning tool: one bit a day, zero friction, quietly confident. Neutral base + one green accent. Nothing decorative that doesn't teach. No build step — vanilla HTML/CSS/JS served by the local daemon.

## Tokens

### Color
| Token | Value | Use |
|---|---|---|
| `--accent` | `#059669` | primary actions, progress, "learned" state |
| `--accent-dark` | `#047857` | hover, emphasis text |
| `--accent-soft` | `#ECFDF5` | micro-fact panel, correct-answer fill |
| `--amber` | `#D97706` | "already knew" state (★), depth badges |
| `--amber-soft` | `#FFFBEB` | depth chip fill |
| `--danger` / `--danger-soft` | `#B91C1C` / `#FEF2F2` | wrong answers, errors |
| `--ink` → `--ink-4` | `#1F2937 #374151 #6B7280 #9CA3AF` | text hierarchy |
| `--line` | `#E5E7EB` | borders, dividers |
| `--bg` / `--card` | `#FAFAFA` / `#FFFFFF` | page / surfaces |

State semantics are load-bearing: **green = learned**, **amber ★ = already knew**, **outlined = today**, **gray = ahead**. These four states appear identically in the journey map, library badges, and stats.

### Space, radius, elevation, type
8px grid (8/16/24/32). Radius: 8px controls, 12px (`--r`) cards, 999px chips. Shadows: `0 1px 3px rgba(0,0,0,.1)` resting, `0 4px 12px rgba(0,0,0,.08)` hover. System font stack; body 16px/1.5; title 24px/600; chips-captions 12–13px; single-column layout, max-width 760px, mobile breakpoint 480px.

## Components
- **Topbar**: brand mark (SVG flag-in-circle), agent chip, streak chip (🔥 n), SVG progress ring (r=18, dasharray-driven).
- **Tabs**: 4 equal-width buttons; active = ink fill, white text.
- **Bit card**: category chip + "bit n of N" chip (+ depth chip) → title → micro-fact panel (accent-soft, left border) → optional visual (bordered figure + caption) → lesson (pre-line) → quiz.
- **Quiz option**: full-width row, A–D key circle; states: hover (accent border), correct (accent), wrong (danger), faded (others post-answer).
- **Finish row**: primary "Learned something new ✓" + secondary "I already knew this" + one-line note explaining the depth signal.
- **Journey map**: generated SVG, serpentine path (7 nodes/row = 1 week), 6px track, r=13 nodes, pulse animation on today, red flag on final node, W1–W8 row labels, legend above.
- **Library row**: seq number, title, category, badge (✓ / ★ / • / 🔒); locked rows at 45% opacity.
- **Stats**: 4 stat cards, per-category progress bars with known/missed annotations, agent panel with dark `cmd` blocks + copy buttons.

## Interaction rules
Min target 44px. Focus: 2px accent outline, offset 2. Transitions ≤0.2s; the only looping animation is the today-node pulse. Copy tone: lowercase-friendly, brief, warm-wry ("Done for today", "see you on the tee").

## Diagram (SVG visual) contract
viewBox ~320×200, `font-family="system-ui,sans-serif"`, text ≥9px, self-contained (no scripts/external refs). Palette: fairway `#86b979`, green `#a7d19a`, dark green `#14532d`, sand `#fde68a`/`#d97706`, water `#93c5fd`/`#1d4ed8`, ink `#1c1917`, danger `#b91c1c`. 14 reference diagrams in `scripts/visuals.js`. Content agents generate more per `AGENTS.md`, so the contract must stay stable or be versioned.

## Accessibility bar
WCAG AA contrast (current pairs pass; amber-on-white is 4.5:1 at ≥14px bold — don't shrink it). Quiz works keyboard-only. `aria-live="polite"` on main. Journey nodes carry `<title>` tooltips.
