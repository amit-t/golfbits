"use strict";
/* golfbits frontend — talks to the local daemon; progress lives on disk (data/progress.json).
   UI redesign per spec 002: warm parchment + club green, serif display, four-state journey map. */

let bits = [], progress = null, config = { agent: "claude" };
let view = "today", quizAnswered = null, readingId = null, libFilter = "All", continuing = false, justCompleted = false;

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

// ---------- theme ----------
function currentTheme() { return document.body.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  document.body.setAttribute("data-theme", t);
  const btn = $("#themeToggle");
  if (btn) { btn.textContent = t === "dark" ? "☀" : "☾"; btn.setAttribute("aria-label", t === "dark" ? "Switch to light mode" : "Switch to dark mode"); }
}
function toggleTheme() {
  const t = currentTheme() === "dark" ? "light" : "dark";
  try { localStorage.setItem("gb-theme", t); } catch (e) { /* ignore */ }
  applyTheme(t);
  render(); // redraw journey SVG with theme palette
}

// ---------- boot ----------
async function boot() {
  applyTheme(currentTheme());
  $("#themeToggle").addEventListener("click", toggleTheme);
  try {
    const [b, p, c] = await Promise.all([
      fetch("/api/bits").then(r => r.json()),
      fetch("/api/progress").then(r => r.json()),
      fetch("/api/config").then(r => r.json())
    ]);
    bits = b; progress = p; config = c;
    $("#agentChip").textContent = "agent: " + config.agent;
    document.querySelectorAll(".tabs button").forEach(btn =>
      btn.addEventListener("click", () => { view = btn.dataset.view; readingId = null; quizAnswered = null; continuing = false; justCompleted = false; render(); }));
    document.addEventListener("keydown", quizAccelerator);
    render();
  } catch (e) {
    $("#main").innerHTML = clubhouseClosed();
    document.querySelectorAll(".tabs button").forEach(btn => btn.disabled = true);
    bindDynamic();
  }
}

// keyboard: A–D answer the live quiz
function quizAccelerator(e) {
  if (view !== "today" || quizAnswered !== null || !bits.length) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const idx = nextIndex();
  if (idx >= bits.length) return;
  if (doneToday() && !continuing) return;
  const i = "ABCD".indexOf((e.key || "").toUpperCase());
  const bit = bits[idx];
  if (i >= 0 && bit && i < bit.quiz.options.length) { e.preventDefault(); answerQuiz(i); }
}

// ---------- actions ----------
function answerQuiz(picked) {
  const bit = bits[nextIndex()];
  quizAnswered = { picked, correct: picked === bit.quiz.answerIndex };
  render();
}

async function completeBit(knownBefore) {
  const already = doneToday();
  if (already && !continuing) return;   // one bit/day unless the learner chose to keep going
  const bit = bits[nextIndex()];
  if (!bit) return;
  progress.entries.push({
    id: bit.id, date: localDate(),
    quizCorrect: quizAnswered ? quizAnswered.correct : null,
    knownBefore: !!knownBefore
  });
  if (!already) {
    // first bit of the day drives the streak; extra bits count toward progress but don't re-bump it
    progress.streak = progress.lastCompletedDate === yesterday() ? progress.streak + 1 : 1;
    progress.lastCompletedDate = localDate();
    progress.longestStreak = Math.max(progress.longestStreak, progress.streak);
  }
  quizAnswered = null;
  continuing = false;   // land back on the done banner, which re-offers "keep going"
  justCompleted = true; // drives the one-shot completion micro-moment
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
  $("#ringLabel").textContent = pct + "%";
  $("#streakNum").textContent = currentStreak();

  const main = $("#main");
  if (view === "today") main.innerHTML = renderToday();
  else if (view === "journey") main.innerHTML = renderJourney();
  else if (view === "plan") main.innerHTML = renderPlan();
  else if (view === "library") main.innerHTML = renderLibrary();
  else if (view === "playbook") main.innerHTML = renderPlaybook();
  else main.innerHTML = renderStats();
  bindDynamic();
}

const cmd = c => `<div class="cmd"><span>${esc(c)}</span><button data-copy="${esc(c)}">copy</button></div>`;
const cmdList = arr => `<div class="cmd-list">${arr.map(cmd).join("")}</div>`;

