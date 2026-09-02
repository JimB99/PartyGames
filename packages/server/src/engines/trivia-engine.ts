import {
  DEFAULT_GAME_OPTIONS,
  TIMER_PRESETS,
  beginTimedPhase,
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
  timerTotalMs: number | null;
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
  cumulativeScores: Record<string, number>;
  lastRoundScores: Record<string, number>;
  usedIndices: number[];
  results?: Record<string, number>;
  itemsPool: unknown[];
  gameOptions?: GameOptions;
  playerCount: number;
  discussUntil?: number | null;
}

const QUESTION_MS = TIMER_PRESETS.quick.answer;
const WYR_QUESTION_MS = TIMER_PRESETS.standard.answer;
const DISCUSS_MS = TIMER_PRESETS.standard.vote / 2;
const REVEAL_MS = TIMER_PRESETS.quick.reveal;
const SCOREBOARD_MS = TIMER_PRESETS.standard.roundBreak;

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
    timerEndsAt: Date.now() + TIMER_PRESETS.standard.instruction,
    timerTotalMs: TIMER_PRESETS.standard.instruction,
    phaseStartedAt: null,
    mode,
    answers: {},
    answerTimes: {},
    rankPlaces: {},
    roundScores: {},
    cumulativeScores: {},
    lastRoundScores: {},
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

function beginQuestion(state: TriviaState): void {
  const now = Date.now();
  const duration = state.mode === "would-you-rather" ? WYR_QUESTION_MS : QUESTION_MS;
  Object.assign(state, beginTimedPhase(state, "question", now, duration));
  state.phaseStartedAt = now;
  state.discussUntil = state.mode === "would-you-rather" ? now + DISCUSS_MS : null;
  state.answers = {};
  state.answerTimes = {};
  state.rankPlaces = {};
}

export function advanceTrivia(state: TriviaState, items: unknown[], gameOptions?: GameOptions): TriviaState {
  if (state.phase === "instructions") {
    beginQuestion(state);
    return state;
  }
  if (state.phase === "question") {
    scoreTrivia(state, gameOptions);
    state.phase = "reveal";
    state.timerTotalMs = REVEAL_MS;
    state.timerEndsAt = Date.now() + REVEAL_MS;
    state.phaseStartedAt = null;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerTotalMs = SCOREBOARD_MS;
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
    beginQuestion(state);
    return state;
  }
  return state;
}

function allPlayersAnswered(state: TriviaState, playerIds: string[]): boolean {
  if (playerIds.length === 0) return false;
  return playerIds.every((id) => state.answers[id] !== undefined);
}

function pruneStaleAnswers(state: TriviaState, playerIds: string[]): void {
  const active = new Set(playerIds);
  for (const id of Object.keys(state.answers)) {
    if (!active.has(id)) delete state.answers[id];
  }
  for (const id of Object.keys(state.answerTimes)) {
    if (!active.has(id)) delete state.answerTimes[id];
  }
}

function scoreTrivia(state: TriviaState, gameOptions?: GameOptions) {
  const roundDelta: Record<string, number> = {};
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
        roundDelta[playerId] = pts;
        state.results![playerId] = pts;
        if (ranked[playerId]) state.rankPlaces[playerId] = ranked[playerId].rankPlace;
      }
    } else {
      for (const [playerId, answer] of Object.entries(state.answers)) {
        if (typeof answer === "number") {
          const pts = answer === state.correctIndex ? 1000 : 0;
          roundDelta[playerId] = pts;
          state.results![playerId] = pts;
        }
      }
    }
    state.roundScores = roundDelta;
    state.lastRoundScores = { ...roundDelta };
    for (const [playerId, pts] of Object.entries(roundDelta)) {
      state.cumulativeScores[playerId] = (state.cumulativeScores[playerId] ?? 0) + pts;
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
        roundDelta[playerId] = accuracy;
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
        roundDelta[playerId] = score.points;
        state.results![playerId] = score.points;
        state.rankPlaces[playerId] = score.rankPlace;
      }
    }
    state.roundScores = roundDelta;
    state.lastRoundScores = { ...roundDelta };
    for (const [playerId, pts] of Object.entries(roundDelta)) {
      state.cumulativeScores[playerId] = (state.cumulativeScores[playerId] ?? 0) + pts;
    }
    return;
  }

  if (state.mode === "would-you-rather") {
    const PARTICIPATION = 200;
    const TIE_BONUS = 400;
    const MAJORITY_BONUS = 800;

    for (const [playerId, answer] of Object.entries(state.answers)) {
      let othersA = 0;
      let othersB = 0;
      for (const [otherId, otherAnswer] of Object.entries(state.answers)) {
        if (otherId === playerId) continue;
        if (otherAnswer === "a" || otherAnswer === 0) othersA++;
        if (otherAnswer === "b" || otherAnswer === 1) othersB++;
      }
      const othersTied = othersA === othersB;
      const othersMajorityA = othersA > othersB;
      const pickedA = answer === "a" || answer === 0;
      const pickedB = answer === "b" || answer === 1;

      let pts = PARTICIPATION;
      if (othersTied) {
        pts += TIE_BONUS;
      } else if ((othersMajorityA && pickedA) || (!othersMajorityA && pickedB)) {
        pts += MAJORITY_BONUS;
      }
      roundDelta[playerId] = pts;
      state.results![playerId] = pts;
    }
    state.roundScores = roundDelta;
    state.lastRoundScores = { ...roundDelta };
    for (const [playerId, pts] of Object.entries(roundDelta)) {
      state.cumulativeScores[playerId] = (state.cumulativeScores[playerId] ?? 0) + pts;
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
  state.playerCount = ctx.playerIds.length;
  pruneStaleAnswers(state, ctx.playerIds);
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
  if (allPlayersAnswered(state, ctx.playerIds)) {
    return advanceTrivia(state, state.itemsPool, ctx.gameOptions);
  }
  return state;
}

export function onTriviaTick(state: TriviaState, items?: unknown[], gameOptions?: GameOptions): TriviaState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "question") {
    scoreTrivia(state, gameOptions);
  }
  return advanceTrivia(state, items ?? state.itemsPool, gameOptions);
}

