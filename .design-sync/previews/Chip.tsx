import { Chip } from "@golfbits/design-system";

export const Category = () => <Chip>Foundations</Chip>;
export const New = () => <Chip variant="new">New</Chip>;
export const DeepDive = () => <Chip variant="deep">Deep dive</Chip>;
export const Row = () => (
  <div style={{ display: "flex", gap: 4 }}>
    <Chip>Etiquette</Chip>
    <Chip variant="new">New</Chip>
    <Chip variant="deep">Deep dive</Chip>
  </div>
);
