import React from "react";

/** Checklist task with a custom checkbox. checked strikes through the text.
 *  Controlled: pass checked + onChange. */
export function PlanTask({ text, detail, checked = false, onChange, className = "", ...rest }) {
  const cls = ["plan-task", checked ? "on" : "", className].filter(Boolean).join(" ");
  return (
    <label className={cls} {...rest}>
      <input type="checkbox" checked={checked} onChange={onChange} readOnly={!onChange} />
      <span className="box" aria-hidden="true" />
      <span className="body">
        <span className="txt">{text}</span>
        {detail ? <span className="detail">{detail}</span> : null}
      </span>
    </label>
  );
}
