import React from "react";

/**
 * golfbits wordmark + flag logo. size sets the logo px (default 28).
 * @category Brand
 */
export function Brand({ size = 28, className = "", ...rest }) {
  return (
    <div className={`brand${className ? " " + className : ""}`} {...rest}>
      <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="13" fill="var(--accent)" />
        <line x1="14" y1="6" x2="14" y2="17" stroke="#fff" strokeWidth="2" />
        <path d="M14 6 l8 3 -8 3z" fill="#fff" />
        <ellipse cx="14" cy="20" rx="6" ry="2" fill="#fff" opacity="0.55" />
      </svg>
      <span>golfbits</span>
    </div>
  );
}
