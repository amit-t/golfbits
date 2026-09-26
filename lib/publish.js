"use strict";
/**
 * Publish dist/pwa to here.now (https://here.now/docs).
 * Auth: $HERENOW_API_KEY, else ~/.herenow/credentials (the file the here.now skill/CLI writes).
 * Without a key here.now makes an anonymous site that expires in 24 hours, so we refuse
 * unless --anonymous is passed.
 * The site's slug is kept in config/herenow.json so every later publish updates the same URL.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { ROOT } = require("./paths");
const { buildPwa, listFiles } = require("./pwa");

const BASE = "https://here.now";
const STATE_FILE = path.join(ROOT, "config", "herenow.json");
const CLIENT = "golfbits/publish";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8"
};

function apiKey() {
  if (process.env.HERENOW_API_KEY) return process.env.HERENOW_API_KEY.trim();
  const f = path.join(os.homedir(), ".herenow", "credentials");
  if (fs.existsSync(f)) return fs.readFileSync(f, "utf8").replace(/\s+/g, "");
  return "";
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch (e) { return {}; }
}

async function call(method, url, key, body) {
  const headers = { "content-type": "application/json", "x-herenow-client": CLIENT };
  if (key) headers.authorization = `Bearer ${key}`;
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch (e) { data = { error: text.slice(0, 300) }; }
  if (!res.ok || data.error) {
    const err = new Error(`here.now ${method} ${url.replace(BASE, "")} failed (${res.status}): ${data.error || text.slice(0, 200)}${data.details ? " — " + JSON.stringify(data.details) : ""}`);
    err.code = data.code;
    throw err;
  }
  return data;
}

async function publish({ anonymous = false, overwrite = false } = {}) {
  const key = apiKey();
  if (!key && !anonymous) {
    throw Object.assign(new Error(
      "No here.now API key. Put it in ~/.herenow/credentials (or HERENOW_API_KEY), " +
      "or pass --anonymous for a site that expires in 24 hours."), { status: 2 });
  }
  const { outDir, version } = buildPwa();
  const state = readState();

  const files = listFiles(outDir).sort().map(rel => {
    const buf = fs.readFileSync(path.join(outDir, rel));
    return {
      path: rel, size: buf.length,
      contentType: TYPES[path.extname(rel).toLowerCase()] || "application/octet-stream",
      hash: crypto.createHash("sha256").update(buf).digest("hex")
    };
  });
  const body = {
    files,
    displayName: "golfbits",
    displayDescription: "Daily golf bits + Range Book, installable on iPhone (Share > Add to Home Screen).",
    viewer: { title: "golfbits", description: "Daily golf learning and range cheat sheets" }
  };
  if (state.slug && state.versionId && !overwrite) body.baseVersionId = state.versionId;
  if (state.slug && state.claimToken) body.claimToken = state.claimToken;

  const created = state.slug
    ? await call("PUT", `${BASE}/api/v1/publish/${state.slug}`, key, body)
    : await call("POST", `${BASE}/api/v1/publish`, key, body);

  const uploads = (created.upload && created.upload.uploads) || [];
  const skipped = (created.upload && created.upload.skipped) || [];
  console.log(`uploading ${uploads.length} file(s)${skipped.length ? `, ${skipped.length} unchanged` : ""}…`);
  let failed = 0;
  await Promise.all(uploads.map(async u => {
    const buf = fs.readFileSync(path.join(outDir, u.path));
    const res = await fetch(u.url, { method: u.method || "PUT", headers: u.headers || {}, body: buf }).catch(() => null);
    if (!res || !res.ok) { failed++; console.error(`  upload failed: ${u.path} (${res ? res.status : "network"})`); }
  }));
  if (failed) throw new Error(`${failed} upload(s) failed; nothing was made live. Run the command again.`);

  const fin = await call("POST", created.upload.finalizeUrl, key, { versionId: created.upload.versionId });
  const next = {
    slug: fin.slug || created.slug,
    siteUrl: fin.siteUrl || created.siteUrl,
    versionId: fin.currentVersionId || created.upload.versionId,
    buildVersion: version,
    publishedAt: new Date().toISOString(),
    anonymous: !!created.anonymous
  };
  if (created.claimToken) next.claimToken = created.claimToken;
  if (created.claimUrl) next.claimUrl = created.claimUrl;
  if (created.expiresAt) next.expiresAt = created.expiresAt;
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state, ...next }, null, 2) + "\n");

  console.log(`\n⛳ live: ${next.siteUrl}`);
  if (next.anonymous) console.log(`   anonymous site, expires ${next.expiresAt}. Claim it (sign in first): ${next.claimUrl}`);
  console.log(`\nOn your iPhone: open that link in Safari → Share → Add to Home Screen.`);
  console.log(`Progress on the phone stays on the phone. Slug saved to config/herenow.json; commit it.`);
  return next;
}

module.exports = { publish, apiKey, STATE_FILE };
