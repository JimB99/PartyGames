import { pickRandom, shuffle, uniqueId, votersByOption, personalizeHotSeatPrompt, type GameAction, type RoomContext, type RevealEntry } from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type PromptVoteMode = "bracket" | "hot-seat" | "vote-all";

export type PromptVotePhase =
  | "instructions"
  | "submit"
  | "matchup"
  | "vote"
  | "reveal"
  | "scoreboard"
  | "pick"
  | "ended";

export interface Submission {
  id: string;
  playerId: string;
  text: string;
}

export type BracketRound =
  | { kind: "pair"; a: string; b: string }
  | { kind: "triple"; a: string; b: string; c: string };

export interface PromptVoteState {
  gameOptions?: import("@party-games/shared").GameOptions;
  phase: PromptVotePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  mode: PromptVoteMode;
  prompt: string;
  targetPlayerId?: string;
  submissions: Submission[];
  bracketRounds: BracketRound[];
  bracketIndex: number;
  votes: Record<string, string>;
  pickVotes: Record<string, string>;
  cumulativeVoters: Record<string, string[]>;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  usedPrompts: number[];
  promptsPool: string[];
  playerIds: string[];
}

const SUBMIT_MS = 45000;
const VOTE_MS = 20000;
const REVEAL_MS = 6000;
const SCOREBOARD_MS = 4000;

export function createPromptVoteState(
  mode: PromptVoteMode,
  prompts: string[],
  maxRounds = 4,
  targetPlayerId?: string,
  playerIds: string[] = [], gameOptions?: import("@party-games/shared").GameOptions): PromptVoteState {
  const idx = Math.floor(Math.random() * prompts.length);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    ...startPhaseTimer(5000, gameOptions),
    mode,
    prompt: prompts[idx],
    targetPlayerId,
    submissions: [],
    bracketRounds: [],
    bracketIndex: 0,
    votes: {},
    pickVotes: {},
    cumulativeVoters: {},
    roundScores: {},
    cumulativeScores: {},
    usedPrompts: [idx],
    promptsPool: prompts,
    playerIds,
    gameOptions,
  };
}

/** Build bracket rounds: odd n≥5 → one random triple + pairs; n=3 punchline uses gallery vote instead. */
export function buildBracketRounds(submissions: Submission[]): BracketRound[] {
  const ids = shuffle(submissions).map((s) => s.id);
  const n = ids.length;
  const rounds: BracketRound[] = [];

  if (n % 2 === 1 && n >= 5) {
    const triple = ids.slice(0, 3);
    const rest = ids.slice(3);
    rounds.push({ kind: "triple", a: triple[0], b: triple[1], c: triple[2] });
    for (let i = 0; i + 1 < rest.length; i += 2) {
      rounds.push({ kind: "pair", a: rest[i], b: rest[i + 1] });
    }
    return rounds;
  }

  for (let i = 0; i + 1 < n; i += 2) {
    rounds.push({ kind: "pair", a: ids[i], b: ids[i + 1] });
  }
  return rounds;
}

function currentBracketRound(state: PromptVoteState): BracketRound | undefined {
  return state.bracketRounds[state.bracketIndex];
}

function bracketSubmissionIds(round: BracketRound): string[] {
  return round.kind === "pair" ? [round.a, round.b] : [round.a, round.b, round.c];
}

function bracketAuthorIds(state: PromptVoteState, round: BracketRound): Set<string> {
  const authorIds = bracketSubmissionIds(round)
    .map((id) => state.submissions.find((s) => s.id === id)?.playerId)
    .filter((id): id is string => Boolean(id));
  return new Set(authorIds);
}

function eligibleBracketVoters(state: PromptVoteState, round: BracketRound): string[] {
  const authors = bracketAuthorIds(state, round);
  return state.playerIds.filter((id) => !authors.has(id));
}

function usesGalleryVote(state: PromptVoteState): boolean {
  return state.mode === "vote-all";
}

function punchlineUsesGalleryVote(state: PromptVoteState): boolean {
  return state.mode === "bracket" && state.submissions.length === 3;
}

