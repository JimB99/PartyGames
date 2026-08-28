import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function Scoreboard({
  players,
  scores,
}: {
  players: RoomSnapshot["players"];
  scores: Record<string, number>;
}) {
  const sorted = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="rounded-2xl bg-zinc-800/60 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Session total</h3>
      <ul className="space-y-2">
        {sorted.map((p, i) => (
          <li key={p.id} className="flex items-center gap-3">
            <span className="w-6 text-zinc-500">{i + 1}</span>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: playerColor(p.colorIndex) }} />
            <span className="flex-1">{p.nickname}</span>
            <span className="font-mono font-bold">{scores[p.id] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
