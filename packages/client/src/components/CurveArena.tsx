import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

const POWERUP_COLORS: Record<string, string> = {
  speed: "#FF6B6B",
  gap: "#4ECDC4",
  shrink: "#AA96DA",
  missile: "#FFE66D",
  grenade: "#F38181",
};

export function CurveArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const width = (data.width as number) ?? 800;
  const height = (data.height as number) ?? 600;
  const players = data.players as Array<{
    id: string;
    x: number;
    y: number;
    trail: Array<{ x: number; y: number }>;
    alive: boolean;
    colorIndex: number;
    jumpTicksRemaining?: number;
    heldPowerUp?: string | null;
    coinsThisRound?: number;
  }>;
  const coins = (data.coins as Array<{ id: string; x: number; y: number }>) ?? [];
  const powerUps = (data.powerUps as Array<{ id: string; kind: string; x: number; y: number }>) ?? [];
  const projectiles = (data.projectiles as Array<{ id: string; x: number; y: number; kind: string }>) ?? [];
  const explosions = (data.explosions as Array<{ x: number; y: number; radius: number; ticksRemaining: number }>) ?? [];
  const wallHoles = (data.wallHoles as Array<{ edge: string; start: number; length: number }>) ?? [];
  const botNames = (data.botNames as Record<string, string>) ?? {};

  const nickname = (id: string) =>
    room.players.find((pl) => pl.id === id)?.nickname ?? botNames[id] ?? id;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl bg-zinc-900">
      {/* Wall holes */}
      {wallHoles.map((hole, i) => {
        if (hole.edge === "top") {
          return <rect key={i} x={hole.start} y={0} width={hole.length} height={6} fill="#0f1117" />;
        }
        if (hole.edge === "bottom") {
          return <rect key={i} x={hole.start} y={height - 6} width={hole.length} height={6} fill="#0f1117" />;
        }
        if (hole.edge === "left") {
          return <rect key={i} x={0} y={hole.start} width={6} height={hole.length} fill="#0f1117" />;
        }
        return <rect key={i} x={width - 6} y={hole.start} width={6} height={hole.length} fill="#0f1117" />;
      })}

      {/* Coins */}
      {coins.map((c) => (
        <circle key={c.id} cx={c.x} cy={c.y} r="8" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
      ))}

      {/* Power-ups */}
      {powerUps.map((pu) => (
        <g key={pu.id}>
          <circle cx={pu.x} cy={pu.y} r="10" fill={POWERUP_COLORS[pu.kind] ?? "#fff"} opacity={0.9} />
          <text x={pu.x} y={pu.y + 4} textAnchor="middle" fontSize="10" fill="#000">
            {pu.kind[0].toUpperCase()}
          </text>
        </g>
      ))}

      {/* Trails and players */}
      {players?.map((p) => {
        const color = playerColor(p.colorIndex);
        const pts = p.trail.map((t) => `${t.x},${t.y}`).join(" ");
        const name = nickname(p.id);
        return (
          <g key={p.id}>
            {pts && (
              <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="4"
                opacity={p.alive ? 1 : 0.3}
              />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.jumpTicksRemaining ? 8 : 6}
              fill={color}
              opacity={p.jumpTicksRemaining ? 0.6 : 1}
            />
            <text x={p.x + 8} y={p.y - 8} fill={color} fontSize="14">
              {name}
              {p.coinsThisRound ? ` (+${p.coinsThisRound})` : ""}
            </text>
          </g>
        );
      })}

      {/* Projectiles */}
      {projectiles.map((proj) => (
        <circle
          key={proj.id}
          cx={proj.x}
          cy={proj.y}
          r={proj.kind === "grenade" ? 6 : 4}
          fill={proj.kind === "grenade" ? "#F38181" : "#FFE66D"}
        />
      ))}

      {/* Explosions */}
      {explosions.map((ex, i) => (
        <circle
          key={i}
          cx={ex.x}
          cy={ex.y}
          r={ex.radius * (ex.ticksRemaining / 10)}
          fill="none"
          stroke="#FF4444"
          strokeWidth="3"
          opacity={ex.ticksRemaining / 10}
        />
      ))}
    </svg>
  );
}
