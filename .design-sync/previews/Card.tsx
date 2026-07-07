import { Card, Chip } from "@golfbits/design-system";

export const Basic = () => (
  <Card>
    <Chip>Foundations</Chip>
    <h1 style={{ fontSize: 24, fontWeight: 600, margin: "12px 0 8px" }}>
      The interlocking grip
    </h1>
    <p style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
      Link the pinky of your trailing hand with the index of your lead hand.
      It unifies the hands so the club releases as one unit.
    </p>
  </Card>
);
