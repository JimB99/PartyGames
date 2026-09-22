import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHostControls, shouldTickWhilePaused } from "@party-games/shared";

describe("resolveHostControls", () => {
  it("enables extend time only when timer is active", () => {
    const timed = resolveHostControls({ phase: "playing", timerEndsAt: Date.now() + 5000 });
    const untimed = resolveHostControls({ phase: "playing", timerEndsAt: null });

    assert.equal(timed.canExtendTime, true);
    assert.equal(untimed.canExtendTime, false);
  });

  it("allows skip during timed phases and transitional phases", () => {
    assert.equal(resolveHostControls({ phase: "instructions", timerEndsAt: null }).canSkip, true);
    assert.equal(resolveHostControls({ phase: "questioning", timerEndsAt: Date.now() + 1000 }).canSkip, true);
    assert.equal(resolveHostControls({ phase: "playing", timerEndsAt: null }).canSkip, false);
  });

  it("host-paced mode enables skip on playing phase and disables extend", () => {
    const controls = resolveHostControls(
      { phase: "playing", timerEndsAt: Date.now() + 5000 },
      { hostPacing: true },
    );
    assert.equal(controls.canSkip, true);
    assert.equal(controls.canExtendTime, false);
  });

  it("allows pause when timer active or skippable phase", () => {
    assert.equal(resolveHostControls({ phase: "playing", timerEndsAt: null }).canPause, false);
    assert.equal(resolveHostControls({ phase: "drawing", timerEndsAt: null }).canPause, true);
    assert.equal(resolveHostControls({ phase: "question", timerEndsAt: Date.now() + 5000 }).canPause, true);
  });

  it("always allows return to lobby", () => {
    const controls = resolveHostControls({ phase: "playing", timerEndsAt: null });
    assert.equal(controls.canReturnToLobby, true);
  });
});

describe("shouldTickWhilePaused", () => {
  it("ticks realtime arcade games during playing phase", () => {
    assert.equal(shouldTickWhilePaused("block-stack", "playing"), true);
    assert.equal(shouldTickWhilePaused("trail-dash", "playing"), true);
    assert.equal(shouldTickWhilePaused("paddle-clash", "playing"), true);
    assert.equal(shouldTickWhilePaused("grid-blast", "playing"), true);
  });

  it("does not tick non-realtime or non-playing phases", () => {
    assert.equal(shouldTickWhilePaused("trivia", "question"), false);
    assert.equal(shouldTickWhilePaused("block-stack", "round_end"), false);
    assert.equal(shouldTickWhilePaused(null, "playing"), false);
  });
});
