import type { GameId, GameMeta, GameOptions } from "@party-games/shared";
import { GameOptionsPanel } from "./GameOptionsPanel";
import { TrailDashOptionsPanel } from "./TrailDashOptionsPanel";

export function GameSettingsPanels({
  game,
  options,
  onChange,
}: {
  game: GameMeta;
  options: GameOptions;
  onChange: (options: GameOptions) => void;
}) {
  return (
    <div className="space-y-4">
      <GameOptionsPanel game={game} options={options} onChange={onChange} />
      {game.supportsTrailDashOptions && (
        <TrailDashOptionsPanel options={options} onChange={onChange} />
      )}
    </div>
  );
}

export function renderGameSettings(
  gameId: GameId | null,
  games: GameMeta[],
  options: GameOptions | null,
  onChange: (gameId: GameId, options: GameOptions) => void,
) {
  if (!gameId || !options) return null;
  const game = games.find((g) => g.id === gameId);
  if (!game) return null;
  return (
    <GameSettingsPanels
      game={game}
      options={options}
      onChange={(next) => onChange(gameId, next)}
    />
  );
}
