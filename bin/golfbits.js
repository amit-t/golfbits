#!/usr/bin/env node
"use strict";
/**
 * golfbits — daily golf learning, local-first.
 *
 *   golfbits open          start daemon (background) + open the app in your browser
 *   golfbits serve         run server in foreground (logs to terminal)
 *   golfbits stop          stop the background daemon
 *   golfbits status        progress summary in the terminal
 *   golfbits validate      schema-check all bits + progress
 *   golfbits extend [n]    ask your configured AI agent to generate the next n bits
 *   golfbits restructure [note]   ask the agent to rebuild un-read bits around your progress
 *   golfbits config [agent <name>]  show config / switch agent (claude|codex|gemini)
 */
const fs = require("fs");
const { spawn, execSync } = require("child_process");
const { ROOT, PID_FILE, DATA_DIR, CONFIG_FILE } = require("../lib/paths");
const { loadBits } = require("../lib/content");
const { validateAll, validateProgress } = require("../lib/validate");
const { readProgress, summarize } = require("../lib/progress");
const { readConfig, runAgent } = require("../lib/agent");

const [, , cmd, ...rest] = process.argv;

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
  const c = readConfig();
  return `http://${c.server.host}:${c.server.port}`;
}

const commands = {
  serve() {
    const { createServer } = require("../lib/server");
    const c = readConfig();
    createServer().listen(c.server.port, c.server.host, () => {
      console.log(`golfbits serving at ${cfgUrl()}  (Ctrl-C to stop)`);
    });
  },

  open() {
    const existing = serverAlive();
    if (!existing) {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const child = spawn(process.execPath, [__filename, "serve"], { cwd: ROOT, detached: true, stdio: "ignore" });
      child.unref();
      fs.writeFileSync(PID_FILE, String(child.pid));
      console.log(`Daemon started (pid ${child.pid}).`);
    } else {
      console.log(`Daemon already running (pid ${existing}).`);
    }
    setTimeout(() => { openBrowser(cfgUrl()); console.log(`→ ${cfgUrl()}`); }, 400);
  },

  stop() {
    const pid = serverAlive();
    if (!pid) { console.log("No daemon running."); return; }
    process.kill(pid);
    try { fs.unlinkSync(PID_FILE); } catch (e) { /* ok */ }
    console.log(`Stopped daemon (pid ${pid}).`);
  },

  status() {
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
  },

  validate() {
    const bits = loadBits();
    const { errors, answerDist, count, categories } = validateAll(bits);
    const pErrors = validateProgress(readProgress());
    [...errors, ...pErrors].forEach(e => console.error("ERROR:", e));
    if (errors.length + pErrors.length) { console.error(`\nFAIL: ${errors.length + pErrors.length} error(s)`); process.exit(1); }
    console.log(`OK: ${count} bits valid. Categories: ${categories.join(", ")}. Answers: ${JSON.stringify(answerDist)}. Progress valid.`);
  },

  extend() {
    const n = parseInt(rest[0], 10) || undefined;
    const note = isNaN(parseInt(rest[0], 10)) ? rest.join(" ") : rest.slice(1).join(" ");
    const { status } = runAgent("extend", { n, note: note || undefined });
    process.exit(status);
  },

  restructure() {
    const note = rest.join(" ");
    const { status } = runAgent("restructure", { note: note || undefined });
    process.exit(status);
  },

  config() {
    const c = readConfig();
    if (rest[0] === "agent" && rest[1]) {
      if (!c.agent.providers[rest[1]]) { console.error(`Unknown provider '${rest[1]}'. Options: ${Object.keys(c.agent.providers).join(", ")}`); process.exit(1); }
      c.agent.provider = rest[1];
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(c, null, 2) + "\n");
      console.log(`Agent set to '${rest[1]}'.`);
      return;
    }
    console.log(`agent: ${c.agent.provider}  (available: ${Object.keys(c.agent.providers).join(", ")})`);
    console.log(`batch size: ${c.content.batchSize}  ·  server: ${cfgUrl()}`);
    console.log(`switch with: golfbits config agent <name>`);
  },

  prompt() { // hidden helper: print the agent prompt without running it (used by tests/debugging)
    const task = rest[0] === "restructure" ? "restructure" : "extend";
    const { prompt } = runAgent(task, { dryRun: true, note: rest.slice(1).join(" ") || undefined });
    console.log(prompt);
  }
};

if (!cmd || !commands[cmd]) {
  console.log(`golfbits — daily golf learning, local-first\n`);
  console.log(`  golfbits open                 start daemon + open app in browser`);
  console.log(`  golfbits serve                run server in foreground`);
  console.log(`  golfbits stop                 stop the daemon`);
  console.log(`  golfbits status               progress summary in terminal`);
  console.log(`  golfbits validate             schema-check content + progress`);
  console.log(`  golfbits extend [n] [note]    AI agent generates next n bits from your progress`);
  console.log(`  golfbits restructure [note]   AI agent rebuilds un-read bits (depth, visuals, order)`);
  console.log(`  golfbits config [agent <x>]   show config / switch agent (claude|codex|gemini)`);
  process.exit(cmd ? 1 : 0);
}
commands[cmd]();
