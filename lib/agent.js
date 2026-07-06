"use strict";
const fs = require("fs");
const { spawnSync } = require("child_process");
const { ROOT, QUESTIONS_FILE } = require("./paths");
const { loadBits } = require("./content");
const { readProgress, writeProgress, summarize, localDate } = require("./progress");
const { readConfig, resolveConfig } = require("./conf");

function resolveProvider(config, override) {
  const resolved = resolveConfig({ rawConfig: config, flagAgent: override || null });
  return { name: resolved.provider, spec: resolved.providerSpec };
}

function readQuestionsForDigest() {
  try {
    const data = JSON.parse(fs.readFileSync(QUESTIONS_FILE, "utf8"));
    if (data && data.schema === "golfbits-questions/1" && Array.isArray(data.questions)) return data.questions;
  } catch (e) { /* missing/corrupt means no Q&A signal */ }
  return [];
}

function quoteDigestQuestion(text) {
  return String(text || "").replace(/"/g, '\\"');
}

/** Compact progress digest embedded into agent prompts so the agent needn't parse raw files first. */
function progressDigest() {
  const bits = loadBits();
  const progress = readProgress();
  const s = summarize(progress, bits);
  const knownIds = progress.entries.filter(e => e.knownBefore).map(e => e.id);
  const wrongIds = progress.entries.filter(e => e.quizCorrect === false).map(e => e.id);
  const lines = [
    `Completed ${s.completedCount}/${s.bitsInLibrary} bits (${s.remaining} remaining). Quiz accuracy: ${s.quizAccuracy === null ? "n/a" : s.quizAccuracy + "%"}.`,
    `Marked "already knew": ${s.knownCount} bits ${JSON.stringify(s.knownCategories)} -> ids: ${knownIds.join(", ") || "none"}.`,
    `Quiz misses by category: ${JSON.stringify(s.weakCategories)} -> ids: ${wrongIds.join(", ") || "none"}.`,
    `Streak: ${s.currentStreak} (best ${s.longestStreak}). Last bit: ${s.lastBitId || "none"}.`
  ];
  const recentQuestions = readQuestionsForDigest().slice(-10).reverse();
  if (recentQuestions.length) {
    lines.push(`Recent learner questions (signal for coverage): ${recentQuestions.map(q => `"${quoteDigestQuestion(q.question)}" (${q.date})`).join(", ")}`);
    const topics = [];
    for (const q of recentQuestions) {
      const topic = String(q.suggestedBitTopic || "").trim();
      if (topic && !topics.includes(topic)) topics.push(topic);
    }
    if (topics.length) lines.push(`Suggested bit topics from Q&A: ${topics.join("; ")}`);
  }
  return lines.join("\n");
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
  const resolved = resolveConfig({ rawConfig: config, flagAgent: providerOverride || null });
  const { provider: name, providerSpec: spec } = resolved;
  const batch = n || resolved.batchSize || 28;
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
    console.error(`'${spec.command}' not found on PATH. Install it, or switch agents: golfbits config agent <name>`);
    return { name, prompt, status: 127 };
  }
  const progress = readProgress();
  progress.agentRuns.push({ date: localDate(), command: task, provider: name, note: note || null });
  writeProgress(progress);
  return { name, prompt, status: res.status ?? 1 };
}

module.exports = { readConfig, resolveProvider, runAgent, progressDigest };
