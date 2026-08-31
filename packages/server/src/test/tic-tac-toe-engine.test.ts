import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTicTacToeState } from "@party-games/shared";
import { onTttAction } from "../engines/tic-tac-toe-engine.js";

function playTopRowWin(state: ReturnType<typeof createTicTacToeState>) {
  const moves = [0, 3, 1, 4, 2];
  for (const cell of moves) {
    const match = state.bracket[state.matchIndex];
    const turnId = match.turn === "x" ? match.xPlayer! : match.oPlayer!;
    state = onTttAction(state, turnId, { kind: "tic_tac_toe_move", cell });
  }
  return state;
}

describe("tic-tac-toe-engine 4p bracket", () => {
  it("plays both semifinals before advancing bracket", () => {
    let state = createTicTacToeState(["p1", "p2", "p3", "p4"]);
    state = onTttAction(state, "host", { kind: "advance" });

    state = playTopRowWin(state);
    assert.equal(state.phase, "playing");
    assert.equal(state.matchIndex, 1);
    assert.equal(state.bracket[0].winner, "p1");

    state = playTopRowWin(state);
    assert.equal(state.phase, "match_end");
    assert.equal(state.bracket[1].winner, "p3");
  });
});
