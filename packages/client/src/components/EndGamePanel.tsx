import type { PlayerViewSnapshot, RoomSnapshot } from "@party-games/shared";
import { resolveWinnerId } from "@party-games/shared";
import { RoundScorePanel } from "./RoundScorePanel";

export function EndGamePanel({
  room,
  playerView,
  data,
}: {
  room: RoomSnapshot;
  playerView: PlayerViewSnapshot;
  data: Record<string, unknown>;
}) {
  if (playerView.phase !== "ended") return null;

  const scores =
    Object.keys(room.gameScores).length > 0
      ? room.gameScores
      : ((data.roundScores as Record<string, number> | undefined) ??
        (data.cumulativeScores as Record<string, number> | undefined) ??
        {});

  const hasScores = Object.keys(scores).length > 0;
  const displayScores = hasScores
    ? scores
    : Object.fromEntries(room.players.map((p) => [p.id, 0]));

  const winnerId = resolveWinnerId(data, displayScores);
  const winnerName =
    winnerId != null
      ? (room.players.find((p) => p.id === winnerId)?.nickname ??
        (data.botNames as Record<string, string> | undefined)?.[winnerId] ??
        winnerId)
      : null;

  return (
    <div className="space-y-4" data-testid="player-end-game">
      {winnerName && (
        <p className="text-center text-2xl font-bold text-yellow-400">Winner: {winnerName}</p>
      )}
      <RoundScorePanel room={room} title="Final scores" roundScores={displayScores} />
    </div>
  );
}
