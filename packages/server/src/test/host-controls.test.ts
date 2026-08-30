import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveHostControls } from "@party-games/shared";

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

  it("always allows pause and return to lobby", () => {
    const controls = resolveHostControls({ phase: "playing", timerEndsAt: null });
    assert.equal(controls.canPause, true);
    assert.equal(controls.canReturnToLobby, true);
  });
});
