# ⛳ golfbits

Daily golf learning, local-first. One bit a day — a 30-second fact, a 2–3 minute lesson (often with a diagram), and a quiz — served by a tiny local daemon to your browser. Your progress and golf Q&A live in this repo as JSON, and your AI coding agent (Claude Code, Codex, Gemini CLI, or a configured Antigravity CLI) reads them to generate and restructure content at the right depth for you.

No dependencies. Node ≥ 18 is all you need.

## Quick start

```bash
cd golfbits
npm link          # once — installs `golfbits`, `golf.learn`, `golf.learn.rebuild`, `golf.ask`
golf.learn        # starts the daemon + opens the app in your browser
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
| `golfbits extend [n] [note] [--agent-flag]` | Your AI agent generates the next *n* bits from your progress |
| `golfbits restructure [note] [--agent-flag]` | Your AI agent rebuilds the un-read bits — depth, order, visuals (e.g. `golfbits restructure make it more visual`) |
| `golfbits ask ["question"] [--agent-flag]` | **With** a question: one-shot — answer prints live and the Q&A is recorded to `data/questions.json`. **Without** a question: opens the agent interactively, pre-seeded with your golf context, so you converse in its own window (not recorded) |
| `golfbits config agent <name>` | Switch default agent in `project.conf`: `claude`, `codex`, `gemini`, or `antigravity` |
| `golf.learn` | Global shortcut for `golfbits open` |
| `golf.learn.rebuild ["note"] [--agent-flag]` | Global shortcut for `golfbits restructure` |
| `golf.ask "question" [--agent-flag]` | Global shortcut for `golfbits ask` |

Agent flags are valid on `golf.ask`, `golf.learn.rebuild`, and `golfbits extend|restructure|ask`: `--claude`, `--codex`, `--gemini`, `--antigravity`, or `--agent=<name>`. Last one wins. `golf.learn` accepts these flags but ignores them with a note because opening the app does not use an agent.

Examples:

```bash
golf.ask                                    # opens your agent, pre-loaded with golf context — just start typing
golf.ask "why does my slice get worse with driver than 7-iron?"   # one-shot, recorded
golf.ask --gemini "what should I practice before my first tournament?"
golf.learn.rebuild "go deeper on rules" --codex
```

**Interactive `golf.ask`** launches the configured agent in its own chat window (`stdio` inherited), seeded with your learner profile, `docs/PLAYBOOK.md`, progress digest, and last 5 questions. How each agent enters interactive mode lives in `config/golfbits.json` as `interactiveArgs` (e.g. `claude "<context>"`, `gemini -i "<context>"`); edit it if your CLI differs. Interactive sessions aren't recorded — pass a question on the CLI when you want it saved.

## Project config

Friendly defaults live in `project.conf`:

```ini
# golfbits project configuration — the friendly knobs.
# Full provider definitions (commands/args) stay in config/golfbits.json.

agent = claude        # claude | codex | gemini | antigravity
port = 4321
batch_size = 28
```

Precedence is: CLI agent flag > `project.conf` > `config/golfbits.json` defaults. Unknown keys and malformed lines are ignored. Provider command definitions stay in `config/golfbits.json`; edit them there if your local CLI needs different flags.

`data/questions.json` is created lazily by `golf.ask`:

```json
{
  "schema": "golfbits-questions/1",
  "questions": []
}
```

## How the learning loop works

1. **You learn** — one bit unlocks per day. After each quiz you choose **"Learned something new"** or **"I already knew this."**
2. **The repo remembers** — everything is written to `data/progress.json` (quiz results, `knownBefore` marks, streaks). It's git-tracked: your learning history travels with the repo.
3. **The agent adapts** — `golfbits extend` / `restructure` invoke whichever agent `project.conf` names (or whichever one-off flag you pass). The contract in `AGENTS.md` makes it: go **deeper** in categories you marked "already knew" (3+ marks retires beginner content for that category), **re-approach** concepts you missed on quizzes from new angles, turn repeated `golf.ask` themes into coverage gaps, and add **SVG diagrams** where drawings beat words.

## Repo layout

```
bin/golfbits.js      CLI entry; global wrappers live beside it
lib/                 server, content loader, progress store, agent invoker, validator
app/                 the web app (served by the daemon)
content/bits/        one JSON file per learning bit ← the content
data/progress.json   your learning history ← the personalization signal
data/questions.json  golf.ask history (created lazily) ← coverage-gap signal
project.conf         friendly defaults: agent, port, batch size
config/golfbits.json provider commands, depth policy, learner profile
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

- Default agent is **claude** (`claude -p ... --permission-mode acceptEdits`). Codex runs via `codex exec --full-auto`, Gemini via `gemini --yolo -p`, and Antigravity is configured as `antigravity -p`. Each provider also has an `interactiveArgs` template used by a bare `golf.ask` (headless `args` = one-shot; `interactiveArgs` = live chat).
- Google Antigravity is primarily an IDE; its CLI surface may differ by version. If your install uses different command-line flags, edit the `antigravity` provider in `config/golfbits.json`. The app treats it like any other provider.
- You can also just open an interactive session (`claude` / `codex` / `gemini`) in this folder and say *"read AGENTS.md and my progress, then extend the bits"* — the contract file does the rest.
