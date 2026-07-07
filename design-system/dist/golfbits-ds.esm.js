// src/components/Button.jsx
import React from "react";
import { jsx } from "react/jsx-runtime";
var VARIANTS = ["primary", "secondary", "ghost"];
function Button({ variant = "primary", className = "", children, ...rest }) {
  const v = VARIANTS.includes(variant) ? variant : "primary";
  return /* @__PURE__ */ jsx("button", { className: `btn ${v}${className ? " " + className : ""}`, ...rest, children });
}

// src/components/Chip.jsx
import React2 from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var CLASS = { default: "", new: "n", deep: "deep" };
function Chip({ variant = "default", className = "", children, ...rest }) {
  const extra = CLASS[variant] ?? "";
  const cls = ["chip", extra, className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsx2("span", { className: cls, ...rest, children });
}

// src/components/Card.jsx
import React3 from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
function Card({ className = "", children, ...rest }) {
  return /* @__PURE__ */ jsx3("div", { className: `card${className ? " " + className : ""}`, ...rest, children });
}

// src/components/StatTile.jsx
import React4 from "react";
import { jsx as jsx4, jsxs } from "react/jsx-runtime";
function StatTile({ value, label, green = false, className = "", ...rest }) {
  return /* @__PURE__ */ jsxs("div", { className: `stat${className ? " " + className : ""}`, ...rest, children: [
    /* @__PURE__ */ jsx4("div", { className: `v${green ? " green" : ""}`, children: value }),
    /* @__PURE__ */ jsx4("div", { className: "l", children: label })
  ] });
}

// src/components/ProgressBar.jsx
import React5 from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var clamp = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};
function ProgressBar({ pct = 0, className = "", ...rest }) {
  const p = clamp(pct);
  return /* @__PURE__ */ jsx5(
    "div",
    {
      className: `progressbar${className ? " " + className : ""}`,
      role: "progressbar",
      "aria-valuenow": p,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      ...rest,
      children: /* @__PURE__ */ jsx5("div", { className: "fill", style: { width: `${p}%` } })
    }
  );
}

// src/components/ProgressRing.jsx
import React6 from "react";
import { jsx as jsx6, jsxs as jsxs2 } from "react/jsx-runtime";
var clamp2 = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};
function ProgressRing({ pct = 0, size = 44, className = "", ...rest }) {
  const p = clamp2(pct);
  const stroke = 5;
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);
  const center = size / 2;
  return /* @__PURE__ */ jsxs2(
    "svg",
    {
      className: `progressring${className ? " " + className : ""}`,
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
      role: "img",
      "aria-label": `${p}% progress`,
      ...rest,
      children: [
        /* @__PURE__ */ jsx6("circle", { cx: center, cy: center, r, fill: "none", stroke: "var(--line)", strokeWidth: stroke }),
        /* @__PURE__ */ jsx6(
          "circle",
          {
            cx: center,
            cy: center,
            r,
            fill: "none",
            stroke: "var(--accent)",
            strokeWidth: stroke,
            strokeLinecap: "round",
            strokeDasharray: `${c} ${c}`,
            strokeDashoffset: offset,
            transform: `rotate(-90 ${center} ${center})`
          }
        ),
        /* @__PURE__ */ jsxs2(
          "text",
          {
            x: center,
            y: center + 4,
            textAnchor: "middle",
            fontSize: size * 0.25,
            fontWeight: "600",
            fill: "var(--ink)",
            children: [
              p,
              "%"
            ]
          }
        )
      ]
    }
  );
}

