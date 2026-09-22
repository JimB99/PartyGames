const REVIEW_PHASES = new Set(["instructions", "round_end"]);

export function PauseOverlay({
  paused,
  phase,
}: {
  paused: boolean;
  phase: string;
  variant?: "host" | "player";
}) {
  if (!paused) return null;

  const reviewMode = REVIEW_PHASES.has(phase);
  const message = reviewMode
    ? "Timer paused — review items below, then resume when ready"
    : "Timer paused — keep playing; resume when ready";

  return (
    <div
      className="sticky top-0 z-40 border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-sm font-semibold text-amber-100"
      role="status"
    >
      {message}
    </div>
  );
}
