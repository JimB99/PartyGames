import { useEffect } from "react";
import type { HostControls } from "@party-games/shared";

export function HostControlBar({
  paused,
  phase,
  controls,
  sessionActive = false,
  hasNextSessionGame = false,
  onPause,
  onResume,
  onSkip,
  onExtend,
  onPlayAgain,
  onNextSessionGame,
  onEnd,
}: {
  paused: boolean;
  phase: string;
  controls: HostControls;
  sessionActive?: boolean;
  hasNextSessionGame?: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onExtend: () => void;
  onPlayAgain?: () => void;
  onNextSessionGame?: () => void;
  onEnd: () => void;
}) {
  const canPlayAgain = phase === "ended" && onPlayAgain && !sessionActive;
  const canNextSession = phase === "ended" && sessionActive && hasNextSessionGame && onNextSessionGame;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      if (!controls.canPause) return;
      if (paused) onResume();
      else onPause();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paused, onPause, onResume, controls.canPause]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-wrap justify-end gap-2 sm:left-auto sm:right-4 sm:max-w-xl">
      {canNextSession && (
        <button type="button" data-testid="next-session-game" onClick={onNextSessionGame} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold">
          Next game
        </button>
      )}
      {canPlayAgain && (
        <button type="button" data-testid="host-play-again" onClick={onPlayAgain} className="rounded-xl bg-violet-600 px-5 py-3 font-bold">
          Play again
        </button>
      )}
      {controls.canPause && (
        paused ? (
          <button type="button" data-testid="host-resume" onClick={onResume} className="rounded-xl bg-green-600 px-5 py-3 font-bold">
            Resume
          </button>
        ) : (
          <button type="button" data-testid="host-pause" onClick={onPause} className="rounded-xl bg-amber-600 px-5 py-3 font-bold">
            Pause
          </button>
        )
      )}
      {!paused && controls.canSkip && (
        <button type="button" data-testid="host-skip" onClick={onSkip} className="rounded-xl bg-violet-600 px-5 py-3 font-bold">
          {phase === "instructions" ? "Start round" : "Skip"}
        </button>
      )}
      {!paused && controls.canExtendTime && (
        <button type="button" data-testid="host-extend" onClick={onExtend} className="rounded-xl bg-zinc-600 px-5 py-3 font-bold">
          +30s
        </button>
      )}
      {controls.canReturnToLobby && (
        <button
          type="button"
          data-testid="host-return-lobby"
          onClick={onEnd}
          className="rounded-xl bg-zinc-700 px-5 py-3 font-bold"
        >
          Back to lobby
        </button>
      )}
    </div>
  );
}