function clubhouseClosed() {
  return `<div class="card clubhouse" data-screen="daemon-off">
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      <circle cx="28" cy="28" r="26" fill="var(--track)"/>
      <line x1="28" y1="14" x2="28" y2="34" stroke="var(--ink-4)" stroke-width="2.5"/>
      <path d="M28 14 l13 5 -13 5z" fill="var(--ink-4)"/>
    </svg>
    <h2>The clubhouse is closed</h2>
    <p>Can't reach the golfbits daemon. Start it from the repo folder with <code>golfbits open</code> (or <code>npm start</code>) and reload.</p>
    ${cmd("golfbits open")}
  </div>`;
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
    return `<div class="card done-banner"><p>Loading your playbook…</p></div>`;
  }
  if (!playbookMd) return `<div class="card error-box">Playbook not found — expected <code>docs/PLAYBOOK.md</code> in the repo.</div>`;
  const toc = GolfMd.extractToc(playbookMd, 2);
  const chips = toc.length ? `<div class="pb-toc">` + toc.map(t =>
    `<button data-scroll="${t.id}">${esc(t.text.replace(/^\d+\.\s*/, ""))}</button>`).join("") + `</div>` : "";
  return chips + `<div class="card md">${GolfMd.renderMarkdown(playbookMd)}</div>`;
}

// ---------- plan ----------
let planData = null, planLoading = false;

async function togglePlanTask(taskId, on) {
  if (!progress.plan) progress.plan = {};
  if (on) progress.plan[taskId] = true; else delete progress.plan[taskId];
  render(); // optimistic
  const res = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(progress) });
  if (!res.ok) { alert("Failed to save plan: " + (await res.json()).error); }
}

function planChecked(id) { return !!(progress.plan && progress.plan[id]); }

function renderPlan() {
  if (planData === null) {
    if (!planLoading) {
      planLoading = true;
      fetch("/api/plan").then(r => r.json()).then(d => {
        planData = d; planLoading = false;
        if (view === "plan") render();
      }).catch(() => { planData = false; planLoading = false; if (view === "plan") render(); });
    }
    return `<div class="card done-banner"><p>Loading your plan…</p></div>`;
  }
  if (!planData || !Array.isArray(planData.weeks)) {
    return `<div class="card error-box">Plan not found — expected <code>content/plan.json</code> in the repo.</div>`;
  }
  const allTasks = planData.weeks.flatMap(w => w.tasks || []);
  const done = allTasks.filter(t => planChecked(t.id)).length;
  const pct = allTasks.length ? Math.round(100 * done / allTasks.length) : 0;

  const header = `<div class="card plan-head">
    <h1 class="bit-title">${esc(planData.title || "Your Plan")}</h1>
    <p class="plan-intro">${esc(planData.intro || "")}</p>
    <div class="plan-progress"><div class="track"><div class="fill" style="width:${pct}%"></div></div><span class="pct">${done}/${allTasks.length} done</span></div>
  </div>`;

  const weeks = planData.weeks.map(w => {
    const tasks = (w.tasks || []).map(t => {
      const on = planChecked(t.id);
      return `<button class="plan-task ${on ? "on" : ""}" data-plan-task="${esc(t.id)}" data-plan-on="${on ? 1 : 0}" aria-pressed="${on}">
        <span class="box" aria-hidden="true"></span>
        <span class="body"><span class="txt">${esc(t.text)}</span>${t.detail ? `<span class="detail">${esc(t.detail)}</span>` : ""}</span>
      </button>`;
    }).join("");
    return `<div class="card plan-week">
      <div class="plan-week-head"><span class="wk">${esc(w.label)}</span><span class="focus">${esc(w.focus || "")}</span></div>
      <div class="plan-tasks">${tasks}</div></div>`;
  }).join("");

  let gear = "";
  if (planData.gear) {
    const g = planData.gear;
    const rows = arr => arr.map(x =>
      `<div class="gear-row"><span class="slot">${esc(x.slot)}</span><span class="pick">${esc(x.pick)}</span><span class="price">${esc(x.price)}</span></div>`).join("");
    gear = `<div class="card plan-gear">
      <h3>${esc(g.title || "Gear")}</h3>
      ${g.note ? `<p class="plan-intro">${esc(g.note)}</p>` : ""}
      <div class="row-list">${rows(g.items || [])}</div>
      ${g.soft && g.soft.length ? `<h3 style="margin-top:18px">Soft gear still pending</h3><div class="row-list">${rows(g.soft)}</div>` : ""}
    </div>`;
  }

  let contacts = "";
  if (Array.isArray(planData.contacts) && planData.contacts.length) {
    contacts = `<div class="card plan-contacts"><h3>Contacts</h3><div class="row-list">` +
      planData.contacts.map(c =>
        `<div class="contact-row"><span class="cn">${esc(c.name)}</span><span class="cv">${esc(c.value)}</span></div>`).join("") +
      `</div></div>`;
  }

  return header + weeks + gear + contacts;
}

