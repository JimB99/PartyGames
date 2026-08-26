import type { RoomSnapshot } from "@party-games/shared";
import { scoresForAllPlayers } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function RoundScorePanel({
  room,
  roundScores,
  title = "Round scores",
}: {
  room: RoomSnapshot;
  roundScores: Record<string, number>;
  title?: string;
}) {
  const playerIds = room.players.map((p) => p.id);
  const rows = scoresForAllPlayers(playerIds, roundScores)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="rounded-2xl bg-zinc-800/60 p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <ul className="space-y-2">
        {rows.map(({ playerId, points }) => {
          const p = room.players.find((pl) => pl.id === playerId);
          return (
            <li key={playerId} className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: playerColor(p?.colorIndex ?? 0) }}
              />
              <span className="flex-1">{p?.nickname ?? playerId}</span>
              <span className="font-mono font-bold">{points}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
