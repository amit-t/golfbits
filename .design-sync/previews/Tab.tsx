import { Tab } from "@golfbits/design-system";

export const Active = () => <Tab active>Today</Tab>;
export const Inactive = () => <Tab>Journey</Tab>;
export const NavRow = () => (
  <div style={{ display: "flex", gap: 8, width: 420 }}>
    <Tab active>Today</Tab>
    <Tab>Journey</Tab>
    <Tab>Plan</Tab>
    <Tab>Library</Tab>
    <Tab>Stats</Tab>
  </div>
);
