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
import {
  createImpostorState,
  onImpostorAction,
  onImpostorRosterChange,
  onImpostorTick,
} from "../engines/impostor-engine.js";
import {
  createWordRushState,
  onWordRushAction,
  onWordRushRosterChange,
} from "../engines/word-rush-engine.js";
import {
  createBracketState,
  onBracketAction,
  onBracketRosterChange,
} from "../engines/bracket-engine.js";
import {
  createSpectrumState,
  onSpectrumAction,
  onSpectrumRosterChange,
} from "../engines/spectrum-engine.js";

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

describe("roster sync — impostor", () => {
  const pool = [{ id: "places", label: "Places", items: ["Paris", "Rome", "Berlin"] }];

  it("closes accusation when a holdout disconnects after everyone else voted", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createImpostorState(pool, ctx4.playerIds, 2);
    state.spyId = "p4";
    state = onImpostorAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "questioning");
    state.timerEndsAt = Date.now() - 1;
    state = onImpostorTick(state);
    assert.equal(state.phase, "accusation");
    for (const id of ["p1", "p2"]) {
      state = onImpostorAction(state, id, { kind: "impostor_accuse", targetId: "p4" }, ctx4);
    }
    assert.equal(state.phase, "accusation", "p3 has not voted yet");

    const ctx3 = ctxFor(players, ["p1", "p2", "p4"]);
    state = onImpostorRosterChange(state, ctx3);
    assert.equal(state.phase, "reveal");
  });
});

describe("roster sync — word-rush", () => {
  it("leaves playing when a holdout disconnects after everyone else submitted", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createWordRushState(2, new Set(["word"]), 3, 4);
    state.letters = ["W", "O", "R", "D", "E", "A", "F"];
    state = onWordRushAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "playing");
    for (const id of ["p1", "p2", "p3"]) {
      state = onWordRushAction(state, id, { kind: "submit_text", text: "word" }, ctx4);
    }
    assert.equal(state.phase, "playing");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onWordRushRosterChange(state, ctx3);
    assert.equal(state.phase, "reveal");
  });
});

describe("roster sync — bracket-battle", () => {
  it("leaves submit when a holdout disconnects after everyone else entered", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createBracketState(["Funniest"], DEFAULT_GAME_OPTIONS);
    state = onBracketAction(state, "host", { kind: "advance" }, ctx4);
    assert.equal(state.phase, "submit");
    for (const id of ["p1", "p2", "p3"]) {
      state = onBracketAction(state, id, { kind: "submit_text", text: `entry-${id}` }, ctx4);
    }
    assert.equal(state.phase, "submit");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onBracketRosterChange(state, ctx3);
    assert.equal(state.phase, "vote");
  });
});

describe("roster sync — spectrum", () => {
  const pairs = [{ left: "Hot", right: "Cold", target: 50 }];

  it("reveals when a holdout disconnects after other guessers locked in", () => {
    const players = makePlayers(4);
    const ctx4 = ctxFor(players);
    let state = createSpectrumState(pairs, ctx4.playerIds, 4);
    state.clueGiverId = "p1";
    state = onSpectrumAction(state, "host", { kind: "advance" }, ctx4);
    state = onSpectrumAction(state, "p1", { kind: "submit_text", text: "warm" }, ctx4);
    assert.equal(state.phase, "guess");
    for (const id of ["p2", "p3"]) {
      state = onSpectrumAction(state, id, { kind: "spectrum_guess", value: 40 }, ctx4);
    }
    assert.equal(state.phase, "guess");

    const ctx3 = ctxFor(players, ["p1", "p2", "p3"]);
    state = onSpectrumRosterChange(state, ctx3);
    assert.equal(state.phase, "reveal");
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
