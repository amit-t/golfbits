import { StatTile } from "@golfbits/design-system";

export const Streak = () => <StatTile value="12" label="Day streak" />;
export const Completion = () => <StatTile value="68%" label="Course complete" green />;
export const Grid = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
    <StatTile value="38" label="Bits learned" />
    <StatTile value="12" label="Day streak" green />
    <StatTile value="94%" label="Quiz accuracy" />
  </div>
);
