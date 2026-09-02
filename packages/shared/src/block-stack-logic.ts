import { rankPointsForPlace } from "./trail-dash-options.js";

export type BlockStackPhase = "instructions" | "playing" | "round_end" | "ended";
export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type BlockStackInput =
  | "left"
  | "right"
  | "rotate_cw"
  | "rotate_ccw"
  | "soft_drop"
  | "hard_drop"
  | "hold";

export const BLOCK_STACK_COLS = 8;
export const BLOCK_STACK_ROWS = 16;
export const BLOCK_STACK_MAX_ROUNDS = 3;
export const GRAVITY_INTERVAL_TICKS = 20;
export const LOCK_DELAY_TICKS = 20;
export const LINE_SCORES = [0, 100, 300, 500, 800] as const;

const PIECES: PieceKind[] = ["I", "O", "T", "S", "Z", "J", "L"];

const SHAPES: Record<PieceKind, number[][][]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

export interface ActivePiece {
  kind: PieceKind;
  rotation: number;
  x: number;
  y: number;
}

export interface BlockStackPlayer {
  id: string;
  board: number[][];
  active: ActivePiece | null;
  next: PieceKind;
  hold: PieceKind | null;
  canHold: boolean;
  alive: boolean;
  score: number;
  lines: number;
  deathRank: number | null;
  lockTicks: number;
  gravityTicks: number;
  bag: PieceKind[];
}

export interface BlockStackState {
  phase: BlockStackPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  players: BlockStackPlayer[];
  deathOrder: string[];
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  roundWinner: string | null;
}

function emptyBoard(): number[][] {
  return Array.from({ length: BLOCK_STACK_ROWS }, () => Array(BLOCK_STACK_COLS).fill(0));
}

function shuffleBag(): PieceKind[] {
  const bag = [...PIECES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function drawPiece(bag: PieceKind[]): { piece: PieceKind; bag: PieceKind[] } {
  let nextBag = bag;
  if (nextBag.length === 0) nextBag = shuffleBag();
  const [piece, ...rest] = nextBag;
  return { piece, bag: rest };
}

function shapeCells(piece: ActivePiece): Array<{ x: number; y: number }> {
  const shape = SHAPES[piece.kind][piece.rotation % SHAPES[piece.kind].length];
  const cells: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) cells.push({ x: piece.x + c, y: piece.y + r });
    }
  }
  return cells;
}

function pieceValue(kind: PieceKind): number {
  return PIECES.indexOf(kind) + 1;
}

export function canPlace(board: number[][], piece: ActivePiece): boolean {
  for (const { x, y } of shapeCells(piece)) {
    if (x < 0 || x >= BLOCK_STACK_COLS || y >= BLOCK_STACK_ROWS) return false;
    if (y >= 0 && board[y][x] !== 0) return false;
  }
  return true;
}

function lockPiece(player: BlockStackPlayer): void {
  if (!player.active) return;
  const val = pieceValue(player.active.kind);
  for (const { x, y } of shapeCells(player.active)) {
    if (y >= 0 && y < BLOCK_STACK_ROWS && x >= 0 && x < BLOCK_STACK_COLS) {
      player.board[y][x] = val;
    }
  }
  player.active = null;
  player.lockTicks = 0;
  player.canHold = true;
}

