import React from "react";

/**
 * Nav tab button. active toggles the selected (dark) state.
 * @category Navigation
 */
export function Tab({ active = false, className = "", children, ...rest }) {
  const cls = ["tab", active ? "active" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} role="tab" aria-selected={active} {...rest}>
      {children}
    </button>
  );
}
