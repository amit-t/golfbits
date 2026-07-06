"use strict";
const fs = require("fs");
const path = require("path");
const { BITS_DIR } = require("./paths");

/** Load all bits from content/bits/*.json, sorted by seq. Throws on malformed JSON. */
function loadBits() {
  if (!fs.existsSync(BITS_DIR)) return [];
  const files = fs.readdirSync(BITS_DIR).filter(f => f.endsWith(".json")).sort();
  const bits = files.map(f => {
    const raw = fs.readFileSync(path.join(BITS_DIR, f), "utf8");
    let bit;
    try { bit = JSON.parse(raw); }
    catch (e) { throw new Error(`Malformed JSON in ${f}: ${e.message}`); }
    bit.__file = f;
    return bit;
  });
  bits.sort((a, b) => (a.seq || 0) - (b.seq || 0));
  return bits;
}

module.exports = { loadBits };
