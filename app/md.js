"use strict";
/* Minimal zero-dep markdown renderer for the Playbook view.
   Supports: h1-h4, hr, paragraphs, bold, italic, inline code, links,
   bullet + numbered lists, tables, blockquotes. HTML in source is escaped.
   Dual-environment: window.GolfMd in the browser, module.exports in node (tests). */
(function (global) {

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function safeHref(h) {
    return /^(https?:\/\/|#|\/)/i.test(h) ? h : null;
  }

  function inline(s) {
    let out = esc(s);
    out = out.replace(/`([^`]+)`/g, (m, c) => "<code>" + c + "</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, h) => {
      const href = safeHref(h);
      return href ? '<a href="' + esc(href) + '" target="_blank" rel="noopener">' + t + "</a>" : t;
    });
    return out;
  }

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "section";
  }

  function isTableDivider(line) {
    return /^\s*\|?[\s:\-|]+\|?\s*$/.test(line) && line.includes("-");
  }

  function splitRow(line) {
    let l = line.trim();
    if (l.startsWith("|")) l = l.slice(1);
    if (l.endsWith("|")) l = l.slice(0, -1);
    return l.split("|").map(c => c.trim());
  }

  /** Returns [{level, text, id}] for headings (h1-h3) — used for the TOC. */
  function extractToc(md, level) {
    const want = level || 2;
    const toc = [];
    const seen = {};
    md.split(/\r?\n/).forEach(line => {
      const m = line.match(/^(#{1,3})\s+(.+)$/);
      if (!m || m[1].length !== want) return;
      const text = m[2].replace(/[*`]/g, "").trim();
      let id = "pb-" + slug(text);
      if (seen[id] !== undefined) id += "-" + (++seen[id]);
      else seen[id] = 0;
      toc.push({ level: m[1].length, text, id });
    });
    return toc;
  }

  function renderMarkdown(md) {
    const lines = String(md).split(/\r?\n/);
    const html = [];
    let para = [], list = null, quote = [];
    const seen = {};

    const flushPara = () => {
      if (para.length) { html.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; }
    };
    const flushList = () => {
      if (list) {
        html.push("<" + list.type + ">" + list.items.map(x => "<li>" + inline(x) + "</li>").join("") + "</" + list.type + ">");
        list = null;
      }
    };
    const flushQuote = () => {
      if (quote.length) { html.push("<blockquote>" + inline(quote.join(" ")) + "</blockquote>"); quote = []; }
    };
    const flushAll = () => { flushPara(); flushList(); flushQuote(); };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // table: header row + divider row
      if (line.trim().startsWith("|") && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
        flushAll();
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(splitRow(lines[i])); i++; }
        html.push("<table><thead><tr>" + head.map(c => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>" +
          rows.map(r => "<tr>" + r.map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table>");
        continue;
      }

      const h = line.match(/^(#{1,4})\s+(.+)$/);
      if (h) {
        flushAll();
        const lvl = h[1].length;
        const text = h[2].trim();
        let id = "pb-" + slug(text.replace(/[*`]/g, ""));
        if (seen[id] !== undefined) id += "-" + (++seen[id]); else seen[id] = 0;
        html.push("<h" + lvl + ' id="' + id + '">' + inline(text) + "</h" + lvl + ">");
        i++; continue;
      }

      if (/^\s*---+\s*$/.test(line)) { flushAll(); html.push("<hr>"); i++; continue; }

      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      const num = line.match(/^\s*\d+\.\s+(.+)$/);
      if (bullet || num) {
        flushPara(); flushQuote();
        const type = bullet ? "ul" : "ol";
        if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
        list.items.push((bullet || num)[1]);
        i++; continue;
      }

      const q = line.match(/^\s*>\s?(.*)$/);
      if (q) { flushPara(); flushList(); quote.push(q[1]); i++; continue; }

      if (!line.trim()) { flushAll(); i++; continue; }

      flushList(); flushQuote();
      para.push(line.trim());
      i++;
    }
    flushAll();
    return html.join("\n");
  }

  const api = { renderMarkdown, extractToc };
  global.GolfMd = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

})(typeof window !== "undefined" ? window : globalThis);
