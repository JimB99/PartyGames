import {
  buildBluffReveal,
  isObviousBluffTruth,
  isSpeedScoringEnabled,
  pickRandom,
  scoreByAnswerRank,
  shuffle,
  uniqueId,
  type GameAction,
  type GameOptions,
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
  timerTotalMs: number | null;
  mode: "fact-check" | "reverse-fact";
  displayText: string;
  truthText: string;
  truthId: string;
  submissions: Record<string, string>;
  options: BluffOption[];
  votes: Record<string, string>;
  voteTimes: Record<string, number>;
  votePhaseStartedAt: number | null;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  usedPrompts: number[];
  promptsPool: Array<{ prompt?: string; truth: string; fact?: string }>;
  gameOptions?: GameOptions;
  playerCount: number;
}

const SUBMIT_MS = 45000;
const VOTE_MS = 30000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;
const INSTRUCTIONS_MS = 5000;

function phaseTimer(ms: number) {
  const now = Date.now();
  return { timerEndsAt: now + ms, timerTotalMs: ms };
}

export function createBluffState(
  mode: "fact-check" | "reverse-fact",
  prompts: Array<{ prompt?: string; truth: string; fact?: string }>,
  maxRounds = 5,
  playerCount = 2,
): BluffState {
  const idx = Math.floor(Math.random() * prompts.length);
  const item = prompts[idx];
  const displayText = mode === "reverse-fact" ? item.fact ?? item.truth : item.prompt ?? "";
  const truthText = item.truth;
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + INSTRUCTIONS_MS,
    timerTotalMs: INSTRUCTIONS_MS,
    mode,
    displayText,
    truthText,
    truthId: uniqueId(),
    submissions: {},
    options: [],
    votes: {},
    voteTimes: {},
    votePhaseStartedAt: null,
    roundScores: {},
    cumulativeScores: {},
    usedPrompts: [idx],
    promptsPool: prompts,
    playerCount,
  };
}

function nextPrompt(state: BluffState, prompts: Array<{ prompt?: string; truth: string; fact?: string }>) {
  const available = prompts.map((_, i) => i).filter((i) => !state.usedPrompts.includes(i));
  const pool = available.length > 0 ? available : prompts.map((_, i) => i);
  const idx = pickRandom(pool);
  state.usedPrompts.push(idx);
  const item = prompts[idx];
  state.displayText = state.mode === "reverse-fact" ? item.fact ?? item.truth : item.prompt ?? "";
  state.truthText = item.truth;
  state.truthId = uniqueId();
}

export function advanceBluff(state: BluffState, gameOptions?: GameOptions): BluffState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    Object.assign(state, phaseTimer(SUBMIT_MS));
    state.submissions = {};
    state.votes = {};
    state.options = [];
    return state;
  }
  if (state.phase === "submit") {
    buildOptions(state);
    state.phase = "vote";
    state.votePhaseStartedAt = Date.now();
    Object.assign(state, phaseTimer(VOTE_MS));
    state.voteTimes = {};
    return state;
  }
  if (state.phase === "vote") {
    scoreBluff(state, gameOptions);
    state.phase = "reveal";
    Object.assign(state, phaseTimer(REVEAL_MS));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    Object.assign(state, phaseTimer(SCOREBOARD_MS));
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
    state.phase = "submit";
    Object.assign(state, phaseTimer(SUBMIT_MS));
    state.submissions = {};
    state.votes = {};
    state.options = [];
    return state;
  }
  return state;
}

function buildOptions(state: BluffState) {
  const options: BluffOption[] = [
    { id: state.truthId, text: state.truthText.trim(), authorId: null, isTruth: true },
  ];
  for (const [playerId, text] of Object.entries(state.submissions)) {
    if (text.trim()) {
      options.push({ id: uniqueId(), text: text.trim(), authorId: playerId, isTruth: false });
    }
  }

  const minOptions = Math.min(6, Math.max(4, state.playerCount + 1));
  if (options.length < minOptions) {
    const decoyCandidates = state.promptsPool
      .map((p) => p.truth.trim())
      .filter((t) => t && t !== state.truthText.trim() && t.length >= 4 && t.length <= 120);
    const decoys: string[] = [];
    for (const text of shuffle([...new Set(decoyCandidates)])) {
      if (decoys.length >= minOptions - options.length) break;
      const trial = [...decoys, text];
      if (!isObviousBluffTruth(state.truthText.trim(), trial)) {
        decoys.push(text);
      }
    }
    for (const text of decoys) {
      options.push({ id: uniqueId(), text, authorId: "house", isTruth: false });
    }
  }

  state.options = shuffle(options);
}

