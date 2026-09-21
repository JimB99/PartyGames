import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceTrivia, createTriviaState, onTriviaTick } from "../engines/trivia-engine.js";

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

describe("trivia-engine would-you-rather scoring", () => {
  const items = [{ a: "Option A", b: "Option B" }];

  it("awards majority bonus to the room majority on a 3-2 split", () => {
    let state = createTriviaState("would-you-rather", items, 1, 5);
    state = advanceTrivia(state, items);
    state.answers = { p1: "a", p2: "a", p3: "a", p4: "b", p5: "b" };
    state = advanceTrivia(state, items);
    assert.equal(state.roundScores.p1, 1000);
    assert.equal(state.roundScores.p2, 1000);
    assert.equal(state.roundScores.p3, 1000);
    assert.equal(state.roundScores.p4, 200);
    assert.equal(state.roundScores.p5, 200);
  });

  it("awards tie bonus when the room splits 50/50", () => {
    let state = createTriviaState("would-you-rather", items, 1, 4);
    state = advanceTrivia(state, items);
    state.answers = { p1: "a", p2: "a", p3: "b", p4: "b" };
    state = advanceTrivia(state, items);
    assert.equal(state.roundScores.p1, 600);
    assert.equal(state.roundScores.p2, 600);
    assert.equal(state.roundScores.p3, 600);
    assert.equal(state.roundScores.p4, 600);
  });
});
