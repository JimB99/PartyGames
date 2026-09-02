import type { CfCell } from "@party-games/shared";
import { CF_COLS } from "@party-games/shared";
import { useEffect, useRef, useState } from "react";

function findNewChip(prev: CfCell[][], next: CfCell[][]): { row: number; col: number; mark: CfCell } | null {
  for (let r = 0; r < next.length; r++) {
    for (let c = 0; c < next[r].length; c++) {
      if (next[r][c] && !prev[r]?.[c]) {
        return { row: r, col: c, mark: next[r][c] };
      }
    }
  }
  return null;
}

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
  const highlightSet = new Set((highlightedCells ?? []).map((c) => `${c.row},${c.col}`));
  const prevBoard = useRef(board);
  const [dropAnim, setDropAnim] = useState<{ row: number; col: number; mark: CfCell } | null>(null);
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const chip = findNewChip(prevBoard.current, board);
    prevBoard.current = board;
    if (!chip || reducedMotion) {
      setDropAnim(null);
      return;
    }
    setDropAnim(chip);
    const timer = window.setTimeout(() => setDropAnim(null), 450);
    return () => window.clearTimeout(timer);
  }, [board, reducedMotion]);

  const chipColor = (mark: CfCell) => (mark === "x" ? colorX : mark === "o" ? colorO : "#1e3a5f");

  return (
    <div className="inline-flex w-full max-w-[min(100%,24rem)] flex-col gap-2" data-testid="four-in-a-row-board">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${CF_COLS}, 1fr)` }}>
        {Array.from({ length: CF_COLS }, (_, col) => (
          <button
            key={col}
            type="button"
            disabled={disabled || board[0][col] !== null}
            onClick={() => onColumnClick?.(col)}
            data-testid={`four-in-a-row-col-${col}`}
            className="min-h-11 rounded-lg bg-zinc-700 text-sm font-bold hover:bg-zinc-600 disabled:opacity-30 active:scale-95"
            aria-label={`Drop in column ${col + 1}`}
          >
            ▼
          </button>
        ))}
      </div>
      <div
        className="relative grid gap-1 rounded-xl bg-blue-900/40 p-2"
        style={{ gridTemplateColumns: `repeat(${CF_COLS}, 1fr)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isAnimCell = dropAnim?.row === r && dropAnim?.col === c;
            const showChip = cell || isAnimCell;
            const mark = isAnimCell ? dropAnim!.mark : cell;
            return (
              <div
                key={`${r}-${c}`}
                className={`relative aspect-square w-full overflow-hidden rounded-full border ${
                  highlightSet.has(`${r},${c}`) ? "border-yellow-300 ring-2 ring-yellow-400" : "border-blue-800"
                }`}
                style={{ backgroundColor: showChip ? "transparent" : "#1e3a5f" }}
              >
                {showChip && mark && (
                  <div
                    className={`absolute inset-0 rounded-full ${isAnimCell && !reducedMotion ? "four-in-a-row-drop" : ""}`}
                    style={{ backgroundColor: chipColor(mark) }}
                  />
                )}
              </div>
            );
          }),
        )}
      </div>
      <style>{`
        @keyframes fourInARowDrop {
          from { transform: translateY(-320%); }
          to { transform: translateY(0); }
        }
        .four-in-a-row-drop {
          animation: fourInARowDrop 0.42s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .four-in-a-row-drop { animation: none; }
        }
      `}</style>
    </div>
  );
}
