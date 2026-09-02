export type Cell = null | "x" | "o";
export type TttPhase = "instructions" | "playing" | "match_end" | "round_end" | "ended";

export interface BracketMatch {
  a: string | null;
  b: string | null;
  winner: string | null;
  board: Cell[];
  turn: "x" | "o";
  xPlayer: string | null;
  oPlayer: string | null;
}

export interface TicTacToeState {
  phase: TttPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  bracket: BracketMatch[];
  matchIndex: number;
  championId: string | null;
  roundScores: Record<string, number>;
  drawReplayCount: number;
}

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function emptyBoard(): Cell[] {
  return Array(9).fill(null);
}

export function checkWinner(board: Cell[]): "x" | "o" | "draw" | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a] as "x" | "o";
    }
  }
  if (board.every((c) => c !== null)) return "draw";
  return null;
}

export function findTttWinningCells(board: Cell[]): number[] | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return null;
}

export function buildBracket(playerIds: string[]): BracketMatch[] {
  const ids: (string | null)[] = [...playerIds];
  while (ids.length & (ids.length - 1)) ids.push(null);
  const matches: BracketMatch[] = [];
  for (let i = 0; i < ids.length; i += 2) {
    matches.push({
      a: ids[i],
      b: ids[i + 1],
      winner: null,
      board: emptyBoard(),
      turn: "x",
      xPlayer: ids[i],
      oPlayer: ids[i + 1],
    });
  }
  return matches;
}

export function createTicTacToeState(playerIds: string[]): TicTacToeState {
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    timerEndsAt: Date.now() + 4000,
    timerTotalMs: 4000,
    playerIds: [...playerIds],
    bracket: buildBracket(playerIds),
    matchIndex: 0,
    championId: null,
    roundScores: {},
    drawReplayCount: 0,
  };
}

export function currentMatch(state: TicTacToeState): BracketMatch | null {
  return state.bracket[state.matchIndex] ?? null;
}

export function applyMove(match: BracketMatch, cell: number): BracketMatch {
  if (cell < 0 || cell > 8 || match.board[cell] !== null) return match;
  const mark = match.turn;
  const board = [...match.board];
  board[cell] = mark;
  const result = checkWinner(board);
  const next: BracketMatch = { ...match, board, turn: mark === "x" ? "o" : "x" };
  if (result === "x" && match.xPlayer) next.winner = match.xPlayer;
  else if (result === "o" && match.oPlayer) next.winner = match.oPlayer;
  else if (result === "draw") next.winner = null;
  return next;
}

export function advanceBracket(state: TicTacToeState): TicTacToeState {
  const winners: (string | null)[] = state.bracket.map((m) => m.winner);
  if (winners.length === 1) {
    state.championId = winners[0];
    state.phase = "ended";
    state.timerEndsAt = null;
    state.roundScores = tttPlacementScores(state.playerIds, state.championId, state.bracket);
    return state;
  }
  const nextMatches: BracketMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] ?? null;
    if (!a && b) nextMatches.push({ a: b, b: null, winner: b, board: emptyBoard(), turn: "x", xPlayer: b, oPlayer: null });
    else if (a && !b) nextMatches.push({ a, b: null, winner: a, board: emptyBoard(), turn: "x", xPlayer: a, oPlayer: null });
    else nextMatches.push({ a, b, winner: null, board: emptyBoard(), turn: "x", xPlayer: a, oPlayer: b });
  }
  state.bracket = nextMatches;
  state.matchIndex = 0;
  state.phase = "playing";
  state.timerEndsAt = null;
  return state;
}

export function tttPlacementScores(
  playerIds: string[],
  championId: string | null,
  bracket: BracketMatch[],
): Record<string, number> {
  const scores: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));
  if (championId) scores[championId] = 1000;
  const runnerUps = bracket.filter((m) => m.winner && m.winner !== championId).map((m) => m.winner!);
  for (const id of runnerUps) scores[id] = (scores[id] ?? 0) + 500;
  for (const id of playerIds) {
    if (!scores[id]) scores[id] = 100;
  }
  return scores;
}

export function isPlayerTurn(match: BracketMatch, playerId: string): boolean {
  if (match.winner !== null) return false;
  if (match.turn === "x") return match.xPlayer === playerId;
  return match.oPlayer === playerId;
}

export function matchFinished(match: BracketMatch): boolean {
  if (match.winner !== null) return true;
  return checkWinner(match.board) !== null;
}
