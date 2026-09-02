import { GamePicker, effectivePlayerCount } from "../components/GamePicker";
import { resolveGameOptions } from "../components/GameOptionsPanel";
import { GameSettingsPanels } from "../components/GameSettingsPanels";
import { HostControlBar } from "../components/HostControlBar";
import { HostGameView } from "../components/GameViews";
import { GameViewErrorBoundary } from "../components/GameViewErrorBoundary";
import { LiveScoreBar } from "../components/LiveScoreBar";
import { PauseOverlay } from "../components/PauseOverlay";
import { PlayerList } from "../components/PlayerList";
import { RoomCodeDisplay } from "../components/RoomCodeDisplay";
import { Scoreboard } from "../components/Scoreboard";
import { SelectedGamePanel, StartGameButton } from "../components/SelectedGamePanel";
import { generateRoomCode, usePartyRoom } from "../hooks/usePartyRoom";
import { SessionPlaylistPanel } from "../components/SessionPlaylistPanel";
import { useParams } from "react-router-dom";
import { useState } from "react";
import type { GameId } from "@party-games/shared";
import { resolveTrailDashOptions } from "@party-games/shared";
import { ConnectionBanner } from "../components/game/GameShell";

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

  const canStart = Boolean(
    selectedGameId &&
      connectedPlayers.length > 0 &&
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
    if (confirm("Return to lobby?")) {
      returnToLobby();
    }
  };

  const settingsPanels =
    selectedGame && selectedOptions ? (
      <GameSettingsPanels
        game={selectedGame}
        options={selectedOptions}
        onChange={(options) => {
          if (selectedGameId) {
            setGameOptions(selectedGameId, options);
          }
        }}
      />
    ) : null;

  const trailDashWarning = needsMoreForTrailDash ? (
    <p className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
      Add at least 1 bot below or invite another player to start Trail Dash.
    </p>
  ) : null;

  const optionsSlot = (gameId: GameId) => {
    if (!roomState || gameId !== selectedGameId || !selectedGame || !selectedOptions) {
      return null;
    }
    return (
      <>
        {settingsPanels}
        {trailDashWarning}
      </>
    );
  };

  const startHint =
    !canStart && selectedGame
      ? connectedPlayers.length === 0
        ? "Waiting for at least 1 player to join."
        : selectedGame.id === "trail-dash"
          ? "Add bots or invite another player to start Trail Dash."
          : connectedPlayers.length < selectedGame.minPlayers
            ? `Need ${selectedGame.minPlayers - connectedPlayers.length} more player${
                selectedGame.minPlayers - connectedPlayers.length === 1 ? "" : "s"
              } to start.`
            : undefined
      : undefined;

  const actionSlot = (gameId: GameId) => {
    if (gameId !== selectedGameId) return null;
    return <StartGameButton canStart={Boolean(canStart)} onStart={startGame} hint={startHint} />;
  };

  const gameScores = roomState?.gameScores ?? {};
  const hostControls = roomState?.hostView?.hostControls ?? {
    canPause: true,
    canExtendTime: false,
    canSkip: false,
    canReturnToLobby: true,
  };

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
        <div className="mx-auto grid max-w-7xl gap-8 p-6 lg:grid-cols-[1fr_2fr] xl:grid-cols-[1fr_2fr_minmax(280px,1fr)]">
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
              optionsSlot={optionsSlot}
              actionSlot={actionSlot}
            />
            <SessionPlaylistPanel
              games={roomState.games}
              playlist={roomState.sessionPlaylist ?? []}
              onChange={setSessionPlaylist}
              onStartSession={startSession}
              onClear={clearSessionPlaylist}
            />
          </div>

          <div className="hidden xl:block">
            <SelectedGamePanel
              game={selectedGame}
              canStart={Boolean(canStart)}
              onStart={startGame}
              settings={settingsPanels}
              warning={trailDashWarning}
              startHint={startHint}
            />
          </div>
        </div>
      )}

      {playing && roomState?.hostView && (
        <>
          <PauseOverlay paused={roomState.paused} phase={roomState.hostView.phase} variant="host" />
          <div className="mx-auto max-w-6xl space-y-3 px-4 pt-4 min-w-0">
            <LiveScoreBar room={roomState} gameScores={gameScores} />
          </div>
          <GameViewErrorBoundary key={`${roomState.activeGameId}-${connectionEpoch}`}>
            <HostGameView room={roomState} hostView={roomState.hostView} />
          </GameViewErrorBoundary>
          <HostControlBar
            paused={roomState.paused}
            phase={roomState.hostView.phase}
            controls={hostControls}
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
        </>
      )}
    </div>
  );
}
