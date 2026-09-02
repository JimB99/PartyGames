import { rankPointsForPlace } from "./trail-dash-options.js";

export const GRID_BLAST_COLS = 11;
export const GRID_BLAST_ROWS = 9;
export const CELL_EMPTY = 0;
export const CELL_HARD = 1;
export const CELL_SOFT = 2;

export type GridBlastInput = "up" | "down" | "left" | "right" | "bomb";
export type GridBlastPowerUpKind = "bomb" | "range" | "speed" | "kick";

export interface GridBlastPowerUp {
  x: number;
  y: number;
  kind: GridBlastPowerUpKind;
}

export interface GridBlastBomb {
  x: number;
  y: number;
  ownerId: string;
  fuseTicks: number;
  range: number;
  exploded: boolean;
  ownerImmunityTicks: number;
  kickDx: number;
  kickDy: number;
}

export interface GridBlastPlayer {
  id: string;
  x: number;
  y: number;
  alive: boolean;
  maxBombs: number;
  blastRange: number;
  speedTicks: number;
  lastMoveTick: number;
  canKick: boolean;
  deathRank: number | null;
  score: number;
}

export interface GridBlastState {
  grid: number[][];
  players: GridBlastPlayer[];
  bombs: GridBlastBomb[];
  fires: Array<{ x: number; y: number; ticks: number }>;
  powerUps: GridBlastPowerUp[];
  deathOrder: string[];
  tick: number;
}

const FUSE_TICKS = 55;
const OWNER_IMMUNITY_TICKS = 25;
const FIRE_TICKS = 15;
const MOVE_COOLDOWN = 4;

export function createClassicGrid(cols = GRID_BLAST_COLS, rows = GRID_BLAST_ROWS): number[][] {
  const grid: number[][] = [];
  for (let y = 0; y < rows; y++) {
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) row.push(CELL_HARD);
      else if (x % 2 === 0 && y % 2 === 0) row.push(CELL_HARD);
      else if (Math.random() < 0.55) row.push(CELL_SOFT);
      else row.push(CELL_EMPTY);
    }
    grid.push(row);
  }
  return grid;
}

function spawnPositions(count: number, cols: number, rows: number): Array<{ x: number; y: number }> {
  const corners = [
    { x: 1, y: 1 },
    { x: cols - 2, y: 1 },
    { x: 1, y: rows - 2 },
    { x: cols - 2, y: rows - 2 },
    { x: Math.floor(cols / 2), y: 1 },
    { x: 1, y: Math.floor(rows / 2) },
    { x: cols - 2, y: Math.floor(rows / 2) },
    { x: Math.floor(cols / 2), y: rows - 2 },
  ];
  return corners.slice(0, count);
}

export function createGridBlastState(playerIds: string[]): GridBlastState {
  const grid = createClassicGrid();
  const spawns = spawnPositions(playerIds.length, GRID_BLAST_COLS, GRID_BLAST_ROWS);
  for (const s of spawns) {
    grid[s.y][s.x] = CELL_EMPTY;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const nx = s.x + dx;
      const ny = s.y + dy;
      if (grid[ny]?.[nx] === CELL_SOFT) grid[ny][nx] = CELL_EMPTY;
    }
  }
  return {
    grid,
    players: playerIds.map((id, i) => ({
      id,
      x: spawns[i].x,
      y: spawns[i].y,
      alive: true,
      maxBombs: 1,
      blastRange: 2,
      speedTicks: MOVE_COOLDOWN,
      lastMoveTick: -MOVE_COOLDOWN,
      canKick: false,
      deathRank: null,
      score: 0,
    })),
    bombs: [],
    fires: [],
    powerUps: [],
    deathOrder: [],
    tick: 0,
  };
}

const POWER_UP_KINDS: GridBlastPowerUpKind[] = ["bomb", "range", "speed", "kick"];

function collectPowerUp(state: GridBlastState, player: GridBlastPlayer): void {
  const idx = state.powerUps.findIndex((p) => p.x === player.x && p.y === player.y);
  if (idx < 0) return;
  const pu = state.powerUps[idx];
  state.powerUps.splice(idx, 1);
  switch (pu.kind) {
    case "bomb":
      player.maxBombs += 1;
      break;
    case "range":
      player.blastRange += 1;
      break;
    case "speed":
      player.speedTicks = Math.max(3, player.speedTicks - 1);
      break;
    case "kick":
      player.canKick = true;
      break;
  }
}

function inBounds(x: number, y: number, grid: number[][]): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

function cellWalkable(grid: number[][], x: number, y: number): boolean {
  if (!inBounds(x, y, grid)) return false;
  return grid[y][x] !== CELL_HARD && grid[y][x] !== CELL_SOFT;
}

function bombAt(bombs: GridBlastBomb[], x: number, y: number): GridBlastBomb | undefined {
  return bombs.find((b) => !b.exploded && b.x === x && b.y === y);
}

function trySlideBomb(state: GridBlastState, bomb: GridBlastBomb, dx: number, dy: number): boolean {
  const nx = bomb.x + dx;
  const ny = bomb.y + dy;
  if (!cellWalkable(state.grid, nx, ny)) return false;
  if (bombAt(state.bombs, nx, ny)) return false;
  bomb.x = nx;
  bomb.y = ny;
  return true;
}