function clearLines(player: BlockStackPlayer): number {
  let cleared = 0;
  for (let r = BLOCK_STACK_ROWS - 1; r >= 0; r--) {
    if (player.board[r].every((c) => c !== 0)) {
      player.board.splice(r, 1);
      player.board.unshift(Array(BLOCK_STACK_COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared > 0) {
    player.lines += cleared;
    player.score += LINE_SCORES[cleared] ?? cleared * 200;
  }
  return cleared;
}

function spawnPiece(player: BlockStackPlayer): boolean {
  const drawn = drawPiece(player.bag);
  player.bag = drawn.bag;
  const kind = player.next;
  player.next = drawn.piece;
  const piece: ActivePiece = { kind, rotation: 0, x: 2, y: -1 };
  if (!canPlace(player.board, piece)) {
    player.alive = false;
    return false;
  }
  player.active = piece;
  player.lockTicks = 0;
  player.gravityTicks = 0;
  return true;
}

function tryMove(player: BlockStackPlayer, dx: number, dy: number): boolean {
  if (!player.active || !player.alive) return false;
  const moved = { ...player.active, x: player.active.x + dx, y: player.active.y + dy };
  if (!canPlace(player.board, moved)) return false;
  player.active = moved;
  if (dy !== 0) player.lockTicks = 0;
  return true;
}

function tryRotate(player: BlockStackPlayer, dir: 1 | -1): boolean {
  if (!player.active || !player.alive) return false;
  const maxRot = SHAPES[player.active.kind].length;
  const rotated = { ...player.active, rotation: (player.active.rotation + dir + maxRot) % maxRot };
  if (canPlace(player.board, rotated)) {
    player.active = rotated;
    player.lockTicks = 0;
    return true;
  }
  for (const kick of [-1, 1, -2, 2]) {
    const kicked = { ...rotated, x: rotated.x + kick };
    if (canPlace(player.board, kicked)) {
      player.active = kicked;
      player.lockTicks = 0;
      return true;
    }
  }
  return false;
}

function isGrounded(player: BlockStackPlayer): boolean {
  if (!player.active) return true;
  return !canPlace(player.board, { ...player.active, y: player.active.y + 1 });
}

function eliminatePlayer(state: BlockStackState, player: BlockStackPlayer): void {
  if (!player.alive || player.deathRank !== null) return;
  player.alive = false;
  player.deathRank = state.deathOrder.length + 1;
  state.deathOrder.push(player.id);
}

function aliveCount(state: BlockStackState): number {
  return state.players.filter((p) => p.alive).length;
}

export function createBlockStackPlayer(id: string): BlockStackPlayer {
  const drawn = drawPiece([]);
  return {
    id,
    board: emptyBoard(),
    active: null,
    next: drawn.piece,
    hold: null,
    canHold: true,
    alive: true,
    score: 0,
    lines: 0,
    deathRank: null,
    lockTicks: 0,
    gravityTicks: 0,
    bag: drawn.bag,
  };
}

export function createBlockStackState(playerIds: string[]): BlockStackState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds: BLOCK_STACK_MAX_ROUNDS,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    players: playerIds.map(createBlockStackPlayer),
    deathOrder: [],
    roundScores: {},
    cumulativeScores: {},
    roundWinner: null,
  };
}

export function resetBlockStackRound(state: BlockStackState, playerIds: string[]): BlockStackState {
  const fresh: BlockStackState = {
    ...state,
    phase: "playing",
    timerEndsAt: null,
    timerTotalMs: null,
    players: playerIds.map(createBlockStackPlayer),
    deathOrder: [],
    roundWinner: null,
  };
  for (const p of fresh.players) {
    spawnPiece(p);
  }
  return fresh;
}

export function startBlockStackPlaying(state: BlockStackState): BlockStackState {
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  for (const p of state.players) {
    spawnPiece(p);
  }
  return state;
}

function tryHold(player: BlockStackPlayer): boolean {
  if (!player.active || !player.canHold || !player.alive) return false;
  const current = player.active;
  if (player.hold === null) {
    const drawn = drawPiece(player.bag);
    player.bag = drawn.bag;
    const nextPiece: ActivePiece = { kind: player.next, rotation: 0, x: 2, y: -1 };
    player.hold = current.kind;
    player.next = drawn.piece;
    if (!canPlace(player.board, nextPiece)) return false;
    player.active = nextPiece;
  } else {
    const swapped: ActivePiece = { kind: player.hold, rotation: 0, x: 2, y: -1 };
    if (!canPlace(player.board, swapped)) return false;
    player.hold = current.kind;
    player.active = swapped;
  }
  player.canHold = false;
  player.lockTicks = 0;
  return true;
}

function ghostPiece(player: BlockStackPlayer): ActivePiece | null {
  if (!player.active || !player.alive) return null;
  let ghost = { ...player.active };
  while (canPlace(player.board, { ...ghost, y: ghost.y + 1 })) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost;
}

export function applyBlockStackInput(player: BlockStackPlayer, input: BlockStackInput): void {
  if (!player.alive) return;
  switch (input) {
    case "hold":
      tryHold(player);
      break;
    case "left":
      tryMove(player, -1, 0);
      break;
    case "right":
      tryMove(player, 1, 0);
      break;
    case "rotate_cw":
      tryRotate(player, 1);
      break;
    case "rotate_ccw":
      tryRotate(player, -1);
      break;
    case "soft_drop":
      if (!tryMove(player, 0, 1) && player.active) {
        player.lockTicks = LOCK_DELAY_TICKS;
      }
      break;
    case "hard_drop": {
      while (tryMove(player, 0, 1)) {
        player.score += 2;
      }
      if (player.active) {
        lockPiece(player);
        clearLines(player);
        if (!spawnPiece(player)) {
          /* eliminated in spawn */
        }
      }
      break;
    }
  }
}

function tickPlayer(state: BlockStackState, player: BlockStackPlayer): void {
  if (!player.alive) return;
  if (!player.active) {
    if (!spawnPiece(player)) eliminatePlayer(state, player);
    return;
  }

  player.gravityTicks++;
  if (player.gravityTicks >= GRAVITY_INTERVAL_TICKS) {
    player.gravityTicks = 0;
    if (!tryMove(player, 0, 1)) {
      player.lockTicks++;
      if (player.lockTicks >= LOCK_DELAY_TICKS) {
        lockPiece(player);
        clearLines(player);
        if (!spawnPiece(player)) eliminatePlayer(state, player);
      }
    } else {
      player.lockTicks = 0;
    }
  } else if (isGrounded(player)) {
    player.lockTicks++;
    if (player.lockTicks >= LOCK_DELAY_TICKS) {
      lockPiece(player);
      clearLines(player);
      if (!spawnPiece(player)) eliminatePlayer(state, player);
    }
  }
}

export function tickBlockStackState(state: BlockStackState): BlockStackState {
  if (state.phase !== "playing") return state;
  for (const p of state.players) tickPlayer(state, p);

  const alive = aliveCount(state);
  if (alive <= 1 && state.players.length > 1) {
    const survivor = state.players.find((p) => p.alive);
    if (survivor && survivor.deathRank === null) {
      survivor.deathRank = state.players.length;
      state.deathOrder.unshift(survivor.id);
    }
    state.roundWinner = state.deathOrder[0] ?? null;
    state.roundScores = computeBlockStackRoundScores(state);
    state.phase = "round_end";
    state.timerEndsAt = Date.now() + 6000;
    state.timerTotalMs = 6000;
  } else if (alive === 0 && state.players.length > 1) {
    state.roundWinner = state.deathOrder[state.deathOrder.length - 1] ?? null;
    state.roundScores = computeBlockStackRoundScores(state);
    state.phase = "round_end";
    state.timerEndsAt = Date.now() + 6000;
    state.timerTotalMs = 6000;
  } else if (alive === 0 && state.players.length === 1) {
    state.phase = "round_end";
    state.timerEndsAt = Date.now() + 6000;
    state.timerTotalMs = 6000;
  }
  return state;
}

export function computeBlockStackRoundScores(state: BlockStackState): Record<string, number> {
  const scores: Record<string, number> = {};
  const order = [...state.deathOrder];
  for (let i = 0; i < order.length; i++) {
    const id = order[i];
    const player = state.players.find((p) => p.id === id);
    const rankPts = rankPointsForPlace(i + 1, 1);
    const bonus = Math.floor((player?.score ?? 0) / 10);
    scores[id] = rankPts + bonus;
  }
  return scores;
}

export function getMergedBoard(player: BlockStackPlayer): number[][] {
  const merged = player.board.map((row) => [...row]);
  const ghost = ghostPiece(player);
  if (ghost) {
    const val = pieceValue(ghost.kind);
    for (const { x, y } of shapeCells(ghost)) {
      if (y >= 0 && y < BLOCK_STACK_ROWS && x >= 0 && x < BLOCK_STACK_COLS && merged[y][x] === 0) {
        merged[y][x] = val + 10;
      }
    }
  }
  if (!player.active) return merged;
  const val = pieceValue(player.active.kind);
  for (const { x, y } of shapeCells(player.active)) {
    if (y >= 0 && y < BLOCK_STACK_ROWS && x >= 0 && x < BLOCK_STACK_COLS) {
      merged[y][x] = val;
    }
  }
  return merged;
}

export function blockStackGridLayout(count: number): { cols: number; rows: number } {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  return { cols: 4, rows: 2 };
}
