import type { GameAction } from "@party-games/shared";
import {
  alivePlayers,
  allShipsPlaced,
  autoPlaceFleet,
  computeBattleshipScores,
  createBattleshipState,
  fireAt,
  fleetDestroyed,
  MAX_BET,
  placeShip,
  resolveBets,
  resolveRoyaleRound,
  type BattleshipState,
  type RoyaleShot,
} from "@party-games/shared";

export type { BattleshipState } from "@party-games/shared";

const INSTRUCTIONS_MS = 5000;
const PLACEMENT_MS = 90000;
const BETTING_MS = 12000;
const FIRE_MS = 15000;
const REVEAL_MS = 5000;

export function createBsGameState(playerIds: string[]): BattleshipState {
  return createBattleshipState(playerIds);
}

function allReady(state: BattleshipState): boolean {
  return state.playerIds.every((id) => state.ready[id] && allShipsPlaced(state.fleets[id]));
}

function startPlacement(state: BattleshipState): BattleshipState {
  state.phase = "placement";
  state.timerEndsAt = Date.now() + PLACEMENT_MS;
  state.timerTotalMs = PLACEMENT_MS;
  for (const id of state.playerIds) {
    autoPlaceFleet(state.fleets[id], state.gridSize);
    state.ready[id] = false;
  }
  return state;
}

function startDuelBattle(state: BattleshipState): BattleshipState {
  state.phase = "battle";
  state.currentTurn = 0;
  state.timerEndsAt = null;
  return state;
}

function startRoyaleBetting(state: BattleshipState): BattleshipState {
  state.phase = "betting";
  state.bets = [];
  state.timerEndsAt = Date.now() + BETTING_MS;
  state.timerTotalMs = BETTING_MS;
  return state;
}

function startRoyaleFire(state: BattleshipState): BattleshipState {
  state.phase = "fire";
  state.pendingShots = {};
  state.timerEndsAt = Date.now() + FIRE_MS;
  state.timerTotalMs = FIRE_MS;
  return state;
}

function autoPlaceMissing(state: BattleshipState): void {
  for (const id of state.playerIds) {
    const fleet = state.fleets[id];
    if (!allShipsPlaced(fleet)) autoPlaceFleet(fleet, state.gridSize);
    state.ready[id] = true;
  }
}

function finishGame(state: BattleshipState, winnerId: string): BattleshipState {
  state.winnerId = winnerId;
  state.phase = "ended";
  state.timerEndsAt = null;
  state.roundScores = computeBattleshipScores(state);
  return state;
}

function resolveRoyaleReveal(state: BattleshipState): BattleshipState {
  const shots = Object.values(state.pendingShots);
  const before = new Set(alivePlayers(state));
  state.lastReveal = resolveRoyaleRound(state, shots);
  const after = alivePlayers(state);
  const eliminated = [...before].filter((id) => !after.includes(id));
  const betPayouts = resolveBets(state, eliminated);
  for (const [id, amt] of Object.entries(betPayouts)) {
    state.roundScores[id] = (state.roundScores[id] ?? 0) + amt;
  }
  state.pendingShots = {};
  state.bets = [];

  if (after.length <= 1) {
    return finishGame(state, after[0] ?? state.playerIds[0]);
  }
  state.phase = "reveal";
  state.timerEndsAt = Date.now() + REVEAL_MS;
  state.timerTotalMs = REVEAL_MS;
  return state;
}

function allFired(state: BattleshipState): boolean {
  return alivePlayers(state).every((id) => state.pendingShots[id] !== undefined);
}

