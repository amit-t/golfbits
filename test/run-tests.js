#!/usr/bin/env node
"use strict";
/** golfbits test suite — zero deps. Run: npm test */
const assert = require("assert");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");
const { ROOT, PROGRESS_FILE } = require("../lib/paths");
const { loadBits } = require("../lib/content");
const { validateAll, validateProgress } = require("../lib/validate");
const { freshProgress, summarize, localDate } = require("../lib/progress");
const { runAgent } = require("../lib/agent");
const { createServer } = require("../lib/server");

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ✓", name); }
  catch (e) { failed++; console.error("  ✗", name, "\n    ", e.message); }
}
const get = (port, path, opts = {}) => new Promise((resolve, reject) => {
  const req = http.request({ host: "127.0.0.1", port, path, method: opts.method || "GET", headers: opts.headers }, res => {
    let body = "";
    res.on("data", c => body += c);
    res.on("end", () => resolve({ status: res.statusCode, body }));
  });
  req.on("error", reject);
  if (opts.body) req.write(opts.body);
  req.end();
});

(async () => {
  console.log("golfbits tests\n");
  // preserve any real progress; tests must not pollute the repo
  const hadProgress = fs.existsSync(PROGRESS_FILE);
  const savedProgress = hadProgress ? fs.readFileSync(PROGRESS_FILE, "utf8") : null;
  const questionsPath = path.join(ROOT, "data", "questions.json");
  const hadQuestions = fs.existsSync(questionsPath);
  const savedQuestions = hadQuestions ? fs.readFileSync(questionsPath, "utf8") : null;

  // ---- content ----
  const bits = loadBits();
  await test("content: bits load and pass full validation", () => {
    const { errors } = validateAll(bits);
    assert.strictEqual(errors.length, 0, errors.join("; "));
    assert.ok(bits.length >= 56, `expected >=56 bits, got ${bits.length}`);
  });
  await test("content: bits are seq-ordered with visuals present", () => {
    for (let i = 1; i < bits.length; i++) assert.ok(bits[i].seq > bits[i - 1].seq, "seq not increasing");
    assert.ok(bits.filter(b => b.visual).length >= 10, "expected >=10 visual bits");
  });
  await test("validate: catches bad bit", () => {
    const bad = { ...bits[0], id: "nope", quiz: { ...bits[0].quiz, answerIndex: 9 } };
    const { errors } = validateAll([bad]);
    assert.ok(errors.some(e => e.includes("id")), "id error not raised");
    assert.ok(errors.some(e => e.includes("answerIndex")), "answerIndex error not raised");
  });

  // ---- progress ----
  await test("progress: fresh progress is schema-valid", () => {
    assert.strictEqual(validateProgress(freshProgress()).length, 0);
  });
  await test("progress: summarize computes known/weak categories", () => {
    const p = freshProgress();
    p.entries = [
      { id: bits[0].id, date: localDate(), quizCorrect: true, knownBefore: true },
      { id: bits[1].id, date: localDate(), quizCorrect: false, knownBefore: false }
    ];
    const s = summarize(p, bits);
    assert.strictEqual(s.completedCount, 2);
    assert.strictEqual(s.knownCount, 1);
    assert.strictEqual(s.quizAccuracy, 50);
    assert.strictEqual(s.knownCategories[bits[0].category], 1);
    assert.strictEqual(s.weakCategories[bits[1].category], 1);
  });

  // ---- agent prompts ----
  await test("agent: extend prompt embeds digest + validation gate", () => {
    const { prompt } = runAgent("extend", { dryRun: true, note: "focus on rules" });
    assert.ok(prompt.includes("AGENTS.md"));
    assert.ok(prompt.includes("golfbits validate") || prompt.includes("bin/golfbits.js validate"));
    assert.ok(prompt.includes("focus on rules"));
    assert.ok(prompt.includes("LEARNER PROGRESS DIGEST"));
  });
  await test("agent: restructure prompt protects completed bits", () => {
    const { prompt } = runAgent("restructure", { dryRun: true });
    assert.ok(prompt.includes("NEVER modify or delete bits"));
    assert.ok(prompt.toLowerCase().includes("depth policy"));
  });
  await test("conf: parseProjectConf handles comments, case, whitespace, and malformed lines", () => {
    const { parseProjectConf } = require("../lib/conf");
    const parsed = parseProjectConf(`
      # comment
      AGENT = codex   # inline comment
      port = 9999
      batch_size = 7
      unknown = ignored
      malformed line without equals
    `);
    assert.deepStrictEqual(parsed, { agent: "codex", port: 9999, batchSize: 7 });
  });
  await test("conf: resolveConfig precedence is flag over project.conf over config defaults", () => {
    const { resolveConfig } = require("../lib/conf");
    const rawConfig = {
      agent: {
        provider: "claude",
        providers: {
          claude: { command: "claude", args: [] },
          codex: { command: "codex", args: [] },
          gemini: { command: "gemini", args: [] },
          antigravity: { command: "antigravity", args: [] }
        }
      },
      server: { host: "127.0.0.1", port: 4321 },
      content: { batchSize: 28 },
      learner: { name: "Amit", profile: "profile" }
    };
    const project = resolveConfig({ rawConfig, projectConfText: "agent = codex\nport = 5000\nbatch_size = 9\n" });
    assert.strictEqual(project.provider, "codex");
    assert.strictEqual(project.port, 5000);
    assert.strictEqual(project.batchSize, 9);
    const flagged = resolveConfig({ rawConfig, projectConfText: "agent = codex\n", flagAgent: "gemini" });
    assert.strictEqual(flagged.provider, "gemini");
    const fallback = resolveConfig({ rawConfig, projectConfText: "not a setting\nport = nope\nbatch_size = -1\n" });
    assert.strictEqual(fallback.provider, "claude");
    assert.strictEqual(fallback.port, 4321);
    assert.strictEqual(fallback.batchSize, 28);
    assert.throws(
      () => resolveConfig({ rawConfig, projectConfText: "agent = bogus\n" }),
      /Unknown agent provider 'bogus'.*claude.*codex.*gemini.*antigravity/
    );
  });
  await test("commands: splitAgentFlags honors last agent flag and strips flags from rest", () => {
    const { splitAgentFlags } = require("../lib/commands");
    const providers = ["claude", "codex", "gemini", "antigravity"];
    assert.deepStrictEqual(
      splitAgentFlags(["--codex", "5", "--agent=gemini", "go deeper"], providers),
      { agent: "gemini", rest: ["5", "go deeper"] }
    );
    assert.deepStrictEqual(
      splitAgentFlags(["note", "--claude", "--antigravity"], providers),
      { agent: "antigravity", rest: ["note"] }
    );
    assert.throws(() => splitAgentFlags(["--agent=bogus"], providers), /Unknown agent provider 'bogus'.*claude.*codex.*gemini.*antigravity/);
    assert.throws(() => splitAgentFlags(["--bogus"], providers), /Unknown flag '--bogus'.*--claude.*--codex.*--gemini.*--antigravity.*--agent=<name>/);
  });
  await test("ask: buildAskPrompt embeds context and only five recent questions", () => {
    const { buildAskPrompt } = require("../lib/ask");
    const recentQuestions = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-07-0${i + 1}`,
      question: `question ${i + 1}`
    }));
    const prompt = buildAskPrompt("Why driver slice?", {
      learner: { name: "Amit", profile: "Bangalore righty" },
      playbook: "PLAYBOOK_EXCERPT",
      progressDigest: "DIGEST HEADER",
      recentQuestions
    });
    assert.ok(prompt.includes("You are Amit's personal golf coach"));
    assert.ok(prompt.includes("LEARNER: Bangalore righty"));
    assert.ok(prompt.includes("PLAYBOOK_EXCERPT"));
    assert.ok(prompt.includes("LEARNER PROGRESS DIGEST:\nDIGEST HEADER"));
    assert.ok(prompt.includes("QUESTION: Why driver slice?"));
    assert.ok(prompt.includes("- [2026-07-06] question 6"));
    assert.ok(prompt.includes("- [2026-07-02] question 2"));
    assert.ok(!prompt.includes("question 1"));
    assert.ok(prompt.indexOf("question 6") < prompt.indexOf("question 5"));
  });
  await test("ask: mock provider tees stdout, records Q&A, parses topic, and increments ids", async () => {
    const { ask } = require("../lib/ask");
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "golfbits-ask-"));
    const tempQuestions = path.join(tempDir, "questions.json");
    const rawConfig = {
      agent: { provider: "mock", providers: { mock: { command: process.execPath, args: ["-e", "console.log('mock answer SUGGESTED_BIT_TOPIC: wind play')", "{PROMPT}"] } } },
      server: { host: "127.0.0.1", port: 4321 },
      content: { batchSize: 28 },
      learner: { name: "Amit", profile: "profile" }
    };
    let live = "";
    const opts = {
      rawConfig,
      projectConfText: "",
      questionsFile: tempQuestions,
      playbookText: "PLAYBOOK",
      progressDigest: "DIGEST",
      date: "2026-07-06",
      stdout: { write: c => { live += c.toString(); } }
    };
    const first = await ask("how to play wind?", opts);
    const second = await ask("again?", opts);
    assert.strictEqual(first.status, 0);
    assert.strictEqual(second.status, 0);
    assert.ok(first.stdout.includes("mock answer"));
    assert.ok(live.includes("mock answer"));
    const stored = JSON.parse(fs.readFileSync(tempQuestions, "utf8"));
    assert.strictEqual(stored.schema, "golfbits-questions/1");
    assert.strictEqual(stored.questions.length, 2);
    assert.strictEqual(stored.questions[0].id, "q001");
    assert.strictEqual(stored.questions[1].id, "q002");
    assert.strictEqual(stored.questions[0].provider, "mock");
    assert.strictEqual(stored.questions[0].question, "how to play wind?");
    assert.strictEqual(stored.questions[0].suggestedBitTopic, "wind play");
    assert.ok(stored.questions[0].answerSummary.includes("mock answer"));
  });
  await test("ask: buildAskContext seeds base context without a fixed question", () => {
    const { buildAskContext } = require("../lib/ask");
    const recentQuestions = Array.from({ length: 6 }, (_, i) => ({ date: `2026-07-0${i + 1}`, question: `q ${i + 1}` }));
    const ctx = buildAskContext({
      learner: { name: "Amit", profile: "Bangalore righty" },
      playbook: "PLAYBOOK_EXCERPT",
      progressDigest: "DIGEST HEADER",
      recentQuestions
    });
    assert.ok(ctx.includes("interactive session"));
    assert.ok(ctx.includes("LEARNER: Bangalore righty"));
    assert.ok(ctx.includes("PLAYBOOK_EXCERPT"));
    assert.ok(ctx.includes("LEARNER PROGRESS DIGEST:\nDIGEST HEADER"));
    assert.ok(ctx.includes("Greet him"));
    assert.ok(!/\bQUESTION:/.test(ctx), "interactive context must not carry a fixed QUESTION line");
    assert.ok(ctx.includes("- [2026-07-06] q 6"));
    assert.ok(!ctx.includes("q 1"), "only the 5 most recent questions belong in context");
  });
  await test("ask: askInteractive spawns provider with interactiveArgs seeded by context", async () => {
    const { askInteractive } = require("../lib/ask");
    const rawConfig = {
      agent: { provider: "mock", providers: { mock: {
        command: process.execPath,
        args: ["-e", "process.exit(3)", "{PROMPT}"],
        interactiveArgs: ["-e", "process.exit(0)", "{PROMPT}"]
      } } },
      server: { host: "127.0.0.1", port: 4321 },
      content: { batchSize: 28 },
      learner: { name: "Amit", profile: "profile" }
    };
    const r = await askInteractive({
      rawConfig,
      projectConfText: "",
      questionsFile: path.join(os.tmpdir(), "golfbits-interactive-none.json"),
      playbookText: "PLAYBOOK",
      progressDigest: "DIGEST",
      stdio: "ignore"
    });
    assert.strictEqual(r.status, 0, "interactiveArgs template must be used (exit 0), not headless args (exit 3)");
    assert.ok(r.args.includes("-e"));
    assert.ok(r.args.some(a => a.includes("PLAYBOOK") && a.includes("interactive session")), "prompt must carry seeded context");
    assert.ok(!r.args.some(a => /\bQUESTION:/.test(a)));
  });
  await test("ask: askInteractive on missing command exits 127 with switch hint", async () => {
    const { askInteractive } = require("../lib/ask");
    const rawConfig = {
      agent: { provider: "mock", providers: { mock: { command: "definitely-not-a-real-cli-xyz", args: ["{PROMPT}"], interactiveArgs: ["{PROMPT}"] } } },
      server: { host: "127.0.0.1", port: 4321 },
      content: { batchSize: 28 },
      learner: { name: "Amit", profile: "profile" }
    };
    let err = "";
    const r = await askInteractive({
      rawConfig, projectConfText: "", playbookText: "P", progressDigest: "D",
      questionsFile: path.join(os.tmpdir(), "golfbits-interactive-enoent.json"),
      stdio: "ignore", stderr: { write: c => { err += c.toString(); } }
    });
    assert.strictEqual(r.status, 127);
    assert.match(err, /not found on PATH.*golfbits config agent/);
  });
  await test("ask: failing provider records nothing", async () => {
    const { ask } = require("../lib/ask");
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "golfbits-ask-fail-"));
    const tempQuestions = path.join(tempDir, "questions.json");
    const rawConfig = {
      agent: { provider: "mock", providers: { mock: { command: process.execPath, args: ["-e", "process.exit(1)", "{PROMPT}"] } } },
      server: { host: "127.0.0.1", port: 4321 },
      content: { batchSize: 28 },
      learner: { name: "Amit", profile: "profile" }
    };
    const result = await ask("will this record?", {
      rawConfig,
      projectConfText: "",
      questionsFile: tempQuestions,
      playbookText: "PLAYBOOK",
      progressDigest: "DIGEST",
      stdout: { write() {} }
    });
    assert.strictEqual(result.status, 1);
    assert.ok(!fs.existsSync(tempQuestions), "questions.json should not be created on provider failure");
  });
  await test("agent: progressDigest includes recent question coverage signals", () => {
    fs.mkdirSync(path.dirname(questionsPath), { recursive: true });
    fs.writeFileSync(questionsPath, JSON.stringify({
      schema: "golfbits-questions/1",
      questions: [
        { id: "q001", date: "2026-07-01", provider: "claude", question: "How do I judge wind?", answerSummary: "a", suggestedBitTopic: "wind play" },
        { id: "q002", date: "2026-07-02", provider: "claude", question: "Why driver slice?", answerSummary: "b", suggestedBitTopic: "driver slice" },
        { id: "q003", date: "2026-07-03", provider: "claude", question: "Wind again?", answerSummary: "c", suggestedBitTopic: "wind play" }
      ]
    }, null, 2));
    const { progressDigest } = require("../lib/agent");
    const digest = progressDigest();
    assert.ok(digest.includes("Recent learner questions (signal for coverage):"));
    assert.ok(digest.includes('"Wind again?" (2026-07-03)'));
    assert.ok(digest.includes('"How do I judge wind?" (2026-07-01)'));
    assert.ok(digest.includes("Suggested bit topics from Q&A: driver slice; wind play") || digest.includes("Suggested bit topics from Q&A: wind play; driver slice"));
  });

  // ---- server API ----
  const server = createServer();
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  await test("api: GET /api/bits returns full library", async () => {
    const r = await get(port, "/api/bits");
    assert.strictEqual(r.status, 200);
    const arr = JSON.parse(r.body);
    assert.strictEqual(arr.length, bits.length);
    assert.ok(!("__file" in arr[0]), "internal __file leaked");
  });
  await test("api: GET /api/config exposes agent", async () => {
    const r = await get(port, "/api/config");
    assert.strictEqual(JSON.parse(r.body).agent, "claude");
  });
  await test("api: progress round-trip with knownBefore", async () => {
    const p = freshProgress();
    p.entries.push({ id: bits[0].id, date: localDate(), quizCorrect: true, knownBefore: true });
    p.streak = 1; p.longestStreak = 1; p.lastCompletedDate = localDate();
    const w = await get(port, "/api/progress", { method: "POST", body: JSON.stringify(p), headers: { "Content-Type": "application/json" } });
    assert.strictEqual(w.status, 200, w.body);
    const r = await get(port, "/api/progress");
    const back = JSON.parse(r.body);
    assert.strictEqual(back.entries[0].knownBefore, true);
    assert.strictEqual(back.entries[0].id, bits[0].id);
  });
  await test("api: rejects invalid progress with 400", async () => {
    const w = await get(port, "/api/progress", { method: "POST", body: JSON.stringify({ schema: "wrong", entries: "nope" }) });
    assert.strictEqual(w.status, 400);
  });
  await test("api: GET /api/summary reflects posted progress", async () => {
    const r = await get(port, "/api/summary");
    const s = JSON.parse(r.body);
    assert.strictEqual(s.completedCount, 1);
    assert.strictEqual(s.knownCount, 1);
  });
  await test("static: serves app shell", async () => {
    const r = await get(port, "/");
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.includes("golfbits"));
  });
  await test("static: blocks path traversal", async () => {
    const r = await get(port, "/../package.json");
    assert.strictEqual(r.status, 404);
  });
  await test("api: GET /api/playbook returns the playbook markdown", async () => {
    const r = await get(port, "/api/playbook");
    assert.strictEqual(r.status, 200);
    const d = JSON.parse(r.body);
    assert.ok(d.markdown.includes("Golf Playbook"), "playbook content missing");
    assert.ok(d.markdown.includes("## 1."), "expected h2 sections");
  });
  await test("api: GET /api/plan returns the structured plan", async () => {
    const r = await get(port, "/api/plan");
    assert.strictEqual(r.status, 200);
    const d = JSON.parse(r.body);
    assert.ok(Array.isArray(d.weeks) && d.weeks.length, "plan weeks missing");
    assert.ok(d.weeks.every(w => Array.isArray(w.tasks)), "each week needs a tasks array");
    const ids = d.weeks.flatMap(w => w.tasks.map(t => t.id));
    assert.strictEqual(new Set(ids).size, ids.length, "plan task ids must be unique");
    assert.ok(ids.every(Boolean), "every plan task needs an id (checkbox persistence key)");
  });
  await test("static: serves md.js renderer", async () => {
    const r = await get(port, "/md.js");
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.includes("renderMarkdown"));
  });
  server.close();

  // ---- markdown renderer (playbook view) ----
  const { renderMarkdown, extractToc } = require("../app/md.js");
  await test("md: headings, bold, italic, links, hr", () => {
    const h = renderMarkdown("# Title\n\n---\n\n## Sec One\n\n**bold** and *ital* and [link](https://x.dev) and `code`");
    assert.ok(h.includes("<h1") && h.includes(">Title</h1>"));
    assert.ok(h.includes('<h2 id="pb-sec-one">Sec One</h2>'));
    assert.ok(h.includes("<hr>"));
    assert.ok(h.includes("<strong>bold</strong>") && h.includes("<em>ital</em>"));
    assert.ok(h.includes('<a href="https://x.dev" target="_blank" rel="noopener">link</a>'));
    assert.ok(h.includes("<code>code</code>"));
  });
  await test("md: tables and lists", () => {
    const h = renderMarkdown("| A | B |\n|---|---|\n| 1 | 2 |\n\n- one\n- two\n\n1. first\n2. second");
    assert.ok(h.includes("<table><thead><tr><th>A</th><th>B</th></tr></thead>"));
    assert.ok(h.includes("<td>1</td><td>2</td>"));
    assert.ok(h.includes("<ul><li>one</li><li>two</li></ul>"));
    assert.ok(h.includes("<ol><li>first</li><li>second</li></ol>"));
  });
  await test("md: escapes raw HTML and unsafe links", () => {
    const h = renderMarkdown("<script>alert(1)</script> and [bad](javascript:alert(1))");
    assert.ok(!h.includes("<script>"), "raw HTML must be escaped");
    assert.ok(h.includes("&lt;script&gt;"));
    assert.ok(!h.includes("javascript:"), "unsafe href must be dropped");
  });
  await test("md: extractToc returns h2 sections with ids", () => {
    const toc = extractToc("# T\n## First Part\ntext\n## Second Part", 2);
    assert.strictEqual(toc.length, 2);
    assert.strictEqual(toc[0].id, "pb-first-part");
    assert.strictEqual(toc[1].text, "Second Part");
  });
  await test("md: renders the real playbook without empty output", () => {
    const fsMd = fs.readFileSync(require("../lib/paths").PLAYBOOK_FILE, "utf8");
    const h = renderMarkdown(fsMd);
    assert.ok(h.length > 3000, "rendered playbook suspiciously small");
    assert.ok(h.includes("<table>"), "playbook tables not rendered");
    assert.ok(extractToc(fsMd, 2).length >= 4, "expected 4+ playbook sections");
  });

  // ---- CLI smoke ----
  await test("cli: status and validate exit 0", () => {
    execFileSync(process.execPath, ["bin/golfbits.js", "status"], { cwd: ROOT });
    execFileSync(process.execPath, ["bin/golfbits.js", "validate"], { cwd: ROOT });
  });
  await test("package: bin map exposes all global commands and files exist", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    assert.deepStrictEqual(pkg.bin, {
      golfbits: "bin/golfbits.js",
      "golf.learn": "bin/golf-learn.js",
      "golf.learn.rebuild": "bin/golf-learn-rebuild.js",
      "golf.ask": "bin/golf-ask.js"
    });
    for (const rel of Object.values(pkg.bin)) {
      assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} missing`);
    }
  });
  await test("wrapper: golf.learn.rebuild wires agent flag validation", () => {
    const res = spawnSync(process.execPath, ["bin/golf-learn-rebuild.js", "--agent=bogus"], { cwd: ROOT, encoding: "utf8" });
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr + res.stdout, /Unknown agent provider 'bogus'.*claude.*codex.*gemini.*antigravity/);
  });

  // restore repo state (reset to fresh rather than delete — works on restricted filesystems too)
  if (hadProgress) fs.writeFileSync(PROGRESS_FILE, savedProgress);
  else fs.writeFileSync(PROGRESS_FILE, JSON.stringify(freshProgress(), null, 2));
  if (hadQuestions) fs.writeFileSync(questionsPath, savedQuestions);
  else {
    try { fs.unlinkSync(questionsPath); } catch (e) { /* absent ok */ }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
