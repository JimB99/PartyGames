import type { RoomSnapshot } from "@party-games/shared";
import { scoresForLiveBar } from "@party-games/shared";
import { PlayerColorSwatch } from "./PlayerColorSwatch";

export function LiveScoreBar({
  room,
  gameScores,
  compact = false,
}: {
  room: RoomSnapshot;
  gameScores: Record<string, number>;
  compact?: boolean;
}) {
  const playerIds = room.players.filter((p) => p.connected).map((p) => p.id);
  const rows = scoresForLiveBar(playerIds, room.sessionScores, gameScores)
    .map((row) => ({
      ...row,
      player: room.players.find((p) => p.id === row.playerId),
    }))
    .sort((a, b) => b.gamePts - a.gamePts || b.totalPts - a.totalPts);

  if (rows.length === 0) return null;

  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-1 ${compact ? "text-xs" : "text-sm"} min-w-0`}
      aria-label="Live scores"
    >
      {rows.map(({ playerId, gamePts, totalPts, player }) => (
        <div
          key={playerId}
          className={`flex shrink-0 items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 ${
            compact ? "px-2 py-1" : "px-3 py-2"
          }`}
        >
          <PlayerColorSwatch
            index={player?.colorIndex ?? 0}
            className="h-2 w-2 shrink-0 rounded-full"
          />
          <span className="max-w-[6rem] truncate font-medium">{player?.nickname ?? playerId}</span>
          <span
            className="flex items-baseline gap-1 font-mono font-bold text-violet-300"
            data-testid="live-score-game"
            title="Points this game"
          >
            <span className="text-[0.65em] font-semibold uppercase tracking-wide text-zinc-500">
              Game
            </span>
            {gamePts}
          </span>
          <span className="text-zinc-600">·</span>
          <span
            className="flex items-baseline gap-1 font-mono text-zinc-300"
            data-testid="live-score-total"
            title="Session total including this game"
          >
            <span className="text-[0.65em] font-semibold uppercase tracking-wide text-zinc-500">
              Total
            </span>
            {totalPts}
          </span>
        </div>
      ))}
    </div>
  );
}
