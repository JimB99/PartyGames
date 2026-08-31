import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyMove, buildBracket, checkWinner, emptyBoard, findTttWinningCells } from "./tic-tac-toe-logic.js";

describe("tic-tac-toe-logic", () => {
  it("detects row winner", () => {
    const board = emptyBoard();
    board[0] = "x";
    board[1] = "x";
    board[2] = "x";
    assert.equal(checkWinner(board), "x");
  });

  it("finds diagonal winning cells", () => {
    const board = emptyBoard();
    board[0] = "x";
    board[4] = "x";
    board[8] = "x";
    assert.deepEqual(findTttWinningCells(board), [0, 4, 8]);
  });

  it("rejects occupied cell", () => {
    let match = buildBracket(["a", "b"])[0];
    match = applyMove(match, 0);
    const again = applyMove(match, 0);
    assert.equal(again.board[0], "x");
  });
});
