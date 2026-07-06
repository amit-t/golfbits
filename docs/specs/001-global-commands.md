# Spec 001 — Global commands: `golf.learn`, `golf.learn.rebuild`, `golf.ask`

**Status:** ready to implement · **Repo:** golfbits · **Estimated scope:** ~6 new files, ~5 edits, ~10 new tests

This is a complete execution context. Every design decision is made; do not invent alternatives. Read `AGENTS.md` first for repo conventions. Finish with `npm test` and `node bin/golfbits.js validate` passing.

---

## 1. Objective

Register three memorable global commands on install (`npm link` or `npm install -g .`), add a Q&A command whose history feeds content rebuilds, add per-run agent flags, and make the default agent editable in a plain-text `project.conf`.

## 2. UX contract

| Command | Behavior |
|---|---|
| `golf.learn` | Exactly `golfbits open`: start daemon if needed, open browser at the current bit |
| `golf.learn.rebuild ["note"] [--agent-flag]` | Exactly `golfbits restructure` with optional note and agent override |
| `golf.ask "question" [--agent-flag]` | Ask the configured agent a golf question with full learner context; print answer; record Q&A to `data/questions.json` |
| `golfbits …` | Unchanged full CLI; gains `ask` subcommand and agent flags everywhere agents run |

Agent flags, valid on `golf.ask`, `golf.learn.rebuild`, `golfbits extend|restructure|ask`:
`--claude`, `--codex`, `--gemini`, `--antigravity`, or generic `--agent=<name>`. Last one wins. On `golf.learn` they are accepted but ignored with a one-line notice (`note: golf.learn doesn't use an agent`). Unknown `--agent=<name>` values fail fast with the configured provider list.

Examples:
```bash
golf.learn
golf.ask "why does my slice get worse with driver than 7-iron?"
golf.ask --gemini "what should I practice before my first tournament?"
golf.learn.rebuild "go deeper on rules" --codex
```

## 3. Configuration: `project.conf`

New file at repo root, git-tracked. Format: `key = value` lines, `#` comments, blank lines ignored, keys case-insensitive, values trimmed. No sections, no quoting.

```ini
# golfbits project configuration — the friendly knobs.
# Full provider definitions (commands/args) stay in config/golfbits.json.

agent = claude        # claude | codex | gemini | antigravity
port = 4321
batch_size = 28
```

**Precedence (must be tested):** CLI flag > `project.conf` > `config/golfbits.json` defaults. Missing/malformed `project.conf` → silently fall through (no crash). Unknown keys → ignored. Recognized keys map: `agent` → provider name, `port` → `server.port`, `batch_size` → `content.batchSize`.

## 4. New provider: antigravity

Add to `config/golfbits.json` → `agent.providers`:
```json
"antigravity": { "command": "antigravity", "args": ["-p", "{PROMPT}"] }
```
Google Antigravity is primarily an IDE and its CLI surface may differ by version — the command/args are user-editable config, and the README must say so. Do not special-case it in code; it is just a provider entry. ENOENT handling (below) covers it being absent.

## 5. `golf.ask` — full flow

1. Join non-flag argv into the question. Empty → print usage, exit 1.
2. Build prompt (exact template):
   ```
   You are {learner.name}'s personal golf coach and playing mentor. Context follows.

   LEARNER: {config.learner.profile}

   PLAYBOOK (the learner's reference plan):
   {contents of docs/PLAYBOOK.md}

   LEARNER PROGRESS DIGEST:
   {progressDigest() from lib/agent.js}

   RECENT QUESTIONS (most recent first, may inform your answer):
   {up to last 5 entries from data/questions.json as "- [date] question"}

   QUESTION: {question}

   Answer directly and practically in under 400 words. India-aware (rupees, IGU/WHS,
   Bangalore courses). If the question reveals a knowledge gap the daily bits should
   cover, end with one line: "SUGGESTED_BIT_TOPIC: <topic>".
   ```
3. Spawn the provider with stdout **piped** (not inherited): tee chunks to `process.stdout` live AND accumulate. stderr inherits.
4. On exit 0, append to `data/questions.json` (create `{"schema":"golfbits-questions/1","questions":[]}` if missing):
   ```json
   {
     "id": "q001",
     "date": "YYYY-MM-DD",
     "provider": "claude",
     "question": "…",
     "answerSummary": "first 1500 chars of captured stdout",
     "suggestedBitTopic": "parsed from SUGGESTED_BIT_TOPIC: line, else null"
   }
   ```
   Write atomically (tmp + rename, same pattern as `lib/progress.js`). Non-zero exit → nothing recorded.
5. ENOENT → exit 127 with: `'{command}' not found on PATH. Install it, or switch agents: golfbits config agent <name>`.

## 6. Q&A feeds rebuilds

`progressDigest()` in `lib/agent.js` gains a final line when questions exist:
```
Recent learner questions (signal for coverage): "<q1>" (date), "<q2>" (date), ... [last 10]
Suggested bit topics from Q&A: <topic1>; <topic2> [dedup, last 10, omit line if none]
```
`AGENTS.md` gets a short subsection under "Reading progress": treat repeated question themes as high-priority coverage gaps; `suggestedBitTopic` entries should become bits in the next `extend`/`restructure` unless already covered.

