import { GamePicker, effectivePlayerCount, isOverMaxPlayers } from "../components/GamePicker";
import { resolveGameOptions } from "../components/GameOptionsPanel";
import { GameDetailIsland } from "../components/GameDetailIsland";
import { HostControlBar } from "../components/HostControlBar";
import { HostGameView } from "../components/GameViews";
import { GameViewErrorBoundary } from "../components/GameViewErrorBoundary";
import { LiveScoreBar } from "../components/LiveScoreBar";
import { PauseOverlay } from "../components/PauseOverlay";
import { PlayerList } from "../components/PlayerList";
import { RoomCodeDisplay } from "../components/RoomCodeDisplay";
import { Scoreboard } from "../components/Scoreboard";
import { generateRoomCode, usePartyRoom } from "../hooks/usePartyRoom";
import { SessionPlaylistPanel } from "../components/SessionPlaylistPanel";
import { useParams } from "react-router-dom";
import { useState } from "react";
import type { GameId } from "@party-games/shared";
import { resolveTrailDashOptions } from "@party-games/shared";
import { ConnectionBanner } from "../components/game/GameShell";
import { useWakeLock } from "../hooks/useWakeLock";
import { useHostStageFocus } from "../hooks/useHostStageFocus";

export function HostPage() {
  const { roomId: paramRoomId } = useParams();
  const roomId = paramRoomId ?? generateRoomCode();

  const {
    roomState,
    connected,
    connectionEpoch,
    error,
    selectGame,
    startGame,
    playAgain,
    returnToLobby,
    pauseGame,
    resumeGame,
    extendTimer,
    hostAction,
    setGameOptions,
    setSessionPlaylist,
    startSession,
    nextSessionGame,
    clearSessionPlaylist,
  } = usePartyRoom({ roomId, role: "host", enabled: true });

  const [pendingSelect, setPendingSelect] = useState<GameId | null>(null);

  const selectedGameId = roomState?.selectedGameId ?? pendingSelect;
  const selectedGame = roomState?.games.find((g) => g.id === selectedGameId);
  const selectedOptions =
    selectedGameId
      ? resolveGameOptions(selectedGameId, roomState?.gameOptionsByGame ?? {})
      : null;

  const playing = roomState?.phase === "playing";
  const connectedPlayers = roomState?.players.filter((p) => p.connected) ?? [];
  const trailDashOpts =
    selectedOptions ? resolveTrailDashOptions(selectedOptions) : null;
  const needsMoreForTrailDash =
    selectedGameId === "trail-dash" &&
    connectedPlayers.length > 0 &&
    connectedPlayers.length + (trailDashOpts?.botCount ?? 0) < 2;

  const playerOverMax = Boolean(
    selectedGame &&
      isOverMaxPlayers(selectedGame, connectedPlayers.length, roomState?.gameOptionsByGame),
  );

  const canStart = Boolean(
    selectedGameId &&
      connectedPlayers.length > 0 &&
      !playerOverMax &&
      (selectedGameId === "trail-dash"
        ? effectivePlayerCount(
            roomState?.games.find((g) => g.id === "trail-dash")!,
            connectedPlayers.length,
            roomState?.gameOptionsByGame,
          ) >= 2
        : connectedPlayers.length >= (selectedGame?.minPlayers ?? 1)),
  );

  const handleSelectGame = (gameId: GameId) => {
    setPendingSelect(gameId);
    selectGame(gameId);
    if (gameId === "trail-dash" && connectedPlayers.length === 1 && roomState) {
      const opts = resolveGameOptions("trail-dash", roomState.gameOptionsByGame);
      const td = resolveTrailDashOptions(opts);
      if (td.botCount === 0) {
        setGameOptions("trail-dash", {
          ...opts,
          trailDash: { ...td, botCount: 1 },
        });
      }
    }
  };

  const handleEndGame = () => {
    if (!roomState?.hostView) return;
    const gameOver = roomState.hostView.phase === "ended";
    if (gameOver || confirm("Leave this game and return to the lobby?")) {
      returnToLobby();
    }
  };

  const trailDashWarning = needsMoreForTrailDash ? (
    <p className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
      Add at least 1 bot below or invite another player to start Trail Dash.
    </p>
  ) : null;

  const overMaxWarning = playerOverMax && selectedGame ? (
    <p className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
      {selectedGame.id === "trail-dash"
        ? `Trail Dash allows up to ${selectedGame.maxPlayers} total players (humans + bots). Reduce bots or wait for players to leave.`
        : `This game allows at most ${selectedGame.maxPlayers} players. Wait for someone to leave before starting.`}
    </p>
  ) : null;

  const startHint =
    !canStart && selectedGame
      ? connectedPlayers.length === 0
        ? "Waiting for at least 1 player to join."
        : playerOverMax
          ? selectedGame.id === "trail-dash"
            ? "Reduce bots or wait for players to leave."
            : "Too many players connected for this game."
          : selectedGame.id === "trail-dash"
            ? "Add bots or invite another player to start Trail Dash."
            : connectedPlayers.length < selectedGame.minPlayers
              ? `Need ${selectedGame.minPlayers - connectedPlayers.length} more player${
                  selectedGame.minPlayers - connectedPlayers.length === 1 ? "" : "s"
                } to start.`
              : undefined
      : undefined;

  const trailDashMaxBots = Math.max(0, 8 - connectedPlayers.length);

  const gameScores = roomState?.gameScores ?? {};
  const hostControls = roomState?.hostView?.hostControls ?? {
    canPause: true,
    canExtendTime: false,
    canSkip: false,
    canReturnToLobby: true,
  };

  useWakeLock(playing);
  useHostStageFocus(roomState?.hostView);

  return (
    <div className="pg-page min-h-dvh bg-[#0f1117]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-6 py-4 min-w-0">
        <h1 className="text-xl font-bold">Party Games · Host</h1>
        <div className="flex items-center gap-6 shrink-0">
          {roomState && (
            <span className="font-mono text-lg font-bold tracking-[0.25em] text-violet-300">{roomId}</span>
          )}
          <span
            className={`text-sm ${
              connected ? "text-green-400" : playing ? "text-amber-400" : "text-red-400"
            }`}
          >
            {connected ? "Connected" : playing ? "Reconnecting…" : "Connecting…"}
          </span>
        </div>
      </header>

      {!connected && !playing && (
        <div className="bg-amber-900/40 px-6 py-3 text-center text-sm text-amber-200 space-y-2">
          <p>Connecting to the game server — share the room code once the header shows Connected.</p>
          <button
            type="button"
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-semibold hover:bg-zinc-600"
            onClick={() => window.location.reload()}
          >
            Retry connection
          </button>
        </div>
      )}

      {!connected && playing && (
        <ConnectionBanner message="Connection lost — reconnecting. Game state is preserved." />
      )}

      {error && <ConnectionBanner message={error} />}

      {!playing && roomState && (
        <div className="mx-auto grid max-w-7xl gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="space-y-6 min-w-0">
            <RoomCodeDisplay roomId={roomId} />
            <Scoreboard players={roomState.players} scores={roomState.sessionScores} />
            <PlayerList players={roomState.players} />
            <p className="text-center text-zinc-500">{connectedPlayers.length} players connected</p>
          </div>

          <div className="space-y-4 min-w-0">
            <h2 className="text-2xl font-bold">Pick a game</h2>
            <GamePicker
              games={roomState.games}
              selectedId={selectedGameId}
              playerCount={connectedPlayers.length}
              gameOptionsByGame={roomState.gameOptionsByGame}
              onSelect={handleSelectGame}
              detailPanel={
                selectedGame && selectedOptions ? (
                  <GameDetailIsland
                    game={selectedGame}
                    options={selectedOptions}
                    playerCount={connectedPlayers.length}
                    onChange={(options) => {
                      if (selectedGameId) setGameOptions(selectedGameId, options);
                    }}
                    canStart={Boolean(canStart)}
                    onStart={startGame}
                    warning={overMaxWarning ?? trailDashWarning}
                    startHint={startHint}
                    trailDashMaxBots={trailDashMaxBots}
                  />
                ) : undefined
              }
            />
            <SessionPlaylistPanel
              games={roomState.games}
              playlist={roomState.sessionPlaylist ?? []}
              onChange={setSessionPlaylist}
              onStartSession={startSession}
              onClear={clearSessionPlaylist}
            />
          </div>
        </div>
      )}

      {playing && roomState?.hostView && (
        <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
          <PauseOverlay paused={roomState.paused} phase={roomState.hostView.phase} variant="host" />
          <div className="mx-auto w-full max-w-6xl shrink-0 space-y-3 px-4 pt-4 min-w-0">
            <LiveScoreBar room={roomState} gameScores={gameScores} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <GameViewErrorBoundary key={`${roomState.activeGameId}-${connectionEpoch}`}>
              <HostGameView room={roomState} hostView={roomState.hostView} />
            </GameViewErrorBoundary>
          </div>
          <HostControlBar
            paused={roomState.paused}
            phase={roomState.hostView.phase}
            controls={hostControls}
            gameId={roomState.activeGameId}
            hostPacing={roomState.activeGameOptions?.hostPacing === true}
            sessionActive={roomState.sessionActive}
            hasNextSessionGame={
              roomState.sessionActive &&
              (roomState.sessionPlaylistIndex ?? 0) < (roomState.sessionPlaylist?.length ?? 0) - 1
            }
            onPause={pauseGame}
            onResume={resumeGame}
            onSkip={() => hostAction({ kind: "advance" })}
            onExtend={() => extendTimer(30000)}
            onPlayAgain={playAgain}
            onNextSessionGame={nextSessionGame}
            onEnd={handleEndGame}
          />
        </div>
      )}
    </div>
  );
}
