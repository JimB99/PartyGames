import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCfBracket, cfBracketMatchCount, createFourInARowState } from "@party-games/shared";
import { onFourInARowAction } from "../engines/four-in-a-row-engine.js";

describe("four-in-a-row bracket", () => {
  it("4 players get 2 semifinals then final (3 matches total)", () => {
    const ids = ["p1", "p2", "p3", "p4"];
    assert.equal(cfBracketMatchCount(ids), 3);
    const bracket = buildCfBracket(ids);
    assert.equal(bracket.length, 2);
    assert.deepEqual([bracket[0].a, bracket[0].b], ["p1", "p2"]);
    assert.deepEqual([bracket[1].a, bracket[1].b], ["p3", "p4"]);
  });

  it("increments round counter between bracket matches", () => {
    let state = createFourInARowState(["p1", "p2", "p3", "p4"]);
    state = onFourInARowAction(state, "host", { kind: "advance" });
    assert.equal(state.round, 1);
    state.bracket[0].winner = "p1";
    state.matchIndex = 1;
    state.round += 1;
    assert.equal(state.round, 2);
  });
});
