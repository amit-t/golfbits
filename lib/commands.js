"use strict";
const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");
const { ROOT, PID_FILE, DATA_DIR } = require("./paths");
const { loadBits } = require("./content");
const { validateAll, validateProgress } = require("./validate");
const { readProgress, summarize } = require("./progress");
const { readConfig, resolveConfig, providerOptions, setProjectConfValue } = require("./conf");
const { runAgent } = require("./agent");
const { ask } = require("./ask");

const NAMED_AGENT_FLAGS = {
  "--claude": "claude",
  "--codex": "codex",
  "--gemini": "gemini",
  "--antigravity": "antigravity"
};
const VALID_AGENT_FLAG_TEXT = "--claude, --codex, --gemini, --antigravity, --agent=<name>";

function splitAgentFlags(argv, providers = providerOptions(readConfig())) {
  let agent = null;
  const rest = [];
  for (const arg of argv) {
    if (Object.prototype.hasOwnProperty.call(NAMED_AGENT_FLAGS, arg)) {
      const name = NAMED_AGENT_FLAGS[arg];
      if (!providers.includes(name)) throw new Error(`Unknown agent provider '${name}'. Options: ${providers.join(", ")}`);
      agent = name;
    } else if (arg.startsWith("--agent=")) {
      const name = arg.slice("--agent=".length).trim();
      if (!providers.includes(name)) throw new Error(`Unknown agent provider '${name}'. Options: ${providers.join(", ")}`);
      agent = name;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown flag '${arg}'. Valid flags: ${VALID_AGENT_FLAG_TEXT}`);
    } else {
      rest.push(arg);
    }
  }
  return { agent, rest };
}

function serverAlive() {
  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, "utf8"), 10);
    process.kill(pid, 0);
    return pid;
  } catch (e) { return null; }
}

function openBrowser(url) {
  const openers = { darwin: "open", win32: "start", linux: "xdg-open" };
  const bin = openers[process.platform] || "xdg-open";
  try { execSync(`${bin} "${url}"`, { stdio: "ignore" }); }
  catch (e) { console.log(`Open manually: ${url}`); }
}

function cfgUrl() {
  const c = resolveConfig();
  return `http://${c.raw.server.host}:${c.port}`;
}

async function serve() {
  const { createServer } = require("./server");
  const c = resolveConfig();
  createServer().listen(c.port, c.raw.server.host, () => {
    console.log(`golfbits serving at ${cfgUrl()}  (Ctrl-C to stop)`);
  });
}

async function open(argv = []) {
  const { agent } = splitAgentFlags(argv);
  if (agent) console.log("note: golf.learn doesn't use an agent");
  const existing = serverAlive();
  if (!existing) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const child = spawn(process.execPath, [path.join(ROOT, "bin", "golfbits.js"), "serve"], { cwd: ROOT, detached: true, stdio: "ignore" });
    child.unref();
    fs.writeFileSync(PID_FILE, String(child.pid));
    console.log(`Daemon started (pid ${child.pid}).`);
  } else {
    console.log(`Daemon already running (pid ${existing}).`);
  }
  return new Promise(resolve => {
    setTimeout(() => { openBrowser(cfgUrl()); console.log(`→ ${cfgUrl()}`); resolve(0); }, 400);
  });
}

async function stop() {
  const pid = serverAlive();
  if (!pid) { console.log("No daemon running."); return 0; }
  process.kill(pid);
  try { fs.unlinkSync(PID_FILE); } catch (e) { /* ok */ }
  console.log(`Stopped daemon (pid ${pid}).`);
  return 0;
}

async function status() {
  const bits = loadBits();
  const s = summarize(readProgress(), bits);
  const bar = n => "█".repeat(Math.round(n / 5)) + "░".repeat(20 - Math.round(n / 5));
  const pct = s.bitsInLibrary ? Math.round(100 * s.completedCount / s.bitsInLibrary) : 0;
  console.log(`\n⛳ golfbits — ${s.completedCount}/${s.bitsInLibrary} bits  [${bar(pct)}] ${pct}%`);
  console.log(`   streak ${s.currentStreak}🔥 (best ${s.longestStreak})  ·  quiz accuracy ${s.quizAccuracy === null ? "n/a" : s.quizAccuracy + "%"}  ·  marked known: ${s.knownCount}`);
  if (Object.keys(s.weakCategories).length) console.log(`   weak spots: ${Object.entries(s.weakCategories).map(([k, v]) => `${k} (${v})`).join(", ")}`);
  if (Object.keys(s.knownCategories).length) console.log(`   knows already: ${Object.entries(s.knownCategories).map(([k, v]) => `${k} (${v})`).join(", ")}`);
  if (s.remaining <= 7) console.log(`   ⚠ only ${s.remaining} bits left — run: golfbits extend`);
  console.log("");
  return 0;
}

async function validate() {
  const bits = loadBits();
  const { errors, answerDist, count, categories } = validateAll(bits);
  const pErrors = validateProgress(readProgress());
  [...errors, ...pErrors].forEach(e => console.error("ERROR:", e));
  if (errors.length + pErrors.length) { console.error(`\nFAIL: ${errors.length + pErrors.length} error(s)`); return 1; }
  console.log(`OK: ${count} bits valid. Categories: ${categories.join(", ")}. Answers: ${JSON.stringify(answerDist)}. Progress valid.`);
  return 0;
}

async function extend(argv = []) {
  const { agent, rest } = splitAgentFlags(argv);
  const n = parseInt(rest[0], 10) || undefined;
  const note = isNaN(parseInt(rest[0], 10)) ? rest.join(" ") : rest.slice(1).join(" ");
  const { status: exitStatus } = runAgent("extend", { n, note: note || undefined, providerOverride: agent });
  return exitStatus;
}

async function restructure(argv = []) {
  const { agent, rest } = splitAgentFlags(argv);
  const note = rest.join(" ");
  const { status: exitStatus } = runAgent("restructure", { note: note || undefined, providerOverride: agent });
  return exitStatus;
}

async function askCommand(argv = []) {
  const { agent, rest } = splitAgentFlags(argv);
  const question = rest.join(" ").trim();
  if (!question) {
    console.error('Usage: golf.ask "question" [--agent=<name>|--claude|--codex|--gemini|--antigravity]');
    return 1;
  }
  const result = await ask(question, { flagAgent: agent });
  return result.status;
}

async function config(argv = []) {
  const raw = readConfig();
  if (argv[0] === "agent" && argv[1]) {
    if (!raw.agent.providers[argv[1]]) {
      console.error(`Unknown provider '${argv[1]}'. Options: ${Object.keys(raw.agent.providers).join(", ")}`);
      return 1;
    }
    setProjectConfValue("agent", argv[1]);
    console.log(`Agent set to '${argv[1]}'.`);
    return 0;
  }
  const c = resolveConfig();
  console.log(`agent: ${c.provider}  (available: ${Object.keys(c.raw.agent.providers).join(", ")})`);
  console.log(`batch size: ${c.batchSize}  ·  server: ${cfgUrl()}`);
  console.log(`switch with: golfbits config agent <name>`);
  return 0;
}

async function prompt(argv = []) {
  const { agent, rest } = splitAgentFlags(argv);
  const task = rest[0] === "restructure" ? "restructure" : "extend";
  const { prompt: text } = runAgent(task, { dryRun: true, providerOverride: agent, note: rest.slice(1).join(" ") || undefined });
  console.log(text);
  return 0;
}

const commands = { serve, open, stop, status, validate, extend, restructure, config, prompt, ask: askCommand };

function printUsage() {
  console.log(`golfbits — daily golf learning, local-first\n`);
  console.log(`  golfbits open [--agent-flag]      start daemon + open app in browser (agent flag ignored)`);
  console.log(`  golfbits serve                    run server in foreground`);
  console.log(`  golfbits stop                     stop the daemon`);
  console.log(`  golfbits status                   progress summary in terminal`);
  console.log(`  golfbits validate                 schema-check content + progress`);
  console.log(`  golfbits extend [n] [note] [--agent-flag]       AI agent generates next n bits from your progress`);
  console.log(`  golfbits restructure [note] [--agent-flag]      AI agent rebuilds un-read bits (depth, visuals, order)`);
  console.log(`  golfbits ask "question" [--agent-flag]          ask your agent a golf question and record it`);
  console.log(`  golfbits config [agent <x>]       show config / switch agent (claude|codex|gemini|antigravity)`);
  console.log(`\nAgent flags: ${VALID_AGENT_FLAG_TEXT}`);
}

async function runCli(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (!cmd || !commands[cmd]) {
    printUsage();
    return cmd ? 1 : 0;
  }
  try { return await commands[cmd](rest); }
  catch (e) { console.error(e.message); return e.status || 1; }
}

async function runAlias(alias, argv = process.argv.slice(2)) {
  try {
    if (alias === "learn") return await open(argv);
    if (alias === "learn.rebuild") return await restructure(argv);
    if (alias === "ask") return await askCommand(argv);
    throw new Error(`Unknown golfbits alias '${alias}'`);
  } catch (e) {
    console.error(e.message);
    return e.status || 1;
  }
}

module.exports = { splitAgentFlags, commands, runCli, runAlias };
