import type { GameMeta, GameOptions } from "@party-games/shared";
import type { ReactNode } from "react";
import { GameSettingsPanels } from "./GameSettingsPanels";
import { ScoringPreviewPanel } from "./ScoringPreviewPanel";
import { StartGameButton } from "./SelectedGamePanel";

export function GameDetailIsland({
  game,
  options,
  playerCount,
  onChange,
  canStart,
  onStart,
  warning,
  startHint,
  trailDashMaxBots,
}: {
  game: GameMeta | undefined;
  options: GameOptions | null;
  playerCount: number;
  onChange: (options: GameOptions) => void;
  canStart: boolean;
  onStart: () => void;
  warning?: ReactNode;
  startHint?: string;
  trailDashMaxBots?: number;
}) {
  if (!game || !options) {
    return (
      <div
        className="rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4"
        data-testid="game-detail-island"
      >
        <p className="text-center text-sm text-zinc-500 py-8">Pick a game to configure and start.</p>
      </div>
    );
  }

  return (
    <div
      className="min-w-0 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 space-y-4"
      data-testid="game-detail-island"
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Selected game</h3>
        <p className="mt-1 text-xl font-bold">{game.name}</p>
        <p className="mt-1 text-sm text-zinc-500">{game.description}</p>
      </div>

      <ScoringPreviewPanel game={game} options={options} playerCount={playerCount} />

      <GameSettingsPanels
        game={game}
        options={options}
        onChange={onChange}
        trailDashMaxBots={trailDashMaxBots}
      />

      {warning}
      <StartGameButton canStart={canStart} onStart={onStart} hint={startHint} />
    </div>
  );
}