// ---------- bit card ----------
function visualHtml(bit) {
  if (!bit.visual) return "";
  return `<figure class="visual"><div class="frame">${bit.visual.svg}</div><figcaption>${esc(bit.visual.caption)}</figcaption></figure>`;
}

function bitCard(bit, { quiz, revealed } = {}) {
  const idx = bits.findIndex(b => b.id === bit.id);
  const e = entryFor(bit.id);
  const knewChip = e && e.knownBefore ? `<span class="chip knew">★ already knew</span>` : "";
  let quizHtml = "";
  if (quiz) {
    const answered = quizAnswered !== null;
    const opts = bit.quiz.options.map((o, i) => {
      let cls = "opt";
      if (answered) {
        if (i === bit.quiz.answerIndex) cls += " correct";
        else if (quizAnswered.picked === i) cls += " wrong";
        else cls += " faded";
      }
      return `<button class="${cls}" data-opt="${i}" ${answered ? "disabled" : ""}><span class="key">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`;
    }).join("");
    quizHtml = `<div class="quiz"><h3>Quick quiz</h3><p class="q">${esc(bit.quiz.question)}</p><div class="opts">${opts}</div>` +
      (answered ? `<div class="explain"><b>${quizAnswered.correct ? "Correct." : "Not quite."}</b> ${esc(bit.quiz.explanation)}</div>
        <div class="finish-row">
          <button class="btn primary" data-finish="new">Learned something new ✓</button>
          <button class="btn secondary" data-finish="known">★ I already knew this</button>
        </div>
        <p class="known-note">"Already knew" tells your AI agent to go deeper on ${esc(bit.category)} next time it rebuilds content.</p>` : "") +
      `</div>`;
  } else if (revealed) {
    const opts = bit.quiz.options.map((o, i) =>
      `<button class="opt ${i === bit.quiz.answerIndex ? "correct" : "faded"}" disabled><span class="key">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("");
    quizHtml = `<div class="quiz"><h3>Quiz (answer shown)</h3><p class="q">${esc(bit.quiz.question)}</p><div class="opts">${opts}</div>
      <div class="explain">${esc(bit.quiz.explanation)}</div></div>`;
  }
  return `<article class="card bit">
    <div class="chips"><span class="chip">${esc(bit.category)}</span><span class="chip count">hole ${idx + 1} of ${bits.length}</span>${knewChip}</div>
    <h1 class="bit-title">${esc(bit.title)}</h1>
    <div class="microfact"><small>30-second fact</small>${esc(bit.microFact)}</div>
    ${visualHtml(bit)}
    <div class="lesson">${esc(bit.lesson)}</div>
    ${quizHtml}</article>`;
}

// ---------- today ----------
function renderToday() {
  if (!bits.length) return `<div class="card error-box">No bits found in <code>content/bits/</code>.</div>`;
  const idx = nextIndex();
  if (idx >= bits.length) return allDoneCard();
  if (doneToday() && !continuing) {
    const last = bits.find(b => b.id === progress.entries[progress.entries.length - 1].id);
    const lastEntry = progress.entries[progress.entries.length - 1];
    const next = bits[idx];
    const title = justCompleted ? "That's a hole walked." : "Done for today";
    const note = (justCompleted && lastEntry && lastEntry.knownBefore)
      ? "★ marked as already known — your agent will go deeper here."
      : "See you on the tee tomorrow.";
    const banner = `<div class="card done-banner" data-screen="done-today">
      <div class="celebrate gb-pop">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
          <ellipse cx="32" cy="50" rx="22" ry="6" fill="var(--accent-soft)"/>
          <circle cx="32" cy="50" r="3.5" fill="var(--card)" stroke="var(--ink-2)" stroke-width="1.5"/>
          <line x1="32" y1="50" x2="32" y2="12" stroke="var(--ink-2)" stroke-width="2.5"/>
          <path d="M32 12 l20 7 -20 7z" fill="var(--danger)"/>
        </svg>
        <h2>${title}</h2>
        <p>Your streak is locked in. Revisit today's bit below, walk the Journey map, or revise in the Library.</p>
        <p class="done-note">${note}</p>
      </div>
      <div class="keep-going"><button class="btn primary" data-continue="1">Keep going — hole ${idx + 1}: ${esc(next.title)} →</button></div>
    </div>`;
    return banner +
      (last ? bitCard(last, { revealed: true }) : "") +
      (bits.length - idx <= 7 ? agentCard(false) : "");
  }
  const idx0 = idx;
  const welcome = (idx0 === 0 && progress.entries.length === 0)
    ? `<div class="welcome" data-screen="fresh"><span class="num">1</span><span class="txt"><b>Welcome to the club.</b> ${bits.length} holes ahead, one a day. Read, take the quiz, and be honest at the end — it shapes what comes next.</span></div>`
    : "";
  return welcome + bitCard(bits[idx], { quiz: true });
}

function allDoneCard() {
  const n = bits.length;
  return `<div class="card all-done" data-screen="all-done">
    <span class="big">${n} / ${n}</span>
    <h2>Course walked. Every hole.</h2>
    <p>Your agent (<b>${esc(config.agent)}</b>) reads what you marked "already knew" and what you missed — the next set will meet you where you are. Run in the repo folder:</p>
    ${cmdList(["golfbits extend", "golfbits restructure"])}
  </div>`;
}

function agentCard(exhausted) {
  const n = bits.length;
  return `<div class="card agent-panel">
    <h3>${exhausted ? `All ${n} bits complete — generate your next set` : "Running low — top up your bits"}</h3>
    <p>Your configured agent (<b>${esc(config.agent)}</b>) reads your progress — including what you marked "already knew" — and builds content at the right depth. Run in the repo folder:</p>
    ${cmdList(["golfbits extend", "golfbits restructure"])}
  </div>`;
}

// ---------- journey ----------
function journeyPalette() {
  const dark = currentTheme() === "dark";
  return dark ? {
    fairOut: "#23392B", fairIn: "#2C4634", contour: "#20291F", dash: "#5F6E62",
    learnedBg: "#3FA97A", learnedBd: "#2C7D58", learnedFg: "#0F1D15",
    knewBg: "#E3A44A", knewBd: "#B57F2E", knewFg: "#221703",
    todayBg: "#1B241D", todayBd: "#3FA97A", todayFg: "#7FCBA4",
    aheadBg: "#242F26", aheadBd: "#2B372D", aheadFg: "#5F6E62",
    wk: "#5F6E62", flag: "#E07B6E", pole: "#C6CFC4", halo: "#3FA97A"
  } : {
    fairOut: "#CBDCC2", fairIn: "#DEEAD6", contour: "#E9E5D8", dash: "#98A49B",
    learnedBg: "#166B47", learnedBd: "#115538", learnedFg: "#FFFFFF",
    knewBg: "#D97706", knewBd: "#B45309", knewFg: "#FFFFFF",
    todayBg: "#FFFFFF", todayBd: "#166B47", todayFg: "#166B47",
    aheadBg: "#EDEAE0", aheadBd: "#DBD7C9", aheadFg: "#98A49B",
    wk: "#98A49B", flag: "#B3261E", pole: "#1E2722", halo: "#166B47"
  };
}

function nodeState(i, cur) {
  const b = bits[i], e = entryFor(b.id);
  if (i < cur) return (e && e.knownBefore) ? "knew" : "learned";
  if (i === cur && !doneToday()) return "today";
  return "ahead";
}

function renderJourney() {
  const P = journeyPalette();
  const cur = nextIndex();
  const perRow = 7, rows = Math.ceil(bits.length / perRow);
  const W = 700, padX = 64, gapX = (W - padX * 2) / (perRow - 1), padY = 64, rowH = 106;
  const H = padY * 2 + (rows - 1) * rowH;
  const pos = i => {
    const r = Math.floor(i / perRow), c = i % perRow;
    return { x: padX + (r % 2 === 0 ? c : perRow - 1 - c) * gapX, y: padY + r * rowH };
  };
  // walked path (S-curves between serpentine rows)
  let path = "";
  for (let i = 0; i < bits.length; i++) {
    const { x, y } = pos(i);
    if (i === 0) { path += `M ${x} ${y}`; continue; }
    const p = pos(i - 1);
    path += p.y === y ? ` L ${x} ${y}` : ` C ${p.x + (p.x > W / 2 ? 72 : -72)} ${p.y + rowH / 2}, ${x + (x > W / 2 ? 72 : -72)} ${y - rowH / 2}, ${x} ${y}`;
  }
  // faint topographic contours spanning the full map height
  let contours = "";
  for (let k = 0; k <= rows; k++) {
    const y = padY - rowH / 2 + k * rowH, o = (k % 2) * 14;
    contours += `<path d="M -10 ${y + o} C 130 ${y - 18}, 260 ${y + 20}, 390 ${y - 6} C 520 ${y - 26}, 620 ${y + 16}, 710 ${y}" fill="none" stroke="${P.contour}" stroke-width="1.5"/>`;
  }
  const weekLabels = Array.from({ length: rows }, (_, r) =>
    `<text x="14" y="${padY + r * rowH + 4}" font-size="11" fill="${P.wk}" font-weight="700" letter-spacing="1">W${r + 1}</text>`).join("");
  const nodes = bits.map((b, i) => {
    const { x, y } = pos(i);
    const st = nodeState(i, cur);
    const visited = i < cur;
    const c = st === "learned" ? [P.learnedBg, P.learnedBd, P.learnedFg]
      : st === "knew" ? [P.knewBg, P.knewBd, P.knewFg]
        : st === "today" ? [P.todayBg, P.todayBd, P.todayFg]
          : [P.aheadBg, P.aheadBd, P.aheadFg];
    const mark = st === "knew" ? "★" : st === "learned" ? "✓" : String(i + 1);
    const flag = i === bits.length - 1
      ? `<line x1="${x}" y1="${y - 44}" x2="${x}" y2="${y - 17}" stroke="${P.pole}" stroke-width="2.5"/><path d="M ${x} ${y - 44} l 17 6 -17 6z" fill="${P.flag}"/>` : "";
    const halo = st === "today" ? `<circle class="gb-pulse" cx="${x}" cy="${y}" r="15" fill="none" stroke="${P.halo}" stroke-width="2"/>` : "";
    const tip = esc(b.title) + (st === "knew" ? " — already knew" : st === "learned" ? " — done" : st === "today" ? " — today" : "");
    const interactive = visited
      ? `role="button" tabindex="0" data-node="${esc(b.id)}"`
      : st === "today" ? `role="button" tabindex="0" data-today="1"` : `aria-hidden="true"`;
    return `<g class="jnode ${visited || st === "today" ? "" : "locked"}" ${interactive}>
      ${flag}${halo}
      <circle cx="${x}" cy="${y}" r="15" fill="${c[0]}" stroke="${c[1]}" stroke-width="2.5"/>
      <text x="${x}" y="${y + 4.5}" text-anchor="middle" font-size="${visited ? 13 : 11}" font-weight="700" fill="${c[2]}" style="pointer-events:none">${mark}</text>
      <title>${tip}</title></g>`;
  }).join("");
  const tee = pos(0);
  const svg = `<svg class="journey-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="inherit" role="img" aria-label="journey map: ${cur} of ${bits.length} bits walked">
      ${contours}
      <path d="${path}" fill="none" stroke="${P.fairOut}" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="${P.fairIn}" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="${P.dash}" stroke-width="2" stroke-dasharray="1 9" stroke-linecap="round"/>
      <rect x="${tee.x - 24}" y="${tee.y - 7}" width="10" height="14" rx="2" fill="${P.learnedBg}" opacity="0.85"/>
      ${weekLabels}${nodes}
    </svg>`;
  return `<div class="card journey" data-screen="journey">
    <div class="journey-head">
      <h2>The course — ${cur} of ${bits.length} walked</h2>
      <div class="journey-legend">
        <span><span class="dot" style="background:var(--accent)"></span>learned</span>
        <span><span class="dot" style="background:var(--knew)"></span>already knew</span>
        <span><span class="dot" style="background:var(--card);border:2px solid var(--accent)"></span>today</span>
        <span><span class="dot" style="background:var(--track);border:2px solid var(--line)"></span>ahead</span>
      </div>
    </div>
    ${svg}
    <p class="journey-note">click any visited hole to reread it · ★ = you already knew it</p>
  </div>`;
}

// ---------- library ----------
function renderLibrary() {
  if (readingId) {
    const bit = bits.find(b => b.id === readingId);
    return `<div><button class="btn ghost" data-back="1">← Back to library</button></div>` + bitCard(bit, { revealed: !!entryFor(bit.id) });
  }
  const cats = ["All", ...new Set(bits.map(b => b.category))];
  const cur = nextIndex();
  const filters = `<div class="filter-row">` + cats.map(c =>
    `<button class="${libFilter === c ? "on" : ""}" data-filter="${esc(c)}">${esc(c)}</button>`).join("") + "</div>";
  const items = bits.map((b, i) => {
    if (libFilter !== "All" && b.category !== libFilter) return "";
    const st = nodeState(i, cur);
    const visited = i < cur;
    if (!visited && st !== "today") {
      return `<div class="lib-item locked"><span class="n">${i + 1}</span><span class="t">Locked — day ${i + 1}</span><span class="c">${esc(b.category)}</span><span class="badge"></span></div>`;
    }
    const badge = st === "knew" ? `<span class="badge knew">★</span>`
      : st === "learned" ? `<span class="badge learned">✓</span>`
        : `<span class="badge today">•</span>`;
    const attr = visited ? `data-read="${esc(b.id)}"` : `data-today="1"`;
    return `<button class="lib-item" ${attr}><span class="n">${i + 1}</span><span class="t">${esc(b.title)}</span><span class="c">${esc(b.category)}</span>${badge}</button>`;
  }).join("");
  return filters + `<div class="lib-list">${items}</div>`;
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
    return `<div class="cat-row"><span class="name">${esc(cat)}</span><div class="track"><div class="fill" style="width:${p}%"></div></div><span class="notes">${notes || p + "%"}</span></div>`;
  }).join("");
  return `<div class="stat-grid">
      <div class="stat"><div class="v accent">${entries.length}</div><div class="l">bits completed</div></div>
      <div class="stat"><div class="v">${acc}%</div><div class="l">quiz accuracy</div></div>
      <div class="stat"><div class="v">${currentStreak()}🔥</div><div class="l">streak (best ${progress.longestStreak})</div></div>
      <div class="stat"><div class="v amber">${known}★</div><div class="l">already knew</div></div>
    </div>
    <div class="card cats"><h3>Progress by category</h3><div class="cat-list">${rows}</div></div>
    <div class="card agent-panel">
      <h3>Your AI content agent: ${esc(config.agent)}</h3>
      <p>These run in a terminal from the repo folder. The agent reads <code>data/progress.json</code> — quiz misses pull more coverage, "already knew" markings push depth up.</p>
      ${cmdList(["golfbits status", "golfbits extend", "golfbits restructure make it more visual", `golfbits config agent ${config.agent === "claude" ? "codex" : "claude"}`])}
    </div>`;
}

// ---------- event wiring (re-bound after each render) ----------
function bindDynamic() {
  document.querySelectorAll("[data-opt]").forEach(b => b.addEventListener("click", () => answerQuiz(+b.dataset.opt)));
  document.querySelectorAll("[data-finish]").forEach(b => b.addEventListener("click", () => completeBit(b.dataset.finish === "known")));
  document.querySelectorAll("[data-continue]").forEach(b => b.addEventListener("click", () => { continuing = true; quizAnswered = null; justCompleted = false; render(); }));
  document.querySelectorAll("[data-read]").forEach(b => b.addEventListener("click", () => { readingId = b.dataset.read; render(); }));
  document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", () => { readingId = null; render(); }));
  document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { libFilter = b.dataset.filter; render(); }));
  document.querySelectorAll("[data-today]").forEach(el => {
    const jump = () => { view = "today"; readingId = null; render(); };
    el.addEventListener("click", jump);
    el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); jump(); } });
  });
  document.querySelectorAll("[data-node]").forEach(g => {
    const open = () => { readingId = g.dataset.node; view = "library"; render(); };
    g.addEventListener("click", open);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
  document.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copied!"; setTimeout(() => b.textContent = "copy", 1200); }
    catch (e) { b.textContent = "select it"; }
  }));
  document.querySelectorAll("[data-scroll]").forEach(b => b.addEventListener("click", () => {
    const el = document.getElementById(b.dataset.scroll);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  document.querySelectorAll("[data-plan-task]").forEach(btn =>
    btn.addEventListener("click", () => togglePlanTask(btn.dataset.planTask, btn.dataset.planOn !== "1")));
}

boot();
