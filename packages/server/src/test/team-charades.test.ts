import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { teamCharadesGame } from "../games/team-charades.js";

describe("team-charades teams mode", () => {
  it("assigns alternating teams when teams mode enabled", () => {
    const state = teamCharadesGame.init({
      playerIds: ["p1", "p2", "p3", "p4"],
      gameOptions: { contentRating: "family", difficulty: "mixed", charadesMode: "teams" },
    } as never);
    assert.equal(state.teamsMode, true);
    assert.equal(state.teamByPlayerId.p1, "A");
    assert.equal(state.teamByPlayerId.p2, "B");
    assert.equal(state.teamByPlayerId.p3, "A");
    assert.equal(state.teamByPlayerId.p4, "B");
  });

  it("tracks team scores on correct guess", () => {
    const state = teamCharadesGame.init({
      playerIds: ["p1", "p2", "p3"],
      gameOptions: { contentRating: "family", difficulty: "mixed", charadesMode: "teams" },
    } as never);
    state.phase = "acting";
    teamCharadesGame.onPlayerAction!(
      state,
      "p1",
      { kind: "charades_correct" },
      { playerIds: ["p1", "p2", "p3"] } as never,
    );
    assert.equal(state.roundScores.p1, 500);
    assert.equal(state.teamScores.A, 500);
  });
});
