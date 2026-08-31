import { BLOCK_STACK_COLS, BLOCK_STACK_ROWS, parseBlockStackGesture } from "@party-games/shared";
import { useRef } from "react";

/** Distinct pastel palette — not Tetris guideline colors. */
const PIECE_COLORS = [
  "",
  "#7EC8E3", // I — sky
  "#F9E79F", // O — butter
  "#C39BD3", // T — lilac
  "#82E0AA", // S — mint
  "#F1948A", // Z — coral
  "#85C1E9", // J — periwinkle
  "#F8C471", // L — apricot
];

function cellColor(cell: number): { fill: string; opacity: number } {
  const ghost = cell > 10;
  const kind = ghost ? cell - 10 : cell;
  return { fill: PIECE_COLORS[kind] ?? "#888", opacity: ghost ? 0.35 : 1 };
}

export function BlockStackBoard({
  board,
  compact = false,
  alive = true,
  label,
  interactive = false,
  onInput,
  className = "",
}: {
  board: number[][];
  compact?: boolean;
  alive?: boolean;
  label?: string;
  interactive?: boolean;
  onInput?: (input: "left" | "right" | "rotate_cw" | "rotate_ccw" | "soft_drop" | "hard_drop" | "hold") => void;
  className?: string;
}) {
  const cellSize = compact ? 8 : 14;
  const w = BLOCK_STACK_COLS * cellSize;
  const h = BLOCK_STACK_ROWS * cellSize;
  const touchStart = useRef({ x: 0, y: 0 });

  return (
    <div className={`relative ${alive ? "" : "opacity-40"} ${className}`}>
      {label && <p className="mb-1 text-center text-xs font-bold truncate">{label}</p>}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`w-full rounded-lg bg-slate-900/90 ${interactive ? "h-full min-h-[280px]" : ""}`}
        style={{ maxHeight: compact ? 120 : interactive ? undefined : 400 }}
      >
        {board.map((row, y) =>
          row.map((cell, x) => {
            if (!cell) return null;
            const { fill, opacity } = cellColor(cell);
            return (
              <g key={`${x}-${y}`} opacity={opacity}>
                <rect
                  x={x * cellSize + 1}
                  y={y * cellSize + 1}
                  width={cellSize - 2}
                  height={cellSize - 2}
                  fill={fill}
                  rx={compact ? 2 : 4}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={0.5}
                />
                {opacity >= 1 && (
                  <rect
                    x={x * cellSize + 2}
                    y={y * cellSize + 2}
                    width={cellSize - 5}
                    height={cellSize - 5}
                    fill="rgba(255,255,255,0.12)"
                    rx={compact ? 1 : 2}
                    pointerEvents="none"
                  />
                )}
              </g>
            );
          }),
        )}
        {!alive && (
          <text x={w / 2} y={h / 2} textAnchor="middle" fill="#f87171" fontSize={compact ? 12 : 24} fontWeight="bold">
            OUT
          </text>
        )}
      </svg>
      {interactive && onInput && (
        <>
          <div
            className="absolute inset-0 touch-none select-none rounded-lg"
            data-testid="block-stack-board-touch"
            onPointerDown={(e) => {
              if (!alive) return;
              touchStart.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerUp={(e) => {
              if (!alive) return;
              const { x, y } = touchStart.current;
              const gesture = parseBlockStackGesture(e.clientX - x, e.clientY - y);
              if (gesture) onInput(gesture);
            }}
          />
          <button
            type="button"
            data-testid="block-stack-hold"
            className="absolute bottom-2 right-2 rounded-lg bg-zinc-800/90 px-3 py-2 text-xs font-bold text-white"
            onClick={() => onInput("hold")}
          >
            Hold
          </button>
        </>
      )}
    </div>
  );
}
