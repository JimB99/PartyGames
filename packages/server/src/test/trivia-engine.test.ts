import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTriviaState, onTriviaTick } from "../engines/trivia-engine.js";

describe("trivia-engine timer scoring", () => {
  it("scores quiz round once when question timer expires with one answer", () => {
    let state = createTriviaState("quiz", [
      { question: "Q?", choices: ["A", "B"], correct: 0 },
    ], 3, 2, { contentRating: "family", difficulty: "mixed", speedScoring: false });
    state.phase = "question";
    state.answers = { p1: 0 };
    state.correctIndex = 0;
    state.timerEndsAt = Date.now() - 1;

    state = onTriviaTick(state);

    assert.equal(state.phase, "reveal");
    assert.equal(state.cumulativeScores.p1, 1000);
  });

  it("does not double-score quiz on timer expiry with speed scoring", () => {
    let state = createTriviaState("quiz", [
      { question: "Q?", choices: ["A", "B"], correct: 0 },
    ], 3, 2, { contentRating: "family", difficulty: "mixed", speedScoring: true });
    state.phase = "question";
    state.answers = { p1: 0 };
    state.answerTimes = { p1: Date.now() - 500 };
    state.correctIndex = 0;
    state.timerEndsAt = Date.now() - 1;

    state = onTriviaTick(state);

    assert.equal(state.cumulativeScores.p1, 1000);
  });
});
