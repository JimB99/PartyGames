import { PlayerGameView } from "../components/GameViews";
import { PlayerProfileBar } from "../components/PlayerProfileBar";
import { getStoredColorIndex } from "../components/ColorPicker";
import { ConnectionBanner, PhoneGameShell } from "../components/game/GameShell";
import { usePartyRoom } from "../hooks/usePartyRoom";
import { useParams } from "react-router-dom";

export function PlayPage() {
  const { roomId = "" } = useParams();
  const nickname = sessionStorage.getItem(`pg-nickname-${roomId}`) ?? "Player";
  const storedPlayerId = sessionStorage.getItem(`pg-player-${roomId}`) ?? undefined;
  const storedColorIndex = getStoredColorIndex(roomId);

  const { roomState, playerView, connected, error, playerId, playerAction, updateProfile } =
    usePartyRoom({
      roomId,
      role: "player",
      nickname,
      playerId: storedPlayerId,
      colorIndex: storedColorIndex,
      enabled: Boolean(roomId),
    });

  return (
    <div className="pg-page flex min-h-dvh flex-col bg-[#0f1117] overflow-x-hidden">
      <header className="flex items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3 min-w-0">
        <PlayerProfileBar
          roomId={roomId}
          roomState={roomState}
          playerId={playerId}
          onUpdateProfile={updateProfile}
        />
        <span className={`shrink-0 text-sm ${connected ? "text-green-400" : "text-amber-400"}`}>
          {connected ? `Room ${roomId}` : "Reconnecting…"}
        </span>
      </header>

      {error && <ConnectionBanner message={error} />}

      <PhoneGameShell>
        {!playerView && !error && (
          <div className="p-8 text-center text-zinc-400">
            {roomState?.phase === "playing" ? "Loading game…" : "Waiting for host to start a game…"}
          </div>
        )}

        {roomState?.phase === "lobby" && playerView && (
          <div className="p-8 text-center text-zinc-400">Waiting for host to start a game…</div>
        )}

        {error && !playerView && (
          <div className="mx-auto max-w-md space-y-4 p-8 text-center">
            <a href="/join" className="inline-block rounded-xl bg-zinc-700 px-6 py-3 font-bold">
              Back to join
            </a>
          </div>
        )}

        {playerView && roomState && roomState.phase === "playing" && (
          <PlayerGameView room={roomState} playerView={playerView} onAction={playerAction} />
        )}
      </PhoneGameShell>
    </div>
  );
}
