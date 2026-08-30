import { pickRandom, shuffle, type ForbiddenClueCard, type GameAction, type RoomContext } from "@party-games/shared";

export type ForbiddenPhase = "instructions" | "clue" | "reveal" | "scoreboard" | "ended";

export interface ForbiddenState {
  phase: ForbiddenPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  playerIds: string[];
  teamA: string[];
  teamB: string[];
  activeTeam: "a" | "b";
  clueGiverId: string;
  card: ForbiddenClueCard;
  correct: number;
  skips: number;
  fouls: number;
  roundScores: Record<string, number>;
  usedCards: number[];
  pool: ForbiddenClueCard[];
}

const CLUE_MS = 60_000;
const REVEAL_MS = 5000;
const SCOREBOARD_MS = 4000;
const MAX_SKIPS = 3;

function splitTeams(playerIds: string[]): { teamA: string[]; teamB: string[] } {
  const shuffled = shuffle(playerIds);
  const mid = Math.ceil(shuffled.length / 2);
  return { teamA: shuffled.slice(0, mid), teamB: shuffled.slice(mid) };
}

function pickCard(state: ForbiddenState): ForbiddenClueCard {
  const available = state.pool.map((c, i) => i).filter((i) => !state.usedCards.includes(i));
  const idx = available.length > 0 ? pickRandom(available) : Math.floor(Math.random() * state.pool.length);
  state.usedCards.push(idx);
  return state.pool[idx];
}

export function createForbiddenState(pool: ForbiddenClueCard[], playerIds: string[]): ForbiddenState {
  const { teamA, teamB } = splitTeams(playerIds);
  const idx = Math.floor(Math.random() * pool.length);
  const card = pool[idx];
  return {
    phase: "instructions",
    round: 1,
    maxRounds: Math.max(4, Math.ceil(playerIds.length / 2)),
    timerEndsAt: Date.now() + 5000,
    playerIds,
    teamA,
    teamB,
    activeTeam: "a",
    clueGiverId: teamA[0],
    card,
    correct: 0,
    skips: 0,
    fouls: 0,
    roundScores: {},
    usedCards: [idx],
    pool,
  };
}

function activeTeamIds(state: ForbiddenState): string[] {
  return state.activeTeam === "a" ? state.teamA : state.teamB;
}

function advanceForbidden(state: ForbiddenState): ForbiddenState {
  if (state.phase === "instructions") {
    state.phase = "clue";
    state.timerEndsAt = Date.now() + CLUE_MS;
    state.correct = 0;
    state.skips = 0;
    state.fouls = 0;
    return state;
  }
  if (state.phase === "clue") {
    state.roundScores[state.clueGiverId] = (state.roundScores[state.clueGiverId] ?? 0) + state.correct * 500 - state.fouls * 100;
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
    state.activeTeam = state.activeTeam === "a" ? "b" : "a";
    const team = activeTeamIds(state);
    state.clueGiverId = team[(state.round - 1) % team.length];
    state.card = pickCard(state);
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onForbiddenAction(
  state: ForbiddenState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): ForbiddenState {
  if (playerId !== state.clueGiverId) return state;
  if (state.phase !== "clue") {
    if (action.kind === "advance" && state.phase === "instructions") return advanceForbidden(state);
    return state;
  }
  if (action.kind === "forbidden_correct") {
    state.correct += 1;
    state.card = pickCard(state);
  }
  if (action.kind === "forbidden_skip" && state.skips < MAX_SKIPS) {
    state.skips += 1;
    state.card = pickCard(state);
  }
  if (action.kind === "forbidden_foul") {
    state.fouls += 1;
  }
  if (action.kind === "advance") return advanceForbidden(state);
  return state;
}

export function onForbiddenTick(state: ForbiddenState): ForbiddenState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceForbidden(state);
}

export function forbiddenHostView(state: ForbiddenState) {
  const showCard = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      activeTeam: state.activeTeam,
      clueGiverId: state.clueGiverId,
      correct: state.correct,
      skips: state.skips,
      fouls: state.fouls,
      word: showCard ? state.card.word : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function forbiddenPlayerView(state: ForbiddenState, playerId: string) {
  const isClueGiver = playerId === state.clueGiverId;
  const onTeam =
    state.teamA.includes(playerId) ? "a" : state.teamB.includes(playerId) ? "b" : null;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      activeTeam: state.activeTeam,
      clueGiverId: state.clueGiverId,
    },
    playerData: {
      isClueGiver,
      onTeam,
      card: isClueGiver && state.phase === "clue" ? state.card : undefined,
      skipsLeft: isClueGiver ? MAX_SKIPS - state.skips : undefined,
    },
  };
}
