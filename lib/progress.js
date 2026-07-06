"use strict";
const fs = require("fs");
const { PROGRESS_FILE, DATA_DIR } = require("./paths");
const { validateProgress } = require("./validate");

/** Local-timezone YYYY-MM-DD (v1 used UTC, which flipped days at 05:30 IST — fixed here). */
function localDate(d) {
  const x = d || new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function freshProgress() {
  return {
    schema: "golfbits-progress/2",
    startDate: localDate(),
    lastCompletedDate: null,
    streak: 0,
    longestStreak: 0,
    entries: [],   // { id, date, quizCorrect: bool|null, knownBefore: bool }
    agentRuns: []  // { date, command, provider, note }
  };
}

function readProgress() {
  try {
    const p = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    if (validateProgress(p).length === 0) return p;
  } catch (e) { /* missing or corrupt */ }
  return freshProgress();
}

function writeProgress(p) {
  const errors = validateProgress(p);
  if (errors.length) throw new Error("Refusing to write invalid progress: " + errors.join("; "));
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = PROGRESS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(p, null, 2));
  fs.renameSync(tmp, PROGRESS_FILE); // atomic-ish: never leaves a half-written file
  return p;
}

/** Summary used by CLI `status`, agent prompts, and the app's stats view. */
function summarize(progress, bits) {
  const byId = new Map(bits.map(b => [b.id, b]));
  const weakCategories = {}, knownCategories = {}, doneCategories = {};
  let quizAttempts = 0, quizCorrect = 0, knownCount = 0;
  for (const e of progress.entries) {
    const bit = byId.get(e.id);
    const cat = bit ? bit.category : "Unknown";
    doneCategories[cat] = (doneCategories[cat] || 0) + 1;
    if (e.knownBefore) { knownCount++; knownCategories[cat] = (knownCategories[cat] || 0) + 1; }
    if (typeof e.quizCorrect === "boolean") {
      quizAttempts++;
      if (e.quizCorrect) quizCorrect++;
      else weakCategories[cat] = (weakCategories[cat] || 0) + 1;
    }
  }
  const yday = localDate(new Date(Date.now() - 864e5));
  const streakAlive = progress.lastCompletedDate === localDate() || progress.lastCompletedDate === yday;
  return {
    completedCount: progress.entries.length,
    bitsInLibrary: bits.length,
    remaining: Math.max(0, bits.length - progress.entries.length),
    quizAccuracy: quizAttempts ? Math.round(100 * quizCorrect / quizAttempts) : null,
    currentStreak: streakAlive ? progress.streak : 0,
    longestStreak: progress.longestStreak,
    knownCount,
    knownCategories,
    weakCategories,
    doneCategories,
    lastBitId: progress.entries.length ? progress.entries[progress.entries.length - 1].id : null,
    startDate: progress.startDate
  };
}

module.exports = { readProgress, writeProgress, summarize, localDate, freshProgress };
