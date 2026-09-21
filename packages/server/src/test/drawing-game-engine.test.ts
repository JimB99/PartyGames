import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import {
  createDrawingGameState,
  drawingGameHostView,
} from "../engines/drawing-game-engine.js";

const playerIds = ["p1", "p2", "p3"];
const words = ["house", "tree", "car"];

describe("drawing-game-engine", () => {
  it("pictionary style inits draw state", () => {
    const state = createDrawingGameState("pictionary", words, playerIds, DEFAULT_GAME_OPTIONS);
    assert.equal(state.style, "pictionary");
    assert.equal(state.inner.phase, "instructions");
  });

  it("telephone style inits chain sketch state", () => {
    const state = createDrawingGameState("telephone", words, playerIds, DEFAULT_GAME_OPTIONS);
    assert.equal(state.style, "telephone");
    assert.ok(state.inner.chains.p1);
  });

  it("all-draw style respects drawVoteStyle", () => {
    const guessArtist = createDrawingGameState("all-draw", words, playerIds, {
      ...DEFAULT_GAME_OPTIONS,
      drawingStyle: "all-draw",
      drawVoteStyle: "guess-artist",
    });
    assert.equal(guessArtist.style, "all-draw");
    assert.equal(guessArtist.inner.mode, "artistGuess");

    const bestDrawing = createDrawingGameState("all-draw", words, playerIds, {
      ...DEFAULT_GAME_OPTIONS,
      drawingStyle: "all-draw",
      drawVoteStyle: "best-drawing",
    });
    assert.equal(bestDrawing.inner.mode, "bestDrawing");
  });

  it("host view includes drawingStyle", () => {
    const state = createDrawingGameState("pictionary", words, playerIds, DEFAULT_GAME_OPTIONS);
    const view = drawingGameHostView(state, playerIds, DEFAULT_GAME_OPTIONS);
    assert.equal(view.data.drawingStyle, "pictionary");
  });
});
