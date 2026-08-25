import { useEffect, useState } from "react";

export function TimerBar({ endsAt }: { endsAt: number | null }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) {
      setRemaining(0);
      return;
    }
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt) return null;

  const seconds = Math.ceil(remaining / 1000);
  const pct = Math.min(100, (remaining / 30000) * 100);

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs text-zinc-400">
        <span>Time</span>
        <span>{seconds}s</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-700">
        <div
          className="h-2 rounded-full bg-violet-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
