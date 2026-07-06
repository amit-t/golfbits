"use strict";
/* golfbits frontend — talks to the local daemon; progress lives on disk (data/progress.json). */

let bits = [], progress = null, config = { agent: "claude" };
let view = "today", quizAnswered = null, readingId = null, libFilter = "All";

const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function localDate(d) {
  const x = d || new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
const yesterday = () => localDate(new Date(Date.now() - 864e5));
const doneToday = () => progress.lastCompletedDate === localDate();
const nextIndex = () => progress.entries.length;
const entryFor = id => progress.entries.find(e => e.id === id);
const currentStreak = () => (progress.lastCompletedDate === localDate() || progress.lastCompletedDate === yesterday()) ? progress.streak : 0;

// ---------- boot ----------
async function boot() {
  try {
    const [b, p, c] = await Promise.all([
      fetch("/api/bits").then(r => r.json()),
      fetch("/api/progress").then(r => r.json()),
      fetch("/api/config").then(r => r.json())
    ]);
    bits = b; progress = p; config = c;
    $("#agentChip").textContent = "agent: " + config.agent;
    document.querySelectorAll(".tabs button").forEach(btn =>
      btn.addEventListener("click", () => { view = btn.dataset.view; readingId = null; quizAnswered = null; render(); }));
    render();
  } catch (e) {
    $("#main").innerHTML = `<div class="error-box"><b>Can't reach the golfbits daemon.</b><br>Start it from the repo folder with <code>golfbits open</code> (or <code>npm start</code>) and reload.</div>`;
  }
}

// ---------- actions ----------
function answerQuiz(picked) {
  const bit = bits[nextIndex()];
  quizAnswered = { picked, correct: picked === bit.quiz.answerIndex };
  render();
}

async function completeBit(knownBefore) {
  if (doneToday()) return;
  const bit = bits[nextIndex()];
  progress.entries.push({
    id: bit.id, date: localDate(),
    quizCorrect: quizAnswered ? quizAnswered.correct : null,
    knownBefore: !!knownBefore
  });
  progress.streak = progress.lastCompletedDate === yesterday() ? progress.streak + 1 : 1;
  progress.lastCompletedDate = localDate();
  progress.longestStreak = Math.max(progress.longestStreak, progress.streak);
  quizAnswered = null;
  const res = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(progress) });
  if (!res.ok) { alert("Failed to save progress: " + (await res.json()).error); }
  render();
}

// ---------- render ----------
function render() {
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  const pct = bits.length ? Math.round(100 * progress.entries.length / bits.length) : 0;
  const C = 2 * Math.PI * 18;
  $("#ringFg").setAttribute("stroke-dasharray", `${C * pct / 100} ${C}`);
  $("#ringFg").setAttribute("stroke-dashoffset", "0");
  $("#ringLabel").textContent = pct + "%";
  $("#streakNum").textContent = currentStreak();

  const main = $("#main");
  if (view === "today") main.innerHTML = renderToday();
  else if (view === "journey") main.innerHTML = renderJourney();
  else if (view === "library") main.innerHTML = renderLibrary();
  else if (view === "playbook") main.innerHTML = renderPlaybook();
  else main.innerHTML = renderStats();
  bindDynamic();
}

// ---------- playbook ----------
let playbookMd = null, playbookLoading = false;
function renderPlaybook() {
  if (playbookMd === null) {
    if (!playbookLoading) {
      playbookLoading = true;
      fetch("/api/playbook").then(r => r.json()).then(d => {
        playbookMd = d.markdown || "";
        playbookLoading = false;
        if (view === "playbook") render();
      }).catch(() => {
        playbookMd = "";
        playbookLoading = false;
        if (view === "playbook") render();
      });
    }
    return `<div class="card done-banner"><div class="big">📖</div><p>Loading your playbook…</p></div>`;
  }
  if (!playbookMd) return `<div class="error-box">Playbook not found — expected <code>docs/PLAYBOOK.md</code> in the repo.</div>`;
  const toc = GolfMd.extractToc(playbookMd, 2);
  const chips = toc.length ? `<div class="filter-row pb-toc">` + toc.map(t =>
    `<button data-scroll="${t.id}">${esc(t.text.replace(/^\d+\.\s*/, ""))}</button>`).join("") + `</div>` : "";
  return chips + `<div class="card md">${GolfMd.renderMarkdown(playbookMd)}</div>`;
}

