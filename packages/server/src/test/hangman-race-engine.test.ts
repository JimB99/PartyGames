import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createHangmanRaceState,
  hangmanRaceHostView,
  onHangmanRaceAction,
} from "../engines/hangman-race-engine.js";
import { makeRoomContext } from "./harness.js";

describe("hangman-race-engine", () => {
  it("spotlights the player who has revealed the most letters", () => {
    const ctx = makeRoomContext(2);
    let state = createHangmanRaceState(["banana"], ctx.playerIds, 1);
    state = onHangmanRaceAction(state, "host", { kind: "advance" }, ctx);
    state = onHangmanRaceAction(state, "p1", { kind: "hangman_letter", letter: "a" }, ctx);
    state = onHangmanRaceAction(state, "p1", { kind: "hangman_letter", letter: "n" }, ctx);
    const view = hangmanRaceHostView(state);
    assert.equal(view.data.spotlightPlayerId, "p1");
    assert.equal(view.data.leaderboard?.[0]?.playerId, "p1");
  });
});
