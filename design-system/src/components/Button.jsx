import React from "react";

const VARIANTS = ["primary", "secondary", "ghost"];

/** Action button. variant: "primary" | "secondary" | "ghost" (default "primary"). */
export function Button({ variant = "primary", className = "", children, ...rest }) {
  const v = VARIANTS.includes(variant) ? variant : "primary";
  return (
    <button className={`btn ${v}${className ? " " + className : ""}`} {...rest}>
      {children}
    </button>
  );
}
