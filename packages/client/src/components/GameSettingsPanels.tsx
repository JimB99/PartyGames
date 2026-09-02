import type { GameMeta, GameOptions } from "@party-games/shared";
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
  const hasStandardOptions =
    game.supportsDifficulty ||
    game.supportsMatureContent ||
    game.supportsQuestionDisplay ||
    game.supportsTimelinePtsPerYear ||
    game.supportsSpeedScoring ||
    game.supportsPaddleMode ||
    game.supportsCharadesMode;

  if (!hasStandardOptions && !game.supportsTrailDashOptions) {
    return null;
  }

  return (
    <div className="space-y-4">
      <GameOptionsPanel game={game} options={options} onChange={onChange} />
      {game.supportsTrailDashOptions && (
        <TrailDashOptionsPanel options={options} onChange={onChange} />
      )}
    </div>
  );
}
