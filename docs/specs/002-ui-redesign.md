# Spec 002 — UI redesign handoff (for the design plugin / a design agent)

**Status:** ready for design execution · **Inputs:** `docs/design/DESIGN_SYSTEM.md` (current state), `app/` (implementation), `AGENTS.md` (repo conventions)

You are executing a redesign, not a rewrite of the product. Work in three passes: **critique → proposal → implementation.** Show the proposal (as a written direction + updated token table) before touching code if running interactively; in non-interactive mode, include it in your final report.

## 1. Design intent (the learner's words)

Make learning **more graphical**. The app should teach through the eyes: richer journey map, more visual hierarchy between fact → diagram → lesson → quiz, stronger state storytelling (learned / already-knew / today / ahead), and a feeling of a course walked rather than a list consumed. Personality: a quietly premium golf club, not a gamified quiz app.

## 2. Hard constraints (violating any = failed redesign)

1. **No build step.** Vanilla HTML/CSS/JS in `app/`, served by `lib/server.js`. No frameworks, no bundlers, no external fonts/CDNs (offline-first).
2. **API contract frozen:** `GET /api/bits`, `GET/POST /api/progress`, `GET /api/summary`, `GET /api/config`. Progress schema `golfbits-progress/2` unchanged.
3. **Flows that must survive intact:** one-bit-per-day lock; quiz-before-complete; the two completion choices ("learned something new" vs "already knew this" → `knownBefore`); journey map with the four states; library reread; stats; agent command panel.
4. **Diagram contract stable:** existing 14 bit visuals (viewBox ~320×200, palette in DESIGN_SYSTEM.md) must render well in the new UI without editing bit JSON. If you evolve the diagram style, document it in `AGENTS.md` so content agents follow — do not orphan existing visuals.
5. **Accessibility:** WCAG AA contrast, 44px targets, keyboard-completable quiz, visible focus states, `prefers-reduced-motion` respected for any new animation.
6. **Performance:** first paint under ~100ms locally; total app payload < 200KB excluding bit data.

## 3. Degrees of freedom (redesign these)

Visual identity (palette may evolve — keep one dominant accent and the four-state semantics legible), typography scale, layout (single column is not sacred; consider a course-scorecard motif), the journey map's art direction (topographic course routing? hole-by-hole scorecard? — make it the hero), micro-interactions (completion moment deserves delight; keep it subtle and ≤400ms), empty/edge states (fresh start, all-done, daemon-off), dark mode (optional; if added, both themes must pass AA and diagrams must remain legible on dark).

## 4. Deliverables

1. Updated `app/index.html`, `app/styles.css`, `app/app.js` (structure may change; keep the three-file shape).
2. Updated `docs/design/DESIGN_SYSTEM.md` reflecting the new system (same section structure).
3. If diagram style evolved: updated contract section in `AGENTS.md`.
4. A short `docs/design/REDESIGN_NOTES.md`: what changed, why, before/after token table.

## 5. Definition of done

- `npm test` all green (do not delete tests; extend if you add testable logic).
- `node bin/golfbits.js validate` passes (proves you didn't touch bit data).
- Manual pass: `golfbits open` → complete a bit end-to-end (quiz → known/new choice → journey updates → stats update) at 375px and desktop widths.
- Committed as `feat: UI redesign per spec 002` with working tree clean.
