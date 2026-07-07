# golfbits design system — conventions

A small, presentational React kit that mirrors the golfbits app 1:1. Neutral grays + one green accent, 8px grid, soft cards. Import every component from `window.GolfbitsDS.*` (the root `_ds_bundle.js`).

## Setup — no provider needed

Components are **self-styled by class name**. There is **no** theme provider, context, or wrapper to mount — just render a component and it's styled, as long as the design's `styles.css` is loaded (it is, automatically; it `@import`s the tokens and `_ds_bundle.css`). Don't wrap anything in a `*Provider`; none exists.

## Styling idiom — tokens, not utility classes

This is **not** a utility-class system (no Tailwind, no `bg-*`/`gap-*`). Two rules:

1. **Use the library components for their UI.** Don't hand-roll a button — use `Button`. Don't hand-roll a pill — use `Chip`.
2. **For your own layout glue, style with the design tokens** as CSS custom properties. Every token below is defined globally and safe to reference in `style={{…}}` or your own CSS:

| Token | Value | Use |
|---|---|---|
| `--accent` | `#059669` | primary green (buttons, fills, active) |
| `--accent-dark` | `#047857` | hover/pressed green, green text |
| `--accent-soft` | `#ECFDF5` | green tint backgrounds (callouts, correct) |
| `--amber` / `--amber-soft` | `#D97706` / `#FFFBEB` | "deep dive" accent |
| `--danger` / `--danger-soft` | `#B91C1C` / `#FEF2F2` | wrong/error |
| `--ink` `--ink-2` `--ink-3` `--ink-4` | `#1F2937`→`#9CA3AF` | text, darkest→lightest |
| `--line` | `#E5E7EB` | borders, dividers |
| `--bg` / `--card` | `#FAFAFA` / `#FFFFFF` | page / surface |
| `--shadow` / `--shadow-lg` | soft elevations | card shadows |
| `--r` | `12px` | card radius |

Example glue: `<div style={{ display: "grid", gap: 16, color: "var(--ink-2)" }}>`. Reach for tokens before hardcoding hex.

## Components (all from `window.GolfbitsDS`)

| Component | Key props |
|---|---|
| `Button` | `variant: "primary"\|"secondary"\|"ghost"`, `disabled`, `onClick`, `children` |
| `Chip` | `variant: "default"\|"new"\|"deep"`, `children` |
| `Card` | `children` (surface with border + shadow) |
| `StatTile` | `value`, `label`, `green?` |
| `ProgressBar` | `pct` (0–100) |
| `ProgressRing` | `pct`, `size?` (px, default 44) |
| `Tab` | `active?`, `onClick`, `children` |
| `MicroFact` | `label`, `children` (accent callout) |
| `QuizOption` | `letter`, `state: "default"\|"correct"\|"wrong"\|"faded"`, `disabled`, `children` |
| `LibItem` | `n`, `title`, `category?`, `badge?`, `locked?` |
| `PlanTask` | `text`, `detail?`, `checked?`, `onChange` (controlled checkbox) |
| `CatRow` | `name`, `pct` (labeled progress row) |
| `DoneBanner` | `emoji`, `title`, `children` (centered completion) |
| `Brand` | `size?` (⛳ logo + wordmark) |

Interactive state (`active`, `checked`, quiz `state`) is **controlled** — pass the prop + a callback; components hold no state.

## Where the truth lives

- **Styles**: `_ds/*/styles.css` and its `@import`s (`tokens.css`, `_ds_bundle.css`) — the full token + component rule set.
- **Per-component API**: each component's `.d.ts` (`<Name>Props`) and `.prompt.md`.

## One idiomatic build snippet

A "today" learning card, composed from real components + token glue:

```jsx
const { Card, Chip, MicroFact, Button } = window.GolfbitsDS;

<Card>
  <Chip>Foundations</Chip>
  <h1 style={{ fontSize: 24, fontWeight: 600, margin: "12px 0 8px", color: "var(--ink)" }}>
    The interlocking grip
  </h1>
  <MicroFact label="Micro-fact">
    Link the trailing pinky with the lead index — the hands release as one unit.
  </MicroFact>
  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
    <Button variant="primary">Mark complete</Button>
    <Button variant="ghost">Read more →</Button>
  </div>
</Card>
```
