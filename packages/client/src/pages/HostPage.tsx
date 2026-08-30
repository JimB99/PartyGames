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

import { generateRoomCode, usePartyRoom } from "../hooks/usePartyRoom";
import { SessionPlaylistPanel } from "../components/SessionPlaylistPanel";

import { useParams } from "react-router-dom";

import type { GameId } from "@party-games/shared";

import { resolveTrailDashOptions } from "@party-games/shared";



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

    roomState?.selectedGameId === "trail-dash" &&

    connectedPlayers.length > 0 &&

    connectedPlayers.length + (trailDashOpts?.botCount ?? 0) < 2;



  const canStart =

    roomState?.selectedGameId &&

    connectedPlayers.length > 0 &&

    (roomState.selectedGameId === "trail-dash"

      ? effectivePlayerCount(

          roomState.games.find((g) => g.id === "trail-dash")!,

          connectedPlayers.length,

          roomState.gameOptionsByGame,

        ) >= 2

      : connectedPlayers.length >= (selectedGame?.minPlayers ?? 1));



  const handleSelectGame = (gameId: GameId) => {

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

    if (roomState.paused || roomState.hostView.phase === "ended" || confirm("End this game and return to lobby?")) {

      returnToLobby();

    }

  };



  const settingsPanels =

    selectedGame && selectedOptions ? (

      <GameSettingsPanels

        game={selectedGame}

        options={selectedOptions}

        onChange={(options) => {

          if (roomState?.selectedGameId) {

            setGameOptions(roomState.selectedGameId, options);

          }

        }}

      />

    ) : null;



  const optionsSlot = (gameId: GameId) => {

    if (!roomState || gameId !== roomState.selectedGameId || !selectedGame || !selectedOptions) {

      return null;

    }

    return settingsPanels;

  };



  const gameScores = roomState?.gameScores ?? {};



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



      {!connected && playing && (

        <p className="bg-amber-900/50 px-6 py-2 text-center text-sm text-amber-200">

          Connection lost — reconnecting. Game state is preserved.

        </p>

      )}



      {error && <p className="bg-red-900/40 px-6 py-2 text-red-300">{error}</p>}



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

              selectedId={roomState.selectedGameId}

              playerCount={connectedPlayers.length}

              gameOptionsByGame={roomState.gameOptionsByGame}

              onSelect={handleSelectGame}

              optionsSlot={optionsSlot}

            />

            {needsMoreForTrailDash && (

              <p className="rounded-xl border border-amber-600/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">

                Add at least 1 bot below or invite another player to start Trail Dash.

              </p>

            )}

            <SessionPlaylistPanel
              games={roomState.games}
              playlist={roomState.sessionPlaylist ?? []}
              onChange={setSessionPlaylist}
              onStartSession={startSession}
              onClear={clearSessionPlaylist}
            />

            <button
              type="button"
              data-testid="start-game"
              disabled={!canStart}
              onClick={startGame}

              className="w-full rounded-2xl bg-violet-600 py-5 text-xl font-bold hover:bg-violet-500 disabled:opacity-40"

            >

              Start game

            </button>

          </div>

          {settingsPanels && (

            <div className="hidden xl:block space-y-4 sticky top-6 self-start min-w-0">

              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Game settings</h3>

              {settingsPanels}

            </div>

          )}

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


