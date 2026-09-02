import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advancePromptVote,
  createPromptVoteState,
  onPromptVoteAction,
} from "../engines/prompt-vote-engine.js";

const ctx = {
  playerIds: ["p1", "p2", "p3", "p4"],
  hostId: "host",
  players: [
    { id: "p1", nickname: "A", colorIndex: 0 },
    { id: "p2", nickname: "B", colorIndex: 1 },
    { id: "p3", nickname: "C", colorIndex: 2 },
    { id: "p4", nickname: "D", colorIndex: 3 },
  ],
};

describe("prompt-vote-engine wit-showdown", () => {
  it("excludes matchup authors from voting", () => {
    let state = createPromptVoteState("wit-showdown", ["Prompt"], 1, undefined, ctx.playerIds);
    state = advancePromptVote(state, state.promptsPool);
    state.submissions = [
      { id: "s1", playerId: "p1", text: "one" },
      { id: "s2", playerId: "p2", text: "two" },
      { id: "s3", playerId: "p3", text: "three" },
    ];
    state = advancePromptVote(state, state.promptsPool);
    assert.equal(state.phase, "matchup");
    const matchup = state.matchups[0];
    const authorIds = new Set(
      state.submissions
        .filter((sub) => sub.id === matchup.a || sub.id === matchup.b)
        .map((sub) => sub.playerId),
    );
    for (const authorId of authorIds) {
      state = onPromptVoteAction(state, authorId, { kind: "vote_pair", winnerId: matchup.a }, ctx);
      assert.equal(state.votes[authorId], undefined);
    }
    const voter = ctx.playerIds.find((id) => !authorIds.has(id));
    assert.ok(voter);
    state = onPromptVoteAction(state, voter, { kind: "vote_pair", winnerId: matchup.a }, ctx);
    assert.equal(state.votes[voter], matchup.a);
    const otherVoters = ctx.playerIds.filter((id) => !authorIds.has(id) && id !== voter);
    for (const id of otherVoters) {
      state = onPromptVoteAction(state, id, { kind: "vote_pair", winnerId: matchup.a }, ctx);
    }
    assert.equal(state.phase, "reveal");
  });

  it("awards bye points for odd submission counts", () => {
    let state = createPromptVoteState("wit-showdown", ["Prompt"], 1, undefined, ["p1", "p2", "p3"]);
    state = advancePromptVote(state, state.promptsPool);
    state.submissions = [
      { id: "s1", playerId: "p1", text: "one" },
      { id: "s2", playerId: "p2", text: "two" },
      { id: "s3", playerId: "p3", text: "three" },
    ];
    state = advancePromptVote(state, state.promptsPool);
    assert.ok(state.byeSubmissionId);
    const bye = state.submissions.find((s) => s.id === state.byeSubmissionId);
    assert.ok(bye);
    assert.equal(state.roundScores[bye.playerId], 500);
    assert.equal(state.matchups.length, 1);
  });
});
