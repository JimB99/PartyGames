import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_OPTIONS,
  timelineAccuracyPoints,
  resolveQuestionDisplay,
  type GameOptions,
} from "@party-games/shared";
import { getGame } from "../registry.js";
import {
  factCheckPool,
  hangmanWordPool,
  impostorPool,
  quizPool,
  dictionaryForWordRush,
} from "../content-pool.js";
import { makeRoomContext, runUntilEnded } from "./harness.js";
import { createPaddleClashState } from "../engines/paddle-clash-engine.js";
import { createTriviaState, triviaHostView, advanceTrivia } from "../engines/trivia-engine.js";
import { teamCharadesGame } from "../games/team-charades.js";

describe("settings behavior", () => {
  it("fact-check mature pool differs from family", () => {
    const family = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = factCheckPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length >= 10);
    assert.ok(family.length >= 10);
    assert.ok(mature.every((r) => r.rating === "mature"));
    assert.ok(family.every((r) => (r.rating ?? "family") === "family"));
    const familyTexts = new Set(family.map((r) => r.prompt ?? r.truth));
    assert.ok(mature.some((r) => !familyTexts.has(r.prompt ?? r.truth)));
  });

  it("hangman-race difficulty filters word lengths", () => {
    const easy = hangmanWordPool({ ...DEFAULT_GAME_OPTIONS, difficulty: "easy" });
    const hard = hangmanWordPool({ ...DEFAULT_GAME_OPTIONS, difficulty: "hard" });
    assert.ok(easy.length >= 5);
    assert.ok(hard.length >= 5);
    const easyAvg = easy.reduce((s, w) => s + w.length, 0) / easy.length;
    const hardAvg = hard.reduce((s, w) => s + w.length, 0) / hard.length;
    assert.ok(easyAvg < hardAvg, `easy avg ${easyAvg} should be < hard avg ${hardAvg}`);
  });

  it("word-rush difficulty filters dictionary by word length", () => {
    const easy = dictionaryForWordRush({ ...DEFAULT_GAME_OPTIONS, difficulty: "easy" });
    const hard = dictionaryForWordRush({ ...DEFAULT_GAME_OPTIONS, difficulty: "hard" });
    assert.ok(easy.size > 0 && hard.size > 0);
    const easyMax = Math.max(...[...easy].map((w) => w.length));
    const hardMin = Math.min(...[...hard].map((w) => w.length));
    assert.ok(easyMax <= hardMin + 2, `easy max ${easyMax} vs hard min ${hardMin}`);
  });

  it("quick-quiz questionDisplay changes host view", () => {
    const items = [{ question: "Q?", choices: ["A", "B"], correct: 0 }];
    const tvFull: GameOptions = { ...DEFAULT_GAME_OPTIONS, questionDisplay: "tv_full" };
    const tvPrompt: GameOptions = { ...DEFAULT_GAME_OPTIONS, questionDisplay: "tv_prompt_only" };
    assert.equal(resolveQuestionDisplay(tvFull), "tv_full");

    let state = createTriviaState("quiz", items, 1, 2);
    state.gameOptions = tvFull;
    state = advanceTrivia(state, items, tvFull);
    const fullView = triviaHostView(state, tvFull);
    assert.ok(fullView.data.choices);

    state = createTriviaState("quiz", items, 1, 2);
    state.gameOptions = tvPrompt;
    state = advanceTrivia(state, items, tvPrompt);
    const promptView = triviaHostView(state, tvPrompt);
    assert.equal(promptView.data.choices, undefined);
  });

  it("timelinePtsPerYearOff changes accuracy points", () => {
    const loose = timelineAccuracyPoints(5, 20);
    const strict = timelineAccuracyPoints(5, 50);
    assert.ok(loose > strict);
    assert.equal(timelineAccuracyPoints(0, 1000), 1000);
  });

  it("paddleMode changes init state", () => {
    const pong = createPaddleClashState(["p1", "p2"], "pong");
    const hockey = createPaddleClashState(["p1", "p2"], "hockey");
    assert.equal(pong.mode, "pong");
    assert.equal(hockey.mode, "hockey");
    assert.notEqual(pong.paddle.mode, hockey.paddle.mode);
  });

  it("charadesMode teams vs solo changes team layout", () => {
    const solo = teamCharadesGame.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, charadesMode: "solo" }),
    );
    const teams = teamCharadesGame.init(
      makeRoomContext(4, { ...DEFAULT_GAME_OPTIONS, charadesMode: "teams" }),
    );
    assert.equal(solo.teamsMode, false);
    assert.equal(teams.teamsMode, true);
    assert.ok(teams.teamByPlayerId.p1);
  });

  it("trail-dash botCount affects player count in state", () => {
    const game = getGame("trail-dash")!;
    const ctx = makeRoomContext(1, {
      ...DEFAULT_GAME_OPTIONS,
      trailDash: { botCount: 2, maxRounds: 1, roundTimeSec: 30 },
    });
    const state = game.init(ctx) as { players: unknown[] };
    assert.equal(state.players.length, 3);
  });

  it("impostorCategory filters pool", () => {
    const all = impostorPool({ ...DEFAULT_GAME_OPTIONS, impostorCategory: "all" });
    const places = impostorPool({ ...DEFAULT_GAME_OPTIONS, impostorCategory: "places" });
    assert.ok(all.length > places.length);
    assert.ok(places.every((p) => p.id === "places"));
  });

  it("speedScoring off completes fact-check", () => {
    const game = getGame("fact-check")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring: "off" });
    const { ended } = runUntilEnded(game, ctx, { gameId: "fact-check", maxSteps: 2000 });
    assert.ok(ended);
  });

  it("speedScoring bonus completes hangman-race", () => {
    const game = getGame("hangman-race")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring: "bonus" });
    const { ended } = runUntilEnded(game, ctx, { gameId: "hangman-race", maxSteps: 3000 });
    assert.ok(ended);
  });

  it("mature quick-quiz pool contains only mature-rated items", () => {
    const mature = quizPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length >= 10);
    assert.ok(mature.every((q) => q.rating === "mature"));
  });

  it("impostor mature packs exclude family categories", () => {
    const family = impostorPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "family" });
    const mature = impostorPool({ ...DEFAULT_GAME_OPTIONS, contentRating: "mature" });
    assert.ok(mature.length >= 2);
    assert.ok(mature.every((pack) => pack.rating === "mature"));
    assert.ok(family.every((pack) => (pack.rating ?? "family") === "family"));
  });
});
