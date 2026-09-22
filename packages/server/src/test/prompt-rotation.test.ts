import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import { advanceDrawVote, createDrawVoteState, onDrawVoteTick } from "../engines/draw-vote-engine.js";
import { advanceSplit, createSplitState, onSplitTick } from "../engines/split-room-engine.js";
import {
  advancePromptVote,
  createPromptVoteState,
  onPromptVoteTick,
} from "../engines/prompt-vote-engine.js";
import {
  advanceTrivia,
  createTriviaState,
  onTriviaAction,
  onTriviaTick,
} from "../engines/trivia-engine.js";
import { createHangmanRaceState, onHangmanRaceTick } from "../engines/hangman-race-engine.js";
import { makeRoomContext } from "./harness.js";

/** Regression: scoreboard→next round must rotate pooled content in advance(), not only in onTick(). */
describe("prompt rotation between rounds", () => {
  it("trivia host pacing advance from scoreboard loads a new question", () => {
    const items = [
      { question: "Q1?", choices: ["A", "B", "C", "D"], correct: 0 },
      { question: "Q2?", choices: ["A", "B", "C", "D"], correct: 1 },
      { question: "Q3?", choices: ["A", "B", "C", "D"], correct: 2 },
    ];
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, hostPacing: true });
    let state = createTriviaState("quiz", items, 3, 2, ctx.gameOptions);
    const firstQuestion = state.question;
    state = advanceTrivia(state, items);
    state.answers = { p1: 0, p2: 0 };
    state = advanceTrivia(state, items);
    state = advanceTrivia(state, items);
    assert.equal(state.phase, "scoreboard");
    state = onTriviaAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "question");
    assert.equal(state.usedIndices.length, 2);
    assert.notEqual(state.question, firstQuestion);
  });

  it("trivia timer tick from scoreboard loads a new question", () => {
    const items = [
      { question: "Q1?", choices: ["A", "B", "C", "D"], correct: 0 },
      { question: "Q2?", choices: ["A", "B", "C", "D"], correct: 1 },
      { question: "Q3?", choices: ["A", "B", "C", "D"], correct: 2 },
    ];
    let state = createTriviaState("quiz", items, 3, 2);
    const firstQuestion = state.question;
    state = advanceTrivia(state, items);
    state.answers = { p1: 0, p2: 0 };
    state = advanceTrivia(state, items);
    state = advanceTrivia(state, items);
    state.timerEndsAt = Date.now() - 1;
    state = onTriviaTick(state, items);
    assert.equal(state.phase, "question");
    assert.equal(state.usedIndices.length, 2);
    assert.notEqual(state.question, firstQuestion);
  });

  it("prompt-vote advance from scoreboard picks a new prompt", () => {
    const prompts = ["Prompt A", "Prompt B", "Prompt C"];
    let state = createPromptVoteState("bracket", prompts, 3, undefined, ["p1", "p2"]);
    const firstPrompt = state.prompt;
    state.phase = "scoreboard";
    state = advancePromptVote(state, prompts);
    assert.equal(state.phase, "instructions");
    assert.equal(state.round, 2);
    assert.equal(state.usedPrompts.length, 2);
    assert.notEqual(state.prompt, firstPrompt);
  });

  it("prompt-vote timer tick from scoreboard picks a new prompt", () => {
    const prompts = ["Prompt A", "Prompt B", "Prompt C"];
    let state = createPromptVoteState("bracket", prompts, 3, undefined, ["p1", "p2"]);
    const firstPrompt = state.prompt;
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() - 1;
    state = onPromptVoteTick(state, prompts);
    assert.equal(state.phase, "instructions");
    assert.equal(state.usedPrompts.length, 2);
    assert.notEqual(state.prompt, firstPrompt);
  });

  it("opinions minority advance from scoreboard picks a new scenario", () => {
    const pool = [
      { text: "Would you rather…", labelA: "A1", labelB: "B1" },
      { text: "Pick one…", labelA: "A2", labelB: "B2" },
      { text: "Choose…", labelA: "A3", labelB: "B3" },
    ];
    let state = createSplitState(pool, ["p1", "p2"], 3);
    const firstScenario = state.scenario.text;
    state.phase = "scoreboard";
    state = advanceSplit(state, state.playerIds);
    assert.equal(state.phase, "instructions");
    assert.equal(state.round, 2);
    assert.equal(state.usedIndices.length, 2);
    assert.notEqual(state.scenario.text, firstScenario);
  });

  it("opinions minority timer tick from scoreboard picks a new scenario", () => {
    const pool = [
      { text: "Would you rather…", labelA: "A1", labelB: "B1" },
      { text: "Pick one…", labelA: "A2", labelB: "B2" },
      { text: "Choose…", labelA: "A3", labelB: "B3" },
    ];
    let state = createSplitState(pool, ["p1", "p2"], 3);
    const firstScenario = state.scenario.text;
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() - 1;
    state = onSplitTick(state);
    assert.equal(state.phase, "instructions");
    assert.equal(state.usedIndices.length, 2);
    assert.notEqual(state.scenario.text, firstScenario);
  });

  it("draw-vote advance from scoreboard picks a new prompt", () => {
    const words = ["cat", "dog", "fish"];
    let state = createDrawVoteState(words, ["p1", "p2"], "bestDrawing", 3);
    const firstPrompt = state.prompt;
    state.phase = "scoreboard";
    state = advanceDrawVote(state, words, ["p1", "p2"]);
    assert.equal(state.phase, "instructions");
    assert.equal(state.round, 2);
    assert.equal(state.usedWords.length, 2);
    assert.notEqual(state.prompt, firstPrompt);
  });

  it("draw-vote timer tick from scoreboard picks a new prompt", () => {
    const words = ["cat", "dog", "fish"];
    let state = createDrawVoteState(words, ["p1", "p2"], "bestDrawing", 3);
    const firstPrompt = state.prompt;
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() - 1;
    state = onDrawVoteTick(state, words, ["p1", "p2"]);
    assert.equal(state.phase, "instructions");
    assert.equal(state.usedWords.length, 2);
    assert.notEqual(state.prompt, firstPrompt);
  });

  it("hangman-race timer tick from scoreboard picks a new word", () => {
    const words = ["apple", "banana", "cherry"];
    let state = createHangmanRaceState(words, ["p1", "p2"], 3);
    const firstWord = state.word;
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() - 1;
    state = onHangmanRaceTick(state);
    assert.equal(state.phase, "instructions");
    assert.equal(state.usedWords.length, 2);
    assert.notEqual(state.word, firstWord);
  });
});
