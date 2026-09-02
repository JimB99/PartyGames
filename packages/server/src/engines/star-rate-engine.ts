import { pickRandom, shuffle, uniqueId, type GameAction, type RoomContext } from "@party-games/shared";

export type StarRatePhase = "instructions" | "submit" | "rate" | "reveal" | "scoreboard" | "ended";

export interface StarSubmission {
  id: string;
  playerId: string;
  text: string;
}

export interface StarRateState {
  phase: StarRatePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  prompt: string;
  submissions: StarSubmission[];
  ratings: Record<string, Record<string, number>>;
  roundScores: Record<string, number>;
  usedPrompts: number[];
  promptsPool: string[];
  playerIds: string[];
}

const SUBMIT_MS = 45000;
const RATE_MS = 30000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

export function createStarRateState(prompts: string[], playerIds: string[], maxRounds = 4): StarRateState {
  const idx = Math.floor(Math.random() * prompts.length);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    prompt: prompts[idx],
    submissions: [],
    ratings: {},
    roundScores: {},
    usedPrompts: [idx],
    promptsPool: prompts,
    playerIds,
  };
}

function scoreStarRate(state: StarRateState, playerIds: string[]): void {
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const sub of state.submissions) {
    totals[sub.id] = { sum: 0, count: 0 };
  }
  for (const rates of Object.values(state.ratings)) {
    for (const [subId, stars] of Object.entries(rates)) {
      if (totals[subId]) {
        totals[subId].sum += stars;
        totals[subId].count++;
      }
    }
  }
  state.roundScores = {};
  let bestAvg = 0;
  let winnerId: string | null = null;
  for (const sub of state.submissions) {
    const t = totals[sub.id];
    const avg = t.count > 0 ? t.sum / t.count : 0;
    if (avg > bestAvg) {
      bestAvg = avg;
      winnerId = sub.playerId;
    }
  }
  for (const pid of playerIds) {
    if (state.submissions.some((s) => s.playerId === pid)) {
      state.roundScores[pid] = 400;
    }
  }
  if (winnerId && bestAvg > 0) {
    state.roundScores[winnerId] = (state.roundScores[winnerId] ?? 0) + Math.round(bestAvg * 220);
  }
}

export function advanceStarRate(state: StarRateState, prompts: string[]): StarRateState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    state.timerEndsAt = Date.now() + SUBMIT_MS;
    state.timerTotalMs = SUBMIT_MS;
    state.submissions = [];
    state.ratings = {};
    return state;
  }
  if (state.phase === "submit") {
    if (state.submissions.length === 0) {
      state.phase = "scoreboard";
      state.timerEndsAt = Date.now() + SCOREBOARD_MS;
      state.timerTotalMs = SCOREBOARD_MS;
      return state;
    }
    state.phase = "rate";
    state.timerEndsAt = Date.now() + RATE_MS;
    state.timerTotalMs = RATE_MS;
    return state;
  }
  if (state.phase === "rate") {
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + REVEAL_MS;
    state.timerTotalMs = REVEAL_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    state.timerTotalMs = SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      state.timerTotalMs = null;
      return state;
    }
    state.round += 1;
    const available = prompts.map((_, i) => i).filter((i) => !state.usedPrompts.includes(i));
    const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * prompts.length);
    state.usedPrompts.push(idx);
    state.prompt = prompts[idx];
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    state.timerTotalMs = 5000;
    return state;
  }
  return state;
}

export function onStarRateAction(
  state: StarRateState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): StarRateState {
  if (action.kind === "submit_text" && state.phase === "submit") {
    if (!state.submissions.some((s) => s.playerId === playerId)) {
      state.submissions.push({ id: uniqueId(), playerId, text: action.text.slice(0, 120) });
    }
    if (state.submissions.length >= ctx.playerIds.length) {
      scoreStarRate(state, ctx.playerIds);
      return advanceStarRate(state, state.promptsPool);
    }
  }
  if (action.kind === "star_rate" && state.phase === "rate") {
    const sub = state.submissions.find((s) => s.id === action.submissionId);
    if (!sub || sub.playerId === playerId) return state;
    if (!state.ratings[playerId]) state.ratings[playerId] = {};
    state.ratings[playerId][action.submissionId] = Math.max(1, Math.min(5, action.stars));
    const allRated = ctx.playerIds.every((pid) => {
      const toRate = state.submissions.filter((s) => s.playerId !== pid);
      if (toRate.length === 0) return true;
      return Object.keys(state.ratings[pid] ?? {}).length >= toRate.length;
    });
    if (allRated) {
      scoreStarRate(state, ctx.playerIds);
      return advanceStarRate(state, state.promptsPool);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceStarRate(state, state.promptsPool);
  }
  return state;
}

export function onStarRateTick(state: StarRateState): StarRateState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "rate") {
    scoreStarRate(state, state.playerIds);
  }
  return advanceStarRate(state, state.promptsPool);
}

export function starRateHostView(state: StarRateState) {
  const showSubs = state.phase === "rate" || state.phase === "reveal" || state.phase === "scoreboard";
  const totals: Record<string, { sum: number; count: number; histogram: [number, number, number, number, number] }> = {};
  for (const sub of state.submissions) {
    totals[sub.id] = { sum: 0, count: 0, histogram: [0, 0, 0, 0, 0] };
  }
  for (const rates of Object.values(state.ratings)) {
    for (const [subId, stars] of Object.entries(rates)) {
      const bucket = totals[subId];
      if (!bucket) continue;
      const s = Math.max(1, Math.min(5, stars));
      bucket.sum += s;
      bucket.count++;
      bucket.histogram[s - 1]++;
    }
  }
  const submissions = showSubs
    ? shuffle(state.submissions).map((s) => {
        const t = totals[s.id];
        return {
          id: s.id,
          text: s.text,
          average: t && t.count > 0 ? Math.round((t.sum / t.count) * 10) / 10 : undefined,
          histogram: t?.histogram,
        };
      })
    : undefined;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      prompt: state.prompt,
      submissions,
      submitCount: state.phase === "submit" ? state.submissions.length : undefined,
      playerCount: state.playerIds.length,
      roundScores: state.phase === "scoreboard" || state.phase === "ended" ? state.roundScores : undefined,
    },
  };
}

export function starRatePlayerView(state: StarRateState, playerId: string) {
  const mySub = state.submissions.find((s) => s.playerId === playerId);
  const toRate = state.submissions.filter((s) => s.playerId !== playerId);
  const myRatings = state.ratings[playerId] ?? {};
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      prompt: state.phase !== "instructions" ? state.prompt : undefined,
    },
    playerData: {
      submitted: mySub !== undefined,
      mySubmission: mySub?.text,
      toRate:
        state.phase === "rate" && toRate.length > 0
          ? toRate.map((s) => ({ id: s.id, text: s.text }))
          : undefined,
      myRatings,
      ratedCount: Object.keys(myRatings).length,
      noAnswers: state.phase === "rate" && toRate.length === 0,
    },
  };
}