export function triviaHostView(state: TriviaState, gameOptions?: GameOptions) {
  const voteA = Object.values(state.answers).filter((a) => a === "a" || a === 0).length;
  const voteB = Object.values(state.answers).filter((a) => a === "b" || a === 1).length;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const promptOnly = resolveQuestionDisplay(gameOptions ?? { contentRating: "family", difficulty: "mixed" }) === "tv_prompt_only";
  const inQuestion = state.phase === "question";
  const hideChoicesOnTv = promptOnly && inQuestion && state.mode === "quiz";
  const discussing = Boolean(state.discussUntil && Date.now() < state.discussUntil);
  const hideWyrOnTv = promptOnly && inQuestion && state.mode === "would-you-rather" && !discussing;
  const voteTotal = Object.keys(state.answers).length;

  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs ?? null,
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
      wyrDilemma:
        state.mode === "would-you-rather" && state.optionA && state.optionB
          ? `${state.optionA} — or — ${state.optionB}`
          : undefined,
      voteSplit:
        state.mode === "would-you-rather" && showReveal
          ? {
              a: voteTotal > 0 ? Math.round((voteA / voteTotal) * 100) : 0,
              b: voteTotal > 0 ? Math.round((voteB / voteTotal) * 100) : 0,
            }
          : state.mode === "would-you-rather" && voteTotal > 0
            ? { a: Math.round((voteA / voteTotal) * 100), b: Math.round((voteB / voteTotal) * 100) }
            : undefined,
      answerCount: voteTotal,
      playerCount: state.playerCount,
      discussing,
      roundScores: state.roundScores,
      cumulativeScores: state.cumulativeScores,
      lastRoundScores: state.lastRoundScores,
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
    timerTotalMs: state.timerTotalMs ?? null,
    data: {
      mode: state.mode,
      question: inQuestion && state.mode === "quiz" ? state.question : undefined,
      choices:
        state.mode === "quiz"
          ? inQuestion || showReveal
            ? state.choices
            : undefined
          : undefined,
      event: inQuestion && state.mode === "timeline" ? state.event : undefined,
      minYear: state.minYear,
      maxYear: state.maxYear,
      optionA: inQuestion || showReveal ? state.optionA : undefined,
      optionB: inQuestion || showReveal ? state.optionB : undefined,
      correctIndex: showReveal && state.mode === "quiz" ? state.correctIndex : undefined,
      correctYear: showReveal && state.mode === "timeline" ? state.correctYear : undefined,
      wyrDilemma:
        state.mode === "would-you-rather" && state.optionA && state.optionB
          ? `${state.optionA} — or — ${state.optionB}`
          : undefined,
      playerAnswers: showReveal ? buildTriviaPlayerAnswers(state) : undefined,
    },
    playerData: {
      answered: state.answers[playerId] !== undefined,
      myAnswer: state.answers[playerId],
      discussing: Boolean(state.discussUntil && Date.now() < state.discussUntil),
    },
  };
}
