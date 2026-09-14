import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPromptVoteState, promptVoteHostView } from "../engines/prompt-vote-engine.js";

describe("prompt-vote-engine hot-seat", () => {
  it("reports expected submit count excluding hot seat player", () => {
    const state = createPromptVoteState("hot-seat", ["prompt"], 4, "p1", ["p1", "p2", "p3", "p4"]);
    state.phase = "submit";
    const view = promptVoteHostView(state);
    assert.equal(view.data.expectedSubmitCount, 3);
    assert.equal(view.data.playerCount, 4);
  });
});
