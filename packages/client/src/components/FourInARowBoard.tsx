import type { CfCell } from "@party-games/shared";
import { CF_COLS } from "@party-games/shared";

export function FourInARowBoard({
  board,
  onColumnClick,
  disabled,
  markColors,
  highlightedCells,
}: {
  board: CfCell[][];
  onColumnClick?: (col: number) => void;
  disabled?: boolean;
  markColors?: { x: string; o: string };
  highlightedCells?: Array<{ row: number; col: number }>;
}) {
  const colorX = markColors?.x ?? "#ef4444";
  const colorO = markColors?.o ?? "#eab308";
  const highlightSet = new Set(
    (highlightedCells ?? []).map((c) => `${c.row},${c.col}`),
  );
  return (
    <div className="inline-flex w-full max-w-[min(100%,20rem)] flex-col gap-1" data-testid="four-in-a-row-board">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${CF_COLS}, 1fr)` }}>
        {Array.from({ length: CF_COLS }, (_, col) => (
          <button
            key={col}
            type="button"
            disabled={disabled || board[0][col] !== null}
            onClick={() => onColumnClick?.(col)}
            data-testid={`four-in-a-row-col-${col}`}
            className="h-8 rounded bg-zinc-700 text-xs font-bold hover:bg-zinc-600 disabled:opacity-30"
          >
            ▼
          </button>
        ))}
      </div>
      <div
        className="grid gap-1 rounded-xl bg-blue-900/40 p-2"
        style={{ gridTemplateColumns: `repeat(${CF_COLS}, 1fr)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`aspect-square w-full rounded-full border ${
                highlightSet.has(`${r},${c}`) ? "border-yellow-300 ring-2 ring-yellow-400" : "border-blue-800"
              }`}
              style={{
                backgroundColor: cell === "x" ? colorX : cell === "o" ? colorO : "#1e3a5f",
              }}
            />
          )),
        )}
      </div>
    </div>
  );
}
