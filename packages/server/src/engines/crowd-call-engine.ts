import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";

export type CrowdPhase = "instructions" | "predict" | "answer" | "reveal" | "scoreboard" | "ended";

export interface CrowdQuestion {
  text: string;
  choices: string[];
}

export interface CrowdState {
  phase: CrowdPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  question: CrowdQuestion;
  predictions: Record<string, number>;
  answers: Record<string, number>;
  roundScores: Record<string, number>;
  usedIndices: number[];
  pool: CrowdQuestion[];
  playerIds: string[];
}

const PREDICT_MS = 25000;
const ANSWER_MS = 20000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

function pickQuestion(state: CrowdState): CrowdQuestion {
  const available = state.pool.map((_, i) => i).filter((i) => !state.usedIndices.includes(i));
  const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * state.pool.length);
  state.usedIndices.push(idx);
  return state.pool[idx];
}

export function createCrowdState(pool: CrowdQuestion[], playerIds: string[], maxRounds = 4): CrowdState {
  const question = pickRandom(pool);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    question,
    predictions: {},
    answers: {},
    roundScores: {},
    usedIndices: [pool.indexOf(question)],
    pool,
    playerIds,
  };
}

function majorityChoice(answers: Record<string, number>, choiceCount: number): number {
  const counts = Array(choiceCount).fill(0);
  for (const c of Object.values(answers)) {
    if (c >= 0 && c < choiceCount) counts[c]++;
  }
  let best = 0;
  for (let i = 1; i < counts.length; i++) {
    if (counts[i] > counts[best]) best = i;
  }
  return best;
}

function majorityChoiceExcluding(
  answers: Record<string, number>,
  excludePlayerId: string,
  choiceCount: number,
): { choice: number; tied: boolean } {
  const counts = Array(choiceCount).fill(0);
  for (const [pid, c] of Object.entries(answers)) {
    if (pid === excludePlayerId) continue;
    if (c >= 0 && c < choiceCount) counts[c]++;
  }
  const max = Math.max(...counts, 0);
  if (max === 0) return { choice: 0, tied: false };
  const leaders = counts.map((count, i) => (count === max ? i : -1)).filter((i) => i >= 0);
  if (leaders.length > 1) return { choice: leaders[0], tied: true };
  return { choice: leaders[0], tied: false };
}

function scoreCrowd(state: CrowdState, playerIds: string[]): void {
  const majority = majorityChoice(state.answers, state.question.choices.length);
  const hasAnswers = Object.keys(state.answers).length > 0;
  state.roundScores = {};
  for (const pid of playerIds) {
    let pts = 0;
    if (state.answers[pid] !== undefined) pts += 200;
    if (hasAnswers && state.predictions[pid] !== undefined) {
      const crowd = majorityChoiceExcluding(state.answers, pid, state.question.choices.length);
      const otherAnswerCount = Object.keys(state.answers).filter((id) => id !== pid).length;
      if (otherAnswerCount > 0) {
        if (crowd.tied) {
          const counts = Array(state.question.choices.length).fill(0);
          for (const [id, c] of Object.entries(state.answers)) {
            if (id === pid) continue;
            if (c >= 0 && c < counts.length) counts[c]++;
          }
          const max = Math.max(...counts);
          const tiedChoices = counts.map((count, i) => (count === max ? i : -1)).filter((i) => i >= 0);
          if (tiedChoices.includes(state.predictions[pid])) pts += 500;
        } else if (state.predictions[pid] === crowd.choice) {
          pts += 1000;
        }
      }
    }
    if (pts > 0) state.roundScores[pid] = pts;
  }
}

function expectedCrowdCount(state: CrowdState, phase: CrowdPhase): number {
  return state.playerIds.length;
}

function crowdReadyToAdvance(state: CrowdState, phase: CrowdPhase): boolean {
  if (phase === "predict") return Object.keys(state.predictions).length >= expectedCrowdCount(state, phase);
  if (phase === "answer") return Object.keys(state.answers).length >= expectedCrowdCount(state, phase);
  return false;
}

export function advanceCrowd(state: CrowdState, playerIds: string[]): CrowdState {
  if (state.phase === "instructions") {
    state.phase = "predict";
    state.timerTotalMs = PREDICT_MS;
    state.timerEndsAt = Date.now() + PREDICT_MS;
    state.predictions = {};
    state.answers = {};
    return state;
  }
  if (state.phase === "predict") {
    state.phase = "answer";
    state.timerTotalMs = ANSWER_MS;
    state.timerEndsAt = Date.now() + ANSWER_MS;
    return state;
  }
  if (state.phase === "answer") {
    scoreCrowd(state, playerIds);
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
    state.question = pickQuestion(state);
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onCrowdAction(state: CrowdState, playerId: string, action: GameAction, ctx: RoomContext): CrowdState {
  if (action.kind === "crowd_predict" && state.phase === "predict") {
    if (state.predictions[playerId] === undefined) {
      state.predictions[playerId] = action.choiceIndex;
    }
    if (crowdReadyToAdvance(state, "predict")) {
      return advanceCrowd(state, ctx.playerIds);
    }
  }
  if (action.kind === "crowd_answer" && state.phase === "answer") {
    if (state.answers[playerId] === undefined) {
      state.answers[playerId] = action.choiceIndex;
    }
    if (crowdReadyToAdvance(state, "answer")) {
      return advanceCrowd(state, ctx.playerIds);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceCrowd(state, ctx.playerIds);
  }
  return state;
}

export function onCrowdTick(state: CrowdState): CrowdState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceCrowd(state, state.playerIds);
}

export function crowdHostView(state: CrowdState) {
  const majority =
    state.phase === "reveal" || state.phase === "scoreboard"
      ? majorityChoice(state.answers, state.question.choices.length)
      : undefined;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      question: state.question,
      majority,
      predictions: state.phase === "reveal" ? state.predictions : undefined,
      answers: state.phase === "reveal" || state.phase === "scoreboard" ? state.answers : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function crowdPlayerView(state: CrowdState, playerId: string) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const crowd =
    showReveal && state.answers[playerId] !== undefined
      ? majorityChoiceExcluding(state.answers, playerId, state.question.choices.length)
      : undefined;
  const predictedCorrect =
    showReveal &&
    state.predictions[playerId] !== undefined &&
    crowd &&
    !crowd.tied &&
    state.predictions[playerId] === crowd.choice;
  const predictedTieBonus =
    showReveal &&
    state.predictions[playerId] !== undefined &&
    crowd?.tied &&
    (() => {
      const counts = Array(state.question.choices.length).fill(0);
      for (const [id, c] of Object.entries(state.answers)) {
        if (id === playerId) continue;
        if (c >= 0 && c < counts.length) counts[c]++;
      }
      const max = Math.max(...counts);
      const tiedChoices = counts.map((count, i) => (count === max ? i : -1)).filter((i) => i >= 0);
      return tiedChoices.includes(state.predictions[playerId]!);
    })();
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: { question: state.question },
    playerData: {
      predicted: state.predictions[playerId] !== undefined,
      answered: state.answers[playerId] !== undefined,
      myPrediction: state.predictions[playerId],
      myAnswer: state.answers[playerId],
      predictedCorrect,
      predictedTieBonus,
      roundPoints: showReveal ? state.roundScores[playerId] : undefined,
    },
  };
}
