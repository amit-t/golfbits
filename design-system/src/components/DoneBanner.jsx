import React from "react";

/** Centered completion banner: large emoji, title, supporting copy. */
export function DoneBanner({ emoji, title, className = "", children, ...rest }) {
  return (
    <div className={`done-banner${className ? " " + className : ""}`} {...rest}>
      {emoji ? <div className="big">{emoji}</div> : null}
      {title ? <h2>{title}</h2> : null}
      {children ? <p>{children}</p> : null}
    </div>
  );
}