function scoreBluff(state: BluffState, gameOptions?: GameOptions) {
  const roundDelta: Record<string, number> = {};
  const speedOn = gameOptions ? isSpeedScoringEnabled(gameOptions) : false;
  const totalPlayers = Math.max(1, state.playerCount);

  const truthVoters: Array<{ playerId: string; answeredAt: number }> = [];
  for (const [voterId, optionId] of Object.entries(state.votes)) {
    const option = state.options.find((o) => o.id === optionId);
    if (!option) continue;
    if (option.authorId === voterId) continue;
    if (option.isTruth) {
      if (speedOn && state.voteTimes[voterId] !== undefined) {
        truthVoters.push({ playerId: voterId, answeredAt: state.voteTimes[voterId] });
      } else if (!speedOn) {
        roundDelta[voterId] = (roundDelta[voterId] ?? 0) + 1000;
      }
    } else if (option.authorId && option.authorId !== "house") {
      roundDelta[option.authorId] = (roundDelta[option.authorId] ?? 0) + 500;
    }
  }

  if (speedOn && truthVoters.length > 0) {
    const ranked = scoreByAnswerRank(truthVoters, totalPlayers, 1);
    for (const [voterId, score] of Object.entries(ranked)) {
      roundDelta[voterId] = (roundDelta[voterId] ?? 0) + score.points;
    }
  }

  state.roundScores = roundDelta;
  for (const [playerId, pts] of Object.entries(roundDelta)) {
    state.cumulativeScores[playerId] = (state.cumulativeScores[playerId] ?? 0) + pts;
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
      return advanceBluff(state, ctx.gameOptions);
    }
  }
  if (action.kind === "vote" && state.phase === "vote") {
    if (state.votes[playerId] === undefined) {
      const option = state.options.find((o) => o.id === action.optionId);
      if (option?.authorId === playerId) return state;
      state.votes[playerId] = action.optionId;
      state.voteTimes[playerId] = Date.now();
    }
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      scoreBluff(state, ctx.gameOptions);
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
      state.votePhaseStartedAt = null;
      return state;
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceBluff(state, ctx.gameOptions);
  }
  return state;
}

export function onBluffTick(state: BluffState, prompts?: Array<{ prompt?: string; truth: string; fact?: string }>, gameOptions?: GameOptions): BluffState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  const pool = prompts ?? state.promptsPool;
  if (state.phase === "scoreboard" && state.round < state.maxRounds) {
    nextPrompt(state, pool);
  }
  return advanceBluff(state, gameOptions);
}

export function bluffHostView(state: BluffState) {
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs ?? null,
    data: {
      mode: state.mode,
      displayText: state.displayText,
      options: state.phase === "vote" || showReveal
        ? state.options.map((o) => ({ id: o.id, text: o.text, isTruth: state.phase !== "vote" ? o.isTruth : undefined }))
        : undefined,
      reveal: showReveal ? buildBluffReveal(state.options, state.votes) : undefined,
      roundScores: state.roundScores,
      cumulativeScores: state.cumulativeScores,
      submitCount: state.phase === "submit" ? Object.keys(state.submissions).length : undefined,
      voteCount: state.phase === "vote" ? Object.keys(state.votes).length : undefined,
      playerCount: state.playerCount,
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
    timerTotalMs: state.timerTotalMs ?? null,
    data: {
      mode: state.mode,
      displayText: state.phase !== "instructions" ? state.displayText : undefined,
      options: state.phase === "vote"
        ? state.options.map((o) => ({ id: o.id, text: o.text, authorId: o.authorId }))
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
