import type { GameId, GameOptions } from "@party-games/shared";
import { resolveTrailDashOptions } from "@party-games/shared";

interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  category: string;
  supportsTrailDashOptions?: boolean;
}

function effectivePlayerCount(
  game: GameInfo,
  humanCount: number,
  gameOptionsByGame?: Partial<Record<GameId, GameOptions>>,
): number {
  if (game.id === "curve-fever") {
    const opts = resolveTrailDashOptions(gameOptionsByGame?.["curve-fever"] ?? { contentRating: "family", difficulty: "mixed" });
    return humanCount + opts.botCount;
  }
  return humanCount;
}

export function GamePicker({
  games,
  selectedId,
  playerCount,
  gameOptionsByGame,
  onSelect,
}: {
  games: GameInfo[];
  selectedId: GameId | null;
  playerCount: number;
  gameOptionsByGame?: Partial<Record<GameId, GameOptions>>;
  onSelect: (id: GameId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => {
        const total = effectivePlayerCount(game, playerCount, gameOptionsByGame);
        const overMax = total > game.maxPlayers;
        const readyToStart =
          game.id === "curve-fever"
            ? total >= 2 && total <= 8
            : total >= game.minPlayers && total <= game.maxPlayers;
        const selected = selectedId === game.id;
        return (
          <button
            key={game.id}
            type="button"
            disabled={overMax}
            onClick={() => onSelect(game.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              selected
                ? "border-violet-400 bg-violet-500/20"
                : overMax
                  ? "border-zinc-800 bg-zinc-900/40 opacity-50"
                  : readyToStart
                    ? "border-zinc-700 bg-zinc-800/60 hover:border-zinc-500"
                    : "border-amber-700/50 bg-zinc-800/40 hover:border-amber-600/60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg">{game.name}</h3>
              <span className="text-xs text-zinc-400">{game.category}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-400">{game.description}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {game.id === "curve-fever" ? "1–8 players (+ bots)" : `${game.minPlayers}–${game.maxPlayers} players`}
            </p>
            {!readyToStart && !overMax && (
              <p className="mt-1 text-xs text-amber-400">
                {game.id === "curve-fever" ? "Add bots or invite players" : `Need ${game.minPlayers - total} more`}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { effectivePlayerCount };