export function onBsAction(state: BattleshipState, playerId: string, action: GameAction): BattleshipState {
  if (action.kind === "advance") {
    if (state.phase === "instructions") return startPlacement(state);
    if (state.phase === "placement") {
      autoPlaceMissing(state);
      return state.mode === "duel" ? startDuelBattle(state) : startRoyaleBetting(state);
    }
    if (state.phase === "betting") return startRoyaleFire(state);
    if (state.phase === "fire") return resolveRoyaleReveal(state);
    if (state.phase === "reveal") return startRoyaleBetting(state);
    return state;
  }

  if (action.kind === "battleship_place" && state.phase === "placement") {
    const fleet = state.fleets[playerId];
    if (!fleet) return state;
    placeShip(fleet, state.gridSize, action.shipIndex, action.x, action.y, action.horizontal);
    return state;
  }

  if (action.kind === "battleship_ready" && state.phase === "placement") {
    const fleet = state.fleets[playerId];
    if (!fleet) return state;
    if (!allShipsPlaced(fleet)) autoPlaceFleet(fleet, state.gridSize);
    state.ready[playerId] = true;
    if (allReady(state)) {
      return state.mode === "duel" ? startDuelBattle(state) : startRoyaleBetting(state);
    }
    return state;
  }

  if (action.kind === "battleship_bet" && state.phase === "betting") {
    const amount = Math.min(MAX_BET, Math.max(0, action.amount));
    if (amount <= 0) return state;
    state.bets.push({ playerId, market: action.market, pick: action.pick, amount });
    return state;
  }

  if (action.kind === "battleship_fire") {
    if (state.phase === "fire" && state.mode === "royale") {
      const fleet = state.fleets[playerId];
      if (!fleet?.alive) return state;
      const alive = alivePlayers(state).filter((id) => id !== playerId);
      const targetId = action.targetId && alive.includes(action.targetId)
        ? action.targetId
        : alive[0];
      if (!targetId) return state;
      state.pendingShots[playerId] = { fromId: playerId, targetId, x: action.x, y: action.y };
      if (allFired(state)) return resolveRoyaleReveal(state);
      return state;
    }
    if (state.phase === "battle" && state.mode === "duel") {
      const turnId = state.playerIds[state.currentTurn];
      if (playerId !== turnId) return state;
      const defenderId = state.playerIds[1 - state.currentTurn];
      const target = state.fleets[defenderId];
      if (!target) return state;
      const { hit, sunk } = fireAt(target, action.x, action.y);
      state.lastReveal = [{ fromId: playerId, targetId: defenderId, x: action.x, y: action.y, hit, sunk }];
      if (fleetDestroyed(target)) return finishGame(state, playerId);
      state.currentTurn = 1 - state.currentTurn;
    }
  }

  return state;
}

export function onBsTick(state: BattleshipState): BattleshipState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "instructions") return startPlacement(state);
  if (state.phase === "placement") {
    autoPlaceMissing(state);
    return state.mode === "duel" ? startDuelBattle(state) : startRoyaleBetting(state);
  }
  if (state.phase === "betting") return startRoyaleFire(state);
  if (state.phase === "fire") return resolveRoyaleReveal(state);
  if (state.phase === "reveal") return startRoyaleBetting(state);
  return state;
}

function opponentShotsForTv(fleet: import("@party-games/shared").PlayerFleet, gridSize: number) {
  return Array.from({ length: gridSize }, (_, y) =>
    Array.from({ length: gridSize }, (_, x) => {
      const shot = fleet.shots.find((s) => s.x === x && s.y === y);
      if (!shot) return null;
      return shot.hit ? "hit" : "miss";
    }),
  );
}

export function bsHostView(state: BattleshipState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      mode: state.mode,
      gridSize: state.gridSize,
      playerIds: state.playerIds,
      alive: alivePlayers(state),
      currentTurn: state.mode === "duel" ? state.playerIds[state.currentTurn] : null,
      fleets: state.playerIds.map((id) => ({
        id,
        alive: state.fleets[id].alive,
        targetGrid: opponentShotsForTv(state.fleets[id], state.gridSize),
      })),
      lastReveal: state.lastReveal,
      winnerId: state.winnerId,
      roundScores: state.roundScores,
    },
  };
}

export function bsPlayerView(state: BattleshipState, playerId: string) {
  const fleet = state.fleets[playerId];
  const opponentId = state.playerIds.find((id) => id !== playerId);
  const opponent = opponentId ? state.fleets[opponentId] : null;
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      mode: state.mode,
      gridSize: state.gridSize,
      alive: alivePlayers(state),
      currentTurn: state.mode === "duel" ? state.playerIds[state.currentTurn] : null,
      opponentId,
      lastReveal: state.lastReveal,
      playerIds: state.playerIds,
    },
    playerData: {
      fleet: fleet?.ships ?? [],
      ownShots: fleet?.shots ?? [],
      opponentShots: opponent?.shots ?? [],
      ready: state.ready[playerId] ?? false,
      myTurn: state.mode === "duel" ? state.playerIds[state.currentTurn] === playerId : fleet?.alive,
      placed: fleet ? allShipsPlaced(fleet) : false,
      pendingShot: state.pendingShots[playerId] ?? null,
    },
  };
}
