import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advancePromptVote,
  createPromptVoteState,
  onPromptVoteAction,
} from "../engines/prompt-vote-engine.js";
import { makeRoomContext } from "./harness.js";

describe("prompt-vote-engine hot-seat", () => {
  it("allows the target to skip without awarding points", () => {
    const ctx = makeRoomContext(3);
    let state = createPromptVoteState("hot-seat", ["What's your secret talent?"], 1, "p1", ctx.playerIds);
    state = advancePromptVote(state, state.promptsPool);
    state = onPromptVoteAction(state, "p2", { kind: "submit_text", text: "Juggling" }, ctx);
    state = onPromptVoteAction(state, "p3", { kind: "submit_text", text: "Singing" }, ctx);
    state = onPromptVoteAction(state, "p1", { kind: "hot_seat_skip" }, ctx);
    assert.equal(state.phase, "scoreboard");
    assert.deepEqual(state.roundScores, {});
  });
});
