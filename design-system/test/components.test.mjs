// Renders every component from the built ESM bundle and asserts the class
// vocabulary / structure the design-system CSS depends on.
// Requires `node build.mjs` first (imports dist/golfbits-ds.esm.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as DS from "../dist/golfbits-ds.esm.js";

const html = (el) => renderToStaticMarkup(el);
const h = React.createElement;

test("all 14 components are exported", () => {
  const expected = [
    "Button", "Chip", "Card", "StatTile", "ProgressBar", "ProgressRing",
    "Tab", "MicroFact", "QuizOption", "LibItem", "PlanTask", "CatRow",
    "DoneBanner", "Brand",
  ];
  for (const name of expected) assert.equal(typeof DS[name], "function", `${name} exported`);
  assert.equal(Object.keys(DS).length, expected.length, "no extra/missing exports");
});

test("Button variants", () => {
  assert.match(html(h(DS.Button, {}, "Go")), /class="btn primary"[^>]*>Go</);
  assert.match(html(h(DS.Button, { variant: "ghost" }, "x")), /class="btn ghost"/);
  // unknown variant falls back to primary
  assert.match(html(h(DS.Button, { variant: "nope" }, "x")), /class="btn primary"/);
});

test("Chip variants map to app classes", () => {
  assert.match(html(h(DS.Chip, {}, "a")), /class="chip"/);
  assert.match(html(h(DS.Chip, { variant: "new" }, "a")), /class="chip n"/);
  assert.match(html(h(DS.Chip, { variant: "deep" }, "a")), /class="chip deep"/);
});

test("Card renders surface", () => {
  assert.match(html(h(DS.Card, {}, "body")), /class="card"[^>]*>body</);
});

test("StatTile value + green", () => {
  const out = html(h(DS.StatTile, { value: "42", label: "days", green: true }));
  assert.match(out, /class="v green"[^>]*>42</);
  assert.match(out, /class="l"[^>]*>days</);
});

test("ProgressBar clamps + sets width", () => {
  assert.match(html(h(DS.ProgressBar, { pct: 50 })), /class="fill"[^>]*width:50%/);
  assert.match(html(h(DS.ProgressBar, { pct: 999 })), /width:100%/);
  assert.match(html(h(DS.ProgressBar, { pct: -5 })), /width:0%/);
  assert.match(html(h(DS.ProgressBar, { pct: "x" })), /width:0%/);
});

test("ProgressRing renders svg + % label", () => {
  const out = html(h(DS.ProgressRing, { pct: 75 }));
  assert.match(out, /class="progressring"/);
  assert.match(out, /75%/);
});

test("Tab active state", () => {
  assert.match(html(h(DS.Tab, { active: true }, "Today")), /class="tab active"[^>]*aria-selected="true"/);
  assert.match(html(h(DS.Tab, {}, "X")), /class="tab"[^>]*aria-selected="false"/);
});

test("MicroFact label + body", () => {
  const out = html(h(DS.MicroFact, { label: "FACT" }, "grip matters"));
  assert.match(out, /class="microfact"/);
  assert.match(out, /<small>FACT<\/small>/);
  assert.match(out, /grip matters/);
});

test("QuizOption states + key", () => {
  assert.match(html(h(DS.QuizOption, { letter: "A" }, "opt")), /class="opt"/);
  assert.match(html(h(DS.QuizOption, { letter: "A", state: "correct" }, "opt")), /class="opt correct"/);
  assert.match(html(h(DS.QuizOption, { letter: "B", state: "wrong" }, "opt")), /class="opt wrong"/);
  assert.match(html(h(DS.QuizOption, { letter: "C" }, "opt")), /class="key"[^>]*>C</);
});

test("LibItem locked disables", () => {
  const out = html(h(DS.LibItem, { n: "01", title: "Grip", category: "Fundamentals", badge: "✓", locked: true }));
  assert.match(out, /class="lib-item locked"/);
  assert.match(out, /disabled/);
  assert.match(out, /class="t"[^>]*>Grip</);
});

test("PlanTask checked strikes + checkbox", () => {
  const out = html(h(DS.PlanTask, { text: "Range 30m", detail: "warm up", checked: true }));
  assert.match(out, /class="plan-task on"/);
  assert.match(out, /type="checkbox"[^>]*checked/);
  assert.match(out, /class="detail"[^>]*>warm up</);
});

test("CatRow clamps pct", () => {
  const out = html(h(DS.CatRow, { name: "Putting", pct: 120 }));
  assert.match(out, /class="name"[^>]*>Putting</);
  assert.match(out, /width:100%/);
  assert.match(out, /class="pct"[^>]*>100%</);
});

test("DoneBanner emoji + title + body", () => {
  const out = html(h(DS.DoneBanner, { emoji: "🎉", title: "Done" }, "nice work"));
  assert.match(out, /class="big"[^>]*>🎉</);
  assert.match(out, /<h2>Done<\/h2>/);
  assert.match(out, /nice work/);
});

test("Brand ships logo + wordmark", () => {
  const out = html(h(DS.Brand, {}));
  assert.match(out, /class="brand"/);
  assert.match(out, /<svg/);
  assert.match(out, /golfbits/);
});
