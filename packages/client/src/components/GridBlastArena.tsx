import { GRID_BLAST_COLS, GRID_BLAST_ROWS } from "@party-games/shared";
import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

const CELL_COLORS: Record<number, string> = {
  0: "#1e293b",
  1: "#475569",
  2: "#92400e",
};

export function GridBlastArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const grid = data.grid as number[][];
  const players = data.players as Array<{ id: string; x: number; y: number; alive: boolean }>;
  const bombs = (data.bombs as Array<{ x: number; y: number }>) ?? [];
  const fires = (data.fires as Array<{ x: number; y: number }>) ?? [];
  const cell = 28;
  const w = GRID_BLAST_COLS * cell;
  const h = GRID_BLAST_ROWS * cell;

  return (
    <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-slate-950">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        {grid?.map((row, y) =>
          row.map((cellVal, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * cell + 1}
              y={y * cell + 1}
              width={cell - 2}
              height={cell - 2}
              fill={CELL_COLORS[cellVal] ?? "#1e293b"}
              rx={3}
            />
          )),
        )}
        {fires.map((f, i) => (
          <rect
            key={`fire-${i}`}
            x={f.x * cell + 2}
            y={f.y * cell + 2}
            width={cell - 4}
            height={cell - 4}
            fill="#f97316"
            opacity={0.85}
            rx={2}
          />
        ))}
        {bombs.map((b, i) => (
          <circle
            key={`bomb-${i}`}
            cx={b.x * cell + cell / 2}
            cy={b.y * cell + cell / 2}
            r={cell / 4}
            fill="#1c1917"
            stroke="#fbbf24"
            strokeWidth={2}
          />
        ))}
        {players?.map((p) => {
          const pl = room.players.find((x) => x.id === p.id);
          if (!p.alive) return null;
          return (
            <circle
              key={p.id}
              cx={p.x * cell + cell / 2}
              cy={p.y * cell + cell / 2}
              r={cell / 3}
              fill={playerColor(pl?.colorIndex ?? 0)}
            />
          );
        })}
      </svg>
    </div>
  );
}
