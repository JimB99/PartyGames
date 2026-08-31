import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceBracket, createBracketState } from "../engines/bracket-engine.js";

describe("bracket-engine", () => {
  it("submit timeout with no entries ends cleanly", () => {
    let state = createBracketState(["Food"]);
    state.phase = "submit";
    state.timerEndsAt = Date.now() - 1;
    state = advanceBracket(state);
    assert.equal(state.phase, "ended");
  });

  it("submit timeout with one entry ends cleanly (need at least two)", () => {
    let state = createBracketState(["Food"]);
    state.phase = "submit";
    state.entries = [{ id: "e1", text: "Pizza", authorId: "p1" }];
    state.timerEndsAt = Date.now() - 1;
    state = advanceBracket(state);
    assert.equal(state.phase, "ended");
  });

  it("ends when only one entry is submitted", () => {
    let state = createBracketState(["Food"]);
    state.phase = "submit";
    state.entries = [{ id: "e1", text: "Pizza", authorId: "p1" }];
    state = advanceBracket(state);
    assert.equal(state.phase, "ended");
  });
});
