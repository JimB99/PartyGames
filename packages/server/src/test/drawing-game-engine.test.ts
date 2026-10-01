import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS } from "@party-games/shared";
import {
  createDrawingGameState,
  drawingGameHostView,
  onDrawingGameAction,
} from "../engines/drawing-game-engine.js";
import { advanceDrawVote, drawVoteHostView } from "../engines/draw-vote-engine.js";
import { onDrawAction } from "../engines/drawing-engine.js";
import { makeRoomContext } from "./harness.js";

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

  it("all-draw reveal exposes winner and vote breakdown", () => {
    const state = createDrawingGameState("all-draw", words, playerIds, {
      ...DEFAULT_GAME_OPTIONS,
      drawingStyle: "all-draw",
      drawVoteStyle: "best-drawing",
    });
    let inner = state.inner;
    inner.phase = "vote";
    inner.displayOrder = [...playerIds];
    inner.votes = { p1: "p2", p2: "p2", p3: "p2" };
    inner = advanceDrawVote(inner, words, playerIds);
    assert.equal(inner.phase, "reveal");
    assert.equal(inner.roundWinner, "p2");
    const view = drawVoteHostView(inner);
    assert.equal(view.data.roundWinner, "p2");
    assert.ok(Array.isArray(view.data.voteBreakdown));
    assert.equal((view.data.voteBreakdown as unknown[]).length, 3);
  });
});

describe("drawing ready and stroke revision", () => {
  const ctx = makeRoomContext(3);

  it("pictionary: one player ready does not leave drawing; all three do", () => {
    let state = createDrawingGameState("pictionary", words, playerIds, DEFAULT_GAME_OPTIONS);
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "drawing");
    state = onDrawingGameAction(state, "p1", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "drawing");
    state = onDrawingGameAction(state, "p2", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "drawing");
    state = onDrawingGameAction(state, "p3", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "guessing");
  });

  it("pictionary: host skip ends drawing even if only one player is ready", () => {
    let state = createDrawingGameState("pictionary", words, playerIds, DEFAULT_GAME_OPTIONS);
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    state = onDrawingGameAction(state, "p1", { kind: "advance" }, ctx);
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "guessing");
  });

  it("all-draw: all players ready leaves drawing; host skip also does", () => {
    let state = createDrawingGameState("all-draw", words, playerIds, DEFAULT_GAME_OPTIONS);
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "drawing");
    state = onDrawingGameAction(state, "p1", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "drawing");
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.inner.phase, "vote");
  });

  it("ignores a late stroke after clear", () => {
    const ctx = makeRoomContext(3);
    let state = createDrawingGameState("pictionary", words, playerIds, DEFAULT_GAME_OPTIONS);
    state = onDrawingGameAction(state, "host", { kind: "advance" }, ctx);
    if (state.style !== "pictionary") throw new Error("expected pictionary");
    const stroke = {
      kind: "draw_stroke" as const,
      points: [0.1, 0.1, 0.2, 0.2],
      color: "#fff",
      id: "late",
      revision: 0,
    };
    let draw = onDrawAction(state.inner, "p1", stroke, ctx);
    assert.equal(draw.drawings.p1.strokes.length, 1);
    draw = onDrawAction(draw, "p1", { kind: "draw_clear" }, ctx);
    assert.equal(draw.drawings.p1.strokes.length, 0);
    draw = onDrawAction(draw, "p1", stroke, ctx);
    assert.equal(draw.drawings.p1.strokes.length, 0);
  });
});
