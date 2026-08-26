import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rankPointsByPercentile, scoreByAnswerRank } from "./speed-scoring.js";

describe("rankPointsByPercentile", () => {
  it("gives 1st place the same max points in small and large lobbies", () => {
    assert.equal(rankPointsByPercentile(1, 3, 1), 1000);
    assert.equal(rankPointsByPercentile(1, 20, 1), 1000);
  });

  it("spreads points more gently for lower ranks in larger lobbies", () => {
    const smallLobby2nd = rankPointsByPercentile(2, 3, 1);
    const largeLobby2nd = rankPointsByPercentile(2, 20, 1);
    assert.ok(smallLobby2nd < largeLobby2nd);
  });
});

describe("scoreByAnswerRank", () => {
  it("awards more points to earlier correct answers", () => {
    const ranked = scoreByAnswerRank(
      [
        { playerId: "b", answeredAt: 2000 },
        { playerId: "a", answeredAt: 1000 },
        { playerId: "c", answeredAt: 3000 },
      ],
      3,
      1,
    );
    assert.equal(ranked.a.rankPlace, 1);
    assert.equal(ranked.a.points, 1000);
    assert.equal(ranked.b.rankPlace, 2);
    assert.ok(ranked.b.points < ranked.a.points);
    assert.equal(ranked.c.rankPlace, 3);
    assert.ok(ranked.c.points < ranked.b.points);
  });

  it("scales points by the provided factor", () => {
    const ranked = scoreByAnswerRank([{ playerId: "a", answeredAt: 1000 }], 3, 0.5);
    assert.equal(ranked.a.points, 500);
  });
});
