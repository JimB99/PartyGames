import {
  BLOCK_STACK_COLS,
  BLOCK_STACK_ROWS,
  drainDasAxis,
  parseBlockStackGesture,
  pieceKindIndex,
  pieceSpawnShape,
  type PieceKind,
} from "@party-games/shared";
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

function cropShape(shape: number[][]): number[][] {
  const rows = shape.filter((row) => row.some((c) => c));
  if (rows.length === 0) return shape;
  const colUsed = rows[0].map((_, i) => rows.some((row) => row[i]));
  return rows.map((row) => row.filter((_, i) => colUsed[i]));
}

export function NextPiecePreview({
  kind,
  compact = false,
}: {
  kind: PieceKind;
  compact?: boolean;
}) {
  const cropped = cropShape(pieceSpawnShape(kind));
  const fill = PIECE_COLORS[pieceKindIndex(kind)] ?? "#888";
  const cell = compact ? 8 : 12;
  const w = cropped[0].length * cell;
  const h = cropped.length * cell;
  return (
    <div data-testid="block-stack-next" className="flex flex-col items-center gap-1">
      {!compact && <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Next</p>}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-label={`Next ${kind}`}>
        {cropped.map((row, y) =>
          row.map((on, x) =>
            on ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill={fill}
                rx={compact ? 1 : 2}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={0.5}
              />
            ) : null,
          ),
        )}
      </svg>
    </div>
  );
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
  const lastX = useRef(0);
  const accX = useRef(0);
  const dasUsed = useRef(false);
  const wellRef = useRef<HTMLDivElement>(null);
  const highlightInset = compact ? 1 : 2;
  const highlightSize = cellSize - highlightInset * 2;

  function cellWidthPx(): number {
    const width = wellRef.current?.clientWidth ?? w;
    return width / BLOCK_STACK_COLS;
  }

  return (
    <div className={`relative flex min-h-0 flex-col ${alive ? "" : "opacity-40"} ${className}`}>
      {label && <p className="mb-1 text-center text-xs font-bold truncate">{label}</p>}
      <div
        ref={wellRef}
        className={
          interactive
            ? "relative mx-auto h-full min-h-0 w-full overflow-hidden rounded-lg bg-slate-900/90 aspect-[1/2]"
            : isHostBoard
              ? "relative min-h-0 flex-1 overflow-hidden rounded-lg bg-slate-900/90"
              : "relative mx-auto w-full overflow-hidden rounded-lg bg-slate-900/90 aspect-[1/2]"
        }
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="xMidYMin meet"
          className={`h-full w-full ${
            interactive
              ? ""
              : isHostBoard
                ? "max-h-full"
                : ""
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
          <div
            className="absolute inset-0 touch-none select-none rounded-lg"
            data-testid="block-stack-board-touch"
            onPointerDown={(e) => {
              if (!alive) return;
              touchStart.current = { x: e.clientX, y: e.clientY };
              lastX.current = e.clientX;
              accX.current = 0;
              dasUsed.current = false;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!alive) return;
              accX.current += e.clientX - lastX.current;
              lastX.current = e.clientX;
              const { steps, remain } = drainDasAxis(accX.current, cellWidthPx());
              accX.current = remain;
              if (steps === 0) return;
              dasUsed.current = true;
              const dir = steps > 0 ? "right" : "left";
              for (let i = 0; i < Math.abs(steps); i++) onInput(dir);
            }}
            onPointerUp={(e) => {
              if (!alive) return;
              const dx = e.clientX - touchStart.current.x;
              const dy = e.clientY - touchStart.current.y;
              if (!dasUsed.current) {
                const gesture = parseBlockStackGesture(dx, dy);
                if (gesture) onInput(gesture);
                return;
              }
              if (Math.abs(dy) > Math.abs(dx)) {
                const gesture = parseBlockStackGesture(dx, dy);
                if (gesture === "soft_drop" || gesture === "hard_drop") onInput(gesture);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
