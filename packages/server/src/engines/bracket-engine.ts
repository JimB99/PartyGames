import { pickRandom, shuffle, uniqueId, type GameAction, type RoomContext } from "@party-games/shared";

export type BracketPhase = "instructions" | "submit" | "bracket" | "vote" | "reveal" | "scoreboard" | "ended";

export interface BracketEntry {
  id: string;
  text: string;
  authorId: string;
}

export interface BracketMatch {
  a: string;
  b: string;
  winner?: string;
}

export interface BracketState {
  phase: BracketPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  category: string;
  entries: BracketEntry[];
  bracket: BracketMatch[];
  matchIndex: number;
  votes: Record<string, string>;
  championId?: string;
  roundScores: Record<string, number>;
  usedCategories: string[];
}

const SUBMIT_MS = 45000;
const VOTE_MS = 20000;
const REVEAL_MS = 5000;

export function createBracketState(categories: string[]): BracketState {
  const category = pickRandom(categories);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + 5000,
    category,
    entries: [],
    bracket: [],
    matchIndex: 0,
    votes: {},
    roundScores: {},
    usedCategories: [category],
  };
}

function padToPowerOf2(entries: BracketEntry[]): BracketEntry[] {
  if (entries.length === 0) return [];
  let n = 1;
  while (n < entries.length) n *= 2;
  if (n < 2) n = 2;
  const padded = [...entries];
  while (padded.length < n) {
    const source = entries[padded.length % entries.length];
    padded.push({ id: uniqueId(), text: source.text, authorId: "" });
  }
  return shuffle(padded).slice(0, n);
}

function buildBracket(entries: BracketEntry[]): BracketMatch[] {
  const padded = padToPowerOf2(entries);
  if (padded.length < 2) return [];
  const matches: BracketMatch[] = [];
  for (let i = 0; i < padded.length; i += 2) {
    const a = padded[i];
    const b = padded[i + 1];
    if (!a || !b) continue;
    matches.push({ a: a.id, b: b.id });
  }
  return matches;
}

export function advanceBracket(state: BracketState): BracketState {
  if (state.phase === "instructions") {
    state.phase = "submit";
    state.timerEndsAt = Date.now() + SUBMIT_MS;
    state.entries = [];
    return state;
  }
  if (state.phase === "submit") {
    if (state.entries.length === 0) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.bracket = buildBracket(state.entries);
    if (state.bracket.length === 0) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.matchIndex = 0;
    state.phase = "vote";
    state.timerEndsAt = Date.now() + VOTE_MS;
    state.votes = {};
    return state;
  }
  if (state.phase === "vote") {
    resolveMatch(state);
    state.matchIndex += 1;
    if (state.matchIndex >= state.bracket.length) {
      const winners = state.bracket.map((m) => m.winner!).filter(Boolean);
      if (winners.length === 1) {
        state.championId = winners[0];
        state.phase = "reveal";
        state.timerEndsAt = Date.now() + REVEAL_MS;
        scoreChampion(state);
      } else {
        const winnerEntries = state.entries.filter((e) => winners.includes(e.id));
        state.bracket = buildBracket(winnerEntries);
        state.matchIndex = 0;
        state.votes = {};
        state.timerEndsAt = Date.now() + VOTE_MS;
      }
    } else {
      state.votes = {};
      state.timerEndsAt = Date.now() + VOTE_MS;
    }
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "ended";
    state.timerEndsAt = null;
    return state;
  }
  return state;
}

function resolveMatch(state: BracketState) {
  const match = state.bracket[state.matchIndex];
  if (!match) return;
  let votesA = 0;
  let votesB = 0;
  for (const optionId of Object.values(state.votes)) {
    if (optionId === match.a) votesA++;
    if (optionId === match.b) votesB++;
  }
  match.winner = votesA >= votesB ? match.a : match.b;
}

function scoreChampion(state: BracketState) {
  if (!state.championId) return;
  const champion = state.entries.find((e) => e.id === state.championId);
  if (champion?.authorId) {
    state.roundScores[champion.authorId] = 2000;
  }
}

export function onBracketAction(
  state: BracketState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): BracketState {
  if (action.kind === "submit_text" && state.phase === "submit") {
    const existing = state.entries.find((e) => e.authorId === playerId);
    if (!existing) {
      state.entries.push({ id: uniqueId(), text: action.text.slice(0, 60), authorId: playerId });
    }
    if (state.entries.length >= ctx.playerIds.length) return advanceBracket(state);
  }
  if (action.kind === "vote" && state.phase === "vote") {
    state.votes[playerId] = action.optionId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) return advanceBracket(state);
  }
  if (action.kind === "advance" && state.phase === "instructions") return advanceBracket(state);
  return state;
}

export function onBracketTick(state: BracketState): BracketState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceBracket(state);
}

export function bracketHostView(state: BracketState) {
  const entryById = Object.fromEntries(state.entries.map((e) => [e.id, e]));
  const match = state.bracket[state.matchIndex];
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      category: state.category,
      entries: showReveal ? state.entries : undefined,
      reveal: showReveal
        ? state.entries.map((e) => ({
            id: e.id,
            text: e.text,
            authorId: e.authorId,
            isTruth: state.championId === e.id,
            authorLabel: state.championId === e.id ? "Champion" : undefined,
          }))
        : undefined,
      match: match && state.phase === "vote"
        ? { a: entryById[match.a], b: entryById[match.b], index: state.matchIndex, total: state.bracket.length }
        : undefined,
      champion: state.championId ? entryById[state.championId] : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function bracketPlayerView(state: BracketState, playerId: string) {
  const entryById = Object.fromEntries(state.entries.map((e) => [e.id, e]));
  const match = state.bracket[state.matchIndex];
  const showReveal = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      category: state.phase !== "instructions" ? state.category : undefined,
      match: match && state.phase === "vote"
        ? { a: entryById[match.a], b: entryById[match.b] }
        : undefined,
      reveal: showReveal
        ? state.entries.map((e) => ({
            id: e.id,
            text: e.text,
            authorId: e.authorId,
            isTruth: state.championId === e.id,
            authorLabel: state.championId === e.id ? "Champion" : undefined,
          }))
        : undefined,
      champion: showReveal && state.championId ? entryById[state.championId] : undefined,
    },
    playerData: {
      submitted: state.entries.some((e) => e.authorId === playerId),
      voted: state.votes[playerId] !== undefined,
    },
  };
}
