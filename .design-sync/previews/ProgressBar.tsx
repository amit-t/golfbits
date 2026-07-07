import { ProgressBar } from "@golfbits/design-system";

export const Quarter = () => (
  <div style={{ width: 280 }}>
    <ProgressBar pct={25} />
  </div>
);
export const Half = () => (
  <div style={{ width: 280 }}>
    <ProgressBar pct={50} />
  </div>
);
export const Complete = () => (
  <div style={{ width: 280 }}>
    <ProgressBar pct={100} />
  </div>
);