function visualHtml(bit) {
  if (!bit.visual) return "";
  return `<figure class="visual">${bit.visual.svg}<figcaption>${esc(bit.visual.caption)}</figcaption></figure>`;
}

function bitCard(bit, { quiz, revealed } = {}) {
  const idx = bits.findIndex(b => b.id === bit.id);
  let quizHtml = "";
  if (quiz) {
    const answered = quizAnswered !== null;
    quizHtml = `<div class="quiz"><h3>Quick quiz</h3><p class="q">${esc(bit.quiz.question)}</p>` +
      bit.quiz.options.map((o, i) => {
        let cls = "opt";
        if (answered) {
          if (i === bit.quiz.answerIndex) cls += " correct";
          else if (quizAnswered.picked === i) cls += " wrong";
          else cls += " faded";
        }
        return `<button class="${cls}" data-opt="${i}" ${answered ? "disabled" : ""}><span class="key">${"ABCD"[i]}</span>${esc(o)}</button>`;
      }).join("") +
      (answered ? `<div class="explain"><b>${quizAnswered.correct ? "Correct." : "Not quite."}</b> ${esc(bit.quiz.explanation)}</div>
        <div class="finish-row">
          <button class="btn primary" data-finish="new">Learned something new ✓</button>
          <button class="btn secondary" data-finish="known">I already knew this</button>
        </div>
        <p class="known-note">"Already knew" tells your AI agent to go deeper on ${esc(bit.category)} next time it rebuilds content.</p>` : "");
    quizHtml += "</div>";
  } else if (revealed) {
    quizHtml = `<div class="quiz"><h3>Quiz (answer shown)</h3><p class="q">${esc(bit.quiz.question)}</p>` +
      bit.quiz.options.map((o, i) =>
        `<button class="opt ${i === bit.quiz.answerIndex ? "correct" : "faded"}" disabled><span class="key">${"ABCD"[i]}</span>${esc(o)}</button>`).join("") +
      `<div class="explain">${esc(bit.quiz.explanation)}</div></div>`;
  }
  const e = entryFor(bit.id);
  const knownChip = e && e.knownBefore ? `<span class="chip deep">already knew</span>` : "";
  return `<div class="card">
    <span class="chip">${esc(bit.category)}</span><span class="chip n">bit ${idx + 1} of ${bits.length}</span>${bit.depth !== "core" ? `<span class="chip deep">${bit.depth}</span>` : ""}${knownChip}
    <h1 class="bit-title">${esc(bit.title)}</h1>
    <div class="microfact"><small>30-second fact</small>${esc(bit.microFact)}</div>
    ${visualHtml(bit)}
    <div class="lesson">${esc(bit.lesson)}</div>
    ${quizHtml}</div>`;
}

function renderToday() {
  if (!bits.length) return `<div class="error-box">No bits found in <code>content/bits/</code>.</div>`;
  const idx = nextIndex();
  if (idx >= bits.length) return agentCard(true);
  if (doneToday()) {
    const last = bits.find(b => b.id === progress.entries[progress.entries.length - 1].id);
    return `<div class="card done-banner"><div class="big">⛳</div><h2>Done for today</h2>
      <p>Bit ${idx + 1} unlocks tomorrow. Revisit today's bit below, walk the Journey map, or revise in the Library.</p></div>` +
      (last ? bitCard(last, { revealed: true }) : "") +
      (bits.length - idx <= 7 ? agentCard(false) : "");
  }
  return bitCard(bits[idx], { quiz: true });
}

function agentCard(exhausted) {
  const n = bits.length;
  return `<div class="card agent-panel">
    <h3>${exhausted ? `🎉 All ${n} bits complete — generate your next set` : "Running low — top up your bits"}</h3>
    <p>Your configured agent (<b>${esc(config.agent)}</b>) reads your progress — including what you marked "already knew" — and builds content at the right depth. Run in the repo folder:</p>
    ${cmd("golfbits extend")}
    <p>Want the remaining bits rebuilt around how you're doing instead?</p>
    ${cmd("golfbits restructure")}
  </div>`;
}
const cmd = c => `<div class="cmd"><span>${esc(c)}</span><button data-copy="${esc(c)}">copy</button></div>`;

