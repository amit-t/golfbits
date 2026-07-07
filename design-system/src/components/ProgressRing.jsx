import React from "react";

const clamp = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 0;
};

/**
 * Circular progress ring with a centered % label. Mirrors the app topbar ring.
 * pct: 0-100 (clamped). size: px (default 44).
 * @category Data Display
 */
export function ProgressRing({ pct = 0, size = 44, className = "", ...rest }) {
  const p = clamp(pct);
  const stroke = 5;
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - p / 100);
  const center = size / 2;
  return (
    <svg
      className={`progressring${className ? " " + className : ""}`}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${p}% progress`}
      {...rest}
    >
      <circle cx={center} cy={center} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center + 4}
        textAnchor="middle"
        fontSize={size * 0.25}
        fontWeight="600"
        fill="var(--ink)"
      >
        {p}%
      </text>
    </svg>
  );
}
