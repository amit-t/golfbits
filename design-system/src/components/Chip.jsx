import React from "react";

// variant -> extra class ("default" adds none, matching the app's base .chip)
const CLASS = { default: "", new: "n", deep: "deep" };

/**
 * Small pill label. variant: "default" | "new" | "deep" (default "default").
 * @category Data Display
 */
export function Chip({ variant = "default", className = "", children, ...rest }) {
  const extra = CLASS[variant] ?? "";
  const cls = ["chip", extra, className].filter(Boolean).join(" ");
  return <span className={cls} {...rest}>{children}</span>;
}
