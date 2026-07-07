import React from "react";

const STATES = ["default", "correct", "wrong", "faded"];

/**
 * Selectable quiz answer with a lettered key badge.
 * state: "default" | "correct" | "wrong" | "faded".
 * @category Quiz
 */
export function QuizOption({ letter, state = "default", disabled = false, className = "", children, ...rest }) {
  const s = STATES.includes(state) ? state : "default";
  const extra = s === "default" ? "" : s;
  const cls = ["opt", extra, className].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={disabled} {...rest}>
      <span className="key">{letter}</span>
      <span>{children}</span>
    </button>
  );
}
