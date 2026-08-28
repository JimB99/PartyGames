import { useEffect, useRef, useState } from "react";

export function TimerBar({
  endsAt,
  totalMs,
}: {
  endsAt: number | null;
  totalMs?: number | null;
}) {
  const [remaining, setRemaining] = useState(0);
  const fallbackTotalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      fallbackTotalRef.current = null;
      return;
    }

    const rem = Math.max(0, endsAt - Date.now());
    if (fallbackTotalRef.current === null || rem > fallbackTotalRef.current + 500) {
      fallbackTotalRef.current = Math.max(rem, 1);
    }

    let frame = 0;
    const tick = () => {
      setRemaining(Math.max(0, endsAt - Date.now()));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [endsAt]);

  if (!endsAt) return null;

  const total =
    totalMs && totalMs > 0 ? totalMs : (fallbackTotalRef.current ?? remaining) || 1;
  const pct = Math.min(100, Math.max(0, (remaining / total) * 100));
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div className="w-full min-w-0 max-w-md">
      <div className="mb-1 flex justify-between text-xs text-zinc-400">
        <span>Time</span>
        <span>{seconds}s</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
        <div
          className="h-2 rounded-full bg-violet-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
