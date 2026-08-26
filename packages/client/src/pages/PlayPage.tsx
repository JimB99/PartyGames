import { PlayerGameView } from "../components/GameViews";
import { usePartyRoom } from "../hooks/usePartyRoom";
import { useParams } from "react-router-dom";

export function PlayPage() {
  const { roomId = "" } = useParams();
  const nickname = sessionStorage.getItem(`pg-nickname-${roomId}`) ?? "Player";
  const storedPlayerId = sessionStorage.getItem(`pg-player-${roomId}`) ?? undefined;

  const { roomState, playerView, connected, error, playerAction } = usePartyRoom({
    roomId,
    role: "player",
    nickname,
    playerId: storedPlayerId,
    enabled: Boolean(roomId),
  });

  return (
    <div className="min-h-dvh bg-[#0f1117]">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="font-bold">{nickname}</span>
        <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
          {connected ? `Room ${roomId}` : "Connecting…"}
        </span>
      </header>

      {error && <p className="bg-red-900/40 px-4 py-2 text-red-300">{error}</p>}

      {!playerView && !error && (
        <div className="p-8 text-center text-zinc-400">
          {roomState?.phase === "playing" ? "Loading game…" : "Waiting for host to start a game…"}
        </div>
      )}

      {error && !playerView && (
        <div className="mx-auto max-w-md space-y-4 p-8 text-center">
          <p className="text-red-300">{error}</p>
          <a href="/join" className="inline-block rounded-xl bg-zinc-700 px-6 py-3 font-bold">
            Back to join
          </a>
        </div>
      )}

      {playerView && roomState && (
        <PlayerGameView room={roomState} playerView={playerView} onAction={playerAction} />
      )}
    </div>
  );
}
