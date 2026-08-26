import { pickRandom, type GameAction, type RoomContext, type PlayerAnswerReveal } from "@party-games/shared";

export type TriviaMode = "quiz" | "timeline" | "would-you-rather";

export type TriviaPhase = "instructions" | "question" | "reveal" | "scoreboard" | "ended";

export interface TriviaState {
  phase: TriviaPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
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
  roundScores: Record<string, number>;
  usedIndices: number[];
  results?: Record<string, number>;
}

const QUESTION_MS = 25000;
const REVEAL_MS = 6000;
const SCOREBOARD_MS = 4000;

function buildTriviaPlayerAnswers(state: TriviaState): PlayerAnswerReveal[] {
  return Object.entries(state.answers).map(([playerId, answer]) => {
    if (state.mode === "quiz" && typeof answer === "number") {
      return {
        playerId,
        answer,
        detail: state.choices?.[answer],
        correct: answer === state.correctIndex,
        points: state.results?.[playerId],
      };
    }
    if (state.mode === "timeline" && typeof answer === "number") {
      return {
        playerId,
        answer,
        detail: `Year ${answer}`,
        points: state.results?.[playerId],
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
): TriviaState {
  const state: TriviaState = {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    mode,
    answers: {},
    roundScores: {},
    usedIndices: [],
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

export function advanceTrivia(state: TriviaState, items: unknown[]): TriviaState {
  if (state.phase === "instructions") {
    state.phase = "question";
    state.timerEndsAt = Date.now() + QUESTION_MS;
    state.answers = {};
    return state;
  }
  if (state.phase === "question") {
    scoreTrivia(state);
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + REVEAL_MS;
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

function scoreTrivia(state: TriviaState) {
  state.roundScores = {};
  state.results = {};
  for (const [playerId, answer] of Object.entries(state.answers)) {
    if (state.mode === "quiz" && typeof answer === "number") {
      const pts = answer === state.correctIndex ? 1000 : 0;
      state.roundScores[playerId] = pts;
      state.results![playerId] = pts;
    } else if (state.mode === "timeline" && typeof answer === "number") {
      const diff = Math.abs(answer - state.correctYear!);
      const pts = Math.max(0, 1000 - diff * 20);
      state.roundScores[playerId] = pts;
      state.results![playerId] = pts;
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
      return advanceTrivia(state, []);
    }
    return state;
  }
  if (action.kind === "trivia_answer") {
    state.answers[playerId] = action.choiceIndex;
  } else if (action.kind === "year_slider") {
    state.answers[playerId] = action.year;
  } else if (action.kind === "would_you_rather") {
    state.answers[playerId] = action.choice;
  }
  if (Object.keys(state.answers).length >= ctx.playerIds.length) {
    return advanceTrivia(state, []);
  }
  return state;
}

export function onTriviaTick(state: TriviaState, items: unknown[]): TriviaState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceTrivia(state, items);
}

export function triviaHostView(state: TriviaState) {
  const voteA = Object.values(state.answers).filter((a) => a === "a" || a === 0).length;
  const voteB = Object.values(state.answers).filter((a) => a === "b" || a === 1).length;
  const total = Object.keys(state.answers).length;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const hideQuizChoicesOnTv = state.mode === "quiz" && state.phase === "question";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      question: state.question,
      choices: hideQuizChoicesOnTv ? undefined : state.choices,
      correctIndex: showReveal ? state.correctIndex : undefined,
      event: state.event,
      correctYear: showReveal ? state.correctYear : undefined,
      minYear: state.minYear,
      maxYear: state.maxYear,
      optionA: state.optionA,
      optionB: state.optionB,
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
      optionA: state.optionA,
      optionB: state.optionB,
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