// src/components/Tab.jsx
import React7 from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
function Tab({ active = false, className = "", children, ...rest }) {
  const cls = ["tab", active ? "active" : "", className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsx7("button", { className: cls, role: "tab", "aria-selected": active, ...rest, children });
}

// src/components/MicroFact.jsx
import React8 from "react";
import { jsx as jsx8, jsxs as jsxs3 } from "react/jsx-runtime";
function MicroFact({ label, className = "", children, ...rest }) {
  return /* @__PURE__ */ jsxs3("div", { className: `microfact${className ? " " + className : ""}`, ...rest, children: [
    label ? /* @__PURE__ */ jsx8("small", { children: label }) : null,
    children
  ] });
}

// src/components/QuizOption.jsx
import React9 from "react";
import { jsx as jsx9, jsxs as jsxs4 } from "react/jsx-runtime";
var STATES = ["default", "correct", "wrong", "faded"];
function QuizOption({ letter, state = "default", disabled = false, className = "", children, ...rest }) {
  const s = STATES.includes(state) ? state : "default";
  const extra = s === "default" ? "" : s;
  const cls = ["opt", extra, className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs4("button", { className: cls, disabled, ...rest, children: [
    /* @__PURE__ */ jsx9("span", { className: "key", children: letter }),
    /* @__PURE__ */ jsx9("span", { children })
  ] });
}

// src/components/LibItem.jsx
import React10 from "react";
import { jsx as jsx10, jsxs as jsxs5 } from "react/jsx-runtime";
function LibItem({ n, title, category, badge, locked = false, className = "", ...rest }) {
  const cls = ["lib-item", locked ? "locked" : "", className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs5("button", { className: cls, disabled: locked, ...rest, children: [
    /* @__PURE__ */ jsx10("span", { className: "n", children: n }),
    /* @__PURE__ */ jsx10("span", { className: "t", children: title }),
    category ? /* @__PURE__ */ jsx10("span", { className: "c", children: category }) : null,
    badge ? /* @__PURE__ */ jsx10("span", { className: "badge", children: badge }) : null
  ] });
}

// src/components/PlanTask.jsx
import React11 from "react";
import { jsx as jsx11, jsxs as jsxs6 } from "react/jsx-runtime";
function PlanTask({ text, detail, checked = false, onChange, className = "", ...rest }) {
  const cls = ["plan-task", checked ? "on" : "", className].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxs6("label", { className: cls, ...rest, children: [
    /* @__PURE__ */ jsx11("input", { type: "checkbox", checked, onChange, readOnly: !onChange }),
    /* @__PURE__ */ jsx11("span", { className: "box", "aria-hidden": "true" }),
    /* @__PURE__ */ jsxs6("span", { className: "body", children: [
      /* @__PURE__ */ jsx11("span", { className: "txt", children: text }),
      detail ? /* @__PURE__ */ jsx11("span", { className: "detail", children: detail }) : null
    ] })
  ] });
}

// src/components/CatRow.jsx
import React12 from "react";
import { jsx as jsx12, jsxs as jsxs7 } from "react/jsx-runtime";
var clamp3 = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};
function CatRow({ name, pct = 0, className = "", ...rest }) {
  const p = clamp3(pct);
  return /* @__PURE__ */ jsxs7("div", { className: `cat-row${className ? " " + className : ""}`, ...rest, children: [
    /* @__PURE__ */ jsx12("span", { className: "name", children: name }),
    /* @__PURE__ */ jsx12("span", { className: "track", children: /* @__PURE__ */ jsx12("span", { className: "fill", style: { width: `${p}%` } }) }),
    /* @__PURE__ */ jsxs7("span", { className: "pct", children: [
      p,
      "%"
    ] })
  ] });
}

// src/components/DoneBanner.jsx
import React13 from "react";
import { jsx as jsx13, jsxs as jsxs8 } from "react/jsx-runtime";
function DoneBanner({ emoji, title, className = "", children, ...rest }) {
  return /* @__PURE__ */ jsxs8("div", { className: `done-banner${className ? " " + className : ""}`, ...rest, children: [
    emoji ? /* @__PURE__ */ jsx13("div", { className: "big", children: emoji }) : null,
    title ? /* @__PURE__ */ jsx13("h2", { children: title }) : null,
    children ? /* @__PURE__ */ jsx13("p", { children }) : null
  ] });
}

// src/components/Brand.jsx
import React14 from "react";
import { jsx as jsx14, jsxs as jsxs9 } from "react/jsx-runtime";
function Brand({ size = 28, className = "", ...rest }) {
  return /* @__PURE__ */ jsxs9("div", { className: `brand${className ? " " + className : ""}`, ...rest, children: [
    /* @__PURE__ */ jsxs9("svg", { width: size, height: size, viewBox: "0 0 28 28", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx14("circle", { cx: "14", cy: "14", r: "13", fill: "var(--accent)" }),
      /* @__PURE__ */ jsx14("line", { x1: "14", y1: "6", x2: "14", y2: "17", stroke: "#fff", strokeWidth: "2" }),
      /* @__PURE__ */ jsx14("path", { d: "M14 6 l8 3 -8 3z", fill: "#fff" }),
      /* @__PURE__ */ jsx14("ellipse", { cx: "14", cy: "20", rx: "6", ry: "2", fill: "#fff", opacity: "0.55" })
    ] }),
    /* @__PURE__ */ jsx14("span", { children: "golfbits" })
  ] });
}
export {
  Brand,
  Button,
  Card,
  CatRow,
  Chip,
  DoneBanner,
  LibItem,
  MicroFact,
  PlanTask,
  ProgressBar,
  ProgressRing,
  QuizOption,
  StatTile,
  Tab
};
