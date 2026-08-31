import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeScores, resetInGameScores, createLobby, applyInGameScoresToSession, snapshotSessionScores, addPlayer } from "../lobby.js";
import { advanceBracket, createBracketState } from "../engines/bracket-engine.js";
import { commitRoundScores, hydrateLobbySnapshot, serializeLobbySnapshot } from "../lobby-scoring.js";

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

  it("ends with reason when fewer than 2 entries", () => {
    let state = createBracketState(["Food"]);
    state = advanceBracket(state);
    state.entries.push({ id: "e1", text: "only one", authorId: "p1" });
    state = advanceBracket(state);
    assert.equal(state.phase, "ended");
    assert.equal(state.endedReason, "Need at least 2 entries to run a bracket.");
  });
});

describe("score commit keys", () => {
  it("does not double-commit final when last round already committed", () => {
    const keys = new Set<string>(["draw-guess:r5"]);
    let scores: Record<string, number> = {};
    const r1 = commitRoundScores(scores, keys, "draw-guess", "ended", 5, { p1: 500 });
    assert.equal(r1.committed, false);
    assert.deepEqual(r1.inGameScores, {});
  });

  it("commits round scores once per key", () => {
    const keys = new Set<string>();
    let scores: Record<string, number> = {};
    const r1 = commitRoundScores(scores, keys, "forbidden-clue", "scoreboard", 2, { p1: 500 });
    assert.equal(r1.committed, true);
    scores = r1.inGameScores;
    const r2 = commitRoundScores(scores, keys, "forbidden-clue", "scoreboard", 2, { p1: 500 });
    assert.equal(r2.committed, false);
    assert.equal(r2.inGameScores.p1, 500);
  });
});

describe("lobby persistence snapshot", () => {
  it("preserves session totals when third player joins after hydrate", () => {
    const lobby = createLobby("WQHF");
    addPlayer(lobby, "p1", "P1");
    addPlayer(lobby, "p2", "P2");
    lobby.sessionScores = { p1: 6000, p2: 6025 };

    const stored = serializeLobbySnapshot(lobby);
    const hydrated = hydrateLobbySnapshot(stored);
    const restored = createLobby("WQHF");
    restored.players = hydrated.players;
    restored.sessionScores = hydrated.sessionScores;
    restored.committedRoundKeys = hydrated.committedRoundKeys;

    addPlayer(restored, "p3", "P3");
    assert.equal(restored.sessionScores.p1, 6000);
    assert.equal(restored.sessionScores.p2, 6025);
    assert.equal(restored.players.length, 3);
  });
});