const DIRS: Record<GridBlastInput, { dx: number; dy: number } | null> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
  bomb: null,
};

export function applyGridBlastInput(state: GridBlastState, playerId: string, input: GridBlastInput): GridBlastState {
  const player = state.players.find((p) => p.id === playerId);
  if (!player?.alive) return state;
  if (input === "bomb") {
    const active = state.bombs.filter((b) => b.ownerId === playerId && !b.exploded).length;
    if (active >= player.maxBombs) return state;
    if (state.bombs.some((b) => !b.exploded && b.x === player.x && b.y === player.y)) return state;
    state.bombs.push({
      x: player.x,
      y: player.y,
      ownerId: playerId,
      fuseTicks: FUSE_TICKS,
      range: player.blastRange,
      exploded: false,
      ownerImmunityTicks: OWNER_IMMUNITY_TICKS,
      kickDx: 0,
      kickDy: 0,
    });
    return state;
  }
  if (state.tick - player.lastMoveTick < player.speedTicks) return state;
  const dir = DIRS[input];
  if (!dir) return state;
  const nx = player.x + dir.dx;
  const ny = player.y + dir.dy;
  if (!cellWalkable(state.grid, nx, ny)) return state;
  const blocking = bombAt(state.bombs, nx, ny);
  if (blocking) {
    if (!player.canKick) return state;
    blocking.kickDx = dir.dx;
    blocking.kickDy = dir.dy;
    if (!trySlideBomb(state, blocking, dir.dx, dir.dy)) return state;
  }
  player.x = nx;
  player.y = ny;
  player.lastMoveTick = state.tick;
  collectPowerUp(state, player);
  return state;
}

function explodeBomb(state: GridBlastState, bomb: GridBlastBomb): void {
  if (bomb.exploded) return;
  bomb.exploded = true;
  const addFire = (x: number, y: number) => {
    state.fires.push({ x, y, ticks: FIRE_TICKS });
    const player = state.players.find((p) => p.alive && p.x === x && p.y === y);
    if (player) {
      const onOwnBomb =
        player.id === bomb.ownerId &&
        bomb.ownerImmunityTicks > 0 &&
        bomb.x === player.x &&
        bomb.y === player.y;
      if (!onOwnBomb) killPlayer(state, player.id);
    }
    const other = state.bombs.find((b) => !b.exploded && b.x === x && b.y === y);
    if (other) explodeBomb(state, other);
  };
  addFire(bomb.x, bomb.y);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    for (let i = 1; i <= bomb.range; i++) {
      const x = bomb.x + dx * i;
      const y = bomb.y + dy * i;
      if (!inBounds(x, y, state.grid)) break;
      if (state.grid[y][x] === CELL_HARD) break;
      if (state.grid[y][x] === CELL_SOFT) {
        state.grid[y][x] = CELL_EMPTY;
        maybeSpawnPowerUp(state, x, y);
        addFire(x, y);
        break;
      }
      addFire(x, y);
    }
  }
}

function maybeSpawnPowerUp(state: GridBlastState, x: number, y: number): void {
  if (Math.random() > 0.35) return;
  if (state.powerUps.some((p) => p.x === x && p.y === y)) return;
  const kind = POWER_UP_KINDS[Math.floor(Math.random() * POWER_UP_KINDS.length)];
  state.powerUps.push({ x, y, kind });
}

function killPlayer(state: GridBlastState, playerId: string): void {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || !player.alive) return;
  player.alive = false;
  player.deathRank = state.deathOrder.length + 1;
  state.deathOrder.push(playerId);
}

export function tickGridBlastState(state: GridBlastState): GridBlastState {
  state.tick += 1;
  for (const bomb of state.bombs) {
    if (bomb.exploded) continue;
    if (bomb.ownerImmunityTicks > 0) bomb.ownerImmunityTicks -= 1;
    if ((bomb.kickDx !== 0 || bomb.kickDy !== 0) && state.tick % 2 === 0) {
      if (!trySlideBomb(state, bomb, bomb.kickDx, bomb.kickDy)) {
        bomb.kickDx = 0;
        bomb.kickDy = 0;
      }
    }
    bomb.fuseTicks -= 1;
    if (bomb.fuseTicks <= 0) explodeBomb(state, bomb);
  }
  state.fires = state.fires
    .map((f) => ({ ...f, ticks: f.ticks - 1 }))
    .filter((f) => f.ticks > 0);
  state.bombs = state.bombs.filter((b) => !b.exploded || b.fuseTicks > -5);
  return state;
}

export function gridBlastAliveCount(state: GridBlastState): number {
  return state.players.filter((p) => p.alive).length;
}

export function finalizeGridBlastRound(state: GridBlastState): Record<string, number> {
  const remaining = state.players.filter((p) => p.alive && p.deathRank === null);
  for (const survivor of remaining) {
    survivor.deathRank = state.players.length;
    state.deathOrder.unshift(survivor.id);
  }
  return gridBlastRoundScores(state);
}

export function gridBlastRoundScores(state: GridBlastState): Record<string, number> {
  const scores: Record<string, number> = {};
  for (let i = 0; i < state.deathOrder.length; i++) {
    scores[state.deathOrder[i]] = rankPointsForPlace(i + 1, 1);
  }
  return scores;
}
