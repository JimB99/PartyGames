import { GRID_BLAST_COLS, GRID_BLAST_ROWS, type GridBlastPowerUpKind } from "@party-games/shared";
import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

const CELL_COLORS: Record<number, string> = {
  0: "#1e293b",
  1: "#475569",
  2: "#92400e",
};

const POWER_COLORS: Record<GridBlastPowerUpKind, string> = {
  bomb: "#facc15",
  range: "#fb923c",
  speed: "#22d3ee",
  kick: "#a3e635",
};

export function GridBlastArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const grid = data.grid as number[][];
  const players = data.players as Array<{
    id: string;
    x: number;
    y: number;
    alive: boolean;
    canKick?: boolean;
    maxBombs?: number;
    blastRange?: number;
  }>;
  const bombs = (data.bombs as Array<{ x: number; y: number; range?: number }>) ?? [];
  const fires = (data.fires as Array<{ x: number; y: number }>) ?? [];
  const powerUps = (data.powerUps as Array<{ x: number; y: number; kind: GridBlastPowerUpKind }>) ?? [];
  const cell = 28;
  const w = GRID_BLAST_COLS * cell;
  const h = GRID_BLAST_ROWS * cell;
  const aliveHud = players?.filter((p) => p.alive) ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-3 overflow-hidden rounded-2xl bg-slate-950 p-3">
      {aliveHud.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 text-sm text-zinc-300">
          {aliveHud.map((p) => {
            const pl = room.players.find((x) => x.id === p.id);
            return (
              <span key={p.id} className="rounded-full bg-zinc-800 px-3 py-1">
                <span className="font-bold" style={{ color: playerColor(pl?.colorIndex ?? 0) }}>
                  {pl?.nickname ?? "Player"}
                </span>
                {" · "}💣{p.maxBombs ?? 1} 🔥{p.blastRange ?? 2}
                {p.canKick ? " 👟" : ""}
              </span>
            );
          })}
        </div>
      )}
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
        {powerUps.map((pu, i) => (
          <circle
            key={`pu-${i}`}
            cx={pu.x * cell + cell / 2}
            cy={pu.y * cell + cell / 2}
            r={cell / 5}
            fill={POWER_COLORS[pu.kind] ?? "#fff"}
          />
        ))}
        {bombs.map((b, i) => (
          <g key={`bomb-${i}`}>
            <circle
              cx={b.x * cell + cell / 2}
              cy={b.y * cell + cell / 2}
              r={cell / 4}
              fill="#1c1917"
              stroke="#fbbf24"
              strokeWidth={2}
            />
            {b.range != null && (
              <text
                x={b.x * cell + cell / 2}
                y={b.y * cell + cell / 2 + 4}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="10"
                fontWeight="bold"
              >
                {b.range}
              </text>
            )}
          </g>
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
