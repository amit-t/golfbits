"use strict";
/** Bit + progress schema validation. Used by CLI, tests, and agents (via `golfbits validate`). */

const CATEGORIES_HINT = "reuse existing categories where possible";
const DEPTHS = ["core", "deep", "advanced"];

function validateBit(b, where) {
  const errors = [];
  const w = where || (b && b.id) || "bit";
  const req = (field, type) => {
    if (b[field] === undefined || b[field] === null) errors.push(`${w}: missing '${field}'`);
    else if (type && typeof b[field] !== type) errors.push(`${w}: '${field}' must be ${type}`);
  };
  if (!b || typeof b !== "object") return [`${w}: not an object`];
  req("id", "string"); req("seq", "number"); req("category", "string");
  req("title", "string"); req("microFact", "string"); req("lesson", "string");
  if (b.id && !/^b\d{3,}$/.test(b.id)) errors.push(`${w}: id must match b### pattern`);
  if (![1, 2, 3].includes(b.difficulty)) errors.push(`${w}: difficulty must be 1|2|3`);
  if (!DEPTHS.includes(b.depth)) errors.push(`${w}: depth must be one of ${DEPTHS.join("|")}`);
  if (!Array.isArray(b.tags)) errors.push(`${w}: tags must be an array`);
  if (typeof b.lesson === "string") {
    const words = b.lesson.split(/\s+/).filter(Boolean).length;
    if (words < 60) errors.push(`${w}: lesson too short (${words} words, min 60)`);
  }
  if (b.visual !== null && b.visual !== undefined) {
    if (typeof b.visual !== "object") errors.push(`${w}: visual must be object or null`);
    else {
      if (b.visual.type !== "svg") errors.push(`${w}: visual.type must be 'svg'`);
      if (typeof b.visual.svg !== "string" || !b.visual.svg.includes("<svg") || !b.visual.svg.includes("</svg>"))
        errors.push(`${w}: visual.svg must contain an <svg> element`);
      if (typeof b.visual.caption !== "string") errors.push(`${w}: visual.caption required`);
    }
  }
  const q = b.quiz;
  if (!q || typeof q !== "object") errors.push(`${w}: missing quiz`);
  else {
    if (typeof q.question !== "string" || !q.question) errors.push(`${w}: quiz.question missing`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${w}: quiz.options must have 4 entries`);
    else if (new Set(q.options).size !== 4) errors.push(`${w}: quiz.options contains duplicates`);
    if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex > 3)
      errors.push(`${w}: quiz.answerIndex must be 0-3`);
    if (typeof q.explanation !== "string" || !q.explanation) errors.push(`${w}: quiz.explanation missing`);
  }
  return errors;
}

function validateAll(bits) {
  const errors = [];
  const ids = new Set(), seqs = new Set(), titles = new Set();
  const answerDist = {};
  bits.forEach(b => {
    errors.push(...validateBit(b, b.__file || b.id));
    if (b.id) { if (ids.has(b.id)) errors.push(`duplicate id: ${b.id}`); ids.add(b.id); }
    if (b.seq !== undefined) { if (seqs.has(b.seq)) errors.push(`duplicate seq: ${b.seq}`); seqs.add(b.seq); }
    if (b.title) { if (titles.has(b.title)) errors.push(`duplicate title: ${b.title}`); titles.add(b.title); }
    if (b.quiz && Number.isInteger(b.quiz.answerIndex)) answerDist[b.quiz.answerIndex] = (answerDist[b.quiz.answerIndex] || 0) + 1;
  });
  // answer position balance: no position should hold more than 45% of answers (min 12 bits)
  if (bits.length >= 12) {
    for (const [pos, n] of Object.entries(answerDist)) {
      if (n / bits.length > 0.45) errors.push(`quiz answers over-concentrated at position ${pos} (${n}/${bits.length}) — vary answerIndex`);
    }
  }
  return { errors, answerDist, count: bits.length, categories: [...new Set(bits.map(b => b.category))], hint: CATEGORIES_HINT };
}

function validateProgress(p) {
  const errors = [];
  if (!p || typeof p !== "object") return ["progress: not an object"];
  if (p.schema !== "golfbits-progress/2") errors.push("progress: schema must be 'golfbits-progress/2'");
  if (!Array.isArray(p.entries)) errors.push("progress: entries must be an array");
  else p.entries.forEach((e, i) => {
    if (!e.id || typeof e.id !== "string") errors.push(`progress.entries[${i}]: missing id`);
    if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) errors.push(`progress.entries[${i}]: bad date`);
    if (typeof e.knownBefore !== "boolean") errors.push(`progress.entries[${i}]: knownBefore must be boolean`);
  });
  return errors;
}

module.exports = { validateBit, validateAll, validateProgress };
