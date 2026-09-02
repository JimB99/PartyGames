import {
  AGENT_GRID_SIZE,
  buildAgentKey,
  pickRandom,
  resolveAgentGuess,
  shuffle,
  teamWon,
  type GameAction,
  type RoomContext,
} from "@party-games/shared";

export type AgentGridPhase = "instructions" | "clue" | "guess" | "reveal" | "ended";

export interface AgentGridState {
  phase: AgentGridPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  words: string[];
  key: Array<"a" | "b" | "neutral" | "assassin">;
  revealed: boolean[];
  teamA: string[];
  teamB: string[];
  spymasterA: string;
  spymasterB: string;
  activeTeam: "a" | "b";
  guessesRemaining: number;
  currentClue: { word: string; count: number } | null;
  winner: "a" | "b" | null;
  loser: "a" | "b" | null;
  roundScores: Record<string, number>;
  playerIds: string[];
}

const CLUE_MS = 90_000;
const GUESS_MS = 60_000;
const REVEAL_MS = 8000;

function splitTeams(playerIds: string[]): { teamA: string[]; teamB: string[] } {
  const shuffled = shuffle(playerIds);
  const mid = Math.ceil(shuffled.length / 2);
  return { teamA: shuffled.slice(0, mid), teamB: shuffled.slice(mid) };
}

export function createAgentGridState(words: string[], playerIds: string[]): AgentGridState {
  const picked = shuffle(words).slice(0, AGENT_GRID_SIZE);
  while (picked.length < AGENT_GRID_SIZE) picked.push(pickRandom(words));
  const { teamA, teamB } = splitTeams(playerIds);
  const starting: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    words: picked,
    key: buildAgentKey(starting),
    revealed: Array(AGENT_GRID_SIZE).fill(false),
    teamA,
    teamB,
    spymasterA: teamA[0],
    spymasterB: teamB[0],
    activeTeam: starting,
    guessesRemaining: 0,
    currentClue: null,
    winner: null,
    loser: null,
    roundScores: {},
    playerIds,
  };
}

function operativeIds(state: AgentGridState, team: "a" | "b"): string[] {
  const teamIds = team === "a" ? state.teamA : state.teamB;
  const spy = team === "a" ? state.spymasterA : state.spymasterB;
  return teamIds.filter((id) => id !== spy);
}

function scoreWin(state: AgentGridState, team: "a" | "b"): void {
  state.winner = team;
  const winners = team === "a" ? state.teamA : state.teamB;
  for (const id of winners) state.roundScores[id] = 1500;
}

export function advanceAgentGrid(state: AgentGridState): AgentGridState {
  if (state.phase === "instructions") {
    state.phase = "clue";
    state.timerEndsAt = Date.now() + CLUE_MS;
    state.timerTotalMs = CLUE_MS;
    state.currentClue = null;
    return state;
  }
  if (state.phase === "clue") {
    if (!state.currentClue) {
      state.activeTeam = state.activeTeam === "a" ? "b" : "a";
      state.guessesRemaining = 0;
      state.currentClue = null;
      state.timerEndsAt = Date.now() + CLUE_MS;
      state.timerTotalMs = CLUE_MS;
      return state;
    }
    state.phase = "guess";
    state.timerEndsAt = Date.now() + GUESS_MS;
    state.timerTotalMs = GUESS_MS;
    return state;
  }
  if (state.phase === "guess") {
    state.activeTeam = state.activeTeam === "a" ? "b" : "a";
    state.phase = "clue";
    state.guessesRemaining = 0;
    state.currentClue = null;
    state.timerEndsAt = Date.now() + CLUE_MS;
    state.timerTotalMs = CLUE_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "ended";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
    return state;
  }
  return state;
}

