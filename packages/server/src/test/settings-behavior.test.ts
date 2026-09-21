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
    let easyMax = 0;
    for (const w of easy) easyMax = Math.max(easyMax, w.length);
    let hardMin = Infinity;
    for (const w of hard) hardMin = Math.min(hardMin, w.length);
    assert.ok(easyMax <= hardMin + 2, `easy max ${easyMax} vs hard min ${hardMin}`);
  });

  it("trivia questionDisplay changes host view", () => {
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

  it("speedScoring off completes bluff", () => {
    const game = getGame("bluff")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring: "off" });
    const { ended } = runUntilEnded(game, ctx, { gameId: "bluff", maxSteps: 2000 });
    assert.ok(ended);
  });

  it("speedScoring bonus completes hangman-race", () => {
    const game = getGame("hangman-race")!;
    const ctx = makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, speedScoring: "bonus" });
    const { ended } = runUntilEnded(game, ctx, { gameId: "hangman-race", maxSteps: 3000 });
    assert.ok(ended);
  });

  it("mature trivia pool contains only mature-rated items", () => {
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

  it("bluffMode changes init mode", () => {
    const game = getGame("bluff")!;
    const fill = game.init(makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, bluffMode: "fill-blank" })) as {
      mode: string;
    };
    const reverse = game.init(
      makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, bluffMode: "reverse-question" }),
    ) as { mode: string };
    assert.equal(fill.mode, "fill-blank");
    assert.equal(reverse.mode, "reverse-question");
  });

  it("triviaFormat changes init mode", () => {
    const game = getGame("trivia")!;
    const quiz = game.init(makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, triviaFormat: "quiz" })) as {
      mode: string;
    };
    const timeline = game.init(
      makeRoomContext(2, { ...DEFAULT_GAME_OPTIONS, triviaFormat: "timeline" }),
    ) as { mode: string };
    assert.equal(quiz.mode, "quiz");
    assert.equal(timeline.mode, "timeline");
  });

  it("promptVoteStyle changes init mode", () => {
    const game = getGame("prompt-vote")!;
    const bracket = game.init(makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, promptVoteStyle: "bracket" })) as {
      mode: string;
    };
    const hotSeat = game.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, promptVoteStyle: "hot-seat" }),
    ) as { mode: string };
    assert.equal(bracket.mode, "bracket");
    assert.equal(hotSeat.mode, "hot-seat");
  });

  it("opinionScoring changes init scoring", () => {
    const game = getGame("opinions")!;
    const minority = game.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, opinionScoring: "minority" }),
    ) as { scoring: string };
    const predict = game.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, opinionScoring: "predict-majority" }),
    ) as { scoring: string };
    assert.equal(minority.scoring, "minority");
    assert.equal(predict.scoring, "predict-majority");
  });

  it("drawingStyle changes init style", () => {
    const game = getGame("drawing")!;
    const telephone = game.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, drawingStyle: "telephone" }),
    ) as { style: string };
    const allDraw = game.init(
      makeRoomContext(3, { ...DEFAULT_GAME_OPTIONS, drawingStyle: "all-draw", drawVoteStyle: "guess-artist" }),
    ) as { style: string; inner: { mode: string } };
    assert.equal(telephone.style, "telephone");
    assert.equal(allDraw.style, "all-draw");
    assert.equal(allDraw.inner.mode, "artistGuess");
  });

  it("impostorStyle changes init style", () => {
    const game = getGame("impostor")!;
    const verbal = game.init(makeRoomContext(4, { ...DEFAULT_GAME_OPTIONS, impostorStyle: "verbal" })) as {
      style: string;
    };
    const draw = game.init(makeRoomContext(4, { ...DEFAULT_GAME_OPTIONS, impostorStyle: "draw" })) as {
      style: string;
    };
    assert.equal(verbal.style, "verbal");
    assert.equal(draw.style, "draw");
  });
});
