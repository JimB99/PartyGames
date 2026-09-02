import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createStarRateState, starRateHostView, type StarRateState } from "../engines/star-rate-engine.js";

describe("star-rate-engine", () => {
  it("reveals anonymous averages and histograms without ranking names", () => {
    const state: StarRateState = createStarRateState(["A confession"], ["p1", "p2", "p3"]);
    state.phase = "reveal";
    state.submissions = [
      { id: "s1", playerId: "p1", text: "Pineapple pizza" },
      { id: "s2", playerId: "p2", text: "Midnight cereal" },
    ];
    state.ratings = {
      p2: { s1: 5 },
      p3: { s1: 3, s2: 4 },
      p1: { s2: 2 },
    };

    const view = starRateHostView(state);
    const blob = JSON.stringify(view);
    assert.equal(blob.includes("p1"), false);
    assert.equal(blob.includes("p2"), false);

    const subs = view.data.submissions ?? [];
    assert.equal(subs.length, 2);
    const first = subs.find((s) => s.id === "s1");
    const second = subs.find((s) => s.id === "s2");
    assert.equal(first?.average, 4);
    assert.deepEqual(first?.histogram, [0, 0, 1, 0, 1]);
    assert.equal(second?.average, 3);
    assert.equal(view.data.roundScores, undefined);
  });
});
