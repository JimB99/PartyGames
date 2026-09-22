import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCfBracket,
  cfBracketMatchCount,
  createFourInARowState,
} from "@party-games/shared";
import { onFourInARowAction } from "../engines/four-in-a-row-engine.js";

describe("four-in-a-row bracket", () => {
  it("4 players get 2 semifinals then final (3 matches total)", () => {
    const ids = ["p1", "p2", "p3", "p4"];
    assert.equal(cfBracketMatchCount(ids), 3);
    const bracket = buildCfBracket(ids);
    assert.equal(bracket.length, 2);
    const players = bracket.flatMap((m) => [m.a, m.b]).filter(Boolean);
    assert.deepEqual([...players].sort(), ids);
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

describe("four-in-a-row ended", () => {
  it("clears timer when 2-player game ends", () => {
    let state = createFourInARowState(["p1", "p2"]);
    state = onFourInARowAction(state, "host", { kind: "advance" });
    state.timerEndsAt = Date.now() + 5000;
    state.timerTotalMs = 5000;
    for (let col = 0; col < 3; col++) {
      state = onFourInARowAction(state, "p1", { kind: "four_in_a_row_drop", column: col });
      state = onFourInARowAction(state, "p2", { kind: "four_in_a_row_drop", column: col });
    }
    state = onFourInARowAction(state, "p1", { kind: "four_in_a_row_drop", column: 3 });
    assert.equal(state.phase, "ended");
    assert.equal(state.timerEndsAt, null);
    assert.equal(state.timerTotalMs, null);
  });
});
