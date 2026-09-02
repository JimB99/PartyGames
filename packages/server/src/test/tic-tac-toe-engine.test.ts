import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTicTacToeState, currentMatch, emptyBoard } from "@party-games/shared";
import { onTttAction } from "../engines/tic-tac-toe-engine.js";

describe("tic-tac-toe-engine", () => {
  it("replays once on a draw then ends the match", () => {
    let state = createTicTacToeState(["p1", "p2"]);
    state.phase = "playing";
    const almostDraw = ["x", "o", "x", "x", "o", "o", "o", "x", null] as const;
    state.bracket[0] = {
      ...state.bracket[0],
      board: [...almostDraw],
      turn: "o",
      winner: null,
    };
    state = onTttAction(state, "p2", { kind: "tic_tac_toe_move", cell: 8 });
    assert.equal(state.drawReplayCount, 1);
    assert.deepEqual(currentMatch(state)!.board, emptyBoard());

    state.bracket[0] = {
      ...state.bracket[0],
      board: [...almostDraw],
      turn: "o",
      winner: null,
    };
    state = onTttAction(state, "p2", { kind: "tic_tac_toe_move", cell: 8 });
    assert.equal(state.phase, "ended");
    assert.equal(state.championId, null);
  });
});
