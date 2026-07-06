#!/usr/bin/env node
"use strict";
/** golfbits test suite — zero deps. Run: npm test */
const assert = require("assert");
const fs = require("fs");
const http = require("http");
const { execFileSync } = require("child_process");
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
  server.close();

  // ---- CLI smoke ----
  await test("cli: status and validate exit 0", () => {
    execFileSync(process.execPath, ["bin/golfbits.js", "status"], { cwd: ROOT });
    execFileSync(process.execPath, ["bin/golfbits.js", "validate"], { cwd: ROOT });
  });

  // restore repo state (reset to fresh rather than delete — works on restricted filesystems too)
  if (hadProgress) fs.writeFileSync(PROGRESS_FILE, savedProgress);
  else fs.writeFileSync(PROGRESS_FILE, JSON.stringify(freshProgress(), null, 2));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