// ---------- journey ----------
function renderJourney() {
  const perRow = 7, rows = Math.ceil(bits.length / perRow);
  const W = 700, nodeGap = 92, rowH = 96, padX = 60, padY = 56;
  const H = padY * 2 + (rows - 1) * rowH;
  const pos = i => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const x = padX + (r % 2 === 0 ? c : perRow - 1 - c) * nodeGap;
    return { x, y: padY + r * rowH };
  };
  let path = "";
  for (let i = 0; i < bits.length; i++) {
    const { x, y } = pos(i);
    if (i === 0) { path += `M ${x} ${y}`; continue; }
    const prev = pos(i - 1);
    path += prev.y === y ? ` L ${x} ${y}` : ` C ${prev.x + (prev.x > W / 2 ? 70 : -70)} ${prev.y + rowH / 2}, ${x + (x > W / 2 ? 70 : -70)} ${y - rowH / 2}, ${x} ${y}`;
  }
  const cur = nextIndex();
  const nodes = bits.map((b, i) => {
    const { x, y } = pos(i);
    const e = entryFor(b.id);
    const unlocked = i < cur || (i === cur && !doneToday());
    let fill = "#E5E7EB", stroke = "#D1D5DB", label = "#6B7280", extra = "";
    if (e && e.knownBefore) { fill = "#D97706"; stroke = "#B45309"; label = "#fff"; }
    else if (e) { fill = "#059669"; stroke = "#047857"; label = "#fff"; }
    else if (i === cur) { fill = "#FFFFFF"; stroke = "#059669"; label = "#059669"; extra = "class='jnode-current'"; }
    const flag = i === bits.length - 1 ? `<line x1="${x}" y1="${y - 34}" x2="${x}" y2="${y - 16}" stroke="#1F2937" stroke-width="2"/><path d="M ${x} ${y - 34} l 14 5 -14 5z" fill="#B91C1C"/>` : "";
    const marker = e && e.knownBefore ? "★" : e ? "✓" : i + 1;
    return `<g class="jnode ${i < cur || i === cur ? "" : "locked"}" data-node="${i < cur ? b.id : ""}">
      ${flag}
      <circle ${extra} cx="${x}" cy="${y}" r="13" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="${e ? 12 : 10}" font-weight="600" fill="${label}">${marker}</text>
      <title>${esc(b.title)}${e ? (e.knownBefore ? " — already knew" : " — done") : ""}</title></g>`;
  }).join("");
  const weekLabels = Array.from({ length: rows }, (_, r) => {
    const y = padY + r * rowH;
    return `<text x="12" y="${y + 4}" font-size="10" fill="#9CA3AF" font-weight="600">W${r + 1}</text>`;
  }).join("");
  return `<div class="card">
    <div class="journey-legend">
      <span><span class="dot" style="background:#059669"></span> learned</span>
      <span><span class="dot" style="background:#D97706"></span> already knew</span>
      <span><span class="dot" style="background:#fff;border:2px solid #059669"></span> today</span>
      <span><span class="dot" style="background:#E5E7EB"></span> ahead</span>
    </div>
    <svg class="journey-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="inherit">
      <path d="${path}" fill="none" stroke="#E5E7EB" stroke-width="6" stroke-linecap="round"/>
      ${weekLabels}${nodes}
    </svg>
    <p style="font-size:13px;color:var(--ink-3);text-align:center;margin-top:8px">click any visited bit to reread it · ★ = you already knew it</p>
  </div>`;
}

