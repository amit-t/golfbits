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

/** Base context for an interactive coaching session — same context as buildAskPrompt, but no fixed QUESTION. */
function buildAskContext(deps = {}) {
  const learner = deps.learner || deps.config?.learner || { name: "Amit", profile: "" };
  const playbook = deps.playbook || "";
  const digest = deps.progressDigest || "";
  const recent = recentQuestionLines(deps.recentQuestions || [], 5);
  const recentText = recent.length ? recent.join("\n") : "none";
  return `You are ${learner.name}'s personal golf coach and playing mentor, now in an interactive session. Context follows.

LEARNER: ${learner.profile}

PLAYBOOK (the learner's reference plan):
${playbook}

LEARNER PROGRESS DIGEST:
${digest}

RECENT QUESTIONS (most recent first, may inform your answers):
${recentText}

You have full context on ${learner.name}. Greet him in one line and invite his first golf question.
Answer each question directly and practically in under 400 words. India-aware (rupees, IGU/WHS,
Bangalore courses). When a question reveals a gap the daily bits should cover, mention it as
"SUGGESTED_BIT_TOPIC: <topic>".`;
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

/**
 * Resolve how an interactive session is actually launched.
 *
 * By default the provider's `command` is spawned directly. When the provider spec sets
 * `interactiveCommand` (e.g. a personal shell wrapper like `clscb`/`cxscb` that is a zsh
 * alias/function, not an executable on PATH), we launch it through an interactive login-style
 * shell so the alias/function resolves. The prompt and any other args are forwarded as shell
 * positionals ("$@"), so no quoting/escaping of the (large, multi-line) prompt is needed.
 *
 * Returns { command, spawnArgs, display } where `display` is the human-facing command label.
 */
function interactiveInvocation(spec, args) {
  if (spec.interactiveCommand) {
    const shell = spec.interactiveShell || "zsh";
    // `zsh -ic '<wrapper> "$@"' <wrapper> <arg1> <arg2> …`
    //  -i so .zshrc (which defines the wrapper) is sourced and aliases expand;
    //  positionals carry the prompt verbatim.
    return {
      command: shell,
      spawnArgs: ["-ic", `${spec.interactiveCommand} "$@"`, spec.interactiveCommand, ...args],
      display: spec.interactiveCommand
    };
  }
  return { command: spec.command, spawnArgs: args, display: spec.command };
}

/**
 * Launch the configured agent as a real interactive session, pre-seeded with the learner's
 * full golf context. stdio is inherited so the user converses live in the agent's own TUI.
 * Because the TUI owns the terminal we cannot tee its output, so interactive sessions are NOT
 * recorded to questions.json — use ask() for a recorded one-shot Q&A.
 */
async function askInteractive(opts = {}) {
  const resolved = resolveConfig({
    flagAgent: opts.flagAgent || null,
    rawConfig: opts.rawConfig || null,
    projectConfText: opts.projectConfText,
    projectConfPath: opts.projectConfPath
  });
  const playbook = opts.playbookText !== undefined ? opts.playbookText : readPlaybook(opts.playbookFile);
  const digest = opts.progressDigest !== undefined ? opts.progressDigest : require("./agent").progressDigest();
  const existing = readQuestions(opts.questionsFile || QUESTIONS_FILE);
  const prompt = buildAskContext({
    learner: resolved.raw.learner,
    playbook,
    progressDigest: digest,
    recentQuestions: existing.questions
  });
  const spec = resolved.providerSpec;
  const template = (Array.isArray(spec.interactiveArgs) && spec.interactiveArgs.length) ? spec.interactiveArgs : (spec.args || []);
  const args = template.map(a => a === "{PROMPT}" ? prompt : a);
  const { command, spawnArgs, display } = interactiveInvocation(spec, args);
  const stdio = opts.stdio || "inherit";
  const stderrTarget = opts.stderr || process.stderr;

  return new Promise(resolve => {
    let settled = false;
    const finish = result => { if (!settled) { settled = true; resolve(result); } };
    const meta = { provider: resolved.provider, command, args: spawnArgs, prompt };
    let child;
    try {
      child = spawn(command, spawnArgs, { cwd: opts.cwd || ROOT, stdio });
    } catch (e) { finish({ ...meta, status: 1, error: e }); return; }
    child.on("error", err => {
      if (err.code === "ENOENT") {
        stderrTarget.write(`'${display}' not found on PATH. Install it, or switch agents: golfbits config agent <name>\n`);
        finish({ ...meta, status: 127, error: err });
        return;
      }
      stderrTarget.write(`${err.message}\n`);
      finish({ ...meta, status: 1, error: err });
    });
    child.on("close", status => finish({ ...meta, status: status ?? 1 }));
  });
}

module.exports = { freshQuestions, readQuestions, writeQuestions, buildAskPrompt, buildAskContext, parseSuggestedBitTopic, interactiveInvocation, ask, askInteractive };
