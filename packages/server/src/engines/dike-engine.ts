import {
  applyRound,
  DIKE_BONUS_AMOUNT,
  DIKE_STARTING_BALANCE,
  placementScores,
  resolveWinner,
  type DikeRevealEntry,
  type GameAction,
  type RoomContext,
} from "@party-games/shared";

export type DikePhase = "instructions" | "bid" | "reveal" | "ended";

export interface DikeState {
  phase: DikePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  alive: string[];
  balances: Record<string, number>;
  bids: Record<string, number>;
  lastReveal: DikeRevealEntry[];
  winnerId?: string;
  placement: string[];
  eliminationRound: Record<string, number>;
  roundScores: Record<string, number>;
}

const INSTRUCTIONS_MS = 5000;
const BID_MS = 30000;
const REVEAL_MS = 8000;

export function createDikeState(playerIds: string[]): DikeState {
  const balances = Object.fromEntries(playerIds.map((id) => [id, DIKE_STARTING_BALANCE]));

  return {
    phase: "instructions",
    round: 1,
    maxRounds: Math.max(1, playerIds.length - 1),
    timerEndsAt: Date.now() + INSTRUCTIONS_MS,
    alive: [...playerIds],
    balances,
    bids: {},
    lastReveal: [],
    placement: [],
    eliminationRound: {},
    roundScores: {},
  };
}

function allAliveBid(state: DikeState): boolean {
  return state.alive.every((id) => state.bids[id] !== undefined);
}

function fillMissingBids(state: DikeState): Record<string, number> {
  const bids = { ...state.bids };
  for (const id of state.alive) {
    if (bids[id] === undefined) {
      bids[id] = 0;
    }
  }
  return bids;
}

function finishGame(state: DikeState, winnerId: string): DikeState {
  state.winnerId = winnerId;
  state.phase = "ended";
  state.timerEndsAt = null;
  state.roundScores = placementScores(winnerId, state.placement, state.eliminationRound);
  return state;
}

function resolveRound(state: DikeState): DikeState {
  const bids = fillMissingBids(state);
  const result = applyRound(bids, state.balances, state.alive, {
    bonusAmount: DIKE_BONUS_AMOUNT,
  });

  state.balances = result.balances;
  state.alive = result.alive;
  state.lastReveal = result.reveal;
  state.bids = {};

  for (const playerId of result.eliminated) {
    if (!state.eliminationRound[playerId]) {
      state.eliminationRound[playerId] = state.round;
      state.placement.unshift(playerId);
    }
  }

  const winner = resolveWinner(state.alive, state.balances);
  if (winner) {
    return finishGame(state, winner);
  }

  state.phase = "reveal";
  state.timerEndsAt = Date.now() + REVEAL_MS;
  return state;
}

export function advanceDike(state: DikeState): DikeState {
  if (state.phase === "instructions") {
    state.phase = "bid";
    state.timerEndsAt = Date.now() + BID_MS;
    state.bids = {};
    return state;
  }

  if (state.phase === "bid") {
    return resolveRound(state);
  }

  if (state.phase === "reveal") {
    if (state.alive.length <= 1) {
      const winner = state.alive[0];
      if (winner) return finishGame(state, winner);
    }

    const winner = resolveWinner(state.alive, state.balances);
    if (winner) {
      return finishGame(state, winner);
    }

    state.round += 1;
    state.phase = "bid";
    state.timerEndsAt = Date.now() + BID_MS;
    state.bids = {};
    state.lastReveal = [];
    return state;
  }

  return state;
}

export function onDikeAction(
  state: DikeState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): DikeState {
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDike(state);
  }

  if (action.kind === "dike_bid" && state.phase === "bid" && state.alive.includes(playerId)) {
    const balance = state.balances[playerId] ?? 0;
    const amount = Math.max(0, Math.min(balance, Math.floor(action.amount)));
    state.bids[playerId] = amount;

    if (allAliveBid(state)) {
      return advanceDike(state);
    }
  }

  if (action.kind === "advance" && state.phase === "reveal" && playerId === "host") {
    return advanceDike(state);
  }

  return state;
}

export function onDikeTick(state: DikeState): DikeState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDike(state);
}

function dikeCommonData(state: DikeState) {
  return {
    walkerCount: state.alive.length,
    bidCount: state.alive.filter((id) => state.bids[id] !== undefined).length,
    reveal: state.lastReveal,
    balances: state.balances,
    winnerId: state.winnerId,
    placement: state.placement,
    roundScores: state.roundScores,
  };
}

export function dikeHostView(state: DikeState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      ...dikeCommonData(state),
      alive: state.alive,
      submitCount: state.alive.filter((id) => state.bids[id] !== undefined).length,
      playerCount: state.alive.length,
    },
  };
}

export function dikePlayerView(state: DikeState, playerId: string) {
  const eliminated = !state.alive.includes(playerId) && state.phase !== "instructions";
  const balance = state.balances[playerId] ?? 0;

  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      ...dikeCommonData(state),
      displayText:
        state.phase === "bid" && !eliminated
          ? `Round ${state.round}: bid 0–${balance}`
          : undefined,
    },
    playerData: {
      balance,
      eliminated,
      bidSubmitted: state.bids[playerId] !== undefined,
      lockedBid: state.phase === "reveal" || state.phase === "ended"
        ? state.lastReveal.find((entry) => entry.playerId === playerId)?.bid
        : undefined,
    },
  };
}
