#!/usr/bin/env node
"use strict";
/**
 * One-time migration: golf-daily/bytes.js (v1) -> content/bits/*.json (v2).
 * Kept in the repo for provenance. Safe to re-run (overwrites bits files).
 * Usage: node scripts/migrate-from-v1.js [path-to-v1-bytes.js]
 */
const fs = require("fs");
const path = require("path");
const { BITS_DIR } = require("../lib/paths");
const visuals = require("./visuals");

const src = process.argv[2] || path.resolve(__dirname, "..", "..", "golf-daily", "bytes.js");
if (!fs.existsSync(src)) { console.error(`v1 bytes not found at ${src}`); process.exit(1); }
const v1 = require(src);

const TAGS = {
  "Foundations": ["basics"], "Etiquette": ["etiquette", "social"], "Rules": ["rules"],
  "Equipment & Fitting": ["equipment", "fitting"], "Scoring & Formats": ["scoring", "formats"],
  "Handicap & Competition": ["handicap", "competition"], "Course Management": ["strategy"],
  "Lingo & Culture": ["culture", "lingo"], "Mental & Practice": ["mental", "practice"], "India Golf": ["india"]
};

fs.mkdirSync(BITS_DIR, { recursive: true });
let withVisuals = 0;
v1.forEach((b, i) => {
  const bit = {
    id: b.id,
    seq: i + 1,
    category: b.category,
    difficulty: b.difficulty,
    depth: b.difficulty === 3 ? "deep" : "core",
    tags: TAGS[b.category] || [b.category.toLowerCase()],
    title: b.title,
    microFact: b.microFact,
    lesson: b.lesson,
    visual: visuals[b.id] ? { type: "svg", svg: visuals[b.id].svg, caption: visuals[b.id].caption } : null,
    quiz: b.quiz
  };
  if (bit.visual) withVisuals++;
  fs.writeFileSync(path.join(BITS_DIR, `${b.id}.json`), JSON.stringify(bit, null, 2) + "\n");
});
console.log(`Migrated ${v1.length} bits to ${BITS_DIR} (${withVisuals} with visuals).`);
