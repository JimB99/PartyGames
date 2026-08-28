import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addPlayer,
  createLobby,
  isColorTaken,
  nextAvailableColorIndex,
  setPlayerColor,
} from "./lobby.js";

describe("lobby color helpers", () => {
  it("assigns first free color index on join", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "Alice");
    addPlayer(lobby, "p2", "Bob");
    assert.equal(lobby.players[0].colorIndex, 0);
    assert.equal(lobby.players[1].colorIndex, 1);
  });

  it("nextAvailableColorIndex skips taken colors", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "Alice");
    lobby.players[0].colorIndex = 0;
    assert.equal(nextAvailableColorIndex(lobby), 1);
  });

  it("setPlayerColor rejects duplicate colors among connected players", () => {
    const lobby = createLobby("ABCD");
    addPlayer(lobby, "p1", "Alice");
    addPlayer(lobby, "p2", "Bob");
    assert.equal(isColorTaken(lobby, 0, "p2"), true);
    assert.equal(setPlayerColor(lobby, "p2", 0), false);
    assert.equal(setPlayerColor(lobby, "p2", 3), true);
    assert.equal(lobby.players[1].colorIndex, 3);
  });
});
