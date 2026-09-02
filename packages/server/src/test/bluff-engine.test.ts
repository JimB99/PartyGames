import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBluffState, advanceBluff, bluffHostView, bluffPlayerView } from "../engines/bluff-engine.js";

describe("reverse-fact decoys", () => {
  it("house decoys are questions not bare facts", () => {
    const prompts = [
      { fact: "Mars", truth: "Which planet is known as the Red Planet?" },
      { fact: "Pacific", truth: "What is the largest ocean on Earth?" },
      { fact: "Tokyo", truth: "What is the capital of Japan?" },
      { fact: "Venus", truth: "Which planet is hottest?" },
      { fact: "Carbon dioxide", truth: "What gas do plants absorb?" },
    ];
    let state = createBluffState("reverse-fact", prompts, 1, 2);
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

describe("fact-check couch discuss beat", () => {
  const prompts = [
    { prompt: "The inventor of the telephone", truth: "Alexander Graham Bell" },
    { prompt: "The largest planet", truth: "Jupiter" },
    { prompt: "The capital of France", truth: "Paris" },
    { prompt: "The chemical symbol for gold", truth: "Au" },
  ];

  it("shows option texts on the host view during vote so the room can read them aloud", () => {
    let state = createBluffState("fact-check", prompts, 1, 2);
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
