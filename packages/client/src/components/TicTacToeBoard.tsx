import type { Cell } from "@party-games/shared";

export function TicTacToeBoard({
  board,
  onCellClick,
  disabled,
  myMark,
  markColors,
}: {
  board: Cell[];
  onCellClick?: (cell: number) => void;
  disabled?: boolean;
  myMark?: "x" | "o" | null;
  markColors?: { x: string; o: string };
}) {
  const colorX = markColors?.x ?? "#4ECDC4";
  const colorO = markColors?.o ?? "#FF6B6B";
  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      {board.map((cell, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled || cell !== null}
          onClick={() => onCellClick?.(i)}
          className="flex h-20 w-20 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800 text-4xl font-black disabled:opacity-60"
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
