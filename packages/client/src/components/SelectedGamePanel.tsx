import type { GameMeta } from "@party-games/shared";
import type { ReactNode } from "react";

export function StartGameButton({
  canStart,
  onStart,
  className = "",
}: {
  canStart: boolean;
  onStart: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid="start-game"
      disabled={!canStart}
      onClick={onStart}
      className={`w-full rounded-2xl bg-violet-600 py-4 text-lg font-bold hover:bg-violet-500 disabled:opacity-40 ${className}`}
    >
      Start game
    </button>
  );
}

export function SelectedGamePanel({
  game,
  canStart,
  onStart,
  settings,
  warning,
}: {
  game: GameMeta | undefined;
  canStart: boolean;
  onStart: () => void;
  settings: ReactNode;
  warning?: ReactNode;
}) {
  return (
    <div className="sticky top-4 self-start min-w-0 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 space-y-4">
      {game ? (
        <>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Selected game</h3>
            <p className="mt-1 text-xl font-bold">{game.name}</p>
            <p className="mt-1 text-sm text-zinc-500">{game.description}</p>
          </div>
          {settings}
          {warning}
          <StartGameButton canStart={canStart} onStart={onStart} />
        </>
      ) : (
        <p className="text-center text-sm text-zinc-500 py-8">Pick a game from the list to configure and start.</p>
      )}
    </div>
  );
}
