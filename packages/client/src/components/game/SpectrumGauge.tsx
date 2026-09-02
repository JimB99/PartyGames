export function SpectrumGauge({
  left,
  right,
  target,
  guess,
  guesses,
  showTarget = false,
  interactive = false,
  value = 50,
  onChange,
}: {
  left: string;
  right: string;
  target?: number;
  guess?: number;
  guesses?: Record<string, number>;
  showTarget?: boolean;
  interactive?: boolean;
  value?: number;
  onChange?: (value: number) => void;
}) {
  const markers = guesses
    ? Object.entries(guesses).map(([id, val]) => ({ id, val }))
    : guess !== undefined
      ? [{ id: "you", val: guess }]
      : [];

  return (
    <div className="space-y-3" data-testid="spectrum-gauge">
      <div className="flex justify-between gap-4 text-sm font-semibold text-zinc-300 sm:text-base">
        <span className="max-w-[45%] text-left">{left}</span>
        <span className="max-w-[45%] text-right">{right}</span>
      </div>
      <div className="relative h-14 rounded-full bg-gradient-to-r from-violet-600 via-zinc-500 to-amber-500 shadow-inner">
        {showTarget && target !== undefined && (
          <div
            className="absolute inset-y-1 w-1.5 rounded-full bg-white shadow-lg"
            style={{ left: `${target}%`, transform: "translateX(-50%)" }}
            aria-label={`Target at ${target}`}
          />
        )}
        {markers.map((m, i) => (
          <div
            key={m.id}
            className="absolute top-1/2 h-7 w-7 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow-md"
            style={{
              left: `${m.val}%`,
              transform: `translate(-50%, -50%)`,
              marginLeft: i * 2,
            }}
            title={`${m.id}: ${m.val}`}
          />
        ))}
        {interactive && (
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            data-testid="spectrum-slider"
          />
        )}
        {interactive && (
          <div
            className="pointer-events-none absolute top-1/2 h-9 w-9 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-400 shadow-lg"
            style={{ left: `${value}%`, transform: "translate(-50%, -50%)" }}
          />
        )}
      </div>
      {interactive && <p className="text-center text-lg text-zinc-400">Slide toward the answer</p>}
    </div>
  );
}
