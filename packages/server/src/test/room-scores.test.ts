import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeScores, resetInGameScores, createLobby, applyInGameScoresToSession, snapshotSessionScores } from "../lobby.js";
import { advanceBracket, createBracketState } from "../engines/bracket-engine.js";

describe("lobby score helpers", () => {
  it("mergeScores accumulates without mutating the original", () => {
    const base = { a: 100 };
    const merged = mergeScores(base, { a: 50, b: 200 });
    assert.deepEqual(base, { a: 100 });
    assert.deepEqual(merged, { a: 150, b: 200 });
  });

  it("resetInGameScores clears in-round tracking", () => {
    const lobby = createLobby("ABCD");
    lobby.inGameScores = { p1: 1000 };
    lobby.committedRoundKeys.add("fact-check:r1");
    lobby.gameScoresCommitted = true;
    resetInGameScores(lobby);
    assert.deepEqual(lobby.inGameScores, {});
    assert.equal(lobby.committedRoundKeys.size, 0);
    assert.equal(lobby.gameScoresCommitted, false);
  });

  it("applyInGameScoresToSession sets cumulative totals from snapshot", () => {
    const lobby = createLobby("ABCD");
    lobby.players.push({ id: "p1", nickname: "A", colorIndex: 0, connected: true });
    lobby.players.push({ id: "p2", nickname: "B", colorIndex: 1, connected: true });
    lobby.sessionScores = { p1: 500, p2: 200 };
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 1000, p2: 100 };
    applyInGameScoresToSession(lobby, true);
    assert.deepEqual(lobby.sessionScores, { p1: 1500, p2: 300 });
  });

  it("applyInGameScoresToSession does not double-count cumulative game totals", () => {
    const lobby = createLobby("ABCD");
    lobby.players.push({ id: "p1", nickname: "A", colorIndex: 0, connected: true });
    snapshotSessionScores(lobby);
    lobby.inGameScores = { p1: 1000 };
    applyInGameScoresToSession(lobby, true);
    assert.equal(lobby.sessionScores.p1, 1000);
    applyInGameScoresToSession(lobby, true);
    assert.equal(lobby.sessionScores.p1, 1000);
  });
});

describe("bracket-engine start round", () => {
  it("advance from instructions enters submit without ending", () => {
    let state = createBracketState(["Food"]);
    state = advanceBracket(state);
    assert.equal(state.phase, "submit");
    assert.equal(state.entries.length, 0);
  });
});