export function advancePromptVote(state: PromptVoteState, prompts: string[]): PromptVoteState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    Object.assign(state, startPhaseTimer(SUBMIT_MS, state.gameOptions));
    state.submissions = [];
    state.votes = {};
    state.pickVotes = {};
    state.cumulativeVoters = {};
    return state;
  }
  if (state.phase === "submit") {
    if (state.mode === "hot-seat") {
      state.phase = "pick";
      Object.assign(state, startPhaseTimer(VOTE_MS, state.gameOptions));
      return state;
    }
    if (usesGalleryVote(state) || punchlineUsesGalleryVote(state)) {
      if (state.submissions.length < 2) {
        state.roundScores = {};
        state.phase = "scoreboard";
        Object.assign(state, startPhaseTimer(SCOREBOARD_MS, state.gameOptions));
        return state;
      }
      state.phase = "vote";
      Object.assign(state, startPhaseTimer(VOTE_MS, state.gameOptions));
      return state;
    }
    state.bracketRounds = buildBracketRounds(state.submissions);
    state.bracketIndex = 0;
    state.phase = state.bracketRounds.length > 0 ? "matchup" : "scoreboard";
    Object.assign(state, startPhaseTimer(VOTE_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "matchup") {
    scoreBracketRound(state);
    state.bracketIndex += 1;
    if (state.bracketIndex >= state.bracketRounds.length) {
      state.phase = "reveal";
      Object.assign(state, startPhaseTimer(REVEAL_MS, state.gameOptions));
    } else {
      state.votes = {};
      Object.assign(state, startPhaseTimer(VOTE_MS, state.gameOptions));
    }
    return state;
  }
  if (state.phase === "vote") {
    scoreVoteAll(state);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "pick") {
    scoreHotSeat(state);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    Object.assign(state, startPhaseTimer(SCOREBOARD_MS, state.gameOptions));
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      Object.assign(state, clearPhaseTimer());
      return state;
    }
    state.round += 1;
    state.roundScores = {};
    const available = prompts.map((_, i) => i).filter((i) => !state.usedPrompts.includes(i));
    const pool = available.length > 0 ? available : prompts.map((_, i) => i);
    const idx = pickRandom(pool);
    state.usedPrompts.push(idx);
    state.prompt = prompts[idx];
    if (state.mode === "hot-seat" && state.targetPlayerId && state.playerIds.length > 0) {
      const idx = state.playerIds.indexOf(state.targetPlayerId);
      state.targetPlayerId = state.playerIds[(idx + 1) % state.playerIds.length];
    }
    state.phase = "instructions";
    Object.assign(state, startPhaseTimer(5000, state.gameOptions));
    return state;
  }
  return state;
}

function accumulateVotes(state: PromptVoteState) {
  for (const [voterId, submissionId] of Object.entries(state.votes)) {
    if (!state.cumulativeVoters[submissionId]) state.cumulativeVoters[submissionId] = [];
    state.cumulativeVoters[submissionId].push(voterId);
  }
}

function buildPromptVoteReveal(state: PromptVoteState): RevealEntry[] {
  let voterMap: Record<string, string[]> = {};
  if (state.mode === "bracket") {
    voterMap =
      state.bracketRounds.length > 0 ? state.cumulativeVoters : votersByOption(state.votes);
  } else if (usesGalleryVote(state)) {
    voterMap = votersByOption(state.votes);
  } else if (state.mode === "hot-seat" && state.targetPlayerId) {
    const pick = state.pickVotes[state.targetPlayerId];
    if (pick) voterMap = { [pick]: [state.targetPlayerId] };
  }
  return state.submissions.map((s) => ({
    id: s.id,
    text: s.text,
    authorId: s.playerId,
    voterIds: voterMap[s.id] ?? [],
  }));
}

function pickBracketWinner(round: BracketRound, counts: Record<string, number>): string {
  const candidates = bracketSubmissionIds(round);
  let winnerId = candidates[0];
  let best = counts[winnerId] ?? 0;
  for (const id of candidates) {
    const count = counts[id] ?? 0;
    if (count > best || (count === best && id < winnerId)) {
      best = count;
      winnerId = id;
    }
  }
  return winnerId;
}

