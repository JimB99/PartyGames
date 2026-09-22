import type { HostViewSnapshot, RoomSnapshot } from "@party-games/shared";
import { resolveWinnerId } from "@party-games/shared";
import { RoundScorePanel } from "./RoundScorePanel";

export function ScoringPhase({
  room,
  hostView,
  data,
}: {
  room: RoomSnapshot;
  hostView: HostViewSnapshot;
  data: Record<string, unknown>;
}) {
  const phase = hostView.phase;
  if (phase !== "scoreboard" && phase !== "round_end" && phase !== "ended") return null;

  const gameMeta = room.games.find((g) => g.id === hostView.gameId);
  const cumulative = gameMeta?.roundScoresAreCumulative ?? false;
  const isEnded = phase === "ended";

  let scores: Record<string, number> = {};
  let title = "Round scores";

  if (isEnded) {
    title = "Final scores";
    scores =
      Object.keys(room.gameScores).length > 0
        ? room.gameScores
        : ((data.roundScores as Record<string, number> | undefined) ??
          (data.cumulativeScores as Record<string, number> | undefined) ??
          {});
  } else {
    const lastRound = data.lastRoundScores as Record<string, number> | undefined;
    if (cumulative && lastRound && Object.keys(lastRound).length > 0) {
      scores = lastRound;
    } else {
      scores = (data.roundScores as Record<string, number> | undefined) ?? {};
    }
  }

  const endedReason = data.endedReason as string | undefined;
  const hasScores = Object.keys(scores).length > 0;

  if (!hasScores && isEnded) {
    scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  }

  if (!hasScores && !isEnded) return null;

  const winnerId = resolveWinnerId(data, scores);
  const winnerName =
    winnerId != null
      ? (room.players.find((p) => p.id === winnerId)?.nickname ??
        (data.botNames as Record<string, string> | undefined)?.[winnerId] ??
        winnerId)
      : null;

  return (
    <>
      {endedReason && isEnded && (
        <p className="text-center text-lg text-zinc-300 mb-4">{endedReason}</p>
      )}
      <RoundScorePanel
        room={room}
        title={title}
        roundScores={scores}
        extraNames={(data.botNames as Record<string, string> | undefined) ?? undefined}
      />
      {hostView.gameId === "block-stack" && isEnded && (data.lastStandingId || data.highScorePlayerId) ? (
        <div className="space-y-2 text-center text-xl text-yellow-400">
          {typeof data.lastStandingId === "string" && (
            <p>
              Last standing:{" "}
              {room.players.find((p) => p.id === data.lastStandingId)?.nickname ??
                (data.botNames as Record<string, string> | undefined)?.[data.lastStandingId] ??
                "—"}
            </p>
          )}
          {typeof data.highScorePlayerId === "string" && (
            <p>
              High score:{" "}
              {room.players.find((p) => p.id === data.highScorePlayerId)?.nickname ??
                (data.botNames as Record<string, string> | undefined)?.[data.highScorePlayerId] ??
                "—"}
            </p>
          )}
        </div>
      ) : (
        winnerName && (
          <p className="text-center text-2xl text-yellow-400">Winner: {winnerName}</p>
        )
      )}
    </>
  );
}
