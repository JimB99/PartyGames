import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { activePlayerIds, DEFAULT_GAME_OPTIONS, type RoomContext } from "@party-games/shared";
import { makePlayers } from "./harness.js";
import {
  createTriviaState,
  onTriviaAction,
  onTriviaRosterChange,
  triviaHostView,
} from "../engines/trivia-engine.js";
import {
  createBluffState,
  onBluffAction,
  onBluffRosterChange,
  bluffHostView,
} from "../engines/bluff-engine.js";
import {
  createPromptVoteState,
  onPromptVoteAction,
  onPromptVoteRosterChange,
  promptVoteHostView,
} from "../engines/prompt-vote-engine.js";

function ctxFor(players: ReturnType<typeof makePlayers>, connectedIds?: string[]): RoomContext {
  const roster = players.map((p) => ({
    ...p,
    connected: connectedIds ? connectedIds.includes(p.id) : p.connected,
  }));
  return {
    roomId: "TEST",
    players: roster,
    playerIds: activePlayerIds(roster),
    gameOptions: DEFAULT_GAME_OPTIONS,
  };
}

describe("roster sync — trivia", () => {
  const items = [{ question: "Q?", choices: ["A", "B"], correct: 0 }];

  it("drops expected count and advances when the last holdout disconnects", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createTriviaState("quiz", items, 3, 4, DEFAULT_GAME_OPTIONS);
    state = onTriviaAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "question");
    for (const id of ["p1", "p2", "p3"]) {
      state = onTriviaAction(state, id, { kind: "trivia_answer", choiceIndex: 0 }, ctx4);
    }
    assert.equal(state.phase, "question");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onTriviaRosterChange(state, ctx3);
    assert.equal(state.phase, "reveal");
    const view = triviaHostView(state, state.gameOptions, ctx3);
    assert.equal(view.data.playerCount, 3);
    assert.equal(view.data.answerCount, 3);
  });

  it("does not wait on a mid-round joiner marked waiting", () => {
    const seated = makePlayers(3);
    const waiter = { id: "p4", nickname: "Late", colorIndex: 3, connected: true, waiting: true };
    const ctx = ctxFor([...seated, waiter]);
    assert.deepEqual(ctx.playerIds, ["p1", "p2", "p3"]);

    let state = createTriviaState("quiz", items, 3, 3, DEFAULT_GAME_OPTIONS);
    state = onTriviaAction(state, "host", { kind: "advance" }, ctx);
    for (const id of ["p1", "p2", "p3"]) {
      state = onTriviaAction(state, id, { kind: "trivia_answer", choiceIndex: 0 }, ctx);
    }
    assert.equal(state.phase, "reveal");
    const view = triviaHostView(state, state.gameOptions, ctx);
    assert.equal(view.data.expectedSubmitCount, 3);
    assert.equal(view.data.playerCount, 3);
  });
});

describe("roster sync — bluff", () => {
  const prompts = [{ prompt: "Capital of France", truth: "Paris" }];

  it("completes submit when a missing player disconnects", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createBluffState("fill-blank", prompts, 2, 4);
    state = onBluffAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "submit");
    for (const id of ["p1", "p2", "p3"]) {
      state = onBluffAction(state, id, { kind: "submit_text", text: `lie-${id}` }, ctx4);
    }
    assert.equal(state.phase, "submit");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onBluffRosterChange(state, ctx3);
    assert.equal(state.phase, "vote");
    const view = bluffHostView(state, ctx3);
    assert.equal(view.data.playerCount, 3);
  });
});

describe("roster sync — prompt-vote", () => {
  it("completes submit without a disconnected player", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createPromptVoteState("vote-all", ["A funny prompt"], 2, undefined, ctx4.playerIds);
    state = onPromptVoteAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "submit");
    for (const id of ["p1", "p2", "p3"]) {
      state = onPromptVoteAction(state, id, { kind: "submit_text", text: `ans-${id}` }, ctx4);
    }
    assert.equal(state.phase, "submit");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onPromptVoteRosterChange(state, ctx3);
    assert.equal(state.phase, "vote");
    const view = promptVoteHostView(state, ctx3);
    assert.equal(view.data.playerCount, 3);
    assert.equal(view.data.expectedSubmitCount, undefined);
  });
});
