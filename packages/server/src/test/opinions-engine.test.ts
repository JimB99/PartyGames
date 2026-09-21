import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import { advanceCrowd, createCrowdState } from "../engines/crowd-call-engine.js";
import { advanceSplit, createSplitState } from "../engines/split-room-engine.js";
import { advanceTrivia, createTriviaState } from "../engines/trivia-engine.js";
import {
  createOpinionsState,
  opinionsHostView,
  opinionsRoundScores,
} from "../engines/opinions-engine.js";

const playerIds = ["p1", "p2", "p3", "p4"];

describe("opinions-engine", () => {
  it("majority scoring exposes opinionScoring on host view", () => {
    const pool = [{ a: "Coffee", b: "Tea" }];
    const state = createOpinionsState("majority", pool, [], [], playerIds, DEFAULT_GAME_OPTIONS);
    const view = opinionsHostView(state, DEFAULT_GAME_OPTIONS);
    assert.equal(view.data.opinionScoring, "majority");
    assert.equal(view.data.mode, "would-you-rather");
  });

  it("minority scoring awards minority side", () => {
    const pool = [{ text: "Pick", labelA: "A", labelB: "B" }];
    let inner = createSplitState(pool, playerIds, 1);
    inner = advanceSplit(inner, playerIds);
    inner.votes = { p1: "a", p2: "a", p3: "b", p4: "b" };
    inner = advanceSplit(inner, playerIds);
    const state = { scoring: "minority" as const, inner };
    const scores = opinionsRoundScores(state);
    assert.ok(scores.p3 > 0 || scores.p4 > 0);
  });

  it("predict-majority scoring matches crowd-call outcomes", () => {
    const pool = [{ text: "Pick one", choices: ["A", "B", "C"] }];
    let inner = createCrowdState(pool, playerIds, 1);
    inner = advanceCrowd(inner, playerIds);
    inner.predictions = { p1: 0, p2: 1, p3: 2, p4: 1 };
    inner = advanceCrowd(inner, playerIds);
    inner.answers = { p1: 0, p2: 0, p3: 0, p4: 1 };
    inner = advanceCrowd(inner, playerIds);
    const state = { scoring: "predict-majority" as const, inner };
    const scores = opinionsRoundScores(state);
    assert.equal(scores.p1, 1200);
    assert.equal(scores.p2, 200);
  });

  it("init picks trivia path for majority", () => {
    const state = createOpinionsState(
      "majority",
      [{ a: "X", b: "Y" }],
      [{ text: "t", labelA: "a", labelB: "b" }],
      [{ text: "q", choices: ["a", "b"] }],
      playerIds,
    );
    assert.equal(state.scoring, "majority");
    let inner = state.inner;
    inner = advanceTrivia(inner, inner.itemsPool, DEFAULT_GAME_OPTIONS);
    assert.equal(inner.mode, "would-you-rather");
  });
});
