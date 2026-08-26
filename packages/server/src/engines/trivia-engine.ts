import {
  DEFAULT_GAME_OPTIONS,
  isSpeedScoringEnabled,
  pickRandom,
  resolveQuestionDisplay,
  resolveTimelinePtsPerYearOff,
  scoreByAnswerRank,
  timelineAccuracyPoints,
  type GameAction,
  type GameOptions,
  type PlayerAnswerReveal,
  type RoomContext,
} from "@party-games/shared";

export type TriviaMode = "quiz" | "timeline" | "would-you-rather";

export type TriviaPhase = "instructions" | "question" | "reveal" | "scoreboard" | "ended";

export interface TriviaState {
  phase: TriviaPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  phaseStartedAt: number | null;
  mode: TriviaMode;
  question?: string;
  choices?: string[];
  correctIndex?: number;
  event?: string;
  correctYear?: number;
  minYear?: number;
  maxYear?: number;
  optionA?: string;
  optionB?: string;
  answers: Record<string, number | "a" | "b">;
  answerTimes: Record<string, number>;
  rankPlaces: Record<string, number>;
  roundScores: Record<string, number>;
  usedIndices: number[];
  results?: Record<string, number>;
  itemsPool: unknown[];
  gameOptions?: GameOptions;
  playerCount: number;
}

const QUESTION_MS = 25000;
const REVEAL_MS = 6000;
const SCOREBOARD_MS = 4000;

function buildTriviaPlayerAnswers(state: TriviaState): PlayerAnswerReveal[] {
  return Object.entries(state.answers).map(([playerId, answer]) => {
    const rankPlace = state.rankPlaces[playerId];
    if (state.mode === "quiz" && typeof answer === "number") {
      return {
        playerId,
        answer,
        detail: state.choices?.[answer],
        correct: answer === state.correctIndex,
        points: state.results?.[playerId],
        rankPlace,
      };
    }
    if (state.mode === "timeline" && typeof answer === "number") {
      return {
        playerId,
        answer,
        detail: `Year ${answer}`,
        points: state.results?.[playerId],
        rankPlace,
      };
    }
    const choice = answer as "a" | "b";
    return {
      playerId,
      answer: choice,
      detail: choice === "a" ? state.optionA : state.optionB,
    };
  });
}

export function createTriviaState(
  mode: TriviaMode,
  items: unknown[],
  maxRounds = 8,
  playerCount = 2,
): TriviaState {
  const state: TriviaState = {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    phaseStartedAt: null,
    mode,
    answers: {},
    answerTimes: {},
    rankPlaces: {},
    roundScores: {},
    usedIndices: [],
    itemsPool: items,
    playerCount,
  };
  loadTriviaItem(state, items, true);
  return state;
}

function loadTriviaItem(state: TriviaState, items: unknown[], first = false) {
  const available = items.map((_, i) => i).filter((i) => !state.usedIndices.includes(i));
  const pool = available.length > 0 ? available : items.map((_, i) => i);
  const idx = pickRandom(pool);
  if (!first) state.usedIndices.push(idx);
  else state.usedIndices = [idx];

  const item = items[idx] as Record<string, unknown>;
  if (state.mode === "quiz") {
    state.question = item.question as string;
    state.choices = item.choices as string[];
    state.correctIndex = item.correct as number;
  } else if (state.mode === "timeline") {
    state.event = item.event as string;
    state.correctYear = item.year as number;
    state.minYear = state.correctYear! - 50;
    state.maxYear = state.correctYear! + 50;
  } else {
    state.optionA = item.a as string;
    state.optionB = item.b as string;
  }
}

