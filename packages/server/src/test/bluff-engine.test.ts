import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import {
  createBluffState,
  advanceBluff,
  bluffHostView,
  bluffPlayerView,
  onBluffAction,
  onBluffTick,
} from "../engines/bluff-engine.js";
import { makeRoomContext } from "./harness.js";

describe("reverse-question decoys", () => {
  it("house decoys are questions not bare facts", () => {
    const prompts = [
      { fact: "Mars", truth: "Which planet is known as the Red Planet?" },
      { fact: "Pacific", truth: "What is the largest ocean on Earth?" },
      { fact: "Tokyo", truth: "What is the capital of Japan?" },
      { fact: "Venus", truth: "Which planet is hottest?" },
      { fact: "Carbon dioxide", truth: "What gas do plants absorb?" },
    ];
    let state = createBluffState("reverse-question", prompts, 1, 2);
    state = advanceBluff(state);
    state = advanceBluff(state);
    assert.equal(state.phase, "vote");
    for (const opt of state.options) {
      if (opt.authorId === "house") {
        assert.ok(opt.text.includes("?"), `decoy should be a question: ${opt.text}`);
        assert.ok(!opt.text.endsWith(".?"), `malformed decoy: ${opt.text}`);
      }
    }
  });
});

describe("fill-blank couch discuss beat", () => {
  const prompts = [
    { prompt: "The inventor of the telephone", truth: "Alexander Graham Bell" },
    { prompt: "The largest planet", truth: "Jupiter" },
    { prompt: "The capital of France", truth: "Paris" },
    { prompt: "The chemical symbol for gold", truth: "Au" },
  ];

  it("shows option texts on the host view during vote so the room can read them aloud", () => {
    let state = createBluffState("fill-blank", prompts, 1, 2);
    state = advanceBluff(state);
    state.submissions = { p1: "Thomas Edison", p2: "Nikola Tesla" };
    state = advanceBluff(state);
    assert.equal(state.phase, "vote");
    assert.ok(state.discussUntil && state.discussUntil > Date.now());
    const host = bluffHostView(state);
    assert.equal(host.data.discussing, true);
    assert.ok((host.data.options?.length ?? 0) >= 3);
    for (const opt of host.data.options ?? []) {
      assert.ok(opt.text.length > 0);
      assert.equal("isTruth" in opt ? (opt as { isTruth?: boolean }).isTruth : undefined, undefined);
    }
    const player = bluffPlayerView(state, "p1");
    assert.equal(player.playerData.discussing, true);
    assert.ok(player.data.options?.some((o) => o.text === "Thomas Edison"));
  });
});

describe("prompt rotation between rounds", () => {
  const prompts = [
    { fact: "orgy", truth: "What is group sex often called?" },
    { fact: "Mars", truth: "Which planet is known as the Red Planet?" },
    { fact: "Pacific", truth: "What is the largest ocean on Earth?" },
  ];

  function advanceToScoreboard(state: ReturnType<typeof createBluffState>) {
    let s = advanceBluff(state);
    s.submissions = { p1: "Who discovered America?", p2: "What is the Red Planet?" };
    s = advanceBluff(s);
    s.votes = { p1: s.truthId, p2: s.truthId };
    s = advanceBluff(s);
    s = advanceBluff(s);
    assert.equal(s.phase, "scoreboard");
    return s;
  }

  it("host pacing advance from scoreboard picks a new prompt", () => {
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, hostPacing: true });
    let state = createBluffState("reverse-question", prompts, 3, 2, ctx.gameOptions);
    const firstDisplay = state.displayText;
    state = advanceToScoreboard(state);
    state = onBluffAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "submit");
    assert.equal(state.round, 2);
    assert.equal(state.usedPrompts.length, 2);
    assert.notEqual(state.displayText, firstDisplay);
  });

  it("timer tick from scoreboard picks a new prompt", () => {
    let state = createBluffState("reverse-question", prompts, 3, 2);
    const firstDisplay = state.displayText;
    state = advanceToScoreboard(state);
    state.timerEndsAt = Date.now() - 1;
    state = onBluffTick(state);
    assert.equal(state.phase, "submit");
    assert.equal(state.round, 2);
    assert.equal(state.usedPrompts.length, 2);
    assert.notEqual(state.displayText, firstDisplay);
  });
});