## 7. File-by-file plan

**New**
- `bin/golf-learn.js`, `bin/golf-learn-rebuild.js`, `bin/golf-ask.js` — thin shebang wrappers: parse argv, call into `lib/commands.js`. No logic in bins.
- `lib/commands.js` — extract the command implementations currently inlined in `bin/golfbits.js` (`open`, `serve`, `stop`, `status`, `validate`, `extend`, `restructure`, `config`, `prompt`) plus new `ask`. `bin/golfbits.js` becomes a dispatcher importing this.
- `lib/conf.js` — `parseProjectConf(text)` (pure, testable) + `resolveConfig({flagAgent})` returning the merged view `{provider, port, batchSize, raw}`. All consumers (`lib/agent.js`, `lib/server.js`, commands) switch to `resolveConfig`.
- `lib/ask.js` — the §5 flow. Export `buildAskPrompt(question, deps)` (pure) and `ask(question, opts)` separately so the prompt is unit-testable without spawning.
- `project.conf` — as §3.
- `data/questions.json` — created lazily; add `data/questions.json` example to README only.

**Edit**
- `package.json` → `"bin": { "golfbits": "bin/golfbits.js", "golf.learn": "bin/golf-learn.js", "golf.learn.rebuild": "bin/golf-learn-rebuild.js", "golf.ask": "bin/golf-ask.js" }`. Dotted bin names are valid npm bin keys; npm creates shims (works on Windows too).
- `lib/agent.js` → use `resolveConfig`; add questions lines to digest; keep `runAgent` signature backward-compatible.
- `config/golfbits.json` → add antigravity provider (§4).
- `AGENTS.md` → §6 subsection + mention `golf.ask` exists.
- `README.md` → new commands table rows, `project.conf` doc, antigravity caveat, `npm link` note that it now registers 4 commands.

**Shared flag parser** (in `lib/commands.js`): `splitAgentFlags(argv)` → `{ agent: string|null, rest: string[] }`; recognizes the four named flags and `--agent=<x>`; unknown `--flags` → error listing valid ones.

## 8. Tests — add to `test/run-tests.js` (keep zero-dep style)

1. `parseProjectConf`: comments/blank lines/case/whitespace; unknown keys ignored; malformed lines skipped.
2. Precedence: flag beats project.conf beats golfbits.json (use temp conf content via the pure parser + `resolveConfig` with injected fixtures — refactor `resolveConfig` to accept optional raw inputs for testability).
3. `splitAgentFlags`: `--codex` wins over conf; `--agent=gemini` works; `--agent=bogus` throws listing providers; flags removed from `rest`.
4. `buildAskPrompt` embeds playbook excerpt, digest header, the question, and ≤5 recent questions.
5. `ask` end-to-end with a mock provider: temporarily inject provider `{command: process.execPath, args: ["-e", "console.log('mock answer SUGGESTED_BIT_TOPIC: wind play')", "{PROMPT}"]}`; assert stdout captured, `questions.json` gains entry with `suggestedBitTopic === "wind play"`, ids increment (`q001`, `q002`).
6. `ask` with failing provider (exit 1): nothing recorded.
7. Digest includes recent question text once questions exist.
8. `package.json` bin map contains all four commands pointing at existing files.
9. Wrapper bins: spawn `bin/golf-learn-rebuild.js` with `--agent=bogus` → non-zero exit, helpful message (proves wiring without invoking a real agent).
10. Existing 15 tests still pass unchanged.
Restore `data/questions.json` state after tests exactly like the progress restore pattern already in the file.

## 9. Acceptance criteria

- `npm link` from the repo → `golf.learn`, `golf.learn.rebuild`, `golf.ask`, `golfbits` all on PATH.
- `golf.learn` opens the app; `golf.ask "test?" ` with claude installed prints an answer and appends to `data/questions.json`; `--gemini` switches provider for that run only.
- Editing `agent = codex` in `project.conf` changes the default with no other action.
- `npm test` → all green (25-ish tests). `node bin/golfbits.js validate` → OK.
- `git status` clean after a final commit with message `feat: global golf.* commands, golf.ask Q&A loop, project.conf (spec 001)`.

## 10. Non-goals

No daemon changes, no UI changes (a later spec may surface Q&A in the app), no answer streaming UI beyond tee-ing stdout, no multi-machine sync, no npm publish.

## 11. Edge cases to handle

- Question containing quotes/newlines (argv join handles; JSON write escapes).
- `data/` missing entirely (mkdir recursive, as `lib/progress.js` does).
- Two agent flags (`--codex --gemini`) → last wins, no error.
- `project.conf` agent naming a provider absent from golfbits.json → fail fast at resolve time with provider list.
- Existing background daemon + changed port in project.conf → `stop` must still find the pid file (pid file path is port-independent; no change needed, just don't break it).
