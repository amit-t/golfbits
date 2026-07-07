import React from "react";

const clamp = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};

/** Category progress row: name, inline track, percent label. pct: 0-100 (clamped). */
export function CatRow({ name, pct = 0, className = "", ...rest }) {
  const p = clamp(pct);
  return (
    <div className={`cat-row${className ? " " + className : ""}`} {...rest}>
      <span className="name">{name}</span>
      <span className="track">
        <span className="fill" style={{ width: `${p}%` }} />
      </span>
      <span className="pct">{p}%</span>
    </div>
  );
}
