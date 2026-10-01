import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_GAME_OPTIONS, scoreByAnswerRank } from "@party-games/shared";
import {
  LIVE_SKETCH_DRAWER_PTS,
  LIVE_SKETCH_FLAT_GUESS_PTS,
} from "@party-games/shared";
import {
  createLiveSketchState,
  liveSketchHostView,
  liveSketchPlayerView,
  onLiveSketchAction,
  onLiveSketchTick,
  type LiveSketchState,
} from "../engines/live-sketch-engine.js";
import { makeRoomContext } from "./harness.js";

const WORDS = ["elephant", "flower girl", "house"];
const PLAYER_IDS = ["p1", "p2", "p3"];

function expireTick(state: LiveSketchState): LiveSketchState {
  state.timerEndsAt = Date.now() - 1;
  return onLiveSketchTick(state);
}

function toDrawing(words = WORDS, options = DEFAULT_GAME_OPTIONS) {
  const ctx = makeRoomContext(3, options);
  let state = createLiveSketchState(words, PLAYER_IDS, options);
  state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
  return { state, ctx };
}

describe("live-sketch-engine", () => {
  it("starts in instructions then drawing with a pool word and live strokes on the host", () => {
    const { state, ctx } = toDrawing(["elephant"]);
    assert.equal(state.phase, "drawing");
    assert.equal(state.word, "elephant");
    assert.equal(state.maxRounds, 3);
    const host = liveSketchHostView(state, ctx);
    assert.equal(host.data.word, undefined);
    assert.ok(Array.isArray(host.data.strokes));
    const drawer = liveSketchPlayerView(state, "p1", ctx);
    assert.equal(drawer.playerData.word, "elephant");
    const guesser = liveSketchPlayerView(state, "p2", ctx);
    assert.equal(guesser.playerData.word, undefined);
    const blob = JSON.stringify({ host: host.data, guesser: guesser.data, guesserP: guesser.playerData });
    assert.equal(blob.includes("elephant"), false);
  });

  it("promotes hint phases on the default 30s / 60s ladder", () => {
    let { state } = toDrawing(["elephant"]);
    state = expireTick(state);
    assert.equal(state.phase, "letter-count");
    const hostCount = liveSketchHostView(state, makeRoomContext(3));
    assert.equal(hostCount.data.letterCount, 8);
    assert.equal(hostCount.data.wordCount, 1);
    assert.equal(hostCount.data.mask, undefined);
    assert.equal(hostCount.data.word, undefined);
    state = expireTick(state);
    assert.equal(state.phase, "hangman");
    const hostHang = liveSketchHostView(state, makeRoomContext(3));
    assert.ok(String(hostHang.data.mask).includes("_"));
    state = expireTick(state);
    assert.equal(state.phase, "reveal");
    assert.equal(liveSketchHostView(state, makeRoomContext(3)).data.word, "elephant");
  });

  it("skips hint phases when both hints are off", () => {
    let { state, ctx } = toDrawing(["elephant"], {
      ...DEFAULT_GAME_OPTIONS,
      liveSketchLetterCountMs: 0,
      liveSketchHangmanMs: 0,
    });
    assert.equal(state.phase, "drawing");
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "reveal");
  });

  it("awards ranked guesser points and 250 per correct guesser to the drawer", () => {
    const { state: start, ctx } = toDrawing(["elephant"]);
    let state = onLiveSketchAction(start, "p2", { kind: "submit_text", text: "elephant" }, ctx);
    state = onLiveSketchAction(state, "p3", { kind: "submit_text", text: "ElEphant" }, ctx);
    assert.equal(state.phase, "reveal");
    const ranked = scoreByAnswerRank(
      [
        { playerId: "p2", answeredAt: state.correctAt.p2 },
        { playerId: "p3", answeredAt: state.correctAt.p3 },
      ],
      2,
      1,
    );
    assert.equal(state.roundScores.p2, ranked.p2.points);
    assert.equal(state.roundScores.p3, ranked.p3.points);
    assert.equal(state.roundScores.p1, LIVE_SKETCH_DRAWER_PTS * 2);
  });

  it("awards flat 500 per correct guesser when speed scoring is off", () => {
    const { state: start, ctx } = toDrawing(["elephant"], {
      ...DEFAULT_GAME_OPTIONS,
      speedScoring: "off",
    });
    let state = onLiveSketchAction(start, "p2", { kind: "submit_text", text: "elephant" }, ctx);
    state = onLiveSketchAction(state, "p3", { kind: "submit_text", text: "elephant" }, ctx);
    assert.equal(state.roundScores.p2, LIVE_SKETCH_FLAT_GUESS_PTS);
    assert.equal(state.roundScores.p3, LIVE_SKETCH_FLAT_GUESS_PTS);
    assert.equal(state.roundScores.p1, LIVE_SKETCH_DRAWER_PTS * 2);
  });

  it("gives the drawer 0 when nobody guesses the word", () => {
    let { state, ctx } = toDrawing(["elephant"]);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "reveal");
    assert.equal(state.roundScores.p1 ?? 0, 0);
    assert.equal(state.roundScores.p2 ?? 0, 0);
  });

  it("rejects custom words over 40 characters and accepts non-drawable text", () => {
    const options = { ...DEFAULT_GAME_OPTIONS, liveSketchWordSource: "choice" as const };
    const ctx = makeRoomContext(3, options);
    let state = createLiveSketchState(WORDS, PLAYER_IDS, options);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "pick");
    assert.equal(state.choiceWords.length, 3);
    state = onLiveSketchAction(state, "p1", { kind: "submit_text", text: "a".repeat(41) }, ctx);
    assert.equal(state.phase, "pick");
    state = onLiveSketchAction(state, "p1", { kind: "submit_text", text: "opera!!!" }, ctx);
    assert.equal(state.phase, "drawing");
    assert.equal(state.word, "opera!!!");
  });

  it("ends the round when letters complete the mask without scoring a type-in", () => {
    const options = { ...DEFAULT_GAME_OPTIONS, liveSketchWordSource: "choice" as const };
    const ctx = makeRoomContext(3, options);
    let state = createLiveSketchState(["house"], PLAYER_IDS, options);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    state = onLiveSketchAction(state, "p1", { kind: "submit_text", text: "ox" }, ctx);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "hangman");
    state = onLiveSketchAction(state, "p2", { kind: "hangman_letter", letter: "o" }, ctx);
    state = onLiveSketchAction(state, "p3", { kind: "hangman_letter", letter: "x" }, ctx);
    assert.equal(state.phase, "reveal");
    assert.equal(state.roundScores.p2 ?? 0, 0);
    assert.equal(state.roundScores.p1 ?? 0, 0);
  });

  it("ignores the drawer guessing and blocks letter spam with a cooldown", () => {
    let { state, ctx } = toDrawing(["elephant"]);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "hangman");
    state = onLiveSketchAction(state, "p1", { kind: "submit_text", text: "elephant" }, ctx);
    assert.equal(state.correctAt.p1, undefined);
    state = onLiveSketchAction(state, "p2", { kind: "hangman_letter", letter: "e" }, ctx);
    state = onLiveSketchAction(state, "p2", { kind: "hangman_letter", letter: "l" }, ctx);
    assert.deepEqual(state.guessedLetters, ["e"]);
  });

  it("applies drawer strokes during drawing and keeps them on the host view", () => {
    const { state: start, ctx } = toDrawing(["elephant"]);
    const state = onLiveSketchAction(
      start,
      "p1",
      { kind: "draw_stroke", points: [0.1, 0.1, 0.2, 0.2], color: "#fff" },
      ctx,
    );
    assert.equal(state.strokes.length, 1);
    const host = liveSketchHostView(state, ctx);
    assert.equal((host.data.strokes as unknown[]).length, 1);
    const guesser = liveSketchPlayerView(state, "p2", ctx);
    assert.equal((guesser.data.strokes as unknown[]).length, 1);
  });

  it("rotates the drawer after scoreboard", () => {
    let { state, ctx } = toDrawing(["elephant", "house", "tree"]);
    state = onLiveSketchAction(state, "p2", { kind: "submit_text", text: state.word }, ctx);
    state = onLiveSketchAction(state, "p3", { kind: "submit_text", text: state.word }, ctx);
    assert.equal(state.phase, "reveal");
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "scoreboard");
    state = onLiveSketchAction(state, "host", { kind: "advance" }, ctx);
    assert.equal(state.phase, "instructions");
    assert.equal(state.drawerIndex, 1);
    assert.equal(state.round, 2);
  });
});
