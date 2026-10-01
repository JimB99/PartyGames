import type { BlockStackInput, BlockStackPlayer, GameAction, PieceKind } from "@party-games/shared";
import { BlockStackBoard, NextPiecePreview } from "../BlockStackBoard";
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
  const next = playerData.next as PieceKind | undefined;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-2 self-stretch">
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
        <div className="flex shrink-0 flex-col items-center justify-center gap-3">
          {next && <NextPiecePreview kind={next} />}
          <button
            type="button"
            data-testid="block-stack-hold"
            className="rounded-lg bg-zinc-800/90 px-3 py-4 text-xs font-bold text-white"
            onClick={() => handleInput("hold")}
          >
            Hold
          </button>
        </div>
      </div>
      <p className="shrink-0 text-center text-sm text-zinc-400">
        Score: {String(playerData.score ?? 0)} · Swipe to move/drop · Tap to rotate
      </p>
    </div>
  );
}
