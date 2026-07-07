import { QuizOption } from "@golfbits/design-system";

export const Default = () => (
  <div style={{ width: 420 }}>
    <QuizOption letter="A">Draw the ball right-to-left</QuizOption>
  </div>
);
export const Correct = () => (
  <div style={{ width: 420 }}>
    <QuizOption letter="B" state="correct" disabled>
      A gentle left-to-right fade
    </QuizOption>
  </div>
);
export const Wrong = () => (
  <div style={{ width: 420 }}>
    <QuizOption letter="C" state="wrong" disabled>
      A dead-straight ball flight
    </QuizOption>
  </div>
);
export const Answered = () => (
  <div style={{ width: 420, display: "flex", flexDirection: "column" }}>
    <QuizOption letter="A" state="faded" disabled>
      Draw the ball right-to-left
    </QuizOption>
    <QuizOption letter="B" state="correct" disabled>
      A gentle left-to-right fade
    </QuizOption>
    <QuizOption letter="C" state="wrong" disabled>
      A dead-straight ball flight
    </QuizOption>
  </div>
);
