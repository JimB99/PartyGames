import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createBluffState, advanceBluff } from "../engines/bluff-engine.js";

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
