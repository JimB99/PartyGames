import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyRound,
  DIKE_BONUS_AMOUNT,
  eliminationSlots,
  lowestBidEliminees,
  placementScores,
  resolveBonus,
  resolveWinner,
} from "./dike-logic.js";

describe("eliminationSlots", () => {
  it("returns 3 when more than 20 walkers remain", () => {
    assert.equal(eliminationSlots(21), 3);
  });

  it("returns 2 when 11 to 20 walkers remain", () => {
    assert.equal(eliminationSlots(11), 2);
    assert.equal(eliminationSlots(20), 2);
  });

  it("returns 1 when 10 or fewer walkers remain", () => {
    assert.equal(eliminationSlots(10), 1);
    assert.equal(eliminationSlots(4), 1);
  });
});

describe("lowestBidEliminees", () => {
  it("eliminates all players tied at the lowest bid", () => {
    const eliminees = lowestBidEliminees(
      { a: 5, b: 5, c: 20, d: 30 },
      ["a", "b", "c", "d"],
      1,
    );
    assert.deepEqual(eliminees.sort(), ["a", "b"]);
  });

  it("uses the classic 500/501 duplicate-value case for three slots", () => {
    const bids = { a: 500, b: 501, c: 501, d: 501, e: 502 };
    const eliminees = lowestBidEliminees(bids, ["a", "b", "c", "d", "e"], 3);
    assert.deepEqual(eliminees.sort(), ["a", "b", "c", "d"]);
    assert.equal(eliminees.includes("e"), false);
  });
});

describe("resolveBonus", () => {
  it("awards bonus only to a sole highest bidder", () => {
    const bonus = resolveBonus({ a: 10, b: 30, c: 20 }, ["a", "b", "c"], DIKE_BONUS_AMOUNT);
    assert.equal(bonus.recipientId, "b");
    assert.equal(bonus.amount, DIKE_BONUS_AMOUNT);
  });

  it("awards no bonus when top bid is tied", () => {
    const bonus = resolveBonus({ a: 30, b: 30, c: 10 }, ["a", "b", "c"], DIKE_BONUS_AMOUNT);
    assert.equal(bonus.recipientId, null);
    assert.equal(bonus.amount, 0);
  });
});

describe("applyRound", () => {
  it("eliminates players who reach zero balance", () => {
    const result = applyRound(
      { a: 50, b: 10, c: 30 },
      { a: 200, b: 10, c: 50 },
      ["a", "b", "c"],
      { bonusAmount: DIKE_BONUS_AMOUNT },
    );

    assert.deepEqual(result.alive, ["a"]);
    assert.deepEqual(result.eliminated.sort(), ["b", "c"]);
    assert.equal(result.balances.a, 155);
  });

  it("deducts bids before bonus is applied", () => {
    const result = applyRound(
      { a: 10, b: 50, c: 10 },
      { a: 100, b: 100, c: 100 },
      ["a", "b", "c"],
      { bonusAmount: DIKE_BONUS_AMOUNT },
    );

    assert.equal(result.bonusRecipientId, "b");
    assert.equal(result.balances.b, 55);
  });
});

describe("resolveWinner", () => {
  it("returns the sole survivor", () => {
    assert.equal(resolveWinner(["a"], { a: 12 }), "a");
  });

  it("picks the higher balance in a final duel", () => {
    assert.equal(resolveWinner(["a", "b"], { a: 40, b: 25 }), "a");
    assert.equal(resolveWinner(["a", "b"], { a: 25, b: 40 }), "b");
  });

  it("returns null while more than two walkers remain", () => {
    assert.equal(resolveWinner(["a", "b", "c"], { a: 1, b: 2, c: 3 }), null);
  });
});

describe("placementScores", () => {
  it("assigns podium and survivor points", () => {
    const scores = placementScores(
      "winner",
      ["second", "third", "fourth"],
      { second: 4, third: 3, fourth: 2, early: 1 },
    );

    assert.equal(scores.winner, 3000);
    assert.equal(scores.second, 1500);
    assert.equal(scores.third, 750);
    assert.equal(scores.fourth, 250);
    assert.equal(scores.early, undefined);
  });
});
