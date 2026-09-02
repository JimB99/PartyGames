import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { advanceBracket, createBracketState, onBracketAction } from "../engines/bracket-engine.js";

const ctx = { playerIds: ["p1", "p2", "p3"], hostId: "host" };

describe("bracket-engine", () => {
  it("blocks voting for your own entry", () => {
    let state = createBracketState(["Food"]);
    state = advanceBracket(state);
    state.entries = [
      { id: "e1", text: "Pizza", authorId: "p1" },
      { id: "e2", text: "Tacos", authorId: "p2" },
    ];
    state = advanceBracket(state);
    const match = state.bracket[0];
    const ownSide = match.a === "e1" ? "a" : "b";
    const otherSide = ownSide === "a" ? "b" : "a";
    state = onBracketAction(state, "p1", { kind: "vote", optionId: match[ownSide] }, ctx);
    assert.equal(state.votes.p1, undefined);
    state = onBracketAction(state, "p1", { kind: "vote", optionId: match[otherSide] }, ctx);
    assert.equal(state.votes.p1, match[otherSide]);
  });
});
