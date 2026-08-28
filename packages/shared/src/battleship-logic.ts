export type BattleshipPhase =
  | "instructions"
  | "placement"
  | "betting"
  | "fire"
  | "reveal"
  | "battle"
  | "round_end"
  | "ended";

export type BattleshipMode = "duel" | "royale";
export type CellState = "empty" | "ship" | "hit" | "miss";
export type BetMarket = "next_elimination" | "most_hits";

export const DUEL_SIZE = 10;
export const ROYALE_SIZE = 8;
export const DUEL_FLEET = [5, 4, 3, 3, 2];
export const ROYALE_FLEET = [5, 4, 3, 2];
export const MAX_BET = 500;
export const BET_PAYOUT_MULT = 2;

export interface Ship {
  length: number;
  cells: Array<{ x: number; y: number }>;
  hits: number;
}

export interface PlayerFleet {
  id: string;
  ships: Ship[];
  shots: Array<{ x: number; y: number; hit: boolean; targetId?: string }>;
  alive: boolean;
  hitsThisRound: number;
}

export interface Bet {
  playerId: string;
  market: BetMarket;
  pick: string;
  amount: number;
}

export interface RoyaleShot {
  fromId: string;
  targetId: string;
  x: number;
  y: number;
}

export interface BattleshipState {
  phase: BattleshipPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  mode: BattleshipMode;
  gridSize: number;
  fleets: Record<string, PlayerFleet>;
  playerIds: string[];
  currentTurn: number;
  pendingShots: Record<string, RoyaleShot>;
  bets: Bet[];
  lastReveal: Array<{ fromId: string; targetId: string; x: number; y: number; hit: boolean; sunk: boolean }>;
  winnerId: string | null;
  roundScores: Record<string, number>;
  ready: Record<string, boolean>;
}

function emptyShips(lengths: number[]): Ship[] {
  return lengths.map((length) => ({ length, cells: [], hits: 0 }));
}

export function createBattleshipState(playerIds: string[]): BattleshipState {
  const mode: BattleshipMode = playerIds.length === 2 ? "duel" : "royale";
  const gridSize = mode === "duel" ? DUEL_SIZE : ROYALE_SIZE;
  const fleetLengths = mode === "duel" ? DUEL_FLEET : ROYALE_FLEET;
  const fleets: Record<string, PlayerFleet> = {};
  for (const id of playerIds) {
    fleets[id] = { id, ships: emptyShips(fleetLengths), shots: [], alive: true, hitsThisRound: 0 };
  }
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    mode,
    gridSize,
    fleets,
    playerIds: [...playerIds],
    currentTurn: 0,
    pendingShots: {},
    bets: [],
    lastReveal: [],
    winnerId: null,
    roundScores: {},
    ready: {},
  };
}

export function shipFits(
  gridSize: number,
  ships: Ship[],
  shipIndex: number,
  x: number,
  y: number,
  horizontal: boolean,
): boolean {
  const length = ships[shipIndex].length;
  const cells: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < length; i++) {
    const cx = horizontal ? x + i : x;
    const cy = horizontal ? y : y + i;
    if (cx < 0 || cy < 0 || cx >= gridSize || cy >= gridSize) return false;
    cells.push({ x: cx, y: cy });
  }
  const occupied = new Set(ships.flatMap((s, idx) => (idx === shipIndex ? [] : s.cells.map((c) => `${c.x},${c.y}`))));
  for (const c of cells) {
    if (occupied.has(`${c.x},${c.y}`)) return false;
  }
  return true;
}

export function placeShip(
  fleet: PlayerFleet,
  gridSize: number,
  shipIndex: number,
  x: number,
  y: number,
  horizontal: boolean,
): boolean {
  if (shipIndex < 0 || shipIndex >= fleet.ships.length) return false;
  if (!shipFits(gridSize, fleet.ships, shipIndex, x, y, horizontal)) return false;
  const length = fleet.ships[shipIndex].length;
  const cells: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < length; i++) {
    cells.push({ x: horizontal ? x + i : x, y: horizontal ? y : y + i });
  }
  fleet.ships[shipIndex].cells = cells;
  return true;
}