export function onAgentGridAction(
  state: AgentGridState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): AgentGridState {
  const spymaster = state.activeTeam === "a" ? state.spymasterA : state.spymasterB;
  if (action.kind === "agent_clue" && state.phase === "clue" && playerId === spymaster) {
    state.currentClue = { word: action.word.slice(0, 40), count: Math.max(0, action.count) };
    state.guessesRemaining = action.count + 1;
    state.phase = "guess";
    state.timerEndsAt = Date.now() + GUESS_MS;
    state.timerTotalMs = GUESS_MS;
    return state;
  }
  if (action.kind === "agent_guess" && state.phase === "guess") {
    const ops = operativeIds(state, state.activeTeam);
    if (!ops.includes(playerId)) return state;
    if (state.guessesRemaining <= 0) return state;
    if (state.revealed[action.index]) return state;
    const { outcome, tile } = resolveAgentGuess(state.key, state.revealed, action.index, state.activeTeam);
    state.revealed[action.index] = true;
    if (outcome === "assassin_loss") {
      state.loser = state.activeTeam;
      state.winner = state.activeTeam === "a" ? "b" : "a";
      scoreWin(state, state.winner);
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
      state.timerTotalMs = REVEAL_MS;
      return state;
    }
    if (outcome === "win" || (outcome === "continue" && teamWon(state.key, state.revealed, state.activeTeam))) {
      scoreWin(state, state.activeTeam);
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
      state.timerTotalMs = REVEAL_MS;
      return state;
    }
    if (outcome === "opponent_bonus") {
      const other = state.activeTeam === "a" ? "b" : "a";
      if (teamWon(state.key, state.revealed, other)) {
        scoreWin(state, other);
        state.phase = "reveal";
        state.timerEndsAt = Date.now() + REVEAL_MS;
        state.timerTotalMs = REVEAL_MS;
        return state;
      }
      return advanceAgentGrid(state);
    }
    if (outcome === "continue") {
      state.guessesRemaining -= 1;
      if (state.guessesRemaining <= 0) {
        return advanceAgentGrid(state);
      }
      return state;
    }
    state.guessesRemaining -= 1;
    if (outcome === "end_turn" || state.guessesRemaining <= 0) {
      return advanceAgentGrid(state);
    }
    void tile;
    return state;
  }
  if (action.kind === "agent_pass" && state.phase === "guess") {
    const ops = operativeIds(state, state.activeTeam);
    if (!ops.includes(playerId)) return state;
    return advanceAgentGrid(state);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceAgentGrid(state);
  }
  return state;
}

export function onAgentGridTick(state: AgentGridState): AgentGridState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "reveal") {
    state.phase = "ended";
    state.timerEndsAt = null;
    return state;
  }
  return advanceAgentGrid(state);
}

function hostKeyTiles(state: AgentGridState): Array<"a" | "b" | "neutral" | "assassin" | undefined> | undefined {
  if (state.phase === "reveal" || state.phase === "ended") return state.key;
  if (state.phase === "clue" || state.phase === "guess") {
    return state.key.map((t, i) => (state.revealed[i] ? t : undefined));
  }
  return undefined;
}

export function agentGridHostView(state: AgentGridState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      words: state.words,
      revealed: state.revealed,
      key: hostKeyTiles(state),
      activeTeam: state.activeTeam,
      currentClue: state.currentClue,
      guessesRemaining: state.guessesRemaining,
      winner: state.winner,
      roundScores: state.roundScores,
    },
  };
}

export function agentGridPlayerView(state: AgentGridState, playerId: string) {
  const isSpyA = playerId === state.spymasterA;
  const isSpyB = playerId === state.spymasterB;
  const onA = state.teamA.includes(playerId);
  const onB = state.teamB.includes(playerId);
  const team = onA ? "a" : onB ? "b" : null;
  const showKey = (isSpyA || isSpyB) && state.phase !== "ended";
  const spymasterId = state.activeTeam === "a" ? state.spymasterA : state.spymasterB;
  const isOperative =
    state.phase === "guess" &&
    team === state.activeTeam &&
    playerId !== spymasterId;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      words: state.words,
      revealed: state.revealed,
      activeTeam: state.activeTeam,
      currentClue: state.currentClue,
      guessesRemaining: state.guessesRemaining,
    },
    playerData: {
      team,
      teamLabel: team ? `Team ${team.toUpperCase()}` : undefined,
      roleLabel: isSpyA || isSpyB ? "Spymaster" : team ? "Guesser" : undefined,
      isSpymaster: isSpyA || isSpyB,
      key: showKey ? state.key : undefined,
      canGuess: isOperative,
      waitingForClue:
        state.phase === "clue" && team === state.activeTeam && playerId !== spymasterId,
      tileKey: hostKeyTiles(state),
    },
  };
}
