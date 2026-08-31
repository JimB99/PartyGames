import { useEffect, useRef, useState } from "react";

export function TimerBar({
  endsAt,
  totalMs,
  size = "default",
}: {
  endsAt: number | null;
  totalMs?: number | null;
  size?: "default" | "host";
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

  const isHost = size === "host";

  return (
    <div className={`w-full min-w-0 ${isHost ? "" : "max-w-md"}`}>
      <div
        className={`mb-1 flex justify-between text-zinc-400 ${isHost ? "text-base" : "text-xs"}`}
      >
        <span>Time</span>
        <span className={isHost ? "font-mono font-semibold text-zinc-200" : ""}>{seconds}s</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-zinc-700 ${isHost ? "h-4" : "h-2"}`}>
        <div
          className={`rounded-full bg-violet-500 ${isHost ? "h-4" : "h-2"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
