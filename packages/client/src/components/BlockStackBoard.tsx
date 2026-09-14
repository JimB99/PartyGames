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
  const isHostBoard = compact && !interactive;
  const cellSize = compact ? 12 : 14;
  const w = BLOCK_STACK_COLS * cellSize;
  const h = BLOCK_STACK_ROWS * cellSize;
  const touchStart = useRef({ x: 0, y: 0 });
  const highlightInset = compact ? 1 : 2;
  const highlightSize = cellSize - highlightInset * 2;

  return (
    <div className={`relative flex min-h-0 flex-col ${alive ? "" : "opacity-40"} ${className}`}>
      {label && <p className="mb-1 text-center text-xs font-bold truncate">{label}</p>}
      <div
        className={
          interactive
            ? "relative mx-auto h-full w-full aspect-[1/2]"
            : isHostBoard
              ? "relative min-h-0 flex-1"
              : "relative mx-auto w-full aspect-[1/2]"
        }
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMid meet"
          className={`rounded-lg bg-slate-900/90 ${
            interactive
              ? "h-full w-full"
              : isHostBoard
                ? "h-full w-full max-h-full"
                : "h-full w-full"
          }`}
          style={!interactive && !isHostBoard ? { maxHeight: 400 } : undefined}
        >
          <rect x={0} y={0} width={w} height={h} fill="none" stroke="#52525b" strokeWidth={2} />
          {board.map((row, y) =>
            row.map((cell, x) => {
              if (!cell) return null;
              const { fill, opacity } = cellColor(cell);
              return (
                <g key={`${x}-${y}`} opacity={opacity}>
                  <rect
                    x={x * cellSize}
                    y={y * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={fill}
                    rx={compact ? 2 : 4}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={0.5}
                  />
                  {opacity >= 1 && (
                    <rect
                      x={x * cellSize + highlightInset}
                      y={y * cellSize + highlightInset}
                      width={highlightSize}
                      height={highlightSize}
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
          </>
        )}
      </div>
    </div>
  );
}
