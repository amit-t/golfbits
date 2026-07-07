# golfbits UI Redesign Notes (spec 002)

## What changed
The redesign moves golfbits from a plain local utility into a graphical daily-learning experience. The journey map becomes the hero, the daily bit reads in a stronger fact → diagram → lesson → quiz hierarchy, and every progress surface tells the same four-state story: learned, already knew, today, ahead.

The visual personality is quieter and more premium: warm parchment background, deeper club green, serif display moments, restrained borders, and golf-course routing instead of generic progress widgets. The app still stays offline-first, vanilla HTML/CSS/JS, and content-led.

## Why it changed
- **Graphical learning**: more concepts should be understood at a glance, especially through diagrams and the course-routing journey.
- **Journey as hero**: progress should feel like walking holes at Clover Greens, not filling a checklist.
- **Fact → diagram → lesson → quiz hierarchy**: the daily card now starts with the fastest usable insight, then visualizes it, explains it, and tests it.
- **Four-state storytelling**: learned / already-knew / today / ahead now means the same thing in journey, scorecard, library, and stats.
- **Quietly premium golf club personality**: warm materials, serif headings, deeper greens, amber knowledge marks, and minimal motion replace generic app chrome.

## Before / after token table
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

## Per-view summary

### Shell
Topbar gets the flag-in-circle mark, serif “golfbits” wordmark, overline “CLOVER GREENS · ONE BIT A DAY”, agent/streak chips, and 46px progress ring. Tabs move from boxed buttons to underline navigation on a 1px `--line` rule, with 44px minimum height and horizontal scroll on small screens.

### Today
The bit card becomes hierarchical: chip row, 30px serif title, 30-second fact panel, optional bordered visual, lesson, then quiz. Quiz options become 48px button rows with serif key circles and clear correct/wrong/faded states. Completion splits into “Learned something new ✓” and “★ I already knew this”, with an amber note explaining the depth signal.

### Journey
Default hero becomes course routing: full-width generated SVG, serpentine route, topographic contours, tee, final red flag, week labels, and four-state nodes. Today node gets the only looping animation: reduced-motion-gated halo pulse. Visited nodes open reread; today jumps back to Today.

### Journey scorecard alt
Scorecard remains an optional art direction: 4 rows (“W1”–“W4”) × 7 cells, 48px minimum cells, 2px state borders, serif hole number, mark, and weekly tally column. Behavior matches course routing.

### Library
Library gains pill filters, 52px rows, serif sequence numbers, category meta, and 26px state badges. Locked rows are 45% opacity and non-interactive. Reread mode uses a ghost back button and revealed bit card with answer/explanation shown.

### Stats
Stats uses 4 tiles with serif 32px values, category progress bars with “★n known · n missed” notes, and a premium agent panel with serif heading, dark command blocks `#1D2A22`/`#D9E3DA`, mono 13px text, copy feedback.

### Plan / Playbook
Plan and Playbook are restyled only. Existing structure stays. Week labels become pills, checkboxes become 22px custom controls, checked items strike through, gear/contact rows become bordered lists. Playbook keeps the existing `md.js` renderer and sticky TOC chips; markdown headings get display serif styling.

### Empty / edge states
Fresh start adds a welcome strip above bit 1. Done-for-today gets a centered flag card, 400ms one-shot completion pop, “That's a hole walked.” first-run copy, “Done for today” subsequent copy, and amber known note when applicable. All-done shows “28 / 28” plus `golfbits extend` / `golfbits restructure` command blocks. Daemon-off becomes “The clubhouse is closed” with `golfbits open`, replacing the red error box.

## Interaction rules
- All transitions max 0.2s for border-color, background, and color.
- Completion pop is one-shot 400ms: translateY 10px + scale .92 → none, `cubic-bezier(.2,.9,.3,1.15)`.
- Today-node pulse is the sole looping animation.
- Motion is gated by `prefers-reduced-motion`; looping/popping motion only under `prefers-reduced-motion: no-preference`.
- Focus uses `:focus-visible` with 2px `--accent` outline and offset 2.
- Quiz options are buttons; A–D keyboard accelerators are acceptable.
- Journey/library visited-bit clicks open reread; clicking today jumps to Today.
- Copy buttons write to clipboard and show “copied!” for 1.2s.
