import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createForbiddenState, onForbiddenAction } from "../engines/forbidden-clue-engine.js";

const pool = [{ word: "test", forbidden: ["bad"] }];
const ctx = { playerIds: ["a", "b", "c", "d"], players: [] };

describe("forbidden-clue-engine host advance", () => {
  it("allows host to advance from instructions without being clue giver", () => {
    const state = createForbiddenState(pool, ["a", "b", "c", "d"]);
    assert.equal(state.phase, "instructions");
    const next = onForbiddenAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(next.phase, "clue");
  });
});
