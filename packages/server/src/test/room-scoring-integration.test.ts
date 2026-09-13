import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addPlayer,
  createLobby,
  resetInGameScores,
  snapshotSessionScores,
} from "../lobby.js";
import {
  finalizeGameScores,
  hydrateLobbySnapshot,
  serializeLobbySnapshot,
  syncInGameScoresFromView,
} from "../lobby-scoring.js";

describe("syncInGameScoresFromView", () => {
  it("merges per-round scores for non-cumulative games", () => {
    const keys = new Set<string>();
    const r1 = syncInGameScoresFromView({
      roundScoresAreCumulative: false,
      phase: "scoreboard",
      round: 1,
      activeGameId: "quick-quiz",
      roundScores: { p1: 1000, p2: 500 },
      inGameScores: {},
      committedRoundKeys: keys,
    });
    assert.equal(r1.changed, true);
    assert.equal(r1.inGameScores.p1, 1000);
    assert.equal(r1.inGameScores.p2, 500);
    assert.ok(r1.committedRoundKeys.has("quick-quiz:r1"));

    const r2 = syncInGameScoresFromView({
      roundScoresAreCumulative: false,
      phase: "scoreboard",
      round: 2,
      activeGameId: "quick-quiz",
      roundScores: { p1: 800, p2: 200 },
      inGameScores: r1.inGameScores,
      committedRoundKeys: r1.committedRoundKeys,
    });
    assert.equal(r2.inGameScores.p1, 1800);
    assert.equal(r2.inGameScores.p2, 700);
  });

  it("replaces in-game scores for cumulative games", () => {
    const result = syncInGameScoresFromView({
      roundScoresAreCumulative: true,
      phase: "playing",
      round: 1,
      activeGameId: "paddle-clash",
      roundScores: { p1: 1800, p2: 800 },
      inGameScores: { p1: 200 },
      committedRoundKeys: new Set(),
    });
    assert.deepEqual(result.inGameScores, { p1: 1800, p2: 800 });
  });

  it("does not double-commit when ended follows last round key", () => {
    const keys = new Set<string>(["draw-guess:r2"]);
    const result = syncInGameScoresFromView({
      roundScoresAreCumulative: false,
      phase: "ended",
      round: 2,
      activeGameId: "draw-guess",
      roundScores: { p1: 500 },
      inGameScores: { p1: 1000 },
      committedRoundKeys: keys,
    });
    assert.equal(result.changed, false);
    assert.equal(result.inGameScores.p1, 1000);
  });
});

describe("finalizeGameScores session integration", () => {
  it("adds non-cumulative game totals to session scores", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "P1");
    addPlayer(lobby, "p2", "P2");
    lobby.sessionScores = { p1: 200, p2: 100 };
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 1000, p2: 500 };

    finalizeGameScores(lobby, false);

    assert.equal(lobby.sessionScores.p1, 1200);
    assert.equal(lobby.sessionScores.p2, 600);
    assert.equal(lobby.gameScoresCommitted, true);
  });

  it("adds cumulative game totals from snapshot baseline", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "P1");
    lobby.sessionScores = { p1: 500 };
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 1800 };

    finalizeGameScores(lobby, true);

    assert.equal(lobby.sessionScores.p1, 2300);
  });

  it("preserves session scores across two games", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "P1");
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 1000 };
    finalizeGameScores(lobby, false);
    assert.equal(lobby.sessionScores.p1, 1000);

    resetInGameScores(lobby);
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 500 };
    finalizeGameScores(lobby, false);
    assert.equal(lobby.sessionScores.p1, 1500);
  });

  it("hydrate preserves session totals after game commit", () => {
    const lobby = createLobby("WQHF");
    addPlayer(lobby, "p1", "P1");
    addPlayer(lobby, "p2", "P2");
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 6000, p2: 6025 };
    finalizeGameScores(lobby, false);

    const stored = serializeLobbySnapshot(lobby);
    const hydrated = hydrateLobbySnapshot(stored);
    assert.equal(hydrated.sessionScores.p1, 6000);
    assert.equal(hydrated.sessionScores.p2, 6025);
  });
});
