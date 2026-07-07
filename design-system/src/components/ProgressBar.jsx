import React from "react";

const clamp = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};

/** Horizontal progress track. pct: 0-100 (clamped). */
export function ProgressBar({ pct = 0, className = "", ...rest }) {
  const p = clamp(pct);
  return (
    <div
      className={`progressbar${className ? " " + className : ""}`}
      role="progressbar"
      aria-valuenow={p}
      aria-valuemin={0}
      aria-valuemax={100}
      {...rest}
    >
      <div className="fill" style={{ width: `${p}%` }} />
    </div>
  );
}
