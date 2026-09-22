import {
  applyBlockStackInput,
  cloneBlockStackPlayer,
  getMergedBoard,
  type BlockStackInput,
  type BlockStackPlayer,
} from "@party-games/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useBlockStackPlayerBoard(
  predictionPlayer: BlockStackPlayer | null | undefined,
  fallbackBoard: number[][] | undefined,
  onAction: (input: BlockStackInput) => void,
) {
  const [localPlayer, setLocalPlayer] = useState<BlockStackPlayer | null>(null);
  const serverBoardKey = useMemo(() => JSON.stringify(fallbackBoard ?? []), [fallbackBoard]);

  useEffect(() => {
    if (predictionPlayer) {
      setLocalPlayer(cloneBlockStackPlayer(predictionPlayer));
    } else {
      setLocalPlayer(null);
    }
  }, [serverBoardKey, predictionPlayer]);

  const board = localPlayer ? getMergedBoard(localPlayer) : (fallbackBoard ?? []);

  const handleInput = useCallback(
    (input: BlockStackInput) => {
      setLocalPlayer((prev) => {
        const base = prev ?? (predictionPlayer ? cloneBlockStackPlayer(predictionPlayer) : null);
        if (!base) return prev;
        const next = cloneBlockStackPlayer(base);
        applyBlockStackInput(next, input);
        return next;
      });
      onAction(input);
    },
    [onAction, predictionPlayer],
  );

  return { board, handleInput };
}
