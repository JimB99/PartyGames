import type { RoomSnapshot } from "@party-games/shared";
import { scoresForAllPlayers } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function RoundScorePanel({
  room,
  roundScores,
  title = "Round scores",
  extraNames,
}: {
  room: RoomSnapshot;
  roundScores: Record<string, number>;
  title?: string;
  extraNames?: Record<string, string>;
}) {
  const roomIds = new Set(room.players.map((p) => p.id));
  const extraIds = Object.keys(roundScores).filter((id) => !roomIds.has(id));
  const playerIds = [...room.players.map((p) => p.id), ...extraIds];
  const rows = scoresForAllPlayers(playerIds, roundScores)
    .sort((a, b) => b.points - a.points);

  return (
    <div className="rounded-2xl bg-zinc-800/60 p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <ul className="space-y-2">
        {rows.map(({ playerId, points }) => {
          const p = room.players.find((pl) => pl.id === playerId);
          const name = p?.nickname ?? extraNames?.[playerId] ?? playerId;
          return (
            <li key={playerId} className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: playerColor(p?.colorIndex ?? 0) }}
              />
              <span className="flex-1">{name}</span>
              <span className="font-mono font-bold">{points}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
