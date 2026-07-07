import React from "react";

/** Content container. Surface with border, radius and soft shadow. */
export function Card({ className = "", children, ...rest }) {
  return (
    <div className={`card${className ? " " + className : ""}`} {...rest}>
      {children}
    </div>
  );
}
