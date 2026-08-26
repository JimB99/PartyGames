export function HostControlBar({
  paused,
  phase,
  onPause,
  onResume,
  onSkip,
  onExtend,
  onEnd,
}: {
  paused: boolean;
  phase: string;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onExtend: () => void;
  onEnd: () => void;
}) {
  const canSkip = ["instructions", "round_end", "reveal", "scoreboard"].includes(phase);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-wrap justify-end gap-2 max-w-xl">
      {paused ? (
        <button type="button" onClick={onResume} className="rounded-xl bg-green-600 px-5 py-3 font-bold">
          Resume
        </button>
      ) : (
        <button type="button" onClick={onPause} className="rounded-xl bg-amber-600 px-5 py-3 font-bold">
          Pause
        </button>
      )}
      {!paused && canSkip && (
        <button type="button" onClick={onSkip} className="rounded-xl bg-violet-600 px-5 py-3 font-bold">
          {phase === "instructions" ? "Start round" : "Skip"}
        </button>
      )}
      {!paused && (
        <button type="button" onClick={onExtend} className="rounded-xl bg-zinc-600 px-5 py-3 font-bold">
          +30s
        </button>
      )}
      <button
        type="button"
        onClick={onEnd}
        className="rounded-xl bg-zinc-700 px-5 py-3 font-bold"
      >
        End game
      </button>
    </div>
  );
}
