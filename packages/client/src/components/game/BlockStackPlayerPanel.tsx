import type { BlockStackInput, BlockStackPlayer, GameAction } from "@party-games/shared";
import { BlockStackBoard } from "../BlockStackBoard";
import { useBlockStackPlayerBoard } from "../../hooks/useBlockStackPlayerBoard";

export function BlockStackPlayerPanel({
  playerData,
  onAction,
}: {
  playerData: Record<string, unknown>;
  onAction: (action: GameAction) => void;
}) {
  const { board, handleInput } = useBlockStackPlayerBoard(
    playerData.predictionPlayer as BlockStackPlayer | undefined,
    playerData.board as number[][] | undefined,
    (input: BlockStackInput) => onAction({ kind: "block_stack_input", input }),
  );

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-0 flex-col gap-2">
      <div className="flex min-h-0 flex-1 items-stretch justify-center gap-2">
        <div className="relative min-h-0 min-w-0 flex-1">
          <BlockStackBoard
            board={board}
            alive={(playerData.alive as boolean) ?? true}
            interactive
            className="h-full"
            onInput={handleInput}
          />
        </div>
        <button
          type="button"
          data-testid="block-stack-hold"
          className="shrink-0 self-center rounded-lg bg-zinc-800/90 px-3 py-4 text-xs font-bold text-white"
          onClick={() => handleInput("hold")}
        >
          Hold
        </button>
      </div>
      <p className="shrink-0 text-center text-sm text-zinc-400">
        Score: {String(playerData.score ?? 0)} · Swipe to move/drop · Tap to rotate
      </p>
    </div>
  );
}
