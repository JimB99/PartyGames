import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function PaddleClashArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const ball = data.ball as { x: number; y: number };
  const players = data.players as Array<{ id: string; y: number; score: number }>;
  const w = 800;
  const h = 450;

  return (
    <div className="mx-auto max-w-4xl">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full rounded-2xl bg-slate-900">
        <rect x={0} y={0} width={w} height={h} fill="#0f172a" stroke="#334155" strokeWidth={4} />
        <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#334155" strokeDasharray="8 8" />
        {players.map((p, i) => {
          const side = i === 0 || (players.length > 2 && i < 2) ? "left" : "right";
          const px = side === "left" ? 48 : w - 48;
          const pl = room.players.find((x) => x.id === p.id);
          const color = playerColor(pl?.colorIndex ?? i);
          return (
            <g key={p.id}>
              <rect
                x={px - 8}
                y={p.y * h - 40}
                width={16}
                height={80}
                rx={4}
                fill={color}
              />
              <text x={px} y={28} textAnchor="middle" fill="#fff" fontSize={14}>
                {pl?.nickname ?? p.id} · {p.score}
              </text>
            </g>
          );
        })}
        <circle cx={ball.x * w} cy={ball.y * h} r={10} fill="#f8fafc" />
      </svg>
    </div>
  );
}
