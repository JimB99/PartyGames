import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceBracket,
  createTicTacToeState,
  currentMatch,
  emptyBoard,
  tttPlacementScores,
} from "@party-games/shared";
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

  it("awards 500 to the losing finalist in a 4-player bracket", () => {
    let state = createTicTacToeState(["p1", "p2", "p3", "p4"]);
    state.bracket[0].winner = "p1";
    state.bracket[1].winner = "p3";
    state = advanceBracket(state);
    assert.deepEqual(state.finalistIds, ["p1", "p3"]);
    state.bracket[0].winner = "p1";
    state.championId = "p1";
    state.phase = "ended";
    state.roundScores = tttPlacementScores(state.playerIds, "p1", state.finalistIds);
    assert.equal(state.roundScores.p1, 1000);
    assert.equal(state.roundScores.p3, 500);
    assert.equal(state.roundScores.p2, 100);
    assert.equal(state.roundScores.p4, 100);
  });
});
