import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import {
  advanceTrivia,
  createTriviaState,
  onTriviaAction,
} from "../engines/trivia-engine.js";
import { makeRoomContext } from "./harness.js";

const FLAT_OPTIONS = { ...DEFAULT_GAME_OPTIONS, speedScoring: "off" as const };

const QUIZ_ITEMS = [
  { question: "Q1", choices: ["A", "B", "C", "D"], correct: 0 },
  { question: "Q2", choices: ["A", "B", "C", "D"], correct: 1 },
];

describe("trivia-engine", () => {
  it("accumulates cumulative scores across quiz rounds", () => {
    const ctx = makeRoomContext(2, FLAT_OPTIONS);
    let state = createTriviaState("quiz", QUIZ_ITEMS, 2, ctx.playerIds.length);
    state.gameOptions = FLAT_OPTIONS;
    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);
    assert.equal(state.phase, "question");

    const round1Correct = state.correctIndex!;
    state = onTriviaAction(state, "p1", { kind: "trivia_answer", choiceIndex: round1Correct }, ctx);
    state = onTriviaAction(state, "p2", { kind: "trivia_answer", choiceIndex: round1Correct }, ctx);
    assert.equal(state.phase, "reveal");
    assert.equal(state.cumulativeScores.p1, 1000);
    assert.equal(state.cumulativeScores.p2, 1000);

    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);
    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);
    assert.equal(state.phase, "question");
    assert.equal(state.round, 2);

    const round2Correct = state.correctIndex!;
    const round2Wrong = round2Correct === 0 ? 1 : 0;
    state = onTriviaAction(state, "p1", { kind: "trivia_answer", choiceIndex: round2Correct }, ctx);
    state = onTriviaAction(state, "p2", { kind: "trivia_answer", choiceIndex: round2Wrong }, ctx);
    assert.equal(state.cumulativeScores.p1, 2000);
    assert.equal(state.cumulativeScores.p2, 1000);
  });

  it("skips instructions between rounds after scoreboard", () => {
    const ctx = makeRoomContext(2, FLAT_OPTIONS);
    let state = createTriviaState("quiz", QUIZ_ITEMS, 2, ctx.playerIds.length);
    state.gameOptions = FLAT_OPTIONS;
    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);
    state = onTriviaAction(state, "p1", { kind: "trivia_answer", choiceIndex: 0 }, ctx);
    state = onTriviaAction(state, "p2", { kind: "trivia_answer", choiceIndex: 0 }, ctx);
    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);
    state = advanceTrivia(state, QUIZ_ITEMS, FLAT_OPTIONS);

    assert.equal(state.phase, "question");
    assert.equal(state.round, 2);
  });

  it("does not award points in would-you-rather mode", () => {
    const items = [{ a: "Tea", b: "Coffee" }];
    const ctx = makeRoomContext(2);
    let state = createTriviaState("would-you-rather", items, 1, ctx.playerIds.length);
    state = advanceTrivia(state, items, DEFAULT_GAME_OPTIONS);
    state = onTriviaAction(state, "p1", { kind: "would_you_rather", choice: "a" }, ctx);
    state = onTriviaAction(state, "p2", { kind: "would_you_rather", choice: "b" }, ctx);
    assert.deepEqual(state.roundScores, {});
    assert.deepEqual(state.cumulativeScores, {});
  });
});
