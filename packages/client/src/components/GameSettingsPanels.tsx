import type { GameMeta, GameOptions } from "@party-games/shared";
import { GameOptionsPanel } from "./GameOptionsPanel";
import { TrailDashOptionsPanel } from "./TrailDashOptionsPanel";

export function GameSettingsPanels({
  game,
  options,
  onChange,
  trailDashMaxBots,
}: {
  game: GameMeta;
  options: GameOptions;
  onChange: (options: GameOptions) => void;
  trailDashMaxBots?: number;
}) {
  return (
    <div className="space-y-4">
      <GameOptionsPanel game={game} options={options} onChange={onChange} />
      {game.supportsTrailDashOptions && (
        <TrailDashOptionsPanel
          options={options}
          onChange={onChange}
          maxBots={trailDashMaxBots}
        />
      )}
    </div>
  );
}
