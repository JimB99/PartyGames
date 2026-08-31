export type CfCell = null | "x" | "o";
export type FourInARowPhase = "instructions" | "playing" | "match_end" | "round_end" | "ended";

export const CF_COLS = 7;
export const CF_ROWS = 6;
export const CF_WIN_TARGET = 2;

export interface FourInARowState {
  phase: FourInARowPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  board: CfCell[][];
  currentPlayerIndex: number;
  championId: string | null;
  challengerId: string | null;
  championWins: number;
  challengerWins: number;
  winnerId: string | null;
  roundScores: Record<string, number>;
  winningCells: Array<{ row: number; col: number }> | null;
}

function emptyGrid(): CfCell[][] {
  return Array.from({ length: CF_ROWS }, () => Array(CF_COLS).fill(null));
}

export function createFourInARowState(playerIds: string[]): FourInARowState {
  const isKingOfHill = playerIds.length > 2;
  return {
    phase: "instructions",
    round: 1,
    maxRounds: isKingOfHill ? playerIds.length : 1,
    timerEndsAt: Date.now() + 4000,
    timerTotalMs: 4000,
    playerIds: [...playerIds],
    board: emptyGrid(),
    currentPlayerIndex: 0,
    championId: isKingOfHill ? playerIds[0] : playerIds[0] ?? null,
    challengerId: isKingOfHill ? playerIds[1] ?? null : playerIds[1] ?? null,
    championWins: 0,
    challengerWins: 0,
    winnerId: null,
    roundScores: {},
    winningCells: null,
  };
}

export function activePlayers(state: FourInARowState): [string, string] | null {
  if (state.playerIds.length === 2) {
    return [state.playerIds[0], state.playerIds[1]];
  }
  if (state.championId && state.challengerId) {
    return [state.championId, state.challengerId];
  }
  return null;
}

export function currentTurnPlayer(state: FourInARowState): string | null {
  const pair = activePlayers(state);
  if (!pair) return null;
  return state.currentPlayerIndex === 0 ? pair[0] : pair[1];
}

export function dropDisc(board: CfCell[][], col: number, mark: CfCell): { board: CfCell[][]; row: number } | null {
  if (col < 0 || col >= CF_COLS || mark === null) return null;
  const next = board.map((r) => [...r]);
  for (let r = CF_ROWS - 1; r >= 0; r--) {
    if (next[r][col] === null) {
      next[r][col] = mark;
      return { board: next, row: r };
    }
  }
  return null;
}

export function checkConnectFourWinner(board: CfCell[][]): CfCell | "draw" | null {
  const cells = findConnectFourWinningCells(board);
  if (cells) return board[cells[0].row][cells[0].col];
  if (board[0].every((c) => c !== null)) return "draw";
  return null;
}

export function findConnectFourWinningCells(
  board: CfCell[][],
): Array<{ row: number; col: number }> | null {
  const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]] as const;
  for (let r = 0; r < CF_ROWS; r++) {
    for (let c = 0; c < CF_COLS; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      for (const [dc, dr] of dirs) {
        const run: Array<{ row: number; col: number }> = [{ row: r, col: c }];
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= CF_ROWS || nc < 0 || nc >= CF_COLS) break;
          if (board[nr][nc] !== cell) break;
          run.push({ row: nr, col: nc });
        }
        if (run.length >= 4) return run;
      }
    }
  }
  return null;
}

export function markForPlayer(state: FourInARowState, playerId: string): CfCell {
  const pair = activePlayers(state);
  if (!pair) return "x";
  return playerId === pair[0] ? "x" : "o";
}

export function resetBoard(state: FourInARowState): void {
  state.board = emptyGrid();
  state.currentPlayerIndex = 0;
  state.winnerId = null;
  state.winningCells = null;
}

export function nextChallenger(state: FourInARowState): string | null {
  const idx = state.playerIds.indexOf(state.challengerId ?? "");
  for (let i = 1; i < state.playerIds.length; i++) {
    const next = state.playerIds[(idx + i) % state.playerIds.length];
    if (next !== state.championId) return next;
  }
  return null;
}

export function computeCfRoundScores(state: FourInARowState): Record<string, number> {
  const scores: Record<string, number> = Object.fromEntries(state.playerIds.map((id) => [id, 0]));
  if (state.winnerId) scores[state.winnerId] = 1000;
  for (const id of state.playerIds) {
    if (!scores[id]) scores[id] = 200;
  }
  return scores;
}
