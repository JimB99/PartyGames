import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advancePromptVote,
  buildBracketRounds,
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

  it("bracket with 4 players uses pair bracket rounds", () => {
    const state = createPromptVoteState("bracket", ["Punchline prompt"], 4, undefined, playerIds);
    const after = submitAll(state);
    assert.equal(after.phase, "matchup");
    assert.equal(after.mode, "bracket");
    assert.equal(after.bracketRounds.length, 2);
    assert.equal(after.bracketRounds.every((r) => r.kind === "pair"), true);
  });

  it("skips to scoreboard when fewer than two submissions", () => {
    let state = createPromptVoteState("vote-all", ["prompt"], 4, undefined, ["p1", "p2"]);
    state = advancePromptVote(state, state.promptsPool);
    state.submissions.push({ id: "solo", playerId: "p1", text: "only one" });
    state = advancePromptVote(state, state.promptsPool);
    assert.equal(state.phase, "scoreboard");
  });
});

describe("prompt-vote-engine punchline bracket", () => {
  it("buildBracketRounds uses one triple and one pair for 5 submissions", () => {
    const subs = ["a", "b", "c", "d", "e"].map((id) => ({ id, playerId: id, text: id }));
    const rounds = buildBracketRounds(subs);
    assert.equal(rounds.length, 2);
    assert.equal(rounds[0].kind, "triple");
    assert.equal(rounds[1].kind, "pair");
    const tripleIds = rounds[0].kind === "triple" ? [rounds[0].a, rounds[0].b, rounds[0].c] : [];
    const pairIds = rounds[1].kind === "pair" ? [rounds[1].a, rounds[1].b] : [];
    assert.equal(new Set([...tripleIds, ...pairIds]).size, 5);
  });

  it("bracket with 5 players starts with a triple threat round", () => {
    const playerIds = ["p1", "p2", "p3", "p4", "p5"];
    const ctx = makeRoomContext(5);
    let state = createPromptVoteState("bracket", ["prompt"], 4, undefined, playerIds);
    state = advancePromptVote(state, state.promptsPool);
    for (const pid of playerIds) {
      state = onPromptVoteAction(state, pid, { kind: "submit_text", text: `Answer ${pid}` }, ctx);
    }
    assert.equal(state.phase, "matchup");
    assert.equal(state.bracketRounds[0]?.kind, "triple");
    assert.equal(state.bracketRounds.length, 2);
    const view = promptVoteHostView(state);
    assert.equal((view.data.matchup as { kind?: string }).kind, "triple");
  });

  it("bracket with 3 players uses gallery vote", () => {
    const playerIds = ["p1", "p2", "p3"];
    const ctx = makeRoomContext(3);
    let state = createPromptVoteState("bracket", ["prompt"], 4, undefined, playerIds);
    state = advancePromptVote(state, state.promptsPool);
    for (const pid of playerIds) {
      state = onPromptVoteAction(state, pid, { kind: "submit_text", text: `Answer ${pid}` }, ctx);
    }
    assert.equal(state.phase, "vote");
    assert.equal(state.bracketRounds.length, 0);
  });

  it("scores triple round winner +1000", () => {
    const playerIds = ["p1", "p2", "p3", "p4", "p5"];
    const ctx = makeRoomContext(5);
    let state = createPromptVoteState("bracket", ["prompt"], 4, undefined, playerIds);
    state = advancePromptVote(state, state.promptsPool);
    for (const pid of playerIds) {
      state = onPromptVoteAction(state, pid, { kind: "submit_text", text: `Answer ${pid}` }, ctx);
    }
    const triple = state.bracketRounds[0];
    assert.equal(triple?.kind, "triple");
    if (triple?.kind !== "triple") return;
    const tripleIds = [triple.a, triple.b, triple.c];
    const authorIds = new Set(
      state.submissions.filter((s) => tripleIds.includes(s.id)).map((s) => s.playerId),
    );
    const voters = playerIds.filter((id) => !authorIds.has(id));
    const winnerId = triple.b;
    for (const pid of voters) {
      state = onPromptVoteAction(state, pid, { kind: "vote_pair", winnerId }, ctx);
    }
    assert.equal(state.bracketIndex, 1);
    const winner = state.submissions.find((s) => s.id === winnerId);
    assert.equal(state.roundScores[winner!.playerId], 1000);
  });
});
