import type { GameId } from "@party-games/shared";

interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  category: string;
}

export function GamePicker({
  games,
  selectedId,
  playerCount,
  onSelect,
}: {
  games: GameInfo[];
  selectedId: GameId | null;
  playerCount: number;
  onSelect: (id: GameId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => {
        const canPlay = playerCount >= game.minPlayers && playerCount <= game.maxPlayers;
        const selected = selectedId === game.id;
        return (
          <button
            key={game.id}
            type="button"
            disabled={!canPlay}
            onClick={() => onSelect(game.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-violet-400 bg-violet-500/20"
                : canPlay
                  ? "border-zinc-700 bg-zinc-800/60 hover:border-zinc-500"
                  : "border-zinc-800 bg-zinc-900/40 opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg">{game.name}</h3>
              <span className="text-xs text-zinc-400">{game.category}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{game.description}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {game.minPlayers}–{game.maxPlayers} players
            </p>
          </button>
        );
      })}
    </div>
  );
}
