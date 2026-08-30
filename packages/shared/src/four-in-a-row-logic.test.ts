import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkConnectFourWinner, dropDisc } from "./four-in-a-row-logic.js";

describe("four-in-a-row-logic", () => {
  it("drops to lowest row", () => {
    const board = Array.from({ length: 6 }, () => Array(7).fill(null));
    const result = dropDisc(board, 3, "x");
    assert.equal(result?.row, 5);
    assert.equal(result?.board[5][3], "x");
  });

  it("detects horizontal win", () => {
    const board = Array.from({ length: 6 }, () => Array(7).fill(null));
    for (let c = 0; c < 4; c++) board[5][c] = "x";
    assert.equal(checkConnectFourWinner(board), "x");
  });
});
