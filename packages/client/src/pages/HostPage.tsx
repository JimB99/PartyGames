import { GamePicker, effectivePlayerCount } from "../components/GamePicker";
import { GameOptionsPanel, resolveGameOptions } from "../components/GameOptionsPanel";
import { HostControlBar } from "../components/HostControlBar";
import { HostGameView } from "../components/GameViews";
import { GameViewErrorBoundary } from "../components/GameViewErrorBoundary";
import { TrailDashOptionsPanel } from "../components/TrailDashOptionsPanel";
import { PlayerList } from "../components/PlayerList";
import { RoomCodeDisplay } from "../components/RoomCodeDisplay";
import { Scoreboard } from "../components/Scoreboard";
import { generateRoomCode, usePartyRoom } from "../hooks/usePartyRoom";
import { useParams } from "react-router-dom";
import type { GameId } from "@party-games/shared";
import { resolveTrailDashOptions } from "@party-games/shared";

export function HostPage() {
  const { roomId: paramRoomId } = useParams();
  const roomId = paramRoomId ?? generateRoomCode();

  const {
    roomState,
    connected,
    error,
    selectGame,
    startGame,
    returnToLobby,
    pauseGame,
    resumeGame,
    extendTimer,
    hostAction,
    setGameOptions,
  } = usePartyRoom({ roomId, role: "host", enabled: true });

  const selectedGame = roomState?.games.find((g) => g.id === roomState.selectedGameId);
  const selectedOptions =
    roomState?.selectedGameId
      ? resolveGameOptions(roomState.selectedGameId, roomState.gameOptionsByGame)
      : null;

  const playing = roomState?.phase === "playing";
  const connectedPlayers = roomState?.players.filter((p) => p.connected) ?? [];
  const trailDashOpts =
    selectedOptions ? resolveTrailDashOptions(selectedOptions) : null;
  const needsMoreForTrailDash =
    roomState?.selectedGameId === "curve-fever" &&
    connectedPlayers.length > 0 &&
    connectedPlayers.length + (trailDashOpts?.botCount ?? 0) < 2;

  const canStart =
    roomState?.selectedGameId &&
    connectedPlayers.length > 0 &&
    (roomState.selectedGameId === "curve-fever"
      ? effectivePlayerCount(
          roomState.games.find((g) => g.id === "curve-fever")!,
          connectedPlayers.length,
          roomState.gameOptionsByGame,
        ) >= 2
      : connectedPlayers.length >= (selectedGame?.minPlayers ?? 1));

  const handleSelectGame = (gameId: GameId) => {
    selectGame(gameId);
    if (gameId === "curve-fever" && connectedPlayers.length === 1 && roomState) {
      const opts = resolveGameOptions("curve-fever", roomState.gameOptionsByGame);
      const td = resolveTrailDashOptions(opts);
      if (td.botCount === 0) {
        setGameOptions("curve-fever", {
          ...opts,
          trailDash: { ...td, botCount: 1 },
        });
      }
    }
  };

  const handleEndGame = () => {
    if (!roomState?.hostView) return;
    if (roomState.paused || roomState.hostView.phase === "ended" || confirm("End this game and return to lobby?")) {
      returnToLobby();
    }
  };

  return (
    <div className="min-h-dvh bg-[#0f1117]">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold">Party Games · Host</h1>
        <div className="flex items-center gap-6">
          {roomState && (
            <span className="font-mono text-lg font-bold tracking-[0.25em] text-violet-300">{roomId}</span>
          )}
          <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
            {connected ? "Connected" : "Connecting…"}
          </span>
        </div>
      </header>

      {error && <p className="bg-red-900/40 px-6 py-2 text-red-300">{error}</p>}

      {!playing && roomState && (
        <div className="mx-auto grid max-w-6xl gap-8 p-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <RoomCodeDisplay roomId={roomId} />
            <Scoreboard players={roomState.players} scores={roomState.sessionScores} />
            <PlayerList players={roomState.players} />
            <p className="text-center text-zinc-500">{connectedPlayers.length} players connected</p>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Pick a game</h2>
            <GamePicker
              games={roomState.games}
              selectedId={roomState.selectedGameId}
              playerCount={connectedPlayers.length}
              gameOptionsByGame={roomState.gameOptionsByGame}
              onSelect={handleSelectGame}
            />
            {needsMoreForTrailDash && (
              <p className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
                Add at least 1 bot below or invite another player to start Trail Dash.
              </p>
            )}
            {selectedGame && selectedOptions && (
              <GameOptionsPanel
                game={selectedGame}
                options={selectedOptions}
                onChange={(options) => {
                  if (roomState.selectedGameId) {
                    setGameOptions(roomState.selectedGameId, options);
                  }
                }}
              />
            )}
            {selectedGame?.supportsTrailDashOptions && selectedOptions && (
              <TrailDashOptionsPanel
                options={selectedOptions}
                onChange={(options) => {
                  if (roomState.selectedGameId) {
                    setGameOptions(roomState.selectedGameId, options);
                  }
                }}
              />
            )}
            <button
              type="button"
              disabled={!canStart}
              onClick={startGame}
              className="w-full rounded-2xl bg-violet-600 py-5 text-xl font-bold hover:bg-violet-500 disabled:opacity-40"
            >
              Start game
            </button>
          </div>
        </div>
      )}

      {playing && roomState?.hostView && (
        <>
          {roomState.paused && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 pointer-events-none">
              <p className="rounded-2xl bg-zinc-900 px-8 py-4 text-2xl font-bold">Paused</p>
            </div>
          )}
          <GameViewErrorBoundary>
            <HostGameView room={roomState} hostView={roomState.hostView} />
          </GameViewErrorBoundary>
          <HostControlBar
            paused={roomState.paused}
            phase={roomState.hostView.phase}
            onPause={pauseGame}
            onResume={resumeGame}
            onSkip={() => hostAction({ kind: "advance" })}
            onExtend={() => extendTimer(30000)}
            onEnd={handleEndGame}
          />
        </>
      )}
    </div>
  );
}

