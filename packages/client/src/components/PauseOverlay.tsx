const REVIEW_PHASES = new Set(["instructions", "round_end"]);

export function PauseOverlay({
  paused,
  phase,
  variant = "host",
}: {
  paused: boolean;
  phase: string;
  variant?: "host" | "player";
}) {
  if (!paused) return null;

  const reviewMode = REVIEW_PHASES.has(phase);

  if (reviewMode) {
    return (
      <div
        className="sticky top-0 z-40 border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-sm font-semibold text-amber-100"
        role="status"
      >
        Paused — review items below, then resume when ready
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div className="fixed inset-0 z-40 bg-black/30 pointer-events-auto">
        <p className="fixed right-4 top-4 rounded-xl bg-zinc-900/95 px-4 py-2 text-sm font-bold shadow-lg">
          Paused
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/30 pointer-events-none">
      <p className="fixed right-4 top-4 rounded-xl bg-zinc-900/95 px-4 py-2 text-lg font-bold shadow-lg">
        Paused
      </p>
    </div>
  );
}
