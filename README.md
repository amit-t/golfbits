# ⛳ golfbits

Daily golf learning, local-first. One bit a day — a 30-second fact, a 2–3 minute lesson (often with a diagram), and a quiz — served by a tiny local daemon to your browser. Your progress lives in this repo as JSON, and your AI coding agent (Claude Code, Codex, or Gemini CLI) reads it to generate and restructure content at the right depth for you.

No dependencies. Node ≥ 18 is all you need.

## Quick start

```bash
cd golfbits
npm link          # once — installs the global `golfbits` command
golfbits open     # starts the daemon + opens the app in your browser
```

Or without linking: `npm start`.

## Commands

| Command | What it does |
|---|---|
| `golfbits open` | Start background daemon + open the app (latest bit) in your browser |
| `golfbits serve` | Same server, foreground with logs |
| `golfbits stop` | Stop the daemon |
| `golfbits status` | Progress summary in the terminal (streak, accuracy, weak spots, known marks) |
| `golfbits validate` | Schema-check all bits + progress |
| `golfbits extend [n] [note]` | Your AI agent generates the next *n* bits from your progress |
| `golfbits restructure [note]` | Your AI agent rebuilds the un-read bits — depth, order, visuals (e.g. `golfbits restructure make it more visual`) |
| `golfbits config agent <name>` | Switch agent: `claude`, `codex`, or `gemini` |

## How the learning loop works

1. **You learn** — one bit unlocks per day. After each quiz you choose **"Learned something new"** or **"I already knew this."**
2. **The repo remembers** — everything is written to `data/progress.json` (quiz results, `knownBefore` marks, streaks). It's git-tracked: your learning history travels with the repo.
3. **The agent adapts** — `golfbits extend` / `restructure` invoke whichever agent `config/golfbits.json` names. The contract in `AGENTS.md` makes it: go **deeper** in categories you marked "already knew" (3+ marks retires beginner content for that category), **re-approach** concepts you missed on quizzes from new angles, and add **SVG diagrams** where drawings beat words.

## Repo layout

```
bin/golfbits.js      CLI entry
lib/                 server, content loader, progress store, agent invoker, validator
app/                 the web app (served by the daemon)
content/bits/        one JSON file per learning bit ← the content
data/progress.json   your learning history ← the personalization signal
config/golfbits.json agent choice, batch size, depth policy, port
AGENTS.md            the contract any AI agent must follow
scripts/             v1 migration + SVG visual style reference
test/                node test suite (npm test)
```

## Push to GitHub

```bash
git remote add origin git@github.com:<you>/golfbits.git
git push -u origin main
```

Progress is committed with content, so `git pull` on another machine continues exactly where you left off (one machine at a time — last write wins).

## Agent notes

- Default agent is **claude** (`claude -p ... --permission-mode acceptEdits`). Codex runs via `codex exec --full-auto`, Gemini via `gemini --yolo -p`. Edit `config/golfbits.json` to change flags.
- You can also just open an interactive session (`claude` / `codex` / `gemini`) in this folder and say *"read AGENTS.md and my progress, then extend the bits"* — the contract file does the rest.
