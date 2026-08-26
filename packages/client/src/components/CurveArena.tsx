import type { PowerUpKind, RoomSnapshot, TrailPoint } from "@party-games/shared";
import { powerUpInfo } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

const WALL_THICKNESS = 14;

function splitTrailPolylines(trail: TrailPoint[]): TrailPoint[][] {
  const segments: TrailPoint[][] = [];
  let current: TrailPoint[] = [];
  for (const pt of trail) {
    if (pt.break) {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    current.push(pt);
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

function WallEdge({
  edge,
  width,
  height,
  holes,
}: {
  edge: string;
  width: number;
  height: number;
  holes: Array<{ edge: string; start: number; length: number }>;
}) {
  const edgeHoles = holes.filter((h) => h.edge === edge);
  const t = WALL_THICKNESS;

  const wallSeg = (key: string, x: number, y: number, w: number, h: number) => (
    <rect key={key} x={x} y={y} width={w} height={h} fill="#3f3f46" stroke="#71717a" strokeWidth={2} rx={2} />
  );

  const portal = (key: string, x: number, y: number, w: number, h: number, label: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} fill="#0c4a6e" stroke="#22d3ee" strokeWidth={3} rx={3} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="#164e63" opacity={0.85} rx={2} />
      <text
        x={x + w / 2}
        y={y + h / 2 + (edge === "left" || edge === "right" ? 0 : 4)}
        textAnchor="middle"
        fontSize={edge === "left" || edge === "right" ? 14 : 18}
        fill="#67e8f9"
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );

  if (edge === "top" || edge === "bottom") {
    const y = edge === "top" ? 0 : height - t;
    const spans: Array<{ start: number; end: number; hole?: (typeof edgeHoles)[0] }> = [];
    let cursor = 0;
    for (const hole of edgeHoles.sort((a, b) => a.start - b.start)) {
      if (hole.start > cursor) spans.push({ start: cursor, end: hole.start });
      spans.push({ start: hole.start, end: hole.start + hole.length, hole });
      cursor = hole.start + hole.length;
    }
    if (cursor < width) spans.push({ start: cursor, end: width });

    return (
      <g>
        {spans.map((span, i) => {
          const w = span.end - span.start;
          if (span.hole) {
            return portal(`hole-${edge}-${i}`, span.start, y, w, t, edge === "top" ? "↓ wrap" : "↑ wrap");
          }
          return wallSeg(`wall-${edge}-${i}`, span.start, y, w, t);
        })}
      </g>
    );
  }

  const x = edge === "left" ? 0 : width - t;
  const spans: Array<{ start: number; end: number; hole?: (typeof edgeHoles)[0] }> = [];
  let cursor = 0;
  for (const hole of edgeHoles.sort((a, b) => a.start - b.start)) {
    if (hole.start > cursor) spans.push({ start: cursor, end: hole.start });
    spans.push({ start: hole.start, end: hole.start + hole.length, hole });
    cursor = hole.start + hole.length;
  }
  if (cursor < height) spans.push({ start: cursor, end: height });

  return (
    <g>
      {spans.map((span, i) => {
        const h = span.end - span.start;
        if (span.hole) {
          return portal(`hole-${edge}-${i}`, x, span.start, t, h, edge === "left" ? "→ wrap" : "← wrap");
        }
        return wallSeg(`wall-${edge}-${i}`, x, span.start, t, h);
      })}
    </g>
  );
}

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
    trail: TrailPoint[];
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
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl bg-zinc-950">
      <rect x={0} y={0} width={width} height={height} fill="#18181b" />

      {(["top", "bottom", "left", "right"] as const).map((edge) => (
        <WallEdge key={edge} edge={edge} width={width} height={height} holes={wallHoles} />
      ))}

      {coins.map((c) => (
        <g key={c.id}>
          <circle cx={c.x} cy={c.y} r="12" fill="#FFD700" stroke="#B8860B" strokeWidth="2" />
          <text x={c.x} y={c.y + 5} textAnchor="middle" fontSize="14">
            🪙
          </text>
        </g>
      ))}

      {powerUps.map((pu) => {
        const info = powerUpInfo(pu.kind as PowerUpKind);
        return (
          <g key={pu.id}>
            <circle cx={pu.x} cy={pu.y} r="18" fill={info.color} stroke="#fff" strokeWidth="2" opacity={0.95} />
            <text x={pu.x} y={pu.y + 7} textAnchor="middle" fontSize="20">
              {info.icon}
            </text>
          </g>
        );
      })}

      {players?.map((p) => {
        const color = playerColor(p.colorIndex);
        const polylines = splitTrailPolylines(p.trail);
        const name = nickname(p.id);
        return (
          <g key={p.id}>
            {polylines.map((segment, si) => {
              const pts = segment.map((t) => `${t.x},${t.y}`).join(" ");
              if (!pts) return null;
              return (
                <polyline
                  key={si}
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={p.alive ? 1 : 0.3}
                />
              );
            })}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.jumpTicksRemaining ? 9 : 7}
              fill={color}
              stroke={p.jumpTicksRemaining ? "#fff" : "none"}
              strokeWidth={2}
              opacity={p.jumpTicksRemaining ? 0.75 : 1}
            />
            <text x={p.x + 10} y={p.y - 10} fill={color} fontSize="14" fontWeight="bold">
              {name}
              {p.coinsThisRound ? ` (+${p.coinsThisRound})` : ""}
            </text>
          </g>
        );
      })}

      {projectiles.map((proj) => (
        <circle
          key={proj.id}
          cx={proj.x}
          cy={proj.y}
          r={proj.kind === "grenade" ? 7 : 5}
          fill={proj.kind === "grenade" ? "#F38181" : "#FFE66D"}
          stroke="#fff"
          strokeWidth={1}
        />
      ))}

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