// ---------- library ----------
function renderLibrary() {
  if (readingId) {
    const bit = bits.find(b => b.id === readingId);
    return `<button class="btn ghost back" data-back="1">← Back</button>` + bitCard(bit, { revealed: !!entryFor(bit.id) });
  }
  const cats = ["All", ...new Set(bits.map(b => b.category))];
  const cur = nextIndex();
  const filters = `<div class="filter-row">` + cats.map(c =>
    `<button class="${libFilter === c ? "on" : ""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("") + "</div>";
  const items = bits.map((b, i) => {
    if (libFilter !== "All" && b.category !== libFilter) return "";
    const e = entryFor(b.id);
    const unlocked = i < cur || (i === cur && !doneToday());
    if (!unlocked && !e) return `<div class="lib-item locked"><span class="n">${i + 1}</span><span class="t">Locked — day ${i + 1}</span><span class="c">${esc(b.category)}</span><span class="badge">🔒</span></div>`;
    const badge = e ? (e.knownBefore ? "★" : "✓") : "•";
    return `<button class="lib-item" data-read="${b.id}"><span class="n">${i + 1}</span><span class="t">${esc(b.title)}</span><span class="c">${esc(b.category)}</span><span class="badge">${badge}</span></button>`;
  }).join("");
  return filters + items;
}

// ---------- stats ----------
function renderStats() {
  const entries = progress.entries;
  const attempts = entries.filter(e => typeof e.quizCorrect === "boolean");
  const acc = attempts.length ? Math.round(100 * attempts.filter(e => e.quizCorrect).length / attempts.length) : 0;
  const known = entries.filter(e => e.knownBefore).length;
  const byCat = {};
  bits.forEach(b => { byCat[b.category] = byCat[b.category] || { total: 0, done: 0, known: 0, wrong: 0 }; byCat[b.category].total++; });
  entries.forEach(e => {
    const b = bits.find(x => x.id === e.id); if (!b) return;
    const c = byCat[b.category];
    c.done++; if (e.knownBefore) c.known++; if (e.quizCorrect === false) c.wrong++;
  });
  const rows = Object.entries(byCat).map(([cat, c]) => {
    const p = Math.round(100 * c.done / c.total);
    const notes = [c.known ? `★${c.known} known` : "", c.wrong ? `${c.wrong} missed` : ""].filter(Boolean).join(" · ");
    return `<div class="cat-row"><span class="name">${esc(cat)}</span><div class="track"><div class="fill" style="width:${p}%"></div></div><span class="pct">${notes || p + "%"}</span></div>`;
  }).join("");
  return `<div class="stat-grid">
      <div class="stat"><div class="v green">${entries.length}</div><div class="l">bits completed</div></div>
      <div class="stat"><div class="v">${acc}%</div><div class="l">quiz accuracy</div></div>
      <div class="stat"><div class="v">${currentStreak()}🔥</div><div class="l">streak (best ${progress.longestStreak})</div></div>
      <div class="stat"><div class="v">${known}★</div><div class="l">already knew</div></div>
    </div>
    <div class="card"><h3 style="font-size:16px;margin-bottom:16px">Progress by category</h3>${rows}</div>
    <div class="card agent-panel">
      <h3>Your AI content agent: ${esc(config.agent)}</h3>
      <p>These run in a terminal from the repo folder. The agent reads <code>data/progress.json</code> — quiz misses pull more coverage, "already knew" markings push depth up.</p>
      ${cmd("golfbits status")}${cmd("golfbits extend")}${cmd("golfbits restructure make it more visual")}${cmd(`golfbits config agent ${config.agent === "claude" ? "codex" : "claude"}`)}
    </div>`;
}

// ---------- event wiring (re-bound after each render) ----------
function bindDynamic() {
  document.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => answerQuiz(+b.dataset.opt)));
  document.querySelectorAll("[data-finish]").forEach(b => b.addEventListener("click", () => completeBit(b.dataset.finish === "known")));
  document.querySelectorAll("[data-read]").forEach(b => b.addEventListener("click", () => { readingId = b.dataset.read; render(); }));
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => { readingId = null; render(); }));
  document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { libFilter = b.dataset.filter; render(); }));
  document.querySelectorAll("[data-node]").forEach(g => g.addEventListener("click", () => {
    if (g.dataset.node) { readingId = g.dataset.node; view = "library"; render(); }
  }));
  document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copied!"; setTimeout(() => b.textContent = "copy", 1200); }
    catch (e) { b.textContent = "select it"; }
  }));
  document.querySelectorAll("[data-scroll]").forEach(b => b.addEventListener("click", () => {
    const el = document.getElementById(b.dataset.scroll);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

boot();
