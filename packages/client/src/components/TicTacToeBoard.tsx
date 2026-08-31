import type { Cell } from "@party-games/shared";

export function TicTacToeBoard({
  board,
  onCellClick,
  disabled,
  myMark,
  markColors,
  winningCells,
}: {
  board: Cell[];
  onCellClick?: (cell: number) => void;
  disabled?: boolean;
  myMark?: "x" | "o" | null;
  markColors?: { x: string; o: string };
  winningCells?: number[];
}) {
  const colorX = markColors?.x ?? "#4ECDC4";
  const colorO = markColors?.o ?? "#FF6B6B";
  const winSet = new Set(winningCells ?? []);
  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto" data-testid="tic-tac-toe-board">
      {board.map((cell, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled || cell !== null}
          onClick={() => onCellClick?.(i)}
          data-testid={`tic-tac-toe-cell-${i}`}
          className={`flex h-20 w-20 items-center justify-center rounded-xl border bg-zinc-800 text-4xl font-black disabled:opacity-60 ${
            winSet.has(i) ? "border-yellow-400 ring-2 ring-yellow-400/80" : "border-zinc-600"
          }`}
          style={{ color: cell === "x" ? colorX : cell === "o" ? colorO : undefined }}
        >
          {cell === "x" ? "✕" : cell === "o" ? "○" : ""}
        </button>
      ))}
      {myMark && (
        <p className="col-span-3 text-center text-sm text-zinc-400">You are {myMark === "x" ? "✕" : "○"}</p>
      )}
    </div>
  );
}