function scoreBracketRound(state: PromptVoteState) {
  const round = currentBracketRound(state);
  if (!round) return;
  accumulateVotes(state);
  const counts: Record<string, number> = {};
  for (const optionId of Object.values(state.votes)) {
    counts[optionId] = (counts[optionId] ?? 0) + 1;
  }
  const winnerId = pickBracketWinner(round, counts);
  const winner = state.submissions.find((s) => s.id === winnerId);
  if (winner) {
    state.roundScores[winner.playerId] = (state.roundScores[winner.playerId] ?? 0) + 1000;
    state.cumulativeScores[winner.playerId] = (state.cumulativeScores[winner.playerId] ?? 0) + 1000;
  }
}

function scoreVoteAll(state: PromptVoteState) {
  const counts: Record<string, number> = {};
  for (const optionId of Object.values(state.votes)) {
    counts[optionId] = (counts[optionId] ?? 0) + 1;
  }
  let bestId = "";
  let best = 0;
  for (const [id, count] of Object.entries(counts)) {
    if (count > best) {
      best = count;
      bestId = id;
    }
  }
  const winner = state.submissions.find((s) => s.id === bestId);
  if (winner) {
    state.roundScores[winner.playerId] = (state.roundScores[winner.playerId] ?? 0) + 1000;
    state.cumulativeScores[winner.playerId] = (state.cumulativeScores[winner.playerId] ?? 0) + 1000;
  }
}

function scoreHotSeat(state: PromptVoteState) {
  const pick = state.pickVotes[state.targetPlayerId ?? ""];
  if (!pick) return;
  const chosen = state.submissions.find((s) => s.id === pick);
  if (chosen) {
    state.roundScores[chosen.playerId] = (state.roundScores[chosen.playerId] ?? 0) + 1000;
    state.cumulativeScores[chosen.playerId] = (state.cumulativeScores[chosen.playerId] ?? 0) + 1000;
  }
}

export function onPromptVoteAction(
  state: PromptVoteState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): PromptVoteState {
  if (action.kind === "submit_text" && state.phase === "submit") {
    if (state.mode === "hot-seat" && playerId === state.targetPlayerId) return state;
    const existing = state.submissions.find((s) => s.playerId === playerId);
    if (!existing) {
      state.submissions.push({
        id: uniqueId(),
        playerId,
        text: action.text.slice(0, 120),
      });
    }
    const expected = state.mode === "hot-seat" ? ctx.playerIds.length - 1 : ctx.playerIds.length;
    if (state.submissions.length >= expected) return advancePromptVote(state, state.promptsPool);
  }
  if (action.kind === "vote_pair" && state.phase === "matchup") {
    const round = currentBracketRound(state);
    if (!round) return state;
    if (bracketAuthorIds(state, round).has(playerId)) return state;
    const validIds = bracketSubmissionIds(round);
    if (!validIds.includes(action.winnerId)) return state;
    const picked = state.submissions.find((s) => s.id === action.winnerId);
    if (picked?.playerId === playerId) return state;
    state.votes[playerId] = action.winnerId;
    const eligible = eligibleBracketVoters(state, round);
    if (eligible.every((id) => state.votes[id] !== undefined)) {
      return advancePromptVote(state, state.promptsPool);
    }
  }
  if (action.kind === "vote" && state.phase === "vote") {
    const picked = state.submissions.find((s) => s.id === action.optionId);
    if (picked?.playerId === playerId) return state;
    if (state.votes[playerId] !== undefined) return state;
    state.votes[playerId] = action.optionId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advancePromptVote(state, state.promptsPool);
    }
  }
  if (action.kind === "hot_seat_pick" && state.phase === "pick" && playerId === state.targetPlayerId) {
    state.pickVotes[playerId] = action.submissionId;
    return advancePromptVote(state, state.promptsPool);
  }
  if (
    action.kind === "hot_seat_skip" &&
    state.mode === "hot-seat" &&
    playerId === state.targetPlayerId &&
    (state.phase === "submit" || state.phase === "pick")
  ) {
    state.roundScores = {};
    state.phase = "scoreboard";
    Object.assign(state, startPhaseTimer(SCOREBOARD_MS, state.gameOptions));
    return state;
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advancePromptVote(state, state.promptsPool);
  }
  return state;
}

