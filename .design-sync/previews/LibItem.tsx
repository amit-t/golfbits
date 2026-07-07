import { LibItem } from "@golfbits/design-system";

export const Learned = () => (
  <div style={{ width: 460 }}>
    <LibItem n="03" title="Reading green speed" category="Foundations" badge="✓" />
  </div>
);
export const Locked = () => (
  <div style={{ width: 460 }}>
    <LibItem n="18" title="Bunker escape angles" category="Course Management" locked />
  </div>
);
export const List = () => (
  <div style={{ width: 460, display: "flex", flexDirection: "column" }}>
    <LibItem n="01" title="The interlocking grip" category="Foundations" badge="✓" />
    <LibItem n="02" title="Repair your pitch mark" category="Etiquette" badge="✓" />
    <LibItem n="03" title="Reading green speed" category="Foundations" />
    <LibItem n="04" title="Bunker escape angles" category="Course Management" locked />
  </div>
);
