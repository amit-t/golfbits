#!/usr/bin/env node
"use strict";
/**
 * Range Book: content/range/range-book.src.html + content/range/img/*.jpg -> app/range.html
 * The source keeps two placeholders: __IMG_JSON__ (all frames as data URIs) and
 * __IMG_wallball__ (one inline <img>). Everything else is plain HTML/CSS/JS, so edit the
 * source and rerun: node scripts/build-range.js
 */
const fs = require("fs");
const path = require("path");
const { ROOT, APP_DIR } = require("../lib/paths");

const RANGE_DIR = path.join(ROOT, "content", "range");

function buildRange({ outFile = path.join(APP_DIR, "range.html") } = {}) {
  const src = fs.readFileSync(path.join(RANGE_DIR, "range-book.src.html"), "utf8");
  const imgDir = path.join(RANGE_DIR, "img");
  const IMG = {};
  for (const f of fs.readdirSync(imgDir).filter(f => f.endsWith(".jpg")).sort()) {
    IMG[f.replace(/\.jpg$/, "")] = "data:image/jpeg;base64," + fs.readFileSync(path.join(imgDir, f)).toString("base64");
  }
  if (!IMG.wallball) throw new Error("content/range/img/wallball.jpg missing");
  const titleMatch = src.match(/<title>[^<]*<\/title>/);
  const bodySrc = src.replace(/<title>[^<]*<\/title>\s*/, "")
    .replace("__IMG_JSON__", JSON.stringify(IMG))
    .replace("__IMG_wallball__", IMG.wallball);
  if (/__IMG_/.test(bodySrc)) throw new Error("unreplaced image placeholder in range-book.src.html");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${titleMatch ? titleMatch[0] : "<title>Range Book</title>"}
<meta name="theme-color" content="#166B47">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="golfbits">
<script>
  // Follow the golfbits theme toggle (gb-theme); fall back to the OS setting.
  (function () {
    try { var t = localStorage.getItem("gb-theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
  })();
</script>
<style>[hidden]{display:none!important} img{max-width:100%}</style>
</head>
<body>
${bodySrc}
</body>
</html>
`;
  fs.writeFileSync(outFile, html);
  return { outFile, bytes: Buffer.byteLength(html), images: Object.keys(IMG).length };
}

module.exports = { buildRange };

if (require.main === module) {
  const r = buildRange();
  console.log(`wrote ${path.relative(ROOT, r.outFile)} (${Math.round(r.bytes / 1024)} KB, ${r.images} images)`);
}