export function onPromptVoteTick(state: PromptVoteState, prompts?: string[]): PromptVoteState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advancePromptVote(state, prompts ?? state.promptsPool);
}

function buildMatchupView(state: PromptVoteState, round: BracketRound, subById: Record<string, Submission>) {
  const base = {
    index: state.bracketIndex,
    total: state.bracketRounds.length,
  };
  if (round.kind === "triple") {
    return {
      kind: "triple" as const,
      a: subById[round.a],
      b: subById[round.b],
      c: subById[round.c],
      ...base,
    };
  }
  return {
    kind: "pair" as const,
    a: subById[round.a],
    b: subById[round.b],
    ...base,
  };
}

export function promptVoteHostView(state: PromptVoteState, ctx?: RoomContext) {
  const currentRound = currentBracketRound(state);
  const subById = Object.fromEntries(state.submissions.map((s) => [s.id, s]));
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const targetName = state.targetPlayerId
    ? ctx?.players.find((p) => p.id === state.targetPlayerId)?.nickname ?? "Player"
    : undefined;
  const displayPrompt =
    state.mode === "hot-seat" && targetName
      ? personalizeHotSeatPrompt(state.prompt, targetName)
      : state.prompt;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      promptVoteStyle: state.mode === "hot-seat" ? "hot-seat" : "bracket",
      prompt: displayPrompt,
      targetPlayerId: state.targetPlayerId,
      targetName,
      submissions: showReveal
        ? state.submissions
        : state.phase === "vote" || state.phase === "pick"
          ? state.submissions.map((s) => ({ id: s.id, text: s.text }))
          : undefined,
      submitCount: state.phase === "submit" ? state.submissions.length : undefined,
      playerCount: state.playerIds.length,
      expectedSubmitCount:
        state.phase === "submit" && state.mode === "hot-seat"
          ? Math.max(0, state.playerIds.length - 1)
          : state.phase === "submit"
            ? state.playerIds.length
            : undefined,
      reveal: showReveal ? buildPromptVoteReveal(state) : undefined,
      matchup: currentRound ? buildMatchupView(state, currentRound, subById) : undefined,
      roundScores: state.roundScores,
      cumulativeScores: state.cumulativeScores,
    },
  };
}

export function promptVotePlayerView(state: PromptVoteState, playerId: string, ctx?: RoomContext) {
  const currentRound = currentBracketRound(state);
  const subById = Object.fromEntries(state.submissions.map((s) => [s.id, s]));
  const ownSubmission = state.submissions.find((s) => s.playerId === playerId);
  const isTarget = state.targetPlayerId === playerId;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  const targetName = state.targetPlayerId
    ? ctx?.players.find((p) => p.id === state.targetPlayerId)?.nickname ?? "Player"
    : undefined;
  const displayPrompt =
    state.mode === "hot-seat" && targetName
      ? personalizeHotSeatPrompt(state.prompt, targetName)
      : state.prompt;
  const canVoteInMatchup =
    state.phase === "matchup" && currentRound
      ? !bracketAuthorIds(state, currentRound).has(playerId)
      : undefined;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      promptVoteStyle: state.mode === "hot-seat" ? "hot-seat" : "bracket",
      prompt: state.phase !== "instructions" ? displayPrompt : undefined,
      isTarget,
      targetName,
      matchup: state.phase === "matchup" && currentRound
        ? buildMatchupView(state, currentRound, subById)
        : undefined,
      options: state.phase === "vote"
        ? state.submissions.map((s) => ({ id: s.id, text: s.text, authorId: s.playerId }))
        : state.phase === "pick" && isTarget
          ? state.submissions.map((s) => ({ id: s.id, text: s.text }))
          : undefined,
      reveal: showReveal ? buildPromptVoteReveal(state) : undefined,
    },
    playerData: {
      submitted: state.submissions.some((s) => s.playerId === playerId),
      voted: state.votes[playerId] !== undefined,
      picked: state.pickVotes[playerId] !== undefined,
      ownSubmissionId: ownSubmission?.id,
      mySubmission: ownSubmission?.text,
      canVoteInMatchup,
    },
  };
}