export function allShipsPlaced(fleet: PlayerFleet): boolean {
  return fleet.ships.every((s) => s.cells.length === s.length);
}

export function autoPlaceFleet(fleet: PlayerFleet, gridSize: number): void {
  for (let i = 0; i < fleet.ships.length; i++) {
    let placed = false;
    for (let y = 0; y < gridSize && !placed; y++) {
      for (let x = 0; x < gridSize && !placed; x++) {
        for (const horizontal of [true, false]) {
          if (placeShip(fleet, gridSize, i, x, y, horizontal)) {
            placed = true;
            break;
          }
        }
      }
    }
  }
}

function findShipAt(fleet: PlayerFleet, x: number, y: number): Ship | null {
  for (const ship of fleet.ships) {
    if (ship.cells.some((c) => c.x === x && c.y === y)) return ship;
  }
  return null;
}

export function fireAt(fleet: PlayerFleet, x: number, y: number): { hit: boolean; sunk: boolean } {
  const ship = findShipAt(fleet, x, y);
  const already = fleet.shots.some((s) => s.x === x && s.y === y);
  if (already) return { hit: false, sunk: false };
  if (!ship) {
    fleet.shots.push({ x, y, hit: false });
    return { hit: false, sunk: false };
  }
  ship.hits++;
  fleet.shots.push({ x, y, hit: true });
  const sunk = ship.hits >= ship.length;
  return { hit: true, sunk };
}

export function fleetDestroyed(fleet: PlayerFleet): boolean {
  return fleet.ships.every((s) => s.hits >= s.length);
}

export function shotCellState(fleet: PlayerFleet, x: number, y: number): CellState {
  const shot = fleet.shots.find((s) => s.x === x && s.y === y);
  if (!shot) return "empty";
  return shot.hit ? "hit" : "miss";
}

export function resolveRoyaleRound(
  state: BattleshipState,
  shots: RoyaleShot[],
): Array<{ fromId: string; targetId: string; x: number; y: number; hit: boolean; sunk: boolean }> {
  const results: Array<{ fromId: string; targetId: string; x: number; y: number; hit: boolean; sunk: boolean }> = [];
  for (const id of state.playerIds) state.fleets[id].hitsThisRound = 0;

  for (const shot of shots) {
    const target = state.fleets[shot.targetId];
    if (!target?.alive) continue;
    const { hit, sunk } = fireAt(target, shot.x, shot.y);
    if (hit) state.fleets[shot.fromId].hitsThisRound++;
    results.push({ ...shot, hit, sunk });
    if (fleetDestroyed(target)) target.alive = false;
  }
  return results;
}

export function alivePlayers(state: BattleshipState): string[] {
  return state.playerIds.filter((id) => state.fleets[id]?.alive);
}

export function resolveBets(state: BattleshipState, eliminated: string[]): Record<string, number> {
  const payouts: Record<string, number> = {};
  const mostHits = [...state.playerIds].sort(
    (a, b) => (state.fleets[b]?.hitsThisRound ?? 0) - (state.fleets[a]?.hitsThisRound ?? 0),
  )[0];

  for (const bet of state.bets) {
    let won = false;
    if (bet.market === "next_elimination" && eliminated.includes(bet.pick)) won = true;
    if (bet.market === "most_hits" && bet.pick === mostHits) won = true;
    if (won) {
      payouts[bet.playerId] = (payouts[bet.playerId] ?? 0) + bet.amount * BET_PAYOUT_MULT;
    }
  }
  return payouts;
}

export function computeBattleshipScores(state: BattleshipState): Record<string, number> {
  const scores: Record<string, number> = Object.fromEntries(state.playerIds.map((id) => [id, 0]));
  if (state.winnerId) scores[state.winnerId] = 1000;
  const alive = alivePlayers(state);
  for (const id of alive) {
    if (id !== state.winnerId) scores[id] = 500;
  }
  for (const id of state.playerIds) {
    if (!scores[id]) scores[id] = 100;
  }
  return scores;
}
