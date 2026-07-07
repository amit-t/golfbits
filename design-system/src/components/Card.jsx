import React from "react";

/**
 * Content container. Surface with border, radius and soft shadow.
 * @category Layout
 */
export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`card${className ? " " + className : ""}`} {...rest}>
      {children}
    </div>
  );
}
