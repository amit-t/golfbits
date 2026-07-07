import { Button } from "@golfbits/design-system";

export const Primary = () => <Button variant="primary">Mark complete</Button>;
export const Secondary = () => <Button variant="secondary">Skip for now</Button>;
export const Ghost = () => <Button variant="ghost">Read the full lesson →</Button>;
export const Disabled = () => (
  <Button variant="primary" disabled>
    All bits done
  </Button>
);
