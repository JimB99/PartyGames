import { pickRandom, shuffle, uniqueId, votersByOption, type GameAction, type RoomContext, type RevealEntry } from "@party-games/shared";

export type PromptVoteMode = "quiplash" | "caption" | "hot-seat" | "vote-all";

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

export interface PromptVoteState {
  phase: PromptVotePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  mode: PromptVoteMode;
  prompt: string;
  imageCaption?: string;
  targetPlayerId?: string;
  submissions: Submission[];
  matchups: Array<{ a: string; b: string }>;
  matchupIndex: number;
  votes: Record<string, string>;
  pickVotes: Record<string, string>;
  cumulativeVoters: Record<string, string[]>;
  roundScores: Record<string, number>;
  usedPrompts: number[];
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
): PromptVoteState {
  const idx = Math.floor(Math.random() * prompts.length);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    mode,
    prompt: prompts[idx],
    imageCaption: mode === "caption" ? prompts[idx] : undefined,
    targetPlayerId,
    submissions: [],
    matchups: [],
    matchupIndex: 0,
    votes: {},
    pickVotes: {},
    cumulativeVoters: {},
    roundScores: {},
    usedPrompts: [idx],
  };
}

function buildMatchups(state: PromptVoteState) {
  const subs = shuffle(state.submissions);
  const pairs: Array<{ a: string; b: string }> = [];
  for (let i = 0; i < subs.length - 1; i += 2) {
    pairs.push({ a: subs[i].id, b: subs[i + 1].id });
  }
  if (subs.length % 2 === 1 && subs.length > 1) {
    pairs.push({ a: subs[subs.length - 1].id, b: subs[0].id });
  }
  state.matchups = pairs;
  state.matchupIndex = 0;
}

export function advancePromptVote(state: PromptVoteState, prompts: string[]): PromptVoteState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    state.timerEndsAt = Date.now() + SUBMIT_MS;
    state.submissions = [];
    state.votes = {};
    state.pickVotes = {};
    state.cumulativeVoters = {};
    return state;
  }
  if (state.phase === "submit") {
    if (state.mode === "hot-seat") {
      state.phase = "pick";
      state.timerEndsAt = Date.now() + VOTE_MS;
      return state;
    }
    if (state.mode === "vote-all") {
      state.phase = "vote";
      state.timerEndsAt = Date.now() + VOTE_MS;
      return state;
    }
    buildMatchups(state);
    state.phase = state.matchups.length > 0 ? "matchup" : "scoreboard";
    state.timerEndsAt = Date.now() + VOTE_MS;
    return state;
  }
  if (state.phase === "matchup") {
    scoreMatchup(state);
    state.matchupIndex += 1;
    if (state.matchupIndex >= state.matchups.length) {
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
    } else {
      state.votes = {};
      state.timerEndsAt = Date.now() + VOTE_MS;
    }
    return state;
  }
  if (state.phase === "vote") {
    scoreVoteAll(state);
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + REVEAL_MS;
    return state;
  }
  if (state.phase === "pick") {
    scoreHotSeat(state);
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
    const available = prompts.map((_, i) => i).filter((i) => !state.usedPrompts.includes(i));
    const pool = available.length > 0 ? available : prompts.map((_, i) => i);
    const idx = pickRandom(pool);
    state.usedPrompts.push(idx);
    state.prompt = prompts[idx];
    if (state.mode === "caption") state.imageCaption = prompts[idx];
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
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
  if (state.mode === "quiplash") {
    voterMap = state.cumulativeVoters;
  } else if (state.mode === "vote-all") {
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

function scoreMatchup(state: PromptVoteState) {
  const matchup = state.matchups[state.matchupIndex];
  if (!matchup) return;
  accumulateVotes(state);
  let votesA = 0;
  let votesB = 0;
  for (const optionId of Object.values(state.votes)) {
    if (optionId === matchup.a) votesA++;
    if (optionId === matchup.b) votesB++;
  }
  const winnerId = votesA >= votesB ? matchup.a : matchup.b;
  const winner = state.submissions.find((s) => s.id === winnerId);
  if (winner) {
    state.roundScores[winner.playerId] = (state.roundScores[winner.playerId] ?? 0) + 1000;
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
  }
}

function scoreHotSeat(state: PromptVoteState) {
  const pick = state.pickVotes[state.targetPlayerId ?? ""];
  if (!pick) return;
  const chosen = state.submissions.find((s) => s.id === pick);
  if (chosen) {
    state.roundScores[chosen.playerId] = (state.roundScores[chosen.playerId] ?? 0) + 1000;
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
    if (state.submissions.length >= expected) return advancePromptVote(state, []);
  }
  if (action.kind === "vote_pair" && state.phase === "matchup") {
    state.votes[playerId] = action.winnerId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advancePromptVote(state, []);
    }
  }
  if (action.kind === "vote" && state.phase === "vote") {
    state.votes[playerId] = action.optionId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advancePromptVote(state, []);
    }
  }
  if (action.kind === "hot_seat_pick" && state.phase === "pick" && playerId === state.targetPlayerId) {
    state.pickVotes[playerId] = action.submissionId;
    return advancePromptVote(state, []);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advancePromptVote(state, []);
  }
  return state;
}

export function onPromptVoteTick(state: PromptVoteState, prompts: string[]): PromptVoteState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advancePromptVote(state, prompts);
}

export function promptVoteHostView(state: PromptVoteState) {
  const currentMatchup = state.matchups[state.matchupIndex];
  const subById = Object.fromEntries(state.submissions.map((s) => [s.id, s]));
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      prompt: state.prompt,
      imageCaption: state.imageCaption,
      targetPlayerId: state.targetPlayerId,
      submissions: showReveal
        ? state.submissions
        : state.phase === "vote" || state.phase === "pick"
          ? state.submissions.map((s) => ({ id: s.id, text: s.text }))
          : undefined,
      reveal: showReveal ? buildPromptVoteReveal(state) : undefined,
      matchup: currentMatchup
        ? {
            a: subById[currentMatchup.a],
            b: subById[currentMatchup.b],
            index: state.matchupIndex,
            total: state.matchups.length,
          }
        : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function promptVotePlayerView(state: PromptVoteState, playerId: string) {
  const currentMatchup = state.matchups[state.matchupIndex];
  const subById = Object.fromEntries(state.submissions.map((s) => [s.id, s]));
  const isTarget = state.targetPlayerId === playerId;
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      mode: state.mode,
      prompt: state.phase !== "instructions" ? state.prompt : undefined,
      imageCaption: state.imageCaption,
      isTarget,
      matchup: state.phase === "matchup" && currentMatchup
        ? { a: subById[currentMatchup.a], b: subById[currentMatchup.b] }
        : undefined,
      options: state.phase === "vote"
        ? state.submissions.map((s) => ({ id: s.id, text: s.text }))
        : state.phase === "pick" && isTarget
          ? state.submissions.map((s) => ({ id: s.id, text: s.text }))
          : undefined,
      reveal: showReveal ? buildPromptVoteReveal(state) : undefined,
    },
    playerData: {
      submitted: state.submissions.some((s) => s.playerId === playerId),
      voted: state.votes[playerId] !== undefined,
      picked: state.pickVotes[playerId] !== undefined,
    },
  };
}
