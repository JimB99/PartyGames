import { TETRIS_COLS, TETRIS_ROWS, parseTetrisGesture } from "@party-games/shared";



const PIECE_COLORS = ["", "#00f0f0", "#f0f000", "#a000f0", "#00f000", "#f00000", "#0000f0", "#f0a000"];



export function TetrisBoard({

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

  onInput?: (input: "left" | "right" | "rotate_cw" | "rotate_ccw" | "soft_drop" | "hard_drop") => void;

  className?: string;

}) {

  const cellSize = compact ? 8 : 14;

  const w = TETRIS_COLS * cellSize;

  const h = TETRIS_ROWS * cellSize;

  let startX = 0;

  let startY = 0;



  return (

    <div className={`relative ${alive ? "" : "opacity-40"} ${className}`}>

      {label && <p className="mb-1 text-center text-xs font-bold truncate">{label}</p>}

      <svg

        viewBox={`0 0 ${w} ${h}`}

        className={`w-full rounded-lg bg-zinc-950 ${interactive ? "h-full min-h-[280px]" : ""}`}

        style={{ maxHeight: compact ? 120 : interactive ? undefined : 400 }}

      >

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

      {interactive && onInput && (

        <div

          className="absolute inset-0 touch-none select-none rounded-lg"

          data-testid="tetris-board-touch"

          onPointerDown={(e) => {

            if (!alive) return;

            startX = e.clientX;

            startY = e.clientY;

            e.currentTarget.setPointerCapture(e.pointerId);

          }}

          onPointerUp={(e) => {

            if (!alive) return;

            const gesture = parseTetrisGesture(e.clientX - startX, e.clientY - startY);

            if (gesture) onInput(gesture);

          }}

        />

      )}

    </div>

  );

}

