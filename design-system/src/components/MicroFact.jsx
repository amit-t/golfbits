import React from "react";

/**
 * Accent-highlighted fact callout with an uppercase label.
 * @category Content
 */
export function MicroFact({ label, className = "", children, ...rest }) {
  return (
    <div className={`microfact${className ? " " + className : ""}`} {...rest}>
      {label ? <small>{label}</small> : null}
      {children}
    </div>
  );
}
