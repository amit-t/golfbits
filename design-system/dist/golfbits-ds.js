var GolfbitsDS = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.js
  var index_exports = {};
  __export(index_exports, {
    Brand: () => Brand,
    Button: () => Button,
    Card: () => Card,
    CatRow: () => CatRow,
    Chip: () => Chip,
    DoneBanner: () => DoneBanner,
    LibItem: () => LibItem,
    MicroFact: () => MicroFact,
    PlanTask: () => PlanTask,
    ProgressBar: () => ProgressBar,
    ProgressRing: () => ProgressRing,
    QuizOption: () => QuizOption,
    StatTile: () => StatTile,
    Tab: () => Tab
  });

  // src/components/Button.jsx
  var import_react = __toESM(__require("react"), 1);
  var import_jsx_runtime = __require("react/jsx-runtime");
  var VARIANTS = ["primary", "secondary", "ghost"];
  function Button({ variant = "primary", className = "", children, ...rest }) {
    const v = VARIANTS.includes(variant) ? variant : "primary";
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { className: `btn ${v}${className ? " " + className : ""}`, ...rest, children });
  }

  // src/components/Chip.jsx
  var import_react2 = __toESM(__require("react"), 1);
  var import_jsx_runtime2 = __require("react/jsx-runtime");
  var CLASS = { default: "", new: "n", deep: "deep" };
  function Chip({ variant = "default", className = "", children, ...rest }) {
    const extra = CLASS[variant] ?? "";
    const cls = ["chip", extra, className].filter(Boolean).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: cls, ...rest, children });
  }

  // src/components/Card.jsx
  var import_react3 = __toESM(__require("react"), 1);
  var import_jsx_runtime3 = __require("react/jsx-runtime");
  function Card({ className = "", children, ...rest }) {
    return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: `card${className ? " " + className : ""}`, ...rest, children });
  }

  // src/components/StatTile.jsx
  var import_react4 = __toESM(__require("react"), 1);
  var import_jsx_runtime4 = __require("react/jsx-runtime");
  function StatTile({ value, label, green = false, className = "", ...rest }) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { className: `stat${className ? " " + className : ""}`, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: `v${green ? " green" : ""}`, children: value }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: "l", children: label })
    ] });
  }

  // src/components/ProgressBar.jsx
  var import_react5 = __toESM(__require("react"), 1);
  var import_jsx_runtime5 = __require("react/jsx-runtime");
  var clamp = (n) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
  };
  function ProgressBar({ pct = 0, className = "", ...rest }) {
    const p = clamp(pct);
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        className: `progressbar${className ? " " + className : ""}`,
        role: "progressbar",
        "aria-valuenow": p,
        "aria-valuemin": 0,
        "aria-valuemax": 100,
        ...rest,
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "fill", style: { width: `${p}%` } })
      }
    );
  }

  // src/components/ProgressRing.jsx
  var import_react6 = __toESM(__require("react"), 1);
  var import_jsx_runtime6 = __require("react/jsx-runtime");
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
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: center, cy: center, r, fill: "none", stroke: "var(--line)", strokeWidth: stroke }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
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
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
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
  var import_react7 = __toESM(__require("react"), 1);
  var import_jsx_runtime7 = __require("react/jsx-runtime");
  function Tab({ active = false, className = "", children, ...rest }) {
    const cls = ["tab", active ? "active" : "", className].filter(Boolean).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { className: cls, role: "tab", "aria-selected": active, ...rest, children });
  }

  // src/components/MicroFact.jsx
  var import_react8 = __toESM(__require("react"), 1);
  var import_jsx_runtime8 = __require("react/jsx-runtime");
  function MicroFact({ label, className = "", children, ...rest }) {
    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: `microfact${className ? " " + className : ""}`, ...rest, children: [
      label ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("small", { children: label }) : null,
      children
    ] });
  }

  // src/components/QuizOption.jsx
  var import_react9 = __toESM(__require("react"), 1);
  var import_jsx_runtime9 = __require("react/jsx-runtime");
  var STATES = ["default", "correct", "wrong", "faded"];
  function QuizOption({ letter, state = "default", disabled = false, className = "", children, ...rest }) {
    const s = STATES.includes(state) ? state : "default";
    const extra = s === "default" ? "" : s;
    const cls = ["opt", extra, className].filter(Boolean).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("button", { className: cls, disabled, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "key", children: letter }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children })
    ] });
  }

  // src/components/LibItem.jsx
  var import_react10 = __toESM(__require("react"), 1);
  var import_jsx_runtime10 = __require("react/jsx-runtime");
  function LibItem({ n, title, category, badge, locked = false, className = "", ...rest }) {
    const cls = ["lib-item", locked ? "locked" : "", className].filter(Boolean).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { className: cls, disabled: locked, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "n", children: n }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "t", children: title }),
      category ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "c", children: category }) : null,
      badge ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "badge", children: badge }) : null
    ] });
  }

  // src/components/PlanTask.jsx
  var import_react11 = __toESM(__require("react"), 1);
  var import_jsx_runtime11 = __require("react/jsx-runtime");
  function PlanTask({ text, detail, checked = false, onChange, className = "", ...rest }) {
    const cls = ["plan-task", checked ? "on" : "", className].filter(Boolean).join(" ");
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { className: cls, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("input", { type: "checkbox", checked, onChange, readOnly: !onChange }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "box", "aria-hidden": "true" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "body", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "txt", children: text }),
        detail ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "detail", children: detail }) : null
      ] })
    ] });
  }

  // src/components/CatRow.jsx
  var import_react12 = __toESM(__require("react"), 1);
  var import_jsx_runtime12 = __require("react/jsx-runtime");
  var clamp3 = (n) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
  };
  function CatRow({ name, pct = 0, className = "", ...rest }) {
    const p = clamp3(pct);
    return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("div", { className: `cat-row${className ? " " + className : ""}`, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "name", children: name }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "track", children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("span", { className: "fill", style: { width: `${p}%` } }) }),
      /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("span", { className: "pct", children: [
        p,
        "%"
      ] })
    ] });
  }

  // src/components/DoneBanner.jsx
  var import_react13 = __toESM(__require("react"), 1);
  var import_jsx_runtime13 = __require("react/jsx-runtime");
  function DoneBanner({ emoji, title, className = "", children, ...rest }) {
    return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("div", { className: `done-banner${className ? " " + className : ""}`, ...rest, children: [
      emoji ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("div", { className: "big", children: emoji }) : null,
      title ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("h2", { children: title }) : null,
      children ? /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children }) : null
    ] });
  }

  // src/components/Brand.jsx
  var import_react14 = __toESM(__require("react"), 1);
  var import_jsx_runtime14 = __require("react/jsx-runtime");
  function Brand({ size = 28, className = "", ...rest }) {
    return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: `brand${className ? " " + className : ""}`, ...rest, children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("svg", { width: size, height: size, viewBox: "0 0 28 28", "aria-hidden": "true", children: [
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("circle", { cx: "14", cy: "14", r: "13", fill: "var(--accent)" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("line", { x1: "14", y1: "6", x2: "14", y2: "17", stroke: "#fff", strokeWidth: "2" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("path", { d: "M14 6 l8 3 -8 3z", fill: "#fff" }),
        /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("ellipse", { cx: "14", cy: "20", rx: "6", ry: "2", fill: "#fff", opacity: "0.55" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("span", { children: "golfbits" })
    ] });
  }
  return __toCommonJS(index_exports);
})();
