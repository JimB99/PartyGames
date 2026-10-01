import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { scoresForAllPlayers, scoresForLiveBar } from "./scores.js";
import { buildBluffReveal, votersByOption } from "./reveal.js";

describe("scoresForAllPlayers", () => {
  it("includes all players with zero when missing", () => {
    const result = scoresForAllPlayers(["a", "b", "c"], { a: 1000 });
    assert.deepEqual(result, [
      { playerId: "a", points: 1000 },
      { playerId: "b", points: 0 },
      { playerId: "c", points: 0 },
    ]);
  });
});

describe("scoresForLiveBar", () => {
  it("adds this-game points onto previous session totals", () => {
    const rows = scoresForLiveBar(["a", "b"], { a: 500, b: 0 }, { a: 1500, b: 200 });
    assert.deepEqual(rows, [
      { playerId: "a", gamePts: 1500, totalPts: 2000 },
      { playerId: "b", gamePts: 200, totalPts: 200 },
    ]);
  });

  it("lets Game exceed previous session and keeps Total at least Game", () => {
    const rows = scoresForLiveBar(["p1"], { p1: 0 }, { p1: 1500 });
    assert.equal(rows[0].gamePts, 1500);
    assert.equal(rows[0].totalPts, 1500);
    assert.ok(rows[0].totalPts >= rows[0].gamePts);
  });
});

describe("buildBluffReveal", () => {
  it("maps voters to options and marks truth", () => {
    const options = [
      { id: "truth", text: "Real fact", authorId: null, isTruth: true },
      { id: "lie1", text: "A lie", authorId: "p2", isTruth: false },
    ];
    const votes = { p1: "truth", p3: "lie1" };
    const reveal = buildBluffReveal(options, votes);
    assert.equal(reveal[0].authorLabel, "Real answer");
    assert.deepEqual(reveal[0].voterIds, ["p1"]);
    assert.deepEqual(reveal[1].voterIds, ["p3"]);
    assert.equal(reveal[1].authorId, "p2");
  });
});

describe("votersByOption", () => {
  it("groups voters by option id", () => {
    const map = votersByOption({ a: "opt1", b: "opt2", c: "opt1" });
    assert.deepEqual(map.opt1, ["a", "c"]);
    assert.deepEqual(map.opt2, ["b"]);
  });
});
