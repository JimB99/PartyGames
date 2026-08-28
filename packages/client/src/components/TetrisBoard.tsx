import { TETRIS_COLS, TETRIS_ROWS } from "@party-games/shared";

const PIECE_COLORS = ["", "#00f0f0", "#f0f000", "#a000f0", "#00f000", "#f00000", "#0000f0", "#f0a000"];

export function TetrisBoard({
  board,
  compact = false,
  alive = true,
  label,
}: {
  board: number[][];
  compact?: boolean;
  alive?: boolean;
  label?: string;
}) {
  const cellSize = compact ? 8 : 14;
  const w = TETRIS_COLS * cellSize;
  const h = TETRIS_ROWS * cellSize;

  return (
    <div className={`relative ${alive ? "" : "opacity-40"}`}>
      {label && <p className="mb-1 text-center text-xs font-bold truncate">{label}</p>}
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-lg bg-zinc-950" style={{ maxHeight: compact ? 120 : 400 }}>
        {board.map((row, y) =>
          row.map((cell, x) =>
            cell ? (
              <rect
                key={`${x}-${y}`}
                x={x * cellSize + 1}
                y={y * cellSize + 1}
                width={cellSize - 2}
                height={cellSize - 2}
                fill={PIECE_COLORS[cell] ?? "#888"}
                rx={2}
              />
            ) : null,
          ),
        )}
        {!alive && (
          <text x={w / 2} y={h / 2} textAnchor="middle" fill="#f87171" fontSize={compact ? 12 : 24} fontWeight="bold">
            OUT
          </text>
        )}
      </svg>
    </div>
  );
}
