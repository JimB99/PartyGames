import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { onAgentGridAction, createAgentGridState } from "../engines/agent-grid-engine.js";
import { makeRoomContext } from "./harness.js";

describe("agent-grid-engine", () => {
  it("rejects guessing an already revealed cell", () => {
    const ctx = makeRoomContext(4);
    let state = createAgentGridState(
      Array.from({ length: 25 }, (_, i) => `word${i}`),
      ctx.playerIds,
    );
    state.phase = "guess";
    state.activeTeam = "a";
    state.teamA = ctx.playerIds.slice(0, 2);
    state.teamB = ctx.playerIds.slice(2);
    state.spymasterA = state.teamA[0];
    state.spymasterB = state.teamB[0];
    state.currentClue = { word: "test", count: 1 };
    state.guessesRemaining = 2;
    state.revealed[0] = true;
    const guesser = state.teamA[1];
    const before = [...state.revealed];
    state = onAgentGridAction(state, guesser, { kind: "agent_guess", index: 0 }, ctx);
    assert.deepEqual(state.revealed, before);
  });
});
