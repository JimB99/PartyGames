import type { GameCategory, GameId, GameMeta, GameOptions } from "@party-games/shared";
import { GAME_CATEGORIES, resolveTrailDashOptions } from "@party-games/shared";
import { useEffect, useMemo, useState } from "react";
import { GameCategorySection } from "./GameCategorySection";

const STORAGE_KEY = "party-games-category-open";

function loadOpenState(): Record<string, boolean> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    /* ignore */
  }
  return {};
}

function saveOpenState(state: Record<string, boolean>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function effectivePlayerCount(
  game: GameMeta,
  humanCount: number,
  gameOptionsByGame?: Partial<Record<GameId, GameOptions>>,
): number {
  if (game.id === "curve-fever") {
    const opts = resolveTrailDashOptions(
      gameOptionsByGame?.["curve-fever"] ?? { contentRating: "family", difficulty: "mixed" },
    );
    return humanCount + opts.botCount;
  }
  return humanCount;
}

function GameCard({
  game,
  selected,
  playerCount,
  gameOptionsByGame,
  onSelect,
}: {
  game: GameMeta;
  selected: boolean;
  playerCount: number;
  gameOptionsByGame?: Partial<Record<GameId, GameOptions>>;
  onSelect: (id: GameId) => void;
}) {
  const total = effectivePlayerCount(game, playerCount, gameOptionsByGame);
  const overMax = total > game.maxPlayers;
  const readyToStart =
    game.id === "curve-fever"
      ? total >= 2 && total <= 8
      : total >= game.minPlayers && total <= game.maxPlayers;

  return (
    <button
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
      <h3 className="font-bold text-lg">{game.name}</h3>
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
}

export function GamePicker({
  games,
  selectedId,
  playerCount,
  gameOptionsByGame,
  onSelect,
}: {
  games: GameMeta[];
  selectedId: GameId | null;
  playerCount: number;
  gameOptionsByGame?: Partial<Record<GameId, GameOptions>>;
  onSelect: (id: GameId) => void;
}) {
  const gamesByCategory = useMemo(() => {
    const map = new Map<GameCategory, GameMeta[]>();
    for (const cat of GAME_CATEGORIES) map.set(cat.id, []);
    for (const game of games) {
      const list = map.get(game.category) ?? [];
      list.push(game);
      map.set(game.category, list);
    }
    return map;
  }, [games]);

  const [openState, setOpenState] = useState<Record<string, boolean>>(() => {
    const saved = loadOpenState();
    const initial: Record<string, boolean> = {};
    let opened = 0;
    for (const cat of GAME_CATEGORIES) {
      const hasSelected = selectedId
        ? gamesByCategory.get(cat.id)?.some((g) => g.id === selectedId)
        : false;
      if (saved[cat.id] !== undefined) {
        initial[cat.id] = saved[cat.id];
      } else if (hasSelected) {
        initial[cat.id] = true;
      } else if (opened < 2 && (gamesByCategory.get(cat.id)?.length ?? 0) > 0) {
        initial[cat.id] = true;
        opened++;
      } else {
        initial[cat.id] = false;
      }
    }
    return initial;
  });

  useEffect(() => {
    if (!selectedId) return;
    const game = games.find((g) => g.id === selectedId);
    if (!game) return;
    setOpenState((prev) => {
      if (prev[game.category]) return prev;
      const next = { ...prev, [game.category]: true };
      saveOpenState(next);
      return next;
    });
  }, [selectedId, games]);

  const toggle = (catId: GameCategory) => {
    setOpenState((prev) => {
      const next = { ...prev, [catId]: !prev[catId] };
      saveOpenState(next);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {GAME_CATEGORIES.map((cat) => {
        const catGames = gamesByCategory.get(cat.id) ?? [];
        if (catGames.length === 0) return null;
        return (
          <GameCategorySection
            key={cat.id}
            category={cat}
            gameCount={catGames.length}
            open={openState[cat.id] ?? false}
            onToggle={() => toggle(cat.id)}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {catGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  selected={selectedId === game.id}
                  playerCount={playerCount}
                  gameOptionsByGame={gameOptionsByGame}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </GameCategorySection>
        );
      })}
    </div>
  );
}

export { effectivePlayerCount };
