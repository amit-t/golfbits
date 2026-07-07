import { CatRow } from "@golfbits/design-system";

export const Single = () => (
  <div style={{ width: 460 }}>
    <CatRow name="Foundations" pct={80} />
  </div>
);
export const Breakdown = () => (
  <div style={{ width: 460 }}>
    <CatRow name="Foundations" pct={80} />
    <CatRow name="Etiquette" pct={60} />
    <CatRow name="Rules" pct={40} />
    <CatRow name="Course Management" pct={20} />
  </div>
);
