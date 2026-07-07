import React from "react";

/** Library row: index, title, category, optional badge. locked dims + disables it. */
export function LibItem({ n, title, category, badge, locked = false, className = "", ...rest }) {
  const cls = ["lib-item", locked ? "locked" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} disabled={locked} {...rest}>
      <span className="n">{n}</span>
      <span className="t">{title}</span>
      {category ? <span className="c">{category}</span> : null}
      {badge ? <span className="badge">{badge}</span> : null}
    </button>
  );
}
