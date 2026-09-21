import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advancePromptVote,
  createPromptVoteState,
  onPromptVoteAction,
  promptVoteHostView,
} from "../engines/prompt-vote-engine.js";
import { makeRoomContext } from "./harness.js";

describe("prompt-vote-engine hot-seat", () => {
  it("reports expected submit count excluding hot seat player", () => {
    const state = createPromptVoteState("hot-seat", ["prompt"], 4, "p1", ["p1", "p2", "p3", "p4"]);
    state.phase = "submit";
    const view = promptVoteHostView(state);
    assert.equal(view.data.expectedSubmitCount, 3);
    assert.equal(view.data.playerCount, 4);
  });
});

describe("prompt-vote-engine gallery vote-all", () => {
  const playerIds = ["p1", "p2", "p3", "p4"];
  const ctx = makeRoomContext(4);

  function submitAll(state: ReturnType<typeof createPromptVoteState>) {
    let s = advancePromptVote(state, state.promptsPool);
    assert.equal(s.phase, "submit");
    for (const pid of playerIds) {
      s = onPromptVoteAction(s, pid, { kind: "submit_text", text: `Answer ${pid}` }, ctx);
    }
    return s;
  }

  it("enters vote phase with all submissions visible on host view", () => {
    const state = createPromptVoteState("vote-all", ["prompt"], 4, undefined, playerIds);
    const after = submitAll(state);
    assert.equal(after.phase, "vote");
    const view = promptVoteHostView(after);
    assert.equal(view.data.matchup, undefined);
    assert.equal((view.data.submissions as unknown[]).length, 4);
  });

  it("rejects self-votes", () => {
    const state = createPromptVoteState("vote-all", ["prompt"], 4, undefined, playerIds);
    let s = submitAll(state);
    const own = s.submissions.find((sub) => sub.playerId === "p1")!;
    s = onPromptVoteAction(s, "p1", { kind: "vote", optionId: own.id }, ctx);
    assert.equal(s.votes.p1, undefined);
    assert.equal(Object.keys(s.votes).length, 0);
  });

  it("awards +1000 to the submission with the most votes", () => {
    const state = createPromptVoteState("vote-all", ["prompt"], 4, undefined, playerIds);
    let s = submitAll(state);
    const favorite = s.submissions.find((sub) => sub.playerId === "p2")!;
    const fallback = s.submissions.find((sub) => sub.playerId === "p1")!;
    for (const pid of playerIds) {
      const optionId = pid === "p2" ? fallback.id : favorite.id;
      s = onPromptVoteAction(s, pid, { kind: "vote", optionId }, ctx);
    }
    assert.equal(s.phase, "reveal");
    assert.equal(s.roundScores.p2, 1000);
    assert.equal(s.cumulativeScores.p2, 1000);
  });

  it("punchline-battle mode uses bracket matchups", () => {
    const state = createPromptVoteState("punchline-battle", ["Punchline prompt"], 4, undefined, playerIds);
    const after = submitAll(state);
    assert.equal(after.phase, "matchup");
    assert.equal(after.mode, "punchline-battle");
    assert.ok((after.matchups?.length ?? 0) > 0);
  });

  it("skips to scoreboard when fewer than two submissions", () => {
    let state = createPromptVoteState("vote-all", ["prompt"], 4, undefined, ["p1", "p2"]);
    state = advancePromptVote(state, state.promptsPool);
    state.submissions.push({ id: "solo", playerId: "p1", text: "only one" });
    state = advancePromptVote(state, state.promptsPool);
    assert.equal(state.phase, "scoreboard");
  });
});
