import {
  DEFAULT_GAME_OPTIONS,
  type DifficultySetting,
  type GameId,
  type GameMeta,
  type GameOptions,
} from "@party-games/shared";

export function GameOptionsPanel({
  game,
  options,
  onChange,
}: {
  game: GameMeta;
  options: GameOptions;
  onChange: (options: GameOptions) => void;
}) {
  if (!game.supportsDifficulty && !game.supportsMatureContent) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Game options</h3>

      {game.supportsMatureContent && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">Content</span>
          <div className="flex rounded-xl bg-zinc-900 p-1">
            <RatingButton
              label="Family"
              active={options.contentRating === "family"}
              onClick={() => onChange({ ...options, contentRating: "family" })}
            />
            <RatingButton
              label="18+"
              active={options.contentRating === "mature"}
              onClick={() => onChange({ ...options, contentRating: "mature" })}
            />
          </div>
        </div>
      )}

      {game.supportsDifficulty && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">Difficulty</span>
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
            value={options.difficulty}
            onChange={(e) =>
              onChange({ ...options, difficulty: e.target.value as DifficultySetting })
            }
          >
            <option value="mixed">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}
    </div>
  );
}

function RatingButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function resolveGameOptions(
  gameId: GameId,
  gameOptionsByGame: Partial<Record<GameId, GameOptions>>,
): GameOptions {
  return gameOptionsByGame[gameId] ?? DEFAULT_GAME_OPTIONS;
}
