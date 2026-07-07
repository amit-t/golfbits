import React from "react";

/** Single metric tile: big value + label. green highlights the value in accent. */
export function StatTile({ value, label, green = false, className = "", ...rest }) {
  return (
    <div className={`stat${className ? " " + className : ""}`} {...rest}>
      <div className={`v${green ? " green" : ""}`}>{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}