export function advanceTrivia(state: TriviaState, items: unknown[], gameOptions?: GameOptions): TriviaState {
  if (state.phase === "instructions") {
    state.phase = "question";
    state.phaseStartedAt = Date.now();
    state.timerEndsAt = state.phaseStartedAt + QUESTION_MS;
    state.answers = {};
    state.answerTimes = {};
    state.rankPlaces = {};
    return state;
  }
  if (state.phase === "question") {
    scoreTrivia(state, gameOptions);
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + REVEAL_MS;
    state.phaseStartedAt = null;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    loadTriviaItem(state, items);
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

function scoreTrivia(state: TriviaState, gameOptions?: GameOptions) {
  state.roundScores = {};
  state.results = {};
  state.rankPlaces = {};
  const speedOn = gameOptions ? isSpeedScoringEnabled(gameOptions) : false;
  const totalPlayers = Math.max(1, state.playerCount);

  if (state.mode === "quiz") {
    if (speedOn) {
      const correctEntries = Object.entries(state.answers)
        .filter(
          ([playerId, answer]) =>
            typeof answer === "number" &&
            answer === state.correctIndex &&
            state.answerTimes[playerId] !== undefined,
        )
        .map(([playerId]) => ({
          playerId,
          answeredAt: state.answerTimes[playerId]!,
        }));
      const ranked = scoreByAnswerRank(correctEntries, totalPlayers, 1);
      for (const [playerId, answer] of Object.entries(state.answers)) {
        if (typeof answer !== "number") continue;
        const pts = ranked[playerId]?.points ?? 0;
        state.roundScores[playerId] = pts;
        state.results![playerId] = pts;
        if (ranked[playerId]) state.rankPlaces[playerId] = ranked[playerId].rankPlace;
      }
    } else {
      for (const [playerId, answer] of Object.entries(state.answers)) {
        if (typeof answer === "number") {
          const pts = answer === state.correctIndex ? 1000 : 0;
          state.roundScores[playerId] = pts;
          state.results![playerId] = pts;
        }
      }
    }
    return;
  }

  if (state.mode === "timeline") {
    const ptsPerYear = resolveTimelinePtsPerYearOff(gameOptions ?? state.gameOptions ?? DEFAULT_GAME_OPTIONS);
    for (const [playerId, answer] of Object.entries(state.answers)) {
      if (typeof answer !== "number") continue;
      const diff = Math.abs(answer - state.correctYear!);
      const accuracy = timelineAccuracyPoints(diff, ptsPerYear);
      if (!speedOn || diff > 0) {
        state.roundScores[playerId] = accuracy;
        state.results![playerId] = accuracy;
      }
    }
    if (speedOn) {
      const exactEntries = Object.entries(state.answers)
        .filter(([playerId, answer]) => {
          if (typeof answer !== "number") return false;
          return Math.abs(answer - state.correctYear!) === 0 && state.answerTimes[playerId] !== undefined;
        })
        .map(([playerId]) => ({
          playerId,
          answeredAt: state.answerTimes[playerId]!,
        }));
      const ranked = scoreByAnswerRank(exactEntries, totalPlayers, 1);
      for (const [playerId, score] of Object.entries(ranked)) {
        state.roundScores[playerId] = score.points;
        state.results![playerId] = score.points;
        state.rankPlaces[playerId] = score.rankPlace;
      }
    }
  }
}

export function onTriviaAction(
  state: TriviaState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): TriviaState {
  if (state.phase !== "question") {
    if (action.kind === "advance" && state.phase === "instructions") {
      return advanceTrivia(state, state.itemsPool);
    }
    return state;
  }
  const now = Date.now();
  if (action.kind === "trivia_answer") {
    if (state.answers[playerId] === undefined) {
      state.answers[playerId] = action.choiceIndex;
      state.answerTimes[playerId] = now;
    }
  } else if (action.kind === "year_slider") {
    if (state.answers[playerId] === undefined) {
      state.answers[playerId] = action.year;
      state.answerTimes[playerId] = now;
    }
  } else if (action.kind === "would_you_rather") {
    if (state.answers[playerId] === undefined) {
      state.answers[playerId] = action.choice;
      state.answerTimes[playerId] = now;
    }
  }
  if (Object.keys(state.answers).length >= ctx.playerIds.length) {
    return advanceTrivia(state, state.itemsPool, ctx.gameOptions);
  }
  return state;
}

export function onTriviaTick(state: TriviaState, items?: unknown[], gameOptions?: GameOptions): TriviaState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "question") {
    scoreTrivia(state, gameOptions);
  }
  return advanceTrivia(state, items ?? state.itemsPool);
}

export function triviaHostView(state: TriviaState, gameOptions?: GameOptions) {
  const voteA = Object.values(state.answers).filter((a) => a === "a" || a === 0).length;
  const voteB = Object.values(state.answers).filter((a) => a === "b" || a === 1).length;
  const total = Object.keys(state.answers).length;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const promptOnly = resolveQuestionDisplay(gameOptions ?? { contentRating: "family", difficulty: "mixed" }) === "tv_prompt_only";
  const inQuestion = state.phase === "question";
  const hideChoicesOnTv = promptOnly && inQuestion && state.mode === "quiz";
  const hideWyrOnTv = promptOnly && inQuestion && state.mode === "would-you-rather";

  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      question: state.question,
      choices: hideChoicesOnTv ? undefined : state.choices,
      hideChoicesOnTv,
      correctIndex: showReveal ? state.correctIndex : undefined,
      event: state.event,
      correctYear: showReveal ? state.correctYear : undefined,
      minYear: state.minYear,
      maxYear: state.maxYear,
      optionA: hideWyrOnTv ? undefined : state.optionA,
      optionB: hideWyrOnTv ? undefined : state.optionB,
      wyrPromptOnly: hideWyrOnTv,
      voteSplit: state.mode === "would-you-rather" && total > 0
        ? { a: Math.round((voteA / total) * 100), b: Math.round((voteB / total) * 100) }
        : undefined,
      answerCount: Object.keys(state.answers).length,
      roundScores: state.roundScores,
      results: state.results,
      playerAnswers: showReveal ? buildTriviaPlayerAnswers(state) : undefined,
    },
  };
}

export function triviaPlayerView(state: TriviaState, playerId: string) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const inQuestion = state.phase === "question";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      question: inQuestion && state.mode === "quiz" ? state.question : undefined,
      choices: inQuestion && state.mode === "quiz" ? state.choices : undefined,
      event: inQuestion && state.mode === "timeline" ? state.event : undefined,
      minYear: state.minYear,
      maxYear: state.maxYear,
      optionA: inQuestion ? state.optionA : undefined,
      optionB: inQuestion ? state.optionB : undefined,
      correctIndex: showReveal && state.mode === "quiz" ? state.correctIndex : undefined,
      correctYear: showReveal && state.mode === "timeline" ? state.correctYear : undefined,
      playerAnswers: showReveal ? buildTriviaPlayerAnswers(state) : undefined,
    },
    playerData: {
      answered: state.answers[playerId] !== undefined,
      myAnswer: state.answers[playerId],
    },
  };
}
