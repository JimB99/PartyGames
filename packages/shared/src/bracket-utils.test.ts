import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSingleEliminationBracket, roundOneByePlayerIds } from "./bracket-utils.js";

describe("bracket-utils seeding", () => {
  it("4 players each appear once in round one with no byes", () => {
    const bracket = buildSingleEliminationBracket(["p1", "p2", "p3", "p4"]);
    assert.equal(bracket.length, 2);
    const players = bracket.flatMap((m) => [m.a, m.b]).filter(Boolean);
    assert.deepEqual([...players].sort(), ["p1", "p2", "p3", "p4"]);
    assert.equal(bracket.every((m) => m.a && m.b && m.winner === null), true);
  });

  it("3 players produce one pre-resolved bye match", () => {
    const bracket = buildSingleEliminationBracket(["p1", "p2", "p3"]);
    assert.equal(bracket.length, 2);
    const byeMatches = bracket.filter((m) => m.b === null && m.a !== null);
    assert.equal(byeMatches.length, 1);
    assert.equal(byeMatches[0]?.winner, byeMatches[0]?.a);
    const playable = bracket.filter((m) => m.a && m.b);
    assert.equal(playable.length, 1);
  });

  it("distributes round-one byes across players instead of using join order", () => {
    const counts = { p1: 0, p2: 0, p3: 0 };
    for (let i = 0; i < 300; i++) {
      for (const playerId of roundOneByePlayerIds(["p1", "p2", "p3"])) {
        counts[playerId as keyof typeof counts] += 1;
      }
    }
    assert.ok(counts.p1 > 0, "p1 should receive byes");
    assert.ok(counts.p2 > 0, "p2 should receive byes");
    assert.ok(counts.p3 > 0, "p3 should receive byes");
  });
});
