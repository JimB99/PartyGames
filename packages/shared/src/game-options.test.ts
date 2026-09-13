import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "./content.js";
import { isHostPacing, isTimerExpired, normalizeGameOptions } from "./game-options.js";

describe("normalizeGameOptions", () => {
  it("clamps trail-dash bot count", () => {
    const normalized = normalizeGameOptions("trail-dash", {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 99, maxRounds: 1, roundTimeSec: 30 },
    });
    assert.equal(normalized.trailDash?.botCount, 7);
  });

  it("preserves hostPacing flag", () => {
    const normalized = normalizeGameOptions("quick-quiz", {
      ...DEFAULT_GAME_OPTIONS,
      hostPacing: true,
    });
    assert.equal(normalized.hostPacing, true);
  });
});

describe("host pacing helpers", () => {
  it("resolvePhaseDuration via isTimerExpired blocks auto advance", () => {
    const past = Date.now() - 1000;
    assert.equal(isTimerExpired(past, { ...DEFAULT_GAME_OPTIONS, hostPacing: true }), false);
    assert.equal(isTimerExpired(past, DEFAULT_GAME_OPTIONS), true);
  });

  it("isHostPacing detects flag", () => {
    assert.equal(isHostPacing({ ...DEFAULT_GAME_OPTIONS, hostPacing: true }), true);
    assert.equal(isHostPacing(DEFAULT_GAME_OPTIONS), false);
  });
});
