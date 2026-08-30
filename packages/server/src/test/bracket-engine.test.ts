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

  it("builds bracket from a single entry", () => {
    let state = createBracketState(["Food"]);
    state.phase = "submit";
    state.entries = [{ id: "e1", text: "Pizza", authorId: "p1" }];
    state = advanceBracket(state);
    assert.equal(state.phase, "vote");
    assert.equal(state.bracket.length, 1);
    assert.ok(state.bracket[0].a);
    assert.ok(state.bracket[0].b);
  });
});
