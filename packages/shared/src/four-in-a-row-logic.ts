import {
  activeBracketPlayers,
  advanceBracketWinners,
  buildSingleEliminationBracket,
  bracketMatchCount,
  nextPlayableMatchIndex,
  type ElimBracketMatch,
} from "./bracket-utils.js";

export type CfCell = null | "x" | "o";
export type FourInARowPhase = "instructions" | "playing" | "match_end" | "round_end" | "ended";

export const CF_COLS = 7;
export const CF_ROWS = 6;

export interface CfBracketMatch extends ElimBracketMatch {}

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
  bracket: CfBracketMatch[];
  matchIndex: number;
  winnerId: string | null;
  roundScores: Record<string, number>;
  winningCells: Array<{ row: number; col: number }> | null;
  drawReplayCount: number;
}

function emptyGrid(): CfCell[][] {
  return Array.from({ length: CF_ROWS }, () => Array(CF_COLS).fill(null));
}

export function buildCfBracket(playerIds: string[]): CfBracketMatch[] {
  return buildSingleEliminationBracket(playerIds);
}

export function cfBracketMatchCount(playerIds: string[]): number {
  return bracketMatchCount(playerIds);
}

export function createFourInARowState(playerIds: string[]): FourInARowState {
  const multi = playerIds.length > 2;
  return {
    phase: "instructions",
    round: 1,
    maxRounds: multi ? cfBracketMatchCount(playerIds) : 1,
    timerEndsAt: Date.now() + 4000,
    timerTotalMs: 4000,
    playerIds: [...playerIds],
    board: emptyGrid(),
    currentPlayerIndex: 0,
    championId: null,
    bracket: multi ? buildCfBracket(playerIds) : [],
    matchIndex: multi ? (nextPlayableMatchIndex(buildCfBracket(playerIds), 0) ?? 0) : 0,
    winnerId: null,
    roundScores: {},
    winningCells: null,
    drawReplayCount: 0,
  };
}

export function currentCfMatch(state: FourInARowState): CfBracketMatch | null {
  if (state.playerIds.length <= 2) {
    return { a: state.playerIds[0] ?? null, b: state.playerIds[1] ?? null, winner: null };
  }
  return state.bracket[state.matchIndex] ?? null;
}

export function activePlayers(state: FourInARowState): [string, string] | null {
  if (state.playerIds.length === 2) {
    return [state.playerIds[0], state.playerIds[1]];
  }
  return activeBracketPlayers(currentCfMatch(state));
}

export { nextPlayableMatchIndex };

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

export function advanceCfBracket(state: FourInARowState): FourInARowState {
  const nextBracket = advanceBracketWinners(state.bracket);
  if (nextBracket.length === 1 && nextBracket[0].winner) {
    state.championId = nextBracket[0].winner;
    state.winnerId = nextBracket[0].winner;
    state.phase = "ended";
    state.timerEndsAt = null;
    state.timerTotalMs = null;
    state.roundScores = computeCfRoundScores(state);
    return state;
  }
  state.bracket = nextBracket;
  state.matchIndex = nextPlayableMatchIndex(nextBracket, 0) ?? 0;
  state.phase = "playing";
  state.timerEndsAt = null;
  state.timerTotalMs = null;
  state.drawReplayCount = 0;
  return state;
}

export function computeCfRoundScores(state: FourInARowState): Record<string, number> {
  const scores: Record<string, number> = Object.fromEntries(state.playerIds.map((id) => [id, 200]));
  if (state.winnerId) scores[state.winnerId] = 1000;
  return scores;
}
