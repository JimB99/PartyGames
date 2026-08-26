import { GamePicker } from "../components/GamePicker";
import { GameOptionsPanel, resolveGameOptions } from "../components/GameOptionsPanel";
import { HostGameView } from "../components/GameViews";
import { PlayerList } from "../components/PlayerList";
import { RoomCodeDisplay } from "../components/RoomCodeDisplay";
import { Scoreboard } from "../components/Scoreboard";
import { generateRoomCode, usePartyRoom } from "../hooks/usePartyRoom";
import { useParams } from "react-router-dom";

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

  return (
    <div className="min-h-dvh bg-[#0f1117]">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold">Party Games · Host</h1>
        <span className={`text-sm ${connected ? "text-green-400" : "text-red-400"}`}>
          {connected ? "Connected" : "Connecting…"}
        </span>
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
              onSelect={selectGame}
            />
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
            <button
              type="button"
              disabled={!roomState.selectedGameId || connectedPlayers.length === 0}
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
          <HostGameView room={roomState} hostView={roomState.hostView} />
          <div className="fixed bottom-4 right-4 flex gap-2">
            {roomState.hostView.phase === "instructions" && (
              <button
                type="button"
                onClick={() => hostAction({ kind: "advance" })}
                className="rounded-xl bg-violet-600 px-6 py-3 font-bold"
              >
                Start round
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (roomState.hostView.phase === "ended" || confirm("End this game and pick another?")) {
                  returnToLobby();
                }
              }}
              className="rounded-xl bg-zinc-700 px-6 py-3 font-bold"
            >
              Back to lobby
            </button>
          </div>
        </>
      )}
    </div>
  );
}
