import {
  buildBluffReveal,
  pickRandom,
  shuffle,
  uniqueId,
  type GameAction,
  type RoomContext,
} from "@party-games/shared";

export type BluffPhase = "instructions" | "submit" | "vote" | "reveal" | "scoreboard" | "ended";

export interface BluffOption {
  id: string;
  text: string;
  authorId: string | null;
  isTruth: boolean;
}

export interface BluffState {
  phase: BluffPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  mode: "fibbage" | "reverse";
  displayText: string;
  truthText: string;
  truthId: string;
  submissions: Record<string, string>;
  options: BluffOption[];
  votes: Record<string, string>;
  roundScores: Record<string, number>;
  usedPrompts: number[];
}

const SUBMIT_MS = 45000;
const VOTE_MS = 30000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

export function createBluffState(
  mode: "fibbage" | "reverse",
  prompts: Array<{ prompt?: string; truth: string; fact?: string }>,
  maxRounds = 5,
): BluffState {
  const idx = Math.floor(Math.random() * prompts.length);
  const item = prompts[idx];
  const displayText = mode === "reverse" ? item.fact ?? item.truth : item.prompt ?? "";
  const truthText = item.truth;
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    mode,
    displayText,
    truthText,
    truthId: uniqueId(),
    submissions: {},
    options: [],
    votes: {},
    roundScores: {},
    usedPrompts: [idx],
  };
}

function nextPrompt(state: BluffState, prompts: Array<{ prompt?: string; truth: string; fact?: string }>) {
  const available = prompts.map((_, i) => i).filter((i) => !state.usedPrompts.includes(i));
  const pool = available.length > 0 ? available : prompts.map((_, i) => i);
  const idx = pickRandom(pool);
  state.usedPrompts.push(idx);
  const item = prompts[idx];
  state.displayText = state.mode === "reverse" ? item.fact ?? item.truth : item.prompt ?? "";
  state.truthText = item.truth;
  state.truthId = uniqueId();
}

export function advanceBluff(state: BluffState): BluffState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    state.timerEndsAt = Date.now() + SUBMIT_MS;
    state.submissions = {};
    state.votes = {};
    state.options = [];
    return state;
  }
  if (state.phase === "submit") {
    buildOptions(state);
    state.phase = "vote";
    state.timerEndsAt = Date.now() + VOTE_MS;
    return state;
  }
  if (state.phase === "vote") {
    scoreBluff(state);
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
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

function buildOptions(state: BluffState) {
  const options: BluffOption[] = [
    { id: state.truthId, text: state.truthText, authorId: null, isTruth: true },
  ];
  for (const [playerId, text] of Object.entries(state.submissions)) {
    if (text.trim()) {
      options.push({ id: uniqueId(), text: text.trim(), authorId: playerId, isTruth: false });
    }
  }
  state.options = shuffle(options);
}

function scoreBluff(state: BluffState) {
  state.roundScores = {};
  for (const [voterId, optionId] of Object.entries(state.votes)) {
    const option = state.options.find((o) => o.id === optionId);
    if (!option) continue;
    if (option.isTruth) {
      state.roundScores[voterId] = (state.roundScores[voterId] ?? 0) + 1000;
    } else if (option.authorId) {
      state.roundScores[option.authorId] = (state.roundScores[option.authorId] ?? 0) + 500;
    }
  }
}

export function onBluffAction(
  state: BluffState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): BluffState {
  if (action.kind === "submit_text" && state.phase === "submit") {
    state.submissions[playerId] = action.text.slice(0, 120);
    if (Object.keys(state.submissions).length >= ctx.playerIds.length) {
      return advanceBluff(state);
    }
  }
  if (action.kind === "vote" && state.phase === "vote") {
    state.votes[playerId] = action.optionId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advanceBluff(state);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceBluff(state);
  }
  return state;
}

export function onBluffTick(state: BluffState, prompts: Array<{ prompt?: string; truth: string; fact?: string }>): BluffState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "scoreboard" && state.round < state.maxRounds) {
    nextPrompt(state, prompts);
  }
  return advanceBluff(state);
}

export function bluffHostView(state: BluffState) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      displayText: state.displayText,
      options: state.phase === "vote" || showReveal
        ? state.options.map((o) => ({ id: o.id, text: o.text, isTruth: state.phase !== "vote" ? o.isTruth : undefined }))
        : undefined,
      reveal: showReveal ? buildBluffReveal(state.options, state.votes) : undefined,
      roundScores: state.roundScores,
      voteCount: Object.keys(state.votes).length,
      playerCount: Object.keys(state.submissions).length,
    },
  };
}

export function bluffPlayerView(state: BluffState, playerId: string) {
  const submitted = state.submissions[playerId] !== undefined;
  const voted = state.votes[playerId] !== undefined;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      displayText: state.phase !== "instructions" ? state.displayText : undefined,
      options: state.phase === "vote"
        ? state.options.map((o) => ({ id: o.id, text: o.text }))
        : undefined,
      reveal: showReveal ? buildBluffReveal(state.options, state.votes) : undefined,
    },
    playerData: {
      submitted,
      voted,
      mySubmission: state.submissions[playerId],
      myVote: state.votes[playerId],
    },
  };
}
