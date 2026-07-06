"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { APP_DIR, PLAYBOOK_FILE } = require("./paths");
const { loadBits } = require("./content");
const { readProgress, writeProgress, summarize } = require("./progress");
const { resolveConfig } = require("./conf");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2" };

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(body);
}

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const p = url.pathname;

    // ---- API ----
    if (p === "/api/bits" && req.method === "GET") {
      try {
        const bits = loadBits().map(({ __file, ...bit }) => bit);
        return json(res, 200, bits);
      } catch (e) { return json(res, 500, { error: e.message }); }
    }
    if (p === "/api/progress" && req.method === "GET") return json(res, 200, readProgress());
    if (p === "/api/progress" && req.method === "POST") {
      let body = "";
      req.on("data", c => { body += c; if (body.length > 2e6) req.destroy(); });
      req.on("end", () => {
        try { return json(res, 200, writeProgress(JSON.parse(body))); }
        catch (e) { return json(res, 400, { error: e.message }); }
      });
      return;
    }
    if (p === "/api/summary" && req.method === "GET") {
      try { return json(res, 200, summarize(readProgress(), loadBits())); }
      catch (e) { return json(res, 500, { error: e.message }); }
    }
    if (p === "/api/config" && req.method === "GET") {
      const c = resolveConfig();
      return json(res, 200, { agent: c.provider, learner: c.raw.learner.name, batchSize: c.batchSize });
    }
    if (p === "/api/playbook" && req.method === "GET") {
      try {
        return json(res, 200, { markdown: fs.readFileSync(PLAYBOOK_FILE, "utf8") });
      } catch (e) { return json(res, 404, { error: "docs/PLAYBOOK.md not found" }); }
    }

    // ---- static app ----
    if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });
    let file = p === "/" ? "/index.html" : p;
    file = path.normalize(file).replace(/^(\.\.[/\\])+/, "");
    const full = path.join(APP_DIR, file);
    if (!full.startsWith(APP_DIR) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(full)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(full).pipe(res);
  });
}

module.exports = { createServer };
