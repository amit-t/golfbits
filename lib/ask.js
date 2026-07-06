"use strict";
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { ROOT, DATA_DIR, QUESTIONS_FILE, PLAYBOOK_FILE } = require("./paths");
const { resolveConfig } = require("./conf");
const { localDate } = require("./progress");

function freshQuestions() {
  return { schema: "golfbits-questions/1", questions: [] };
}

function readQuestions(questionsFile = QUESTIONS_FILE) {
  try {
    const parsed = JSON.parse(fs.readFileSync(questionsFile, "utf8"));
    if (parsed && parsed.schema === "golfbits-questions/1" && Array.isArray(parsed.questions)) return parsed;
  } catch (e) { /* missing or corrupt: treat as empty */ }
  return freshQuestions();
}

function writeQuestions(data, questionsFile = QUESTIONS_FILE) {
  const dir = path.dirname(questionsFile || path.join(DATA_DIR, "questions.json"));
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${questionsFile}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, questionsFile);
  return data;
}

function recentQuestionLines(questions, limit) {
  return questions.slice(-limit).reverse().map(q => `- [${q.date}] ${q.question}`);
}

function buildAskPrompt(question, deps = {}) {
  const learner = deps.learner || deps.config?.learner || { name: "Amit", profile: "" };
  const playbook = deps.playbook || "";
  const digest = deps.progressDigest || "";
  const recent = recentQuestionLines(deps.recentQuestions || [], 5);
  const recentText = recent.length ? recent.join("\n") : "none";
  return `You are ${learner.name}'s personal golf coach and playing mentor. Context follows.

LEARNER: ${learner.profile}

PLAYBOOK (the learner's reference plan):
${playbook}

LEARNER PROGRESS DIGEST:
${digest}

RECENT QUESTIONS (most recent first, may inform your answer):
${recentText}

QUESTION: ${question}

Answer directly and practically in under 400 words. India-aware (rupees, IGU/WHS,
Bangalore courses). If the question reveals a knowledge gap the daily bits should
cover, end with one line: "SUGGESTED_BIT_TOPIC: <topic>".`;
}

function nextQuestionId(questions) {
  const max = questions.reduce((highest, q) => {
    const match = /^q(\d+)$/.exec(q.id || "");
    return match ? Math.max(highest, Number.parseInt(match[1], 10)) : highest;
  }, 0);
  return `q${String(max + 1).padStart(3, "0")}`;
}

function parseSuggestedBitTopic(stdout) {
  const lines = String(stdout || "").split(/\r?\n/).filter(line => line.includes("SUGGESTED_BIT_TOPIC:"));
  if (!lines.length) return null;
  const match = /SUGGESTED_BIT_TOPIC:\s*(.+?)\s*$/.exec(lines[lines.length - 1]);
  return match && match[1].trim() ? match[1].trim() : null;
}

function readPlaybook(playbookFile = PLAYBOOK_FILE) {
  try { return fs.readFileSync(playbookFile, "utf8"); }
  catch (e) { return ""; }
}

async function ask(question, opts = {}) {
  const trimmed = String(question || "").trim();
  if (!trimmed) return { status: 1, stdout: "", prompt: "", provider: null };

  const resolved = resolveConfig({
    flagAgent: opts.flagAgent || null,
    rawConfig: opts.rawConfig || null,
    projectConfText: opts.projectConfText,
    projectConfPath: opts.projectConfPath
  });
  const questionsFile = opts.questionsFile || QUESTIONS_FILE;
  const existing = readQuestions(questionsFile);
  const playbook = opts.playbookText !== undefined ? opts.playbookText : readPlaybook(opts.playbookFile);
  const digest = opts.progressDigest !== undefined ? opts.progressDigest : require("./agent").progressDigest();
  const prompt = buildAskPrompt(trimmed, {
    learner: resolved.raw.learner,
    playbook,
    progressDigest: digest,
    recentQuestions: existing.questions
  });
  const spec = resolved.providerSpec;
  const args = (spec.args || []).map(a => a === "{PROMPT}" ? prompt : a);
  const stdoutTarget = opts.stdout || process.stdout;
  const stderrTarget = opts.stderr || process.stderr;

  return new Promise(resolve => {
    let captured = "";
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const child = spawn(spec.command, args, { cwd: opts.cwd || ROOT, stdio: ["ignore", "pipe", "inherit"] });
    child.stdout.on("data", chunk => {
      captured += chunk.toString();
      stdoutTarget.write(chunk);
    });
    child.on("error", err => {
      if (err.code === "ENOENT") {
        stderrTarget.write(`'${spec.command}' not found on PATH. Install it, or switch agents: golfbits config agent <name>\n`);
        finish({ provider: resolved.provider, prompt, stdout: captured, status: 127, error: err });
        return;
      }
      stderrTarget.write(`${err.message}\n`);
      finish({ provider: resolved.provider, prompt, stdout: captured, status: 1, error: err });
    });
    child.on("close", status => {
      if (settled) return;
      const exitStatus = status ?? 1;
      if (exitStatus === 0) {
        const latest = readQuestions(questionsFile);
        latest.questions.push({
          id: nextQuestionId(latest.questions),
          date: opts.date || localDate(),
          provider: resolved.provider,
          question: trimmed,
          answerSummary: captured.slice(0, 1500),
          suggestedBitTopic: parseSuggestedBitTopic(captured)
        });
        writeQuestions(latest, questionsFile);
      }
      finish({ provider: resolved.provider, prompt, stdout: captured, status: exitStatus });
    });
  });
}

module.exports = { freshQuestions, readQuestions, writeQuestions, buildAskPrompt, parseSuggestedBitTopic, ask };
