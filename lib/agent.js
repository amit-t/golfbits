"use strict";
const fs = require("fs");
const { spawnSync } = require("child_process");
const { ROOT, CONFIG_FILE } = require("./paths");
const { loadBits } = require("./content");
const { readProgress, writeProgress, summarize, localDate } = require("./progress");

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
}

function resolveProvider(config, override) {
  const name = override || config.agent.provider;
  const spec = config.agent.providers[name];
  if (!spec) throw new Error(`Unknown agent provider '${name}'. Configured: ${Object.keys(config.agent.providers).join(", ")}`);
  return { name, spec };
}

/** Compact progress digest embedded into agent prompts so the agent needn't parse raw files first. */
function progressDigest() {
  const bits = loadBits();
  const progress = readProgress();
  const s = summarize(progress, bits);
  const knownIds = progress.entries.filter(e => e.knownBefore).map(e => e.id);
  const wrongIds = progress.entries.filter(e => e.quizCorrect === false).map(e => e.id);
  return [
    `Completed ${s.completedCount}/${s.bitsInLibrary} bits (${s.remaining} remaining). Quiz accuracy: ${s.quizAccuracy === null ? "n/a" : s.quizAccuracy + "%"}.`,
    `Marked "already knew": ${s.knownCount} bits ${JSON.stringify(s.knownCategories)} -> ids: ${knownIds.join(", ") || "none"}.`,
    `Quiz misses by category: ${JSON.stringify(s.weakCategories)} -> ids: ${wrongIds.join(", ") || "none"}.`,
    `Streak: ${s.currentStreak} (best ${s.longestStreak}). Last bit: ${s.lastBitId || "none"}.`
  ].join("\n");
}

const TASKS = {
  extend: (n, note) => [
    `TASK: EXTEND the golfbits library with the next ${n} bits.`,
    `Follow AGENTS.md exactly (schema, file naming, depth policy, voice).`,
    `Personalize using the learner progress digest below — weight new content toward quiz-miss categories and RAISE depth for categories with "already knew" markings.`,
    note ? `Learner's note: ${note}` : "",
    `When done, run: node bin/golfbits.js validate — it must pass before you finish.`
  ],
  restructure: (n, note) => [
    `TASK: RESTRUCTURE the not-yet-completed bits in content/bits/.`,
    `Follow AGENTS.md exactly. Rules of restructure:`,
    `- NEVER modify or delete bits whose ids appear in data/progress.json entries (completed history is immutable).`,
    `- You MAY rewrite, reorder (reassign seq), merge, split, or delete un-completed bits.`,
    `- Apply the depth policy: categories with "already knew" markings get deeper treatment; drop remaining 'core' bits that the known-markings prove redundant; add scenario/graphical bits for quiz-miss areas.`,
    `- Add or improve 'visual' SVG diagrams where a diagram teaches better than text.`,
    note ? `Learner's restructure request: ${note}` : "",
    `When done, run: node bin/golfbits.js validate — it must pass before you finish.`
  ]
};

/** Build the full prompt and invoke the configured agent CLI in the repo root (blocking). */
function runAgent(task, { n, note, providerOverride, dryRun } = {}) {
  const config = readConfig();
  const { name, spec } = resolveProvider(config, providerOverride);
  const batch = n || config.content.batchSize || 28;
  const lines = TASKS[task](batch, note).filter(Boolean);
  const prompt = [
    `You are the content engine for golfbits (this repo). Learner: ${config.learner.name} — ${config.learner.profile}`,
    ``, lines.join("\n"), ``,
    `LEARNER PROGRESS DIGEST:`, progressDigest()
  ].join("\n");

  if (dryRun) return { name, prompt, status: 0 };

  const args = spec.args.map(a => a === "{PROMPT}" ? prompt : a);
  console.log(`\n▶ Invoking ${name} (${spec.command}) for '${task}'... this can take a few minutes.\n`);
  const res = spawnSync(spec.command, args, { cwd: ROOT, stdio: "inherit" });
  if (res.error && res.error.code === "ENOENT") {
    console.error(`\n✗ '${spec.command}' not found on PATH. Install it, or switch agents: golfbits config agent codex|gemini|claude`);
    return { name, prompt, status: 127 };
  }
  const progress = readProgress();
  progress.agentRuns.push({ date: localDate(), command: task, provider: name, note: note || null });
  writeProgress(progress);
  return { name, prompt, status: res.status ?? 1 };
}

module.exports = { readConfig, resolveProvider, runAgent, progressDigest };
