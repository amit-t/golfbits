import { PlanTask } from "@golfbits/design-system";

export const Todo = () => (
  <div style={{ width: 460 }}>
    <PlanTask
      text="Hit 40 balls at the range"
      detail="Alternate 7-iron and driver, 5 balls each."
    />
  </div>
);
export const Done = () => (
  <div style={{ width: 460 }}>
    <PlanTask
      text="Practice 10 putts from 6 feet"
      detail="Focus on a square face at impact."
      checked
    />
  </div>
);
export const Checklist = () => (
  <div style={{ width: 460, display: "flex", flexDirection: "column" }}>
    <PlanTask text="Practice 10 putts from 6 feet" detail="Square face at impact." checked />
    <PlanTask text="Hit 40 balls at the range" detail="Alternate 7-iron and driver." />
    <PlanTask text="Walk 9 holes, no cart" detail="Build course stamina." />
  </div>
);
