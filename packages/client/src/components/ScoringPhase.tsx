import type { HostViewSnapshot, RoomSnapshot } from "@party-games/shared";
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
        : ((data.cumulativeScores as Record<string, number> | undefined) ?? {});
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

  return (
    <>
      {endedReason && isEnded && (
        <p className="text-center text-lg text-zinc-300 mb-4">{endedReason}</p>
      )}
      <RoundScorePanel
        room={room}
        title={title}
        roundScores={scores}
        extraNames={(data.botNames as Record<string, string>) ?? undefined}
      />
      {data.roundWinner && (
        <p className="text-center text-2xl text-yellow-400">
          Winner:{" "}
          {room.players.find((p) => p.id === data.roundWinner)?.nickname ??
            (data.botNames as Record<string, string> | undefined)?.[data.roundWinner as string] ??
            "—"}
        </p>
      )}
    </>
  );
}
