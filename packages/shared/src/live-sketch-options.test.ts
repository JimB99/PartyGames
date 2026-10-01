import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "./content.js";
import {
  isAllowedCustomLiveSketchWord,
  liveSketchGuessMatches,
  liveSketchHintPhases,
  liveSketchLetterCount,
  liveSketchMask,
  liveSketchMaskComplete,
  liveSketchNextPlayPhase,
  liveSketchWordCount,
  resolveLiveSketchSchedule,
} from "./live-sketch-options.js";

describe("live-sketch-options", () => {
  it("defaults to 90s round with letter count at 30s and hangman at 60s", () => {
    const schedule = resolveLiveSketchSchedule(DEFAULT_GAME_OPTIONS);
    assert.deepEqual(schedule, { roundMs: 90_000, letterAt: 30_000, hangmanAt: 60_000 });
    assert.deepEqual(liveSketchHintPhases(schedule), [
      { at: 30_000, phase: "letter-count" },
      { at: 60_000, phase: "hangman" },
    ]);
  });

  it("treats 0 hint delays as off", () => {
    const schedule = resolveLiveSketchSchedule({
      ...DEFAULT_GAME_OPTIONS,
      liveSketchLetterCountMs: 0,
      liveSketchHangmanMs: 0,
    });
    assert.equal(schedule.letterAt, null);
    assert.equal(schedule.hangmanAt, null);
    assert.equal(liveSketchNextPlayPhase("drawing", schedule), "reveal");
  });

  it("treats a hint at or after round end as off", () => {
    const schedule = resolveLiveSketchSchedule({
      ...DEFAULT_GAME_OPTIONS,
      liveSketchRoundMs: 60_000,
      liveSketchHangmanMs: 90_000,
    });
    assert.equal(schedule.roundMs, 60_000);
    assert.equal(schedule.letterAt, 30_000);
    assert.equal(schedule.hangmanAt, null);
  });

  it("skips letter-count when hangman starts at the same time or earlier", () => {
    const schedule = resolveLiveSketchSchedule({
      ...DEFAULT_GAME_OPTIONS,
      liveSketchLetterCountMs: 30_000,
      liveSketchHangmanMs: 30_000,
    });
    assert.deepEqual(liveSketchHintPhases(schedule), [{ at: 30_000, phase: "hangman" }]);
    assert.equal(liveSketchNextPlayPhase("drawing", schedule), "hangman");
  });

  it("allows custom words of any content up to 40 characters", () => {
    assert.equal(isAllowedCustomLiveSketchWord("opera"), true);
    assert.equal(isAllowedCustomLiveSketchWord("!!!"), true);
    assert.equal(isAllowedCustomLiveSketchWord("a".repeat(40)), true);
    assert.equal(isAllowedCustomLiveSketchWord("a".repeat(41)), false);
    assert.equal(isAllowedCustomLiveSketchWord("   "), false);
    assert.equal(isAllowedCustomLiveSketchWord(""), false);
  });

  it("matches guesses case-insensitively with collapsed whitespace", () => {
    assert.equal(liveSketchGuessMatches("  Flower   Girl ", "flower girl"), true);
    assert.equal(liveSketchGuessMatches("flowergirl", "flower girl"), false);
    assert.equal(liveSketchGuessMatches("McDonald's", "mcdonald's"), true);
  });

  it("counts letters and words and shows non-letters in the mask", () => {
    assert.equal(liveSketchLetterCount("flower girl"), 10);
    assert.equal(liveSketchWordCount("flower girl"), 2);
    assert.equal(liveSketchMask("McD!", []), "_ _ _ !");
    assert.equal(liveSketchMask("McD!", ["c"]), "_ C _ !");
    assert.equal(liveSketchMaskComplete("ab", ["a", "b"]), true);
    assert.equal(liveSketchMaskComplete("ab!", ["a", "b"]), true);
    assert.equal(liveSketchMaskComplete("ab", ["a"]), false);
  });
});
